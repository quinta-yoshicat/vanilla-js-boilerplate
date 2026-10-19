// ---------------------------------------------------------------------
// PALAVRAS DA QUINTA — o glossário (palavras difíceis ou técnicas, com uma explicação simples).
//
// A lista, as contas e o ecrã «Palavras da Quinta» (renderPalavras, aberto pelo cartão do Perfil: palavrasCartaoPerfil() em js/perfil.js).
// SÓ LEITURA: não guarda nada, não toca em state, localStorage nem na nuvem, e não há "palavras descobertas": o jogador vê sempre todas.
//
// As palavras vêm de dados/palavras.js, por dadosAcrescentar('palavras', { id, palavra, explicacao: { pt, en, es }, nivel? }) (js/dados.js).
// Carrega ANTES de js/dados.js (a lista tem de existir quando os dados entram).
//
//   PALAVRAS_DA_QUINTA   a lista, vazia ao início: { id, palavra, explicacao: { pt, en, es }, nivel? }
//                        palavra   o termo em português, igual nas 3 línguas
//                        nivel     opcional, inteiro >= 1: o nível a partir do qual a palavra aparece (ainda por preencher)
//   palavrasTotal()      quantas há
//   palavrasResumo()     o total em texto, para o cartão do Perfil («20»)
//   palavrasOrdenadas()  uma cópia da lista por ordem alfabética (sem contar acentos nem maiúsculas); nunca mexe na lista
//   palavrasInicialMaiuscula(texto)  o texto com a 1.ª letra em maiúscula (as explicações vêm a minúsculas; só na apresentação)
//   renderPalavras()     desenha o ecrã: um cartão por palavra (a palavra em título, a explicação por baixo), por ordem alfabética
//
// A palavra e a explicação passam SEMPRE por escaparHtml() (js/i18n.js), como a Enciclopédia: vêm de dados/.
// ---------------------------------------------------------------------

const PALAVRAS_DA_QUINTA = [];

// Chave de ordenação: sem acentos nem maiúsculas ("míldio" fica entre "lagar" e "montado").
function palavrasChaveOrdem(palavra) {
  return String(palavra).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function palavrasTotal() {
  return PALAVRAS_DA_QUINTA.length;
}

function palavrasResumo() {
  return String(palavrasTotal());
}

function palavrasOrdenadas() {
  return PALAVRAS_DA_QUINTA.slice().sort(function (a, b) {
    const x = palavrasChaveOrdem(a.palavra), y = palavrasChaveOrdem(b.palavra);
    if (x < y) return -1;
    if (x > y) return 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

// A explicação começa a minúsculas nos dados («o sumo das uvas...»): no cartão leva maiúscula na 1.ª letra (e «DOP...» fica como está).
function palavrasInicialMaiuscula(texto) {
  const t = String(texto);
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// A explicação na língua do jogo (o português é a reserva).
function palavrasExplicacaoNaLingua(p) {
  const e = p && p.explicacao;
  return (e && (e[currentLang] || e.pt)) || '';
}

// O ecrã «Palavras da Quinta», no molde do Caderno e da Enciclopédia: topcard com o título, lista que desliza com um cartão por palavra
// e o botão Voltar. Só lê (nada se guarda) e escapa tudo o que vem de dados/.
function renderPalavras() {
  const container = document.getElementById('palavras-container');
  if (!container) return;
  const cartoes = palavrasOrdenadas().map(function (p) {
    return '<div class="encyclopedia-card">' +
      '<h3>' + escaparHtml(p.palavra) + '</h3>' +
      '<p>' + escaparHtml(palavrasInicialMaiuscula(palavrasExplicacaoNaLingua(p))) + '</p>' +
    '</div>';
  }).join('');

  container.innerHTML =
    '<div class="topcard">' +
      '<p class="mini-title" data-i18n="palavras.title"></p>' +
      '<p class="mini-sub">' + palavrasResumo() + ' · ' + escaparHtml(t('palavras.subtitulo')) + '</p>' +
    '</div>' +
    '<div class="scroll-panel encyclopedia-grid">' + cartoes + '</div>' +
    '<div class="action-panel">' +
      '<button type="button" class="btn-pill pill-main pill-grande" onclick="voltarEcraAnterior()" data-i18n="nav.voltar"></button>' +
    '</div>';

  atualizarDialogo('', '');
  applyTranslations();
}
