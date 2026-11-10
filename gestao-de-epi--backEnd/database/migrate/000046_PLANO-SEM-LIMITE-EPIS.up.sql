-- O plano não limita mais EPIs: o catálogo não mede o tamanho do cliente e nada no sistema travava por ele.
ALTER TABLE planos DROP COLUMN limite_epis;
