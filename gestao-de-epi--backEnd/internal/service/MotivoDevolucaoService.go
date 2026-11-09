package service

import (
	"context"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/database/repository"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/model"
)

// Os motivos de devolução são uma lista global pronta (migração 000041); o tenant só lê.
type MotivoDevolucaoRepository interface {
	ListarMotivos(ctx context.Context) ([]repository.MotivoDevolucao, error)
	Descarte(ctx context.Context, id int32) (bool, error)
	ConsultaSaldo(ctx context.Context, arg repository.ConsultarSaldoEpiFuncionarioParams) (int32, error)
}

type MotivoDevolucaoService struct {
	repo MotivoDevolucaoRepository
}

func NewMotivoDevolucaoRepositoryServe(m MotivoDevolucaoRepository) *MotivoDevolucaoService {

	return &MotivoDevolucaoService{repo: m}
}

func (m *MotivoDevolucaoService) ListarMotivos(ctx context.Context) ([]model.MotivoDevolucaoEpiDto, error) {

	motivos, err := m.repo.ListarMotivos(ctx)
	if err != nil {

		return []model.MotivoDevolucaoEpiDto{}, err
	}

	dto := make([]model.MotivoDevolucaoEpiDto, 0, len(motivos))
	for _, mot := range motivos {
		dto = append(dto, model.MotivoDevolucaoEpiDto{
			Id:           int(mot.ID),
			Motivo:       mot.Motivo,
			GeraDescarte: mot.GeraDescarte,
		})
	}

	return dto, nil
}
