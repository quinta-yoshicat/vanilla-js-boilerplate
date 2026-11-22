#!/usr/bin/env node
// CUIDAR DA CAVE — «Rodar as garrafas» (caveRodarEstado, caveRodarBotaoHtml e caveRodarClique em js/garrafa.js; o botão
// na fila da Adega, renderAdega). Corre os ficheiros REAIS em vm (state, i18n, estacoes, tempo, niveis, alambique e
// garrafa), com um relógio, uma gravação e um DOM falsos.
//
// Prova:
//  (a) sem lote não há botão; com lote aparece na fila da Adega (data-acao="rodar", no fim), com o texto traduzido;
//  (b) no escalão 0 pode rodar uma vez (+4 Gotas, um saveState, a barra, o som e a frase); no mesmo escalão não repete
//      (o botão apagado com o relógio e o tempo até ao escalão seguinte); no escalão seguinte volta a poder; no máximo 4
//      por lote (escalões 0 a 3: depois «já não precisa»); quem não rodou num escalão não o recupera depois;
//  (c) um lote novo recomeça (a rotação do lote anterior não conta);
//  (d) relógio: atrasado (a rotação gravada «no futuro») nunca dá uma rotação extra; adiantado só conta os escalões a
//      que o relógio chegou, e nunca mais de 4 por lote;
//  (e) modo de teste (?dias=, ?visita=): o botão aparece mas rodar não grava nem paga;
//  (f) toque duplo: não paga duas vezes;
//  (g) save antigo sem a chave «rodar»: pode rodar; mergeDeep (o arranque e a nuvem, que trazem o estado inteiro)
//      não perdem a chave;
//  (h) não mexe no descanso, na cor nem na Reputação do lote, nem nos outros cooldowns;
//  (i) textos nas 3 línguas, curtos, e o sufixo do botão apagado numa linha (a fila que desliza não parte linha).
//
// Depois de passar, aplica "mutações" e confirma que o teste as apanha.
// Uso: node scripts/verificar-cave-rodar.js     Sai com 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const LER = function (f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); };
const FONTES = {};
['state.js', 'i18n.js', 'estacoes.js', 'tempo.js', 'niveis.js', 'alambique.js', 'garrafa.js'].forEach(function (f) { FONTES[f] = LER('js/' + f); });
const J = JSON.stringify;
const AGORA = Date.parse('2026-07-09T10:00:00+01:00');
const H = 60 * 60 * 1000;
const E = 9 * H;

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }

  function abrir(o) {
    o = o || {};
    const relogio = { t: AGORA };
    class Relogio extends Date {
      constructor(...a) { if (a.length === 0) super(relogio.t); else super(...a); }
      static now() { return relogio.t; }
    }
    const caixa = { innerHTML: '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, querySelectorAll: function () { return []; } };
    const sb = {
      console: { log() {}, warn() {}, error() {} },
      localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
      location: { search: o.search || '' }, URLSearchParams: URLSearchParams, Intl: Intl,
      document: { hidden: false, querySelectorAll: function () { return []; }, querySelector: function () { return null; }, documentElement: {}, addEventListener: function () {},
        getElementById: function (id) { return id === 'garrafa-container' ? caixa : { innerHTML: '', style: {}, classList: { add() {}, remove() {}, toggle() {} } }; } },
      setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {}, Date: Relogio, navigator: { language: 'pt' }
    };
    sb.window = sb; sb.addEventListener = function () {}; sb.Telegram = { WebApp: {} };
    const cx = vm.createContext(sb);
    vm.runInContext(fontes['state.js'], cx, { filename: 'state.js' });
    vm.runInContext(fontes['i18n.js'], cx, { filename: 'i18n.js' });
    vm.runInContext(`
      var SAVES = 0, BARRA = 0, SONS = [];
      function escaparHtml(s) { return String(s); }
      function mostrarFalas() {} function vibrar() {} function updateStatsDisplays() { BARRA++; }
      function reposicionarFlutuantes() {} function atualizarCartaoObjetivosQuinta() {}
      function localeAtual() { return 'pt-PT'; } function faseRealAtual() { return 'repouso'; }
      function jaFezTarefaTempoHoje() { return false; } function registarTarefaTempoHoje() {}
      function entradasBloqueadas() { return []; } function mostrarNovaEntrada() {} function atualizarDialogo(m) { __dialogo = m; } var __dialogo = ''; function definirFundo() {}
      function pararSomAmbiente() {} function iniciarSomAmbiente() {} function tocarSomFicheiro() {} function tocarSom(n) { SONS.push(n); } function tocarSomDaAcao(s) { SONS.push(typeof s === 'string' ? s : 'ficheiro'); }
      function formatarTempoVinha(ms) { return Math.ceil(ms / 60000) + ' min'; }
      var RELOGIO_PASTILHA_SVG = '<svg class="pill-clock"></svg>';
      function construirFilaPastilhas(id, botoes) { return '<div class="pill-scroll-wrap"><div class="pill-scroll" id="' + id + '">' + botoes + '</div></div>'; }
      function configurarFilaPastilhas() {} function marcarPastilhaPrincipal() {}
      function atualizarCartaoNivelQuinta() {} function atualizarResumoQuinta() {} function atualizarLinhaVisitaQuinta() {}
      function marcarObjetivoCumprido() {} function desbloquearEntradaEnciclopedia() { return null; }
      function diaLisboaDeHoje() { return '2026-07-09'; } function goTo() {}
      var VISITAS_PARAMETROS_TESTE = ['visita', 'dias', 'festa']; function visitaEmModoTeste() { var p = new URLSearchParams(location.search); return VISITAS_PARAMETROS_TESTE.some(function (k) { return p.has(k); }); }
    `, cx);
    ['estacoes.js', 'tempo.js', 'niveis.js', 'alambique.js', 'garrafa.js'].forEach(function (f) { vm.runInContext(fontes[f], cx, { filename: f }); });
    vm.runInContext(`
      saveState = function () { SAVES++; };
      estacaoAtual = function () { return 'verao'; };
      state = defaultState();
      state.reputacao = 400; state.uvas = 50; state.gotas = 20; state.garrafas = 1;
      state.adega = Object.assign(state.adega, { bagaco: 0, aguardente: 0, bagaceira: 0, cooldowns: { prensar: ${AGORA - 3 * H} }, lote: null, historico: [] });
    `, cx);
    const g = { cx: cx, relogio: relogio, caixa: caixa };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
    g.lote = function (iniciadoEm) { g.ev('state.adega.lote = { iniciadoEm: ' + iniciadoEm + ' }'); };
    g.em = function (ms) { relogio.t = ms; };
    g.rodar = function () { g.ev('caveRodarClique()'); return g.ev('state.gotas'); };
    g.botao = function () { g.ev('renderAdega()'); const m = /<button class="btn-pill" data-acao="rodar"[^>]*>[\s\S]*?<\/button>/.exec(caixa.innerHTML); return m ? m[0] : null; };
    g.pode = function () { return g.ev('caveRodarEstado(state, Date.now()).ok'); };
    return g;
  }

  // ---------------------------------------------------------------- (a) o botão
  {
    const g = abrir();
    ok(g.botao() === null && g.ev('caveRodarEstado(state, Date.now()).motivo') === 'sem_lote' && g.ev('caveRodarBotaoHtml()') === '', '(a) sem lote não há botão');
    g.lote(AGORA - H);
    const b = g.botao();
    ok(!!b && !/ disabled/.test(b) && /onclick="caveRodarClique\(\)"/.test(b) && /data-i18n="adega\.btnRodar"/.test(b), '(a) com lote: o botão «Rodar as garrafas» ativo: ' + b);
    ok(g.caixa.innerHTML.indexOf('data-acao="rodar"') > g.caixa.innerHTML.indexOf('data-acao="engarrafar"'), '(a) no fim da fila (depois do «Ver o lote»)');
  }

  // ---------------------------------------------------------------- (b) uma por escalão, até 4
  {
    const g = abrir(); g.lote(AGORA - H);
    const antes = g.ev('state.gotas');
    ok(g.rodar() === antes + 4 && g.ev('SAVES') === 1 && g.ev('BARRA') >= 1 && g.ev('SONS.length') === 1 && g.ev('__dialogo') === 'Rodaste as garrafas. +4 Gotas.', '(b) escalão 0: +4 Gotas, grava uma vez, atualiza a barra, um som e a frase');
    ok(g.ev('state.adega.cooldowns.rodar') === AGORA, '(b) guarda a hora em state.adega.cooldowns.rodar');
    g.em(AGORA + 2 * H);
    ok(g.rodar() === antes + 4 && g.ev('SAVES') === 1 && /Já rodaste as garrafas\. Volta daqui a/.test(g.ev('__dialogo')), '(b) no mesmo escalão não repete (e diz quando volta)');
    const b = g.botao();
    ok(/ disabled/.test(b) && /pill-clock/.test(b) && /\(360 min\)/.test(b), '(b) o botão apagado com o relógio e o tempo até ao escalão seguinte (6 h): ' + b);
    g.em(AGORA - H + E + 10); // escalão 1
    ok(g.pode() === true && g.rodar() === antes + 8, '(b) escalão seguinte: volta a poder');
    g.em(AGORA - H + 2 * E + 10); g.rodar();
    g.em(AGORA - H + 3 * E + 10); g.rodar();
    ok(g.ev('state.gotas') === antes + 16, '(b) 4 rotações nos escalões 0 a 3: +16 Gotas');
    const b3 = g.botao();
    ok(/ disabled/.test(b3) && /\(já não precisa\)/.test(b3) && g.ev('caveRodarEstado(state, Date.now()).motivo') === 'maximo', '(b) depois da 4.ª: apagado, «já não precisa»');
    g.em(AGORA - H + 4 * E + 10);
    ok(g.pode() === false && g.rodar() === antes + 16 && g.ev('__dialogo') === 'Este lote já foi bem cuidado. Agora é só esperar.' && g.ev('SAVES') === 4, '(b) escalão 4 ou mais: nunca mais (no máximo 4 por lote)');
    const s = abrir(); s.lote(AGORA - 2 * E - H);  // começa a rodar já no escalão 2
    s.rodar(); s.em(AGORA + E); s.rodar(); s.em(AGORA + 2 * E);
    ok(s.ev('state.gotas') === 28 && s.pode() === false, '(b) quem não rodou nos escalões 0 e 1 não os recupera (só o 2 e o 3: +8)');
  }

  // ---------------------------------------------------------------- (c) lote novo
  {
    const g = abrir(); g.lote(AGORA - H); g.rodar();
    g.em(AGORA + H); g.lote(AGORA + H); // engarrafou e fortificou um lote novo
    ok(g.pode() === true && g.rodar() === 28, '(c) um lote novo recomeça (a rotação do anterior não conta)');
  }

  // ---------------------------------------------------------------- (d) relógio
  {
    const g = abrir(); g.lote(AGORA - H); g.rodar();
    g.em(AGORA - 5 * H); // relógio atrasado: a rotação ficou «no futuro»
    // (o desenho da Adega corrige as horas «no futuro» para agora e grava, como sempre fez: carimboCorrigirFuturo)
    ok(g.pode() === false && g.rodar() === 24 && g.ev('state.adega.cooldowns.rodar') <= AGORA, '(d) relógio atrasado (a rotação gravada no futuro): não dá rotação extra');
    g.em(AGORA - 4 * E); // tão atrás que o lote também ficou «no futuro»
    ok(g.pode() === false && g.rodar() === 24, '(d) relógio muito atrasado (o lote no futuro): também não');
    const a = abrir(); a.lote(AGORA - H);
    a.em(AGORA + 30 * E); // relógio adiantado muito
    ok(a.pode() === false && a.rodar() === 20, '(d) relógio adiantado muito: o lote passou do escalão 3, não dá nada');
    const m = abrir(); m.lote(AGORA - H);
    for (let k = 0; k < 10; k++) { m.em(AGORA - H + k * (E / 2) + 10); m.rodar(); }
    ok(m.ev('state.gotas') === 36, '(d) a tocar sempre de meio em meio escalão: no máximo 4 rotações (+16)');
    ok(g.ev('caveRodarEstado({ adega: { lote: { iniciadoEm: ' + (AGORA + 5 * E) + ' }, cooldowns: {} } }, ' + AGORA + ').escalao') === 0, '(d) um lote «no futuro» conta como começado agora (escalão 0, nunca negativo)');
    const f = abrir(); f.lote(AGORA + 2 * H); f.rodar(); // o lote veio de um aparelho com o relógio adiantado
    f.em(AGORA + 3 * H);
    ok(f.pode() === false && f.rodar() === 24, '(d) um lote gravado no futuro: rodar agora e outra vez quando o relógio lá chega não dá duas no mesmo escalão');
    const v = abrir(); v.lote(AGORA - H); v.rodar();
    v.em(AGORA - H + E + 10); v.ev('state.adega.cooldowns.rodar = ' + (AGORA + 50 * E));
    ok(v.pode() === false, '(d) uma rotação gravada muito à frente (de outro aparelho com o relógio errado) conta como agora: não dá extra');
  }

  // ---------------------------------------------------------------- (e) modo de teste
  {
    ['?dias=3', '?visita=valentim_4'].forEach(function (q) {
      const g = abrir({ search: q }); g.lote(AGORA - H);
      const e = g.ev('JSON.stringify(state)');
      ok(!!g.botao(), '(e) ' + q + ': o botão aparece');
      g.rodar();
      ok(g.ev('JSON.stringify(state)') === e && g.ev('SAVES') === 0 && g.ev('__dialogo') === 'Modo de teste: rodar não grava nem dá Gotas.', '(e) ' + q + ': rodar não grava nem paga');
    });
  }

  // ---------------------------------------------------------------- (f) toque duplo
  {
    const g = abrir(); g.lote(AGORA - H);
    g.ev('caveRodarClique(); caveRodarClique();');
    ok(g.ev('state.gotas') === 24 && g.ev('SAVES') === 1, '(f) toque duplo: paga uma só vez');
    g.ev('caveRodarOcupado = true; caveRodarClique(); caveRodarOcupado = false;');
    ok(g.ev('state.gotas') === 24, '(f) a meio de um toque, outro toque não faz nada');
  }

  // ---------------------------------------------------------------- (g) save antigo e nuvem
  {
    const g = abrir();
    g.ev('state = mergeDeep(defaultState(), { gotas: 5, adega: { lote: { iniciadoEm: ' + (AGORA - H) + ' }, cooldowns: { prensar: 1 }, historico: [] } });');
    ok(g.ev('"rodar" in state.adega.cooldowns') === false && g.pode() === true && g.rodar() === 9, '(g) save antigo sem a chave «rodar»: pode rodar');
    const guardado = JSON.parse(g.ev('JSON.stringify(state)'));
    g.cx.__g = guardado;
    ok(g.ev('mergeDeep(defaultState(), __g).adega.cooldowns.rodar') === AGORA, '(g) mergeDeep (arranque e nuvem: o estado inteiro) não perde a chave');
    ok(g.ev('(function () { state = mergeDeep(defaultState(), __g); return caveRodarEstado(state, Date.now()).motivo; })()') === 'ja_rodou', '(g) depois de reabrir, continua a saber que já rodou neste escalão');
    const src = fontes['garrafa.js'];
    ok(!/state\.adega\.rodar\b|lote\.rodou|lote\.rotacoes/.test(src), '(g) sem campo novo no estado (só a chave «rodar» em cooldowns)');
    let rebentou = false;
    try { ['state.adega.cooldowns = null', 'state.adega.cooldowns = "x"', 'state.adega.lote = { iniciadoEm: "x" }', 'state.adega.lote = 3'].forEach(function (x) { const s = abrir(); s.lote(AGORA); s.ev(x); s.ev('caveRodarEstado(state, Date.now()); renderAdega(); caveRodarClique();'); }); } catch (e) { rebentou = String(e); }
    ok(rebentou === false, '(g) estados estranhos não rebentam ' + (rebentou || ''));
  }

  // ---------------------------------------------------------------- (h) não mexe em mais nada
  {
    const g = abrir(); g.lote(AGORA - 2 * E - H);
    const antes = g.json('[state.adega.lote, state.reputacao, state.garrafas, state.uvas, state.adega.historico, state.adega.cooldowns.prensar, diasDescansadosNaCave()]');
    g.rodar();
    ok(J(g.json('[state.adega.lote, state.reputacao, state.garrafas, state.uvas, state.adega.historico, state.adega.cooldowns.prensar, diasDescansadosNaCave()]')) === J(antes), '(h) não mexe no lote, no descanso, na Reputação, nas garrafas, nas Uvas nem nos outros cooldowns');
    ok(g.ev('CAVE_RODAR_GOTAS') === 4 && g.ev('CAVE_RODAR_ULTIMO_ESCALAO') === 3 && g.ev('CAVE_ESCALAO_MS') === E, '(h) 4 Gotas, escalões 0 a 3, escalão de 9 h');
  }

  // ---------------------------------------------------------------- (i) textos
  {
    const g = abrir();
    const CH = ['adega.btnRodar', 'adega.rodarOk', 'adega.rodarJaRodou', 'adega.rodarMaximo', 'adega.rodarJaNaoPrecisa', 'adega.rodarTeste'];
    ['pt', 'en', 'es'].forEach(function (l) {
      CH.forEach(function (k) { const v = g.ev('TRANSLATIONS.' + l + '[' + J(k) + ']'); ok(typeof v === 'string' && v.length >= 3 && v.length <= 60 && !/Fygmo\s?2/i.test(v), '(i) ' + l + ': ' + k + ' curto: ' + J(v)); });
      ok(String(g.ev('TRANSLATIONS.' + l + '["adega.rodarOk"]')).indexOf('{n}') !== -1 && String(g.ev('TRANSLATIONS.' + l + '["adega.rodarJaRodou"]')).indexOf('{tempo}') !== -1, '(i) ' + l + ': os marcadores {n} e {tempo}');
      ok(g.ev('TRANSLATIONS.' + l + '["adega.btnRodar"]').length <= 20 && g.ev('TRANSLATIONS.' + l + '["adega.rodarJaNaoPrecisa"]').length <= 18, '(i) ' + l + ': o botão e o sufixo curtos (a fila que desliza não parte linha)');
    });
    ok(g.ev('TRANSLATIONS.pt["adega.btnRodar"]') === 'Rodar as garrafas' && g.ev('TRANSLATIONS.pt["adega.rodarOk"]') === 'Rodaste as garrafas. +{n} Gotas.', '(i) PT: «Rodar as garrafas» e «Rodaste as garrafas. +{n} Gotas.»');
    const I = LER('index.html');
    ok(/js\/garrafa\.js\?v=\d+/.test(I) && /\.pill-scroll \.btn-pill \{[^}]*white-space: nowrap/.test(I.replace(/\s+/g, ' ')), '(i) a fila que desliza continua sem partir linha (regra das PR 211 e 218)');
  }
  return falhas;
}

function mutar(f, de, para) {
  if (FONTES[f].indexOf(de) === -1) { console.log('FALHA: mutação impossível (texto não encontrado em ' + f + '): ' + de.slice(0, 70)); return null; }
  const c = Object.assign({}, FONTES); c[f] = FONTES[f].split(de).join(para); return c;
}
const falhas = suite(FONTES);
let impossiveis = 0;
const MUTACOES = [
  ['6 Gotas', 'garrafa.js', 'const CAVE_RODAR_GOTAS = 4;', 'const CAVE_RODAR_GOTAS = 6;'],
  ['5 rotações por lote', 'garrafa.js', 'const CAVE_RODAR_ULTIMO_ESCALAO = 3;', 'const CAVE_RODAR_ULTIMO_ESCALAO = 4;'],
  ['repete no mesmo escalão', 'garrafa.js', '  if (ultima !== null && ultima >= desde + escalao * CAVE_ESCALAO_MS) {', '  if (false) {'],
  ['só uma por lote', 'garrafa.js', '  if (ultima !== null && ultima >= desde + escalao * CAVE_ESCALAO_MS) {', '  if (ultima !== null && ultima >= desde) {'],
  ['o relógio atrasado dá extra', 'garrafa.js', '  const ultima = Number.isFinite(cd) ? Math.min(cd, agora) : null;', '  const ultima = Number.isFinite(cd) && cd <= agora ? cd : null;'],
  ['o lote no futuro conta do zero', 'garrafa.js', '  const desde = Math.min(inicio, agora);', '  const desde = inicio;'],
  ['sem máximo', 'garrafa.js', "  if (escalao > CAVE_RODAR_ULTIMO_ESCALAO) return { ok: false, motivo: 'maximo', escalao: escalao, msAteProximo: 0 };\n", ''],
  ['o botão sem lote', 'garrafa.js', "  if (p.motivo === 'sem_lote') return '';\n", ''],
  ['o botão nunca se apaga', 'garrafa.js', "  return botaoAdega('rodar', 'adega.btnRodar', !p.ok, sufixo, 'caveRodarClique()');", "  return botaoAdega('rodar', 'adega.btnRodar', false, sufixo, 'caveRodarClique()');"],
  ['sem o porquê no botão', 'garrafa.js', "  else if (p.motivo === 'maximo') sufixo = ' (' + t('adega.rodarJaNaoPrecisa') + ')';\n", ''],
  ['modo de teste paga', 'garrafa.js', "    } else if (typeof visitaEmModoTeste === 'function' && visitaEmModoTeste()) {", '    } else if (false) {'],
  ['não grava a hora', 'garrafa.js', '      state.adega.cooldowns.rodar = agora;\n', ''],
  ['não grava', 'garrafa.js', '      tocarSomDaAcao(SOM_ACAO_ADEGA.fortificar);\n      saveState(state);\n', '      tocarSomDaAcao(SOM_ACAO_ADEGA.fortificar);\n'],
  ['sem som', 'garrafa.js', '      tocarSomDaAcao(SOM_ACAO_ADEGA.fortificar);\n', ''],
  ['não atualiza a barra', 'garrafa.js', '      saveState(state);\n      updateStatsDisplays();\n    }\n  } finally {\n    caveRodarOcupado = false;', '      saveState(state);\n    }\n  } finally {\n    caveRodarOcupado = false;'],
  ['o botão não entra na fila', 'garrafa.js', '    botoesHtml += caveRodarBotaoHtml();\n', ''],
  ['um texto em falta (EN)', 'i18n.js', "    'adega.rodarJaNaoPrecisa': 'no longer needed',\n", ''],
  ['o texto do botão comprido (ES)', 'i18n.js', "    'adega.btnRodar': 'Girar las botellas',", "    'adega.btnRodar': 'Girar todas las botellas de la Cava',"]
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
