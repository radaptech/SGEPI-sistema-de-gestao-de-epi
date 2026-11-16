-- Fase 7 do docs/PLANO-UNIDADES.md: transferência de estoque entre unidades.
-- A transferência consome lotes da origem (FEFO) e cria na destino um lote copiado de cada um
-- (NF, lote, validade, fabricação e valor seguem o lote). O lote novo aponta para o de origem
-- e para a transferência, e por isso não precisa de uma tabela de itens.

CREATE TABLE transferencia (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES empresas(id),
    id_unidade_origem INT NOT NULL,
    id_unidade_destino INT NOT NULL,
    id_usuario INT NOT NULL REFERENCES usuarios(id),
    observacao TEXT NOT NULL DEFAULT '',
    criado_em TIMESTAMP NOT NULL DEFAULT now(),
    cancelada_em TIMESTAMP NULL,
    id_usuario_cancelamento INT NULL REFERENCES usuarios(id),
    CONSTRAINT transferencia_id_tenant_key UNIQUE (id, tenant_id),
    CONSTRAINT transferencia_unidades_diferentes CHECK (id_unidade_origem <> id_unidade_destino),
    FOREIGN KEY (id_unidade_origem, tenant_id) REFERENCES unidade (id, tenant_id),
    FOREIGN KEY (id_unidade_destino, tenant_id) REFERENCES unidade (id, tenant_id)
);

CREATE INDEX idx_transferencia_tenant ON transferencia (tenant_id, criado_em DESC);

-- id_lote_origem também marca o lote criado por devolução numa unidade sem lote para repor.
-- Lote com id_lote_origem não é compra: fica fora da tela de Entradas e não se cancela por ela.
ALTER TABLE entrada_epi_item
    ADD COLUMN id_lote_origem INT NULL REFERENCES entrada_epi_item (id),
    ADD COLUMN id_transferencia INT NULL,
    ADD CONSTRAINT entrada_epi_item_transferencia_fkey FOREIGN KEY (id_transferencia, tenant_id) REFERENCES transferencia (id, tenant_id);

CREATE INDEX idx_entrada_epi_item_transferencia ON entrada_epi_item (id_transferencia) WHERE id_transferencia IS NOT NULL;
