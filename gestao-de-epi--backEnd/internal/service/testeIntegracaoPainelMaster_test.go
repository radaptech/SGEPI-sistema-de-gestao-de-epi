package service

import (
	"context"
	"testing"
	"time"

	"github.com/davi-fernandesx/sistema-de-gestao-de-epi/database/repository"
	"github.com/stretchr/testify/require"
)

// Painel master: resumo sem a empresa matriz e alertas de vencimento e de empresa sem uso.
func TestPainelMaster(t *testing.T) {
	ctx := context.Background()
	db := SetupTestDB(t)
	defer db.Close()

	plano := CreatePlanos(t, db) // mensalidade 1000
	empresa := func(nome, status string, vencimentoEmDias, criadaHaDias int) int64 {
		id := CreateEmpresa(t, db, plano)
		_, err := db.Exec(ctx, `UPDATE empresas SET nome_fantasia = $2, status = $3,
			vencimento = CURRENT_DATE + $4::int, criado_em = now() - make_interval(days => $5) WHERE id = $1`,
			id, nome, status, vencimentoEmDias, criadaHaDias)
		require.NoError(t, err)
		time.Sleep(2 * time.Millisecond) // CreateEmpresa gera CNPJ/subdomínio pelo relógio
		return id
	}

	matriz := empresa("Matriz", "Ativa", -30, 100)
	_, err := db.Exec(ctx, "UPDATE usuarios SET role = 'super_admin' WHERE id = $1", CreateUser(t, db, matriz))
	require.NoError(t, err)

	vencida := empresa("Vencida", "Ativa", -2, 60)
	acessou := CreateUser(t, db, vencida)
	_, err = db.Exec(ctx, "UPDATE usuarios SET ultimo_acesso = now() AT TIME ZONE 'America/Sao_Paulo' WHERE id = $1", acessou)
	require.NoError(t, err)
	iddep := CreateDepartamento(t, db, vencida)
	CreateFuncionario(t, db, iddep, CreateFuncao(t, db, iddep, vencida), vencida)

	empresa("Trial", "Em teste", 3, 20) // vence logo e ninguém nunca entrou
	empresa("Bloqueada", "Bloqueada", -90, 200)
	empresa("Em dia", "Ativa", 200, 1) // nova: sem alerta

	serv := NewEmpresaService(repository.NewEmpresaRepository(db), repository.NewPlanosRepository(db))

	resumo, err := serv.EmpresaDashboard(ctx)
	require.NoError(t, err)
	require.Equal(t, 4, resumo.TotalEmpresas, "a matriz não conta")
	require.Equal(t, 2, resumo.EmpresasAtivas)
	require.Equal(t, 1, resumo.EmpresasEmTeste)
	require.Equal(t, 1, resumo.EmpresasBloqueadas)
	require.Equal(t, 1, resumo.EmpresasVencidas, "a bloqueada não entra como vencida")
	require.Equal(t, 2000.0, resumo.ReceitaMensal, "só as ativas pagam, cada uma o seu plano")
	require.Equal(t, 1, resumo.TotalFuncionarios)

	alertas, err := serv.Alertas(ctx)
	require.NoError(t, err)
	mensagens := make([]string, len(alertas))
	for i, a := range alertas {
		mensagens[i] = a.Nivel + " " + a.Mensagem
	}
	require.Equal(t, []string{
		"alto Vencida: venceu há 2 dia(s)",
		"medio Trial: vence em 3 dia(s)",
		"medio Trial: cadastrada há 20 dias e nunca acessou",
	}, mensagens)

	recentes, err := serv.EmpresaRecentes(ctx)
	require.NoError(t, err)
	require.Len(t, recentes, 4)
	require.Equal(t, "Em dia", recentes[0].Nome, "a mais nova primeiro")
}
