package service

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/configs"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/database/repository"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/helper"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/model"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/middleware"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

// EntregaRepository com TODAS as funções necessárias para o sistema
type EntregaRepository interface {
	AdicionarEntrega(ctx context.Context, qtx *repository.Queries, args repository.AddEntregaEpiParams) (int32, error)
	AdicionarEntregaItem(ctx context.Context, qtx *repository.Queries, arg repository.AddItemEntregueParams) (repository.AddItemEntregueRow, error)
	ListarEntregas(ctx context.Context, args repository.ListarEntregasParams) ([]repository.ListarEntregasRow, error)
	Cancelar(ctx context.Context, qtx *repository.Queries, args repository.CancelarEntregaParams) (int32, error)
	CancelarEntregaItem(ctx context.Context, qtx *repository.Queries, arg repository.CancelaItemEntregueParams) ([]repository.CancelaItemEntregueRow, error)
	AbaterEstoqueEntrada(ctx context.Context, qtx *repository.Queries, args repository.AbaterEstoqueLoteParams) (int64, error)
	ReporEstoqueEntrada(ctx context.Context, qtx *repository.Queries, args repository.ReporEstoqueLoteParams) (int64, error)
	ListarEntregasDisponiveis(ctx context.Context, qtx *repository.Queries, args repository.ListarLotesParaConsumoParams) ([]repository.ListarLotesParaConsumoRow, error)
	ListarEpisCaVencido(ctx context.Context, qtx *repository.Queries, args repository.ListarEpisCaVencidoParams) ([]repository.ListarEpisCaVencidoRow, error)
	ListarEpisEntreguesCancelados(ctx context.Context, qtx *repository.Queries, arg repository.ListarItensEntregueCanceladosParams) ([]repository.ListarItensEntregueCanceladosRow, error)
	ListasEntregasPorMatricula(ctx context.Context, args repository.ListarHistoricoEntregasPorMatriculaParams) ([]repository.ListarHistoricoEntregasPorMatriculaRow, error)
	BuscaEntregaDashbord(ctx context.Context, tenant, unidade int32) ([]repository.EntregaDashbordRow, error)
	BuscaEntregaItensDashbord(ctx context.Context, tenant, unidade int32) ([]repository.EntregaItensDashbordRow, error)
	BuscaTodasEntregasDoTenant(ctx context.Context, tenantId int32) ([]repository.BuscaTodasEntregasDoTenantRow, error)
	ListarTrocasPendentes(ctx context.Context, args repository.ListarTrocasPendentesParams) ([]repository.ListarTrocasPendentesRow, error)
	ListarFaltasKit(ctx context.Context, tenantId, unidade int32) ([]repository.ListarFaltasKitRow, error)
}

type EntregaService struct {
	repo    EntregaRepository
	db      *pgxpool.Pool
	queries *repository.Queries
}

func NewEntregaService(r EntregaRepository, pool *pgxpool.Pool) *EntregaService {
	return &EntregaService{
		repo:    r,
		db:      pool,
		queries: repository.New(pool),
	}
}

// Salvar: Ponto de entrada para novas entregas com controle de transação
func (e *EntregaService) Salvar(ctx context.Context, model model.EntregaParaInserir, tenantid int32, token string) error {
	tx, err := e.db.Begin(ctx)
	if err != nil {
		slog.ErrorContext(ctx, "iniciar transação de entrega", "tenant", tenantid, "err", err)
		return err
	}
	defer tx.Rollback(ctx)

	qtx := e.queries.WithTx(tx)
	if err := e.RegistrarEntrega(ctx, qtx, model, tenantid, token); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (e *EntregaService) TokenEntrega(ctx context.Context, tenantId, idFuncionario int32) (string, error) {
	funcionario, err := e.queries.BuscaFuncionarioPorId(ctx, repository.BuscaFuncionarioPorIdParams{
		ID:       int32(idFuncionario),
		TenantID: tenantId,
	})
	if err != nil {
		if err == pgx.ErrNoRows {
			return "", helper.ErrNaoEncontrado
		}
		slog.ErrorContext(ctx, "buscar funcionário para token de entrega", "funcionario", idFuncionario, "tenant", tenantId, "err", err)
		return "", err
	}

	token := helper.GerarTokenAuditoria(funcionario.Nome, funcionario.FuncaoNome,
		funcionario.DepartamentoNome, time.Now())

	return token, nil
}

// RegistrarEntrega: Lógica de negócio principal (Token, Lotes e Abate de Estoque)
func (e *EntregaService) RegistrarEntrega(ctx context.Context, qtx *repository.Queries, model model.EntregaParaInserir, tenantId int32, token string) error {
	var idTrocaParaBanco pgtype.Int4
	if model.IdTroca != nil {
		idTrocaParaBanco = pgtype.Int4{Int32: int32(*model.IdTroca), Valid: true}
	}

	// 0. Bloqueia EPI com CA vencido na data da entrega (vale também para a troca na devolução)
	idsEpi := make([]int32, len(model.Itens))
	for i, item := range model.Itens {
		idsEpi[i] = int32(item.ID_epi)
	}
	vencidos, err := e.repo.ListarEpisCaVencido(ctx, qtx, repository.ListarEpisCaVencidoParams{
		TenantID:    tenantId,
		Ids:         idsEpi,
		DataEntrega: pgtype.Date{Time: model.Data_entrega.Time(), Valid: true},
	})
	if err != nil {
		slog.ErrorContext(ctx, "verificar validade do CA", "funcionario", model.ID_funcionario, "tenant", tenantId, "err", err)
		return err
	}
	if len(vencidos) > 0 {
		v := vencidos[0]
		if v.Situacao == "CANCELADO" || v.Situacao == "SUSPENSO" {
			return fmt.Errorf("%w: %s (CA %s %s no MTE)", helper.ErrCaVencido, v.Nome, v.Ca, strings.ToLower(v.Situacao))
		}
		return fmt.Errorf("%w: %s (CA %s, venceu em %s)", helper.ErrCaVencido, v.Nome, v.Ca, v.ValidadeCa.Time.Format("02/01/2006"))
	}

	// 0.1 De qual unidade sai o estoque (D2): a pedida ou a do funcionário
	unidade, err := unidadeDaOperacao(ctx, qtx, model.IdUnidade, model.ID_funcionario, tenantId)
	if err != nil {
		return err
	}

	// 1. Salva Cabeçalho
	identrega, err := e.repo.AdicionarEntrega(ctx, qtx, repository.AddEntregaEpiParams{
		IDUnidade:        unidade,
		Idfuncionario:    int32(model.ID_funcionario),
		DataEntrega:      pgtype.Date{Time: model.Data_entrega.Time(), Valid: true},
		Assinatura:       model.Assinatura_Digital,
		TokenValidacao:   pgtype.Text{String: token, Valid: true},
		IDUsuarioEntrega: pgtype.Int4{Int32: int32(model.Id_user), Valid: true},
		Idtroca:          idTrocaParaBanco,
		TenantID:         tenantId,
	})
	if err != nil {
		slog.ErrorContext(ctx, "inserir cabeçalho da entrega", "funcionario", model.ID_funcionario, "tenant", tenantId, "err", err)
		return err
	}

	// 2. Loop de Itens
	for _, item := range model.Itens {

		quantidadeNecessaria := item.Quantidade

		lotes, err := e.repo.ListarEntregasDisponiveis(ctx, qtx, repository.ListarLotesParaConsumoParams{
			IDEpi:     int32(item.ID_epi),
			IDTamanho: int32(item.ID_tamanho),
			IDUnidade: unidade,
			TenantID:  tenantId,
		})
		if err != nil {
			slog.ErrorContext(ctx, "buscar lotes para consumo", "entrega", identrega, "epi", item.ID_epi, "tamanho", item.ID_tamanho, "tenant", tenantId, "err", err)
			return err
		}

		for _, lote := range lotes {
			if quantidadeNecessaria <= 0 {
				break
			}

			qtdAbater := min(lote.QuantidadeAtual, int32(quantidadeNecessaria))

			// Inserir Item
			_, err := e.repo.AdicionarEntregaItem(ctx, qtx, repository.AddItemEntregueParams{
				IDEntregaCabecalho: identrega,
				IDEpi:              int32(item.ID_epi),
				IDTamanho:          int32(item.ID_tamanho),
				Quantidade:         qtdAbater,
				IDEntradaItem:      lote.ID,
				TenantID:           tenantId,
			})
			if err != nil {
				slog.ErrorContext(ctx, "inserir item da entrega", "entrega", identrega, "lote", lote.ID, "tenant", tenantId, "err", err)
				return err
			}

			// Abate
			_, err = e.repo.AbaterEstoqueEntrada(ctx, qtx, repository.AbaterEstoqueLoteParams{
				QuantidadeAtual: qtdAbater,
				ID:              lote.ID,
				TenantID:        tenantId,
			})
			if err != nil {
				slog.ErrorContext(ctx, "abater estoque do lote", "entrega", identrega, "lote", lote.ID, "quantidade", qtdAbater, "tenant", tenantId, "err", err)
				return err
			}

			quantidadeNecessaria -= qtdAbater
		}

		if quantidadeNecessaria > 0 {
			return faltaNaUnidade(ctx, qtx, item, unidade, quantidadeNecessaria, tenantId)
		}
	}
	return nil
}

type FiltroEntregas struct {
	Canceladas    bool           `form:"canceladas"`
	EpiID         int32          `form:"epiId"`
	EntregaID     int32          `form:"entregaId"`
	FuncionarioId int32          `form:"funcionarioId"`
	IdUnidade     int32          `form:"id_unidade"`
	DataInicio    configs.DataBr `form:"dataInicio"`
	DataFim       configs.DataBr `form:"dataFim"`
	Pagina        int32          `form:"pagina"`
	Quantidade    int32          `form:"quantidade"`
}

type EntregaPaginada struct {
	Entradas    []model.EntregaDto `json:"entregas"`
	Total       int64              `json:"total"`
	Pagina      int32              `json:"pagina"`
	PaginaFinal int32              `json:"pagina_final"`
}

// ListaEntregas: Busca paginada para a tela principal
func (e *EntregaService) ListaEntregas(ctx context.Context, f FiltroEntregas, tenantId int32) (EntregaPaginada, error) {
	limit := f.Quantidade
	if limit <= 0 {
		limit = 10
	}
	paginaAtual := f.Pagina
	if paginaAtual <= 0 {
		paginaAtual = 1
	}
	offset := (paginaAtual - 1) * limit

	entregas, err := e.repo.ListarEntregas(ctx, repository.ListarEntregasParams{
		Limit:         limit,
		Offset:        offset,
		Canceladas:    f.Canceladas,
		IDEntrega:     pgtype.Int4{Int32: f.EntregaID, Valid: f.EntregaID > 0},
		Idfuncionario: pgtype.Int4{Int32: f.FuncionarioId, Valid: f.FuncionarioId > 0},
		IDUnidade:     pgtype.Int4{Int32: f.IdUnidade, Valid: f.IdUnidade > 0},
		TenantID:      tenantId,
	})
	if err != nil {
		return EntregaPaginada{}, err
	}

	// Busca todos os itens para evitar N+1 queries
	todosItens, err := e.queries.BuscarTodosItensEntrega(ctx, repository.BuscarTodosItensEntregaParams{
		TenantID:  tenantId,
		IDEntrega: 0,
	})
	if err != nil {
		return EntregaPaginada{}, err
	}

	itensMap := make(map[int32][]model.ItemEntregueDto)
	for _, I := range todosItens {
		itensMap[I.EntregaID] = append(itensMap[I.EntregaID], model.ItemEntregueDto{
			Id: I.ItemID,
			Epi: model.EpiResponse{
				Id: I.EpiID, Nome: I.EpiNome, Fabricante: I.Fabricante, CA: I.Ca,
				Descricao: I.EpiDesc, DataValidadeCa: configs.DataBr(I.ValidadeCa.Time),
				Protecao: model.TipoProtecaoDto{ID: int64(I.TpID), Nome: I.TpNome},
			},
			Tamanho:    model.TamanhoDto{ID: int(I.TamID), Tamanho: I.TamNome},
			Quantidade: I.Quantidade,
		})
	}

	dto := make([]model.EntregaDto, 0, len(entregas))
	for _, ent := range entregas {
		itens := itensMap[ent.EntregaID]
		if itens == nil {
			itens = []model.ItemEntregueDto{}
		}

		dto = append(dto, model.EntregaDto{
			Id: ent.EntregaID,
			Funcionario: model.Funcionario_Dto{
				ID: int32(ent.FuncID), Nome: ent.FuncNome, Matricula: ent.Matricula,
				Funcao: model.FuncaoDto{
					ID: int(ent.FuncaoID), Funcao: ent.FuncaoNome,
					Departamento: model.DepartamentoDto{ID: int(ent.DepID), Departamento: ent.DepNome},
				},
			},
			Data_entrega:       configs.DataBr(ent.DataEntrega.Time),
			Assinatura_Digital: ent.Assinatura,
			Itens:              itens,
			Token_validacao:    ent.TokenValidacao.String,
			Id_user:            ent.IDUsuarioEntrega.Int32,
		})
	}

	var total int64
	if len(entregas) > 0 {
		total = entregas[0].TotalGeral
	}

	return EntregaPaginada{
		Entradas: dto, Total: total, Pagina: paginaAtual,
		PaginaFinal: int32(math.Ceil(float64(total) / float64(limit))),
	}, nil
}

func (e *EntregaService) CancelarEntrega(ctx context.Context, tenantId, id, iduser int) error {
	tx, err := e.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	qtx := e.queries.WithTx(tx)
	if err := e.RegistrarCancelamento(ctx, qtx, tenantId, id, iduser); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (e *EntregaService) RegistrarCancelamento(ctx context.Context, qtx *repository.Queries, tenantID, id, iduser int) error {
	arg := repository.CancelarEntregaParams{
		ID:                           int32(id),
		IDUsuarioEntregaCancelamento: pgtype.Int4{Int32: int32(iduser), Valid: true},
		TenantID:                     int32(tenantID),
	}

	identrega, err := e.repo.Cancelar(ctx, qtx, arg)
	if err != nil || identrega == 0 {
		return helper.ErrNaoEncontrado
	}

	// Cancela itens
	_, err = e.repo.CancelarEntregaItem(ctx, qtx, repository.CancelaItemEntregueParams{
		IDEntregaCabecalho: identrega,
		TenantID:           arg.TenantID,
	})
	if err != nil {
		slog.ErrorContext(ctx, "marcar itens da entrega como cancelados", "entrega", identrega, "tenant", arg.TenantID, "err", err)
		return err
	}

	cancelados, err := e.repo.ListarEpisEntreguesCancelados(ctx, qtx, repository.ListarItensEntregueCanceladosParams{
		IDEntregaCabecalho: identrega,
		TenantID:           arg.TenantID,
	})
	if err != nil {
		slog.ErrorContext(ctx, "listar itens cancelados para repor estoque", "entrega", identrega, "tenant", arg.TenantID, "err", err)
		return err
	}

	for _, c := range cancelados {
		_, err := e.repo.ReporEstoqueEntrada(ctx, qtx, repository.ReporEstoqueLoteParams{
			QuantidadeAtual: c.Quantidade,
			ID:              c.IDEntradaItem,
			TenantID:        arg.TenantID,
		})
		if err != nil {
			slog.ErrorContext(ctx, "repor estoque do lote", "entrega", identrega, "lote", c.IDEntradaItem, "quantidade", c.Quantidade, "tenant", arg.TenantID, "err", err)
			return err
		}
	}
	return nil
}

// GerarDadosPdfService: Monta a estrutura para o gerador de PDF
func (e *EntregaService) GerarDadosPdfService(ctx context.Context, matricula string, idEntrega, tenantId int32) (helper.DadosPdf, error) {
	matInt, _ := strconv.Atoi(matricula)
	entregas, err := e.repo.ListasEntregasPorMatricula(ctx, repository.ListarHistoricoEntregasPorMatriculaParams{
		Matricula: int32(matInt),
		TenantID:  tenantId,
		ID:        idEntrega,
	})
	if err != nil || len(entregas) == 0 {
		return helper.DadosPdf{}, err
	}

	epis := make([]helper.DadosEpiPdf, 0)
	for _, ent := range entregas {
		epis = append(epis, helper.DadosEpiPdf{
			Data: *configs.NewDataBrPtr(ent.DataEntrega.Time), NomeEpi: ent.EpiNome,
			Ca: ent.Ca, Descricao: ent.Descricao, Tamanho: ent.Tamanho, Quantidade: ent.Quantidade,
		})
	}

	primeira := entregas[0]
	return helper.DadosPdf{
		NomeEmpresa:     primeira.RazaoSocial,
		NomeFuncionario: primeira.FuncNome,
		Cpf:             primeira.Cpf.String,
		Matricula:       strconv.Itoa(int(primeira.Matricula)),
		Setor:           primeira.DepNome,
		Cargo:           primeira.FuncaoNome,
		Assinatura:      primeira.Assinatura,
		Epi:             epis,
	}, nil
}

// ListarTrocasPendentes: EPIs em posse com vida útil vencida ou vencendo nos próximos `dias` dias
func (e *EntregaService) ListarTrocasPendentes(ctx context.Context, tenantId, unidade int32, dias int) ([]model.TrocaPendenteDto, error) {
	trocas, err := e.repo.ListarTrocasPendentes(ctx, repository.ListarTrocasPendentesParams{
		TenantID:  tenantId,
		Ate:       pgtype.Date{Time: time.Now().AddDate(0, 0, dias), Valid: true},
		IDUnidade: pgtype.Int4{Int32: unidade, Valid: unidade > 0},
	})
	if err != nil {
		return nil, err
	}

	dto := make([]model.TrocaPendenteDto, 0, len(trocas))
	for _, t := range trocas {
		dto = append(dto, model.TrocaPendenteDto{
			FuncionarioId: t.FuncionarioID, FuncionarioNome: t.FuncionarioNome, Matricula: t.Matricula,
			EpiId: t.EpiID, EpiNome: t.EpiNome, EmPosse: t.EmPosse,
			UltimaEntrega: configs.DataBr(t.UltimaEntrega.Time),
			VenceEm:       configs.DataBr(t.VenceEm.Time),
		})
	}
	return dto, nil
}

// ListarFaltasKit: funcionários com menos EPI em posse do que o kit da função exige
func (e *EntregaService) ListarFaltasKit(ctx context.Context, tenantId, unidade int32) ([]model.FaltaKitDto, error) {
	faltas, err := e.repo.ListarFaltasKit(ctx, tenantId, unidade)
	if err != nil {
		return nil, err
	}

	dto := make([]model.FaltaKitDto, 0, len(faltas))
	for _, f := range faltas {
		dto = append(dto, model.FaltaKitDto{
			FuncionarioId: f.FuncionarioID, FuncionarioNome: f.FuncionarioNome, Matricula: f.Matricula,
			FuncaoNome: f.FuncaoNome, EpiId: f.EpiID, EpiNome: f.EpiNome, Exigido: f.Exigido, EmPosse: f.EmPosse,
		})
	}
	return dto, nil
}

// Funções de Dashboard
func (e *EntregaService) BuscaEntregaDash(ctx context.Context, tenantId, unidade int32) ([]model.EntregaDashbord, error) {
	entregas, err := e.repo.BuscaEntregaDashbord(ctx, tenantId, unidade)
	if err != nil {
		return []model.EntregaDashbord{}, err
	}

	dto := make([]model.EntregaDashbord, 0, len(entregas))
	for _, ee := range entregas {
		dto = append(dto, model.EntregaDashbord{
			Id: ee.ID, IdFuncionario: ee.Idfuncionario,
			Data_entrega: *configs.NewDataBrPtr(ee.DataEntrega.Time),
			Assinatura:   ee.Assinatura, TokenValidacao: ee.TokenValidacao.String, IdUnidade: ee.IDUnidade,
		})
	}
	return dto, nil
}

func (e *EntregaService) BuscaItemDash(ctx context.Context, tenantID, unidade int32) ([]model.EntregaItensDashBord, error) {
	itens, err := e.repo.BuscaEntregaItensDashbord(ctx, tenantID, unidade)
	if err != nil {
		return []model.EntregaItensDashBord{}, err
	}

	dto := make([]model.EntregaItensDashBord, 0, len(itens))
	for _, i := range itens {
		dto = append(dto, model.EntregaItensDashBord{
			Id: i.ID, IdEntregaCabecalho: i.IDEntregaCabecalho,
			IdEpi: i.IDEpi, IdTamanho: i.IDTamanho, Quantidade: i.Quantidade,
		})
	}
	return dto, nil
}

// unidadeDaOperacao decide de qual unidade sai (ou para qual volta) o estoque:
// a pedida, se vier; senão, a do funcionário.
func unidadeDaOperacao(ctx context.Context, qtx *repository.Queries, pedida *int32, idFuncionario, tenantId int32) (int32, error) {
	unidade, err := unidadePedidaOuDoFuncionario(ctx, qtx, pedida, idFuncionario, tenantId)
	if err != nil {
		return 0, err
	}
	// usuário limitado a algumas lojas (Fase 6): entrega e devolução passam todas por aqui
	if !middleware.UnidadePermitida(ctx, unidade) {
		return 0, helper.ErrUnidadeSemAcesso
	}
	return unidade, nil
}

func unidadePedidaOuDoFuncionario(ctx context.Context, qtx *repository.Queries, pedida *int32, idFuncionario, tenantId int32) (int32, error) {
	if pedida != nil {
		if err := unidadeAtiva(ctx, qtx, *pedida, tenantId); err != nil {
			return 0, err
		}
		return *pedida, nil
	}
	unidade, err := qtx.UnidadeDoFuncionario(ctx, repository.UnidadeDoFuncionarioParams{ID: idFuncionario, TenantID: tenantId})
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, helper.ErrNaoEncontrado
	}
	return unidade, err
}

// faltaNaUnidade monta o erro de estoque insuficiente dizendo quanto há nas outras unidades,
// para o balcão saber que dá para pedir transferência. O controller procura "estoque insuficiente".
func faltaNaUnidade(ctx context.Context, qtx *repository.Queries, item model.ItemParaInserir, unidade, faltam, tenantId int32) error {
	fora, err := qtx.SaldoForaDaUnidade(ctx, repository.SaldoForaDaUnidadeParams{
		TenantID: tenantId, IDEpi: item.ID_epi, IDTamanho: item.ID_tamanho, IDUnidade: unidade,
	})
	if err != nil {
		return err
	}
	msg := fmt.Sprintf("estoque insuficiente em %s: faltam %d unidade(s) dentro da validade", fora.Unidade, faltam)
	if fora.SaldoFora > 0 {
		msg += fmt.Sprintf("; há %d em outras unidades", fora.SaldoFora)
	}
	return errors.New(msg)
}
