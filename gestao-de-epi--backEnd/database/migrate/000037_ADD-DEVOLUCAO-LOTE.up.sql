-- Em qual lote cada devolução sem descarte repôs o estoque, e quanto. O cancelamento da
-- devolução usa isso para tirar as unidades exatas de cada lote (mesma ideia de
-- epis_entregues.id_entrada_item na entrega). Devoluções anteriores a esta migração não têm linhas.
CREATE TABLE devolucao_lote (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES empresas(id),
    id_devolucao INT NOT NULL REFERENCES devolucao(id),
    id_entrada_item INT NOT NULL REFERENCES entrada_epi_item(id),
    quantidade INT NOT NULL CHECK (quantidade > 0)
);

CREATE INDEX idx_devolucao_lote_devolucao ON devolucao_lote (tenant_id, id_devolucao);
