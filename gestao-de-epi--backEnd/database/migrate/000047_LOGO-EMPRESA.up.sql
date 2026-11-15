-- Logo da empresa no cabeçalho das fichas em PDF: guarda a chave do objeto no bucket R2 de logos (não a URL).
ALTER TABLE empresas ADD COLUMN logo_key TEXT;
