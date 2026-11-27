#!/usr/bin/env node
// ENCOMENDAS, PR 2: no jogo. O bloco no cartão da Quinta (encomendaHtml() em js/encomendas.js, desenhado por
// atualizarLinhaVisitaQuinta() em js/visitas.js) e o pagamento ao engarrafar (executarAcaoAdega em js/garrafa.js).
// Corre os ficheiros REAIS em vm (state, i18n, estacoes, tempo, niveis, alambique, garrafa, visitas, encomendas) com um
// DOM, um dia de Lisboa e um relógio falsos. Nada toca em browser, Telegram nem conta real.
//
// Prova:
//  (a) pedir só nas condições certas: nível 5+, visita de hoje já tocada, nenhuma ativa, ainda sem encomenda nova hoje,
//      fora do modo de teste; o bloco tem a fala da personagem, o pedido (cor pelo nome da Cave e o dia do prazo na
//      língua do jogador) e «Aceitar» / «Agora não»;
//  (b) «Aceitar» cria a encomenda e grava UMA vez (toque duplo não grava outra vez); depois fica a linha «em curso»,
//      sem botões; «Agora não» grava ultimoDia = hoje uma vez e não volta a pedir nesse dia (no dia seguinte, sim);
//  (c) prazo: depois do prazo, ao desenhar a Quinta, a encomenda acaba sem tirar nada, grava uma vez e mostra
//      «A encomenda acabou» (só em memória);
//  (d) entregar ao engarrafar: a garrafa com o escalão pedido ou maior paga o prémio uma só vez (Reputação, Uvas,
//      Gotas), soma uma cumprida, acaba a encomenda, grava uma só vez (com o resto do engarrafar), não gasta a garrafa,
//      mostra o agradecimento na mensagem, na página da garrafa e na Quinta; toca o som da bagaceira em vez do
//      ficheiro do engarrafar (um só som); uma garrafa de escalão menor não paga, nem as de antes de aceitar, nem a
//      jeropiga (js/festas.js não chama);
//  (e) o prémio pode fazer subir de nível (a garrafa conta para a Coleção como se tivesse sido ela);
//  (f) modo de teste (?visita=, ?dias=): não pede, não paga, não grava;
//  (g) textos nas 3 línguas (sem «dias» de descanso e sem «Fygmo2»), falas das 3 personagens, o prémio só com as partes
//      maiores do que 0, o dia do prazo na língua do jogador; sem Math.random; o CSS dos botões (44 px).
//
// Depois de passar, aplica "mutações" (estraga cada regra de propósito) e confirma que o teste as apanha.
// Uso: node scripts/verificar-encomendas-jogo.js     Sai com 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const LER = function (f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); };
const FICHEIROS = ['state.js', 'i18n.js', 'estacoes.js', 'tempo.js', 'niveis.js', 'alambique.js', 'garrafa.js', 'visitas.js', 'encomendas.js'];
const FONTES = {};
FICHEIROS.forEach(function (f) { FONTES[f] = LER('js/' + f); });
FONTES['index.html'] = LER('index.html');
FONTES['festas.js'] = LER('js/festas.js');
const HOJE = '2026-10-10'; // um sábado
const H = 3600000;
const J = JSON.stringify;

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }

  function abrir(o) {
    o = o || {};
    const relogio = { t: Date.parse(HOJE + 'T12:00:00Z') };
    class Relogio extends Date {
      constructor(...a) { if (a.length === 0) super(relogio.t); else super(...a); }
      static now() { return relogio.t; }
    }
    const container = { innerHTML: '' };
    const sb = {
      console: { log() {}, warn() {}, error() {} },
      localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
      location: { search: o.search || '' }, URLSearchParams: URLSearchParams, Intl: Intl, navigator: { language: 'pt' },
      document: { hidden: false, querySelectorAll: function () { return []; }, querySelector: function () { return null; }, documentElement: {}, addEventListener: function () {},
        getElementById: function (id) { return id === 'visita-container' ? container : { innerHTML: '', style: {}, classList: { add() {}, remove() {}, toggle() {} } }; } },
      setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {}, Date: Relogio
    };
    sb.window = sb; sb.addEventListener = function () {}; sb.Telegram = { WebApp: {} };
    const cx = vm.createContext(sb);
    vm.runInContext(fontes['state.js'], cx, { filename: 'state.js' });
    vm.runInContext(fontes['i18n.js'], cx, { filename: 'i18n.js' });
    vm.runInContext(`
      var SAVES = 0, SONS = [], VIBR = [], FALAS = [];
      t = function (k) { var v = TRANSLATIONS[currentLang][k]; return v === undefined ? k : v; };
      function escaparHtml(s) { return String(s); } function cadernoEscapar(s) { return String(s); }
      function mostrarFalas(f, n) { FALAS.push([f, n]); } function vibrar(x) { VIBR.push(x); } function updateStatsDisplays() {}
      function reposicionarFlutuantes() {} function atualizarCartaoObjetivosQuinta() {}
      function faseRealAtual() { return 'repouso'; }
      function jaFezTarefaTempoHoje() { return false; } function registarTarefaTempoHoje() {}
      function entradasBloqueadas() { return []; } function mostrarNovaEntrada() {} function atualizarDialogo() {} function definirFundo() {}
      function pararSomAmbiente() {} function iniciarSomAmbiente() {} function tocarSomFicheiro() {} function tocarSomDaAcao() {}
      function tocarSom(n) { SONS.push(n); }
      function formatarTempoVinha() { return '1 min'; }
      function atualizarCartaoNivelQuinta() {} function atualizarResumoQuinta() {}
      function marcarObjetivoCumprido() { return false; } function desbloquearEntradaEnciclopedia() { return null; }
      function goTo() {} function mostrarHistoriaSubidaNivel() {} function atualizarCapituloQuinta() {}
    `, cx);
    ['estacoes.js', 'tempo.js', 'niveis.js', 'alambique.js', 'garrafa.js', 'visitas.js', 'encomendas.js'].forEach(function (f) { vm.runInContext(fontes[f], cx, { filename: f }); });
    vm.runInContext(`
      var __dia = ${J(HOJE)};
      diaLisboaDeHoje = function () { return __dia; };
      saveState = function () { SAVES++; };
      renderAdega = function () {};
      estacaoAtual = function () { return 'verao'; };
      state = defaultState();
      state.reputacao = ${o.reputacao === undefined ? 700 : o.reputacao}; state.uvas = 50; state.gotas = 500; state.garrafas = 2;
      state.acesso.jogadorAntigo = true; state.niveis.garrafasAoNivel6 = 0; state.niveis.nivelMostrado = 6;
      state.adega = Object.assign(state.adega, { bagaco: 0, aguardente: 3, bagaceira: 0, cooldowns: {}, lote: null,
        historico: [{ data: 'x', estacao: 'verao', diasDescanso: 4 }, { data: 'x', estacao: 'verao', diasDescanso: 1 }] });
      state.visitas = { feitas: { valentim_4: __dia }, hoje: { dia: __dia, id: 'valentim_4', feita: ${o.naoTocada ? 'false' : 'true'} } };
    `, cx);
    const g = { cx: cx, container: container, relogio: relogio };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
    g.quinta = function () { g.ev('atualizarLinhaVisitaQuinta()'); return container.innerHTML; };
    g.dia = function (d) { g.ev('__dia = ' + J(d) + '; state.visitas.hoje = { dia: __dia, id: "marisa_4", feita: true };'); };
    g.lote = function (horas) { g.ev('state.adega.lote = { iniciadoEm: ' + (relogio.t - horas * H) + ' }; adegaGarrafaFeita = null;'); };
    g.saves = function () { return g.ev('SAVES'); };
    return g;
  }

  // ---------------------------------------------------------------- (a) pedir
  {
    const g = abrir();
    const h = g.quinta();
    ok(/encomendaAceitarClique\(\)/.test(h) && /encomendaAgoraNaoClique\(\)/.test(h), '(a) nível 6 com a visita tocada: aparece o pedido com «Aceitar» e «Agora não»');
    const fala = g.ev('ENCOMENDAS_FALAS_PEDIDO.valentim.pt');
    ok(h.indexOf('«' + fala + '»') !== -1, '(a) com a fala de pedido do Sr. Valentim');
    const esc = g.ev("encomendaEscalaoDoDia(6, '" + HOJE + "', 0)");
    const cor = g.ev('t(garrafaPorDias(' + esc + ').nomeKey)');
    ok(h.indexOf('O Sr. Valentim gostava de uma garrafa «' + cor + '» ou mais escura até segunda-feira, 12/10.') !== -1, '(a) o pedido diz a cor e o dia do prazo (segunda-feira, 12/10): ' + (h.match(/<p class="oferta-linha encomenda-linha">[^<]*/) || [''])[0]);
    ok(/<button type="button" class="btn-pill pill-main encomenda-botao" onclick="encomendaAceitarClique\(\)">Aceitar<\/button>/.test(h) && /<button type="button" class="btn-pill encomenda-botao" onclick="encomendaAgoraNaoClique\(\)">Agora não<\/button>/.test(h), '(a) os botões Aceitar e Agora não');
    ok(h.indexOf('valentim-linha') === -1 && h.indexOf('class="visita-linha') !== -1 && h.indexOf('visita-linha') < h.indexOf('encomenda-pedido'), '(a) o bloco fica por baixo da linha da visita');
    ok(g.saves() === 0, '(a) desenhar o pedido não grava');
    const n4 = abrir({ reputacao: 120 });
    ok(n4.quinta().indexOf('encomenda') === -1, '(a) nível 4: sem pedido');
    const nt = abrir({ naoTocada: true });
    ok(nt.quinta().indexOf('encomendaAceitarClique') === -1, '(a) visita ainda por tocar: sem pedido');
    const sv = abrir(); sv.ev('state.visitas.hoje = null; state.visitas.feitas = {};');
    ok(sv.quinta().indexOf('encomendaAceitarClique') === -1, '(a) sem visita hoje: sem pedido');
    // outra língua
    const en = abrir(); en.ev("currentLang = 'en';");
    ok(en.quinta().indexOf('Mr. Valentim would like a «') !== -1 && /by Monday 12\/10\./.test(en.quinta()), '(a) em inglês, com o dia em inglês: ' + (en.quinta().match(/would like[^<]*/) || [''])[0]);
    const es = abrir(); es.ev("currentLang = 'es';");
    ok(/El Sr\. Valentim quiere una botella «[^»]+» o más oscura para el lunes, 12\/10\./.test(es.quinta()), '(a) em espanhol, com o dia em espanhol: ' + (es.quinta().match(/quiere[^<]*/) || [''])[0]);
  }

  // ---------------------------------------------------------------- (b) aceitar e «Agora não»
  {
    const g = abrir();
    g.quinta();
    g.ev('encomendaAceitarClique()');
    const e = g.json('state.encomendas');
    ok(g.saves() === 1 && e.atual && e.atual.personagem === 'valentim' && e.atual.aceiteDia === HOJE && e.atual.prazoDia === '2026-10-12' && e.atual.historicoInicio === 2 && e.ultimoDia === HOJE, '(b) Aceitar cria a encomenda e grava uma vez: ' + J(e) + ' saves ' + g.saves());
    g.ev('encomendaAceitarClique()');
    ok(g.saves() === 1, '(b) um toque duplo não grava outra vez');
    const h = g.quinta();
    const cor = g.ev('t(garrafaPorDias(' + e.atual.escalao + ').nomeKey)');
    ok(h.indexOf('Encomenda para o Sr. Valentim: «' + cor + '» ou mais escura, até segunda-feira, 12/10.') !== -1 && h.indexOf('encomendaAceitarClique') === -1 && h.indexOf('encomenda-botao') === -1 && h.indexOf('encomendaAgoraNaoClique') === -1, '(b) em curso: só a linha, sem botões');
    ok(J([g.ev('state.reputacao'), g.ev('state.uvas'), g.ev('state.gotas'), g.ev('state.garrafas')]) === J([700, 50, 500, 2]), '(b) aceitar não dá nem tira nada');
    // em curso também nos dias sem visita
    g.ev('state.visitas.hoje = null;');
    ok(g.quinta().indexOf('Encomenda para o Sr. Valentim') !== -1, '(b) a encomenda em curso vê-se mesmo num dia sem visita');
    // Agora não
    const n = abrir();
    n.quinta(); n.ev('encomendaAgoraNaoClique()');
    ok(n.saves() === 1 && n.ev('state.encomendas.ultimoDia') === HOJE && n.ev('state.encomendas.atual') === null, '(b) Agora não grava ultimoDia = hoje, uma vez');
    ok(n.quinta().indexOf('encomenda') === -1, '(b) depois de Agora não, não volta a pedir nesse dia');
    n.ev('encomendaAgoraNaoClique()'); n.ev('encomendaAceitarClique()');
    ok(n.saves() === 1 && n.ev('state.encomendas.atual') === null, '(b) e não se pode aceitar nem recusar outra vez nesse dia');
    n.dia('2026-10-11');
    ok(n.quinta().indexOf('encomendaAceitarClique') !== -1, '(b) no dia seguinte (nova visita tocada) volta a pedir');
  }

  // ---------------------------------------------------------------- (c) prazo
  {
    const g = abrir();
    g.quinta(); g.ev('encomendaAceitarClique()');
    const antes = g.json('[state.reputacao, state.uvas, state.gotas, state.garrafas, state.encomendas.cumpridas]');
    g.dia('2026-10-12'); g.ev('SAVES = 0;');
    ok(g.quinta().indexOf('Encomenda para o Sr. Valentim') !== -1 && g.saves() === 0, '(c) no último dia do prazo ainda está em curso');
    g.dia('2026-10-13'); g.ev('SAVES = 0;');
    const h = g.quinta();
    ok(h.indexOf('A encomenda para o Sr. Valentim acabou. Não perdeste nada.') !== -1, '(c) depois do prazo: «A encomenda acabou»');
    ok(g.ev('state.encomendas.atual') === null && g.saves() === 1, '(c) a encomenda acaba e grava uma vez');
    ok(J(g.json('[state.reputacao, state.uvas, state.gotas, state.garrafas, state.encomendas.cumpridas]')) === J(antes), '(c) acabar não tira nada nem conta como cumprida');
    g.quinta();
    ok(g.saves() === 1, '(c) desenhar outra vez não grava outra vez');
    ok(/encomendaAceitarClique/.test(h), '(c) no mesmo dia pode vir um pedido novo (a visita de hoje)');
  }

  // ---------------------------------------------------------------- (d) entregar ao engarrafar
  [[1, 9, 4, 20, 0], [2, 18, 6, 30, 0], [3, 27, 8, 0, 15], [4, 36, 10, 0, 25]].forEach(function (c) {
    const g = abrir({ reputacao: 1500 }); // nível 8: todas as cores abertas
    g.ev("state.encomendas = { atual: { personagem: 'henrique', escalao: " + c[0] + ", aceiteDia: '" + HOJE + "', prazoDia: '2026-10-12', historicoInicio: 2 }, ultimoDia: '" + HOJE + "', cumpridas: 0 };");
    g.lote(c[1]);
    const rep0 = g.ev('state.reputacao'), uv0 = g.ev('state.uvas'), go0 = g.ev('state.gotas'), gar0 = g.ev('state.garrafas');
    g.ev('SAVES = 0; SONS = [];');
    g.ev('engarrafarAgora()');
    const repCave = [0, 30, 40, 50, 60][c[0]];
    ok(g.ev('state.reputacao') - rep0 === repCave + c[2] && g.ev('state.uvas') - uv0 === c[3] && g.ev('state.gotas') - go0 === c[4] - 0, '(d) escalão ' + c[0] + ': garrafa +' + repCave + ' e prémio +' + c[2] + ' Rep +' + c[3] + ' Uvas +' + c[4] + ' Gotas');
    ok(g.ev('state.encomendas.cumpridas') === 1 && g.ev('state.encomendas.atual') === null, '(d) escalão ' + c[0] + ': conta uma cumprida e acaba a encomenda');
    ok(g.saves() === 1, '(d) escalão ' + c[0] + ': grava uma só vez (com o resto do engarrafar), deu ' + g.saves());
    ok(g.ev('state.garrafas') === gar0 + 1 && g.ev('state.adega.historico.length') === 3, '(d) a garrafa não se gasta (fica no histórico e conta)');
    ok(J(g.json('SONS')) === J(['objetivoCumprido']) && g.ev('adegaDingTocou') === true, '(d) um só som: o da bagaceira (o ficheiro do engarrafar cala-se), deu ' + J(g.json('SONS')));
    ok(g.ev('adegaMensagemAtual').indexOf('Entregaste a encomenda ao Dr. Henrique!') !== -1, '(d) a mensagem do engarrafar tem o agradecimento');
    ok(g.ev('engarrafarResultado.rep') === repCave, '(d) a página da garrafa mostra a Reputação da garrafa à parte');
    ok(g.ev('engarrafarResultado.encomenda.ok') === true, '(d) e a página da garrafa tem a entrega');
    const h = g.quinta();
    ok(h.indexOf('Entregaste a encomenda ao Dr. Henrique!') !== -1 && h.indexOf('«' + g.ev('ENCOMENDAS_FALAS_OBRIGADO.henrique.pt') + '»') !== -1, '(d) a Quinta mostra o agradecimento');
    const premioTexto = ['+' + c[2] + ' Reputação'].concat(c[3] ? ['+' + c[3] + ' Uvas'] : []).concat(c[4] ? ['+' + c[4] + ' Gotas'] : []).join(', ');
    ok(h.indexOf('<p>' + premioTexto + '</p>') !== -1, '(d) o prémio só com as partes > 0: ' + premioTexto);
    // outra garrafa não paga outra vez
    g.lote(36); const rep1 = g.ev('state.reputacao'); g.ev('engarrafarAgora()');
    ok(g.ev('state.reputacao') - rep1 === 60 && g.ev('state.encomendas.cumpridas') === 1, '(d) a garrafa seguinte não paga outra vez');
  });
  {
    // escalão menor não paga; as garrafas de antes (Cobre no histórico) não contam; jeropiga não conta
    const g = abrir({ reputacao: 1500 });
    g.ev("state.adega.historico.push({ data: 'x', estacao: 'outono', diasDescanso: 0, festa: 'saomartinho' });");
    g.ev("state.encomendas = { atual: { personagem: 'marisa', escalao: 3, aceiteDia: '" + HOJE + "', prazoDia: '2026-10-12', historicoInicio: 3 }, ultimoDia: '" + HOJE + "', cumpridas: 0 };");
    g.lote(18); g.ev('SONS = [];');
    const rep0 = g.ev('state.reputacao');
    g.ev('engarrafarAgora()');
    ok(g.ev('state.reputacao') - rep0 === 40 && g.ev('state.encomendas.atual') !== null && g.ev('state.encomendas.cumpridas') === 0, '(d) uma Dourado para um pedido Âmbar não paga (nem com a Cobre antiga no histórico)');
    ok(g.json('SONS').indexOf('objetivoCumprido') === -1 && g.ev('adegaDingTocou') === false, '(d) sem entrega, o som é o de sempre');
    ok(!/encomenda/i.test(fontes['festas.js']), '(d) a jeropiga (js/festas.js) não chama as encomendas');
    // a entrega fora do prazo não paga
    const p = abrir({ reputacao: 1500 });
    p.ev("state.encomendas = { atual: { personagem: 'marisa', escalao: 1, aceiteDia: '2026-10-07', prazoDia: '2026-10-09', historicoInicio: 2 }, ultimoDia: '2026-10-07', cumpridas: 0 };");
    p.lote(36); const r0 = p.ev('state.reputacao'); p.ev('engarrafarAgora()');
    ok(p.ev('state.reputacao') - r0 === 60 && p.ev('state.encomendas.cumpridas') === 0, '(d) fora do prazo não paga');
  }

  // ---------------------------------------------------------------- (e) subir de nível com o prémio
  {
    const g = abrir({ reputacao: 600 - 30 - 2 }); // 568: nível 5
    g.ev('state.niveis.garrafasAoNivel6 = null; state.niveis.nivelMostrado = 5;');
    g.ev("state.encomendas = { atual: { personagem: 'valentim', escalao: 1, aceiteDia: '" + HOJE + "', prazoDia: '2026-10-12', historicoInicio: 2 }, ultimoDia: '" + HOJE + "', cumpridas: 0 };");
    g.lote(9);
    g.ev('engarrafarAgora()');
    ok(g.ev('state.reputacao') === 602 && g.ev('nivelPelaReputacao(state.reputacao)') === 6, '(e) 568 + 30 (garrafa) + 4 (prémio) = 602: nível 6');
    ok(g.ev('state.niveis.garrafasAoNivel6') === 2, '(e) a garrafa que deu o nível 6 (com o prémio) conta para a Coleção (nota = 2)');
    ok(g.ev('verificarSubidaNivel()') === true && g.ev('state.niveis.nivelMostrado') === 6, '(e) ao entrar na Quinta, o nível sobe');
  }

  // ---------------------------------------------------------------- (f) modo de teste
  ['?visita=valentim_4', '?dias=2'].forEach(function (q) {
    const g = abrir({ search: q });
    ok(g.quinta().indexOf('encomenda') === -1, '(f) ' + q + ': sem bloco');
    g.ev('encomendaAceitarClique(); encomendaAgoraNaoClique();');
    ok(g.saves() === 0 && g.ev('state.encomendas.atual') === null && g.ev('state.encomendas.ultimoDia') === null, '(f) ' + q + ': não pede nem grava');
    const p = abrir({ search: q, reputacao: 1500 });
    p.ev("state.encomendas = { atual: { personagem: 'marisa', escalao: 1, aceiteDia: '" + HOJE + "', prazoDia: '2026-10-12', historicoInicio: 2 }, ultimoDia: '" + HOJE + "', cumpridas: 0 };");
    p.lote(36); const r0 = p.ev('state.reputacao'); const daGarrafa = p.ev('reputacaoDaCave(Math.floor(diasDescansadosNaCave()))'); p.ev('engarrafarAgora()');
    ok(p.ev('state.reputacao') - r0 === daGarrafa && p.ev('state.encomendas.cumpridas') === 0 && p.ev('state.encomendas.atual') !== null, '(f) ' + q + ': engarrafar não paga a encomenda');
    const e = abrir({ search: q }); e.ev("state.encomendas = { atual: { personagem: 'marisa', escalao: 1, aceiteDia: '2026-10-05', prazoDia: '2026-10-07', historicoInicio: 2 }, ultimoDia: '2026-10-05', cumpridas: 0 };");
    e.quinta();
    ok(e.saves() === 0 && e.ev('state.encomendas.atual') !== null, '(f) ' + q + ': não acaba a encomenda nem grava');
  });

  // ---------------------------------------------------------------- (g) textos, falas, sem Math.random, CSS
  {
    const g = abrir();
    const CHAVES = ['encomenda.pedido', 'encomenda.aceitar', 'encomenda.agoraNao', 'encomenda.emCurso', 'encomenda.acabou', 'encomenda.entregue', 'encomenda.premioRep', 'encomenda.premioUvas', 'encomenda.premioGotas'];
    ['pt', 'en', 'es'].forEach(function (l) {
      const T = g.json('TRANSLATIONS.' + l);
      CHAVES.forEach(function (k) { ok(typeof T[k] === 'string' && T[k].trim().length > 1, '(g) falta ' + k + ' em ' + l); });
      const tudo = CHAVES.map(function (k) { return T[k] || ''; }).join(' ').replace(/\{[a-z]+\}/g, ''); // sem os marcadores ({dia} não é «dias»)
      ok(!/\b(dias?|days?|d[ií]as?)\b/i.test(tudo), '(g) ' + l + ': nenhum texto diz «dias»');
      ok(!/Fygmo\s?2/.test(tudo), '(g) ' + l + ': sem Fygmo2');
      ok(['{nome}', '{cor}', '{dia}'].every(function (x) { return T['encomenda.pedido'].indexOf(x) !== -1 && T['encomenda.emCurso'].indexOf(x) !== -1; }) && T['encomenda.entregue'].indexOf('{nome}') !== -1 && T['encomenda.acabou'].indexOf('{nome}') !== -1, '(g) ' + l + ': os marcadores certos');
      ['valentim', 'marisa', 'henrique'].forEach(function (p) {
        ['ENCOMENDAS_FALAS_PEDIDO', 'ENCOMENDAS_FALAS_OBRIGADO'].forEach(function (o) {
          const f = g.ev(o + '.' + p + '.' + l);
          ok(typeof f === 'string' && f.length > 20 && !/\b(dias?|days?|d[ií]as?)\b/i.test(f) && !/Fygmo\s?2/.test(f), '(g) ' + o + '.' + p + '.' + l);
        });
      });
    });
    ok(g.ev("encomendaPremioTexto({ reputacao: 8, uvas: 0, gotas: 15 })") === '+8 Reputação, +15 Gotas', '(g) o prémio só com as partes > 0');
    ok(g.ev("encomendaDiaTexto('2026-10-12')") === 'segunda-feira, 12/10' && g.ev("encomendaDiaTexto('x')") === '', '(g) o dia do prazo: dia da semana e dia/mês');
    const src = fontes['encomendas.js'].replace(/\/\/.*$/gm, '');
    ok(!/Math\.random|Date\.now|new Date\(\)/.test(src), '(g) sem Math.random nem relógio em js/encomendas.js');
    g.ev('Math.random = function () { throw new Error("Math.random"); };');
    let rebentou = false; try { g.quinta(); g.ev('encomendaAceitarClique()'); g.quinta(); } catch (e) { rebentou = true; }
    ok(!rebentou && g.ev('state.encomendas.atual') !== null, '(g) corre sem Math.random');
    const css = fontes['index.html'].replace(/\n\s*/g, ' ');
    ok(/\.encomenda-botoes \.encomenda-botao \{[^}]*min-height: 44px;[^}]*white-space: normal;/.test(css) && /\.encomenda-botoes \{ display: flex;/.test(css), '(g) os botões lado a lado, 44 px e o texto parte linha');
    const I = fontes['index.html'];
    ok(/<script src="js\/encomendas\.js\?v=\d+"><\/script>/.test(I) && I.indexOf('js/encomendas.js?v=') > I.indexOf('js/visitas.js?v=') && I.indexOf('js/encomendas.js?v=') > I.indexOf('js/garrafa.js?v='), '(g) js/encomendas.js depois de visitas.js e garrafa.js');
  }
  return falhas;
}

// `de` e `para` podem ser listas (várias trocas no mesmo ficheiro, para estragar duas regras que se protegem uma à outra).
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
  ['pede sem tocar na visita', 'encomendas.js', "  if (h.feita !== true) return recusa('nao_tocada');\n", ''],
  ['pede no nível 4', 'encomendas.js', ['const ENCOMENDAS_NIVEL_MINIMO = 5;', '{ escalao: 1, nivel: 5 },'], ['const ENCOMENDAS_NIVEL_MINIMO = 4;', '{ escalao: 1, nivel: 4 },']],
  ['Aceitar grava sempre', 'encomendas.js', '    if (r.ok) saveState(state); // a vibração', '    saveState(state); // a vibração'],
  ['Agora não não marca o dia', 'encomendas.js', '  encomendasEstado(estado).ultimoDia = dia;\n  return { ok: true, motivo: null };', '  return { ok: true, motivo: null };'],
  ['em curso com botões', 'encomendas.js', "  if (a && encomendaAtiva(state, dia)) {\n    return html +", "  if (false && a && encomendaAtiva(state, dia)) {\n    return html +"],
  ['o prazo não acaba ao desenhar', 'encomendas.js', "  if (antes && encomendaExpirar(state, dia)) {", "  if (false && antes && encomendaExpirar(state, dia)) {"],
  ['acabar grava sempre', 'encomendas.js', "    encomendaResultado = { dia: dia, tipo: 'acabou', personagem: antes.personagem, premio: null };\n    saveState(state);\n  }", "    encomendaResultado = { dia: dia, tipo: 'acabou', personagem: antes.personagem, premio: null };\n  }\n  saveState(state);"],
  ['o engarrafar não paga', 'garrafa.js', "      if (entrega.ok) {\n        adegaEncomendaEntregue = entrega;", "      if (false) {\n        adegaEncomendaEntregue = entrega;"],
  ['paga em modo de teste', 'garrafa.js', "const modoTeste = typeof visitaEmModoTeste === 'function' && visitaEmModoTeste();", 'const modoTeste = false;'],
  ['paga também em modo de teste (regra)', 'encomendas.js', "  if (modoTeste === true) return { ok: false, premio: null, escalao: null, personagem: null };\n  return encomendaEntregar", '  return encomendaEntregar'],
  ['conta a garrafa de antes', 'garrafa.js', 'encomendaEngarrafada(state, encomendaDiaDeHoje(), a.historico.length - 1, modoTeste)', 'encomendaEngarrafada(state, encomendaDiaDeHoje(), 0, modoTeste)'],
  ['grava duas vezes', 'garrafa.js', "        adegaEncomendaEntregue = entrega;\n", "        adegaEncomendaEntregue = entrega; saveState(state);\n"],
  ['dois sons', 'garrafa.js', "  if (adegaEncomendaEntregue && !dingAdega) { tocarSom('objetivoCumprido'); adegaDingTocou = true; }", "  if (adegaEncomendaEntregue && !dingAdega) { tocarSom('objetivoCumprido'); }"],
  ['o prémio não conta para o nível 6 da Coleção', 'garrafa.js', '        if (nivelPelaReputacao(state.reputacao) >= 6) carimbarGarrafasAoNivel6(a.historico.length - 1);\n', ''],
  ['a página soma o prémio à garrafa', 'garrafa.js', 'rep: state.reputacao - repAntes - repEncomenda,', 'rep: state.reputacao - repAntes,'],
  ['sem agradecimento na mensagem', 'garrafa.js', "      (adegaEncomendaEntregue ? ' ' + encomendaEntregueTexto(adegaEncomendaEntregue) : '');", "      '';"],
  ['o bloco só com visita', 'visitas.js', '  if (!r.visita) { container.innerHTML = ofertaBloco() + encomendaBloco(); return; }', "  if (!r.visita) { container.innerHTML = ''; return; }"],
  ['o bloco sai da Quinta', 'visitas.js', "    (function () { try { return visitaBagaceiraHtml(); } catch (e) { return ''; } })() +\n    // A encomenda da visita (nível 5): por baixo do copo.\n    encomendaBloco();", "    (function () { try { return visitaBagaceiraHtml(); } catch (e) { return ''; } })();"],
  ['o prémio mostra zeros', 'encomendas.js', '  if (premio.uvas > 0) partes.push', '  partes.push'],
  ['o dia do prazo em duração', 'encomendas.js', ".replace('{dia}', encomendaDiaTexto(prazo))", ".replace('{dia}', '2 dias')"],
  ['texto em falta (ES)', 'i18n.js', "    'encomenda.agoraNao': 'Ahora no',\n", ''],
  ['texto com dias (EN)', 'i18n.js', "'encomenda.acabou': 'The order for {nome} has ended. You lost nothing.'", "'encomenda.acabou': 'The order for {nome} ended after 2 days.'"],
  ['fala em falta', 'encomendas.js', "  henrique: { pt: 'Cor certa, nariz honesto", "  henrique_x: { pt: 'Cor certa, nariz honesto"],
  ['cor ao acaso', 'encomendas.js', "return abertos[encomendaHash(dia + '#encomenda#' + n) % abertos.length];", 'return abertos[Math.floor(Math.random() * abertos.length)];'],
  ['botões sem 44 px', 'index.html', '.encomenda-botoes .encomenda-botao { flex: 1 1 0; min-width: 0; min-height: 44px;', '.encomenda-botoes .encomenda-botao { flex: 1 1 0; min-width: 0;']
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
