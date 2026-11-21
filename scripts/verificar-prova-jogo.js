#!/usr/bin/env node
// PROVA ÀS CEGAS, PR 2 (vê-se e joga-se, no ecrã da Coleção): js/prova-jogo.js (o botão, a prova a decorrer no painel de
// ações e os toques), o encaixe em renderColecaoDesenhar() (js/garrafa.js), os textos (js/i18n.js), o CSS (index.html) e
// as 4 descrições afinadas (dados/provas.js). Corre os ficheiros REAIS em vm, com um DOM, um dia e uma gravação falsos.
//
// Prova:
//  (a) o botão só no nível 6+ (nem no 5, nem a um jogador antigo abaixo do 6), por cima de «Arrumar a Coleção»; já
//      provou hoje: apagado, «Já provaste hoje»; a grelha reserva o lugar do botão só quando ele lá está;
//  (b) começar grava ultimoDia LOGO, com um só saveState; a ronda mostra a cara e o nome do Dr. Henrique, «Ronda 1 de
//      3», a descrição da ronda e as 4 cores (2x2) com o nome e a miniatura da garrafa da Coleção; «Arrumar» some;
//  (c) a resposta não muda (2.º toque não conta), mostra se acertou, a cor certa e a linha que ensina; acertar toca o
//      som do objetivo, errar não toca nada; durante as rondas não grava;
//  (d) no fim paga UMA vez e grava UMA vez: 3 certas +18 Gotas e +3 Reputação, 2 certas +12 Gotas (sem Reputação),
//      0 certas sem prémio; «Acertaste X de 3», a fala certa do Dr. Henrique, a barra de cima atualizada; tocar outra
//      vez não paga nem grava;
//  (e) a Reputação do prémio faz subir de nível como no resto do jogo (verificarSubidaNivel ao entrar na Quinta);
//  (f) sair do ecrã e voltar no mesmo dia retoma a mesma prova (na mesma ronda); acabada, volta o botão apagado; de
//      outro dia, esquece-se;
//  (g) modo de teste (?prova=1 e ?visita=): deixa jogar (mesmo depois da prova do dia), mas NUNCA grava nem paga;
//      abaixo do nível 6 nem aí aparece;
//  (h) textos nas 3 línguas, os de PT tal como combinados, sem «dias» nem «Fygmo2»; a prova desenha-se em EN e ES;
//  (i) layout: a conta da grelha com o botão (44 + 8 a mais), o painel da prova até metade do ecrã, as cores com 44 px,
//      e uma estimativa de 320 a 430 px de largura e 640 px de altura: nada corta, nada sai da caixa, tudo cabe;
//  (j) sem Math.random; o index.html carrega js/prova-jogo.js?v=1 depois de js/prova.js, js/garrafa.js e js/reserva.js;
//  (k) dados/provas.js: «laranja cristalizada» só no Âmbar e «figo» só no Cobre (nas 3 línguas), o resto das regras
//      continua a passar sem avisos.
//
// Depois de passar, aplica "mutações" e confirma que o teste as apanha.
// Uso: node scripts/verificar-prova-jogo.js     Sai com 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const LER = function (f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); };
const ORDEM = [['state.js', 'js/state.js'], ['i18n.js', 'js/i18n.js'], ['niveis.js', 'js/niveis.js'], ['personagens.js', 'js/personagens.js'],
  ['garrafa.js', 'js/garrafa.js'], ['reserva.js', 'js/reserva.js'], ['prova.js', 'js/prova.js'], ['dados.js', 'js/dados.js'],
  ['provas.js', 'dados/provas.js'], ['prova-jogo.js', 'js/prova-jogo.js']];
const FONTES = { 'index.html': LER('index.html') };
ORDEM.forEach(function (f) { FONTES[f[0]] = LER(f[1]); });
const J = JSON.stringify;
const DIA = '2026-10-10';
const REP = { 1: 0, 5: 300, 6: 600, 7: 1000 };
const DATE_NOW = Date.now;

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }

  function abrir(o) {
    o = o || {};
    const avisos = [];
    const els = {};
    const el = function (id) { if (!els[id]) els[id] = { id: id, innerHTML: '', style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, setAttribute() {}, removeAttribute() {}, querySelector() { return null; }, querySelectorAll() { return []; }, appendChild() {} }; return els[id]; };
    const sb = {
      console: { log() {}, warn: function (m) { avisos.push(String(m)); }, error() {} },
      localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
      location: { search: o.search || '' }, URLSearchParams: URLSearchParams, Intl: Intl,
      document: { addEventListener() {}, querySelectorAll: function () { return []; }, querySelector: function () { return null; }, getElementById: el, createElement: function () { return el('x' + Math.random()); }, body: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } }, documentElement: { style: { setProperty() {} } }, visibilityState: 'visible' },
      addEventListener() {}, innerHeight: 640, innerWidth: 360, setInterval: function () { return 1; }, clearInterval() {}, requestAnimationFrame: function () { return 1; },
      setTimeout: function () { return 1; }, clearTimeout() {}, Image: function () {}, Date: Date, navigator: {}
    };
    sb.window = sb; sb.Telegram = { WebApp: {} };
    const cx = vm.createContext(sb);
    require('./_regras-tempo').injetarRegrasTempo(cx);
    ORDEM.forEach(function (f) {
      vm.runInContext(fontes[f[0]], cx, { filename: f[1] });
      if (f[0] === 'state.js') {
        // O jogo: a gravação, a barra, os sons e o balão (contados); o dia de hoje e o modo de teste de js/visitas.js.
        vm.runInContext('var __grav = 0, __barra = 0, __sons = [], __vib = 0, __hoje = "' + DIA + '"; function saveState() { __grav++; } function updateStatsDisplays() { __barra++; }' +
          ' function tocarSom(n) { __sons.push(n); } function vibrar() { __vib++; } function atualizarDialogo() {} function definirFundo() {} function mostrarHistoriaSubidaNivel() {} function mostrarFalas() {}' +
          ' function diaLisboaDeHoje() { return __hoje; } function voltarEcraAnterior() {}' +
          ' var VISITAS_PARAMETROS_TESTE = ["visita", "dias", "festa"]; function visitaEmModoTeste() { var p = new URLSearchParams(location.search); return VISITAS_PARAMETROS_TESTE.some(function (k) { return p.has(k); }); }', cx);
      }
    });
    const g = { cx: cx, avisos: avisos, el: el };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
    g.nivel = function (n, extra) { g.ev('state = defaultState(); state.reputacao = ' + REP[n] + '; state.niveis.nivelMostrado = ' + n + '; state.gotas = 50; state.acesso.jogadorAntigo = ' + (extra && extra.antigo ? 'true' : 'false') + ';' + (extra && extra.js ? extra.js : '')); };
    g.entrar = function () { g.ev('renderColecao()'); return el('colecao-container').innerHTML; };
    g.html = function () { return el('colecao-container').innerHTML; };
    g.estado = function () { return g.ev('JSON.stringify(state)'); };
    g.rondas = function () { return g.json('provaJogo.sessao.rondas'); };
    g.responder = function (cor) { g.ev('provaResponderClique(' + cor + ')'); return g.html(); };
    g.seguinte = function () { g.ev('provaSeguinteClique()'); return g.html(); };
    // Joga as 3 rondas: acerta as primeiras `certas`, erra as outras.
    g.jogar = function (certas) {
      g.ev('provaComecarClique()');
      const r = g.ev('provaJogo') ? g.rondas() : [];
      r.forEach(function (x, i) { g.responder(i < certas ? x.cor : (x.cor % 4) + 1); g.seguinte(); });
      return g.html();
    };
    return g;
  }
  const conta = function (html, re) { return (html.match(re) || []).length; };
  const tem = function (html, s) { return html.indexOf(s) !== -1; };
  const PT = function (k) { const g = abrir(); return g.ev('t(' + J(k) + ')'); };

  // ---------------------------------------------------------------- (a) o botão
  {
    const g = abrir();
    g.nivel(5); let h = g.entrar();
    ok(!tem(h, 'prova-botao') && !tem(h, 'com-prova'), '(a) nível 5: sem o botão (e a grelha não lhe guarda lugar)');
    g.nivel(1, { antigo: true }); h = g.entrar();
    ok(!tem(h, 'prova-botao') && !tem(h, 'com-prova'), '(a) jogador antigo no nível 1 (abre a Coleção): sem o botão');
    g.nivel(6); h = g.entrar();
    ok(conta(h, /class="btn-pill prova-botao"/g) === 1 && tem(h, PT('prova.btn')) && !/prova-botao" disabled/.test(h) && /onclick="provaComecarClique\(\)"/.test(h), '(a) nível 6: o botão normal «' + PT('prova.btn') + '»');
    ok(h.indexOf('prova-botao') !== -1 && h.indexOf('prova-botao') < h.indexOf('colecao-arrumar-botao') && h.indexOf('colecao-arrumar-botao') < h.indexOf('nav.voltar'), '(a) por cima de «Arrumar a Coleção», que fica por cima do Voltar');
    ok(tem(h, 'class="colecao-painel com-prova"') && conta(h, /class="colecao-cor/g) === 4, '(a) a grelha reserva o lugar do botão e continua com as 4 cores');
    g.nivel(7); ok(tem(g.entrar(), 'prova-botao'), '(a) nível 7: também');
    g.nivel(6, { js: 'state.prova.ultimoDia = "' + DIA + '";' }); h = g.entrar();
    ok(/class="btn-pill prova-botao" disabled><span>Já provaste hoje<\/span>/.test(h) && !tem(h, 'provaComecarClique') && tem(h, 'com-prova'), '(a) já provou hoje: botão apagado com «Já provaste hoje» (e o lugar na grelha)');
  }

  // ---------------------------------------------------------------- (b) começar
  {
    const g = abrir(); g.nivel(6); g.entrar();
    const antes = JSON.parse(g.estado());
    g.ev('provaComecarClique()');
    const h = g.html();
    ok(g.ev('__grav') === 1 && g.ev('state.prova.ultimoDia') === DIA, '(b) começar grava ultimoDia logo, com um só saveState (' + g.ev('__grav') + ')');
    const depois = JSON.parse(g.estado());
    ok(J(Object.assign({}, depois, { prova: antes.prova })) === J(antes) && J(depois.prova) === J({ ultimoDia: DIA, dias: 0, acertos: 0 }), '(b) começar só muda o ultimoDia');
    g.ev('provaComecarClique()');
    ok(g.ev('__grav') === 1, '(b) tocar outra vez não começa outra prova nem grava');
    const r = g.rondas();
    ok(J(r) === J(g.json('provaRondasDoDia("' + DIA + '")')), '(b) as rondas são as do dia (provaRondasDoDia)');
    ok(tem(h, 'action-panel prova-a-decorrer') && !tem(h, 'colecao-arrumar-botao') && !tem(h, 'prova-botao') && tem(h, 'nav.voltar'), '(b) a prova ocupa o painel de ações: sem «Arrumar» nem o botão, com o Voltar');
    ok(tem(h, 'src="assets/personagens/henrique.jpg"') && tem(h, '<span class="prova-nome">Dr. Henrique</span>') && tem(h, '· Ronda 1 de 3'), '(b) a cara e o nome do Dr. Henrique (sem «o») e «Ronda 1 de 3»');
    ok(tem(h, '<p class="prova-descricao">' + g.ev('escaparHtml(' + J(r[0].descricao.texto.pt) + ')') + '</p>'), '(b) a descrição da 1.ª ronda, em PT');
    const cores = h.match(/<button type="button" class="btn-pill prova-cor" data-cor="(\d)" onclick="provaResponderClique\(\1\)"><img src="([^"]+)" alt="" decoding="async"><span>([^<]+)<\/span><\/button>/g) || [];
    const certas = [1, 2, 3, 4].map(function (c) { return '<button type="button" class="btn-pill prova-cor" data-cor="' + c + '" onclick="provaResponderClique(' + c + ')"><img src="' + g.ev('garrafaPorDias(' + c + ').imagem') + '" alt="" decoding="async"><span>' + g.ev('t(garrafaPorDias(' + c + ').nomeKey)') + '</span></button>'; });
    ok(J(cores) === J(certas) && /class="prova-cores" role="group"/.test(h), '(b) as 4 cores (Jovem, Dourado, Âmbar, Cobre) com o nome da Cave e a miniatura da garrafa da Coleção');
    ok(J(g.json('[1,2,3,4].map(function (c) { return garrafaPorDias(c).imagem; })')) === J(g.json('GARRAFAS_POR_DIAS.map(function (x) { return x.imagem; })')), '(b) as miniaturas são as imagens da Coleção');
  }

  // ---------------------------------------------------------------- (c) responder
  {
    const g = abrir(); g.nivel(6); g.entrar(); g.ev('provaComecarClique()');
    const r = g.rondas();
    const errada = (r[0].cor % 4) + 1;
    let h = g.responder(errada);
    ok(g.json('provaJogo.respostas')[0] === errada && g.ev('provaJogo.revelada') === true, '(c) a resposta fica guardada');
    ok(tem(h, 'class="prova-veredicto errado">Não era esta. A cor certa era ' + g.ev('t(garrafaPorDias(' + r[0].cor + ').nomeKey)') + '.</p>'), '(c) errar: «Não era esta. A cor certa era X.»');
    ok(tem(h, '<p class="prova-ensino">' + g.ev('escaparHtml(provaEnsino(' + r[0].cor + ', "pt"))') + '</p>') && g.ev('provaEnsino(' + r[0].cor + ', "pt")').length > 10, '(c) a linha que ensina a cor certa');
    ok(!tem(h, 'provaResponderClique') && /class="btn-pill pill-main prova-seguinte" onclick="provaSeguinteClique\(\)">Seguinte<\/button>/.test(h), '(c) sem os botões de cor e com «Seguinte»');
    ok(J(g.ev('__sons.length')) === '0' && g.ev('__vib') === 0, '(c) errar não toca som');
    g.responder(r[0].cor);
    ok(g.json('provaJogo.respostas')[0] === errada && g.ev('__sons.length') === 0, '(c) a resposta não muda (2.º toque não conta)');
    g.seguinte();
    h = g.responder(r[1].cor);
    ok(tem(h, 'class="prova-veredicto certo">Certo!</p>') && J(g.json('__sons')) === J(['objetivoCumprido']), '(c) acertar: «Certo!» e o som do objetivo, uma vez');
    g.responder(r[1].cor);
    ok(g.ev('__sons.length') === 1, '(c) o toque duplo não toca outra vez');
    g.seguinte(); g.seguinte();
    ok(g.ev('provaJogo.indice') === 2 && g.ev('provaJogo.revelada') === false, '(c) «Seguinte» sem resposta não salta ronda');
    h = g.responder(r[2].cor);
    ok(/prova-seguinte" onclick="provaSeguinteClique\(\)">Ver resultado<\/button>/.test(h), '(c) na última: «Ver resultado»');
    ok(g.ev('__grav') === 1 && g.ev('state.gotas') === 50, '(c) durante as rondas não grava nem paga');
    ok(g.ev('provaResponderClique(9); provaJogo.respostas.length') === 3, '(c) uma cor que não existe não conta');
  }

  // ---------------------------------------------------------------- (d) o fim e o prémio
  {
    [[3, 18, 3, 'prova.fala3'], [2, 12, 0, 'prova.fala1'], [1, 6, 0, 'prova.fala1'], [0, 0, 0, 'prova.fala0']].forEach(function (c) {
      const g = abrir(); g.nivel(6); g.entrar();
      const rep = g.ev('state.reputacao');
      const h = g.jogar(c[0]);
      ok(g.ev('state.gotas') === 50 + c[1] && g.ev('state.reputacao') === rep + c[2], '(d) ' + c[0] + ' certas: +' + c[1] + ' Gotas e +' + c[2] + ' de Reputação');
      ok(g.ev('__grav') === 2 && g.ev('__barra') >= 1, '(d) ' + c[0] + ' certas: grava uma vez no começo e uma no fim (' + g.ev('__grav') + ') e atualiza a barra');
      ok(J(g.json('state.prova')) === J({ ultimoDia: DIA, dias: 1, acertos: c[0] }), '(d) ' + c[0] + ' certas: dias 1, acertos ' + c[0]);
      ok(tem(h, '<p class="prova-veredicto">Acertaste ' + c[0] + ' de 3</p>'), '(d) «Acertaste ' + c[0] + ' de 3»');
      const premio = c[1] > 0 ? '<p class="prova-premio">+' + c[1] + ' Gotas' + (c[2] > 0 ? ' · +3 Reputação' : '') + '</p>' : '';
      ok(premio ? tem(h, premio) : !tem(h, 'prova-premio'), '(d) ' + c[0] + ' certas: o prémio mostra só o que é maior que 0 ' + (premio || '(nada)'));
      ok(tem(h, '<p class="prova-fala">«' + PT(c[3]) + '»</p>') && tem(h, 'Dr. Henrique') && !tem(h, 'prova-nota'), '(d) ' + c[0] + ' certas: a fala ' + c[3]);
      const e = g.estado();
      g.ev('provaSeguinteClique(); provaResponderClique(1); provaComecarClique();');
      ok(g.estado() === e && g.ev('__grav') === 2 && g.html() === h, '(d) ' + c[0] + ' certas: tocar outra vez não paga, não grava nem muda o resultado');
    });
  }

  // ---------------------------------------------------------------- (e) subir de nível
  {
    const g = abrir(); g.nivel(6, { js: 'state.reputacao = 998;' }); g.entrar();
    g.jogar(3);
    ok(g.ev('state.reputacao') === 1001 && g.ev('nivelPelaReputacao(state.reputacao)') === 7, '(e) 998 + 3 de Reputação = nível 7');
    ok(g.ev('verificarSubidaNivel()') === true && g.ev('state.niveis.nivelMostrado') === 7 && g.json('__sons').indexOf('subiuNivel') !== -1, '(e) a subida aparece como no resto do jogo (verificarSubidaNivel, ao entrar na Quinta)');
  }

  // ---------------------------------------------------------------- (f) retomar
  {
    const g = abrir(); g.nivel(6); g.entrar(); g.ev('provaComecarClique()');
    const r = g.rondas();
    g.responder(r[0].cor); g.seguinte();
    let h = g.entrar();
    ok(g.ev('provaJogo.indice') === 1 && J(g.rondas()) === J(r) && tem(h, '· Ronda 2 de 3') && tem(h, 'provaResponderClique') && g.ev('__grav') === 1, '(f) sair e voltar no mesmo dia: a mesma prova, na mesma ronda, sem gravar');
    g.responder(r[1].cor); g.entrar();
    ok(g.ev('provaJogo.revelada') === true && tem(g.html(), 'prova-seguinte'), '(f) com a resposta já dada: continua revelada (não se pode mudar)');
    g.seguinte(); g.responder(r[2].cor); g.seguinte();
    ok(g.ev('state.prova.acertos') === 3, '(f) e acaba bem');
    h = g.entrar();
    ok(g.ev('provaJogo') === null && /prova-botao" disabled><span>Já provaste hoje/.test(h) && tem(h, 'colecao-arrumar-botao'), '(f) acabada: ao voltar, o botão apagado e o «Arrumar» de volta');
    const d = abrir(); d.nivel(6); d.entrar(); d.ev('provaComecarClique()');
    d.ev('__hoje = "2026-10-11";'); h = d.entrar();
    ok(d.ev('provaJogo') === null && tem(h, 'onclick="provaComecarClique()"'), '(f) uma prova a meio de outro dia esquece-se; no dia novo pode jogar');
  }

  // ---------------------------------------------------------------- (g) modo de teste
  {
    ['?prova=1', '?visita=henrique_2'].forEach(function (q) {
      const g = abrir({ search: q }); g.nivel(6, { js: 'state.prova.ultimoDia = "' + DIA + '";' });
      const e = g.estado();
      let h = g.entrar();
      ok(tem(h, 'onclick="provaComecarClique()"') && !/prova-botao" disabled/.test(h), '(g) ' + q + ': deixa jogar mesmo depois da prova do dia');
      h = g.jogar(3);
      ok(g.estado() === e && g.ev('__grav') === 0, '(g) ' + q + ': nunca grava nem muda o estado');
      ok(tem(h, 'Acertaste 3 de 3') && !tem(h, 'prova-premio') && tem(h, '<p class="prova-nota">' + PT('prova.teste') + '</p>'), '(g) ' + q + ': mostra o resultado, sem prémio, com a nota do modo de teste');
      g.entrar(); g.jogar(1);
      ok(g.estado() === e && g.ev('__grav') === 0 && tem(g.html(), 'Acertaste 1 de 3'), '(g) ' + q + ': pode jogar outra vez, sem gravar');
      const b = abrir({ search: q }); b.nivel(5);
      ok(!tem(b.entrar(), 'prova-botao'), '(g) ' + q + ': no nível 5 o botão não aparece');
    });
    const n = abrir({ search: '?prova=0' }); n.nivel(6); n.entrar(); n.ev('provaComecarClique()');
    ok(n.ev('__grav') === 1, '(g) ?prova=0 não é modo de teste');
  }

  // ---------------------------------------------------------------- (h) textos
  {
    const g = abrir();
    const CHAVES = ['prova.btn', 'prova.jaHoje', 'prova.ronda', 'prova.pergunta', 'prova.certo', 'prova.errado', 'prova.corCerta', 'prova.seguinte', 'prova.verResultado', 'prova.resultado', 'prova.premioGotas', 'prova.premioRep', 'prova.teste', 'prova.fala0', 'prova.fala1', 'prova.fala3'];
    const PROIBIDO = /\b(dias?|days?|d[ií]as?)\b|fygmo ?2/i;
    ['pt', 'en', 'es'].forEach(function (l) {
      CHAVES.forEach(function (k) {
        const x = g.ev('TRANSLATIONS.' + l + '[' + J(k) + ']');
        ok(typeof x === 'string' && x.trim().length > 0 && x !== k, '(h) ' + l + ': falta ' + k);
        ok(typeof x !== 'string' || !PROIBIDO.test(x), '(h) ' + l + ' ' + k + ': tem «dias» ou «Fygmo2»: ' + x);
        ok(typeof x !== 'string' || x.length <= 90, '(h) ' + l + ' ' + k + ': texto comprido de mais');
      });
      ['prova.ronda', 'prova.resultado', 'prova.premioGotas', 'prova.premioRep'].forEach(function (k) { ok(String(g.ev('TRANSLATIONS.' + l + '[' + J(k) + ']')).indexOf('{n}') !== -1, '(h) ' + l + ' ' + k + ' com {n}'); });
      ok(String(g.ev('TRANSLATIONS.' + l + '["prova.corCerta"]')).indexOf('{cor}') !== -1, '(h) ' + l + ' prova.corCerta com {cor}');
    });
    const COMBINADO = { 'prova.btn': 'Prova às cegas com o Dr. Henrique', 'prova.jaHoje': 'Já provaste hoje', 'prova.ronda': 'Ronda {n} de 3', 'prova.certo': 'Certo!', 'prova.errado': 'Não era esta.', 'prova.corCerta': 'A cor certa era {cor}.', 'prova.seguinte': 'Seguinte', 'prova.verResultado': 'Ver resultado', 'prova.resultado': 'Acertaste {n} de 3' };
    Object.keys(COMBINADO).forEach(function (k) { ok(g.ev('TRANSLATIONS.pt[' + J(k) + ']') === COMBINADO[k], '(h) PT ' + k + ' = «' + COMBINADO[k] + '»'); });
    ok(new Set(['prova.fala0', 'prova.fala1', 'prova.fala3'].map(function (k) { return g.ev('TRANSLATIONS.pt[' + J(k) + ']'); })).size === 3, '(h) 3 falas diferentes');
    [['en', 'Round 1 of 3', 'en'], ['es', 'Ronda 1 de 3', 'es']].forEach(function (c) {
      const x = abrir(); x.nivel(6); x.ev('currentLang = "' + c[0] + '"; state.lang = "' + c[0] + '";'); x.entrar(); x.ev('provaComecarClique()');
      const h = x.html(); const r = x.rondas();
      ok(tem(h, c[1]) && tem(h, x.ev('escaparHtml(' + J(r[0].descricao.texto[c[2]]) + ')')) && tem(h, '>' + x.ev('t("adega.garrafaCobre")') + '</span>') && !tem(h, 'prova.'), '(h) ' + c[0] + ': a ronda, a descrição e as cores na língua do jogador');
      x.responder(r[0].cor);
      ok(tem(x.html(), x.ev('escaparHtml(provaEnsino(' + r[0].cor + ', "' + c[0] + '"))')), '(h) ' + c[0] + ': a linha que ensina na língua do jogador');
    });
  }

  // ---------------------------------------------------------------- (i) layout
  {
    const I = fontes['index.html'];
    const css = function (sel) { const i = I.indexOf(sel + ' {'); return i === -1 ? '' : I.slice(i, I.indexOf('}', i)); };
    ok(/bottom: calc\(var\(--nav-altura\) \+ 8px \+ 44px \+ 8px \+ 52px \+ 8px\);/.test(css('    .colecao-painel')), '(i) sem o botão, a grelha deixa o lugar do Voltar e do «Arrumar» (como antes)');
    ok(/bottom: calc\(var\(--nav-altura\) \+ 8px \+ 44px \+ 8px \+ 44px \+ 8px \+ 52px \+ 8px\);/.test(css('    .colecao-painel.com-prova')), '(i) com o botão: mais 44 px + 8 px (Voltar 52 + «Arrumar» 44 + «Prova» 44 e os espaços de 8)');
    const mh = (css('    #colecao-container .action-panel.prova-a-decorrer').match(/max-height: (\d+)vh/) || [])[1];
    ok(Number(mh) > 0 && Number(mh) <= 50, '(i) a prova a decorrer: o painel no máximo a metade do ecrã (' + mh + 'vh)');
    ok(/\.action-panel \{[^}]*overflow-y: auto/.test(I), '(i) se faltar altura, o painel desliza (nada se corta)');
    const cor = css('    .prova-cores .prova-cor');
    ok(/min-height: 44px/.test(cor) && /min-width: 0/.test(cor) && !/white-space: nowrap/.test(cor) && /grid-template-columns: 1fr 1fr/.test(css('    .prova-cores')) && /@media \(max-width: 599px\) \{\s*\.btn-pill \{[^}]*white-space: normal/.test(I), '(i) as cores em 2x2, com 44 px de toque e texto que parte linha (a regra dos .btn-pill no telemóvel)');
    ok(/overflow-wrap: anywhere/.test(css('    .prova-bloco')) && /overflow-wrap: anywhere/.test(css('    .prova-cor span')), '(i) as palavras compridas partem (nada sai da caixa)');
    ok(/\.prova-bloco \.prova-seguinte \{[^}]*width: 100%;[^}]*white-space: normal/.test(I) && /\.prova-botao:disabled \{[^}]*opacity/.test(I), '(i) «Seguinte» a toda a largura, a partir linha; o botão apagado');
    // Estimativa (letra Nunito: ~0,56 da altura em largura média; a negrito ~0,6). Painel: até 50% de 640 px = 320 px.
    const g = abrir();
    const linhas = function (texto, largura, px, fator) { const porLinha = Math.max(1, Math.floor(largura / (px * fator))); let n = 1, atual = 0; String(texto).split(' ').forEach(function (p) { const w = p.length + (atual ? 1 : 0); if (atual + w > porLinha) { n++; atual = p.length; } else atual += w; }); return n; };
    const D = g.json('PROVA_DESCRICOES'), E = g.json('PROVA_ENSINO');
    let pior = 0, piorQual = '';
    [320, 360, 390, 430].forEach(function (w) {
      const coluna = Math.min(w, 480, w - 20);
      const dentro = coluna - 18;              // o bloco: 8 + 8 de margem e 1 + 1 de borda
      const botao = (dentro - 6) / 2;          // 2 colunas com 6 px entre elas
      ['pt', 'en', 'es'].forEach(function (l) {
        const tx = function (k) { return g.ev('TRANSLATIONS.' + l + '[' + J(k) + ']'); };
        // o botão de entrada e o apagado, numa linha (44 px), como a conta da grelha
        [tx('prova.btn'), tx('prova.jaHoje')].forEach(function (b) { ok(linhas(b, coluna - (/\.action-panel \.prova-botao \{ padding-left: 10px; padding-right: 10px; \}/.test(I) ? 20 : 32) - 2, 13.5, 0.6) === 1, '(i) ' + w + ' px ' + l + ': «' + b + '» cabe numa linha (44 px)'); });
        // cada cor numa linha, ao lado da miniatura (34 px + 6 + as margens de 16 + 16 do .btn-pill no telemóvel + borda 2)
        ['adega.garrafaJovem', 'adega.garrafaDourado', 'adega.garrafaAmbar', 'adega.garrafaCobre'].forEach(function (k) { ok(linhas(tx(k), botao - 74, 13.5, 0.6) === 1, '(i) ' + w + ' px ' + l + ': a cor «' + tx(k) + '» cabe ao lado da miniatura'); });
        const cabeca = 32;
        D.forEach(function (d) {
          const desc = linhas(d.texto[l], dentro, 13, 0.56) * 17;
          const ronda = 18 + cabeca + 6 + desc + 6 + (44 + 6 + 44);
          const ens = E[d.cor].texto[l];
          const veredicto = linhas(tx('prova.errado') + ' ' + tx('prova.corCerta').replace('{cor}', 'Dourado'), dentro, 14, 0.6) * 18;
          const revelada = 18 + cabeca + 6 + desc + 6 + veredicto + 6 + linhas(ens, dentro, 13, 0.56) * 17 + 6 + linhas(tx('prova.verResultado'), dentro - 32, 13.5, 0.6) * 17 + 27;
          [['a ronda', ronda], ['a resposta', revelada]].forEach(function (v) {
            const total = v[1] + 8 + 52;           // + o espaço e o Voltar (52 px)
            if (total > pior) { pior = total; piorQual = w + ' px ' + l + ' ' + d.id + ' (' + v[0] + ')'; }
          });
        });
        const fim = 18 + cabeca + 6 + 18 + 6 + 17 + 6 + Math.max.apply(null, ['prova.fala0', 'prova.fala1', 'prova.fala3', 'prova.teste'].map(function (k) { return linhas(tx(k), dentro, 13, 0.56); })) * 17 * 2 + 8 + 52;
        if (fim > pior) { pior = fim; piorQual = w + ' px ' + l + ' (o resultado)'; }
      });
    });
    if (process.env.SO_SUITE) console.log('estimativa: ' + pior + ' px, ' + piorQual);
    ok(pior <= 320, '(i) estimativa: a prova cabe em metade de um ecrã de 640 px (a mais alta: ' + pior + ' px, ' + piorQual + ')');
  }

  // ---------------------------------------------------------------- (j) sem acaso e o index
  {
    const src = fontes['prova-jogo.js'].replace(/\/\/.*$/gm, '');
    ok(!/Math\.random/.test(src), '(j) js/prova-jogo.js sem Math.random');
    const g = abrir(); g.nivel(6); g.entrar();
    g.ev('Math.random = function () { throw new Error("Math.random"); };');
    let rebentou = false;
    try { g.jogar(2); } catch (e) { rebentou = true; } finally { Date.now = DATE_NOW; }
    ok(!rebentou && g.ev('state.prova.dias') === 1, '(j) joga-se com Math.random a rebentar');
    const I = fontes['index.html'];
    const pos = function (f) { return I.indexOf('<script src="' + f + '?v='); };
    ok(/<script src="js\/prova-jogo\.js\?v=1"><\/script>/.test(I) && pos('js/prova-jogo.js') > pos('js/prova.js') && pos('js/prova-jogo.js') > pos('js/garrafa.js') && pos('js/prova-jogo.js') > pos('js/reserva.js') && pos('js/prova-jogo.js') < pos('js/main.js') && pos('js/prova.js') > 0, '(j) js/prova-jogo.js?v=1 depois de js/prova.js, js/garrafa.js e js/reserva.js, antes de js/main.js');
    ok(/js\/garrafa\.js\?v=71"/.test(I) && /js\/i18n\.js\?v=116"/.test(I) && /dados\/provas\.js\?v=2"/.test(I) && /js\/prova\.js\?v=1"/.test(I), '(j) sobem garrafa.js (71), i18n.js (116) e dados/provas.js (2); js/prova.js não muda (1)');
    // Só garrafa.js encaixa a prova no ecrã (e só pelas funções do ecrã: nunca começa nem paga por si).
    const G = fontes['garrafa.js'].replace(/\/\/.*$/gm, '');
    ok(!/provaComecar\(|provaTerminar\(|provaVerificar\(/.test(G) && /provaColecaoHtml\(\)/.test(G) && /provaAoEntrarNaColecao\(\)/.test(G), '(j) js/garrafa.js só desenha a prova (nunca começa nem paga)');
  }

  // ---------------------------------------------------------------- (k) os dados
  {
    const g = abrir();
    ok(g.avisos.length === 0, '(k) os dados carregam sem avisos: ' + g.avisos.join(' | '));
    const D = g.json('PROVA_DESCRICOES'), E = g.json('PROVA_ENSINO');
    ok(D.length === 20 && [1, 2, 3, 4].every(function (c) { return D.filter(function (d) { return d.cor === c; }).length === 5 && E[c]; }), '(k) 5 descrições por cor e as 4 linhas que ensinam');
    const SO = [[3, { pt: /laranja cristalizada/i, en: /candied orange/i, es: /naranja confitada/i }], [4, { pt: /\bfigo/i, en: /\bfig\b/i, es: /\bhigo/i }], [4, { pt: /\bnoz|nozes/i, en: /walnut/i, es: /\bnue[zc]/i }], [3, { pt: /frutos secos/i, en: /dried fruit/i, es: /frutos secos/i }]];
    SO.forEach(function (s) {
      ['pt', 'en', 'es'].forEach(function (l) {
        const fora = D.filter(function (d) { return d.cor !== s[0] && s[1][l].test(d.texto[l]); }).map(function (d) { return d.id; });
        ok(fora.length === 0, '(k) ' + l + ': ' + s[1][l] + ' só na cor ' + s[0] + ' (está em ' + fora.join(', ') + ')');
      });
    });
  }
  return falhas;
}

function mutar(f, de, para) {
  const pares = Array.isArray(de) ? de : [[de, para]];
  const c = Object.assign({}, FONTES);
  for (const p of pares) {
    if (c[f].indexOf(p[0]) === -1) { console.log('FALHA: mutação impossível (texto não encontrado em ' + f + '): ' + p[0].slice(0, 70)); return null; }
    c[f] = c[f].split(p[0]).join(p[1]);
  }
  return c;
}
const falhas = suite(FONTES);
let impossiveis = 0;
const MUTACOES = [
  ['o botão aparece no nível 5', 'prova-jogo.js', "  if (p.motivo === 'ja_hoje') return 'ja_hoje';\n  return 'escondido';", "  if (p.motivo === 'ja_hoje') return 'ja_hoje';\n  return 'pode';"],
  ['já provou hoje e o botão não se apaga', 'prova-jogo.js', "  if (p.motivo === 'ja_hoje') return 'ja_hoje';", "  if (p.motivo === 'ja_hoje') return 'pode';"],
  ['não grava ao começar', 'prova-jogo.js', '      if (r.ok) {\n        saveState(state);\n        provaJogo = {', '      if (r.ok) {\n        provaJogo = {'],
  ['a resposta muda', 'prova-jogo.js', '|| j.resultado || j.revelada || PROVA_CORES', '|| j.resultado || PROVA_CORES'],
  ['«Seguinte» sem resposta', 'prova-jogo.js', '|| j.resultado || !j.revelada) return;', '|| j.resultado) return;'],
  ['tocar depois do fim volta a acabar', 'prova-jogo.js', 'if (provaOcupado || !j || j.resultado || !j.revelada) return;', 'if (provaOcupado || !j || !j.revelada) return;'],
  ['grava duas vezes no fim', 'prova-jogo.js', '    saveState(state);\n    if (typeof updateStatsDisplays', '    saveState(state); saveState(state);\n    if (typeof updateStatsDisplays'],
  ['não atualiza a barra', 'prova-jogo.js', "    if (typeof updateStatsDisplays === 'function') updateStatsDisplays();\n", ''],
  ['mostra «+0 Reputação»', 'prova-jogo.js', 'if (r.pago && r.premio.reputacao > 0)', 'if (r.pago)'],
  ['mostra «+0 Gotas»', 'prova-jogo.js', 'if (r.pago && r.premio.gotas > 0)', 'if (r.pago)'],
  ['a fala das 3 certas trocada', 'prova-jogo.js', "r.certas === PROVA_RONDAS ? 'prova.fala3'", "r.certas === PROVA_RONDAS ? 'prova.fala1'"],
  ['não retoma ao voltar', 'prova-jogo.js', 'if (provaJogo && (provaJogo.resultado || provaJogo.sessao.dia !== provaDiaDeHoje())) provaJogo = null;', 'provaJogo = null;'],
  ['a prova acabada não se esquece', 'prova-jogo.js', 'if (provaJogo && (provaJogo.resultado || provaJogo.sessao.dia', 'if (provaJogo && (provaJogo.sessao.dia'],
  ['a prova de outro dia retoma-se', 'prova-jogo.js', ' || provaJogo.sessao.dia !== provaDiaDeHoje()))', '))'],
  ['modo de teste grava', 'prova-jogo.js', '    if (provaModoTeste()) {\n      if (provaBotaoEstado()', '    if (false) {\n      if (provaBotaoEstado()'],
  ['modo de teste paga', 'prova-jogo.js', '  if (j.teste) {\n    j.resultado', '  if (false) {\n    j.resultado'],
  ['?prova=1 ignorado', 'prova-jogo.js', ".get('prova') === '1'", ".get('provaX') === '1'"],
  ['o modo de teste geral ignorado', 'prova-jogo.js', "  return typeof visitaEmModoTeste === 'function' && visitaEmModoTeste() === true;", '  return false;'],
  ['modo de teste abaixo do nível 6', 'prova-jogo.js', "    return p.ok || p.motivo === 'ja_hoje' ? 'pode' : 'escondido';", "    return 'pode';"],
  ['som ao errar', 'prova-jogo.js', '    if (provaVerificar(j.sessao, j.indice, cor)) {', '    if (true) {'],
  ['sem som ao acertar', 'prova-jogo.js', "      if (typeof tocarSom === 'function') tocarSom('objetivoCumprido');\n", ''],
  ['o nome com o artigo', 'prova-jogo.js', ".replace(/^(o|a|el|la|the)\\s+/i, '')", ''],
  ['a cara errada', 'prova-jogo.js', 'PERSONAGENS_CARAS_POR_ID.henrique ? PERSONAGENS_CARAS_POR_ID.henrique', 'PERSONAGENS_CARAS_POR_ID.marisa ? PERSONAGENS_CARAS_POR_ID.marisa'],
  ['sem a linha que ensina', 'prova-jogo.js', "      '<p class=\"prova-ensino\">' + provaEscapar(provaEnsino(ronda.cor, lingua)) + '</p>' +\n", ''],
  ['a descrição sempre em PT', 'prova-jogo.js', 'ronda.descricao.texto[lingua] || ronda.descricao.texto.pt', 'ronda.descricao.texto.pt'],
  ['Math.random', 'prova-jogo.js', '    j.respostas[j.indice] = cor;', '    j.respostas[j.indice] = cor; Math.random();'],
  ['o botão não aparece no ecrã', 'garrafa.js', '      provaHtml +\n', ''],
  ['«Arrumar» não se esconde durante a prova', 'garrafa.js', "(!provaAtiva && typeof colecaoTarefaBotaoHtml === 'function'", "(typeof colecaoTarefaBotaoHtml === 'function'"],
  ['a grelha não guarda o lugar do botão', 'garrafa.js', "(provaLugar ? ' com-prova' : '')", "''"],
  ['ao entrar não se retoma nem esquece', 'garrafa.js', "  if (typeof provaAoEntrarNaColecao === 'function') provaAoEntrarNaColecao();\n", ''],
  ['a conta da grelha sem o botão novo', 'index.html', 'bottom: calc(var(--nav-altura) + 8px + 44px + 8px + 44px + 8px + 52px + 8px); /* Voltar + "Arrumar a Coleção" + "Prova', 'bottom: calc(var(--nav-altura) + 8px + 44px + 8px + 52px + 8px); /* Voltar + "Arrumar a Coleção" + "Prova'],
  ['o painel passa de metade do ecrã', 'index.html', '#colecao-container .action-panel.prova-a-decorrer { max-height: 50vh; }', '#colecao-container .action-panel.prova-a-decorrer { max-height: 60vh; }'],
  ['as cores com menos de 44 px', 'index.html', '      min-width: 0;\n      min-height: 44px;\n    }\n    .prova-cor img', '      min-width: 0;\n      min-height: 36px;\n    }\n    .prova-cor img'],
  ['o botão de entrada com a margem de sempre', 'index.html', '    .action-panel .prova-botao { padding-left: 10px; padding-right: 10px; }\n', ''],
  ['as palavras compridas saem da caixa', 'index.html', '    .prova-cor span { min-width: 0; overflow-wrap: anywhere; }', '    .prova-cor span { min-width: 0; }'],
  ['sem o script no index', 'index.html', '  <script src="js/prova-jogo.js?v=1"></script>\n', ''],
  ['um texto com «dias»', 'i18n.js', "    'prova.jaHoje': 'Já provaste hoje',", "    'prova.jaHoje': 'Já provaste hoje, volta daqui a uns dias',"],
  ['um texto em falta em EN', 'i18n.js', "    'prova.seguinte': 'Next',\n", ''],
  ['o botão com outro texto', 'i18n.js', "    'prova.btn': 'Prova às cegas com o Dr. Henrique',", "    'prova.btn': 'Prova às cegas',"],
  ['o figo de volta ao Âmbar', 'provas.js', 'Tom de mel escuro, aroma de passas e de amêndoa torrada.', 'Tom de mel escuro, aroma de figo e de amêndoa torrada.'],
  ['a laranja cristalizada de volta ao Dourado', 'provas.js', 'with ripe apricot and a thread of new honey.', 'with candied orange and honey.']
];
if (!process.env.SO_SUITE) MUTACOES.forEach(function (m) {
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
