package service

import (
	"context"
	"testing"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/database/repository"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/helper"
	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/model"
	"github.com/stretchr/testify/require"
)

// Limite de funcionários do plano: no limite recusa, e desativar um funcionário libera a vaga.
func TestLimiteFuncionariosDoPlano(t *testing.T) {
	ctx := context.Background()
	db := SetupTestDB(t)
	defer db.Close()

	plano := CreatePlanos(t, db)
	_, err := db.Exec(ctx, "UPDATE planos SET limite_funcionarios = 1 WHERE id = $1", plano)
	require.NoError(t, err)
	empresa := CreateEmpresa(t, db, plano)
	tenant := int32(empresa)
	iddep := CreateDepartamento(t, db, empresa)
	idfuncao := CreateFuncao(t, db, iddep, empresa)
	primeiro := CreateFuncionario(t, db, iddep, idfuncao, empresa)

	serv := NewFuncionarioService(repository.NewFuncionarioRepository(db), repository.NewEntregaRepository(db), repository.NewEpiRepository(db), db)
	novo := model.FuncionarioInserir{Nome: "Segundo", ID_departamento: int32(iddep), ID_funcao: int32(idfuncao), Cpf: "52998224725"}

	require.ErrorIs(t, serv.SalvarFuncionario(ctx, novo, tenant), helper.ErrLimiteExcedido)

	require.NoError(t, serv.DeletarFuncionario(ctx, int(primeiro), tenant))
	require.NoError(t, serv.SalvarFuncionario(ctx, novo, tenant), "o desativado não ocupa vaga")
}
