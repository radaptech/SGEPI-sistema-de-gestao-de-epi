package service

import (
	"context"
	"strings"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/database/repository"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/helper"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/model"
)

// Unidades (lojas, obras, almoxarifados) dentro do tenant. Plano: docs/PLANO-UNIDADES.md.
// Toda empresa nasce com a "Principal" (trigger da migração 000042).
type UnidadeRepository interface {
	Criar(ctx context.Context, arg repository.CriarUnidadeParams) (repository.CriarUnidadeRow, error)
	Listar(ctx context.Context, tenantID int32) ([]repository.ListarUnidadesRow, error)
	Renomear(ctx context.Context, arg repository.RenomearUnidadeParams) (int64, error)
	Desativar(ctx context.Context, arg repository.DesativarUnidadeParams) (int64, error)
}

type UnidadeService struct {
	repo UnidadeRepository
}

func NewUnidadeService(repo UnidadeRepository) *UnidadeService {

	return &UnidadeService{repo: repo}
}

func nomeUnidade(nome string) (string, error) {

	nome = strings.TrimSpace(nome)
	if len([]rune(nome)) < 2 {
		return "", helper.ErrNomeCurto
	}

	return nome, nil
}

func (s *UnidadeService) Criar(ctx context.Context, input model.UnidadeInserir, tenantID int32) (model.UnidadeDto, error) {

	nome, err := nomeUnidade(input.Nome)
	if err != nil {
		return model.UnidadeDto{}, err
	}

	u, err := s.repo.Criar(ctx, repository.CriarUnidadeParams{TenantID: tenantID, Nome: nome})
	if err != nil {
		return model.UnidadeDto{}, err
	}

	return model.UnidadeDto{ID: u.ID, Nome: u.Nome}, nil
}

func (s *UnidadeService) Listar(ctx context.Context, tenantID int32) ([]model.UnidadeDto, error) {

	linhas, err := s.repo.Listar(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	dto := make([]model.UnidadeDto, 0, len(linhas))
	for _, l := range linhas {
		dto = append(dto, model.UnidadeDto{ID: l.ID, Nome: l.Nome, Funcionarios: l.Funcionarios, Saldo: l.Saldo})
	}

	return dto, nil
}

func (s *UnidadeService) Renomear(ctx context.Context, id int32, input model.UnidadeInserir, tenantID int32) error {

	if id <= 0 {
		return helper.ErrId
	}

	nome, err := nomeUnidade(input.Nome)
	if err != nil {
		return err
	}

	linhas, err := s.repo.Renomear(ctx, repository.RenomearUnidadeParams{ID: id, TenantID: tenantID, Nome: nome})
	if err != nil {
		return err
	}
	if linhas == 0 {
		return helper.ErrNaoEncontrado
	}

	return nil
}

// Desativar recusa a última unidade e a que ainda tem estoque ou funcionário ativo:
// o estoque e as pessoas precisam ser transferidos antes (Fases 3 e 7 do plano).
func (s *UnidadeService) Desativar(ctx context.Context, id int32, tenantID int32) error {

	if id <= 0 {
		return helper.ErrId
	}

	unidades, err := s.repo.Listar(ctx, tenantID)
	if err != nil {
		return err
	}

	var alvo *repository.ListarUnidadesRow
	for i := range unidades {
		if unidades[i].ID == id {
			alvo = &unidades[i]
		}
	}
	if alvo == nil {
		return helper.ErrNaoEncontrado
	}
	if len(unidades) == 1 {
		return helper.ErrUltimaUnidade
	}
	if alvo.Saldo > 0 || alvo.Funcionarios > 0 {
		return helper.ErrUnidadeEmUso
	}

	linhas, err := s.repo.Desativar(ctx, repository.DesativarUnidadeParams{ID: id, TenantID: tenantID})
	if err != nil {
		return err
	}
	if linhas == 0 {
		return helper.ErrNaoEncontrado
	}

	return nil
}
