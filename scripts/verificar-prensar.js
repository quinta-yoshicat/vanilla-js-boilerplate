#!/usr/bin/env node
// O Prensar da Adega (js/garrafa.js, executarAcaoAdega('prensar')): com o código REAL em vm e um randInt falso que dá sempre
// o mínimo ou sempre o máximo (e regista os intervalos pedidos), prova que:
//  (a) as Gotas por prensada vão de 12 a 18 (ADEGA_GOTAS_PRENSAR_MIN e ADEGA_GOTAS_PRENSAR_MAX, constantes no topo do
//      ficheiro): o mínimo dá +12 e o máximo +18, e o sorteio pedido é exatamente randInt(12, 18);
//  (b) o resto fica igual: custa 10 Uvas (ADEGA_CUSTO_UVAS_PRENSAR), o bagaço continua randInt(2, 4), o cooldown continua 2 h
//      (ADEGA_COOLDOWN_MS.prensar): 1 min antes das 2 h recusa sem mexer em nada, às 2 h já deixa; sem 10 Uvas recusa sem
//      mexer em nada; a mensagem mostra as Gotas e o bagaço ganhos;
//  (c) o «8 a 12» antigo já não está no código nem nos textos das 3 línguas.
// Depois, aplica "mutações" (estraga cada regra de propósito) e confirma que o teste as apanha.
// Uso: node scripts/verificar-prensar.js     Sai com 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const LER = function (f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); };
const FICHEIROS = ['state.js', 'estacoes.js', 'tempo.js', 'niveis.js', 'alambique.js', 'garrafa.js'];
const FONTES = {};
FICHEIROS.forEach(function (f) { FONTES[f] = LER('js/' + f); });
FONTES['i18n.js'] = LER('js/i18n.js');
const AGORA = Date.parse('2026-10-09T10:00:00+01:00');
const H = 60 * 60 * 1000;

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }

  function abrir(modo) {
    const relogio = { t: AGORA };
    class Relogio extends Date {
      constructor(...a) { if (a.length === 0) super(relogio.t); else super(...a); }
      static now() { return relogio.t; }
    }
    const sb = {
      console: { log() {}, warn() {}, error() {} },
      localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
      location: { search: '' }, URLSearchParams: URLSearchParams, Intl: Intl,
      document: {
        hidden: false, querySelectorAll: function () { return []; }, querySelector: function () { return null; },
        addEventListener: function () {}, getElementById: function () { return { innerHTML: '', style: {}, classList: { add() {}, remove() {}, toggle() {} } }; }
      },
      setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {}, Date: Relogio
    };
    sb.window = sb; sb.addEventListener = function () {}; sb.Telegram = { WebApp: {} };
    const cx = vm.createContext(sb);
    vm.runInContext(`
      var SAVES = 0, PEDIDOS = [];
      function t(k) { return k === 'adega.resultadoPrensar' ? '+{gotas} gotas +{bagaco} bagaço' : k; }
      function escaparHtml(s) { return String(s); }
      function mostrarFalas() {} function vibrar() {} function updateStatsDisplays() {}
      function reposicionarFlutuantes() {} function atualizarCartaoObjetivosQuinta() {}
      function localeAtual() { return 'pt-PT'; } function faseRealAtual() { return 'repouso'; }
      function jaFezTarefaTempoHoje() { return false; } function registarTarefaTempoHoje() {}
      function entradasBloqueadas() { return []; } function caveReservaAberta() { return true; } function garrafaQueMaisDescansou() { return 2; }
      function mostrarNovaEntrada() {} function atualizarDialogo() {} function definirFundo() {}
      function pararSomAmbiente() {} function iniciarSomAmbiente() {} function tocarSomFicheiro() {} function tocarSom() {} function tocarSomDaAcao() {} function formatarTempoVinha() { return '1 min'; }
      function atualizarCartaoNivelQuinta() {} function atualizarResumoQuinta() {} function atualizarLinhaVisitaQuinta() {}
      function marcarObjetivoCumprido() {} function desbloquearEntradaEnciclopedia() { return null; }
      function diaLisboaDeHoje() { return '2026-10-09'; }
      var currentLang = 'pt'; function goTo() {}
    `, cx);
    FICHEIROS.forEach(function (f) { vm.runInContext(fontes[f], cx, { filename: f }); });
    vm.runInContext(`
      saveState = function () { SAVES++; };
      renderAdega = function () {};
      // randInt falso: regista o intervalo pedido e dá sempre o mínimo ou sempre o máximo.
      randInt = function (a, b) { PEDIDOS.push([a, b]); return ${modo === 'max' ? 'b' : 'a'}; };
      state = defaultState();
      state.reputacao = 1200; state.uvas = 50; state.gotas = 100;
      state.adega = Object.assign(state.adega, { bagaco: 0, aguardente: 0, bagaceira: 0, cooldowns: {}, lote: null, historico: [] });
    `, cx);
    const g = { cx: cx, relogio: relogio };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
    return g;
  }

  // (a) mínimo e máximo
  [['min', 12, 2], ['max', 18, 4]].forEach(function (c) {
    const g = abrir(c[0]);
    g.ev("executarAcaoAdega('prensar')");
    ok(g.ev('state.gotas') === 100 + c[1], '(a) com o ' + c[0] + ' do sorteio o Prensar devia dar +' + c[1] + ' Gotas (deu ' + (g.ev('state.gotas') - 100) + ')');
    ok(g.ev('state.adega.bagaco') === c[2], '(b) com o ' + c[0] + ' do sorteio o bagaço devia ser ' + c[2] + ' (deu ' + g.ev('state.adega.bagaco') + ')');
    ok(JSON.stringify(g.json('PEDIDOS')) === '[[12,18],[2,4]]', '(a) os sorteios pedidos deviam ser randInt(12, 18) e randInt(2, 4): ' + JSON.stringify(g.json('PEDIDOS')));
    ok(g.ev('state.uvas') === 40, '(b) o Prensar devia custar 10 Uvas (ficou com ' + g.ev('state.uvas') + ')');
    ok(g.ev('adegaMensagemAtual').indexOf('+' + c[1] + ' gotas +' + c[2] + ' bagaço') !== -1, '(b) a mensagem devia dizer as Gotas e o bagaço ganhos: ' + g.ev('adegaMensagemAtual'));
    ok(g.ev('SAVES') >= 1, '(b) o Prensar devia gravar');
  });
  {
    const g = abrir('min');
    ok(g.ev('ADEGA_GOTAS_PRENSAR_MIN') === 12 && g.ev('ADEGA_GOTAS_PRENSAR_MAX') === 18, '(a) as constantes ADEGA_GOTAS_PRENSAR_MIN e _MAX são 12 e 18');
    ok(g.ev('ADEGA_CUSTO_UVAS_PRENSAR') === 10, '(b) ADEGA_CUSTO_UVAS_PRENSAR continua 10');
    ok(g.ev('ADEGA_COOLDOWN_MS.prensar') === 2 * H, '(b) o cooldown do Prensar continua 2 h');
    // cooldown: 1 min antes das 2 h recusa sem mexer em nada; às 2 h deixa.
    g.ev("executarAcaoAdega('prensar')");
    const depois1 = g.ev('JSON.stringify([state.uvas, state.gotas, state.adega.bagaco])');
    g.relogio.t = AGORA + 2 * H - 60 * 1000;
    g.ev('PEDIDOS = []'); g.ev("executarAcaoAdega('prensar')");
    ok(g.ev('JSON.stringify([state.uvas, state.gotas, state.adega.bagaco])') === depois1 && g.json('PEDIDOS').length === 0, '(b) antes das 2 h o Prensar devia recusar sem mexer em nada nem sortear');
    ok(g.ev('adegaMensagemAtual').indexOf('vinha.msgCooldown') === 0, '(b) a recusa diz que falta tempo');
    g.relogio.t = AGORA + 2 * H;
    g.ev("executarAcaoAdega('prensar')");
    ok(g.ev('state.uvas') === 30 && g.ev('state.gotas') === 124, '(b) às 2 h o Prensar volta a deixar (+12 Gotas, -10 Uvas)');
    // sem Uvas suficientes: recusa sem mexer em nada.
    const s = abrir('max');
    s.ev('state.uvas = 9;');
    const antes = s.ev('JSON.stringify(state)');
    s.ev("executarAcaoAdega('prensar')");
    ok(s.ev('JSON.stringify(state)') === antes && s.json('PEDIDOS').length === 0, '(b) com 9 Uvas o Prensar devia recusar sem mexer em nada');
  }
  // (c) o 8 a 12 antigo já não está escrito
  ok(!/randInt\(\s*8\s*,\s*12\s*\)/.test(fontes['garrafa.js']), '(c) o randInt(8, 12) antigo já não está em js/garrafa.js');
  ok(/const ADEGA_GOTAS_PRENSAR_MIN = 12;\nconst ADEGA_GOTAS_PRENSAR_MAX = 18;/.test(fontes['garrafa.js']) && /randInt\(ADEGA_GOTAS_PRENSAR_MIN, ADEGA_GOTAS_PRENSAR_MAX\)/.test(fontes['garrafa.js']), '(c) as constantes estão no topo e são usadas no randInt');
  ok(!/\b8\s*(a|to|-|–|y|e)\s*12\b/i.test(fontes['i18n.js']), '(c) nenhum texto das 3 línguas fala em «8 a 12»');
  return falhas;
}

function mutar(f, de, para) {
  if (FONTES[f].indexOf(de) === -1) { console.log('FALHA: mutação impossível (texto não encontrado em ' + f + '): ' + de.slice(0, 70)); return null; }
  const c = Object.assign({}, FONTES); c[f] = FONTES[f].split(de).join(para); return c;
}
const falhas = suite(FONTES);
let impossiveis = 0;
const MUTACOES = [
  ['volta o 8 a 12', 'garrafa.js', 'randInt(ADEGA_GOTAS_PRENSAR_MIN, ADEGA_GOTAS_PRENSAR_MAX)', 'randInt(8, 12)'],
  ['mínimo errado', 'garrafa.js', 'const ADEGA_GOTAS_PRENSAR_MIN = 12;', 'const ADEGA_GOTAS_PRENSAR_MIN = 11;'],
  ['máximo errado', 'garrafa.js', 'const ADEGA_GOTAS_PRENSAR_MAX = 18;', 'const ADEGA_GOTAS_PRENSAR_MAX = 20;'],
  ['custo errado', 'garrafa.js', 'const ADEGA_CUSTO_UVAS_PRENSAR = 10;', 'const ADEGA_CUSTO_UVAS_PRENSAR = 12;'],
  ['cooldown errado', 'garrafa.js', '  prensar: 2 * 60 * 60 * 1000,   // 2h', '  prensar: 1 * 60 * 60 * 1000,   // 2h'],
  ['bagaço mudado', 'garrafa.js', 'const bagacoGanho = randInt(2, 4);', 'const bagacoGanho = randInt(3, 5);'],
  ['sem custo', 'garrafa.js', '    state.uvas -= ADEGA_CUSTO_UVAS_PRENSAR;\n    const gotasGanhas', '    const gotasGanhas'],
  ['texto com 8 a 12', 'i18n.js', "    'adega.btnPrensar': '", "    'adega.btnPrensar': '8 a 12 "]
];
MUTACOES.forEach(function (m) {
  const f = mutar(m[1], m[2], m[3]);
  if (!f) { impossiveis++; return; }
  let apanhada; try { apanhada = suite(f).length > 0; } catch (e) { apanhada = true; }
  if (!apanhada) falhas.push('MUTAÇÃO NÃO APANHADA: ' + m[0]);
});
if (falhas.length || impossiveis) {
  falhas.forEach(function (m) { console.log('FALHA: ' + m); });
  console.log((falhas.length + impossiveis) + ' falha(s)');
  process.exit(1);
}
console.log('OK (' + MUTACOES.length + ' mutações apanhadas)');
