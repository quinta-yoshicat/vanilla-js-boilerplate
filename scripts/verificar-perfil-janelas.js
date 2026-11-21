#!/usr/bin/env node
// As 9 janelas do Perfil (.profile-card, perfilCard() em js/perfil.js) e o seu aspeto no telemóvel (index.html,
// @media (max-width: 599px)). Corre o jogo real em vm (scripts/_jogo-vm.js; mais caderno, conquistas, palavras e perfil)
// e lê o CSS do index.html. Nada toca em browser, Telegram nem conta real.
//
// Prova:
//  (a) as 9 janelas existem, por esta ordem (Uvas, Gotas, Reputação, Garrafas, Conhecimento, Conquistas, Caderno, Palavras,
//      Coleção), cada uma com o ícone (SVG de traço, sem emoji), o valor e o nome (data-i18n), e só as 4 últimas clicáveis
//      (role="button", tabindex, onclick e Enter); os valores «9 / 14», «6 / 15» e «1 / 4» aparecem tal e qual;
//  (b) o CSS do telemóvel: 3 colunas; cada janela é uma grelha com o ícone à esquerda do número, na mesma linha, e o nome
//      por baixo, em letra pequena; o número não parte; a altura mínima é 44 px (área de toque) e o resto da altura é
//      cerca de metade da de antes; os ecrãs largos (600 px ou mais) ficam como estavam;
//  (c) conta, para 320, 360 e 430 px de largura, o espaço de cada janela (a partir das larguras do CSS) e confirma que o
//      ícone + o número mais comprido («9 / 14», e até 6 algarismos) cabem numa linha, com folga. É uma estimativa por
//      largura média dos carateres (algarismos 0,6 em, com margem), não uma medição num browser.
//
// Depois de passar, aplica "mutações" (estraga cada regra de propósito) e confirma que o teste as apanha.
// Uso: node scripts/verificar-perfil-janelas.js     Sai com 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { abrirJogo } = require('./_jogo-vm');

const RAIZ = path.join(__dirname, '..');
function ler(f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); }
const FONTES = { 'perfil.js': ler('js/perfil.js'), 'index.html': ler('index.html') };
const ORDEM = ['stat.uvas', 'stat.gotas', 'stat.reputacao', 'stat.garrafas', 'stat.conhecimento', 'perfil.conquistas', 'perfil.caderno', 'perfil.palavras', 'colecao.title'];
const CLICAVEIS = { 'perfil.conquistas': 'conquistas', 'perfil.caderno': 'caderno', 'perfil.palavras': 'palavras', 'colecao.title': 'colecao' };

// O CSS do bloco @media (max-width: 599px) que tem o .profile-grid, e as regras fora de qualquer @media.
function blocoTelemovel(html) {
  const re = /@media \(max-width: 599px\) \{/g; let m;
  while ((m = re.exec(html))) {
    let i = m.index + m[0].length, nivel = 1;
    for (; i < html.length && nivel > 0; i++) { if (html[i] === '{') nivel++; else if (html[i] === '}') nivel--; }
    const b = html.slice(m.index, i);
    if (b.indexOf('.profile-grid') !== -1) return b;
  }
  return '';
}
function regra(css, seletor) {
  const i = css.indexOf(seletor + ' {');
  if (i === -1) return null;
  return css.slice(i + seletor.length + 2, css.indexOf('}', i)).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
}
function px(r, prop) { const m = new RegExp('(?:^|[ ;])' + prop + ': ([0-9.]+)px').exec(r || ''); return m ? Number(m[1]) : null; }

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }

  // ---------------- (a) As 9 janelas ----------------
  {
    const g = abrirJogo({ ecraReal: true, explorar: true });
    ['caderno.js', 'conquistas.js'].forEach(function (f) { vm.runInContext(ler('js/' + f), g.cx, { filename: 'js/' + f }); });
    const garrafa = /function colecaoVisivel\(\) \{[\s\S]*?\n\}\n/.exec(ler('js/garrafa.js'));
    vm.runInContext(garrafa[0] + 'function colecaoResumo() { return "1 / 4"; }', g.cx);
    vm.runInContext(fontes['perfil.js'], g.cx, { filename: 'js/perfil.js' });
    vm.runInContext('saveState = function () {}; function atualizarDialogo() {} conquistasResumo = function () { return "9 / 14"; }; cadernoResumo = function () { return "6 / 15"; };', g.cx);
    g.ev('state.acesso.jogadorAntigo = true; state.reputacao = 3000; state.uvas = 123456; state.gotas = 7; state.garrafas = 13; state.conhecimento = 4;');
    g.ev('renderPerfil()');
    const h = g.el('perfil-container').innerHTML;
    const re = /<div class="profile-card"([^>]*)><div class="stat-icon">([\s\S]*?)<\/div><div class="stat-value">([^<]*)<\/div><div class="stat-label" data-i18n="([a-z.]+)"><\/div><\/div>/g;
    const janelas = []; let m;
    while ((m = re.exec(h))) janelas.push({ attrs: m[1], icone: m[2], valor: m[3], chave: m[4] });
    ok((h.match(/class="profile-card"/g) || []).length === 9 && janelas.length === 9, '(a) 9 janelas, todas com ícone, valor e nome (deu ' + janelas.length + ')');
    ok(janelas.map(function (j) { return j.chave; }).join() === ORDEM.join(), '(a) a ordem das janelas: ' + janelas.map(function (j) { return j.chave; }).join());
    janelas.forEach(function (j) {
      ok(/^<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"[^>]*>[\s\S]*<\/svg>$/.test(j.icone), '(a) ' + j.chave + ': o ícone é um SVG de traço');
      ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(j.icone + j.valor), '(a) ' + j.chave + ': sem emoji');
      ok(j.valor.trim() !== '', '(a) ' + j.chave + ': tem valor');
      const alvo = CLICAVEIS[j.chave];
      if (alvo) ok(j.attrs.indexOf('role="button"') !== -1 && j.attrs.indexOf('tabindex="0"') !== -1 && j.attrs.indexOf("onclick=\"goTo('" + alvo + "')\"") !== -1 && j.attrs.indexOf("event.key === 'Enter'") !== -1, '(a) ' + j.chave + ': clicável (abre ' + alvo + ')');
      else ok(j.attrs === '', '(a) ' + j.chave + ': não é clicável');
    });
    const val = {}; janelas.forEach(function (j) { val[j.chave] = j.valor; });
    ok(val['perfil.conquistas'] === '9 / 14' && val['perfil.caderno'] === '6 / 15' && val['colecao.title'] === '1 / 4' && val['stat.uvas'] === '123456', '(a) os valores aparecem tal e qual: ' + JSON.stringify(val));
    ['pt', 'en', 'es'].forEach(function (l) {
      ORDEM.forEach(function (k) { const v = g.ev('TRANSLATIONS.' + l + '["' + k + '"]'); ok(typeof v === 'string' && v.trim() !== '', '(a) falta o nome ' + k + ' em ' + l); });
    });
  }

  // ---------------- (b) O CSS ----------------
  const I = fontes['index.html'];
  const tel = blocoTelemovel(I);
  const card = regra(tel, '.profile-card'), icone = regra(tel, '.profile-card .stat-icon'), svg = regra(tel, '.profile-card .stat-icon svg');
  const valor = regra(tel, '.profile-card .stat-value'), nome = regra(tel, '.profile-card .stat-label'), grid = regra(tel, '.profile-grid');
  ok(!!tel, '(b) há o bloco @media (max-width: 599px) do Perfil');
  ok(grid && /grid-template-columns: 1fr 1fr 1fr;/.test(grid), '(b) 3 colunas no telemóvel');
  ok(card && /display: grid;/.test(card) && /grid-template-areas: "icone valor" "nome nome";/.test(card), '(b) ícone e número na mesma linha, nome por baixo');
  ok(icone && /grid-area: icone;/.test(icone) && valor && /grid-area: valor;/.test(valor) && nome && /grid-area: nome;/.test(nome), '(b) cada filho na sua área');
  ok(valor && /white-space: nowrap;/.test(valor), '(b) o número não parte');
  ok(card && px(card, 'min-height') === 44, '(b) altura mínima de 44 px (área de toque)');
  const iconePx = svg ? px(svg, 'width') : null, valorPx = px(valor, 'font-size'), nomePx = px(nome, 'font-size');
  ok(iconePx && px(svg, 'height') === iconePx && iconePx >= 14 && iconePx <= 20, '(b) o ícone com tamanho fixo e pequeno (' + iconePx + ' px)');
  ok(nomePx && nomePx <= 10 && valorPx && valorPx > nomePx, '(b) o nome em letra pequena (' + nomePx + ' px), menor que o número (' + valorPx + ' px)');
  // Altura do conteúdo: antes = 10+10 de padding + 26 (ícone) + 2 + 17*1.2 (número) + 10*1.2 (nome) + 2 de borda ≈ 82 px.
  const pad = /padding: ([0-9.]+)px/.exec(card || '');
  const altura = (pad ? 2 * Number(pad[1]) : 99) + Math.max(iconePx || 99, (valorPx || 99) * 1.15) + 1 + (nomePx || 99) * 1.15 + 2;
  ok(altura <= 48 && altura >= 36, '(b) a janela fica com cerca de metade da altura de antes (~' + altura.toFixed(1) + ' px contra ~82)');
  // Os ecrãs largos ficam como estavam (regras fora do @media).
  const fora = I.replace(tel, '');
  ok(regra(fora, '.profile-card') === 'background: rgba(12, 14, 22, 0.55); border: 1px solid rgba(245, 215, 110, 0.4); border-radius: 14px; padding: 18px 10px;', '(b) .profile-card largo igual: ' + regra(fora, '.profile-card'));
  ok(regra(fora, '.profile-card .stat-icon') === 'font-size: 26px; margin-bottom: 6px;' && regra(fora, '.profile-card .stat-value') === 'font-size: 20px;', '(b) ícone e número largos iguais');
  ok(regra(fora, '.profile-grid') === 'display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px;', '(b) a grelha larga igual (2 colunas)');

  // ---------------- (c) Cabe em 320, 360 e 430 px ----------------
  {
    const gap = px(grid, 'gap') || 8;
    const padCard = pad ? Number(/padding: [0-9.]+px ([0-9.]+)px/.exec(card)[1]) : 99;
    const colGap = px(card, 'column-gap') || 0;
    [320, 360, 430].forEach(function (w) {
      // body: 10 px de cada lado; .scroll-panel: largura min(coluna, 100vw - 20px), borda 1 px e padding 12 px de cada lado.
      const painel = Math.min(Math.min(w, 480), w - 20) - 2 - 24;
      const janela = (painel - 2 * gap) / 3 - 2 - 2 * padCard;
      // «9 / 14» = 3 algarismos, 2 espaços e uma barra; e o maior número esperado, 6 algarismos («123456»).
      const larguraNumero = function (algarismos, espacos, barras) { return valorPx * (0.6 * algarismos + 0.3 * espacos + 0.4 * barras) * 1.1; };
      const pior = Math.max(larguraNumero(3, 2, 1), larguraNumero(6, 0, 0));
      ok(iconePx + colGap + pior <= janela, w + ' px: o ícone e o número cabem numa linha (' + (iconePx + colGap + pior).toFixed(1) + ' px de ' + janela.toFixed(1) + ' px)');
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
  ['o nome sobe para o lado do número', 'index.html', 'grid-template-areas: "icone valor" "nome nome";', 'grid-template-areas: "icone valor nome";'],
  ['o ícone por cima do número outra vez', 'index.html', 'grid-template-areas: "icone valor" "nome nome";', 'grid-template-areas: "icone" "valor" "nome";'],
  ['o número pode partir', 'index.html', 'font-size: 14px; line-height: 1.15; white-space: nowrap; }', 'font-size: 14px; line-height: 1.15; }'],
  ['sem área de toque', 'index.html', '        min-height: 44px;\n        min-width: 0;', '        min-width: 0;'],
  ['a janela fica alta como antes', 'index.html', '        padding: 5px 4px;\n        box-sizing', '        padding: 20px 4px;\n        box-sizing'],
  ['o ícone fica grande', 'index.html', '.profile-card .stat-icon svg { display: block; width: 16px; height: 16px; }', '.profile-card .stat-icon svg { display: block; width: 40px; height: 40px; }'],
  ['o número não cabe a 320 px', 'index.html', 'grid-area: valor; font-size: 14px;', 'grid-area: valor; font-size: 26px;'],
  ['2 colunas no telemóvel', 'index.html', '.profile-grid { grid-template-columns: 1fr 1fr 1fr; gap: 8px;', '.profile-grid { grid-template-columns: 1fr 1fr; gap: 8px;'],
  ['mexe nos ecrãs largos', 'index.html', '      border-radius: 14px;\n      padding: 18px 10px;\n    }', '      border-radius: 14px;\n      padding: 9px 10px;\n    }'],
  ['troca a ordem das janelas', 'perfil.js', "        perfilCard(PERFIL_ICONES.uvas, state.uvas, 'stat.uvas') +\n        perfilCard(PERFIL_ICONES.gotas, state.gotas, 'stat.gotas') +", "        perfilCard(PERFIL_ICONES.gotas, state.gotas, 'stat.gotas') +\n        perfilCard(PERFIL_ICONES.uvas, state.uvas, 'stat.uvas') +"],
  ['o ícone passa a emoji', 'perfil.js', "perfilCard(PERFIL_ICONES.gotas, state.gotas, 'stat.gotas')", "perfilCard('💧', state.gotas, 'stat.gotas')"],
  ['a janela perde o nome', 'perfil.js', "'</div><div class=\"stat-label\" data-i18n=\"' + i18nKey + '\"></div></div>'", "'</div></div>'"]
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
