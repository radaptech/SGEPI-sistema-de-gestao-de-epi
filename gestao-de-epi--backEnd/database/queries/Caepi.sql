-- A tabela caepi é global (dado público do MTE): estas queries não filtram tenant_id de propósito.
-- O CA do EPI é comparado só pelos dígitos, sem zero à esquerda, que é como a base do MTE grava.

-- name: BuscarCaepi :one
SELECT ca, validade, situacao, fabricante, equipamento
FROM caepi
WHERE ca = ltrim(regexp_replace(sqlc.arg(ca)::text, '\D', '', 'g'), '0');

-- name: LimparCaepi :exec
DELETE FROM caepi;

-- name: InserirCaepi :copyfrom
INSERT INTO caepi (ca, validade, situacao, fabricante, equipamento) VALUES ($1, $2, $3, $4, $5);

-- name: RenovarValidadeCaEpis :execrows
-- Roda na importação, em todos os tenants: CA renovado no MTE estende a validade cadastrada no EPI.
UPDATE epi e SET validade_CA = c.validade
FROM caepi c
WHERE c.ca = ltrim(regexp_replace(e.CA, '\D', '', 'g'), '0')
  AND c.validade > e.validade_CA;
