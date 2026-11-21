// ---------------------------------------------------------------------
// PROVA ÀS CEGAS (PR 1 de 3: só regras, INVISÍVEL — nada do jogo chama estas funções ainda).
//
// A partir do nível 6 (o da Coleção, ecraDesbloqueado('colecao') em js/niveis.js), uma vez por dia, o Dr. Henrique
// (js/visitas.js) dá a provar três vinhos às cegas: em cada ronda uma descrição curta e as quatro cores da Cave
// (escalões 1 a 4 de js/garrafa.js: Jovem, Dourado, Âmbar, Cobre). Acertar dá Gotas (e Reputação, se acertar as
// três); falhar não tira nada.
//
// As descrições e as linhas que ensinam cada cor vêm de dados/provas.js (dadosAcrescentar('provas', ...), js/dados.js)
// e entram em PROVA_DESCRICOES e PROVA_ENSINO. O estado (state.prova = { ultimoDia, dias, acertos }) e a reparação
// estão em js/state.js (provaNormalizar, provaEstado); a nuvem junta-o em nuvemJuntarLeves() (js/nuvem.js).
//
// Funções puras quanto ao tempo e ao acaso: o estado, o dia ('AAAA-MM-DD', Lisboa) e o modo de teste chegam por
// argumento; não leem o relógio, não sorteiam (nada de Math.random: tudo sai do dia, com o hash de visitasHash),
// não gravam (quem chama grava). As que mudam alguma coisa (começar, terminar) só mudam o estado que recebem, e só
// depois de validar tudo: recusar nunca altera nada.
// Uma prova por dia: começar grava LOGO ultimoDia = hoje (quem fechar a app a meio não recomeça, e as rondas do dia
// são sempre as mesmas, por isso recomeçar seria saber as respostas). O prémio paga-se no fim, uma só vez por sessão.
// Usa: diaLisboaPartes, diasEntreDiasLisboa, diaLisboaEfetivo e DIAS_FUTURO_MAXIMO (js/tempo.js),
// nivelPelaReputacao e ecraDesbloqueado (js/niveis.js), provaNormalizar e provaEstado (js/state.js).
// ---------------------------------------------------------------------

const PROVA_NIVEL_MINIMO = 6;
const PROVA_RONDAS = 3;
const PROVA_CORES = [1, 2, 3, 4];          // os escalões da Cave: 1 Jovem, 2 Dourado, 3 Âmbar, 4 Cobre
const PROVA_GOTAS_POR_CERTA = 6;           // por cada ronda certa
const PROVA_REPUTACAO_TODAS_CERTAS = 3;    // só se acertar as três

// Enchidas por dados/provas.js (ver js/dados.js): descrições { id, cor, texto: { pt, en, es } } e, por cor,
// a linha que ensina { id, texto }.
const PROVA_DESCRICOES = [];
const PROVA_ENSINO = {};

// O mesmo tipo de hash de visitasHash() (js/visitas.js), com sementes próprias.
function provaHash(semente) {
  let h = 0;
  for (let i = 0; i < semente.length; i++) h = (h * 31 + semente.charCodeAt(i)) >>> 0;
  return h;
}

// As rondas do dia: [{ ronda (1 a 3), cor, descricao }], com as 3 cores DIFERENTES entre si. A cor da ronda r sai das
// que ainda não saíram com a semente dia + '#prova#' + r; a descrição, entre as dessa cor, com dia + '#prova#' + r +
// '#descricao'. Sempre as mesmas para o mesmo dia. [] se o dia não for válido ou faltar descrição de uma cor.
function provaRondasDoDia(dia) {
  if (typeof dia !== 'string' || diaLisboaPartes(dia) === null) return [];
  const livres = PROVA_CORES.slice();
  const rondas = [];
  for (let r = 1; r <= PROVA_RONDAS; r++) {
    const cor = livres.splice(provaHash(dia + '#prova#' + r) % livres.length, 1)[0];
    const daCor = PROVA_DESCRICOES.filter(function (d) { return d.cor === cor; });
    if (!daCor.length) return [];
    const d = daCor[provaHash(dia + '#prova#' + r + '#descricao') % daCor.length];
    rondas.push({ ronda: r, cor: cor, descricao: { id: d.id, texto: { pt: d.texto.pt, en: d.texto.en, es: d.texto.es } } });
  }
  return rondas;
}

function provaNivel(estado) {
  try { return nivelPelaReputacao(estado.reputacao); } catch (e) { return 0; }
}

// Pode jogar hoje? Só lê. { ok, motivo }, motivo null | 'modo_teste' | 'dia' | 'nivel' | 'ja_hoje' | 'sem_textos'.
function provaPodeJogar(estado, dia, modoTeste) {
  const recusa = function (motivo) { return { ok: false, motivo: motivo }; };
  if (modoTeste === true) return recusa('modo_teste');
  if (!estado || typeof estado !== 'object' || diaLisboaPartes(dia) === null) return recusa('dia');
  if (!(provaNivel(estado) >= PROVA_NIVEL_MINIMO)) return recusa('nivel');
  try { if (typeof ecraDesbloqueado === 'function' && !ecraDesbloqueado('colecao')) return recusa('nivel'); } catch (e) { return recusa('nivel'); }
  const p = provaNormalizar(estado.prova);
  // Uma por dia: com a data do aparelho atrás, o dia guardado (até DIAS_FUTURO_MAXIMO à frente) conta como hoje.
  if (p.ultimoDia !== null && diaLisboaEfetivo(dia, p.ultimoDia) === p.ultimoDia) return recusa('ja_hoje');
  if (provaRondasDoDia(dia).length !== PROVA_RONDAS) return recusa('sem_textos');
  return { ok: true, motivo: null };
}

// Começa a prova de hoje: grava ultimoDia = dia JÁ (antes da 1.ª resposta). Valida antes; se recusar, não altera nada.
// Devolve { ok, motivo, sessao }, sessao = { dia, rondas, paga: false } (só em memória; quem chama guarda-a até ao fim).
function provaComecar(estado, dia, modoTeste) {
  const p = provaPodeJogar(estado, dia, modoTeste);
  if (!p.ok) return { ok: false, motivo: p.motivo, sessao: null };
  provaEstado(estado).ultimoDia = dia;
  return { ok: true, motivo: null, sessao: { dia: dia, rondas: provaRondasDoDia(dia), paga: false } };
}

// A resposta da ronda `indice` (0 a 2) está certa? Só lê.
function provaVerificar(sessao, indice, cor) {
  if (!sessao || !Array.isArray(sessao.rondas)) return false;
  const r = sessao.rondas[indice];
  return !!r && typeof cor === 'number' && r.cor === cor;
}

// O prémio de `certas` rondas certas (0 a 3): { gotas, reputacao }.
function provaPremio(certas) {
  const n = typeof certas === 'number' && Number.isInteger(certas) ? Math.max(0, Math.min(PROVA_RONDAS, certas)) : 0;
  return { gotas: n * PROVA_GOTAS_POR_CERTA, reputacao: n === PROVA_RONDAS ? PROVA_REPUTACAO_TODAS_CERTAS : 0 };
}

function provaNumero(x) {
  return typeof x === 'number' && Number.isFinite(x) ? x : 0;
}

// Termina a prova da sessão com as `respostas` (as 3 cores escolhidas, pela ordem das rondas): paga o prémio UMA vez
// (sessao.paga), soma 1 a dias e as certas a acertos. Falhar não tira nada. Só paga uma sessão que tenha começado hoje
// neste estado (ultimoDia === sessao.dia): uma sessão velha ou de outro estado é recusada sem alterar nada.
// Não grava (quem chama grava). { ok, motivo, certas, premio }.
function provaTerminar(estado, sessao, respostas) {
  const recusa = function (motivo) { return { ok: false, motivo: motivo, certas: 0, premio: provaPremio(0) }; };
  if (!estado || typeof estado !== 'object' || !sessao || typeof sessao !== 'object' || !Array.isArray(sessao.rondas) || sessao.rondas.length !== PROVA_RONDAS) return recusa('sessao');
  if (sessao.paga === true) return recusa('ja_paga');
  if (!Array.isArray(respostas) || respostas.length !== PROVA_RONDAS || !respostas.every(function (c) { return PROVA_CORES.indexOf(c) !== -1; })) return recusa('respostas');
  const p = provaNormalizar(estado.prova);
  if (p.ultimoDia !== sessao.dia) return recusa('outro_dia');
  let certas = 0;
  for (let i = 0; i < PROVA_RONDAS; i++) if (provaVerificar(sessao, i, respostas[i])) certas++;
  const premio = provaPremio(certas);
  const e = provaEstado(estado);
  estado.gotas = provaNumero(estado.gotas) + premio.gotas;
  estado.reputacao = provaNumero(estado.reputacao) + premio.reputacao;
  e.dias += 1;
  e.acertos += certas;
  sessao.paga = true;
  return { ok: true, motivo: null, certas: certas, premio: premio };
}

// A linha que ensina a cor (dados/provas.js), na língua pedida (pt por omissão), ou ''.
function provaEnsino(cor, lingua) {
  const e = PROVA_ENSINO[cor];
  if (!e || !e.texto) return '';
  return e.texto[lingua] || e.texto.pt || '';
}
