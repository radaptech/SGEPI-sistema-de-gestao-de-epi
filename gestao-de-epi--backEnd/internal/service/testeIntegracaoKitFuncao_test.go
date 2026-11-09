package service

import (
	"context"
	"testing"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/database/repository"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/helper"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/model"
	"github.com/stretchr/testify/require"
)

// Cobre o SalvarKitFuncao: troca do kit inteiro numa instrução só e isolamento por tenant.
func TestKitFuncao(t *testing.T) {
	ctx := context.Background()
	db := SetupTestDB(t)
	defer db.Close()

	svc := NewFuncaoService(repository.NewFuncaoRepository(db))

	idPlano := CreatePlanos(t, db)
	tenant := CreateEmpresa(t, db, idPlano)
	funcao := CreateFuncao(t, db, CreateDepartamento(t, db, tenant), tenant)
	protecao := CreateProtecao(t, db)
	luva, botina, oculos := CreateEpi(t, db, protecao, tenant), CreateEpi(t, db, protecao, tenant), CreateEpi(t, db, protecao, tenant)

	outroTenant := CreateEmpresa(t, db, idPlano)
	epiDeOutro := CreateEpi(t, db, CreateProtecao(t, db), outroTenant)

	item := func(id int64, qtd int32) model.KitItem { return model.KitItem{IdEpi: int32(id), Quantidade: qtd} }
	kit := func(tenantID int64) map[int32]int32 {
		itens, err := svc.ListarKit(ctx, int(funcao), int32(tenantID))
		require.NoError(t, err)
		m := map[int32]int32{}
		for _, i := range itens {
			m[i.IdEpi] = i.Quantidade
		}
		return m
	}

	// cria o kit; EPI de outra empresa é ignorado
	require.NoError(t, svc.SalvarKit(ctx, int(funcao), []model.KitItem{item(luva, 2), item(botina, 1), item(epiDeOutro, 1)}, int32(tenant)))
	require.Equal(t, map[int32]int32{int32(luva): 2, int32(botina): 1}, kit(tenant))

	// troca: botina sai, luva muda a quantidade, óculos entra
	require.NoError(t, svc.SalvarKit(ctx, int(funcao), []model.KitItem{item(luva, 4), item(oculos, 1)}, int32(tenant)))
	require.Equal(t, map[int32]int32{int32(luva): 4, int32(oculos): 1}, kit(tenant))

	// outro tenant não enxerga nem altera o kit desta função
	require.Empty(t, kit(outroTenant))
	require.NoError(t, svc.SalvarKit(ctx, int(funcao), nil, int32(outroTenant)))
	require.Len(t, kit(tenant), 2)

	// EPI repetido é rejeitado
	require.ErrorIs(t, svc.SalvarKit(ctx, int(funcao), []model.KitItem{item(luva, 1), item(luva, 2)}, int32(tenant)), helper.ErrDadoDuplicado)

	// lista vazia limpa o kit
	require.NoError(t, svc.SalvarKit(ctx, int(funcao), nil, int32(tenant)))
	require.Empty(t, kit(tenant))
}

// Cobre o ListarFaltasKit: posse (entregue − devolvido) comparada com o kit da função.
func TestFaltasKit(t *testing.T) {
	ctx := context.Background()
	db := SetupTestDB(t)
	defer db.Close()

	kitSvc := NewFuncaoService(repository.NewFuncaoRepository(db))
	entregaSvc := NewEntregaService(repository.NewEntregaRepository(db), db)

	idPlano := CreatePlanos(t, db)
	tenant := CreateEmpresa(t, db, idPlano)
	user := CreateUser(t, db, tenant)
	dep := CreateDepartamento(t, db, tenant)
	funcao := CreateFuncao(t, db, dep, tenant)
	luva, botina := CreateEpi(t, db, CreateProtecao(t, db), tenant), CreateEpi(t, db, CreateProtecao(t, db), tenant)
	tamanho := CreateTamanho(t, db, tenant)
	nf := CreateEntradaNfEpi(t, db, tenant, user, CreateFornecedor(t, db, tenant))
	lote := map[int64]int64{
		luva:   CreateEntradaEpi(t, db, tenant, luva, tamanho, user, nf),
		botina: CreateEntradaEpi(t, db, tenant, botina, tamanho, user, nf),
	}

	// kit: 2 luvas e 1 botina
	require.NoError(t, kitSvc.SalvarKit(ctx, int(funcao), []model.KitItem{
		{IdEpi: int32(luva), Quantidade: 2}, {IdEpi: int32(botina), Quantidade: 1},
	}, int32(tenant)))

	// CreateEpiEntregues entrega 10 unidades
	entregar := func(funcionario int64, epis ...int64) {
		entrega := CreateEntregaEpi(t, db, funcionario, user, tenant)
		for _, epi := range epis {
			CreateEpiEntregues(t, db, entrega, lote[epi], epi, tamanho, tenant)
		}
	}

	semNada := CreateFuncionario(t, db, dep, funcao, tenant)
	soLuva := CreateFuncionario(t, db, dep, funcao, tenant)
	completo := CreateFuncionario(t, db, dep, funcao, tenant)
	devolveu := CreateFuncionario(t, db, dep, funcao, tenant)

	entregar(soLuva, luva)
	entregar(completo, luva, botina)
	entregar(devolveu, luva, botina)
	motivo := CreateMotivoDevolucao(t, db, "Desgaste", false, tenant)
	_, err := db.Exec(ctx, `INSERT INTO devolucao (tenant_id, idepi, idfuncionario, idmotivo, data_devolucao, idtamanho, quantidadeadevolver, assinatura_digital)
		VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, 10, 'x')`, tenant, botina, devolveu, motivo, tamanho)
	require.NoError(t, err)

	faltas, err := entregaSvc.ListarFaltasKit(ctx, int32(tenant), 0)
	require.NoError(t, err)

	got := map[[2]int32]int32{} // {funcionario, epi} → em posse
	for _, f := range faltas {
		got[[2]int32{f.FuncionarioId, f.EpiId}] = f.EmPosse
	}
	require.Equal(t, map[[2]int32]int32{
		{int32(semNada), int32(luva)}:    0,
		{int32(semNada), int32(botina)}:  0,
		{int32(soLuva), int32(botina)}:   0,
		{int32(devolveu), int32(botina)}: 0,
	}, got)

	// outro tenant não vê as faltas deste
	outro, err := entregaSvc.ListarFaltasKit(ctx, int32(CreateEmpresa(t, db, idPlano)), 0)
	require.NoError(t, err)
	require.Empty(t, outro)
}
