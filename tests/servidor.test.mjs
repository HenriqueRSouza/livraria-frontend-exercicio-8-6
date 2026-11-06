// Servidor web do front-end: entrega a pasta public/, o /health e o config.js com o endereço do back-end.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { criarServidor } from "../server.js";

const iniciar = (opcoes) =>
  new Promise((pronto) => {
    const servidor = criarServidor(opcoes).listen(0, "127.0.0.1", () =>
      pronto({ servidor, base: `http://127.0.0.1:${servidor.address().port}` }),
    );
  });

let comApi;
let semApi;
before(async () => {
  comApi = await iniciar({ apiUrl: "https://back.exemplo.azurewebsites.net/" });
  semApi = await iniciar({ apiUrl: undefined });
});
after(() => {
  comApi.servidor.close();
  semApi.servidor.close();
});

test("entrega a página inicial e os arquivos estáticos com o tipo certo", async () => {
  const pagina = await fetch(`${comApi.base}/`);
  assert.equal(pagina.status, 200);
  assert.match(pagina.headers.get("content-type"), /text\/html/);
  assert.match(await pagina.text(), /js\/controller\.js/);

  const css = await fetch(`${comApi.base}/css/estilo.css`);
  assert.match(css.headers.get("content-type"), /text\/css/);
  const js = await fetch(`${comApi.base}/js/view.js`);
  assert.match(js.headers.get("content-type"), /text\/javascript/);
});

test("health responde ok", async () => {
  const resposta = await fetch(`${comApi.base}/health`);
  assert.equal(resposta.status, 200);
  assert.deepEqual(await resposta.json(), { status: "ok" });
});

test("config.js usa LIVRARIA_API_URL (sem barra no fim)", async () => {
  const texto = await (await fetch(`${comApi.base}/js/config.js`)).text();
  assert.match(texto, /export const API_URL = "https:\/\/back\.exemplo\.azurewebsites\.net";/);
});

test("sem LIVRARIA_API_URL entrega o config.js padrão", async () => {
  const texto = await (await fetch(`${semApi.base}/js/config.js`)).text();
  assert.match(texto, /const LOCAL =/);
});

test("não sai da pasta public/ nem aceita outros métodos", async () => {
  for (const caminho of ["/../server.js", "/%2e%2e/server.js", "/..%2Fpackage.json", "/nada.html"]) {
    assert.equal((await fetch(`${comApi.base}${caminho}`)).status, 404, caminho);
  }
  assert.equal((await fetch(`${comApi.base}/%E0%A4%A`)).status, 400);
  assert.equal((await fetch(`${comApi.base}/`, { method: "POST" })).status, 405);
});
