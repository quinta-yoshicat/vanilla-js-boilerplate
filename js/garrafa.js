// ---------------------------------------------------------------------
// A ADEGA — o processo real do Moscatel de Setúbal
//
//   Prensar (Uvas -> Gotas de Moscatel + Bagaço)
//     -> Alambique, 2 produtos (regras em js/alambique.js, mesmo cooldown):
//          Destilar vinho (10 Gotas -> Aguardente vínica) e Destilar bagaço (3 Bagaço -> Bagaceira)
//     -> Fortificar (100 Gotas + 1 Aguardente vínica -> um lote a descansar)
//     -> Cave (o lote descansa em tempo real; um lote de cada vez)
//     -> Engarrafar (+1 Garrafa, +Reputação conforme os dias de descanso)
//
// Prensar e Alambique podem ser usados livremente, mesmo com um lote a
// descansar na Cave — só juntam material para o lote seguinte.
// ---------------------------------------------------------------------

// ===================================================================
// REGRAS DO DESCANSO NA CAVE — "Opção A".
// Tudo o que rege o descanso está só aqui: para trocar para outra
// opção (ex: até 7 dias, com risco dos porcos), muda só este bloco —
// o resto do código nunca tem estes números espalhados.
// ===================================================================
// O «escalão» de descanso: 9 horas reais (antes era 1 dia de 24 h). Os escalões
// continuam a ser 1 a 4 e a ser o que fica gravado em diasDescanso (o nome do campo
// ficou o de sempre): 1 Jovem (9 h), 2 Dourado (18 h), 3 Âmbar (27 h), 4 ou mais
// Cobre (36 h). Toda a conta de tempo da Cave usa só esta constante.
const CAVE_ESCALAO_MS = 9 * 60 * 60 * 1000;

const REGRAS_DESCANSO_CAVE = {
  diasMinimos: 1, // em escalões (1 escalão = 9 h)
  // Ordenado por escalão crescente ("dias" = escalões de 9 h). Aplica-se o ÚLTIMO
  // cujo "dias" seja <= aos escalões de descanso (4 ou mais usa sempre os +60).
  reputacaoPorDias: [
    { dias: 1, reputacao: 30 },
    { dias: 2, reputacao: 40 },
    { dias: 3, reputacao: 50 },
    { dias: 4, reputacao: 60 }
  ],
  // No inverno o vinho descansa melhor.
  bonusInvernoReputacao: 10
};

function reputacaoDaCave(diasDescansados) {
  const tabela = REGRAS_DESCANSO_CAVE.reputacaoPorDias;
  let valor = 0;
  for (let i = 0; i < tabela.length; i++) {
    if (diasDescansados >= tabela[i].dias) valor = tabela[i].reputacao;
  }
  if (estacaoAtual() === 'inverno') valor += REGRAS_DESCANSO_CAVE.bonusInvernoReputacao;
  return valor;
}

// ---------------------------------------------------------------------
// COR DA GARRAFA — vem dos escalões de descanso (nada é gravado: lê-se o
// diasDescanso que já existe em state.adega.historico; 1 escalão = 9 h, antes 1 dia).
// 1 = Jovem, 2 = Dourado, 3 = Âmbar, 4 ou mais = Cobre. Valores em falta ou inválidos
// usam a Jovem. Reutilizável (ex.: pela prateleira da Coleção): devolve
// { imagem, nomeKey, dias }, com dias = null se o valor não era válido.
// ---------------------------------------------------------------------
const GARRAFAS_POR_DIAS = [
  { dias: 1, imagem: 'assets/garrafas/garrafa_1_jovem.jpg', nomeKey: 'adega.garrafaJovem' },
  { dias: 2, imagem: 'assets/garrafas/garrafa_2_dourado.jpg', nomeKey: 'adega.garrafaDourado' },
  { dias: 3, imagem: 'assets/garrafas/garrafa_3_ambar.jpg', nomeKey: 'adega.garrafaAmbar' },
  { dias: 4, imagem: 'assets/garrafas/garrafa_4_cobre.jpg', nomeKey: 'adega.garrafaCobre' }
];

function garrafaPorDias(dias) {
  const n = Number(dias);
  const valido = dias !== null && dias !== undefined && Number.isFinite(n) && n >= 1;
  const d = valido ? Math.floor(n) : null;
  let escolhida = GARRAFAS_POR_DIAS[0];
  if (valido) {
    GARRAFAS_POR_DIAS.forEach(function (g) { if (d >= g.dias) escolhida = g; });
  }
  return { imagem: escolhida.imagem, nomeKey: escolhida.nomeKey, dias: d };
}

// A legenda da garrafa é só o nome da cor («Âmbar»). Já não diz «3 dias»: os escalões
// são de 9 h e as garrafas antigas descansaram dias de 24 h, por isso só a cor é sempre verdade.
function garrafaLegenda(g) {
  return t(g.nomeKey);
}

// Garrafa acabada de engarrafar (só em memória): preenchida por
// executarAcaoAdega('engarrafar') e lida pela página da garrafa (ver
// renderEngarrafar() abaixo) para mostrar o resultado.
let adegaGarrafaFeita = null;
// true se o "ding" do objetivo do dia tocou na última ação da Adega: então o som de engarrafar (ficheiro) fica calado.
let adegaDingTocou = false;
// A encomenda entregue na última ação da Adega (ver encomendaEngarrafada em js/encomendas.js), ou null.
let adegaEncomendaEntregue = null;

// ---------------------------------------------------------------------
// ESTADO DO LOTE PARA A PÁGINA DA GARRAFA — função pura (não lê o
// state nem o relógio), por isso fácil de testar. Recebe os dias de
// descanso em escalões (fracionários, ver diasDescansadosNaCave()); valores
// negativos ou inválidos (ex.: relógio do aparelho errado) contam como 0.
// Devolve:
//   diasCompletos  escalões inteiros de descanso (o que fica gravado em diasDescanso)
//   atual          garrafaPorDias(diasCompletos), ou null antes do 1.º escalão (9 h)
//   proxima        { dias, imagem, nomeKey } da próxima cor, ou null na última (Cobre)
//   msAteProxima   milissegundos até à próxima cor (0 na última)
//   fracao         0 a 1, progresso entre a cor anterior e a próxima (1 na última)
// ---------------------------------------------------------------------
const DIA_MS = CAVE_ESCALAO_MS; // o «dia» da Cave é um escalão de 9 h (o nome ficou o de sempre)

function estadoGarrafaLote(diasDescanso) {
  const n = Number(diasDescanso);
  const dias = Number.isFinite(n) && n > 0 ? n : 0;
  const diasCompletos = Math.floor(dias);
  let proxima = null;
  let anterior = 0;
  for (let i = 0; i < GARRAFAS_POR_DIAS.length; i++) {
    if (GARRAFAS_POR_DIAS[i].dias > dias) { proxima = GARRAFAS_POR_DIAS[i]; break; }
    anterior = GARRAFAS_POR_DIAS[i].dias;
  }
  return {
    diasCompletos: diasCompletos,
    atual: diasCompletos >= 1 ? garrafaPorDias(diasCompletos) : null,
    proxima: proxima,
    msAteProxima: proxima ? Math.round((proxima.dias - dias) * DIA_MS) : 0,
    fracao: proxima ? (dias - anterior) / (proxima.dias - anterior) : 1
  };
}

// "5 h 20 min", "27 h", "12 min" — tempo real em horas e minutos (nunca em dias),
// arredondado para cima, para nunca mostrar "0 min" antes de a hora chegar.
function formatarFaltaGarrafa(ms) {
  const totalMin = Math.max(1, Math.ceil(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return h + ' h' + (m > 0 ? ' ' + m + ' min' : '');
  return m + ' min';
}

// Custos e produção de cada passo. O bagaço é feito para chegar à
// vontade: com o que o Prensar dá por cada uso, um jogador normal
// nunca fica preso à espera de bagaço para o Alambique.
const ADEGA_CUSTO_UVAS_PRENSAR = 10;
// Gotas que cada prensada dá (sorteio entre o mínimo e o máximo, os dois incluídos).
const ADEGA_GOTAS_PRENSAR_MIN = 12;
const ADEGA_GOTAS_PRENSAR_MAX = 18;
const ADEGA_CUSTO_GOTAS_FORTIFICAR = 100;
const ADEGA_CUSTO_AGUARDENTE_FORTIFICAR = 1;

const ADEGA_COOLDOWN_MS = {
  prensar: 2 * 60 * 60 * 1000,   // 2h
  alambique: 3 * 60 * 60 * 1000  // 3h
};

// Fotos de fundo de cada passo.
const ADEGA_FOTOS = {
  prensar: 'assets/vinha/prensar.jpg',
  destilarVinho: 'assets/ecras/alambique.jpg',
  destilarBagaco: 'assets/ecras/bagaco.jpg',
  fortificar: 'assets/vinha/mexer_mosto.jpg',
  cave: 'assets/ecras/cave_de_inverno.jpg',
  engarrafar: 'assets/vinha/engarrafar.jpg'
};

// Ponto de foco (background-position) para as fotos onde o corte
// automático ao centro tapava a cabeça do YoshiCat — só aspeto, a
// foto em si não muda. As que não estão aqui continuam ao centro.
const ADEGA_FOTO_POS = {};
ADEGA_FOTO_POS[ADEGA_FOTOS.prensar] = 'center 15%';
ADEGA_FOTO_POS[ADEGA_FOTOS.destilarVinho] = 'center 10%';
ADEGA_FOTO_POS[ADEGA_FOTOS.destilarBagaco] = 'center 10%';

// Os 2 botões do Alambique partilham o MESMO cooldown (state.adega.cooldowns.alambique).
const ADEGA_CHAVE_COOLDOWN = { destilarVinho: 'alambique', destilarBagaco: 'alambique' };

let adegaMensagemAtual = '';
let adegaNovaEntrada = null;
let adegaFotoAtual = null;

// Estado do cartão pequeno do topo (aberto/fechado) — só aspeto, mesmo
// padrão da Vinha (ver alternarCartaoVinha() em js/vinha.js).
let adegaCartaoAberto = false;

function alternarCartaoAdega() {
  adegaCartaoAberto = !adegaCartaoAberto;
  renderAdega();
}

// Ícones simples de traço para o Bagaço e a Aguardente (substituem os
// emojis 🟤 e 🥃).
const ADEGA_BAGACO_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><circle cx="9" cy="10" r="2.2"></circle><circle cx="15" cy="10" r="2.2"></circle><circle cx="12" cy="15.5" r="2.2"></circle></svg>';
const ADEGA_AGUARDENTE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M9.5 3h5"></path><path d="M10.5 3v6.5L5.8 18a2 2 0 0 0 1.7 3h9a2 2 0 0 0 1.7-3l-4.7-8.5V3"></path></svg>';

function preCarregarFotoAdega(chave) {
  if (ADEGA_FOTOS[chave]) new Image().src = ADEGA_FOTOS[chave];
}

// Para testar: acrescenta ?dias=3 ao endereço para simular que um lote
// já descansou 3 ESCALÕES (3 x 9 h = 27 h, Âmbar), em vez de esperares o tempo
// real. Aceita frações (?dias=0.5 = 4 h 30 min). Só se aplica
// quando já existe mesmo um lote a descansar (state.adega.lote).
function diasForcadosNoEndereco() {
  const valor = new URLSearchParams(location.search).get('dias');
  if (valor === null) return null;
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// Escalões de descanso do lote atual (pode ser fracionário, ex: 1.25 = 11 h 15 min).
// Conta a partir da hora gravada em state.adega.lote.iniciadoEm, por isso um lote
// que já estava a meio passa a ser contado em escalões de 9 h (só ganha).
function diasDescansadosNaCave() {
  if (!state.adega.lote) return 0;
  const forcado = diasForcadosNoEndereco();
  if (forcado !== null) return forcado;
  const agora = Date.now();
  return Math.max(0, agora - carimboCorrigirFuturo(state.adega.lote, 'iniciadoEm', agora)) / CAVE_ESCALAO_MS;
}

// Escalões (fracionários) em tempo real: "14h 5m", "36h", "45m" (horas e minutos, nunca dias).
function formatarDiasAdega(escaloesFracionarios) {
  const totalMin = Math.max(0, Math.round(escaloesFracionarios * CAVE_ESCALAO_MS / 60000));
  const horas = Math.floor(totalMin / 60);
  const minutos = totalMin % 60;
  if (horas > 0) return horas + 'h' + (minutos > 0 ? ' ' + minutos + 'm' : '');
  return minutos + 'm';
}

function tempoRestanteAdega(acao) {
  const agora = Date.now();
  const ultima = carimboCorrigirFuturo(state.adega.cooldowns, acao, agora);
  if (!ultima) return 0;
  const cd = ADEGA_COOLDOWN_MS[acao] || 0;
  return Math.max(0, cd - (agora - ultima));
}

// ---------------------------------------------------------------------
// CUIDAR DA CAVE — «Rodar as garrafas»: enquanto um lote descansa, uma rotação por escalão de 9 h (escalões 0 a 3, no
// máximo 4 por lote), cada uma dá CAVE_RODAR_GOTAS Gotas. Não muda o descanso, nem a cor, nem a Reputação do lote.
// Guarda-se só a hora da última rotação, em state.adega.cooldowns.rodar (o mapa de sempre, que já vai para a nuvem):
// já rodou neste escalão se rodar >= iniciadoEm + escalão × CAVE_ESCALAO_MS. Um lote novo tem outro iniciadoEm, por
// isso a rotação do lote anterior não conta; sem a chave, conta como «nunca rodou» (saves antigos).
// Relógio: as horas gravadas no futuro contam como «agora» (o mesmo cuidado de carimboCorrigirFuturo), por isso o
// relógio atrasado nunca dá uma rotação extra. Em modo de teste (visitaEmModoTeste: ?dias=, ...) não grava nem paga.
// ---------------------------------------------------------------------
const CAVE_RODAR_GOTAS = 4;
const CAVE_RODAR_ULTIMO_ESCALAO = 3;   // escalões 0, 1, 2 e 3: no máximo 4 rotações por lote

// Pode rodar agora? Só lê (não corrige nem grava nada). { ok, motivo, escalao, msAteProximo },
// motivo null | 'sem_lote' | 'ja_rodou' (msAteProximo: até ao escalão seguinte) | 'maximo'.
function caveRodarEstado(estado, agora) {
  const a = estado && estado.adega;
  const lote = a && typeof a === 'object' ? a.lote : null;
  const inicio = lote && typeof lote === 'object' ? Number(lote.iniciadoEm) : NaN;
  if (!Number.isFinite(inicio) || !Number.isFinite(agora)) return { ok: false, motivo: 'sem_lote', escalao: null, msAteProximo: 0 };
  const desde = Math.min(inicio, agora);
  const escalao = Math.floor((agora - desde) / CAVE_ESCALAO_MS);
  if (escalao > CAVE_RODAR_ULTIMO_ESCALAO) return { ok: false, motivo: 'maximo', escalao: escalao, msAteProximo: 0 };
  const cd = a.cooldowns && typeof a.cooldowns === 'object' ? Number(a.cooldowns.rodar) : NaN;
  const ultima = Number.isFinite(cd) ? Math.min(cd, agora) : null;
  if (ultima !== null && ultima >= desde + escalao * CAVE_ESCALAO_MS) {
    if (escalao >= CAVE_RODAR_ULTIMO_ESCALAO) return { ok: false, motivo: 'maximo', escalao: escalao, msAteProximo: 0 };
    return { ok: false, motivo: 'ja_rodou', escalao: escalao, msAteProximo: Math.max(0, desde + (escalao + 1) * CAVE_ESCALAO_MS - agora) };
  }
  return { ok: true, motivo: null, escalao: escalao, msAteProximo: 0 };
}

// O botão (só com lote): apagado diz porquê ao lado, como os outros (o relógio e o tempo, ou «já não precisa»).
function caveRodarBotaoHtml() {
  const p = caveRodarEstado(state, Date.now());
  if (p.motivo === 'sem_lote') return '';
  let sufixo = '';
  if (p.motivo === 'ja_rodou') sufixo = RELOGIO_PASTILHA_SVG + ' (' + formatarTempoVinha(p.msAteProximo) + ')';
  else if (p.motivo === 'maximo') sufixo = ' (' + t('adega.rodarJaNaoPrecisa') + ')';
  return botaoAdega('rodar', 'adega.btnRodar', !p.ok, sufixo, 'caveRodarClique()');
}

let caveRodarOcupado = false;

// O ÚNICO sítio que roda e grava. Toque duplo: o 2.º já encontra 'ja_rodou' e não paga. Em modo de teste só diz.
function caveRodarClique() {
  if (caveRodarOcupado) return;
  caveRodarOcupado = true;
  try {
    adegaFotoAtual = null;
    adegaNovaEntrada = null;
    adegaGarrafaFeita = null;
    adegaEncomendaEntregue = null;
    const agora = Date.now();
    // As horas gravadas «no futuro» (relógio atrasado, ou de outro aparelho) passam a agora, como na Cave de sempre.
    if (typeof carimboCorrigirFuturo === 'function' && state.adega) {
      carimboCorrigirFuturo(state.adega.lote, 'iniciadoEm', agora);
      carimboCorrigirFuturo(state.adega.cooldowns, 'rodar', agora);
    }
    const p = caveRodarEstado(state, agora);
    if (!p.ok) {
      adegaMensagemAtual = p.motivo === 'ja_rodou' ? t('adega.rodarJaRodou').replace('{tempo}', formatarTempoVinha(p.msAteProximo))
        : (p.motivo === 'maximo' ? t('adega.rodarMaximo') : '');
    } else if (typeof visitaEmModoTeste === 'function' && visitaEmModoTeste()) {
      adegaMensagemAtual = t('adega.rodarTeste');
    } else {
      if (!state.adega.cooldowns || typeof state.adega.cooldowns !== 'object') state.adega.cooldowns = {};
      state.adega.cooldowns.rodar = agora;
      state.gotas = (typeof state.gotas === 'number' && Number.isFinite(state.gotas) ? state.gotas : 0) + CAVE_RODAR_GOTAS;
      adegaMensagemAtual = t('adega.rodarOk').replace('{n}', CAVE_RODAR_GOTAS);
      adegaFotoAtual = ADEGA_FOTOS.cave;
      tocarSomDaAcao(SOM_ACAO_ADEGA.fortificar);
      saveState(state);
      updateStatsDisplays();
    }
  } finally {
    caveRodarOcupado = false;
  }
  renderAdega();
}

function registarCooldownAdega(acao) {
  state.adega.cooldowns[acao] = Date.now();
}

function renderGarrafaScreen() {
  adegaMensagemAtual = '';
  adegaNovaEntrada = null;
  adegaFotoAtual = null;
  adegaGarrafaFeita = null;
  adegaCartaoAberto = false;
  if (typeof somPodeTocar === 'function' && somPodeTocar() && typeof somCarregarFicheiro === 'function') somCarregarFicheiro(SOM_ADEGA_PRENSA.ficheiro);
  preCarregarFotoAdega('prensar');
  preCarregarFotoAdega('destilarVinho');
  preCarregarFotoAdega('destilarBagaco');
  renderAdega();
}

function botaoAdega(acao, i18nKey, bloqueado, sufixoExtra, aoClicar) {
  const restante = tempoRestanteAdega(ADEGA_CHAVE_COOLDOWN[acao] || acao);
  const emCooldown = restante > 0;
  const desabilitado = emCooldown || !!bloqueado;
  const sufixoCooldown = emCooldown ? (RELOGIO_PASTILHA_SVG + ' (' + formatarTempoVinha(restante) + ')') : (sufixoExtra || '');
  if (!desabilitado) preCarregarFotoAdega(acao);
  return '<button class="btn-pill" data-acao="' + acao + '" ' + (desabilitado ? 'disabled' : '') +
    ' onclick="' + (aoClicar || 'executarAcaoAdega(\'' + acao + '\')') + '">' +
    '<span data-i18n="' + i18nKey + '"></span><span class="cooldown-suffix">' + sufixoCooldown + '</span>' +
    '</button>';
}

// ---------------------------------------------------------------------
// CAVE DE RESERVA — vitrine só de leitura, aberta no Nível 5 (nada é
// gravado nem premiado). Mesmo teste que ecraDesbloqueado() em
// js/niveis.js: um jogador antigo (state.acesso.jogadorAntigo) tem tudo
// aberto. A Reserva Especial é a que a Fechadura do Proteger defende.
// ---------------------------------------------------------------------
const CAVE_RESERVA_NIVEL = 5;
const CAVE_RESERVA_FOTO = 'assets/vinha/barril_dourado.jpg';

function caveReservaAberta() {
  return !!state.acesso.jogadorAntigo || nivelPelaReputacao(state.reputacao) >= CAVE_RESERVA_NIVEL;
}

// Maior diasDescanso do histórico, ou null se não houver dados (nada inventado). Sem argumento lê o state do jogo;
// as funções puras de baixo passam o estado que querem ler.
function garrafaQueMaisDescansou(estado) {
  const e0 = estado === undefined ? state : estado;
  const h = e0 && e0.adega && e0.adega.historico;
  if (!Array.isArray(h)) return null;
  let maior = null;
  h.forEach(function (e) {
    const d = e && Number(e.diasDescanso);
    if (Number.isFinite(d) && d >= 1 && (maior === null || d > maior)) maior = d;
  });
  return maior === null ? null : Math.floor(maior);
}

// Imagem da garrafa para o resultado da Câmara: a da garrafa que mais descansou (a mesma regra da Reserva e do
// Proteger: garrafaQueMaisDescansou). Função pura que só lê: o estado vem por argumento, não grava nada. As garrafas de
// festa (0 dias) não contam. null se o jogador ainda não tem nenhuma garrafa com cor: quem chama deixa então o fundo como
// estava (nunca se inventa uma cor que o jogador não fez).
function garrafaImagemDaCamara(estado) {
  const dias = garrafaQueMaisDescansou(estado === undefined ? null : estado); // sem estado não lê o do jogo: null
  return dias === null ? null : garrafaPorDias(dias).imagem;
}

// Prateleira da Coleção (Nível 6) — só leitura, calculada a partir de
// state.adega.historico (nada é gravado). As garrafas de festa (Edição São
// Martinho) contam à parte; as outras, por dias de descanso: 1, 2, 3 ou mais.
// Entradas sem campos (garrafas antigas) são ignoradas.
const COLECAO_COR_POR_NOME = {
  'adega.garrafaJovem': 'jovem', 'adega.garrafaDourado': 'dourado',
  'adega.garrafaAmbar': 'ambar', 'adega.garrafaCobre': 'cobre'
};

function colecaoVisivel() {
  return !!state.acesso.jogadorAntigo || nivelPelaReputacao(state.reputacao) >= 6;
}

function contarColecao() {
  const h = state.adega && state.adega.historico;
  const c = { saoMartinho: 0, dias1: 0, dias2: 0, dias3: 0 };
  if (!Array.isArray(h)) return c;
  h.forEach(function (e) {
    if (!e || typeof e !== 'object') return;
    if (e.festa) { c.saoMartinho++; return; }
    const d = Number(e.diasDescanso);
    if (e.diasDescanso === null || e.diasDescanso === undefined || !Number.isFinite(d)) return;
    if (d === 1) c.dias1++;
    else if (d === 2) c.dias2++;
    else if (d >= 3) c.dias3++;
  });
  return c;
}

// Coleção do capítulo 6 (só leitura, sem ecrã): as garrafas feitas a partir
// do nível 6, isto é, do historico desde a posição guardada em
// state.niveis.garrafasAoNivel6. Vazia enquanto o campo for null.
function colecaoGarrafasNovas(estado) {
  const n = estado && estado.niveis ? estado.niveis.garrafasAoNivel6 : null;
  const h = estado && estado.adega && estado.adega.historico;
  if (typeof n !== 'number' || !Number.isFinite(n) || !Array.isArray(h)) return [];
  return h.slice(Math.max(0, n));
}

// Cores (jovem, dourado, ambar, cobre) já feitas entre essas garrafas, pelos
// dias de descanso (garrafaPorDias). Garrafas de festa (jeropiga) não contam.
function colecaoCoresFeitas(estado) {
  const cores = { jovem: false, dourado: false, ambar: false, cobre: false };
  const nomes = COLECAO_COR_POR_NOME;
  colecaoGarrafasNovas(estado).forEach(function (e) {
    if (!e || typeof e !== 'object' || e.festa) return;
    const g = garrafaPorDias(e.diasDescanso);
    if (g.dias === null) return; // sem dias válidos: não conta
    cores[nomes[g.nomeKey]] = true;
  });
  return cores;
}

// Quantas garrafas de cada cor já foram feitas, em TODO o state.adega.historico (não só desde o nível 6): cor pelos dias
// de descanso (garrafaPorDias: 1 Jovem, 2 Dourado, 3 Âmbar, 4 ou mais Cobre). A Edição São Martinho (festa: 'saomartinho')
// conta à parte. Entradas sem dias válidos (garrafas antigas) não contam. Só para mostrar no ecrã "A Coleção": o ✓, o
// "x / 4" e o capítulo 6 continuam a ler colecaoCoresFeitas(). Função pura que só lê (o estado vem por argumento).
function colecaoQuantidadesPorCor(estado) {
  const q = { jovem: 0, dourado: 0, ambar: 0, cobre: 0, saoMartinho: 0 };
  const h = estado && estado.adega && estado.adega.historico;
  if (!Array.isArray(h)) return q;
  h.forEach(function (e) {
    if (!e || typeof e !== 'object') return;
    if (e.festa) { if (e.festa === 'saomartinho') q.saoMartinho++; return; }
    const g = garrafaPorDias(e.diasDescanso);
    if (g.dias === null) return;
    q[COLECAO_COR_POR_NOME[g.nomeKey]]++;
  });
  return q;
}

// Imagem da garrafa para o fundo depois de "Arrumar a Coleção": a cor MAIS ESCURA entre as cores já feitas da Coleção
// (Jovem, Dourado, Âmbar, Cobre, por esta ordem), as mesmas do "x / 4" do ecrã: só contam as garrafas feitas desde o
// nível 6 (colecaoCoresFeitas), por isso o fundo bate sempre certo com a grelha. Função pura que só lê (o estado vem por
// argumento). null se não houver nenhuma cor: quem chama deixa o fundo como estava.
function colecaoImagemMaisEscura(estado) {
  const cores = colecaoCoresFeitas(estado);
  for (let i = GARRAFAS_POR_DIAS.length - 1; i >= 0; i--) {
    if (cores[COLECAO_COR_POR_NOME[GARRAFAS_POR_DIAS[i].nomeKey]]) return GARRAFAS_POR_DIAS[i].imagem;
  }
  return null;
}

// Botão de entrada no ecrã "A Coleção" (Nível 6): no cartão da Adega (Cave de Reserva).
function colecaoBotaoEntradaHtml() {
  if (!colecaoVisivel()) return '';
  return '<button type="button" class="btn-ghost colecao-entrada" onclick="goTo(\'colecao\')" data-i18n="colecao.btn"></button>';
}

// "x / 4" do ecrã e do cartão do Perfil: cores feitas desde o nível 6.
function colecaoResumo() {
  const cores = colecaoCoresFeitas(state);
  return GARRAFAS_POR_DIAS.filter(function (g) { return cores[COLECAO_COR_POR_NOME[g.nomeKey]]; }).length + ' / ' + GARRAFAS_POR_DIAS.length;
}

// Ecrã "A Coleção" (só leitura, Nível 6; ver ecraDesbloqueado('colecao') em js/niveis.js):
// grelha 2x2 com as 4 cores; as que ainda não foram feitas aparecem apagadas. Debaixo do nome, «×N» = todas as
// garrafas dessa cor (colecaoQuantidadesPorCor); a Edição São Martinho só aparece, no topo, se houver alguma.
// Ao entrar no ecrã (ver goTo() em js/main.js): esquece o resultado da arrumação anterior.
function renderColecao() {
  if (typeof colecaoResultado !== 'undefined') colecaoResultado = null;
  // A Prova às cegas (js/prova-jogo.js): uma prova acabada (ou de outro dia) esquece-se; uma a meio retoma-se.
  if (typeof provaAoEntrarNaColecao === 'function') provaAoEntrarNaColecao();
  renderColecaoDesenhar();
}

function renderColecaoDesenhar() {
  const container = document.getElementById('colecao-container');
  const cores = colecaoCoresFeitas(state);
  const quantidades = colecaoQuantidadesPorCor(state);
  const celulas = GARRAFAS_POR_DIAS.map(function (g) {
    const cor = COLECAO_COR_POR_NOME[g.nomeKey];
    const feita = !!cores[cor];
    return '<div class="colecao-cor' + (feita ? '' : ' por-fazer') + '">' +
      '<img src="' + g.imagem + '" alt="" decoding="async">' +
      '<p class="colecao-nome"><span>' + t(g.nomeKey) + '</span>' + (feita ? '<span class="colecao-visto" aria-hidden="true">✓</span>' : '') + '</p>' +
      '<p class="colecao-quantidade">' + t('colecao.quantidade').replace('{n}', quantidades[cor]) + '</p>' +
    '</div>';
  }).join('');
  // A Prova às cegas (js/prova-jogo.js): o botão por cima de «Arrumar a Coleção» ou, a decorrer, a prova no painel todo.
  const provaAtiva = typeof provaEmCurso === 'function' && provaEmCurso();
  const provaHtml = typeof provaColecaoHtml === 'function' ? provaColecaoHtml() : '';
  const provaLugar = typeof provaOcupaLugar === 'function' && provaOcupaLugar();
  const saoMartinhoHtml = quantidades.saoMartinho > 0
    ? ' <span class="colecao-sao-martinho">· ' + t('colecao.saoMartinho').replace('{n}', quantidades.saoMartinho) + '</span>'
    : '';

  container.innerHTML =
    '<div class="topcard">' +
      '<p class="mini-title" data-i18n="colecao.title"></p>' +
      '<p class="mini-sub">' + colecaoResumo() + saoMartinhoHtml + '</p>' +
    '</div>' +
    '<div class="colecao-painel' + (provaLugar ? ' com-prova' : '') + '">' + celulas + '</div>' +
    '<div class="action-panel' + (provaAtiva ? ' prova-a-decorrer' : '') + '">' +
      provaHtml +
      // Tarefa do dia "Arrumar a Coleção" (nível 6; ver js/reserva.js), por cima do "Voltar" (escondida durante a prova)
      (!provaAtiva && typeof colecaoTarefaBotaoHtml === 'function' ? colecaoTarefaBotaoHtml() : '') +
      '<button type="button" class="btn-pill pill-main pill-grande" onclick="voltarEcraAnterior()" data-i18n="nav.voltar"></button>' +
    '</div>';

  // Depois de arrumar: a garrafa de fundo e o agradecimento (ver colecaoArrumarClique() em js/reserva.js).
  if (typeof colecaoResultado !== 'undefined' && colecaoResultado && !provaAtiva) {
    const imagem = colecaoImagemMaisEscura(state); // a cor mais escura da Coleção; sem nenhuma, o fundo fica como estava
    if (imagem) definirFundo('foto', imagem);
    atualizarDialogo(t('colecao.arrumarOk').replace('{rep}', colecaoResultado.rep), 'YoshiCat');
  } else {
    atualizarDialogo('', '');
  }
  applyTranslations();
}

function reservaHtml() {
  if (!caveReservaAberta()) return '';
  const dias = state.garrafas > 0 ? garrafaQueMaisDescansou() : null;
  let linha = '';
  if (state.garrafas <= 0) {
    linha = '<p class="phase-progress" data-i18n="perfil.semGarrafas"></p>';
  } else if (dias !== null) {
    // Diz a cor (a verdade para todas as garrafas, antigas e novas), não os «dias».
    linha = '<p class="phase-progress">' +
      t(dias === 1 ? 'adega.reservaMaisDescansouUm' : 'adega.reservaMaisDescansou').replace('{cor}', t(garrafaPorDias(dias).nomeKey)) + '</p>';
  }
  // Com garrafas feitas, a foto é a da que mais descansou (mesma classe e tamanho
  // do barril; o ponto de foco desce para o rótulo, nas fotos de 512x512); sem
  // nenhuma, fica o barril de sempre.
  const g = dias !== null ? garrafaPorDias(dias) : null;
  const fotoHtml = g
    ? '<img class="reserva-foto" src="' + g.imagem + '" alt="' + garrafaLegenda(g) + '" style="object-position: center 69%">'
    : '<img class="reserva-foto" src="' + CAVE_RESERVA_FOTO + '" alt="">';
  return '<div class="reserva-bloco">' +
    fotoHtml +
    colecaoBotaoEntradaHtml() +
    // Tarefa do dia "Visitar a Reserva" (nível 5; ver js/reserva.js): o botão logo a seguir, o texto no fim
    (typeof reservaBotaoHtml === 'function' ? reservaBotaoHtml() : '') +
    '<p class="mini-bloco-titulo" data-i18n="adega.reservaTitulo"></p>' +
    '<p class="phase-desc" data-i18n="adega.reservaTexto1"></p>' +
    '<p class="phase-desc" data-i18n="adega.reservaTexto2"></p>' +
    linha +
    (typeof reservaDescHtml === 'function' ? reservaDescHtml() : '') +
  '</div>';
}

function renderAdega() {
  const container = document.getElementById('garrafa-container');
  alambiqueEstado(state); // repara state.adega.bagaceira em memória (campo novo)
  const a = state.adega;
  const temLote = !!a.lote;

  let botoesHtml = '';
  botoesHtml += botaoAdega('prensar', 'adega.btnPrensar', state.uvas < ADEGA_CUSTO_UVAS_PRENSAR);
  botoesHtml += botaoAdega('destilarVinho', 'adega.btnDestilarVinho', state.gotas < ALAMBIQUE_CONFIG.gotasVinho);
  botoesHtml += botaoAdega('destilarBagaco', 'adega.btnDestilarBagaco', a.bagaco < ALAMBIQUE_CONFIG.bagacoBagaceira);

  let corpoHtml = '';
  if (temLote) {
    const dias = diasDescansadosNaCave();
    const diasCompletos = Math.floor(dias);
    const pronto = diasCompletos >= REGRAS_DESCANSO_CAVE.diasMinimos;
    const repPrevista = reputacaoDaCave(diasCompletos);
    // Ainda a descansar: o botão só abre a página do lote, por isso diz "Ver o lote (falta 14h)".
    const sufixoEngarrafar = pronto ? '' : (' (' + t('adega.loteFalta').replace('{tempo}', formatarDiasAdega(REGRAS_DESCANSO_CAVE.diasMinimos - dias)) + ')');

    if (adegaCartaoAberto) {
      corpoHtml = '<div class="cartao-corpo">' +
        '<p class="phase-desc" data-i18n="garrafa.passo3"></p>' +
        '<p class="phase-progress">' + t('adega.caveDescansado').replace('{tempo}', formatarDiasAdega(dias)) + '</p>' +
        '<p class="phase-progress">' + t('adega.caveReputacaoPrevista').replace('{valor}', repPrevista) + '</p>' +
        reservaHtml() +
      '</div>';
    }
    // Sempre tocável: abre a página da garrafa (a espera trata-se lá).
    botoesHtml += botaoAdega('engarrafar', pronto ? 'adega.btnEngarrafar' : 'adega.btnVerLote', false, sufixoEngarrafar, "goTo('engarrafar')");
    // Cuidar da Cave: «Rodar as garrafas» (só com lote; ver caveRodarEstado).
    botoesHtml += caveRodarBotaoHtml();
  } else {
    if (adegaCartaoAberto) {
      corpoHtml = '<div class="cartao-corpo"><p class="phase-desc" data-i18n="garrafa.descricao"></p>' + reservaHtml() + '</div>';
    }
    botoesHtml += botaoAdega('fortificar', 'adega.btnFortificar',
      state.gotas < ADEGA_CUSTO_GOTAS_FORTIFICAR || a.aguardente < ADEGA_CUSTO_AGUARDENTE_FORTIFICAR);
  }

  const cartaoHtml =
    '<div class="topcard' + (adegaCartaoAberto ? ' aberto' : '') + '">' +
      '<button type="button" class="topcard-header" onclick="alternarCartaoAdega()" aria-expanded="' + adegaCartaoAberto + '">' +
        '<span class="cartao-textos">' +
          '<span class="mini-title" data-i18n="garrafa.title"></span>' +
          '<span class="chrome-mini-stats">' +
            '<span class="resource-item">' + ADEGA_BAGACO_SVG + ' <span data-i18n="adega.recursoBagaco"></span> ' + a.bagaco + '</span>' +
            '<span class="resource-item">' + ADEGA_AGUARDENTE_SVG + ' <span data-i18n="adega.recursoAguardente"></span> ' + a.aguardente + '</span>' +
            '<span class="resource-item">' + ADEGA_AGUARDENTE_SVG + ' <span data-i18n="adega.recursoBagaceira"></span> ' + a.bagaceira + '</span>' +
          '</span>' +
        '</span>' +
        '<svg class="cartao-seta" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M6 9l6 6 6-6"></path></svg>' +
      '</button>' +
      corpoHtml +
    '</div>';

  container.innerHTML =
    cartaoHtml +
    construirFilaPastilhas('adega-pill-scroll', botoesHtml, 'vinha.verMaisTarefas');

  const fotoFundoAdega = adegaFotoAtual || (temLote ? ADEGA_FOTOS.cave : ADEGA_FOTOS.prensar);
  definirFundo('foto', fotoFundoAdega, ADEGA_FOTO_POS[fotoFundoAdega]);

  marcarPastilhaPrincipal(container);
  configurarFilaPastilhas('adega-pill-scroll');
  mostrarNovaEntrada(adegaNovaEntrada);
  atualizarDialogo(adegaMensagemAtual, 'YoshiCat');
  applyTranslations();
}

// Som de cada ação da Adega: nome de efeito de SOM_EFEITOS (js/som.js) ou ficheiro real {ficheiro, volume}.
// Só «Prensar» (esmagar uvas) usa o ficheiro; «Fortificar» (aguardente no mosto) mantém o efeito de sempre.
const SOM_ADEGA_PRENSA = { ficheiro: 'assets/sons/prensa.mp3', volume: 0.7 };
const SOM_ACAO_ADEGA = { prensar: SOM_ADEGA_PRENSA, destilarVinho: 'regar', destilarBagaco: 'regar', fortificar: 'prensar' };

function executarAcaoAdega(acao) {
  adegaFotoAtual = null;
  adegaNovaEntrada = null;
  adegaGarrafaFeita = null;
  adegaEncomendaEntregue = null;
  alambiqueEstado(state);
  const a = state.adega;
  const chaveCooldown = ADEGA_CHAVE_COOLDOWN[acao] || acao;

  if (tempoRestanteAdega(chaveCooldown) > 0) {
    adegaMensagemAtual = t('vinha.msgCooldown').replace('{tempo}', formatarTempoVinha(tempoRestanteAdega(chaveCooldown)));
    renderAdega();
    return;
  }

  if (acao === 'prensar') {
    if (state.uvas < ADEGA_CUSTO_UVAS_PRENSAR) {
      adegaMensagemAtual = t('adega.msgFaltaUvasPrensar').replace('{n}', ADEGA_CUSTO_UVAS_PRENSAR);
      renderAdega();
      return;
    }
    state.uvas -= ADEGA_CUSTO_UVAS_PRENSAR;
    const gotasGanhas = randInt(ADEGA_GOTAS_PRENSAR_MIN, ADEGA_GOTAS_PRENSAR_MAX);
    const bagacoGanho = randInt(2, 4);
    state.gotas += gotasGanhas;
    a.bagaco += bagacoGanho;
    registarCooldownAdega('prensar');
    adegaMensagemAtual = t('garrafa.passo1') + ' ' +
      t('adega.resultadoPrensar').replace('{gotas}', gotasGanhas).replace('{bagaco}', bagacoGanho);
    adegaFotoAtual = ADEGA_FOTOS.prensar;
  } else if (acao === 'destilarVinho' || acao === 'destilarBagaco') {
    // As regras (custos, produto, cooldown partilhado) estão em js/alambique.js; aqui só se mostra e se grava (mais abaixo).
    const r = alambiqueDestilar(state, acao === 'destilarVinho' ? 'vinho' : 'bagaco', Date.now(), ADEGA_COOLDOWN_MS.alambique);
    if (!r.ok) {
      if (r.motivo === 'faltam_gotas') adegaMensagemAtual = t('adega.msgFaltaGotasDestilar').replace('{n}', ALAMBIQUE_CONFIG.gotasVinho);
      else if (r.motivo === 'faltam_bagaco') adegaMensagemAtual = t('adega.msgFaltaBagacoAlambique').replace('{n}', ALAMBIQUE_CONFIG.bagacoBagaceira);
      else if (r.motivo === 'cooldown') adegaMensagemAtual = t('vinha.msgCooldown').replace('{tempo}', formatarTempoVinha(r.restanteMs));
      else return;
      renderAdega();
      return;
    }
    if (r.produto === 'vinica') {
      adegaMensagemAtual = t('adega.flavorDestilarVinho') + ' ' + t('adega.resultadoDestilarVinho');
      adegaFotoAtual = ADEGA_FOTOS.destilarVinho;
    } else {
      adegaMensagemAtual = t('adega.flavorDestilarBagaco') + ' ' + t('adega.resultadoDestilarBagaco');
      adegaNovaEntrada = desbloquearEntradaEnciclopedia('bagacoAlambique'); // só o bagaço (a que fala da vínica abre no Fortificar)
      adegaFotoAtual = ADEGA_FOTOS.destilarBagaco;
    }
  } else if (acao === 'fortificar') {
    if (a.lote) {
      adegaMensagemAtual = t('adega.msgJaHaLote');
      renderAdega();
      return;
    }
    if (state.gotas < ADEGA_CUSTO_GOTAS_FORTIFICAR || a.aguardente < ADEGA_CUSTO_AGUARDENTE_FORTIFICAR) {
      adegaMensagemAtual = t('adega.msgFaltaFortificar');
      renderAdega();
      return;
    }
    state.gotas -= ADEGA_CUSTO_GOTAS_FORTIFICAR;
    a.aguardente -= ADEGA_CUSTO_AGUARDENTE_FORTIFICAR;
    a.lote = { iniciadoEm: Date.now() };
    adegaMensagemAtual = t('garrafa.passo2') + ' ' + t('adega.resultadoFortificar');
    adegaNovaEntrada = desbloquearEntradaEnciclopedia('aguardenteAdega');
    adegaFotoAtual = ADEGA_FOTOS.fortificar;
  } else if (acao === 'engarrafar') {
    if (!a.lote) return;
    const diasCompletos = Math.floor(diasDescansadosNaCave());
    if (diasCompletos < REGRAS_DESCANSO_CAVE.diasMinimos) {
      adegaMensagemAtual = t('adega.msgAindaNaoPode').replace('{tempo}', formatarDiasAdega(REGRAS_DESCANSO_CAVE.diasMinimos));
      renderAdega();
      return;
    }
    const repGanha = reputacaoDaCave(diasCompletos);
    state.garrafas += 1;
    state.reputacao += repGanha;
    // Se esta garrafa fez chegar ao nível 6, ela já conta para a Coleção:
    // guarda-se o tamanho ANTES de entrar (ver carimbarGarrafasAoNivel6, js/niveis.js).
    if (nivelPelaReputacao(state.reputacao) >= 6) carimbarGarrafasAoNivel6(a.historico.length);
    state.ultimaGarrafaData = new Date().toLocaleDateString(localeAtual());
    a.historico.push({ data: state.ultimaGarrafaData, estacao: estacaoAtual(), diasDescanso: diasCompletos });
    // Encomenda da visita (js/encomendas.js): se esta garrafa cumpre a ativa, paga UMA vez (grava-se com o resto, mais
    // abaixo). A garrafa não se gasta. Em modo de teste não paga. Só aqui: a jeropiga (js/festas.js) não chama.
    if (typeof encomendaEngarrafada === 'function') {
      const modoTeste = typeof visitaEmModoTeste === 'function' && visitaEmModoTeste();
      const entrega = encomendaEngarrafada(state, encomendaDiaDeHoje(), a.historico.length - 1, modoTeste);
      if (entrega.ok) {
        adegaEncomendaEntregue = entrega;
        encomendaResultado = { dia: encomendaDiaDeHoje(), tipo: 'entregue', personagem: entrega.personagem, premio: entrega.premio };
        // O prémio também pode fazer chegar ao nível 6: então esta garrafa já conta para a Coleção (como acima).
        if (nivelPelaReputacao(state.reputacao) >= 6) carimbarGarrafasAoNivel6(a.historico.length - 1);
      }
    }
    a.lote = null;
    adegaGarrafaFeita = garrafaPorDias(diasCompletos);
    adegaMensagemAtual = t('garrafa.passo4') + ' ' + t('adega.resultadoEngarrafar').replace('{rep}', repGanha) +
      (adegaEncomendaEntregue ? ' ' + encomendaEntregueTexto(adegaEncomendaEntregue) : '');
    adegaNovaEntrada = desbloquearEntradaEnciclopedia('curtimenta');
    adegaFotoAtual = ADEGA_FOTOS.engarrafar;
  } else {
    return;
  }

  // Um só som: o "ding" do objetivo do dia, se vai tocar, ou o da ação (ver SOM_ACAO_ADEGA). Engarrafar tem o seu (ficheiro).
  const dingAdega = typeof marcarObjetivoCumprido === 'function' && marcarObjetivoCumprido(acao === 'destilarVinho' || acao === 'destilarBagaco' ? 'adega_alambique' : 'adega_' + acao) === true;
  adegaDingTocou = dingAdega;
  if (!dingAdega && SOM_ACAO_ADEGA[acao]) tocarSomDaAcao(SOM_ACAO_ADEGA[acao]);
  // Encomenda entregue: o mesmo som da oferta da bagaceira, em vez do ficheiro do engarrafar (nunca dois sons juntos).
  if (adegaEncomendaEntregue && !dingAdega) { tocarSom('objetivoCumprido'); adegaDingTocou = true; }
  saveState(state);
  updateStatsDisplays();
  renderAdega();
}

// Opacidade (0 a 1) da foto da cor SEGUINTE por cima da atual: igual à
// fração da barra. Sem foto atual (antes de 1 dia) ou sem seguinte (a
// Cobre, última) não há fusão: 0. Função pura, recebe o resultado de
// estadoGarrafaLote().
function opacidadeFusaoGarrafa(est) {
  if (!est || !est.atual || !est.proxima) return 0;
  const f = Number(est.fracao);
  return Number.isFinite(f) ? Math.min(1, Math.max(0, f)) : 0;
}

// Onde fica o CORPO da garrafa em cada foto (caixa em % da imagem, medida
// nos píxeis das 4 fotos de 512x512: esq/dir = bordas do vidro, topo = a
// superfície do líquido, base = fundo da garrafa; rotulo = faixa vertical
// do rótulo, lida à vista numa grelha de 10%, igual nas 4 fotos). As 4 fotos
// têm a mesma composição (diferença de 1 px). Foto que não esteja aqui usa o
// valor seguro.
const GARRAFAS_CORPO = {
  'assets/garrafas/garrafa_1_jovem.jpg':   { esq: 40.0, dir: 57.6, topo: 39.8, base: 89.4, rotulo: [49.5, 81] },
  'assets/garrafas/garrafa_2_dourado.jpg': { esq: 40.0, dir: 57.2, topo: 39.8, base: 89.6, rotulo: [49.5, 81] },
  'assets/garrafas/garrafa_3_ambar.jpg':   { esq: 40.2, dir: 57.4, topo: 39.8, base: 89.3, rotulo: [49.5, 81] },
  'assets/garrafas/garrafa_4_cobre.jpg':   { esq: 40.2, dir: 57.4, topo: 39.8, base: 89.5, rotulo: [49.5, 81] }
};
const GARRAFA_CORPO_SEGURO = { esq: 41, dir: 57, topo: 41, base: 88, rotulo: [50, 81] };

// 7 bolhas pequenas: x = posição dentro do corpo (%), s = tamanho (% da
// largura do corpo), d = segundos por subida, a = atraso inicial (s, negativo
// no CSS para já irem a meio caminho). Só aspeto, fixas (sem aleatório).
const GARRAFA_BOLHAS = [
  { x: 16, s: 12, d: 9, a: 0 },   { x: 44, s: 14, d: 11, a: 2.5 }, { x: 76, s: 10, d: 8, a: 5 },
  { x: 30, s: 13, d: 12, a: 7 },  { x: 60, s: 12, d: 10, a: 1 },   { x: 86, s: 10, d: 9.5, a: 4 },
  { x: 50, s: 9, d: 13, a: 8.5 }
];

function bolhasGarrafaHtml(imagem) {
  const c = GARRAFAS_CORPO[imagem] || GARRAFA_CORPO_SEGURO;
  // Um pouco para dentro do vidro e abaixo da superfície do líquido. O
  // rótulo fica À FRENTE do líquido, por isso uma máscara esconde as bolhas
  // enquanto passam atrás dele (aparecem por cima e por baixo do rótulo).
  const topo = c.topo + 3;
  const altura = c.base - c.topo - 4.5;
  const a = Math.max(0, Math.min(100, (c.rotulo[0] - topo) / altura * 100)).toFixed(1);
  const b = Math.max(0, Math.min(100, (c.rotulo[1] - topo) / altura * 100)).toFixed(1);
  const mascara = 'linear-gradient(to bottom,#000 0,#000 ' + a + '%,transparent ' + a + '%,transparent ' + b + '%,#000 ' + b + '%,#000 100%)';
  const caixa = 'left:' + (c.esq + 2) + '%;top:' + topo + '%;width:' + (c.dir - c.esq - 4.5) + '%;height:' + altura + '%;' +
    '-webkit-mask-image:' + mascara + ';mask-image:' + mascara;
  return '<div class="garrafa-bolhas" style="' + caixa + '" aria-hidden="true">' +
    GARRAFA_BOLHAS.map(function (b) {
      return '<span class="bolha" style="left:' + b.x + '%;--s:' + b.s + ';animation-duration:' + b.d + 's;animation-delay:-' + b.a + 's"></span>';
    }).join('') +
  '</div>';
}

// ---------------------------------------------------------------------
// PÁGINA DA GARRAFA (ecrã "engarrafar", aberto pelo botão Engarrafar da
// Adega quando há lote). Mostra a garrafa com a cor do dia, a barra até
// à cor seguinte e a Reputação prevista; "Engarrafar agora" só está
// ativo a partir de 1 dia e chama a lógica que já existe
// (executarAcaoAdega('engarrafar')). O resultado aparece nesta página.
// Sem estado novo: tudo se calcula a partir de state.adega.lote.
// ---------------------------------------------------------------------
const ENGARRAFAR_RELOGIO_MS = 30 * 1000;

// Sons da página (ver js/som.js). O ambiente (borbulhar de fermentação)
// só começa quando já há foto (1 dia ou mais), entra e sai em fundo, e é
// bem mais baixo do que a chuva; o som de engarrafar (vinho a cair + tilintar)
// é pedido ao abrir a página, para não haver atraso no toque.
const GARRAFA_SOM_AMBIENTE = 'assets/sons/garrafa_ambiente.mp3';
const GARRAFA_SOM_ENGARRAFAR = 'assets/sons/garrafa_engarrafar.mp3';
const GARRAFA_AMBIENTE_VOLUME = 0.2;
const GARRAFA_AMBIENTE_FADE = { entrarS: 1.2, sairS: 0.8 };
const GARRAFA_ENGARRAFAR_VOLUME = 0.7;
let engarrafarTimerId = null;
let engarrafarResultado = null;   // { garrafa, rep } depois de engarrafar, senão null
let engarrafarDiasMostrados = -1; // diasCompletos desenhados, para saber quando redesenhar

// Pára sempre que se sai do ecrã (ver LIMPEZA_AO_SAIR_POR_ECRA, em
// js/main.js) e quando a app fica escondida (ver visibilitychange abaixo).
function pararRelogioEngarrafar() {
  if (engarrafarTimerId) {
    clearInterval(engarrafarTimerId);
    engarrafarTimerId = null;
  }
  marcarBolhasEngarrafar(false);
}

function iniciarRelogioEngarrafar() {
  pararRelogioEngarrafar();
  engarrafarTimerId = setInterval(atualizarEngarrafar, ENGARRAFAR_RELOGIO_MS);
  marcarBolhasEngarrafar(true);
}

// As bolhas só correm enquanto o relógio corre (página aberta e app
// visível): "viva" liga o animation-play-state no CSS.
function marcarBolhasEngarrafar(ligadas) {
  const painel = document.querySelector('#engarrafar-container .garrafa-pagina');
  if (painel) painel.classList.toggle('viva', !!ligadas);
}

// A foto e o resto têm de caber sem barra de deslizar: o CSS precisa da
// altura do painel de botões (que varia) para saber a altura que sobra.
function ajustarAlturaEngarrafar() {
  const painel = document.querySelector('#engarrafar-container .garrafa-pagina');
  const acao = document.querySelector('#engarrafar-container .action-panel');
  if (painel && acao) painel.style.setProperty('--engarrafar-acao', Math.ceil(acao.getBoundingClientRect().height) + 'px');
}
window.addEventListener('resize', function () { if (engarrafarEcraAtivo()) ajustarAlturaEngarrafar(); });

function engarrafarEcraAtivo() {
  const ecra = document.getElementById('screen-engarrafar');
  return !!ecra && ecra.classList.contains('active');
}

function enterEngarrafar() {
  engarrafarResultado = null;
  if (!state.adega.lote) {
    // Sem lote não há nada a mostrar aqui.
    goTo('garrafa', { semHistorico: true });
    return;
  }
  renderEngarrafar();
  iniciarRelogioEngarrafar();
  iniciarAmbienteEngarrafar();
  // Com "Som" ligado e o áudio já desbloqueado, pede já o som de engarrafar.
  if (typeof somPodeTocar === 'function' && somPodeTocar()) somCarregarFicheiro(GARRAFA_SOM_ENGARRAFAR);
}

// Ambiente só com foto (1 escalão, 9 h, ou mais). Idempotente: chamar outra vez (ex.:
// ao mudar de dia com a página aberta) não o reinicia. Pára em goTo() ao
// sair, e em engarrafarAgora().
function iniciarAmbienteEngarrafar() {
  if (typeof iniciarSomAmbiente !== 'function') return;
  if (!estadoGarrafaLote(diasDescansadosNaCave()).atual) return;
  iniciarSomAmbiente(GARRAFA_SOM_AMBIENTE, GARRAFA_AMBIENTE_VOLUME, GARRAFA_AMBIENTE_FADE);
}

function textoProximaCorGarrafa(est) {
  if (!est.proxima) return t('adega.paginaUltimaCor');
  return t('adega.paginaProxima')
    .replace('{nome}', t(est.proxima.nomeKey))
    .replace('{tempo}', formatarFaltaGarrafa(est.msAteProxima));
}

function sufixoFaltaEngarrafar(dias) {
  const ms = Math.round((REGRAS_DESCANSO_CAVE.diasMinimos - dias) * DIA_MS);
  return ms > 0 ? ' ' + t('adega.paginaFaltaSufixo').replace('{tempo}', formatarFaltaGarrafa(ms)) : '';
}

function renderEngarrafar() {
  const container = document.getElementById('engarrafar-container');
  if (!container) return;
  let corpoHtml = '';
  let botoesHtml = '';
  let fundo = ADEGA_FOTOS.cave;

  if (engarrafarResultado) {
    fundo = ADEGA_FOTOS.engarrafar;
    corpoHtml =
      garrafaGrandeHtml(engarrafarResultado.garrafa, null) +
      '<p class="phase-desc">' + t('garrafa.passo4') + '</p>' +
      '<p class="phase-progress">' + t('adega.resultadoEngarrafar').replace('{rep}', engarrafarResultado.rep) + '</p>' +
      (engarrafarResultado.encomenda && typeof encomendaEntregueHtml === 'function' ? encomendaEntregueHtml(engarrafarResultado.encomenda) : '');
    botoesHtml = '<button type="button" class="btn-pill pill-main pill-grande" onclick="voltarEcraAnterior()" data-i18n="nav.voltar"></button>';
  } else {
    const dias = diasDescansadosNaCave();
    const est = estadoGarrafaLote(dias);
    const pronto = est.diasCompletos >= REGRAS_DESCANSO_CAVE.diasMinimos;
    engarrafarDiasMostrados = est.diasCompletos;
    corpoHtml =
      (est.atual ? garrafaGrandeHtml(est.atual, est) : '<p class="phase-desc">' + t('adega.paginaAindaDescansa').replace('{tempo}', formatarDiasAdega(REGRAS_DESCANSO_CAVE.diasMinimos)) + '</p>') +
      '<div class="nivel-barra"><div class="nivel-barra-cheio" id="engarrafar-barra" style="width:' + Math.round(est.fracao * 100) + '%"></div></div>' +
      '<p class="phase-progress" id="engarrafar-proxima">' + textoProximaCorGarrafa(est) + '</p>' +
      (pronto ? '<p class="phase-progress">' + t('adega.caveReputacaoPrevista').replace('{valor}', reputacaoDaCave(est.diasCompletos)) + '</p>' : '');
    botoesHtml =
      '<button type="button" class="btn-pill pill-main pill-grande" id="engarrafar-agora" data-sem-vibracao ' + (pronto ? '' : 'disabled ') + 'onclick="engarrafarAgora()">' +
        '<span data-i18n="adega.paginaBtnAgora"></span><span class="cooldown-suffix" id="engarrafar-falta">' + (pronto ? '' : sufixoFaltaEngarrafar(dias)) + '</span>' +
      '</button>' +
      '<button type="button" class="btn-pill" onclick="voltarEcraAnterior()" data-i18n="nav.voltar"></button>';
  }

  container.innerHTML =
    '<div class="topcard"><p class="mini-title" data-i18n="adega.paginaTitulo"></p></div>' +
    '<div class="scroll-panel garrafa-pagina' + (engarrafarResultado ? ' resultado' : '') + (engarrafarTimerId ? ' viva' : '') + '">' + corpoHtml + '</div>' +
    '<div class="action-panel">' + botoesHtml + '</div>';

  definirFundo('foto', fundo, ADEGA_FOTO_POS[fundo]);
  applyTranslations();
  ajustarAlturaEngarrafar();
  reposicionarFlutuantes();
}

// est (resultado de estadoGarrafaLote) só vem na página do lote: com ele a
// foto da cor seguinte (se existir) funde-se por cima e há bolhas. A foto
// seguinte só entra na página aqui, quando existe, por isso nada é
// pré-carregado no arranque. Sem est (resultado): só a foto e a legenda.
function garrafaGrandeHtml(g, est) {
  const seguinte = est && est.proxima
    ? '<img class="garrafa-grande-foto garrafa-fusao" id="engarrafar-fusao" src="' + est.proxima.imagem + '" alt="" style="opacity:' + opacidadeFusaoGarrafa(est) + '">'
    : '';
  return '<div class="garrafa-grande">' +
    '<img class="garrafa-grande-foto" src="' + g.imagem + '" alt="">' +
    seguinte +
    (est ? bolhasGarrafaHtml(g.imagem) : '') +
    '<p class="garrafa-grande-legenda">' + garrafaLegenda(g) + '</p>' +
  '</div>';
}

// Chamado pelo relógio: só redesenha tudo quando muda o dia completo
// (nova cor ou passou de 1 dia); entre dois dias só mexe na barra e nos tempos.
function atualizarEngarrafar() {
  if (!engarrafarEcraAtivo() || engarrafarResultado) { pararRelogioEngarrafar(); return; }
  if (!state.adega.lote) { pararRelogioEngarrafar(); renderEngarrafar(); return; }
  const dias = diasDescansadosNaCave();
  const est = estadoGarrafaLote(dias);
  if (est.diasCompletos !== engarrafarDiasMostrados) { renderEngarrafar(); iniciarAmbienteEngarrafar(); return; }
  const barra = document.getElementById('engarrafar-barra');
  if (barra) barra.style.width = Math.round(est.fracao * 100) + '%';
  const fusao = document.getElementById('engarrafar-fusao');
  if (fusao) fusao.style.opacity = opacidadeFusaoGarrafa(est);
  const prox = document.getElementById('engarrafar-proxima');
  if (prox) prox.textContent = textoProximaCorGarrafa(est);
  const falta = document.getElementById('engarrafar-falta');
  if (falta && est.diasCompletos < REGRAS_DESCANSO_CAVE.diasMinimos) falta.textContent = sufixoFaltaEngarrafar(dias);
}

function engarrafarAgora() {
  const a = state.adega;
  if (!a.lote || Math.floor(diasDescansadosNaCave()) < REGRAS_DESCANSO_CAVE.diasMinimos) {
    renderEngarrafar(); // ainda não está pronto: não faz nada
    return;
  }
  const repAntes = state.reputacao;
  executarAcaoAdega('engarrafar'); // a lógica de sempre (garrafa, Reputação, histórico, objetivo)
  if (a.lote || !adegaGarrafaFeita) { renderEngarrafar(); return; }
  // rep = só a da garrafa; o prémio da encomenda (se houve) mostra-se à parte.
  const repEncomenda = adegaEncomendaEntregue && adegaEncomendaEntregue.premio ? adegaEncomendaEntregue.premio.reputacao : 0;
  engarrafarResultado = { garrafa: adegaGarrafaFeita, rep: state.reputacao - repAntes - repEncomenda, encomenda: adegaEncomendaEntregue };
  pararRelogioEngarrafar();
  pararSomAmbiente();                                        // o ambiente sai em fundo
  if (!adegaDingTocou) tocarSomFicheiro(GARRAFA_SOM_ENGARRAFAR, GARRAFA_ENGARRAFAR_VOLUME); // um só som: com o "ding" do objetivo, o ficheiro cala-se
  vibrar('sucesso');                                         // (o botão não faz a vibração leve: data-sem-vibracao)
  renderEngarrafar();
  // O resultado já está escrito nesta página: esconde o balão (o cartão de
  // "nova entrada" da Enciclopédia, se houver, mantém-se).
  atualizarDialogo('', '');
  reposicionarFlutuantes();
}

// App escondida (ex.: o jogador muda de aplicação): o relógio pára; ao
// voltar, a página redesenha-se logo (os dias podem ter passado) e o relógio recomeça.
document.addEventListener('visibilitychange', function () {
  if (!engarrafarEcraAtivo() || engarrafarResultado) return;
  if (document.hidden) { pararRelogioEngarrafar(); return; }
  enterEngarrafar();
});
