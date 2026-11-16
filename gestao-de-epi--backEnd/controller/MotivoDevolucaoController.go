package controller

import (
	"context"
	"net/http"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/model"
	"github.com/gin-gonic/gin"
)

type MotivoService interface {
	ListarMotivos(ctx context.Context) ([]model.MotivoDevolucaoEpiDto, error)
}

type MotivoController struct {
	service MotivoService
}

func NewMotivoController(service MotivoService) *MotivoController {

	return &MotivoController{
		service: service,
	}
}

// ListarMotivo godoc
// @Summary      Lista os motivos de devolução
// @Description  Lista global e pronta, igual para todas as empresas. gera_descarte=true: o EPI não volta ao estoque.
// @Tags         Devolucao
// @Produce      json
// @Success      200 {array} model.MotivoDevolucaoEpiDto
// @Router       /motivos [get]
func (m *MotivoController) ListarMotivo() gin.HandlerFunc {

	return func(ctx *gin.Context) {

		motivos, err := m.service.ListarMotivos(ctx)
		if err != nil {

			responderErro(ctx, err, "erro ao mostrar os motivos da devolucao")
			return
		}

		ctx.JSON(http.StatusOK, motivos)
	}
}
