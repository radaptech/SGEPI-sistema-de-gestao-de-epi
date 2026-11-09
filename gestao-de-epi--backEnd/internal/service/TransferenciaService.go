package service

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/configs"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/database/repository"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/helper"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/model"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/middleware"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Transferência de estoque entre unidades (Fase 7 do docs/PLANO-UNIDADES.md).
// Sai da origem pelo FEFO, como a entrega, e cada lote consumido vira um lote novo no destino
// (mesma NF, lote, validade e valor). Não tem "em trânsito": sai e entra na hora (decisão D6).
// Usa as queries direto, como o DevolucaoService: não há regra de repository a encapsular.
type TransferenciaService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewTransferenciaService(pool *pgxpool.Pool) *TransferenciaService {
	return &TransferenciaService{db: pool, queries: repository.New(pool)}
}

func (s *TransferenciaService) Transferir(ctx context.Context, in model.TransferenciaInserir, idUsuario, tenantId int32) (int32, error) {
	if in.IdUnidadeOrigem == in.IdUnidadeDestino {
		return 0, helper.ErrMesmaUnidade
	}
	// usuário limitado (Fase 6) só manda da loja dele; o destino pode ser qualquer uma
	if !middleware.UnidadePermitida(ctx, in.IdUnidadeOrigem) {
		return 0, helper.ErrUnidadeSemAcesso
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)
	qtx := s.queries.WithTx(tx)

	for _, unidade := range []int32{in.IdUnidadeOrigem, in.IdUnidadeDestino} {
		if err := unidadeAtiva(ctx, qtx, unidade, tenantId); err != nil {
			return 0, err
		}
	}

	idTransferencia, err := qtx.CriarTransferencia(ctx, repository.CriarTransferenciaParams{
		TenantID: tenantId, IDUnidadeOrigem: in.IdUnidadeOrigem, IDUnidadeDestino: in.IdUnidadeDestino,
		IDUsuario: idUsuario, Observacao: in.Observacao,
	})
	if err != nil {
		return 0, helper.TraduzErroPostgres(err)
	}

	for _, item := range in.Itens {
		// FOR UPDATE: duas transferências ou entregas simultâneas não consomem o mesmo saldo
		lotes, err := qtx.ListarLotesParaConsumo(ctx, repository.ListarLotesParaConsumoParams{
			TenantID: tenantId, IDEpi: item.ID_epi, IDTamanho: item.ID_tamanho, IDUnidade: in.IdUnidadeOrigem,
		})
		if err != nil {
			return 0, err
		}

		// confere antes de mexer: depois de copiar para o destino, o "há N em outras unidades"
		// da mensagem contaria o que esta mesma transferência acabou de criar lá
		var saldo int32
		for _, lote := range lotes {
			saldo += lote.QuantidadeAtual
		}
		if saldo < item.Quantidade {
			return 0, faltaNaUnidade(ctx, qtx, item, in.IdUnidadeOrigem, item.Quantidade-saldo, tenantId)
		}

		falta := item.Quantidade
		for _, lote := range lotes {
			if falta <= 0 {
				break
			}
			qtd := min(lote.QuantidadeAtual, falta)

			linhas, err := qtx.AbaterEstoqueLote(ctx, repository.AbaterEstoqueLoteParams{QuantidadeAtual: qtd, ID: lote.ID, TenantID: tenantId})
			if err != nil || linhas == 0 {
				slog.ErrorContext(ctx, "abater lote na transferência", "lote", lote.ID, "tenant", tenantId, "err", err)
				return 0, fmt.Errorf("erro ao abater o lote %d: %w", lote.ID, err)
			}
			if _, err := qtx.CopiarLoteParaUnidade(ctx, repository.CopiarLoteParaUnidadeParams{
				Quantidade: qtd, IDUsuario: idUsuario, IDUnidade: in.IdUnidadeDestino,
				IDTransferencia: pgtype.Int4{Int32: idTransferencia, Valid: true}, IDLote: lote.ID, TenantID: tenantId,
			}); err != nil {
				return 0, helper.TraduzErroPostgres(err)
			}
			falta -= qtd
		}
	}

	return idTransferencia, tx.Commit(ctx)
}

// Cancelar devolve tudo para os lotes de origem. Só dá se o destino não usou nada
// (quantidade_atual = quantidade em todos os lotes criados) e os lotes de origem seguem ativos.
func (s *TransferenciaService) Cancelar(ctx context.Context, id, idUsuario, tenantId int32) error {
	if id <= 0 {
		return helper.ErrId
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	qtx := s.queries.WithTx(tx)

	// primeiro: trava a transferência e recusa o cancelamento duplo
	linhas, err := qtx.MarcarTransferenciaCancelada(ctx, repository.MarcarTransferenciaCanceladaParams{
		ID: id, IDUsuarioCancelamento: pgtype.Int4{Int32: idUsuario, Valid: true}, TenantID: tenantId,
	})
	if err != nil {
		return err
	}
	if linhas == 0 {
		return helper.ErrNaoEncontrado
	}

	lotes, err := qtx.LotesDaTransferencia(ctx, repository.LotesDaTransferenciaParams{IDTransferencia: pgtype.Int4{Int32: id, Valid: true}, TenantID: tenantId})
	if err != nil {
		return err
	}
	usuario := pgtype.Int4{Int32: idUsuario, Valid: true}
	for _, lote := range lotes {
		if !lote.Ativo || lote.QuantidadeAtual != lote.Quantidade {
			return helper.ErrTransferenciaUsada
		}
		if n, err := qtx.DesativarLoteTransferido(ctx, repository.DesativarLoteTransferidoParams{ID: lote.ID, IDUsuarioCancelamento: usuario, TenantID: tenantId}); err != nil || n == 0 {
			return fmt.Errorf("erro ao desativar o lote %d: %w", lote.ID, err)
		}
		n, err := qtx.ReporEstoqueLote(ctx, repository.ReporEstoqueLoteParams{QuantidadeAtual: lote.Quantidade, ID: lote.IDLoteOrigem.Int32, TenantID: tenantId})
		if err != nil {
			return err
		}
		if n == 0 { // lote de origem cancelado depois da transferência
			return helper.ErrTransferenciaUsada
		}
	}

	return tx.Commit(ctx)
}

// Listar traz as 100 transferências mais recentes; idUnidade > 0 só as que saíram dela ou chegaram nela.
func (s *TransferenciaService) Listar(ctx context.Context, tenantId, idUnidade int32) ([]model.TransferenciaDto, error) {
	linhas, err := s.queries.ListarTransferencias(ctx, repository.ListarTransferenciasParams{
		TenantID: tenantId, IDUnidade: pgtype.Int4{Int32: idUnidade, Valid: idUnidade > 0},
	})
	if err != nil {
		return nil, err
	}

	dto := make([]model.TransferenciaDto, 0)
	for _, l := range linhas {
		// as linhas vêm ordenadas por transferência: uma nova começa quando o id muda
		if len(dto) == 0 || dto[len(dto)-1].ID != l.ID {
			dto = append(dto, model.TransferenciaDto{
				ID: l.ID, Data: configs.DataBr(l.CriadoEm.Time), Cancelada: l.CanceladaEm.Valid, Observacao: l.Observacao,
				UnidadeOrigem:  model.UnidadeResumo{ID: l.IDUnidadeOrigem, Nome: l.UnidadeOrigem},
				UnidadeDestino: model.UnidadeResumo{ID: l.IDUnidadeDestino, Nome: l.UnidadeDestino},
				Usuario:        l.Usuario,
			})
		}
		atual := &dto[len(dto)-1]
		atual.Itens = append(atual.Itens, model.TransferenciaItemDto{
			IdEpi: l.IDEpi, EpiNome: l.EpiNome, IdTamanho: l.IDTamanho, TamanhoNome: l.TamanhoNome, Lote: l.Lote, Quantidade: l.Quantidade,
		})
	}

	return dto, nil
}
