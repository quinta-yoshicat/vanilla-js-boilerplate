#!/usr/bin/env node
// O descanso da garrafa na Cave por escalões de 9 h (js/garrafa.js: CAVE_ESCALAO_MS). Corre o código REAL em vm (state.js,
// estacoes.js, tempo.js, niveis.js, alambique.js, garrafa.js e i18n.js) com um relógio falso. Prova que:
//  (a) 8 h 59 min = ainda sem escalão (sem cor) e engarrafar recusa sem mexer em nada; 9 h = Jovem, 18 h = Dourado,
//      27 h = Âmbar, 36 h = Cobre (e mais do que isso continua Cobre); o mínimo para engarrafar é 1 escalão (9 h);
//  (b) a Reputação por escalão é a de antes (30/40/50/60, +10 no inverno) e o diasDescanso gravado é o escalão;
//  (c) as garrafas antigas (diasDescanso 1 a 4, e mais) ficam com a mesma cor e a Coleção igual; as regras do capítulo 5
//      (escalão 3), do 6 (4 cores) e das conquistas Paciência (3) e Reserva Especial (4) não mudaram;
//  (d) um lote a meio (começado há 20 h, que antes ainda não tinha cor) é contado pelas regras novas (2 escalões,
//      Dourado) sem mexer no estado gravado; ?dias=N conta escalões;
//  (e) os tempos mostrados são horas e minutos reais (nunca «1d 3h» nem «2 d»): «falta», «já descansou» e «próxima cor»;
//  (f) nenhum texto nas 3 línguas diz «dias» para o descanso da garrafa; as chaves adega.colecaoDias1/2/3 continuam;
//      as mensagens usam {tempo} e {cor}; não há 24 h escritas no js/garrafa.js.
// Depois, aplica "mutações" (estraga cada regra de propósito) e confirma que o teste as apanha.
// Uso: node scripts/verificar-cave-escaloes.js     Sai com 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const LER = function (f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); };
const FICHEIROS = ['state.js', 'estacoes.js', 'tempo.js', 'niveis.js', 'alambique.js', 'garrafa.js'];
const FONTES = {};
FICHEIROS.concat(['i18n.js', 'capitulos.js', 'conquistas.js']).forEach(function (f) { FONTES[f] = LER('js/' + f); });
const AGORA = Date.parse('2026-07-09T10:00:00+01:00');
const H = 60 * 60 * 1000, MIN = 60 * 1000;

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
    const sb = {
      console: { log() {}, warn() {}, error() {} },
      localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
      location: { search: o.search || '' }, URLSearchParams: URLSearchParams, Intl: Intl,
      document: {
        hidden: false, querySelectorAll: function () { return []; }, querySelector: function () { return null; }, documentElement: {},
        addEventListener: function () {}, getElementById: function () { return { innerHTML: '', style: {}, classList: { add() {}, remove() {}, toggle() {} } }; }
      },
      setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {}, Date: Relogio, navigator: { language: 'pt' }
    };
    sb.window = sb; sb.addEventListener = function () {}; sb.Telegram = { WebApp: {} };
    const cx = vm.createContext(sb);
    vm.runInContext(fontes['state.js'], cx, { filename: 'state.js' });
    vm.runInContext(fontes['i18n.js'], cx, { filename: 'i18n.js' });
    vm.runInContext(`
      var SAVES = 0;
      t = function (k) { var v = TRANSLATIONS.pt[k]; return v === undefined ? k : v; };
      function escaparHtml(s) { return String(s); }
      function mostrarFalas() {} function vibrar() {} function updateStatsDisplays() {}
      function reposicionarFlutuantes() {} function atualizarCartaoObjetivosQuinta() {}
      function localeAtual() { return 'pt-PT'; } function faseRealAtual() { return 'repouso'; }
      function jaFezTarefaTempoHoje() { return false; } function registarTarefaTempoHoje() {}
      function entradasBloqueadas() { return []; } function mostrarNovaEntrada() {} function atualizarDialogo() {} function definirFundo() {}
      function pararSomAmbiente() {} function iniciarSomAmbiente() {} function tocarSomFicheiro() {} function tocarSom() {} function tocarSomDaAcao() {}
      function formatarTempoVinha() { return '1 min'; }
      function atualizarCartaoNivelQuinta() {} function atualizarResumoQuinta() {} function atualizarLinhaVisitaQuinta() {}
      function marcarObjetivoCumprido() {} function desbloquearEntradaEnciclopedia() { return null; }
      function diaLisboaDeHoje() { return '2026-07-09'; } function goTo() {}
    `, cx);
    ['estacoes.js', 'tempo.js', 'niveis.js', 'alambique.js', 'garrafa.js'].forEach(function (f) { vm.runInContext(fontes[f], cx, { filename: f }); });
    vm.runInContext(`
      saveState = function () { SAVES++; };
      renderAdega = function () {};
      var __estacao = ${JSON.stringify(o.estacao || 'verao')};
      estacaoAtual = function () { return __estacao; };
      state = defaultState();
      state.reputacao = 1200; state.uvas = 50; state.gotas = 500; state.garrafas = 0; state.acesso.jogadorAntigo = true;
      state.niveis.garrafasAoNivel6 = 0;
      state.adega = Object.assign(state.adega, { bagaco: 0, aguardente: 3, bagaceira: 0, cooldowns: {}, lote: null, historico: [] });
    `, cx);
    const g = { cx: cx, relogio: relogio };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
    g.lote = function (ms) { g.ev('state.adega.lote = { iniciadoEm: ' + (AGORA - ms) + ' };'); };
    return g;
  }

  // ---------------- (a) Os escalões ----------------
  ok(abrir().ev('CAVE_ESCALAO_MS') === 9 * H && abrir().ev('DIA_MS') === 9 * H, '(a) CAVE_ESCALAO_MS e DIA_MS são 9 h');
  ok(abrir().ev('REGRAS_DESCANSO_CAVE.diasMinimos') === 1, '(a) o mínimo para engarrafar é 1 escalão');
  {
    const g = abrir();
    g.lote(9 * H - MIN);
    ok(g.ev('Math.floor(diasDescansadosNaCave())') === 0 && g.ev('estadoGarrafaLote(diasDescansadosNaCave()).atual') === null, '(a) 8 h 59 min: ainda sem escalão nem cor');
    const antes = g.ev('JSON.stringify(state)');
    g.ev("executarAcaoAdega('engarrafar')");
    ok(g.ev('JSON.stringify(state)') === antes, '(a) 8 h 59 min: engarrafar recusa sem mexer em nada');
    ok(/9h/.test(g.ev('adegaMensagemAtual')) && !/\bdias?\b/.test(g.ev('adegaMensagemAtual')), '(a) a recusa diz o tempo em horas: ' + g.ev('adegaMensagemAtual'));
    ok(/^O lote ainda está a descansar na cave\. Só pode ser engarrafado quando ficar Jovem, ao fim de 9h\.$/.test(g.ev("t('adega.paginaAindaDescansa').replace('{tempo}', formatarDiasAdega(REGRAS_DESCANSO_CAVE.diasMinimos))")), '(a) a página do lote diz «ao fim de 9h»');
  }
  [[9, 'adega.garrafaJovem', 1, 30], [18, 'adega.garrafaDourado', 2, 40], [27, 'adega.garrafaAmbar', 3, 50], [36, 'adega.garrafaCobre', 4, 60], [45, 'adega.garrafaCobre', 5, 60]].forEach(function (c) {
    ['verao', 'inverno'].forEach(function (est) {
      const g = abrir({ estacao: est });
      g.lote(c[0] * H);
      ok(g.ev('Math.floor(diasDescansadosNaCave())') === c[2], '(a) ' + c[0] + ' h = escalão ' + c[2]);
      ok(g.ev('estadoGarrafaLote(diasDescansadosNaCave()).atual.nomeKey') === c[1], '(a) ' + c[0] + ' h = ' + c[1]);
      const rep0 = g.ev('state.reputacao');
      g.ev("executarAcaoAdega('engarrafar')");
      const rep = c[3] + (est === 'inverno' ? 10 : 0);
      ok(g.ev('state.reputacao') - rep0 === rep, '(b) ' + c[0] + ' h (' + est + '): +' + rep + ' de Reputação (deu ' + (g.ev('state.reputacao') - rep0) + ')');
      const h = g.json('state.adega.historico');
      ok(h.length === 1 && h[0].diasDescanso === c[2] && g.ev('state.adega.lote') === null && g.ev('state.garrafas') === 1, '(b) ' + c[0] + ' h: grava diasDescanso = ' + c[2] + ' (o escalão)');
      ok(g.ev('adegaGarrafaFeita.nomeKey') === c[1], '(b) ' + c[0] + ' h: a garrafa feita é ' + c[1]);
    });
  });

  // ---------------- (c) Garrafas antigas e regras ----------------
  {
    const g = abrir();
    const cores = { 1: 'adega.garrafaJovem', 2: 'adega.garrafaDourado', 3: 'adega.garrafaAmbar', 4: 'adega.garrafaCobre', 7: 'adega.garrafaCobre' };
    Object.keys(cores).forEach(function (d) { ok(g.ev('garrafaPorDias(' + d + ').nomeKey') === cores[d], '(c) garrafa antiga com ' + d + ' (diasDescanso): ' + cores[d]); });
    g.ev("state.adega.historico = [{ data: 'x', estacao: 'inverno', diasDescanso: 1 }, { data: 'x', estacao: 'verao', diasDescanso: 2 }, { data: 'x', estacao: 'outono', diasDescanso: 3 }, { data: 'x', estacao: 'primavera', diasDescanso: 4 }, { data: 'x', estacao: 'inverno', diasDescanso: 0, festa: 'saomartinho' }];");
    ok(JSON.stringify(g.json('colecaoCoresFeitas(state)')) === JSON.stringify({ jovem: true, dourado: true, ambar: true, cobre: true }) && g.ev('colecaoResumo()') === '4 / 4', '(c) a Coleção das garrafas antigas fica igual (4 / 4)');
    ok(JSON.stringify(g.json('colecaoQuantidadesPorCor(state)')) === JSON.stringify({ jovem: 1, dourado: 1, ambar: 1, cobre: 1, saoMartinho: 1 }), '(c) as quantidades por cor ficam iguais');
    ok(g.ev('garrafaQueMaisDescansou()') === 4, '(c) a garrafa que mais descansou continua a de 4');
    ok(g.ev('garrafaLegenda(garrafaPorDias(3))') === 'Âmbar', '(c) a legenda é só a cor («Âmbar», nunca «3 dias»)');
  }
  ok(/\{ id: 'cap5', nivel: 5, falante: 'Chizo', criterio: \[\{ tipo: 'algumaEntrada', caminho: 'adega\.historico', campo: 'diasDescanso', alvo: 3 \}\] \}/.test(fontes['capitulos.js']), '(c) o capítulo 5 continua a pedir o escalão 3');
  ok(/\{ id: 'cap6', nivel: 6, criterio: \[\{ tipo: 'coresColecao', alvo: 4 \}\] \}/.test(fontes['capitulos.js']), '(c) o capítulo 6 continua a pedir as 4 cores');
  ok(/e\.diasDescanso >= 3; \}\);\n    \} \},\n  \{ id: 'reserva_especial'/.test(fontes['conquistas.js']) && /e\.diasDescanso >= 4; \}\);/.test(fontes['conquistas.js']), '(c) Paciência (3) e Reserva Especial (4) iguais');
  ok(/reputacaoPorDias: \[\n    \{ dias: 1, reputacao: 30 \},\n    \{ dias: 2, reputacao: 40 \},\n    \{ dias: 3, reputacao: 50 \},\n    \{ dias: 4, reputacao: 60 \}\n  \],/.test(fontes['garrafa.js']) && /bonusInvernoReputacao: 10/.test(fontes['garrafa.js']), '(b) a tabela da Reputação é a de antes');

  // ---------------- (d) Lote a meio e ?dias= ----------------
  {
    const g = abrir();
    g.lote(20 * H); // antes: 0,83 dias, sem cor
    const lote = g.ev('JSON.stringify(state.adega.lote)');
    ok(g.ev('Math.floor(diasDescansadosNaCave())') === 2 && g.ev('estadoGarrafaLote(diasDescansadosNaCave()).atual.nomeKey') === 'adega.garrafaDourado', '(d) lote começado há 20 h: 2 escalões (Dourado)');
    ok(g.ev('JSON.stringify(state.adega.lote)') === lote, '(d) ler o lote não mexe no estado gravado');
    g.ev("executarAcaoAdega('engarrafar')");
    ok(g.json('state.adega.historico')[0].diasDescanso === 2, '(d) e engarrafa como Dourado (2)');
    const t = abrir({ search: '?dias=3' });
    t.lote(1 * H);
    ok(t.ev('diasDescansadosNaCave()') === 3 && t.ev('estadoGarrafaLote(diasDescansadosNaCave()).atual.nomeKey') === 'adega.garrafaAmbar', '(d) ?dias=3 conta 3 escalões (Âmbar)');
  }

  // ---------------- (e) Tempos em horas e minutos ----------------
  {
    const g = abrir();
    const casos = [['formatarFaltaGarrafa(27 * 3600000)', '27 h'], ['formatarFaltaGarrafa(26 * 3600000 + 5 * 60000)', '26 h 5 min'], ['formatarFaltaGarrafa(30 * 60000)', '30 min'],
      ['formatarDiasAdega(4)', '36h'], ['formatarDiasAdega(1)', '9h'], ['formatarDiasAdega(0.5)', '4h 30m'], ['formatarDiasAdega(1 / 18)', '30m'], ['formatarDiasAdega(10)', '90h']];
    casos.forEach(function (c) { ok(g.ev(c[0]) === c[1], '(e) ' + c[0] + ' = «' + c[1] + '» (deu «' + g.ev(c[0]) + '»)'); });
    ok(g.ev('estadoGarrafaLote(0.5).msAteProxima') === 4.5 * H && g.ev('estadoGarrafaLote(2.5).msAteProxima') === 4.5 * H, '(e) a próxima cor vem 4 h 30 min depois de meio escalão');
    g.lote(2 * H);
    ok(g.ev('sufixoFaltaEngarrafar(diasDescansadosNaCave())') === ' (falta 7 h)', '(e) a página do lote: «(falta 7 h)», deu ' + g.ev('sufixoFaltaEngarrafar(diasDescansadosNaCave())'));
    ok(!/\d\s?d\b/.test(g.ev('formatarFaltaGarrafa(40 * 3600000)') + g.ev('formatarDiasAdega(5)')), '(e) nunca «d» de dias');
  }

  // ---------------- (f) Textos e as 24 h ----------------
  {
    const g = abrir();
    const DESCANSO = /(descans|repos|rest|cave|cellar|cava|lote|batch|garrafa|bottle|botella)/i, DIAS = /\b(dias?|days?|d[ií]as?)\b/i;
    ['pt', 'en', 'es'].forEach(function (l) {
      const T = g.json('TRANSLATIONS.' + l);
      const maus = Object.keys(T).filter(function (k) { return /^(adega|garrafa|conquista\.(paciencia|reserva_especial))\./.test(k) && DESCANSO.test(k + ' ' + T[k]) && DIAS.test(T[k]); });
      ok(maus.length === 0, '(f) ' + l + ': textos do descanso ainda com «dias»: ' + maus.map(function (k) { return k + '=' + T[k]; }).join(' | '));
      ok(['adega.colecaoDias1', 'adega.colecaoDias2', 'adega.colecaoDias3'].every(function (k) { return typeof T[k] === 'string' && T[k].indexOf('{n}') !== -1; }), '(f) ' + l + ': as chaves adega.colecaoDias1/2/3 continuam');
      ok(T['adega.msgAindaNaoPode'].indexOf('{tempo}') !== -1 && T['adega.paginaAindaDescansa'].indexOf('{tempo}') !== -1 && T['adega.reservaMaisDescansou'].indexOf('{cor}') !== -1 && T['adega.reservaMaisDescansouUm'].indexOf('{cor}') !== -1, '(f) ' + l + ': as mensagens usam {tempo} e {cor}');
      ok(!('adega.garrafaDias' in T) && !('adega.garrafaDiasUm' in T), '(f) ' + l + ': a legenda já não usa «{n} dias»');
      ok(/Âmbar|Amber|Ámbar/.test(T['conquista.paciencia.desc']) && /Cobre|Copper/.test(T['conquista.reserva_especial.desc']), '(f) ' + l + ': as conquistas falam da cor');
    });
    const cap5 = fontes['capitulos.js'].match(/cap5: \{ titulo: '[^']*', objetivo: '[^']*' \}/g) || [];
    ok(cap5.length === 3 && cap5.every(function (x) { return !DIAS.test(x) && /Âmbar|Amber|Ámbar/.test(x); }), '(f) o objetivo do capítulo 5 diz «até ficar Âmbar» nas 3 línguas');
    const codigo = fontes['garrafa.js'].replace(/\/\/.*$/gm, '');
    ok(!/24 \* 60|\b1440\b|86400000/.test(codigo), '(f) não há 24 h escritas no js/garrafa.js');
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
  ['escalão volta às 24 h', 'garrafa.js', 'const CAVE_ESCALAO_MS = 9 * 60 * 60 * 1000;', 'const CAVE_ESCALAO_MS = 24 * 60 * 60 * 1000;'],
  ['escalão de 8 h', 'garrafa.js', 'const CAVE_ESCALAO_MS = 9 * 60 * 60 * 1000;', 'const CAVE_ESCALAO_MS = 8 * 60 * 60 * 1000;'],
  ['o lote conta em dias', 'garrafa.js', "'iniciadoEm', agora)) / CAVE_ESCALAO_MS;", "'iniciadoEm', agora)) / (24 * 60 * 60 * 1000);"],
  ['a contagem «falta» em dias', 'garrafa.js', 'const DIA_MS = CAVE_ESCALAO_MS;', 'const DIA_MS = 24 * 60 * 60 * 1000;'],
  ['formatar volta a «1d 3h»', 'garrafa.js', "  const horas = Math.floor(totalMin / 60);\n  const minutos = totalMin % 60;\n  if (horas > 0) return horas + 'h' + (minutos > 0 ? ' ' + minutos + 'm' : '');", "  const horas = Math.floor(totalMin / 60) % 24;\n  const minutos = totalMin % 60;\n  if (totalMin >= 1440) return Math.floor(totalMin / 1440) + 'd' + (horas > 0 ? ' ' + horas + 'h' : '');\n  if (horas > 0) return horas + 'h' + (minutos > 0 ? ' ' + minutos + 'm' : '');"],
  ['a falta volta aos dias', 'garrafa.js', "  const h = Math.floor(totalMin / 60);\n  const m = totalMin % 60;\n  if (h > 0)", "  const h = Math.floor(totalMin / 60) % 24;\n  const m = totalMin % 60;\n  if (totalMin >= 1440) return Math.floor(totalMin / 1440) + ' d';\n  if (h > 0)"],
  ['mínimo de 2 escalões', 'garrafa.js', '  diasMinimos: 1, // em escalões', '  diasMinimos: 2, // em escalões'],
  ['Reputação mudada', 'garrafa.js', '    { dias: 3, reputacao: 50 },', '    { dias: 3, reputacao: 55 },'],
  ['grava as horas em vez do escalão', 'garrafa.js', "a.historico.push({ data: state.ultimaGarrafaData, estacao: estacaoAtual(), diasDescanso: diasCompletos });", "a.historico.push({ data: state.ultimaGarrafaData, estacao: estacaoAtual(), diasDescanso: diasCompletos * 9 });"],
  ['a legenda volta a dizer dias', 'garrafa.js', '  return t(g.nomeKey);\n}', "  return t(g.nomeKey) + ' · ' + g.dias + ' dias';\n}"],
  ['a Reserva volta aos dias', 'i18n.js', "'adega.reservaMaisDescansou': 'A tua garrafa que mais descansou: {cor}.'", "'adega.reservaMaisDescansou': 'A tua garrafa que mais descansou: {cor} dias.'"],
  ['a conquista volta aos dias (EN)', 'i18n.js', "'conquista.paciencia.desc': 'Let a bottle rest in the Cellar until it turns Amber.'", "'conquista.paciencia.desc': 'Let a bottle rest in the Cellar for 3 days or more.'"],
  ['o capítulo 5 volta aos dias (ES)', 'capitulos.js', "objetivo: 'Deja reposar una botella en la Cava hasta que quede Ámbar.'", "objetivo: 'Deja reposar una botella 3 días o más en la Cava.'"],
  ['o capítulo 5 muda de regra', 'capitulos.js', "campo: 'diasDescanso', alvo: 3 }", "campo: 'diasDescanso', alvo: 27 }"]
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
