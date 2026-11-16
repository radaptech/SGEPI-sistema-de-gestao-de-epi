package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"regexp"
	"time"
)

const DuracaoSessao = 24 * time.Hour

var subdominioValido = regexp.MustCompile(`^[a-z0-9-]+$`)

// CookieSessao é o nome do cookie de sessão da empresa do subdomínio (header X-Tenant-ID).
// A API fica num host só para todas as empresas: com um cookie único, o login no painel valia
// em qualquer subdomínio e entrar numa empresa em outra aba derrubava a outra sessão.
// Subdomínio inválido devolve "", que nunca casa com cookie nenhum.
func CookieSessao(subdominio string) string {
	if !subdominioValido.MatchString(subdominio) {
		return ""
	}
	return "sessao_" + subdominio
}

// GerarTokenSessao devolve o token que vai no cookie e o hash que vai pro banco.
func GerarTokenSessao() (token, hash string) {
	token = rand.Text()
	return token, HashTokenSessao(token)
}

func HashTokenSessao(token string) string {
	soma := sha256.Sum256([]byte(token))
	return hex.EncodeToString(soma[:])
}
