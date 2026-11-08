import { toast } from "react-toastify";

const DEFAULT_BASE_URL = "https://homolog.radaptech.com.br/api";

let envUrl = process.env.REACT_APP_API_URL || DEFAULT_BASE_URL;

if (envUrl && !envUrl.startsWith("http")) {
    envUrl = `https://${envUrl}`;
}

export const BASE_URL = envUrl.replace(/\/+$/, "");

function normalizarRota(rota = "") {
    if (!rota) return "";
    return rota.startsWith("/") ? rota : `/${rota}`;
}

function getTenantId() {
    const hostname = window.location.hostname;
    const partes = hostname.split(".");
    return partes[0];
}

function isFormData(valor) {
    return typeof FormData !== "undefined" && valor instanceof FormData;
}

function montarHeaders(headersExtras = {}, body = null) {
    const tenantId = getTenantId();

    const headers = {
        ...headersExtras,
    };

    if (!isFormData(body) && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    if (tenantId) {
        headers["X-tenant-ID"] = tenantId;
    }

    return headers;
}

function extrairMensagemErro(dados, fallback) {
    if (!dados) return fallback;

    if (typeof dados === "string") {
        return dados || fallback;
    }

    if (typeof dados === "object") {
        const erroPrincipal =
            dados.error ||
            dados.erro ||
            dados.message ||
            dados.mensagem ||
            fallback;

        const detalhes =
            dados.detalhes ||
            dados.detail ||
            dados.details;

        return detalhes
            ? `${erroPrincipal} - Detalhes: ${detalhes}`
            : erroPrincipal;
    }

    return fallback;
}

async function lerCorpoResposta(resposta) {
    if (resposta.status === 204) return null;

    const contentType =
        resposta.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        try {
            return await resposta.json();
        } catch {
            return null;
        }
    }

    if (
        contentType.includes("application/pdf") ||
        contentType.includes("application/octet-stream")
    ) {
        try {
            return await resposta.blob();
        } catch {
            return null;
        }
    }

    try {
        return await resposta.text();
    } catch {
        return null;
    }
}

async function tratarResposta(
    resposta,
    rota,
    mensagemErroPadrao
) {
    const dados = await lerCorpoResposta(resposta);

    if (!resposta.ok) {
        // /me sem sessão é o caso normal de quem ainda não entrou: sem aviso nem redirecionamento
        if (resposta.status === 401 && rota === "/me") {
            throw new Error("Sem sessão");
        }

        if (resposta.status === 401) {
            console.warn("Sessão expirada ou token inválido.");

            if (
                window.location.pathname !== "/login" &&
                !rota.includes("/login")
            ) {
                toast.error(
                    "Sua sessão expirou. Por favor, faça login novamente."
                );

                window.location.href = "/login";
            }
        }

        const fallback =
            `${mensagemErroPadrao} ${rota}`;

        const mensagemFinal =
            extrairMensagemErro(dados, fallback);

        toast.error(mensagemFinal);

        throw new Error(mensagemFinal);
    }

    return dados;
}

async function request(
    method,
    rota,
    dados = null,
    headersExtras = {}
) {
    const rotaNormalizada =
        normalizarRota(rota);

    const url =
        `${BASE_URL}${rotaNormalizada}`;

    const opcoes = {
        method,
        credentials: "include",

        headers: montarHeaders(
            headersExtras,
            dados
        ),
    };

    if (
        dados !== null &&
        dados !== undefined
    ) {
        opcoes.body = isFormData(dados)
            ? dados
            : JSON.stringify(dados);
    }

    const resposta = await fetch(
        url,
        opcoes
    );

    return await tratarResposta(
        resposta,
        rotaNormalizada,
        "Erro ao processar a requisição em"
    );
}

export const api = {
    get: (rota, h) =>
        request("GET", rota, null, h),

    post: (rota, d, h) =>
        request("POST", rota, d, h),

    put: (rota, d, h) =>
        request("PUT", rota, d, h),

    patch: (rota, d, h) =>
        request("PATCH", rota, d, h),

    delete: (rota, h) =>
        request("DELETE", rota, null, h),
};