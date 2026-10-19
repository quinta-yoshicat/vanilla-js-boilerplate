#!/usr/bin/env node
// O ecrã «Palavras da Quinta» e o cartão «Palavras» do Perfil (renderPalavras() em js/palavras.js; palavrasCartaoPerfil() e renderPerfil() em
// js/perfil.js), com o jogo real em vm (scripts/_jogo-vm.js: state, i18n, niveis e dados/ reais; mais caderno, conquistas e perfil) e um
// nível e um estado de teste. Só LÊ: nunca toca em browser, Telegram nem conta real.
//
// Prova:
//  (a) o cartão: só a partir do nível 4 (jogador antigo vê-o logo); cartões no Perfil por nível: 6 (níveis 1 e 2), 7 (3), 8 (4 e 5) e 9 (6 em
//      diante); ordem Conquistas, Caderno, Palavras, Coleção; mostra só o total («20»), o nome «Palavras» (Words, Palabras) e abre goTo('palavras');
//      o ícone é um balão desenhado com traços (path, traço 1.6, 26 px, sem <text>);
//  (b) o ecrã: um cartão por palavra (as 20), por ordem alfabética, com a palavra em título e a explicação por baixo com a 1.ª letra em maiúscula
//      (nas 3 línguas), o título e o subtítulo do ecrã e o botão Voltar; os textos existem em PT, EN e ES;
//  (c) a palavra e a explicação passam SEMPRE por escaparHtml(): «<b>x</b>&» sai escapado (e nunca como HTML);
//  (d) só lê: abrir o Perfil e o ecrã não grava (nem localStorage, nem saveState), não muda o state e não fala com a nuvem;
//  (e) os sítios do costume: o index.html tem #screen-palavras e #palavras-container e a lista «body.jogo-cheio»; js/main.js chama renderPalavras()
//      em goTo, e tem palavras em NAV_ATIVO_POR_ECRA e FUNDO_DOS_ECRAS (com um ficheiro que existe); NIVEL_NECESSARIO_POR_ECRA.palavras é 4;
//      js/palavras.js e o cartão não tocam em estado, armazenamento, nuvem nem rede; o nuvem.js e o state.js não falam das palavras;
//  (f) nenhum texto novo fala de bots nem de IA.
//
// Uso: node scripts/verificar-palavras-ecra.js
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { abrirJogo } = require('./_jogo-vm');

const RAIZ = path.join(__dirname, '..');
const LINGUAS = ['pt', 'en', 'es'];
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }
function ler(f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); }

// Os 20 pela ordem alfabética (as palavras; os ids provam-se em scripts/verificar-palavras.js).
const PALAVRAS = ['aguardente vínica', 'alambique', 'bacelo', 'bagaceira', 'bagaço', 'casta', 'curtimenta', 'DOP', 'estuário', 'fortificar', 'jeropiga', 'lagar', 'míldio', 'montado', 'mosto', 'oídio', 'pousio', 'redura', 'torna-viagem', 'vinho generoso'];

// Abre o jogo e acrescenta-lhe o Perfil e o que ele desenha; "saves" conta as gravações (saveState) e "guardado" é o localStorage simulado.
function abrir() {
  const g = abrirJogo({ ecraReal: true, explorar: true });
  ['caderno.js', 'conquistas.js', 'perfil.js', 'palavras.js'].forEach(function (f) {
    if (f === 'palavras.js') return; // já vem com o jogo (antes do dados.js)
    vm.runInContext(ler('js/' + f), g.cx, { filename: 'js/' + f });
  });
  // A Coleção (js/garrafa.js) é grande de mais para carregar aqui: usa-se a função real que decide se aparece, e um resumo fixo.
  const garrafa = /function colecaoVisivel\(\) \{[\s\S]*?\n\}\n/.exec(ler('js/garrafa.js'));
  vm.runInContext(garrafa[0] + 'function colecaoResumo() { return "0 / 4"; }', g.cx);
  vm.runInContext('var __saves = 0; saveState = function () { __saves++; }; function atualizarDialogo() {}', g.cx);
  return g;
}
function nivel(g, n, antigo) {
  g.ev('state.reputacao = NIVEIS_CONFIG[' + (n - 1) + '].min; state.acesso.jogadorAntigo = ' + (antigo ? 'true' : 'false') + ';');
}
function perfil(g) { g.ev('renderPerfil()'); return g.el('perfil-container').innerHTML; }
function cartoes(h) { return (h.match(/class="profile-card"/g) || []).length; }
function chaves(h) { return (h.match(/class="stat-label" data-i18n="[a-z.]+"/g) || []).map(function (x) { return /data-i18n="([a-z.]+)"/.exec(x)[1]; }); }

// (a) cartões por nível, e a ordem
{
  const g = abrir();
  const esperado = { 1: 6, 2: 6, 3: 7, 4: 8, 5: 8, 6: 9, 7: 9, 10: 9, 20: 9 };
  Object.keys(esperado).forEach(function (n) {
    nivel(g, Number(n), false);
    ok(g.ev('nivelPelaReputacao(state.reputacao)') === Number(n), 'o jogador devia ser do nível ' + n);
    const h = perfil(g);
    ok(cartoes(h) === esperado[n], 'nível ' + n + ': o Perfil devia ter ' + esperado[n] + ' cartões, tem ' + cartoes(h));
    ok((h.indexOf('data-i18n="perfil.palavras"') !== -1) === (Number(n) >= 4), 'nível ' + n + ': o cartão «Palavras» só devia aparecer a partir do nível 4');
  });
  // Jogador antigo: tudo aberto, mesmo com pouca Reputação.
  nivel(g, 1, true);
  const antigo = perfil(g);
  ok(cartoes(antigo) === 9 && antigo.indexOf('data-i18n="perfil.palavras"') !== -1, 'jogador antigo no nível 1: devia ver os 9 cartões, com o das Palavras');
  // A ordem: Conquistas, Caderno, Palavras, Coleção (e os 5 de sempre à frente).
  nivel(g, 6, false);
  ok(chaves(perfil(g)).join() === 'stat.uvas,stat.gotas,stat.reputacao,stat.garrafas,stat.conhecimento,perfil.conquistas,perfil.caderno,perfil.palavras,colecao.title', 'a ordem dos cartões devia ser Conquistas, Caderno, Palavras, Coleção: ' + chaves(perfil(g)).join());
  // O cartão: total, nome nas 3 línguas, abre o ecrã, ícone de traço.
  const card = g.ev('palavrasCartaoPerfil()');
  ok(/<div class="stat-value">20<\/div>/.test(card), 'o cartão devia mostrar só o total («20»): ' + card.slice(0, 200));
  ok(!/\d+ \/ \d+/.test(card), 'o cartão não devia ter «n / total» (não há palavras descobertas)');
  ok(card.indexOf("onclick=\"goTo('palavras')\"") !== -1 && card.indexOf('role="button"') !== -1 && card.indexOf('tabindex="0"') !== -1 && card.indexOf("goTo('palavras')\"") !== -1, 'o cartão devia abrir goTo(\'palavras\') (com role e tabindex, como o Caderno)');
  ok(/onkeydown="if \(event\.key === 'Enter'\) goTo\('palavras'\)"/.test(card), 'o cartão devia abrir também com Enter');
  const icone = g.ev('PERFIL_ICONES.palavras');
  ok(/^<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1\.6" stroke-linecap="round" stroke-linejoin="round" width="26" height="26">/.test(icone) && icone.indexOf('<path') !== -1 && icone.indexOf('<text') === -1, 'o ícone devia ser um SVG de traço (1.6, 26 px) feito de path, sem <text>');
  ok(/<path d="M5 4h14[^"]*z"><\/path>/.test(icone), 'o ícone devia ter o balão de fala');
  ok(Object.keys(g.ev('PERFIL_ICONES')).indexOf('palavras') !== -1 && g.ev('PERFIL_ICONES.palavras') !== g.ev('PERFIL_ICONES.caderno'), 'o ícone das Palavras devia ser o seu (não o do Caderno)');
  const nomes = { pt: 'Palavras', en: 'Words', es: 'Palabras' };
  LINGUAS.forEach(function (l) {
    ok(g.ev("TRANSLATIONS." + l + "['perfil.palavras']") === nomes[l], 'o nome do cartão (' + l + ') devia ser «' + nomes[l] + '»');
  });
  // Cartão e ecrã trancados abaixo do nível 4.
  nivel(g, 3, false);
  ok(g.ev('palavrasCartaoPerfil()') === '' && g.ev("ecraDesbloqueado('palavras')") === false, 'nível 3: o cartão não devia existir e o ecrã devia estar trancado');
  nivel(g, 4, false);
  ok(g.ev("ecraDesbloqueado('palavras')") === true && g.ev('NIVEL_NECESSARIO_POR_ECRA.palavras') === 4, 'nível 4: o ecrã devia abrir (NIVEL_NECESSARIO_POR_ECRA.palavras = 4)');
}

// (b) o ecrã
{
  const g = abrir();
  nivel(g, 6, false);
  LINGUAS.forEach(function (l) {
    g.ev("currentLang = '" + l + "'");
    g.ev('renderPalavras()');
    const h = g.el('palavras-container').innerHTML;
    const titulos = (h.match(/<h3>[^<]*<\/h3>/g) || []).map(function (x) { return x.replace(/<\/?h3>/g, ''); });
    const textos = (h.match(/<h3>[^<]*<\/h3><p>[^<]*<\/p>/g) || []).map(function (x) { return /<p>([^<]*)<\/p>/.exec(x)[1]; });
    ok((h.match(/class="encyclopedia-card"/g) || []).length === 20, l + ': devia haver um cartão por palavra (20)');
    ok(titulos.join() === PALAVRAS.join(), l + ': as palavras deviam vir por ordem alfabética: ' + titulos.join());
    ok(textos.length === 20 && textos.every(function (t) { return t.length > 10 && t.charAt(0) === t.charAt(0).toUpperCase() && t.charAt(0) !== t.charAt(0).toLowerCase(); }), l + ': cada explicação devia começar com letra maiúscula: ' + textos.map(function (t) { return t.charAt(0); }).join(''));
    ok(h.indexOf('class="topcard"') !== -1 && h.indexOf('data-i18n="palavras.title"') !== -1, l + ': devia ter o topcard com o título');
    ok(/class="mini-sub">20 · /.test(h), l + ': o subtítulo devia levar o total («20 · ...»)');
    ok(h.indexOf('class="scroll-panel encyclopedia-grid"') !== -1, l + ': devia usar a lista que desliza do Caderno e da Enciclopédia');
    ok(h.indexOf('onclick="voltarEcraAnterior()"') !== -1 && h.indexOf('data-i18n="nav.voltar"') !== -1, l + ': devia ter o botão Voltar');
    ok(h.indexOf('<h3>' + 'DOP' + '</h3>') !== -1, l + ': «DOP» devia aparecer como palavra');
  });
  g.ev("currentLang = 'pt'"); g.ev('renderPalavras()');
  const pt = g.el('palavras-container').innerHTML;
  ok(pt.indexOf('<h3>mosto</h3><p>O sumo das uvas, antes de virar vinho.</p>') !== -1, 'pt: «mosto» devia levar «O sumo das uvas, antes de virar vinho.»');
  ok(pt.indexOf('<h3>DOP</h3><p>Denominação de Origem Protegida:') !== -1, 'pt: «DOP» devia começar por «Denominação de Origem Protegida:»');
  g.ev("currentLang = 'en'"); g.ev('renderPalavras()');
  ok(g.el('palavras-container').innerHTML.indexOf('<h3>DOP</h3><p>PDO (Protected Designation of Origin):') !== -1, 'en: «DOP» devia começar por «PDO (Protected Designation of Origin):»');
  g.ev("currentLang = 'es'"); g.ev('renderPalavras()');
  ok(g.el('palavras-container').innerHTML.indexOf('<h3>DOP</h3><p>DOP (Denominación de Origen Protegida):') !== -1, 'es: «DOP» devia começar por «DOP (Denominación de Origen Protegida):»');
  // A explicação sem a língua pedida cai para o português.
  g.ev("currentLang = 'en'; PALAVRAS_DA_QUINTA.push({ id: 'so_pt_t', palavra: 'zzz', explicacao: { pt: 'só em português.' } }); renderPalavras()");
  ok(g.el('palavras-container').innerHTML.indexOf('<h3>zzz</h3><p>Só em português.</p>') !== -1, 'sem a língua pedida, devia cair para o português');
  // Os textos do ecrã: PT, EN e ES.
  const t3 = { 'palavras.title': ['Palavras da Quinta', 'Words of the Quinta', 'Palabras de la Quinta'],
    'palavras.subtitulo': ['As palavras difíceis do jogo, explicadas de forma simples.', "The game's difficult words, explained simply.", 'Las palabras difíciles del juego, explicadas de forma sencilla.'] };
  Object.keys(t3).forEach(function (k) {
    LINGUAS.forEach(function (l, i) { ok(g.ev("TRANSLATIONS." + l + "['" + k + "']") === t3[k][i], 'o texto «' + k + '» (' + l + ') devia ser «' + t3[k][i] + '»'); });
  });
  // A maiúscula é só apresentação: a lista continua com os textos dos dados.
  ok(g.ev("PALAVRAS_DA_QUINTA.filter(function (p) { return p.id === 'mosto'; })[0].explicacao.pt") === 'o sumo das uvas, antes de virar vinho.', 'a lista devia continuar com os textos de dados/ (a maiúscula é só ao desenhar)');
  ok(g.ev("palavrasInicialMaiuscula('o sumo')") === 'O sumo' && g.ev("palavrasInicialMaiuscula('DOP: x')") === 'DOP: x' && g.ev("palavrasInicialMaiuscula('')") === '' && g.ev("palavrasInicialMaiuscula('é a')") === 'É a', 'palavrasInicialMaiuscula: «o sumo» → «O sumo», «DOP» fica, «é» → «É», vazio fica vazio');
}

// (c) escaparHtml: tudo o que vem de dados/ sai escapado
{
  const g = abrir();
  nivel(g, 6, false);
  g.ev("PALAVRAS_DA_QUINTA.length = 0; PALAVRAS_DA_QUINTA.push({ id: 'html_t', palavra: '<i>w</i>&\"', explicacao: { pt: '<b>x</b>&', en: '<b>x</b>&', es: '<b>x</b>&' } }); renderPalavras()");
  const h = g.el('palavras-container').innerHTML;
  ok(h.indexOf('<h3>&lt;i&gt;w&lt;/i&gt;&amp;&quot;</h3>') !== -1, 'a palavra «<i>w</i>&"» devia sair escapada: ' + h.slice(0, 400));
  ok(h.indexOf('<p>&lt;b&gt;x&lt;/b&gt;&amp;</p>') !== -1, 'a explicação «<b>x</b>&» devia sair escapada (&lt;b&gt;x&lt;/b&gt;&amp;): ' + h.slice(0, 400));
  ok(h.indexOf('<b>') === -1 && h.indexOf('<i>') === -1, 'nenhum <b> nem <i> devia sair como HTML');
  // Uma palavra com aspas e uma explicação que tenta fechar o cartão.
  g.ev("PALAVRAS_DA_QUINTA.length = 0; PALAVRAS_DA_QUINTA.push({ id: 'html_t2', palavra: 'a', explicacao: { pt: '</p></div><script>x</script>', en: 'x', es: 'x' } }); renderPalavras()");
  const h2 = g.el('palavras-container').innerHTML;
  ok(h2.indexOf('<script>') === -1 && (h2.match(/class="encyclopedia-card"/g) || []).length === 1, 'uma explicação que tenta fechar o cartão não devia conseguir (nem entrar um <script>)');
  // O código usa mesmo o escaparHtml nos dois sítios.
  const src = ler('js/palavras.js');
  ok(/escaparHtml\(p\.palavra\)/.test(src) && /escaparHtml\(palavrasInicialMaiuscula\(palavrasExplicacaoNaLingua\(p\)\)\)/.test(src), 'js/palavras.js devia passar a palavra e a explicação por escaparHtml()');
}

// (d) só lê: o ecrã, o cartão e as contas não gravam, não mudam o state e não falam com a nuvem. (O Perfil, ao desenhar, já regista as
// conquistas ganhas desde sempre — conquistasRegistarGanhas() — e isso é do Perfil, não das palavras; por isso aqui mede-se só o das palavras.)
{
  const g = abrir();
  nivel(g, 6, false);
  const guardadoAntes = JSON.stringify(g.guardado);
  const estadoAntes = g.ev('JSON.stringify(state)');
  g.ev('renderPalavras(); palavrasCartaoPerfil(); palavrasOrdenadas(); palavrasResumo(); palavrasTotal(); palavrasInicialMaiuscula("x");');
  LINGUAS.forEach(function (l) { g.ev("currentLang = '" + l + "'; renderPalavras();"); });
  ok(g.ev('__saves') === 0, 'desenhar o ecrã das palavras e o cartão não devia chamar saveState()');
  ok(JSON.stringify(g.guardado) === guardadoAntes, 'desenhar o ecrã das palavras e o cartão não devia escrever no localStorage');
  ok(g.ev('JSON.stringify(state)') === estadoAntes, 'desenhar o ecrã das palavras e o cartão não devia mudar o state');
  ok(g.ev("typeof nuvemGuardarEstado") === 'undefined' && g.ev("typeof nuvemGravarJa") === 'undefined', 'a nuvem nem está carregada neste teste (nada a chamar)');
  ok(g.ev('JSON.stringify(PALAVRAS_DA_QUINTA.map(function (p) { return p.id; }))') === JSON.stringify(['aguardente_vinica', 'alambique', 'bacelo', 'bagaceira', 'bagaco', 'casta', 'curtimenta', 'dop', 'estuario', 'fortificar', 'jeropiga', 'lagar', 'mildio', 'montado', 'mosto', 'oidio', 'pousio', 'redura', 'torna_viagem', 'vinho_generoso']), 'desenhar não devia mexer na lista de palavras');
}

// (e) os sítios do costume
{
  const html = ler('index.html');
  const main = ler('js/main.js');
  ok(html.indexOf('id="screen-palavras"') !== -1 && /<div id="screen-palavras" class="screen content">\s*<div id="palavras-container"><\/div>\s*<\/div>/.test(html), 'a div #screen-palavras com o #palavras-container no index.html');
  ok(html.indexOf('body.jogo-cheio #screen-palavras.content') !== -1, '#screen-palavras na lista body.jogo-cheio do index.html');
  ok(/NAV_ATIVO_POR_ECRA = \{[^}]*\bpalavras: 'explorar'/.test(main), "palavras: 'explorar' em NAV_ATIVO_POR_ECRA (js/main.js)");
  const bloco = /FUNDO_DOS_ECRAS = \{[\s\S]*?\n\};/.exec(main);
  const fundo = bloco && /\bpalavras: \{ src: '([^']+)' \}/.exec(bloco[0]);
  ok(fundo && fundo[1] === 'assets/ecras/enciclopedia_yoshi_cat_2.jpg' && fs.existsSync(path.join(RAIZ, fundo[1])), 'palavras em FUNDO_DOS_ECRAS com assets/ecras/enciclopedia_yoshi_cat_2.jpg (que existe)');
  ok(/if \(screen === 'palavras'\) renderPalavras\(\);/.test(main), 'goTo (js/main.js) devia chamar renderPalavras()');
  ok(/NIVEL_NECESSARIO_POR_ECRA = \{[^}]*\bpalavras: 4\b/.test(ler('js/niveis.js')), 'palavras: 4 em NIVEL_NECESSARIO_POR_ECRA (js/niveis.js)');
  const perfilJs = ler('js/perfil.js');
  ok(/cadernoCartaoPerfil\(\) \+\n\s*palavrasCartaoPerfil\(\) \+\n\s*colecaoCartaoPerfil\(\)/.test(perfilJs), 'renderPerfil devia pôr o cartão das Palavras entre o Caderno e a Coleção');
  ok(/ecraDesbloqueado\('palavras'\)/.test(perfilJs), "o cartão devia só aparecer com ecraDesbloqueado('palavras')");
  // Só lê.
  const corpoPalavras = ler('js/palavras.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  ok(!/\b(state|saveState|localStorage|sessionStorage|fetch|XMLHttpRequest|Math\.random|Date\.now|tg\.|nuvem[A-Za-z]*)\b/.test(corpoPalavras), 'js/palavras.js não devia tocar em estado, armazenamento, nuvem nem rede');
  const cartao = /function palavrasCartaoPerfil\(\) \{[\s\S]*?\n\}\n/.exec(perfilJs);
  ok(cartao && !/\b(state|saveState|localStorage|sessionStorage|nuvem[A-Za-z]*)\b/.test(cartao[0].replace(/^\s*\/\/.*$/gm, '')), 'palavrasCartaoPerfil() não devia tocar em estado, armazenamento nem nuvem');
  ['nuvem.js', 'state.js'].forEach(function (f) { ok(!/palavras/i.test(ler('js/' + f).replace(/\/\/.*$/gm, '')), 'js/' + f + ' não devia falar das palavras (nada se guarda nem se junta na nuvem)'); });
  // (f) bots e IA
  ['palavras.title', 'palavras.subtitulo', 'perfil.palavras'].forEach(function (k) {
    const g = abrir();
    LINGUAS.forEach(function (l) {
      const t = g.ev("TRANSLATIONS." + l + "['" + k + "']");
      ok(typeof t === 'string' && t.trim() !== '' && !/\bbots?\b|\b(IA|AI)\b|inteligência artificial|artificial intelligence/i.test(t), 'o texto «' + k + '» (' + l + ') não devia estar vazio nem falar de bots ou de IA');
    });
  });
}

if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); }
console.log('OK');
