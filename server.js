// Servidor web do front-end (Azure App Service, Node): entrega a pasta public/ e o /health.
// O endereço do back-end vem da variável LIVRARIA_API_URL; sem ela, vale o padrão de public/js/config.js.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const PUBLICO = fileURLToPath(new URL("./public/", import.meta.url));

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

export function configJs(apiUrl) {
  return `// Gerado pelo servidor a partir de LIVRARIA_API_URL.\nexport const API_URL = ${JSON.stringify(apiUrl.replace(/\/+$/, ""))};\n`;
}

function responder(res, status, corpo, tipo, extras = {}) {
  res.writeHead(status, { "Content-Type": tipo, "X-Content-Type-Options": "nosniff", ...extras });
  res.end(corpo);
}

export function criarServidor({ apiUrl = process.env.LIVRARIA_API_URL } = {}) {
  return createServer(async (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return responder(res, 405, "Método não permitido", "text/plain; charset=utf-8", { Allow: "GET, HEAD" });
    }
    let caminho;
    try {
      caminho = decodeURIComponent(new URL(req.url, "http://local").pathname);
    } catch {
      return responder(res, 400, "Endereço inválido", "text/plain; charset=utf-8");
    }
    if (caminho === "/health") return responder(res, 200, '{"status":"ok"}', TIPOS[".json"]);
    if (caminho === "/js/config.js" && apiUrl) {
      return responder(res, 200, configJs(apiUrl), TIPOS[".js"], { "Cache-Control": "no-cache" });
    }

    const arquivo = normalize(join(PUBLICO, caminho.endsWith("/") ? `${caminho}index.html` : caminho));
    if (!arquivo.startsWith(PUBLICO)) {
      return responder(res, 404, "Não encontrado", "text/plain; charset=utf-8");
    }
    try {
      const conteudo = await readFile(arquivo);
      const tipo = TIPOS[extname(arquivo)] ?? "application/octet-stream";
      responder(res, 200, req.method === "HEAD" ? undefined : conteudo, tipo, { "Cache-Control": "no-cache" });
    } catch {
      responder(res, 404, "Não encontrado", "text/plain; charset=utf-8");
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const porta = Number(process.env.PORT) || 8080;
  criarServidor().listen(porta, () => console.log(`Front-end em http://localhost:${porta}`));
}
