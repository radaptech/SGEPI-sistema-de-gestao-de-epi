package service

import (
	"context"
	"testing"
	"time"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/configs"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/database/repository"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/helper"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/model"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/middleware"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/require"
)

// Fase 7 do docs/PLANO-UNIDADES.md: transferência entre unidades. Usa o cenário de duas lojas
// de testeIntegracaoUnidade_test.go.
func TestTransferencia(t *testing.T) {
	validadeCurta := time.Now().AddDate(1, 0, 0)
	validadeLonga := time.Now().AddDate(3, 0, 0)

	transferir := func(c cenarioDuasLojas, origem, destino, qtd int32) (int32, error) {
		return NewTransferenciaService(c.db).Transferir(c.ctx, model.TransferenciaInserir{
			IdUnidadeOrigem: origem, IdUnidadeDestino: destino,
			Itens: []model.ItemParaInserir{{ID_epi: c.epi, ID_tamanho: c.tam, Quantidade: qtd}},
		}, c.user, c.tenant)
	}
	contar := func(t *testing.T, c cenarioDuasLojas, sql string) int {
		var n int
		require.NoError(t, c.db.QueryRow(c.ctx, sql, c.tenant).Scan(&n))
		return n
	}

	t.Run("sai da origem pelo FEFO, entra no destino com o lote copiado e a soma da rede não muda", func(t *testing.T) {
		c := novoCenarioDuasLojas(t)
		defer c.db.Close()
		require.NoError(t, c.entrada(t, &c.loja1, "NF-LONGA", 10, validadeLonga))
		require.NoError(t, c.entrada(t, &c.loja1, "NF-CURTA", 5, validadeCurta))

		id, err := transferir(c, c.loja1, c.loja2, 12)
		require.NoError(t, err)
		require.Equal(t, int32(3), c.saldo(t, c.loja1))
		require.Equal(t, int32(12), c.saldo(t, c.loja2))

		// FEFO: os 5 que vencem antes foram todos, mais 7 do outro lote; cada um virou um lote no destino
		var curtos, longos int32
		require.NoError(t, c.db.QueryRow(c.ctx, `SELECT
			COALESCE(SUM(quantidade) FILTER (WHERE data_validade = $2), 0)::int,
			COALESCE(SUM(quantidade) FILTER (WHERE data_validade = $3), 0)::int
			FROM entrada_epi_item WHERE tenant_id = $1 AND id_transferencia = $4 AND id_unidade = $5 AND id_lote_origem IS NOT NULL`,
			c.tenant, validadeCurta.Format(time.DateOnly), validadeLonga.Format(time.DateOnly), id, c.loja2).Scan(&curtos, &longos))
		require.Equal(t, int32(5), curtos)
		require.Equal(t, int32(7), longos)

		// não é compra: a tela de Entradas da Loja 2 continua vazia
		n, err := repository.New(c.db).ContarEntradasFiltradas(c.ctx, repository.ContarEntradasFiltradasParams{
			TenantID: c.tenant, IDUnidade: pgtype.Int4{Int32: c.loja2, Valid: true},
		})
		require.NoError(t, err)
		require.Zero(t, n)

		lista, err := NewTransferenciaService(c.db).Listar(c.ctx, c.tenant, c.loja2)
		require.NoError(t, err)
		require.Len(t, lista, 1)
		require.Equal(t, "Loja 1", lista[0].UnidadeOrigem.Nome)
		require.Len(t, lista[0].Itens, 2)
		require.False(t, lista[0].Cancelada)
	})

	t.Run("falta na origem não mexe em nada, e mesma unidade ou origem sem acesso são recusadas", func(t *testing.T) {
		c := novoCenarioDuasLojas(t)
		defer c.db.Close()
		require.NoError(t, c.entrada(t, &c.loja1, "NF-L1", 5, validadeLonga))
		require.NoError(t, c.entrada(t, &c.loja2, "NF-L2", 9, validadeLonga))

		_, err := transferir(c, c.loja1, c.loja2, 8)
		require.EqualError(t, err, "estoque insuficiente em Loja 1: faltam 3 unidade(s) dentro da validade; há 9 em outras unidades")
		require.Equal(t, int32(5), c.saldo(t, c.loja1))
		require.Equal(t, int32(9), c.saldo(t, c.loja2))
		require.Zero(t, contar(t, c, "SELECT COUNT(*) FROM transferencia WHERE tenant_id = $1"))

		_, err = transferir(c, c.loja1, c.loja1, 1)
		require.ErrorIs(t, err, helper.ErrMesmaUnidade)

		c.ctx = context.WithValue(c.ctx, middleware.UnidadesKey, []int32{c.loja2})
		_, err = transferir(c, c.loja1, c.loja2, 1)
		require.ErrorIs(t, err, helper.ErrUnidadeSemAcesso)
		_, err = transferir(c, c.loja2, c.loja1, 4)
		require.NoError(t, err, "da própria loja para outra pode")
	})

	t.Run("cancelar devolve à origem; depois que o destino usa, não cancela", func(t *testing.T) {
		c := novoCenarioDuasLojas(t)
		defer c.db.Close()
		serv := NewTransferenciaService(c.db)
		require.NoError(t, c.entrada(t, &c.loja1, "NF-L1", 10, validadeLonga))

		usada, err := transferir(c, c.loja1, c.loja2, 4)
		require.NoError(t, err)
		require.NoError(t, c.entrega(1, &c.loja2)) // o destino usa 1
		require.ErrorIs(t, serv.Cancelar(c.ctx, usada, c.user, c.tenant), helper.ErrTransferenciaUsada)
		require.Zero(t, contar(t, c, "SELECT COUNT(*) FROM transferencia WHERE tenant_id = $1 AND cancelada_em IS NOT NULL"), "rollback")

		livre, err := transferir(c, c.loja1, c.loja2, 5) // Loja 1: 1, Loja 2: 3 + 5
		require.NoError(t, err)
		require.NoError(t, serv.Cancelar(c.ctx, livre, c.user, c.tenant))
		require.Equal(t, int32(6), c.saldo(t, c.loja1))
		require.Equal(t, int32(3), c.saldo(t, c.loja2))
		require.ErrorIs(t, serv.Cancelar(c.ctx, livre, c.user, c.tenant), helper.ErrNaoEncontrado, "já cancelada")
	})

	t.Run("funcionário que mudou de unidade devolve na nova mesmo sem lote lá", func(t *testing.T) {
		c := novoCenarioDuasLojas(t)
		defer c.db.Close()
		require.NoError(t, c.entrada(t, &c.loja1, "NF-L1", 10, validadeLonga))
		require.NoError(t, c.entrega(4, nil)) // da Loja 1, a do funcionário
		_, err := c.db.Exec(c.ctx, "UPDATE funcionario SET id_unidade = $1 WHERE id = $2", c.loja2, c.funcionario)
		require.NoError(t, err)

		require.NoError(t, c.devolucoes.SalvarDevolucao(c.ctx, model.DevolucaoInserir{
			IdFuncionario: int(c.funcionario), IdEpi: int(c.epi), IdMotivo: int(c.motivoVoltaAoEstoque), IdTamanho: int(c.tam),
			DataDevolucao: *configs.NewDataBrPtr(time.Now()), QuantidadeADevolver: 3, Iduser: int(c.user),
			AssinaturaDigital: "x", Observacao: new(string),
		}, c.tenant, "token-devolve-na-nova"))
		require.Equal(t, int32(3), c.saldo(t, c.loja2), "lote novo na Loja 2")
		require.Equal(t, int32(6), c.saldo(t, c.loja1))
	})
}
