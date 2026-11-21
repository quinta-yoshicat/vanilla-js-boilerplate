#!/usr/bin/env node
// Botões .btn-pill com texto comprido em telemóveis estreitos (320, 360 e 390 px): o texto parte linha, o botão cresce em
// altura e nada fica cortado nem sai da caixa; as filas que deslizam (.pill-scroll) e os ecrãs largos ficam como estavam; o
// botão «Visitar a Reserva» tem o motivo numa linha própria. Lê o CSS do index.html e procura os botões em js/ e no
// index.html; corre js/reserva.js real em vm para o HTML do botão da Reserva. Nada toca em browser.
//
// Como: uma cascata CSS simplificada (regras de classe/id/atributo, com antecessores, sem pseudo-classes; a especificidade e a
// ordem decidem) calcula, para cada botão .btn-pill encontrado e o sítio onde vive, o valor que fica no telemóvel
// (@media (max-width: 599px)) e nos ecrãs largos (sem @media).
//
// Prova:
//  (a) todos os .btn-pill do jogo foram encontrados e cada um tem o seu sítio conhecido (um botão novo obriga a pô-lo aqui);
//  (b) no telemóvel, nenhum .btn-pill fora das filas que deslizam tem white-space: nowrap; todos podem partir palavras
//      compridas (overflow-wrap: anywhere), não passam da caixa (max-width ≤ 100%), têm altura mínima de pelo menos 40 px
//      (44 px nos novos) e cantos que não comem o texto em 2 linhas (raio ≤ metade da altura mínima, logo igual à pastilha
//      de antes numa só linha);
//  (c) as filas que deslizam (.pill-scroll) ficam como estavam: nowrap, cantos de 999px, padding 0 16px; o Colher continua a
//      poder partir, com no máximo 272 px;
//  (d) nos ecrãs largos tudo fica como antes (os valores sem @media são os de antes, e as regras novas estão todas dentro
//      do @media (max-width: 599px));
//  (e) a Reserva: o botão tem o nome e o motivo em elementos separados (nas 3 línguas, para os 3 motivos; sem motivo, só o
//      nome) e, no telemóvel, o motivo vai para uma linha própria, por baixo, mais pequeno e centrado.
//
// Depois de passar, aplica "mutações" e confirma que o teste as apanha.
// Uso: node scripts/verificar-botoes-texto.js     Sai com 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
function ler(f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); }
const JS = fs.readdirSync(path.join(RAIZ, 'js')).filter(function (f) { return /\.js$/.test(f); }).sort();
const FONTES = { 'index.html': ler('index.html'), 'reserva.js': ler('js/reserva.js') };

// ---------------------------------------------------------------- CSS
// Lê as regras: { seletores: [...], decl: {prop: valor}, media: null | 'tel' | 'outra', ordem }.
function lerCss(html) {
  const css = (/<style>([\s\S]*?)<\/style>/.exec(html) || ['', ''])[1].replace(/\/\*[\s\S]*?\*\//g, '');
  const regras = []; let ordem = 0;
  function bloco(texto, media) {
    let i = 0;
    while (i < texto.length) {
      const a = texto.indexOf('{', i);
      if (a === -1) break;
      const cabeca = texto.slice(i, a).trim();
      let n = 1, j = a + 1;
      for (; j < texto.length && n > 0; j++) { if (texto[j] === '{') n++; else if (texto[j] === '}') n--; }
      const corpo = texto.slice(a + 1, j - 1);
      if (cabeca.indexOf('@media') === 0) bloco(corpo, /^@media \(max-width: 599px\)$/.test(cabeca) ? 'tel' : 'outra');
      else if (cabeca.indexOf('@') === 0) { /* @font-face, @keyframes, @supports: fora */ }
      else {
        const decl = {};
        corpo.split(';').forEach(function (d) { const k = d.indexOf(':'); if (k > 0) decl[d.slice(0, k).trim()] = d.slice(k + 1).trim(); });
        regras.push({ seletores: cabeca.split(',').map(function (x) { return x.trim(); }), decl: decl, media: media, ordem: ordem++ });
      }
      i = j;
    }
  }
  bloco(css, null);
  return regras;
}
// Um seletor composto simples (".a.b#c[x="y"]") -> { classes, ids, attrs, pseudo }.
function composto(c) {
  return {
    tag: (/^[a-z]+/.exec(c) || [null])[0],
    classes: (c.match(/\.[a-zA-Z0-9_-]+/g) || []).map(function (x) { return x.slice(1); }),
    ids: (c.match(/#[a-zA-Z0-9_-]+/g) || []).map(function (x) { return x.slice(1); }),
    attrs: (c.match(/\[[^\]]+\]/g) || []),
    pseudo: /:/.test(c.replace(/\[[^\]]+\]/g, ''))
  };
}
// O seletor aplica-se a um botão { classes, attrs, contexto: [classes e #ids dos antecessores] }? Devolve a especificidade ou null.
function aplica(seletor, botao) {
  if (/[>+~]/.test(seletor)) return null;
  const partes = seletor.split(/\s+/).map(composto);
  if (partes.some(function (p) { return p.pseudo; })) return null;
  const ultimo = partes[partes.length - 1];
  if (ultimo.tag && ultimo.tag !== 'button') return null;
  if (ultimo.ids.length) return null;
  if (!ultimo.classes.every(function (c) { return botao.classes.indexOf(c) !== -1; })) return null;
  if (!ultimo.attrs.every(function (a) { return botao.attrs.indexOf(a) !== -1; })) return null;
  if (!ultimo.classes.length && !ultimo.attrs.length) return null;
  for (let i = 0; i < partes.length - 1; i++) {
    const p = partes[i];
    if (p.tag && p.tag !== 'body') return null;
    if (p.tag === 'body' && !p.classes.length) continue;
    if (!p.classes.every(function (c) { return botao.contexto.indexOf('.' + c) !== -1; })) return null;
    if (!p.ids.every(function (d) { return botao.contexto.indexOf('#' + d) !== -1; })) return null;
    if (p.attrs.length) return null;
  }
  let ids = 0, cls = 0, tags = 0;
  partes.forEach(function (p) { ids += p.ids.length; cls += p.classes.length + p.attrs.length; tags += p.tag ? 1 : 0; });
  return ids * 10000 + cls * 100 + tags;
}
// Valor final de cada propriedade para o botão, no telemóvel (tel = true) ou num ecrã largo.
function calcular(regras, botao, tel) {
  const ganha = {};
  regras.forEach(function (r) {
    if (r.media === 'outra' || (r.media === 'tel' && !tel)) return;
    r.seletores.forEach(function (s) {
      const esp = aplica(s, botao);
      if (esp === null) return;
      Object.keys(r.decl).forEach(function (k) {
        const atual = ganha[k];
        if (!atual || esp > atual.esp || (esp === atual.esp && r.ordem >= atual.ordem)) ganha[k] = { v: r.decl[k], esp: esp, ordem: r.ordem };
      });
    });
  });
  const out = {}; Object.keys(ganha).forEach(function (k) { out[k] = ganha[k].v; });
  if (out.gap && !out['row-gap']) out['row-gap'] = out.gap;
  return out;
}
function px(v) { const m = /^([0-9.]+)px$/.exec(v || ''); return m ? Number(m[1]) : null; }

// ---------------------------------------------------------------- Os botões
// Todos os class="btn-pill ..." em js/*.js e no index.html (fora do <style>), com o sítio onde vivem.
function encontrarBotoes(fontes) {
  const achados = [];
  const ficheiros = JS.map(function (f) { return ['js/' + f, f === 'reserva.js' ? fontes['reserva.js'] : ler('js/' + f)]; })
    .concat([['index.html', fontes['index.html'].replace(/<style>[\s\S]*?<\/style>/, '')]]);
  ficheiros.forEach(function (par) {
    par[1].split('\n').forEach(function (linha, i) {
      if (/^\s*\/\//.test(linha)) return;
      const re = /class="(btn-pill[^"]*)"/g; let m;
      while ((m = re.exec(linha))) achados.push({ onde: par[0] + ':' + (i + 1), classes: m[1].split(/\s+/), linha: linha });
    });
  });
  return achados;
}
// O sítio de cada botão (os antecessores que o CSS pode usar). Um botão que não esteja aqui faz falhar o teste.
function contexto(b) {
  const c = b.classes, f = b.onde.split(':')[0];
  if (/data-acao=/.test(b.linha) && ['js/vinha.js', 'js/garrafa.js', 'js/festas.js'].indexOf(f) !== -1) return { ctx: ['.pill-scroll', '.pill-scroll-wrap'], fila: true };
  if (c.indexOf('reserva-visita-botao') !== -1) return { ctx: ['.reserva-bloco', '.topcard', '#garrafa-container'] };
  if (f === 'index.html') return { ctx: ['.unlock-card'] };
  const sitio = { 'lagar-botao': 'lagar', 'lagar-botao-mesa': 'lagar', 'lagar-botao-assalto': 'lagar', 'camara-botao': 'camara', 'roxo-botao': 'roxo', 'loja-botao': 'loja' };
  for (const k in sitio) if (c.indexOf(k) !== -1) return { ctx: ['#' + sitio[k] + '-container', '.action-panel'] };
  if (['estrada-botao', 'oferta-botao', 'explorar-botao'].some(function (k) { return c.indexOf(k) !== -1; })) return { ctx: ['.scroll-panel', '.mini-bloco'] };
  if (c.indexOf('pill-grande') !== -1 || c.indexOf('colecao-arrumar-botao') !== -1 || c.join(' ') === 'btn-pill' || c.join(' ') === 'btn-pill pill-main') return { ctx: ['.action-panel'] };
  return null;
}

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }
  const regras = lerCss(fontes['index.html']);
  const botoes = encontrarBotoes(fontes);

  // (a)
  ok(botoes.length >= 35, '(a) devia encontrar os .btn-pill do jogo (achou ' + botoes.length + ')');
  botoes.forEach(function (b) { const c = contexto(b); ok(!!c, '(a) botão sem sítio conhecido (põe-no em contexto()): ' + b.onde + ' ' + b.classes.join(' ')); b.ctx = c; });
  const naFila = botoes.filter(function (b) { return b.ctx && b.ctx.fila; });
  ok(naFila.length === 3, '(a) os 3 botões das filas que deslizam (Vinha, Adega, Festa): ' + naFila.map(function (b) { return b.onde; }).join(', '));

  botoes.forEach(function (b) {
    if (!b.ctx) return;
    const attrs = []; const da = /data-acao="([a-z]+)"/.exec(b.linha);
    const base = { classes: b.classes, attrs: attrs, contexto: b.ctx.ctx };
    const casos = b.ctx.fila ? [base, { classes: b.classes, attrs: ['[data-acao="colher"]'], contexto: b.ctx.ctx }] : [base];
    casos.forEach(function (bt) {
      const nome = b.onde + (bt.attrs.length ? ' (Colher)' : '') + ' [' + b.classes.join(' ') + ']';
      const tel = calcular(regras, bt, true), largo = calcular(regras, bt, false);
      if (!b.ctx.fila) {
        // (b) telemóvel
        ok(tel['white-space'] !== 'nowrap', '(b) ' + nome + ': nowrap no telemóvel');
        ok(tel['overflow-wrap'] === 'anywhere', '(b) ' + nome + ': palavras compridas não partem (overflow-wrap: ' + tel['overflow-wrap'] + ')');
        ok(tel['max-width'] === '100%' || tel['max-width'] === '50%' || px(tel['max-width']) !== null, '(b) ' + nome + ': pode passar da caixa (max-width: ' + tel['max-width'] + ')');
        const alt = px(tel['min-height']), raio = px(tel['border-radius']);
        ok(alt !== null && alt >= 40, '(b) ' + nome + ': altura mínima ' + tel['min-height']);
        ok(raio !== null && alt !== null && raio <= alt / 2, '(b) ' + nome + ': cantos (' + tel['border-radius'] + ') maiores do que metade da altura (' + tel['min-height'] + '): cortam o texto em 2 linhas');
        ok(tel['flex-wrap'] === 'wrap' || tel['flex-direction'] === 'column', '(b) ' + nome + ': o motivo/sufixo não pode passar para baixo');
      } else {
        // (c) as filas que deslizam
        const colher = bt.attrs.length > 0;
        ok(tel['white-space'] === (colher ? 'normal' : 'nowrap') && tel['border-radius'] === '999px' && tel.padding === '0 16px' && (tel['flex-wrap'] || 'nowrap') === 'nowrap', '(c) ' + nome + ': a fila que desliza mudou no telemóvel: ' + JSON.stringify([tel['white-space'], tel['border-radius'], tel.padding, tel['flex-wrap']]));
        if (colher) ok(tel['max-width'] === '272px' && largo['max-width'] === '272px', '(c) o Colher continua com no máximo 272 px');
      }
      // (d) ecrãs largos iguais a antes: o .btn-pill de sempre (nowrap, 999px, padding 0 16px) e o que cada classe já tinha.
      ok((largo['border-radius'] === '999px') && (largo.padding === '0 16px' || b.classes.indexOf('reserva-visita-botao') !== -1), '(d) ' + nome + ': mudou nos ecrãs largos: ' + JSON.stringify([largo['border-radius'], largo.padding]));
      ok(!('overflow-wrap' in largo) && !('flex-wrap' in largo) && !('line-height' in largo), '(d) ' + nome + ': regra nova fora do telemóvel');
    });
  });
  // (d) o .btn-pill de base continua igual e as regras novas estão no @media (max-width: 599px)
  const baseBtn = regras.filter(function (r) { return r.media === null && r.seletores.join() === '.btn-pill'; })[0];
  ok(baseBtn && baseBtn.decl['white-space'] === 'nowrap' && baseBtn.decl['border-radius'] === '999px' && baseBtn.decl['min-height'] === '44px' && baseBtn.decl.padding === '0 16px', '(d) o .btn-pill de base (ecrãs largos) ficou como estava');
  const reservaLargo = regras.filter(function (r) { return r.media === null && r.seletores.join() === '.reserva-bloco .reserva-visita-botao'; })[0];
  ok(reservaLargo && reservaLargo.decl['min-height'] === '40px' && !reservaLargo.decl['flex-direction'], '(d) a Reserva nos ecrãs largos ficou como estava');

  // (e) a Reserva
  {
    const R = { classes: ['btn-pill', 'pill-main', 'reserva-visita-botao'], attrs: [], contexto: ['.reserva-bloco'] };
    const tel = calcular(regras, R, true);
    ok(tel['flex-direction'] === 'column' && tel['align-items'] === 'center' && px(tel['min-height']) >= 44, '(e) no telemóvel o botão da Reserva empilha (nome em cima, motivo por baixo), centrado, com 44 px');
    const suf = calcular(regras, { classes: ['cooldown-suffix'], attrs: [], contexto: ['.btn-pill', '.reserva-visita-botao', '.reserva-bloco'] }, true);
    ok(suf.display === 'block' && px(suf['font-size']) !== null && px(suf['font-size']) < 13.5 && suf['text-align'] === 'center' && (suf.margin === '0' || suf['margin-left'] === '0'), '(e) o motivo em linha própria, mais pequeno e centrado: ' + JSON.stringify(suf));
    // o HTML: nome e motivo em elementos separados, para os 3 motivos e nas 3 línguas
    const cx = vm.createContext({ console: { log() {} } });
    vm.runInContext(fontes['reserva.js'].slice(fontes['reserva.js'].indexOf('function reservaBotaoHtml()'), fontes['reserva.js'].indexOf('\n}\n', fontes['reserva.js'].indexOf('function reservaBotaoHtml()')) + 3), cx);
    const T = { 'reserva.btn': 'Visitar a Reserva', 'reserva.semGarrafas': 'faz uma garrafa', 'reserva.jaHoje': 'já feito hoje', 'reserva.relogio': 'relógio atrás' };
    cx.t = function (k) { return T[k] || k; }; cx.state = {}; cx.reservaDiaDeHoje = function () { return 'd'; };
    [['sem_garrafas', 'faz uma garrafa'], ['ja_hoje', 'já feito hoje'], ['dia_anterior', 'relógio atrás']].forEach(function (m) {
      cx.reservaPodeVisitar = function () { return { ok: false, motivo: m[0] }; };
      const h = vm.runInContext('reservaBotaoHtml()', cx);
      ok(/class="btn-pill pill-main reserva-visita-botao"[^>]* disabled>/.test(h) && new RegExp('<span>Visitar a Reserva</span><span class="cooldown-suffix">[^<]*' + m[1] + '[^<]*</span></button>$').test(h), '(e) ' + m[0] + ': o nome e o motivo em elementos separados: ' + h);
    });
    cx.reservaPodeVisitar = function () { return { ok: true, motivo: null }; };
    ok(/<span>Visitar a Reserva<\/span><\/button>$/.test(vm.runInContext('reservaBotaoHtml()', cx)), '(e) sem motivo, só o nome');
  }
  return falhas;
}

function mutar(ficheiro, de, para) {
  if (FONTES[ficheiro].indexOf(de) === -1) { console.log('FALHA: mutação impossível (texto não encontrado em ' + ficheiro + '): ' + de.slice(0, 70)); return null; }
  const f = Object.assign({}, FONTES); f[ficheiro] = FONTES[ficheiro].split(de).join(para); return f;
}
const falhas = suite(FONTES);
let impossiveis = 0;
const MUTACOES = [
  ['o telemóvel volta ao nowrap', 'index.html', '      .btn-pill {\n        white-space: normal;', '      .btn-pill {\n        white-space: nowrap;'],
  ['as palavras compridas não partem', 'index.html', '        overflow-wrap: anywhere;\n        border-radius: 22px;', '        border-radius: 22px;'],
  ['os cantos voltam a 999px no telemóvel', 'index.html', '        overflow-wrap: anywhere;\n        border-radius: 22px;', '        overflow-wrap: anywhere;\n        border-radius: 999px;'],
  ['o pill-grande com cantos grandes', 'index.html', '      .btn-pill.pill-grande { border-radius: 26px; }', '      .btn-pill.pill-grande { border-radius: 40px; }'],
  ['pode passar da caixa', 'index.html', '        max-width: 100%;\n        min-width: 0;\n        padding: 6px 16px;', '        max-width: none;\n        min-width: 0;\n        padding: 6px 16px;'],
  ['as filas que deslizam passam a partir', 'index.html', '      .pill-scroll .btn-pill {\n        white-space: nowrap;', '      .pill-scroll .btn-pill {\n        white-space: normal;'],
  ['o Colher perde o seu limite', 'index.html', '      .pill-scroll .btn-pill[data-acao="colher"] { white-space: normal; max-width: 272px; }\n', ''],
  ['a regra nova sai do telemóvel', 'index.html', '    @media (max-width: 599px) {\n      .btn-pill {\n        white-space: normal;', '    @media all {\n      .btn-pill {\n        white-space: normal;'],
  ['a Reserva com o motivo ao lado', 'index.html', '.reserva-bloco .reserva-visita-botao { flex-direction: column;', '.reserva-bloco .reserva-visita-botao { flex-direction: row;'],
  ['o motivo da Reserva do mesmo tamanho', 'index.html', '.reserva-visita-botao .cooldown-suffix { display: block; margin: 0; font-size: 11px;', '.reserva-visita-botao .cooldown-suffix { display: block; margin: 0; font-size: 14px;'],
  ['o motivo da Reserva em linha', 'index.html', '.reserva-visita-botao .cooldown-suffix { display: block;', '.reserva-visita-botao .cooldown-suffix { display: inline-flex;'],
  ['a Reserva baixa de 44 px', 'index.html', 'align-items: center; row-gap: 1px; min-height: 44px; }', 'align-items: center; row-gap: 1px; min-height: 36px; }'],
  ['a Reserva junta o nome e o motivo', 'reserva.js', "'<span>' + t('reserva.btn') + '</span>' + (motivo ? '<span class=\"cooldown-suffix\"> (' + motivo + ')</span>' : '')", "'<span>' + t('reserva.btn') + (motivo ? ' (' + motivo + ')' : '') + '</span>'"]
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
