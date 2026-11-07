-- Kit de EPI por função: quais EPIs (e quantos) cada função recebe.
-- É configuração, não histórico: trocar o kit apaga as linhas que saíram (sem soft delete).
-- O tamanho fica de fora porque depende do funcionário, e é escolhido na hora da entrega.
CREATE TABLE funcao_epi (
    tenant_id  INT NOT NULL REFERENCES empresas(id),
    id_funcao  INT NOT NULL REFERENCES funcao(id),
    id_epi     INT NOT NULL REFERENCES epi(id),
    quantidade INT NOT NULL DEFAULT 1 CHECK (quantidade > 0),
    PRIMARY KEY (tenant_id, id_funcao, id_epi)
);
