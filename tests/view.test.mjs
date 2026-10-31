import assert from "node:assert/strict";
import { test } from "node:test";

import * as View from "../public/js/view.js";

const livro = {
  id: 1, titulo: "A Casa das Marés", autor: "L. Andrade", genero: "Ficção", sinopse: "Sinopse", media: 4.5,
  total_avaliacoes: 2,
  avaliacoes: [{ nota: 4, texto: "<script>alert(1)</script>", autor: "Ana", cliente_id: 7 }],
  edicoes: [{
    id: 1, nome: "Brochura", ano: 2024, preco_centavos: 5000, preco_final_centavos: 4000,
    promocoes: [{ descricao: "Oferta", desconto_centavos: 1000 }],
    estoques: [{ loja_id: 1, loja_nome: "Unidade Centro", secao: "Literatura", quantidade: 0 },
      { loja_id: 2, loja_nome: "Unidade Jardim", secao: "Ficção", quantidade: 2 }],
  }],
};

test("formata valores em reais", () => {
  assert.equal(View.reais(4000), "R$ 40,00");
  assert.equal(View.reais(123456), "R$ 1.234,56");
});

test("escapa texto vindo do servidor", () => {
  const html = View.livro(livro, null);
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(!html.includes("<script>alert"));
});

test("página do livro mostra ações conforme estoque e login", () => {
  const visitante = View.livro(livro, null);
  assert.ok(visitante.includes("Entre na sua área para avaliar"));
  assert.ok(visitante.includes('data-acao="alertar"'));  // loja sem estoque
  assert.ok(visitante.includes('data-acao="reservar"')); // loja com estoque
  assert.ok(visitante.includes("4,5") && visitante.includes("R$ 40,00"));
  const ana = View.livro(livro, { id: 7, nome: "Ana" });
  assert.ok(ana.includes("Atualizar minha avaliação"));
  assert.ok(ana.includes('data-acao="favoritar"'));
});

test("catálogo vazio e cabeçalho com cliente logado", () => {
  assert.ok(View.catalogo([], {}).includes("Nenhum livro encontrado."));
  assert.ok(View.cabecalho({ nome: "Ana" }).includes("Olá, Ana"));
  assert.ok(View.cabecalho(null).includes("Cadastro / entrada"));
});
