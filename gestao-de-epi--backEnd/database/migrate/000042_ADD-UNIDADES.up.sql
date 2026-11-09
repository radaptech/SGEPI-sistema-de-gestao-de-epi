-- Unidades (lojas, obras, almoxarifados) dentro de um tenant. Plano: docs/PLANO-UNIDADES.md (Fase 1).
-- Toda empresa ganha a unidade "Principal" e todo registro de estoque/pessoas passa a ter id_unidade.

CREATE TABLE unidade (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES empresas(id),
    nome VARCHAR(100) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    deletado_em TIMESTAMP NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT now(),
    -- alvo das FKs compostas: o banco recusa apontar para a unidade de outro tenant
    CONSTRAINT unidade_id_tenant_key UNIQUE (id, tenant_id)
);

CREATE UNIQUE INDEX idx_unidade_tenant_nome ON unidade (tenant_id, nome) WHERE deletado_em IS NULL;

INSERT INTO unidade (tenant_id, nome) SELECT id, 'Principal' FROM empresas;

-- Empresa nova já nasce com a "Principal" (painel, seed e testes não precisam saber disso).
CREATE FUNCTION criar_unidade_principal() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO unidade (tenant_id, nome) VALUES (NEW.id, 'Principal');
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_criar_unidade_principal
AFTER INSERT ON empresas
FOR EACH ROW EXECUTE FUNCTION criar_unidade_principal();

-- INSERT sem id_unidade cai na primeira unidade ativa do tenant (a "Principal").
-- ponytail: vale enquanto as telas não escolhem a unidade (Fases 3 e 4); com 2+ unidades
-- a aplicação passa a mandar id_unidade explícito e este trigger vira só rede de segurança.
CREATE FUNCTION preencher_unidade_padrao() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.id_unidade IS NULL THEN
        SELECT id INTO NEW.id_unidade
        FROM unidade
        WHERE tenant_id = NEW.tenant_id AND deletado_em IS NULL
        ORDER BY id
        LIMIT 1;
    END IF;
    RETURN NEW;
END;
$$;

-- entrada_nf, entrada_epi_item (o lote), funcionario, entrega_epi, devolucao
ALTER TABLE entrada_nf ADD COLUMN id_unidade INT;
ALTER TABLE entrada_epi_item ADD COLUMN id_unidade INT;
ALTER TABLE funcionario ADD COLUMN id_unidade INT;
ALTER TABLE entrega_epi ADD COLUMN id_unidade INT;
ALTER TABLE devolucao ADD COLUMN id_unidade INT;

UPDATE entrada_nf t SET id_unidade = u.id FROM unidade u WHERE u.tenant_id = t.tenant_id;
UPDATE entrada_epi_item t SET id_unidade = u.id FROM unidade u WHERE u.tenant_id = t.tenant_id;
UPDATE funcionario t SET id_unidade = u.id FROM unidade u WHERE u.tenant_id = t.tenant_id;
UPDATE entrega_epi t SET id_unidade = u.id FROM unidade u WHERE u.tenant_id = t.tenant_id;
UPDATE devolucao t SET id_unidade = u.id FROM unidade u WHERE u.tenant_id = t.tenant_id;

ALTER TABLE entrada_nf ALTER COLUMN id_unidade SET NOT NULL,
    ADD CONSTRAINT entrada_nf_unidade_fkey FOREIGN KEY (id_unidade, tenant_id) REFERENCES unidade (id, tenant_id);
ALTER TABLE entrada_epi_item ALTER COLUMN id_unidade SET NOT NULL,
    ADD CONSTRAINT entrada_epi_item_unidade_fkey FOREIGN KEY (id_unidade, tenant_id) REFERENCES unidade (id, tenant_id);
ALTER TABLE funcionario ALTER COLUMN id_unidade SET NOT NULL,
    ADD CONSTRAINT funcionario_unidade_fkey FOREIGN KEY (id_unidade, tenant_id) REFERENCES unidade (id, tenant_id);
ALTER TABLE entrega_epi ALTER COLUMN id_unidade SET NOT NULL,
    ADD CONSTRAINT entrega_epi_unidade_fkey FOREIGN KEY (id_unidade, tenant_id) REFERENCES unidade (id, tenant_id);
ALTER TABLE devolucao ALTER COLUMN id_unidade SET NOT NULL,
    ADD CONSTRAINT devolucao_unidade_fkey FOREIGN KEY (id_unidade, tenant_id) REFERENCES unidade (id, tenant_id);

CREATE TRIGGER trigger_unidade_entrada_nf BEFORE INSERT ON entrada_nf
FOR EACH ROW EXECUTE FUNCTION preencher_unidade_padrao();
CREATE TRIGGER trigger_unidade_entrada_epi_item BEFORE INSERT ON entrada_epi_item
FOR EACH ROW EXECUTE FUNCTION preencher_unidade_padrao();
CREATE TRIGGER trigger_unidade_funcionario BEFORE INSERT ON funcionario
FOR EACH ROW EXECUTE FUNCTION preencher_unidade_padrao();
CREATE TRIGGER trigger_unidade_entrega_epi BEFORE INSERT ON entrega_epi
FOR EACH ROW EXECUTE FUNCTION preencher_unidade_padrao();
CREATE TRIGGER trigger_unidade_devolucao BEFORE INSERT ON devolucao
FOR EACH ROW EXECUTE FUNCTION preencher_unidade_padrao();

-- consumo FEFO por unidade (Fase 4) e somas de saldo
CREATE INDEX idx_entrada_epi_item_unidade ON entrada_epi_item (tenant_id, id_unidade, id_epi, id_tamanho);
