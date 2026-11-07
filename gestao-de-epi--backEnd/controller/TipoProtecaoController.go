package controller

import (
	"context"
	"net/http"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/model"
	"github.com/gin-gonic/gin"
)

type TipoProtecaoService interface {
	ListarProtecoes(ctx context.Context) ([]model.TipoProtecaoDto, error)
}

type TipoProtecaoController struct {
	service TipoProtecaoService
}

func NewTipoProtecaoController(service TipoProtecaoService) *TipoProtecaoController {
	return &TipoProtecaoController{service: service}
}

// ListarProtecoes godoc
// @Summary      Grupos de proteção
// @Description  Lista os 9 grupos de proteção do Anexo I da NR-6 (globais, iguais para todas as empresas)
// @Tags         protecao
// @Produce      json
// @Success      200  {array}   model.TipoProtecaoDto
// @Failure      500  {object}  helper.HTTPError "Erro interno"
// @Router       /protecoes [get]
// @Security     BearerAuth
func (t *TipoProtecaoController) ListarProtecoes() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		protecs, err := t.service.ListarProtecoes(ctx)
		if err != nil {
			ctx.Error(err)
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao listar as proteções", "detalhes": err.Error()})
			return
		}
		ctx.JSON(http.StatusOK, protecs)
	}
}
