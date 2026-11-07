export const PERFIS = {
  ADMIN: "admin",
  COLABORADOR: "colaborador",
  GERENTE: "gerente",
};

export const PERMISSOES = {
  visualizar_dashboard: [PERFIS.ADMIN, PERFIS.COLABORADOR, PERFIS.GERENTE],
  visualizar_estoque: [PERFIS.ADMIN, PERFIS.COLABORADOR, PERFIS.GERENTE],
  visualizar_departamentos: [PERFIS.ADMIN, PERFIS.COLABORADOR, PERFIS.GERENTE],
  visualizar_entregas: [PERFIS.ADMIN, PERFIS.COLABORADOR, PERFIS.GERENTE],
  cadastrar_entregas: [PERFIS.ADMIN, PERFIS.GERENTE], 
  cadastrar_departamento: [PERFIS.ADMIN],
  excluir_departamento: [PERFIS.ADMIN],
  cadastrar_funcionario: [PERFIS.ADMIN],
  editar_perfil_funcionario: [PERFIS.ADMIN],

  visualizar_fornecedores: [PERFIS.ADMIN],
};

export function temPermissao(usuario, permissao) {
  return (PERMISSOES[permissao] || []).includes(usuario?.role);
}
