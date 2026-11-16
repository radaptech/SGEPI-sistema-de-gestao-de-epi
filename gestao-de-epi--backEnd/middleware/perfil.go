package middleware

import (
	"net/http"
	"slices"

	"github.com/gin-gonic/gin"
)

// Chaves que Sessao preenche no contexto. Exportadas para os testes simularem
// um usuário logado sem criar sessão no banco.
const (
	UserIDKey   = "userId"
	TenantIDKey = "tenantId"
	RoleKey     = "role"
)

// UserID devolve o usuário logado (posto por Sessao).
func UserID(c *gin.Context) (int64, bool) {
	id, ok := c.Value(UserIDKey).(int64)
	return id, ok
}

// TenantID devolve o tenant da sessão -- autoritativo em qualquer rota já
// autenticada. Não confundir com TenantIDFromHeader: usar o header pra
// autorizar escrita pós-login deixaria um admin do tenant A escrever no
// tenant B só trocando X-Tenant-ID.
func TenantID(c *gin.Context) (int64, bool) {
	id, ok := c.Value(TenantIDKey).(int64)
	return id, ok
}

// Role devolve o perfil do usuário logado.
func Role(c *gin.Context) (string, bool) {
	role, ok := c.Value(RoleKey).(string)
	return role, ok
}

// Require barra a rota pra quem não tem um dos perfis listados. Roda
// sempre depois de Sessao, que é quem põe o Role no contexto.
//
// 403, nunca 401: 401 é "sem sessão" e o front desloga o usuário em
// qualquer 401 fora do login -- alguém sem permissão pra uma rota não
// devia ser expulso do sistema, só barrado ali.
//
// Falha fechada: sem role no contexto (Sessao não rodou antes) nenhum
// perfil casa e a rota nega.
func Require(perfis ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := Role(c)

		if !slices.Contains(perfis, role) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "Acesso negado: privilégios insuficientes",
			})
			return
		}

		c.Next()
	}
}
