#!/usr/bin/env node
// «VER CENÁRIO» no ecrã da Quinta (js/cenario.js; o botão #quinta-cenario-btn e o CSS no index.html; as chamadas em
// goTo(), mostrarFalas() e reposicionarFlutuantes() de js/main.js). Corre os ficheiros REAIS em vm, com um DOM falso.
//
// Prova:
//  (a) o botão existe dentro do ecrã da Quinta (só se vê lá), com um olho em SVG (sem emoji), aria-pressed e o
//      aria-label/title traduzidos;
//  (b) tocar alterna: liga a classe quinta-ver-cenario no <body>, o olho fica riscado (classe ativo), aria-pressed
//      true e o rótulo passa a «Mostrar cartões»; tocar outra vez volta tudo a «Ver cenário»; fora da Quinta não liga;
//  (c) não grava nada (nem estado, nem localStorage, nem nuvem) e não toca no cartão da Quinta (aberto continua
//      aberto, fechado continua fechado) nem no sinal;
//  (d) sai sozinho: ao mudar de ecrã (goTo, antes de trocar o ecrã), com uma fala nova (mostrarFalas), ao abrir uma
//      janela (nova entrada ou pedido do dia, reposicionarFlutuantes) e ao voltar ao primeiro plano; uma fala vazia
//      ou um desenho sem janela não o desligam;
//  (e) o CSS esconde só o cartão da Quinta e o balão (visibility, sem apagar) e tira os toques à camada das falas; as
//      barras de cima e de baixo e o sinal não se escondem; o botão tem 44 px, fica no canto de cima à direita, na
//      altura do cartão (que está à esquerda), e de 320 a 430 px cabe ao lado do cartão sem lhe tocar;
//  (f) textos nas 3 línguas (PT: «Ver cenário» e «Mostrar cartões»), curtos; o botão só tem o ícone (o texto vai no
//      aria-label e no title);
//  (g) o index.html carrega js/cenario.js?v=1 antes de js/main.js.
//
// Depois de passar, aplica "mutações" e confirma que o teste as apanha.
// Uso: node scripts/verificar-cenario.js     Sai com 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const LER = function (f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); };
const FONTES = { 'state.js': LER('js/state.js'), 'i18n.js': LER('js/i18n.js'), 'cenario.js': LER('js/cenario.js'), 'main.js': LER('js/main.js'), 'index.html': LER('index.html') };
const J = JSON.stringify;

// Uma função de topo de um ficheiro (de «function nome(» até à chaveta do fim, no início de linha).
function recortar(src, nome) {
  const i = src.indexOf('\nfunction ' + nome + '(');
  if (i === -1) return '';
  const j = src.indexOf('\n}\n', i);
  return j === -1 ? '' : src.slice(i, j + 3);
}

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }

  function abrir(o) {
    o = o || {};
    const els = {}, ouvintes = {}, gravados = [];
    function el(id) {
      if (els[id]) return els[id];
      const classes = new Set(), attrs = {}, ops = [];
      return (els[id] = { id: id, hidden: true, innerHTML: '', textContent: '', style: { setProperty() {} }, ops: ops,
        classList: { add: function (c) { ops.push('+' + c); classes.add(c); }, remove: function (c) { ops.push('-' + c); classes.delete(c); }, contains: function (c) { return classes.has(c); }, toggle: function (c, f) { ops.push('~' + c); if (f === undefined ? !classes.has(c) : f) classes.add(c); else classes.delete(c); } },
        setAttribute: function (k, v) { attrs[k] = String(v); }, removeAttribute: function (k) { delete attrs[k]; }, getAttribute: function (k) { return attrs[k] === undefined ? null : attrs[k]; },
        getBoundingClientRect: function () { return { height: 40 }; }, querySelector: function () { return null; } });
    }
    const ativo = { id: o.ecra || 'screen-quinta', querySelector: function () { return null; } };
    const body = el('__body');
    const sb = {
      console: { log() {}, warn() {}, error() {} },
      localStorage: { getItem: function () { return null; }, setItem: function (k) { gravados.push(k); }, removeItem: function (k) { gravados.push(k); } },
      location: { search: '' }, URLSearchParams: URLSearchParams,
      document: { body: body, visibilityState: 'visible', getElementById: el, addEventListener: function (n, f) { (ouvintes[n] = ouvintes[n] || []).push(f); },
        querySelector: function (s) { return s === '.screen.active' ? ativo : null; }, querySelectorAll: function () { return []; } },
      setTimeout: function () { return 1; }, clearTimeout() {}, Date: Date
    };
    sb.window = sb; sb.window.addEventListener = function () {}; sb.Telegram = { WebApp: {} };
    const cx = vm.createContext(sb);
    vm.runInContext(fontes['state.js'], cx, { filename: 'state.js' });
    vm.runInContext(fontes['i18n.js'], cx, { filename: 'i18n.js' });
    vm.runInContext('var __grav = 0; function saveState() { __grav++; } function mostrarFalaAtual() {}', cx);
    vm.runInContext(fontes['cenario.js'], cx, { filename: 'cenario.js' });
    // As peças reais de js/main.js que chamam o «ver cenário».
    vm.runInContext(['textoDaFala', 'mostrarFalas', 'reposicionarFlutuantes'].map(function (n) { return recortar(fontes['main.js'], n); }).join('\n') + '\nvar dialogoFila = [], dialogoIndice = 0, dialogoNomeAtual = "YoshiCat", dialogoComFotoPropria = false;', cx, { filename: 'main.js (recortes)' });
    const g = { cx: cx, el: el, body: body, ouvintes: ouvintes, gravados: gravados, ativo: ativo };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.btn = function () { return el('quinta-cenario-btn'); };
    g.ligado = function () { return body.classList.contains('quinta-ver-cenario'); };
    return g;
  }

  // ---------------------------------------------------------------- (a) o botão no HTML
  const I = fontes['index.html'];
  const quinta = (/<div id="screen-quinta" class="screen content">([\s\S]*?)\n  <\/div>\n/.exec(I) || ['', ''])[1];
  const botao = (/<button type="button" id="quinta-cenario-btn"[\s\S]*?<\/button>/.exec(quinta) || [''])[0];
  {
    ok(!!botao && quinta.indexOf('id="quinta-topcard"') < quinta.indexOf('id="quinta-cenario-btn"'), '(a) o botão está dentro do ecrã da Quinta (só se vê lá), a seguir ao cartão');
    ok(/class="cenario-btn"/.test(botao) && /onclick="cenarioAlternar\(\)"/.test(botao) && /aria-pressed="false"/.test(botao) && /data-i18n-aria="quinta\.cenario\.ver"/.test(botao) && /data-i18n-title="quinta\.cenario\.ver"/.test(botao), '(a) o botão: cenarioAlternar(), aria-pressed e o rótulo traduzido');
    ok((botao.match(/<svg class="cenario-olho(-riscado)?"[^>]*aria-hidden="true"/g) || []).length === 2 && !/[\u{1F300}-\u{1FAFF}☀-➿]/u.test(botao), '(a) o olho e o olho riscado em SVG (sem emoji)');
    ok(botao.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').trim() === '', '(f) o botão só tem o ícone (o texto vai no aria-label e no title)');
  }

  // ---------------------------------------------------------------- (b) alternar
  {
    const g = abrir();
    ok(!g.ligado() && g.ev('cenarioAtivo()') === false, '(b) começa com tudo visível');
    g.ev('cenarioAlternar()');
    ok(g.ligado() && g.ev('cenarioAtivo()') === true, '(b) tocar: liga a classe quinta-ver-cenario no <body>');
    const b = g.btn();
    ok(b.getAttribute('aria-pressed') === 'true' && b.classList.contains('ativo') && b.getAttribute('aria-label') === 'Mostrar cartões' && b.getAttribute('title') === 'Mostrar cartões' && b.getAttribute('data-i18n-aria') === 'quinta.cenario.mostrar', '(b) ativo: olho riscado, aria-pressed true, «Mostrar cartões»');
    g.ev('cenarioAlternar()');
    ok(!g.ligado() && b.getAttribute('aria-pressed') === 'false' && !b.classList.contains('ativo') && b.getAttribute('aria-label') === 'Ver cenário' && b.getAttribute('data-i18n-aria') === 'quinta.cenario.ver', '(b) tocar outra vez: tudo de volta, «Ver cenário»');
    const f = abrir({ ecra: 'screen-vinha' });
    f.ev('cenarioAlternar()');
    ok(!f.ligado(), '(b) fora da Quinta não liga');
    const e = abrir(); e.ev('currentLang = "en"; cenarioAlternar()');
    ok(e.btn().getAttribute('aria-label') === 'Show the cards', '(b) o rótulo na língua do jogador (EN)');
  }

  // ---------------------------------------------------------------- (c) não grava e não mexe nos cartões
  {
    const g = abrir();
    const carta = g.el('quinta-topcard'); carta.classList.add('aberto'); carta.ops.length = 0;
    const sinal = g.el('quinta-sinal'); sinal.hidden = false;
    const antes = g.ev('JSON.stringify(state)');
    g.ev('cenarioAlternar(); cenarioAlternar(); cenarioAlternar(); cenarioSair();');
    ok(g.ev('JSON.stringify(state)') === antes && g.ev('__grav') === 0 && g.gravados.length === 0, '(c) não grava nada (estado, localStorage)');
    ok(carta.ops.length === 0 && carta.classList.contains('aberto') && sinal.hidden === false, '(c) o cartão aberto continua aberto e o sinal continua lá (nada lhes mexe)');
    const src = fontes['cenario.js'].replace(/\/\/.*$/gm, '');
    ok(!/saveState|localStorage|nuvem|state\./.test(src), '(c) js/cenario.js não fala de gravar, do estado nem da nuvem');
    ok(!/\.hidden\s*=(?!=)|innerHTML|remove\(\)|removeChild/.test(src), '(c) js/cenario.js não esconde nem apaga elementos (só a classe)');
  }

  // ---------------------------------------------------------------- (d) sai sozinho
  {
    let g = abrir(); g.ev('cenarioAlternar(); mostrarFalas("Olá!", "YoshiCat")');
    ok(!g.ligado(), '(d) uma fala nova mostra tudo');
    g = abrir(); g.ev('cenarioAlternar(); mostrarFalas("", "")');
    ok(g.ligado(), '(d) uma fala vazia (o balão a fechar) não desliga');
    g = abrir(); g.ev('cenarioAlternar()'); g.el('app-unlock').hidden = false; g.ev('reposicionarFlutuantes()');
    ok(!g.ligado(), '(d) abrir o cartão de nova entrada mostra tudo');
    g = abrir(); g.ev('cenarioAlternar()'); g.el('app-pedido').hidden = false; g.ev('reposicionarFlutuantes()');
    ok(!g.ligado(), '(d) abrir o cartão do pedido do dia mostra tudo');
    g = abrir(); g.ev('cenarioAlternar(); reposicionarFlutuantes()');
    ok(g.ligado(), '(d) um desenho sem janelas não desliga');
    g = abrir(); g.ev('cenarioAlternar()');
    (g.ouvintes.visibilitychange || []).forEach(function (f) { f(); });
    ok(!g.ligado() && (g.ouvintes.visibilitychange || []).length >= 1, '(d) voltar ao primeiro plano mostra tudo');
    // goTo: sai antes de trocar o ecrã (vale para todos, incluindo o Perfil e voltar a tocar na Quinta)
    const goTo = recortar(fontes['main.js'], 'goTo');
    const iSair = goTo.indexOf("if (typeof cenarioSair === 'function') cenarioSair();"), iTroca = goTo.indexOf("document.getElementById('screen-' + screen).classList.add('active');");
    ok(iSair !== -1 && iTroca !== -1 && iSair < iTroca && goTo.indexOf('return;') < iSair, '(d) goTo() mostra tudo ao mudar de ecrã (antes da troca, depois da tranca de nível)');
    g = abrir(); g.ev('cenarioAlternar()'); g.ativo.id = 'screen-perfil'; g.ev('cenarioSair()');
    ok(!g.ligado() && g.btn().getAttribute('aria-pressed') === 'false', '(d) sair pelo caminho do goTo deixa o botão como novo');
  }

  // ---------------------------------------------------------------- (e) o CSS
  {
    const css = I.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
    ok(/body\.quinta-ver-cenario #quinta-topcard, body\.quinta-ver-cenario #app-dialogue \{ visibility: hidden; pointer-events: none; \}/.test(css), '(e) com a classe: o cartão da Quinta e o balão deixam de se ver (visibility, sem apagar)');
    ok(/body\.quinta-ver-cenario \.overlay \{ pointer-events: none; \}/.test(css), '(e) a camada das falas não recebe toques (não passa falas escondidas)');
    const regrasCenario = css.match(/[^{}]*quinta-ver-cenario[^{}]*\{[^}]*\}/g) || [];
    ok(regrasCenario.length === 2 && !regrasCenario.some(function (r) { return /app-topbar|app-bottomnav|quinta-sinal|cenario-btn|display: none/.test(r); }), '(e) só essas duas regras: as barras, o sinal e o próprio botão não se escondem');
    const b = (/\.cenario-btn \{([^}]*)\}/.exec(css) || ['', ''])[1];
    ok(/position: fixed/.test(b) && /width: 44px/.test(b) && /height: 44px/.test(b), '(e) o botão com 44 px de toque');
    const topoCartao = (/\.topcard \{[^}]*top: ([^;]+);/.exec(css) || [])[1];
    ok(topoCartao && b.indexOf('top: ' + topoCartao + ';') !== -1, '(e) na altura do cartão, por baixo da barra de cima: ' + topoCartao);
    ok(/right: calc\(50% - min\(var\(--coluna\), 100vw - 20px\) \/ 2\)/.test(b) && !/left:/.test(b), '(e) no canto da direita (alinhado com a barra de cima); o cartão está à esquerda');
    const zb = Number((/z-index: (\d+)/.exec(b) || [])[1]), zt = Number((/#app-topbar \{[^}]*z-index: (\d+)/.exec(css) || [])[1]);
    ok(zb > 18 && zb < zt, '(e) por cima do cartão (18) e por baixo da barra de cima (' + zt + '): ' + zb);
    ok(/\.cenario-btn\.ativo \.cenario-olho \{ display: none; \}/.test(css) && /\.cenario-btn\.ativo \.cenario-olho-riscado \{ display: block; \}/.test(css) && /\.cenario-btn \.cenario-olho-riscado \{ display: none; \}/.test(css), '(e) ativo mostra o olho riscado');
    // Cabe ao lado do cartão: o cartão começa na ponta esquerda da coluna e tem no máximo 60% dela.
    [320, 360, 390, 430].forEach(function (w) {
      const coluna = Math.min(w, 480);
      const fimCartao = w / 2 - coluna / 2 + coluna * 0.6;
      const inicioBotao = w - (w / 2 - Math.min(coluna, w - 20) / 2) - 44;
      ok(inicioBotao - fimCartao >= 8 && inicioBotao + 44 <= w, '(e) ' + w + ' px: o botão (de ' + inicioBotao + ' px) cabe ao lado do cartão (até ' + fimCartao.toFixed(0) + ' px) sem lhe tocar');
    });
  }

  // ---------------------------------------------------------------- (f) textos e (g) index
  {
    const g = abrir();
    const ESP = { pt: ['Ver cenário', 'Mostrar cartões'] };
    ['pt', 'en', 'es'].forEach(function (l) {
      ['quinta.cenario.ver', 'quinta.cenario.mostrar'].forEach(function (k, i) {
        const v = g.ev('TRANSLATIONS.' + l + '[' + J(k) + ']');
        ok(typeof v === 'string' && v.length >= 3 && v.length <= 24 && v !== k, '(f) ' + l + ': ' + k + ' curto (deu ' + J(v) + ')');
        if (ESP[l]) ok(v === ESP[l][i], '(f) PT ' + k + ' = «' + ESP[l][i] + '»');
      });
    });
    const pos = function (f) { return I.indexOf('<script src="' + f + '?v='); };
    ok(/<script src="js\/cenario\.js\?v=1"><\/script>/.test(I) && pos('js/cenario.js') > pos('js/i18n.js') && pos('js/cenario.js') < pos('js/main.js'), '(g) js/cenario.js?v=1 antes de js/main.js');
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
  ['não liga a classe', 'cenario.js', '  try { document.body.classList.toggle(CENARIO_CLASSE, cenarioLigado); } catch (e) { /* sem body */ }\n', ''],
  ['liga fora da Quinta', 'cenario.js', "    if (!ativo || ativo.id !== 'screen-quinta') return;\n", ''],
  ['o rótulo não muda', 'cenario.js', "  const chave = cenarioLigado ? 'quinta.cenario.mostrar' : 'quinta.cenario.ver';", "  const chave = 'quinta.cenario.ver';"],
  ['sem aria-pressed', 'cenario.js', "    b.setAttribute('aria-pressed', cenarioLigado ? 'true' : 'false');\n", ''],
  ['o olho não fica riscado', 'cenario.js', "    b.classList.toggle('ativo', cenarioLigado);\n", ''],
  ['grava', 'cenario.js', '  cenarioBotaoAtualizar();\n}\n\n// Tocar', '  cenarioBotaoAtualizar();\n  saveState(state);\n}\n\n// Tocar'],
  ['esconde o cartão à mão', 'cenario.js', '  cenarioBotaoAtualizar();\n}\n\n// Tocar', "  cenarioBotaoAtualizar();\n  document.getElementById('quinta-topcard').classList.toggle('aberto', false);\n}\n\n// Tocar"],
  ['não sai ao voltar ao primeiro plano', 'cenario.js', "if (document.visibilityState === 'visible') cenarioSair();", 'void 0;'],
  ['janela aberta não sai', 'cenario.js', '  if (aberta) cenarioSair();', '  void aberta;'],
  ['sai em qualquer desenho', 'cenario.js', "return !!e && e.hidden === false; });", 'return true; });'],
  ['goTo não sai', 'main.js', "  if (typeof cenarioSair === 'function') cenarioSair();\n  document.querySelectorAll('.screen')", "  document.querySelectorAll('.screen')"],
  ['a fala nova não sai', 'main.js', "  if (lista.length && typeof cenarioSair === 'function') cenarioSair();\n", ''],
  ['a fala vazia sai', 'main.js', "  if (lista.length && typeof cenarioSair === 'function') cenarioSair();", "  if (typeof cenarioSair === 'function') cenarioSair();"],
  ['reposicionar não vê as janelas', 'main.js', "  if (typeof cenarioVerJanelas === 'function') cenarioVerJanelas();\n", ''],
  ['o CSS não esconde o cartão', 'index.html', '    body.quinta-ver-cenario #quinta-topcard,\n    body.quinta-ver-cenario #app-dialogue { visibility: hidden;', '    body.quinta-ver-cenario #app-dialogue { visibility: hidden;'],
  ['apaga em vez de esconder', 'index.html', 'body.quinta-ver-cenario #app-dialogue { visibility: hidden; pointer-events: none; }', 'body.quinta-ver-cenario #app-dialogue { display: none; }'],
  ['a camada das falas recebe toques', 'index.html', '    body.quinta-ver-cenario .overlay { pointer-events: none; }\n', ''],
  ['esconde a barra de baixo', 'index.html', '    body.quinta-ver-cenario .overlay { pointer-events: none; }\n', '    body.quinta-ver-cenario .overlay { pointer-events: none; }\n    body.quinta-ver-cenario #app-bottomnav { visibility: hidden; }\n'],
  ['o botão pequeno', 'index.html', '      width: 44px;\n      height: 44px;\n      padding: 0;\n      border-radius: 50%;\n      background: var(--topo-fundo);\n      -webkit-backdrop-filter: blur(10px);\n      backdrop-filter: blur(10px);\n      border: 1.5px solid rgba(245, 215, 110, 0.6);', '      width: 32px;\n      height: 32px;\n      padding: 0;\n      border-radius: 50%;\n      background: var(--topo-fundo);\n      -webkit-backdrop-filter: blur(10px);\n      backdrop-filter: blur(10px);\n      border: 1.5px solid rgba(245, 215, 110, 0.6);'],
  ['o botão à esquerda (por cima do cartão)', 'index.html', '      right: calc(50% - min(var(--coluna), 100vw - 20px) / 2); /* alinhado', '      left: 10px; /* alinhado'],
  ['o botão por cima da barra de cima', 'index.html', '      top: calc(var(--topo-offset) + 44px + 8px);\n      z-index: 19;\n      width: 44px;', '      top: calc(var(--topo-offset) + 44px + 8px);\n      z-index: 30;\n      width: 44px;'],
  ['ativo sem o olho riscado', 'index.html', '    .cenario-btn.ativo .cenario-olho-riscado { display: block; }\n', ''],
  ['o botão fora da Quinta', 'index.html', '    <!-- «Ver cenário» (js/cenario.js): esconde o cartão e o balão para ver a Quinta; tocar outra vez mostra tudo -->\n    <button type="button" id="quinta-cenario-btn"', '    <!-- «Ver cenário» (js/cenario.js): esconde o cartão e o balão para ver a Quinta; tocar outra vez mostra tudo -->\n  </div>\n  <div>\n    <button type="button" id="quinta-cenario-btn"'],
  ['um texto em falta (ES)', 'i18n.js', "    'quinta.cenario.mostrar': 'Mostrar las tarjetas',\n", ''],
  ['o texto PT trocado', 'i18n.js', "    'quinta.cenario.ver': 'Ver cenário',", "    'quinta.cenario.ver': 'Esconder',"],
  ['sem o script no index', 'index.html', '  <script src="js/cenario.js?v=1"></script>\n', '']
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
