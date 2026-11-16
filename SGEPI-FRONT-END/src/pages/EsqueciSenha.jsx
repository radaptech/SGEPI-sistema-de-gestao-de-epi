import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { api } from "../services/api";
import LayoutAcesso, {
  AvisoAcesso,
  botaoAcesso,
  botaoSecundarioAcesso,
  inputAcesso,
  labelAcesso,
} from "../components/LayoutAcesso";

function EsqueciSenha({ onVoltar }) {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleEsqueciSenha = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    const emailLimpo = email.trim();

    if (!emailLimpo) {
      setErro("Informe o seu e-mail para recuperar a senha.");
      return;
    }

    try {
      setCarregando(true);
      const slugEmpresa = window.location.hostname.split(".")[0];
      await api.post("/esqueci-minha-senha", {
        empresa: slugEmpresa,
        email: emailLimpo,
      });

      setSucesso("Se o e-mail estiver cadastrado, você vai receber as instruções para criar uma nova senha.");
      setEmail("");
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <LayoutAcesso
      titulo="Recuperar senha"
      subtitulo="Informe o e-mail cadastrado. Enviaremos um link para você criar uma nova senha."
      rodape="O link chega em alguns minutos. Confira também a caixa de spam."
    >
      {erro && <AvisoAcesso>{erro}</AvisoAcesso>}
      {sucesso && <AvisoAcesso tipo="sucesso">{sucesso}</AvisoAcesso>}

      <form onSubmit={handleEsqueciSenha} className="space-y-5" noValidate>
        <div>
          <label htmlFor="esqueci-email" className={labelAcesso}>E-mail</label>
          <input
            id="esqueci-email"
            type="email"
            inputMode="email"
            className={inputAcesso}
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
          />
        </div>

        <div className="space-y-3">
          <button type="submit" disabled={carregando} className={botaoAcesso}>
            {carregando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar link"
            )}
          </button>

          <button type="button" onClick={onVoltar} className={botaoSecundarioAcesso}>
            <ArrowLeft className="w-4 h-4" />
            Voltar para o login
          </button>
        </div>
      </form>
    </LayoutAcesso>
  );
}

export default EsqueciSenha;
