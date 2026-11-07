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
