package controller

import (
	"context"
	"errors"
	"net/http"
	"strconv"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/helper"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/model"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/middleware"
	"github.com/gin-gonic/gin"
)

type UnidadeService interface {
	Criar(ctx context.Context, input model.UnidadeInserir, tenantID int32) (model.UnidadeDto, error)
	Listar(ctx context.Context, tenantID int32, permitidas []int32) ([]model.UnidadeDto, error)
	Acessos(ctx context.Context, tenantID int32) ([]model.AcessoUnidadeDto, error)
	DefinirAcesso(ctx context.Context, usuarioID int32, input model.AcessoUnidadeInserir, tenantID int32) error
	Renomear(ctx context.Context, id int32, input model.UnidadeInserir, tenantID int32) error
	Desativar(ctx context.Context, id int32, tenantID int32) error
}

type UnidadeController struct {
	service UnidadeService
}

func NewUnidadeController(service UnidadeService) *UnidadeController {

	return &UnidadeController{service: service}
}

// erroUnidade converte os erros de domínio da unidade em status HTTP.
func erroUnidade(ctx *gin.Context, err error) {

	status, msg := http.StatusInternalServerError, "erro ao processar a unidade"
	switch {
	case errors.Is(err, helper.ErrId):
		status, msg = http.StatusBadRequest, "id da unidade inválido"
	case errors.Is(err, helper.ErrNomeCurto):
		status, msg = http.StatusBadRequest, "o nome da unidade precisa ter pelo menos 2 letras"
	case errors.Is(err, helper.ErrDadoDuplicado):
		status, msg = http.StatusConflict, "já existe uma unidade com esse nome"
	case errors.Is(err, helper.ErrNaoEncontrado):
		status, msg = http.StatusNotFound, "unidade não encontrada"
	case errors.Is(err, helper.ErrLimiteExcedido):
		status, msg = http.StatusForbidden, "o plano da empresa chegou ao limite de unidades"
	case errors.Is(err, helper.ErrUltimaUnidade):
		status, msg = http.StatusConflict, "a empresa precisa ter pelo menos uma unidade"
	case errors.Is(err, helper.ErrConflitoIntegridade):
		status, msg = http.StatusUnprocessableEntity, "usuário ou unidade não encontrados"
	case errors.Is(err, helper.ErrUnidadeEmUso):
		status, msg = http.StatusConflict, "transfira o estoque e os funcionários desta unidade antes de desativá-la"
	default:
		// só o erro inesperado leva detalhes: o front mostra error + detalhes juntos no toast
		ctx.Error(err)
		ctx.JSON(status, gin.H{"error": msg, "detalhes": err.Error()})
		return
	}

	ctx.JSON(status, gin.H{"error": msg})
}

func tenantDoContexto(ctx *gin.Context) (int32, bool) {

	id, ok := middleware.TenantID(ctx)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "erro interno de tenant"})
	}

	return int32(id), ok
}

func idDaRota(ctx *gin.Context) (int32, bool) {

	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "id da unidade inválido"})
		return 0, false
	}

	return int32(id), true
}

// ListarUnidades godoc
// @Summary      Lista as unidades da empresa
// @Description  Lojas, obras ou almoxarifados do tenant, com funcionários ativos e saldo de EPI em cada uma.
// @Tags         Unidade
// @Produce      json
// @Param        destinos query string false "1 = todas as unidades, para o destino da transferência (usuário limitado recebe só id e nome)"
// @Success      200 {array} model.UnidadeDto
// @Router       /unidades [get]
func (c *UnidadeController) Listar() gin.HandlerFunc {

	return func(ctx *gin.Context) {

		tenantID, ok := tenantDoContexto(ctx)
		if !ok {
			return
		}

		// usuário limitado vê só as unidades dele (o seletor do topo também).
		// ?destinos=1: todas, para escolher o destino de uma transferência, mas sem os números das outras
		permitidas := middleware.Unidades(ctx)
		destinos := ctx.Query("destinos") != "" && permitidas != nil
		if destinos {
			permitidas = nil
		}
		unidades, err := c.service.Listar(ctx, tenantID, permitidas)
		if err != nil {
			erroUnidade(ctx, err)
			return
		}
		if destinos {
			for i := range unidades {
				unidades[i].Funcionarios, unidades[i].Saldo = 0, 0
			}
		}

		ctx.JSON(http.StatusOK, unidades)
	}
}

// CriarUnidade godoc
// @Summary      Cadastra uma unidade
// @Tags         Unidade
// @Accept       json
// @Produce      json
// @Param        unidade body model.UnidadeInserir true "Nome da unidade"
// @Success      201 {object} model.UnidadeDto
// @Router       /gerencial/unidades [post]
func (c *UnidadeController) Criar() gin.HandlerFunc {

	return func(ctx *gin.Context) {

		var input model.UnidadeInserir
		if err := ctx.ShouldBindJSON(&input); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "dados inválidos", "detalhes": err.Error()})
			return
		}

		tenantID, ok := tenantDoContexto(ctx)
		if !ok {
			return
		}

		unidade, err := c.service.Criar(ctx, input, tenantID)
		if err != nil {
			erroUnidade(ctx, err)
			return
		}

		ctx.JSON(http.StatusCreated, unidade)
	}
}

// RenomearUnidade godoc
// @Summary      Renomeia uma unidade
// @Tags         Unidade
// @Accept       json
// @Param        id path int true "ID da unidade"
// @Param        unidade body model.UnidadeInserir true "Novo nome"
// @Success      204
// @Router       /gerencial/unidades/{id} [patch]
func (c *UnidadeController) Renomear() gin.HandlerFunc {

	return func(ctx *gin.Context) {

		id, ok := idDaRota(ctx)
		if !ok {
			return
		}

		var input model.UnidadeInserir
		if err := ctx.ShouldBindJSON(&input); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "dados inválidos", "detalhes": err.Error()})
			return
		}

		tenantID, ok := tenantDoContexto(ctx)
		if !ok {
			return
		}

		if err := c.service.Renomear(ctx, id, input, tenantID); err != nil {
			erroUnidade(ctx, err)
			return
		}

		ctx.Status(http.StatusNoContent)
	}
}

// DesativarUnidade godoc
// @Summary      Desativa uma unidade
// @Description  Recusa (409) a última unidade da empresa e a que ainda tem estoque ou funcionários ativos.
// @Tags         Unidade
// @Param        id path int true "ID da unidade"
// @Success      204
// @Router       /gerencial/unidades/{id} [delete]
func (c *UnidadeController) Desativar() gin.HandlerFunc {

	return func(ctx *gin.Context) {

		id, ok := idDaRota(ctx)
		if !ok {
			return
		}

		tenantID, ok := tenantDoContexto(ctx)
		if !ok {
			return
		}

		if err := c.service.Desativar(ctx, id, tenantID); err != nil {
			erroUnidade(ctx, err)
			return
		}

		ctx.Status(http.StatusNoContent)
	}
}

// AcessosUnidades godoc
// @Summary      Lista quem vê quais unidades
// @Description  Usuários ativos da empresa com as unidades que cada um pode ver. Vazio = todas; admin sempre vê todas.
// @Tags         Unidade
// @Produce      json
// @Success      200 {array} model.AcessoUnidadeDto
// @Router       /gerencial/unidades/acessos [get]
func (c *UnidadeController) Acessos() gin.HandlerFunc {

	return func(ctx *gin.Context) {

		tenantID, ok := tenantDoContexto(ctx)
		if !ok {
			return
		}

		acessos, err := c.service.Acessos(ctx, tenantID)
		if err != nil {
			erroUnidade(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, acessos)
	}
}

// DefinirAcessoUnidades godoc
// @Summary      Limita o usuário a algumas unidades
// @Description  Troca a lista inteira. Lista vazia = todas as unidades. Não vale para admin, que sempre vê todas.
// @Tags         Unidade
// @Accept       json
// @Param        id path int true "ID do usuário"
// @Param        acesso body model.AcessoUnidadeInserir true "Unidades permitidas"
// @Success      204
// @Router       /gerencial/usuarios/{id}/unidades [put]
func (c *UnidadeController) DefinirAcesso() gin.HandlerFunc {

	return func(ctx *gin.Context) {

		id, err := strconv.Atoi(ctx.Param("id"))
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "id do usuário inválido"})
			return
		}

		var input model.AcessoUnidadeInserir
		if err := ctx.ShouldBindJSON(&input); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "dados inválidos", "detalhes": err.Error()})
			return
		}

		tenantID, ok := tenantDoContexto(ctx)
		if !ok {
			return
		}

		if err := c.service.DefinirAcesso(ctx, int32(id), input, tenantID); err != nil {
			erroUnidade(ctx, err)
			return
		}

		ctx.Status(http.StatusNoContent)
	}
}

// unidadeEscolhida diz de qual unidade as listagens e o dashboard mostram dados (0 = todas).
// Vale o ?id_unidade= da URL, quando a tela filtra explicitamente; senão, o header
// X-Unidade-ID, que o front manda com a loja escolhida no topo.
// Uma unidade de outro tenant não vaza nada: toda query filtra tenant_id antes.
// Para usuário limitado, middleware.LimitarUnidade já validou e deixou a unidade só no header.
func unidadeEscolhida(ctx *gin.Context) int32 {
	valor := ctx.Query("id_unidade")
	if valor == "" {
		valor = ctx.GetHeader("X-Unidade-ID")
	}
	id, err := strconv.Atoi(valor)
	if err != nil || id < 0 {
		return 0
	}
	return int32(id)
}
