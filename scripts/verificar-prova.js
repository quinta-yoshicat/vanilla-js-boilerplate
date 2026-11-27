#!/usr/bin/env node
// PROVA ÀS CEGAS, PR 1 (invisível): as regras puras de js/prova.js, o estado state.prova e a reparação (js/state.js), a
// junção na nuvem (js/nuvem.js) e os dados (o tipo 'provas' de js/dados.js e dados/provas.js). Corre os ficheiros REAIS em
// vm, sem browser nem conta real.
//
// Prova:
//  (a) as 3 cores do dia são diferentes entre si, só de 1 a 4, sempre as mesmas para o mesmo dia, e a descrição de cada
//      ronda é da cor certa; em 400 dias aparecem as 4 cores e as 20 descrições; sem Math.random nem relógio;
//  (b) pode jogar só no nível 6+ (com a Coleção aberta), uma vez por dia, fora do modo de teste;
//  (c) começar grava ultimoDia = hoje LOGO, sem dar nem tirar nada; a 2.ª no mesmo dia é recusada sem alterar nada;
//  (d) terminar: +6 Gotas por ronda certa, +3 de Reputação só com as 3; falhar não tira nada; soma dias e acertos; paga
//      uma só vez (toque duplo, sessão velha ou respostas estranhas são recusados sem alterar nada);
//  (e) relógio errado: com a data atrás não joga outra vez; um ultimoDia muito à frente não prende; a sessão começada num
//      dia termina bem mesmo que o dia mude a meio;
//  (f) reparação: jogador antigo abre bem; datas que não são AAAA-MM-DD passam a null e números inválidos a 0;
//  (g) nuvem com dois aparelhos: ultimoDia o mais recente, dias e acertos o maior; nunca desce; não altera os argumentos;
//  (h) dados: 5 descrições por cor e uma linha que ensina cada cor, nas 3 línguas, sem números, «dias», «horas», «anos»,
//      nem «Fygmo»; nenhuma descrição diz o nome de uma cor; a linha que ensina diz o da sua; o validador rejeita o que
//      não presta;
//  (i) só js/prova.js, js/state.js, js/nuvem.js, js/dados.js, (desde a PR 2) js/prova-jogo.js e (desde a PR 3)
//      js/objetivos.js (só provaPodeJogar) conhecem as regras;
//      js/garrafa.js e js/reserva.js não usam as regras); o index.html carrega js/prova.js?v=1 depois de js/encomendas.js e
//      antes de js/dados.js, e dados/provas.js a seguir aos outros dados/.
//
// Depois de passar, aplica "mutações" e confirma que o teste as apanha.
// Uso: node scripts/verificar-prova.js     Sai com 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const LER = function (f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); };
const FONTES = { 'state.js': LER('js/state.js'), 'nuvem.js': LER('js/nuvem.js'), 'niveis.js': LER('js/niveis.js'), 'prova.js': LER('js/prova.js'), 'dados.js': LER('js/dados.js'), 'provas.js': LER('dados/provas.js'), 'index.html': LER('index.html'), 'garrafa.js': LER('js/garrafa.js'), 'reserva.js': LER('js/reserva.js') };
const J = JSON.stringify;
const DATE_NOW = Date.now;
// as funções e constantes de js/prova.js (e de state.js); provaDia (js/camara.js) e provaTitulo (js/festas.js) são outra coisa
const PROVA_NOMES_G = /\bprova(Hash|RondasDoDia|Nivel|PodeJogar|Comecar|Verificar|Premio|Numero|Terminar|Ensino|Normalizar|Estado)\b|\bPROVA_[A-Z_]+\b|\bstate\.prova\b/g;
const PROVA_NOMES = /\b(prova(Hash|RondasDoDia|Nivel|PodeJogar|Comecar|Verificar|Premio|Numero|Terminar|Ensino|Normalizar|Estado)|PROVA_[A-Z_]+)\b|\bstate\.prova\b/;
const DIA = '2026-10-10';
const REP_NIVEL = { 1: 0, 5: 300, 6: 600, 7: 1000 };

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }

  function abrir(o) {
    o = o || {};
    const avisos = [];
    const sb = {
      console: { log() {}, warn: function (m) { avisos.push(String(m)); }, error() {} },
      localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
      location: { search: o.search || '' }, URLSearchParams: URLSearchParams, Intl: Intl,
      document: { addEventListener: function () {}, querySelectorAll: function () { return []; }, querySelector: function () { return null; }, getElementById: function () { return null; }, visibilityState: 'visible' },
      setTimeout: function () { return 1; }, clearTimeout: function () {}, applyTranslations: function () {}, t: function (k) { return k; }, Date: Date
    };
    sb.window = sb; sb.window.addEventListener = function () {}; sb.Telegram = { WebApp: {} };
    const cx = vm.createContext(sb);
    require('./_regras-tempo').injetarRegrasTempo(cx);
    vm.runInContext(fontes['state.js'], cx, { filename: 'state.js' });
    vm.runInContext(fontes['nuvem.js'], cx, { filename: 'nuvem.js' });
    vm.runInContext(fontes['niveis.js'], cx, { filename: 'niveis.js' });
    vm.runInContext(fontes['prova.js'], cx, { filename: 'prova.js' });
    vm.runInContext(fontes['dados.js'], cx, { filename: 'dados.js' });
    if (o.semDados !== true) vm.runInContext(fontes['provas.js'], cx, { filename: 'dados/provas.js' });
    vm.runInContext('function visitaEmModoTeste() { return /[?&](visita|dias|prova)=/.test(location.search); }', cx);
    const g = { cx: cx, avisos: avisos };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
    g.nivel = function (n, antigo) { g.ev('state = defaultState(); state.reputacao = ' + REP_NIVEL[n] + '; state.acesso.jogadorAntigo = ' + (antigo ? 'true' : 'false') + '; state.gotas = 50;'); };
    return g;
  }
  const somar = function (g, d, n) { return g.ev("(function () { var p = diaLisboaPartes('" + d + "'); var x = new Date(Date.UTC(p.ano, p.mes, p.dia + " + n + ")); return x.toISOString().slice(0, 10); })()"); };

  // ---------------------------------------------------------------- (a) as rondas do dia
  {
    const g = abrir();
    let mal = 0, distintas = 0; const cores = {}, descricoes = {};
    for (let i = 0; i < 400; i++) {
      const d = somar(g, '2026-01-01', i);
      const r = g.json("provaRondasDoDia('" + d + "')");
      if (r.length !== 3) { mal++; continue; }
      const cs = r.map(function (x) { return x.cor; });
      if (new Set(cs).size === 3) distintas++;
      r.forEach(function (x, k) {
        if (x.ronda !== k + 1 || [1, 2, 3, 4].indexOf(x.cor) === -1) mal++;
        const desc = g.json('PROVA_DESCRICOES').filter(function (e) { return e.id === x.descricao.id; })[0];
        if (!desc || desc.cor !== x.cor || x.descricao.texto.pt !== desc.texto.pt) mal++;
        cores[x.cor] = true; descricoes[x.descricao.id] = true;
      });
      if (J(r) !== J(g.json("provaRondasDoDia('" + d + "')"))) mal++;
    }
    ok(mal === 0, '(a) 400 dias: 3 rondas, cores de 1 a 4, a descrição da cor certa e sempre as mesmas para o mesmo dia (' + mal + ' erros)');
    ok(distintas === 400, '(a) as 3 cores de cada dia são diferentes entre si (' + distintas + '/400)');
    ok(Object.keys(cores).length === 4 && Object.keys(descricoes).length === 20, '(a) em 400 dias aparecem as 4 cores e as 20 descrições (' + Object.keys(cores).length + ', ' + Object.keys(descricoes).length + ')');
    ok(J(g.json("provaRondasDoDia('" + DIA + "')")) !== J(g.json("provaRondasDoDia('2026-10-11')")), '(a) o dia muda as rondas');
    ok(g.json("provaRondasDoDia('ontem')").length === 0 && g.json("provaRondasDoDia('2026-02-30')").length === 0, '(a) dia inválido: sem rondas');
    const src = fontes['prova.js'].replace(/\/\/.*$/gm, '');
    ok(!/Math\.random|Date\.now|new Date\(|saveState|localStorage/.test(src), '(a) js/prova.js sem Math.random, sem relógio, sem gravar');
    const p = abrir(); p.nivel(6);
    p.ev('Math.random = function () { throw new Error("Math.random"); }; Date.now = function () { throw new Error("Date.now"); };');
    // (o Date do vm é o mesmo de fora: repõe-se o Date.now no fim)
    let rebentou = false;
    try { p.ev("var s = provaComecar(state, '" + DIA + "', false).sessao; provaTerminar(state, s, s.rondas.map(function (r) { return r.cor; }))"); } catch (e) { rebentou = true; } finally { Date.now = DATE_NOW; }
    ok(!rebentou, '(a) corre sem Math.random nem Date.now');
  }

  // ---------------------------------------------------------------- (b) pode jogar
  {
    const g = abrir();
    const pode = function (n, antigo, dia, teste) { g.nivel(n, antigo); return g.json("provaPodeJogar(state, '" + (dia || DIA) + "', " + (teste ? 'true' : 'false') + ')'); };
    ok(pode(5).motivo === 'nivel', '(b) nível 5: não joga');
    g.nivel(5); g.ev('var ecraDesbloqueadoOriginal = ecraDesbloqueado; ecraDesbloqueado = function () { return true; };');
    ok(g.json("provaPodeJogar(state, '" + DIA + "', false)").motivo === 'nivel', '(b) nível 5 mesmo com a Coleção aberta: não joga (o nível conta por si)');
    g.ev("ecraDesbloqueado = ecraDesbloqueadoOriginal;");
    ok(pode(1, true).motivo === 'nivel', '(b) jogador antigo no nível 1: não joga (a prova é do nível 6)');
    ok(pode(6).ok === true && pode(7).ok === true, '(b) níveis 6 e 7: joga');
    ok(pode(6, false, DIA, true).motivo === 'modo_teste', '(b) modo de teste: não joga');
    ok(pode(6, false, 'amanha').motivo === 'dia', '(b) dia inválido: não joga');
    g.nivel(6); g.ev("ecraDesbloqueado = function () { return false; };");
    ok(g.json("provaPodeJogar(state, '" + DIA + "', false)").motivo === 'nivel', '(b) com a Coleção fechada (ecraDesbloqueado): não joga');
    const s = abrir({ semDados: true }); s.nivel(6);
    ok(s.json("provaPodeJogar(state, '" + DIA + "', false)").motivo === 'sem_textos', '(b) sem as descrições de dados/: não joga');
    const t = abrir({ search: '?prova=1' }); t.nivel(6);
    ok(t.json("provaComecar(state, '" + DIA + "', visitaEmModoTeste())").ok === false && t.ev('state.prova.ultimoDia') === null, '(b) em modo de teste começar não grava nada');
  }

  // ---------------------------------------------------------------- (c) começar
  {
    const g = abrir(); g.nivel(6);
    const antes = g.json('[state.gotas, state.reputacao, state.prova.dias, state.prova.acertos]');
    const r = g.json("(function () { var r = provaComecar(state, '" + DIA + "', false); __s = r.sessao; return r; })()");
    ok(r.ok && g.ev('state.prova.ultimoDia') === DIA, '(c) começar grava ultimoDia = hoje logo');
    ok(r.sessao && r.sessao.dia === DIA && r.sessao.paga === false && J(r.sessao.rondas) === J(g.json("provaRondasDoDia('" + DIA + "')")), '(c) a sessão tem o dia e as rondas do dia');
    ok(J(g.json('[state.gotas, state.reputacao, state.prova.dias, state.prova.acertos]')) === J(antes), '(c) começar não dá nem tira nada');
    const e = g.ev('JSON.stringify(state)');
    const r2 = g.json("provaComecar(state, '" + DIA + "', false)");
    ok(!r2.ok && r2.motivo === 'ja_hoje' && g.ev('JSON.stringify(state)') === e, '(c) a 2.ª no mesmo dia (quem fechou a app a meio) é recusada sem alterar nada');
    ok(g.json("provaPodeJogar(state, '" + somar(g, DIA, 1) + "', false)").ok === true, '(c) no dia seguinte volta a poder');
  }

  // ---------------------------------------------------------------- (d) terminar e prémio
  {
    ok(J(abrir().json('[provaPremio(0), provaPremio(1), provaPremio(2), provaPremio(3)]')) === J([{ gotas: 0, reputacao: 0 }, { gotas: 6, reputacao: 0 }, { gotas: 12, reputacao: 0 }, { gotas: 18, reputacao: 3 }]), '(d) prémio: +6 Gotas por certa, +3 de Reputação só com as 3');
    ok(abrir().ev('PROVA_GOTAS_POR_CERTA') === 6 && abrir().ev('PROVA_REPUTACAO_TODAS_CERTAS') === 3, '(d) as constantes no topo');
    [[3, 18, 3], [2, 12, 0], [1, 6, 0], [0, 0, 0]].forEach(function (c) {
      const g = abrir(); g.nivel(6);
      g.ev("__s = provaComecar(state, '" + DIA + "', false).sessao;");
      // respostas: as certas nas primeiras c[0] rondas, uma errada (outra cor) nas restantes
      g.ev('__r = __s.rondas.map(function (r, i) { return i < ' + c[0] + ' ? r.cor : (r.cor % 4) + 1; });');
      const antes = g.json('[state.gotas, state.reputacao]');
      const t = g.json('provaTerminar(state, __s, __r)');
      ok(t.ok && t.certas === c[0] && g.ev('state.gotas') - antes[0] === c[1] && g.ev('state.reputacao') - antes[1] === c[2], '(d) ' + c[0] + ' certas: +' + c[1] + ' Gotas e +' + c[2] + ' de Reputação');
      ok(g.ev('state.prova.dias') === 1 && g.ev('state.prova.acertos') === c[0], '(d) ' + c[0] + ' certas: dias 1, acertos ' + c[0]);
      ok(g.ev('state.gotas') >= antes[0] && g.ev('state.reputacao') >= antes[1], '(d) falhar não tira nada');
      const e = g.ev('JSON.stringify(state)');
      const t2 = g.json('provaTerminar(state, __s, __r)');
      ok(!t2.ok && t2.motivo === 'ja_paga' && g.ev('JSON.stringify(state)') === e, '(d) toque duplo: não paga outra vez');
    });
    const g = abrir(); g.nivel(6);
    g.ev("__s = provaComecar(state, '" + DIA + "', false).sessao;");
    const e = g.ev('JSON.stringify(state)');
    [['[1, 2]', 'respostas'], ['[1, 2, 9]', 'respostas'], ['"x"', 'respostas'], ['[1, "2", 3]', 'respostas']].forEach(function (c) {
      const t = g.json('provaTerminar(state, __s, ' + c[0] + ')');
      ok(!t.ok && t.motivo === c[1] && g.ev('JSON.stringify(state)') === e && g.ev('__s.paga') === false, '(d) respostas ' + c[0] + ': recusadas sem alterar nada');
    });
    ok(!g.json('provaTerminar(state, null, [1, 2, 3])').ok && !g.json('provaTerminar(state, { dia: "x", rondas: [] }, [1, 2, 3])').ok && g.ev('JSON.stringify(state)') === e, '(d) sem sessão (ou estragada): recusa');
    // uma sessão de outro dia (o ultimoDia já é outro) não paga
    g.ev("state.prova.ultimoDia = '2026-10-12';");
    const t = g.json('provaTerminar(state, __s, __s.rondas.map(function (r) { return r.cor; }))');
    ok(!t.ok && t.motivo === 'outro_dia' && g.ev('state.prova.dias') === 0, '(d) uma sessão velha (já houve outra prova) não paga');
    ok(g.ev('provaVerificar(__s, 0, __s.rondas[0].cor)') === true && g.ev('provaVerificar(__s, 0, (__s.rondas[0].cor % 4) + 1)') === false && g.ev('provaVerificar(__s, 5, 1)') === false && g.ev('provaVerificar(null, 0, 1)') === false, '(d) verificar uma ronda');
  }

  // ---------------------------------------------------------------- (e) relógio errado e mudar de dia
  {
    const g = abrir(); g.nivel(6);
    g.ev("state.prova.ultimoDia = '2026-10-11';");
    ok(g.json("provaPodeJogar(state, '" + DIA + "', false)").motivo === 'ja_hoje', '(e) data atrás (um dia): ainda conta como o dia da última prova');
    g.ev("state.prova.ultimoDia = '2026-10-12';");
    ok(g.json("provaPodeJogar(state, '" + DIA + "', false)").motivo === 'ja_hoje', '(e) data atrás (dois dias): ainda não joga');
    g.ev("state.prova.ultimoDia = '2026-10-20';");
    ok(g.json("provaPodeJogar(state, '" + DIA + "', false)").ok === true, '(e) um ultimoDia muito à frente (data adiantada que voltou ao normal) não prende');
    const m = abrir(); m.nivel(6);
    m.ev("__s = provaComecar(state, '" + DIA + "', false).sessao;");
    const t = m.json('provaTerminar(state, __s, __s.rondas.map(function (r) { return r.cor; }))');
    ok(t.ok && t.certas === 3 && m.ev('state.prova.ultimoDia') === DIA, '(e) a sessão começada hoje termina bem mesmo que o dia mude a meio (o prémio é da sessão)');
  }

  // ---------------------------------------------------------------- (f) estado e reparação
  {
    const g = abrir();
    ok(J(g.json('defaultState().prova')) === J({ ultimoDia: null, dias: 0, acertos: 0 }), '(f) estado por omissão');
    ok(J(g.json('mergeDeep(defaultState(), { reputacao: 700 }).prova')) === J({ ultimoDia: null, dias: 0, acertos: 0 }), '(f) jogador antigo (sem o campo) abre com a prova vazia');
    [['null', null, { ultimoDia: null, dias: 0, acertos: 0 }], ['texto', 'x', { ultimoDia: null, dias: 0, acertos: 0 }], ['lista', [1], { ultimoDia: null, dias: 0, acertos: 0 }],
      ['data mal escrita', { ultimoDia: '10/10/2026', dias: 2, acertos: 5 }, { ultimoDia: null, dias: 2, acertos: 5 }],
      ['data impossível', { ultimoDia: '2026-02-30', dias: 1, acertos: 1 }, { ultimoDia: null, dias: 1, acertos: 1 }],
      ['números estranhos', { ultimoDia: DIA, dias: -1, acertos: 2.5 }, { ultimoDia: DIA, dias: 0, acertos: 0 }],
      ['números em texto', { ultimoDia: DIA, dias: '3', acertos: null }, { ultimoDia: DIA, dias: 0, acertos: 0 }],
      ['chaves a mais', { ultimoDia: DIA, dias: 4, acertos: 9, lixo: true }, { ultimoDia: DIA, dias: 4, acertos: 9 }]
    ].forEach(function (c) {
      g.cx.__x = { prova: JSON.parse(J(c[1])) };
      const r = g.json('provaEstado(__x)');
      ok(J(r) === J(c[2]) && J(g.json('__x.prova')) === J(c[2]), '(f) ' + c[0] + ': ' + J(r));
    });
    let rebentou = false;
    try { ['null', '{}', '{ prova: "x", reputacao: "y" }'].forEach(function (s) { g.ev('provaPodeJogar(' + s + ", '" + DIA + "', false); provaComecar(" + s + ", '" + DIA + "', false); provaTerminar(" + s + ', null, null)'); }); } catch (e) { rebentou = true; }
    ok(!rebentou, '(f) com estados estranhos nada rebenta');
  }

  // ---------------------------------------------------------------- (g) nuvem
  {
    const g = abrir();
    const juntar = function (a, b) { g.cx.__a = JSON.parse(J({ prova: a })); g.cx.__b = JSON.parse(J({ prova: b })); return g.json('nuvemJuntarLeves(__a, __b).prova'); };
    ok(g.json('NUVEM_LEVES_AREAS').indexOf('prova') !== -1, '(g) a prova está nas áreas leves');
    let r = juntar({ ultimoDia: '2026-10-09', dias: 5, acertos: 9 }, { ultimoDia: '2026-10-10', dias: 3, acertos: 11 });
    ok(J(r) === J({ ultimoDia: '2026-10-10', dias: 5, acertos: 11 }), '(g) ultimoDia o mais recente, dias e acertos o maior: ' + J(r));
    ok(J(juntar({ ultimoDia: '2026-10-10', dias: 3, acertos: 11 }, { ultimoDia: '2026-10-09', dias: 5, acertos: 9 })) === J(r), '(g) a ordem não importa');
    ok(J(juntar('lixo', { ultimoDia: DIA, dias: 1, acertos: 2 })) === J({ ultimoDia: DIA, dias: 1, acertos: 2 }) && J(juntar(undefined, undefined)) === J({ ultimoDia: null, dias: 0, acertos: 0 }), '(g) um lado estragado conta como vazio; a forma é a do defaultState()');
    let s = 11; const rnd = function (n) { s = (s * 1103515245 + 12345) % 2147483648; return s % n; };
    const dias = ['2026-10-05', '2026-10-06', '2026-10-07', null];
    let desceu = 0;
    for (let i = 0; i < 300; i++) {
      const a = { ultimoDia: dias[rnd(4)], dias: rnd(9), acertos: rnd(20) }, b = { ultimoDia: dias[rnd(4)], dias: rnd(9), acertos: rnd(20) };
      const m = juntar(a, b);
      [a, b].forEach(function (x) { if (m.dias < x.dias || m.acertos < x.acertos || (x.ultimoDia && (!m.ultimoDia || m.ultimoDia < x.ultimoDia))) desceu++; });
    }
    ok(desceu === 0, '(g) em 300 junções nada desce (' + desceu + ')');
    g.cx.__a = { prova: { ultimoDia: DIA, dias: 1, acertos: 2 } }; g.cx.__b = { prova: null };
    const antes = g.ev('JSON.stringify([__a, __b])'); g.ev('nuvemJuntarLeves(__a, __b)');
    ok(g.ev('JSON.stringify([__a, __b])') === antes, '(g) a junção não altera os argumentos');
  }

  // ---------------------------------------------------------------- (h) dados
  {
    const g = abrir();
    ok(g.avisos.length === 0, '(h) carregar dados/provas.js não devia avisar nada: ' + g.avisos.join(' | '));
    const D = g.json('PROVA_DESCRICOES'), E = g.json('PROVA_ENSINO');
    ok(D.length === 20 && [1, 2, 3, 4].every(function (c) { return D.filter(function (d) { return d.cor === c; }).length === 5; }), '(h) 5 descrições por cor (20)');
    ok([1, 2, 3, 4].every(function (c) { return E[c] && E[c].texto; }) && Object.keys(E).length === 4, '(h) uma linha que ensina por cor');
    const NOMES = { 1: { pt: /jovem/i, en: /young/i, es: /joven/i }, 2: { pt: /dourad/i, en: /golden/i, es: /dorad/i }, 3: { pt: /[âa]mbar/i, en: /amber/i, es: /[áa]mbar/i }, 4: { pt: /cobre/i, en: /copper/i, es: /cobr/i } };
    const PROIBIDO = /\d|\b(dias?|days?|d[ií]as?|horas?|hours?|anos?|years?|a[ñn]os?)\b|fygmo/i;
    ['pt', 'en', 'es'].forEach(function (l) {
      D.forEach(function (d) {
        const x = d.texto[l];
        ok(typeof x === 'string' && x.trim().length >= 20, '(h) ' + d.id + ' em ' + l + ': texto curto de mais ou em falta');
        ok(!PROIBIDO.test(x), '(h) ' + d.id + ' em ' + l + ': tem números, «dias», «horas», «anos» ou «Fygmo»');
        ok([1, 2, 3, 4].every(function (c) { return !NOMES[c][l].test(x); }), '(h) ' + d.id + ' em ' + l + ': diz o nome de uma cor');
      });
      [1, 2, 3, 4].forEach(function (c) {
        const x = E[c].texto[l];
        ok(NOMES[c][l].test(x) && [1, 2, 3, 4].every(function (o) { return o === c || !NOMES[o][l].test(x); }) && !PROIBIDO.test(x), '(h) a linha que ensina a cor ' + c + ' em ' + l + ' diz o nome da sua cor e de mais nenhuma: ' + x);
      });
      ok(new Set(D.map(function (d) { return d.texto[l]; })).size === 20, '(h) ' + l + ': as 20 descrições são todas diferentes');
    });
    ok(/mel e frutos secos/.test(E[3].texto.pt) && /figo e noz/.test(E[4].texto.pt), '(h) usa as palavras do jogo («mel e frutos secos», «figo e noz»)');
    // o validador
    const v = abrir({ semDados: true });
    const tenta = function (e) { return v.ev('dadosAcrescentar("provas", ' + J(e) + ')'); };
    const bom = function (extra) { return Object.assign({ id: 'prova_t', cor: 2, texto: { pt: 'Brilho de ouro, mel novo e casca de laranja.', en: 'Gold shine, new honey and orange peel.', es: 'Brillo de oro, miel nueva y piel de naranja.' } }, extra || {}); };
    ok(tenta(bom()) === true && v.ev('PROVA_DESCRICOES.length') === 1, '(h) uma entrada boa entra');
    const mau = [
      ['id repetido', bom()], ['sem id', bom({ id: '' })], ['cor 0', bom({ id: 'p1', cor: 0 })], ['cor 5', bom({ id: 'p2', cor: 5 })], ['cor em texto', bom({ id: 'p3', cor: '2' })],
      ['sem en', bom({ id: 'p4', texto: { pt: 'Mel novo e laranja.', es: 'Miel nueva y naranja.' } })],
      ['com números', bom({ id: 'p5', texto: { pt: 'Descansou 2 noites.', en: 'Rested two nights.', es: 'Reposó dos noches.' } })],
      ['com «dias»', bom({ id: 'p6', texto: { pt: 'Descansou poucos dias.', en: 'Short rest.', es: 'Poco reposo.' } })],
      ['com «horas»', bom({ id: 'p7', texto: { pt: 'Poucas horas na Cave.', en: 'Short rest.', es: 'Poco reposo.' } })],
      ['com «anos»', bom({ id: 'p8', texto: { pt: 'Mel e figo.', en: 'Many years old.', es: 'Poco reposo.' } })],
      ['com «años»', bom({ id: 'p9', texto: { pt: 'Mel e figo.', en: 'Honey and fig.', es: 'Muchos años.' } })],
      ['com «Fygmo2»', bom({ id: 'p10', texto: { pt: 'O Fygmo2 gostou.', en: 'Honey and fig.', es: 'Miel e higo.' } })],
      ['descrição com o nome de uma cor', bom({ id: 'p11', texto: { pt: 'Quase âmbar, com mel.', en: 'Honey and fig.', es: 'Miel e higo.' } })],
      ['ensino sem o nome da cor', bom({ id: 'p12', ensino: true, texto: { pt: 'Algum descanso, cor de ouro.', en: 'Golden: some rest.', es: 'Dorado: algo de reposo.' } })],
      ['ensino com outra cor', bom({ id: 'p13', ensino: true, texto: { pt: 'Dourado: entre o jovem e o mais escuro.', en: 'Golden: some rest.', es: 'Dorado: algo de reposo.' } })],
      ['ensino não true', bom({ id: 'p14', ensino: 'sim' })]
    ];
    mau.forEach(function (c) { const n = v.ev('PROVA_DESCRICOES.length'); ok(tenta(c[1]) === false && v.ev('PROVA_DESCRICOES.length') === n, '(h) o validador devia rejeitar: ' + c[0]); });
    ok(tenta(bom({ id: 'p15', ensino: true, texto: { pt: 'Dourado: algum descanso.', en: 'Golden: some rest.', es: 'Dorado: algo de reposo.' } })) === true && tenta(bom({ id: 'p16', ensino: true, texto: { pt: 'Dourado: outra vez.', en: 'Golden: again.', es: 'Dorado: otra vez.' } })) === false, '(h) só uma linha que ensina por cor');
  }

  // ---------------------------------------------------------------- (i) invisível
  {
    const quem = fs.readdirSync(path.join(RAIZ, 'js')).filter(function (f) {
      if (!/\.js$/.test(f) || f === 'prova.js') return false;
      const s = (FONTES[f] !== undefined ? fontes[f] : LER('js/' + f)).replace(/\/\/.*$/gm, '');
      return PROVA_NOMES.test(s);
    }).sort();
    ok(J(quem) === J(['dados.js', 'nuvem.js', 'objetivos.js', 'prova-jogo.js', 'state.js']), '(i) só js/state.js, js/nuvem.js, js/dados.js, desde a PR 2 js/prova-jogo.js (o ecrã da prova) e desde a PR 3 js/objetivos.js (o sinal da Quinta, só provaPodeJogar) conhecem as regras: ' + J(quem));
    ok((LER('js/objetivos.js').replace(/\/\/.*$/gm, '').match(PROVA_NOMES_G) || []).every(function (n) { return n === 'provaPodeJogar'; }), '(i) js/objetivos.js só usa provaPodeJogar (só lê)');
    ok(!PROVA_NOMES.test(fontes['garrafa.js']) && !PROVA_NOMES.test(fontes['reserva.js']), '(i) js/garrafa.js e js/reserva.js (a Coleção) não usam as regras da prova (desde a PR 2 a Coleção só desenha o que js/prova-jogo.js lhe dá)');
    const I = fontes['index.html'];
    const pos = function (f) { return I.indexOf('<script src="' + f + '?v='); };
    ok(/<script src="js\/prova\.js\?v=1"><\/script>/.test(I) && pos('js/encomendas.js') > 0 && pos('js/prova.js') > pos('js/encomendas.js') && pos('js/prova.js') < pos('js/dados.js') && pos('js/niveis.js') < pos('js/prova.js'), '(i) js/prova.js?v=1 depois de js/encomendas.js (e de js/niveis.js) e antes de js/dados.js');
    ok(/<script src="dados\/provas\.js\?v=\d+"><\/script>/.test(I) && pos('dados/provas.js') > pos('dados/palavras.js') && pos('dados/palavras.js') > 0 && pos('dados/provas.js') < pos('js/main.js'), '(i) dados/provas.js a seguir aos outros dados/ e antes de js/main.js');
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
  ['cores repetidas', 'prova.js', "const cor = livres.splice(provaHash(dia + '#prova#' + r) % livres.length, 1)[0];", 'const cor = livres[provaHash(dia) % livres.length];'],
  ['cores ao acaso', 'prova.js', "const cor = livres.splice(provaHash(dia + '#prova#' + r) % livres.length, 1)[0];", 'const cor = livres.splice(Math.floor(Math.random() * livres.length), 1)[0];'],
  ['sempre a 1.ª descrição', 'prova.js', "const d = daCor[provaHash(dia + '#prova#' + r + '#descricao') % daCor.length];", 'const d = daCor[0];'],
  ['nível 5', 'prova.js', 'const PROVA_NIVEL_MINIMO = 6;', 'const PROVA_NIVEL_MINIMO = 5;'],
  ['ignora a Coleção fechada', 'prova.js', "  try { if (typeof ecraDesbloqueado === 'function' && !ecraDesbloqueado('colecao')) return recusa('nivel'); } catch (e) { return recusa('nivel'); }\n", ''],
  ['joga em modo de teste', 'prova.js', "  if (modoTeste === true) return recusa('modo_teste');\n  if (!estado", '  if (!estado'],
  ['várias por dia', 'prova.js', "  if (p.ultimoDia !== null && diaLisboaEfetivo(dia, p.ultimoDia) === p.ultimoDia) return recusa('ja_hoje');\n", ''],
  ['uma por dia ignora a data atrás', 'prova.js', 'diaLisboaEfetivo(dia, p.ultimoDia) === p.ultimoDia', 'dia === p.ultimoDia'],
  ['não grava ao começar', 'prova.js', '  provaEstado(estado).ultimoDia = dia;\n  return { ok: true', '  return { ok: true'],
  ['prémio de 8 Gotas', 'prova.js', 'const PROVA_GOTAS_POR_CERTA = 6;', 'const PROVA_GOTAS_POR_CERTA = 8;'],
  ['Reputação com 2 certas', 'prova.js', 'reputacao: n === PROVA_RONDAS ? PROVA_REPUTACAO_TODAS_CERTAS : 0', 'reputacao: n >= PROVA_RONDAS - 1 ? PROVA_REPUTACAO_TODAS_CERTAS : 0'],
  ['falhar tira Gotas', 'prova.js', '  estado.gotas = provaNumero(estado.gotas) + premio.gotas;', '  estado.gotas = provaNumero(estado.gotas) + premio.gotas - (PROVA_RONDAS - certas);'],
  ['paga duas vezes', 'prova.js', "  if (sessao.paga === true) return recusa('ja_paga');\n", ''],
  ['não soma dias', 'prova.js', '  e.dias += 1;\n', ''],
  ['paga uma sessão velha', 'prova.js', "  if (p.ultimoDia !== sessao.dia) return recusa('outro_dia');\n", ''],
  ['respostas estranhas contam', 'prova.js', " || !respostas.every(function (c) { return PROVA_CORES.indexOf(c) !== -1; })) return recusa('respostas');", ") return recusa('respostas');"],
  ['reparação aceita datas mal escritas', 'state.js', 'return { ultimoDia: encomendasDataValida(p.ultimoDia), dias: inteiro(p.dias), acertos: inteiro(p.acertos) };', 'return { ultimoDia: typeof p.ultimoDia === "string" ? p.ultimoDia : null, dias: inteiro(p.dias), acertos: inteiro(p.acertos) };'],
  ['reparação aceita negativos', 'state.js', "const inteiro = function (n) { return typeof n === 'number' && Number.isInteger(n) && n >= 0 ? n : 0; };", "const inteiro = function (n) { return typeof n === 'number' && Number.isInteger(n) ? n : 0; };"],
  ['sem o campo no estado', 'state.js', '    prova: {\n      ultimoDia: null,\n      dias: 0,\n      acertos: 0\n    },\n', '    provaX: {},\n'],
  ['nuvem: dias desce', 'nuvem.js', 'dias: Math.max(x.dias, y.dias)', 'dias: y.dias'],
  ['nuvem: ultimoDia o mais antigo', 'nuvem.js', 'ultimoDia: nuvemLevesMaisRecente(x.ultimoDia, y.ultimoDia), dias: Math.max', 'ultimoDia: nuvemLevesMaisAntiga(x.ultimoDia, y.ultimoDia), dias: Math.max'],
  ['nuvem: sem a área', 'nuvem.js', "'encomendas', 'prova', 'moinho'];", "'encomendas', 'moinho'];"],
  ['validador aceita números', 'dados.js', 'const DADOS_PROVA_PROIBIDO = /\\d|', 'const DADOS_PROVA_PROIBIDO = /'],
  ['validador aceita «dias»', 'dados.js', '\\b(dias?|days?|d[ií]as?|horas?', '\\b(days?|horas?'],
  ['validador aceita o nome da cor', 'dados.js', "      if (tem && (e.ensino !== true || c !== e.cor)) return", '      if (false) return'],
  ['validador aceita cor 5', 'dados.js', 'e.cor < 1 || e.cor > 4)', 'e.cor < 1 || e.cor > 5)'],
  ['uma descrição a menos', 'provas.js', "dadosAcrescentar('provas', { id: 'prova_cobre_5'", "dadosAcrescentar('provasX', { id: 'prova_cobre_5'"],
  ['descrição com o nome da cor', 'provas.js', "  pt: 'Cor de mel escuro, cheira a mel e frutos secos.", "  pt: 'Âmbar, cor de mel escuro, cheira a mel e frutos secos."],
  ['o jogo já chama a prova', 'garrafa.js', 'function garrafaLegenda(g) {', 'function garrafaProva() { return provaComecar(state, "x", false); }\nfunction garrafaLegenda(g) {'],
  ['carregada depois de dados.js', 'index.html', '  <script src="js/prova.js?v=1"></script>\n', '']
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
