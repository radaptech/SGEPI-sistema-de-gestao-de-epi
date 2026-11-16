import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { api } from "../../services/api";

// Quem vê quais unidades (Fase 6 do PLANO-UNIDADES). Nenhuma marcada = todas.
// Admin é o gestor da rede e sempre vê todas. Cada clique já salva.
export default function AcessoUnidades({ unidades }) {
  const [usuarios, setUsuarios] = useState(null);
  const [salvandoId, setSalvandoId] = useState(null);

  useEffect(() => {
    api
      .get("/gerencial/unidades/acessos")
      .then((lista) => setUsuarios(lista ?? []))
      .catch(() => setUsuarios([])); // o api.js já mostrou o erro
  }, []);

  const alternar = async (usuario, idUnidade) => {
    const marcadas = usuario.unidades.includes(idUnidade)
      ? usuario.unidades.filter((id) => id !== idUnidade)
      : [...usuario.unidades, idUnidade];
    try {
      setSalvandoId(usuario.id);
      await api.put(`/gerencial/usuarios/${usuario.id}/unidades`, { unidades: marcadas });
      setUsuarios((lista) => lista.map((u) => (u.id === usuario.id ? { ...u, unidades: marcadas } : u)));
      toast.success(`Acesso de ${usuario.nome} atualizado.`);
    } catch {
      // o api.js já mostrou o erro
    } finally {
      setSalvandoId(null);
    }
  };

  return (
    <section aria-labelledby="titulo-acessos" className="bg-surface border border-line rounded-md">
      <header className="px-5 py-3 border-b border-line">
        <h3 id="titulo-acessos" className="text-sm font-bold text-ink">Quem vê cada unidade</h3>
        <p className="mt-0.5 text-xs text-ink-3">
          Marque as unidades de cada usuário. Sem nenhuma marcada, ele vê todas. Administradores sempre veem todas.
        </p>
      </header>

      {usuarios === null ? (
        <p className="px-5 py-8 text-sm text-ink-3 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</p>
      ) : (
        <ul className="divide-y divide-line">
          {usuarios.map((usuario) => (
            <li key={usuario.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="sm:w-56 min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{usuario.nome}</p>
                <p className="text-xs text-ink-3 truncate">{usuario.email}</p>
              </div>
              {usuario.role === "admin" ? (
                <span className="text-xs text-ink-3">Todas as unidades (administrador)</span>
              ) : (
                <fieldset className="flex flex-wrap items-center gap-2" disabled={salvandoId === usuario.id}>
                  <legend className="sr-only">Unidades de {usuario.nome}</legend>
                  {unidades.map((u) => (
                    <label
                      key={u.id}
                      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-line text-xs font-medium text-ink-2 cursor-pointer has-[:checked]:border-ink has-[:checked]:text-ink"
                    >
                      <input
                        type="checkbox"
                        className="accent-current"
                        checked={usuario.unidades.includes(u.id)}
                        onChange={() => alternar(usuario, u.id)}
                      />
                      {u.nome}
                    </label>
                  ))}
                  {usuario.unidades.length === 0 && <span className="text-xs text-ink-3">vê todas</span>}
                </fieldset>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
