#!/usr/bin/env node
// ENCOMENDAS, PARTE 3: as falas de cada personagem (ENCOMENDAS_FALAS_PEDIDO / ENCOMENDAS_FALAS_OBRIGADO e
// encomendaFala() em js/encomendas.js), o contador «Encomendas entregues: N» no Perfil (renderPerfil, js/perfil.js) e as
// conquistas dos marcos 1, 10 e 30 (js/conquistas.js). Corre os ficheiros REAIS em vm (scripts/_jogo-vm.js, com dados/).
//
// Prova:
//  (a) cada personagem que pode pedir (as de VISITAS_PERSONAGENS e todas as que aparecem nas visitas, também as de
//      dados/) tem as 2 falas próprias nas 3 línguas: curtas (até 80 carateres), sem «dias» nem «Fygmo 2»/«Fygmo2»,
//      diferentes das das outras personagens e da geral; uma personagem sem fala própria (ou sem essa língua) usa a
//      geral, nunca fica vazio;
//  (b) o Perfil mostra «Encomendas entregues: N», com N = state.encomendas.cumpridas, como as outras linhas de texto
//      (info-text, a seguir à das garrafas), 0 quando não há nenhuma ou o estado vem estragado, nas 3 línguas;
//  (c) as conquistas encomenda_1, encomenda_10 e encomenda_30 só ficam feitas com 1, 10 e 30 entregues, registam-se
//      uma só vez (um só saveState; a 2.ª vez não grava), não dão prémio (nem Reputação, nem Gotas, nem Uvas) e não
//      se perdem se o número descer; o jogador antigo (save sem o campo das conquistas, com as cumpridas já contadas)
//      ganha-as de uma vez, sem repetir as que já tinha; o «n / total» passa a contar 3 a mais;
//  (d) os textos das conquistas e do contador nas 3 línguas.
//
// Depois de passar, aplica "mutações" e confirma que o teste as apanha.
// Uso: node scripts/verificar-encomendas-parte3.js     Sai com 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { abrirJogo } = require('./_jogo-vm');

const RAIZ = path.join(__dirname, '..');
const LER = function (f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); };
const FONTES = { 'encomendas.js': LER('js/encomendas.js'), 'perfil.js': LER('js/perfil.js'), 'conquistas.js': LER('js/conquistas.js'), 'i18n.js': LER('js/i18n.js') };
const J = JSON.stringify;
const CONQ = [['encomenda_1', 1], ['encomenda_10', 10], ['encomenda_30', 30]];

// Os textos de um js/i18n.js (o real ou um estragado), à parte do jogo (o _jogo-vm.js já carrega o real).
function traducoes(src) {
  const cx = vm.createContext({ state: {}, document: { querySelectorAll: function () { return []; }, documentElement: {} }, console: { log() {}, warn() {} } });
  vm.runInContext(src + '\n;this.__T = TRANSLATIONS;', cx, { filename: 'js/i18n.js' });
  return JSON.parse(JSON.stringify(cx.__T));
}

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }

  function abrir() {
    const g = abrirJogo({ ecraReal: true, explorar: true });
    vm.runInContext(LER('js/caderno.js'), g.cx, { filename: 'js/caderno.js' });
    vm.runInContext(fontes['conquistas.js'], g.cx, { filename: 'js/conquistas.js' });
    const garrafa = /function colecaoVisivel\(\) \{[\s\S]*?\n\}\n/.exec(LER('js/garrafa.js'));
    vm.runInContext(garrafa[0] + 'function colecaoResumo() { return "1 / 4"; }', g.cx);
    vm.runInContext(fontes['perfil.js'], g.cx, { filename: 'js/perfil.js' });
    vm.runInContext(fontes['encomendas.js'], g.cx, { filename: 'js/encomendas.js' });
    vm.runInContext('var __grav = 0; saveState = function () { __grav++; }; function atualizarDialogo() {}', g.cx);
    g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', g.cx)); };
    g.perfil = function () { g.ev('renderPerfil()'); return g.el('perfil-container').innerHTML; };
    return g;
  }

  // ---------------------------------------------------------------- (a) as falas
  {
    const g = abrir();
    const quem = g.json('VISITAS_PERSONAGENS.map(function (p) { return p.id; }).concat(VISITAS.map(function (v) { return v.personagem; })).filter(function (x, i, l) { return l.indexOf(x) === i; })');
    ok(quem.length >= 3 && ['valentim', 'marisa', 'henrique'].every(function (p) { return quem.indexOf(p) !== -1; }), '(a) as personagens que podem pedir: ' + J(quem));
    const PROIBIDO = /\b(dias?|days?|d[ií]as?)\b|Fygmo\s?2/i;
    ['ENCOMENDAS_FALAS_PEDIDO', 'ENCOMENDAS_FALAS_OBRIGADO'].forEach(function (o) {
      const T = g.json(o);
      ['pt', 'en', 'es'].forEach(function (l) {
        const vistas = {};
        quem.concat(['geral']).forEach(function (p) {
          const f = T[p] && T[p][l];
          ok(typeof f === 'string' && f.trim().length >= 20 && f.length <= 80, '(a) ' + o + '.' + p + '.' + l + ': uma frase curta (até 80): ' + J(f));
          ok(typeof f !== 'string' || !PROIBIDO.test(f), '(a) ' + o + '.' + p + '.' + l + ': sem «dias» nem «Fygmo 2»');
          if (typeof f === 'string') { ok(!vistas[f], '(a) ' + o + '.' + p + '.' + l + ': igual à de outra personagem'); vistas[f] = true; }
        });
        ok(Object.keys(T).every(function (p) { return p === 'geral' || quem.indexOf(p) !== -1; }), '(a) ' + o + ': só falas de personagens que existem');
      });
    });
    // Escolher a fala: a própria na língua do jogador; sem ela, a geral; nunca vazio.
    ok(g.ev('encomendaFala(ENCOMENDAS_FALAS_PEDIDO, "marisa")') === g.ev('ENCOMENDAS_FALAS_PEDIDO.marisa.pt'), '(a) a Marisa diz a sua (PT)');
    g.ev('currentLang = "es"');
    ok(g.ev('encomendaFala(ENCOMENDAS_FALAS_OBRIGADO, "henrique")') === g.ev('ENCOMENDAS_FALAS_OBRIGADO.henrique.es'), '(a) o Dr. Henrique na língua do jogador (ES)');
    g.ev('currentLang = "pt"');
    ok(g.ev('encomendaFala(ENCOMENDAS_FALAS_PEDIDO, "ninguem")') === g.ev('ENCOMENDAS_FALAS_PEDIDO.geral.pt') && g.ev('encomendaFala(ENCOMENDAS_FALAS_OBRIGADO, "ninguem")') === g.ev('ENCOMENDAS_FALAS_OBRIGADO.geral.pt'), '(a) uma personagem sem fala própria usa a geral');
    ok(g.ev('encomendaFala({ geral: { pt: "geral" }, x: { en: "só inglês" } }, "x")') === 'geral' && g.ev('encomendaFala(ENCOMENDAS_FALAS_PEDIDO, "__proto__")') === g.ev('ENCOMENDAS_FALAS_PEDIDO.geral.pt'), '(a) sem a língua (ou com um nome estranho) usa a geral, nunca vazio');
  }

  // ---------------------------------------------------------------- (b) o contador no Perfil
  {
    const g = abrir();
    g.ev('state.acesso.jogadorAntigo = true; state.reputacao = 3000; state.garrafas = 2; state.ultimaGarrafaData = "1/1/2026";');
    [[null, 0], [{ atual: null, ultimoDia: null, cumpridas: 0 }, 0], [{ atual: null, ultimoDia: null, cumpridas: 7 }, 7], ['x', 0], [{ cumpridas: -3 }, 0], [{ cumpridas: 2.5 }, 0], [{ cumpridas: 41 }, 41]].forEach(function (c) {
      g.cx.__e = JSON.parse(J(c[0]));
      g.ev('state.encomendas = __e');
      const h = g.perfil();
      ok(h.indexOf('<p class="info-text perfil-encomendas">Encomendas entregues: ' + c[1] + '</p>') !== -1, '(b) ' + J(c[0]) + ': «Encomendas entregues: ' + c[1] + '»');
    });
    const h = g.perfil();
    const iG = h.indexOf('<p class="info-text">2 — '), iE = h.indexOf('perfil-encomendas'), iFim = h.indexOf('<div class="action-panel">');
    ok(iG !== -1 && iG < iE && iE < iFim, '(b) no painel do Perfil, logo a seguir à linha das garrafas, no mesmo estilo (info-text)');
    g.ev('state.garrafas = 0'); ok(g.perfil().indexOf('perfil-encomendas') !== -1, '(b) também sem garrafas');
    [['en', 'Orders delivered: 41'], ['es', 'Pedidos entregados: 41']].forEach(function (c) {
      g.ev('currentLang = "' + c[0] + '"; state.lang = "' + c[0] + '";');
      ok(g.perfil().indexOf('>' + c[1] + '<') !== -1, '(b) ' + c[0] + ': «' + c[1] + '»');
    });
  }

  // ---------------------------------------------------------------- (c) as conquistas
  {
    const g = abrir();
    ok(J(CONQ.map(function (c) { return g.ev('CONQUISTAS_CONFIG.some(function (x) { return x.id === "' + c[0] + '" && x.nomeKey === "conquista.' + c[0] + '.nome" && x.descKey === "conquista.' + c[0] + '.desc"; })'); })) === J([true, true, true]), '(c) as 3 conquistas no formato das outras (id, nomeKey, descKey, cumprida)');
    const feitas = function () { return CONQ.map(function (c) { return g.ev('conquistaFeita(CONQUISTAS_CONFIG.filter(function (x) { return x.id === "' + c[0] + '"; })[0])'); }); };
    const premio = function () { return g.ev('[state.reputacao, state.gotas, state.uvas, state.conhecimento].join()'); };
    g.ev('state = defaultState(); __grav = 0;');
    const p0 = premio();
    [[0, [false, false, false]], [1, [true, false, false]], [9, [true, false, false]], [10, [true, true, false]], [29, [true, true, false]], [30, [true, true, true]]].forEach(function (c) {
      g.ev('state = defaultState(); state.encomendas.cumpridas = ' + c[0] + ';');
      ok(J(feitas()) === J(c[1]), '(c) com ' + c[0] + ' entregues: ' + J(feitas()));
    });
    g.ev('state = defaultState(); __grav = 0; state.encomendas.cumpridas = 1;');
    ok(g.ev('conquistasRegistarGanhas()') === true && g.ev('__grav') === 1 && g.ev('state.conquistasGanhas.encomenda_1') === true && g.ev('"encomenda_10" in state.conquistasGanhas') === false, '(c) a 1.ª entregue: regista encomenda_1, grava uma vez');
    ok(g.ev('conquistasRegistarGanhas()') === false && g.ev('__grav') === 1, '(c) a 2.ª vez não regista nem grava (uma só vez)');
    ok(premio() === p0, '(c) sem prémio (Reputação, Gotas, Uvas e Conhecimento iguais)');
    g.ev('state.encomendas = { atual: null, ultimoDia: null, cumpridas: 0 };');
    ok(J(feitas()) === J([true, false, false]), '(c) se o número descer (nuvem estranha), a conquista ganha fica');
    // jogador antigo: save sem conquistasGanhas, já com 35 entregues; e outro que já tinha a 1.ª registada
    g.ev('state = mergeDeep(defaultState(), { reputacao: 800, encomendas: { atual: null, ultimoDia: "2026-10-01", cumpridas: 35 } }); __grav = 0;');
    ok(g.ev('conquistasRegistarGanhas()') === true && g.ev('__grav') === 1 && CONQ.every(function (c) { return g.ev('state.conquistasGanhas.' + c[0]) === true; }), '(c) jogador antigo com 35: ganha as 3 de uma vez (um só saveState)');
    ok(g.ev('conquistasRegistarGanhas()') === false && g.ev('__grav') === 1, '(c) jogador antigo: depois não regista outra vez');
    g.ev('state = mergeDeep(defaultState(), { encomendas: { cumpridas: 12 }, conquistasGanhas: { encomenda_1: true, primeira_garrafa: true } }); __grav = 0;');
    g.ev('conquistasRegistarGanhas()');
    ok(J(g.json('Object.keys(state.conquistasGanhas).sort()')) === J(['encomenda_1', 'encomenda_10', 'primeira_garrafa']) && g.ev('__grav') === 1, '(c) quem já tinha a 1.ª registada só ganha a 10 (sem duplicar): ' + J(g.json('state.conquistasGanhas')));
    g.ev('state = defaultState(); state.encomendas = "estragado";');
    ok(J(feitas()) === J([false, false, false]), '(c) estado estragado: conta 0 (pelo reparo de sempre, encomendasNormalizar)');
    ok(g.ev('CONQUISTAS_CONFIG.length') === g.ev('CONQUISTAS_CONFIG.filter(function (c) { return !/^encomenda_/.test(c.id); }).length') + 3, '(c) o total do Livro passa a contar 3 a mais');
  }

  // ---------------------------------------------------------------- (d) textos
  {
    const TR = traducoes(fontes['i18n.js']);
    const PT = { 'conquista.encomenda_1.nome': 'Primeira encomenda', 'perfil.encomendasEntregues': 'Encomendas entregues: {n}' };
    ['pt', 'en', 'es'].forEach(function (l) {
      const T = TR[l];
      CONQ.forEach(function (c) { ['nome', 'desc'].forEach(function (k) { const v = T['conquista.' + c[0] + '.' + k]; ok(typeof v === 'string' && v.length >= 3 && v.length <= 60 && !/Fygmo\s?2|\b(dias?|days?|d[ií]as?)\b/i.test(v), '(d) ' + l + ': conquista.' + c[0] + '.' + k + ': ' + J(v)); }); });
      ok(typeof T['perfil.encomendasEntregues'] === 'string' && T['perfil.encomendasEntregues'].indexOf('{n}') !== -1, '(d) ' + l + ': perfil.encomendasEntregues com {n}');
      CONQ.slice(1).forEach(function (c) { ok(String(T['conquista.' + c[0] + '.desc']).indexOf(String(c[1])) !== -1, '(d) ' + l + ': a descrição de ' + c[0] + ' diz ' + c[1]); });
    });
    Object.keys(PT).forEach(function (k) { ok(TR.pt[k] === PT[k], '(d) PT ' + k + ' = «' + PT[k] + '»'); });
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
  ['sem a fala geral', 'encomendas.js', "  const f = propria && propria[lingua] ? propria : falas.geral;", '  const f = propria || {};'],
  ['a Marisa sem fala de pedido', 'encomendas.js', "  marisa: { pt: 'Arranjas-me uma garrafa?", "  marisa_x: { pt: 'Arranjas-me uma garrafa?"],
  ['uma fala comprida', 'encomendas.js', "'Queria um exemplar da casa para provar. Prometo cuspir com elegância.'", "'Queria um exemplar da casa para provar com os meus colegas todos. Prometo cuspir com muita elegância.'"],
  ['Fygmo 2 numa fala', 'encomendas.js', "'Perfeita! Digo a todos que a equipa inteira ajudou, gato incluído.'", "'Perfeita! Digo a todos que o Fygmo 2 ajudou, gato incluído.'"],
  ['sem o contador no Perfil', 'perfil.js', "      '<p class=\"info-text perfil-encomendas\">'", "      '<p class=\"info-text perfil-encomendas\" hidden>'"],
  ['o contador lê o estado sem o reparo', 'perfil.js', "typeof encomendasNormalizar === 'function' ? encomendasNormalizar(state.encomendas).cumpridas : 0", '(state.encomendas || {}).cumpridas'],
  ['o marco de 10 passa a 5', 'conquistas.js', 'return conquistasEncomendas() >= 10;', 'return conquistasEncomendas() >= 5;'],
  ['o marco de 30 passa a 29', 'conquistas.js', 'return conquistasEncomendas() >= 30;', 'return conquistasEncomendas() >= 29;'],
  ['as conquistas leem sem o reparo', 'conquistas.js', "  return typeof encomendasNormalizar === 'function' ? encomendasNormalizar(state.encomendas).cumpridas : 0;", '  return Number(state.encomendas && state.encomendas.cumpridas) || state.encomendas.length || 0;'],
  ['sem a conquista dos 30', 'conquistas.js', "  { id: 'encomenda_30',", "  { id: 'encomenda_trinta',"],
  ['um texto em falta (ES)', 'i18n.js', "    'conquista.encomenda_10.desc': 'Entrega 10 pedidos.',\n", ''],
  ['o contador sem o número (EN)', 'i18n.js', "'perfil.encomendasEntregues': 'Orders delivered: {n}',", "'perfil.encomendasEntregues': 'Orders delivered',"]
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
