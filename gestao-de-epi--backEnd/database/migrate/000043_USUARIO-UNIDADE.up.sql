-- Fase 6 do docs/PLANO-UNIDADES.md: usuário limitado a algumas unidades.
-- Sem linha = todas as unidades (os usuários de hoje continuam vendo tudo). Admin sempre vê todas.

-- alvo da FK composta: o banco recusa ligar o usuário de um tenant à unidade de outro
ALTER TABLE usuarios ADD CONSTRAINT usuarios_id_tenant_key UNIQUE (id, tenant_id);

CREATE TABLE usuario_unidade (
    usuario_id INT NOT NULL,
    id_unidade INT NOT NULL,
    tenant_id INT NOT NULL,
    PRIMARY KEY (usuario_id, id_unidade),
    FOREIGN KEY (usuario_id, tenant_id) REFERENCES usuarios (id, tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (id_unidade, tenant_id) REFERENCES unidade (id, tenant_id)
);
