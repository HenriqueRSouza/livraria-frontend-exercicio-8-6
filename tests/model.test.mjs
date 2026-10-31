// Model com fetch e localStorage falsos: confere URL do back-end, token e tratamento de erros.
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

const guardado = new Map();
globalThis.localStorage = {
  getItem: (k) => guardado.get(k) ?? null,
  setItem: (k, v) => guardado.set(k, String(v)),
  removeItem: (k) => guardado.delete(k),
};

let chamadas;
let respostas;
globalThis.fetch = async (url, opcoes) => {
  chamadas.push({ url, ...opcoes });
  const [status, corpo] = respostas.shift();
  return { status, ok: status < 400, json: async () => corpo };
};

const { API_URL } = await import("../public/js/config.js");
const { estado, Livraria, token } = await import("../public/js/model.js");

beforeEach(() => {
  chamadas = [];
  respostas = [];
  guardado.clear();
  estado.cliente = null;
});

test("chama o back-end publicado no Azure", async () => {
  respostas.push([200, []]);
  await Livraria.buscarLivros({ titulo: "mares", autor: "" });
  assert.match(API_URL, /^https:\/\/.+\.azurewebsites\.net$/);
  assert.equal(chamadas[0].url, `${API_URL}/api/livros?titulo=mares`);
  assert.equal(chamadas[0].headers.Authorization, undefined);
});

test("cadastro guarda o token e as próximas chamadas o enviam", async () => {
  respostas.push([201, { cliente: { id: 1, nome: "Ana" }, token: "abc", mensagem: "ok" }], [201, { mensagem: "Reserva" }]);
  await Livraria.cadastrar({ nome: "Ana" });
  assert.equal(estado.cliente.nome, "Ana");
  assert.equal(token.ler(), "abc");
  await Livraria.reservar({ edicao_id: "1", loja_id: "2" });
  assert.equal(chamadas[1].headers.Authorization, "Bearer abc");
  assert.equal(chamadas[1].method, "POST");
  assert.deepEqual(JSON.parse(chamadas[1].body), { edicao_id: "1", loja_id: "2" });
});

test("401 apaga o login e devolve a mensagem do servidor", async () => {
  token.guardar("velho");
  estado.cliente = { id: 1 };
  respostas.push([401, { erro: "Cadastre-se ou entre para continuar." }]);
  await assert.rejects(Livraria.minhaArea(), (e) => e.status === 401 && e.message.startsWith("Cadastre-se"));
  assert.equal(estado.cliente, null);
  assert.equal(token.ler(), null);
});

test("sem token não consulta a sessão; sair apaga o token", async () => {
  await Livraria.carregarSessao();
  assert.equal(chamadas.length, 0);
  token.guardar("abc");
  respostas.push([200, { cliente: { id: 1, nome: "Ana" } }], [204, null]);
  await Livraria.carregarSessao();
  assert.equal(estado.cliente.nome, "Ana");
  await Livraria.sair();
  assert.equal(chamadas[1].method, "DELETE");
  assert.equal(token.ler(), null);
});

test("servidor fora do ar vira mensagem amigável", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };
  await assert.rejects(Livraria.lojas(""), /Não foi possível falar com o servidor/);
});
