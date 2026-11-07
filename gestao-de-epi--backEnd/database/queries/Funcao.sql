-- name: AddFuncao :exec
INSERT INTO funcao (tenant_id, nome, IdDepartamento) 
VALUES ($1, $2, $3)
ON CONFLICT (tenant_id, nome, IdDepartamento) WHERE deletado_em IS NULL DO NOTHING;

-- name: BuscarFuncao :one
SELECT 
    f.id, 
    f.nome, 
    f.IdDepartamento, 
    d.nome as departamento_nome
FROM funcao f
INNER JOIN departamento d ON f.IdDepartamento = d.id
WHERE f.id = $1 
  AND f.tenant_id = $2 -- SEGURANÇA
  AND f.ativo = TRUE;

-- name: BuscarTodasFuncoes :many
SELECT 
    f.id, 
    f.nome, 
    f.IdDepartamento, 
    d.nome as departamento_nome,
    COUNT(*) OVER() AS total_geral
FROM funcao f
INNER JOIN departamento d ON f.IdDepartamento = d.id
WHERE f.tenant_id = sqlc.arg('tenant_id') -- SEGURANÇA
  AND (sqlc.narg('nome')::text IS NULL OR f.nome ILIKE '%' || sqlc.narg('nome') || '%')
  AND (sqlc.narg('id')::int IS NULL OR f.id = sqlc.narg('id')::int)
  AND (
    (sqlc.arg('cancelados')::boolean IS FALSE AND f.deletado_em IS NULL) OR
    (sqlc.arg('cancelados')::boolean IS TRUE AND f.deletado_em IS NOT NULL)
  )
  AND (sqlc.narg('nome_departamento')::text IS NULL OR d.nome ILIKE '%' || sqlc.narg('nome_departamento') || '%')
ORDER BY f.nome ASC
LIMIT $1 OFFSET $2;

-- name: DeletarFuncao :execrows
UPDATE funcao
SET ativo = FALSE,
    deletado_em = current_date
WHERE id = $1 
  AND tenant_id = $2 -- SEGURANÇA
  AND ativo = TRUE;

-- name: UpdateFuncao :execrows
UPDATE funcao
SET nome = $2
WHERE id = $1 
  AND tenant_id = $3 -- SEGURANÇA
  AND ativo = TRUE;


-- name: BuscaDepartamentosMap :many
SELECT id, nome
from departamento
where tenant_id = @id and deletado_em IS NULL;

-- name: ListarKitFuncao :many
SELECT e.id AS id_epi, e.nome, e.CA, fe.quantidade
FROM funcao_epi fe
INNER JOIN epi e ON e.id = fe.id_epi AND e.tenant_id = fe.tenant_id
WHERE fe.tenant_id = @tenant_id -- SEGURANÇA
  AND fe.id_funcao = @id_funcao
  AND e.ativo = TRUE
ORDER BY e.nome;

-- name: SalvarKitFuncao :exec
-- Troca o kit inteiro numa instrução só (atômica): apaga os EPIs que saíram e faz upsert dos que ficaram.
-- Os JOINs com epi/funcao filtrados por tenant impedem gravar id de outra empresa.
WITH removidos AS (
    DELETE FROM funcao_epi
    WHERE tenant_id = @tenant_id -- SEGURANÇA
      AND id_funcao = @id_funcao
      AND NOT (id_epi = ANY(@ids_epi::int[]))
)
INSERT INTO funcao_epi (tenant_id, id_funcao, id_epi, quantidade)
SELECT f.tenant_id, f.id, e.id, (@quantidades::int[])[i.n]
FROM unnest(@ids_epi::int[]) WITH ORDINALITY AS i(id_epi, n)
INNER JOIN epi e ON e.id = i.id_epi AND e.tenant_id = @tenant_id AND e.ativo = TRUE
INNER JOIN funcao f ON f.id = @id_funcao AND f.tenant_id = @tenant_id AND f.ativo = TRUE
ON CONFLICT (tenant_id, id_funcao, id_epi) DO UPDATE SET quantidade = EXCLUDED.quantidade;
