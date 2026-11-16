import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import Selecao from "../../Selecao";
import Campo from "../../Campo";

const ITEM_VAZIO = { epiId: "", tamanho: "", qtd: 1, preco: "", lote: "", fabricacao: "", validade: "" };

export const classeCampoEntrada = (erro) =>
  `w-full px-3 py-2.5 rounded-md text-sm font-medium outline-none placeholder-ink-3 transition-all disabled:opacity-50 ${
    erro ? "border border-erro-line bg-erro-soft focus:ring-1 focus:ring-erro" : "border border-line-strong bg-surface focus:ring-1 focus:ring-ink focus:border-ink"
  }`;

function validar(item) {
  const erros = {};
  if (!item.epiId) erros.epiId = "Selecione o EPI.";
  if (!item.tamanho) erros.tamanho = "Selecione o tamanho.";
  if (!item.qtd || Number(item.qtd) <= 0) erros.qtd = "Qtd inválida.";
  if (!item.preco || Number(item.preco) <= 0) erros.preco = "Valor inválido.";
  if (!item.lote.trim()) erros.lote = "Informe o lote.";
  if (!item.fabricacao) erros.fabricacao = "Obrigatório.";
  if (!item.validade) erros.validade = "Obrigatório.";
  else if (item.fabricacao && new Date(item.fabricacao) > new Date(item.validade)) erros.validade = "Validade menor que fabricação.";
  return erros;
}

// função, não componente: o Selecao lê as <option> direto dos filhos, sem renderizar componentes
const opcoesEpi = (lista) =>
  lista.map((epi) => (
    <option key={epi.id} value={epi.id}>
      {epi.nome}
    </option>
  ));

// Linha de inclusão de item da nota. Valida e entrega o item pronto para onIncluir.
// episDoFornecedor: os já comprados do fornecedor escolhido aparecem primeiro, num grupo à parte.
export default function FormItemEntrada({ episDoFornecedor, outrosEpis, carregando, onIncluir }) {
  const [item, setItem] = useState(ITEM_VAZIO);
  const [erros, setErros] = useState({});

  const epi = useMemo(
    () => [...episDoFornecedor, ...outrosEpis].find((e) => Number(e.id) === Number(item.epiId)) || null,
    [episDoFornecedor, outrosEpis, item.epiId]
  );

  const atualizar = (campos) => {
    setItem((atual) => ({ ...atual, ...campos }));
    setErros((atuais) => {
      const novos = { ...atuais };
      Object.keys(campos).forEach((c) => delete novos[c]);
      return novos;
    });
  };

  const incluir = () => {
    const novosErros = validar(item);
    setErros(novosErros);
    if (Object.keys(novosErros).length) return;

    const quantidade = Number(item.qtd);
    const valor = Number(item.preco);
    onIncluir({
      id: Date.now() + Math.random(),
      idEpi: Number(item.epiId),
      epiNome: epi?.nome || "EPI",
      ca: epi?.ca || "-",
      idTamanho: Number(item.tamanho),
      tamanhoNome: epi?.tamanhos?.find((t) => Number(t.id) === Number(item.tamanho))?.tamanho || "-",
      quantidade,
      valor_unitario: valor,
      lote: item.lote.trim(),
      data_fabricacao: item.fabricacao,
      data_validade: item.validade,
      totalItem: quantidade * valor,
    });
    setItem(ITEM_VAZIO);
  };

  const entrada = (campo, props) => (
    <input
      id={`entrada-${campo}`}
      className={classeCampoEntrada(erros[campo])}
      value={item[campo]}
      onChange={(e) => atualizar({ [campo]: e.target.value })}
      {...props}
    />
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-sunken p-5 rounded-md border border-line mb-6">
      <Campo id="entrada-epiId" rotulo="EPI" obrigatorio erro={erros.epiId} className="md:col-span-4">
        <Selecao
          id="entrada-epiId"
          className={classeCampoEntrada(erros.epiId)}
          value={item.epiId}
          onChange={(e) => atualizar({ epiId: e.target.value, tamanho: "" })}
          disabled={carregando}
        >
          <option value="">{carregando ? "Carregando..." : "Selecione o EPI..."}</option>
          {episDoFornecedor.length > 0 ? (
            <>
              <optgroup label="Já comprados deste fornecedor">
                {opcoesEpi(episDoFornecedor)}
              </optgroup>
              {outrosEpis.length > 0 && (
                <optgroup label="Outros EPIs">
                  {opcoesEpi(outrosEpis)}
                </optgroup>
              )}
            </>
          ) : (
            opcoesEpi(outrosEpis)
          )}
        </Selecao>
      </Campo>

      <Campo id="entrada-tamanho" rotulo="Tamanho" obrigatorio erro={erros.tamanho} className="md:col-span-2">
        <Selecao
          id="entrada-tamanho"
          className={classeCampoEntrada(erros.tamanho)}
          value={item.tamanho}
          onChange={(e) => atualizar({ tamanho: e.target.value })}
          disabled={!item.epiId}
        >
          <option value="">{item.epiId ? "Selecione..." : "Aguardando EPI"}</option>
          {epi?.tamanhos?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.tamanho}
            </option>
          ))}
        </Selecao>
      </Campo>

      <Campo id="entrada-qtd" rotulo="Qtd" obrigatorio erro={erros.qtd} className="md:col-span-1">
        {entrada("qtd", { type: "number", min: "1" })}
      </Campo>
      <Campo id="entrada-preco" rotulo="Vlr Unit." obrigatorio erro={erros.preco} className="md:col-span-2">
        {entrada("preco", { type: "number", min: "0", step: "0.01", placeholder: "0.00" })}
      </Campo>
      <Campo id="entrada-lote" rotulo="Lote" obrigatorio erro={erros.lote} className="md:col-span-3">
        {entrada("lote", { type: "text", placeholder: "Ex: L001" })}
      </Campo>
      <Campo id="entrada-fabricacao" rotulo="Fabricação" obrigatorio erro={erros.fabricacao} className="md:col-span-3">
        {entrada("fabricacao", { type: "date" })}
      </Campo>
      <Campo id="entrada-validade" rotulo="Validade" obrigatorio erro={erros.validade} className="md:col-span-3">
        {entrada("validade", { type: "date" })}
      </Campo>

      <div className="md:col-span-6 flex items-end self-stretch">
        <button
          type="button"
          onClick={incluir}
          className="w-full h-[42px] mt-auto flex items-center justify-center gap-2 bg-line hover:bg-line-strong text-ink font-bold rounded-md text-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Incluir Item
        </button>
      </div>
    </div>
  );
}
