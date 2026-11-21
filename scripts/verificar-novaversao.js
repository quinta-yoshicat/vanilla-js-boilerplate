#!/usr/bin/env node
// A faixa «Há uma versão nova do jogo» (js/novaversao.js). Corre o ficheiro REAL em vm com um DOM, um fetch, um relógio e
// temporizadores falsos. Nada toca em browser, rede, Telegram nem conta real.
//
// Prova:
//  (a) comparação das listas: o index.html real dá a lista dos <script src="js|dados/...?v=N"> igual à da página; igual =
//      sem versão nova; uma versão diferente, um script a mais ou a menos = versão nova; só a ordem diferente = igual;
//      resposta inválida (vazia, HTML que não é o do jogo, poucos scripts, sem js/main.js ou sem js/novaversao.js) ou
//      página sem lista = nada;
//  (b) quando verifica: nada antes dos 5 s; aos 5 s um pedido ao mesmo caminho, com ?nv=<hora> e cache 'no-store', sem o
//      ? nem o # do jogo (os dados do Telegram não vão); ao voltar ao primeiro plano só se já passaram 10 minutos;
//      escondido (visibilitychange para hidden) não verifica;
//  (c) com versão nova a faixa aparece no ecrã do jogo, com os textos; nunca na capa, na Escolher Língua, no Proteger,
//      nas cenas da Festa e do Lagar, nem por cima do balão de fala, dos cartões de nova entrada e do pedido do dia, do
//      cartão do topo aberto ou da confirmação de apagar; se estiver lá, espera e aparece ao sair;
//  (d) «Mais tarde» esconde-a durante 1 hora (aos 59 min ainda escondida, aos 60 min volta); «Atualizar» chama
//      perfilAtualizarJogo() uma só vez;
//  (e) sem rede (fetch rejeita, lança, não existe, resposta não ok, tempo esgotado): nada aparece e nada rebenta, e a
//      verificação seguinte (passados 10 minutos) volta a tentar;
//  (f) não toca no estado, no armazenamento, na nuvem nem nos dados do Telegram; textos nas 3 línguas; index.html com o
//      js/novaversao.js?v=1, a faixa e o CSS (botões com 44 px de toque, texto que parte linha).
//
// Depois de passar, aplica "mutações" e confirma que o teste as apanha.
// Uso: node scripts/verificar-novaversao.js     Sai com 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
function ler(f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); }
const FONTES = { 'novaversao.js': ler('js/novaversao.js'), 'index.html': ler('index.html'), 'i18n.js': ler('js/i18n.js') };
const MIN = 60 * 1000;
// Promessas rejeitadas sem tratamento (num browser seriam erros na consola): contam como «rebentou».
let REJEICOES = 0;
process.on('unhandledRejection', function () { REJEICOES++; });
const esperar = function () { return new Promise(function (r) { setImmediate(r); }); };
async function assentar() { for (let i = 0; i < 6; i++) await esperar(); }

function srcsDoIndex(html) {
  const r = []; const re = /<script src="((?:js|dados)\/[^"]+)"><\/script>/g; let m;
  while ((m = re.exec(html))) r.push(m[1]);
  return r;
}
const PAGINA = srcsDoIndex(FONTES['index.html']);
// Um index.html "novo": o mesmo com uma versão subida.
function indexCom(mudar) { return mudar(FONTES['index.html']); }
const NOVO = indexCom(function (h) { return h.replace(/js\/garrafa\.js\?v=(\d+)/, function (m, v) { return 'js/garrafa.js?v=' + (Number(v) + 1); }); });

function abrir(fontes, o) {
  o = o || {};
  const relogio = { t: 1700000000000 };
  const timers = []; let proximo = 1;
  const pedidos = [];
  const atualizacoes = { n: 0 };
  const els = {};
  function el(id, extra) { els[id] = Object.assign({ id: id, hidden: true, textContent: '', disabled: false }, extra || {}); return els[id]; }
  el('app-dialogue'); el('app-unlock'); el('app-pedido');
  el('novaversao-texto'); el('novaversao-atualizar'); el('novaversao-mais-tarde');
  const faixa = el('app-novaversao', { querySelectorAll: function () { return [els['novaversao-atualizar'], els['novaversao-mais-tarde']]; } });
  const ecra = { id: 'screen-quinta', cartaoAberto: false, apagar: false,
    querySelector: function (s) { if (s === '.topcard.aberto') return this.cartaoAberto ? {} : null; if (s === '#perfil-apagar-confirmar') return this.apagar ? {} : null; return null; } };
  const ouvintes = {};
  const doc = {
    visibilityState: 'visible',
    getElementById: function (id) { return els[id] || null; },
    querySelector: function (s) { return s === '.screen.active' ? ecra : null; },
    querySelectorAll: function (s) { return s === 'script[src]' ? (o.pagina || PAGINA).map(function (src) { return { getAttribute: function () { return src; } }; }).concat([{ getAttribute: function () { return 'https://telegram.org/js/telegram-web-app.js'; } }]) : []; },
    addEventListener: function (n, f) { (ouvintes[n] = ouvintes[n] || []).push(f); }
  };
  const resposta = { modo: o.modo || 'igual', html: o.html };
  const sb = {
    console: { log() {}, warn() {}, error() {} },
    document: doc,
    location: { pathname: '/jogo/index.html', search: '?tgWebAppStartParam=segredo', hash: '#tgWebAppData=user%3D424242' },
    Date: class extends Date { static now() { return relogio.t; } },
    setTimeout: function (fn, ms) { const id = proximo++; timers.push({ id: id, em: relogio.t + (ms || 0), fn: fn }); return id; },
    clearTimeout: function (id) { const i = timers.findIndex(function (x) { return x.id === id; }); if (i !== -1) timers.splice(i, 1); },
    setInterval: function (fn, ms) { const id = proximo++; timers.push({ id: id, em: relogio.t + ms, fn: fn, cada: ms }); return id; },
    clearInterval: function (id) { const i = timers.findIndex(function (x) { return x.id === id; }); if (i !== -1) timers.splice(i, 1); },
    AbortController: function () { this.signal = {}; this.abort = function () { resposta.abortado = true; }; },
    t: function (k) { return '«' + k + '»'; },
    perfilAtualizarJogo: function () { atualizacoes.n++; },
    Promise: Promise
  };
  if (o.semFetch !== true) {
    sb.fetch = function (url, op) {
      pedidos.push({ url: url, op: op });
      if (resposta.modo === 'lanca') throw new Error('sem rede');
      if (resposta.modo === 'rejeita') return Promise.reject(new TypeError('Failed to fetch'));
      if (resposta.modo === 'naoOk') return Promise.resolve({ ok: false, status: 503, text: function () { return Promise.resolve(NOVO); } });
      if (resposta.modo === 'pendente') return new Promise(function () {});
      const html = resposta.modo === 'nova' ? NOVO : resposta.modo === 'html' ? resposta.html : FONTES['index.html'];
      return Promise.resolve({ ok: true, status: 200, text: function () { return Promise.resolve(html); } });
    };
  }
  sb.window = sb;
  const cx = vm.createContext(sb);
  vm.runInContext(fontes['novaversao.js'], cx, { filename: 'js/novaversao.js' });
  return {
    cx: cx, els: els, faixa: faixa, ecra: ecra, pedidos: pedidos, resposta: resposta, atualizacoes: atualizacoes, relogio: relogio, doc: doc,
    ev: function (c) { return vm.runInContext(c, cx); },
    avancar: async function (ms) {
      const alvo = relogio.t + ms;
      for (;;) {
        timers.sort(function (a, b) { return a.em - b.em; });
        if (!timers.length || timers[0].em > alvo) break;
        const x = timers[0];
        relogio.t = Math.max(relogio.t, x.em);
        if (x.cada) x.em = relogio.t + x.cada; else timers.shift();
        x.fn();
        await assentar();
      }
      relogio.t = alvo;
      await assentar();
    },
    voltar: async function () { doc.visibilityState = 'visible'; (ouvintes.visibilitychange || []).forEach(function (f) { f(); }); await assentar(); },
    esconder: async function () { doc.visibilityState = 'hidden'; (ouvintes.visibilitychange || []).forEach(function (f) { f(); }); await assentar(); }
  };
}

async function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }

  // ---------------- (a) Comparação das listas ----------------
  {
    const g = abrir(fontes);
    const cmp = function (a, b) { g.cx.__a = a; g.cx.__b = b; return g.ev('novaVersaoComparar(__a, __b)'); };
    const doIndex = function (h) { g.cx.__h = h; return JSON.parse(g.ev('JSON.stringify(novaVersaoListaDoHtml(__h))')); };
    const lista = doIndex(fontes['index.html']);
    ok(lista.length === PAGINA.length && lista.join() === PAGINA.join() && lista.length > 20, '(a) a lista do index.html real é a dos <script> js/ e dados/ (' + lista.length + ')');
    ok(lista.some(function (s) { return /^dados\//.test(s); }) && lista.some(function (s) { return /^js\/novaversao\.js\?v=1$/.test(s); }), '(a) a lista tem os dados/ e o próprio js/novaversao.js?v=1');
    ok(JSON.parse(g.ev('JSON.stringify(novaVersaoListaCarregada())')).join() === PAGINA.join(), '(a) a lista da página só tem js/ e dados/ (sem o script do Telegram)');
    ok(cmp(PAGINA, lista) === 'igual', '(a) iguais: sem versão nova');
    ok(cmp(PAGINA, doIndex(NOVO)) === 'nova', '(a) uma versão diferente: versão nova');
    ok(cmp(PAGINA, lista.concat(['js/outro.js?v=1'])) === 'nova', '(a) um script a mais: versão nova');
    ok(cmp(PAGINA, lista.filter(function (s) { return !/^js\/camara\.js/.test(s); })) === 'nova', '(a) um script a menos: versão nova');
    ok(cmp(PAGINA, lista.slice().reverse()) === 'igual', '(a) só a ordem diferente: igual');
    [['vazia', ''], ['não é HTML do jogo', '<html><body>Erro 404</body></html>'], ['poucos scripts', '<script src="js/main.js?v=9"></script><script src="js/novaversao.js?v=1"></script>'],
      ['sem js/main.js', fontes['index.html'].replace(/<script src="js\/main\.js\?v=\d+"><\/script>/, '')],
      ['sem js/novaversao.js', fontes['index.html'].replace(/<script src="js\/novaversao\.js\?v=\d+"><\/script>/, '')], ['não é texto', null]].forEach(function (c) {
      ok(cmp(PAGINA, doIndex(c[1])) === 'invalida', '(a) resposta inválida (' + c[0] + '): nada');
    });
    ok(cmp([], lista) === 'invalida', '(a) página sem lista: nada');
  }

  // ---------------- (b) Quando verifica ----------------
  {
    const g = abrir(fontes);
    ok(g.pedidos.length === 0, '(b) ao abrir não pede nada (não atrasa o arranque)');
    await g.avancar(4900);
    ok(g.pedidos.length === 0, '(b) antes dos 5 s não pede nada');
    await g.avancar(200);
    ok(g.pedidos.length === 1, '(b) aos 5 s pede o index.html uma vez (' + g.pedidos.length + ')');
    const p = g.pedidos[0] || { url: '', op: {} };
    ok(/^\/jogo\/index\.html\?nv=\d+$/.test(p.url), '(b) o mesmo caminho do jogo com ?nv=<hora>: ' + p.url);
    ok(p.url.indexOf('tgWeb') === -1 && p.url.indexOf('segredo') === -1 && p.url.indexOf('424242') === -1 && p.url.indexOf('#') === -1, '(b) sem o ? nem o # do jogo (nada do Telegram)');
    ok(p.op && p.op.cache === 'no-store', '(b) cache desligada (no-store)');
    ok(g.faixa.hidden === true, '(b) igual: a faixa não aparece');
    await g.avancar(5 * MIN); await g.voltar();
    ok(g.pedidos.length === 1, '(b) de volta ao primeiro plano antes dos 10 min: não pede');
    await g.avancar(5 * MIN); await g.esconder();
    ok(g.pedidos.length === 1, '(b) ao ir para segundo plano não pede');
    await g.voltar();
    ok(g.pedidos.length === 2 && /\?nv=\d+$/.test(g.pedidos[1].url) && g.pedidos[1].url !== g.pedidos[0].url, '(b) de volta ao primeiro plano depois dos 10 min: pede outra vez, com hora nova');
    await g.voltar();
    ok(g.pedidos.length === 2, '(b) logo a seguir não volta a pedir');
  }

  // ---------------- (c) Onde aparece ----------------
  {
    const g = abrir(fontes, { modo: 'nova' });
    await g.avancar(5000);
    ok(g.faixa.hidden === false, '(c) com versão nova a faixa aparece no ecrã do jogo');
    ok(g.els['novaversao-texto'].textContent === '«novaversao.texto»' && g.els['novaversao-atualizar'].textContent === '«novaversao.atualizar»' && g.els['novaversao-mais-tarde'].textContent === '«novaversao.maisTarde»', '(c) com os textos');
    const casos = [
      ['a capa', function (on) { g.ecra.id = on ? 'screen-home' : 'screen-quinta'; }],
      ['a Escolher Língua', function (on) { g.ecra.id = on ? 'screen-lingua' : 'screen-quinta'; }],
      ['o Proteger (minijogos)', function (on) { g.ecra.id = on ? 'screen-proteger' : 'screen-quinta'; }],
      ['uma cena da Festa', function (on) { g.ev('var festaCenaAtual = ' + (on ? '{ festa: 1 }' : 'null')); }],
      ['as castanhas da Festa', function (on) { g.ev('var castanhasFestaAtual = ' + (on ? '{ x: 1 }' : 'null')); }],
      ['o assalto do Lagar', function (on) { g.ev('var lagarAssaltoCenaAtual = ' + (on ? '{ chave: 1 }' : 'null')); }],
      ['o balão de fala', function (on) { g.els['app-dialogue'].hidden = !on; }],
      ['o cartão de nova entrada', function (on) { g.els['app-unlock'].hidden = !on; }],
      ['o cartão do pedido do dia', function (on) { g.els['app-pedido'].hidden = !on; }],
      ['o cartão do topo aberto', function (on) { g.ecra.cartaoAberto = on; }],
      ['a confirmação de apagar', function (on) { g.ecra.apagar = on; }]
    ];
    for (const c of casos) {
      c[1](true); await g.avancar(1000);
      ok(g.faixa.hidden === true, '(c) não aparece n' + (/^a /.test(c[0]) ? 'a' : 'o') + ' ' + c[0].replace(/^(a|o) /, '') + ' (' + c[0] + ')');
      c[1](false); await g.avancar(1000);
      ok(g.faixa.hidden === false, '(c) ao sair d' + c[0] + ' volta a aparecer');
    }
    // aberta já na capa: espera
    const h = abrir(fontes, { modo: 'nova' });
    h.ecra.id = 'screen-home';
    await h.avancar(5000);
    ok(h.faixa.hidden === true, '(c) na capa espera');
    h.ecra.id = 'screen-vinha'; await h.avancar(1000);
    ok(h.faixa.hidden === false, '(c) e aparece ao entrar no jogo');
  }

  // ---------------- (d) «Mais tarde» e «Atualizar» ----------------
  {
    const g = abrir(fontes, { modo: 'nova' });
    await g.avancar(5000);
    g.ev('novaVersaoMaisTarde()');
    ok(g.faixa.hidden === true, '(d) «Mais tarde» esconde a faixa');
    await g.avancar(59 * MIN);
    ok(g.faixa.hidden === true, '(d) aos 59 min ainda escondida');
    await g.avancar(1 * MIN + 1000);
    ok(g.faixa.hidden === false, '(d) ao fim de 1 hora volta');
    ok(g.atualizacoes.n === 0, '(d) «Mais tarde» não atualiza');
    g.ev('novaVersaoAtualizar()');
    ok(g.atualizacoes.n === 1 && g.els['novaversao-atualizar'].disabled === true, '(d) «Atualizar» chama perfilAtualizarJogo()');
    g.ev('novaVersaoAtualizar()');
    ok(g.atualizacoes.n === 1, '(d) um 2.º toque não volta a chamar');
    // na próxima abertura volta (nada é guardado)
    const h = abrir(fontes, { modo: 'nova' });
    await h.avancar(5000);
    ok(h.faixa.hidden === false, '(d) na próxima abertura volta a aparecer');
  }

  // ---------------- (e) Sem rede ----------------
  for (const modo of ['rejeita', 'lanca', 'naoOk', 'pendente']) {
    const g = abrir(fontes, { modo: modo });
    let rebentou = false; const r0 = REJEICOES;
    try { await g.avancar(5000); await g.avancar(1000); } catch (e) { rebentou = true; }
    await assentar(); await new Promise(function (r) { setTimeout(r, 5); });
    if (REJEICOES !== r0) rebentou = true;
    ok(!rebentou && g.faixa.hidden === true && g.pedidos.length === 1, '(e) ' + modo + ': nada aparece e nada rebenta');
    if (modo === 'pendente') { await g.avancar(9000); ok(g.resposta.abortado === true, '(e) pendente: o pedido é cancelado ao fim do tempo limite'); }
    g.resposta.modo = 'nova';
    await g.avancar(10 * MIN); await g.voltar();
    ok(g.pedidos.length === 2 && (modo === 'pendente' || g.faixa.hidden === false), '(e) ' + modo + ': passados 10 min volta a tentar' + (modo === 'pendente' ? '' : ' e mostra a versão nova'));
  }
  {
    const g = abrir(fontes, { semFetch: true });
    let rebentou = false;
    try { await g.avancar(6000); } catch (e) { rebentou = true; }
    ok(!rebentou && g.faixa.hidden === true, '(e) sem fetch: nada');
  }

  // ---------------- (f) Privacidade, textos e index.html ----------------
  {
    const src = fontes['novaversao.js'].replace(/\/\/.*$/gm, ''); // sem comentários (de linha inteira e no fim da linha)
    ok(!/\b(state|saveState|localStorage|sessionStorage|indexedDB|nuvem[A-Za-z]*|Telegram|initData|tg\b|location\.(search|hash|href))/.test(src), '(f) não toca no estado, no armazenamento, na nuvem nem nos dados do Telegram');
    ok((src.match(/fetch\(/g) || []).length === 1 && /location\.pathname \+ '\?nv=' \+ agora/.test(src), '(f) um só pedido, ao caminho do jogo');
    ['novaversao.texto', 'novaversao.atualizar', 'novaversao.maisTarde'].forEach(function (k) {
      ok((fontes['i18n.js'].match(new RegExp("'" + k.replace('.', '\\.') + "': '[^']+'", 'g')) || []).length === 3, '(f) ' + k + ' nas 3 línguas');
    });
    ok(/'novaversao\.texto': 'Há uma versão nova do jogo\.'/.test(fontes['i18n.js']) && /'novaversao\.atualizar': 'Atualizar'/.test(fontes['i18n.js']) && /'novaversao\.maisTarde': 'Mais tarde'/.test(fontes['i18n.js']), '(f) os textos em PT são os pedidos');
    const I = fontes['index.html'];
    ok(/<script src="js\/definicoes\.js\?v=\d+"><\/script>\n  <script src="js\/novaversao\.js\?v=1"><\/script>/.test(I), '(f) js/novaversao.js?v=1 no index.html');
    ok(/<div id="app-novaversao" class="nova-versao" role="status" aria-live="polite" hidden>/.test(I) && /onclick="novaVersaoAtualizar\(\)"/.test(I) && /onclick="novaVersaoMaisTarde\(\)"/.test(I), '(f) a faixa no index.html, escondida, com os 2 botões');
    const css = I.replace(/\n\s*/g, ' ');
    ok(/\.nova-versao-btn \{[^}]*min-height: 44px;[^}]*min-width: 44px;/.test(css), '(f) botões com 44 px de toque');
    ok(/\.nova-versao-texto \{[^}]*min-width: 0;[^}]*overflow-wrap: anywhere;/.test(css) && /\.nova-versao \{[^}]*max-width: calc\(100vw - 20px\);/.test(css), '(f) o texto parte linha e a faixa cabe de 320 a 430 px');
    ok(/\.nova-versao \{[^}]*top: var\(--topo-offset\);/.test(css) && /\.nova-versao\[hidden\] \{ display: none; \}/.test(css), '(f) no lugar da barra de topo (não tapa o cenário nem o menu de baixo)');
  }
  return falhas;
}

function mutar(ficheiro, de, para) {
  if (FONTES[ficheiro].indexOf(de) === -1) { console.log('FALHA: mutação impossível (texto não encontrado em ' + ficheiro + '): ' + de.slice(0, 70)); return null; }
  const f = Object.assign({}, FONTES); f[ficheiro] = FONTES[ficheiro].split(de).join(para); return f;
}
const MUTACOES = [
  ['a ordem conta', 'novaversao.js', "const a = carregada.slice().sort().join('\\n'), b = nova.slice().sort().join('\\n');", "const a = carregada.join('\\n'), b = nova.join('\\n');"],
  ['aceita qualquer resposta', 'novaversao.js', "  if (nova.length < NOVAVERSAO_CONFIG.minimoScripts) return 'invalida';\n", ''],
  ['não exige o js/main.js', 'novaversao.js', "if (!tem(nova, 'js/main.js') || !tem(nova, 'js/novaversao.js')) return 'invalida';", "if (!tem(nova, 'js/novaversao.js')) return 'invalida';"],
  ['ignora os dados/', 'novaversao.js', 'const NOVAVERSAO_RE_SCRIPT = /<script\\s+src="((?:js|dados)\\/', 'const NOVAVERSAO_RE_SCRIPT = /<script\\s+src="((?:js)\\/'],
  ['sem limite de 10 minutos', 'novaversao.js', '  intervaloMinimoMs: 10 * 60 * 1000,', '  intervaloMinimoMs: 0,'],
  ['verifica logo ao abrir', 'novaversao.js', '  atrasoInicialMs: 5000,', '  atrasoInicialMs: 0,'],
  ['com cache', 'novaversao.js', "{ cache: 'no-store',", "{ cache: 'default',"],
  ['manda o endereço todo', 'novaversao.js', "const endereco = location.pathname + '?nv=' + agora;", "const endereco = location.pathname + location.search + '&nv=' + agora + location.hash;"],
  ['«Mais tarde» só 10 min', 'novaversao.js', '  adiarMs: 60 * 60 * 1000,', '  adiarMs: 10 * 60 * 1000,'],
  ['«Mais tarde» não esconde', 'novaversao.js', '  _novaVersaoAdiadaAte = Date.now() + NOVAVERSAO_CONFIG.adiarMs;', '  _novaVersaoAdiadaAte = 0;'],
  ['aparece na capa', 'novaversao.js', "const NOVAVERSAO_ECRAS_EXCLUIDOS = ['home', 'lingua', 'proteger'];", "const NOVAVERSAO_ECRAS_EXCLUIDOS = ['lingua', 'proteger'];"],
  ['aparece no Proteger', 'novaversao.js', "const NOVAVERSAO_ECRAS_EXCLUIDOS = ['home', 'lingua', 'proteger'];", "const NOVAVERSAO_ECRAS_EXCLUIDOS = ['home', 'lingua'];"],
  ['aparece nas cenas da Festa', 'novaversao.js', "  if (typeof festaCenaAtual !== 'undefined' && festaCenaAtual) return false;\n", ''],
  ['aparece no assalto do Lagar', 'novaversao.js', "  if (typeof lagarAssaltoCenaAtual !== 'undefined' && lagarAssaltoCenaAtual) return false;\n", ''],
  ['aparece por cima do balão', 'novaversao.js', "  if (novaVersaoVisivel(document.getElementById('app-dialogue'))) return false;\n", ''],
  ['aparece com o cartão aberto', 'novaversao.js', "  if (ativo.querySelector('.topcard.aberto')) return false;\n", ''],
  ['sem rede rebenta', 'novaversao.js', "      .catch(function () { /* sem rede ou resposta estranha: não aparece nada */ })\n", ''],
  ['resposta não ok conta', 'novaversao.js', "return r && r.ok ? r.text() : '';", 'return r.text();'],
  ['fica preso depois de falhar', 'novaversao.js', "      .then(function () { _novaVersaoEmCurso = false; if (limite) clearTimeout(limite); });", "      .then(function () { if (limite) clearTimeout(limite); });"],
  ['o tempo limite não liberta', 'novaversao.js', 'limite = setTimeout(function () { _novaVersaoEmCurso = false; try', 'limite = setTimeout(function () { try'],
  ['«Atualizar» repete', 'novaversao.js', '  if (_novaVersaoAtualizando) return;\n  _novaVersaoAtualizando = true;', '  _novaVersaoAtualizando = true;'],
  ['não volta ao primeiro plano', 'novaversao.js', "  if (document.visibilityState === 'visible') novaVersaoVerificar();", '  /* nada */'],
  ['botões pequenos', 'index.html', '      min-height: 44px;\n      min-width: 44px;\n      padding: 0 10px;', '      min-height: 32px;\n      min-width: 44px;\n      padding: 0 10px;'],
  ['texto em falta (EN)', 'i18n.js', "    'novaversao.maisTarde': 'Later',\n", '']
];

(async function () {
  const falhas = await suite(FONTES);
  let impossiveis = 0;
  for (const m of MUTACOES) {
    const f = mutar(m[1], m[2], m[3]);
    if (!f) { impossiveis++; continue; }
    let apanhada; try { apanhada = (await suite(f)).length > 0; } catch (e) { apanhada = true; }
    if (!apanhada) falhas.push('MUTAÇÃO NÃO APANHADA: ' + m[0]);
  }
  if (falhas.length || impossiveis) {
    falhas.forEach(function (m) { console.log('FALHA: ' + m); });
    console.log((falhas.length + impossiveis) + ' falha(s)');
    process.exit(1);
  }
  console.log('OK (' + MUTACOES.length + ' mutações apanhadas)');
})();
