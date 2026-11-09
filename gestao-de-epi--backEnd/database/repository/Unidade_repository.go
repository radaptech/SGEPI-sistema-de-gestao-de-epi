package repository

import (
	"context"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/helper"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UnidadeRepository struct {
	q  *Queries
	db *pgxpool.Pool
}

func NewUnidadeRepository(pool *pgxpool.Pool) *UnidadeRepository {

	return &UnidadeRepository{
		q:  New(pool),
		db: pool,
	}
}

func (u *UnidadeRepository) Criar(ctx context.Context, arg CriarUnidadeParams) (CriarUnidadeRow, error) {

	unidade, err := u.q.CriarUnidade(ctx, arg)
	if err != nil {
		return CriarUnidadeRow{}, helper.TraduzErroPostgres(err)
	}

	return unidade, nil
}

func (u *UnidadeRepository) Listar(ctx context.Context, tenantID int32) ([]ListarUnidadesRow, error) {

	unidades, err := u.q.ListarUnidades(ctx, tenantID)
	if err != nil {
		return nil, helper.TraduzErroPostgres(err)
	}

	return unidades, nil
}

func (u *UnidadeRepository) Renomear(ctx context.Context, arg RenomearUnidadeParams) (int64, error) {

	linhas, err := u.q.RenomearUnidade(ctx, arg)
	if err != nil {
		return 0, helper.TraduzErroPostgres(err)
	}

	return linhas, nil
}

func (u *UnidadeRepository) Desativar(ctx context.Context, arg DesativarUnidadeParams) (int64, error) {

	linhas, err := u.q.DesativarUnidade(ctx, arg)
	if err != nil {
		return 0, helper.TraduzErroPostgres(err)
	}

	return linhas, nil
}
