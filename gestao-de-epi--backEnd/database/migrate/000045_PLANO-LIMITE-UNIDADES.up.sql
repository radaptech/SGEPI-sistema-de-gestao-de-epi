-- Fase 9 do docs/PLANO-UNIDADES.md: quantas unidades (lojas) o plano permite. NULL = ilimitado,
-- e por isso nenhum plano existente muda de comportamento.
ALTER TABLE planos ADD COLUMN limite_unidades INT NULL CHECK (limite_unidades IS NULL OR limite_unidades >= 1);
