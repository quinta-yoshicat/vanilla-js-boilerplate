// ---------------------------------------------------------------------
// A ESTRADA (Nível 7): os vizinhos que já existem para o jogador (nivelMinimo, ver js/estrada-dados.js; hoje os 4 de nível 7), o bem que dá cada um, quantos tens na Despensa, uma fala
// do dia e (PR 5B) o botão "Trocar". As regras e as contas estão em js/despensa.js
// (despensaTrocar) e js/estrada-dados.js (ESTRADA_TROCA); aqui só se mostra e se clica.
//
// O DESENHO NUNCA GRAVA nem altera nada: o estado de cada cartão (o que o botão faz, ou porque
// está apagado) calcula-se só a ler. Só o clique (estradaTrocarClique) chama despensaTrocar e
// grava, UMA vez, se a troca correr bem.
//
// PR 5C: "Oferecer {bem}" a uma visita da Quinta. A linha desenha-se por baixo da linha da visita
// (ver atualizarLinhaVisitaQuinta() em js/visitas.js, que chama estradaOfertaHtml()), também sem gravar;
// só o clique (estradaOferecerClique) chama despensaOferecer e grava, UMA vez.
//
// A "Mesa do Sado" (nível 16, ESTRADA_MESA_SADO em js/estrada-dados.js): outra ação do mesmo bloco, copiada da mesa da vindima do Lagar
// (js/lagar.js) e com a mesma regra (despensaMesaVindima, js/despensa.js, com o campo state.lagar.mesaSadoDia). Também só lê ao desenhar;
// só o clique (estradaMesaSadoClique) a põe e grava, UMA vez. Não tem assalto dos porcos (esse é só do Lagar).
//
// O "Moinho de Maré da Mourisca" (nível 10, ESTRADA_MOINHO_MARE em js/estrada-dados.js): mais uma ação do mesmo bloco, mas com uma espera de 6 horas
// em vez de bens (o padrão de cooldown da Vinha, js/vinha.js: carimbo Date.now() em state.moinho.fechadoEm e carimboCorrigirFuturo, js/tempo.js)
// e 1 recompensa por dia (state.moinho.dia, com a mesma proteção contra o relógio atrás da Mesa do Sado). Não gasta nada nem tem assalto dos
// porcos. Só lê ao desenhar (a única escrita é a de carimboCorrigirFuturo, que repõe um carimbo no futuro, como na Vinha); só o clique
// (estradaMoinhoClique) fecha a comporta ou solta a água e grava, UMA vez.
//
// Abre-se a partir do Explorar (cartão com foto, só com o ecrã desbloqueado: ver explorarCartoesHtml() em
// js/explorar.js e ecraDesbloqueado('estrada') em js/niveis.js; um jogador antigo vê-o sempre).
// ---------------------------------------------------------------------

// Mesmo tipo de hash do cadernoHash() (js/caderno.js) e do visitasHash() (js/visitas.js).
function estradaHash(semente) {
  let h = 0;
  for (let i = 0; i < semente.length; i++) h = (h * 31 + semente.charCodeAt(i)) >>> 0;
  return h;
}

// Só falas com fonte ou "semFacto" (a fala de troca, v.troca, não entra aqui: mostra-se à parte, no resultado da troca).
function estradaFalasValidas(vizinho) {
  return (vizinho.falas || []).filter(function (f) {
    return f && f.texto && ((Array.isArray(f.fonte) && f.fonte.length > 0) || f.semFacto === true);
  });
}

// A fala do dia de um vizinho: escolhida pelo hash do dia de Lisboa e do id do vizinho,
// por isso é a mesma o dia todo e muda de um dia para o outro. Sem relógio, devolve a 1.ª.
function estradaFalaDoDia(vizinho, diaLisboa) {
  const falas = estradaFalasValidas(vizinho);
  if (falas.length === 0) return null;
  const dia = typeof diaLisboa === 'string' ? diaLisboa : '';
  return falas[estradaHash(dia + ':' + vizinho.id) % falas.length];
}

function estradaTexto(objeto) {
  return objeto ? (objeto[currentLang] || objeto.pt || '') : '';
}

// O que o cartão mostra, calculado SÓ A LER (nunca chama despensaTrocar nem altera o estado), pela mesma
// ordem das validações de despensaTrocar (js/despensa.js). Devolve
//   { acao: 'garrafa' | 'uvas' | 'sal' | 'bagaceira', motivo: null | 'dia_anterior' | 'ja_hoje' | 'teto_dia' |
//     'prateleira_cheia' | 'faltam_uvas', primeiraVez, pedido }
// "acao" é o pagamento que o botão faria; "motivo" não nulo = botão apagado.
function estradaEstadoCartao(estado, v, dia) {
  const T = ESTRADA_TROCA;
  const d = estado && estado.despensa && typeof estado.despensa === 'object' ? estado.despensa : null;
  const tem = function (obj, k) { return !!obj && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, k); };
  const primeiraVez = !(d && tem(d.primeiraTroca, v.bem) && /^\d{4}-\d{2}-\d{2}$/.test(String(d.primeiraTroca[v.bem])));
  const pedido = despensaPedidoDoDia(v, dia, estado);
  let acao = 'uvas';
  if (primeiraVez && despensaGarrafasDisponiveis(estado) >= 1) acao = 'garrafa';
  else if (!primeiraVez && pedido === 'sal_sado' && despensaQuantos(estado, 'sal_sado') >= 1) acao = 'sal';
  else if (!primeiraVez && pedido === 'bagaceira' && despensaBagaceiras(estado) >= 1) acao = 'bagaceira';

  const ultimo = despensaUltimoDiaRegistado(estado);
  const feitas = d && d.hoje && typeof d.hoje === 'object' && d.hoje.dia === dia && d.hoje.feitas && typeof d.hoje.feitas === 'object' && !Array.isArray(d.hoje.feitas) ? d.hoje.feitas : {};
  const uvas = estado && typeof estado.uvas === 'number' && Number.isFinite(estado.uvas) ? estado.uvas : 0;
  let motivo = null;
  if (ultimo !== null && dia < ultimo) motivo = 'dia_anterior';
  else if (tem(feitas, v.id)) motivo = 'ja_hoje';
  else if (despensaTrocasFeitasHoje(estado, feitas) >= T.trocasPorDiaTeto) motivo = 'teto_dia';
  else if (despensaQuantos(estado, v.bem) >= T.prateleiraMaxima) motivo = 'prateleira_cheia';
  else if (acao === 'uvas' && uvas - T.custoUvas < T.uvasMinimasDepoisDaTroca) motivo = 'faltam_uvas';
  return { acao: acao, motivo: motivo, primeiraVez: primeiraVez, pedido: pedido };
}

function estradaTextoMotivo(motivo) {
  const T = ESTRADA_TROCA;
  if (motivo === 'ja_hoje') return t('estrada.jaHoje');
  if (motivo === 'teto_dia') return t('estrada.tetoDia').replace('{n}', T.trocasPorDiaTeto);
  if (motivo === 'prateleira_cheia') return t('estrada.prateleira').replace('{n}', T.prateleiraMaxima);
  if (motivo === 'faltam_uvas') return t('estrada.faltamUvas').replace('{n}', T.custoUvas + T.uvasMinimasDepoisDaTroca);
  if (motivo === 'dia_anterior') return t('estrada.relogio');
  return t('estrada.erro');
}

// Só em memória (nada se grava): o resultado da última troca, mostrado no cartão desse vizinho até se
// sair do ecrã. Guardam-se códigos, nunca textos, para o desenho acompanhar a língua.
let estradaResultado = null; // { vizinho, pagou, uvasGastas, bem, reputacaoGanha, primeiraVez } ou { vizinho, erro: true }
let estradaOcupado = false;

function estradaDiaDeHoje() {
  try { return diaLisboaDeHoje(); } catch (e) { return ''; }
}

function estradaResultadoHtml(v, bem) {
  const r = estradaResultado;
  if (!r || r.vizinho !== v.id) return '';
  if (r.erro) return '<p class="estrada-resultado">' + t('estrada.erro') + '</p>';
  const nomeBem = bem ? estradaTexto(bem.nome) : '';
  let pagamento = '';
  if (r.pagou === 'garrafa') pagamento = t('estrada.levouGarrafa');
  else if (r.pagou === 'sal') pagamento = t('estrada.pagouSal');
  else if (r.pagou === 'bagaceira') pagamento = t('estrada.pagouBagaceira');
  else pagamento = t('estrada.pagouUvas').replace('{n}', r.uvasGastas);
  return '<div class="estrada-resultado">' +
    '<p>' + cadernoEscapar(t('estrada.recebeste').replace('{bem}', nomeBem)) + '</p>' +
    '<p>' + pagamento + '</p>' +
    (r.primeiraVez ? '<p>' + t('estrada.repPrimeira').replace('{n}', r.reputacaoGanha) + '</p>' : '') +
    (v.troca && v.troca.texto ? '<p class="estrada-fala">«' + cadernoEscapar(estradaTexto(v.troca.texto)) + '»</p>' : '') +
  '</div>';
}

// A cena de cada vizinho: ficheiro (assets/ecras/estrada_<ficheiro>.jpg) e posição vertical da imagem na faixa baixa
// do cartão (84 px de altura; a imagem é alta, por isso só se vê uma tira: a % escolhe qual, para se ver o rosto).
const ESTRADA_CENAS = {
  dona_amelia: { ficheiro: 'amelia', y: '28%' },
  sr_joaquim: { ficheiro: 'joaquim', y: '10%' },
  tomas: { ficheiro: 'tomas', y: '28%' },
  sr_armindo: { ficheiro: 'armindo', y: '18%' }
};

function estradaCartaoHtml(v, dia) {
  const bem = ESTRADA_BENS.filter(function (b) { return b.id === v.bem; })[0] || null;
  const fala = estradaFalaDoDia(v, dia);
  const nome = cadernoEscapar(estradaTexto(v.nome));
  const cenaInfo = ESTRADA_CENAS[v.id] || { ficheiro: v.id, y: '28%' };
  const cena = 'assets/ecras/estrada_' + cenaInfo.ficheiro + '.jpg';
  const cara = v.caraPendente === false && v.cara
    ? '<img class="estrada-cara" src="' + cadernoEscapar(v.cara) + '" alt="" decoding="async">'
    : '';
  const e = estradaEstadoCartao(state, v, dia);
  const T = ESTRADA_TROCA;
  const rotulo = e.acao === 'garrafa' ? t('estrada.btnGarrafa')
    : e.acao === 'sal' ? t('estrada.btnSal')
    : e.acao === 'bagaceira' ? t('estrada.btnBagaceira')
    : t('estrada.btnUvas').replace('{n}', T.custoUvas);
  // Só a Dona Amélia e o Sr. Armindo pedem sal, e o Sr. Armindo também bagaceira (ver ESTRADA_PEDIDOS): a linha só aparece nas trocas repetidas, quando ela pede sal hoje
  // e o botão está ativo (com o botão apagado, a linha do motivo basta).
  let linhaPedido = '';
  if (!e.primeiraVez && e.pedido === 'sal_sado' && !e.motivo) {
    linhaPedido = '<p class="estrada-estado">' + t(e.acao === 'sal' ? 'estrada.pedeSalTem' : 'estrada.pedeSalNao').replace('{n}', T.custoUvas) + '</p>';
  }
  // O Sr. Armindo também pede bagaceira (ver ESTRADA_PEDIDOS): a mesma linha, com a fala do pedido (só humor), nas trocas repetidas e com o botão ativo.
  if (!e.primeiraVez && e.pedido === 'bagaceira' && !e.motivo) {
    const falaPedido = ESTRADA_PEDIDO_FALAS.bagaceira;
    linhaPedido = '<p class="estrada-estado">' + t(e.acao === 'bagaceira' ? 'estrada.pedeBagaceiraTem' : 'estrada.pedeBagaceiraNao').replace('{n}', T.custoUvas) + '</p>' +
      (falaPedido ? '<p class="estrada-fala">«' + cadernoEscapar(estradaTexto(falaPedido.texto)) + '»</p>' : '');
  }
  return '<div class="estrada-cartao">' +
    '<div class="estrada-cena">' +
      '<img class="estrada-foto" src="' + cena + '" alt="" decoding="async" loading="lazy" style="object-position: center ' + cenaInfo.y + '">' +
      cara +
    '</div>' +
    '<div class="estrada-texto">' +
      '<p class="estrada-nome">' + nome + ' · <span class="estrada-papel">' + cadernoEscapar(estradaTexto(v.papel)) + '</span></p>' +
      (bem ? '<p>' + cadernoEscapar(t('estrada.da').replace('{bem}', estradaTexto(bem.nome))) + '</p>' : '') +
      '<p>' + t('estrada.naDespensa').replace('{n}', despensaQuantos(state, v.bem)) + '</p>' +
      linhaPedido +
      '<button type="button" class="btn-pill pill-main estrada-botao" data-vizinho="' + v.id + '" onclick="estradaTrocarClique(\'' + v.id + '\')"' + (e.motivo ? ' disabled' : '') + '>' + rotulo + '</button>' +
      (e.motivo ? '<p class="estrada-estado">' + estradaTextoMotivo(e.motivo) + '</p>' : '') +
      estradaResultadoHtml(v, bem) +
      (fala ? '<p class="estrada-fala">«' + cadernoEscapar(estradaTexto(fala.texto)) + '»</p>' : '') +
    '</div>' +
  '</div>';
}

// Desenha o ecrã (sem gravar nem alterar nada).
function estradaDesenhar() {
  const container = document.getElementById('estrada-container');
  if (!container) return;
  const dia = estradaDiaDeHoje();

  container.innerHTML =
    '<div class="topcard">' +
      '<p class="mini-title" data-i18n="estrada.title"></p>' +
    '</div>' +
    '<div class="scroll-panel estrada-lista">' +
      ESTRADA_VIZINHOS.filter(function (v) { return despensaVizinhoDisponivel(state, v); }).map(function (v) { return estradaCartaoHtml(v, dia); }).join('') +
      '<p class="estrada-aviso">' + t('estrada.garrafasLevar').replace('{n}', despensaGarrafasDisponiveis(state)) + '</p>' +
    '</div>' +
    '<div class="action-panel">' +
      '<button type="button" class="btn-pill pill-main pill-grande" onclick="voltarEcraAnterior()" data-i18n="nav.voltar"></button>' +
    '</div>';

  atualizarDialogo('', '');
  applyTranslations();
}

// Ao entrar no ecrã (ver goTo() em js/main.js): esquece o resultado da visita anterior.
function renderEstrada() {
  estradaResultado = null;
  estradaDesenhar();
}

// O ÚNICO sítio que troca e grava. Toque no botão: desativa-o logo (clique duplo), faz a troca de hoje
// (despensaTrocar) e, se correu bem, grava UMA vez e atualiza a barra de cima (updateStatsDisplays, a
// mesma função que as outras ações usam depois de mudar uvas ou Reputação). Se recusou, não grava.
function estradaTrocarClique(vizinhoId) {
  if (estradaOcupado) return;
  estradaOcupado = true;
  try {
    const botao = document.querySelector('.estrada-botao[data-vizinho="' + vizinhoId + '"]');
    if (botao) botao.disabled = true;
    const r = despensaTrocar(state, vizinhoId, estradaDiaDeHoje());
    if (r.ok) {
      saveState(state);
      updateStatsDisplays();
      tocarSom('objetivoCumprido'); // a troca não é objetivo do dia: não há outro "ding"
      estradaResultado = { vizinho: vizinhoId, pagou: r.pagou, uvasGastas: r.uvasGastas, bem: r.bem, reputacaoGanha: r.reputacaoGanha, primeiraVez: r.primeiraVez };
    } else {
      // Recusada: nada mudou. O cartão mostra o motivo que calcula sozinho; só um motivo inesperado dá erro.
      const esperado = ['dia_anterior', 'ja_hoje', 'teto_dia', 'prateleira_cheia', 'faltam_uvas'].indexOf(r.motivo) !== -1;
      estradaResultado = esperado ? null : { vizinho: vizinhoId, erro: true };
    }
  } finally {
    estradaOcupado = false;
  }
  estradaDesenhar();
}

// ---------------------------------------------------------------------
// OFERECER UM BEM A UMA VISITA (PR 5C), no cartão da Quinta.
// ---------------------------------------------------------------------

// Só em memória: a oferta feita (para mostrar o agradecimento) até se sair da app. Guardam-se códigos, não textos.
let estradaOfertaResultado = null; // { dia, personagem, bem, reputacaoGanha }
let estradaOfertaOcupado = false;
let estradaMesaSadoResultado = null; // { dia, reputacaoGanha }
let estradaMesaSadoOcupado = false;
let estradaMoinhoResultado = null; // { dia, tipo: 'fechou' | 'soltou', reputacaoGanha }
let estradaMoinhoOcupado = false;

// A visita de hoje, SÓ SE já se tocou nela (state.visitas.hoje.feita) e não estamos em modo de teste; senão null.
// Só lê (visitaResolverHoje não grava).
function estradaVisitaTocadaHoje() {
  try {
    if (typeof visitaEmModoTeste === 'function' && visitaEmModoTeste()) return null;
    const r = visitaResolverHoje();
    if (!r.visita || r.feita !== true || r.nova || visitaTextoPorEscrever(r.visita)) return null;
    return r.visita;
  } catch (e) { return null; }
}

function estradaNomeBem(bemId) {
  const bem = ESTRADA_BENS.filter(function (b) { return b.id === bemId; })[0];
  return bem ? estradaTexto(bem.nome) : '';
}

// O que se vê no cartão da Quinta, por baixo da linha da visita (só lê; devolve '' se não houver nada a mostrar), a oferta à visita,
// a partir do nível 10 o Moinho de Maré da Mourisca e, a partir do nível 16, a Mesa do Sado (esta também nos dias sem visita):
//   oferta feita agora: "Ofereceste {bem} {a quem}", "+1 de Reputação" e a fala dessa visita para esse bem;
//   oferta de hoje já feita: "Já ofereceste hoje";
//   senão, havendo bens: o botão "Oferecer {bem}".
// Só com a visita de hoje já tocada e a Estrada desbloqueada; sem bens e sem oferta feita, não mostra nada.
function estradaOfertaHtml() {
  return estradaOfertaVisitaHtml() + estradaMoinhoHtml() + estradaMesaSadoHtml();
}

// A oferta à visita de hoje (o que está descrito acima, sem a Mesa do Sado).
function estradaOfertaVisitaHtml() {
  if (typeof ecraDesbloqueado !== 'function' || !ecraDesbloqueado('estrada')) return '';
  const visita = estradaVisitaTocadaHoje();
  if (!visita) return '';
  const dia = estradaDiaDeHoje();
  const res = estradaOfertaResultado;
  if (res && res.dia === dia && res.personagem === visita.personagem) {
    const fala = ESTRADA_OFERTA_FALAS[res.personagem] && ESTRADA_OFERTA_FALAS[res.personagem][res.bem];
    return '<div class="mini-bloco"><div class="oferta-resultado">' +
      '<p>' + cadernoEscapar(t('oferta.ofereceste').replace('{bem}', estradaNomeBem(res.bem)).replace('{nome}', t('oferta.a.' + res.personagem))) + '</p>' +
      '<p>' + t('oferta.rep').replace('{n}', res.reputacaoGanha) + '</p>' +
      (fala ? '<p class="oferta-fala">«' + cadernoEscapar(estradaTexto(fala.texto)) + '»</p>' : '') +
    '</div></div>';
  }
  const ultima = despensaOfertaDia(state);
  if (ultima !== null && ultima >= dia) return '<div class="mini-bloco"><p class="oferta-linha">' + t('oferta.jaHoje') + '</p></div>';
  const bem = despensaBemParaOferecer(state);
  if (bem === null) return '';
  return '<div class="mini-bloco"><button type="button" class="btn-pill pill-main oferta-botao" onclick="estradaOferecerClique()">' +
    cadernoEscapar(t('oferta.btn').replace('{bem}', estradaNomeBem(bem))) + '</button></div>';
}

// Há um bem da Estrada para oferecer à visita de hoje (já tocada) que ainda não foi oferecido hoje? Só lê; é o mesmo que
// faz aparecer o botão «Oferecer» em estradaOfertaHtml(). Usada pelo sinal do cartão da Quinta (quintaPendentes, js/objetivos.js).
function estradaOfertaPendente() {
  try {
    if (typeof ecraDesbloqueado !== 'function' || !ecraDesbloqueado('estrada')) return false;
    if (!estradaVisitaTocadaHoje()) return false;
    const ultima = despensaOfertaDia(state);
    if (ultima !== null && ultima >= estradaDiaDeHoje()) return false;
    return despensaBemParaOferecer(state) !== null;
  } catch (e) { return false; }
}

// O ÚNICO sítio que oferece e grava. Toque no botão: desativa-o logo (clique duplo), oferece (despensaOferecer) e,
// se correu bem, grava UMA vez e atualiza a barra de cima (updateStatsDisplays). Se recusou, não grava.
function estradaOferecerClique() {
  if (estradaOfertaOcupado) return;
  estradaOfertaOcupado = true;
  try {
    const botao = document.querySelector('.oferta-botao');
    if (botao) botao.disabled = true;
    const visita = estradaVisitaTocadaHoje();
    if (visita) {
      const dia = estradaDiaDeHoje();
      const r = despensaOferecer(state, dia);
      if (r.ok) {
        saveState(state);
        updateStatsDisplays();
        tocarSom('objetivoCumprido'); // a oferta não é objetivo do dia: não há outro "ding"
        estradaOfertaResultado = { dia: dia, personagem: visita.personagem, bem: r.bem, reputacaoGanha: r.reputacaoGanha };
      }
    }
  } finally {
    estradaOfertaOcupado = false;
  }
  // Redesenha o cartão da Quinta (a barra de cima já foi atualizada).
  if (typeof atualizarCartaoNivelQuinta === 'function') atualizarCartaoNivelQuinta();
  if (typeof atualizarResumoQuinta === 'function') atualizarResumoQuinta();
  if (typeof atualizarLinhaVisitaQuinta === 'function') atualizarLinhaVisitaQuinta();
}

// ---------------------------------------------------------------------
// A MESA DO SADO (nível 16). Copiada da mesa da vindima (lagarMesaEstado, lagarTextoMesa e lagarMesaClique em js/lagar.js).
// ---------------------------------------------------------------------

function estradaMesaSadoReceita() {
  return { bens: ESTRADA_MESA_SADO.bens, reputacao: ESTRADA_MESA_SADO.reputacao, campo: ESTRADA_MESA_SADO.campo, nivelMinimo: ESTRADA_MESA_SADO.nivelMinimo };
}

// Só lê. O estado da Mesa do Sado neste dia: { ok, motivo, faltam } com
//   motivo null | 'nivel_insuficiente' | 'dia_anterior' | 'ja_hoje' | 'faltam_bens'  e  faltam = ids dos bens que faltam na Despensa.
// Não altera nada (a regra a sério, que gasta, é despensaMesaVindima em js/despensa.js).
function estradaMesaSadoEstado(estado, dia) {
  const receita = estradaMesaSadoReceita();
  if (!despensaMesaNivelOk(estado, receita)) return { ok: false, motivo: 'nivel_insuficiente', faltam: [] };
  const ultima = despensaMesaDia(estado, receita.campo);
  if (ultima !== null && dia < ultima) return { ok: false, motivo: 'dia_anterior', faltam: [] };
  if (ultima !== null && dia === ultima) return { ok: false, motivo: 'ja_hoje', faltam: [] };
  const faltam = receita.bens.filter(function (b) { return despensaQuantos(estado, b.bem) < b.n; }).map(function (b) { return b.bem; });
  if (faltam.length > 0) return { ok: false, motivo: 'faltam_bens', faltam: faltam };
  return { ok: true, motivo: null, faltam: [] };
}

function estradaMesaSadoTexto(m) {
  if (m.motivo === 'ja_hoje') return t('estrada.mesaSadoJaHoje');
  if (m.motivo === 'dia_anterior') return t('estrada.mesaSadoRelogio');
  if (m.motivo === 'faltam_bens') {
    const nomes = m.faltam.map(function (id) { return estradaNomeBem(id); }).join(', ');
    return t('estrada.mesaSadoFalta').replace('{bens}', nomes) + ' ' + t('estrada.mesaSadoOnde');
  }
  return '';
}

// O que se vê no cartão da Quinta (só lê; '' antes do nível 16): a foto, o que a mesa pede e dá, o botão (apagado se não se pode) e,
// por baixo, a mensagem: o agradecimento logo depois de a pôr, "já puseste hoje", o que falta na Despensa ou o relógio atrás.
function estradaMesaSadoHtml() {
  if (typeof despensaMesaNivelOk !== 'function' || !despensaMesaNivelOk(state, estradaMesaSadoReceita())) return '';
  const dia = estradaDiaDeHoje();
  const m = estradaMesaSadoEstado(state, dia);
  const res = estradaMesaSadoResultado;
  const feitaAgora = !!res && res.dia === dia && m.motivo === 'ja_hoje';
  const texto = feitaAgora ? '' : estradaMesaSadoTexto(m);
  return '<div class="mini-bloco mesa-sado">' +
    '<img class="mesa-sado-img" src="' + ESTRADA_MESA_SADO.imagem + '" alt="' + cadernoEscapar(t('estrada.mesaSadoAlt')) + '" loading="lazy">' +
    '<p class="oferta-linha">' + cadernoEscapar(t('estrada.mesaSadoDesc').replace('{pedido}', t('estrada.mesaSadoPedido')).replace('{rep}', ESTRADA_MESA_SADO.reputacao)) + '</p>' +
    (feitaAgora ? '<div class="oferta-resultado"><p>' + cadernoEscapar(t('estrada.mesaSadoOk').replace('{rep}', res.reputacaoGanha)) + '</p></div>' : '') +
    (texto ? '<p class="oferta-linha">' + cadernoEscapar(texto) + '</p>' : '') +
    '<button type="button" class="btn-pill pill-main oferta-botao mesa-sado-botao" onclick="estradaMesaSadoClique()"' + (m.ok ? '' : ' disabled') + '>' +
      cadernoEscapar(t('estrada.mesaSadoBtn')) + '</button>' +
  '</div>';
}

// O ÚNICO sítio que põe a Mesa do Sado e grava (a regra é despensaMesaVindima, em js/despensa.js). Toque no botão: desativa-o logo
// (clique duplo), põe a mesa e, se correu bem, grava UMA vez e atualiza a barra de cima. Se recusou, não grava.
function estradaMesaSadoClique() {
  if (estradaMesaSadoOcupado) return;
  estradaMesaSadoOcupado = true;
  try {
    const botao = document.querySelector('.mesa-sado-botao');
    if (botao) botao.disabled = true;
    const dia = estradaDiaDeHoje();
    const r = despensaMesaVindima(state, dia, estradaMesaSadoReceita());
    if (r.ok) {
      saveState(state);
      updateStatsDisplays();
      estradaMesaSadoResultado = { dia: dia, reputacaoGanha: r.reputacaoGanha };
      if (typeof vibrar === 'function') vibrar('sucesso');
      if (typeof tocarSom === 'function') tocarSom('objetivoCumprido'); // a mesa não é objetivo do dia: não há outro "ding"
    }
  } finally {
    estradaMesaSadoOcupado = false;
  }
  // Redesenha o cartão da Quinta (a barra de cima já foi atualizada).
  if (typeof atualizarCartaoNivelQuinta === 'function') atualizarCartaoNivelQuinta();
  if (typeof atualizarResumoQuinta === 'function') atualizarResumoQuinta();
  if (typeof atualizarLinhaVisitaQuinta === 'function') atualizarLinhaVisitaQuinta();
}

// ---------------------------------------------------------------------
// O MOINHO DE MARÉ DA MOURISCA (nível 10). Duas ações no mesmo botão: «Fechar a comporta» (guarda o carimbo) e, 6 horas depois, «Soltar a
// água» (+10 de Reputação, 1 vez por dia de Lisboa). A espera segue o padrão da Vinha (tempoRestanteVinha, js/vinha.js).
// ---------------------------------------------------------------------

function estradaMoinhoNivelOk(estado) {
  if (typeof despensaNivelDoEstado !== 'function') return false;
  const nivel = despensaNivelDoEstado(estado);
  return nivel !== null && nivel >= ESTRADA_MOINHO_MARE.nivelMinimo;
}

// Só lê (não altera o estado nem corrige o relógio). O estado do moinho no dia "dia" e no instante "agora" (Date.now()):
//   { ok, fase, motivo, restanteMs }
//   fase    'fechar' (a comporta está aberta: pode fechar-se), 'espera' (fechada, ainda faltam horas), 'soltar' (as 6 horas passaram) ou null
//   motivo  null | 'nivel_insuficiente' | 'dia_invalido' | 'dia_anterior' (relógio atrás do último dia em que soltou a água) | 'ja_hoje' | 'espera'
// ok é verdadeiro quando o botão da fase se pode usar (fechar ou soltar). Um carimbo no futuro (relógio mexido) conta como "agora": a espera
// fica inteira (estradaMoinhoCorrigirRelogio repõe-no de vez).
function estradaMoinhoEstado(estado, dia, agora) {
  const recusa = function (motivo) { return { ok: false, fase: null, motivo: motivo, restanteMs: 0 }; };
  if (!estradaMoinhoNivelOk(estado)) return recusa('nivel_insuficiente');
  if (typeof dia !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dia) || typeof agora !== 'number' || !Number.isFinite(agora)) return recusa('dia_invalido');
  const m = moinhoNormalizar(estado && estado.moinho);
  if (m.dia !== null && dia < m.dia) return recusa('dia_anterior');
  if (m.dia !== null && dia === m.dia) return recusa('ja_hoje');
  if (m.fechadoEm === null) return { ok: true, fase: 'fechar', motivo: null, restanteMs: 0 };
  const decorrido = Math.max(0, agora - m.fechadoEm);
  const restante = Math.max(0, ESTRADA_MOINHO_MARE.esperaMs - decorrido);
  if (restante > 0) return { ok: false, fase: 'espera', motivo: 'espera', restanteMs: restante };
  return { ok: true, fase: 'soltar', motivo: null, restanteMs: 0 };
}

// Fecha a comporta: guarda o carimbo "agora". Devolve { ok, motivo }. Recusar nunca altera nada. Não grava (quem chamar é que grava).
function estradaMoinhoFechar(estado, dia, agora) {
  const e = estradaMoinhoEstado(estado, dia, agora);
  if (!e.ok || e.fase !== 'fechar') return { ok: false, motivo: e.motivo || 'ja_fechada' };
  if (!Number.isSafeInteger(agora) || agora <= 0) return { ok: false, motivo: 'dia_invalido' };
  moinhoEstado(estado).fechadoEm = agora;
  return { ok: true, motivo: null };
}

// Solta a água: tira o carimbo, marca o dia e soma a Reputação. Devolve { ok, motivo, reputacaoGanha }. Recusar nunca altera nada. Não grava.
function estradaMoinhoSoltar(estado, dia, agora) {
  const e = estradaMoinhoEstado(estado, dia, agora);
  if (!e.ok || e.fase !== 'soltar') return { ok: false, motivo: e.motivo || 'sem_comporta_fechada', reputacaoGanha: 0 };
  const m = moinhoEstado(estado);
  m.fechadoEm = null;
  m.dia = dia;
  const rep = ESTRADA_MOINHO_MARE.reputacao;
  estado.reputacao = (typeof estado.reputacao === 'number' && Number.isFinite(estado.reputacao) ? estado.reputacao : 0) + rep;
  return { ok: true, motivo: null, reputacaoGanha: rep };
}

// Um carimbo no futuro (relógio do aparelho mexido para trás) repõe-se em "agora", como na Vinha (carimboCorrigirFuturo, js/tempo.js).
function estradaMoinhoCorrigirRelogio(agora) {
  try {
    if (typeof carimboCorrigirFuturo === 'function' && state && state.moinho && typeof state.moinho === 'object') carimboCorrigirFuturo(state.moinho, 'fechadoEm', agora);
  } catch (e) { /* só em memória */ }
}

// O tempo que falta, no formato das outras esperas do jogo ("5h 59m", "42m"; formatarTempoVinha, js/vinha.js).
function estradaMoinhoTempo(ms) {
  if (typeof formatarTempoVinha === 'function') return formatarTempoVinha(ms);
  const totalMin = Math.ceil(ms / 60000);
  return totalMin >= 60 ? (Math.floor(totalMin / 60) + 'h ' + (totalMin % 60) + 'm') : (totalMin + 'm');
}

// O que se vê no cartão da Quinta (só lê; '' antes do nível 10): a foto (a B depois de soltar a água, a A nos outros casos), o que a ação
// pede e dá, a mensagem (o que acabou de acontecer, o tempo que falta, "já soltaste hoje" ou o relógio atrás) e o botão da fase.
function estradaMoinhoHtml() {
  if (!estradaMoinhoNivelOk(state)) return '';
  const agora = Date.now();
  estradaMoinhoCorrigirRelogio(agora);
  const dia = estradaDiaDeHoje();
  const m = estradaMoinhoEstado(state, dia, agora);
  const res = estradaMoinhoResultado;
  const soltouHoje = m.motivo === 'ja_hoje';
  const soltouAgora = !!res && res.dia === dia && res.tipo === 'soltou' && soltouHoje;
  const fechouAgora = !!res && res.dia === dia && res.tipo === 'fechou' && m.fase === 'espera';
  let texto = '';
  if (m.motivo === 'ja_hoje') texto = soltouAgora ? '' : t('estrada.moinhoJaHoje');
  else if (m.motivo === 'dia_anterior') texto = t('estrada.moinhoRelogio');
  else if (m.fase === 'espera') texto = t('estrada.moinhoEspera').replace('{tempo}', estradaMoinhoTempo(m.restanteMs));
  else if (m.fase === 'soltar') texto = t('estrada.moinhoPronto');
  const imagem = soltouHoje ? ESTRADA_MOINHO_MARE.imagemSoltar : ESTRADA_MOINHO_MARE.imagemFechar;
  const alt = soltouHoje ? t('estrada.moinhoAltSoltar') : t('estrada.moinhoAltFechar');
  const rotulo = m.fase === 'espera' || m.fase === 'soltar' ? t('estrada.moinhoBtnSoltar') : t('estrada.moinhoBtnFechar');
  return '<div class="mini-bloco moinho-mare">' +
    '<img class="moinho-mare-img" src="' + imagem + '" alt="' + cadernoEscapar(alt) + '" loading="lazy">' +
    '<p class="oferta-linha">' + cadernoEscapar(t('estrada.moinhoDesc').replace('{rep}', ESTRADA_MOINHO_MARE.reputacao)) + '</p>' +
    (soltouAgora ? '<div class="oferta-resultado"><p>' + cadernoEscapar(t('estrada.moinhoOk').replace('{rep}', res.reputacaoGanha)) + '</p></div>' : '') +
    (fechouAgora ? '<div class="oferta-resultado"><p>' + cadernoEscapar(t('estrada.moinhoFechada')) + '</p></div>' : '') +
    (texto ? '<p class="oferta-linha">' + cadernoEscapar(texto) + '</p>' : '') +
    '<button type="button" class="btn-pill pill-main oferta-botao moinho-mare-botao" onclick="estradaMoinhoClique()"' + (m.ok ? '' : ' disabled') + '>' +
      cadernoEscapar(rotulo) + '</button>' +
  '</div>';
}

// O ÚNICO sítio que fecha a comporta ou solta a água e grava. Toque no botão: desativa-o logo (clique duplo), vê a fase de agora (não a que
// estava desenhada) e faz o que ela pede; se correu bem, grava UMA vez e atualiza a barra de cima. Se recusou, não grava.
function estradaMoinhoClique() {
  if (estradaMoinhoOcupado) return;
  estradaMoinhoOcupado = true;
  try {
    const botao = document.querySelector('.moinho-mare-botao');
    if (botao) botao.disabled = true;
    const agora = Date.now();
    estradaMoinhoCorrigirRelogio(agora);
    const dia = estradaDiaDeHoje();
    const soltar = estradaMoinhoEstado(state, dia, agora).fase === 'soltar';
    const r = soltar ? estradaMoinhoSoltar(state, dia, agora) : estradaMoinhoFechar(state, dia, agora);
    if (r.ok) {
      saveState(state);
      updateStatsDisplays();
      estradaMoinhoResultado = { dia: dia, tipo: soltar ? 'soltou' : 'fechou', reputacaoGanha: soltar ? r.reputacaoGanha : 0 };
      if (soltar) {
        if (typeof vibrar === 'function') vibrar('sucesso');
        if (typeof tocarSom === 'function') tocarSom('objetivoCumprido'); // não é objetivo do dia: não há outro "ding"
      }
    }
  } finally {
    estradaMoinhoOcupado = false;
  }
  // Redesenha o cartão da Quinta (a barra de cima já foi atualizada).
  if (typeof atualizarCartaoNivelQuinta === 'function') atualizarCartaoNivelQuinta();
  if (typeof atualizarResumoQuinta === 'function') atualizarResumoQuinta();
  if (typeof atualizarLinhaVisitaQuinta === 'function') atualizarLinhaVisitaQuinta();
}

// Na Quinta, com a comporta fechada à espera, o tempo que falta desce sozinho (e o botão acende-se ao chegar a zero): redesenha o bloco a
// cada minuto. Só lê o relógio; não grava nada e não faz nada fora da Quinta nem fora da espera.
function estradaMoinhoRelogio() {
  try {
    const ativo = document.querySelector('.screen.active');
    if (!ativo || ativo.id !== 'screen-quinta') return;
    if (estradaMoinhoEstado(state, estradaDiaDeHoje(), Date.now()).fase !== 'espera') return;
    if (typeof atualizarLinhaVisitaQuinta === 'function') atualizarLinhaVisitaQuinta();
  } catch (e) { /* nada */ }
}
if (typeof setInterval === 'function') setInterval(estradaMoinhoRelogio, 60000);
