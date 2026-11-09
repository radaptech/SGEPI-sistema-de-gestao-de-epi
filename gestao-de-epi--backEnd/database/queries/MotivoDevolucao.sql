-- motivo_devolucao é global (lista pronta, igual para todos os tenants), como tipo_protecao.

-- name: BuscaTodosMotivosDevolucao :many
SELECT id, motivo, gera_descarte
FROM motivo_devolucao
ORDER BY gera_descarte, motivo;

-- name: EhDescarte :one
SELECT gera_descarte
FROM motivo_devolucao
WHERE id = $1;
