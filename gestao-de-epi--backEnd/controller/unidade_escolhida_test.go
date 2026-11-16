package controller

import (
	"net/http/httptest"
	"testing"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/service"
	"github.com/gin-gonic/gin"
)

// A loja escolhida no topo chega pelo header; o ?id_unidade= explícito da tela vence.
func TestUnidadeEscolhida(t *testing.T) {
	gin.SetMode(gin.TestMode)
	casos := []struct {
		url, header string
		quer        int32
	}{
		{"/x", "", 0},
		{"/x", "7", 7},
		{"/x?id_unidade=3", "7", 3},
		{"/x?id_unidade=abc", "", 0},
		{"/x", "-2", 0},
	}
	for _, c := range casos {
		ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
		ctx.Request = httptest.NewRequest("GET", c.url, nil)
		if c.header != "" {
			ctx.Request.Header.Set("X-Unidade-ID", c.header)
		}
		if got := unidadeEscolhida(ctx); got != c.quer {
			t.Errorf("%s com header %q: quer %d, veio %d", c.url, c.header, c.quer, got)
		}
		// o filtro paginado começa com a unidade escolhida e o bind só troca se a URL trouxer id_unidade
		filtro := service.FiltroEntradas{IdUnidade: unidadeEscolhida(ctx)}
		if err := ctx.ShouldBindQuery(&filtro); err == nil && filtro.IdUnidade != c.quer {
			t.Errorf("%s com header %q: filtro quer %d, veio %d", c.url, c.header, c.quer, filtro.IdUnidade)
		}
	}
}
