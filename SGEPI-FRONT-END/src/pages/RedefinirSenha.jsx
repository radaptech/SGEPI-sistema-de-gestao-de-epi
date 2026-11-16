import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { api } from "../services/api";
import LayoutAcesso, { AvisoAcesso, botaoAcesso, inputAcesso, labelAcesso } from "../components/LayoutAcesso";

function CampoSenha({ id, rotulo, valor, aoMudar, placeholder }) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={labelAcesso}>{rotulo}</label>
      <div className="relative">
        <input
          id={id}
          type={visivel ? "text" : "password"}
          className={`${inputAcesso} pr-12`}
          placeholder={placeholder}
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setVisivel(!visivel)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-ink-3 hover:text-ink transition-colors"
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visivel}
        >
          {visivel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function RedefinirSenha({ onIrParaLogin }) {
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [token] = useState(() => new URLSearchParams(window.location.search).get("token") || "");
  const [erro, setErro] = useState(() =>
    token ? "" : "Link de recuperação inválido ou ausente. Peça um novo e-mail na tela de login."
  );
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const handleRedefinir = async (e) => {
    e.preventDefault();
    setErro("");

    if (!token) {
      setErro("Link de recuperação inválido ou ausente. Peça um novo e-mail na tela de login.");
      return;
    }
    if (senha.length < 6) {
      setErro("A nova senha precisa ter no mínimo 6 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não são iguais. Digite de novo.");
      return;
    }

    try {
      setCarregando(true);
      await api.post("/redefinir-senha", { token, senha_nova: senha });
      setSucesso(true);
      setSenha("");
      setConfirmarSenha("");
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  if (sucesso) {
    return (
      <LayoutAcesso titulo="Senha alterada" subtitulo="Sua nova senha já está valendo.">
        <AvisoAcesso tipo="sucesso">Senha redefinida. Entre com o seu e-mail e a nova senha.</AvisoAcesso>
        <button type="button" onClick={onIrParaLogin} className={botaoAcesso}>
          Ir para o login
        </button>
      </LayoutAcesso>
    );
  }

  return (
    <LayoutAcesso
      titulo="Nova senha"
      subtitulo="Crie uma nova senha para acessar o SGEPI."
      rodape="O link de recuperação vale por tempo limitado. Se expirar, peça outro na tela de login."
    >
      {erro && <AvisoAcesso>{erro}</AvisoAcesso>}

      <form onSubmit={handleRedefinir} className="space-y-5" noValidate>
        <CampoSenha id="nova-senha" rotulo="Nova senha" valor={senha} aoMudar={setSenha} placeholder="Mínimo 6 caracteres" />
        <CampoSenha id="confirmar-senha" rotulo="Confirmar nova senha" valor={confirmarSenha} aoMudar={setConfirmarSenha} placeholder="Repita a nova senha" />

        <button type="submit" disabled={carregando || !token} className={botaoAcesso}>
          {carregando ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar nova senha"
          )}
        </button>
      </form>

      {!token && (
        <button type="button" onClick={onIrParaLogin} className="mt-4 text-sm font-semibold text-ink-2 hover:text-ink underline-offset-2 hover:underline">
          Voltar para o login
        </button>
      )}
    </LayoutAcesso>
  );
}

export default RedefinirSenha;
