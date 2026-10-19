#!/usr/bin/env node
// A versão visível e o botão «Atualizar o jogo» do Perfil: perfilMostrarVersao(), perfilEnderecoAtualizado() e
// perfilAtualizarJogo() em js/perfil.js, com o jogo real em vm (scripts/_jogo-vm.js) e um endereço, um relógio e uma
// nuvem falsos. Nunca toca em browser, Telegram nem conta real.
//
// Prova:
//  (a) o HTML do Perfil leva sempre a linha da versão e o botão (fora de qualquer condição) e a versão mostra «v<?v= do
//      state.js do index.html>» nas 3 línguas;
//  (b) o endereço novo mantém o caminho e o # (tgWebAppData) tal e qual, põe r=<hora> se não havia e muda-o se já havia,
//      e guarda os outros parâmetros do ?;
//  (c) o botão chama location.replace UMA vez, com esse endereço, e um 2.º toque não faz nada;
//  (d) o botão não grava nem apaga nada: localStorage, nuvem e state ficam iguais; sem nada por enviar não escreve na nuvem;
//  (e) com uma gravação na nuvem por enviar, envia-a e só recarrega depois de acabar; se nunca acabar, recarrega ao fim
//      do tempo máximo;
//  (f) os textos existem em PT, EN e ES e não falam de bots nem de IA.
//
// Uso: node scripts/verificar-versao-atualizar.js
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { abrirJogo } = require('./_jogo-vm');

const RAIZ = path.join(__dirname, '..');
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }

const PERFIL = fs.readFileSync(path.join(RAIZ, 'js', 'perfil.js'), 'utf8');
const INDEX = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
const VERSAO_INDEX = (/js\/state\.js\?v=([0-9]+)/.exec(INDEX) || [])[1];

function cortar(de, ate) {
  const i = PERFIL.indexOf(de);
  const f = PERFIL.indexOf(ate, i);
  if (i === -1 || f === -1) throw new Error('não encontrei ' + de + ' em js/perfil.js');
  return PERFIL.slice(i, f);
}
const VERSAO_FN = cortar('function perfilDiagVersaoStateJs', '\nfunction perfilDiagnosticoTexto');
const ATUALIZAR = cortar('const PERFIL_ATUALIZAR_ESPERA_MS', '// Abre a partilha do Telegram');

// Abre o jogo e acrescenta-lhe as funções do Perfil, um endereço, um relógio, temporizadores e botões falsos.
function abrir(o) {
  const x = o || {};
  const relogio = { t: 5000000 };
  const temporizadores = [];
  let proximoId = 1;
  const chamadas = []; // location.replace(...)
  const elementos = {};
  const jogo = abrirJogo({ utilizadorId: x.utilizadorId });
  const cx = jogo.cx;
  const guardado = jogo.guardado;
  cx.location = {
    search: x.search === undefined ? '' : x.search, pathname: x.pathname || '/jogo/index.html', hash: x.hash || '',
    replace: function (url) { chamadas.push(url); },
    reload: function () { chamadas.push('RELOAD'); }
  };
  cx.setTimeout = function (fn, ms) { const id = proximoId++; temporizadores.push({ id: id, em: relogio.t + (ms || 0), fn: fn }); return id; };
  cx.clearTimeout = function (id) { const i = temporizadores.findIndex(function (z) { return z.id === id; }); if (i !== -1) temporizadores.splice(i, 1); };
  cx.Date = class extends Date { static now() { return relogio.t; } };
  const botao = { disabled: false, textContent: 'Atualizar o jogo' };
  const versao = { textContent: '' };
  elementos['perfil-atualizar'] = botao;
  elementos['perfil-versao'] = versao;
  cx.document.getElementById = function (id) { return elementos[id] || null; };
  cx.document.querySelector = function (sel) { return /state\.js/.test(sel) ? { getAttribute: function () { return 'js/state.js?v=' + VERSAO_INDEX; } } : null; };
  // Estado da nuvem simulado: só o que o botão consulta.
  cx.__envios = 0; cx.__emCurso = false;
  vm.runInContext('var _nuvemTimerGravacao = null;\n' +
    'function nuvemGravarJa() { if (!_nuvemTimerGravacao) return; _nuvemTimerGravacao = null; __envios++; __emCurso = true; }\n' +
    'function nuvemGravacaoEmCurso() { return __emCurso; }', cx);
  vm.runInContext(VERSAO_FN + '\n' + ATUALIZAR, cx, { filename: 'js/perfil.js (versão e atualizar)' });
  return {
    cx: cx, ev: jogo.ev, guardado: guardado, chamadas: chamadas, botao: botao, versao: versao, relogio: relogio,
    avancar: function (ms) {
      const alvo = relogio.t + ms;
      for (;;) {
        temporizadores.sort(function (a, b) { return a.em - b.em; });
        if (!temporizadores.length || temporizadores[0].em > alvo) break;
        const z = temporizadores.shift();
        relogio.t = Math.max(relogio.t, z.em);
        z.fn();
      }
      relogio.t = alvo;
    }
  };
}

// =====================================================================
// (a) Versão sempre visível, nas 3 línguas, e botão no HTML do Perfil
// =====================================================================
{
  const html = cortar('container.innerHTML =', 'const checkVibracao');
  ok(/<p class="info-text nuvem-estado" id="perfil-versao"><\/p>/.test(html), '(a) o HTML do Perfil tem a linha da versão');
  ok(/id="perfil-atualizar" onclick="perfilAtualizarJogo\(\)" data-i18n="perfil.btnAtualizar"/.test(html), '(a) o HTML do Perfil tem o botão «Atualizar o jogo»');
  ok(/AtualizarDiagnostico\(\);\n  perfilMostrarVersao\(\);\n  perfilLigarIndicadorScroll\(\);/.test(PERFIL), '(a) renderPerfil() mostra a versão, sem condições');
  ok(!/convitesVisiveis\(\)[^;]*perfil-versao/.test(html), '(a) a linha da versão não depende de condições');
  ok(VERSAO_INDEX && Number(VERSAO_INDEX) > 0, '(a) o index.html tem ?v= no state.js');
  const esperado = { pt: 'Versão: v', en: 'Version: v', es: 'Versión: v' };
  ['pt', 'en', 'es'].forEach(function (l) {
    const g = abrir({});
    g.ev("currentLang = '" + l + "'");
    g.ev('perfilMostrarVersao()');
    ok(g.versao.textContent === esperado[l] + VERSAO_INDEX, '(a) ' + l + ': versão visível «' + g.versao.textContent + '»');
  });
}

// =====================================================================
// (b) O endereço novo
// =====================================================================
{
  const g = abrir({});
  const f = function (loc, t) { g.cx.__loc = loc; return g.ev('perfilEnderecoAtualizado(__loc, ' + t + ')'); };
  const HASH = '#tgWebAppData=query_id%3DAAH%26user%3D%257B%2522id%2522%253A42%257D%26hash%3Dabc&tgWebAppVersion=7.10&tgWebAppThemeParams=%7B%22bg_color%22%3A%22%23fff%22%7D';
  ok(f({ pathname: '/jogo/index.html', search: '', hash: HASH }, 123) === '/jogo/index.html?r=123' + HASH, '(b) sem ?: acrescenta ?r= e mantém o # tal e qual: ' + f({ pathname: '/jogo/index.html', search: '', hash: HASH }, 123));
  ok(f({ pathname: '/jogo/', search: '?r=1', hash: HASH }, 999) === '/jogo/?r=999' + HASH, '(b) com r já posto: muda só o r');
  ok(f({ pathname: '/jogo/', search: '?a=1&r=1&b=x%20y', hash: HASH }, 7) === '/jogo/?a=1&r=7&b=x+y' + HASH, '(b) guarda os outros parâmetros: ' + f({ pathname: '/jogo/', search: '?a=1&r=1&b=x%20y', hash: HASH }, 7));
  ok(f({ pathname: '/jogo/', search: '', hash: '' }, 5) === '/jogo/?r=5', '(b) sem # (fora do Telegram): só o ?r=');
}

// =====================================================================
// (c) e (d) O botão recarrega uma vez, com o endereço certo, sem gravar nem apagar
// =====================================================================
{
  const HASH = '#tgWebAppData=abc&tgWebAppVersion=7.10';
  const g = abrir({ utilizadorId: 4242, search: '?x=1', hash: HASH });
  g.ev('state.reputacao = 77; localStorage.setItem(STORAGE_KEY, JSON.stringify(state))');
  const antes = JSON.stringify(g.guardado);
  const estadoAntes = g.ev('JSON.stringify(state)');
  g.ev('perfilAtualizarJogo()');
  g.avancar(1000);
  ok(g.chamadas.length === 1, '(c) recarregou exatamente 1 vez: ' + JSON.stringify(g.chamadas));
  ok(/^\/jogo\/index\.html\?x=1&r=\d+#tgWebAppData=abc&tgWebAppVersion=7\.10$/.test(g.chamadas[0]), '(c) com o endereço certo (mantém o # e muda o ?r=): ' + g.chamadas[0]);
  ok(g.chamadas.indexOf('RELOAD') === -1, '(c) não usa location.reload()');
  ok(g.botao.disabled === true && g.botao.textContent === 'A atualizar...', '(c) o botão fica desativado e diz «A atualizar...»');
  g.ev('perfilAtualizarJogo()');
  g.avancar(1000);
  ok(g.chamadas.length === 1, '(c) um 2.º toque não faz nada');
  ok(JSON.stringify(g.guardado) === antes, '(d) o localStorage ficou igual');
  ok(g.ev('JSON.stringify(state)') === estadoAntes, '(d) o state ficou igual');
  ok(g.cx.__envios === 0, '(d) sem nada por enviar não escreve na nuvem');
}

// =====================================================================
// (e) Gravação por enviar: envia e espera
// =====================================================================
{
  const g = abrir({ hash: '#a=1' });
  g.ev('_nuvemTimerGravacao = 1'); // há uma gravação agendada
  g.ev('perfilAtualizarJogo()');
  ok(g.cx.__envios === 1, '(e) enviou já a gravação pendente');
  g.avancar(1000);
  ok(g.chamadas.length === 0, '(e) enquanto a gravação não acaba, não recarrega');
  g.ev('__emCurso = false');
  g.avancar(300);
  ok(g.chamadas.length === 1, '(e) acabou a gravação: recarrega');
  const h = abrir({ hash: '#a=1' });
  h.ev('_nuvemTimerGravacao = 1');
  h.ev('perfilAtualizarJogo()');
  h.avancar(2800);
  ok(h.chamadas.length === 0, '(e) gravação que nunca acaba: ainda espera aos 2,8 s');
  h.avancar(500);
  ok(h.chamadas.length === 1, '(e) gravação que nunca acaba: recarrega ao fim do tempo máximo (3 s)');
}

// =====================================================================
// (f) Textos em PT, EN e ES, sem bots nem IA
// =====================================================================
{
  const i18n = fs.readFileSync(path.join(RAIZ, 'js', 'i18n.js'), 'utf8');
  ['perfil.versao', 'perfil.btnAtualizar', 'perfil.atualizando'].forEach(function (k) {
    const n = i18n.split("'" + k + "':").length - 1;
    ok(n === 3, '(f) «' + k + '» existe nas 3 línguas (' + n + ')');
    const re = new RegExp("'" + k.replace('.', '\\.') + "':\\s*'([^']*)'", 'g');
    let m;
    while ((m = re.exec(i18n))) ok(!/\b(bot|bots|IA|AI|inteligência|inteligencia|intelligence)\b/i.test(m[1]), '(f) «' + k + '» não fala de bots nem de IA: ' + m[1]);
  });
}

if (falhas === 0) console.log('verificar-versao-atualizar: tudo OK');
else console.log('verificar-versao-atualizar: ' + falhas + ' falha(s)');
process.exit(falhas === 0 ? 0 : 1);
