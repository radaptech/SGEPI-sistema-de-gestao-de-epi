package service

import (
	"context"
	"testing"
	"time"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/configs"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/database/repository"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/helper"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/model"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
	"github.com/stretchr/testify/require"
)

// Fase 1 do docs/PLANO-UNIDADES.md: tabela unidade, "Principal" automática e id_unidade em
// entrada_nf, entrada_epi_item, funcionario, entrega_epi e devolucao.

// unidadeDe lê o id_unidade gravado numa linha (tabela fixa no código do teste, sem entrada externa).
func unidadeDe(t *testing.T, db *pgxpool.Pool, tabela string, id int64) int32 {
	var u int32
	err := db.QueryRow(context.Background(), "SELECT id_unidade FROM "+tabela+" WHERE id = $1", id).Scan(&u)
	require.NoError(t, err, "lendo id_unidade de %s", tabela)
	return u
}

func principalDe(t *testing.T, db *pgxpool.Pool, tenant int64) int32 {
	var id int32
	err := db.QueryRow(context.Background(),
		"SELECT id FROM unidade WHERE tenant_id = $1 AND nome = 'Principal'", tenant).Scan(&id)
	require.NoError(t, err, "toda empresa deveria nascer com a unidade Principal")
	return id
}

func TestUnidade(t *testing.T) {

	t.Run("empresa nova nasce com a Principal e INSERT sem id_unidade cai nela", func(t *testing.T) {
		ctx := context.Background()
		db := SetupTestDB(t)
		defer db.Close()

		empresa := CreateEmpresa(t, db, CreatePlanos(t, db))
		principal := principalDe(t, db, empresa)

		// helpers crus não conhecem id_unidade: o trigger preenche
		iduser := CreateUser(t, db, empresa)
		iddep := CreateDepartamento(t, db, empresa)
		idfuncionario := CreateFuncionario(t, db, iddep, CreateFuncao(t, db, iddep, empresa), empresa)
		idtam := CreateTamanho(t, db, empresa)
		idepi := CreateEpi(t, db, CreateProtecao(t, db), empresa)
		idnf := CreateEntradaNfEpi(t, db, empresa, iduser, CreateFornecedor(t, db, empresa))
		idlote := CreateEntradaEpi(t, db, empresa, idepi, idtam, iduser, idnf)

		require.Equal(t, principal, unidadeDe(t, db, "funcionario", idfuncionario))
		require.Equal(t, principal, unidadeDe(t, db, "entrada_nf", idnf))
		require.Equal(t, principal, unidadeDe(t, db, "entrada_epi_item", idlote))

		// e a entrega real (pelo service) também
		entregaServ := NewEntregaService(repository.NewEntregaRepository(db), db)
		err := entregaServ.Salvar(ctx, model.EntregaParaInserir{
			ID_funcionario:     int32(idfuncionario),
			Id_user:            int32(iduser),
			Data_entrega:       *configs.NewDataBrPtr(time.Now()),
			Assinatura_Digital: "assinatura-unidade",
			Itens:              []model.ItemParaInserir{{ID_epi: int32(idepi), ID_tamanho: int32(idtam), Quantidade: 3}},
		}, int32(empresa), "token-unidade")
		require.NoError(t, err)

		var unidadeEntrega int32
		err = db.QueryRow(ctx, "SELECT id_unidade FROM entrega_epi WHERE tenant_id = $1", empresa).Scan(&unidadeEntrega)
		require.NoError(t, err)
		require.Equal(t, principal, unidadeEntrega, "a entrega deveria ficar na Principal")
	})

	t.Run("cadastra, lista com saldo e funcionários, renomeia e recusa nome repetido ou curto", func(t *testing.T) {
		ctx := context.Background()
		db := SetupTestDB(t)
		defer db.Close()

		empresa := CreateEmpresa(t, db, CreatePlanos(t, db))
		iduser := CreateUser(t, db, empresa)
		iddep := CreateDepartamento(t, db, empresa)
		CreateFuncionario(t, db, iddep, CreateFuncao(t, db, iddep, empresa), empresa)
		idnf := CreateEntradaNfEpi(t, db, empresa, iduser, CreateFornecedor(t, db, empresa))
		CreateEntradaEpi(t, db, empresa, CreateEpi(t, db, CreateProtecao(t, db), empresa), CreateTamanho(t, db, empresa), iduser, idnf) // 100 un

		serv := NewUnidadeService(repository.NewUnidadeRepository(db))
		tenant := int32(empresa)

		loja2, err := serv.Criar(ctx, model.UnidadeInserir{Nome: "  Loja 2  "}, tenant)
		require.NoError(t, err)
		require.Equal(t, "Loja 2", loja2.Nome, "o nome deveria vir sem espaços nas pontas")

		_, err = serv.Criar(ctx, model.UnidadeInserir{Nome: "Loja 2"}, tenant)
		require.ErrorIs(t, err, helper.ErrDadoDuplicado)

		_, err = serv.Criar(ctx, model.UnidadeInserir{Nome: "L"}, tenant)
		require.ErrorIs(t, err, helper.ErrNomeCurto)

		unidades, err := serv.Listar(ctx, tenant)
		require.NoError(t, err)
		require.Len(t, unidades, 2)
		require.Equal(t, model.UnidadeDto{ID: principalDe(t, db, empresa), Nome: "Principal", Funcionarios: 1, Saldo: 100}, unidades[0])
		require.Equal(t, model.UnidadeDto{ID: loja2.ID, Nome: "Loja 2", Funcionarios: 0, Saldo: 0}, unidades[1])

		require.NoError(t, serv.Renomear(ctx, loja2.ID, model.UnidadeInserir{Nome: "Loja Centro"}, tenant))
		unidades, err = serv.Listar(ctx, tenant)
		require.NoError(t, err)
		require.Equal(t, "Loja Centro", unidades[1].Nome)

		require.ErrorIs(t, serv.Renomear(ctx, loja2.ID, model.UnidadeInserir{Nome: "Principal"}, tenant), helper.ErrDadoDuplicado)
	})

	t.Run("desativar recusa a última unidade e a que tem estoque ou funcionário", func(t *testing.T) {
		ctx := context.Background()
		db := SetupTestDB(t)
		defer db.Close()

		empresa := CreateEmpresa(t, db, CreatePlanos(t, db))
		iduser := CreateUser(t, db, empresa)
		idnf := CreateEntradaNfEpi(t, db, empresa, iduser, CreateFornecedor(t, db, empresa))
		CreateEntradaEpi(t, db, empresa, CreateEpi(t, db, CreateProtecao(t, db), empresa), CreateTamanho(t, db, empresa), iduser, idnf)

		serv := NewUnidadeService(repository.NewUnidadeRepository(db))
		tenant := int32(empresa)
		principal := principalDe(t, db, empresa)

		require.ErrorIs(t, serv.Desativar(ctx, principal, tenant), helper.ErrUltimaUnidade)

		vazia, err := serv.Criar(ctx, model.UnidadeInserir{Nome: "Obra Norte"}, tenant)
		require.NoError(t, err)

		require.ErrorIs(t, serv.Desativar(ctx, principal, tenant), helper.ErrUnidadeEmUso, "a Principal tem o lote de 100 un")

		require.NoError(t, serv.Desativar(ctx, vazia.ID, tenant))
		unidades, err := serv.Listar(ctx, tenant)
		require.NoError(t, err)
		require.Len(t, unidades, 1, "a desativada some da lista")
		require.ErrorIs(t, serv.Desativar(ctx, vazia.ID, tenant), helper.ErrNaoEncontrado)
		require.ErrorIs(t, serv.Renomear(ctx, vazia.ID, model.UnidadeInserir{Nome: "Volta"}, tenant), helper.ErrNaoEncontrado)

		// o nome de uma desativada pode ser reaproveitado
		_, err = serv.Criar(ctx, model.UnidadeInserir{Nome: "Obra Norte"}, tenant)
		require.NoError(t, err)
	})

	t.Run("uma empresa não enxerga nem mexe na unidade da outra", func(t *testing.T) {
		ctx := context.Background()
		db := SetupTestDB(t)
		defer db.Close()

		plano := CreatePlanos(t, db)
		empresaA := CreateEmpresa(t, db, plano)
		time.Sleep(2 * time.Millisecond) // CreateEmpresa gera CNPJ/subdomínio pelo relógio
		empresaB := CreateEmpresa(t, db, plano)

		serv := NewUnidadeService(repository.NewUnidadeRepository(db))
		lojaA, err := serv.Criar(ctx, model.UnidadeInserir{Nome: "Loja A"}, int32(empresaA))
		require.NoError(t, err)

		unidadesB, err := serv.Listar(ctx, int32(empresaB))
		require.NoError(t, err)
		require.Len(t, unidadesB, 1, "B só vê a própria Principal")

		require.ErrorIs(t, serv.Renomear(ctx, lojaA.ID, model.UnidadeInserir{Nome: "Invadida"}, int32(empresaB)), helper.ErrNaoEncontrado)
		require.ErrorIs(t, serv.Desativar(ctx, lojaA.ID, int32(empresaB)), helper.ErrNaoEncontrado)

		// o mesmo nome em empresas diferentes é permitido
		_, err = serv.Criar(ctx, model.UnidadeInserir{Nome: "Loja A"}, int32(empresaB))
		require.NoError(t, err)

		// a FK composta (id_unidade, tenant_id) recusa um funcionário de B lotado na loja de A
		iddep := CreateDepartamento(t, db, empresaB)
		idfuncionario := CreateFuncionario(t, db, iddep, CreateFuncao(t, db, iddep, empresaB), empresaB)
		_, err = db.Exec(ctx, "UPDATE funcionario SET id_unidade = $1 WHERE id = $2", lojaA.ID, idfuncionario)
		require.Error(t, err, "o banco deveria recusar a unidade de outro tenant")
		require.ErrorIs(t, helper.TraduzErroPostgres(err), helper.ErrConflitoIntegridade)
	})
}

// Fase 3: lotação do funcionário.
func TestFuncionarioLotacao(t *testing.T) {

	t.Run("cadastra numa unidade, muda de unidade e o histórico fica onde aconteceu", func(t *testing.T) {
		ctx := context.Background()
		db := SetupTestDB(t)
		defer db.Close()

		empresa := CreateEmpresa(t, db, CreatePlanos(t, db))
		tenant := int32(empresa)
		iduser := CreateUser(t, db, empresa)
		iddep := CreateDepartamento(t, db, empresa)
		idfuncao := CreateFuncao(t, db, iddep, empresa)
		idtam := CreateTamanho(t, db, empresa)
		idepi := CreateEpi(t, db, CreateProtecao(t, db), empresa)
		idnf := CreateEntradaNfEpi(t, db, empresa, iduser, CreateFornecedor(t, db, empresa))
		CreateEntradaEpi(t, db, empresa, idepi, idtam, iduser, idnf)

		unidades := NewUnidadeService(repository.NewUnidadeRepository(db))
		principal := principalDe(t, db, empresa)
		loja2, err := unidades.Criar(ctx, model.UnidadeInserir{Nome: "Loja 2"}, tenant)
		require.NoError(t, err)

		serv := NewFuncionarioService(repository.NewFuncionarioRepository(db), repository.NewEntregaRepository(db), repository.NewEpiRepository(db), db)

		// sem id_unidade vai para a Principal; com id_unidade, para a escolhida
		require.NoError(t, serv.SalvarFuncionario(ctx, model.FuncionarioInserir{
			Nome: "Ana Principal", ID_departamento: int32(iddep), ID_funcao: int32(idfuncao), Cpf: "11111111111",
		}, tenant))
		require.NoError(t, serv.SalvarFuncionario(ctx, model.FuncionarioInserir{
			Nome: "Bruno Loja", ID_departamento: int32(iddep), ID_funcao: int32(idfuncao), Cpf: "22222222222", IdUnidade: &loja2.ID,
		}, tenant))

		todos, err := serv.ListaTodosFuncionarios(ctx, FiltroFuncionario{FiltroPaginacao: FiltroPaginacao{Quantidade: 50}}, tenant)
		require.NoError(t, err)
		require.Len(t, todos.Funcionarios, 2)
		require.Equal(t, model.UnidadeResumo{ID: principal, Nome: "Principal"}, todos.Funcionarios[0].Unidade, "Ana")
		require.Equal(t, model.UnidadeResumo{ID: loja2.ID, Nome: "Loja 2"}, todos.Funcionarios[1].Unidade, "Bruno")

		daLoja, err := serv.ListaTodosFuncionarios(ctx, FiltroFuncionario{IdUnidade: loja2.ID, FiltroPaginacao: FiltroPaginacao{Quantidade: 50}}, tenant)
		require.NoError(t, err)
		require.Len(t, daLoja.Funcionarios, 1)
		require.Equal(t, "Bruno Loja", daLoja.Funcionarios[0].Nome)

		// Ana recebe um EPI na Principal e depois é transferida para a Loja 2
		ana := todos.Funcionarios[0].ID
		require.NoError(t, NewEntregaService(repository.NewEntregaRepository(db), db).Salvar(ctx, model.EntregaParaInserir{
			ID_funcionario:     ana,
			Id_user:            int32(iduser),
			Data_entrega:       *configs.NewDataBrPtr(time.Now()),
			Assinatura_Digital: "assinatura-lotacao",
			Itens:              []model.ItemParaInserir{{ID_epi: int32(idepi), ID_tamanho: int32(idtam), Quantidade: 2}},
		}, tenant, "token-lotacao"))

		require.NoError(t, serv.AtualizarFuncionarioCompleto(ctx, int(ana), model.UpdateFuncionarioRequest{IdUnidade: &loja2.ID}, int(tenant)))

		daLoja, err = serv.ListaTodosFuncionarios(ctx, FiltroFuncionario{IdUnidade: loja2.ID, FiltroPaginacao: FiltroPaginacao{Quantidade: 50}}, tenant)
		require.NoError(t, err)
		require.Len(t, daLoja.Funcionarios, 2, "Ana agora é da Loja 2")

		var unidadeEntrega int32
		require.NoError(t, db.QueryRow(ctx, "SELECT id_unidade FROM entrega_epi WHERE idfuncionario = $1", ana).Scan(&unidadeEntrega))
		require.Equal(t, principal, unidadeEntrega, "a entrega antiga continua registrada na Principal")

		completo, err := serv.FuncionarioCompleto(ctx, tenant, 0)
		require.NoError(t, err)
		for _, f := range completo {
			if f.ID == ana {
				require.Equal(t, "Loja 2", f.Unidade.Nome)
				require.Len(t, f.Entregas, 1, "o histórico de entregas continua com ela")
			}
		}
	})

	t.Run("recusa unidade desativada ou de outra empresa", func(t *testing.T) {
		ctx := context.Background()
		db := SetupTestDB(t)
		defer db.Close()

		plano := CreatePlanos(t, db)
		empresaA := CreateEmpresa(t, db, plano)
		time.Sleep(2 * time.Millisecond)
		empresaB := CreateEmpresa(t, db, plano)
		tenant := int32(empresaA)
		iddep := CreateDepartamento(t, db, empresaA)
		idfuncao := CreateFuncao(t, db, iddep, empresaA)
		idfuncionario := CreateFuncionario(t, db, iddep, idfuncao, empresaA)

		unidades := NewUnidadeService(repository.NewUnidadeRepository(db))
		fechada, err := unidades.Criar(ctx, model.UnidadeInserir{Nome: "Obra Encerrada"}, tenant)
		require.NoError(t, err)
		require.NoError(t, unidades.Desativar(ctx, fechada.ID, tenant))
		principalB := principalDe(t, db, empresaB)

		serv := NewFuncionarioService(repository.NewFuncionarioRepository(db), repository.NewEntregaRepository(db), repository.NewEpiRepository(db), db)

		for nome, id := range map[string]int32{"desativada": fechada.ID, "de outra empresa": principalB} {
			err := serv.SalvarFuncionario(ctx, model.FuncionarioInserir{
				Nome: "Carla", ID_departamento: int32(iddep), ID_funcao: int32(idfuncao), Cpf: "33333333333", IdUnidade: &id,
			}, tenant)
			require.ErrorIs(t, err, helper.ErrUnidadeInvalida, "cadastro em unidade %s", nome)

			err = serv.AtualizarFuncionarioCompleto(ctx, int(idfuncionario), model.UpdateFuncionarioRequest{IdUnidade: &id}, int(tenant))
			require.ErrorIs(t, err, helper.ErrUnidadeInvalida, "mudança para unidade %s", nome)
		}

		require.Equal(t, principalDe(t, db, empresaA), unidadeDe(t, db, "funcionario", idfuncionario), "continua na Principal")
	})
}

// Fase 4: entrada, entrega, devolução e cancelamento mexem só no estoque da unidade.

type cenarioDuasLojas struct {
	ctx                  context.Context
	db                   *pgxpool.Pool
	tenant               int32
	user                 int32
	loja1, loja2         int32
	epi, tam             int32
	funcionario          int32 // lotado na Loja 1
	entradas             *EntradaService
	entregas             *EntregaService
	devolucoes           *DevolucaoService
	fornecedor           int32
	motivoVoltaAoEstoque int32
}

func (c cenarioDuasLojas) entrada(t *testing.T, unidade *int32, nf string, qtd int, validade time.Time) error {
	return c.entradas.Adicionar(c.ctx, model.EntradaEpiInserir{
		Idfornecedor:       c.fornecedor,
		Nota_fiscal_numero: nf,
		Nota_fiscal_serie:  "1",
		Data_emissao:       *configs.NewDataBrPtr(time.Now().AddDate(0, 0, -1)),
		Id_user:            c.user,
		IdUnidade:          unidade,
		Itens: []model.EntradaEpiItemInserir{{
			ID_epi: int(c.epi), Id_tamanho: int(c.tam), Quantidade: qtd,
			DataFabricacao: *configs.NewDataBrPtr(time.Now().AddDate(-1, 0, 0)),
			DataValidade:   *configs.NewDataBrPtr(validade),
			Lote:           "L-" + nf,
			ValorUnitario:  decimal.NewFromInt(10),
		}},
	}, c.tenant)
}

func (c cenarioDuasLojas) entrega(qtd int32, unidade *int32) error {
	return c.entregas.Salvar(c.ctx, model.EntregaParaInserir{
		ID_funcionario:     c.funcionario,
		Id_user:            c.user,
		Data_entrega:       *configs.NewDataBrPtr(time.Now()),
		Assinatura_Digital: "assinatura-loja",
		IdUnidade:          unidade,
		Itens:              []model.ItemParaInserir{{ID_epi: c.epi, ID_tamanho: c.tam, Quantidade: qtd}},
	}, c.tenant, "token-loja")
}

func (c cenarioDuasLojas) saldo(t *testing.T, unidade int32) int32 {
	var s int32
	err := c.db.QueryRow(c.ctx, `SELECT COALESCE(SUM(quantidade_atual), 0)::int FROM entrada_epi_item
		WHERE tenant_id = $1 AND id_unidade = $2 AND id_epi = $3 AND ativo`, c.tenant, unidade, c.epi).Scan(&s)
	require.NoError(t, err)
	return s
}

func novoCenarioDuasLojas(t *testing.T) cenarioDuasLojas {
	ctx := context.Background()
	db := SetupTestDB(t)
	empresa := CreateEmpresa(t, db, CreatePlanos(t, db))
	tenant := int32(empresa)
	iddep := CreateDepartamento(t, db, empresa)

	unidades := NewUnidadeService(repository.NewUnidadeRepository(db))
	loja2, err := unidades.Criar(ctx, model.UnidadeInserir{Nome: "Loja 2"}, tenant)
	require.NoError(t, err)
	require.NoError(t, unidades.Renomear(ctx, principalDe(t, db, empresa), model.UnidadeInserir{Nome: "Loja 1"}, tenant))

	entregas := NewEntregaService(repository.NewEntregaRepository(db), db)
	c := cenarioDuasLojas{
		ctx: ctx, db: db, tenant: tenant,
		user:                 int32(CreateUser(t, db, empresa)),
		loja2:                loja2.ID,
		epi:                  int32(CreateEpi(t, db, CreateProtecao(t, db), empresa)),
		tam:                  int32(CreateTamanho(t, db, empresa)),
		funcionario:          int32(CreateFuncionario(t, db, iddep, CreateFuncao(t, db, iddep, empresa), empresa)),
		fornecedor:           int32(CreateFornecedor(t, db, empresa)),
		entradas:             NewEntradaService(repository.NewEntradaRepository(db), db),
		entregas:             entregas,
		devolucoes:           NewDevolucaoService(repository.NewDevolucaoRepository(db), db, *entregas, repository.NewMotivoDevolucaoRepository(db)),
		motivoVoltaAoEstoque: int32(CreateMotivoDevolucao(t, db, "Tamanho inadequado", false, empresa)),
	}
	err = db.QueryRow(ctx, "SELECT id FROM unidade WHERE tenant_id = $1 AND nome = 'Loja 1'", tenant).Scan(&c.loja1)
	require.NoError(t, err)
	return c
}

func TestEstoquePorUnidade(t *testing.T) {
	validadeLonga := time.Now().AddDate(4, 0, 0)
	validadeCurta := time.Now().AddDate(1, 0, 0) // vence antes: o FEFO escolheria este se olhasse o tenant todo

	t.Run("com duas unidades a entrada exige a unidade e grava nela", func(t *testing.T) {
		c := novoCenarioDuasLojas(t)
		defer c.db.Close()

		require.ErrorIs(t, c.entrada(t, nil, "NF-SEM", 5, validadeLonga), helper.ErrUnidadeObrigatoria)
		require.NoError(t, c.entrada(t, &c.loja2, "NF-L2", 7, validadeLonga))
		require.Equal(t, int32(7), c.saldo(t, c.loja2))
		require.Equal(t, int32(0), c.saldo(t, c.loja1))

		var unidadeNf int32
		require.NoError(t, c.db.QueryRow(c.ctx, "SELECT id_unidade FROM entrada_nf WHERE nota_fiscal_numero = 'NF-L2' AND tenant_id = $1", c.tenant).Scan(&unidadeNf))
		require.Equal(t, c.loja2, unidadeNf)
	})

	t.Run("entrega sai da unidade do funcionário mesmo com lote da outra vencendo antes", func(t *testing.T) {
		c := novoCenarioDuasLojas(t)
		defer c.db.Close()
		require.NoError(t, c.entrada(t, &c.loja1, "NF-L1", 10, validadeLonga))
		require.NoError(t, c.entrada(t, &c.loja2, "NF-L2", 10, validadeCurta))

		require.NoError(t, c.entrega(4, nil))
		require.Equal(t, int32(6), c.saldo(t, c.loja1), "Loja 1: 10 - 4")
		require.Equal(t, int32(10), c.saldo(t, c.loja2), "Loja 2 intacta")

		var unidadeEntrega int32
		require.NoError(t, c.db.QueryRow(c.ctx, "SELECT id_unidade FROM entrega_epi WHERE tenant_id = $1", c.tenant).Scan(&unidadeEntrega))
		require.Equal(t, c.loja1, unidadeEntrega)

		// o balcão pode escolher outra unidade
		require.NoError(t, c.entrega(3, &c.loja2))
		require.Equal(t, int32(7), c.saldo(t, c.loja2), "Loja 2: 10 - 3")
		require.Equal(t, int32(6), c.saldo(t, c.loja1))
	})

	t.Run("falta na unidade com saldo na outra dá erro, diz quanto há fora e não abate nada", func(t *testing.T) {
		c := novoCenarioDuasLojas(t)
		defer c.db.Close()
		require.NoError(t, c.entrada(t, &c.loja1, "NF-L1", 5, validadeLonga))
		require.NoError(t, c.entrada(t, &c.loja2, "NF-L2", 12, validadeLonga))

		err := c.entrega(8, nil)
		require.Error(t, err)
		require.Equal(t, "estoque insuficiente em Loja 1: faltam 3 unidade(s) dentro da validade; há 12 em outras unidades", err.Error())
		require.Equal(t, int32(5), c.saldo(t, c.loja1), "o rollback devolve o que tinha sido abatido")
		require.Equal(t, int32(12), c.saldo(t, c.loja2))

		var entregas int
		require.NoError(t, c.db.QueryRow(c.ctx, "SELECT COUNT(*) FROM entrega_epi WHERE tenant_id = $1", c.tenant).Scan(&entregas))
		require.Zero(t, entregas, "nenhuma entrega gravada")

		// pedindo pela Loja 2: falta lá, e o saldo "fora" agora é o da Loja 1
		err = NewEntregaService(repository.NewEntregaRepository(c.db), c.db).Salvar(c.ctx, model.EntregaParaInserir{
			ID_funcionario: c.funcionario, Id_user: c.user, Data_entrega: *configs.NewDataBrPtr(time.Now()),
			Assinatura_Digital: "x", IdUnidade: &c.loja2,
			Itens: []model.ItemParaInserir{{ID_epi: c.epi, ID_tamanho: c.tam, Quantidade: 30}},
		}, c.tenant, "t")
		require.EqualError(t, err, "estoque insuficiente em Loja 2: faltam 18 unidade(s) dentro da validade; há 5 em outras unidades")
	})

	t.Run("devolução volta para a unidade do funcionário e cancelamento repõe no lote de origem", func(t *testing.T) {
		c := novoCenarioDuasLojas(t)
		defer c.db.Close()
		require.NoError(t, c.entrada(t, &c.loja1, "NF-L1", 10, validadeLonga))
		require.NoError(t, c.entrada(t, &c.loja2, "NF-L2", 10, validadeLonga))

		require.NoError(t, c.entrega(4, nil))      // Loja 1: 6
		require.NoError(t, c.entrega(3, &c.loja2)) // Loja 2: 7 (os dois lotes têm espaço para receber devolução)

		require.NoError(t, c.devolucoes.SalvarDevolucao(c.ctx, model.DevolucaoInserir{
			IdFuncionario: int(c.funcionario), IdEpi: int(c.epi), IdMotivo: int(c.motivoVoltaAoEstoque), IdTamanho: int(c.tam),
			DataDevolucao: *configs.NewDataBrPtr(time.Now()), QuantidadeADevolver: 2, Iduser: int(c.user),
			AssinaturaDigital: "assinatura-devolucao", Observacao: new(string),
		}, c.tenant, "token-devolucao"))
		require.Equal(t, int32(8), c.saldo(t, c.loja1), "Loja 1: 6 + 2 devolvidos")
		require.Equal(t, int32(7), c.saldo(t, c.loja2), "Loja 2 não recebe a devolução")

		var unidadeDevolucao int32
		require.NoError(t, c.db.QueryRow(c.ctx, "SELECT id_unidade FROM devolucao WHERE tenant_id = $1", c.tenant).Scan(&unidadeDevolucao))
		require.Equal(t, c.loja1, unidadeDevolucao)

		// cancelar a entrega feita na Loja 2 devolve para a Loja 2
		var idEntregaLoja2 int
		require.NoError(t, c.db.QueryRow(c.ctx, "SELECT id FROM entrega_epi WHERE tenant_id = $1 AND id_unidade = $2", c.tenant, c.loja2).Scan(&idEntregaLoja2))
		require.NoError(t, c.entregas.CancelarEntrega(c.ctx, int(c.tenant), idEntregaLoja2, int(c.user)))
		require.Equal(t, int32(10), c.saldo(t, c.loja2), "Loja 2: 7 + 3 do cancelamento")
		require.Equal(t, int32(8), c.saldo(t, c.loja1))
	})

	t.Run("troca na devolução sai da mesma unidade", func(t *testing.T) {
		c := novoCenarioDuasLojas(t)
		defer c.db.Close()
		require.NoError(t, c.entrada(t, &c.loja1, "NF-L1", 10, validadeLonga))
		require.NoError(t, c.entrada(t, &c.loja2, "NF-L2", 10, validadeCurta))
		require.NoError(t, c.entrega(4, nil)) // Loja 1: 6

		um := 1
		epi, tam := int(c.epi), int(c.tam)
		require.NoError(t, c.devolucoes.SalvarDevolucao(c.ctx, model.DevolucaoInserir{
			IdFuncionario: int(c.funcionario), IdEpi: epi, IdMotivo: int(c.motivoVoltaAoEstoque), IdTamanho: tam,
			DataDevolucao: *configs.NewDataBrPtr(time.Now()), QuantidadeADevolver: 1, Iduser: int(c.user),
			AssinaturaDigital: "assinatura-troca", Observacao: new(string),
			Troca: true, IdEpiNovo: &epi, IdTamanhoNovo: &tam, NovaQuantidade: &um,
		}, c.tenant, "token-troca"))
		require.Equal(t, int32(6), c.saldo(t, c.loja1), "Loja 1: 6 + 1 devolvido - 1 da troca")
		require.Equal(t, int32(10), c.saldo(t, c.loja2), "Loja 2 intacta, mesmo vencendo antes")
	})

	t.Run("duas entregas simultâneas na mesma unidade não passam do saldo", func(t *testing.T) {
		c := novoCenarioDuasLojas(t)
		defer c.db.Close()
		require.NoError(t, c.entrada(t, &c.loja1, "NF-L1", 10, validadeLonga))
		require.NoError(t, c.entrada(t, &c.loja2, "NF-L2", 50, validadeLonga))

		erros := make(chan error, 2)
		for range 2 {
			go func() { erros <- c.entrega(6, nil) }()
		}
		e1, e2 := <-erros, <-erros
		require.True(t, (e1 == nil) != (e2 == nil), "só uma das duas deveria passar: %v | %v", e1, e2)
		require.Equal(t, int32(4), c.saldo(t, c.loja1), "Loja 1: 10 - 6")
		require.Equal(t, int32(50), c.saldo(t, c.loja2), "a falta não puxou da Loja 2")
	})
}

// Fase 5: as listagens e o dashboard aceitam ?id_unidade= (0 = todas).
func TestFiltroPorUnidade(t *testing.T) {
	c := novoCenarioDuasLojas(t)
	defer c.db.Close()
	validade := time.Now().AddDate(3, 0, 0)

	// Bruno trabalha na Loja 2; o funcionário do cenário, na Loja 1
	funcionarios := NewFuncionarioService(repository.NewFuncionarioRepository(c.db), repository.NewEntregaRepository(c.db), repository.NewEpiRepository(c.db), c.db)
	var dep, funcao int32
	require.NoError(t, c.db.QueryRow(c.ctx, "SELECT iddepartamento, idfuncao FROM funcionario WHERE id = $1", c.funcionario).Scan(&dep, &funcao))
	require.NoError(t, funcionarios.SalvarFuncionario(c.ctx, model.FuncionarioInserir{
		Nome: "Bruno Loja Dois", ID_departamento: dep, ID_funcao: funcao, Cpf: "44444444444", IdUnidade: &c.loja2,
	}, c.tenant))
	var bruno int32
	require.NoError(t, c.db.QueryRow(c.ctx, "SELECT id FROM funcionario WHERE cpf = '44444444444' AND tenant_id = $1", c.tenant).Scan(&bruno))

	require.NoError(t, c.entrada(t, &c.loja1, "NF-L1", 10, validade))
	require.NoError(t, c.entrada(t, &c.loja2, "NF-L2", 20, validade))
	require.NoError(t, c.entrega(2, nil)) // Loja 1
	require.NoError(t, c.entregas.Salvar(c.ctx, model.EntregaParaInserir{
		ID_funcionario: bruno, Id_user: c.user, Data_entrega: *configs.NewDataBrPtr(time.Now()), Assinatura_Digital: "b",
		Itens: []model.ItemParaInserir{{ID_epi: c.epi, ID_tamanho: c.tam, Quantidade: 5}},
	}, c.tenant, "t")) // Loja 2
	require.NoError(t, c.devolucoes.SalvarDevolucao(c.ctx, model.DevolucaoInserir{
		IdFuncionario: int(c.funcionario), IdEpi: int(c.epi), IdMotivo: int(c.motivoVoltaAoEstoque), IdTamanho: int(c.tam),
		DataDevolucao: *configs.NewDataBrPtr(time.Now()), QuantidadeADevolver: 1, Iduser: int(c.user),
		AssinaturaDigital: "d", Observacao: new(string),
	}, c.tenant, "t")) // Loja 1

	todas, l1, l2 := int32(0), c.loja1, c.loja2
	pag := FiltroPaginacao{Quantidade: 50}

	// estoque
	for unidade, saldo := range map[int32]int{todas: 10 - 2 + 1 + 20 - 5, l1: 9, l2: 15} {
		lotes, err := c.entradas.BuscaEntradaEstoque(c.ctx, c.tenant, unidade)
		require.NoError(t, err)
		soma := 0
		for _, l := range lotes {
			soma += int(l.QuantidadeAtual)
		}
		require.Equal(t, saldo, soma, "saldo do estoque com id_unidade=%d", unidade)
	}

	// listas e dashboard: quantas linhas cada unidade vê
	conta := func(unidade int32) map[string]int {
		r := map[string]int{}
		ent, err := c.entradas.ListarEntradas(c.ctx, FiltroEntradas{IdUnidade: unidade, Quantidade: 50}, c.tenant)
		require.NoError(t, err)
		r["entradas"], r["entradas_total"] = len(ent.Entradas), int(ent.Total)
		entr, err := c.entregas.ListaEntregas(c.ctx, FiltroEntregas{IdUnidade: unidade, Quantidade: 50}, c.tenant)
		require.NoError(t, err)
		r["entregas"] = len(entr.Entradas)
		dash, err := c.entregas.BuscaEntregaDash(c.ctx, c.tenant, unidade)
		require.NoError(t, err)
		r["entregas_dash"] = len(dash)
		itens, err := c.entregas.BuscaItemDash(c.ctx, c.tenant, unidade)
		require.NoError(t, err)
		r["itens_dash"] = len(itens)
		entDash, err := c.entradas.EntradaDashbordBusca(c.ctx, c.tenant, unidade)
		require.NoError(t, err)
		r["entradas_dash"] = len(entDash)
		dev, err := c.devolucoes.ListarDevolucoes(c.ctx, c.tenant, unidade)
		require.NoError(t, err)
		r["devolucoes"] = len(dev)
		fdash, err := funcionarios.FuncionariosDashbord(c.ctx, c.tenant, unidade)
		require.NoError(t, err)
		r["funcionarios_dash"] = len(fdash)
		fcomp, err := funcionarios.FuncionarioCompleto(c.ctx, c.tenant, unidade)
		require.NoError(t, err)
		r["funcionarios"] = len(fcomp)
		flist, err := funcionarios.ListaTodosFuncionarios(c.ctx, FiltroFuncionario{IdUnidade: unidade, FiltroPaginacao: pag}, c.tenant)
		require.NoError(t, err)
		r["funcionarios_lista"] = len(flist.Funcionarios)
		return r
	}
	um := map[string]int{"entradas": 1, "entradas_total": 1, "entregas": 1, "entregas_dash": 1, "itens_dash": 1, "entradas_dash": 1, "funcionarios_dash": 1, "funcionarios": 1, "funcionarios_lista": 1}
	l1Esperado := map[string]int{"devolucoes": 1}
	l2Esperado := map[string]int{"devolucoes": 0}
	todasEsperado := map[string]int{"devolucoes": 1}
	for k, v := range um {
		l1Esperado[k], l2Esperado[k], todasEsperado[k] = v, v, 2*v
	}
	require.Equal(t, todasEsperado, conta(todas), "sem filtro")
	require.Equal(t, l1Esperado, conta(l1), "Loja 1")
	require.Equal(t, l2Esperado, conta(l2), "Loja 2")
}
