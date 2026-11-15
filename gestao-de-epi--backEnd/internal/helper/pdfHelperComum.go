package helper

import (
	"fmt"
	"strings"

	"github.com/johnfercher/maroto/v2"
	"github.com/johnfercher/maroto/v2/pkg/components/code"
	"github.com/johnfercher/maroto/v2/pkg/components/col"
	"github.com/johnfercher/maroto/v2/pkg/components/line"
	"github.com/johnfercher/maroto/v2/pkg/components/row"
	"github.com/johnfercher/maroto/v2/pkg/components/text"
	"github.com/johnfercher/maroto/v2/pkg/config"
	"github.com/johnfercher/maroto/v2/pkg/consts/align"
	"github.com/johnfercher/maroto/v2/pkg/consts/border"
	"github.com/johnfercher/maroto/v2/pkg/consts/fontstyle"
	"github.com/johnfercher/maroto/v2/pkg/core"
	"github.com/johnfercher/maroto/v2/pkg/props"
)

// Peças comuns às fichas de entrega e de devolução: cabeçalho, seções com rótulo,
// tabela e o rodapé com QR code, que se repete em toda página.

// FichaPdf reúne o que as duas fichas têm em comum: o documento, a empresa e o colaborador.
type FichaPdf struct {
	Numero          int32
	Token           string // código de validação gravado no registro (ENT-… / DEVO-…)
	NomeEmpresa     string
	Cnpj            string
	Unidade         string
	NomeFuncionario string
	Cpf             string
	Matricula       string
	Setor           string
	Cargo           string
	Assinatura      string // URL da assinatura ou da foto no bucket
}

var (
	corRotulo = &props.Color{Red: 105, Green: 112, Blue: 120}
	corFundo  = &props.Color{Red: 238, Green: 240, Blue: 243}
	corBorda  = &props.Color{Red: 185, Green: 190, Blue: 196}
	corAlerta = &props.Color{Red: 176, Green: 32, Blue: 24}
)

type campoPdf struct {
	tam           int
	rotulo, valor string
}

type colunaPdf struct {
	tam    int
	titulo string
	alinha align.Type
}

func novoDocumento(titulo string, f FichaPdf) core.Maroto {
	cfg := config.NewBuilder().
		WithTopMargin(12).
		WithLeftMargin(12).
		WithRightMargin(12).
		WithBottomMargin(8).
		WithTitle(titulo, true).
		WithAuthor(f.NomeEmpresa, true).
		WithPageNumber(props.PageNumber{Pattern: "Página {current} de {total}", Place: props.RightBottom, Size: 7, Color: corRotulo}).
		Build()
	return maroto.New(cfg)
}

// cabecalho: título e número da ficha, subtítulo e, se for o caso, o aviso de cancelamento.
func cabecalho(m core.Maroto, titulo, subtitulo string, f FichaPdf, cancelada bool) {
	m.AddRows(
		row.New().Add(
			text.NewCol(9, titulo, props.Text{Size: 14, Style: fontstyle.Bold}),
			text.NewCol(3, fmt.Sprintf("Nº %06d", f.Numero), props.Text{Size: 11, Style: fontstyle.Bold, Align: align.Right, Top: 1}),
		),
		row.New().Add(
			text.NewCol(9, subtitulo, props.Text{Size: 8, Color: corRotulo, Top: 1}),
			text.NewCol(3, "Código "+valorOuTraco(f.Token), props.Text{Size: 8, Color: corRotulo, Align: align.Right, Top: 1}),
		),
		row.New(4),
		line.NewRow(1, props.Line{Thickness: 0.4, SizePercent: 100}),
	)
	if cancelada {
		m.AddRow(9, text.NewCol(12, "DOCUMENTO CANCELADO: este registro foi cancelado no sistema e não tem validade.",
			props.Text{Size: 9, Style: fontstyle.Bold, Color: corAlerta, Align: align.Center, Top: 2.5}).
			WithStyle(&props.Cell{BorderType: border.Full, BorderColor: corAlerta, BorderThickness: 0.4}))
	}
}

// secao: faixa cinza com o título de um bloco da ficha.
func secao(m core.Maroto, titulo string) {
	m.AddRow(3)
	m.AddRow(6.5, text.NewCol(12, strings.ToUpper(titulo), props.Text{Size: 8, Style: fontstyle.Bold, Left: 2, Top: 1.6}).
		WithStyle(&props.Cell{BackgroundColor: corFundo}))
}

// linhaCampos: campos lado a lado, cada um com o rótulo pequeno em cima do valor.
func linhaCampos(m core.Maroto, campos ...campoPdf) {
	cols := make([]core.Col, 0, len(campos))
	for _, c := range campos {
		cols = append(cols, col.New(c.tam).Add(
			text.New(c.rotulo, props.Text{Size: 7, Color: corRotulo, Top: 1.5, Left: 2}),
			text.New(valorOuTraco(c.valor), props.Text{Size: 9.5, Top: 5, Bottom: 1, Left: 2, Right: 2}),
		))
	}
	m.AddRows(row.New().Add(cols...))
}

// tabela: o texto quebra linha e a altura acompanha, em vez de cortar o nome do EPI.
func tabela(m core.Maroto, colunas []colunaPdf, linhas [][]string) {
	borda := &props.Cell{BorderType: border.Full, BorderThickness: 0.2, BorderColor: corBorda}
	cab := &props.Cell{BorderType: border.Full, BorderThickness: 0.2, BorderColor: corBorda, BackgroundColor: corFundo}

	cols := make([]core.Col, 0, len(colunas))
	for _, c := range colunas {
		cols = append(cols, text.NewCol(c.tam, c.titulo, props.Text{Size: 8, Style: fontstyle.Bold, Align: c.alinha, Top: 1.8, Left: 1.5, Right: 1.5}).WithStyle(cab))
	}
	m.AddRows(row.New(7).Add(cols...))

	for _, l := range linhas {
		cols := make([]core.Col, 0, len(colunas))
		for i, c := range colunas {
			cols = append(cols, text.NewCol(c.tam, l[i], props.Text{Size: 8.5, Align: c.alinha, Top: 2, Bottom: 2, Left: 1.5, Right: 1.5}).WithStyle(borda))
		}
		m.AddRows(row.New().Add(cols...))
	}
}

func paragrafo(m core.Maroto, texto string) {
	m.AddRows(row.New().Add(text.NewCol(12, texto, props.Text{Size: 8.5, Top: 1, Bottom: 1, VerticalPadding: 0.6})))
}

// rodape: QR code com a identificação do documento e o registro de quem gerou, em toda página.
func rodape(m core.Maroto, tipo string, f FichaPdf, data string, auditoria Auditoria, responsavel string) error {
	qr := fmt.Sprintf("SGEPI | %s nº %d | Código %s | %s | Matrícula %s | %s",
		tipo, f.Numero, valorOuTraco(f.Token), f.NomeFuncionario, f.Matricula, data)

	info := col.New(10).Add(
		text.New(fmt.Sprintf("%s nº %06d · Código de validação %s", tipo, f.Numero, valorOuTraco(f.Token)),
			props.Text{Size: 7.5, Style: fontstyle.Bold, Top: 4}),
		text.New(fmt.Sprintf("Gerado em %s por %s · IP %s", auditoria.DadosServidor, valorOuTraco(responsavel), auditoria.Ip),
			props.Text{Size: 7, Color: corRotulo, Top: 8.5}),
		text.New("O QR code reúne o número, o código e o colaborador deste documento, para conferência com o registro no sistema.",
			props.Text{Size: 7, Color: corRotulo, Top: 12}),
	)

	return m.RegisterFooter(
		line.NewRow(2, props.Line{Thickness: 0.2, Color: corBorda, SizePercent: 100}),
		row.New(20).Add(code.NewQrCol(2, qr, props.Rect{Percent: 95}), info),
	)
}

func valorOuTraco(s string) string {
	if strings.TrimSpace(s) == "" {
		return "—"
	}
	return s
}

func soDigitos(s string) string {
	return strings.Map(func(r rune) rune {
		if r >= '0' && r <= '9' {
			return r
		}
		return -1
	}, s)
}

// FormatarCPF: 12345678901 → 123.456.789-01. Fora do formato, devolve como veio.
func FormatarCPF(s string) string {
	d := soDigitos(s)
	if len(d) != 11 {
		return s
	}
	return d[:3] + "." + d[3:6] + "." + d[6:9] + "-" + d[9:]
}

// FormatarCNPJ: 12345678000190 → 12.345.678/0001-90. Fora do formato, devolve como veio.
func FormatarCNPJ(s string) string {
	d := soDigitos(s)
	if len(d) != 14 {
		return s
	}
	return d[:2] + "." + d[2:5] + "." + d[5:8] + "/" + d[8:12] + "-" + d[12:]
}
