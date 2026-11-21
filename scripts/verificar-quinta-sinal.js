#!/usr/bin/env node
// O SINAL no cartão da Quinta fechado (quintaPendentes() e atualizarSinalQuinta() em js/objetivos.js; a linha
// #quinta-sinal no index.html). Corre os ficheiros REAIS em vm (state, i18n, niveis, objetivos, visitas, alambique,
// festas, estrada-dados, despensa, estrada, encomendas) com um dia de Lisboa e um DOM falsos. Nada toca em browser.
//
// Prova:
//  (a) cada pendente aparece e desaparece no momento certo: 'visita' (visita de hoje por tocar; some ao tocar),
//      'encomenda' (pedido à espera; some ao aceitar ou com «Agora não»; volta se a encomenda em curso acabar hoje),
//      'oferta' (visita tocada e há copo de bagaceira com stock ou um bem da Estrada; some ao oferecer),
//      'festa' (festa aberta, aberta para este jogador, com tarefa por fazer; some com as tarefas feitas);
//  (b) a ordem de prioridade (visita, encomenda, oferta, festa) e sem repetições;
//  (c) vazio em modo de teste; nunca lança erro com um estado estranho; só lê (não grava nem muda o estado);
//  (d) a linha: «● Visita», «● Encomenda +1» (o 1.º e quantos mais), aria-label com a lista toda; sem pendentes não
//      existe (escondida e vazia); com o cartão aberto não aparece (CSS); o ponto pulsa só na 1.ª vez em cada dia
//      (e não com "reduzir movimento"); atualiza-se com o resumo (aceitar/recusar a encomenda, mudar de dia na Quinta);
//  (e) textos nas 3 línguas; a linha cabe no cartão fechado de 320 a 430 px (60% da largura) numa só linha pequena
//      (14 px + 2 px), sem cortar nem sair da caixa.
//
// Depois de passar, aplica "mutações" (estraga cada regra de propósito) e confirma que o teste as apanha.
// Uso: node scripts/verificar-quinta-sinal.js     Sai com 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const LER = function (f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); };
const FICHEIROS = ['state.js', 'i18n.js', 'niveis.js', 'personagens.js', 'historia.js', 'capitulos.js', 'objetivos.js', 'visitas.js', 'alambique.js', 'festas.js', 'estrada-dados.js', 'despensa.js', 'estrada.js', 'encomendas.js'];
const FONTES = {};
FICHEIROS.forEach(function (f) { FONTES[f] = LER('js/' + f); });
FONTES['index.html'] = LER('index.html');
const J = JSON.stringify;
const SEM_FESTA = '2026-07-15', SAO_MARTINHO = '2026-11-11';

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }

  function abrir(o) {
    o = o || {};
    const relogio = { t: Date.parse((o.dia || SEM_FESTA) + 'T12:00:00Z') };
    const els = {};
    function el(id) {
      if (els[id]) return els[id];
      const classes = new Set(); const attrs = {};
      return (els[id] = { id: id, hidden: true, textContent: '', innerHTML: '', style: {},
        classList: { add: function (c) { classes.add(c); }, remove: function (c) { classes.delete(c); }, contains: function (c) { return classes.has(c); }, toggle: function (c, f) { if (f === undefined ? !classes.has(c) : f) classes.add(c); else classes.delete(c); } },
        setAttribute: function (k, v) { attrs[k] = String(v); }, removeAttribute: function (k) { delete attrs[k]; }, getAttribute: function (k) { return attrs[k] === undefined ? null : attrs[k]; } });
    }
    const ouvintes = {};
    const ativo = { id: o.ecra || 'screen-quinta' };
    const sb = {
      console: { log() {}, warn() {}, error() {} },
      localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
      location: { search: o.search || '' }, URLSearchParams: URLSearchParams, Intl: Intl,
      document: { addEventListener: function (n, f) { (ouvintes[n] = ouvintes[n] || []).push(f); }, querySelectorAll: function () { return []; }, querySelector: function (s) { return s === '.screen.active' ? ativo : null; }, getElementById: el, visibilityState: 'visible' },
      setTimeout: function () {}, clearTimeout: function () {}, Image: function () {},
      Date: class extends Date { static now() { return relogio.t; } }
    };
    sb.window = sb; sb.window.addEventListener = function () {};
    sb.Telegram = { WebApp: {} };
    const cx = vm.createContext(sb);
    require('./_regras-tempo').injetarRegrasTempo(cx);
    const carregar = function (f) { vm.runInContext(fontes[f], cx, { filename: 'js/' + f }); };
    ['state.js', 'i18n.js', 'niveis.js', 'personagens.js'].forEach(carregar);
    vm.runInContext(`
      var __dia = ${J(o.dia || SEM_FESTA)}, SAVES = 0;
      function diaLisboaDeHoje() { return __dia; }
      function randInt(a, b) { return a; }
      function mostrarFalas() {} function reposicionarFlutuantes() {} function vibrar() {} function tocarSom() {} function updateStatsDisplays() {}
      function tempoAtual() { return { disponivel: false }; } function jaFezTarefaTempoHoje() { return true; }
      function vigiarSinalAgora() { return null; } function vigiarJaFezHoje() { return true; }
      function estacaoAtual() { return 'outono'; } function faseRealAtual() { return 'repouso'; }
      var VINHA_BONUS_ESTACAO = {}; var RESIDUOS_POR_COMPOSTAGEM = 99;
      function vitoriasProtegerComPremioRestantesHoje() { return 0; } function entradasBloqueadas() { return []; }
      function alambiquePodeDestilar() { return false; } function diasDescansadosNaCave() { return 0; }
      var ADEGA_CUSTO_UVAS_PRENSAR = 99, ADEGA_CUSTO_GOTAS_FORTIFICAR = 99, ADEGA_CUSTO_AGUARDENTE_FORTIFICAR = 99;
      var REGRAS_DESCANSO_CAVE = { diasMinimos: 99 };
      function garrafaPorDias(d) { return { nomeKey: 'adega.garrafaJovem', dias: d }; } function caveReservaAberta() { return true; } function garrafaQueMaisDescansou() { return null; }
      function cadernoEscapar(s) { return String(s); }
      function festaAtual() { return null; } function festaTemTarefaPorFazerHoje() { return false; } // o js/festas.js real substitui-as
    `, cx);
    ['historia.js', 'capitulos.js', 'objetivos.js', 'visitas.js', 'alambique.js', 'festas.js', 'estrada-dados.js', 'despensa.js', 'estrada.js', 'encomendas.js'].forEach(carregar);
    vm.runInContext(`
      saveState = function () { SAVES++; };
      state = defaultState();
      state.reputacao = ${o.reputacao === undefined ? 1200 : o.reputacao}; state.acesso.jogadorAntigo = false; state.acesso.introMostrada = true;
      state.adega.bagaceira = ${o.bagaceira === undefined ? 0 : o.bagaceira};
      state.visitas = { feitas: {}, hoje: { dia: __dia, id: 'valentim_4', feita: ${o.tocada ? 'true' : 'false'} } };
    `, cx);
    const g = { cx: cx, els: els, relogio: relogio, ouvintes: ouvintes, ativo: ativo };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
    g.p = function () { return g.json('quintaPendentes()'); };
    g.sinal = function () { g.ev('atualizarSinalQuinta()'); return el('quinta-sinal'); };
    g.dia = function (d) { g.ev('__dia = ' + J(d)); };
    return g;
  }

  // ---------------------------------------------------------------- (a) cada pendente
  {
    // visita: aparece por tocar, some ao tocar
    const g = abrir({ reputacao: 1200 }); // nível 7 (Estrada aberta), sem bagaceira nem bens, sem festa
    ok(J(g.p()) === J(['visita']), '(a) visita de hoje por tocar: ["visita"] (deu ' + J(g.p()) + ')');
    g.ev('visitaFazerHoje()');
    ok(g.p().indexOf('visita') === -1, '(a) depois de tocar, a visita sai');
    // encomenda: com a visita tocada (nível 5+) há pedido
    ok(g.p().indexOf('encomenda') !== -1, '(a) com a visita tocada, o pedido de encomenda aparece');
    g.ev('encomendaCriar(state, encomendaDiaDeHoje(), false)');
    ok(g.p().indexOf('encomenda') === -1, '(a) depois de aceitar (prazo daqui a 2 dias), a encomenda sai');
    g.ev("state.encomendas.atual.prazoDia = __dia;");
    ok(g.p().indexOf('encomenda') !== -1, '(a) a encomenda em curso que acaba hoje volta a contar');
    const r = abrir({ tocada: true });
    r.ev('encomendaRecusar(state, encomendaDiaDeHoje(), false)');
    ok(r.p().indexOf('encomenda') === -1, '(a) depois de «Agora não», a encomenda sai');
    ok(abrir({ reputacao: 120, tocada: true }).p().indexOf('encomenda') === -1, '(a) no nível 4 não há encomenda');
    // oferta: copo de bagaceira
    const c = abrir({ tocada: true, bagaceira: 2 });
    ok(c.p().indexOf('oferta') !== -1, '(a) visita tocada e bagaceira em stock: oferta');
    ok(abrir({ tocada: false, bagaceira: 2 }).p().indexOf('oferta') === -1, '(a) com a visita por tocar não há oferta (ainda)');
    ok(abrir({ tocada: true, bagaceira: 0 }).p().indexOf('oferta') === -1, '(a) sem bagaceira e sem bens: sem oferta');
    c.ev('visitaBagaceiraOferecer(state, visitaDiaEfetivo())');
    ok(c.p().indexOf('oferta') === -1, '(a) depois de oferecer o copo, a oferta sai');
    // oferta: bem da Estrada (nível 7)
    const e = abrir({ tocada: true, bagaceira: 0 });
    e.ev("state.despensa.recebidos = { queijo_azeitao: 2 }; state.despensa.entregues = {};");
    ok(e.p().indexOf('oferta') !== -1, '(a) um bem da Estrada para oferecer: oferta');
    e.ev("state.despensa.ofertaDia = __dia;");
    ok(e.p().indexOf('oferta') === -1, '(a) já ofereceu um bem hoje: sem oferta');
    const e6 = abrir({ tocada: true, bagaceira: 0, reputacao: 700 }); // nível 6: Estrada fechada
    e6.ev("state.despensa.recebidos = { queijo_azeitao: 2 };");
    ok(e6.p().indexOf('oferta') === -1, '(a) com a Estrada ainda fechada, o bem não conta');
    // festa
    const f = abrir({ dia: SAO_MARTINHO });
    ok(f.p().indexOf('festa') !== -1, '(a) São Martinho com tarefas por fazer: festa');
    f.ev("festaTarefas(festaAtual()).forEach(function (x) { festaRegistarTarefaHoje(festaAtual().id, x.id); });");
    ok(f.p().indexOf('festa') === -1, '(a) com as tarefas da festa feitas, a festa sai');
    ok(abrir({ dia: SEM_FESTA }).p().indexOf('festa') === -1, '(a) sem festa aberta, nada');
    ok(abrir({ dia: SAO_MARTINHO, reputacao: 50 }).p().indexOf('festa') === -1, '(a) a festa ainda fechada para o jogador (nível 3) não conta');
  }

  // ---------------------------------------------------------------- (b) ordem
  {
    const g = abrir({ dia: SAO_MARTINHO });
    g.ev("state.encomendas = { atual: { personagem: 'marisa', escalao: 1, aceiteDia: '2026-11-09', prazoDia: __dia, historicoInicio: 0 }, ultimoDia: '2026-11-09', cumpridas: 0 };");
    ok(J(g.p()) === J(['visita', 'encomenda', 'festa']), '(b) visita, encomenda (acaba hoje) e festa, por esta ordem: ' + J(g.p()));
    const h = abrir({ dia: SAO_MARTINHO, tocada: true, bagaceira: 1 });
    ok(J(h.p()) === J(['encomenda', 'oferta', 'festa']), '(b) pedido, oferta e festa, por esta ordem: ' + J(h.p()));
    const k = abrir({ tocada: true, bagaceira: 1 });
    k.ev("state.despensa.recebidos = { queijo_azeitao: 2 };");
    ok(J(k.p()) === J(['encomenda', 'oferta']), '(b) copo e bem ao mesmo tempo: uma só «oferta» (sem repetições)');
  }

  // ---------------------------------------------------------------- (c) modo de teste, estado estranho, só lê
  {
    ['?visita=valentim_4', '?dias=2', '?festa=saomartinho'].forEach(function (q) {
      ok(J(abrir({ search: q, dia: SAO_MARTINHO, tocada: true, bagaceira: 1 }).p()) === '[]', '(c) ' + q + ': vazio');
    });
    const g = abrir({ dia: SAO_MARTINHO });
    const estranhos = ["state.visitas = 'x'", 'state.visitas = { hoje: 3 }', 'state.encomendas = null', 'state.adega = null', 'state.despensa = 3', 'state.festas = "x"', 'state = {}'];
    estranhos.forEach(function (s) {
      const x = abrir({ dia: SAO_MARTINHO });
      x.ev(s);
      let rebentou = false, lista = null;
      try { lista = x.p(); x.sinal(); } catch (e) { rebentou = true; }
      ok(!rebentou && Array.isArray(lista), '(c) estado estranho (' + s + '): sem erro');
    });
    const antes = g.ev('JSON.stringify(state)');
    g.p(); g.p(); g.sinal();
    ok(g.ev('JSON.stringify(state)') === antes && g.ev('SAVES') === 0, '(c) quintaPendentes() e o sinal só leem: não mudam o estado nem gravam');
  }

  // ---------------------------------------------------------------- (d) a linha
  {
    const g = abrir({ dia: SAO_MARTINHO });
    let s = g.sinal();
    ok(s.hidden === false && /<span class="quinta-sinal-ponto" aria-hidden="true"><\/span><span class="quinta-sinal-texto" aria-hidden="true">Visita \+1<\/span>/.test(s.innerHTML), '(d) «● Visita +1» (visita e festa): ' + s.innerHTML);
    ok(s.getAttribute('aria-label') === 'Por tratar no cartão da Quinta: Visita, Festa', '(d) aria-label com a lista toda: ' + s.getAttribute('aria-label'));
    ok(s.classList.contains('pulsar'), '(d) a 1.ª vez no dia, o ponto pulsa');
    g.sinal();
    ok(g.els['quinta-sinal'].classList.contains('pulsar'), '(d) um desenho logo a seguir não corta a pulsação');
    g.relogio.t += 10000; g.sinal();
    ok(!g.els['quinta-sinal'].classList.contains('pulsar'), '(d) depois, no mesmo dia, não volta a pulsar');
    const so = abrir({ reputacao: 1200 });
    s = so.sinal();
    ok(/>Visita<\/span>$/.test(s.innerHTML) && s.innerHTML.indexOf('+') === -1, '(d) só uma pendente: «● Visita», sem «+»');
    so.ev('visitaFazerHoje(); encomendaRecusar(state, encomendaDiaDeHoje(), false);');
    s = so.sinal();
    ok(s.hidden === true && s.innerHTML === '' && s.getAttribute('aria-label') === null, '(d) sem pendentes, a linha não existe (escondida e vazia)');
    // atualiza-se com o resumo e com os cliques da encomenda
    const a = abrir({ tocada: true });
    a.ev('atualizarResumoQuinta()');
    ok(a.els['quinta-sinal'].hidden === false && /Encomenda/.test(a.els['quinta-sinal'].innerHTML), '(d) atualizarResumoQuinta() desenha o sinal');
    a.ev('encomendaAgoraNaoClique()');
    ok(a.els['quinta-sinal'].hidden === true, '(d) «Agora não» atualiza logo o sinal');
    const b = abrir({ tocada: true });
    b.ev('atualizarResumoQuinta(); encomendaAceitarClique()');
    ok(b.els['quinta-sinal'].hidden === true, '(d) «Aceitar» atualiza logo o sinal');
    // mudar de dia com a app aberta (na Quinta)
    const d = abrir({ tocada: true, bagaceira: 0 });
    d.ev('visitaBagaceiraOferecer = visitaBagaceiraOferecer; encomendaRecusar(state, encomendaDiaDeHoje(), false); atualizarResumoQuinta();');
    ok(d.els['quinta-sinal'].hidden === true, '(d) premissa: sem pendentes hoje');
    d.dia(SAO_MARTINHO); d.ev('quintaSinalVerDia()');
    ok(d.els['quinta-sinal'].hidden === false && /Festa|Visita/.test(d.els['quinta-sinal'].innerHTML) && d.els['quinta-sinal'].classList.contains('pulsar'), '(d) o dia muda com a app aberta na Quinta: o sinal redesenha-se (e pulsa no dia novo)');
    const fora = abrir({ ecra: 'screen-vinha' }); fora.dia(SAO_MARTINHO); fora.ev('quintaSinalVerDia()');
    ok(fora.els['quinta-sinal'] === undefined || fora.els['quinta-sinal'].hidden === true, '(d) fora da Quinta não redesenha');
    ok((d.ouvintes.visibilitychange || []).length >= 1, '(d) ao voltar à app (visibilitychange) também verifica o dia');
    // o CSS: aberto sem linha; [hidden] sem linha; sem animação com "reduzir movimento"
    const css = fontes['index.html'].replace(/\n\s*/g, ' ');
    ok(/\.quinta-sinal\[hidden\], \.topcard\.aberto \.quinta-sinal \{ display: none; \}/.test(css), '(d) com o cartão aberto (ou sem pendentes) a linha não aparece');
    ok(/@media \(prefers-reduced-motion: reduce\) \{ \.quinta-sinal\.pulsar \.quinta-sinal-ponto \{ animation: none; \} \}/.test(css), '(d) sem pulsação com "reduzir movimento"');
    ok(/<button type="button" class="topcard-header" onclick="alternarCartaoQuinta\(\)"[^>]*>\s*<span class="cartao-textos">[\s\S]*?<span id="quinta-resumo-linha" class="mini-sub"><\/span>[\s\S]*?<span id="quinta-sinal" class="quinta-sinal" role="img" hidden><\/span>[\s\S]*?<\/span>/.test(fontes['index.html']), '(d) a linha está dentro do cabeçalho do cartão (tocar nela abre-o como hoje), por baixo do resumo');
  }

  // ---------------------------------------------------------------- (e) textos e tamanho
  {
    const g = abrir();
    ['pt', 'en', 'es'].forEach(function (l) {
      const T = g.json('TRANSLATIONS.' + l);
      ['visita', 'encomenda', 'oferta', 'festa'].forEach(function (k) {
        const v = T['quinta.sinal.' + k];
        ok(typeof v === 'string' && v.length >= 3 && v.length <= 10, '(e) ' + l + ': quinta.sinal.' + k + ' curto (deu ' + J(v) + ')');
      });
      ok(typeof T['quinta.sinal.aria'] === 'string' && T['quinta.sinal.aria'].indexOf('{lista}') !== -1, '(e) ' + l + ': quinta.sinal.aria com {lista}');
    });
    const css = fontes['index.html'].replace(/\n\s*/g, ' ');
    const regra = (/\.quinta-sinal \{([^}]*)\}/.exec(css) || ['', ''])[1];
    const px = function (p) { const m = new RegExp('(?:^|[ ;])' + p + ': ([0-9.]+)px').exec(regra); return m ? Number(m[1]) : null; };
    ok(px('height') + px('margin-top') <= 16 && px('line-height') <= px('height') && px('font-size') <= 12, '(e) uma linha pequena: ' + px('height') + ' + ' + px('margin-top') + ' px');
    ok(/white-space: nowrap;/.test(regra) && /overflow: hidden;/.test(regra) && /max-width: 100%;/.test(regra), '(e) numa só linha e sem sair da caixa');
    // A largura: o cartão fechado tem no máximo 60% da coluna (min(100vw, 480px)) menos o padding (10+10), a borda (2)
    // e a seta (16 + 8 de espaço). O texto mais comprido (com «+3»), a 11 px e em negrito (0,62 em por carater, com
    // margem), mais o ponto (8) e o espaço (5), tem de caber.
    [320, 360, 430].forEach(function (w) {
      const dentro = Math.min(w, 480) * 0.6 - 20 - 2 - 24;
      let maior = 0, qual = '';
      ['pt', 'en', 'es'].forEach(function (l) { ['visita', 'encomenda', 'oferta', 'festa'].forEach(function (k) {
        const s = g.ev('TRANSLATIONS.' + l + "['quinta.sinal." + k + "']") + ' +3';
        const larg = s.length * 11 * 0.62 + 8 + 5;
        if (larg > maior) { maior = larg; qual = s; }
      }); });
      ok(maior <= dentro, '(e) ' + w + ' px: «' + qual + '» (' + maior.toFixed(0) + ' px) cabe em ' + dentro.toFixed(0) + ' px');
    });
  }
  return falhas;
}

// `de` e `para` podem ser listas (várias trocas no mesmo ficheiro, para estragar duas guardas que se protegem uma à outra).
function mutar(f, de, para) {
  const des = Array.isArray(de) ? de : [de], paras = Array.isArray(para) ? para : [para];
  const c = Object.assign({}, FONTES);
  for (let i = 0; i < des.length; i++) {
    if (c[f].indexOf(des[i]) === -1) { console.log('FALHA: mutação impossível (texto não encontrado em ' + f + '): ' + des[i].slice(0, 70)); return null; }
    c[f] = c[f].split(des[i]).join(paras[i]);
  }
  return c;
}
const falhas = suite(FONTES);
let impossiveis = 0;
const MUTACOES = [
  ['a visita tocada continua', 'objetivos.js', '    if (r.feita === true) { visitaTocada = true; return false; }', '    if (r.feita === true) { visitaTocada = true; return true; }'],
  ['a visita nunca conta', 'objetivos.js', '    if (r.feita === true) { visitaTocada = true; return false; }\n    return true;', '    if (r.feita === true) { visitaTocada = true; return false; }\n    return false;'],
  ['a encomenda em curso conta sempre', 'objetivos.js', 'return !!a && encomendaAtiva(state, dia) && a.prazoDia === dia;', 'return !!a && encomendaAtiva(state, dia);'],
  ['sem o pedido de encomenda', 'objetivos.js', '    if (encomendaPodePedir(state, dia, false).ok) return true;\n', ''],
  // A visita tocada é pedida duas vezes (aqui e dentro de visitaBagaceiraPode): a mutação estraga as duas.
  ['oferta sem a visita tocada', 'objetivos.js', ['    if (!visitaTocada) return false;\n    let copo', "copo = typeof visitaBagaceiraPode === 'function' && visitaBagaceiraPode(state, visitaDiaEfetivo()).ok === true;"], ['    let copo', 'copo = state.adega.bagaceira >= 1;']],
  ['oferta sem o copo', 'objetivos.js', "copo = typeof visitaBagaceiraPode === 'function' && visitaBagaceiraPode(state, visitaDiaEfetivo()).ok === true;", 'copo = false;'],
  ['oferta repete o bem já oferecido', 'estrada.js', '    if (ultima !== null && ultima >= estradaDiaDeHoje()) return false;\n    return despensaBemParaOferecer', '    return despensaBemParaOferecer'],
  ['oferta sem o bem da Estrada', 'objetivos.js', "bem = typeof estradaOfertaPendente === 'function' && estradaOfertaPendente() === true;", 'bem = false;'],
  ['festa com tudo feito', 'objetivos.js', 'return !!festa && festaTemTarefaPorFazerHoje(festa) === true;', 'return !!festa;'],
  ['festa fechada conta', 'objetivos.js', "    if (typeof ecraDesbloqueado === 'function' && !ecraDesbloqueado('festa')) return false;\n    const festa", '    const festa'],
  ['ordem trocada', 'objetivos.js', "const QUINTA_PENDENTES_ORDEM = ['visita', 'encomenda', 'oferta', 'festa'];", "const QUINTA_PENDENTES_ORDEM = ['festa', 'visita', 'encomenda', 'oferta'];"],
  ['em modo de teste mostra', 'objetivos.js', "  try { if (typeof visitaEmModoTeste === 'function' && visitaEmModoTeste()) return []; } catch (e) { return []; }\n", ''],
  ['um erro rebenta', 'objetivos.js', "  const tentar = function (chave, fn) { try { if (fn() === true) tem[chave] = true; } catch (e) { /* esta não conta */ } };", '  const tentar = function (chave, fn) { if (fn() === true) tem[chave] = true; };'],
  ['sem o «+1»', 'objetivos.js', "nomes[0] + (lista.length > 1 ? ' +' + (lista.length - 1) : '')", 'nomes[0]'],
  ['aria-label só com a 1.ª', 'objetivos.js', "replace('{lista}', nomes.join(', '))", "replace('{lista}', nomes[0])"],
  ['sem pendentes a linha fica', 'objetivos.js', "  if (!lista.length) { el.hidden = true; el.innerHTML = '';", "  if (!lista.length) { el.hidden = false; el.innerHTML = '';"],
  ['pulsa sempre', 'objetivos.js', '  else if (dia !== null && agora - quintaSinalPulsouEm < QUINTA_SINAL_PULSAR_MS) pulsar = true;', '  else pulsar = true;'],
  ['o resumo não desenha o sinal', 'objetivos.js', "    t('objetivos.resumoLabel') + ' ' + feitos + '/' + visiveis.length;\n  atualizarSinalQuinta();", "    t('objetivos.resumoLabel') + ' ' + feitos + '/' + visiveis.length;"],
  ['o dia novo não redesenha', 'objetivos.js', '    if (diaLisboaDeHoje() !== quintaSinalDia) atualizarResumoQuinta();', '    /* nada */'],
  ['a encomenda não atualiza o sinal', 'encomendas.js', "  if (typeof atualizarResumoQuinta === 'function') atualizarResumoQuinta(); // o sinal", '  // o sinal'],
  ['o cartão aberto mostra a linha', 'index.html', '.quinta-sinal[hidden], .topcard.aberto .quinta-sinal { display: none; }', '.quinta-sinal[hidden] { display: none; }'],
  ['a linha parte em duas', 'index.html', "      color: var(--dourado);\n      white-space: nowrap;\n    }", '      color: var(--dourado);\n    }'],
  ['a linha alta', 'index.html', '      margin-top: 2px;\n      height: 14px;', '      margin-top: 2px;\n      height: 24px;'],
  ['pulsa com "reduzir movimento"', 'index.html', '      .quinta-sinal.pulsar .quinta-sinal-ponto { animation: none; }\n', ''],
  ['texto em falta (ES)', 'i18n.js', "    'quinta.sinal.oferta': 'Ofrenda',\n", ''],
  ['texto comprido de mais (EN)', 'i18n.js', "'quinta.sinal.festa': 'Festival',", "'quinta.sinal.festa': 'Festival of the season',"]
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
