package service

import (
	"context"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/database/repository"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/model"
)

type ProtecaoRepository interface {
	ListarProtecoes(ctx context.Context) ([]repository.BuscarTodasProtecoesRow, error)
}

// ProtecaoService expõe os 9 grupos do Anexo I da NR-6. São globais e fixos (migração 000040):
// não há cadastro nem exclusão.
type ProtecaoService struct {
	repo ProtecaoRepository
}

func NewProtecaoService(p ProtecaoRepository) *ProtecaoService {
	return &ProtecaoService{repo: p}
}

func (p *ProtecaoService) ListarProtecoes(ctx context.Context) ([]model.TipoProtecaoDto, error) {
	protec, err := p.repo.ListarProtecoes(ctx)
	if err != nil {
		return nil, err
	}

	dtos := make([]model.TipoProtecaoDto, 0, len(protec))
	for _, prot := range protec {
		dtos = append(dtos, model.TipoProtecaoDto{ID: int64(prot.ID), Nome: prot.Nome})
	}
	return dtos, nil
}
