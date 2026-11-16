-- Os lotes criados por transferência ou devolução continuam, como lotes comuns.
DROP INDEX idx_entrada_epi_item_transferencia;
ALTER TABLE entrada_epi_item
    DROP CONSTRAINT entrada_epi_item_transferencia_fkey,
    DROP COLUMN id_transferencia,
    DROP COLUMN id_lote_origem;
DROP TABLE transferencia;
