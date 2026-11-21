// ---------------------------------------------------------------------
// «VER CENÁRIO» NO ECRÃ DA QUINTA: um botão pequeno com um olho (#quinta-cenario-btn, no canto de cima à direita, do
// lado oposto ao cartão da Quinta) esconde o que tapa o cenário e volta a mostrá-lo.
//
// Esconde-se SÓ com CSS, com a classe `quinta-ver-cenario` no <body> (o contentor do ecrã e do balão de fala):
//   - o cartão da Quinta (#quinta-topcard, aberto ou fechado: fica como estava, só deixa de se ver);
//   - o balão de fala (#app-dialogue);
//   - e a camada que avança as falas (.overlay) deixa de receber toques, para um toque no cenário não passar falas
//     escondidas.
// Nada se apaga nem muda: os sinais (●), os temporizadores e o que cada cartão faz continuam por baixo.
//
// Sai sozinho (cenarioSair): ao mudar de ecrã (goTo, js/main.js, incluindo o Perfil), quando aparece uma fala nova
// (mostrarFalas) ou uma janela (o cartão de nova entrada #app-unlock ou o do pedido #app-pedido, ver
// reposicionarFlutuantes) e quando o jogo volta ao primeiro plano. Só em memória: não grava nada no estado nem na
// nuvem, e ao reabrir o jogo começa sempre com tudo visível.
// ---------------------------------------------------------------------

const CENARIO_CLASSE = 'quinta-ver-cenario';
let cenarioLigado = false;

function cenarioAtivo() {
  return cenarioLigado;
}

// O botão: o olho (ver) ou o olho riscado (ativo: mostrar os cartões), o aria-label e o title na língua do jogador.
function cenarioBotaoAtualizar() {
  const b = document.getElementById('quinta-cenario-btn');
  if (!b) return;
  const chave = cenarioLigado ? 'quinta.cenario.mostrar' : 'quinta.cenario.ver';
  try {
    b.setAttribute('data-i18n-aria', chave);
    b.setAttribute('data-i18n-title', chave);
    b.setAttribute('aria-label', t(chave));
    b.setAttribute('title', t(chave));
    b.setAttribute('aria-pressed', cenarioLigado ? 'true' : 'false');
    b.classList.toggle('ativo', cenarioLigado);
  } catch (e) { /* elemento sem atributos */ }
}

function cenarioPor(ligado) {
  cenarioLigado = ligado === true;
  try { document.body.classList.toggle(CENARIO_CLASSE, cenarioLigado); } catch (e) { /* sem body */ }
  cenarioBotaoAtualizar();
}

// Tocar no olho. Só liga no ecrã da Quinta; desligar funciona sempre.
function cenarioAlternar() {
  if (!cenarioLigado) {
    const ativo = document.querySelector('.screen.active');
    if (!ativo || ativo.id !== 'screen-quinta') return;
  }
  cenarioPor(!cenarioLigado);
}

// Volta tudo a ver-se (se estava escondido). Pode chamar-se sempre.
function cenarioSair() {
  if (cenarioLigado) cenarioPor(false);
}

// Abriu-se uma janela por cima (nova entrada ou pedido do dia): sai do «ver cenário».
function cenarioVerJanelas() {
  if (!cenarioLigado) return;
  const aberta = ['app-unlock', 'app-pedido'].some(function (id) { const e = document.getElementById(id); return !!e && e.hidden === false; });
  if (aberta) cenarioSair();
}

if (typeof document !== 'undefined' && document && typeof document.addEventListener === 'function') {
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') cenarioSair(); });
}
