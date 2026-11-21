#!/usr/bin/env node
// O ecrã «Definições» (js/definicoes.js) e o Perfil sem o que passou para lá (js/perfil.js). Corre o jogo real em vm
// (scripts/_jogo-vm.js: state, i18n, niveis e dados/ reais; mais nuvem, caderno, conquistas, perfil e definicoes) e o goTo()
// e o voltarEcraAnterior() REAIS, recortados de js/main.js, com um DOM simulado mínimo. Nada toca em browser, Telegram nem
// conta real.
//
// Prova:
//  (a) o Perfil: a roda dentada no cartão do título (SVG de traço, não emoji; aria-label pelas 3 línguas; 44 px no CSS)
//      abre as Definições; saíram a Vibração, o Som, a nuvem, a versão, o diagnóstico, «Atualizar o jogo», «Apagar» e o
//      aviso; os 2 botões de baixo («Ver Enciclopédia» e «Sair para o Início») lado a lado, metade da largura cada um, com
//      o «Convidar amigos» por cima quando visível; as 9 janelas, a nota do Conhecimento e o texto das garrafas ficam;
//  (b) a navegação: tocar na roda dentada (goTo('definicoes')) mostra o ecrã e desenha-o; sem nível mínimo (jogador novo,
//      nível 1); não acende nenhum botão da barra de baixo (como o Perfil); o fundo é o do Perfil; o Voltar
//      (voltarEcraAnterior) volta ao Perfil;
//  (c) as Definições têm a Vibração e o Som (marcados como no estado; mudar grava como antes), a linha da nuvem, a versão,
//      o diagnóstico escondido (o toque está no título das Definições), «Atualizar o jogo» e, separado e em baixo, o aviso
//      forte ANTES do «Apagar o meu progresso»;
//  (d) apagar pede 2 passos: o 1.º toque só mostra o aviso, o «Cancelar» em destaque e o «Apagar tudo» a vermelho (não
//      apaga nada nem chama a nuvem); o «Cancelar» volta às Definições sem apagar nada (estado, localStorage e nuvem
//      intactos); só o «Apagar tudo» chama nuvemApagarTudo;
//  (e) textos novos em PT, EN e ES; index.html com o ecrã, o js/definicoes.js?v=1 logo a seguir ao js/perfil.js, a lista
//      «body.jogo-cheio ... .content» e o CSS; main.js com a entrada em goTo() e o fundo.
//
// Depois de passar, aplica "mutações" (estraga cada regra de propósito) e confirma que o teste as apanha.
// Uso: node scripts/verificar-definicoes.js     Sai com 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { abrirJogo } = require('./_jogo-vm');

const RAIZ = path.join(__dirname, '..');
function ler(f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); }
const FONTES = {
  'perfil.js': ler('js/perfil.js'), 'definicoes.js': ler('js/definicoes.js'), 'main.js': ler('js/main.js'),
  'i18n.js': ler('js/i18n.js'), 'index.html': ler('index.html')
};
const OUTROS = ['nuvem.js', 'caderno.js', 'conquistas.js'];
const ECRAS = ['home', 'quinta', 'perfil', 'definicoes', 'enciclopedia'];

// Recorta de main.js o que a navegação usa: as tabelas, o histórico, goTo() e voltarEcraAnterior().
function navegacaoDoMain(main) {
  function bloco(inicio, fim) {
    const i = main.indexOf(inicio);
    const f = main.indexOf(fim, i);
    if (i === -1 || f === -1) throw new Error('não encontrei ' + inicio + ' em js/main.js');
    return main.slice(i, f + fim.length);
  }
  return [
    bloco('const FUNDO_DOS_ECRAS = {', '\n};\n'),
    bloco('const ECRAS_SEM_CHROME =', ';\n'),
    bloco('const NAV_ATIVO_POR_ECRA = {', '\n};\n'),
    bloco('const LIMPEZA_AO_SAIR_POR_ECRA = {', '\n};\n'),
    bloco('const ECRAS_PRINCIPAIS_BARRA =', ';\n'),
    bloco('let historicoEcras =', ';\n'),
    bloco('function goTo(screen, opcoes) {', '\n}\n'),
    bloco('function voltarEcraAnterior() {', '\n}\n')
  ].join('\n');
}

// DOM mínimo: elementos por id, criados quando aparecem num innerHTML (id="..."), com hidden, onclick, classes e texto.
function criarDom() {
  const els = {};
  function novo(id, attrs) {
    const classes = new Set(((attrs && attrs.classe) || '').split(/\s+/).filter(Boolean));
    const e = {
      id: id, hidden: !!(attrs && attrs.hidden), disabled: false, checked: false, textContent: '', style: {},
      onclickTexto: attrs && attrs.onclick, _html: '',
      classList: { add: function (c) { classes.add(c); }, remove: function (c) { classes.delete(c); }, contains: function (c) { return classes.has(c); }, toggle: function (c, f) { if (f === undefined ? !classes.has(c) : f) classes.add(c); else classes.delete(c); } },
      scrollIntoView: function () {}, addEventListener: function () {}, getBoundingClientRect: function () { return { top: 0 }; }
    };
    Object.defineProperty(e, 'innerHTML', { configurable: true, get: function () { return e._html; }, set: function (v) { e._html = v; registar(v); } });
    els[id] = e;
    return e;
  }
  function registar(html) {
    const re = /<([a-z0-9]+)((?:\s+[a-zA-Z0-9-]+(?:="[^"]*")?)*)\s*>/g; let m;
    while ((m = re.exec(html))) {
      const a = m[2];
      const id = /\sid="([^"]+)"/.exec(a);
      if (!id) continue;
      const cl = /\sclass="([^"]*)"/.exec(a), oc = /\sonclick="([^"]*)"/.exec(a);
      novo(id[1], { classe: cl ? cl[1] : '', hidden: /\shidden(\s|=|$)/.test(a), onclick: oc ? oc[1].replace(/&quot;/g, '"') : null });
    }
  }
  ECRAS.forEach(function (s) { novo('screen-' + s, { classe: 'screen' }); novo(s + '-container'); });
  // painel de ações das Definições: o que perfilPedirApagar() procura
  const painelDefinicoes = { _html: '' };
  Object.defineProperty(painelDefinicoes, 'innerHTML', { get: function () { return painelDefinicoes._html; }, set: function (v) { painelDefinicoes._html = v; registar(v); } });
  const doc = {
    els: els, painel: painelDefinicoes,
    getElementById: function (id) { return els[id] || null; },
    querySelectorAll: function (sel) { return sel === '.screen' ? ECRAS.map(function (s) { return els['screen-' + s]; }) : []; },
    querySelector: function (sel) {
      if (sel === '.screen.active') return ECRAS.map(function (s) { return els['screen-' + s]; }).filter(function (e) { return e.classList.contains('active'); })[0] || null;
      if (sel === '#definicoes-container .action-panel') return /class="action-panel"/.test(els['definicoes-container'].innerHTML) ? painelDefinicoes : null;
      if (/state\.js/.test(sel)) return { getAttribute: function () { return 'js/state.js?v=7'; } };
      return null;
    },
    addEventListener: function () {}, body: { classList: { toggle: function () {} } }, documentElement: {}
  };
  // Quando as Definições se desenham de novo, o painel de ações volta ao HTML do ecrã (o Voltar).
  const cont = els['definicoes-container'];
  Object.defineProperty(cont, 'innerHTML', { get: function () { return cont._html; }, set: function (v) { cont._html = v; registar(v); const p = /<div class="action-panel">([\s\S]*)<\/div>$/.exec(v); painelDefinicoes._html = p ? p[1] : ''; } });
  return doc;
}

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }
  const jsDir = path.join(RAIZ, 'js');

  function abrir(o) {
    o = o || {};
    const g = abrirJogo({ ecraReal: true, explorar: true });
    const dom = criarDom();
    g.cx.document = dom;
    g.cx.location = { search: o.search || '', reload: function () {}, replace: function () {} };
    g.cx.MutationObserver = undefined;
    OUTROS.forEach(function (f) { vm.runInContext(fs.readFileSync(path.join(jsDir, f), 'utf8'), g.cx, { filename: 'js/' + f }); });
    const garrafa = /function colecaoVisivel\(\) \{[\s\S]*?\n\}\n/.exec(ler('js/garrafa.js'));
    vm.runInContext(garrafa[0] + 'function colecaoResumo() { return "0 / 4"; }', g.cx);
    vm.runInContext(fontes['perfil.js'], g.cx, { filename: 'js/perfil.js' });
    vm.runInContext(fontes['definicoes.js'], g.cx, { filename: 'js/definicoes.js' });
    vm.runInContext(`
      var SAVES = 0, APAGAR_NUVEM = 0, ECRAS_DESENHADOS = [], FUNDOS = [], SOM = [];
      if (typeof TEMPO_CACHE_KEY === 'undefined') var TEMPO_CACHE_KEY = 'yoshicat_tempo_cache_v1'; // é do js/tempo.js, que aqui não corre
      saveState = function () { SAVES++; };
      function atualizarDialogo() {} function showMessage() {}
      function pararSomAmbiente() {} function atualizarChromeNovoAspeto() {} function updateStatsDisplays() {}
      function restaurarFundoDoEcraAtual() { var a = document.querySelector('.screen.active'); FUNDOS.push(a ? FUNDO_DOS_ECRAS[a.id.replace(/^screen-/, '')] : null); }
      function atualizarLinhaEstacaoQuinta() {} function atualizarLinhaTempoQuinta() {} function atualizarFaixaFesta() {}
      function filaPrepararAbertura() {} function atualizarNavBloqueios() {} function atualizarBotaoVoltarTelegram() {}
      function somAplicarInterruptor(l) { SOM.push(l); }
      nuvemApagarTudo = function (cb) { APAGAR_NUVEM++; cb(false); };
      var _rp = renderPerfil; renderPerfil = function () { ECRAS_DESENHADOS.push('perfil'); return _rp(); };
      var _rd = renderDefinicoes; renderDefinicoes = function () { ECRAS_DESENHADOS.push('definicoes'); return _rd(); };
      function renderEnciclopedia() { ECRAS_DESENHADOS.push('enciclopedia'); }
    `, g.cx);
    vm.runInContext(navegacaoDoMain(fontes['main.js']), g.cx, { filename: 'js/main.js (navegação)' });
    g.ev('state.reputacao = ' + (o.reputacao === undefined ? 0 : o.reputacao) + '; state.acesso.jogadorAntigo = ' + (o.antigo ? 'true' : 'false') + '; state.vibracao = ' + (o.vibracao === false ? 'false' : 'true') + '; state.som = ' + (o.som ? 'true' : 'false') + ';');
    g.dom = dom;
    g.html = function (id) { return dom.els[id].innerHTML; };
    g.clicar = function (id) { const e = dom.els[id]; if (!e || !e.onclickTexto) throw new Error('sem botão ' + id); vm.runInContext(e.onclickTexto, g.cx); };
    g.ativo = function () { const a = dom.querySelector('.screen.active'); return a ? a.id : null; };
    return g;
  }

  // ---------------- (a) Perfil ----------------
  {
    const g = abrir({ antigo: true, reputacao: 3000 });
    g.ev("goTo('home'); goTo('perfil')");
    const h = g.html('perfil-container');
    const topo = /<div class="topcard perfil-topo">([\s\S]*?)<\/div>/.exec(h);
    ok(topo && /id="perfil-titulo"/.test(topo[1]) && /<button type="button" class="perfil-definicoes-btn" id="perfil-definicoes" onclick="goTo\('definicoes'\)"/.test(topo[1]), '(a) a roda dentada está no cartão do título e abre as Definições');
    ok(topo && topo[1].indexOf('perfil-titulo') < topo[1].indexOf('perfil-definicoes'), '(a) a roda dentada vem depois do título (canto direito)');
    ok(topo && /<svg[^>]*fill="none"[^>]*stroke="currentColor"/.test(topo[1]) && !/[⚙\u{1F527}\u{2699}]/u.test(topo[1]), '(a) a roda dentada é um SVG de traço, não emoji');
    ok(topo && /data-i18n-aria="perfil\.definicoesAria"/.test(topo[1]) && /aria-label="[^"]+"/.test(topo[1]), '(a) a roda dentada tem aria-label (traduzido)');
    ok(/\.perfil-definicoes-btn \{[^}]*min-width: 44px; min-height: 44px;/.test(fontes['index.html'].replace(/\n\s*/g, ' ')), '(a) a área de toque da roda dentada tem 44 px');
    ['perfil-vibracao-check', 'perfil-som-check', 'perfil-nuvem-estado', 'perfil-diagnostico', 'perfil-versao', 'perfil-atualizar', 'perfil-apagar-aviso', 'perfilPedirApagar', 'perfilToqueTitulo', 'perfil.btnApagar', 'perfil.apagarAviso', 'perfil.btnAtualizar'].forEach(function (x) {
      ok(h.indexOf(x) === -1, '(a) o Perfil já não devia ter ' + x);
    });
    const lado = /<div class="perfil-botoes-lado">([\s\S]*?)<\/div>/.exec(h);
    ok(lado && (lado[1].match(/<button /g) || []).length === 2 && lado[1].indexOf('perfil.btnEnciclopedia') !== -1 && lado[1].indexOf('perfil.btnSairInicio') !== -1 && lado[1].indexOf('perfil.btnEnciclopedia') < lado[1].indexOf('perfil.btnSairInicio'), '(a) «Ver Enciclopédia» e «Sair para o Início» lado a lado, por esta ordem');
    ok(/\.perfil-botoes-lado \{ display: grid; grid-template-columns: 1fr 1fr;/.test(fontes['index.html']), '(a) metade da largura cada um (grelha de 2 colunas iguais)');
    ok(h.indexOf('perfil.btnConvidar') === -1, '(a) sem convites, sem «Convidar amigos»');
    ok((h.match(/class="profile-card"/g) || []).length === 9, '(a) as 9 janelas ficam');
    ok(h.indexOf('data-i18n="perfil.conhecimentoNota"') !== -1 && h.indexOf('data-i18n="perfil.galeriaTitulo"') !== -1 && h.indexOf('data-i18n="perfil.semGarrafas"') !== -1, '(a) a nota do Conhecimento e o texto das garrafas ficam');
    g.ev("state.garrafas = 13; state.ultimaGarrafaData = '16/11/2026'; renderPerfil()");
    ok(g.html('perfil-container').indexOf("13 — <span data-i18n=\"perfil.ultimaLabel\"></span>: 16/11/2026") !== -1, '(a) «13 — última: 16/11/2026» fica');
    const c = abrir({ antigo: true, search: '?convites=teste' });
    c.ev("goTo('perfil')");
    const hc = c.html('perfil-container');
    const painel = /<div class="action-panel">([\s\S]*)<\/div>$/.exec(hc);
    ok(painel && painel[1].indexOf('perfil.btnConvidar') !== -1 && painel[1].indexOf('perfil.btnConvidar') < painel[1].indexOf('perfil-botoes-lado'), '(a) o «Convidar amigos» fica por cima dos dois botões');
  }

  // ---------------- (b) Navegação ----------------
  {
    const g = abrir({ reputacao: 0, antigo: false }); // jogador novo, nível 1: sem nível mínimo
    ok(g.ev("ecraDesbloqueado('definicoes')") === true, '(b) as Definições abrem no nível 1 (sem nível mínimo)');
    g.ev("goTo('home'); goTo('perfil')");
    g.ev('ECRAS_DESENHADOS.length = 0; FUNDOS.length = 0;');
    g.clicar('perfil-definicoes');
    ok(g.ativo() === 'screen-definicoes', '(b) a roda dentada mostra o ecrã das Definições (ativo: ' + g.ativo() + ')');
    ok(JSON.parse(g.ev('JSON.stringify(ECRAS_DESENHADOS)')).join() === 'definicoes' && g.html('definicoes-container').indexOf('definicoes.title') !== -1, '(b) goTo desenha as Definições');
    ok(JSON.parse(g.ev('JSON.stringify(historicoEcras)')).join() === 'home,perfil', '(b) o Perfil fica no histórico (para o Voltar)');
    ok(g.ev('NAV_ATIVO_POR_ECRA.definicoes') === undefined && g.ev('NAV_ATIVO_POR_ECRA.perfil') === undefined, '(b) como o Perfil, não acende nenhum botão da barra de baixo');
    ok(g.ev('JSON.stringify(FUNDO_DOS_ECRAS.definicoes)') === g.ev('JSON.stringify(FUNDO_DOS_ECRAS.perfil)') && JSON.parse(g.ev('JSON.stringify(FUNDOS)')).slice(-1)[0].src === 'assets/ecras/yoshi_cat_varanda.jpg', '(b) o fundo é o do Perfil');
    const voltar = /onclick="voltarEcraAnterior\(\)" data-i18n="nav\.voltar"/.test(g.html('definicoes-container'));
    ok(voltar, '(b) as Definições têm o Voltar (voltarEcraAnterior)');
    g.ev('ECRAS_DESENHADOS.length = 0;');
    g.ev('voltarEcraAnterior()');
    ok(g.ativo() === 'screen-perfil' && JSON.parse(g.ev('JSON.stringify(ECRAS_DESENHADOS)')).join() === 'perfil', '(b) o Voltar volta ao Perfil (ativo: ' + g.ativo() + ')');
    ok(g.ev('SAVES') === 0, '(b) abrir e voltar não grava nada');
  }

  // ---------------- (c) Conteúdo das Definições ----------------
  {
    const g = abrir({ antigo: true, vibracao: false, som: true });
    g.ev("goTo('perfil'); goTo('definicoes')");
    const h = g.html('definicoes-container');
    ok(/<p class="mini-title" id="definicoes-titulo" data-i18n="definicoes\.title" onclick="perfilToqueTitulo\(\)"><\/p>/.test(h), '(c) o título «Definições» tem os 5 toques do diagnóstico');
    ['id="perfil-vibracao-check" onchange="alternarVibracao(this.checked)"', 'id="perfil-som-check" onchange="alternarSom(this.checked)"', 'id="perfil-nuvem-estado"', 'id="perfil-diagnostico"', 'id="perfil-versao"', 'id="perfil-atualizar" onclick="perfilAtualizarJogo()"'].forEach(function (x) {
      ok(h.indexOf(x) !== -1, '(c) as Definições deviam ter ' + x);
    });
    ok(g.dom.els['perfil-vibracao-check'].checked === false && g.dom.els['perfil-som-check'].checked === true, '(c) a Vibração e o Som aparecem como estão no estado');
    ok(g.dom.els['perfil-diagnostico'].hidden === true && g.dom.els['perfil-diagnostico'].textContent === '', '(c) o diagnóstico nasce escondido');
    ok(g.dom.els['perfil-versao'].textContent.indexOf('v7') !== -1, '(c) a versão aparece: ' + g.dom.els['perfil-versao'].textContent);
    ok(typeof g.dom.els['perfil-nuvem-estado'].textContent === 'string' && g.dom.els['perfil-nuvem-estado'].textContent.length > 0, '(c) a linha da nuvem é preenchida (nuvemAtualizarLinhaPerfil)');
    g.ev('alternarVibracao(true); alternarSom(false);');
    ok(g.ev('state.vibracao') === true && g.ev('state.som') === false && g.ev('SAVES') === 2 && g.ev('SOM.join()') === 'false', '(c) mudar a Vibração e o Som grava como antes');
    // 5 toques no título abrem o diagnóstico
    for (let i = 0; i < 5; i++) g.ev('perfilToqueTitulo()');
    ok(g.dom.els['perfil-diagnostico'].hidden === false && g.dom.els['perfil-diagnostico'].textContent.length > 0, '(c) 5 toques no título das Definições mostram o diagnóstico');
    // zona de perigo separada, em baixo, com o aviso forte antes do botão
    const perigo = /<div class="definicoes-perigo">([\s\S]*?)<\/div>/.exec(h);
    ok(perigo && perigo[1].indexOf('data-i18n="definicoes.apagarAvisoForte"') !== -1 && perigo[1].indexOf('definicoes.apagarAvisoForte') < perigo[1].indexOf('id="perfil-apagar-pedir"'), '(c) o aviso forte vem antes do «Apagar»');
    ok(perigo && h.indexOf('definicoes-perigo') > h.indexOf('id="perfil-atualizar"') && perigo[1].indexOf('perfil-atualizar') === -1, '(c) o «Apagar» fica à parte, depois dos outros');
    ok(/class="btn-ghost btn-perigo" id="perfil-apagar-pedir" onclick="perfilPedirApagar\(\)"/.test(h) && h.indexOf('perfilApagarTudo') === -1, '(c) o 1.º botão só pede (não apaga)');
  }

  // ---------------- (d) Apagar em 2 passos; Cancelar não apaga nada ----------------
  {
    const g = abrir({ antigo: true });
    g.ev("state.uvas = 77; state.reputacao = 3000; localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); localStorage.setItem(TEMPO_CACHE_KEY, 'x');");
    g.ev("goTo('perfil'); goTo('definicoes')");
    const antesEstado = g.ev('JSON.stringify(state)'), antesLs = JSON.stringify(g.guardado);
    g.clicar('perfil-apagar-pedir'); // 1.º passo
    const p = g.dom.painel.innerHTML;
    ok(g.dom.els['perfil-apagar-aviso'].hidden === false, '(d) o 1.º toque mostra o aviso');
    ok(g.dom.els['perfil-apagar-pedir'].hidden === true, '(d) o 1.º botão sai: só ficam o Cancelar e o «Apagar tudo»');
    ok(/id="perfil-apagar-cancelar" class="btn-pill pill-main pill-grande" onclick="renderDefinicoes\(\)"/.test(p), '(d) o «Cancelar» em destaque, a voltar às Definições');
    ok(/id="perfil-apagar-confirmar" class="btn-ghost btn-perigo" onclick="perfilApagarTudo\(\)"/.test(p) && /#perfil-apagar-confirmar\.btn-perigo \{ background: #b3261e;/.test(fontes['index.html']), '(d) o «Apagar tudo» a vermelho');
    ok(p.indexOf('perfil-apagar-cancelar') < p.indexOf('perfil-apagar-confirmar'), '(d) o «Cancelar» vem primeiro');
    ok(g.ev('APAGAR_NUVEM') === 0 && g.ev('JSON.stringify(state)') === antesEstado && JSON.stringify(g.guardado) === antesLs && g.ev('apagando') === false, '(d) o 1.º toque não apaga nada');
    g.clicar('perfil-apagar-cancelar');
    ok(g.ativo() === 'screen-definicoes' && g.dom.els['perfil-apagar-aviso'].hidden === true && g.dom.els['perfil-apagar-pedir'].hidden === false && /voltarEcraAnterior\(\)/.test(g.dom.painel.innerHTML), '(d) o Cancelar volta às Definições como estavam');
    ok(g.ev('APAGAR_NUVEM') === 0 && g.ev('JSON.stringify(state)') === antesEstado && JSON.stringify(g.guardado) === antesLs && g.ev('apagando') === false, '(d) o Cancelar não apaga nada (estado, localStorage e nuvem)');
    // só o «Apagar tudo» chama a nuvem (aqui a nuvem falha: nada se apaga e os botões voltam)
    g.clicar('perfil-apagar-pedir');
    g.clicar('perfil-apagar-confirmar');
    ok(g.ev('APAGAR_NUVEM') === 1, '(d) o «Apagar tudo» pede à nuvem que apague');
    ok(JSON.stringify(g.guardado) === antesLs && g.ev('apagando') === false && g.dom.els['perfil-apagar-confirmar'].disabled === false, '(d) se a nuvem falhar não se apaga nada e os botões voltam');
  }

  // ---------------- (e) Textos, index.html e main.js ----------------
  {
    const g = abrir({});
    const esperado = { pt: ['Definições', 'Vais perder TODO o progresso. Não dá para desfazer.'], en: ['Settings', null], es: ['Ajustes', null] };
    ['pt', 'en', 'es'].forEach(function (l) {
      const T = JSON.parse(g.ev('JSON.stringify(TRANSLATIONS.' + l + ')'));
      ok(typeof T['definicoes.title'] === 'string' && T['definicoes.title'] === esperado[l][0], l + ': título das Definições');
      ok(typeof T['perfil.definicoesAria'] === 'string' && T['perfil.definicoesAria'].length > 4, l + ': nome da roda dentada');
      ok(typeof T['definicoes.apagarAvisoForte'] === 'string' && T['definicoes.apagarAvisoForte'].length > 20 && /\b[A-Z]{3,}\b/.test(T['definicoes.apagarAvisoForte']), l + ': aviso forte de apagar (com a palavra em maiúsculas)');
      if (esperado[l][1]) ok(T['definicoes.apagarAvisoForte'] === esperado[l][1], l + ': o aviso forte é o pedido');
      ok(!/Fygmo2/.test(T['definicoes.title'] + T['perfil.definicoesAria'] + T['definicoes.apagarAvisoForte']), l + ': nada de «Fygmo2»');
    });
    const I = fontes['index.html'];
    ok(/<div id="screen-definicoes" class="screen content">\s*<div id="definicoes-container"><\/div>\s*<\/div>/.test(I), '(e) index.html tem o ecrã das Definições');
    ok(/<script src="js\/perfil\.js\?v=\d+"><\/script>\n  <script src="js\/definicoes\.js\?v=1"><\/script>/.test(I), '(e) js/definicoes.js?v=1 logo a seguir ao js/perfil.js');
    ok(/body\.jogo-cheio #screen-definicoes\.content,/.test(I), '(e) as Definições estão na lista «body.jogo-cheio ... .content»');
    ok(/if \(screen === 'definicoes'\) renderDefinicoes\(\);/.test(fontes['main.js']), '(e) goTo() desenha as Definições');
    ['definicoes.title', 'perfil.definicoesAria', 'definicoes.apagarAvisoForte'].forEach(function (k) {
      ok((fontes['i18n.js'].match(new RegExp("'" + k.replace('.', '\\.') + "': '", 'g')) || []).length === 3, '(e) js/i18n.js tem ' + k + ' nas 3 línguas');
    });
  }
  return falhas;
}

function mutar(ficheiro, de, para) {
  if (FONTES[ficheiro].indexOf(de) === -1) { console.log('FALHA: mutação impossível (texto não encontrado em ' + ficheiro + '): ' + de.slice(0, 70)); return null; }
  const f = Object.assign({}, FONTES);
  f[ficheiro] = FONTES[ficheiro].split(de).join(para);
  return f;
}

const falhas = suite(FONTES);
let impossiveis = 0;
const MUTACOES = [
  ['a roda dentada não abre as Definições', 'perfil.js', "onclick=\"goTo(\\'definicoes\\')\"", "onclick=\"goTo(\\'perfil\\')\""],
  ['o Apagar volta ao Perfil', 'perfil.js', "        '<button type=\"button\" class=\"btn-ghost\" onclick=\"goTo(\\'home\\')\" data-i18n=\"perfil.btnSairInicio\"></button>' +\n      '</div>' +", "        '<button type=\"button\" class=\"btn-ghost\" onclick=\"goTo(\\'home\\')\" data-i18n=\"perfil.btnSairInicio\"></button>' +\n      '</div>' +\n      '<button type=\"button\" class=\"btn-ghost\" onclick=\"perfilPedirApagar()\" data-i18n=\"perfil.btnApagar\"></button>' +"],
  ['os botões deixam de estar lado a lado', 'perfil.js', "'<div class=\"perfil-botoes-lado\">' +", "'<div>' +"],
  ['goTo não desenha as Definições', 'main.js', "  if (screen === 'definicoes') renderDefinicoes();\n", ''],
  ['as Definições acendem um botão da barra', 'main.js', "  roxo: 'explorar',\n  loja: 'explorar'\n", "  roxo: 'explorar',\n  definicoes: 'quinta',\n  loja: 'explorar'\n"],
  ['o fundo não é o do Perfil', 'main.js', "  definicoes: { src: 'assets/ecras/yoshi_cat_varanda.jpg' },", "  definicoes: { src: 'assets/ecras/menu_quinta.jpg' },"],
  ['sem Voltar', 'definicoes.js', "onclick=\"voltarEcraAnterior()\" data-i18n=\"nav.voltar\"", "onclick=\"goTo(\\'quinta\\')\" data-i18n=\"nav.voltar\""],
  ['apaga com um só toque', 'definicoes.js', "id=\"perfil-apagar-pedir\" onclick=\"perfilPedirApagar()\"", "id=\"perfil-apagar-pedir\" onclick=\"perfilApagarTudo()\""],
  ['o Cancelar apaga', 'definicoes.js', "onclick=\"renderDefinicoes()\" data-i18n=\"perfil.apagarCancelar\"", "onclick=\"perfilApagarTudo()\" data-i18n=\"perfil.apagarCancelar\""],
  ['o 1.º toque já chama a nuvem', 'definicoes.js', "  aviso.hidden = false;\n  const primeiro", "  aviso.hidden = false; nuvemApagarTudo(function () {});\n  const primeiro"],
  ['o confirmar deixa de ser vermelho', 'definicoes.js', 'class="btn-ghost btn-perigo" onclick="perfilApagarTudo()"', 'class="btn-ghost" onclick="perfilApagarTudo()"'],
  ['o Cancelar perde o destaque', 'definicoes.js', 'id="perfil-apagar-cancelar" class="btn-pill pill-main pill-grande"', 'id="perfil-apagar-cancelar" class="btn-ghost"'],
  ['o aviso forte depois do botão', 'definicoes.js', "        '<p class=\"definicoes-perigo-aviso\" data-i18n=\"definicoes.apagarAvisoForte\"></p>' +\n        '<p class=\"info-text\" id=\"perfil-apagar-aviso\" data-i18n=\"perfil.apagarAviso\" hidden></p>' +\n        '<button type=\"button\" class=\"btn-ghost btn-perigo\" id=\"perfil-apagar-pedir\" onclick=\"perfilPedirApagar()\" data-i18n=\"perfil.btnApagar\"></button>' +",
    "        '<p class=\"info-text\" id=\"perfil-apagar-aviso\" data-i18n=\"perfil.apagarAviso\" hidden></p>' +\n        '<button type=\"button\" class=\"btn-ghost btn-perigo\" id=\"perfil-apagar-pedir\" onclick=\"perfilPedirApagar()\" data-i18n=\"perfil.btnApagar\"></button>' +\n        '<p class=\"definicoes-perigo-aviso\" data-i18n=\"definicoes.apagarAvisoForte\"></p>' +"],
  ['o diagnóstico perde o toque no título', 'definicoes.js', 'data-i18n="definicoes.title" onclick="perfilToqueTitulo()"', 'data-i18n="definicoes.title"'],
  ['a Vibração não aparece como está', 'definicoes.js', '  if (checkVibracao) checkVibracao.checked = state.vibracao;', '  if (checkVibracao) checkVibracao.checked = true;'],
  ['aviso forte em falta (ES)', 'i18n.js', "    'definicoes.apagarAvisoForte': 'Vas a perder TODO tu progreso. No se puede deshacer.',\n", '']
];
MUTACOES.forEach(function (m) {
  const f = mutar(m[1], m[2], m[3]);
  if (!f) { impossiveis++; return; }
  let apanhada;
  try { apanhada = suite(f).length > 0; } catch (e) { apanhada = true; }
  if (!apanhada) falhas.push('MUTAÇÃO NÃO APANHADA: ' + m[0]);
});

if (falhas.length || impossiveis) {
  falhas.forEach(function (m) { console.log('FALHA: ' + m); });
  console.log((falhas.length + impossiveis) + ' falha(s)');
  process.exit(1);
}
console.log('OK (' + MUTACOES.length + ' mutações apanhadas)');
