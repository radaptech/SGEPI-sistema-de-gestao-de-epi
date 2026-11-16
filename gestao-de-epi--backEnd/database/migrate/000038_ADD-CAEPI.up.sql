-- Base pública de CAs do Ministério do Trabalho (CAEPI), carregada por `./main atualizar-caepi`.
-- Global de propósito: é dado público e igual para todos os tenants, por isso não tem tenant_id.
CREATE TABLE caepi (
    ca VARCHAR(20) PRIMARY KEY, -- só dígitos, sem zero à esquerda
    validade DATE NOT NULL,
    situacao VARCHAR(20) NOT NULL, -- VÁLIDO, VENCIDO, CANCELADO ou SUSPENSO
    fabricante TEXT NOT NULL,
    equipamento TEXT NOT NULL
);
