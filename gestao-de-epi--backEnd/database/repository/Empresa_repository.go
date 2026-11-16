package repository

import (
	"context"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/helper"
	"github.com/jackc/pgx/v5/pgxpool"
)

type EmpresaRepository struct {
	q  *Queries
	db *pgxpool.Pool
}

func NewEmpresaRepository(pool *pgxpool.Pool) *EmpresaRepository {

	return &EmpresaRepository{
		q:  New(pool),
		db: pool,
	}
}

func (e *EmpresaRepository) Salvar(ctx context.Context, arg CriarEmpresaParams) error {

	err := e.q.CriarEmpresa(ctx, arg)
	if err != nil {

		return helper.TraduzErroPostgres(err)
	}

	return nil
}

func (e *EmpresaRepository) ResumoDashboard(ctx context.Context) (ResumoMasterRow, error) {

	resumo, err := e.q.ResumoMaster(ctx)
	if err != nil {
		return ResumoMasterRow{}, helper.TraduzErroPostgres(err)
	}
	return resumo, nil
}

func (e *EmpresaRepository) Alertas(ctx context.Context) ([]AlertasMasterRow, error) {

	alertas, err := e.q.AlertasMaster(ctx)
	if err != nil {
		return nil, helper.TraduzErroPostgres(err)
	}
	return alertas, nil
}

func (e *EmpresaRepository) Limites(ctx context.Context) ([]LimitesMasterRow, error) {

	limites, err := e.q.LimitesMaster(ctx)
	if err != nil {
		return nil, helper.TraduzErroPostgres(err)
	}
	return limites, nil
}

func (e *EmpresaRepository) EmpresasRecentes(ctx context.Context) ([]EmpresasRecentesRow, error) {

	empresas, err := e.q.EmpresasRecentes(ctx)
	if err != nil {
		return []EmpresasRecentesRow{}, helper.TraduzErroPostgres(err)
	}

	return empresas, nil
}

func (e *EmpresaRepository) DadosEmpresas(ctx context.Context) ([]DadosEmpresasRow, error) {

	empresas, err := e.q.DadosEmpresas(ctx)
	if err != nil {
		return []DadosEmpresasRow{}, helper.TraduzErroPostgres(err)
	}

	return empresas, nil
}

func (e *EmpresaRepository) EditarEmpresa(ctx context.Context, arg EditarEmpresaParams) error {
	err := e.q.EditarEmpresa(ctx, arg)
	if err != nil {
		return helper.TraduzErroPostgres(err)
	}

	return nil
}

func (e *EmpresaRepository) ValidaTotalFuncionario(ctx context.Context, id int32) (ValidaTotalFuncionariosRow, error) {

	total, err := e.q.ValidaTotalFuncionarios(ctx, id)
	if err != nil {

		return ValidaTotalFuncionariosRow{}, helper.TraduzErroPostgres(err)
	}

	return total, nil

}

func (e *EmpresaRepository) BuscarLogo(ctx context.Context, tenantId int32) (string, error) {
	key, err := e.q.BuscarLogoEmpresa(ctx, tenantId)
	if err != nil {
		return "", helper.TraduzErroPostgres(err)
	}
	return key, nil
}

// DefinirLogo grava a chave da logo no bucket; key vazia tira a logo.
func (e *EmpresaRepository) DefinirLogo(ctx context.Context, tenantId int32, key string) error {
	err := e.q.DefinirLogoEmpresa(ctx, DefinirLogoEmpresaParams{ID: tenantId, LogoKey: pgtype.Text{String: key, Valid: key != ""}})
	if err != nil {
		return helper.TraduzErroPostgres(err)
	}
	return nil
}
