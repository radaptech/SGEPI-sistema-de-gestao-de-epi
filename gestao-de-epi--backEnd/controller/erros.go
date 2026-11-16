package controller

import (
	"errors"
	"net/http"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/helper"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// statusDoErro diz qual status HTTP um erro do service merece. 0 = erro não previsto (500).
func statusDoErro(err error) int {
	var negocio helper.ErroDeNegocio
	if errors.As(err, &negocio) {
		return http.StatusUnprocessableEntity
	}

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case helper.PgUniqueViolation:
			return http.StatusConflict
		case helper.PgForeignKeyViolation, helper.PgCheckViolation:
			return http.StatusUnprocessableEntity
		case helper.PgNotNullViolation, helper.PgNumericOverflow, helper.PgInvalidTextRep:
			return http.StatusBadRequest
		case helper.PgDeadlockDetected:
			return http.StatusServiceUnavailable
		}
		return 0
	}

	if errors.Is(err, pgx.ErrNoRows) {
		return http.StatusNotFound
	}

	for status, erros := range map[int][]error{
		http.StatusBadRequest: {helper.ErrId, helper.ErrCampoObrigatorio, helper.ErrNomeCurto, helper.ErrDataIgual,
			helper.ErrDataMenor, helper.ErrDataMenorValidade, helper.ErrCpfInvalido, helper.ErrMesmaUnidade,
			helper.ErrSubdominioInvalido, helper.ErrUnidadeObrigatoria},
		http.StatusUnauthorized: {helper.ErrSessaoExpirada},
		http.StatusForbidden:    {helper.ErrUnidadeSemAcesso, helper.ErrLimiteExcedido},
		http.StatusNotFound:     {helper.ErrNaoEncontrado},
		http.StatusConflict: {helper.ErrDadoDuplicado, helper.ErrTransferenciaUsada, helper.ErrUnidadeEmUso,
			helper.ErrUltimaUnidade},
		http.StatusUnprocessableEntity: {helper.ErrConflitoIntegridade, helper.ErrEstoqueInsuficiente,
			helper.ErrCaVencido, helper.ErrUnidadeInvalida},
	} {
		for _, alvo := range erros {
			if errors.Is(err, alvo) {
				return status
			}
		}
	}
	return 0
}

// responderErro responde o erro de um service. Erro previsto: status certo e a mensagem dele, que já é
// escrita para o usuário. Erro não previsto: 500 com msgPadrao, e o erro técnico só vai para o log
// (antes ia em "detalhes" e o front mostrava SQL cru na tela).
func responderErro(ctx *gin.Context, err error, msgPadrao string) {
	if status := statusDoErro(err); status != 0 {
		ctx.JSON(status, gin.H{"error": mensagemDoErro(err)})
		return
	}
	ctx.Error(err)
	ctx.JSON(http.StatusInternalServerError, gin.H{"error": msgPadrao})
}

// mensagemDoErro troca o erro cru do Postgres pela versão de negócio; o resto já vem legível.
func mensagemDoErro(err error) string {
	if errors.Is(err, pgx.ErrNoRows) {
		return helper.ErrNaoEncontrado.Error()
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return helper.TraduzErroPostgres(pgErr).Error()
	}
	return err.Error()
}
