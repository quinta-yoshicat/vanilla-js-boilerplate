#!/usr/bin/env node
// "Pôr a Mesa de Azeitão" (nível 14, bloco da oferta às visitas na Estrada): a regra pura despensaMesaVindima (js/despensa.js), com
// o campo do dia e o nível mínimo vindos da receita, os valores em ESTRADA_MESA_AZEITAO (js/estrada-dados.js), state.lagar.mesaAzeitaoDia
// (js/state.js) e a ligação ao cartão da Quinta (estradaMesaAzeitaoHtml e estradaMesaAzeitaoClique, js/estrada.js). Copiado de
// scripts/verificar-mesa-azeitao.js (a Mesa de Azeitão, que continua a ter o seu). Corre state.js, i18n.js, niveis.js (mais os níveis de
// dados/niveis.js), caderno.js, capitulos.js, estrada-dados.js, despensa.js, estrada.js, lagar.js e dados.js REAIS num ambiente simulado
// (vm), sem browser nem conta real.
//
// Uso: node scripts/verificar-mesa-azeitao.js
// DESPENSA_JS=caminho  corre sobre outra versão de js/despensa.js (provas negativas).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const DESPENSA_JS = process.env.DESPENSA_JS || path.join(RAIZ, 'js', 'despensa.js');
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }
const ler = function (f) { return fs.readFileSync(f, 'utf8'); };
const semComentarios = function (s) { return s.replace(/\/\/.*$/gm, ''); };

// Dia de hoje do ambiente (muda com g.ev('__dia = ...')). "puro" proíbe Math.random e Date.now depois de tudo carregado.
function abrir(guardadoInicial, puro) {
  const guardado = {};
  if (guardadoInicial) guardado.yoshicat_quinta_state_v2 = JSON.stringify(guardadoInicial);
  const gravacoes = [];
  const elementos = {};
  const el = function (id) { return elementos[id] || (elementos[id] = { innerHTML: '' }); };
  const sb = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(guardado, k) ? guardado[k] : null; },
      setItem: function (k, v) { gravacoes.push(k); guardado[k] = String(v); },
      removeItem: function (k) { delete guardado[k]; }
    },
    location: { search: '' },
    URLSearchParams: URLSearchParams,
    document: { querySelectorAll: function () { return []; }, getElementById: el, querySelector: function () { return { disabled: false }; }, addEventListener: function () {} },
    setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {}, Date: (function () { class D extends Date {} return D; })() // própria de cada ambiente: proibir Date.now num não afeta os outros
  };
  sb.window = sb;
  sb.Telegram = { WebApp: {} };
  const cx = vm.createContext(sb);
  vm.runInContext(ler(path.join(RAIZ, 'js', 'state.js')), cx, { filename: 'state.js' });
  vm.runInContext(ler(path.join(RAIZ, 'js', 'i18n.js')), cx, { filename: 'i18n.js' });
  vm.runInContext(`
    var __dia = '2026-10-09', __sons = [], __barra = 0;
    function mostrarFalas() {} function vibrar() {} function tocarSom(s) { __sons.push(s); } function updateStatsDisplays() { __barra++; }
    function localeAtual() { return 'pt-PT'; }
    function diaLisboaDeHoje() { return __dia; }
  `, cx);
  ['niveis.js', 'caderno.js', 'capitulos.js', 'estrada-dados.js'].forEach(function (f) { vm.runInContext(ler(path.join(RAIZ, 'js', f)), cx, { filename: f }); });
  vm.runInContext(ler(DESPENSA_JS), cx, { filename: 'despensa.js' });
  ['estrada.js', 'lagar.js', 'dados.js'].forEach(function (f) { vm.runInContext(ler(path.join(RAIZ, 'js', f)), cx, { filename: f }); });
  vm.runInContext(ler(path.join(RAIZ, 'dados', 'niveis.js')), cx, { filename: 'dados/niveis.js' });
  // Conta as chamadas a saveState (cada uma pode escrever mais do que uma chave no localStorage).
  vm.runInContext('var __saves = 0; var __saveReal = saveState; saveState = function (s) { __saves++; return __saveReal(s); };', cx);
  if (puro) vm.runInContext('Math.random = function () { throw new Error("Math.random proibido"); }; Date.now = function () { throw new Error("Date.now proibido"); };', cx);
  const g = { cx: cx, gravacoes: gravacoes, guardado: guardado };
  g.ev = function (c) { return vm.runInContext(c, cx); };
  g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
  g.estado = function () { return vm.runInContext('JSON.stringify(state)', cx); };
  g.html = function (lingua) { if (lingua) vm.runInContext('currentLang = ' + JSON.stringify(lingua), cx); return vm.runInContext('estradaMesaAzeitaoHtml()', cx); };
  return g;
}

const BENS = ['torta_azeitao', 'queijo_azeitao', 'ervas_arrabida'];
const BENS_VINDIMA = ['queijo_azeitao', 'sal_sado', 'mel_sesimbra']; // o queijo de Azeitão é o único bem comum às duas mesas
const BENS_SADO = ['choco_sado', 'ostras_sado', 'peixe_livramento'];
const TODOS = BENS.concat(BENS_VINDIMA, BENS_SADO).filter(function (b, i, a) { return a.indexOf(b) === i; });
const RECEITA = 'estradaMesaAzeitaoReceita()';
// O nível 14 vem de dados/niveis.js: 6500 de Reputação (um a menos é o nível 13). O nível 16 (Mesa de Azeitão): 8650.
const REP14 = 6500;
const REP16 = 8650;
const cheia = function (n, rep, extra) {
  const r = {}; TODOS.forEach(function (b) { r[b] = n; });
  const p = {}; TODOS.forEach(function (b) { p[b] = '2026-10-01'; });
  return Object.assign({ reputacao: rep === undefined ? REP14 : rep, uvas: 100, ultimaGravacaoEm: 1, acesso: { jogadorAntigo: false, introMostrada: true }, despensa: { recebidos: r, entregues: {}, primeiraTroca: p, hoje: { dia: null, feitas: {} } } }, extra || {});
};
const mesa = function (g, dia, receita) { return g.json('despensaMesaVindima(state, ' + JSON.stringify(dia) + ', ' + (receita || RECEITA) + ')'); };
const cap7 = "capituloEstaCumprido(CAPITULOS_CONFIG.filter(function (c) { return c.id === 'cap7'; })[0])";

// 1. Os valores: torta, queijo de Azeitão e ervas da Arrábida (pelos ids), +13, nível 14, o campo e a imagem pedida.
{
  const g = abrir(cheia(1));
  ok(JSON.stringify(g.json('ESTRADA_MESA_AZEITAO.bens')) === JSON.stringify(BENS.map(function (b) { return { bem: b, n: 1 }; })), 'a mesa gasta 1 torta de Azeitão, 1 queijo de Azeitão e 1 ervas da Arrábida');
  ok(g.ev('ESTRADA_MESA_AZEITAO.reputacao') === 13, '+13 de Reputação');
  ok(g.ev('ESTRADA_MESA_AZEITAO.nivelMinimo') === 14, 'a partir do nível 14');
  ok(g.ev('ESTRADA_MESA_AZEITAO.campo') === 'mesaAzeitaoDia', 'o dia fica em state.lagar.mesaAzeitaoDia');
  ok(g.ev('ESTRADA_MESA_AZEITAO.imagem') === 'assets/ecras/mesa_azeitao.jpg', 'imagem da ação');
  ok(g.ev('NIVEIS_CONFIG[13].min') === REP14 && g.ev('nivelPelaReputacao(' + REP14 + ')') === 14 && g.ev('nivelPelaReputacao(' + (REP14 - 1) + ')') === 13, 'premissa: 6500 de Reputação é o nível 14');
  ok(g.ev("ESTRADA_VIZINHOS.filter(function (v) { return v.id === 'dona_natalia'; })[0].nivelMinimo") === 14, 'o nível 14 é a chegada da Dona Natália (a torta de Azeitão)');
  ok(g.ev('ESTRADA_MESA_AZEITAO.bens.every(function (b) { return despensaBemExiste(b.bem); })') === true, 'os bens da mesa existem em ESTRADA_BENS');
  ok(JSON.stringify(g.json('ESTRADA_MESA_AZEITAO.bens.filter(function (b) { return LAGAR_CONFIG.mesa.bens.some(function (v) { return v.bem === b.bem; }); }).map(function (b) { return b.bem; })')) === '["queijo_azeitao"]', 'só o queijo de Azeitão é comum à mesa da vindima (cada mesa gasta o seu)');
  ok(!g.ev('ESTRADA_MESA_AZEITAO.bens.some(function (b) { return ESTRADA_MESA_SADO.bens.some(function (v) { return v.bem === b.bem; }); })'), 'nenhum bem é da Mesa do Sado');
  ok(g.ev('ESTRADA_MESA_SADO.reputacao') === 15 && g.ev('ESTRADA_MESA_SADO.nivelMinimo') === 16 && g.ev('ESTRADA_MESA_SADO.campo') === 'mesaSadoDia', 'a Mesa do Sado não mudou (+15, nível 16, mesaSadoDia)');
  ok(g.ev('LAGAR_CONFIG.mesa.reputacao') === 12 && JSON.stringify(g.json('LAGAR_CONFIG.mesa.bens')) === JSON.stringify(BENS_VINDIMA.map(function (b) { return { bem: b, n: 1 }; })), 'a mesa da vindima não mudou (+12; queijo, sal e mel)');
  const f = path.join(RAIZ, 'assets', 'ecras', 'mesa_azeitao.jpg');
  ok(fs.existsSync(f), 'existe assets/ecras/mesa_azeitao.jpg');
  if (fs.existsSync(f)) {
    const b = fs.readFileSync(f);
    // JPEG: procura o marcador SOF (0xFFC0 a 0xFFC2) para ler a altura e a largura.
    let i = 2, w = 0, h = 0;
    while (i < b.length) { if (b[i] !== 0xff) { i++; continue; } const m = b[i + 1]; if (m >= 0xc0 && m <= 0xc2) { h = b.readUInt16BE(i + 5); w = b.readUInt16BE(i + 7); break; } i += 2 + b.readUInt16BE(i + 2); }
    ok(b[0] === 0xff && b[1] === 0xd8 && w === 720 && h === 540 && w * 3 === h * 4, 'mesa_azeitao.jpg é um JPEG 720 px de largura, 4:3 (720x540; tem ' + w + 'x' + h + ')');
    ok(b.length <= 250 * 1024, 'mesa_azeitao.jpg não devia pesar mais de 250 KB (pesa ' + b.length + ')');
  }
  ok(fs.existsSync(path.join(RAIZ, 'imagens_JOGO_TELEGRAM', '1795823023108.jpg')), 'o original imagens_JOGO_TELEGRAM/1795823023108.jpg continua no sítio');
}

// 2. Despensa cheia, nível 14: gasta 1 de cada (só "entregues"), +13, marca mesaAzeitaoDia, mais nada muda; "recebidos" e o capítulo 7 ficam.
{
  const g = abrir(cheia(2), true);
  const antes = JSON.parse(g.estado());
  const recebidosAntes = JSON.stringify(g.json('state.despensa.recebidos'));
  const r = mesa(g, '2026-10-09');
  ok(r.ok === true && r.motivo === null && r.reputacaoGanha === 13 && r.faltam.length === 0 && r.gastos.length === 3, 'mesa: ' + JSON.stringify(r));
  ok(JSON.stringify(g.json('state.despensa.recebidos')) === recebidosAntes, '"recebidos" nunca muda');
  const entregues = g.json('state.despensa.entregues');
  ok(BENS.every(function (b) { return entregues[b] === 1; }) && Object.keys(entregues).length === 3, '"entregues" sobe 1 de cada um dos 3 bens de Azeitão');
  ok(BENS.every(function (b) { return g.ev("despensaQuantos(state, '" + b + "')") === 1; }), 'ficam 1 de cada na Despensa');
  ok(['sal_sado', 'mel_sesimbra'].every(function (b) { return g.ev("despensaQuantos(state, '" + b + "')") === 2; }), 'o sal e o mel da mesa da vindima não se tocam (o queijo de Azeitão é também da Mesa de Azeitão: gasta-se 1)');
  ok(BENS_SADO.every(function (b) { return g.json('state.despensa.recebidos')[b] === 2 && g.json('state.despensa.entregues')[b] === undefined; }), 'os bens da Mesa do Sado (que ainda nem estão à venda no nível 14) não se tocam');
  ok(g.ev('state.reputacao') === REP14 + 13 && g.ev('state.lagar.mesaAzeitaoDia') === '2026-10-09' && g.ev('state.lagar.mesaDia') === null && g.ev('state.lagar.mesaSadoDia') === null, '+13 de Reputação, mesaAzeitaoDia marcado e mesaDia (a da vindima) e mesaSadoDia intactos');
  const depois = JSON.parse(g.estado());
  const esperado = JSON.parse(JSON.stringify(antes));
  esperado.despensa.entregues = { torta_azeitao: 1, queijo_azeitao: 1, ervas_arrabida: 1 };
  esperado.reputacao = REP14 + 13; esperado.lagar = { ultimoDia: null, dias: 0, mesaDia: null, mesaSadoDia: null, mesaAzeitaoDia: '2026-10-09', assaltoDia: null };
  ok(JSON.stringify(depois) === JSON.stringify(esperado), 'só mudam entregues, Reputação e lagar.mesaAzeitaoDia (nem uvas, nem ultimoDia, nem dias, nem mesaDia, nem mesaSadoDia, nem primeiraTroca, nem hoje)');
  // Uma vez por dia: a 2.ª no mesmo dia é recusada sem alterar nada, mesmo com stock.
  const a = g.estado();
  const r2 = mesa(g, '2026-10-09');
  ok(!r2.ok && r2.motivo === 'ja_hoje' && g.estado() === a, 'mesmo dia: recusado (ja_hoje) sem alterar nada');
  // Relógio atrás: recusado.
  const r3 = mesa(g, '2026-10-08');
  ok(!r3.ok && r3.motivo === 'dia_anterior' && g.estado() === a, 'dia anterior: recusado sem alterar nada');
  // Dia seguinte, com o último de cada: gasta tudo, a Despensa fica a 0 (nos 3 de Azeitão), e o capítulo 7 (queijo, sal e mel; só lê "recebidos") fica como estava.
  const cap7Antes = g.ev(cap7);
  const r4 = mesa(g, '2026-10-10');
  ok(r4.ok && BENS.every(function (b) { return g.ev("despensaQuantos(state, '" + b + "')") === 0; }), 'dia seguinte gasta o último de cada: Despensa a 0');
  ok(JSON.stringify(g.json('state.despensa.recebidos')) === recebidosAntes && g.ev(cap7) === cap7Antes, 'o capítulo 7 não muda com a Despensa a 0');
  // Sem stock no dia seguinte: recusa e diz que faltam os 3.
  const r5 = mesa(g, '2026-10-11');
  ok(!r5.ok && r5.motivo === 'faltam_bens' && JSON.stringify(r5.faltam) === JSON.stringify(BENS), 'Despensa vazia: faltam os 3 bens');
}

// 3. Bens em falta: diz quais, não altera nada (nem repara o estado).
{
  BENS.forEach(function (falta) {
    const g = abrir(cheia(1));
    g.ev("state.despensa.entregues." + falta + " = 1"); // fica com 0 desse bem
    const antes = g.estado();
    const r = mesa(g, '2026-10-09');
    ok(!r.ok && r.motivo === 'faltam_bens' && JSON.stringify(r.faltam) === JSON.stringify([falta]) && r.reputacaoGanha === 0, 'falta só ' + falta + ': ' + JSON.stringify(r));
    ok(g.estado() === antes, 'faltar ' + falta + ' não altera nada (nem os outros bens)');
    const e = g.json('estradaMesaAzeitaoEstado(state, "2026-10-09")');
    ok(!e.ok && e.motivo === 'faltam_bens' && JSON.stringify(e.faltam) === JSON.stringify([falta]), 'o cartão (estradaMesaAzeitaoEstado) também diz que falta ' + falta);
  });
  const g = abrir(cheia(1));
  g.ev('state.despensa = null');
  const antes = g.estado();
  const r = mesa(g, '2026-10-09');
  ok(!r.ok && r.motivo === 'faltam_bens' && r.faltam.length === 3 && g.estado() === antes, 'state.despensa null: faltam os 3, sem rebentar e sem alterar nada');
  // O cartão com tudo certo.
  const h = abrir(cheia(1));
  ok(h.json('estradaMesaAzeitaoEstado(state, "2026-10-09")').ok === true, 'estradaMesaAzeitaoEstado: ok com a Despensa cheia');
  mesa(h, '2026-10-09');
  ok(h.json('estradaMesaAzeitaoEstado(state, "2026-10-09")').motivo === 'ja_hoje', 'estradaMesaAzeitaoEstado: ja_hoje depois de pôr a mesa');
  ok(h.json('estradaMesaAzeitaoEstado(state, "2026-10-08")').motivo === 'dia_anterior', 'estradaMesaAzeitaoEstado: dia_anterior com o relógio atrás');
}

// 4. A porta do nível 14: abaixo dele (até um jogador antigo) não há mesa, não se gasta nada e o cartão não a mostra.
{
  [['nível 13 (6499)', REP14 - 1, false], ['nível 13 de jogador antigo', REP14 - 1, true], ['nível 1', 0, false]].forEach(function (c) {
    const g = abrir(cheia(1, c[1], { acesso: { jogadorAntigo: c[2], introMostrada: true } }));
    const antes = g.estado();
    const r = mesa(g, '2026-10-09');
    ok(!r.ok && r.motivo === 'nivel_insuficiente' && r.reputacaoGanha === 0 && r.gastos.length === 0 && g.estado() === antes, c[0] + ': recusada (nivel_insuficiente) sem alterar nada: ' + JSON.stringify(r));
    ok(g.json('estradaMesaAzeitaoEstado(state, "2026-10-09")').motivo === 'nivel_insuficiente', c[0] + ': o cartão também diz nivel_insuficiente');
    ok(g.html() === '', c[0] + ': o cartão não mostra a mesa');
  });
  const g = abrir(cheia(1, REP14));
  ok(mesa(g, '2026-10-09').ok === true, 'nível 14 (6500): pode');
  ok(g.html().indexOf('mesa-azeitao') !== -1, 'nível 14: o cartão mostra a mesa');
  const h = abrir(cheia(1, REP14 + 5000));
  ok(mesa(h, '2026-10-09').ok === true, 'níveis acima do 14: também pode');
  // O nível vem antes de tudo o resto da validação do dia e dos bens.
  const n = abrir(cheia(0, 0));
  ok(mesa(n, '2026-10-09').motivo === 'nivel_insuficiente', 'sem nível e sem bens: diz o nível primeiro');
  // A mesa da vindima não tem porta de nível própria: continua a valer sem nivelMinimo na receita (a porta dela é a do ecrã).
  const v = abrir(cheia(1, 0));
  ok(v.json('despensaMesaVindima(state, "2026-10-09", { bens: [{ bem: "queijo_azeitao", n: 1 }], reputacao: 1 })').motivo !== 'nivel_insuficiente', 'uma receita sem nivelMinimo não tem porta de nível');
}

// 5. Independente da mesa da vindima, da Mesa do Sado, do "Pisar as uvas" e do assalto: cada tarefa tem o seu dia, nos dois sentidos.
{
  const SADO = 'estradaMesaSadoReceita()';
  const g = abrir(cheia(3, REP16));
  const vindima = function (x, dia) { return x.json('despensaMesaVindima(state, ' + JSON.stringify(dia) + ', { bens: LAGAR_CONFIG.mesa.bens, reputacao: LAGAR_CONFIG.mesa.reputacao })'); };
  ok(vindima(g, '2026-10-09').ok === true, 'a mesa da vindima, hoje');
  ok(mesa(g, '2026-10-09').ok === true, 'a Mesa de Azeitão do mesmo dia não é bloqueada por já ter posto a mesa da vindima');
  ok(mesa(g, '2026-10-09', SADO).ok === true, 'a Mesa do Sado do mesmo dia também se põe');
  ok(g.ev('state.lagar.mesaDia') === '2026-10-09' && g.ev('state.lagar.mesaSadoDia') === '2026-10-09' && g.ev('state.lagar.mesaAzeitaoDia') === '2026-10-09', 'cada mesa guarda o seu dia');
  ok(g.ev('state.reputacao') === REP16 + 12 + 13 + 15, 'as três somam: +12, +13 e +15');
  ok(g.ev("despensaQuantos(state, 'queijo_azeitao')") === 1, 'o queijo de Azeitão serve às duas mesas (3 - 1 - 1 = 1)');
  const h = abrir(cheia(3, REP16));
  ok(mesa(h, '2026-10-09').ok === true && vindima(h, '2026-10-09').ok === true && mesa(h, '2026-10-09', SADO).ok === true, 'as outras mesas não são bloqueadas por já ter posto a de Azeitão');
  ok(h.json("lagarPisar(state, '2026-10-09')").ok === true && h.ev('state.lagar.dias') === 1, 'pisar também não é bloqueado');
  ok(h.ev('state.lagar.dias') === 1, 'pôr a Mesa de Azeitão não conta como dia de lagar (o cap8 só conta pisar)');
  // Se o queijo só chega para uma mesa, a segunda diz que falta.
  const q = abrir(cheia(1, REP16));
  ok(mesa(q, '2026-10-09').ok === true && vindima(q, '2026-10-09').motivo === 'faltam_bens', 'com 1 queijo só dá para uma das duas mesas: a outra diz que falta');
  // O assalto dos porcos é só da mesa da vindima: a Mesa de Azeitão não o abre.
  const a = abrir(cheia(3));
  mesa(a, '2026-10-09');
  ok(a.json('lagarAssaltoEstado(state, "2026-10-09")').motivo === 'sem_mesa', 'pôr a Mesa de Azeitão não abre o assalto dos porcos (sem_mesa)');
  ok(a.ev('state.lagar.assaltoDia') === null, 'assaltoDia fica como estava');
}

// 6. Receita e entradas inválidas: recusa sem alterar nada. O campo só pode ser um dos três das mesas.
{
  const g = abrir(cheia(2));
  const a = g.estado();
  const B = "bens: [{ bem: 'torta_azeitao', n: 1 }]";
  [
    ['null', 'null'], ['vazia', '{ bens: [], reputacao: 13 }'], ['n = 0', "{ bens: [{ bem: 'torta_azeitao', n: 0 }], reputacao: 13 }"],
    ['bem que não existe', "{ bens: [{ bem: 'ouro', n: 1 }], reputacao: 13 }"],
    ['bem repetido', "{ bens: [{ bem: 'torta_azeitao', n: 1 }, { bem: 'torta_azeitao', n: 1 }], reputacao: 13 }"],
    ['Reputação negativa', '{ ' + B + ', reputacao: -1 }'],
    ['campo assaltoDia', '{ ' + B + ", reputacao: 13, campo: 'assaltoDia' }"], ['campo ultimoDia', '{ ' + B + ", reputacao: 13, campo: 'ultimoDia' }"],
    ['campo reputacao', '{ ' + B + ", reputacao: 13, campo: 'reputacao' }"], ['campo __proto__', '{ ' + B + ", reputacao: 13, campo: '__proto__' }"],
    ['campo número', '{ ' + B + ', reputacao: 13, campo: 5 }'], ['campo null', '{ ' + B + ', reputacao: 13, campo: null }'],
    ['nivelMinimo 0', '{ ' + B + ', reputacao: 13, nivelMinimo: 0 }'], ['nivelMinimo fração', '{ ' + B + ', reputacao: 13, nivelMinimo: 1.5 }'],
    ['nivelMinimo texto', '{ ' + B + ", reputacao: 13, nivelMinimo: '14' }"], ['nivelMinimo null', '{ ' + B + ', reputacao: 13, nivelMinimo: null }']
  ].forEach(function (c) {
    const r = mesa(g, '2026-10-09', c[1]);
    ok(!r.ok && r.motivo === 'receita_invalida' && g.estado() === a, 'receita inválida (' + c[0] + '): ' + JSON.stringify(r));
  });
  ok(g.json("despensaMesaVindima(null, '2026-10-09', " + RECEITA + ')').motivo === 'estado_invalido', 'estado null');
  ok(g.json("despensaMesaVindima(state, 'ontem', " + RECEITA + ')').motivo === 'dia_invalido' && g.json('despensaMesaVindima(state, 5, ' + RECEITA + ')').motivo === 'dia_invalido', 'dia inválido');
  ok(g.estado() === a, 'nenhuma recusa alterou o estado');
  // Sem campo na receita: vale mesaDia (a da vindima), como sempre valeu.
  const h = abrir(cheia(2));
  ok(h.json("despensaMesaVindima(state, '2026-10-09', { " + B + ', reputacao: 3 })').ok === true && h.ev('state.lagar.mesaDia') === '2026-10-09' && h.ev('state.lagar.mesaAzeitaoDia') === null, 'receita sem campo: usa mesaDia e deixa mesaAzeitaoDia (e mesaSadoDia)');
  // Receita com 2 unidades de um bem e só 1 em stock: falta.
  const k = abrir(cheia(1));
  const antes = k.estado();
  const r = mesa(k, '2026-10-09', "{ bens: [{ bem: 'torta_azeitao', n: 2 }, { bem: 'queijo_azeitao', n: 1 }], reputacao: 13, campo: 'mesaAzeitaoDia', nivelMinimo: 14 }");
  ok(!r.ok && r.motivo === 'faltam_bens' && JSON.stringify(r.faltam) === JSON.stringify(['torta_azeitao']) && k.estado() === antes, 'n = 2 com 1 em stock: falta só a torta e nada se gasta (nem o queijo)');
  // despensaMesaDia só lê os três campos das mesas.
  const d = abrir(cheia(1, REP14, { lagar: { ultimoDia: '2026-10-05', dias: 2, mesaDia: '2026-10-06', mesaSadoDia: '2026-10-09', mesaAzeitaoDia: '2026-10-07', assaltoDia: '2026-10-08' } }));
  ok(d.ev('despensaMesaDia(state)') === '2026-10-06' && d.ev("despensaMesaDia(state, 'mesaDia')") === '2026-10-06' && d.ev("despensaMesaDia(state, 'mesaAzeitaoDia')") === '2026-10-07' && d.ev("despensaMesaDia(state, 'mesaSadoDia')") === '2026-10-09', 'despensaMesaDia: sem campo é a da vindima; com campo é a desse campo');
  ok(d.ev("despensaMesaDia(state, 'assaltoDia')") === null && d.ev("despensaMesaDia(state, 'ultimoDia')") === null && d.ev("despensaMesaDia(state, '__proto__')") === null, 'despensaMesaDia: outros campos devolvem null');
}

// 7. state.lagar sem o campo / estranho: não rebenta e não perde nada. Save antigo e nuvem: mesaAzeitaoDia por omissão null.
{
  const g = abrir(cheia(1));
  g.ev('state.lagar = null');
  ok(mesa(g, '2026-10-09').ok === true && JSON.stringify(g.json('state.lagar')) === '{"ultimoDia":null,"dias":0,"mesaDia":null,"mesaSadoDia":null,"mesaAzeitaoDia":"2026-10-09","assaltoDia":null}', 'state.lagar null: recria-se com mesaAzeitaoDia');
  const h = abrir(cheia(1));
  h.ev("state.lagar = { ultimoDia: '2026-10-05', dias: 2, mesaDia: '2026-10-06' }"); // save da mesa da vindima, sem mesaSadoDia nem mesaAzeitaoDia
  ok(mesa(h, '2026-10-09').ok === true && JSON.stringify(h.json('state.lagar')) === '{"ultimoDia":"2026-10-05","dias":2,"mesaDia":"2026-10-06","mesaAzeitaoDia":"2026-10-09"}', 'lagar sem mesaAzeitaoDia: mantém o resto e acrescenta-o');
  const velho = abrir({ reputacao: 1600, uvas: 5, lagar: { ultimoDia: '2026-10-05', dias: 2, mesaDia: '2026-10-06' } });
  ok(JSON.stringify(velho.json('state.lagar')) === '{"ultimoDia":"2026-10-05","dias":2,"mesaDia":"2026-10-06","mesaSadoDia":null,"mesaAzeitaoDia":null,"assaltoDia":null}' && velho.ev('state.reputacao') === 1600 && velho.ev('state.uvas') === 5, 'save da mesa da vindima ganha mesaAzeitaoDia null e o resto fica');
  ok(JSON.stringify(velho.json('mergeDeep(defaultState(), { reputacao: 5 }).lagar')) === '{"ultimoDia":null,"dias":0,"mesaDia":null,"mesaSadoDia":null,"mesaAzeitaoDia":null,"assaltoDia":null}', 'estado da nuvem sem lagar ganha o valor por omissão');
  ok(JSON.stringify(velho.json('mergeDeep(defaultState(), { lagar: { mesaAzeitaoDia: "2026-10-01" } }).lagar')) === '{"ultimoDia":null,"dias":0,"mesaDia":null,"mesaSadoDia":null,"mesaAzeitaoDia":"2026-10-01","assaltoDia":null}', 'estado da nuvem com mesaAzeitaoDia mantém-no');
  ok(JSON.stringify(abrir().json('state.lagar')) === '{"ultimoDia":null,"dias":0,"mesaDia":null,"mesaSadoDia":null,"mesaAzeitaoDia":null,"assaltoDia":null}', 'jogo novo: mesaAzeitaoDia null');
  // lagarEstado repara um valor estranho; um valor estranho em mesaAzeitaoDia conta como nunca.
  const e = abrir(cheia(1)); e.ev("state.lagar.mesaAzeitaoDia = 12345");
  ok(mesa(e, '2026-10-09').ok === true, 'mesaAzeitaoDia inválido conta como nunca');
  const f = abrir(cheia(1)); f.ev("state.lagar.mesaAzeitaoDia = 'ontem'; lagarEstado(state)");
  ok(f.ev('state.lagar.mesaAzeitaoDia') === null, 'lagarEstado repara mesaAzeitaoDia inválido (null)');
}

// 8. Textos nas 3 línguas, no estilo da mesa da vindima, e as palavras que não podem aparecer.
{
  const g = abrir(cheia(1));
  const SUF = ['Btn', 'Pedido', 'Desc', 'Ok', 'Falta', 'Onde', 'JaHoje', 'Relogio', 'Alt'];
  const chaves = SUF.map(function (s) { return 'estrada.mesaAzeitao' + s; });
  ['pt', 'en', 'es'].forEach(function (l) {
    chaves.forEach(function (k) { const v = g.ev('TRANSLATIONS.' + l + '["' + k + '"]'); ok(typeof v === 'string' && v.trim() !== '', 'falta ' + k + ' em ' + l); });
  });
  const PT = { 'estrada.mesaAzeitaoBtn': 'Pôr a Mesa de Azeitão', 'estrada.mesaAzeitaoPedido': '1 torta de Azeitão, 1 queijo de Azeitão e 1 molho de ervas da Arrábida',
    'estrada.mesaAzeitaoJaHoje': 'Já puseste a Mesa de Azeitão hoje. Volta amanhã.', 'estrada.mesaAzeitaoFalta': 'Falta na Despensa: {bens}.' };
  Object.keys(PT).forEach(function (k) { ok(g.ev('TRANSLATIONS.pt["' + k + '"]') === PT[k], 'texto PT de ' + k); });
  [['estrada.mesaAzeitaoDesc', ['{pedido}', '{rep}']], ['estrada.mesaAzeitaoOk', ['{rep}']], ['estrada.mesaAzeitaoFalta', ['{bens}']]].forEach(function (c) {
    ['pt', 'en', 'es'].forEach(function (l) { c[1].forEach(function (m) { ok(g.ev('TRANSLATIONS.' + l + '["' + c[0] + '"]').indexOf(m) !== -1, c[0] + ' sem ' + m + ' em ' + l); }); });
  });
  // Os mesmos marcadores que a mesa da vindima, no mesmo estilo (a descrição diz o pedido, a Reputação e "uma vez por dia").
  ok(/uma vez por dia/i.test(g.ev('TRANSLATIONS.pt["estrada.mesaAzeitaoDesc"]')) && /once a day/i.test(g.ev('TRANSLATIONS.en["estrada.mesaAzeitaoDesc"]')) && /una vez al d/i.test(g.ev('TRANSLATIONS.es["estrada.mesaAzeitaoDesc"]')), 'a descrição diz "uma vez por dia" nas 3 línguas');
  ok(/Fygmo II/.test(g.ev('TRANSLATIONS.pt["estrada.mesaAzeitaoOk"]')) && /Fygmo II/.test(g.ev('TRANSLATIONS.en["estrada.mesaAzeitaoOk"]')) && /Fygmo II/.test(g.ev('TRANSLATIONS.es["estrada.mesaAzeitaoOk"]')), 'o agradecimento fala do Fygmo II nas 3 línguas');
  ok(/el Fygmo II/.test(g.ev('TRANSLATIONS.es["estrada.mesaAzeitaoOk"]')) && /el YoshiCat/.test(g.ev('TRANSLATIONS.es["estrada.mesaAzeitaoAlt"]')) && /el Fygmo II/.test(g.ev('TRANSLATIONS.es["estrada.mesaAzeitaoAlt"]')), 'em ES: «el Fygmo II» e «el YoshiCat»');
  ['pt', 'en', 'es'].forEach(function (l) { ok(/YoshiCat/.test(g.ev('TRANSLATIONS.' + l + '["estrada.mesaAzeitaoAlt"]')) && /Fygmo II/.test(g.ev('TRANSLATIONS.' + l + '["estrada.mesaAzeitaoAlt"]')), 'o texto alternativo da foto fala do YoshiCat e do Fygmo II (' + l + ')'); });
  ['pt', 'en', 'es'].forEach(function (l) {
    chaves.forEach(function (k) {
      const v = g.ev('TRANSLATIONS.' + l + '["' + k + '"]');
      ok(!/Yoshi_Cat/.test(v), k + ' (' + l + '): no jogo escreve-se «YoshiCat», nunca «Yoshi_Cat»');
      ok(!/Fygmo 2/.test(v), k + ' (' + l + '): escreve-se «Fygmo II», nunca «Fygmo 2»');
      ok(!/\bMestre\b|\bbot\b|\bIA\b/i.test(v), k + ' (' + l + '): sem as palavras «Mestre», «bot» ou «IA»');
    });
  });
}

// 9. A ligação ao cartão da Quinta: só o clique põe e grava; o desenho só lê.
{
  const est = ler(path.join(RAIZ, 'js', 'estrada.js'));
  const src = semComentarios(est);
  const corpoDe = function (nome) { const m = new RegExp('function ' + nome + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}\\n').exec(src); return m ? m[0] : ''; };
  const clique = corpoDe('estradaMesaAzeitaoClique');
  ok(clique !== '', 'existe estradaMesaAzeitaoClique em js/estrada.js');
  ok((src.match(/despensaMesaVindima\(/g) || []).length === 2 && clique.indexOf('despensaMesaVindima(') !== -1 && corpoDe('estradaMesaSadoClique').indexOf('despensaMesaVindima(') !== -1, 'só os dois cliques (estradaMesaSadoClique e estradaMesaAzeitaoClique) chamam despensaMesaVindima');
  ok((clique.match(/saveState\(state\)/g) || []).length === 1 && clique.indexOf('updateStatsDisplays()') !== -1, 'o clique grava UMA vez e atualiza a barra de cima');
  ok(/if \(botao\) botao\.disabled = true;/.test(clique) && /estradaMesaAzeitaoOcupado/.test(clique), 'o clique apaga o botão e tem a guarda contra o clique duplo');
  ['estradaMesaAzeitaoReceita', 'estradaMesaAzeitaoEstado', 'estradaMesaAzeitaoTexto', 'estradaMesaAzeitaoHtml'].forEach(function (f) {
    ok(!/saveState|updateStatsDisplays|despensaMesaVindima|despensaRegistar|despensaEstado/.test(corpoDe(f)), f + ' só lê (não grava, não gasta, não atualiza a barra)');
  });
  ok(!/assalto|Assalto|lagarAssalto/.test(src), 'estrada.js não tem assalto dos porcos (esse é só do Lagar)');
  ok(/function estradaOfertaHtml\(\) \{\s*return estradaOfertaVisitaHtml\(\) \+ estradaMoinhoHtml\(\) \+ estradaMesaSadoHtml\(\) \+ estradaMesaAzeitaoHtml\(\);\s*\}/.test(src), 'a Mesa de Azeitão está no bloco da oferta (estradaOfertaHtml, a seguir ao Moinho de Maré e à Mesa do Sado)');
  ok(/definirFundo/.test(src) === false, 'a ação não troca o fundo do ecrã (a imagem vê-se no próprio bloco)');
  const vis = ler(path.join(RAIZ, 'js', 'visitas.js'));
  ok(/if \(!r\.visita\) \{ container\.innerHTML = ofertaBloco\(\) \+ encomendaBloco\(\); return; \}/.test(vis), 'js/visitas.js mostra o bloco também nos dias sem visita (a mesa não depende da visita)');
  const html = ler(path.join(RAIZ, 'index.html'));
  const css = (/\.mesa-azeitao-img \{([^}]*)\}/.exec(html) || [0, ''])[1];
  ok(/width:\s*100%/.test(css) && /height:\s*auto/.test(css) && !/object-fit|object-position|\b(max-)?height:\s*\d+px/.test(css), 'a foto mostra-se a 100% da largura e com altura automática (sem faixa de altura fixa nem object-fit que corte)');
  const desp = semComentarios(ler(DESPENSA_JS));
  const corpo = desp.slice(desp.indexOf('function despensaMesaVindima('));
  ok(!/Math\.random|Date\.now|new Date|saveState|localStorage/.test(corpo), 'despensaMesaVindima é pura (sem relógio, sorteio nem gravação)');
  ok(!/\.recebidos\s*(\[[^\]]*\])?\s*(=|\+=|-=|\+\+|--)(?!=)/.test(corpo.slice(0, corpo.indexOf('\n}\n') + 3)), 'despensaMesaVindima nunca escreve em recebidos');

  // Comportamento: desenha, clica e volta a desenhar, nas 3 línguas.
  const g = abrir(cheia(2), true);
  const estadoAntes = g.estado();
  const h1 = g.html('pt');
  ok(g.estado() === estadoAntes && g.ev('__saves') === 0, 'desenhar o cartão não altera o estado nem grava');
  ok(h1.indexOf('src="assets/ecras/mesa_azeitao.jpg"') !== -1 && /class="mesa-azeitao-img"/.test(h1), 'o cartão mostra a imagem nova');
  ok(h1.indexOf('Pôr a Mesa de Azeitão') !== -1 && h1.indexOf('1 torta de Azeitão, 1 queijo de Azeitão e 1 molho de ervas da Arrábida') !== -1 && h1.indexOf('+13 de Reputação') !== -1, 'o cartão diz o botão, o pedido e a Reputação (PT)');
  ok(h1.indexOf('estradaMesaAzeitaoClique()') !== -1 && !/disabled/.test(h1), 'com os bens e o nível, o botão está ativo');
  ok(g.html('en').indexOf('Set the Azeitão Table') !== -1 && g.html('es').indexOf('Poner la Mesa de Azeitão') !== -1, 'o botão diz-se em EN e em ES');
  g.html('pt');
  g.ev('estradaMesaAzeitaoClique()');
  ok(g.ev('state.reputacao') === REP14 + 13 && g.ev('state.lagar.mesaAzeitaoDia') === '2026-10-09', 'o clique pôs a mesa: +13 e o dia marcado');
  ok(g.ev('__saves') === 1, 'o clique gravou UMA vez (gravou ' + g.ev('__saves') + ')');
  ok(g.ev('__barra') === 1 && JSON.stringify(g.json('__sons')) === '["objetivoCumprido"]', 'atualizou a barra de cima e tocou o som uma vez');
  const h2 = g.html('pt');
  ok(h2.indexOf('A Mesa de Azeitão está posta') !== -1 && h2.indexOf('+13 de Reputação.') !== -1 && /disabled/.test(h2), 'logo a seguir: o agradecimento, com o botão apagado');
  ok(h2.indexOf('Já puseste') === -1, 'logo a seguir não repete "já puseste hoje"');
  g.ev('estradaMesaAzeitaoClique()');
  ok(g.ev('state.reputacao') === REP14 + 13 && g.ev('__saves') === 1, 'um 2.º clique no mesmo dia não paga nem grava');
  g.ev("estradaMesaAzeitaoResultado = null");
  ok(g.html('pt').indexOf('Já puseste a Mesa de Azeitão hoje. Volta amanhã.') !== -1, 'ao voltar (sem o resultado em memória): «já puseste hoje»');
  g.ev("__dia = '2026-10-10'");
  ok(!/disabled/.test(g.html('pt')) && g.html('pt').indexOf('Já puseste') === -1, 'no dia seguinte, com stock: o botão volta');
  // Falta de bens: diz quais e onde se obtêm.
  const f = abrir(cheia(1));
  f.ev("state.despensa.entregues.ervas_arrabida = 1");
  const hf = f.html('pt');
  ok(/disabled/.test(hf) && hf.indexOf('Falta na Despensa: Ervas da Arrábida.') !== -1 && hf.indexOf('Obtêm-se na Estrada, com os vizinhos.') !== -1, 'faltam as ervas: diz «Falta na Despensa: Ervas da Arrábida.» e onde se obtêm, com o botão apagado');
  ok(f.html('en').indexOf('Missing from the Pantry: Arrábida herbs.') !== -1 && f.html('es').indexOf('Falta en la Despensa: Hierbas de la Arrábida.') !== -1, 'a falta diz-se em EN e em ES');
  // O bloco inteiro: estradaOfertaHtml traz a mesa mesmo sem visita.
  const o = abrir(cheia(1));
  ok(o.ev('estradaOfertaHtml()').indexOf('mesa-azeitao') !== -1, 'estradaOfertaHtml traz a mesa (também sem a visita de hoje tocada)');
  const b = abrir(cheia(1, REP14 - 1));
  ok(b.ev('estradaOfertaHtml()').indexOf('mesa-azeitao') === -1, 'abaixo do nível 14, estradaOfertaHtml não traz a mesa');
}

// 10. Provas negativas: estragar a regra de propósito tem de fazer o teste falhar.
if (!process.env.DESPENSA_JS) {
  const real = ler(DESPENSA_JS);
  const mutantes = [
    ['a regra ignora o campo (usa sempre mesaDia)', "const campo = receita.campo === undefined ? 'mesaDia' : receita.campo;", "const campo = 'mesaDia';"],
    ['a regra ignora o nível mínimo', 'if (!despensaMesaNivelOk(estado, receita)) return recusa(\'nivel_insuficiente\');', ''],
    ['aceita qualquer campo', "if (receita.campo !== undefined && DESPENSA_MESA_CAMPOS.indexOf(receita.campo) === -1) return false;", ''],
    ['a mesa não gasta os bens', 'const r = despensaRegistarEntrega(estado, b.bem, b.n);\n    if (!r.ok) return recusa(\'faltam_bens\', [b.bem]);', 'const r = { ok: true };'],
    ['a mesa dá Reputação a mais', 'estado.reputacao = (typeof estado.reputacao === \'number\' && Number.isFinite(estado.reputacao) ? estado.reputacao : 0) + receita.reputacao;', 'estado.reputacao = (typeof estado.reputacao === \'number\' && Number.isFinite(estado.reputacao) ? estado.reputacao : 0) + receita.reputacao + 1;'],
    ['não marca o dia', 'estado.lagar[campo] = dia;', ''],
    ['deixa pôr duas vezes no mesmo dia', "if (ultima !== null && dia === ultima) return recusa('ja_hoje');", '']
  ];
  const os = require('os');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mesa-azeitao-'));
  mutantes.forEach(function (m, i) {
    if (real.indexOf(m[1]) === -1) { ok(false, 'mutante "' + m[0] + '" não se aplicou'); return; }
    const f = path.join(tmp, 'despensa-' + i + '.js');
    fs.writeFileSync(f, real.split(m[1]).join(m[2]));
    const r = require('child_process').spawnSync(process.execPath, [__filename], { env: Object.assign({}, process.env, { DESPENSA_JS: f }), encoding: 'utf8' });
    ok(r.status !== 0, 'o mutante "' + m[0] + '" passou nas verificações');
  });
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(falhas === 0 ? 'OK' : falhas + ' FALHA(S)');
process.exit(falhas === 0 ? 0 : 1);
