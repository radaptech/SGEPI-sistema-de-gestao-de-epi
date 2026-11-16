import React, { useMemo, useState, useEffect } from "react";
import { toast } from "react-toastify";

import ModalNovoUsuario from "../../components/modals/master/ModalNovoUsuario";
import ModalEditarUsuario from "../../components/modals/master/ModalEditarUsuario";
import ModalConfirmarBloqueioUsuario from "../../components/modals/master/ModalConfirmarBloqueioUsuario";

import masterDashboardService from "../../services/masterDashboardService";
import Selecao from "../../components/Selecao";
import Paginacao, { usePaginacao } from "../../components/Paginacao";

function UsuariosMaster() {
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("Todos");
  
  const [usuarios, setUsuarios] = useState([]);
  const [empresasDisponiveis, setEmpresasDisponiveis] = useState([]);

  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalBloqueioAberto, setModalBloqueioAberto] = useState(false);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setUsuarios((await masterDashboardService.buscarUsuarios()) ?? []);
        setEmpresasDisponiveis((await masterDashboardService.buscarEmpresas()) ?? []);
        
      } catch (error) {
        toast.error("Falha ao carregar os dados. Verifique sua conexão.");
        setEmpresasDisponiveis([]); 
      }
    };

    carregarDados();
  }, []);

  const usuariosFiltrados = useMemo(() => {
    if (!Array.isArray(usuarios)) return [];

    return usuarios.filter((usuario) => {
      const nome = usuario?.nome || "";
      const email = usuario?.email || "";
      const empresa = usuario?.empresa || "";
      const tipo = usuario?.tipo || "";

      const termo = busca.toLowerCase().trim();

      const combinaBusca =
        nome.toLowerCase().includes(termo) ||
        email.toLowerCase().includes(termo) ||
        empresa.toLowerCase().includes(termo);

      const combinaTipo = tipoFiltro === "Todos" || tipo === tipoFiltro;

      return combinaBusca && combinaTipo;
    });
  }, [usuarios, busca, tipoFiltro]);

  const { itens: usuariosDaPagina, ...paginacao } = usePaginacao(usuariosFiltrados, 15);

  const abrirEditar = (usuario) => {
    setUsuarioSelecionado(usuario);
    setModalEditarAberto(true);
  };

  const abrirBloqueio = (usuario) => {
    setUsuarioSelecionado(usuario);
    setModalBloqueioAberto(true);
  };

  const fecharModais = () => {
    setUsuarioSelecionado(null);
    setModalNovoAberto(false);
    setModalEditarAberto(false);
    setModalBloqueioAberto(false);
  };

  const salvarNovoUsuario = async (payloadApi, usuarioParaTela) => {
    const promessa = masterDashboardService.salvarUsuarios(payloadApi);

    toast.promise(promessa, {
      pending: "Salvando novo usuário...",
      success: "Usuário criado com sucesso!",
      error: "Houve um erro ao salvar o usuário.",
    });

    try {
      await promessa;
      setUsuarios((prev) => [usuarioParaTela, ...prev]);
      fecharModais();
    } catch (error) {}
  };

  const salvarEdicaoUsuario = async (id, payloadApi, usuarioAtualizadoParaTela) => {
    const promessa = masterDashboardService.editarUsuario(id, payloadApi);

    toast.promise(promessa, {
      pending: "Atualizando dados...",
      success: "Usuário atualizado com sucesso!",
      error: "Erro ao atualizar os dados do usuário.",
    });

    try {
      await promessa;
      setUsuarios((prev) =>
        prev.map((usuario) =>
          usuario.id === id ? usuarioAtualizadoParaTela : usuario
        )
      );
      fecharModais();
    } catch (error) {}
  };

  const confirmarBloqueioUsuario = async (usuarioSelecionado) => {
    const novoStatus = !usuarioSelecionado.status; 
    
    const acaoTexto = novoStatus ? "Desbloqueando..." : "Bloqueando...";
    const sucessoTexto = novoStatus ? "Usuário ativado com sucesso!" : "Usuário bloqueado!";

    const promessa = masterDashboardService.editarStatusUsuario(usuarioSelecionado.id, novoStatus);

    toast.promise(promessa, {
      pending: acaoTexto,
      success: sucessoTexto,
      error: "Houve um erro ao alterar o acesso.",
    });

    try {
      await promessa;
      setUsuarios((prev) =>
        prev.map((usuario) =>
          usuario.id === usuarioSelecionado.id
            ? { ...usuario, status: novoStatus }
            : usuario
        )
      );
      fecharModais();
    } catch (error) {}
  };

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case "super_admin":
        return "Master";
      case "admin":
        return "Administrador";
      case "colaborador":
        return "Colaborador";
      default:
        return tipo;
    }
  };

  const getTipoClass = (tipo) => {
    switch (tipo) {
      case "super_admin":
        return "text-info bg-info-soft border-info-line";
      case "admin":
        return "text-ink bg-sunken border-line";
      case "colaborador":
        return "text-ink-2 bg-sunken border-line";
      default:
        return "text-ink-2 bg-sunken border-line";
    }
  };

  const getStatusClass = (status) => {
    if (status === true) return "text-ok bg-ok-soft border-ok-line";
    if (status === false) return "text-erro bg-erro-soft border-erro-line";
    return "text-ink-2 bg-sunken border-line";
  };

  return (
    <div className="text-ink pb-16">
      <div className="w-full">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-ink tracking-tight">
              Usuários
            </h1>
            <p className="text-sm text-ink-2 mt-2 font-medium max-w-xl leading-relaxed">
              Controle usuários master, administradores de empresas e usuários internos.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalNovoAberto(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-action text-on-action text-sm font-semibold hover:bg-action-hover transition-all shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Novo usuário
          </button>
        </header>

        <div className="bg-surface rounded-md border border-line overflow-hidden flex flex-col">
          <div className="p-4 md:p-5 border-b border-line bg-surface flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={busca}
                onChange={(e) => { setBusca(e.target.value); paginacao.setPagina(1); }}
                placeholder="Buscar por nome, e-mail ou empresa..."
                className="w-full pl-11 pr-4 py-2.5 bg-sunken border border-line rounded-md focus:bg-surface focus:ring-1 focus:ring-ink focus:border-ink outline-none transition-all text-sm text-ink placeholder:text-ink-3"
              />
            </div>

            <div className="md:w-64 shrink-0">
              <Selecao
                value={tipoFiltro}
                onChange={(e) => { setTipoFiltro(e.target.value); paginacao.setPagina(1); }}
                className="w-full px-4 py-2.5 bg-sunken border border-line rounded-md focus:bg-surface focus:ring-1 focus:ring-ink focus:border-ink outline-none transition-all text-sm text-ink font-medium appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.2em 1.2em` }}
              >
                <option value="Todos">Todos os tipos</option>
                <option value="super_admin">Master</option>
                <option value="admin">Administrador</option>
                <option value="colaborador">Colaborador</option>
              </Selecao>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-sunken border-b border-line text-xs font-bold text-ink-2 uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-4">Usuário</th>
                  <th className="px-6 py-4">Empresa</th>
                  <th className="px-6 py-4 text-center">Tipo</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Último Acesso</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-line">
                {usuariosDaPagina.map((usuario) => {
                  const bloqueado = usuario.status === false;

                  return (
                    <tr key={usuario.id} className="hover:bg-sunken transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-ink">{usuario.nome}</p>
                        <p className="text-[12px] text-ink-2 mt-0.5 font-medium">
                          {usuario.email}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-ink">
                          {usuario.empresa || "-"}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-md border text-xs font-bold tracking-wide ${getTipoClass(usuario.tipo)}`}>
                          {getTipoLabel(usuario.tipo)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-md border text-xs font-bold tracking-wide ${getStatusClass(usuario.status)}`}>
                          {usuario.status ? "Ativo" : "Bloqueado"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <p className="text-[12px] font-semibold text-ink-2">
                          {usuario.ultimo_acesso || "-"}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => abrirEditar(usuario)}
                            className="px-3 py-1.5 rounded-md text-ink hover:text-ink hover:bg-sunken text-xs font-semibold transition-colors"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => abrirBloqueio(usuario)}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                              bloqueado
                                ? "text-ok hover:text-ok hover:bg-ok-soft"
                                : "text-erro hover:text-erro hover:bg-erro-soft"
                            }`}
                          >
                            {bloqueado ? "Desbloquear" : "Bloquear"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {usuariosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p className="text-sm text-ink-2 font-medium">Nenhum usuário encontrado.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Paginacao {...paginacao} />
        </div>
      </div>

      <ModalNovoUsuario
        aberto={modalNovoAberto}
        onFechar={fecharModais}
        onSalvar={salvarNovoUsuario}
        empresas={empresasDisponiveis}
      />

      <ModalEditarUsuario
        aberto={modalEditarAberto}
        usuario={usuarioSelecionado}
        onFechar={fecharModais}
        onSalvar={salvarEdicaoUsuario}
      />

      <ModalConfirmarBloqueioUsuario
        aberto={modalBloqueioAberto}
        usuario={usuarioSelecionado}
        onFechar={fecharModais}
        onConfirmar={confirmarBloqueioUsuario}
      />
    </div>
  );
}

export default UsuariosMaster;