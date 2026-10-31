// Regras do cliente MVC: só o Model fala com o back-end; a View só gera HTML; o Controller liga os dois.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

const pasta = new URL("../public/js/", import.meta.url);
const ler = (nome) => readFileSync(new URL(nome, pasta), "utf8");
const importa = (nome) => new Set([...ler(nome).matchAll(/from\s+"\.\/([\w-]+)\.js"/g)].map((m) => m[1]));

test("só o model.js faz requisições HTTP", () => {
  for (const arquivo of readdirSync(pasta)) {
    assert.equal(/\bfetch\(|XMLHttpRequest/.test(ler(arquivo)), arquivo === "model.js", arquivo);
  }
});

test("a View não importa nada e não mexe no DOM", () => {
  assert.deepEqual(importa("view.js"), new Set());
  assert.doesNotMatch(ler("view.js"), /addEventListener|document\./);
});

test("o Controller liga Model e View; o Model só conhece a configuração", () => {
  assert.deepEqual(importa("controller.js"), new Set(["model", "view"]));
  assert.deepEqual(importa("model.js"), new Set(["config"]));
});

test("o endereço do back-end fica só no config.js", () => {
  for (const arquivo of readdirSync(pasta)) {
    assert.equal(/azurewebsites\.net/.test(ler(arquivo)), arquivo === "config.js", arquivo);
  }
});
