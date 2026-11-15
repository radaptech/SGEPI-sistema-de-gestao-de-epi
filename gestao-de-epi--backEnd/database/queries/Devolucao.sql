-- name: AddDevolucaoSimples :exec
INSERT INTO devolucao (
    tenant_id, IdFuncionario, IdEpi, IdMotivo, data_devolucao, IdTamanho, 
    quantidadeAdevolver, assinatura_digital, id_usuario_cancelamento, token_validacao
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);

-- name: AddTrocaEpi :one
INSERT INTO devolucao (
    tenant_id, IdFuncionario, IdEpi, IdMotivo, data_devolucao, IdTamanho, 
    quantidadeAdevolver, IdEpiNovo, IdTamanhoNovo, quantidadeNova, assinatura_digital,id_usuario_cancelamento, token_validacao, houve_troca, observacao, id_unidade
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
RETURNING id;

-- name: AddEntregaVinculada :one
INSERT INTO entrega_epi (tenant_id, IdFuncionario, data_entrega, assinatura, IdTroca)
VALUES ($1, $2, $3, $4, $5)
RETURNING id;

-- name: ListarDevolucoes :many
SELECT 
    d.id, 
    d.data_devolucao, 
    d.idfuncionario, 
    f.nome AS funcionarioNome, 
    f.matricula, 
    e.nome AS epiNome, 
    t.tamanho, 
    d.quantidadeadevolver, 
    m.motivo, 
    d.houve_troca, 
    en.nome AS epiNovo, 
    tn.tamanho AS tamanhoNovo,
    d.quantidadenova,
    d.observacao, 
    d.assinatura_digital, 
    d.token_validacao
FROM devolucao d
INNER JOIN funcionario f ON f.id = d.idfuncionario 
INNER JOIN epi e ON e.id = d.idepi
INNER JOIN tamanho t ON t.id = d.idtamanho            
INNER JOIN motivo_devolucao m ON m.id = d.idmotivo
LEFT JOIN epi en ON en.id = d.idepinovo               
LEFT JOIN tamanho tn ON tn.id = d.idtamanhonovo       
WHERE d.tenant_id = sqlc.arg('tenant_id') AND d.cancelada_em IS NULL
  AND (sqlc.narg('id_unidade')::int IS NULL OR d.id_unidade = sqlc.narg('id_unidade')::int)
ORDER BY d.data_devolucao DESC;


-- name: CancelarDevolucao :one
UPDATE devolucao
SET cancelada_em = current_date,
    ativo = FALSE,
    id_usuario_devolucao_cancelamento = $2
WHERE id = $1 
  AND tenant_id = $3 -- SEGURANÇA: Só cancela se pertencer à empresa correta
  AND cancelada_em IS NULL
RETURNING id;


-- name: ConsultarSaldoEpiFuncionario :one
SELECT
    (
        -- Total já entregue para este funcionário
        COALESCE((
            SELECT SUM(eei.quantidade)::int
            FROM epis_entregues eei
            JOIN entrega_epi ee ON ee.id = eei.id_entrega_cabecalho
            WHERE ee.idfuncionario = $1
              AND eei.id_epi = $2
              AND eei.id_tamanho = $3
              AND ee.tenant_id = $4
              AND ee.ativo = TRUE  -- entregas/itens cancelados não estão em posse
              AND eei.ativo = TRUE
        ), 0)
        -
        -- Menos o total que ele já devolveu anteriormente
        COALESCE((
            SELECT SUM(d.quantidadeadevolver)::int
            FROM devolucao d
            WHERE d.idfuncionario = $1
              AND d.idepi = $2
              AND d.idtamanho = $3
              AND d.tenant_id = $4
              AND d.ativo = TRUE   -- devolução cancelada volta para a posse
        ), 0)
    )::int AS saldo;


-- name: ListarLotesParaRepor :many
-- Busca todos os lotes que ainda têm espaço para receber devolução (quantidade_atual < quantidade)
SELECT id, quantidade, quantidade_atual 
FROM entrada_epi_item
WHERE tenant_id = $1 
  AND id_epi = $2 
  AND id_tamanho = $3
  AND id_unidade = $4
  AND ativo = TRUE
  AND quantidade_atual < quantidade
ORDER BY id DESC; -- Pega do lote mais recente para o mais antigo

-- name: BuscarDadosPdfDevolucao :one
-- Dados da ficha de devolução (PDF). id_usuario_cancelamento guarda quem registrou a devolução.
SELECT 
    d.id,
    em.razao_social AS nome_empresa, em.cnpj, COALESCE(em.logo_key, '')::text AS logo_key,
    f.nome AS funcionario_nome, f.cpf,
    f.matricula, 
    dep.nome AS setor, 
    ff.nome AS cargo, 
    un.nome AS unidade_nome,
    COALESCE(u.nome, '')::text AS recebido_por,
    d.assinatura_digital, d.token_validacao, d.ativo, d.observacao,
    d.data_devolucao, 
    d.quantidadeadevolver, 
    e.nome AS epi_nome, e.ca,
    t.tamanho, 
    m.motivo, m.gera_descarte,
    d.houve_troca,               
    en.nome AS epi_novo, en.ca AS ca_novo,
    tn.tamanho AS tamanho_novo, 
    d.quantidadenova
FROM devolucao d
INNER JOIN empresas em ON em.id = d.tenant_id
INNER JOIN funcionario f ON f.id = d.idfuncionario
INNER JOIN funcao ff ON ff.id = f.idfuncao
INNER JOIN departamento dep ON dep.id = f.iddepartamento
INNER JOIN unidade un ON un.id = d.id_unidade AND un.tenant_id = d.tenant_id
INNER JOIN epi e ON e.id = d.idepi
INNER JOIN tamanho t ON t.id = d.idtamanho
INNER JOIN motivo_devolucao m ON m.id = d.idmotivo
LEFT JOIN usuarios u ON u.id = d.id_usuario_cancelamento
LEFT JOIN epi en ON en.id = d.idepinovo      
LEFT JOIN tamanho tn ON tn.id = d.idtamanhonovo 
WHERE d.id = $1 AND d.tenant_id = $2;
-- name: AddDevolucaoLote :exec
INSERT INTO devolucao_lote (tenant_id, id_devolucao, id_entrada_item, quantidade)
VALUES ($1, $2, $3, $4);

-- name: ListarDevolucaoLotes :many
SELECT id_entrada_item, quantidade
FROM devolucao_lote
WHERE id_devolucao = $1
  AND tenant_id = $2;
