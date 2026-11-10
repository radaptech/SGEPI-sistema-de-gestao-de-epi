package controller

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http/httptest"
	"testing"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/helper"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

func TestResponderErro(t *testing.T) {
	casos := []struct {
		nome     string
		err      error
		status   int
		mensagem string
	}{
		{"não encontrado embrulhado", fmt.Errorf("buscando epi: %w", helper.ErrNaoEncontrado), 404, "buscando epi: registro não encontrado"},
		{"linha não achada do pgx", fmt.Errorf("x: %w", pgx.ErrNoRows), 404, helper.ErrNaoEncontrado.Error()},
		{"duplicado do postgres", &pgconn.PgError{Code: helper.PgUniqueViolation, Detail: "Key (cpf)=(1) already exists"}, 409, helper.ErrDadoDuplicado.Error()},
		{"regra de negócio", helper.ErroDeNegocio("estoque insuficiente em Loja 1"), 422, "estoque insuficiente em Loja 1"},
		{"sem acesso à unidade", helper.ErrUnidadeSemAcesso, 403, helper.ErrUnidadeSemAcesso.Error()},
		{"data inválida", helper.ErrDataMenorValidade, 400, helper.ErrDataMenorValidade.Error()},
		// erro não previsto: 500 com a mensagem padrão, sem vazar o texto técnico
		{"erro de infra", errors.New("dial tcp 10.0.0.1:5432: connection refused"), 500, "erro ao salvar"},
		{"código pg não mapeado", &pgconn.PgError{Code: "42P01", Message: "relation \"x\" does not exist"}, 500, "erro ao salvar"},
	}
	gin.SetMode(gin.TestMode)
	for _, c := range casos {
		t.Run(c.nome, func(t *testing.T) {
			w := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(w)
			responderErro(ctx, c.err, "erro ao salvar")

			var corpo map[string]string
			if err := json.Unmarshal(w.Body.Bytes(), &corpo); err != nil {
				t.Fatal(err)
			}
			if w.Code != c.status || corpo["error"] != c.mensagem || len(corpo) != 1 {
				t.Errorf("got %d %v, want %d %q", w.Code, corpo, c.status, c.mensagem)
			}
		})
	}
}
