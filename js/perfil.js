// ---------------------------------------------------------------------
// PERFIL — pontos atuais, garrafas feitas (número e data da última) e título especial.
// Vibração, Som, nuvem, versão, diagnóstico, «Atualizar o jogo» e «Apagar» estão nas Definições
// (js/definicoes.js), que a roda dentada do cartão do título abre.
// ---------------------------------------------------------------------

// Convite de amigos (botão "Convidar amigos" no Perfil): escondido por defeito.
// Aparece se CONVITES_ATIVOS for true ou se o endereço tiver ?convites=teste.
const CONVITES_ATIVOS = false;
const LINK_CONVITE = 'https://t.me/YoshiCatQuintaBot';

function convitesVisiveis() {
  return CONVITES_ATIVOS || new URLSearchParams(location.search).get('convites') === 'teste';
}

// Ícones simples de traço (substituem os emojis 🍇💧⭐🍾📖🏅).
const PERFIL_ICONES = {
  uvas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><circle cx="9" cy="16" r="3"></circle><circle cx="15" cy="18" r="3"></circle><circle cx="11" cy="11" r="3"></circle><circle cx="17" cy="12.5" r="3"></circle><path d="M12 5v3.5"></path><path d="M12 5c1.4-1.3 3-1.8 4.6-1.6"></path></svg>',
  gotas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M12 3c3.4 4.6 6.8 8.5 6.8 12.3a6.8 6.8 0 1 1-13.6 0C5.2 11.5 8.6 7.6 12 3z"></path></svg>',
  reputacao: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M12 3l2.9 6.1 6.6.9-4.8 4.6 1.1 6.6L12 18l-5.8 3.2 1.1-6.6-4.8-4.6 6.6-.9z"></path></svg>',
  garrafas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M10 2h4v3.8l1.8 2.7c.4.6.7 1.4.7 2.2V20a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2V10.7c0-.8.2-1.6.7-2.2L10 5.8V2z"></path><path d="M10 11.5h4"></path></svg>',
  conquistas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><circle cx="12" cy="9" r="5"></circle><path d="M9 13l-1.5 8L12 18l4.5 3-1.5-8"></path></svg>',
  caderno: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6z"></path><path d="M6 3v18"></path><path d="M9.5 8h5"></path><path d="M9.5 12h5"></path></svg>',
  conhecimento: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M4 5.5c2.2-1.2 5.3-1.2 8 0v13c-2.7-1.2-5.8-1.2-8 0v-13z"></path><path d="M20 5.5c-2.2-1.2-5.3-1.2-8 0v13c2.7-1.2 5.8-1.2 8 0v-13z"></path></svg>',
  palavras: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6.5L8 20.5V17H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"></path><path d="M6.3 14l2.4-6.2 2.4 6.2"></path><path d="M7.2 12h3"></path><circle cx="15.2" cy="12.2" r="1.7"></circle><path d="M16.9 10.5v3.7"></path></svg>'
};

// Roda dentada do canto do cartão do título: abre as Definições (js/definicoes.js). Traço, como os outros ícones.
const PERFIL_DEFINICOES_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="22" height="22" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';

const PERFIL_MEDALHA_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="12" cy="9" r="5"></circle><path d="M9 13l-1.5 8L12 18l4.5 3-1.5-8"></path></svg>';


// Cartão "A Coleção x / 4": só a partir do nível 6 (colecaoVisivel, js/garrafa.js).
function colecaoCartaoPerfil() {
  if (typeof colecaoVisivel !== 'function' || !colecaoVisivel()) return '';
  return perfilCard(PERFIL_ICONES.garrafas, colecaoResumo(), 'colecao.title',
    ' role="button" tabindex="0" onclick="goTo(\'colecao\')" onkeydown="if (event.key === \'Enter\') goTo(\'colecao\')"');
}

function perfilCard(icone, value, i18nKey, atributos) {
  return '<div class="profile-card"' + (atributos || '') + '><div class="stat-icon">' + icone + '</div><div class="stat-value">' + value +
    '</div><div class="stat-label" data-i18n="' + i18nKey + '"></div></div>';
}

// Cartão "Caderno n / 15": só aparece com o Caderno aberto (nível 3, ou jogador
// antigo — ver ecraDesbloqueado em js/niveis.js); abaixo disso nem se vê.
function cadernoCartaoPerfil() {
  if (typeof cadernoResumo !== 'function' || typeof ecraDesbloqueado !== 'function' || !ecraDesbloqueado('caderno')) return '';
  return perfilCard(PERFIL_ICONES.caderno, cadernoResumo(), 'perfil.caderno',
    ' role="button" tabindex="0" onclick="goTo(\'caderno\')" onkeydown="if (event.key === \'Enter\') goTo(\'caderno\')"');
}

// Cartão "Palavras n": o glossário «Palavras da Quinta» (js/palavras.js). Só a partir do nível 4 (ou jogador antigo — ver ecraDesbloqueado
// em js/niveis.js); abaixo disso nem se vê. O número é só o total das palavras: não há palavras "descobertas" nem nada que se guarde.
function palavrasCartaoPerfil() {
  if (typeof palavrasResumo !== 'function' || typeof ecraDesbloqueado !== 'function' || !ecraDesbloqueado('palavras')) return '';
  return perfilCard(PERFIL_ICONES.palavras, palavrasResumo(), 'perfil.palavras',
    ' role="button" tabindex="0" onclick="goTo(\'palavras\')" onkeydown="if (event.key === \'Enter\') goTo(\'palavras\')"');
}

function renderPerfil() {
  const container = document.getElementById('perfil-container');
  if (typeof conquistasRegistarGanhas === 'function') conquistasRegistarGanhas(); // conquistas e medalha já ganhas ficam registadas

  const tituloHtml = tituloEspecialDesbloqueado()
    ? '<div class="badge-title">' + PERFIL_MEDALHA_SVG + ' <span data-i18n="perfil.titulo.guardiao"></span></div>'
    : '';

  const garrafasInfoHtml = state.garrafas > 0
    ? '<p class="info-text">' + state.garrafas + ' — <span data-i18n="perfil.ultimaLabel"></span>: ' + state.ultimaGarrafaData + '</p>'
    : '<p class="info-text" data-i18n="perfil.semGarrafas"></p>';

  const convidarHtml = convitesVisiveis()
    ? '<button type="button" class="btn-ghost" onclick="convidarAmigos()" data-i18n="perfil.btnConvidar"></button>'
    : '';

  container.innerHTML =
    '<div class="topcard perfil-topo">' +
      '<p class="mini-title" id="perfil-titulo" data-i18n="perfil.title"></p>' +
      '<button type="button" class="perfil-definicoes-btn" id="perfil-definicoes" onclick="goTo(\'definicoes\')" data-i18n-aria="perfil.definicoesAria" aria-label="Definições">' + PERFIL_DEFINICOES_SVG + '</button>' +
    '</div>' +
    '<div class="scroll-panel">' +
      '<div class="profile-grid">' +
        perfilCard(PERFIL_ICONES.uvas, state.uvas, 'stat.uvas') +
        perfilCard(PERFIL_ICONES.gotas, state.gotas, 'stat.gotas') +
        perfilCard(PERFIL_ICONES.reputacao, state.reputacao, 'stat.reputacao') +
        perfilCard(PERFIL_ICONES.garrafas, state.garrafas, 'stat.garrafas') +
        perfilCard(PERFIL_ICONES.conhecimento, state.conhecimento, 'stat.conhecimento') +
        perfilCard(PERFIL_ICONES.conquistas, conquistasResumo(), 'perfil.conquistas',
          ' role="button" tabindex="0" onclick="goTo(\'conquistas\')" onkeydown="if (event.key === \'Enter\') goTo(\'conquistas\')"') +
        cadernoCartaoPerfil() +
        palavrasCartaoPerfil() +
        colecaoCartaoPerfil() +
      '</div>' +
      '<p class="info-text" data-i18n="perfil.conhecimentoNota"></p>' +
      tituloHtml +
      '<h2 data-i18n="perfil.galeriaTitulo"></h2>' +
      garrafasInfoHtml +
      // Encomendas entregues (state.encomendas.cumpridas, pelo reparo de sempre; 0 se nunca entregou nenhuma).
      '<p class="info-text perfil-encomendas">' + t('perfil.encomendasEntregues').replace('{n}', typeof encomendasNormalizar === 'function' ? encomendasNormalizar(state.encomendas).cumpridas : 0) + '</p>' +
    '</div>' +
    '<div class="action-panel">' +
      convidarHtml +
      // Os dois botões de baixo lado a lado, metade da largura cada um (ver .perfil-botoes-lado no index.html).
      '<div class="perfil-botoes-lado">' +
        '<button type="button" class="btn-pill pill-main pill-grande" onclick="goTo(\'enciclopedia\')" data-i18n="perfil.btnEnciclopedia"></button>' +
        '<button type="button" class="btn-ghost" onclick="goTo(\'home\')" data-i18n="perfil.btnSairInicio"></button>' +
      '</div>' +
    '</div>';

  atualizarDialogo('', '');
  applyTranslations();
  perfilLigarIndicadorScroll();
}


// ---------------------------------------------------------------------
// INDICADOR DE "HÁ MAIS POR BAIXO" no cartão do Perfil (só aspeto):
// o painel acaba sempre por cima do painel de ações (nunca por baixo
// dele) e um esbatido dourado no fundo (CSS, "#perfil-container
// .scroll-panel::after") mostra que se pode deslizar; a classe "fim"
// apaga-o quando se chega ao fim. Nada aqui toca no estado.
// ---------------------------------------------------------------------
function perfilAtualizarPainel() {
  const sp = document.querySelector('#perfil-container .scroll-panel');
  const ap = document.querySelector('#perfil-container .action-panel');
  if (!sp) return;
  if (ap) {
    const folga = ap.getBoundingClientRect().top - sp.getBoundingClientRect().top - 8;
    if (folga > 120) sp.style.maxHeight = Math.floor(folga) + 'px';
  }
  sp.classList.toggle('fim', sp.scrollTop + sp.clientHeight >= sp.scrollHeight - 4);
}

function perfilLigarIndicadorScroll() {
  const sp = document.querySelector('#perfil-container .scroll-panel');
  if (!sp) return;
  sp.addEventListener('scroll', perfilAtualizarPainel, { passive: true });
  // Texto que muda depois (ex.: a língua) muda a altura.
  if (typeof MutationObserver === 'function') {
    new MutationObserver(perfilAtualizarPainel).observe(sp, { childList: true, subtree: true, characterData: true, attributes: true });
  }
  perfilAtualizarPainel();
}

window.addEventListener('resize', perfilAtualizarPainel);




// Abre a partilha do Telegram com o link do jogo. Não lê contactos, não guarda
// nada e não faz pedidos de rede: é só o Telegram a abrir o seu próprio ecrã.
function convidarAmigos() {
  const dentroDoTelegram = tg.initDataUnsafe && Object.keys(tg.initDataUnsafe).length > 0;
  if (dentroDoTelegram && typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast('6.1')) {
    tg.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent(LINK_CONVITE) +
      '&text=' + encodeURIComponent(t('convite.texto')));
  } else {
    showMessage(t('convite.texto') + '\n\n' + t('convite.fora') + '\n' + LINK_CONVITE);
  }
}

// ---------------------------------------------------------------------
// FOTO DO TELEGRAM NO BOTÃO DO PERFIL (.profile-btn na barra de topo) —
// SÓ MOSTRA, nunca guarda: lê apenas tg.initDataUnsafe.user.photo_url (nenhum
// outro campo do utilizador) e o endereço fica numa variável local e no src
// da imagem — não vai para o state, localStorage, nuvem, logs nem bot.
// A reserva é a cara do YoshiCat (js/personagens.js), que aparece logo; a
// foto do Telegram só a substitui depois de carregar. Se não houver foto, o
// endereço for inválido, a foto falhar ou o jogo abrir fora do Telegram,
// fica a cara; se esta também falhar, fica o desenho (SVG) de sempre. O
// botão é HTML estático (index.html): nada o redesenha.
// ---------------------------------------------------------------------
function fotoTelegramEnderecoValido(endereco) {
  try {
    const u = new URL(endereco);
    if (u.protocol !== 'https:') return false;
    return ['t.me', 'telegram.org'].some(function (d) {
      return u.hostname === d || u.hostname.endsWith('.' + d);
    });
  } catch (e) {
    return false;
  }
}

// Mostra "src" no botão (substituindo a imagem que lá estiver) só depois
// de carregar: nunca há imagem partida nem botão vazio.
function perfilBotaoMostrarImagem(botao, src, aoCarregar) {
  const img = new Image();
  img.className = 'profile-foto';
  img.alt = '';
  img.referrerPolicy = 'no-referrer';
  img.onload = function () {
    if (aoCarregar && !aoCarregar()) return;
    botao.querySelectorAll('img.profile-foto').forEach(function (antiga) { botao.removeChild(antiga); });
    const desenho = botao.querySelector('svg');
    if (desenho) desenho.style.display = 'none';
    botao.appendChild(img);
  };
  img.src = src;
}

function fotoTelegramNoBotao() {
  try {
    const botao = document.querySelector('.profile-btn');
    if (!botao) return;
    let temFotoTelegram = false;

    // Reserva: a cara do YoshiCat (nunca sobrepõe a foto do Telegram).
    const cara = typeof caraDoPersonagem === 'function' ? caraDoPersonagem('YoshiCat') : null;
    if (cara) perfilBotaoMostrarImagem(botao, cara, function () { return !temFotoTelegram; });

    const utilizador = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
    const endereco = utilizador && utilizador.photo_url;
    if (typeof endereco !== 'string' || !fotoTelegramEnderecoValido(endereco)) return;
    perfilBotaoMostrarImagem(botao, endereco, function () { temFotoTelegram = true; return true; });
  } catch (e) { /* sem imagem: fica o desenho de sempre */ }
}
fotoTelegramNoBotao();
