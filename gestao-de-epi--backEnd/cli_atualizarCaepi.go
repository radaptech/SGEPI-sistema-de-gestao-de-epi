package main

import (
	"archive/zip"
	"bufio"
	"context"
	"fmt"
	"io"
	"log/slog"
	"os"
	"strings"
	"time"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/configs"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/database/repository"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jlaffaye/ftp"
)

// O MTE só publica a base de CAs (CAEPI) por FTP, num .zip com um .txt separado por "|".
const (
	servidorCaepi = "ftp.mtps.gov.br:21"
	arquivoCaepi  = "portal/fiscalizacao/seguranca-e-saude-no-trabalho/caepi/tgg_export_caepi.zip"
)

// ExecutarAtualizacaoCaepi substitui a tabela caepi pela base atual do MTE e renova a validade
// do CA dos EPIs que o MTE renovou. Com um argumento, lê esse .zip local em vez de baixar.
func ExecutarAtualizacaoCaepi(args []string) {
	ctx := context.Background()

	caminho := ""
	if len(args) > 0 {
		caminho = args[0]
	} else {
		tmp, err := baixarCaepi()
		if err != nil {
			fatal("caepi: baixar do FTP do MTE", err)
		}
		defer os.Remove(tmp)
		caminho = tmp
	}

	cas, err := lerZipCaepi(caminho)
	if err != nil {
		fatal("caepi: ler o arquivo", err)
	}

	conexao := configs.ConexaoDbPostgres{}
	db, err := (&configs.Init{Conexao: &conexao}).InitAplicattion()
	if err != nil {
		fatal("caepi: conectar no banco", err)
	}
	// sem db.Close(): a migração deixa uma conexão presa no pool (stdlib.OpenDBFromPool) e o
	// Close esperaria por ela para sempre. O processo termina logo depois de qualquer jeito.

	// o cron pode rodar antes da API subir a versão com a tabela caepi
	if err := conexao.RunMigrationPostgress(db); err != nil {
		fatal("caepi: aplicar migrações", err)
	}

	// numa transação só: quem consulta durante a carga continua vendo a base anterior
	tx, err := db.Begin(ctx)
	if err != nil {
		fatal("caepi: abrir transação", err)
	}
	defer tx.Rollback(ctx)
	qtx := repository.New(db).WithTx(tx)

	if err := qtx.LimparCaepi(ctx); err != nil {
		fatal("caepi: limpar a base anterior", err)
	}
	if _, err := qtx.InserirCaepi(ctx, cas); err != nil {
		fatal("caepi: inserir", err)
	}
	renovados, err := qtx.RenovarValidadeCaEpis(ctx)
	if err != nil {
		fatal("caepi: renovar validade dos EPIs", err)
	}
	if err := tx.Commit(ctx); err != nil {
		fatal("caepi: commit", err)
	}

	slog.Info("base CAEPI atualizada", "cas", len(cas), "epis_renovados", renovados)
}

// baixarCaepi salva o .zip num arquivo temporário (o archive/zip precisa de acesso aleatório).
func baixarCaepi() (string, error) {
	c, err := ftp.Dial(servidorCaepi, ftp.DialWithTimeout(30*time.Second))
	if err != nil {
		return "", err
	}
	defer c.Quit()
	if err := c.Login("anonymous", "anonymous"); err != nil {
		return "", err
	}

	r, err := c.Retr(arquivoCaepi)
	if err != nil {
		return "", err
	}
	defer r.Close()

	tmp, err := os.CreateTemp("", "caepi-*.zip")
	if err != nil {
		return "", err
	}
	defer tmp.Close()
	if _, err := io.Copy(tmp, r); err != nil {
		os.Remove(tmp.Name())
		return "", err
	}
	return tmp.Name(), nil
}

func lerZipCaepi(caminho string) ([]repository.InserirCaepiParams, error) {
	z, err := zip.OpenReader(caminho)
	if err != nil {
		return nil, err
	}
	defer z.Close()
	if len(z.File) == 0 {
		return nil, fmt.Errorf("zip vazio")
	}

	f, err := z.File[0].Open()
	if err != nil {
		return nil, err
	}
	defer f.Close()
	return lerCaepi(f)
}

// lerCaepi lê o .txt do MTE. Colunas usadas: 1 CA, 2 validade, 3 situação, 6 razão social e
// 8 equipamento. A descrição (coluna 9) às vezes tem "|" no texto, então só as 8 primeiras são
// confiáveis. O mesmo CA se repete uma vez por laudo; fica a linha de validade mais recente.
func lerCaepi(r io.Reader) ([]repository.InserirCaepiParams, error) {
	sc := bufio.NewScanner(r)
	sc.Buffer(make([]byte, 0, 64*1024), 1024*1024)

	var cas []repository.InserirCaepiParams
	indice := map[string]int{}

	for n := 1; sc.Scan(); n++ {
		if n == 1 {
			continue // cabeçalho
		}
		c := strings.Split(sc.Text(), "|")
		if len(c) < 8 {
			return nil, fmt.Errorf("linha %d: esperava ao menos 8 colunas, veio %d", n, len(c))
		}

		ca := strings.TrimLeft(strings.TrimSpace(c[0]), "0")
		validade, err := time.Parse("02/01/2006", strings.TrimSpace(c[1]))
		if ca == "" || err != nil {
			return nil, fmt.Errorf("linha %d: CA %q ou validade %q inválidos", n, c[0], c[1])
		}

		linha := repository.InserirCaepiParams{
			Ca:          ca,
			Validade:    pgtype.Date{Time: validade, Valid: true},
			Situacao:    strings.TrimSpace(c[2]),
			Fabricante:  strings.TrimSpace(c[5]),
			Equipamento: strings.TrimSpace(c[7]),
		}
		if i, ok := indice[ca]; ok {
			if validade.After(cas[i].Validade.Time) {
				cas[i] = linha
			}
			continue
		}
		indice[ca] = len(cas)
		cas = append(cas, linha)
	}
	return cas, sc.Err()
}
