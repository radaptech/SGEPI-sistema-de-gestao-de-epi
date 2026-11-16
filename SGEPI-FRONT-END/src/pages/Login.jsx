import { useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "../services/api";
import EsqueciSenha from "./EsqueciSenha";
import LayoutAcesso, { AvisoAcesso, botaoAcesso, inputAcesso, labelAcesso } from "../components/LayoutAcesso";

function Login({ onLogin }) {
  const [mostrarEsqueciSenha, setMostrarEsqueciSenha] = useState(false);
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");

    const loginLimpo = login.trim();
    const senhaLimpa = senha.trim();

    if (!loginLimpo || !senhaLimpa) {
      setErro("Preencha o e-mail e a senha.");
      return;
    }

    try {
      setCarregando(true);

      const resposta = await api.post("/login", {
        email: loginLimpo,
        senha: senhaLimpa,
      });

      const usuario = resposta?.usuario;

      if (!usuario) {
        throw new Error("Dados do usuário não retornados pelo servidor.");
      }

      sessionStorage.setItem("usuario", JSON.stringify(usuario));

      if (onLogin) {
        onLogin({ usuario });
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  if (mostrarEsqueciSenha) {
    return <EsqueciSenha onVoltar={() => setMostrarEsqueciSenha(false)} />;
  }

  return (
    <LayoutAcesso
      titulo="Entrar"
      subtitulo="Use o e-mail e a senha cadastrados pela sua empresa."
      rodape="Não consegue entrar? Fale com o administrador do sistema na sua empresa."
    >
      {erro && <AvisoAcesso>{erro}</AvisoAcesso>}

      <form onSubmit={handleLogin} className="space-y-5" noValidate>
        <div>
          <label htmlFor="login-email" className={labelAcesso}>E-mail</label>
          <input
            id="login-email"
            type="email"
            inputMode="email"
            className={inputAcesso}
            placeholder="seu@email.com"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoComplete="username"
            autoFocus
          />
        </div>

        <div>
          <div className="flex items-end justify-between mb-1.5">
            <label htmlFor="login-senha" className={`${labelAcesso} mb-0`}>Senha</label>
            <button
              type="button"
              onClick={() => setMostrarEsqueciSenha(true)}
              className="text-xs font-semibold text-ink-2 hover:text-ink underline-offset-2 hover:underline"
            >
              Esqueceu a senha?
            </button>
          </div>
          <input
            id="login-senha"
            type="password"
            className={`${inputAcesso} tracking-wider`}
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button type="submit" disabled={carregando} className={botaoAcesso}>
          {carregando ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Entrando...
            </>
          ) : (
            "Entrar no sistema"
          )}
        </button>
      </form>
    </LayoutAcesso>
  );
}

export default Login;
