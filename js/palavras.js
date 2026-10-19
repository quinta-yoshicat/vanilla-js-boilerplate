// ---------------------------------------------------------------------
// PALAVRAS DA QUINTA — o glossário (palavras difíceis ou técnicas, com uma explicação simples).
//
// Só a lista e as contas. Ainda sem ecrã nem HTML (a PR seguinte desenha-o). SÓ LEITURA: não guarda nada, não toca em state, localStorage
// nem na nuvem, e não há "palavras descobertas": o jogador vê sempre todas.
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
//
// Quem desenhar estas palavras tem de passar a palavra e a explicação por escaparHtml() (js/i18n.js), como a Enciclopédia: vêm de dados/.
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
