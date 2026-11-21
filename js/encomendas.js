// ---------------------------------------------------------------------
// ENCOMENDAS (PR 1 de 3: só regras, INVISÍVEL — nada do jogo chama estas funções ainda).
//
// A partir do nível 5, a visita do dia (js/visitas.js), depois de tocada, pode pedir uma garrafa de uma cor
// (os escalões 1 a 4 da Cave, js/garrafa.js: 1 Jovem, 2 Dourado, 3 Âmbar, 4 Cobre) com um prazo de 2 dias.
// Se o jogador engarrafar DEPOIS de aceitar, dentro do prazo, uma garrafa com o escalão pedido ou superior,
// ganha o prémio. A garrafa nunca se gasta (state.garrafas e o histórico não mudam). Falhar o prazo não tira
// nada: a encomenda só acaba. No máximo uma encomenda ativa e uma nova por dia.
//
// O estado (state.encomendas = { atual, ultimoDia, cumpridas }) e a sua reparação estão em js/state.js
// (encomendasNormalizar, encomendasEstado); a nuvem junta-o em nuvemJuntarLeves() (js/nuvem.js).
//
// Todas as funções são puras quanto ao tempo e ao acaso: o estado e o dia ('AAAA-MM-DD', Lisboa, o dia
// EFETIVO da visita, como visitaDiaEfetivo()) chegam por argumento; não leem o relógio, não sorteiam
// (Math.random), não gravam (quem chama grava). As que mudam alguma coisa (criar, entregar, expirar) só
// mudam o estado que recebem e só depois de validar tudo: recusar nunca altera nada.
// O modo de teste (parâmetros no endereço, ver visitaEmModoTeste()) chega também por argumento: com ele
// não se pede nada.
// Usa: diaLisboaPartes, diasEntreDiasLisboa, diaLisboaEfetivo e DIAS_FUTURO_MAXIMO (js/tempo.js),
// nivelPelaReputacao (js/niveis.js), visitaPorId (js/visitas.js), encomendasNormalizar e
// encomendasEstado (js/state.js).
// ---------------------------------------------------------------------

const ENCOMENDAS_NIVEL_MINIMO = 5;
const ENCOMENDAS_PRAZO_DIAS = 2;   // prazoDia = o dia de aceitar + 2 dias (de Lisboa)

// As cores que se podem pedir, e a partir de que nível (os escalões da Cave).
const ENCOMENDAS_ESCALOES = [
  { escalao: 1, nivel: 5 },   // Jovem
  { escalao: 2, nivel: 5 },   // Dourado
  { escalao: 3, nivel: 6 },   // Âmbar
  { escalao: 4, nivel: 7 }    // Cobre
];

// Prémio de cada cor entregue (só se ganha; nada se gasta).
const ENCOMENDA_PREMIO_JOVEM = { reputacao: 4, uvas: 20, gotas: 0 };
const ENCOMENDA_PREMIO_DOURADO = { reputacao: 6, uvas: 30, gotas: 0 };
const ENCOMENDA_PREMIO_AMBAR = { reputacao: 8, uvas: 0, gotas: 15 };
const ENCOMENDA_PREMIO_COBRE = { reputacao: 10, uvas: 0, gotas: 25 };
const ENCOMENDAS_PREMIOS = { 1: ENCOMENDA_PREMIO_JOVEM, 2: ENCOMENDA_PREMIO_DOURADO, 3: ENCOMENDA_PREMIO_AMBAR, 4: ENCOMENDA_PREMIO_COBRE };

// O mesmo tipo de hash de visitasHash() (js/visitas.js), com sementes próprias.
function encomendaHash(semente) {
  let h = 0;
  for (let i = 0; i < semente.length; i++) h = (h * 31 + semente.charCodeAt(i)) >>> 0;
  return h;
}

// 'AAAA-MM-DD' mais n dias (calendário), ou null se o dia não for válido.
function encomendaSomarDias(dia, n) {
  const p = diaLisboaPartes(dia);
  if (!p) return null;
  const d = new Date(Date.UTC(p.ano, p.mes, p.dia + n));
  const dois = function (x) { return (x < 10 ? '0' : '') + x; };
  return d.getUTCFullYear() + '-' + dois(d.getUTCMonth() + 1) + '-' + dois(d.getUTCDate());
}

function encomendaNivel(estado) {
  try { return nivelPelaReputacao(estado.reputacao); } catch (e) { return 0; }
}

// Os escalões que se podem pedir neste nível (vazio abaixo do 5).
function encomendaEscaloesAbertos(nivel) {
  if (!(nivel >= ENCOMENDAS_NIVEL_MINIMO)) return [];
  return ENCOMENDAS_ESCALOES.filter(function (x) { return nivel >= x.nivel; }).map(function (x) { return x.escalao; });
}

// A cor pedida: determinística (o dia e quantas já foram cumpridas), só entre as abertas. null sem nenhuma aberta.
function encomendaEscalaoDoDia(nivel, dia, cumpridas) {
  const abertos = encomendaEscaloesAbertos(nivel);
  if (!abertos.length || typeof dia !== 'string') return null;
  const n = typeof cumpridas === 'number' && Number.isInteger(cumpridas) && cumpridas >= 0 ? cumpridas : 0;
  return abertos[encomendaHash(dia + '#encomenda#' + n) % abertos.length];
}

function encomendaPremio(escalao) {
  const p = ENCOMENDAS_PREMIOS[escalao];
  return p ? { reputacao: p.reputacao, uvas: p.uvas, gotas: p.gotas } : null;
}

// O prazo da encomenda ativa já passou? Também conta como acabada uma encomenda aceite num dia MAIS de
// DIAS_FUTURO_MAXIMO dias à frente de hoje (data do aparelho que estava adiantada e voltou ao normal):
// esse carimbo não é de confiança. Com a data atrás (hoje antes de aceitar), não acaba. Sem encomenda: false.
function encomendaPrazoPassou(estado, dia) {
  const a = encomendasNormalizar(estado && estado.encomendas).atual;
  if (!a || diaLisboaPartes(dia) === null) return false;
  const ateAceite = diasEntreDiasLisboa(dia, a.aceiteDia);
  if (ateAceite !== null && ateAceite > DIAS_FUTURO_MAXIMO) return true;
  const depoisDoPrazo = diasEntreDiasLisboa(a.prazoDia, dia);
  return depoisDoPrazo !== null && depoisDoPrazo > 0;
}

// Há uma encomenda ativa e ainda no prazo?
function encomendaAtiva(estado, dia) {
  const a = encomendasNormalizar(estado && estado.encomendas).atual;
  return !!a && !encomendaPrazoPassou(estado, dia);
}

// Pode ser feito um pedido hoje? Só lê. { ok, motivo, personagem, escalao }, motivo null | 'modo_teste' |
// 'dia' | 'nivel' | 'sem_visita' | 'nao_tocada' | 'ja_ativa' | 'ja_hoje' | 'sem_cor'.
function encomendaPodePedir(estado, dia, modoTeste) {
  const recusa = function (motivo) { return { ok: false, motivo: motivo, personagem: null, escalao: null }; };
  if (modoTeste === true) return recusa('modo_teste');
  if (!estado || typeof estado !== 'object' || diaLisboaPartes(dia) === null) return recusa('dia');
  const nivel = encomendaNivel(estado);
  if (!(nivel >= ENCOMENDAS_NIVEL_MINIMO)) return recusa('nivel');
  const vs = estado.visitas;
  const h = vs && typeof vs === 'object' ? vs.hoje : null;
  const visita = h && typeof h === 'object' && h.dia === dia && typeof visitaPorId === 'function' ? visitaPorId(h.id) : null;
  if (!visita) return recusa('sem_visita');
  if (h.feita !== true) return recusa('nao_tocada');
  const e = encomendasNormalizar(estado.encomendas);
  if (encomendaAtiva(estado, dia)) return recusa('ja_ativa');
  // Uma nova por dia: com a data do aparelho atrás, o dia guardado (até DIAS_FUTURO_MAXIMO à frente) conta como hoje.
  if (e.ultimoDia !== null && diaLisboaEfetivo(dia, e.ultimoDia) === e.ultimoDia) return recusa('ja_hoje');
  const escalao = encomendaEscalaoDoDia(nivel, dia, e.cumpridas);
  if (escalao === null) return recusa('sem_cor');
  return { ok: true, motivo: null, personagem: visita.personagem, escalao: escalao };
}

// Cria o pedido (aceite hoje). Valida tudo antes; se recusar, não altera nada. Não grava.
// { ok, motivo, encomenda }.
function encomendaCriar(estado, dia, modoTeste) {
  const p = encomendaPodePedir(estado, dia, modoTeste);
  if (!p.ok) return { ok: false, motivo: p.motivo, encomenda: null };
  const e = encomendasEstado(estado);
  const h = estado.adega && Array.isArray(estado.adega.historico) ? estado.adega.historico : [];
  e.atual = { personagem: p.personagem, escalao: p.escalao, aceiteDia: dia, prazoDia: encomendaSomarDias(dia, ENCOMENDAS_PRAZO_DIAS), historicoInicio: h.length };
  e.ultimoDia = dia;
  return { ok: true, motivo: null, encomenda: Object.assign({}, e.atual) };
}

// A garrafa da posição `indice` do histórico cumpre a encomenda ativa? Só lê. Tem de ser feita DEPOIS de aceitar
// (indice >= historicoInicio), não ser de festa (jeropiga: festa e diasDescanso 0) e ter o escalão pedido ou mais;
// e a encomenda tem de estar no prazo.
function encomendaGarrafaCumpre(estado, dia, indice) {
  if (!encomendaAtiva(estado, dia)) return false;
  const a = encomendasNormalizar(estado.encomendas).atual;
  const h = estado.adega && Array.isArray(estado.adega.historico) ? estado.adega.historico : null;
  if (!h || typeof indice !== 'number' || !Number.isInteger(indice) || indice < a.historicoInicio || indice >= h.length) return false;
  const g = h[indice];
  if (!g || typeof g !== 'object' || g.festa) return false;
  const d = Number(g.diasDescanso);
  if (g.diasDescanso === null || g.diasDescanso === undefined || !Number.isFinite(d) || d < 1) return false;
  return Math.floor(d) >= a.escalao;
}

// A 1.ª garrafa que cumpre a encomenda ativa (posição no histórico), ou -1. Só lê.
function encomendaProcurarGarrafa(estado, dia) {
  if (!encomendaAtiva(estado, dia)) return -1;
  const a = encomendasNormalizar(estado.encomendas).atual;
  const h = estado.adega.historico;
  for (let i = a.historicoInicio; i < h.length; i++) if (encomendaGarrafaCumpre(estado, dia, i)) return i;
  return -1;
}

function encomendaNumero(x) {
  return typeof x === 'number' && Number.isFinite(x) ? x : 0;
}

// Entrega a encomenda com a garrafa `indice`: soma o prémio, conta mais uma cumprida e acaba a encomenda (nunca se
// conta duas vezes). A garrafa NÃO se gasta. Valida antes; se recusar, não altera nada. Não grava.
// { ok, premio, escalao, personagem }.
function encomendaEntregar(estado, dia, indice) {
  if (!encomendaGarrafaCumpre(estado, dia, indice)) return { ok: false, premio: null, escalao: null, personagem: null };
  const e = encomendasEstado(estado);
  const a = e.atual;
  const premio = encomendaPremio(a.escalao);
  estado.reputacao = encomendaNumero(estado.reputacao) + premio.reputacao;
  estado.uvas = encomendaNumero(estado.uvas) + premio.uvas;
  estado.gotas = encomendaNumero(estado.gotas) + premio.gotas;
  e.cumpridas += 1;
  e.atual = null;
  return { ok: true, premio: premio, escalao: a.escalao, personagem: a.personagem };
}

// Se o prazo passou, acaba a encomenda (não tira nada). true se acabou agora. Não grava.
function encomendaExpirar(estado, dia) {
  if (!encomendaPrazoPassou(estado, dia)) return false;
  encomendasEstado(estado).atual = null;
  return true;
}

// ---------------------------------------------------------------------
// PR 2 de 3: NO JOGO. Um bloco no cartão da Quinta, por baixo da linha da visita do dia e do copo de bagaceira
// (desenhado por atualizarLinhaVisitaQuinta(), js/visitas.js), e o pagamento ao engarrafar (executarAcaoAdega,
// js/garrafa.js, logo a seguir ao historico.push do engarrafar normal; a jeropiga de js/festas.js nunca chama).
// Estados do bloco: (a) pode pedir: a fala da personagem, o pedido e «Aceitar» / «Agora não»; (b) em curso: uma
// linha; (c) acabou o prazo: acaba ao desenhar e mostra uma vez «A encomenda acabou»; (d) entregue: o
// agradecimento e o prémio. (c) e (d) ficam só em memória (encomendaResultado) até se sair da app, como
// visitaBagaceiraResultado. Em modo de teste (visitaEmModoTeste: ?visita=, ?dias=, ...) não se pede, não se paga
// nem se grava. O dia é o efetivo das visitas (visitaDiaEfetivo): com o relógio errado nada se perde.
// ---------------------------------------------------------------------

// Falas das três personagens das visitas (as mesmas de VISITAS_BAGACEIRA_FALAS, js/visitas.js), no mesmo tom.
const ENCOMENDAS_FALAS_PEDIDO = {
  valentim: { pt: 'Tenho uns amigos à mesa no fim de semana e queria lá pôr uma garrafa feita com calma. Sem pressas: só com tempo.', en: 'I have some friends coming to dinner at the weekend and I\'d like to put a bottle made without hurry on the table. No rush: just time.', es: 'Tengo unos amigos a la mesa el fin de semana y quería poner una botella hecha con calma. Sin prisas: solo con tiempo.' },
  marisa: { pt: 'A minha avó faz anos e só bebe Moscatel daqui. Arranjas-me uma? Eu digo-lhe que fui eu que apanhei as uvas.', en: 'It\'s my grandmother\'s birthday and she only drinks Moscatel from here. Could you find me one? I\'ll tell her I picked the grapes myself.', es: 'Mi abuela cumple años y solo bebe Moscatel de aquí. ¿Me consigues una? Le diré que las uvas las recogí yo.' },
  henrique: { pt: 'Vou dar uma prova a uns colegas e queria um exemplar da casa. Prometo cuspir com elegância.', en: 'I\'m giving a tasting to some colleagues and I\'d like a bottle from the house. I promise to spit elegantly.', es: 'Voy a dar una cata a unos colegas y quería un ejemplar de la casa. Prometo escupir con elegancia.' }
};
const ENCOMENDAS_FALAS_OBRIGADO = {
  valentim: { pt: 'Esta tem paciência no copo. Os meus amigos vão perguntar o segredo, e eu vou dizer que é teu.', en: 'This one has patience in the glass. My friends will ask for the secret, and I\'ll say it\'s yours.', es: 'Esta tiene paciencia en la copa. Mis amigos preguntarán el secreto, y diré que es tuyo.' },
  marisa: { pt: 'Ela vai adorar! E se perguntar quem a fez, digo que foi a equipa toda, gato incluído.', en: 'She\'ll love it! And if she asks who made it, I\'ll say the whole team did, cat included.', es: '¡Le va a encantar! Y si pregunta quién la hizo, diré que todo el equipo, gato incluido.' },
  henrique: { pt: 'Cor certa, nariz honesto, final comprido. Os meus colegas vão ficar com inveja, e eu também fico um bocadinho.', en: 'Right colour, honest nose, long finish. My colleagues will be jealous, and so will I, a little.', es: 'Color justo, nariz honesta, final largo. Mis colegas tendrán envidia, y yo también un poquito.' }
};

// Só em memória: o que acabou de acontecer, para mostrar uma vez na Quinta. { dia, tipo: 'entregue' | 'acabou', personagem, premio }.
let encomendaResultado = null;

function encomendaEscapar(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function encomendaModoTeste() {
  try { return typeof visitaEmModoTeste === 'function' && visitaEmModoTeste() === true; } catch (e) { return false; }
}

// O dia de hoje para as encomendas: o dia efetivo das visitas (relógio atrás: o guardado conta como hoje).
function encomendaDiaDeHoje() {
  try { if (typeof visitaDiaEfetivo === 'function') return visitaDiaEfetivo(); } catch (e) { /* segue */ }
  try { return diaLisboaDeHoje(); } catch (e) { return null; }
}

// «Agora não»: só se pode recusar o que se podia pedir; grava ultimoDia = hoje (não volta a pedir nesse dia). Pura,
// não grava (quem chama grava). { ok, motivo }.
function encomendaRecusar(estado, dia, modoTeste) {
  const p = encomendaPodePedir(estado, dia, modoTeste);
  if (!p.ok) return { ok: false, motivo: p.motivo };
  encomendasEstado(estado).ultimoDia = dia;
  return { ok: true, motivo: null };
}

// Uma garrafa acabada de engarrafar (posição `indice` do histórico): se cumpre a encomenda ativa, entrega-a (paga uma
// só vez). Em modo de teste nunca. Pura, não grava. { ok, premio, escalao, personagem }.
function encomendaEngarrafada(estado, dia, indice, modoTeste) {
  if (modoTeste === true) return { ok: false, premio: null, escalao: null, personagem: null };
  return encomendaEntregar(estado, dia, indice);
}

// Textos.
function encomendaMaiuscula(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function encomendaNome(personagem) { return t('visita.nome.' + personagem); }
function encomendaCorNome(escalao) { return t(garrafaPorDias(escalao).nomeKey); }

// O dia do prazo na língua do jogador: o dia da semana e o dia/mês («sábado, 12/10»), a partir do dia de Lisboa
// (sem relógio: a data vem do texto 'AAAA-MM-DD'). Nunca uma duração em «dias».
function encomendaDiaTexto(dia) {
  const p = diaLisboaPartes(dia);
  if (!p) return '';
  const loc = typeof localeAtual === 'function' ? localeAtual() : 'pt-PT';
  try {
    return new Intl.DateTimeFormat(loc, { weekday: 'long', day: 'numeric', month: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(p.ano, p.mes, p.dia)));
  } catch (e) {
    return (p.dia < 10 ? '0' : '') + p.dia + '/' + (p.mes < 9 ? '0' : '') + (p.mes + 1);
  }
}

// «+6 Reputação, +30 Uvas»: só as partes maiores do que 0.
function encomendaPremioTexto(premio) {
  if (!premio) return '';
  const partes = [];
  if (premio.reputacao > 0) partes.push(t('encomenda.premioRep').replace('{n}', premio.reputacao));
  if (premio.uvas > 0) partes.push(t('encomenda.premioUvas').replace('{n}', premio.uvas));
  if (premio.gotas > 0) partes.push(t('encomenda.premioGotas').replace('{n}', premio.gotas));
  return partes.join(', ');
}

function encomendaFala(falas, personagem) {
  const f = falas[personagem];
  return f ? (f[currentLang] || f.pt) : '';
}

// O agradecimento e o prémio de uma entrega (Quinta e página da garrafa).
function encomendaEntregueHtml(r) {
  if (!r || !r.personagem) return '';
  const fala = encomendaFala(ENCOMENDAS_FALAS_OBRIGADO, r.personagem);
  return '<div class="mini-bloco"><div class="oferta-resultado encomenda-resultado">' +
    '<p>' + encomendaEscapar(t('encomenda.entregue').replace('{nome}', t('oferta.a.' + r.personagem))) + '</p>' +
    '<p>' + encomendaEscapar(encomendaPremioTexto(r.premio)) + '</p>' +
    (fala ? '<p class="oferta-fala">«' + encomendaEscapar(fala) + '»</p>' : '') +
  '</div></div>';
}

// O texto curto da entrega (para a mensagem do engarrafar).
function encomendaEntregueTexto(r) {
  if (!r || !r.personagem) return '';
  return t('encomenda.entregue').replace('{nome}', t('oferta.a.' + r.personagem)) + ' ' + encomendaPremioTexto(r.premio) + '.';
}

// O bloco da Quinta. Só desenha (e, se o prazo passou, acaba a encomenda e grava UMA vez). '' se não houver nada.
function encomendaHtml() {
  if (encomendaModoTeste()) return '';
  const dia = encomendaDiaDeHoje();
  if (typeof dia !== 'string') return '';
  let html = '';
  // (c) o prazo passou: acaba agora, sem tirar nada, e mostra-se uma vez.
  const antes = encomendasNormalizar(state.encomendas).atual;
  if (antes && encomendaExpirar(state, dia)) {
    encomendaResultado = { dia: dia, tipo: 'acabou', personagem: antes.personagem, premio: null };
    saveState(state);
  }
  const res = encomendaResultado;
  if (res && res.dia === dia) {
    if (res.tipo === 'entregue') html += encomendaEntregueHtml(res);
    else if (res.tipo === 'acabou') html += '<div class="mini-bloco"><p class="oferta-linha encomenda-linha">' + encomendaEscapar(t('encomenda.acabou').replace('{nome}', encomendaNome(res.personagem))) + '</p></div>';
  }
  // (b) em curso.
  const a = encomendasNormalizar(state.encomendas).atual;
  if (a && encomendaAtiva(state, dia)) {
    return html + '<div class="mini-bloco"><p class="oferta-linha encomenda-linha">' +
      encomendaEscapar(t('encomenda.emCurso').replace('{nome}', encomendaNome(a.personagem)).replace('{cor}', encomendaCorNome(a.escalao)).replace('{dia}', encomendaDiaTexto(a.prazoDia))) + '</p></div>';
  }
  // (a) pode pedir.
  const p = encomendaPodePedir(state, dia, false);
  if (p.ok) {
    const prazo = encomendaSomarDias(dia, ENCOMENDAS_PRAZO_DIAS);
    const fala = encomendaFala(ENCOMENDAS_FALAS_PEDIDO, p.personagem);
    html += '<div class="mini-bloco encomenda-pedido">' +
      (fala ? '<p class="oferta-fala">«' + encomendaEscapar(fala) + '»</p>' : '') +
      '<p class="oferta-linha encomenda-linha">' + encomendaEscapar(encomendaMaiuscula(t('encomenda.pedido').replace('{nome}', encomendaNome(p.personagem)).replace('{cor}', encomendaCorNome(p.escalao)).replace('{dia}', encomendaDiaTexto(prazo)))) + '</p>' +
      '<div class="encomenda-botoes">' +
        '<button type="button" class="btn-pill pill-main encomenda-botao" onclick="encomendaAceitarClique()">' + encomendaEscapar(t('encomenda.aceitar')) + '</button>' +
        '<button type="button" class="btn-pill encomenda-botao" onclick="encomendaAgoraNaoClique()">' + encomendaEscapar(t('encomenda.agoraNao')) + '</button>' +
      '</div>' +
    '</div>';
  }
  return html;
}

function encomendaRedesenhar() {
  if (typeof atualizarLinhaVisitaQuinta === 'function') atualizarLinhaVisitaQuinta();
  if (typeof atualizarResumoQuinta === 'function') atualizarResumoQuinta(); // o sinal do cartão fechado (js/objetivos.js)
}

// Os ÚNICOS sítios que pedem e gravam. Se recusou, não grava. O toque duplo é travado pelas próprias regras
// (uma ativa; ultimoDia = hoje).
function encomendaAceitarClique() {
  if (!encomendaModoTeste()) {
    const r = encomendaCriar(state, encomendaDiaDeHoje(), false);
    if (r.ok) saveState(state); // a vibração leve do toque já vem do listener geral dos botões (js/main.js)
  }
  encomendaRedesenhar();
}

function encomendaAgoraNaoClique() {
  if (!encomendaModoTeste()) {
    const r = encomendaRecusar(state, encomendaDiaDeHoje(), false);
    if (r.ok) saveState(state);
  }
  encomendaRedesenhar();
}
