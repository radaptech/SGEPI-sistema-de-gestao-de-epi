-- motivo_devolucao vira global: uma lista pronta, igual para todos os tenants (como tipo_protecao).
-- gera_descarte = TRUE: o EPI devolvido não volta ao estoque.
-- Ainda não há cliente em produção; as devoluções de dev são remapeadas pelo nome.

ALTER TABLE motivo_devolucao
    DROP CONSTRAINT uniquemotivocontraints,
    ALTER COLUMN tenant_id DROP NOT NULL;

INSERT INTO motivo_devolucao (motivo, gera_descarte) VALUES
    ('Desgaste natural', TRUE),
    ('Dano ou avaria', TRUE),
    ('Validade vencida', TRUE),
    ('Contaminação', TRUE),
    ('Perda ou extravio', TRUE),
    ('Troca periódica', TRUE),
    ('Tamanho inadequado', FALSE),
    ('Troca de função', FALSE),
    ('Desligamento do funcionário', FALSE),
    ('Devolvido sem uso', FALSE);

-- mesmo nome (sem diferenciar maiúsculas) vai para o global; o resto cai pelo gera_descarte
UPDATE devolucao d SET IdMotivo = (
    SELECT g.id FROM motivo_devolucao g
    WHERE g.tenant_id IS NULL
      AND g.motivo = COALESCE(
          (SELECT x.motivo FROM motivo_devolucao x WHERE x.tenant_id IS NULL AND lower(x.motivo) = lower(antigo.motivo)),
          CASE WHEN antigo.gera_descarte OR lower(antigo.motivo) LIKE 'desgaste%' THEN 'Desgaste natural' ELSE 'Devolvido sem uso' END
      )
)
FROM motivo_devolucao antigo
WHERE antigo.id = d.IdMotivo AND antigo.tenant_id IS NOT NULL;

DELETE FROM motivo_devolucao WHERE tenant_id IS NOT NULL;

ALTER TABLE motivo_devolucao
    DROP COLUMN tenant_id,
    DROP COLUMN ativo,
    DROP COLUMN deletado_em,
    ADD CONSTRAINT motivo_devolucao_motivo_key UNIQUE (motivo);
