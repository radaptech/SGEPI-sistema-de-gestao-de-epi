-- name: AddPlano :one
INSERT INTO planos (nome, mensalidade, limite_funcionarios, limite_usuarios, status, descricao, limite_unidades)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id;

-- name: BuscaPlanos :many
SELECT id, nome, mensalidade, limite_funcionarios, limite_usuarios, status, descricao, limite_unidades
FROM planos
WHERE status = 'Ativo'
ORDER BY nome ASC;

-- name: AtualizarPlano :exec
-- Os limites são gravados como vêm: NULL = ilimitado (a tela de edição manda sempre os quatro).
UPDATE planos
SET
  nome = COALESCE(sqlc.narg('nome'), nome),
  mensalidade = COALESCE(sqlc.narg('mensalidade'), mensalidade),
  descricao = COALESCE(sqlc.narg('descricao'), descricao),
  limite_funcionarios = sqlc.narg('limite_funcionarios'),
  limite_usuarios = sqlc.narg('limite_usuarios'),
  limite_unidades = sqlc.narg('limite_unidades'),
  status = COALESCE(sqlc.narg('status'), status)
WHERE id = sqlc.arg('id');


-- name: AtualizarStatusPlano :exec
UPDATE planos
SET status = sqlc.arg('status')
WHERE id = sqlc.arg('id');

-- name: BuscarPlanoPorNome :one
select id, nome from planos 
where nome = $1 and status = 'Ativo';