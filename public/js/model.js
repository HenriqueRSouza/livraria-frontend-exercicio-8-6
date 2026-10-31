// Model: guarda o estado do cliente e é o único arquivo que conversa com o back-end (HTTP/REST em JSON).
// O login é um token devolvido pelo back-end, guardado no navegador e enviado em "Authorization: Bearer".

import { API_URL } from "./config.js";

export const estado = { cliente: null, mensagens: [] };

export class ErroApi extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.status = status;
  }
}

const CHAVE_TOKEN = "livraria-token";

export const token = {
  ler() {
    try {
      return localStorage.getItem(CHAVE_TOKEN);
    } catch {
      return null;
    }
  },
  guardar(valor) {
    try {
      if (valor) localStorage.setItem(CHAVE_TOKEN, valor);
      else localStorage.removeItem(CHAVE_TOKEN);
    } catch {
      // sem armazenamento (aba privada): o login vale só até recarregar a página
    }
  },
};

async function api(metodo, caminho, corpo) {
  const cabecalhos = corpo ? { "Content-Type": "application/json" } : {};
  const atual = token.ler();
  if (atual) cabecalhos.Authorization = `Bearer ${atual}`;
  let resposta;
  try {
    resposta = await fetch(`${API_URL}/api${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new ErroApi("Não foi possível falar com o servidor. Tente de novo em instantes.", 0);
  }
  const dados = resposta.status === 204 ? {} : await resposta.json();
  if (!resposta.ok) {
    if (resposta.status === 401) entrarComo(null, null);
    throw new ErroApi(dados.erro || `Erro ${resposta.status}`, resposta.status);
  }
  return dados;
}

function entrarComo(cliente, novoToken) {
  estado.cliente = cliente;
  token.guardar(novoToken);
}

const consulta = (filtros) => new URLSearchParams(Object.entries(filtros).filter(([, valor]) => valor)).toString();

export const Livraria = {
  async carregarSessao() {
    if (token.ler()) estado.cliente = (await api("GET", "/sessao")).cliente;
  },
  buscarLivros: (filtros) => api("GET", `/livros?${consulta(filtros)}`),
  livro: (livroId) => api("GET", `/livros/${livroId}`),
  lojas: (bairro) => api("GET", `/lojas?${consulta({ bairro })}`),
  minhaArea: () => api("GET", "/minha-area"),

  async cadastrar(dados) {
    const resposta = await api("POST", "/clientes", dados);
    entrarComo(resposta.cliente, resposta.token);
    return resposta;
  },
  async entrar(email) {
    const resposta = await api("POST", "/sessao", { email });
    entrarComo(resposta.cliente, resposta.token);
  },
  async sair() {
    await api("DELETE", "/sessao");
    entrarComo(null, null);
  },

  favoritar: (livroId, adicionar) => api(adicionar ? "PUT" : "DELETE", `/favoritos/${livroId}`),
  reservar: (dados) => api("POST", "/reservas", dados),
  comprar: (dados) => api("POST", "/compras", dados),
  retirar: (codigo) => api("POST", `/reservas/${encodeURIComponent(codigo)}/retirada`),
  cancelar: (codigo) => api("POST", `/reservas/${encodeURIComponent(codigo)}/cancelamento`),
  alertar: (dados) => api("POST", "/alertas", dados),
  repor: (dados) => api("POST", "/estoque/reposicao", dados),
  avaliar: (livroId, dados) => api("PUT", `/livros/${livroId}/avaliacao`, dados),
};
