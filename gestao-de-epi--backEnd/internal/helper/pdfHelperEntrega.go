package helper

import (
	"fmt"
	"image/png"
	"io"
	"net/http"
	"strconv"
	"strings"

	"bytes"
	i90 "image"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/configs"
	"github.com/disintegration/imaging"
	"github.com/johnfercher/maroto/v2/pkg/components/col"
	"github.com/johnfercher/maroto/v2/pkg/components/image"
	"github.com/johnfercher/maroto/v2/pkg/components/line"
	"github.com/johnfercher/maroto/v2/pkg/components/row"
	"github.com/johnfercher/maroto/v2/pkg/components/text"
	"github.com/johnfercher/maroto/v2/pkg/consts/align"
	"github.com/johnfercher/maroto/v2/pkg/consts/extension"
	"github.com/johnfercher/maroto/v2/pkg/consts/fontstyle"
	"github.com/johnfercher/maroto/v2/pkg/core"
	"github.com/johnfercher/maroto/v2/pkg/props"
)

type DadosPdf struct {
	FichaPdf
	Data        configs.DataBr
	EntreguePor string
	Epi         []DadosEpiPdf
}

// DadosEpiPdf: uma linha da ficha. O mesmo EPI tirado de dois lotes chega somado.
type DadosEpiPdf struct {
	NomeEpi    string
	Ca         string
	Descricao  string
	Quantidade int32
	Tamanho    string
}

type Auditoria struct {
	DadosServidor string
	Ip            string
}

// rotacionarSeEstiverEmPe gira a assinatura 90° só quando ela veio em pé.
//
// O canvas de assinatura acompanha o formato da tela: no celular em pé ele sai
// alto, e sem girar a firma chega deitada na ficha. No desktop ele já sai
// deitado — girar ali espremeria a assinatura numa tira de ~11mm de largura,
// porque o bloco da ficha tem só 20mm de altura.
func rotacionarSeEstiverEmPe(imgBytes []byte) ([]byte, error) {
	img, _, err := i90.Decode(bytes.NewReader(imgBytes))
	if err != nil {
		return nil, err
	}

	if limites := img.Bounds(); limites.Dy() <= limites.Dx() {
		return imgBytes, nil
	}

	var buf bytes.Buffer
	if err := png.Encode(&buf, imaging.Rotate90(img)); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

// prepararImagemAssinatura baixa a comprovação da entrega/devolução no bucket e
// devolve os bytes prontos para o PDF, junto do formato real do arquivo.
//
// A assinatura é desenhada deitada na tela do celular, então o PNG do canvas
// precisa girar 90°. A foto da câmera (.jpg) já vem na orientação certa —
// girar ela deixaria o funcionário de lado na ficha.
func prepararImagemAssinatura(url string) ([]byte, extension.Type, bool) {
	if url == "" || !strings.HasPrefix(url, "https") {
		return nil, "", false
	}

	res, err := http.Get(url)
	if err != nil {
		return nil, "", false
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, "", false
	}

	imagem, errResp := io.ReadAll(res.Body)
	if errResp != nil || len(imagem) == 0 {
		return nil, "", false
	}

	// Só a assinatura (.png, desenhada no canvas) pode girar. A foto já vem na
	// orientação em que foi tirada, e uma foto em pé girada deixa o funcionário
	// deitado na ficha.
	if !strings.HasSuffix(strings.ToLower(url), ".png") {
		return imagem, extension.Jpg, true
	}

	rotacionada, errRot := rotacionarSeEstiverEmPe(imagem)
	if errRot != nil {
		// Sem conseguir girar, é melhor a ficha sair com a assinatura deitada
		// do que sem assinatura nenhuma.
		return imagem, extension.Png, true
	}

	return rotacionada, extension.Png, true
}

// adicionarComprovacaoRecebimento desenha o bloco que fecha a ficha: a foto da
// câmera, a assinatura desenhada na tela, ou a linha em branco para assinar à
// mão quando não veio nenhuma das duas.
//
// A foto ganha um bloco maior de propósito. No espaço da assinatura (4 de 12
// colunas por 20mm) um retrato 4:3 encolhe para 27x20mm e não dá para
// reconhecer ninguém — inútil como comprovação de entrega.
func adicionarComprovacaoRecebimento(m core.Maroto, imagem []byte, formato extension.Type, temImagem bool, f FichaPdf) {
	legenda := "Assinatura do colaborador"

	// Respiro, imagem e as duas linhas de legenda somam 46mm, com foto ou com assinatura.
	// O maroto quebra a página linha a linha; sem espaço para o bloco inteiro, a
	// assinatura começaria numa página e o nome terminaria na outra. Linhas de 1mm
	// completam a página até a quebra, e o bloco começa inteiro na seguinte.
	for !m.FitlnCurrentPage(46) {
		m.AddRow(1)
	}

	switch {
	case !temImagem:
		m.AddRow(15, col.New(12)) // respiro antes da linha de assinar
		m.AddRow(20,
			col.New(4),
			col.New(4).Add(line.New(props.Line{Thickness: 0.5})),
			col.New(4),
		)

	case formato == extension.Png:
		m.AddRow(15, col.New(12))
		m.AddRow(20,
			col.New(4),
			image.NewFromBytesCol(4, imagem, formato, props.Rect{Center: true, Percent: 100}),
			col.New(4),
		)

	default:
		// A foto precisa de mais altura que a assinatura para ser reconhecível,
		// mas o respiro encolhe na mesma medida: 5+30 fecha os mesmos 35mm do
		// bloco da assinatura (15+20), e a ficha ocupa a mesma altura com
		// qualquer uma das duas.
		legenda = "Foto de confirmação do colaborador"
		m.AddRow(5, col.New(12))
		m.AddRow(30,
			col.New(3),
			image.NewFromBytesCol(6, imagem, formato, props.Rect{Center: true, Percent: 100}),
			col.New(3),
		)
	}

	m.AddRows(
		row.New(6).Add(
			text.NewCol(12, legenda, props.Text{Size: 9, Align: align.Center, Style: fontstyle.Bold}),
		),
		row.New(5).Add(
			text.NewCol(12, f.NomeFuncionario+" · Matrícula "+f.Matricula+" · CPF "+valorOuTraco(FormatarCPF(f.Cpf)), props.Text{Size: 9, Align: align.Center}),
		),
	)
}

// CreatePdf monta a ficha de entrega de EPI (registro de fornecimento exigido pela NR-6).
func CreatePdf(dados DadosPdf, auditoria Auditoria, responsavel string) (core.Document, error) {
	data := dados.Data.Time().Format("02/01/2006")
	m := novoDocumento("Ficha de entrega de EPI", dados.FichaPdf)
	if err := rodape(m, "Ficha de entrega", dados.FichaPdf, data, auditoria, responsavel); err != nil {
		return nil, err
	}

	cabecalho(m, "FICHA DE ENTREGA DE EPI", "Registro de fornecimento de Equipamento de Proteção Individual (NR-6)", dados.FichaPdf, false)
	blocosEmpresaColaborador(m, dados.FichaPdf)

	secao(m, "Entrega")
	linhaCampos(m,
		campoPdf{3, "Data da entrega", data},
		campoPdf{5, "Entregue por", dados.EntreguePor},
		campoPdf{4, "Unidade", dados.Unidade},
	)

	m.AddRow(3)
	linhas := make([][]string, 0, len(dados.Epi))
	total := 0
	for i, epi := range dados.Epi {
		linhas = append(linhas, []string{strconv.Itoa(i + 1), epi.NomeEpi, valorOuTraco(epi.Descricao), epi.Ca, epi.Tamanho, strconv.Itoa(int(epi.Quantidade))})
		total += int(epi.Quantidade)
	}
	tabela(m, []colunaPdf{
		{1, "#", align.Center},
		{4, "EPI", align.Left},
		{4, "Descrição", align.Left},
		{1, "CA", align.Center},
		{1, "Tam.", align.Center},
		{1, "Qtd.", align.Center},
	}, linhas)
	m.AddRow(6, text.NewCol(12, fmt.Sprintf("Total: %d %s", total, plural(total, "unidade", "unidades")),
		props.Text{Size: 8, Style: fontstyle.Bold, Align: align.Right, Top: 1.5}))

	secao(m, "Termo de responsabilidade")
	paragrafo(m, "Declaro que recebi gratuitamente da empresa acima identificada os Equipamentos de Proteção Individual "+
		"relacionados nesta ficha, em perfeitas condições de uso, e que fui orientado(a) sobre o uso correto, a guarda e a "+
		"conservação de cada um. Conforme a NR-6, comprometo-me a:")
	paragrafo(m, "a) usar o EPI apenas para a finalidade a que se destina, durante toda a atividade que exigir proteção;")
	paragrafo(m, "b) responsabilizar-me pela limpeza, guarda e conservação do EPI;")
	paragrafo(m, "c) comunicar à empresa qualquer extravio, dano ou alteração que o torne impróprio para uso, e devolvê-lo para troca;")
	paragrafo(m, "d) cumprir as orientações da empresa sobre o uso adequado do EPI.")
	paragrafo(m, "Estou ciente de que a recusa injustificada ao uso do EPI fornecido constitui ato faltoso (CLT, art. 158), "+
		"sujeito às sanções disciplinares cabíveis.")

	assinatura, formato, ok := prepararImagemAssinatura(dados.Assinatura)
	adicionarComprovacaoRecebimento(m, assinatura, formato, ok, dados.FichaPdf)

	return m.Generate()
}

// blocosEmpresaColaborador: as duas seções de identificação, iguais nas duas fichas.
func blocosEmpresaColaborador(m core.Maroto, f FichaPdf) {
	secao(m, "Empresa")
	linhaCampos(m,
		campoPdf{8, "Razão social", f.NomeEmpresa},
		campoPdf{4, "CNPJ", FormatarCNPJ(f.Cnpj)},
	)

	secao(m, "Colaborador")
	linhaCampos(m,
		campoPdf{8, "Nome", f.NomeFuncionario},
		campoPdf{2, "Matrícula", f.Matricula},
		campoPdf{2, "CPF", FormatarCPF(f.Cpf)},
	)
	linhaCampos(m,
		campoPdf{6, "Setor", f.Setor},
		campoPdf{6, "Cargo / Função", f.Cargo},
	)
}

func plural(n int, um, varios string) string {
	if n == 1 {
		return um
	}
	return varios
}
