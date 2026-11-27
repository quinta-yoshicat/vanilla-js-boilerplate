#!/usr/bin/env node
// Painéis nos telemóveis de ecrã BAIXO (index.html, @media (max-height: 700px) and (max-width: 599px)): devolver cenário
// na Quinta, Vinha, Proteger, Festa, Lagar, Câmara e Cepa Roxa (e o fundo e o balão na Adega). Só lê o CSS REAL do
// index.html (e, se o git estiver à mão, o do master, para comparar). Nada toca em browser.
//
// Prova:
//  (a) há UM bloco de ecrã baixo e as regras novas só existem lá dentro (nenhum dos seletores novos aparece fora);
//  (b) os valores novos: cartão aberto da Quinta e da Vinha a 40vh; painel de ações do Proteger e da Festa a 36vh; Lagar,
//      Câmara e Roxo com gap 4px, caixas com padding 6px 8px, letra 12.5px e line-height 1.25, p + p a 2px; fundos a 0.5
//      (cartões) e 0.6 (caixas e balão) com sombra no texto; o balão com cara de 32px, padding 6px 10px e letra 12px;
//  (c) as regras de fora do bloco ficam como estavam: os valores de base de cada peça que o bloco mexe (cartão aberto 50vh,
//      Adega 58vh, painel de ações 42vh, Lagar/Câmara/Roxo/Loja, balão, fundos 0.62 e 0.72) e, com o git, o CSS todo de
//      fora do bloco é igual ao do master;
//  (d) os botões do Lagar, da Câmara e do Roxo mantêm min-height 44px (o bloco não toca em botões nem em alturas mínimas);
//  (e) o bloco não mexe nas listas e ecrãs de leitura (Explorar, Enciclopédia, Conquistas, Caderno, Palavras, Estrada,
//      Coleção, Perfil, Definições, Loja), nem na Adega aberta (a Reserva), nem tira o partir de linha nem o scroll;
//      todos os seletores do bloco estão presos a um destes ecrãs;
//  (f) uma estimativa (pelas medidas do CSS, não uma medição num browser) da altura livre em 360x640, antes e depois.
//
// Depois de passar, aplica "mutações" e confirma que o teste as apanha.
// Uso: node scripts/verificar-paineis-baixos.js     Sai com 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const FONTES = { 'index.html': fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8') };
const MEDIA = '@media (max-height: 700px) and (max-width: 599px)';
const ECRAS = ['#screen-quinta', '#screen-vinha', '#screen-garrafa', '#screen-proteger', '#screen-festa', '#screen-lagar', '#screen-camara', '#screen-roxo'];
const LEITURA = ['explorar', 'enciclopedia', 'conquistas', 'caderno', 'palavras', 'estrada', 'colecao', 'perfil', 'definicoes', 'loja'];

// O CSS sem comentários, o bloco do ecrã baixo e o resto.
function partir(html) {
  const css = (/<style>([\s\S]*?)<\/style>/.exec(html) || ['', ''])[1].replace(/\/\*[\s\S]*?\*\//g, '');
  const blocos = [];
  let resto = css, i;
  while ((i = resto.indexOf(MEDIA + ' {')) !== -1) {
    let n = 0, j = i + MEDIA.length + 2;
    for (n = 1; j < resto.length && n > 0; j++) { if (resto[j] === '{') n++; else if (resto[j] === '}') n--; }
    blocos.push(resto.slice(i + MEDIA.length + 2, j - 1));
    resto = resto.slice(0, i) + resto.slice(j);
  }
  return { css: css, blocos: blocos, fora: resto };
}
// Regras simples { seletores, decl } de um texto de CSS sem @media aninhado.
function regras(texto) {
  const out = []; const re = /([^{}]+)\{([^{}]*)\}/g; let m;
  while ((m = re.exec(texto))) {
    const decl = {};
    m[2].split(';').forEach(function (d) { const k = d.indexOf(':'); if (k > 0) decl[d.slice(0, k).trim()] = d.slice(k + 1).trim(); });
    out.push({ sel: m[1].trim().replace(/\s+/g, ' '), decl: decl });
  }
  return out;
}
const normal = function (s) { return s.replace(/\s+/g, ' ').trim(); };

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }
  const P = partir(fontes['index.html']);

  // (a)
  ok(P.blocos.length === 1, '(a) devia haver um só bloco «' + MEDIA + '» (há ' + P.blocos.length + ')');
  const B = regras(P.blocos[0] || '');
  const fora = normal(P.fora);
  ok(B.length >= 8, '(a) o bloco tem as regras novas (' + B.length + ')');
  B.forEach(function (r) { r.sel.split(',').forEach(function (s) { s = s.trim(); ok(fora.indexOf(s + ' {') === -1 && fora.indexOf(s + ',') === -1, '(a) o seletor novo «' + s + '» também aparece fora do bloco'); }); });

  // (b)
  const achar = function (sel) { return B.filter(function (r) { return r.sel.split(',').map(function (x) { return x.trim(); }).indexOf(sel) !== -1; })[0] || { decl: {} }; };
  ok(achar('#screen-quinta .topcard.aberto').decl['max-height'] === '40vh' && achar('#screen-vinha .topcard.aberto').decl['max-height'] === '40vh', '(b) cartão aberto da Quinta e da Vinha a 40vh');
  ECRAS.forEach(function (e) {
    const r = achar(e + ' .topcard');
    ok(r.decl.background === 'rgba(34, 16, 22, 0.5)' && /rgba\(0, 0, 0, 0\.85\)/.test(r.decl['text-shadow'] || ''), '(b) ' + e + ': cartão com fundo 0.5 e sombra no texto');
  });
  ok(achar('#screen-proteger .action-panel').decl['max-height'] === '36vh' && achar('#screen-festa .action-panel').decl['max-height'] === '36vh', '(b) painel de ações do Proteger e da Festa a 36vh');
  [['lagar', 'lagar-info'], ['camara', 'camara-info'], ['roxo', 'roxo-info']].forEach(function (c) {
    ok(achar('#screen-' + c[0] + ' .action-panel').decl.gap === '4px', '(b) ' + c[0] + ': gap 4px');
    const i = achar('#screen-' + c[0] + ' .' + c[1]).decl;
    ok(i.padding === '6px 8px' && i['font-size'] === '12.5px' && i['line-height'] === '1.25' && i.background === 'rgba(30, 12, 18, 0.6)' && /0\.85/.test(i['text-shadow'] || ''), '(b) ' + c[0] + ': caixa compacta, fundo 0.6 e sombra: ' + JSON.stringify(i));
    ok(achar('#screen-' + c[0] + ' .' + c[1] + ' p + p').decl['margin-top'] === '2px', '(b) ' + c[0] + ': p + p a 2px');
  });
  const temHas = function (s) { return ECRAS.every(function (e) { return s.indexOf(e) !== -1; }) && /^body:has\(:is\(/.test(s); };
  const balao = B.filter(function (r) { return temHas(r.sel) && /\.dialogue-bubble$/.test(r.sel); })[0] || { decl: {} };
  const cara = B.filter(function (r) { return temHas(r.sel) && /\.dialogue-avatar$/.test(r.sel); })[0] || { decl: {} };
  const msg = B.filter(function (r) { return temHas(r.sel) && /\.dialogue-msg$/.test(r.sel); })[0] || { decl: {} };
  ok(balao.decl.padding === '6px 10px' && balao.decl.gap === '8px' && balao.decl['margin-bottom'] === '4px' && balao.decl.background === 'rgba(30, 12, 18, 0.6)' && /0\.85/.test(balao.decl['text-shadow'] || ''), '(b) o balão mais baixo, fundo 0.6, sombra (só nestes ecrãs)');
  ok(cara.decl.width === '32px' && cara.decl.height === '32px' && msg.decl['font-size'] === '12px' && msg.decl['line-height'] === '1.25', '(b) a cara do balão a 32px e a letra a 12px');
  ok(!B.some(function (r) { return /\.dialogue-bubble$/.test(r.sel) && ('bottom' in r.decl || 'position' in r.decl); }), '(b) o balão fica onde sempre esteve (por cima dos botões: --balao-extra)');

  // (c) as regras de base, como no master
  const base = regras(fora.replace(/@media[^{]*\{([^{}]*\{[^{}]*\})*[^{}]*\}/g, ''));
  const valor = function (sel, prop) { const r = base.filter(function (x) { return x.sel === sel; })[0]; return r ? r.decl[prop] : undefined; };
  const ESPERADO = [
    ['.topcard.aberto', 'max-height', '50vh'], ['#garrafa-container .topcard.aberto', 'max-height', '58vh'],
    ['.action-panel', 'max-height', '42vh'], ['.topcard', 'background', 'var(--vinho-escuro)'],
    ['#lagar-container .action-panel', 'gap', '6px'], ['#camara-container .action-panel', 'gap', '6px'], ['#roxo-container .action-panel', 'gap', '6px'], ['#loja-container .action-panel', 'gap', '6px'],
    ['#lagar-container .action-panel', 'max-height', 'calc(100vh - 200px)'],
    ['.lagar-info', 'padding', '8px 10px'], ['.camara-info', 'padding', '8px 10px'], ['.roxo-info', 'padding', '8px 10px'], ['.loja-info', 'padding', '8px 10px'],
    ['.lagar-info', 'font-size', '13px'], ['.lagar-info', 'background', 'var(--vinho-escuro-forte)'], ['.lagar-info p + p', 'margin-top', '4px'],
    ['.dialogue-bubble', 'padding', '8px 12px'], ['.dialogue-avatar', 'width', '40px'], ['.dialogue-msg', 'font-size', '12.5px'],
    ['.scroll-panel', 'max-height', '48vh'], ['.scroll-panel', 'background', 'var(--vinho-escuro)']
  ];
  ESPERADO.forEach(function (c) { ok(valor(c[0], c[1]) === c[2], '(c) fora do bloco, «' + c[0] + '» ' + c[1] + ' continua ' + c[2] + ' (está ' + valor(c[0], c[1]) + ')'); });
  ok(/--vinho-escuro: rgba\(34, 16, 22, 0\.62\);/.test(fora) && /--vinho-escuro-forte: rgba\(30, 12, 18, 0\.72\);/.test(fora), '(c) as cores de fundo de todo o jogo (--vinho-escuro 0.62, -forte 0.72) não mudam');
  let master = null;
  try { master = execFileSync('git', ['show', 'origin/master:index.html'], { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { master = null; }
  if (master !== null && fontes === FONTES) {
    const M = partir(master);
    // Tirando as regras da Prova às cegas (PR 2: o botão e a prova no ecrã da Coleção, seletores com «prova»), que não
    // são de ecrã baixo nem mexem no que este bloco mexe; o resto tem de ser igual ao do master.
    const semProva = function (x) {
      return normal(x.replace(/@supports \(height: 100dvh\) \{\s*[^{}]*prova[^{}]*\{[^{}]*\}\s*\}/g, '').replace(/[^{}]*prova[^{}]*\{[^{}]*\}/g, ''));
    };
    // E as do «Ver cenário» (o olho da Quinta, js/cenario.js: seletores com «cenario»), que também não são de ecrã baixo.
    const semCenarioSo = function (x) { return normal(x.replace(/[^{}]*cenario[^{}]*\{[^{}]*\}/g, '')); };
    // E as da «Mesa do Sado» (a foto em faixa no bloco da oferta, js/estrada.js: seletores com «mesa-sado»), que também não são de ecrã baixo.
    // E as do «Moinho de Maré da Mourisca» (a foto a 100% da largura no mesmo bloco, js/estrada.js: seletores com «moinho-mare»), pelo mesmo motivo.
    const semCenario = function (x) { return normal(semCenarioSo(x).replace(/[^{}]*mesa-sado[^{}]*\{[^{}]*\}/g, '').replace(/[^{}]*moinho-mare[^{}]*\{[^{}]*\}/g, '')); };
    ok(semCenario(semProva(M.fora)) === semCenario(semProva(fora)), '(c) o CSS de fora do bloco é igual ao do master (origin/master), tirando as regras da Prova às cegas, do «Ver cenário», da «Mesa do Sado» e do «Moinho de Maré»');
    ok(semCenarioSo(fora) !== fora || !/cenario/.test(fora), '(c) (as regras do «Ver cenário» saem mesmo da comparação)');
    ok(semCenario(fora) !== semCenarioSo(fora) || !/mesa-sado/.test(fora), '(c) (as regras da «Mesa do Sado» saem mesmo da comparação)');
    ok(!/moinho-mare/.test(fora) || semCenario(fora) !== semCenarioSo(fora).replace(/[^{}]*mesa-sado[^{}]*\{[^{}]*\}/g, ''), '(c) (as regras do «Moinho de Maré» saem mesmo da comparação)');
    ok(semProva(fora) !== fora || !/prova/.test(fora), '(c) (as regras da prova saem mesmo da comparação)');
  }

  // (d) botões com 44 px
  ['lagar', 'camara', 'roxo'].forEach(function (c) { ok(valor('#' + c + '-container .action-panel .btn-pill', 'min-height') === '44px', '(d) os botões do ' + c + ' mantêm min-height 44px'); });
  ok(!B.some(function (r) { return /btn|button/.test(r.sel) || 'min-height' in r.decl || 'height' in r.decl && !/dialogue-avatar/.test(r.sel); }), '(d) o bloco não mexe em botões nem em alturas (só a cara do balão)');

  // (e) o que não muda
  B.forEach(function (r) {
    r.sel.split(/,(?![^(]*\))/).forEach(function (s) {
      s = s.trim();
      ok(/^#screen-(quinta|vinha|garrafa|proteger|festa|lagar|camara|roxo) /.test(s) || temHas(s), '(e) seletor solto (não preso a um dos ecrãs do cenário): «' + s + '»');
      LEITURA.forEach(function (l) { ok(s.indexOf('screen-' + l) === -1 && s.indexOf(l + '-container') === -1, '(e) o bloco mexe num ecrã de leitura (' + l + '): «' + s + '»'); });
    });
    ok(!/white-space|overflow|text-overflow|display/.test(Object.keys(r.decl).join(' ')), '(e) o bloco não tira o partir de linha nem o scroll (' + r.sel + ')');
  });
  ok(!B.some(function (r) { return /#screen-garrafa \.topcard\.aberto|#garrafa-container/.test(r.sel); }), '(e) a Adega aberta (a Reserva) fica como está');

  // (f) estimativa em 360x640 (altura livre = 640 menos o que os painéis tapam numa coluna)
  if (fontes === FONTES) {
    const H = 640, base = 54 + 60;   // barra de cima (10 + 44) e barra de baixo (60)
    const cartao = 62, fila = 60;    // cartão fechado (8 + 44 + 8 + 2) e fila de botões que desliza (52 + 8)
    const balaoAntes = 56 + 6, balaoDepois = 44 + 4;
    const vh = function (p) { return H * p / 100; };
    const livre = function (tapado) { return Math.max(0, Math.round((1 - tapado / H) * 100)); };
    const lagarAntes = 3 * (3 * 13 * 1.35 + 16 + 2) + 4 * 44 + 6 * 6, lagarDepois = 3 * (3 * 12.5 * 1.25 + 12 + 2) + 4 * 44 + 6 * 4;
    const camAntes = 2 * (3 * 13 * 1.35 + 16 + 2) + 2 * 44 + 3 * 6, camDepois = 2 * (3 * 12.5 * 1.25 + 12 + 2) + 2 * 44 + 3 * 4;
    const linhas = [
      ['Quinta (pior caso: cartão aberto e balão)', base + 8 + vh(50) + balaoAntes, base + 8 + vh(40) + balaoDepois],
      ['Vinha (cartão aberto e mensagens)', base + 8 + vh(50) + fila + balaoAntes, base + 8 + vh(40) + fila + balaoDepois],
      ['Adega (cartão aberto, a Reserva)', base + 8 + vh(58) + fila + balaoAntes, base + 8 + vh(58) + fila + balaoDepois],
      ['Proteger (cena e balão)', base + cartao + 8 + vh(42) + balaoAntes, base + cartao + 8 + vh(36) + balaoDepois],
      ['Festa (cena e balão)', base + cartao + 8 + vh(42) + balaoAntes, base + cartao + 8 + vh(36) + balaoDepois],
      ['Lagar (três tarefas e Voltar)', base + cartao + 8 + lagarAntes, base + cartao + 8 + lagarDepois],
      ['Câmara', base + cartao + 8 + camAntes, base + cartao + 8 + camDepois],
      ['Cepa Roxa', base + cartao + 8 + camAntes, base + cartao + 8 + camDepois]
    ];
    linhas.forEach(function (l) { ok(l[2] <= l[1], '(f) ' + l[0] + ': o depois não pode tapar mais do que o antes'); });
    ok(livre(linhas[0][2]) - livre(linhas[0][1]) >= 10 && livre(linhas[1][2]) - livre(linhas[1][1]) >= 10, '(f) Quinta e Vinha (pior caso) ganham pelo menos 10% de altura livre');
    ok(livre(linhas[3][2]) - livre(linhas[3][1]) >= 6 && livre(linhas[5][2]) - livre(linhas[5][1]) >= 4, '(f) Proteger ganha 6% ou mais e o Lagar 4% ou mais');
    if (process.env.MOSTRAR) linhas.forEach(function (l) { console.log(l[0] + ': livre ' + livre(l[1]) + '% → ' + livre(l[2]) + '%'); });
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
  ['cartão aberto a 45vh', 'index.html', '#screen-vinha .topcard.aberto { max-height: 40vh; }', '#screen-vinha .topcard.aberto { max-height: 45vh; }'],
  ['o cartão da Adega também a 40vh', 'index.html', '#screen-quinta .topcard.aberto, #screen-vinha .topcard.aberto { max-height: 40vh; }', '#screen-quinta .topcard.aberto, #screen-vinha .topcard.aberto, #screen-garrafa .topcard.aberto { max-height: 40vh; }'],
  ['painel de ações a 40vh', 'index.html', '#screen-proteger .action-panel, #screen-festa .action-panel { max-height: 36vh; }', '#screen-proteger .action-panel, #screen-festa .action-panel { max-height: 40vh; }'],
  ['regra fora do bloco (ecrãs altos mudam)', 'index.html', '  </style>', '    #screen-quinta .topcard.aberto { max-height: 40vh; }\n  </style>'],
  ['muda uma regra de base', 'index.html', '    .topcard.aberto {\n      max-height: 50vh;', '    .topcard.aberto {\n      max-height: 45vh;'],
  ['muda as cores do jogo todo', 'index.html', '--vinho-escuro: rgba(34, 16, 22, 0.62);', '--vinho-escuro: rgba(34, 16, 22, 0.5);'],
  ['botões do Lagar baixam', 'index.html', '      #screen-lagar .action-panel, #screen-camara .action-panel, #screen-roxo .action-panel { gap: 4px; }', '      #screen-lagar .action-panel, #screen-camara .action-panel, #screen-roxo .action-panel { gap: 4px; }\n      #screen-lagar .action-panel .btn-pill { min-height: 36px; }'],
  ['mexe na Enciclopédia', 'index.html', '      #screen-proteger .action-panel, #screen-festa .action-panel { max-height: 36vh; }', '      #screen-proteger .action-panel, #screen-festa .action-panel, #screen-enciclopedia .scroll-panel { max-height: 36vh; }'],
  ['seletor solto', 'index.html', '#screen-quinta .topcard, #screen-vinha .topcard, #screen-garrafa .topcard,', '.topcard, #screen-vinha .topcard, #screen-garrafa .topcard,'],
  ['tira o partir de linha', 'index.html', '        padding: 6px 8px;\n        font-size: 12.5px;', '        padding: 6px 8px;\n        white-space: nowrap;\n        font-size: 12.5px;'],
  ['sem sombra no texto', 'index.html', '        background: rgba(34, 16, 22, 0.5);\n        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.85);', '        background: rgba(34, 16, 22, 0.5);'],
  ['transparente de mais', 'index.html', '        background: rgba(34, 16, 22, 0.5);', '        background: rgba(34, 16, 22, 0.2);'],
  ['o balão muda de sítio', 'index.html', '        gap: 8px;\n        padding: 6px 10px;', '        gap: 8px;\n        bottom: 0;\n        padding: 6px 10px;'],
  ['o balão para todos os ecrãs', 'index.html', "body:has(:is(#screen-quinta, #screen-vinha, #screen-garrafa, #screen-proteger, #screen-festa, #screen-lagar, #screen-camara, #screen-roxo).active) .dialogue-bubble {", '.dialogue-bubble {'],
  ['o bloco para ecrãs altos', 'index.html', '    @media (max-height: 700px) and (max-width: 599px) {\n      #screen-quinta .topcard.aberto', '    @media (max-width: 599px) {\n      #screen-quinta .topcard.aberto']
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
