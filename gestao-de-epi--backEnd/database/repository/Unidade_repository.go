package repository

import (
	"context"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/helper"
	"github.com/jackc/pgx/v5/pgtype"
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

func (u *UnidadeRepository) Listar(ctx context.Context, arg ListarUnidadesParams) ([]ListarUnidadesRow, error) {

	unidades, err := u.q.ListarUnidades(ctx, arg)
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

func (u *UnidadeRepository) ListarAcessos(ctx context.Context, tenantID int32) ([]ListarAcessosUsuariosRow, error) {

	acessos, err := u.q.ListarAcessosUsuarios(ctx, pgtype.Int4{Int32: tenantID, Valid: true})
	if err != nil {
		return nil, helper.TraduzErroPostgres(err)
	}

	return acessos, nil
}

// DefinirAcesso troca as unidades do usuário de uma vez (lista vazia = todas).
func (u *UnidadeRepository) DefinirAcesso(ctx context.Context, arg AdicionarUnidadesUsuarioParams) error {

	tx, err := u.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	qtx := u.q.WithTx(tx)
	if err := qtx.LimparUnidadesUsuario(ctx, LimparUnidadesUsuarioParams{UsuarioID: arg.UsuarioID, TenantID: arg.TenantID}); err != nil {
		return helper.TraduzErroPostgres(err)
	}
	if len(arg.Unidades) > 0 {
		if err := qtx.AdicionarUnidadesUsuario(ctx, arg); err != nil {
			return helper.TraduzErroPostgres(err)
		}
	}

	return tx.Commit(ctx)
}
