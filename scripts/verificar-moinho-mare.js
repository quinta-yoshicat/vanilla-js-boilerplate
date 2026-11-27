#!/usr/bin/env node
// "Moinho de Maré da Mourisca" (nível 10, bloco da oferta às visitas na Estrada): a espera de 6 horas e a recompensa de 1 vez por dia
// (estradaMoinhoEstado, estradaMoinhoFechar, estradaMoinhoSoltar, estradaMoinhoHtml e estradaMoinhoClique, js/estrada.js), os valores em
// ESTRADA_MOINHO_MARE (js/estrada-dados.js), state.moinho { fechadoEm, dia } (js/state.js), os textos nas 3 línguas, as 2 fotos novas e a
// entrada da Enciclopédia «moinho_mare_mourisca» (dados/enciclopedia.js). Copiado de scripts/verificar-mesa-sado.js (a Mesa do Sado, que
// continua a ter o seu). Corre state.js, i18n.js, niveis.js (mais os níveis de dados/niveis.js), caderno.js, capitulos.js,
// estrada-dados.js, despensa.js, estrada.js, lagar.js e dados.js REAIS, mais o bloco de regras do relógio de tempo.js e formatarTempoVinha de
// vinha.js, num ambiente simulado (vm), sem browser nem conta real. A junção na nuvem está em verificar-nuvem-juntar.js.
//
// Uso: node scripts/verificar-moinho-mare.js
// ESTRADA_JS=caminho  corre sobre outra versão de js/estrada.js (provas negativas).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { injetarRegrasTempo } = require('./_regras-tempo.js');

const RAIZ = path.join(__dirname, '..');
const ESTRADA_JS = process.env.ESTRADA_JS || path.join(RAIZ, 'js', 'estrada.js');
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }
const ler = function (f) { return fs.readFileSync(f, 'utf8'); };
const semComentarios = function (s) { return s.replace(/\/\/.*$/gm, ''); };

// Relógio do ambiente: __agora (Date.now) e __dia (dia de Lisboa); mudam com g.ev('__agora = ...').
function abrir(guardadoInicial) {
  const guardado = {};
  if (guardadoInicial) guardado.yoshicat_quinta_state_v2 = JSON.stringify(guardadoInicial);
  const gravacoes = [];
  const elementos = {};
  const intervalos = [];
  const el = function (id) { return elementos[id] || (elementos[id] = { innerHTML: '' }); };
  let ativo = null; // o id do ecrã ativo (.screen.active)
  const sb = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(guardado, k) ? guardado[k] : null; },
      setItem: function (k, v) { gravacoes.push(k); guardado[k] = String(v); },
      removeItem: function (k) { delete guardado[k]; }
    },
    location: { search: '' },
    URLSearchParams: URLSearchParams,
    document: {
      querySelectorAll: function () { return []; }, getElementById: el, addEventListener: function () {},
      querySelector: function (sel) { return sel === '.screen.active' ? (ativo ? { id: ativo } : null) : { disabled: false }; }
    },
    setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {}, Date: (function () { class D extends Date {} return D; })(),
    setInterval: function (f, ms) { intervalos.push({ f: f, ms: ms }); return intervalos.length; }
  };
  sb.window = sb;
  sb.Telegram = { WebApp: {} };
  const cx = vm.createContext(sb);
  vm.runInContext(ler(path.join(RAIZ, 'js', 'state.js')), cx, { filename: 'state.js' });
  vm.runInContext(ler(path.join(RAIZ, 'js', 'i18n.js')), cx, { filename: 'i18n.js' });
  vm.runInContext(`
    var __dia = '2026-10-09', __agora = 1790000000000, __sons = [], __barra = 0, __vibras = [], __linhas = 0;
    Date.now = function () { return __agora; };
    function mostrarFalas() {} function vibrar(v) { __vibras.push(v); } function tocarSom(s) { __sons.push(s); } function updateStatsDisplays() { __barra++; }
    function atualizarLinhaVisitaQuinta() { __linhas++; }
    function localeAtual() { return 'pt-PT'; }
    function diaLisboaDeHoje() { return __dia; }
  `, cx);
  injetarRegrasTempo(cx); // carimboCorrigirFuturo (o mesmo da Vinha)
  // formatarTempoVinha, a verdadeira (js/vinha.js): é o formato das outras esperas do jogo.
  const vinha = ler(path.join(RAIZ, 'js', 'vinha.js'));
  const fmt = /function formatarTempoVinha\(ms\) \{[\s\S]*?\n\}\n/.exec(vinha);
  if (!fmt) throw new Error('js/vinha.js sem formatarTempoVinha');
  vm.runInContext(fmt[0], cx, { filename: 'vinha.js (formatarTempoVinha)' });
  ['niveis.js', 'caderno.js', 'capitulos.js', 'estrada-dados.js', 'despensa.js'].forEach(function (f) { vm.runInContext(ler(path.join(RAIZ, 'js', f)), cx, { filename: f }); });
  vm.runInContext(ler(ESTRADA_JS), cx, { filename: 'estrada.js' });
  ['lagar.js', 'dados.js'].forEach(function (f) { vm.runInContext(ler(path.join(RAIZ, 'js', f)), cx, { filename: f }); });
  vm.runInContext(ler(path.join(RAIZ, 'dados', 'niveis.js')), cx, { filename: 'dados/niveis.js' });
  // Conta as chamadas a saveState (cada uma pode escrever mais do que uma chave no localStorage).
  vm.runInContext('var __saves = 0; var __saveReal = saveState; saveState = function (s) { __saves++; return __saveReal(s); };', cx);
  const g = { cx: cx, gravacoes: gravacoes, guardado: guardado, intervalos: intervalos };
  g.ev = function (c) { return vm.runInContext(c, cx); };
  g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
  g.estado = function () { return vm.runInContext('JSON.stringify(state)', cx); };
  g.ecra = function (id) { ativo = id; };
  g.html = function (lingua) { if (lingua) vm.runInContext('currentLang = ' + JSON.stringify(lingua), cx); return vm.runInContext('estradaMoinhoHtml()', cx); };
  g.estadoMoinho = function (dia, agora) { return g.json('estradaMoinhoEstado(state, ' + JSON.stringify(dia) + ', ' + agora + ')'); };
  return g;
}

const HORA = 3600000;
const T0 = 1790000000000;      // o "agora" do ambiente
const REP10 = 2800;            // o nível 10 vem de js/niveis.js: 2800 de Reputação (um a menos é o nível 9)
const cheia = function (rep, extra) {
  return Object.assign({ reputacao: rep === undefined ? REP10 : rep, uvas: 100, garrafas: 4, ultimaGravacaoEm: 1, acesso: { jogadorAntigo: false, introMostrada: true } }, extra || {});
};
const sem = function (o, chaves) { const c = JSON.parse(JSON.stringify(o)); chaves.forEach(function (k) { delete c[k]; }); return c; };

// 1. Os valores e as imagens.
{
  const g = abrir(cheia());
  ok(g.ev('ESTRADA_MOINHO_MARE.nivelMinimo') === 10, 'a partir do nível 10');
  ok(g.ev('ESTRADA_MOINHO_MARE.esperaMs') === 6 * HORA, 'espera de 6 horas');
  ok(g.ev('ESTRADA_MOINHO_MARE.reputacao') === 10, '+10 de Reputação');
  ok(g.ev('ESTRADA_MOINHO_MARE.imagemFechar') === 'assets/ecras/moinho_mare_a.jpg' && g.ev('ESTRADA_MOINHO_MARE.imagemSoltar') === 'assets/ecras/moinho_mare_b.jpg', 'imagens A (fechar) e B (soltar)');
  ok(g.ev('NIVEIS_CONFIG[9].min') === REP10 && g.ev('nivelPelaReputacao(' + REP10 + ')') === 10 && g.ev('nivelPelaReputacao(' + (REP10 - 1) + ')') === 9, 'premissa: 2800 de Reputação é o nível 10');
  ['moinho_mare_a.jpg', 'moinho_mare_b.jpg'].forEach(function (nome) {
    const f = path.join(RAIZ, 'assets', 'ecras', nome);
    ok(fs.existsSync(f), 'existe assets/ecras/' + nome);
    if (!fs.existsSync(f)) return;
    const b = fs.readFileSync(f);
    // JPEG: procura o marcador SOF (0xFFC0 a 0xFFC2) para ler a altura e a largura.
    let i = 2, w = 0, h = 0;
    while (i < b.length) { if (b[i] !== 0xff) { i++; continue; } const m = b[i + 1]; if (m >= 0xc0 && m <= 0xc2) { h = b.readUInt16BE(i + 5); w = b.readUInt16BE(i + 7); break; } i += 2 + b.readUInt16BE(i + 2); }
    ok(b[0] === 0xff && b[1] === 0xd8 && w === 720 && h > 0 && h < w, nome + ' é um JPEG de 720 px de largura e horizontal (tem ' + w + 'x' + h + ')');
    ok(b.length <= 250 * 1024, nome + ' não devia pesar mais de 250 KB (pesa ' + b.length + ')');
  });
  ['1795814396244.jpg', '1795814684715.jpg'].forEach(function (n) { ok(fs.existsSync(path.join(RAIZ, 'imagens_JOGO_TELEGRAM', n)), 'o original imagens_JOGO_TELEGRAM/' + n + ' continua no sítio'); });
}

// 2. O ciclo completo: fechar, esperar, soltar. Só mudam state.moinho e a Reputação (não gasta nada).
{
  const g = abrir(cheia());
  const novo = g.json('estradaMoinhoEstado(state, "2026-10-09", ' + T0 + ')');
  ok(novo.ok === true && novo.fase === 'fechar' && novo.motivo === null, 'comporta aberta: pode fechar-se: ' + JSON.stringify(novo));
  ok(JSON.stringify(g.json('state.moinho')) === '{"fechadoEm":null,"dia":null}', 'jogo novo: moinho { fechadoEm: null, dia: null }');
  const antes = JSON.parse(g.estado());
  // Soltar sem ter fechado: recusa sem alterar nada.
  const a0 = g.estado();
  const semFechar = g.json('estradaMoinhoSoltar(state, "2026-10-09", ' + T0 + ')');
  ok(!semFechar.ok && semFechar.reputacaoGanha === 0 && g.estado() === a0, 'soltar sem ter fechado: recusado sem alterar nada: ' + JSON.stringify(semFechar));
  // Fechar.
  const f = g.json('estradaMoinhoFechar(state, "2026-10-09", ' + T0 + ')');
  ok(f.ok === true && g.ev('state.moinho.fechadoEm') === T0 && g.ev('state.moinho.dia') === null, 'fechar guarda o carimbo (Date.now) e não marca o dia: ' + JSON.stringify(f));
  const esperado = JSON.parse(JSON.stringify(antes)); esperado.moinho = { fechadoEm: T0, dia: null };
  ok(g.estado() === JSON.stringify(esperado), 'fechar só muda state.moinho (nem Reputação, nem uvas, nem garrafas, nem despensa, nem lagar)');
  // Fechar outra vez durante a espera: recusado.
  const a1 = g.estado();
  ok(!g.json('estradaMoinhoFechar(state, "2026-10-09", ' + (T0 + HORA) + ')').ok && g.estado() === a1, 'fechar de novo com a comporta já fechada: recusado sem alterar nada (o carimbo não se renova)');
  // Durante a espera: quanto falta.
  [[0, 6 * HORA], [HORA, 5 * HORA], [5 * HORA + 59 * 60000, 60000], [6 * HORA - 1, 1]].forEach(function (c) {
    const e = g.estadoMoinho('2026-10-09', T0 + c[0]);
    ok(!e.ok && e.fase === 'espera' && e.motivo === 'espera' && e.restanteMs === c[1], 'a ' + c[0] + ' ms: ainda faltam ' + c[1] + ' ms: ' + JSON.stringify(e));
  });
  const a2 = g.estado();
  const cedo = g.json('estradaMoinhoSoltar(state, "2026-10-09", ' + (T0 + 6 * HORA - 1) + ')');
  ok(!cedo.ok && cedo.motivo === 'espera' && cedo.reputacaoGanha === 0 && g.estado() === a2, 'soltar 1 ms antes das 6 horas: recusado sem alterar nada: ' + JSON.stringify(cedo));
  // Passadas as 6 horas (à hora exata e depois).
  ok(g.estadoMoinho('2026-10-09', T0 + 6 * HORA).fase === 'soltar' && g.estadoMoinho('2026-10-09', T0 + 6 * HORA).ok === true, 'às 6 horas exatas: pode soltar');
  const s = g.json('estradaMoinhoSoltar(state, "2026-10-09", ' + (T0 + 7 * HORA) + ')');
  ok(s.ok === true && s.reputacaoGanha === 10 && s.motivo === null, 'soltar: +10 de Reputação: ' + JSON.stringify(s));
  const fim = JSON.parse(g.estado());
  const esp2 = JSON.parse(JSON.stringify(antes)); esp2.reputacao = REP10 + 10; esp2.moinho = { fechadoEm: null, dia: '2026-10-09' };
  ok(JSON.stringify(fim) === JSON.stringify(esp2), 'soltar só muda Reputação (+10) e state.moinho (carimbo a null, dia marcado): não gasta nada');
  // Só 1 recompensa por dia.
  const a3 = g.estado();
  ok(g.estadoMoinho('2026-10-09', T0 + 8 * HORA).motivo === 'ja_hoje', 'o estado diz ja_hoje');
  ok(!g.json('estradaMoinhoFechar(state, "2026-10-09", ' + (T0 + 8 * HORA) + ')').ok && g.estado() === a3, 'no mesmo dia já não se fecha outra vez');
  // No dia seguinte, um novo ciclo.
  const T1 = T0 + 24 * HORA;
  ok(g.json('estradaMoinhoFechar(state, "2026-10-10", ' + T1 + ')').ok === true, 'no dia seguinte fecha-se outra vez');
  ok(g.json('estradaMoinhoSoltar(state, "2026-10-10", ' + (T1 + 6 * HORA) + ')').ok === true && g.ev('state.reputacao') === REP10 + 20 && g.ev('state.moinho.dia') === '2026-10-10', 'e solta-se: mais 10 (2 dias, 2 recompensas)');
}

// 3. Uma recompensa por dia de Lisboa, mesmo com a comporta fechada na véspera: fecha-se às 23h e solta-se na manhã seguinte (outro dia).
{
  const g = abrir(cheia(REP10, { moinho: { fechadoEm: T0, dia: '2026-10-08' } }));
  const e = g.estadoMoinho('2026-10-09', T0 + 6 * HORA);
  ok(e.ok && e.fase === 'soltar', 'fechada num dia, solta-se noutro (o dia da recompensa é o de soltar)');
  ok(g.json('estradaMoinhoSoltar(state, "2026-10-09", ' + (T0 + 6 * HORA) + ')').ok && g.ev('state.moinho.dia') === '2026-10-09', 'a recompensa fica marcada no dia em que se solta');
  // Carimbo guardado, mas o dia de hoje já tem recompensa (nuvem, por exemplo): ja_hoje manda; no dia seguinte já pode soltar.
  const h = abrir(cheia(REP10, { moinho: { fechadoEm: T0, dia: '2026-10-09' } }));
  ok(h.estadoMoinho('2026-10-09', T0 + 7 * HORA).motivo === 'ja_hoje' && h.estadoMoinho('2026-10-10', T0 + 7 * HORA).fase === 'soltar', 'com a recompensa de hoje já dada, só amanhã');
}

// 4. Proteção contra o relógio atrás (como na Mesa do Sado) e contra um carimbo no futuro.
{
  const g = abrir(cheia(REP10, { moinho: { fechadoEm: null, dia: '2026-10-09' } }));
  const a = g.estado();
  const e = g.estadoMoinho('2026-10-08', T0);
  ok(!e.ok && e.motivo === 'dia_anterior' && e.fase === null, 'dia anterior ao da última recompensa: diz dia_anterior');
  ok(!g.json('estradaMoinhoFechar(state, "2026-10-08", ' + T0 + ')').ok && g.estado() === a, 'com o relógio atrás não se fecha a comporta (sem alterar nada)');
  const h = abrir(cheia(REP10, { moinho: { fechadoEm: T0 - 10 * HORA, dia: '2026-10-09' } }));
  const a2 = h.estado();
  const r = h.json('estradaMoinhoSoltar(state, "2026-10-08", ' + T0 + ')');
  ok(!r.ok && r.motivo === 'dia_anterior' && r.reputacaoGanha === 0 && h.estado() === a2, 'com o relógio atrás não se solta a água (sem alterar nada): ' + JSON.stringify(r));
  // Carimbo no futuro (relógio do aparelho mexido): conta como "agora", a espera fica inteira, e o desenho repõe o carimbo em "agora".
  const f = abrir(cheia(REP10, { moinho: { fechadoEm: T0 + 100 * HORA, dia: null } }));
  const ef = f.estadoMoinho('2026-10-09', T0);
  ok(!ef.ok && ef.fase === 'espera' && ef.restanteMs === 6 * HORA, 'carimbo no futuro: a espera conta inteira (6 horas), não fica bloqueada para sempre: ' + JSON.stringify(ef));
  ok(f.ev('state.moinho.fechadoEm') === T0 + 100 * HORA, 'ler o estado (estradaMoinhoEstado) não altera o carimbo');
  const saves0 = f.ev('__saves');
  f.html('pt');
  ok(f.ev('state.moinho.fechadoEm') === T0 && f.ev('__saves') === saves0 + 1, 'ao desenhar, o carimbo no futuro repõe-se em "agora" (carimboCorrigirFuturo, como na Vinha) e grava');
  f.ev('__agora = ' + (T0 + 6 * HORA));
  ok(f.estadoMoinho('2026-10-09', T0 + 6 * HORA).fase === 'soltar', '6 horas depois do carimbo reposto, já se pode soltar (o tempo avança)');
  const saves1 = f.ev('__saves');
  f.html('pt');
  ok(f.ev('__saves') === saves1, 'um carimbo normal nunca é tocado nem gravado ao desenhar');
  // Carimbos estranhos contam como "sem comporta fechada".
  [null, 'x', -5, 0, 1.5, {}, [], NaN].forEach(function (c) {
    const k = abrir(cheia(REP10)); k.ev('state.moinho.fechadoEm = ' + (typeof c === 'number' && isNaN(c) ? 'NaN' : JSON.stringify(c)));
    ok(k.estadoMoinho('2026-10-09', T0).fase === 'fechar', 'carimbo inválido (' + JSON.stringify(c) + '): conta como comporta aberta');
  });
}

// 5. A porta do nível 10: abaixo dele (até um jogador antigo) não há moinho, não se grava nada e o cartão não o mostra.
{
  [['nível 9 (2799)', REP10 - 1, false], ['nível 9 de jogador antigo', REP10 - 1, true], ['nível 1', 0, false]].forEach(function (c) {
    const g = abrir(cheia(c[1], { acesso: { jogadorAntigo: c[2], introMostrada: true } }));
    const antes = g.estado();
    ok(g.estadoMoinho('2026-10-09', T0).motivo === 'nivel_insuficiente', c[0] + ': o estado diz nivel_insuficiente');
    ok(!g.json('estradaMoinhoFechar(state, "2026-10-09", ' + T0 + ')').ok && g.estado() === antes, c[0] + ': não fecha, sem alterar nada');
    ok(g.html() === '' && g.ev('estradaOfertaHtml()').indexOf('moinho-mare') === -1, c[0] + ': o cartão não mostra o moinho');
  });
  const g = abrir(cheia(REP10));
  ok(g.html().indexOf('moinho-mare') !== -1 && g.ev('estradaOfertaHtml()').indexOf('moinho-mare') !== -1, 'nível 10 (2800): o cartão mostra o moinho, também sem a visita de hoje tocada');
  ok(abrir(cheia(REP10 + 9000)).estadoMoinho('2026-10-09', T0).fase === 'fechar', 'níveis acima do 10: também pode');
  const n = abrir(cheia(REP10 - 1)); n.ev('state.moinho.fechadoEm = ' + T0);
  ok(n.estadoMoinho('2026-10-09', T0 + 7 * HORA).motivo === 'nivel_insuficiente', 'o nível vem antes do resto');
  // Entradas inválidas.
  const k = abrir(cheia(REP10));
  ok(k.json('estradaMoinhoEstado(state, "ontem", ' + T0 + ')').motivo === 'dia_invalido' && k.json('estradaMoinhoEstado(state, 5, ' + T0 + ')').motivo === 'dia_invalido' && k.json('estradaMoinhoEstado(state, "2026-10-09", "x")').motivo === 'dia_invalido', 'dia ou instante inválidos: recusa (dia_invalido)');
  ok(k.json('estradaMoinhoEstado(null, "2026-10-09", ' + T0 + ')').ok === false, 'estado null: recusa sem rebentar');
}

// 6. Sem custo e sem assalto dos porcos: nada da Despensa, das uvas, das garrafas nem do Lagar muda; o dia do moinho não é o da Mesa do Sado.
{
  const bens = { queijo_azeitao: 2, sal_sado: 1 };
  const g = abrir(cheia(REP10, { despensa: { recebidos: bens, entregues: {}, primeiraTroca: {}, hoje: { dia: null, feitas: {} } }, lagar: { ultimoDia: '2026-10-05', dias: 2, mesaDia: '2026-10-06', mesaSadoDia: '2026-10-07', assaltoDia: '2026-10-08' } }));
  const antes = JSON.parse(g.estado());
  g.ev('estradaMoinhoFechar(state, "2026-10-09", ' + T0 + '); estradaMoinhoSoltar(state, "2026-10-09", ' + (T0 + 6 * HORA) + ')');
  const depois = JSON.parse(g.estado());
  ok(JSON.stringify(depois.despensa) === JSON.stringify(antes.despensa) && depois.uvas === 100 && depois.garrafas === 4 && depois.gotas === antes.gotas, 'não gasta Despensa, uvas, garrafas nem gotas');
  ok(JSON.stringify(depois.lagar) === JSON.stringify(antes.lagar), 'state.lagar fica exatamente igual (nem mesaDia, nem mesaSadoDia, nem assaltoDia)');
  ok(depois.reputacao === REP10 + 10 && sem(depois, ['reputacao', 'moinho']).uvas === 100, 'só a Reputação sobe');
  const src = semComentarios(ler(ESTRADA_JS));
  const corpo = src.slice(src.indexOf('function estradaMoinhoNivelOk'));
  ok(!/assalto|Assalto|lagarAssalto|despensaRegistar|despensaMesaVindima|Math\.random/.test(corpo), 'o moinho não tem assalto dos porcos, não gasta bens da Despensa e não sorteia nada');
  // A Mesa do Sado e o moinho no mesmo dia: independentes.
  const m = abrir(cheia(8650, { despensa: { recebidos: { choco_sado: 1, ostras_sado: 1, peixe_livramento: 1 }, entregues: {}, primeiraTroca: {}, hoje: { dia: null, feitas: {} } } }));
  ok(m.json('despensaMesaVindima(state, "2026-10-09", estradaMesaSadoReceita())').ok === true, 'a Mesa do Sado põe-se');
  ok(m.json('estradaMoinhoFechar(state, "2026-10-09", ' + T0 + ')').ok === true && m.json('estradaMoinhoSoltar(state, "2026-10-09", ' + (T0 + 6 * HORA) + ')').ok === true, 'o moinho funciona no mesmo dia');
  ok(m.ev('state.reputacao') === 8650 + 15 + 10, 'as duas somam: +15 e +10');
}

// 7. O estado: por omissão, em saves antigos, e reparado (moinhoNormalizar e moinhoEstado).
{
  ok(JSON.stringify(abrir().json('state.moinho')) === '{"fechadoEm":null,"dia":null}', 'jogo novo: moinho { fechadoEm: null, dia: null }');
  const velho = abrir({ reputacao: 1600, uvas: 5, lagar: { ultimoDia: '2026-10-05', dias: 2 } });
  ok(JSON.stringify(velho.json('state.moinho')) === '{"fechadoEm":null,"dia":null}' && velho.ev('state.reputacao') === 1600 && velho.ev('state.uvas') === 5, 'save antigo (sem moinho) ganha o valor por omissão e o resto fica');
  ok(JSON.stringify(velho.json('mergeDeep(defaultState(), { reputacao: 5 }).moinho')) === '{"fechadoEm":null,"dia":null}', 'estado da nuvem sem moinho ganha o valor por omissão');
  ok(JSON.stringify(velho.json('mergeDeep(defaultState(), { moinho: { fechadoEm: 1790000000000 } }).moinho')) === '{"fechadoEm":1790000000000,"dia":null}', 'estado da nuvem só com fechadoEm mantém-no e dá null ao dia');
  ok(JSON.stringify(velho.json('mergeDeep(defaultState(), { moinho: { dia: "2026-10-01" } }).moinho')) === '{"fechadoEm":null,"dia":"2026-10-01"}', 'estado da nuvem só com dia mantém-no e dá null ao carimbo');
  const g = abrir(cheia());
  const N = function (x) { return JSON.stringify(g.json('moinhoNormalizar(' + x + ')')); };
  ok(N('null') === '{"fechadoEm":null,"dia":null}' && N('[]') === '{"fechadoEm":null,"dia":null}' && N('"x"') === '{"fechadoEm":null,"dia":null}' && N('5') === '{"fechadoEm":null,"dia":null}', 'moinhoNormalizar: null, lista, texto e número dão o valor por omissão');
  ok(N('{ fechadoEm: 1790000000000, dia: "2026-10-09" }') === '{"fechadoEm":1790000000000,"dia":"2026-10-09"}', 'moinhoNormalizar: um valor certo fica como está');
  ok(N('{ fechadoEm: "1790000000000", dia: 20261009 }') === '{"fechadoEm":null,"dia":null}' && N('{ fechadoEm: -1, dia: "2026-1-9" }') === '{"fechadoEm":null,"dia":null}' && N('{ fechadoEm: 1.5, dia: "ontem" }') === '{"fechadoEm":null,"dia":null}', 'moinhoNormalizar: tipos errados, negativos, frações e dias mal escritos dão null');
  ok(N('{ fechadoEm: 5, dia: null, x: 1, __proto__: { y: 2 } }') === '{"fechadoEm":5,"dia":null}', 'moinhoNormalizar: chaves estranhas ignoram-se');
  const e = abrir(cheia()); e.ev('state.moinho = null');
  ok(e.ev('moinhoEstado(state)') === e.ev('state.moinho') && JSON.stringify(e.json('state.moinho')) === '{"fechadoEm":null,"dia":null}', 'moinhoEstado repara state.moinho null');
  const f = abrir(cheia()); f.ev('state.moinho = { fechadoEm: "x", dia: 5 }; moinhoEstado(state)');
  ok(JSON.stringify(f.json('state.moinho')) === '{"fechadoEm":null,"dia":null}', 'moinhoEstado repara valores estranhos');
  // state.moinho estranho no meio de um ciclo: não rebenta.
  const h = abrir(cheia()); h.ev('state.moinho = null');
  ok(h.json('estradaMoinhoFechar(state, "2026-10-09", ' + T0 + ')').ok === true && h.ev('state.moinho.fechadoEm') === T0, 'state.moinho null: fechar recria-o e guarda o carimbo');
}

// 8. Textos nas 3 línguas, no estilo da Mesa do Sado, e as palavras que não podem aparecer.
{
  const g = abrir(cheia());
  const SUF = ['BtnFechar', 'BtnSoltar', 'Desc', 'Fechada', 'Espera', 'Pronto', 'Ok', 'JaHoje', 'Relogio', 'AltFechar', 'AltSoltar'];
  const chaves = SUF.map(function (s) { return 'estrada.moinho' + s; });
  ['pt', 'en', 'es'].forEach(function (l) {
    chaves.forEach(function (k) { const v = g.ev('TRANSLATIONS.' + l + '["' + k + '"]'); ok(typeof v === 'string' && v.trim() !== '', 'falta ' + k + ' em ' + l); });
  });
  const PT = { 'estrada.moinhoBtnFechar': 'Fechar a comporta', 'estrada.moinhoBtnSoltar': 'Soltar a água', 'estrada.moinhoJaHoje': 'Já soltaste a água hoje. Volta amanhã.' };
  Object.keys(PT).forEach(function (k) { ok(g.ev('TRANSLATIONS.pt["' + k + '"]') === PT[k], 'texto PT de ' + k); });
  [['estrada.moinhoDesc', ['{rep}']], ['estrada.moinhoOk', ['{rep}']], ['estrada.moinhoEspera', ['{tempo}']]].forEach(function (c) {
    ['pt', 'en', 'es'].forEach(function (l) { c[1].forEach(function (m) { ok(g.ev('TRANSLATIONS.' + l + '["' + c[0] + '"]').indexOf(m) !== -1, c[0] + ' sem ' + m + ' em ' + l); }); });
  });
  ok(/6 horas/.test(g.ev('TRANSLATIONS.pt["estrada.moinhoDesc"]')) && /6 hours/.test(g.ev('TRANSLATIONS.en["estrada.moinhoDesc"]')) && /6 horas/.test(g.ev('TRANSLATIONS.es["estrada.moinhoDesc"]')), 'a descrição diz as 6 horas nas 3 línguas');
  ok(/uma vez por dia/i.test(g.ev('TRANSLATIONS.pt["estrada.moinhoDesc"]')) && /once a day/i.test(g.ev('TRANSLATIONS.en["estrada.moinhoDesc"]')) && /una vez al d/i.test(g.ev('TRANSLATIONS.es["estrada.moinhoDesc"]')), 'a descrição diz "uma vez por dia" nas 3 línguas');
  ok(/n[aã]o gasta nada/i.test(g.ev('TRANSLATIONS.pt["estrada.moinhoDesc"]')) && /costs nothing/i.test(g.ev('TRANSLATIONS.en["estrada.moinhoDesc"]')) && /no gasta nada/i.test(g.ev('TRANSLATIONS.es["estrada.moinhoDesc"]')), 'a descrição diz que não gasta nada nas 3 línguas');
  ok(/YoshiCat/.test(g.ev('TRANSLATIONS.pt["estrada.moinhoAltFechar"]')) && /YoshiCat/.test(g.ev('TRANSLATIONS.en["estrada.moinhoAltSoltar"]')) && /el YoshiCat/.test(g.ev('TRANSLATIONS.es["estrada.moinhoAltFechar"]')) && /el YoshiCat/.test(g.ev('TRANSLATIONS.es["estrada.moinhoAltSoltar"]')), 'as legendas das fotos escrevem «YoshiCat» (em ES com artigo, como o resto do jogo)');
  ok(/Fygmo II/.test(g.ev('TRANSLATIONS.pt["estrada.moinhoOk"]')) && /Fygmo II/.test(g.ev('TRANSLATIONS.en["estrada.moinhoOk"]')) && /Fygmo II/.test(g.ev('TRANSLATIONS.es["estrada.moinhoOk"]')), 'o agradecimento fala do Fygmo II nas 3 línguas');
  ['pt', 'en', 'es'].forEach(function (l) {
    chaves.forEach(function (k) {
      const v = g.ev('TRANSLATIONS.' + l + '["' + k + '"]');
      ok(!/Fygmo 2/.test(v), k + ' (' + l + '): escreve-se «Fygmo II», nunca «Fygmo 2»');
      ok(!/\bMestre\b|\bbot\b|\bIA\b/i.test(v), k + ' (' + l + '): sem as palavras «Mestre», «bot» ou «IA»');
      ok(!/https?:|www\./i.test(v), k + ' (' + l + '): sem fontes nem ligações no jogo');
      ok(!/Yoshi_Cat/.test(v), k + ' (' + l + '): nos textos do jogo a personagem escreve-se «YoshiCat», nunca «Yoshi_Cat» (esse fica só nos créditos)');
    });
  });
}

// 9. O cartão e o clique: desenha só a ler (salvo o carimbo no futuro), o clique grava UMA vez; as fases e as imagens.
{
  const est = ler(ESTRADA_JS);
  const src = semComentarios(est);
  const corpoDe = function (nome) { const m = new RegExp('function ' + nome + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}\\n').exec(src); return m ? m[0] : ''; };
  const clique = corpoDe('estradaMoinhoClique');
  ok(clique !== '', 'existe estradaMoinhoClique em js/estrada.js');
  ok((clique.match(/saveState\(state\)/g) || []).length === 1 && clique.indexOf('updateStatsDisplays()') !== -1, 'o clique grava UMA vez e atualiza a barra de cima');
  ok(/if \(botao\) botao\.disabled = true;/.test(clique) && /estradaMoinhoOcupado/.test(clique), 'o clique apaga o botão e tem a guarda contra o clique duplo');
  ['estradaMoinhoNivelOk', 'estradaMoinhoEstado', 'estradaMoinhoTempo', 'estradaMoinhoHtml', 'estradaMoinhoCorrigirRelogio', 'estradaMoinhoRelogio'].forEach(function (f) {
    ok(corpoDe(f) !== '' && !/saveState|updateStatsDisplays|estradaMoinhoFechar|estradaMoinhoSoltar/.test(corpoDe(f)), f + ' só lê (não grava, não fecha, não solta, não atualiza a barra)');
  });
  ok(!/saveState|updateStatsDisplays/.test(corpoDe('estradaMoinhoFechar') + corpoDe('estradaMoinhoSoltar')), 'as regras (fechar e soltar) não gravam: quem as chama é que grava');
  ok((src.match(/estradaMoinhoFechar\(/g) || []).length === 2 && (src.match(/estradaMoinhoSoltar\(/g) || []).length === 2, 'só o clique (estradaMoinhoClique) chama as duas regras');
  ok(/function estradaOfertaHtml\(\) \{\s*return estradaOfertaVisitaHtml\(\) \+ estradaMoinhoHtml\(\) \+ estradaMesaSadoHtml\(\);\s*\}/.test(src), 'o moinho está no bloco da oferta (estradaOfertaHtml)');
  const html = ler(path.join(RAIZ, 'index.html'));
  const css = (/\.moinho-mare-img \{([^}]*)\}/.exec(html) || [0, ''])[1];
  ok(/width:\s*100%/.test(css) && /height:\s*auto/.test(css) && !/object-fit|object-position|\b(max-)?height:\s*\d+px/.test(css), 'a foto mostra-se a 100% da largura e com altura automática (sem object-fit que corte)');

  // Comportamento: desenha, clica, espera, clica, nas 3 línguas.
  const g = abrir(cheia());
  const estadoAntes = g.estado();
  const h0 = g.html('pt');
  ok(g.estado() === estadoAntes && g.ev('__saves') === 0, 'desenhar o cartão não altera o estado nem grava');
  ok(h0.indexOf('src="assets/ecras/moinho_mare_a.jpg"') !== -1 && /class="moinho-mare-img"/.test(h0) && h0.indexOf('moinho_mare_b') === -1, 'antes de fechar: mostra a imagem A');
  ok(h0.indexOf('Fechar a comporta') !== -1 && h0.indexOf('+10 de Reputação') !== -1 && h0.indexOf('6 horas') !== -1 && !/disabled/.test(h0), 'o cartão diz o botão, as 6 horas e a Reputação (PT), com o botão ativo');
  ok(g.html('en').indexOf('Close the sluice gate') !== -1 && g.html('es').indexOf('Cerrar la compuerta') !== -1, 'o botão diz-se em EN e em ES');
  g.html('pt');
  g.ev('estradaMoinhoClique()');
  ok(g.ev('state.moinho.fechadoEm') === T0 && g.ev('state.reputacao') === REP10, 'o clique fechou a comporta: carimbo guardado, Reputação igual');
  ok(g.ev('__saves') === 1 && g.ev('__barra') === 1, 'o clique gravou UMA vez (gravou ' + g.ev('__saves') + ') e atualizou a barra de cima');
  ok(g.ev('__sons.length') === 0 && g.ev('__linhas') === 1, 'fechar não toca som; redesenhou o cartão da Quinta uma vez');
  const h1 = g.html('pt');
  ok(h1.indexOf('src="assets/ecras/moinho_mare_a.jpg"') !== -1, 'depois de fechar: continua a imagem A');
  ok(h1.indexOf('A comporta está fechada') !== -1 && h1.indexOf('Tenta novamente daqui a 6h 0m.') !== -1 && h1.indexOf('Soltar a água') !== -1 && /disabled/.test(h1), 'logo a seguir: a comporta fechada, o tempo que falta («6h 0m», o formato da Vinha) e «Soltar a água» apagado');
  g.ev('estradaMoinhoClique()');
  ok(g.ev('__saves') === 1 && g.ev('state.moinho.fechadoEm') === T0, 'um 2.º clique durante a espera não grava nem muda o carimbo');
  g.ev('__agora = ' + (T0 + 2 * HORA + 30 * 60000));
  ok(g.html('pt').indexOf('Tenta novamente daqui a 3h 30m.') !== -1, 'passadas 2h30: faltam «3h 30m»');
  ok(g.html('en').indexOf('Try again in 3h 30m.') !== -1 && g.html('es').indexOf('dentro de 3h 30m.') !== -1, 'o tempo que falta diz-se em EN e em ES');
  g.ev('__agora = ' + (T0 + 6 * HORA - 30000));
  ok(g.html('pt').indexOf('daqui a 1m.') !== -1, 'a meio minuto do fim: «1m» (arredonda para cima, como na Vinha)');
  g.ev('estradaMoinhoClique()');
  ok(g.ev('state.reputacao') === REP10 && g.ev('__saves') === 1 && g.ev('state.moinho.dia') === null, 'antes das 6 horas o clique não paga nem grava');
  g.ev('__agora = ' + (T0 + 6 * HORA));
  const h2 = g.html('pt');
  ok(h2.indexOf('O tanque está cheio. Já podes soltar a água.') !== -1 && h2.indexOf('Soltar a água') !== -1 && !/disabled/.test(h2), 'passadas as 6 horas: «Soltar a água» ativo');
  g.ev('estradaMoinhoClique()');
  ok(g.ev('state.reputacao') === REP10 + 10 && g.ev('state.moinho.dia') === '2026-10-09' && g.ev('state.moinho.fechadoEm') === null, 'o clique soltou a água: +10, dia marcado, carimbo a null');
  ok(g.ev('__saves') === 2 && g.ev('__barra') === 2 && JSON.stringify(g.json('__sons')) === '["objetivoCumprido"]' && JSON.stringify(g.json('__vibras')) === '["sucesso"]', 'gravou UMA vez, atualizou a barra de cima, tocou o som e vibrou uma só vez');
  const h3 = g.html('pt');
  ok(h3.indexOf('src="assets/ecras/moinho_mare_b.jpg"') !== -1 && h3.indexOf('moinho_mare_a') === -1, 'depois de soltar a água: mostra a imagem B');
  ok(h3.indexOf('A comporta abriu e a água correu para a roda') !== -1 && h3.indexOf('+10 de Reputação.') !== -1 && /disabled/.test(h3) && h3.indexOf('Já soltaste') === -1, 'logo a seguir: o agradecimento, com o botão apagado e sem repetir «já soltaste hoje»');
  g.ev('estradaMoinhoClique()');
  ok(g.ev('state.reputacao') === REP10 + 10 && g.ev('__saves') === 2, 'um 2.º clique no mesmo dia não paga nem grava');
  g.ev('estradaMoinhoResultado = null');
  const h4 = g.html('pt');
  ok(h4.indexOf('Já soltaste a água hoje. Volta amanhã.') !== -1 && h4.indexOf('moinho_mare_b') !== -1 && /disabled/.test(h4), 'ao voltar (sem o resultado em memória): «já soltaste hoje», com a imagem B e o botão apagado');
  g.ev("__dia = '2026-10-10'");
  ok(!/disabled/.test(g.html('pt')) && g.html('pt').indexOf('moinho_mare_a') !== -1 && g.html('pt').indexOf('Fechar a comporta') !== -1, 'no dia seguinte: o botão «Fechar a comporta» volta, com a imagem A');
  // Relógio atrás.
  g.ev("__dia = '2026-10-08'");
  const hr = g.html('pt');
  ok(/disabled/.test(hr) && hr.indexOf('O relógio está atrás da última vez que soltaste a água') !== -1, 'com o relógio atrás: diz-o e o botão fica apagado');
  ok(g.html('en').indexOf('Your clock is behind') !== -1 && g.html('es').indexOf('Tu reloj va por detrás') !== -1, 'o relógio atrás diz-se em EN e em ES');
  const a = g.estado(); g.ev('estradaMoinhoClique()');
  ok(g.estado() === a, 'com o relógio atrás o clique não altera nada');
  // O relógio do cartão: de minuto a minuto, só na Quinta e só durante a espera.
  const r = abrir(cheia());
  ok(r.intervalos.length === 1 && r.intervalos[0].ms === 60000, 'um relógio de 60 s redesenha o cartão');
  r.ev('estradaMoinhoFechar(state, "2026-10-09", ' + T0 + ')');
  r.intervalos[0].f();
  ok(r.ev('__linhas') === 0, 'fora da Quinta o relógio não redesenha');
  r.ecra('screen-quinta'); r.intervalos[0].f();
  ok(r.ev('__linhas') === 1, 'na Quinta, com a comporta fechada à espera, redesenha');
  r.ev('__agora = ' + (T0 + 6 * HORA)); r.intervalos[0].f();
  ok(r.ev('__linhas') === 1, 'passadas as 6 horas já não redesenha (o botão aparece no último redesenho antes ou ao abrir)');
  const s = abrir(cheia()); s.ecra('screen-quinta'); s.intervalos[0].f();
  ok(s.ev('__linhas') === 0 && s.ev('__saves') === 0, 'sem comporta fechada o relógio não faz nada nem grava');
  // O bloco inteiro abaixo do nível 10.
  const b = abrir(cheia(REP10 - 1));
  ok(b.ev('estradaOfertaHtml()').indexOf('moinho-mare') === -1, 'abaixo do nível 10, estradaOfertaHtml não traz o moinho');
}

// 10. A entrada da Enciclopédia «moinho_mare_mourisca»: nível 10, imagem A, um só parágrafo nas 3 línguas, só os factos dados, sem fontes.
{
  const entradas = [];
  const cx = vm.createContext({ dadosAcrescentar: function (tipo, e) { if (tipo === 'enciclopedia') entradas.push(e); } });
  vm.runInContext(ler(path.join(RAIZ, 'dados', 'enciclopedia.js')), cx, { filename: 'dados/enciclopedia.js' });
  const e = entradas.filter(function (x) { return x.id === 'moinho_mare_mourisca'; });
  ok(e.length === 1, 'há uma só entrada «moinho_mare_mourisca» em dados/enciclopedia.js');
  const m = e[0] || { titulo: {}, texto: {} };
  ok(m.nivelMinimo === 10 && m.imagem === 'assets/ecras/moinho_mare_a.jpg', 'nível mínimo 10 e a imagem A');
  ok(entradas.filter(function (x) { return x.nivelMinimo === 10; }).length === 2, 'o nível 10 passa a ter 2 entradas (a tirada da cortiça e o moinho)');
  ok(Object.keys(m).sort().join(',') === 'id,imagem,nivelMinimo,texto,titulo', 'só os campos combinados (id, imagem, nivelMinimo, titulo, texto)');
  ['pt', 'en', 'es'].forEach(function (l) {
    const t = m.texto[l];
    ok(typeof m.titulo[l] === 'string' && m.titulo[l].length > 0 && typeof t === 'string' && t.length > 0, 'título e texto em ' + l);
    ok(typeof t === 'string' && !/[\r\n]/.test(t) && t === t.trim(), 'o texto (' + l + ') é um só parágrafo, sem quebras de linha');
    ok(typeof t === 'string' && !/[<>&]/.test(t) && !/https?:|www\.|\.pdf|visitsetubal|setubalbay|visitlisboa|dgterritorio/i.test(t), 'o texto (' + l + ') não tem < > & nem fontes (essas ficam no pacote e na PR)');
    ok(typeof t === 'string' && !/Yoshi_Cat/.test(t), 'o texto (' + l + ') não escreve «Yoshi_Cat»');
    ok(typeof t === 'string' && !/Fygmo 2|\bMestre\b|\bbot\b|\bIA\b/.test(t), 'o texto (' + l + ') sem «Fygmo 2», «Mestre», «bot» nem «IA»');
  });
  // Só os factos dados: cada um aparece (como número ou palavra) nas 3 línguas.
  const FACTOS = {
    pt: ['quatro moinhos de maré', 'Sado', 'Herdade da Mourisca', 'Setúbal', 'século XVII', '280 m²', '8 mós', 'tanque', 'maré', 'comporta', 'anos 60', 'ICNF', '1995', 'Câmara Municipal de Setúbal'],
    en: ['four tide mills', 'Sado', 'Herdade da Mourisca', 'Setúbal', '17th century', '280 m²', '8 millstones', 'tank', 'tide', 'sluice gate', '1960s', 'ICNF', '1995', 'Setúbal Municipal Council'],
    es: ['cuatro molinos de mareas', 'Sado', 'Herdade da Mourisca', 'Setúbal', 'siglo XVII', '280 m²', '8 piedras', 'tanque', 'marea', 'compuerta', 'años 60', 'ICNF', '1995', 'Ayuntamiento de Setúbal']
  };
  ['pt', 'en', 'es'].forEach(function (l) { FACTOS[l].forEach(function (f) { ok(typeof m.texto[l] === 'string' && m.texto[l].indexOf(f) !== -1, 'o texto (' + l + ') devia ter «' + f + '»'); }); });
  ok(m.titulo.pt === 'O Moinho de Maré da Mourisca' && m.titulo.en === 'The Mourisca Tide Mill' && m.titulo.es === 'El Molino de Mareas de la Mourisca', 'títulos nas 3 línguas');
  // As fontes só no pacote (e na PR), nunca no jogo.
  const pacote = JSON.parse(ler(path.join(RAIZ, 'dados', 'pacotes', 'moinho_mare_mourisca.json')));
  ok(pacote.id === 'moinho_mare_mourisca' && JSON.stringify(pacote.ids.enciclopedia) === '["moinho_mare_mourisca"]', 'o pacote moinho_mare_mourisca.json lista a entrada');
  const URLS = ['https://pnap.dgterritorio.gov.pt/sites/default/files/18_CM_Setubal_Apresentacao.pdf', 'https://visitsetubal.com/en/?p=346', 'https://visitsetubal.com/en/moinho-de-mare-da-mourisca-2/', 'https://setubalbay.org/en/?p=6430', 'https://www.visitlisboa.com/pt-pt/locais/moinho-de-mare-mouriscas'];
  URLS.forEach(function (u) { ok(pacote.fontes.some(function (f) { return f.indexOf(u) !== -1; }), 'o pacote tem a fonte ' + u); });
  // (js/estrada-dados.js já tem outras fontes, dos vizinhos: aqui só se procuram as 5 deste pacote.)
  ['js/estrada.js', 'js/estrada-dados.js', 'js/i18n.js', 'dados/enciclopedia.js', 'index.html'].forEach(function (f) { const c = ler(path.join(RAIZ, f)); URLS.forEach(function (u) { ok(c.indexOf(u) === -1 && c.indexOf(u.replace(/^https?:\/\//, '')) === -1, f + ' não tem a fonte ' + u + ' (só o pacote e a PR)'); }); });
  const usos = pacote.imagens.map(function (i) { return i.caminho; }).sort();
  ok(JSON.stringify(usos) === '["assets/ecras/moinho_mare_a.jpg","assets/ecras/moinho_mare_b.jpg"]' && pacote.imagens.every(function (i) { return i.estado === 'feita'; }), 'o pacote lista as 2 imagens, «feita»');
}

// 11. Provas negativas: estragar a regra de propósito tem de fazer o teste falhar.
if (!process.env.ESTRADA_JS) {
  const real = ler(ESTRADA_JS);
  const mutantes = [
    ['ignora a espera de 6 horas', 'if (restante > 0) return', 'if (false) return'],
    ['deixa soltar duas vezes no mesmo dia', "if (m.dia !== null && dia === m.dia) return recusa('ja_hoje');", ''],
    ['ignora o relógio atrás', "if (m.dia !== null && dia < m.dia) return recusa('dia_anterior');", ''],
    ['ignora o nível mínimo', 'return nivel !== null && nivel >= ESTRADA_MOINHO_MARE.nivelMinimo;', 'return true;'],
    ['não dá a Reputação', 'estado.reputacao = (typeof estado.reputacao === \'number\' && Number.isFinite(estado.reputacao) ? estado.reputacao : 0) + rep;', ''],
    ['dá a Reputação a mais', '? estado.reputacao : 0) + rep;', '? estado.reputacao : 0) + rep + 1;'],
    ['não marca o dia', 'm.dia = dia;', ''],
    ['não tira o carimbo', 'm.fechadoEm = null;', ''],
    ['um carimbo no futuro adianta a espera', 'Math.max(0, agora - m.fechadoEm)', 'agora - m.fechadoEm'],
    ['fechar não guarda o carimbo', 'moinhoEstado(estado).fechadoEm = agora;', ''],
    ['não corrige o carimbo no futuro', "carimboCorrigirFuturo(state.moinho, 'fechadoEm', agora);", ''],
    ['o clique grava duas vezes', '      saveState(state);\n      updateStatsDisplays();\n      estradaMoinhoResultado', '      saveState(state); saveState(state);\n      updateStatsDisplays();\n      estradaMoinhoResultado'],
    ['mostra sempre a imagem A', 'const imagem = soltouHoje ? ESTRADA_MOINHO_MARE.imagemSoltar : ESTRADA_MOINHO_MARE.imagemFechar;', 'const imagem = ESTRADA_MOINHO_MARE.imagemFechar;'],
    ['o moinho sai do bloco da oferta', 'estradaOfertaVisitaHtml() + estradaMoinhoHtml() + estradaMesaSadoHtml()', 'estradaOfertaVisitaHtml() + estradaMesaSadoHtml()']
  ];
  const os = require('os');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'moinho-mare-'));
  mutantes.forEach(function (m, i) {
    if (real.split(m[1]).length !== 2) { ok(false, 'mutante "' + m[0] + '" não se aplicou (ou aplica-se mais de uma vez)'); return; }
    const f = path.join(tmp, 'estrada-' + i + '.js');
    fs.writeFileSync(f, real.split(m[1]).join(m[2]));
    const r = require('child_process').spawnSync(process.execPath, [__filename], { env: Object.assign({}, process.env, { ESTRADA_JS: f }), encoding: 'utf8' });
    ok(r.status !== 0, 'o mutante "' + m[0] + '" passou nas verificações');
  });
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(falhas === 0 ? 'OK' : falhas + ' FALHA(S)');
process.exit(falhas === 0 ? 0 : 1);
