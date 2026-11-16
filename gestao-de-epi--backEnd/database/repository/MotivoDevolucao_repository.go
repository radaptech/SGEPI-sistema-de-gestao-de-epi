package repository

import (
	"context"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/helper"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MotivoDevolucaoRepository struct {
	q  *Queries
	db *pgxpool.Pool
}

func NewMotivoDevolucaoRepository(pool *pgxpool.Pool) *MotivoDevolucaoRepository {

	return &MotivoDevolucaoRepository{
		q:  New(pool),
		db: pool,
	}
}

// motivo_devolucao é global: não recebe tenant.
func (m *MotivoDevolucaoRepository) ListarMotivos(ctx context.Context) ([]MotivoDevolucao, error) {

	motivos, err := m.q.BuscaTodosMotivosDevolucao(ctx)
	if err != nil {

		return []MotivoDevolucao{}, helper.TraduzErroPostgres(err)
	}

	return motivos, nil
}

func (m *MotivoDevolucaoRepository) Descarte(ctx context.Context, id int32) (bool, error) {

	descarte, err := m.q.EhDescarte(ctx, id)
	if err != nil {

		return false, helper.TraduzErroPostgres(err)
	}

	return descarte, nil
}

func (m *MotivoDevolucaoRepository) ConsultaSaldo(ctx context.Context, arg ConsultarSaldoEpiFuncionarioParams) (int32, error) {

	saldo, err := m.q.ConsultarSaldoEpiFuncionario(ctx, arg)
	if err != nil {

		return 0, helper.TraduzErroPostgres(err)
	}

	return saldo, nil
}
