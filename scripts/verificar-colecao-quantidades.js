#!/usr/bin/env node
// As quantidades por cor no ecrã "A Coleção" (js/garrafa.js: colecaoQuantidadesPorCor e renderColecaoDesenhar), o Perfil
// sem as garrafinhas e o ecrã "As Garrafas" retirado. Corre state.js, i18n.js, niveis.js, alambique.js, garrafa.js e
// reserva.js REAIS num ambiente simulado (vm), sem browser nem conta real.
//
// A. colecaoQuantidadesPorCor: conta TODAS as garrafas de state.adega.historico por cor (garrafaPorDias: 1 Jovem,
//    2 Dourado, 3 Âmbar, 4 ou mais Cobre), também as de antes do nível 6; a Edição São Martinho à parte; garrafas sem dias
//    válidos e entradas estragadas não contam; função pura (não escreve no estado, nem congelado).
// B. O ecrã: «×N» debaixo do nome de cada cor, pela ordem Jovem, Dourado, Âmbar, Cobre; o ✓, o "por-fazer" e o "x / 4"
//    continuam a ser os das cores feitas desde o nível 6 (iguais aos de antes); «×0» nas cores sem garrafas; a Edição
//    São Martinho só aparece com pelo menos uma; sem o botão "As minhas garrafas".
// C. O ecrã "As Garrafas" e a galeria do Perfil já não existem (código, CSS, ligação em goTo e traduções); textos
//    novos nas 3 línguas; o espaço por baixo da grelha já não conta o botão retirado.
//
// Depois de passar, aplica "mutações" (estraga cada regra de propósito) e confirma que o teste as apanha.
// Uso: node scripts/verificar-colecao-quantidades.js     Sai com 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const FICHEIROS = ['state.js', 'i18n.js', 'niveis.js', 'alambique.js', 'garrafa.js', 'reserva.js'];
const FONTES = {};
FICHEIROS.forEach(function (f) { FONTES[f] = fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'); });
const INDEX = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
const MAIN = fs.readFileSync(path.join(RAIZ, 'js', 'main.js'), 'utf8');
const PERFIL = fs.readFileSync(path.join(RAIZ, 'js', 'perfil.js'), 'utf8');

const h = function (dias, extra) { return Object.assign({ data: 'x', estacao: 'inverno', diasDescanso: dias }, extra || {}); };
const SM = function () { return h(0, { festa: 'saomartinho' }); };
// Histórico de teste: 2 Jovem, 1 Dourado, 3 Âmbar, 3 Cobre (4, 7 e 9 dias), 2 São Martinho e 6 entradas sem dias válidos.
// Com a nota do nível 6 em 6, só as 3 Cobre e 1 Âmbar ficam "desde o nível 6".
const HIST = [h(1), h(2), h(3), h(1), h(3), SM(), h(4), h(3), h(7), SM(), h(9),
  { data: 'x', estacao: 'inverno' }, h(null), h('x'), h(-1), h(0), null];
const ESPERADO = { jovem: 2, dourado: 1, ambar: 3, cobre: 3, saoMartinho: 2 };

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }

  function abrir(lang) {
    const caixa = { innerHTML: '' };
    const sb = {
      console: { log() {}, warn() {}, error() {} },
      localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
      location: { search: '' }, URLSearchParams: URLSearchParams, navigator: { language: 'pt-PT' },
      document: { querySelectorAll: function () { return []; }, getElementById: function () { return caixa; }, querySelector: function () { return null; }, addEventListener: function () {}, documentElement: {} },
      setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {}, Date: Date
    };
    sb.window = sb;
    sb.addEventListener = function () {};
    sb.Telegram = { WebApp: {} };
    const cx = vm.createContext(sb);
    vm.runInContext(fontes['state.js'], cx, { filename: 'state.js' });
    vm.runInContext(fontes['i18n.js'], cx, { filename: 'i18n.js' });
    vm.runInContext(`
      var FUNDOS = [];
      currentLang = ${JSON.stringify(lang || 'pt')};
      t = function (k) { return Object.prototype.hasOwnProperty.call(TRANSLATIONS[currentLang], k) ? TRANSLATIONS[currentLang][k] : k; };
      function definirFundo(modo, src) { FUNDOS.push(src); }
      function atualizarDialogo() {} applyTranslations = function () {};
      function mostrarFalas() {} function vibrar() {} function tocarSom() {}
      function updateStatsDisplays() {} function estacaoAtual() { return 'inverno'; } function localeAtual() { return 'pt-PT'; }
      function marcarObjetivoCumprido() {} function desbloquearEntradaEnciclopedia() { return null; }
      function formatarTempoVinha() { return ''; } function randInt(a) { return a; }
      function diaLisboaDeHoje() { return '2026-10-10'; }
      function atualizarCartaoObjetivosQuinta() {} function atualizarResumoQuinta() {} function atualizarCapituloQuinta() {}
    `, cx);
    ['niveis.js', 'alambique.js', 'garrafa.js', 'reserva.js'].forEach(function (f) { vm.runInContext(fontes[f], cx, { filename: f }); });
    const g = { cx: cx, caixa: caixa };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
    g.pr = function (historico, nota) {
      g.ev('state.reputacao = 3000; state.acesso.jogadorAntigo = true; state.adega.historico = ' + JSON.stringify(historico) +
        '; state.niveis.garrafasAoNivel6 = ' + JSON.stringify(nota) + '; state.garrafas = ' + historico.length +
        '; state.colecao = { arrumouDia: null }; colecaoResultado = null; FUNDOS.length = 0;');
    };
    // As 4 células da grelha, por ordem: { nome, visto, porFazer, quantidade }.
    g.celulas = function () {
      const html = caixa.innerHTML;
      const re = /<div class="colecao-cor( por-fazer)?">[\s\S]*?<p class="colecao-nome"><span>([^<]*)<\/span>(<span class="colecao-visto"[^>]*>✓<\/span>)?<\/p><p class="colecao-quantidade">([^<]*)<\/p><\/div>/g;
      const out = []; let m;
      while ((m = re.exec(html))) out.push({ nome: m[2], visto: !!m[3], porFazer: !!m[1], quantidade: m[4] });
      return out;
    };
    return g;
  }

  // ---------------- A. A contagem ----------------
  {
    // pura (num jogo acabado de abrir, antes de qualquer outra chamada): não escreve no estado
    const p = abrir('pt');
    p.pr(HIST, 6);
    ok(p.ev('(function () { var e = JSON.parse(JSON.stringify(state)); var antes = JSON.stringify(e); colecaoQuantidadesPorCor(e); return JSON.stringify(e) === antes; })()') === true, 'colecaoQuantidadesPorCor não muda o estado');
    const g = abrir('pt');
    g.pr(HIST, 6);
    ok(JSON.stringify(g.json('colecaoQuantidadesPorCor(state)')) === JSON.stringify(ESPERADO), 'contagem do histórico de teste: ' + JSON.stringify(g.json('colecaoQuantidadesPorCor(state)')));
    // com a nota do nível 6 por chegar (null) conta tudo na mesma
    g.pr(HIST, null);
    ok(JSON.stringify(g.json('colecaoQuantidadesPorCor(state)')) === JSON.stringify(ESPERADO), 'a contagem não depende da nota do nível 6 (null)');
    g.pr(HIST, HIST.length);
    ok(JSON.stringify(g.json('colecaoQuantidadesPorCor(state)')) === JSON.stringify(ESPERADO), 'a contagem conta as garrafas de antes do nível 6');
    // casos simples
    [[[], { jovem: 0, dourado: 0, ambar: 0, cobre: 0, saoMartinho: 0 }],
      [[h(1)], { jovem: 1, dourado: 0, ambar: 0, cobre: 0, saoMartinho: 0 }],
      [[h(2.7), h(3.9), h(4)], { jovem: 0, dourado: 1, ambar: 1, cobre: 1, saoMartinho: 0 }],
      [[SM(), h(3, { festa: 'saomartinho' })], { jovem: 0, dourado: 0, ambar: 0, cobre: 0, saoMartinho: 2 }],
      [[h(3, { festa: 'outra' })], { jovem: 0, dourado: 0, ambar: 0, cobre: 0, saoMartinho: 0 }]
    ].forEach(function (c, i) {
      g.pr(c[0], 0);
      ok(JSON.stringify(g.json('colecaoQuantidadesPorCor(state)')) === JSON.stringify(c[1]), 'caso ' + (i + 1) + ': ' + JSON.stringify(g.json('colecaoQuantidadesPorCor(state)')));
    });
    ok(JSON.stringify(g.json('colecaoQuantidadesPorCor({})')) === JSON.stringify({ jovem: 0, dourado: 0, ambar: 0, cobre: 0, saoMartinho: 0 }) &&
      JSON.stringify(g.json('colecaoQuantidadesPorCor(null)')) === JSON.stringify({ jovem: 0, dourado: 0, ambar: 0, cobre: 0, saoMartinho: 0 }) &&
      JSON.stringify(g.json('colecaoQuantidadesPorCor({ adega: { historico: "x" } })')) === JSON.stringify({ jovem: 0, dourado: 0, ambar: 0, cobre: 0, saoMartinho: 0 }), 'estado sem histórico: tudo a 0');
    // funciona com o estado congelado
    g.pr(HIST, 6);
    let rebentou = false;
    try { g.ev('(function () { var e = JSON.parse(JSON.stringify(state)); (function f(o) { Object.freeze(o); Object.keys(o).forEach(function (k) { if (o[k] && typeof o[k] === "object") f(o[k]); }); })(e); "use strict"; return colecaoQuantidadesPorCor(e); })()'); } catch (e) { rebentou = true; }
    ok(!rebentou, 'colecaoQuantidadesPorCor funciona com o estado congelado');
  }

  // ---------------- B. O ecrã ----------------
  ['pt', 'en', 'es'].forEach(function (l) {
    const g = abrir(l);
    const T = g.json('TRANSLATIONS.' + l);
    const nomes = [T['adega.garrafaJovem'], T['adega.garrafaDourado'], T['adega.garrafaAmbar'], T['adega.garrafaCobre']];
    g.pr(HIST, 6);
    const coresAntes = g.ev('JSON.stringify(colecaoCoresFeitas(state))'), resumoAntes = g.ev('colecaoResumo()');
    g.ev('renderColecao()');
    const c = g.celulas();
    ok(c.length === 4, l + ': 4 células com nome e quantidade (deu ' + c.length + ')');
    ok(c.map(function (x) { return x.nome; }).join('|') === nomes.join('|'), l + ': as cores pela ordem Jovem, Dourado, Âmbar, Cobre');
    ok(c.map(function (x) { return x.quantidade; }).join('|') === '×2|×1|×3|×3', l + ': «×N» de cada cor (deu ' + c.map(function (x) { return x.quantidade; }).join('|') + ')');
    // o ✓ e o "por-fazer" continuam a ser os das cores feitas desde o nível 6 (aqui Âmbar e Cobre)
    ok(c.map(function (x) { return x.visto ? '✓' : '-'; }).join('') === '--✓✓', l + ': o ✓ só nas cores feitas desde o nível 6');
    ok(c.map(function (x) { return x.porFazer ? 'p' : '-'; }).join('') === 'pp--', l + ': o aspeto apagado é o de hoje (cores ainda não feitas desde o nível 6)');
    ok(g.caixa.innerHTML.indexOf('<p class="mini-sub">2 / 4') !== -1 && resumoAntes === '2 / 4', l + ': o "x / 4" continua 2 / 4');
    ok(g.ev('JSON.stringify(colecaoCoresFeitas(state))') === coresAntes, l + ': as cores da Coleção (capítulo 6) não mudam');
    ok(g.caixa.innerHTML.indexOf('<span class="colecao-sao-martinho">· ' + T['colecao.saoMartinho'].replace('{n}', 2) + '</span>') !== -1, l + ': a Edição São Martinho aparece com a quantidade (2)');
    ok(g.caixa.innerHTML.indexOf("goTo('garrafas')") === -1 && g.caixa.innerHTML.indexOf('garrafas.btn') === -1, l + ': sem o botão "As minhas garrafas"');
    ok(g.caixa.innerHTML.indexOf('colecaoArrumarClique()') !== -1 && g.caixa.innerHTML.indexOf('voltarEcraAnterior()') !== -1, l + ': continuam o "Arrumar a Coleção" e o "Voltar"');
    // cores sem garrafas: «×0», apagadas, sem ✓; sem São Martinho não aparece
    g.pr([h(1)], 0);
    g.ev('renderColecao()');
    const z = g.celulas();
    ok(z.map(function (x) { return x.quantidade; }).join('|') === '×1|×0|×0|×0', l + ': «×0» nas cores sem garrafas');
    ok(z.map(function (x) { return x.porFazer ? 'p' : '-'; }).join('') === '-ppp' && z.map(function (x) { return x.visto ? '✓' : '-'; }).join('') === '✓---', l + ': as cores sem garrafas ficam apagadas e sem ✓');
    ok(g.caixa.innerHTML.indexOf('colecao-sao-martinho') === -1, l + ': sem Edição São Martinho no histórico não aparece');
    // garrafas feitas antes do nível 6: contam no «×N» mas não dão ✓ nem "x / 4"
    g.pr([h(4), h(4), h(1)], 2);
    g.ev('renderColecao()');
    const a = g.celulas();
    ok(a.map(function (x) { return x.quantidade; }).join('|') === '×1|×0|×0|×2' && a[3].visto === false && a[3].porFazer === true && g.ev('colecaoResumo()') === '1 / 4', l + ': o Cobre de antes do nível 6 conta (×2) mas sem ✓ nem "x / 4"');
    // o ecrã não grava nada
    const est = g.ev('JSON.stringify(state)');
    g.ev('renderColecao()');
    ok(g.ev('JSON.stringify(state)') === est, l + ': desenhar a Coleção não muda o estado');
    // textos novos
    ok(typeof T['colecao.quantidade'] === 'string' && T['colecao.quantidade'].indexOf('{n}') !== -1, l + ': falta colecao.quantidade com {n}');
    ok(typeof T['colecao.saoMartinho'] === 'string' && T['colecao.saoMartinho'].indexOf('{n}') !== -1 && T['colecao.saoMartinho'].length > 8, l + ': falta colecao.saoMartinho com {n}');
    ok(!('garrafas.title' in T) && !('garrafas.btn' in T), l + ': as traduções do ecrã "As Garrafas" saíram');
  });

  // ---------------- C. O que saiu ----------------
  {
    const g = abrir('pt');
    ok(g.ev('typeof renderGarrafas') === 'undefined' && g.ev('typeof garrafasLinhas') === 'undefined', 'renderGarrafas e garrafasLinhas saíram de garrafa.js');
    ok(!/garrafas'\)|'garrafas'|garrafas:/.test(MAIN), 'main.js já não liga o ecrã "garrafas" (goTo e tabela da barra de baixo)');
    ok(INDEX.indexOf('screen-garrafas') === -1 && INDEX.indexOf('garrafas-container') === -1 && INDEX.indexOf('garrafas-lista') === -1 && INDEX.indexOf('garrafa-linha') === -1, 'index.html sem o ecrã "As Garrafas" nem o seu CSS');
    ok(!/#screen-colecao \.action-panel \.btn-ghost/.test(INDEX), 'index.html sem o estilo do botão "As minhas garrafas"');
    ok(/\.colecao-painel \{[^}]*bottom: calc\(var\(--nav-altura\) \+ 8px \+ 44px \+ 8px \+ 52px \+ 8px\);/.test(INDEX), 'o espaço por baixo da grelha é o do Voltar e do "Arrumar a Coleção" (sem o botão retirado)');
    ok(/\.colecao-painel\.com-prova \{[^}]*bottom: calc\(var\(--nav-altura\) \+ 8px \+ 44px \+ 8px \+ 44px \+ 8px \+ 52px \+ 8px\);/.test(INDEX), 'com o botão da Prova às cegas (nível 6+, a classe com-prova) a grelha guarda mais 44 px + 8 px');
    ok(/\.colecao-quantidade \{/.test(INDEX), 'index.html tem o estilo da quantidade');
    ok(PERFIL.indexOf('bottle-gallery') === -1 && PERFIL.indexOf('renderGaleriaGarrafas') === -1 && PERFIL.indexOf('PERFIL_GARRAFA_PEQUENA_SVG') === -1 && INDEX.indexOf('bottle-gallery') === -1, 'Perfil sem as garrafinhas (código e CSS)');
    ok(/state\.garrafas \+ ' — <span data-i18n="perfil\.ultimaLabel"><\/span>: ' \+ state\.ultimaGarrafaData/.test(PERFIL), 'Perfil continua com «N — última: data»');
  }
  return falhas;
}

// ---------------- Mutações ----------------
function mutar(ficheiro, de, para) {
  if (FONTES[ficheiro].indexOf(de) === -1) { console.log('FALHA: mutação impossível (texto não encontrado em ' + ficheiro + '): ' + de.slice(0, 60)); return null; }
  const f = Object.assign({}, FONTES);
  f[ficheiro] = FONTES[ficheiro].split(de).join(para);
  return f;
}

let falhas = suite(FONTES);
let mutacoesMal = 0;
const MUTACOES = [
  ['conta só desde o nível 6', 'garrafa.js', "const h = estado && estado.adega && estado.adega.historico;\n  if (!Array.isArray(h)) return q;\n  h.forEach", "const h = colecaoGarrafasNovas(estado);\n  if (!Array.isArray(h)) return q;\n  h.forEach"],
  ['São Martinho conta como cor', 'garrafa.js', "if (e.festa) { if (e.festa === 'saomartinho') q.saoMartinho++; return; }", "if (e.festa === 'saomartinho') q.saoMartinho++;"],
  ['garrafas sem dias contam como Jovem', 'garrafa.js', "    if (g.dias === null) return;\n    q[COLECAO_COR_POR_NOME[g.nomeKey]]++;", "    q[COLECAO_COR_POR_NOME[g.nomeKey]]++;"],
  ['quantidade de outra cor', 'garrafa.js', "t('colecao.quantidade').replace('{n}', quantidades[cor])", "t('colecao.quantidade').replace('{n}', quantidades.jovem)"],
  ['o apagado passa a seguir a quantidade', 'garrafa.js', "'<div class=\"colecao-cor' + (feita ? '' : ' por-fazer') + '\">'", "'<div class=\"colecao-cor' + (quantidades[cor] > 0 ? '' : ' por-fazer') + '\">'"],
  ['o ✓ passa a seguir a quantidade', 'garrafa.js', "(feita ? '<span class=\"colecao-visto\"", "(quantidades[cor] > 0 ? '<span class=\"colecao-visto\""],
  ['São Martinho sempre à vista', 'garrafa.js', 'const saoMartinhoHtml = quantidades.saoMartinho > 0', 'const saoMartinhoHtml = quantidades.saoMartinho >= 0'],
  ['volta o botão "As minhas garrafas"', 'garrafa.js', "      // Tarefa do dia \"Arrumar a Coleção\"", "      '<button type=\"button\" class=\"btn-ghost\" onclick=\"goTo(\\'garrafas\\')\" data-i18n=\"garrafas.btn\"></button>' +\n      // Tarefa do dia \"Arrumar a Coleção\""],
  ['a função escreve no estado', 'garrafa.js', "  const q = { jovem: 0, dourado: 0, ambar: 0, cobre: 0, saoMartinho: 0 };\n  const h = estado && estado.adega && estado.adega.historico;", "  const q = { jovem: 0, dourado: 0, ambar: 0, cobre: 0, saoMartinho: 0 };\n  if (estado && estado.niveis) estado.niveis.vistoQuantidades = true;\n  const h = estado && estado.adega && estado.adega.historico;"],
  ['texto em falta (ES)', 'i18n.js', "    'colecao.saoMartinho': 'Edición San Martín ×{n}',\n", ''],
  ['quantidade sem {n} (EN)', 'i18n.js', "    'colecao.saoMartinho': 'St. Martin Edition ×{n}',", "    'colecao.saoMartinho': 'St. Martin Edition',"]
];
MUTACOES.forEach(function (m) {
  const f = mutar(m[1], m[2], m[3]);
  if (!f) { mutacoesMal++; return; }
  let apanhada;
  try { apanhada = suite(f).length > 0; } catch (e) { apanhada = true; }
  if (!apanhada) falhas.push('MUTAÇÃO NÃO APANHADA: ' + m[0]);
});

if (falhas.length || mutacoesMal) {
  falhas.forEach(function (m) { console.log('FALHA: ' + m); });
  console.log((falhas.length + mutacoesMal) + ' falha(s)');
  process.exit(1);
}
console.log('OK (' + MUTACOES.length + ' mutações apanhadas)');
