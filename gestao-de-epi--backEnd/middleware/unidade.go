package middleware

import (
	"context"
	"net/http"
	"slices"
	"strconv"

	"github.com/gin-gonic/gin"
)

// UnidadesKey guarda as unidades que o usuário pode ver ([]int32). Ausente = todas.
const UnidadesKey = "unidades"

// Unidades devolve as unidades permitidas ao usuário logado; nil = todas.
// Aceita context.Context porque o service recebe o *gin.Context como ctx,
// e o gin.Context.Value acha as chaves string postas com c.Set.
func Unidades(ctx context.Context) []int32 {
	u, _ := ctx.Value(UnidadesKey).([]int32)
	return u
}

// UnidadePermitida diz se o usuário logado pode mexer na unidade.
func UnidadePermitida(ctx context.Context, id int32) bool {
	u := Unidades(ctx)
	return u == nil || slices.Contains(u, id)
}

// LimitarUnidade barra (403) o usuário limitado que pede uma unidade fora das dele,
// no ?id_unidade= ou no X-Unidade-ID. Depois deixa a unidade só no header: a escolhida
// ou, sem escolha ("todas"), a primeira permitida. O ?id_unidade= sai da URL para que
// nem um "?id_unidade=0" no bind do filtro volte a mostrar todas. Roda depois de Sessao.
//
// ponytail: usuário com 2+ lojas não tem a visão "todas" das lojas dele, só uma por vez;
// para ter, os filtros id_unidade das queries viram int[] com ANY.
func LimitarUnidade() gin.HandlerFunc {
	return func(c *gin.Context) {
		permitidas := Unidades(c)
		if permitidas == nil {
			c.Next()
			return
		}

		// URL.Query() e não c.Query(): c.Query guarda cache, e a URL vai mudar logo abaixo
		query := c.Request.URL.Query()
		efetiva := int32(0)
		for _, valor := range []string{query.Get("id_unidade"), c.GetHeader("X-Unidade-ID")} {
			id, err := strconv.Atoi(valor)
			if err != nil || id <= 0 {
				continue
			}
			if !slices.Contains(permitidas, int32(id)) {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Acesso negado: você não tem acesso a esta unidade"})
				return
			}
			if efetiva == 0 {
				efetiva = int32(id)
			}
		}
		if efetiva == 0 {
			efetiva = permitidas[0]
		}

		c.Request.Header.Set("X-Unidade-ID", strconv.Itoa(int(efetiva)))
		query.Del("id_unidade")
		c.Request.URL.RawQuery = query.Encode()

		c.Next()
	}
}
