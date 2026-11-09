-- Volta o motivo por tenant: cada empresa ganha uma cópia da lista e as devoluções apontam para a cópia dela.
ALTER TABLE motivo_devolucao
    DROP CONSTRAINT motivo_devolucao_motivo_key,
    ADD COLUMN tenant_id INT REFERENCES empresas(id),
    ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN deletado_em TIMESTAMP NULL;

INSERT INTO motivo_devolucao (tenant_id, motivo, gera_descarte)
SELECT emp.id, g.motivo, g.gera_descarte
FROM empresas emp CROSS JOIN motivo_devolucao g
WHERE g.tenant_id IS NULL;

UPDATE devolucao d SET IdMotivo = copia.id
FROM motivo_devolucao g, motivo_devolucao copia
WHERE g.id = d.IdMotivo
  AND g.tenant_id IS NULL
  AND copia.tenant_id = d.tenant_id
  AND copia.motivo = g.motivo;

DELETE FROM motivo_devolucao WHERE tenant_id IS NULL;

ALTER TABLE motivo_devolucao
    ALTER COLUMN tenant_id SET NOT NULL,
    ADD CONSTRAINT uniquemotivocontraints UNIQUE (motivo, tenant_id);
