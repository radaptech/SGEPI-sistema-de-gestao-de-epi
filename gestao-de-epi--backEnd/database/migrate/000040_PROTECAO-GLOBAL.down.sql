-- Volta a proteção por tenant: cada empresa ganha uma cópia dos 9 grupos e os EPIs apontam para a cópia dela.
ALTER TABLE tipo_protecao
    DROP CONSTRAINT tipo_protecao_codigo_key,
    ADD COLUMN tenant_id INT REFERENCES empresas(id),
    ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN deletado_em TIMESTAMP NULL;

INSERT INTO tipo_protecao (tenant_id, codigo, nome)
SELECT emp.id, g.codigo, g.nome
FROM empresas emp CROSS JOIN tipo_protecao g
WHERE g.tenant_id IS NULL;

UPDATE epi SET IdTipoProtecao = copia.id
FROM tipo_protecao g, tipo_protecao copia
WHERE g.id = epi.IdTipoProtecao
  AND g.tenant_id IS NULL
  AND copia.tenant_id = epi.tenant_id
  AND copia.codigo = g.codigo;

DELETE FROM tipo_protecao WHERE tenant_id IS NULL;

ALTER TABLE tipo_protecao ALTER COLUMN tenant_id SET NOT NULL, DROP COLUMN codigo;

CREATE UNIQUE INDEX idx_protecao_tenant_ativo
ON tipo_protecao (tenant_id, nome)
WHERE deletado_em IS NULL;

DROP FUNCTION protecao_por_equipamento(TEXT);
