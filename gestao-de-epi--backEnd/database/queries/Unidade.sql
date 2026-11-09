-- Unidades (lojas, obras, almoxarifados) do tenant. Toda query filtra por tenant_id.

-- name: CriarUnidade :one
-- Respeita planos.limite_unidades (NULL ou empresa sem plano = ilimitado): no limite, não insere nada
-- e volta sem linha, que o repository traduz para ErrLimiteExcedido.
-- ponytail: duas criações simultâneas podem passar do limite por 1; travar a linha da empresa se importar
INSERT INTO unidade (tenant_id, nome)
SELECT e.id, sqlc.arg('nome')
FROM empresas e
LEFT JOIN planos p ON p.id = e.plano_id
WHERE e.id = sqlc.arg('tenant_id')
  AND (p.limite_unidades IS NULL
       OR (SELECT COUNT(*) FROM unidade u WHERE u.tenant_id = e.id AND u.deletado_em IS NULL) < p.limite_unidades)
RETURNING id, nome;

-- name: ListarUnidades :many
-- funcionarios e saldo ajudam a tela (e explicam por que uma unidade não pode ser desativada)
SELECT
    u.id,
    u.nome,
    (SELECT COUNT(*) FROM funcionario f
      WHERE f.tenant_id = u.tenant_id AND f.id_unidade = u.id AND f.ativo = TRUE)::int AS funcionarios,
    (SELECT COALESCE(SUM(ei.quantidade_atual), 0) FROM entrada_epi_item ei
      WHERE ei.tenant_id = u.tenant_id AND ei.id_unidade = u.id AND ei.ativo = TRUE)::int AS saldo
FROM unidade u
WHERE u.tenant_id = sqlc.arg('tenant_id')
  AND u.deletado_em IS NULL
  -- usuário limitado a algumas unidades só enxerga elas; NULL = todas
  AND (sqlc.narg('permitidas')::int[] IS NULL OR u.id = ANY(sqlc.narg('permitidas')::int[]))
ORDER BY u.id;

-- name: RenomearUnidade :execrows
UPDATE unidade
SET nome = $3
WHERE id = $1
  AND tenant_id = $2
  AND deletado_em IS NULL;

-- name: DesativarUnidade :execrows
UPDATE unidade
SET ativo = FALSE,
    deletado_em = now()
WHERE id = $1
  AND tenant_id = $2
  AND deletado_em IS NULL;

-- name: UnidadeAtiva :one
SELECT EXISTS (
    SELECT 1 FROM unidade WHERE id = $1 AND tenant_id = $2 AND deletado_em IS NULL
) AS ativa;

-- name: ContarUnidadesAtivas :one
SELECT COUNT(*) FROM unidade WHERE tenant_id = $1 AND deletado_em IS NULL;

-- name: ListarAcessosUsuarios :many
-- usuários ativos do tenant com as unidades que podem ver (vazio = todas)
SELECT u.id, u.nome, u.email, COALESCE(u.role, '')::text AS role,
    ARRAY(SELECT uu.id_unidade FROM usuario_unidade uu WHERE uu.usuario_id = u.id ORDER BY uu.id_unidade)::int[] AS unidades
FROM usuarios u
WHERE u.tenant_id = $1
  AND u.ativo = TRUE
ORDER BY u.nome;

-- name: LimparUnidadesUsuario :exec
DELETE FROM usuario_unidade WHERE usuario_id = $1 AND tenant_id = $2;

-- name: AdicionarUnidadesUsuario :exec
-- a FK composta recusa usuário ou unidade de outro tenant
INSERT INTO usuario_unidade (usuario_id, id_unidade, tenant_id)
SELECT sqlc.arg('usuario_id')::int, unnest(sqlc.arg('unidades')::int[]), sqlc.arg('tenant_id')::int;
