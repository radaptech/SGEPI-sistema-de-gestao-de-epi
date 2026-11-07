-- tipo_protecao é global (grupos do Anexo I da NR-6, migração 000040): não filtra tenant_id de propósito.

-- name: BuscarTodasProtecoes :many
SELECT id, nome
FROM tipo_protecao
ORDER BY codigo;
