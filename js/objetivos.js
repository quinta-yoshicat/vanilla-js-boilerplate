// ---------------------------------------------------------------------
// "HOJE NA QUINTA" — 3 objetivos diários, renovados à meia-noite de
// Lisboa (ver diaLisboaDeHoje() em js/tempo.js, independente do fuso
// horário do telemóvel do jogador).
//
// Cada objetivo cumprido dá +2 Reputação. Cumprir os 3 no mesmo dia dá
// +5 Reputação extra e +1 "selo do dia" — os selos nunca se perdem,
// mesmo que um dia fique incompleto.
//
// Nunca se escolhe um objetivo impossível hoje: cada candidato só entra
// no sorteio se a sua condição (elegivel()) for verdadeira NESTE
// MOMENTO. Os "cooldowns" próprios de cada ação (ex: Regar 3h) não
// entram nessa condição — como o mais longo do jogo é 4h, uma ação
// elegível pela fase/recursos fica sempre disponível ainda dentro do
// mesmo dia.
// ---------------------------------------------------------------------

// Recompensas fixas — usadas tanto para somar a Reputação como para
// mostrar "+2"/o texto do bónus no cartão (ver atualizarCartaoObjetivosQuinta()).
const OBJETIVO_RECOMPENSA_PONTOS = 2;
const OBJETIVO_BONUS_TRIO_PONTOS = 5;

// --- GRUPO A — Vinha ou Adega (Objetivo 1) -----------------------------
const OBJETIVOS_POOL_A = [
  { id: 'vinha_cavar', elegivel: function () { return state.vinha.fase === 'preparar'; } },
  { id: 'vinha_plantar', elegivel: function () { return state.vinha.fase === 'preparada'; } },
  { id: 'vinha_ervas', elegivel: function () { return state.vinha.fase === 'preparada' || state.vinha.fase === 'crescendo'; } },
  { id: 'vinha_regar', elegivel: function () { return state.vinha.fase === 'crescendo'; } },
  { id: 'vinha_adubar', elegivel: function () { return state.vinha.fase === 'crescendo' && state.vinha.adubo >= 1; } },
  { id: 'vinha_compostagem', elegivel: function () { return state.vinha.residuos >= RESIDUOS_POR_COMPOSTAGEM; } },
  { id: 'vinha_colher', elegivel: function () { return state.vinha.fase === 'pronta'; } },
  { id: 'adega_prensar', elegivel: function () { return ecraDesbloqueado('garrafa') && state.uvas >= ADEGA_CUSTO_UVAS_PRENSAR; } },
  { id: 'adega_alambique', elegivel: function () { return ecraDesbloqueado('garrafa') && alambiquePodeDestilar(state); } },
  {
    id: 'adega_fortificar',
    elegivel: function () {
      return ecraDesbloqueado('garrafa') && !state.adega.lote && state.gotas >= ADEGA_CUSTO_GOTAS_FORTIFICAR && state.adega.aguardente >= ADEGA_CUSTO_AGUARDENTE_FORTIFICAR;
    }
  },
  {
    id: 'adega_engarrafar',
    elegivel: function () {
      return ecraDesbloqueado('garrafa') && !!state.adega.lote && Math.floor(diasDescansadosNaCave()) >= REGRAS_DESCANSO_CAVE.diasMinimos;
    }
  }
];

// --- GRUPO B — Ação (Objetivo 2) ---------------------------------------
// (ecraDesbloqueado() ver js/niveis.js — jogadores antigos ignoram-no
// sempre, ver state.acesso.jogadorAntigo em js/state.js)
const OBJETIVOS_POOL_B = [
  { id: 'proteger_vencer', elegivel: function () { return ecraDesbloqueado('proteger') && vitoriasProtegerComPremioRestantesHoje() > 0; } },
  { id: 'explorar_descobrir', elegivel: function () { return ecraDesbloqueado('explorar') && entradasBloqueadas().length > 0; } }
];

// --- GRUPO C — "Do dia": festa > tempo real > bónus de estação --------
// Os ids do Grupo C que não estão em nenhuma pool (a regra de cada um está em
// candidatosGrupoC() abaixo). Existem aqui só para terem uma entrada onde pôr
// o texto, se um dia vier na própria entrada.
const OBJETIVOS_GRUPO_C = [
  { id: 'festa_tarefa' },
  { id: 'tempo_chuva' },
  { id: 'tempo_vento' },
  { id: 'tempo_frio' },
  { id: 'tempo_vigiar' }
];

// --- TEXTO DOS OBJETIVOS ------------------------------------------------
// Cada entrada (das pools A e B e do Grupo C) pode trazer texto: { pt, en, es }.
// Sem ele, o texto continua a vir da chave 'objetivo.<id>' de js/i18n.js.

// A entrada deste id em qualquer das listas, ou null.
function objetivoEntrada(id) {
  const listas = [OBJETIVOS_POOL_A, OBJETIVOS_POOL_B, OBJETIVOS_GRUPO_C];
  for (let i = 0; i < listas.length; i++) {
    for (let j = 0; j < listas[i].length; j++) {
      if (listas[i][j].id === id) return listas[i][j];
    }
  }
  return null;
}

// O texto do objetivo: o da entrada, se existir, senão t('objetivo.' + id).
function objetivoTexto(id) {
  const e = objetivoEntrada(id);
  if (e && e.texto) {
    const texto = textoNaLingua(e.texto);
    if (texto) return texto;
  }
  return t('objetivo.' + id);
}

// Verdadeiro se o id tem dados: texto PT na entrada ou chave PT no i18n.js. Um id
// gravado por outro aparelho com versão diferente pode não ter. Sem dicionário
// (testes que simulam t()) não há como decidir, por isso conta como tendo dados.
function objetivoTemDados(id) {
  const e = objetivoEntrada(id);
  if (e && e.texto && typeof e.texto.pt === 'string' && e.texto.pt.trim() !== '') return true;
  if (typeof TRANSLATIONS === 'undefined') return true;
  const valor = TRANSLATIONS.pt && TRANSLATIONS.pt['objetivo.' + id];
  return typeof valor === 'string' && valor.trim() !== '';
}

// Os objetivos de state.objetivos.lista que se mostram e contam (os sem dados são
// ignorados ao ler; nada se apaga do estado nem da nuvem).
function objetivosComDados() {
  return state.objetivos.lista.filter(function (o) { return o && objetivoTemDados(o.id); });
}

// Devolve uma lista de ids candidatos, já por ordem de prioridade (o
// bónus de estação reaproveita os ids do Grupo A, em vez de ter texto
// próprio — se essa ação já tiver sido escolhida para outro objetivo do
// dia, gerarObjetivosDoDia() salta para o candidato seguinte).
function candidatosGrupoC() {
  const lista = [];

  const festa = festaAtual();
  // As tarefas vêm da configuração da festa (FESTAS_CONFIG, js/festas.js), não de nomes escritos aqui.
  if (festa && ecraDesbloqueado('festa') && festaTemTarefaPorFazerHoje(festa)) {
    lista.push('festa_tarefa');
  }

  const tempo = tempoAtual();
  if (tempo.disponivel) {
    if (tempo.ceu === 'chuva' && state.vinha.fase === 'crescendo' && !jaFezTarefaTempoHoje('chuvaRegouDia')) {
      lista.push('tempo_chuva');
    }
    if (tempo.ventoForte && !jaFezTarefaTempoHoje('estacasDia')) {
      lista.push('tempo_vento');
    }
    if (tempo.frioForte && !jaFezTarefaTempoHoje('frioDia')) {
      lista.push('tempo_frio');
    }
    // Vigiar a vinha (js/vigiar.js): só com sinal do tempo e ainda por vigiar hoje (como o frio).
    if (vigiarSinalAgora() !== null && !vigiarJaFezHoje()) {
      lista.push('tempo_vigiar');
    }
  }

  const acoesComBonus = VINHA_BONUS_ESTACAO[estacaoAtual()] || [];
  for (let i = 0; i < acoesComBonus.length; i++) {
    const idAcao = 'vinha_' + acoesComBonus[i];
    const candidato = OBJETIVOS_POOL_A.filter(function (o) { return o.id === idAcao; })[0];
    if (candidato && candidato.elegivel()) lista.push(idAcao);
  }

  return lista;
}

// --- ESCOLHA DOS 3 OBJETIVOS DO DIA -------------------------------------

// Escolhe até 3 objetivos SEM REPETIR nenhum id — um jogador ainda com
// pouca coisa aberta (ver Áreas por Nível em js/niveis.js) pode ter uma
// bolsa elegível muito pequena (ex.: Nível 1 só tem a Vinha); nesse caso
// fica só com 1 ou 2 objetivos nesse dia, em vez de mostrar a mesma
// ação repetida 2 ou 3 vezes no cartão "Hoje na Quinta".
function gerarObjetivosDoDia() {
  const escolhidos = [];
  function adicionar(id) {
    if (id && escolhidos.indexOf(id) === -1) escolhidos.push(id);
  }

  const elegiveisA = OBJETIVOS_POOL_A.filter(function (o) { return o.elegivel(); }).map(function (o) { return o.id; });
  const elegiveisB = OBJETIVOS_POOL_B.filter(function (o) { return o.elegivel(); }).map(function (o) { return o.id; });

  // Objetivo 1 — Vinha ou Adega.
  if (elegiveisA.length > 0) adicionar(elegiveisA[randInt(0, elegiveisA.length - 1)]);

  // Objetivo 2 — Ação (Proteger ou Explorar), sem repetir o Objetivo 1;
  // sem nenhuma disponível, tenta outra da Vinha/Adega ainda não usada.
  const candidatosB = elegiveisB.filter(function (id) { return escolhidos.indexOf(id) === -1; });
  if (candidatosB.length > 0) {
    adicionar(candidatosB[randInt(0, candidatosB.length - 1)]);
  } else {
    const alt = elegiveisA.filter(function (id) { return escolhidos.indexOf(id) === -1; });
    if (alt.length > 0) adicionar(alt[randInt(0, alt.length - 1)]);
  }

  // Objetivo 3 — "Do dia" (festa > tempo real > bónus de estação), sem
  // repetir os já escolhidos; sem nenhum candidato, tenta qualquer outro
  // dos Grupos A/B ainda não usado.
  const candidatosC = candidatosGrupoC().filter(function (id) { return escolhidos.indexOf(id) === -1; });
  if (candidatosC.length > 0) {
    adicionar(candidatosC[0]);
  } else {
    const alt = elegiveisA.concat(elegiveisB).filter(function (id) { return escolhidos.indexOf(id) === -1; });
    if (alt.length > 0) adicionar(alt[randInt(0, alt.length - 1)]);
  }

  // Fallback de segurança: nunca fica sem nenhum objetivo (a Vinha nunca
  // está trancada, e "Compostagem" está sempre disponível como ação).
  if (escolhidos.length === 0) escolhidos.push('vinha_compostagem');

  state.objetivos.dia = diaLisboaDeHoje();
  state.objetivos.lista = escolhidos.map(function (id) { return { id: id, cumprido: false }; });
  state.objetivos.bonusDiaDado = false;
  // Ronda do Chizo (js/ronda.js): repõe-se com o dia, mas uma ronda a meio
  // passa para o dia novo (senão quem abre uma vez por dia nunca recebia).
  state.objetivos.ronda = typeof rondaChizoReporDia === 'function'
    ? rondaChizoReporDia(state.objetivos.ronda, Date.now())
    : { feitas: 0, saidaEm: null, fimEm: null, ultimoFimEm: null };
  // Jogador ainda sem qualquer gravação nem progresso (ex.: logo depois de
  // "Apagar o meu progresso"): os objetivos ficam só em memória e gravam-se
  // com a 1.ª ação real, para não criar estado novo na nuvem só por abrir.
  if (state.ultimaGravacaoEm || temProgressoExistente()) saveState(state);
}

// Chamada logo ao abrir o jogo (ver fundo deste ficheiro) E sempre que
// se entra na Quinta ou se marca um objetivo — assim um dia novo é
// detetado mesmo que o jogo fique aberto a passar da meia-noite.
function garantirObjetivosDoDia() {
  if (diaLisboaMudou(diaLisboaDeHoje(), state.objetivos.dia)) {
    gerarObjetivosDoDia();
  }
}

// Chamada pelas outras partes do jogo (Vinha, Adega, Proteger, Explorar,
// Festas) sempre que o jogador faz algo que pode contar para um
// objetivo de hoje. Não faz nada se esse id não estiver na lista de
// hoje, ou já estiver cumprido.
// Devolve true se cumpriu o objetivo e tocou o "ding" (quem chama não toca o som da sua ação por cima:
// nunca dois sons juntos), senão false. Com { semSom: true } cumpre o objetivo na mesma, sem o "ding"
// (usado quando se falha uma cena das festas) e devolve false.
function marcarObjetivoCumprido(id, opcoes) {
  garantirObjetivosDoDia();
  const lista = state.objetivos.lista;
  let mudouAlgo = false;

  for (let i = 0; i < lista.length; i++) {
    if (lista[i].id === id && !lista[i].cumprido) {
      lista[i].cumprido = true;
      state.reputacao += OBJETIVO_RECOMPENSA_PONTOS;
      mudouAlgo = true;
    }
  }
  if (!mudouAlgo) return false;

  const visiveis = objetivosComDados();
  const todosCumpridos = visiveis.length > 0 && visiveis.every(function (o) { return o.cumprido; });
  if (todosCumpridos && !state.objetivos.bonusDiaDado) {
    state.objetivos.bonusDiaDado = true;
    state.reputacao += OBJETIVO_BONUS_TRIO_PONTOS;
    state.objetivos.selosTotal += 1;
  }

  const semSom = !!(opcoes && opcoes.semSom);
  vibrar('sucesso');
  if (!semSom) tocarSom('objetivoCumprido');
  saveState(state);
  updateStatsDisplays();
  atualizarCartaoObjetivosQuinta();
  if (typeof atualizarCapituloQuinta === 'function') atualizarCapituloQuinta();
  if (typeof atualizarResumoQuinta === 'function') atualizarResumoQuinta();
  return !semSom;
}

// Cartão "Hoje na Quinta", dentro do topcard da Quinta (ver
// #objetivos-container em index.html).
function atualizarCartaoObjetivosQuinta() {
  garantirObjetivosDoDia();
  const container = document.getElementById('objetivos-container');
  if (!container) return;

  const linhasHtml = objetivosComDados().map(function (o) {
    return '<p class="objetivo-linha' + (o.cumprido ? ' feito' : '') + '">' +
      (o.cumprido ? '✓ ' : '· ') + escaparHtml(objetivoTexto(o.id)) +
      ' <span class="objetivo-premio">(+' + OBJETIVO_RECOMPENSA_PONTOS + ')</span>' +
    '</p>';
  }).join('');

  container.innerHTML =
    '<div class="mini-bloco">' +
      '<p class="mini-bloco-titulo">' + t('objetivos.titulo') + '</p>' +
      linhasHtml +
      '<p class="mini-sub objetivo-bonus-linha">' +
        t('objetivos.bonusLinha').replace('{bonus}', OBJETIVO_BONUS_TRIO_PONTOS) +
      '</p>' +
      '<p class="mini-sub">' + t('objetivos.selosLabel') + ' ' + state.objetivos.selosTotal + '</p>' +
    '</div>';
}

// Linha do cartão do topo da Quinta ENCOLHIDO, ex: "Nível 2 · Hoje 1/3"
// (ver #quinta-resumo-linha em index.html e alternarCartaoQuinta() em
// js/main.js) — combina o nível (js/niveis.js) com os objetivos.
function atualizarResumoQuinta() {
  const el = document.getElementById('quinta-resumo-linha');
  if (!el) return;
  garantirObjetivosDoDia();
  const nivelAtual = nivelPelaReputacao(state.reputacao);
  const visiveis = objetivosComDados();
  const feitos = visiveis.filter(function (o) { return o.cumprido; }).length;
  el.textContent = t('nivel.label') + ' ' + nivelAtual + ' · ' +
    t('objetivos.resumoLabel') + ' ' + feitos + '/' + visiveis.length;
  atualizarSinalQuinta();
}

// ---------------------------------------------------------------------
// SINAL NO CARTÃO DA QUINTA FECHADO: o que está por tratar no corpo do cartão (que fechado não se vê).
// quintaPendentes() só LÊ (nunca grava nem lança erro) e devolve, por prioridade e sem repetições:
//   'visita'    a visita de hoje existe (com texto) e ainda não foi tocada (js/visitas.js)
//   'encomenda' há um pedido à espera de «Aceitar» / «Agora não», ou a encomenda em curso acaba hoje (js/encomendas.js)
//   'oferta'    visita de hoje já tocada e há o que oferecer que ainda não foi oferecido hoje: o copo de bagaceira
//               (com bagaceira) ou um bem da Estrada (js/visitas.js, js/estrada.js)
//   'festa'     há uma festa aberta (e aberta para este jogador) com tarefa por fazer hoje (js/festas.js)
//   'prova'     a Prova às cegas de hoje ainda pode ser jogada: provaPodeJogar() (nível 6+, ainda não provou hoje, dia
//               de Lisboa; js/prova.js); nunca em modo de teste (?prova=1, provaModoTeste) nem com uma prova a decorrer
//               (provaEmCurso, js/prova-jogo.js). Começar ou acabar a prova redesenha o sinal (atualizarResumoQuinta).
// Em modo de teste (visitaEmModoTeste: parâmetros no endereço) devolve []. Cada leitura isolada: se falhar, não conta.
// ---------------------------------------------------------------------
const QUINTA_PENDENTES_ORDEM = ['visita', 'encomenda', 'oferta', 'festa', 'prova'];

function quintaPendentes() {
  const tem = {};
  const tentar = function (chave, fn) { try { if (fn() === true) tem[chave] = true; } catch (e) { /* esta não conta */ } };
  try { if (typeof visitaEmModoTeste === 'function' && visitaEmModoTeste()) return []; } catch (e) { return []; }
  let visitaTocada = false;
  tentar('visita', function () {
    if (typeof visitaResolverHoje !== 'function') return false;
    const r = visitaResolverHoje();
    if (!r || !r.visita || (typeof visitaTextoPorEscrever === 'function' && visitaTextoPorEscrever(r.visita))) return false;
    if (r.feita === true) { visitaTocada = true; return false; }
    return true;
  });
  tentar('encomenda', function () {
    if (typeof encomendaPodePedir !== 'function' || typeof encomendaDiaDeHoje !== 'function') return false;
    const dia = encomendaDiaDeHoje();
    if (encomendaPodePedir(state, dia, false).ok) return true;
    const a = encomendasNormalizar(state.encomendas).atual;
    return !!a && encomendaAtiva(state, dia) && a.prazoDia === dia;
  });
  tentar('oferta', function () {
    if (!visitaTocada) return false;
    let copo = false, bem = false;
    try { copo = typeof visitaBagaceiraPode === 'function' && visitaBagaceiraPode(state, visitaDiaEfetivo()).ok === true; } catch (e) { copo = false; }
    try { bem = typeof estradaOfertaPendente === 'function' && estradaOfertaPendente() === true; } catch (e) { bem = false; }
    return copo || bem;
  });
  tentar('festa', function () {
    if (typeof festaAtual !== 'function' || typeof festaTemTarefaPorFazerHoje !== 'function') return false;
    if (typeof ecraDesbloqueado === 'function' && !ecraDesbloqueado('festa')) return false;
    const festa = festaAtual();
    return !!festa && festaTemTarefaPorFazerHoje(festa) === true;
  });
  tentar('prova', function () {
    if (typeof provaPodeJogar !== 'function' || typeof provaDiaDeHoje !== 'function') return false;
    if (typeof provaModoTeste === 'function' && provaModoTeste()) return false;
    if (typeof provaEmCurso === 'function' && provaEmCurso()) return false;
    return provaPodeJogar(state, provaDiaDeHoje(), false).ok === true;
  });
  return QUINTA_PENDENTES_ORDEM.filter(function (k) { return tem[k] === true; });
}

// O dia (Lisboa) em que o ponto já pulsou: só pulsa a 1.ª vez em cada dia com pendentes. Só em memória. A pulsação
// dura uns segundos (QUINTA_SINAL_PULSAR_MS): os desenhos seguidos logo a seguir (ao entrar na Quinta o resumo
// desenha-se mais do que uma vez) não a cortam a meio.
const QUINTA_SINAL_PULSAR_MS = 3500;
let quintaSinalPulsouDia = null;
let quintaSinalPulsouEm = 0;
// O dia do último desenho (para redesenhar se o dia mudar com a app aberta).
let quintaSinalDia = null;

// A linha do sinal (#quinta-sinal, dentro do cabeçalho do cartão: tocar nela abre o cartão como hoje). Com o cartão
// aberto o CSS esconde-a (já se vê tudo); sem pendentes fica escondida e o cartão tem a altura de sempre.
function atualizarSinalQuinta() {
  const el = document.getElementById('quinta-sinal');
  if (!el) return;
  let lista = [];
  try { lista = quintaPendentes(); } catch (e) { lista = []; }
  let dia = null;
  try { dia = diaLisboaDeHoje(); } catch (e) { dia = null; }
  quintaSinalDia = dia;
  const atributo = function (k, v) { try { if (v === null) el.removeAttribute(k); else el.setAttribute(k, v); } catch (e) { /* elemento sem atributos */ } };
  const classe = function (c, ligada) { try { el.classList.toggle(c, ligada); } catch (e) { /* elemento sem classList */ } };
  if (!lista.length) { el.hidden = true; el.innerHTML = ''; atributo('aria-label', null); classe('pulsar', false); return; }
  const nomes = lista.map(function (k) { return t('quinta.sinal.' + k); });
  el.innerHTML = '<span class="quinta-sinal-ponto" aria-hidden="true"></span>' +
    '<span class="quinta-sinal-texto" aria-hidden="true">' + nomes[0] + (lista.length > 1 ? ' +' + (lista.length - 1) : '') + '</span>';
  atributo('aria-label', t('quinta.sinal.aria').replace('{lista}', nomes.join(', ')));
  const agora = Date.now();
  let pulsar = false;
  if (dia !== null && quintaSinalPulsouDia !== dia) { quintaSinalPulsouDia = dia; quintaSinalPulsouEm = agora; pulsar = true; }
  else if (dia !== null && agora - quintaSinalPulsouEm < QUINTA_SINAL_PULSAR_MS) pulsar = true;
  classe('pulsar', pulsar);
  el.hidden = false;
}

// Mudar de dia com a app aberta (ou voltar a ela): na Quinta, o sinal redesenha-se. Só lê o dia; não grava nada.
function quintaSinalVerDia() {
  try {
    const ativo = document.querySelector('.screen.active');
    if (!ativo || ativo.id !== 'screen-quinta') return;
    if (diaLisboaDeHoje() !== quintaSinalDia) atualizarResumoQuinta();
  } catch (e) { /* nada */ }
}
if (typeof setInterval === 'function') setInterval(quintaSinalVerDia, 60000);
if (typeof document !== 'undefined' && document && typeof document.addEventListener === 'function') {
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') quintaSinalVerDia(); });
}

// >>> mapa-botoes (scripts/verificar-fila-objetivo.js carrega só este bloco)
// Que botões da fila de cada ecrã (Vinha, Adega, Festa; ver construirFilaPastilhas em js/main.js) cada objetivo pede: os
// valores são o data-acao dos botões (botaoVinha, botaoAdega, botaoFesta). '*' = qualquer tarefa que se possa fazer (a Festa).
// proteger_vencer e explorar_descobrir não estão aqui: Proteger e Explorar não têm fila que deslize.
const OBJETIVO_BOTOES_POR_ECRA = {
  vinha: {
    vinha_cavar: ['cavar'], vinha_plantar: ['plantar'], vinha_ervas: ['ervas'], vinha_regar: ['regar'], vinha_adubar: ['adubar'],
    vinha_compostagem: ['compostagem'], vinha_colher: ['colher'],
    tempo_chuva: ['regar'], tempo_vento: ['repararEstacas'], tempo_frio: ['protegerFrio'], tempo_vigiar: ['vigiar']
  },
  garrafa: {
    adega_prensar: ['prensar'], adega_alambique: ['destilarVinho', 'destilarBagaco'], adega_fortificar: ['fortificar'],
    adega_engarrafar: ['engarrafar']
  },
  festa: { festa_tarefa: ['*'] }
};

// Só lê. Os objetivos de hoje ainda por cumprir que apontam para a fila deste ecrã, por ordem: [{ id, acoes }]. O dia ("AAAA-MM-DD",
// Lisboa) vem por argumento: objetivos de outro dia (jogo aberto a passar da meia-noite) não contam. Nada é gravado.
function objetivosBotoesDoEcra(estado, ecra, hoje) {
  const mapa = OBJETIVO_BOTOES_POR_ECRA[ecra];
  const o = estado && estado.objetivos;
  if (!mapa || !o || !Array.isArray(o.lista)) return [];
  if (diaLisboaPartes(hoje) === null || diaLisboaMudou(hoje, o.dia)) return [];
  const pedidos = [];
  o.lista.forEach(function (x) {
    if (!x || x.cumprido === true || !Object.prototype.hasOwnProperty.call(mapa, x.id)) return;
    pedidos.push({ id: x.id, acoes: mapa[x.id].slice() });
  });
  return pedidos;
}
// <<< mapa-botoes

// Gera os objetivos do dia logo ao abrir o jogo (não só ao entrar na
// Quinta), para uma ação feita antes de lá passar também contar.
garantirObjetivosDoDia();
