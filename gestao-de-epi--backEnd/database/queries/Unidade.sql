-- Unidades (lojas, obras, almoxarifados) do tenant. Toda query filtra por tenant_id.

-- name: CriarUnidade :one
INSERT INTO unidade (tenant_id, nome)
VALUES ($1, $2)
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
WHERE u.tenant_id = $1
  AND u.deletado_em IS NULL
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
