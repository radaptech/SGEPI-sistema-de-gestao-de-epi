package routers

import (
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

// Imagem única: o Go entrega o build do Vite (pasta FRONT_DIR) e a API em /api, no mesmo endereço.
// Em dev o front roda no próprio Vite e FRONT_DIR fica vazio.

// cspFront é mais aberta que o "default-src 'self'" da API só no necessário: data:/blob: para a
// prévia da assinatura e da logo, e estilo inline porque o react-toastify injeta <style>.
// Script continua só do próprio domínio (o do tema no index.html virou /tema.js por isso).
const cspFront = "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; " +
	"font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"

// servirFront devolve false quando não há front para servir (pasta vazia ou sem index.html).
func servirFront(r *gin.Engine, dir string) bool {
	if dir == "" {
		return false
	}
	index := filepath.Join(dir, "index.html")
	if _, err := os.Stat(index); err != nil {
		slog.Warn("FRONT_DIR sem index.html: só a API vai responder", "dir", dir, "err", err)
		return false
	}

	r.NoRoute(func(c *gin.Context) {
		caminho := c.Request.URL.Path
		if caminho == "/api" || strings.HasPrefix(caminho, "/api/") ||
			(c.Request.Method != http.MethodGet && c.Request.Method != http.MethodHead) {
			c.JSON(http.StatusNotFound, gin.H{"error": "rota não encontrada"})
			return
		}

		c.Header("Content-Security-Policy", cspFront)
		// Clean a partir de "/" impede sair da pasta com ../
		arquivo := filepath.Join(dir, filepath.Clean("/"+caminho))
		if info, err := os.Stat(arquivo); err == nil && !info.IsDir() {
			if strings.HasPrefix(caminho, "/assets/") {
				// o nome tem o hash do conteúdo: pode ficar em cache para sempre
				c.Header("Cache-Control", "public, max-age=31536000, immutable")
			} else {
				// index.html, sw.js, manifest: sempre confere, senão o PWA segura a versão velha
				c.Header("Cache-Control", "no-cache")
			}
			c.File(arquivo)
			return
		}
		if strings.HasPrefix(caminho, "/assets/") {
			// arquivo de um build antigo: 404, não o index.html no lugar de um .js
			c.Status(http.StatusNotFound)
			return
		}

		// rota do SPA (/entregas, /estoque...): quem resolve é o React
		c.Header("Cache-Control", "no-cache")
		c.File(index)
	})
	return true
}
