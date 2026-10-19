#!/usr/bin/env node
// O diagnóstico ESCONDIDO do Perfil (só para o Nuno ver): perfilToqueTitulo(), perfilAtualizarDiagnostico() e
// perfilDiagnosticoTexto() em js/perfil.js, com nuvemDiag (js/nuvem.js). Só LÊ js/ e corre-os num ambiente simulado
// (vm) com um utilizador do Telegram e uma nuvem falsa em memória (scripts/_jogo-vm.js): nunca toca em browser,
// Telegram nem conta real.
//
// Prova:
//  (a) o bloco não aparece sem os 5 toques seguidos no título (nem com 4, nem com 5 espalhados por mais de 3 s);
//      aparece com 5 em menos de 3 s, e esconde-se com outros 5; escondido não tem texto;
//  (b) o HTML do Perfil tem o título com o toque e o bloco escondido e vazio (não entra em nenhum texto visível);
//  (c) o que mostra corresponde ao arranque: nuvem CHEIA (de onde veio: nuvem; hora do meta; chaves = meta + partes),
//      nuvem VAZIA com e sem progresso no aparelho (local / novo), SEM nuvem (fora do Telegram) e nuvem com ERRO;
//      a hora da última gravação confirmada só aparece depois de gravar; a versão do state.js vem do ?v= do index;
//  (d) o id do utilizador nunca é gravado: nem no state, nem no localStorage, nem na nuvem falsa;
//  (e) os textos existem em PT, EN e ES; nenhuma leitura extra da nuvem (getKeys nunca é chamado).
//
// Uso: node scripts/verificar-diagnostico-perfil.js
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { abrirJogo, criarNuvemFalsa } = require('./_jogo-vm');

const RAIZ = path.join(__dirname, '..');
const ANTIGA = 'yoshicat_quinta_state_v2';
const ID = 424242;

let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }

function lerJs(f) { return fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'); }
const PERFIL = lerJs('perfil.js');
// As funções do diagnóstico (do perfil.js real; o ficheiro todo precisa de um ecrã inteiro).
const DIAGNOSTICO = (function () {
  const i = PERFIL.indexOf('const PERFIL_DIAG_TOQUES');
  const f = PERFIL.indexOf('\n}\n', PERFIL.indexOf('function perfilAtualizarDiagnostico('));
  if (i === -1 || f === -1) throw new Error('não encontrei o diagnóstico em js/perfil.js');
  return PERFIL.slice(i, f + 3);
})();
const VERSAO_INDEX = (/js\/state\.js\?v=([0-9]+)/.exec(fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8')) || [])[1];

function dois(n) { return ('0' + n).slice(-2); }
function horaEsperada(ms) { const d = new Date(ms); return dois(d.getDate()) + '/' + dois(d.getMonth() + 1) + ' ' + dois(d.getHours()) + ':' + dois(d.getMinutes()) + ':' + dois(d.getSeconds()); }

// Abre o jogo (state.js + nuvem.js reais + o diagnóstico do perfil.js) como uma conta.
function abrir(o) {
  const relogio = o.relogio || { t: 20000000 };
  const temporizadores = [];
  let proximoId = 1;
  const elemento = { hidden: true, textContent: '' };
  const getKeys = { chamadas: 0 };
  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(o.ls, k) ? o.ls[k] : null; },
      setItem: function (k, v) { o.ls[k] = String(v); },
      removeItem: function (k) { delete o.ls[k]; }
    },
    location: { search: '' },
    URLSearchParams: URLSearchParams,
    document: {
      addEventListener: function () {}, querySelectorAll: function () { return []; },
      querySelector: function (sel) { return /state\.js/.test(sel) ? { getAttribute: function () { return 'js/state.js?v=' + VERSAO_INDEX; } } : null; },
      getElementById: function (id) { return id === 'perfil-diagnostico' ? elemento : null; },
      visibilityState: 'visible'
    },
    setTimeout: function (fn, ms) { const id = proximoId++; temporizadores.push({ id: id, em: relogio.t + (ms || 0), fn: fn }); return id; },
    clearTimeout: function (id) { const i = temporizadores.findIndex(function (x) { return x.id === id; }); if (i !== -1) temporizadores.splice(i, 1); },
    applyTranslations: function () {},
    t: function (k) { return k; },
    Date: class extends Date { static now() { return relogio.t; } }
  };
  sandbox.window = sandbox;
  sandbox.window.addEventListener = function () {};
  const webapp = {};
  if (o.nuvem) {
    const original = o.nuvem.getKeys;
    o.nuvem.getKeys = function (cb) { getKeys.chamadas++; return original(cb); };
    webapp.initDataUnsafe = { auth_date: 1 };
    if (o.utilizadorId) webapp.initDataUnsafe.user = { id: o.utilizadorId };
    webapp.CloudStorage = o.nuvem;
  } else if (o.utilizadorId) {
    webapp.initDataUnsafe = { user: { id: o.utilizadorId } }; // sem CloudStorage: como fora de uma conta com nuvem
  }
  sandbox.Telegram = { WebApp: webapp };
  const ctx = vm.createContext(sandbox);
  vm.runInContext(lerJs('state.js'), ctx, { filename: 'js/state.js' });
  vm.runInContext(lerJs('nuvem.js'), ctx, { filename: 'js/nuvem.js' });
  vm.runInContext(DIAGNOSTICO, ctx, { filename: 'js/perfil.js (diagnóstico)' });
  return {
    ev: function (c) { return vm.runInContext(c, ctx); },
    el: elemento, getKeys: getKeys, relogio: relogio,
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
    },
    tocar: function (n, entre) { for (let i = 0; i < n; i++) { vm.runInContext('perfilToqueTitulo()', ctx); if (entre) this.avancar(entre); } },
    linhas: function () { return this.el.textContent.split('\n'); },
    linha: function (chave) { return this.linhas().filter(function (l) { return l.indexOf('perfil.diag.' + chave + ':') === 0; })[0] || ''; }
  };
}
function save(rep, em) { return JSON.stringify({ reputacao: rep, uvas: rep, ultimaGravacaoEm: em }); }
function naNuvem(rep, em, partes) {
  const n = partes || 1;
  const texto = save(rep, em);
  const tam = Math.ceil(texto.length / n);
  const d = { yc_state_meta: JSON.stringify({ partes: n, atualizadoEm: em }) };
  for (let i = 0; i < n; i++) d['yc_state_parte_' + i] = texto.slice(i * tam, (i + 1) * tam);
  return d;
}

// =====================================================================
// (a) Os 5 toques
// =====================================================================
{
  const g = abrir({ ls: {}, utilizadorId: ID, nuvem: criarNuvemFalsa({}) });
  g.ev('perfilAtualizarDiagnostico()');
  ok(g.el.hidden === true && g.el.textContent === '', '(a) sem toques o bloco está escondido e vazio');
  g.tocar(4, 100);
  ok(g.el.hidden === true && g.el.textContent === '', '(a) com 4 toques continua escondido');
  g.avancar(4000);
  g.tocar(1);
  ok(g.el.hidden === true, '(a) o 5.º toque depois de 4 s não conta (os toques têm de ser seguidos)');
  // Cinco toques espalhados: 1 a cada 1,2 s => 4,8 s entre o 1.º e o 5.º.
  const h = abrir({ ls: {}, utilizadorId: ID, nuvem: criarNuvemFalsa({}) });
  h.tocar(5, 1200);
  ok(h.el.hidden === true, '(a) 5 toques em mais de 3 s não abrem o bloco');
  const i = abrir({ ls: {}, utilizadorId: ID, nuvem: criarNuvemFalsa({}) });
  i.tocar(5, 500); // 2 s no total
  ok(i.el.hidden === false && i.el.textContent.indexOf('perfil.diag.titulo') === 0, '(a) 5 toques em menos de 3 s abrem o bloco');
  i.tocar(5, 100);
  ok(i.el.hidden === true && i.el.textContent === '', '(a) outros 5 toques voltam a esconder (e esvaziam) o bloco');
}

// =====================================================================
// (b) O HTML do Perfil
// =====================================================================
{
  ok(/id="perfil-titulo"[^>]*onclick="perfilToqueTitulo\(\)"/.test(PERFIL), '(b) o título «Perfil» tem o toque');
  ok(/<p class="info-text nuvem-estado" id="perfil-diagnostico"[^>]* hidden><\/p>/.test(PERFIL), '(b) o bloco nasce escondido e vazio no HTML do Perfil');
  const abaixo = PERFIL.indexOf('id="perfil-nuvem-estado"') < PERFIL.indexOf('id="perfil-diagnostico"') && PERFIL.indexOf('id="perfil-diagnostico"') < PERFIL.indexOf('id="perfil-apagar-aviso"');
  ok(abaixo, '(b) o bloco fica por baixo da linha da nuvem');
}

// =====================================================================
// (c) O que mostra, em cada arranque
// =====================================================================
{
  // Nuvem CHEIA (2 partes), save local mais velho: ganha a nuvem.
  const ls = {}; ls[ANTIGA + '_u' + ID] = save(10, 1000);
  const nuvem = criarNuvemFalsa(naNuvem(800, 5000, 2));
  const g = abrir({ ls: ls, utilizadorId: ID, nuvem: nuvem });
  g.avancar(20000);
  g.tocar(5);
  ok(g.ev('state.reputacao') === 800, '(c) (preparação) a nuvem cheia ganhou');
  ok(g.linha('id') === 'perfil.diag.id: ' + ID, '(c) cheia: o id do utilizador: ' + g.linha('id'));
  ok(g.linha('origem').indexOf('perfil.diag.o.nuvem') !== -1 && g.linha('origem').indexOf('ok') !== -1, '(c) cheia: o save veio da nuvem (estatuto ok): ' + g.linha('origem'));
  ok(g.linha('meta') === 'perfil.diag.meta: ' + horaEsperada(5000), '(c) cheia: a hora do meta é a da nuvem: ' + g.linha('meta'));
  ok(g.linha('chaves') === 'perfil.diag.chaves: 3', '(c) cheia: meta + 2 partes = 3 chaves: ' + g.linha('chaves'));
  ok(g.linha('leu') === 'perfil.diag.leu: ' + horaEsperada(g.relogio.t - 20000), '(c) cheia: a hora da leitura é a do arranque: ' + g.linha('leu'));
  ok(g.linha('gravou') === 'perfil.diag.gravou: perfil.diag.nada', '(c) cheia: ainda não gravou nada nesta sessão');
  ok(g.linha('versao') === 'perfil.diag.versao: v' + VERSAO_INDEX, '(c) a versão do state.js é a do index.html: ' + g.linha('versao'));
  // Depois de gravar, aparece a hora da última gravação confirmada.
  g.ev('state.reputacao = 801; saveState(state);');
  g.avancar(3000);
  g.ev('perfilAtualizarDiagnostico()');
  ok(g.linha('gravou') === 'perfil.diag.gravou: ' + horaEsperada(g.ev('nuvemEstado.em')) && g.ev('nuvemEstado.ok') === true, '(c) depois de gravar mostra a hora da gravação confirmada: ' + g.linha('gravou'));
  ok(g.linha('meta') === 'perfil.diag.meta: ' + horaEsperada(5000), '(c) a hora do meta «ao abrir» não muda com a gravação nova');
  ok(g.getKeys.chamadas === 0, '(e) nenhuma leitura extra: getKeys nunca é chamado');
}
{
  // Nuvem VAZIA, aparelho sem nada: jogo novo.
  const g = abrir({ ls: {}, utilizadorId: ID, nuvem: criarNuvemFalsa({}) });
  g.avancar(20000); g.tocar(5);
  ok(g.linha('origem').indexOf('perfil.diag.o.novo') !== -1 && g.linha('origem').indexOf('vazio') !== -1, '(c) vazia e sem progresso: «novo»: ' + g.linha('origem'));
  ok(g.linha('chaves') === 'perfil.diag.chaves: 0', '(c) vazia: 0 chaves: ' + g.linha('chaves'));
  ok(g.linha('meta') === 'perfil.diag.meta: perfil.diag.nada', '(c) vazia: sem hora de meta');
}
{
  // Nuvem VAZIA com progresso no aparelho (e só um carimbo: não é progresso).
  const ls = {}; ls[ANTIGA + '_u' + ID] = save(50, 1000);
  const g = abrir({ ls: ls, utilizadorId: ID, nuvem: criarNuvemFalsa({}) });
  g.avancar(20000); g.tocar(5);
  ok(g.linha('origem').indexOf('perfil.diag.o.local') !== -1 && g.linha('origem').indexOf('vazio') !== -1, '(c) vazia e com progresso no aparelho: «local» (copia-se para a nuvem): ' + g.linha('origem'));
  const ls2 = {}; ls2[ANTIGA + '_u' + ID] = JSON.stringify({ ultimaGravacaoEm: 1000 });
  const h = abrir({ ls: ls2, utilizadorId: ID, nuvem: criarNuvemFalsa({}) });
  h.avancar(20000); h.tocar(5);
  ok(h.linha('origem').indexOf('perfil.diag.o.novo') !== -1, '(c) vazia, só com um carimbo e sem progresso: «novo»: ' + h.linha('origem'));
}
{
  // Nuvem CHEIA mas o local é mais recente: fica o local.
  const ls = {}; ls[ANTIGA + '_u' + ID] = save(900, 9000);
  const g = abrir({ ls: ls, utilizadorId: ID, nuvem: criarNuvemFalsa(naNuvem(100, 5000)) });
  g.avancar(20000); g.tocar(5);
  ok(g.linha('origem').indexOf('perfil.diag.o.local') !== -1 && g.linha('origem').indexOf('ok') !== -1, '(c) cheia mas com o local mais recente: «local» (estatuto ok): ' + g.linha('origem'));
  ok(g.linha('meta') === 'perfil.diag.meta: ' + horaEsperada(5000), '(c) a hora do meta é a da nuvem, não a do local');
}
{
  // SEM nuvem (fora do Telegram): sem id.
  const g = abrir({ ls: {}, nuvem: null });
  g.avancar(20000); g.tocar(5);
  ok(g.linha('id') === 'perfil.diag.id: perfil.diag.semId', '(c) sem id: «sem id»: ' + g.linha('id'));
  ok(g.linha('origem') === 'perfil.diag.origem: perfil.diag.o.semNuvem', '(c) sem nuvem: «sem nuvem»: ' + g.linha('origem'));
  ok(g.linha('chaves') === 'perfil.diag.chaves: perfil.diag.nada' && g.linha('meta') === 'perfil.diag.meta: perfil.diag.nada', '(c) sem nuvem: sem chaves nem hora do meta');
  // Com o id mas sem CloudStorage: mostra o id e «sem nuvem».
  const h = abrir({ ls: {}, utilizadorId: ID, nuvem: null });
  h.avancar(1000); h.tocar(5);
  ok(h.linha('id') === 'perfil.diag.id: ' + ID, '(c) com id e sem CloudStorage mostra o id');
}
{
  // Nuvem com ERRO a ler: fica o local.
  const avariada = { getItem: function (k, cb) { cb(new Error('avaria')); }, getItems: function (k, cb) { cb(new Error('avaria')); }, setItem: function (k, v, cb) { if (cb) cb(new Error('avaria')); }, getKeys: function (cb) { cb(new Error('avaria')); }, removeItems: function (k, cb) { cb(new Error('avaria')); } };
  const g = abrir({ ls: {}, utilizadorId: ID, nuvem: avariada });
  g.avancar(1000); g.tocar(5);
  ok(g.linha('origem').indexOf('perfil.diag.o.erro') !== -1 && g.linha('origem').indexOf('erro') !== -1, '(c) erro a ler a nuvem: «erro» (fica o local): ' + g.linha('origem'));
}
{
  // Ainda a ler: a nuvem nunca responde.
  const muda = { getItem: function () {}, getItems: function () {}, setItem: function () {}, getKeys: function () {}, removeItems: function () {} };
  const g = abrir({ ls: {}, utilizadorId: ID, nuvem: muda });
  g.avancar(1000); g.tocar(5);
  ok(g.linha('origem') === 'perfil.diag.origem: perfil.diag.o.aLer', '(c) sem resposta ainda: «ainda a ler»: ' + g.linha('origem'));
}

// =====================================================================
// (d) O id nunca é gravado
// =====================================================================
{
  const ls = {}; ls[ANTIGA + '_u' + ID] = save(10, 1000);
  const nuvem = criarNuvemFalsa(naNuvem(800, 5000));
  const g = abrir({ ls: ls, utilizadorId: ID, nuvem: nuvem });
  g.avancar(20000); g.tocar(5);
  g.ev('state.reputacao = 802; saveState(state);');
  g.avancar(5000);
  g.ev('perfilAtualizarDiagnostico()');
  ok(g.el.textContent.indexOf(String(ID)) !== -1, '(d) (preparação) o id aparece no ecrã');
  const noEstado = JSON.stringify(g.ev('state'));
  const noLocal = Object.keys(ls).map(function (k) { return ls[k]; }).join('\n');
  const naNuvemTexto = Object.keys(nuvem.dados).map(function (k) { return nuvem.dados[k]; }).join('\n');
  ok(nuvem.escritas > 0, '(d) (preparação) houve gravações na nuvem falsa');
  ok(noEstado.indexOf(String(ID)) === -1, '(d) o id não está no state');
  ok(noLocal.indexOf(String(ID)) === -1, '(d) o id não está nos valores do localStorage');
  ok(naNuvemTexto.indexOf(String(ID)) === -1, '(d) o id não está na nuvem');
  ok(!/diag|perfil\.diag|nuvemDiag/.test(noEstado + noLocal + naNuvemTexto), '(d) nada do diagnóstico fica gravado (state, localStorage, nuvem)');
  ok(!/console\.(log|warn|error|info)\([^)]*(diag|utilizador|\.id)/i.test(DIAGNOSTICO), '(d) o diagnóstico não escreve nada em logs');
}

// =====================================================================
// (e) Textos em PT, EN e ES
// =====================================================================
{
  const g = abrirJogo({ dadosDir: null });
  const chaves = ['titulo', 'id', 'semId', 'origem', 'o.nuvem', 'o.local', 'o.novo', 'o.semNuvem', 'o.erro', 'o.aLer', 'estatuto', 'gravou', 'leu', 'meta', 'chaves', 'versao', 'nada'];
  ['pt', 'en', 'es'].forEach(function (l) {
    chaves.forEach(function (c) {
      const v = g.ev('TRANSLATIONS.' + l + "['perfil.diag." + c + "']");
      ok(typeof v === 'string' && v.length > 0, '(e) falta perfil.diag.' + c + ' em ' + l);
    });
  });
  ok(/Diagnóstico/.test(g.ev("TRANSLATIONS.pt['perfil.diag.titulo']")) && /Diagnostics/.test(g.ev("TRANSLATIONS.en['perfil.diag.titulo']")) && /Diagnóstico/.test(g.ev("TRANSLATIONS.es['perfil.diag.titulo']")), '(e) o título está traduzido');
}

if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); }
console.log('OK');
