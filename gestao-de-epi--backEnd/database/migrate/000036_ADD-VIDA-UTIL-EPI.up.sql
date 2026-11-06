-- Dias que o EPI dura nas mãos do funcionário antes da troca obrigatória (NR-6).
-- NULL = o EPI não tem troca periódica controlada.
ALTER TABLE epi ADD COLUMN vida_util_dias INT NULL CHECK (vida_util_dias > 0);
