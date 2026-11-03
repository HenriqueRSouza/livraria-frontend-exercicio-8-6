# Livraria: Front-end (Exercício 8.6)

Camada **cliente** da arquitetura Cliente-Servidor da livraria, publicada separadamente do back-end.

- **Front-end publicado:** endereço do Azure Static Web Apps *(após o deploy)*
- **Back-end (API REST):** https://engsoft-lab86-backend.azurewebsites.net *(após o deploy)* · repositório [livraria-backend-exercicio-8-6](https://github.com/HenriqueRSouza/livraria-backend-exercicio-8-6)
- Diagrama da arquitetura: [board do Miro](https://miro.com/app/board/uXjVETAfWIY=/)

```
Navegador (Azure Static Web Apps)                Azure App Service
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
| Configuração | `public/js/config.js` | Endereço do back-end (local ou Azure). |

HTML, CSS e JavaScript puro (módulos ES), sem framework e sem build.

**Login:** a API devolve um token no cadastro ou na entrada. O Model guarda o token no `localStorage` e o envia em `Authorization: Bearer <token>`. Não há cookie de sessão porque front-end e back-end ficam em domínios diferentes (navegadores como Brave e Safari bloqueiam cookies de terceiros).

## Rodar localmente

1. Suba o back-end na porta 8000 (veja o README do back-end).
2. Sirva a pasta `public/`:

```sh
python3 -m http.server 8080 --directory public
```

3. Abra http://localhost:8080. Em `localhost` o `config.js` aponta para `http://127.0.0.1:8000`; publicado, aponta para o back-end no Azure.

## Testes

```sh
node --test
```

Node 18+ sem dependências:
- `tests/arquitetura.test.mjs`: regras do MVC (só o Model faz HTTP, a View não mexe no DOM, endereço da API só no `config.js`).
- `tests/model.test.mjs`: URL da API, envio do token, tratamento de 401 e de servidor fora do ar.
- `tests/view.test.mjs`: telas, formatação em reais e escape de HTML.

## Deploy (Azure Static Web Apps)

O workflow `.github/workflows/azure-static-web-apps.yml` roda os testes e publica a pasta `public/` a cada push na `main`. Ele usa o secret `AZURE_STATIC_WEB_APPS_API_TOKEN`, que é o token de implantação do recurso no Azure:

```sh
az staticwebapp create -g <grupo> -n <nome> -l centralus --sku Free
az staticwebapp secrets list -g <grupo> -n <nome> --query properties.apiKey -o tsv   # vira o secret no GitHub
```

Se o endereço do back-end mudar, atualize `public/js/config.js` e libere o novo endereço do front-end no CORS do back-end (`LIVRARIA_CORS_ORIGENS`).
