package controller

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/helper"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/model"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/middleware"
	"github.com/gin-gonic/gin"
)

type TransferenciaService interface {
	Transferir(ctx context.Context, in model.TransferenciaInserir, idUsuario, tenantId int32) (int32, error)
	Cancelar(ctx context.Context, id, idUsuario, tenantId int32) error
	Listar(ctx context.Context, tenantId, idUnidade int32) ([]model.TransferenciaDto, error)
}

type TransferenciaController struct {
	service TransferenciaService
}

func NewTransferenciaController(service TransferenciaService) *TransferenciaController {
	return &TransferenciaController{service: service}
}

func erroTransferencia(ctx *gin.Context, err error) {
	status := http.StatusInternalServerError
	switch {
	case errors.Is(err, helper.ErrId), errors.Is(err, helper.ErrMesmaUnidade):
		status = http.StatusBadRequest
	case errors.Is(err, helper.ErrUnidadeSemAcesso):
		status = http.StatusForbidden
	case errors.Is(err, helper.ErrNaoEncontrado):
		ctx.JSON(http.StatusNotFound, gin.H{"error": "transferência não encontrada ou já cancelada"})
		return
	case errors.Is(err, helper.ErrTransferenciaUsada):
		status = http.StatusConflict
	case errors.Is(err, helper.ErrUnidadeInvalida), strings.Contains(err.Error(), "estoque insuficiente"):
		status = http.StatusUnprocessableEntity
	default:
		ctx.Error(err)
		ctx.JSON(status, gin.H{"error": "erro ao processar a transferência", "detalhes": err.Error()})
		return
	}
	ctx.JSON(status, gin.H{"error": err.Error()})
}

// usuarioETenant lê o usuário e o tenant da sessão; responde o erro e devolve false se faltar algum.
func usuarioETenant(ctx *gin.Context) (int32, int32, bool) {
	idUsuario, ok := middleware.UserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "sessão sem usuário"})
		return 0, 0, false
	}
	tenantID, ok := tenantDoContexto(ctx)
	return int32(idUsuario), tenantID, ok
}

// Transferir godoc
// @Summary      Transfere EPIs entre unidades
// @Description  Sai da origem pelo FEFO e entra na destino na hora, lote a lote. Falta de saldo → 422; origem fora das unidades do usuário → 403.
// @Tags         Transferencia
// @Accept       json
// @Produce      json
// @Param        transferencia body model.TransferenciaInserir true "Origem, destino e itens"
// @Success      201 {object} map[string]int
// @Router       /transferencias [post]
func (c *TransferenciaController) Transferir() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var in model.TransferenciaInserir
		if err := ctx.ShouldBindJSON(&in); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "dados inválidos", "detalhes": err.Error()})
			return
		}
		idUsuario, tenantID, ok := usuarioETenant(ctx)
		if !ok {
			return
		}

		id, err := c.service.Transferir(ctx, in, idUsuario, tenantID)
		if err != nil {
			erroTransferencia(ctx, err)
			return
		}
		ctx.JSON(http.StatusCreated, gin.H{"id": id})
	}
}

// ListarTransferencias godoc
// @Summary      Lista as transferências
// @Description  As 100 mais recentes. Com a unidade escolhida (X-Unidade-ID ou ?id_unidade=), só as que saíram dela ou chegaram nela.
// @Tags         Transferencia
// @Produce      json
// @Success      200 {array} model.TransferenciaDto
// @Router       /transferencias [get]
func (c *TransferenciaController) Listar() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		tenantID, ok := tenantDoContexto(ctx)
		if !ok {
			return
		}
		lista, err := c.service.Listar(ctx, tenantID, unidadeEscolhida(ctx))
		if err != nil {
			erroTransferencia(ctx, err)
			return
		}
		ctx.JSON(http.StatusOK, lista)
	}
}

// CancelarTransferencia godoc
// @Summary      Cancela uma transferência
// @Description  Devolve o estoque à origem. Recusa (409) se o destino já usou parte dele.
// @Tags         Transferencia
// @Param        id path int true "ID da transferência"
// @Success      204
// @Router       /gerencial/transferencias/{id} [delete]
func (c *TransferenciaController) Cancelar() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		id, err := strconv.Atoi(ctx.Param("id"))
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "id da transferência inválido"})
			return
		}
		idUsuario, tenantID, ok := usuarioETenant(ctx)
		if !ok {
			return
		}
		if err := c.service.Cancelar(ctx, int32(id), idUsuario, tenantID); err != nil {
			erroTransferencia(ctx, err)
			return
		}
		ctx.Status(http.StatusNoContent)
	}
}
