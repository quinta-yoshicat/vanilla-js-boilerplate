#!/usr/bin/env node
// OBJETIVOS DO DIA COM A RESERVA, A COLEÇÃO E A PROVA (js/objetivos.js: reserva_visitar, colecao_arrumar e prova_jogar
// na pool B; as marcações em reservaVisitarClique/colecaoArrumarClique, js/reserva.js, e em provaAcabar, js/prova-jogo.js).
// Corre os ficheiros REAIS em vm (state, i18n, niveis, personagens, garrafa, reserva, prova, dados, dados/provas,
// prova-jogo e objetivos), com um dia, um sorteio e uma gravação falsos.
//
// Prova:
//  (a) cada objetivo novo só entra no sorteio quando se pode cumprir hoje: nível 4 nenhum; nível 5 só a Reserva (com uma
//      garrafa feita e ainda não visitada hoje); nível 6 também a Coleção (com uma cor feita desde o nível 6 e ainda não
//      arrumada hoje) e a Prova (ainda não feita hoje: provaPodeJogar); um jogador antigo abaixo do 5 nenhum;
//  (b) cumpre-se uma só vez, quando a ação acontece nesse dia (a Prova ao ACABAR, não ao começar), dá os +2 de sempre e
//      um só som (a Reserva e a Coleção já tocam o seu, por isso o objetivo vai sem «ding»);
//  (c) em modo de teste (?visita=, ?prova=1) nunca entram nem contam;
//  (d) o sorteio continua igual: com os objetivos novos fora (nível 4) dá exatamente o mesmo que a lista antiga, para os
//      mesmos números sorteados; no mesmo dia não se volta a sortear;
//  (e) o jogador antigo (save sem reserva, colecao nem prova, ou com uma lista de objetivos antiga) abre sem erro;
//  (f) os textos nas 3 línguas.
//
// Depois de passar, aplica "mutações" e confirma que o teste as apanha.
// Uso: node scripts/verificar-objetivos-tarefas.js     Sai com 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const LER = function (f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); };
const ORDEM = [['state.js', 'js/state.js'], ['i18n.js', 'js/i18n.js'], ['niveis.js', 'js/niveis.js'], ['personagens.js', 'js/personagens.js'],
  ['garrafa.js', 'js/garrafa.js'], ['reserva.js', 'js/reserva.js'], ['prova.js', 'js/prova.js'], ['dados.js', 'js/dados.js'],
  ['provas.js', 'dados/provas.js'], ['prova-jogo.js', 'js/prova-jogo.js'], ['objetivos.js', 'js/objetivos.js']];
const FONTES = {};
ORDEM.forEach(function (f) { FONTES[f[0]] = LER(f[1]); });
const J = JSON.stringify;
const DIA = '2026-10-10';
const REP = { 1: 0, 4: 120, 5: 300, 6: 600 };
const NOVOS = ['reserva_visitar', 'colecao_arrumar', 'prova_jogar'];

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }

  function abrir(o) {
    o = o || {};
    const els = {};
    const el = function (id) { if (!els[id]) els[id] = { id: id, innerHTML: '', textContent: '', hidden: true, disabled: false, style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, setAttribute() {}, removeAttribute() {}, querySelector() { return null; }, querySelectorAll() { return []; } }; return els[id]; };
    const sb = {
      console: { log() {}, warn() {}, error() {} },
      localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
      location: { search: o.search || '' }, URLSearchParams: URLSearchParams, Intl: Intl,
      document: { addEventListener() {}, querySelectorAll: function () { return []; }, querySelector: function () { return null; }, getElementById: el, body: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } }, visibilityState: 'visible' },
      addEventListener() {}, innerHeight: 640, innerWidth: 360, setInterval: function () { return 1; }, clearInterval() {}, setTimeout: function () { return 1; }, clearTimeout() {}, Image: function () {}, Date: Date, navigator: {}
    };
    sb.window = sb; sb.Telegram = { WebApp: {} };
    const cx = vm.createContext(sb);
    require('./_regras-tempo').injetarRegrasTempo(cx);
    ORDEM.forEach(function (f) {
      if (f[0] === 'objetivos.js') {
        // O que o objetivos.js lê de ficheiros que aqui não se carregam (Vinha, Proteger, Explorar, Festas, tempo).
        vm.runInContext('var __grav = 0, __sons = [], __hoje = "' + DIA + '", __sorteio = null;' +
          ' saveState = function () { __grav++; }; updateStatsDisplays = function () {};' +
          ' function tocarSom(n) { __sons.push(n); } function vibrar() {} function atualizarDialogo() {} function definirFundo() {} function mostrarFalas() {} function reposicionarFlutuantes() {}' +
          ' function diaLisboaDeHoje() { return __hoje; } function renderAdega() {} function voltarEcraAnterior() {}' +
          ' randInt = function (a, b) { return __sorteio ? a + (__sorteio() % (b - a + 1)) : a; };' +
          ' function festaAtual() { return null; } function festaTemTarefaPorFazerHoje() { return false; } function tempoAtual() { return { disponivel: false }; }' +
          ' function jaFezTarefaTempoHoje() { return true; } function vigiarSinalAgora() { return null; } function vigiarJaFezHoje() { return true; }' +
          ' function estacaoAtual() { return "outono"; } var VINHA_BONUS_ESTACAO = {}; var RESIDUOS_POR_COMPOSTAGEM = 3;' +
          ' function vitoriasProtegerComPremioRestantesHoje() { return __vitorias; } var __vitorias = 2; function entradasBloqueadas() { return __bloq; } var __bloq = [1];' +
          ' function alambiquePodeDestilar() { return true; }' +
          ' var VISITAS_PARAMETROS_TESTE = ["visita", "dias", "festa"]; function visitaEmModoTeste() { var p = new URLSearchParams(location.search); return VISITAS_PARAMETROS_TESTE.some(function (k) { return p.has(k); }); }', cx);
      }
      vm.runInContext(fontes[f[0]], cx, { filename: f[1] });
    });
    vm.runInContext('renderColecaoDesenhar = function () {};', cx);
    const g = { cx: cx };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
    // Um jogador do nível n, com uma garrafa feita (Jovem) desde o nível 6 e a lista de hoje dada.
    g.nivel = function (n, extra) {
      g.ev('state = defaultState(); state.reputacao = ' + REP[n] + '; state.niveis.nivelMostrado = ' + n + '; state.acesso.jogadorAntigo = ' + (extra && extra.antigo ? 'true' : 'false') + ';' +
        ' state.garrafas = 1; state.adega.historico = [{ diasDescanso: 1 }]; state.niveis.garrafasAoNivel6 = ' + (n >= 6 ? 0 : 'null') + '; state.uvas = 50; state.gotas = 50;' +
        ' state.objetivos.dia = __hoje; state.objetivos.lista = ' + J((extra && extra.lista) || []) + '; state.objetivos.bonusDiaDado = false; __grav = 0; __sons = [];' + ((extra && extra.js) || ''));
    };
    g.elegiveis = function () { return g.json('OBJETIVOS_POOL_B.filter(function (o) { return o.elegivel(); }).map(function (o) { return o.id; })').filter(function (id) { return NOVOS.indexOf(id) !== -1; }); };
    g.obj = function (id) { return g.json('state.objetivos.lista.filter(function (o) { return o.id === ' + J(id) + '; })[0] || null'); };
    return g;
  }
  const lista = function (ids) { return ids.map(function (id) { return { id: id, cumprido: false }; }); };

  // ---------------------------------------------------------------- (a) só entram quando se podem cumprir
  {
    const g = abrir();
    g.nivel(4); ok(J(g.elegiveis()) === '[]', '(a) nível 4: nenhum (deu ' + J(g.elegiveis()) + ')');
    g.nivel(5); ok(J(g.elegiveis()) === J(['reserva_visitar']), '(a) nível 5: só a Reserva (deu ' + J(g.elegiveis()) + ')');
    g.nivel(5, { js: 'state.reserva.visitaDia = __hoje;' }); ok(J(g.elegiveis()) === '[]', '(a) nível 5 com a Reserva visitada hoje: nenhum');
    g.nivel(5, { js: 'state.garrafas = 0;' }); ok(J(g.elegiveis()) === '[]', '(a) nível 5 sem garrafas (o botão apagado): nenhum');
    g.nivel(6); ok(J(g.elegiveis()) === J(NOVOS), '(a) nível 6: os 3 (deu ' + J(g.elegiveis()) + ')');
    g.nivel(6, { js: 'state.colecao.arrumouDia = __hoje;' }); ok(g.elegiveis().indexOf('colecao_arrumar') === -1, '(a) nível 6 com a Coleção arrumada hoje: sem a Coleção');
    g.nivel(6, { js: 'state.niveis.garrafasAoNivel6 = 1;' }); ok(g.elegiveis().indexOf('colecao_arrumar') === -1, '(a) nível 6 sem cores feitas desde o nível 6 (o botão apagado): sem a Coleção');
    g.nivel(6, { js: 'state.prova.ultimoDia = __hoje;' }); ok(g.elegiveis().indexOf('prova_jogar') === -1 && g.elegiveis().indexOf('reserva_visitar') !== -1, '(a) nível 6 com a prova de hoje feita: sem a Prova');
    g.nivel(6, { js: 'state.reserva.visitaDia = __hoje; state.colecao.arrumouDia = __hoje; state.prova.ultimoDia = __hoje;' }); ok(J(g.elegiveis()) === '[]', '(a) nível 6 com tudo feito hoje: nenhum');
    g.nivel(1, { antigo: true }); ok(J(g.elegiveis()) === '[]', '(a) jogador antigo no nível 1 (a Cave e a Coleção abertas): nenhum, são do nível 5 e 6');
    g.nivel(4, { antigo: true, js: 'state.niveis.garrafasAoNivel6 = 0;' }); ok(J(g.elegiveis()) === '[]', '(a) jogador antigo no nível 4 (a Cave aberta, com garrafa): a Reserva não entra (é do nível 5)');
    g.nivel(5, { antigo: true, js: 'state.niveis.garrafasAoNivel6 = 0;' }); ok(J(g.elegiveis()) === J(['reserva_visitar']), '(a) jogador antigo no nível 5 com uma cor na Coleção: só a Reserva (a Coleção é do nível 6)');
    g.nivel(5); g.ev('state.reserva.visitaDia = "2026-10-11"'); ok(J(g.elegiveis()) === '[]', '(a) relógio atrás (visitou «amanhã»): a Reserva não entra');
  }

  // ---------------------------------------------------------------- (b) cumprem-se uma só vez, quando a ação acontece
  {
    const g = abrir(); g.nivel(6, { lista: lista(['reserva_visitar', 'colecao_arrumar', 'prova_jogar']) });
    const rep0 = g.ev('state.reputacao');
    g.ev('reservaVisitarClique()');
    ok(g.obj('reserva_visitar').cumprido === true && g.ev('state.reputacao') === rep0 + 3 + 2 && J(g.json('__sons')) === J(['objetivoCumprido']), '(b) Reserva: cumpre-se ao visitar (+3 e +2), um só som');
    g.ev('reservaVisitarClique()');
    ok(g.ev('state.reputacao') === rep0 + 5, '(b) Reserva: a 2.ª visita no mesmo dia não conta outra vez');
    g.ev('__sons = []; colecaoArrumarClique()');
    ok(g.obj('colecao_arrumar').cumprido === true && g.ev('state.reputacao') === rep0 + 5 + 4 + 2 && J(g.json('__sons')) === J(['objetivoCumprido']), '(b) Coleção: cumpre-se ao arrumar (+4 e +2), um só som');
    g.ev('colecaoArrumarClique()'); ok(g.ev('state.reputacao') === rep0 + 11, '(b) Coleção: só uma vez');
    g.ev('provaComecarClique()');
    ok(g.obj('prova_jogar').cumprido === false, '(b) Prova: começar não conta');
    const antes = g.ev('state.reputacao');
    g.ev('provaJogo.sessao.rondas.forEach(function (r) { provaResponderClique((r.cor % 4) + 1); provaSeguinteClique(); })');
    ok(g.obj('prova_jogar').cumprido === true && g.ev('state.reputacao') === antes + 2 + 5 && g.ev('state.objetivos.selosTotal') === 1, '(b) Prova: conta ao acabar (mesmo errando as 3: +2, e com os 3 feitos o bónus de +5 e o selo)');
    g.ev('provaJogo = null; provaComecarClique()');
    ok(g.ev('state.reputacao') === antes + 7 && g.ev('state.objetivos.selosTotal') === 1, '(b) Prova: não se repete no mesmo dia');
    const s = abrir(); s.nivel(6, { lista: lista(['proteger_vencer']) });
    s.ev('reservaVisitarClique()');
    ok(s.ev('state.reputacao') === REP[6] + 3 && s.obj('proteger_vencer').cumprido === false, '(b) sem o objetivo na lista de hoje, a Reserva dá só os +3 de sempre');
  }

  // ---------------------------------------------------------------- (c) modo de teste
  {
    ['?visita=valentim_4', '?prova=1'].forEach(function (q) {
      const g = abrir({ search: q }); g.nivel(6);
      ok(J(g.elegiveis()) === '[]', '(c) ' + q + ': não entram no sorteio');
      g.nivel(6, { lista: lista(['reserva_visitar', 'colecao_arrumar', 'prova_jogar']) });
      g.ev('reservaVisitarClique(); colecaoArrumarClique(); provaComecarClique(); if (provaJogo) provaJogo.sessao.rondas.forEach(function (r) { provaResponderClique(r.cor); provaSeguinteClique(); });');
      ok(NOVOS.every(function (id) { return g.obj(id).cumprido === false; }), '(c) ' + q + ': nunca contam (' + J(g.json('state.objetivos.lista')) + ')');
    });
  }

  // ---------------------------------------------------------------- (d) o sorteio continua igual
  {
    const g = abrir();
    const FASES = ['preparar', 'preparada', 'crescendo', 'pronta'];
    let diferentes = 0, total = 0;
    FASES.forEach(function (fase) {
      [0, 2].forEach(function (vit) {
        for (let semente = 1; semente <= 25; semente++) {
          const sortear = function (podarB) {
            g.nivel(4, { js: 'state.vinha.fase = "' + fase + '"; state.vinha.adubo = 1; state.vinha.residuos = 4; __vitorias = ' + vit + ';' });
            g.ev('var __s = ' + semente + '; __sorteio = function () { __s = (__s * 1103515245 + 12345) % 2147483648; return __s; };');
            if (podarB) g.ev('var __pool = OBJETIVOS_POOL_B.slice(); OBJETIVOS_POOL_B.length = 0; __pool.slice(0, 2).forEach(function (o) { OBJETIVOS_POOL_B.push(o); });');
            g.ev('gerarObjetivosDoDia()');
            const r = J(g.json('state.objetivos.lista'));
            if (podarB) g.ev('OBJETIVOS_POOL_B.length = 0; __pool.forEach(function (o) { OBJETIVOS_POOL_B.push(o); });');
            return r;
          };
          total++; if (sortear(false) !== sortear(true)) diferentes++;
        }
      });
    });
    g.ev('__sorteio = null;');
    ok(diferentes === 0 && total === 200, '(d) nível 4: o sorteio dá o mesmo que a lista antiga (' + diferentes + ' diferentes em ' + total + ')');
    ok(g.json('OBJETIVOS_POOL_B.slice(0, 2).map(function (o) { return o.id; })').join() === 'proteger_vencer,explorar_descobrir', '(d) os de antes ficam na mesma ordem, os novos vão no fim');
    g.nivel(6, { js: '__vitorias = 0; __bloq = [];' }); g.ev('gerarObjetivosDoDia()');
    ok(NOVOS.indexOf(g.json('state.objetivos.lista')[1].id) !== -1, '(d) nível 6 sem Proteger nem Explorar: o 2.º objetivo é uma das tarefas novas (' + J(g.json('state.objetivos.lista')) + ')');
    const l = g.ev('JSON.stringify(state.objetivos.lista)');
    g.ev('garantirObjetivosDoDia(); garantirObjetivosDoDia();');
    ok(g.ev('JSON.stringify(state.objetivos.lista)') === l, '(d) no mesmo dia não se volta a sortear');
  }

  // ---------------------------------------------------------------- (e) jogador antigo
  {
    const g = abrir();
    let rebentou = false;
    try {
      g.ev('state = mergeDeep(defaultState(), { reputacao: 700, garrafas: 3, objetivos: { dia: __hoje, lista: [{ id: "vinha_regar", cumprido: true }, { id: "proteger_vencer", cumprido: false }], bonusDiaDado: false, selosTotal: 4 } }); delete state.reserva; delete state.colecao; delete state.prova;');
      g.json('OBJETIVOS_POOL_B.filter(function (o) { return o.elegivel(); }).map(function (o) { return o.id; })');
      g.ev('garantirObjetivosDoDia(); atualizarCartaoObjetivosQuinta(); reservaVisitarClique(); colecaoArrumarClique();');
    } catch (e) { rebentou = String(e); }
    ok(rebentou === false, '(e) save antigo (sem reserva, colecao nem prova): sem erro ' + (rebentou || ''));
    ok(g.json('state.objetivos.lista').length === 2 && g.ev('state.objetivos.selosTotal') === 4, '(e) a lista de hoje do save antigo fica como estava');
    g.ev('state = defaultState(); state.objetivos = { dia: __hoje, lista: [{ id: "prova_jogar", cumprido: false }], bonusDiaDado: false, selosTotal: 0 };');
    ok(g.ev('objetivoTemDados("prova_jogar")') === true && g.ev('objetivosComDados().length') === 1, '(e) um objetivo novo gravado aparece com o seu texto');
  }

  // ---------------------------------------------------------------- (f) textos
  {
    const g = abrir();
    const PT = { reserva_visitar: 'Visita a Reserva na Cave.', colecao_arrumar: 'Arruma a Coleção.', prova_jogar: 'Faz a Prova às cegas com o Dr. Henrique.' };
    ['pt', 'en', 'es'].forEach(function (l) {
      NOVOS.forEach(function (id) {
        const v = g.ev('TRANSLATIONS.' + l + '["objetivo.' + id + '"]');
        ok(typeof v === 'string' && v.length >= 8 && v.length <= 50 && /\.$/.test(v) && !/Fygmo\s?2/i.test(v), '(f) ' + l + ': objetivo.' + id + ' curto, a acabar com ponto: ' + J(v));
      });
    });
    NOVOS.forEach(function (id) { ok(g.ev('TRANSLATIONS.pt["objetivo.' + id + '"]') === PT[id], '(f) PT objetivo.' + id + ' = «' + PT[id] + '»'); });
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
  ['a Reserva no nível 4', 'objetivos.js', 'nivelPelaReputacao(state.reputacao) >= 5 && reservaPodeVisitar', 'nivelPelaReputacao(state.reputacao) >= 4 && reservaPodeVisitar'],
  ['a Reserva já visitada entra', 'objetivos.js', 'reservaPodeVisitar(state, diaLisboaDeHoje()).ok === true;', 'true;'],
  ['a Coleção sem o nível 6', 'objetivos.js', 'nivelPelaReputacao(state.reputacao) >= 6 && colecaoPodeArrumar', 'colecaoPodeArrumar'],
  ['a Coleção apagada entra', 'objetivos.js', 'colecaoPodeArrumar(state, diaLisboaDeHoje(), colecaoContarCores()).ok === true;', 'true;'],
  ['a Prova já feita entra', 'objetivos.js', "typeof provaPodeJogar === 'function' && provaPodeJogar(state, diaLisboaDeHoje(), false).ok === true;", "typeof provaPodeJogar === 'function';"],
  ['em modo de teste entram', 'objetivos.js', "    if (typeof visitaEmModoTeste === 'function' && visitaEmModoTeste()) return false;\n    if (typeof provaModoTeste === 'function' && provaModoTeste()) return false;\n", ''],
  ['?prova=1 não é modo de teste', 'objetivos.js', "    if (typeof provaModoTeste === 'function' && provaModoTeste()) return false;\n", ''],
  ['os novos à frente dos de antes', 'objetivos.js', "const OBJETIVOS_POOL_B = [\n  { id: 'proteger_vencer',", "const OBJETIVOS_POOL_B = [\n  { id: 'prova_jogar', elegivel: function () { return false; } },\n  { id: 'proteger_vencer',"],
  ['a Reserva não marca', 'reserva.js', "marcarObjetivoCumprido('reserva_visitar', { semSom: true });", 'void 0;'],
  ['a Reserva marca com «ding» (dois sons)', 'reserva.js', "marcarObjetivoCumprido('reserva_visitar', { semSom: true });", "marcarObjetivoCumprido('reserva_visitar');"],
  ['a Reserva conta em modo de teste', 'reserva.js', "if (typeof marcarObjetivoCumprido === 'function' && typeof objetivoForaDoTeste === 'function' && objetivoForaDoTeste()) marcarObjetivoCumprido('reserva_visitar'", "if (typeof marcarObjetivoCumprido === 'function') marcarObjetivoCumprido('reserva_visitar'"],
  ['a Coleção não marca', 'reserva.js', "marcarObjetivoCumprido('colecao_arrumar', { semSom: true });", 'void 0;'],
  ['a Prova não marca', 'prova-jogo.js', "    if (typeof marcarObjetivoCumprido === 'function') marcarObjetivoCumprido('prova_jogar');\n", ''],
  ['a Prova conta ao começar', 'prova-jogo.js', '      if (r.ok) {\n        saveState(state);\n', "      if (r.ok) {\n        if (typeof marcarObjetivoCumprido === 'function') marcarObjetivoCumprido('prova_jogar');\n        saveState(state);\n"],
  ['um texto em falta (ES)', 'i18n.js', "    'objetivo.colecao_arrumar': 'Ordena la Colección.',\n", ''],
  ['o texto PT trocado', 'i18n.js', "    'objetivo.reserva_visitar': 'Visita a Reserva na Cave.',", "    'objetivo.reserva_visitar': 'Reserva.',"]
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
