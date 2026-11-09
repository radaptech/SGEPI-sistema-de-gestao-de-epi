package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestLimitarUnidade(t *testing.T) {
	gin.SetMode(gin.TestMode)
	casos := []struct {
		nome       string
		permitidas []int32
		url        string
		header     string
		status     int
		querHeader string // X-Unidade-ID que chega na rota
		querQuery  string // id_unidade que sobra na URL
	}{
		{"sem limite passa intacto", nil, "/x?id_unidade=9", "8", 200, "8", "9"},
		{"loja permitida no header", []int32{3, 5}, "/x", "5", 200, "5", ""},
		{"loja de fora no header", []int32{3}, "/x", "2", 403, "", ""},
		{"loja de fora na URL", []int32{3}, "/x?id_unidade=2", "3", 403, "", ""},
		{"todas vira a primeira permitida", []int32{3, 5}, "/x", "", 200, "3", ""},
		{"id_unidade=0 não abre todas", []int32{3}, "/x?id_unidade=0", "", 200, "3", ""},
		{"URL permitida vence o header", []int32{3, 5}, "/x?id_unidade=5&pagina=2", "3", 200, "5", ""},
	}
	for _, tc := range casos {
		t.Run(tc.nome, func(t *testing.T) {
			r := gin.New()
			r.Use(func(c *gin.Context) {
				if tc.permitidas != nil {
					c.Set(UnidadesKey, tc.permitidas)
				}
			}, LimitarUnidade())
			var header, query string
			r.GET("/x", func(c *gin.Context) {
				header, query = c.GetHeader("X-Unidade-ID"), c.Query("id_unidade")
			})
			req := httptest.NewRequest(http.MethodGet, tc.url, nil)
			if tc.header != "" {
				req.Header.Set("X-Unidade-ID", tc.header)
			}
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)
			if w.Code != tc.status {
				t.Fatalf("status: quer %d, veio %d", tc.status, w.Code)
			}
			if tc.status == 200 && (header != tc.querHeader || query != tc.querQuery) {
				t.Errorf("chegou header %q e id_unidade %q; quer %q e %q", header, query, tc.querHeader, tc.querQuery)
			}
		})
	}
}
