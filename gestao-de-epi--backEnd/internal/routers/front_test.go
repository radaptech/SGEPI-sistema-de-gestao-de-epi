package routers

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestServirFront(t *testing.T) {
	gin.SetMode(gin.TestMode)
	dir := t.TempDir()
	require.NoError(t, os.MkdirAll(filepath.Join(dir, "assets"), 0o755))
	require.NoError(t, os.WriteFile(filepath.Join(dir, "index.html"), []byte("<div id=root>"), 0o644))
	require.NoError(t, os.WriteFile(filepath.Join(dir, "sw.js"), []byte("// sw"), 0o644))
	require.NoError(t, os.WriteFile(filepath.Join(dir, "assets", "index-abc.js"), []byte("console.log(1)"), 0o644))

	r := gin.New()
	r.GET("/api/me", func(c *gin.Context) { c.String(http.StatusOK, "api") })
	require.True(t, servirFront(r, dir))

	pedir := func(metodo, caminho string) *httptest.ResponseRecorder {
		w := httptest.NewRecorder()
		r.ServeHTTP(w, httptest.NewRequest(metodo, caminho, nil))
		return w
	}

	t.Run("rota do SPA devolve o index.html sem cache e com a CSP do front", func(t *testing.T) {
		w := pedir(http.MethodGet, "/entregas")
		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Body.String(), "root")
		assert.Equal(t, "no-cache", w.Header().Get("Cache-Control"))
		assert.Equal(t, cspFront, w.Header().Get("Content-Security-Policy"))
	})

	t.Run("asset com hash fica em cache para sempre", func(t *testing.T) {
		w := pedir(http.MethodGet, "/assets/index-abc.js")
		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Header().Get("Cache-Control"), "immutable")
	})

	t.Run("sw.js sempre confere a versão nova", func(t *testing.T) {
		w := pedir(http.MethodGet, "/sw.js")
		assert.Equal(t, "no-cache", w.Header().Get("Cache-Control"))
	})

	t.Run("asset que não existe é 404, não o index.html", func(t *testing.T) {
		assert.Equal(t, http.StatusNotFound, pedir(http.MethodGet, "/assets/velho.js").Code)
	})

	t.Run("a API continua respondendo, e rota de API desconhecida é 404 em JSON", func(t *testing.T) {
		assert.Equal(t, "api", pedir(http.MethodGet, "/api/me").Body.String())
		w := pedir(http.MethodGet, "/api/nao-existe")
		assert.Equal(t, http.StatusNotFound, w.Code)
		assert.Contains(t, w.Body.String(), "rota não encontrada")
	})

	t.Run("../ não sai da pasta do front", func(t *testing.T) {
		w := pedir(http.MethodGet, "/../../etc/passwd")
		assert.NotContains(t, w.Body.String(), "root:")
	})

	t.Run("sem index.html não serve nada", func(t *testing.T) {
		assert.False(t, servirFront(gin.New(), t.TempDir()))
	})
}
