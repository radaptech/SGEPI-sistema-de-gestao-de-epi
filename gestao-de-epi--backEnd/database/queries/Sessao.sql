-- name: CriarSessao :exec
INSERT INTO sessoes (token_hash, usuario_id, expira_em)
VALUES ($1, $2, $3);

-- name: BuscarSessao :one
-- Só devolve sessão válida de usuário ativo: desativar o usuário derruba a sessão na hora.
-- unidades: as que o usuário pode ver (vazio = todas, Fase 6 do PLANO-UNIDADES)
SELECT u.id, u.tenant_id, u.nome, u.role,
    ARRAY(SELECT uu.id_unidade FROM usuario_unidade uu WHERE uu.usuario_id = u.id ORDER BY uu.id_unidade)::int[] AS unidades
FROM sessoes s
INNER JOIN usuarios u ON u.id = s.usuario_id
WHERE s.token_hash = $1
  AND s.expira_em > now()
  AND u.ativo = TRUE
LIMIT 1;

-- name: DeletarSessao :exec
DELETE FROM sessoes WHERE token_hash = $1;

-- name: DeletarSessoesExpiradas :exec
DELETE FROM sessoes WHERE expira_em <= now();
