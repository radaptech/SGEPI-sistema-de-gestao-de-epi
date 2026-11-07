import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./pages/Login";
import Header from "./components/Header";
import RedefinirSenha from "./pages/RedefinirSenha"; 
import Dashboard from "./pages/Dashboard";
import Estoque from "./pages/Estoque";
import Entradas from "./pages/Entradas";
import Entregas from "./pages/Entregas";
import Devolucoes from "./pages/Devoluções";
import Funcionarios from "./pages/Funcionários";
import Fornecedores from "./pages/Fornecedores";
import Administracao from "./pages/Administracao";
import Departamentos from "./pages/Departamentos";
import DashboardMaster from "./pages/master/DashboardMaster";
import Empresas from "./pages/master/Empresas";
import DetalhesEmpresa from "./pages/master/DetalhesEmpresa";
import Mensalidades from "./pages/master/Mensalidades";
import Planos from "./pages/master/Planos";
import UsuariosMaster from "./pages/master/UsuariosMaster";
import { api } from "./services/api";

// usuario vem de /login e /me: {id, nome, email, role}; roles do back: super_admin, admin, colaborador
const verificarSeUsuarioMaster = (u) => u?.role === "super_admin";
const verificarSeAdminEmpresa = (u) => u?.role === "admin";
const verificarSeFuncionario = (u) => u?.role === "colaborador";
const definirPaginaInicialPorPerfil = (u) => (verificarSeUsuarioMaster(u) ? "DashboardMaster" : "Dashboard");

function App() {
  const [usuario, setUsuario] = useState(null);
  const [paginaAtual, setPaginaAtual] = useState("Dashboard");
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [isRedefinindoSenha, setIsRedefinindoSenha] = useState(
    window.location.pathname === "/redefinir-senha"
  );

  // 🔑 1. RECUPERAÇÃO DE SESSÃO VIA COOKIE HTTPONLY
  useEffect(() => {
    async function verificarSessao() {
      try {
        // Tenta buscar o perfil do usuário logado na API.
        // O navegador enviará o cookie HttpOnly automaticamente se ele existir.
        const usuarioLogado = await api.get("/me");

        if (usuarioLogado) {
          setUsuario(usuarioLogado);
          setPaginaAtual(definirPaginaInicialPorPerfil(usuarioLogado));
        }
      } catch (error) {
        // 401: o cookie expirou ou não existe
        setUsuario(null);
      } finally {
        setCarregandoSessao(false);
      }
    }

    verificarSessao();
  }, []);

  const handleLogin = (dadosLogin) => {
    const usuarioRecebido = dadosLogin?.usuario ?? dadosLogin;

    setUsuario(usuarioRecebido);
    setPaginaAtual(definirPaginaInicialPorPerfil(usuarioRecebido));
  };

  // 🔑 2. LOGOUT COM EXPIRAÇÃO DE COOKIE NO BACKEND
  const handleLogout = async () => {
    try {
      // Chama a rota no Go para expirar o cookie HttpOnly no navegador
      await api.post("/logout");
    } catch (error) {
      console.error("Erro ao encerrar sessão na API:", error);
    } finally {
      setUsuario(null);
      setPaginaAtual("Dashboard");
    }
  };

  const paginasMaster = [
    "DashboardMaster",
    "Empresas",
    "DetalhesEmpresa",
    "Mensalidades",
    "Planos",
    "UsuariosMaster",
  ];

  const paginasAdminEmpresa = [
    "Dashboard",
    "Estoque",
    "Entradas",
    "Entregas",
    "Devoluções",
    "Funcionários",
    "Departamentos",
    "Fornecedores",
    "Administracao",
  ];

  const paginasFuncionario = ["Dashboard", "Entregas", "Devoluções"];

  const usuarioPodeAcessarPagina = (pagina) => {
    if (verificarSeUsuarioMaster(usuario)) {
      return paginasMaster.includes(pagina);
    }

    if (verificarSeAdminEmpresa(usuario)) {
      return paginasAdminEmpresa.includes(pagina);
    }

    if (verificarSeFuncionario(usuario)) {
      return paginasFuncionario.includes(pagina);
    }

    return false;
  };

  const trocarPaginaComPermissao = (pagina) => {
    if (usuarioPodeAcessarPagina(pagina)) {
      setPaginaAtual(pagina);
      return;
    }

    setPaginaAtual(definirPaginaInicialPorPerfil(usuario));
  };

  const renderizarAcessoNegado = () => {
    return (
      <div className="bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/30 rounded-2xl p-8 shadow-sm transition-colors duration-300">
        <div className="max-w-2xl">
          <p className="text-xs font-black text-red-400 dark:text-red-500 uppercase tracking-[0.25em]">
            Acesso restrito
          </p>

          <h1 className="text-2xl font-black text-slate-800 dark:text-white mt-2 transition-colors">
            Você não tem permissão para acessar esta área.
          </h1>

          <p className="text-slate-500 dark:text-slate-400 mt-3 transition-colors">
            Essa página pertence a outro nível de acesso do sistema. Entre com
            um usuário autorizado ou volte para a página inicial do seu perfil.
          </p>

          <button
            type="button"
            onClick={() => setPaginaAtual(definirPaginaInicialPorPerfil(usuario))}
            className="mt-6 px-5 py-3 rounded-xl bg-slate-800 dark:bg-slate-700 text-white text-sm font-bold hover:bg-slate-700 dark:hover:bg-slate-600 transition"
          >
            Voltar para minha área
          </button>
        </div>
      </div>
    );
  };

  const renderizarPagina = () => {
    if (!usuarioPodeAcessarPagina(paginaAtual)) {
      return renderizarAcessoNegado();
    }

    switch (paginaAtual) {
      case "Dashboard":
        return <Dashboard usuarioLogado={usuario} />;

      case "Estoque":
        return <Estoque usuarioLogado={usuario} />;

      case "Entradas":
        return <Entradas usuarioLogado={usuario} />;

      case "Entregas":
        return <Entregas usuarioLogado={usuario} />;

      case "Devoluções":
        return <Devolucoes usuarioLogado={usuario} />;

      case "Funcionários":
        return <Funcionarios usuarioLogado={usuario} />;

      case "Departamentos":
        return <Departamentos usuarioLogado={usuario} />;

      case "Fornecedores":
        return <Fornecedores usuarioLogado={usuario} />;

      case "Administracao":
        return <Administracao usuarioLogado={usuario} />;

      case "DashboardMaster":
        return <DashboardMaster usuarioLogado={usuario} />;

      case "Empresas":
        return <Empresas usuarioLogado={usuario} />;

      case "DetalhesEmpresa":
        return <DetalhesEmpresa usuarioLogado={usuario} />;

      case "Mensalidades":
        return <Mensalidades usuarioLogado={usuario} />;

      case "Planos":
        return <Planos usuarioLogado={usuario} />;

      case "UsuariosMaster":
        return <UsuariosMaster usuarioLogado={usuario} />;

      default:
        return renderizarAcessoNegado();
    }
  };

  if (carregandoSessao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B1120] text-slate-800 dark:text-white transition-colors duration-300">
        Carregando...
      </div>
    );
  }

  if (isRedefinindoSenha) {
    return (
      <>
        <RedefinirSenha 
          onIrParaLogin={() => {
            setIsRedefinindoSenha(false);
            window.history.pushState({}, '', '/'); 
          }} 
        />
        <ToastContainer position="top-right" autoClose={4000} theme="colored" />
      </>
    );
  }

  if (!usuario) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <ToastContainer position="top-right" autoClose={4000} theme="colored" />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Header
        paginaAtual={paginaAtual}
        setPagina={trocarPaginaComPermissao}
        onLogout={handleLogout}
        usuario={usuario}
      />

      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {renderizarPagina()}
      </main>

      <ToastContainer 
        position="top-right" 
        autoClose={4000} 
        theme="colored" 
      />
    </div>
  );
}

export default App;