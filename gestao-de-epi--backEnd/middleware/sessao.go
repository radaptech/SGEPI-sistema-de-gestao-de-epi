package middleware

import (
	"errors"
	"net/http"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/auth"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/database/repository"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

// Sessao autentica pelo cookie de sessão e põe no contexto o usuário, o tenant
// e o perfil (lidos com UserID/TenantID/Role e usados por Require), o "user_nome"
// e as unidades permitidas (lidas com Unidades; ausente = todas).
func Sessao(q *repository.Queries) gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := c.Cookie(auth.CookieSessao)
		if err != nil || token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Acesso negado, sessão ausente"})
			return
		}

		usuario, err := q.BuscarSessao(c, auth.HashTokenSessao(token))
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Sessão inválida ou expirada"})
				return
			}
			c.Error(err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Erro interno ao validar sessão"})
			return
		}

		c.Set(UserIDKey, int64(usuario.ID))
		c.Set(TenantIDKey, int64(usuario.TenantID.Int32))
		c.Set(RoleKey, usuario.Role.String)
		c.Set("user_nome", usuario.Nome)
		// admin é o gestor da rede: vê todas as unidades mesmo que tenha linhas em usuario_unidade
		if usuario.Role.String != "admin" && len(usuario.Unidades) > 0 {
			c.Set(UnidadesKey, usuario.Unidades)
		}

		c.Next()
	}
}
