package repository

import (
	"context"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/helper"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ProtecaoRepository lê os grupos de proteção da NR-6 (tabela global, sem tenant).
type ProtecaoRepository struct {
	q *Queries
}

func NewProtecaoRepository(pool *pgxpool.Pool) *ProtecaoRepository {
	return &ProtecaoRepository{q: New(pool)}
}

func (p *ProtecaoRepository) ListarProtecoes(ctx context.Context) ([]BuscarTodasProtecoesRow, error) {
	protc, err := p.q.BuscarTodasProtecoes(ctx)
	if err != nil {
		return nil, helper.TraduzErroPostgres(err)
	}
	return protc, nil
}
