-- name: GetTenantBySubdomain :one
SELECT id, nome_fantasia 
FROM empresas 
WHERE subdominio = $1 
  AND status IN ('Ativa', 'Em teste');

-- name: CriarEmpresa :exec
INSERT INTO empresas (
    nome_fantasia,
    razao_social,
    cnpj,
    responsavel,
    email,
    telefone,
    plano_id,
    status,
    vencimento,
    observacoes,
    subdominio
) VALUES (
    sqlc.arg('nome_fantasia'),
    sqlc.arg('razao_social'),
    sqlc.arg('cnpj'),
    sqlc.arg('responsavel'),
    sqlc.arg('email'),
    sqlc.arg('telefone'),
    sqlc.arg('plano_id'),
    sqlc.arg('status'),
    sqlc.arg('vencimento'),
    sqlc.arg('observacoes'),
    sqlc.arg('subdominio')
);


-- Painel master: os números somam todas as empresas clientes (é a única área sem filtro de tenant, de
-- propósito). "Cliente" = toda empresa menos a matriz, que é a do super_admin.

-- name: ResumoMaster :one
WITH clientes AS (
    SELECT e.id, e.status, e.vencimento, p.mensalidade
    FROM empresas e
    LEFT JOIN planos p ON p.id = e.plano_id
    WHERE NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.tenant_id = e.id AND u.role = 'super_admin')
)
SELECT
    (COUNT(*) FILTER (WHERE status = 'Ativa'))::int AS empresas_ativas,
    (COUNT(*) FILTER (WHERE status = 'Bloqueada'))::int AS empresas_bloqueadas,
    (COUNT(*) FILTER (WHERE status = 'Em teste'))::int AS empresas_em_teste,
    COUNT(*)::int AS total_empresas,
    (COUNT(*) FILTER (WHERE status <> 'Bloqueada' AND vencimento < CURRENT_DATE))::int AS empresas_vencidas,
    -- receita: o plano de cada empresa ativa (em teste e bloqueada não pagam)
    COALESCE(SUM(mensalidade) FILTER (WHERE status = 'Ativa'), 0)::float8 AS receita_mensal,
    (SELECT COUNT(*) FROM funcionario f WHERE f.ativo = TRUE AND f.tenant_id IN (SELECT id FROM clientes))::int AS total_funcionarios,
    (SELECT COUNT(*) FROM epi ep WHERE ep.ativo = TRUE AND ep.tenant_id IN (SELECT id FROM clientes))::int AS total_epis,
    (SELECT COUNT(*) FROM entrega_epi en WHERE en.ativo = TRUE AND en.tenant_id IN (SELECT id FROM clientes))::int AS total_entregas
FROM clientes;

-- name: AlertasMaster :many
-- Empresas não bloqueadas com vencimento passado ou em até 7 dias, ou sem nenhum acesso há 14 dias ou mais.
-- ultimo_acesso é gravado no horário de São Paulo; por isso a conta de dias usa o mesmo fuso.
WITH clientes AS (
    SELECT e.id, e.nome_fantasia, e.vencimento, e.criado_em,
        (SELECT MAX(u.ultimo_acesso) FROM usuarios u WHERE u.tenant_id = e.id AND u.ativo = TRUE) AS ultimo_acesso
    FROM empresas e
    WHERE e.status <> 'Bloqueada'
      AND NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.tenant_id = e.id AND u.role = 'super_admin')
)
SELECT
    id, nome_fantasia,
    COALESCE(vencimento - (now() AT TIME ZONE 'America/Sao_Paulo')::date, 0)::int AS dias_para_vencer,
    (vencimento IS NOT NULL)::bool AS tem_vencimento,
    ((now() AT TIME ZONE 'America/Sao_Paulo')::date - COALESCE(ultimo_acesso, criado_em)::date)::int AS dias_sem_acesso,
    (ultimo_acesso IS NULL)::bool AS nunca_acessou
FROM clientes
WHERE vencimento <= (now() AT TIME ZONE 'America/Sao_Paulo')::date + 7
   OR COALESCE(ultimo_acesso, criado_em) < (now() AT TIME ZONE 'America/Sao_Paulo') - INTERVAL '14 days'
ORDER BY nome_fantasia;


-- name: EmpresasRecentes :many
SELECT 
    e.id, 
    e.nome_fantasia, 
    e.subdominio, 
    e.responsavel,
    e.status, 
    p.nome AS plano_nome, 
    p.mensalidade::float8,
    -- As subqueries agora estão no lugar certo (no SELECT), separadas por vírgula
    (SELECT COUNT(*)::int FROM funcionario f WHERE f.tenant_id = e.id) AS funcionarios,
    (SELECT COUNT(*)::int FROM epi ep WHERE ep.tenant_id = e.id) AS epis
FROM empresas e
INNER JOIN planos p ON e.plano_id = p.id
WHERE NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.tenant_id = e.id AND u.role = 'super_admin')
ORDER BY e.criado_em DESC, e.id DESC;


-- name: DadosEmpresas :many
SELECT 
    e.id, 
    e.nome_fantasia as nome, 
    e.cnpj,
    e.responsavel,
    e.email,
    e.telefone, 
    p.nome AS plano_nome, 
    (SELECT COUNT(*)::int FROM funcionario f WHERE f.tenant_id = e.id) AS funcionarios,
    (SELECT COUNT(*)::int FROM epi ep WHERE ep.tenant_id = e.id) AS epis,
    (SELECT COUNT(*)::int FROM unidade u WHERE u.tenant_id = e.id AND u.deletado_em IS NULL) AS unidades,
    p.limite_unidades,
    p.mensalidade::float8,
    e.vencimento,
    e.status,
    e.observacoes    
FROM empresas e
INNER JOIN planos p ON e.plano_id = p.id;


-- name: EditarEmpresa :exec
UPDATE empresas
SET
    nome_fantasia = @nome_fantasia,
    razao_social = @razao_social,
    cnpj = @cnpj,
    responsavel = @responsavel,
    email = @email,
    telefone = @telefone,
    plano_id = @plano_id,
    status = @status,
    vencimento = @vencimento,
    observacoes = @observacoes
where id = @id;

-- name: ValidaTotalFuncionarios :one
select e.nome_fantasia, p.limite_funcionarios
from empresas e
inner join planos p on e.plano_id = p.id
where e.id = @id
FOR UPDATE;


-- name: ValidaTotalUsuarios :one
select e.nome_fantasia, p.limite_usuarios
from empresas e
inner join planos p on e.plano_id = p.id
where e.id = @id
FOR UPDATE;