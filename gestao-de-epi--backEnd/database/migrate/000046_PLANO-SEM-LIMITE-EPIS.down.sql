-- volta a coluna vazia (NULL = ilimitado); os valores antigos não voltam
ALTER TABLE planos ADD COLUMN limite_epis INT NULL;
