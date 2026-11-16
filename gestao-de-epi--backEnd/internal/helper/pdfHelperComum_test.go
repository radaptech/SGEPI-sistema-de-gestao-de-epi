package helper

import (
	"bytes"
	"testing"
	"time"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/configs"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestFormatarDocumentos(t *testing.T) {
	assert.Equal(t, "123.456.789-01", FormatarCPF("12345678901"))
	assert.Equal(t, "123.456.789-01", FormatarCPF("123.456.789-01"))
	assert.Equal(t, "1234", FormatarCPF("1234"), "fora do formato volta como veio")
	assert.Equal(t, "12.345.678/0001-90", FormatarCNPJ("12345678000190"))
	assert.Equal(t, "", FormatarCNPJ(""))
}

func TestCreatePdfFichas(t *testing.T) {
	data := configs.DataBr(time.Date(2026, 11, 10, 0, 0, 0, 0, time.Local))
	ficha := FichaPdf{Numero: 7, Token: "ENT-ABC", NomeEmpresa: "Empresa Ltda", Cnpj: "12345678000190",
		NomeFuncionario: "José da Silva", Cpf: "12345678901", Matricula: "42", Setor: "Produção", Cargo: "Soldador"}
	aud := Auditoria{DadosServidor: "10/11/2026 às 10:00:00", Ip: "127.0.0.1"}

	t.Run("entrega com a logo da empresa", func(t *testing.T) {
		usarLogoDeTeste(t, imagemDeTeste(t, "png", 400, 120))
		comLogo := ficha
		comLogo.LogoKey = "logos/1/x.png"
		doc, err := CreatePdf(DadosPdf{FichaPdf: comLogo, Data: data}, aud, "Maria")
		require.NoError(t, err)
		semLogo, err := CreatePdf(DadosPdf{FichaPdf: ficha, Data: data}, aud, "Maria")
		require.NoError(t, err)
		assert.Greater(t, len(doc.GetBytes()), len(semLogo.GetBytes()), "a logo entra no PDF")
	})

	t.Run("entrega com mais itens do que cabem numa página", func(t *testing.T) {
		itens := make([]DadosEpiPdf, 30)
		for i := range itens {
			itens[i] = DadosEpiPdf{NomeEpi: "Bota de segurança", Ca: "11111", Tamanho: "42", Quantidade: 1}
		}
		doc, err := CreatePdf(DadosPdf{FichaPdf: ficha, Data: data, Epi: itens}, aud, "Maria")
		require.NoError(t, err)
		assert.True(t, bytes.HasPrefix(doc.GetBytes(), []byte("%PDF")))
		pdf := doc.GetBytes()
		paginas := bytes.Count(pdf, []byte("/Type /Page")) - bytes.Count(pdf, []byte("/Type /Pages"))
		assert.Greater(t, paginas, 1)
	})

	for _, caso := range []struct {
		nome  string
		dados DadosDevolucaoPdf
	}{
		{"devolução simples", DadosDevolucaoPdf{FichaPdf: ficha, Item: ItemDevolvidoPdf{DataDevolucao: data, NomeEpi: "Luva", Tamanho: "G", QuantidadeADevolver: 1}}},
		{"troca cancelada com observação", DadosDevolucaoPdf{FichaPdf: ficha, Cancelada: true, Observacao: "rasgada",
			Item: ItemDevolvidoPdf{DataDevolucao: data, NomeEpi: "Luva", Tamanho: "G", QuantidadeADevolver: 1, HouveTroca: true, EpiNovo: "Luva", TamanhoNovo: "G", QuantidadeNova: 1}}},
	} {
		t.Run(caso.nome, func(t *testing.T) {
			doc, err := CreatePdfDevolucao(caso.dados, aud, "Maria")
			require.NoError(t, err)
			assert.True(t, bytes.HasPrefix(doc.GetBytes(), []byte("%PDF")))
		})
	}
}
