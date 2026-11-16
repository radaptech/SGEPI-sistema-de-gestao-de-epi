package main

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLerCaepi(t *testing.T) {
	txt := `NR Registro CA|DATA DE VALIDADE|SITUACAO|NR DO PROCESSO|CNPJ|RAZAO SOCIAL|NATUREZA|EQUIPAMENTO|DESCRICAO EQUIPAMENTO|MARCA CA
5745|08/08/2028|VÁLIDO|199|459|3M DO BRASIL LTDA|Nacional|PROTETOR AUDITIVO|descrição com | no meio|x
10018|13/08/2019|VENCIDO|460|000|BENITEZ LTDA|Nacional|LUVA|a|b
10018|13/08/2021|CANCELADO|460|000|BENITEZ LTDA|Nacional|LUVA|a|b
10018|13/08/2020|VENCIDO|460|000|BENITEZ LTDA|Nacional|LUVA|a|b
`
	cas, err := lerCaepi(strings.NewReader(txt))
	require.NoError(t, err)
	require.Len(t, cas, 2)

	assert.Equal(t, "5745", cas[0].Ca)
	assert.Equal(t, "VÁLIDO", cas[0].Situacao)
	assert.Equal(t, "3M DO BRASIL LTDA", cas[0].Fabricante)
	assert.Equal(t, "PROTETOR AUDITIVO", cas[0].Equipamento)
	assert.Equal(t, "2028-08-08", cas[0].Validade.Time.Format("2006-01-02"))

	// CA repetido por laudo: fica a linha de validade mais recente
	assert.Equal(t, "CANCELADO", cas[1].Situacao)
	assert.Equal(t, "2021-08-13", cas[1].Validade.Time.Format("2006-01-02"))
}

func TestLerCaepiRecusaLinhaQuebrada(t *testing.T) {
	_, err := lerCaepi(strings.NewReader("cabecalho\n5745|08/08/2028|VÁLIDO\n"))
	assert.ErrorContains(t, err, "linha 2")
}
