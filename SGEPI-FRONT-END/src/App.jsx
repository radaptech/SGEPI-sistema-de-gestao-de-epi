import { useEffect, useState } from "react";
import { ToastContainer, Slide } from "react-toastify";
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
// toasts deslizam em vez de quicar (padrão do react-toastify), mais sóbrio
const avisos = <ToastContainer position="top-right" autoClose={4000} hideProgressBar transition={Slide} />;

const definirPaginaInicialPorPerfil = (u) => (verificarSeUsuarioMaster(u) ? "DashboardMaster" : "Dashboard");

// a página atual vive no hash (#/Estoque) para o Voltar e o recarregar funcionarem
const paginaDoHash = () => decodeURIComponent(window.location.hash.replace(/^#\/?/, ""));

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

function paginaPermitida(u, pagina) {
  const permitidas = verificarSeUsuarioMaster(u)
    ? paginasMaster
    : verificarSeAdminEmpresa(u)
      ? paginasAdminEmpresa
      : verificarSeFuncionario(u)
        ? paginasFuncionario
        : [];
  return permitidas.includes(pagina) ? pagina : definirPaginaInicialPorPerfil(u);
}

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
          setPaginaAtual(paginaPermitida(usuarioLogado, paginaDoHash()));
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
    setPaginaAtual(paginaPermitida(usuarioRecebido, paginaDoHash()));
    // o /login não traz as unidades permitidas (Fase 6); o /me traz
    api.get("/me").then((u) => u && setUsuario(u)).catch(() => {});
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



  const trocarPaginaComPermissao = (pagina) => {
    setPaginaAtual(paginaPermitida(usuario, pagina));
  };

  // página -> hash
  useEffect(() => {
    if (!usuario) return;
    const hash = `#/${encodeURIComponent(paginaAtual)}`;
    if (window.location.hash !== hash) window.location.hash = hash;
  }, [usuario, paginaAtual]);

  // hash -> página (Voltar/Avançar do navegador)
  useEffect(() => {
    if (!usuario) return;
    const aoMudarHash = () => setPaginaAtual(paginaPermitida(usuario, paginaDoHash()));
    window.addEventListener("hashchange", aoMudarHash);
    return () => window.removeEventListener("hashchange", aoMudarHash);
  }, [usuario]);

  const renderizarAcessoNegado = () => {
    return (
      <div className="bg-surface border border-erro-line rounded-md p-8 transition-colors duration-300">
        <div className="max-w-2xl">
          <p className="text-xs font-bold text-erro uppercase tracking-wide">
            Acesso restrito
          </p>

          <h1 className="text-2xl font-bold text-ink mt-2 transition-colors">
            Você não tem permissão para acessar esta área.
          </h1>

          <p className="text-ink-2 mt-3 transition-colors">
            Essa página pertence a outro nível de acesso do sistema. Entre com
            um usuário autorizado ou volte para a página inicial do seu perfil.
          </p>

          <button
            type="button"
            onClick={() => setPaginaAtual(definirPaginaInicialPorPerfil(usuario))}
            className="mt-6 px-5 py-3 rounded-md bg-action text-on-action text-sm font-bold hover:bg-action-hover transition"
          >
            Voltar para minha área
          </button>
        </div>
      </div>
    );
  };

  const renderizarPagina = () => {
    if (paginaPermitida(usuario, paginaAtual) !== paginaAtual) {
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
      <div className="min-h-screen flex items-center justify-center bg-sunken text-ink  transition-colors duration-300">
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
        {avisos}
      </>
    );
  }

  if (!usuario) {
    return (
      <>
        <Login onLogin={handleLogin} />
        {avisos}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <Header
        paginaAtual={paginaAtual}
        setPagina={trocarPaginaComPermissao}
        onLogout={handleLogout}
        usuario={usuario}
      />

      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {renderizarPagina()}
      </main>

      {avisos}
    </div>
  );
}

export default App;