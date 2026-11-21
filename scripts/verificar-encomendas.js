#!/usr/bin/env node
// ENCOMENDAS, PR 1 (invisível): as regras puras de js/encomendas.js, o estado e a reparação de state.encomendas
// (js/state.js) e a junção na nuvem (js/nuvem.js). Corre os ficheiros REAIS em vm, sem browser nem conta real.
//
// Prova:
//  (a) níveis e cores: abaixo do 5 nunca há pedido; no 5 só Jovem e Dourado, no 6 também Âmbar, no 7 também Cobre;
//      a cor é determinística (o mesmo dia e o mesmo contador dão a mesma cor) e muda com o dia e o contador;
//      sem Math.random nem Date.now;
//  (b) o pedido: só com a visita de hoje já tocada, sem encomenda ativa, uma nova por dia, fora do modo de teste;
//      criar guarda a personagem da visita, o escalão, aceiteDia, prazoDia (+2 dias, também na mudança de mês e de
//      ano) e historicoInicio = nº de garrafas no histórico; recusar não altera nada;
//  (c) cumprir: só no prazo (até ao prazoDia, inclusive), escalão igual ou maior (menor não), só garrafas do histórico
//      com posição >= historicoInicio, nunca garrafas de festa (jeropiga); entregar dá o prémio certo (Jovem +4 Rep
//      +20 Uvas; Dourado +6 +30 Uvas; Âmbar +8 +15 Gotas; Cobre +10 +25 Gotas), conta mais uma cumprida, acaba a
//      encomenda (nunca conta duas vezes) e não gasta a garrafa; o prazo passado acaba a encomenda sem tirar nada;
//  (d) relógio errado: data atrás não deixa pedir outra no mesmo dia nem acaba a encomenda; uma encomenda aceite num
//      dia muito à frente (data adiantada que voltou ao normal) conta como acabada;
//  (e) reparação: jogador antigo (sem o campo) abre bem; atual mal formado, escalão fora de 1 a 4, datas que não
//      são AAAA-MM-DD, prazo antes do aceite, historicoInicio inválido passam a null; cumpridas inválido passa a 0;
//  (f) nuvem com dois aparelhos: cumpridas = o maior; ultimoDia = o mais recente; atual do lado com mais cumpridas
//      (pode ser null), senão nunca apagado por um null e, com os dois, o aceite mais recente; nunca desce; a forma
//      é a do defaultState(); e de ponta a ponta (arranque com a nuvem a ganhar) a encomenda aceite fica;
//  (g) INVISÍVEL: nada do jogo chama estas funções (só js/encomendas.js, js/state.js e js/nuvem.js falam delas),
//      js/garrafa.js não as chama, não há textos novos no js/i18n.js, e o index.html carrega js/encomendas.js?v=1
//      depois de js/visitas.js e de js/garrafa.js.
//
// Depois de passar, aplica "mutações" (estraga cada regra de propósito) e confirma que o teste as apanha.
// Uso: node scripts/verificar-encomendas.js     Sai com 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const LER = function (f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); };
const FONTES = {};
['state.js', 'tempo.js', 'niveis.js', 'visitas.js', 'encomendas.js', 'nuvem.js', 'i18n.js', 'garrafa.js'].forEach(function (f) { FONTES[f] = LER('js/' + f); });
FONTES['index.html'] = LER('index.html');
const J = JSON.stringify;
const DIA = '2026-10-10';

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }

  // ---------------------------------------------------------------- ambiente
  function abrir(o) {
    o = o || {};
    const ls = o.ls || {};
    const relogio = o.relogio || { t: 1700000000000 };
    const temporizadores = []; let proximo = 1;
    const sb = {
      console: { log() {}, warn() {}, error() {} },
      localStorage: {
        getItem: function (k) { return Object.prototype.hasOwnProperty.call(ls, k) ? ls[k] : null; },
        setItem: function (k, v) { ls[k] = String(v); }, removeItem: function (k) { delete ls[k]; }
      },
      location: { search: '' }, URLSearchParams: URLSearchParams, Intl: Intl,
      document: { addEventListener: function () {}, querySelectorAll: function () { return []; }, querySelector: function () { return null; }, getElementById: function () { return null; }, visibilityState: 'visible' },
      setTimeout: function (fn, ms) { const id = proximo++; temporizadores.push({ id: id, em: relogio.t + (ms || 0), fn: fn }); return id; },
      clearTimeout: function (id) { const i = temporizadores.findIndex(function (x) { return x.id === id; }); if (i !== -1) temporizadores.splice(i, 1); },
      applyTranslations: function () {}, t: function (k) { return k; },
      Date: class extends Date { static now() { return relogio.t; } }
    };
    sb.window = sb; sb.window.addEventListener = function () {};
    sb.Telegram = { WebApp: o.nuvem ? { initDataUnsafe: { a: 1 }, CloudStorage: o.nuvem } : {} };
    const cx = vm.createContext(sb);
    vm.runInContext(fontes['state.js'], cx, { filename: 'state.js' });
    vm.runInContext(fontes['nuvem.js'], cx, { filename: 'nuvem.js' });
    vm.runInContext(fontes['tempo.js'], cx, { filename: 'tempo.js' });
    vm.runInContext(fontes['niveis.js'], cx, { filename: 'niveis.js' });
    vm.runInContext(fontes['visitas.js'], cx, { filename: 'visitas.js' });
    vm.runInContext(fontes['encomendas.js'], cx, { filename: 'encomendas.js' });
    const g = { cx: cx, ls: ls, relogio: relogio };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
    g.avancar = function (ms) {
      const alvo = relogio.t + ms;
      for (;;) {
        temporizadores.sort(function (a, b) { return a.em - b.em; });
        if (!temporizadores.length || temporizadores[0].em > alvo) break;
        const x = temporizadores.shift(); relogio.t = Math.max(relogio.t, x.em); x.fn();
      }
      relogio.t = alvo;
    };
    return g;
  }
  // Estado de um jogador num nível, com a visita de hoje (feita ou não) e um histórico.
  function estado(nivel, extra) {
    const reps = [0, 15, 50, 120, 300, 600, 1000, 1500, 2100, 2800];
    const e = {
      reputacao: reps[nivel - 1], uvas: 10, gotas: 5, garrafas: 3,
      visitas: { feitas: {}, hoje: { dia: DIA, id: 'valentim_4', feita: true } },
      adega: { historico: [{ data: 'x', estacao: 'verao', diasDescanso: 1 }, { data: 'x', estacao: 'verao', diasDescanso: 2 }, { data: 'x', estacao: 'outono', diasDescanso: 0, festa: 'saomartinho' }] },
      encomendas: { atual: null, ultimoDia: null, cumpridas: 0 }
    };
    return Object.assign(e, extra || {});
  }
  function com(g, e) { g.cx.__e = JSON.parse(J(e)); return '__e'; }

  // ---------------------------------------------------------------- (a) níveis e cores
  {
    const g = abrir();
    [[4, []], [5, [1, 2]], [6, [1, 2, 3]], [7, [1, 2, 3, 4]], [10, [1, 2, 3, 4]]].forEach(function (c) {
      ok(J(g.json('encomendaEscaloesAbertos(' + c[0] + ')')) === J(c[1]), '(a) nível ' + c[0] + ': cores abertas ' + J(c[1]) + ' (deu ' + J(g.json('encomendaEscaloesAbertos(' + c[0] + ')')) + ')');
    });
    // em 200 dias e 3 contadores, só cores abertas, e todas aparecem
    [[5, [1, 2]], [6, [1, 2, 3]], [7, [1, 2, 3, 4]]].forEach(function (c) {
      const vistas = {}; let fora = 0;
      for (let i = 0; i < 200; i++) for (let k = 0; k < 3; k++) {
        const d = g.ev("encomendaSomarDias('2026-01-01', " + i + ")");
        const x = g.ev('encomendaEscalaoDoDia(' + c[0] + ", '" + d + "', " + k + ')');
        if (c[1].indexOf(x) === -1) fora++; vistas[x] = true;
      }
      ok(fora === 0 && c[1].every(function (x) { return vistas[x]; }), '(a) nível ' + c[0] + ': só as cores abertas, e todas aparecem (' + J(Object.keys(vistas)) + ', fora ' + fora + ')');
    });
    ok(g.ev("encomendaEscalaoDoDia(7, '" + DIA + "', 2)") === g.ev("encomendaEscalaoDoDia(7, '" + DIA + "', 2)"), '(a) a cor é determinística');
    const diferentes = {}; for (let k = 0; k < 12; k++) diferentes[g.ev("encomendaEscalaoDoDia(7, '" + DIA + "', " + k + ')')] = true;
    ok(Object.keys(diferentes).length >= 3, '(a) a cor muda com o contador de cumpridas');
    ok(g.ev("encomendaEscalaoDoDia(4, '" + DIA + "', 0)") === null, '(a) abaixo do nível 5 não há cor');
    const src = fontes['encomendas.js'].replace(/\/\/.*$/gm, '');
    ok(!/Math\.random|Date\.now|new Date\(\)|saveState|localStorage/.test(src), '(a) sem Math.random, sem relógio, sem gravar');
    // com Math.random e Date.now proibidos, tudo corre
    const p = abrir();
    p.ev('Math.random = function () { throw new Error("Math.random"); }; Date.now = function () { throw new Error("Date.now"); };');
    let rebentou = false;
    try { const e = com(p, estado(7)); p.ev('encomendaCriar(' + e + ", '" + DIA + "', false); encomendaPrazoPassou(" + e + ", '2026-10-13'); encomendaProcurarGarrafa(" + e + ", '" + DIA + "')"); } catch (x) { rebentou = true; }
    ok(!rebentou, '(a) corre sem Math.random nem Date.now');
  }

  // ---------------------------------------------------------------- (b) o pedido
  {
    const g = abrir();
    const pode = function (e, dia, teste) { return g.json('encomendaPodePedir(' + com(g, e) + ", '" + (dia || DIA) + "', " + (teste ? 'true' : 'false') + ')'); };
    ok(pode(estado(4)).motivo === 'nivel', '(b) nível 4: não pede');
    ok(pode(estado(5)).ok === true && pode(estado(5)).personagem === 'valentim', '(b) nível 5 com a visita tocada: pode pedir, à personagem da visita');
    ok(pode(estado(5), DIA, true).motivo === 'modo_teste', '(b) em modo de teste não pede');
    ok(pode(estado(5, { visitas: { feitas: {}, hoje: { dia: DIA, id: 'valentim_4', feita: false } } })).motivo === 'nao_tocada', '(b) visita ainda por tocar: não pede');
    ok(pode(estado(5, { visitas: { feitas: {}, hoje: null } })).motivo === 'sem_visita', '(b) sem visita hoje: não pede');
    ok(pode(estado(5, { visitas: { feitas: {}, hoje: { dia: '2026-10-09', id: 'valentim_4', feita: true } } })).motivo === 'sem_visita', '(b) a visita tocada é de ontem: não pede');
    ok(pode(estado(5, { visitas: { feitas: {}, hoje: { dia: DIA, id: 'nao_existe', feita: true } } })).motivo === 'sem_visita', '(b) visita desconhecida: não pede');
    ok(pode(estado(5), 'ontem').motivo === 'dia', '(b) dia inválido: não pede');
    const ativa = { personagem: 'marisa', escalao: 1, aceiteDia: '2026-10-09', prazoDia: '2026-10-11', historicoInicio: 3 };
    ok(pode(estado(5, { encomendas: { atual: ativa, ultimoDia: '2026-10-09', cumpridas: 0 } })).motivo === 'ja_ativa', '(b) com uma encomenda ativa: não pede outra');
    ok(pode(estado(5, { encomendas: { atual: null, ultimoDia: DIA, cumpridas: 1 } })).motivo === 'ja_hoje', '(b) já houve uma nova hoje: não pede outra');
    ok(pode(estado(5, { encomendas: { atual: Object.assign({}, ativa, { aceiteDia: '2026-10-05', prazoDia: '2026-10-07' }), ultimoDia: '2026-10-05', cumpridas: 0 } })).ok === true, '(b) a ativa já fora do prazo não conta como ativa');
    // criar
    const e = com(g, estado(6));
    const antesRec = g.ev('JSON.stringify(' + e + ')');
    const r = g.json('encomendaCriar(' + e + ", '" + DIA + "', true)");
    ok(!r.ok && g.ev('JSON.stringify(' + e + ')') === antesRec, '(b) recusar (modo de teste) não altera nada');
    const c = g.json('encomendaCriar(' + e + ", '" + DIA + "', false)");
    const atual = g.json(e + '.encomendas.atual');
    ok(c.ok && atual.personagem === 'valentim' && atual.aceiteDia === DIA && atual.prazoDia === '2026-10-12' && atual.historicoInicio === 3 && [1, 2, 3].indexOf(atual.escalao) !== -1, '(b) criar guarda personagem, escalão, aceiteDia, prazoDia (+2) e historicoInicio (3): ' + J(atual));
    ok(atual.escalao === g.ev("encomendaEscalaoDoDia(6, '" + DIA + "', 0)"), '(b) o escalão é o da cor do dia');
    ok(g.ev(e + '.encomendas.ultimoDia') === DIA && g.ev(e + '.encomendas.cumpridas') === 0, '(b) ultimoDia = hoje; cumpridas não muda');
    ok(g.ev(e + '.garrafas') === 3 && g.ev(e + '.reputacao') === 600, '(b) criar não dá nem tira nada');
    ok(!g.json('encomendaCriar(' + e + ", '" + DIA + "', false)").ok, '(b) uma segunda no mesmo dia: recusada');
    ok(g.ev("encomendaSomarDias('2026-10-30', 2)") === '2026-11-01' && g.ev("encomendaSomarDias('2026-12-31', 2)") === '2027-01-02' && g.ev("encomendaSomarDias('2028-02-28', 2)") === '2028-03-01', '(b) o prazo passa bem o fim do mês e do ano');
  }

  // ---------------------------------------------------------------- (c) cumprir e prémios
  {
    const g = abrir();
    const premios = { 1: [4, 20, 0], 2: [6, 30, 0], 3: [8, 0, 15], 4: [10, 0, 25] };
    Object.keys(premios).forEach(function (k) { const p = g.json('encomendaPremio(' + k + ')'); ok(J([p.reputacao, p.uvas, p.gotas]) === J(premios[k]), '(c) prémio do escalão ' + k + ': ' + J(premios[k])); });
    ok(g.ev('encomendaPremio(0)') === null && g.ev('encomendaPremio(5)') === null, '(c) sem prémio fora de 1 a 4');
    const comAtual = function (escalao, inicio, hist, extra) {
      return estado(7, Object.assign({ adega: { historico: hist }, encomendas: { atual: { personagem: 'henrique', escalao: escalao, aceiteDia: DIA, prazoDia: '2026-10-12', historicoInicio: inicio }, ultimoDia: DIA, cumpridas: 2 } }, extra || {}));
    };
    const h = function (d, festa) { return festa ? { data: 'x', estacao: 'outono', diasDescanso: d, festa: 'saomartinho' } : { data: 'x', estacao: 'verao', diasDescanso: d }; };
    const cumpre = function (e, dia, i) { return g.ev('encomendaGarrafaCumpre(' + com(g, e) + ", '" + dia + "', " + i + ')'); };
    ok(cumpre(comAtual(2, 1, [h(4), h(2)]), DIA, 1) === true, '(c) escalão igual cumpre');
    ok(cumpre(comAtual(2, 1, [h(4), h(3)]), DIA, 1) === true, '(c) escalão maior cumpre');
    ok(cumpre(comAtual(3, 1, [h(4), h(2)]), DIA, 1) === false, '(c) escalão menor não cumpre');
    ok(cumpre(comAtual(2, 1, [h(4), h(2)]), DIA, 0) === false, '(c) uma garrafa de antes de aceitar não cumpre (mesmo sendo Cobre)');
    ok(cumpre(comAtual(1, 1, [h(1), h(0, true)]), DIA, 1) === false, '(c) a jeropiga (festa) não cumpre');
    ok(cumpre(comAtual(1, 1, [h(1), h(3, true)]), DIA, 1) === false, '(c) uma garrafa de festa nunca cumpre, mesmo com dias');
    ok(cumpre(comAtual(1, 1, [h(1), { data: 'x' }]), DIA, 1) === false && cumpre(comAtual(1, 1, [h(1), h('x')]), DIA, 1) === false, '(c) garrafa sem escalão válido não cumpre');
    ok(cumpre(comAtual(2, 1, [h(4), h(2)]), '2026-10-12', 1) === true, '(c) no último dia do prazo ainda cumpre');
    ok(cumpre(comAtual(2, 1, [h(4), h(2)]), '2026-10-13', 1) === false, '(c) depois do prazo já não cumpre');
    ok(cumpre(comAtual(2, 1, [h(4), h(2)]), DIA, 2) === false && cumpre(comAtual(2, 1, [h(4), h(2)]), DIA, -1) === false, '(c) posições fora do histórico não cumprem');
    ok(g.ev('encomendaProcurarGarrafa(' + com(g, comAtual(3, 1, [h(4), h(1), h(0, true), h(3)])) + ", '" + DIA + "')") === 3, '(c) procura a 1.ª garrafa que cumpre (a Âmbar na posição 3)');
    ok(g.ev('encomendaProcurarGarrafa(' + com(g, comAtual(3, 1, [h(4), h(1)])) + ", '" + DIA + "')") === -1, '(c) sem garrafa que cumpra: -1');
    // entregar
    [[1, 4, 20, 0], [2, 6, 30, 0], [3, 8, 0, 15], [4, 10, 0, 25]].forEach(function (c) {
      const e = com(g, comAtual(c[0], 1, [h(4), h(c[0])]));
      const antes = g.json(e);
      const r = g.json('encomendaEntregar(' + e + ", '" + DIA + "', 1)");
      const d = g.json(e);
      ok(r.ok && r.escalao === c[0] && r.personagem === 'henrique', '(c) entregar escalão ' + c[0]);
      ok(d.reputacao - antes.reputacao === c[1] && d.uvas - antes.uvas === c[2] && d.gotas - antes.gotas === c[3], '(c) escalão ' + c[0] + ': +' + c[1] + ' Rep, +' + c[2] + ' Uvas, +' + c[3] + ' Gotas');
      ok(d.encomendas.cumpridas === 3 && d.encomendas.atual === null && d.encomendas.ultimoDia === DIA, '(c) conta mais uma cumprida e acaba a encomenda');
      ok(d.garrafas === antes.garrafas && J(d.adega) === J(antes.adega), '(c) a garrafa não se gasta (garrafas e histórico iguais)');
      ok(!g.json('encomendaEntregar(' + e + ", '" + DIA + "', 1)").ok && g.ev(e + '.encomendas.cumpridas') === 3, '(c) nunca se conta duas vezes');
    });
    {
      const e = com(g, comAtual(3, 1, [h(4), h(2)]));
      const antes = g.ev('JSON.stringify(' + e + ')');
      ok(!g.json('encomendaEntregar(' + e + ", '" + DIA + "', 1)").ok && g.ev('JSON.stringify(' + e + ')') === antes, '(c) entregar com escalão menor recusa sem mexer em nada');
    }
    // prazo
    {
      const e = com(g, comAtual(2, 1, [h(4)]));
      ok(g.ev('encomendaPrazoPassou(' + e + ", '2026-10-12')") === false && g.ev('encomendaPrazoPassou(' + e + ", '2026-10-13')") === true, '(c) o prazo passa no dia a seguir ao prazoDia');
      ok(g.ev('encomendaExpirar(' + e + ", '2026-10-12')") === false && g.ev(e + '.encomendas.atual') !== null, '(c) no prazo, não expira');
      const antes = g.json(e);
      ok(g.ev('encomendaExpirar(' + e + ", '2026-10-13')") === true, '(c) fora do prazo, expira');
      const d = g.json(e);
      ok(d.encomendas.atual === null && d.encomendas.cumpridas === antes.encomendas.cumpridas && d.reputacao === antes.reputacao && d.uvas === antes.uvas && d.gotas === antes.gotas && d.garrafas === antes.garrafas, '(c) expirar não tira nada nem conta como cumprida');
      ok(g.ev('encomendaPrazoPassou(' + com(g, estado(7)) + ", '2026-10-13')") === false, '(c) sem encomenda o prazo não "passa"');
    }
  }

  // ---------------------------------------------------------------- (d) relógio errado
  {
    const g = abrir();
    // data atrás um dia depois de pedir: não pede outra nem acaba a encomenda
    const e = com(g, estado(7, { visitas: { feitas: {}, hoje: { dia: '2026-10-09', id: 'valentim_4', feita: true } }, encomendas: { atual: null, ultimoDia: DIA, cumpridas: 0 } }));
    ok(g.json('encomendaPodePedir(' + e + ", '2026-10-09', false)").motivo === 'ja_hoje', '(d) data atrás (um dia): ainda conta como o dia da última encomenda');
    const e2 = com(g, estado(7, { encomendas: { atual: { personagem: 'marisa', escalao: 1, aceiteDia: DIA, prazoDia: '2026-10-12', historicoInicio: 0 }, ultimoDia: DIA, cumpridas: 0 } }));
    ok(g.ev('encomendaPrazoPassou(' + e2 + ", '2026-10-08')") === false, '(d) data atrás (2 dias): a encomenda não acaba');
    ok(g.ev('encomendaPrazoPassou(' + e2 + ", '2026-10-07')") === true, '(d) aceite num dia mais de 2 dias à frente de hoje (data adiantada): conta como acabada');
    const e3 = com(g, estado(7, { encomendas: { atual: null, ultimoDia: '2026-10-20', cumpridas: 0 } }));
    ok(g.json('encomendaPodePedir(' + e3 + ", '" + DIA + "', false)").ok === true, '(d) um ultimoDia muito à frente (data adiantada) não prende para sempre');
  }

  // ---------------------------------------------------------------- (e) estado e reparação
  {
    const g = abrir();
    ok(J(g.json('defaultState().encomendas')) === J({ atual: null, ultimoDia: null, cumpridas: 0 }), '(e) estado por omissão');
    ok(J(g.json('mergeDeep(defaultState(), { reputacao: 5 }).encomendas')) === J({ atual: null, ultimoDia: null, cumpridas: 0 }), '(e) jogador antigo (sem o campo) abre com as encomendas vazias');
    // loadState com um save antigo
    const h = abrir({ ls: { yoshicat_quinta_state_v2: J({ reputacao: 700, uvas: 3, garrafas: 2 }) } });
    ok(J(h.json('state.encomendas')) === J({ atual: null, ultimoDia: null, cumpridas: 0 }) && h.ev('state.reputacao') === 700, '(e) save antigo carrega com as encomendas vazias e o resto igual');
    const bom = { personagem: 'marisa', escalao: 2, aceiteDia: '2026-10-10', prazoDia: '2026-10-12', historicoInicio: 4 };
    const casos = [
      ['null', null], ['texto', 'x'], ['lista', []], ['número', 3],
      ['atual texto', { atual: 'x', ultimoDia: null, cumpridas: 0 }],
      ['escalão 0', { atual: Object.assign({}, bom, { escalao: 0 }), ultimoDia: null, cumpridas: 0 }],
      ['escalão 5', { atual: Object.assign({}, bom, { escalao: 5 }), ultimoDia: null, cumpridas: 0 }],
      ['escalão 2.5', { atual: Object.assign({}, bom, { escalao: 2.5 }), ultimoDia: null, cumpridas: 0 }],
      ['escalão texto', { atual: Object.assign({}, bom, { escalao: '2' }), ultimoDia: null, cumpridas: 0 }],
      ['data mal escrita', { atual: Object.assign({}, bom, { aceiteDia: '10/10/2026' }), ultimoDia: null, cumpridas: 0 }],
      ['data impossível', { atual: Object.assign({}, bom, { prazoDia: '2026-02-30' }), ultimoDia: null, cumpridas: 0 }],
      ['prazo antes do aceite', { atual: Object.assign({}, bom, { prazoDia: '2026-10-09' }), ultimoDia: null, cumpridas: 0 }],
      ['historicoInicio negativo', { atual: Object.assign({}, bom, { historicoInicio: -1 }), ultimoDia: null, cumpridas: 0 }],
      ['sem personagem', { atual: Object.assign({}, bom, { personagem: '' }), ultimoDia: null, cumpridas: 0 }]
    ];
    casos.forEach(function (c) {
      g.cx.__s = { encomendas: JSON.parse(J(c[1])) };
      const r = g.json('encomendasEstado(__s)');
      ok(r.atual === null && J(Object.keys(r)) === J(['atual', 'ultimoDia', 'cumpridas']), '(e) ' + c[0] + ': atual passa a null (' + J(r) + ')');
      ok(J(g.json('__s.encomendas')) === J(r), '(e) ' + c[0] + ': repara em memória o estado recebido');
    });
    [['ultimoDia mal escrito', { atual: null, ultimoDia: 'ontem', cumpridas: 2 }, { atual: null, ultimoDia: null, cumpridas: 2 }],
      ['cumpridas negativo', { atual: null, ultimoDia: DIA, cumpridas: -3 }, { atual: null, ultimoDia: DIA, cumpridas: 0 }],
      ['cumpridas texto', { atual: null, ultimoDia: DIA, cumpridas: '4' }, { atual: null, ultimoDia: DIA, cumpridas: 0 }],
      ['cumpridas 1.5', { atual: null, ultimoDia: DIA, cumpridas: 1.5 }, { atual: null, ultimoDia: DIA, cumpridas: 0 }],
      ['tudo certo', { atual: bom, ultimoDia: DIA, cumpridas: 7 }, { atual: bom, ultimoDia: DIA, cumpridas: 7 }],
      ['chaves a mais', { atual: Object.assign({ lixo: 1 }, bom), ultimoDia: DIA, cumpridas: 1, outra: true }, { atual: bom, ultimoDia: DIA, cumpridas: 1 }]
    ].forEach(function (c) {
      g.cx.__s = { encomendas: JSON.parse(J(c[1])) };
      ok(J(g.json('encomendasEstado(__s)')) === J(c[2]), '(e) ' + c[0] + ': ' + J(g.json('encomendasEstado(__s)')));
    });
    // as regras nunca rebentam com um estado estranho
    let rebentou = false;
    try { ['null', '{}', '{ encomendas: "x", visitas: 3, adega: null }'].forEach(function (s) { g.ev('encomendaPodePedir(' + s + ", '" + DIA + "', false); encomendaPrazoPassou(" + s + ", '" + DIA + "'); encomendaProcurarGarrafa(" + s + ", '" + DIA + "')"); }); } catch (x) { rebentou = true; }
    ok(!rebentou, '(e) com estados estranhos nada rebenta');
  }

  // ---------------------------------------------------------------- (f) nuvem
  {
    const g = abrir();
    const juntar = function (a, b) { g.cx.__a = JSON.parse(J({ encomendas: a })); g.cx.__b = JSON.parse(J({ encomendas: b })); return g.json('nuvemJuntarLeves(__a, __b).encomendas'); };
    const A = function (dia, esc) { return { personagem: 'marisa', escalao: esc || 1, aceiteDia: dia, prazoDia: g.ev("encomendaSomarDias('" + dia + "', 2)"), historicoInicio: 2 }; };
    ok(g.json('NUVEM_LEVES_AREAS').indexOf('encomendas') !== -1, '(f) encomendas está nas áreas leves');
    let r = juntar({ atual: null, ultimoDia: '2026-10-08', cumpridas: 3 }, { atual: A('2026-10-07'), ultimoDia: '2026-10-07', cumpridas: 2 });
    ok(r.cumpridas === 3 && r.atual === null && r.ultimoDia === '2026-10-08', '(f) o lado com mais cumpridas ganha o atual (já entregue: null), cumpridas = o maior');
    r = juntar({ atual: A('2026-10-07'), ultimoDia: '2026-10-07', cumpridas: 2 }, { atual: null, ultimoDia: '2026-10-08', cumpridas: 3 });
    ok(r.cumpridas === 3 && r.atual === null && r.ultimoDia === '2026-10-08', '(f) ...e pela outra ordem');
    r = juntar({ atual: A('2026-10-10', 3), ultimoDia: '2026-10-10', cumpridas: 1 }, { atual: null, ultimoDia: '2026-10-09', cumpridas: 1 });
    ok(J(r.atual) === J(A('2026-10-10', 3)) && r.ultimoDia === '2026-10-10', '(f) mesmas cumpridas: uma encomenda aceite nunca é apagada por um null');
    r = juntar({ atual: null, ultimoDia: '2026-10-09', cumpridas: 1 }, { atual: A('2026-10-10', 3), ultimoDia: '2026-10-10', cumpridas: 1 });
    ok(J(r.atual) === J(A('2026-10-10', 3)), '(f) ...nem do outro lado');
    r = juntar({ atual: A('2026-10-09', 1), ultimoDia: '2026-10-09', cumpridas: 1 }, { atual: A('2026-10-10', 2), ultimoDia: '2026-10-10', cumpridas: 1 });
    ok(J(r.atual) === J(A('2026-10-10', 2)) && r.ultimoDia === '2026-10-10', '(f) as duas aceites: fica a mais recente');
    r = juntar({ atual: A('2026-10-10', 4), ultimoDia: '2026-10-10', cumpridas: 1 }, { atual: A('2026-10-10', 2), ultimoDia: '2026-10-10', cumpridas: 1 });
    const r2 = juntar({ atual: A('2026-10-10', 2), ultimoDia: '2026-10-10', cumpridas: 1 }, { atual: A('2026-10-10', 4), ultimoDia: '2026-10-10', cumpridas: 1 });
    ok(J(r.atual) === J(A('2026-10-10', 4)) && J(r2) === J(r), '(f) no mesmo dia: fica a de escalão maior, qualquer que seja a ordem');
    r = juntar({ atual: 'lixo', ultimoDia: 'x', cumpridas: -2 }, { atual: A('2026-10-10'), ultimoDia: '2026-10-10', cumpridas: 2 });
    ok(r.cumpridas === 2 && J(r.atual) === J(A('2026-10-10')) && r.ultimoDia === '2026-10-10', '(f) um lado estragado conta como vazio');
    r = juntar(undefined, undefined);
    ok(J(r) === J({ atual: null, ultimoDia: null, cumpridas: 0 }) && J(Object.keys(r)) === J(Object.keys(g.json('defaultState().encomendas'))), '(f) sem nada nos dois: a forma do defaultState()');
    // nunca desce: em 400 pares ao acaso (sementes fixas)
    let desceu = 0;
    let s = 7; const rnd = function (n) { s = (s * 1103515245 + 12345) % 2147483648; return s % n; };
    const dias = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', null];
    for (let i = 0; i < 400; i++) {
      const lado = function () { const ud = dias[rnd(5)]; return { atual: rnd(2) ? A(dias[rnd(4)], 1 + rnd(4)) : null, ultimoDia: ud, cumpridas: rnd(4) }; };
      const a = lado(), b = lado();
      const m = juntar(a, b);
      if (m.cumpridas < a.cumpridas || m.cumpridas < b.cumpridas) desceu++;
      [a, b].forEach(function (x) { if (x.ultimoDia && (!m.ultimoDia || m.ultimoDia < x.ultimoDia)) desceu++; });
      if (a.cumpridas === b.cumpridas && (a.atual || b.atual) && !m.atual) desceu++;
      const m2 = juntar(m, a);
      if (m2.cumpridas < m.cumpridas) desceu++;
    }
    ok(desceu === 0, '(f) em 400 junções nada desce (' + desceu + ')');
    g.cx.__a = { encomendas: { atual: A('2026-10-10'), ultimoDia: '2026-10-10', cumpridas: 1 } }; g.cx.__b = { encomendas: { atual: null, ultimoDia: null, cumpridas: 0 } };
    const antes = g.ev('JSON.stringify([__a, __b])'); g.ev('nuvemJuntarLeves(__a, __b)');
    ok(g.ev('JSON.stringify([__a, __b])') === antes, '(f) a junção não altera os argumentos');
  }
  // de ponta a ponta: a nuvem (mais recente) ganha, mas não tem a encomenda aceite neste aparelho
  ['nuvem', 'local'].forEach(function (ramo) {
    const dados = {};
    const nuvem = { dados: dados, getItem: function (k, cb) { cb(null, Object.prototype.hasOwnProperty.call(dados, k) ? dados[k] : ''); },
      getItems: function (ks, cb) { const r = {}; ks.forEach(function (k) { r[k] = Object.prototype.hasOwnProperty.call(dados, k) ? dados[k] : ''; }); cb(null, r); },
      setItem: function (k, v, cb) { dados[k] = v; if (cb) cb(null, true); }, getKeys: function (cb) { cb(null, Object.keys(dados)); },
      removeItems: function (ks, cb) { ks.forEach(function (k) { delete dados[k]; }); if (cb) cb(null, true); } };
    const emNuvem = ramo === 'nuvem' ? 9000 : 1000;
    dados.yc_state_meta = J({ partes: 1, atualizadoEm: emNuvem });
    dados.yc_state_parte_0 = J({ reputacao: 700, ultimaGravacaoEm: emNuvem, encomendas: { atual: null, ultimoDia: '2026-10-09', cumpridas: 1 } });
    const aceite = { personagem: 'henrique', escalao: 2, aceiteDia: '2026-10-10', prazoDia: '2026-10-12', historicoInicio: 0 };
    const ls = { yoshicat_quinta_state_v2: J({ reputacao: 700, ultimaGravacaoEm: 5000, encomendas: { atual: aceite, ultimoDia: '2026-10-10', cumpridas: 1 } }) };
    const g = abrir({ ls: ls, nuvem: nuvem, relogio: { t: 20000 } });
    g.avancar(2000);
    const e = g.json('state.encomendas');
    ok(J(e.atual) === J(aceite) && e.ultimoDia === '2026-10-10' && e.cumpridas === 1, '(f) arranque com a ' + ramo + ' a ganhar: a encomenda aceite neste aparelho fica (' + J(e) + ')');
  });

  // ---------------------------------------------------------------- (g) invisível
  {
    const quem = fs.readdirSync(path.join(RAIZ, 'js')).filter(function (f) {
      if (!/\.js$/.test(f) || f === 'encomendas.js') return false;
      const s = (f === 'state.js' || f === 'nuvem.js' || f === 'garrafa.js' || f === 'i18n.js' || f === 'visitas.js') ? fontes[f] : LER('js/' + f);
      return /encomenda/i.test(s);
    }).sort();
    ok(J(quem) === J(['nuvem.js', 'state.js']), '(g) só js/state.js e js/nuvem.js falam das encomendas (nada do jogo as chama): ' + J(quem));
    ok(!/encomenda/i.test(fontes['garrafa.js']) && !/encomenda/i.test(fontes['i18n.js']), '(g) js/garrafa.js não as chama e não há textos no js/i18n.js');
    const I = fontes['index.html'];
    const pos = function (f) { return I.indexOf('<script src="js/' + f + '?v='); };
    ok(/<script src="js\/encomendas\.js\?v=1"><\/script>/.test(I) && ['visitas.js', 'garrafa.js', 'tempo.js', 'niveis.js', 'main.js'].every(function (f) { return pos(f) > 0; }) && pos('encomendas.js') > pos('visitas.js') && pos('encomendas.js') > pos('garrafa.js') && pos('encomendas.js') > pos('tempo.js') && pos('encomendas.js') > pos('niveis.js') && pos('encomendas.js') < pos('main.js'), '(g) index.html: js/encomendas.js?v=1 depois de visitas.js e garrafa.js (e de tempo.js e niveis.js), antes de main.js');
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
  ['nível mínimo 4', 'encomendas.js', 'const ENCOMENDAS_NIVEL_MINIMO = 5;', 'const ENCOMENDAS_NIVEL_MINIMO = 4;'],
  ['Âmbar aberto no 5', 'encomendas.js', '{ escalao: 3, nivel: 6 },', '{ escalao: 3, nivel: 5 },'],
  ['Cobre aberto no 6', 'encomendas.js', '{ escalao: 4, nivel: 7 }', '{ escalao: 4, nivel: 6 }'],
  ['cor sempre a mesma', 'encomendas.js', "return abertos[encomendaHash(dia + '#encomenda#' + n) % abertos.length];", 'return abertos[0];'],
  ['cor ao acaso', 'encomendas.js', "return abertos[encomendaHash(dia + '#encomenda#' + n) % abertos.length];", 'return abertos[Math.floor(Math.random() * abertos.length)];'],
  ['pede em modo de teste', 'encomendas.js', "  if (modoTeste === true) return recusa('modo_teste');\n", ''],
  ['pede sem tocar na visita', 'encomendas.js', "  if (h.feita !== true) return recusa('nao_tocada');\n", ''],
  ['pede com outra ativa', 'encomendas.js', "  if (encomendaAtiva(estado, dia)) return recusa('ja_ativa');\n", ''],
  ['várias por dia', 'encomendas.js', "  if (e.ultimoDia !== null && diaLisboaEfetivo(dia, e.ultimoDia) === e.ultimoDia) return recusa('ja_hoje');\n", ''],
  ['uma por dia ignora a data atrás', 'encomendas.js', 'diaLisboaEfetivo(dia, e.ultimoDia) === e.ultimoDia', 'dia === e.ultimoDia'],
  ['prazo de 3 dias', 'encomendas.js', 'const ENCOMENDAS_PRAZO_DIAS = 2;', 'const ENCOMENDAS_PRAZO_DIAS = 3;'],
  ['prazo acaba um dia mais cedo', 'encomendas.js', 'return depoisDoPrazo !== null && depoisDoPrazo > 0;', 'return depoisDoPrazo !== null && depoisDoPrazo >= 0;'],
  ['data adiantada não acaba', 'encomendas.js', '  if (ateAceite !== null && ateAceite > DIAS_FUTURO_MAXIMO) return true;\n', ''],
  ['escalão menor cumpre', 'encomendas.js', 'return Math.floor(d) >= a.escalao;', 'return Math.floor(d) >= a.escalao - 1;'],
  ['só escalão igual', 'encomendas.js', 'return Math.floor(d) >= a.escalao;', 'return Math.floor(d) === a.escalao;'],
  ['conta garrafas de antes', 'encomendas.js', 'indice < a.historicoInicio || indice >= h.length', 'indice < 0 || indice >= h.length'],
  ['conta a jeropiga', 'encomendas.js', "if (!g || typeof g !== 'object' || g.festa) return false;", "if (!g || typeof g !== 'object') return false;"],
  ['historicoInicio errado', 'encomendas.js', 'historicoInicio: h.length };', 'historicoInicio: 0 };'],
  ['conta duas vezes', 'encomendas.js', '  e.cumpridas += 1;\n  e.atual = null;\n', '  e.cumpridas += 1;\n'],
  ['gasta a garrafa', 'encomendas.js', '  e.cumpridas += 1;\n  e.atual = null;\n', '  e.cumpridas += 1;\n  e.atual = null;\n  estado.garrafas -= 1;\n'],
  ['prémio do Dourado errado', 'encomendas.js', 'const ENCOMENDA_PREMIO_DOURADO = { reputacao: 6, uvas: 30, gotas: 0 };', 'const ENCOMENDA_PREMIO_DOURADO = { reputacao: 16, uvas: 30, gotas: 0 };'],
  ['prémio do Cobre sem Gotas', 'encomendas.js', 'const ENCOMENDA_PREMIO_COBRE = { reputacao: 10, uvas: 0, gotas: 25 };', 'const ENCOMENDA_PREMIO_COBRE = { reputacao: 10, uvas: 0, gotas: 0 };'],
  ['expirar tira Reputação', 'encomendas.js', '  encomendasEstado(estado).atual = null;\n  return true;', '  encomendasEstado(estado).atual = null;\n  estado.reputacao -= 1;\n  return true;'],
  ['reparação aceita escalão 5', 'state.js', 'escalao < 1 || escalao > 4) return null;', 'escalao < 1 || escalao > 5) return null;'],
  ['reparação aceita datas mal escritas', 'state.js', "  if (typeof x !== 'string' || !/^\\d{4}-\\d{2}-\\d{2}$/.test(x)) return null;", "  if (typeof x !== 'string') return null; return x;"],
  ['reparação aceita cumpridas negativo', 'state.js', 'Number.isInteger(c) && c >= 0 ? c : 0', 'Number.isInteger(c) ? c : 0'],
  ['sem o campo no estado por omissão', 'state.js', '    encomendas: {\n      atual: null,\n      ultimoDia: null,\n      cumpridas: 0\n    }\n', '    encomendasX: {}\n'],
  ['nuvem: cumpridas desce', 'nuvem.js', 'cumpridas: Math.max(x.cumpridas, y.cumpridas)', 'cumpridas: y.cumpridas'],
  ['nuvem: ultimoDia fica o mais antigo', 'nuvem.js', 'ultimoDia: nuvemLevesMaisRecente(x.ultimoDia, y.ultimoDia)', 'ultimoDia: nuvemLevesMaisAntiga(x.ultimoDia, y.ultimoDia)'],
  ['nuvem: um null apaga a aceite', 'nuvem.js', '  else if (x.atual === null) atual = y.atual;\n  else if (y.atual === null) atual = x.atual;\n', '  else if (x.atual === null || y.atual === null) atual = null;\n'],
  ['nuvem: ignora quem tem mais cumpridas', 'nuvem.js', '  if (x.cumpridas > y.cumpridas) atual = x.atual;\n  else if (y.cumpridas > x.cumpridas) atual = y.atual;\n  else if', '  if'],
  ['nuvem: fica a mais antiga', 'nuvem.js', 'atual = chave(y.atual) > chave(x.atual) ? y.atual : x.atual;', 'atual = chave(y.atual) < chave(x.atual) ? y.atual : x.atual;'],
  ['nuvem: no mesmo dia depende da ordem', 'nuvem.js', "return e.aceiteDia + '|' + e.escalao", "return e.aceiteDia + '|' + 0"],
  ['nuvem: sem a área', 'nuvem.js', "'reserva', 'colecao', 'encomendas'];", "'reserva', 'colecao'];"],
  ['o engarrafar passa a chamá-las', 'garrafa.js', '    a.lote = null;\n    adegaGarrafaFeita', '    a.lote = null; if (typeof encomendaProcurarGarrafa === "function") encomendaProcurarGarrafa(state, "x");\n    adegaGarrafaFeita'],
  ['carregado antes de visitas.js', 'index.html', '  <script src="js/visitas.js?v=12"></script>\n', '']
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
