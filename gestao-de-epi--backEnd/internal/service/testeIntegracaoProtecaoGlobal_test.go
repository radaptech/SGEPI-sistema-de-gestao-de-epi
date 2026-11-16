package service

import (
	"context"
	"testing"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/database/repository"
	"github.com/stretchr/testify/require"
)

// Cobre a migração 000040: os 9 grupos globais da NR-6 e a sugestão de grupo pelo nome do equipamento do CA.
func TestProtecaoGlobal(t *testing.T) {
	ctx := context.Background()
	db := SetupTestDB(t)
	defer db.Close()

	protecoes, err := NewProtecaoService(repository.NewProtecaoRepository(db)).ListarProtecoes(ctx)
	require.NoError(t, err)
	require.Len(t, protecoes, 9)
	require.Equal(t, "Proteção da cabeça", protecoes[0].Nome)

	// nomes reais da base do MTE → código esperado
	casos := map[string]string{
		"LUVA PARA PROTEÇÃO CONTRA AGENTES MECÂNICOS": "F",
		"CALÇADO":                            "G",
		"BOTINA":                             "G",
		"VESTIMENTA PARA PROTEÇÃO DO TRONCO": "E",
		"VESTIMENTA DE CORPO INTEIRO":        "H",
		"VESTIMENTA TIPO CONJUNTO":           "H",
		"MACACÃO":                            "H",
		"VESTIMENTA DE SEGURANÇA TIPO TOUCA": "A",
		"CAPUZ OU BALACLAVA":                 "A",
		"ÓCULOS":                             "B",
		"MÁSCARA DE SOLDA TIPO ESCURECIMENTO AUTOMÁTICO":                      "B",
		"CONJUGADO MASCARA DE SOLDA DE ESCURECIMENTO AUTOMATICO E RESPIRADOR": "D",
		"PROTETOR AUDITIVO": "C",
		"x - DISPOSITIVO TRAVA QUEDA COM CINTURÃO DE SEGURANÇA": "I",
		"COLETE À PROVA DE BALAS - NÍVEL II":                    "E",
		"MANGOTE":                                               "F",
	}
	for equipamento, esperado := range casos {
		var codigo *string
		require.NoError(t, db.QueryRow(ctx, `SELECT protecao_por_equipamento($1)`, equipamento).Scan(&codigo))
		require.NotNil(t, codigo, equipamento)
		require.Equal(t, esperado, *codigo, equipamento)
	}

	// a consulta do CA devolve o id do grupo sugerido, ou nil quando nada bate
	_, err = db.Exec(ctx, `INSERT INTO caepi (ca, validade, situacao, fabricante, equipamento) VALUES
		('111', '2030-01-01', 'VÁLIDO', 'FAB', 'LUVA DE VAQUETA'),
		('222', '2030-01-01', 'VÁLIDO', 'FAB', 'COISA SEM REGRA')`)
	require.NoError(t, err)

	var idLuva int32
	require.NoError(t, db.QueryRow(ctx, `SELECT id FROM tipo_protecao WHERE codigo = 'F'`).Scan(&idLuva))

	epiSvc := NewEpiService(repository.NewEpiRepository(db), db)
	luva, err := epiSvc.BuscarCaepi(ctx, "111")
	require.NoError(t, err)
	require.NotNil(t, luva.IdProtecaoSugerida)
	require.Equal(t, idLuva, *luva.IdProtecaoSugerida)

	semRegra, err := epiSvc.BuscarCaepi(ctx, "222")
	require.NoError(t, err)
	require.Nil(t, semRegra.IdProtecaoSugerida)
}
