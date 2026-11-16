package controller

import (
	"context"
	"net/http"
	"strconv"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/model"
	"github.com/gin-gonic/gin"
)

type PlanosServices interface {
	SalvarPlanos(ctx context.Context, model model.Plano) (int32, error)
	MostrarPlanos(ctx context.Context) ([]model.Plano, error)
	AtualizarPlano(ctx context.Context, input model.AtualizarPlanoParams) error
	AtualizaStatus(ctx context.Context, status string, id int32) error
}

type PlanosController struct {
	service PlanosServices
}

func NewPlanoController(serv PlanosServices) *PlanosController {

	return &PlanosController{
		service: serv,
	}
}

func (p *PlanosController) SalvarPlano() gin.HandlerFunc {

	return func(ctx *gin.Context) {

		var input model.Plano

		if err := ctx.ShouldBindJSON(&input); err != nil {

			ctx.JSON(http.StatusBadRequest, gin.H{

				"error": err.Error(),
			})
			return
		}

		idPlano, err := p.service.SalvarPlanos(ctx, input)
		if err != nil {

			responderErro(ctx, err, "erro interno do servidor")
			return
		}

		ctx.JSON(http.StatusCreated, idPlano)
	}
}

func (p *PlanosController) MostrarPlanos() gin.HandlerFunc {

	return func(ctx *gin.Context) {

		planos, err := p.service.MostrarPlanos(ctx)
		if err != nil {

			responderErro(ctx, err, "Erro interno ao listar funcoes")
			return
		}

		ctx.JSON(http.StatusOK, planos)
	}
}

func (p *PlanosController) Atualizar() gin.HandlerFunc {

	return func(ctx *gin.Context) {

		idparam := ctx.Param("id")
		id, err := strconv.Atoi(idparam)
		if err != nil {
			ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "ID do plano inválido"})
			return
		}

		var input model.AtualizarPlanoParams
		if err := ctx.ShouldBindJSON(&input); err != nil {
			ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
			return
		}

		input.ID = int32(id)

		err = p.service.AtualizarPlano(ctx, input)
		if err != nil {

			responderErro(ctx, err, "erro ao atualizar o plano")
			return
		}

		ctx.JSON(http.StatusOK, gin.H{

			"sucesso": "plano atualizado",
		})

	}
}

func (p *PlanosController) AtualizaStatus() gin.HandlerFunc {

	return func(ctx *gin.Context) {

		idparam := ctx.Param("id")
		id, err := strconv.Atoi(idparam)
		if err != nil {
			ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
				"error": "id inválido",
			})
			return
		}

		var input struct {
			Status string `json:"status" binding:"required"`
		}

		if err := ctx.ShouldBindBodyWithJSON(&input); err != nil {

			ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{

				"error": "campo status nao preenchido",
			})
			return
		}

		err = p.service.AtualizaStatus(ctx, input.Status, int32(id))
		if err != nil {

			responderErro(ctx, err, "erro ao atualizar o status do banco")
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"sucesso": "status atualizado com sucesso"})
	}
}
