DROP TRIGGER trigger_unidade_entrada_nf ON entrada_nf;
DROP TRIGGER trigger_unidade_entrada_epi_item ON entrada_epi_item;
DROP TRIGGER trigger_unidade_funcionario ON funcionario;
DROP TRIGGER trigger_unidade_entrega_epi ON entrega_epi;
DROP TRIGGER trigger_unidade_devolucao ON devolucao;
DROP FUNCTION preencher_unidade_padrao();

DROP INDEX idx_entrada_epi_item_unidade;

ALTER TABLE entrada_nf DROP COLUMN id_unidade;
ALTER TABLE entrada_epi_item DROP COLUMN id_unidade;
ALTER TABLE funcionario DROP COLUMN id_unidade;
ALTER TABLE entrega_epi DROP COLUMN id_unidade;
ALTER TABLE devolucao DROP COLUMN id_unidade;

DROP TRIGGER trigger_criar_unidade_principal ON empresas;
DROP FUNCTION criar_unidade_principal();

DROP TABLE unidade;
