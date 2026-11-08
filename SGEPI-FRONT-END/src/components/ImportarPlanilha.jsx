import { useState, useRef } from "react";
import { api } from "../services/api";
import { Download, Upload, Loader2 } from "lucide-react";

export default function ImportarPlanilha({
  className = "",
  descricao,
  rota,
  onBaixarModelo,
  onSucesso,
  mostrarToast,
}) {
  const [arquivo, setArquivo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const inputRef = useRef(null);

  const enviar = async () => {
    if (!arquivo) return;

    try {
      setEnviando(true);
      const formData = new FormData();
      formData.append("file", arquivo);
      const resposta = await api.post(rota, formData);

      mostrarToast(resposta?.message || "Planilha importada com sucesso!", "sucesso");
      setArquivo(null);
      if (inputRef.current) inputRef.current.value = "";
      await onSucesso?.();
    } catch (erro) {
      console.error("Erro ao importar planilha:", erro);
      mostrarToast(erro?.message || "Erro ao importar planilha.", "erro");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={`bg-sunken  p-5 sm:p-6 rounded-md border border-line  transition-colors ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div>
            <h3 className="text-base font-bold text-ink transition-colors">
              Importação em Lote
            </h3>
            <p className="text-xs text-ink-2 mt-0.5 transition-colors">
              {descricao}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBaixarModelo}
          className="w-full sm:w-auto h-[46px] px-5 shrink-0 border border-line bg-surface text-ink hover:border-line-strong font-semibold rounded-md transition-all flex items-center justify-center gap-2 text-sm"
        >
          <Download className="w-4 h-4" /> Baixar Modelo
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-5 border-t border-line ">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => setArquivo(e.target.files?.[0] || null)}
          className="flex-1 w-full text-xs font-medium text-ink-2 cursor-pointer file:mr-3 file:h-[46px] file:px-5 file:rounded-md file:border-0 file:text-sm file:font-bold file:cursor-pointer file:bg-surface file:text-ink file:border file:border-solid file:border-line hover:file:border-line-strong file:transition-colors"
        />

        <button
          type="button"
          onClick={enviar}
          disabled={!arquivo || enviando}
          className="w-full sm:w-auto h-[46px] px-6 shrink-0 bg-action hover:bg-action-hover text-on-action font-bold rounded-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {enviando ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <><Upload className="w-4 h-4" /> Enviar Planilha</>
          )}
        </button>
      </div>
    </div>
  );
}
