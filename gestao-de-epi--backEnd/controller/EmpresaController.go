package controller

import (
	"context"
	"errors"
	"io"
	"strconv"

	"net/http"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/helper"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/model"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/middleware"
	"github.com/gin-gonic/gin"
)

type EmpresaService interface {
	Salvar(ctx context.Context, model model.EmpresaInserir) error
	EmpresaDashboard(ctx context.Context) (model.ResumoDashboard, error)
	EmpresaRecentes(ctx context.Context) ([]model.EmpresaRecente, error)
	Alertas(ctx context.Context) ([]model.AlertaMaster, error)
	DadosEmpresas(ctx context.Context) ([]model.Empresa, error)
	EditarEmpresa(ctx context.Context, id int32, model model.EditarEmpresaRequest) error
	SalvarLogo(ctx context.Context, tenantId int32, arquivo []byte) error
	RemoverLogo(ctx context.Context, tenantId int32) error
	Logo(ctx context.Context, tenantId int32) ([]byte, error)
}

type EmpresaController struct {
	service EmpresaService
}

func NewEmpresaController(serv EmpresaService) *EmpresaController {

	return &EmpresaController{
		service: serv,
	}
}

// Salvar godoc
// @Summary      Criar empresa
// @Description  Cadastra uma nova empresa no sistema
// @Tags         Empresas
// @Accept       json
// @Produce      json
// @Param        empresa body model.EmpresaInserir true "Dados da empresa"
// @Success      201  {object}  map[string]string "Empresa criada"
// @Failure      400  {object}  helper.HTTPError "Dados inválidos"
// @Failure      500  {object}  helper.HTTPError "Erro interno"
// @Router       /empresa [post]
// @Security     BearerAuth
func (e *EmpresaController) Salvar() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var input model.EmpresaInserir

		if err := ctx.ShouldBindJSON(&input); err != nil {

			ctx.JSON(http.StatusBadRequest, gin.H{
				"error":    "Dados inválidos ou formato incorreto.",
				"detalhes": err.Error(),
			})
			return
		}

		err := e.service.Salvar(ctx, input)
		if errors.Is(err, helper.ErrSubdominioInvalido) {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err != nil {

			responderErro(ctx, err, "Erro ao salvar empresa no banco de dados.")
			return
		}

		ctx.JSON(http.StatusCreated, gin.H{
			"sucesso": "Empresa cadastrada com sucesso",
		})
	}
}

// ResumoDashboard godoc
// @Summary      Dashboard
// @Description  Retorna o resumo para o dashboard da empresa
// @Tags         Empresas
// @Produce      json
// @Success      200  {object}  model.ResumoDashboard
// @Failure      500  {object}  helper.HTTPError "Erro interno"
// @Router       /dashboard [get]
// @Security     BearerAuth
func (e *EmpresaController) ResumoDashboard() gin.HandlerFunc {

	return func(ctx *gin.Context) {

		resumo, err := e.service.EmpresaDashboard(ctx)
		if err != nil {
			responderErro(ctx, err, "erro ao realizar buscar dos dados do Dashbord")
			return
		}

		ctx.JSON(http.StatusOK, resumo)
	}
}

// AlertasMaster godoc
// @Summary      Alertas do painel master
// @Description  Empresas com vencimento passado (nível alto), vencendo em até 7 dias ou sem nenhum acesso há 14 dias (nível medio).
// @Tags         Empresas
// @Produce      json
// @Success      200  {array}   model.AlertaMaster
// @Router       /master/dashboard/alertas [get]
func (e *EmpresaController) Alertas() gin.HandlerFunc {

	return func(ctx *gin.Context) {

		alertas, err := e.service.Alertas(ctx)
		if err != nil {
			responderErro(ctx, err, "erro ao buscar os alertas")
			return
		}

		ctx.JSON(http.StatusOK, alertas)
	}
}

// EmpresaRecentes godoc
// @Summary      Empresas recentes
// @Description  Lista as empresas adicionadas recentemente
// @Tags         Empresas
// @Produce      json
// @Success      200  {array}   model.EmpresaRecente
// @Failure      500  {object}  helper.HTTPError "Erro interno"
// @Router       /empresas/recentes [get]
// @Security     BearerAuth
func (e *EmpresaController) EmpresaRecentes() gin.HandlerFunc {

	return func(ctx *gin.Context) {

		empresa, err := e.service.EmpresaRecentes(ctx)
		if err != nil {
			responderErro(ctx, err, "erro ao realizar buscar dos dados das empresas")
			return
		}

		ctx.JSON(http.StatusOK, empresa)

	}
}

// DadosEmpresas godoc
// @Summary      Listar empresas
// @Description  Retorna uma lista com todas as empresas
// @Tags         Empresas
// @Produce      json
// @Success      200  {array}   model.Empresa
// @Failure      500  {object}  helper.HTTPError "Erro interno"
// @Router       /empresas [get]
// @Security     BearerAuth
func (e *EmpresaController) DadosEmpresas() gin.HandlerFunc {

	return func(ctx *gin.Context) {

		empresa, err := e.service.DadosEmpresas(ctx)
		if err != nil {
			responderErro(ctx, err, "erro ao realizar buscar dos dados das empresas")
			return
		}

		ctx.JSON(http.StatusOK, empresa)

	}
}

// EditarEmpresa godoc
// @Summary      Editar empresa
// @Description  Atualiza os dados de uma empresa existente
// @Tags         Empresas
// @Accept       json
// @Produce      json
// @Param        id   path      int                    true  "ID da empresa"
// @Param        body body      model.EditarEmpresaRequest true  "Dados para atualização"
// @Success      204  "Sem conteúdo (Sucesso)"
// @Failure      400  {object}  helper.HTTPError "ID ou dados inválidos"
// @Failure      500  {object}  helper.HTTPError "Erro interno"
// @Router       /empresa/{id} [put]
// @Security     BearerAut
func (e *EmpresaController) EditarEmpresa() gin.HandlerFunc {

	return func(ctx *gin.Context) {

		idparam := ctx.Param("id")
		id, err := strconv.Atoi(idparam)
		if err != nil {
			ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "ID do plano inválido"})
			return
		}
		var input model.EditarEmpresaRequest

		if err := ctx.ShouldBindJSON(&input); err != nil {

			ctx.JSON(http.StatusBadRequest, gin.H{"error": "dados inválidos", "detalhes": err.Error()})
			return
		}

		err = e.service.EditarEmpresa(ctx, int32(id), input)
		if err != nil {

			responderErro(ctx, err, "erro ao editar empresa")
			return
		}

		ctx.Status(http.StatusNoContent)
	}
}

func tenantDaSessao(ctx *gin.Context) (int32, bool) {
	id, ok := middleware.TenantID(ctx)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "erro interno de tenant"})
	}
	return int32(id), ok
}

// SalvarLogo godoc
// @Summary      Enviar a logo da empresa
// @Description  PNG ou JPG de até 2 MB (campo "file"). Vai no cabeçalho das fichas em PDF.
// @Tags         Empresas
// @Accept       multipart/form-data
// @Param        file formData file true "Logo (PNG ou JPG)"
// @Success      204
// @Failure      422  {object}  map[string]string
// @Security     BearerAuth
// @Router       /gerencial/empresa/logo [put]
func (e *EmpresaController) SalvarLogo() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		tenantId, ok := tenantDaSessao(ctx)
		if !ok {
			return
		}
		arquivo, err := ctx.FormFile("file")
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Selecione o arquivo da logo."})
			return
		}
		if arquivo.Size > helper.TamanhoMaximoLogo {
			responderErro(ctx, helper.ErrLogoGrande, "")
			return
		}
		f, err := arquivo.Open()
		if err != nil {
			responderErro(ctx, err, "erro ao ler a logo")
			return
		}
		defer f.Close()
		dados, err := io.ReadAll(io.LimitReader(f, helper.TamanhoMaximoLogo+1))
		if err != nil {
			responderErro(ctx, err, "erro ao ler a logo")
			return
		}
		if err := e.service.SalvarLogo(ctx, tenantId, dados); err != nil {
			responderErro(ctx, err, "erro ao salvar a logo")
			return
		}
		ctx.Status(http.StatusNoContent)
	}
}

// RemoverLogo godoc
// @Summary      Remover a logo da empresa
// @Tags         Empresas
// @Success      204
// @Security     BearerAuth
// @Router       /gerencial/empresa/logo [delete]
func (e *EmpresaController) RemoverLogo() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		tenantId, ok := tenantDaSessao(ctx)
		if !ok {
			return
		}
		if err := e.service.RemoverLogo(ctx, tenantId); err != nil {
			responderErro(ctx, err, "erro ao remover a logo")
			return
		}
		ctx.Status(http.StatusNoContent)
	}
}

// Logo godoc
// @Summary      Logo da empresa
// @Description  PNG da logo; 204 sem corpo quando a empresa não tem (o front mostra toast em todo não-2xx).
// @Tags         Empresas
// @Produce      image/png
// @Success      200
// @Success      204
// @Security     BearerAuth
// @Router       /empresa/logo [get]
func (e *EmpresaController) Logo() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		tenantId, ok := tenantDaSessao(ctx)
		if !ok {
			return
		}
		logo, err := e.service.Logo(ctx, tenantId)
		if err != nil {
			responderErro(ctx, err, "erro ao buscar a logo")
			return
		}
		if logo == nil {
			ctx.Status(http.StatusNoContent)
			return
		}
		ctx.Header("Cache-Control", "no-store")
		ctx.Data(http.StatusOK, "image/png", logo)
	}
}
