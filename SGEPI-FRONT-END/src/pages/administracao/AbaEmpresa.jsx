import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { ImageUp, Loader2, Trash2 } from "lucide-react";
import { api } from "../../services/api";

// Logo da empresa: vai no cabeçalho das fichas e comprovantes em PDF.
// A API reduz para no máximo 800x400 e guarda no R2.

const TAMANHO_MAXIMO = 2 * 1024 * 1024;
const botao =
  "h-11 px-4 inline-flex items-center justify-center gap-2 rounded-md text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export default function AbaEmpresa() {
  const [logoUrl, setLogoUrl] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const entrada = useRef(null);

  const carregar = async () => {
    try {
      const blob = await api.get("/empresa/logo"); // 204 (sem logo) chega como null
      setLogoUrl((anterior) => {
        if (anterior) URL.revokeObjectURL(anterior);
        return blob instanceof Blob ? URL.createObjectURL(blob) : null;
      });
    } catch {
      // o api.js já mostrou o erro
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const enviar = async (arquivo) => {
    if (!arquivo) return;
    if (!["image/png", "image/jpeg"].includes(arquivo.type)) return toast.error("Envie a logo em PNG ou JPG.");
    if (arquivo.size > TAMANHO_MAXIMO) return toast.error("A logo pode ter no máximo 2 MB.");

    const formulario = new FormData();
    formulario.append("file", arquivo);
    try {
      setSalvando(true);
      await api.put("/gerencial/empresa/logo", formulario);
      await carregar();
      toast.success("Logo atualizada. As próximas fichas já saem com ela.");
    } catch {
      // o api.js já mostrou o erro
    } finally {
      setSalvando(false);
      if (entrada.current) entrada.current.value = "";
    }
  };

  const remover = async () => {
    try {
      setSalvando(true);
      await api.delete("/gerencial/empresa/logo");
      await carregar();
      toast.success("Logo removida.");
    } catch {
      // o api.js já mostrou o erro
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="bg-surface border border-line rounded-md p-6 max-w-2xl">
      <h3 className="text-lg font-bold text-ink">Logo da empresa</h3>
      <p className="text-sm text-ink-2 mt-1">
        Aparece no cabeçalho das fichas de entrega e devolução e dos comprovantes em PDF. PNG ou JPG, até 2 MB; fundo transparente fica melhor.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="w-56 h-28 shrink-0 rounded-md border border-dashed border-line-strong bg-white flex items-center justify-center p-3">
          {carregando ? (
            <Loader2 className="w-5 h-5 animate-spin text-ink-3" />
          ) : logoUrl ? (
            <img src={logoUrl} alt="Logo da empresa" className="max-w-full max-h-full object-contain" />
          ) : (
            <span className="text-sm text-ink-3">Sem logo</span>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            ref={entrada}
            id="logo-empresa"
            type="file"
            accept="image/png,image/jpeg"
            className="sr-only"
            onChange={(e) => enviar(e.target.files?.[0])}
            disabled={salvando}
          />
          <label
            htmlFor="logo-empresa"
            className={`${botao} bg-action hover:bg-action-hover text-on-action cursor-pointer ${salvando ? "opacity-50 pointer-events-none" : ""}`}
          >
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageUp className="w-4 h-4" />}
            {logoUrl ? "Trocar logo" : "Enviar logo"}
          </label>
          {logoUrl && (
            <button type="button" onClick={remover} disabled={salvando} className={`${botao} border border-line-strong text-ink-2 hover:text-erro hover:border-erro-line`}>
              <Trash2 className="w-4 h-4" /> Remover
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
