-- tipo_protecao vira global: os 9 grupos do Anexo I da NR-6, iguais para todos os tenants.
-- Ainda não há cliente em produção; os EPIs de dev são remapeados pela mesma regra do CA.

-- Sugere o grupo (código A–I) pelo nome do equipamento, como vem na base do MTE (caepi.equipamento).
-- A ordem importa: a primeira regra que bate vence (ex.: "CONJUGADO ... SOLDA ... RESPIRADOR" é respiratória).
CREATE FUNCTION protecao_por_equipamento(equipamento TEXT) RETURNS CHAR(1)
LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE
        WHEN e ~ '\m(CINTUR|TRAVA.?QUEDA|TALABARTE|CADEIRA)'                                THEN 'I'
        WHEN e ~ '\m(MACAC|CORPO INTEIRO|CONJUNTO|JARDINEIRA|CONDUTIVA|APICULTOR|MANTA|RADIOL)' THEN 'H'
        WHEN e ~ '\m(RESPIRADOR|SEMIFACIAL)'                                       THEN 'D'
        WHEN e ~ '\m(ÓCULOS|OCULOS|FACIAL|SOLDA|VISOR)'                            THEN 'B'
        WHEN e ~ '\m(AUDITIV|AURICULAR)'                                          THEN 'C'
        WHEN e ~ '\m(CAPACETE|CAPUZ|BALACLAVA|TOUCA)'                              THEN 'A'
        WHEN e ~ '\m(LUVA|CREME|MANGA|MANGOTE|DEDEIRA|BRAÇADEIRA)'                 THEN 'F'
        WHEN e ~ '\m(CALÇ|BOTA|BOTINA|PERNEIRA|MEIA)'                              THEN 'G'
        WHEN e ~ '\m(VESTIMENTA|AVENTAL|COLETE|JALECO|CAPA)'                       THEN 'E'
    END
    FROM upper(equipamento) AS e
$$;

DROP INDEX idx_protecao_tenant_ativo;
ALTER TABLE tipo_protecao ADD COLUMN codigo CHAR(1), ALTER COLUMN tenant_id DROP NOT NULL;

INSERT INTO tipo_protecao (codigo, nome) VALUES
    ('A', 'Proteção da cabeça'),
    ('B', 'Proteção dos olhos e face'),
    ('C', 'Proteção auditiva'),
    ('D', 'Proteção respiratória'),
    ('E', 'Proteção do tronco'),
    ('F', 'Proteção dos membros superiores'),
    ('G', 'Proteção dos membros inferiores'),
    ('H', 'Proteção do corpo inteiro'),
    ('I', 'Proteção contra quedas com diferença de nível');

-- ponytail: o que não bater cai em "membros superiores" (só dados de dev; em prod precisaria de revisão)
UPDATE epi SET IdTipoProtecao = g.id
FROM tipo_protecao antigo, tipo_protecao g
WHERE antigo.id = epi.IdTipoProtecao
  AND antigo.codigo IS NULL
  AND g.codigo = COALESCE(protecao_por_equipamento(epi.nome || ' ' || antigo.nome), 'F');

DELETE FROM tipo_protecao WHERE codigo IS NULL;

ALTER TABLE tipo_protecao
    DROP COLUMN tenant_id,
    DROP COLUMN ativo,
    DROP COLUMN deletado_em,
    ALTER COLUMN codigo SET NOT NULL,
    ADD CONSTRAINT tipo_protecao_codigo_key UNIQUE (codigo);
