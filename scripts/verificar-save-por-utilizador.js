#!/usr/bin/env node
// O save local é POR UTILIZADOR do Telegram (STORAGE_KEY em js/state.js). No Telegram o localStorage é do
// telemóvel e não da conta: duas contas no mesmo aparelho partilhavam o save, e a conta nova copiava o da outra
// para a nuvem dela. Só LÊ js/ e corre-os num ambiente simulado (vm) com um utilizador do Telegram e uma nuvem
// (CloudStorage) falsos em memória, uma por conta: nunca toca em browser, Telegram nem conta real.
//
// Prova:
//  (a) a chave: com id inteiro > 0 é 'yoshicat_quinta_state_v2_u<ID>'; sem id (fora do Telegram, sem "user", id
//      que não é inteiro > 0) fica 'yoshicat_quinta_state_v2', e tudo corre como antes;
//  (b) jogador antigo, telemóvel novo, nuvem com save (o caso da mãe do Nuno): recupera tudo pela nuvem;
//  (c) conta nova com nuvem vazia num telemóvel com o save de OUTRA conta na chave antiga: começa do zero e nada da
//      outra conta chega à nuvem dela; o save antigo nunca se apaga nem se reescreve;
//  (d) duas contas no mesmo telemóvel, cada uma com a sua chave: cada uma lê e grava só a sua (e só a sua nuvem);
//  (e) «Apagar o meu progresso» (perfilApagarTudo, js/perfil.js) só toca na chave desta conta e na nuvem desta
//      conta: nunca na chave de outra conta nem na antiga; sem id apaga a antiga (como antes);
//  (f) com o jogo completo (scripts/_jogo-vm.js, utilizadorId) o estado guardado é o da chave do utilizador.
//
// Uso: node scripts/verificar-save-por-utilizador.js
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { abrirJogo, criarNuvemFalsa } = require('./_jogo-vm');

const RAIZ = path.join(__dirname, '..');
const ANTIGA = 'yoshicat_quinta_state_v2';
const chaveDe = function (id) { return ANTIGA + '_u' + id; };

let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }

function lerJs(f) { return fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'); }
// perfilApagarTudo() e perfilApagarBotoes() do perfil.js real (o ficheiro todo precisa de um ecrã inteiro).
function funcoesDeApagar() {
  const src = lerJs('perfil.js');
  function corta(nome) {
    const i = src.indexOf('function ' + nome + '(');
    const f = src.indexOf('\n}\n', i);
    if (i === -1 || f === -1) throw new Error('não encontrei ' + nome + ' em js/perfil.js');
    return src.slice(i, f + 3);
  }
  return corta('perfilApagarBotoes') + corta('perfilApagarTudo');
}
const APAGAR = funcoesDeApagar();
const TEMPO_CACHE = "const TEMPO_CACHE_KEY = 'yoshicat_tempo_cache_v1';\n";

// Abre o jogo (state.js + nuvem.js reais) como uma conta. utilizador: o objeto "user" do Telegram, ou undefined
// (sem "user"); sem nuvem: fora do Telegram. localStorageDados é partilhado entre contas do mesmo telemóvel.
function abrir(opcoes) {
  const o = opcoes;
  const relogio = o.relogio || { t: 20000000 };
  const temporizadores = [];
  let proximoId = 1;
  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(o.ls, k) ? o.ls[k] : null; },
      setItem: function (k, v) { o.ls[k] = String(v); },
      removeItem: function (k) { delete o.ls[k]; }
    },
    location: { search: '', reload: function () { sandbox._recarregou = true; } },
    URLSearchParams: URLSearchParams,
    document: {
      addEventListener: function () {}, querySelectorAll: function () { return []; },
      querySelector: function () { return null; }, getElementById: function () { return null; },
      visibilityState: 'visible'
    },
    setTimeout: function (fn, ms) { const id = proximoId++; temporizadores.push({ id: id, em: relogio.t + (ms || 0), fn: fn }); return id; },
    clearTimeout: function (id) { const i = temporizadores.findIndex(function (x) { return x.id === id; }); if (i !== -1) temporizadores.splice(i, 1); },
    applyTranslations: function () {},
    t: function (k) { return k; },
    showMessage: function () {},
    Date: class extends Date { static now() { return relogio.t; } }
  };
  sandbox.window = sandbox;
  sandbox.window.addEventListener = function () {};
  const webapp = {};
  if (o.nuvem) {
    webapp.initDataUnsafe = { auth_date: 1 };
    if (o.utilizador) webapp.initDataUnsafe.user = o.utilizador;
    webapp.CloudStorage = o.nuvem;
    webapp.isVersionAtLeast = function () { return true; };
  }
  sandbox.Telegram = { WebApp: webapp };
  const ctx = vm.createContext(sandbox);
  vm.runInContext(lerJs('state.js'), ctx, { filename: 'js/state.js' });
  vm.runInContext(lerJs('nuvem.js'), ctx, { filename: 'js/nuvem.js' });
  vm.runInContext(TEMPO_CACHE + APAGAR, ctx, { filename: 'js/perfil.js (apagar)' });
  const jogo = {
    ctx: ctx,
    ev: function (c) { return vm.runInContext(c, ctx); },
    recarregou: function () { return sandbox._recarregou === true; },
    avancar: function (ms) {
      const alvo = relogio.t + ms;
      for (;;) {
        temporizadores.sort(function (a, b) { return a.em - b.em; });
        if (!temporizadores.length || temporizadores[0].em > alvo) break;
        const x = temporizadores.shift();
        relogio.t = Math.max(relogio.t, x.em);
        x.fn();
      }
      relogio.t = alvo;
    }
  };
  return jogo;
}

function save(rep, em, extra) { return JSON.stringify(Object.assign({ reputacao: rep, uvas: rep, ultimaGravacaoEm: em }, extra || {})); }
function naNuvem(rep, em, extra) {
  const texto = save(rep, em, extra);
  return { yc_state_meta: JSON.stringify({ partes: 1, atualizadoEm: em }), yc_state_parte_0: texto };
}
function estadoDaNuvem(n) { return n.dados.yc_state_parte_0 ? JSON.parse(n.dados.yc_state_parte_0) : null; }

// =====================================================================
// (a) A chave
// =====================================================================
{
  const casos = [
    ['id 123456789', { id: 123456789 }, chaveDe(123456789)],
    ['id 1', { id: 1 }, chaveDe(1)],
    ['sem "user"', undefined, ANTIGA],
    ['"user" sem id', { first_name: 'x' }, ANTIGA],
    ['id 0', { id: 0 }, ANTIGA],
    ['id negativo', { id: -5 }, ANTIGA],
    ['id decimal', { id: 1.5 }, ANTIGA],
    ['id em texto', { id: '77' }, ANTIGA],
    ['id NaN', { id: NaN }, ANTIGA],
    ['id enorme (não seguro)', { id: 9007199254740993 }, ANTIGA]
  ];
  casos.forEach(function (c) {
    const g = abrir({ ls: {}, utilizador: c[1], nuvem: criarNuvemFalsa({}) });
    ok(g.ev('STORAGE_KEY') === c[2], '(a) ' + c[0] + ': a chave devia ser ' + c[2] + ' e é ' + g.ev('STORAGE_KEY'));
  });
  const fora = abrir({ ls: {}, nuvem: null });
  ok(fora.ev('STORAGE_KEY') === ANTIGA, '(a) fora do Telegram a chave é a de sempre');
  // Sem id nada muda: lê e grava na chave de sempre, como antes.
  const ls = {}; ls[ANTIGA] = save(50, 1000);
  const g = abrir({ ls: ls, nuvem: null });
  ok(g.ev('state.reputacao') === 50, '(a) sem id lê o save da chave de sempre');
  g.ev('state.reputacao = 60; saveState(state);');
  ok(JSON.parse(ls[ANTIGA]).reputacao === 60, '(a) sem id grava na chave de sempre');
  ok(Object.keys(ls).length === 1, '(a) sem id não aparece nenhuma chave nova: ' + Object.keys(ls).join(', '));
}

// =====================================================================
// (b) Jogador antigo, telemóvel novo, nuvem com save (o caso da mãe do Nuno)
// =====================================================================
{
  const ls = {};
  const nuvem = criarNuvemFalsa(naNuvem(800, 5000, { garrafas: 3 }));
  const g = abrir({ ls: ls, utilizador: { id: 222 }, nuvem: nuvem });
  g.avancar(20000);
  ok(g.ev('state.reputacao') === 800 && g.ev('state.garrafas') === 3 && g.ev('state.uvas') === 800, '(b) recupera tudo pela nuvem (Reputação, Uvas, Garrafas)');
  ok(ls[chaveDe(222)] && JSON.parse(ls[chaveDe(222)]).reputacao === 800, '(b) e fica no localStorage da conta, na chave dela');
  ok(!(ANTIGA in ls), '(b) a chave de sempre não aparece');
  ok(estadoDaNuvem(nuvem).reputacao === 800, '(b) a nuvem dela continua com 800');
  ok(g.ev("arranque.ganhou") === 'nuvem', '(b) ganhou a nuvem: ' + g.ev('arranque.ganhou'));
}

// =====================================================================
// (c) Conta nova, nuvem vazia, telemóvel com o save de OUTRA conta na chave antiga
// =====================================================================
{
  const ls = {};
  ls[ANTIGA] = save(1122, 9000, { uvas: 574, garrafas: 4 });
  const antes = ls[ANTIGA];
  const nuvem = criarNuvemFalsa({});
  const g = abrir({ ls: ls, utilizador: { id: 333 }, nuvem: nuvem });
  ok(g.ev('state.reputacao') === 0 && g.ev('state.uvas') === 0 && g.ev('state.garrafas') === 0, '(c) a conta nova começa do zero');
  g.avancar(60000); // a nuvem vazia confirma-se e, se houver o que copiar, copia-se
  ok(g.ev('state.reputacao') === 0 && g.ev('state.uvas') === 0, '(c) continua do zero depois das leituras da nuvem');
  g.ev('state.reputacao = 5; saveState(state);');
  g.avancar(5000);
  ok(ls[ANTIGA] === antes, '(c) o save antigo NUNCA é apagado nem reescrito (continua igual, byte a byte)');
  const todos = JSON.stringify(nuvem.dados);
  ok(todos.indexOf('1122') === -1 && todos.indexOf('574') === -1, '(c) nada da outra conta chega à nuvem da conta nova');
  const naN = estadoDaNuvem(nuvem);
  ok(naN === null || (naN.reputacao <= 5 && naN.uvas === 0), '(c) o que a nuvem da conta nova tem é só dela');
  ok(ls[chaveDe(333)] && JSON.parse(ls[chaveDe(333)]).reputacao === 5, '(c) grava só na chave dela');
  ok(g.ev('state.acesso.jogadorAntigo') !== true, '(c) não fica marcada como jogadora antiga por causa do save de outra conta');
}

// =====================================================================
// (d) Duas contas no mesmo telemóvel
// =====================================================================
{
  const ls = {};
  ls[chaveDe(1)] = save(50, 1000);
  const nuvemA = criarNuvemFalsa(naNuvem(50, 1000));
  const nuvemB = criarNuvemFalsa({});
  const relogio = { t: 30000000 };
  const A = abrir({ ls: ls, utilizador: { id: 1 }, nuvem: nuvemA, relogio: relogio });
  A.avancar(1000);
  ok(A.ev('state.reputacao') === 50, '(d) A abre com o seu save');
  A.ev('state.reputacao = 60; saveState(state);');
  A.avancar(2000);
  const B = abrir({ ls: ls, utilizador: { id: 2 }, nuvem: nuvemB, relogio: relogio });
  B.avancar(30000);
  ok(B.ev('state.reputacao') === 0, '(d) B (no mesmo telemóvel) começa do zero');
  B.ev('state.reputacao = 7; saveState(state);');
  B.avancar(5000);
  ok(JSON.parse(ls[chaveDe(1)]).reputacao === 60, '(d) a chave de A continua com 60 depois de B jogar');
  ok(JSON.parse(ls[chaveDe(2)]).reputacao === 7, '(d) a chave de B tem o jogo de B');
  ok(estadoDaNuvem(nuvemA).reputacao === 60, '(d) a nuvem de A tem o jogo de A');
  ok(estadoDaNuvem(nuvemB) !== null && estadoDaNuvem(nuvemB).reputacao === 7, '(d) a nuvem de B tem só o jogo de B');
  const A2 = abrir({ ls: ls, utilizador: { id: 1 }, nuvem: nuvemA, relogio: relogio });
  A2.avancar(30000);
  ok(A2.ev('state.reputacao') === 60, '(d) A volta a abrir e vê só o seu (60)');
}

// =====================================================================
// (e) «Apagar o meu progresso»
// =====================================================================
{
  const ls = {};
  ls[ANTIGA] = save(1122, 9000);
  ls[chaveDe(1)] = save(50, 1000);
  ls[chaveDe(2)] = save(70, 2000);
  ls.yoshicat_tempo_cache_v1 = '{}';
  const antiga = ls[ANTIGA], deDois = ls[chaveDe(2)];
  const nuvem1 = criarNuvemFalsa(naNuvem(50, 1000));
  const nuvem2 = criarNuvemFalsa(naNuvem(70, 2000));
  const g = abrir({ ls: ls, utilizador: { id: 1 }, nuvem: nuvem1 });
  g.avancar(1000);
  g.ev('perfilApagarTudo()');
  g.avancar(10000);
  ok(!(chaveDe(1) in ls), '(e) apaga a chave desta conta');
  ok(ls[ANTIGA] === antiga, '(e) não toca na chave antiga');
  ok(ls[chaveDe(2)] === deDois, '(e) não toca na chave de outra conta');
  ok(Object.keys(nuvem1.dados).filter(function (k) { return k.indexOf('yc_state_') === 0; }).length === 0, '(e) apaga a nuvem desta conta');
  ok(nuvem2.dados.yc_state_meta !== undefined, '(e) a nuvem de outra conta nem foi aberta');
  ok(g.recarregou() === true, '(e) depois de apagar, recarrega o jogo');

  // Sem id: apaga a chave de sempre e só essa (nunca as de utilizadores).
  const ls2 = {};
  ls2[ANTIGA] = save(40, 1000); ls2[chaveDe(9)] = save(90, 3000);
  const h = abrir({ ls: ls2, nuvem: null });
  h.ev('perfilApagarTudo()');
  h.avancar(10000);
  ok(!(ANTIGA in ls2), '(e) sem id apaga a chave de sempre');
  ok(chaveDe(9) in ls2, '(e) sem id nunca apaga a chave de um utilizador');
}

// =====================================================================
// (f) O jogo completo (scripts/_jogo-vm.js) com utilizador
// =====================================================================
{
  const comum = {};
  comum[ANTIGA] = save(1122, 9000);
  const A = abrirJogo({ utilizadorId: 11, estadoGuardado: save(30, 500), guardadoComum: comum, dadosDir: null });
  ok(A.ev('state.reputacao') === 30 && A.ev('STORAGE_KEY') === chaveDe(11), '(f) o jogo completo lê a chave do utilizador');
  const B = abrirJogo({ utilizadorId: 12, guardadoComum: comum, dadosDir: null });
  ok(B.ev('state.reputacao') === 0, '(f) outro utilizador no mesmo telemóvel começa do zero, mesmo com save antigo');
  const C = abrirJogo({ guardadoComum: comum, dadosDir: null });
  ok(C.ev('state.reputacao') === 1122, '(f) sem utilizador lê a chave de sempre');
}

if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); }
console.log('OK');
