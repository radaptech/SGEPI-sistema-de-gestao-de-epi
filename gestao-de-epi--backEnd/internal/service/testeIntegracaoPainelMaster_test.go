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
	var planoPequeno int64       // 1 funcionário, 5 usuários, unidades ilimitadas
	require.NoError(t, db.QueryRow(ctx, `INSERT INTO planos (nome, mensalidade, limite_funcionarios, limite_usuarios, status, descricao)
		VALUES ('pequeno', 500, 1, 5, 'Ativo', 'teste') RETURNING id`).Scan(&planoPequeno))

	empresaNoPlano := func(plano int64, nome, status string, vencimentoEmDias, criadaHaDias int) int64 {
		id := CreateEmpresa(t, db, plano)
		_, err := db.Exec(ctx, `UPDATE empresas SET nome_fantasia = $2, status = $3,
			vencimento = (now() AT TIME ZONE 'America/Sao_Paulo')::date + $4::int,
			criado_em = (now() AT TIME ZONE 'America/Sao_Paulo') - make_interval(days => $5) WHERE id = $1`, // mesmo fuso do painel
			id, nome, status, vencimentoEmDias, criadaHaDias)
		require.NoError(t, err)
		time.Sleep(2 * time.Millisecond) // CreateEmpresa gera CNPJ/subdomínio pelo relógio
		return id
	}
	empresa := func(nome, status string, vencimentoEmDias, criadaHaDias int) int64 {
		return empresaNoPlano(plano, nome, status, vencimentoEmDias, criadaHaDias)
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

	// plano pequeno: 1 de 1 funcionário (esgotado) e 4 de 5 usuários (80%)
	cheia := empresaNoPlano(planoPequeno, "Cheia", "Ativa", 200, 1)
	iddep = CreateDepartamento(t, db, cheia)
	CreateFuncionario(t, db, iddep, CreateFuncao(t, db, iddep, cheia), cheia)
	for range 4 {
		CreateUser(t, db, cheia)
		time.Sleep(2 * time.Millisecond) // CreateUser gera e-mail pelo relógio
	}

	serv := NewEmpresaService(repository.NewEmpresaRepository(db), repository.NewPlanosRepository(db))

	resumo, err := serv.EmpresaDashboard(ctx)
	require.NoError(t, err)
	require.Equal(t, 5, resumo.TotalEmpresas, "a matriz não conta")
	require.Equal(t, 3, resumo.EmpresasAtivas)
	require.Equal(t, 1, resumo.EmpresasEmTeste)
	require.Equal(t, 1, resumo.EmpresasBloqueadas)
	require.Equal(t, 1, resumo.EmpresasVencidas, "a bloqueada não entra como vencida")
	require.Equal(t, 2500.0, resumo.ReceitaMensal, "só as ativas pagam, cada uma o seu plano")
	require.Equal(t, 2, resumo.TotalFuncionarios)

	alertas, err := serv.Alertas(ctx)
	require.NoError(t, err)
	mensagens := make([]string, len(alertas))
	for i, a := range alertas {
		mensagens[i] = a.Nivel + " " + a.Mensagem
	}
	require.Equal(t, []string{
		"alto Vencida: venceu há 2 dia(s)",
		"alto Cheia: chegou ao limite de funcionários do plano (1 de 1)",
		"medio Trial: vence em 3 dia(s)",
		"medio Cheia: usando 4 de 5 usuários do plano",
		"medio Trial: cadastrada há 20 dias e nunca acessou",
	}, mensagens)

	recentes, err := serv.EmpresaRecentes(ctx)
	require.NoError(t, err)
	require.Len(t, recentes, 5)
	require.Equal(t, "Cheia", recentes[0].Nome, "a mais nova primeiro")
}
