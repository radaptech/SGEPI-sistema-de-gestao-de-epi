-- Transferência de estoque entre unidades (Fase 7 do PLANO-UNIDADES). Toda query filtra tenant_id.

-- name: CriarTransferencia :one
INSERT INTO transferencia (tenant_id, id_unidade_origem, id_unidade_destino, id_usuario, observacao)
VALUES ($1, $2, $3, $4, $5)
RETURNING id;

-- name: CopiarLoteParaUnidade :one
-- Cria na unidade um lote igual ao de origem (NF, lote, validade, fabricação, valor), com a quantidade dada.
-- id_transferencia NULL = lote criado por devolução numa unidade que não tinha lote para repor.
INSERT INTO entrada_epi_item (
    tenant_id, entrada_nf_id, id_epi, id_tamanho, quantidade, quantidade_atual,
    data_fabricacao, data_validade, lote, valor_unitario, id_usuario_criacao,
    id_unidade, id_lote_origem, id_transferencia
)
SELECT o.tenant_id, o.entrada_nf_id, o.id_epi, o.id_tamanho, sqlc.arg('quantidade')::int, sqlc.arg('quantidade')::int,
    o.data_fabricacao, o.data_validade, o.lote, o.valor_unitario, sqlc.arg('id_usuario')::int,
    sqlc.arg('id_unidade')::int, o.id, sqlc.narg('id_transferencia')::int
FROM entrada_epi_item o
WHERE o.id = sqlc.arg('id_lote')::int
  AND o.tenant_id = sqlc.arg('tenant_id')::int
RETURNING id;

-- name: ListarTransferencias :many
-- Uma linha por lote criado no destino; o service agrupa por transferência. As 100 mais recentes.
-- id_unidade: só as que saíram dela ou chegaram nela (NULL = todas)
SELECT
    t.id, t.criado_em, t.cancelada_em, t.observacao,
    t.id_unidade_origem, uo.nome AS unidade_origem,
    t.id_unidade_destino, ud.nome AS unidade_destino,
    us.nome AS usuario,
    ei.id_epi, e.nome AS epi_nome, ei.id_tamanho, tm.tamanho AS tamanho_nome, ei.lote, ei.quantidade
FROM transferencia t
INNER JOIN unidade uo ON uo.id = t.id_unidade_origem AND uo.tenant_id = t.tenant_id
INNER JOIN unidade ud ON ud.id = t.id_unidade_destino AND ud.tenant_id = t.tenant_id
INNER JOIN usuarios us ON us.id = t.id_usuario
INNER JOIN entrada_epi_item ei ON ei.id_transferencia = t.id AND ei.tenant_id = t.tenant_id
INNER JOIN epi e ON e.id = ei.id_epi
INNER JOIN tamanho tm ON tm.id = ei.id_tamanho
WHERE t.tenant_id = sqlc.arg('tenant_id')
  AND t.id IN (
    SELECT t2.id FROM transferencia t2
    WHERE t2.tenant_id = sqlc.arg('tenant_id')
      AND (sqlc.narg('id_unidade')::int IS NULL
           OR t2.id_unidade_origem = sqlc.narg('id_unidade')::int
           OR t2.id_unidade_destino = sqlc.narg('id_unidade')::int)
    ORDER BY t2.criado_em DESC, t2.id DESC
    LIMIT 100
  )
ORDER BY t.criado_em DESC, t.id DESC, ei.id;

-- name: MarcarTransferenciaCancelada :execrows
UPDATE transferencia
SET cancelada_em = now(), id_usuario_cancelamento = $2
WHERE id = $1
  AND tenant_id = $3
  AND cancelada_em IS NULL;

-- name: LotesDaTransferencia :many
SELECT id, id_lote_origem, quantidade, quantidade_atual, ativo
FROM entrada_epi_item
WHERE id_transferencia = $1
  AND tenant_id = $2
FOR UPDATE;

-- name: DesativarLoteTransferido :execrows
UPDATE entrada_epi_item
SET ativo = FALSE, cancelada_em = now(), id_usuario_cancelamento = $2
WHERE id = $1
  AND tenant_id = $3
  AND ativo = TRUE;

-- name: UltimoLoteDoEpi :one
-- Modelo para o lote criado por devolução quando a unidade nunca recebeu este EPI e tamanho.
SELECT id FROM entrada_epi_item
WHERE tenant_id = $1 AND id_epi = $2 AND id_tamanho = $3
ORDER BY id DESC
LIMIT 1;
