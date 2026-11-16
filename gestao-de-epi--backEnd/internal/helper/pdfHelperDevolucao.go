package helper

import (
	"strconv"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/configs"
	"github.com/johnfercher/maroto/v2/pkg/consts/align"
	"github.com/johnfercher/maroto/v2/pkg/core"
)

// DadosDevolucaoPdf representa o escopo do documento
type DadosDevolucaoPdf struct {
	FichaPdf
	RecebidoPor string // usuário que registrou a devolução
	Cancelada   bool
	Observacao  string
	Item        ItemDevolvidoPdf
}

// ItemDevolvidoPdf: o EPI devolvido e, se houve troca, o que foi entregue no lugar.
type ItemDevolvidoPdf struct {
	DataDevolucao       configs.DataBr
	NomeEpi             string
	Ca                  string
	Tamanho             string
	QuantidadeADevolver int32
	Motivo              string
	Descarte            bool // o motivo manda o EPI para descarte em vez de voltar ao estoque
	HouveTroca          bool
	EpiNovo             string // Só preenchido se HouveTroca == true
	CaNovo              string
	TamanhoNovo         string
	QuantidadeNova      int32
}

var colunasItemPdf = []colunaPdf{
	{7, "EPI", align.Left},
	{2, "CA", align.Center},
	{2, "Tamanho", align.Center},
	{1, "Qtd.", align.Center},
}

func CreatePdfDevolucao(dados DadosDevolucaoPdf, auditoria Auditoria, responsavel string) (core.Document, error) {
	item := dados.Item
	data := item.DataDevolucao.Time().Format("02/01/2006")

	titulo := "FICHA DE DEVOLUÇÃO DE EPI"
	if item.HouveTroca {
		titulo = "FICHA DE DEVOLUÇÃO E TROCA DE EPI"
	}

	m := novoDocumento("Ficha de devolução de EPI", dados.FichaPdf)
	if err := rodape(m, "Ficha de devolução", dados.FichaPdf, data, auditoria, responsavel); err != nil {
		return nil, err
	}

	cabecalho(m, titulo, "Registro de devolução de Equipamento de Proteção Individual (NR-6)", dados.FichaPdf, dados.Cancelada)
	blocosEmpresaColaborador(m, dados.FichaPdf)

	destino := "Retorna ao estoque"
	if item.Descarte {
		destino = "Descarte"
	}

	secao(m, "Devolução")
	linhaCampos(m,
		campoPdf{3, "Data da devolução", data},
		campoPdf{5, "Recebido por", dados.RecebidoPor},
		campoPdf{4, "Unidade", dados.Unidade},
	)
	linhaCampos(m,
		campoPdf{8, "Motivo", item.Motivo},
		campoPdf{4, "Destino do EPI devolvido", destino},
	)
	if dados.Observacao != "" {
		linhaCampos(m, campoPdf{12, "Observação", dados.Observacao})
	}

	secao(m, "EPI devolvido")
	tabela(m, colunasItemPdf, [][]string{
		{item.NomeEpi, valorOuTraco(item.Ca), item.Tamanho, strconv.Itoa(int(item.QuantidadeADevolver))},
	})

	if item.HouveTroca {
		secao(m, "EPI entregue em substituição")
		tabela(m, colunasItemPdf, [][]string{
			{item.EpiNovo, valorOuTraco(item.CaNovo), item.TamanhoNovo, strconv.Itoa(int(item.QuantidadeNova))},
		})
	}

	secao(m, "Declaração")
	paragrafo(m, "Declaro que devolvi à empresa acima identificada o EPI relacionado em \"EPI devolvido\", nesta data e pelo motivo indicado.")
	if item.HouveTroca {
		paragrafo(m, "Declaro também que recebi gratuitamente o EPI relacionado em \"EPI entregue em substituição\", em perfeitas "+
			"condições de uso, e que me comprometo a usá-lo apenas para a finalidade a que se destina, a responsabilizar-me "+
			"pela sua guarda e conservação e a comunicar à empresa qualquer dano ou extravio, conforme a NR-6.")
	}

	assinatura, formato, ok := prepararImagemAssinatura(dados.Assinatura)
	adicionarComprovacaoRecebimento(m, assinatura, formato, ok, dados.FichaPdf)

	return m.Generate()
}
