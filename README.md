# Livraria: Front-end (Exercício 8.6)

Camada **cliente** da arquitetura Cliente-Servidor da livraria, publicada separadamente do back-end.

- **Front-end publicado:** https://engsoft-lab86-frontend.azurewebsites.net
- **Back-end (API REST):** https://engsoft-lab86-backend.azurewebsites.net · repositório [livraria-backend-exercicio-8-6](https://github.com/HenriqueRSouza/livraria-backend-exercicio-8-6)
- Diagrama da arquitetura: [board do Miro](https://miro.com/app/board/uXjVETAfWIY=/)

```
Azure App Service (Node): front-end              Azure App Service (Python): back-end
┌───────────────────────────────┐   HTTPS/REST   ┌──────────────────────┐
│ View → Controller → Model ────┼───── JSON ────▶│ API da livraria      │
└───────────────────────────────┘  token Bearer  └──────────────────────┘
```

## Estrutura (MVC)

| Camada | Arquivo | O que faz |
|---|---|---|
| View | `public/js/view.js` | Gera o HTML das telas. Não chama o servidor nem trata eventos. |
| Controller | `public/js/controller.js` | Escuta links e formulários (`data-acao`), chama o Model e redesenha a View. |
| Model | `public/js/model.js` | Estado (cliente logado, mensagens) e todas as chamadas HTTP para a API. |
| Configuração | `public/js/config.js` | Endereço padrão do back-end (local ou Azure). |
| Servidor web | `server.js` | Node sem dependências: entrega `public/`, `/health` e o `config.js` com `LIVRARIA_API_URL`. |

HTML, CSS e JavaScript puro (módulos ES), sem framework, sem build e sem dependências no `npm`.

**Login:** a API devolve um token no cadastro ou na entrada. O Model guarda o token no `localStorage` e o envia em `Authorization: Bearer <token>`. Não há cookie de sessão porque front-end e back-end ficam em domínios diferentes (navegadores como Brave e Safari bloqueiam cookies de terceiros).

## Rodar localmente

1. Suba o back-end na porta 8000 (veja o README do back-end).
2. Suba o front-end (Node 20+):

```sh
npm start                     # http://localhost:8080
```

3. Abra http://localhost:8080. Em `localhost` o `config.js` aponta para `http://127.0.0.1:8000`. Para usar outro back-end: `LIVRARIA_API_URL=https://... npm start`.

## Testes

```sh
npm test
```

Node 18+ sem dependências:
- `tests/arquitetura.test.mjs`: regras do MVC (só o Model faz HTTP, a View não mexe no DOM, endereço da API só no `config.js`).
- `tests/model.test.mjs`: URL da API, envio do token, tratamento de 401 e de servidor fora do ar.
- `tests/view.test.mjs`: telas, formatação em reais e escape de HTML.
- `tests/servidor.test.mjs`: arquivos estáticos, `/health`, `config.js` gerado por `LIVRARIA_API_URL` e bloqueio de caminhos fora de `public/`.

## Deploy (Azure App Service)

Front-end e back-end são **dois Web Apps** separados, que podem ficar no mesmo plano do App Service. O workflow `.github/workflows/azure-webapp.yml` roda os testes e publica no Web App `engsoft-lab86-frontend` a cada push na `main`. Ele usa o secret `AZURE_WEBAPP_PUBLISH_PROFILE` (perfil de publicação deste Web App).

```sh
az webapp create -g <grupo> -p <plano> -n engsoft-lab86-frontend --runtime "NODE:22-lts"
az webapp config set -g <grupo> -n engsoft-lab86-frontend --startup-file "node server.js"
az webapp config appsettings set -g <grupo> -n engsoft-lab86-frontend --settings \
  LIVRARIA_API_URL=https://<endereço do back-end>
```

**Ligando os dois:**
- No front-end, `LIVRARIA_API_URL` diz onde está a API. O servidor entrega esse valor no `config.js`, então trocar o back-end não exige novo deploy, só reiniciar o Web App.
- No back-end, `LIVRARIA_CORS_ORIGENS` precisa conter o endereço do front-end (`https://engsoft-lab86-frontend.azurewebsites.net`), senão o navegador bloqueia as chamadas.
