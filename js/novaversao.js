// ---------------------------------------------------------------------
// «HÁ UMA VERSÃO NOVA DO JOGO» — uma faixa fina por cima da barra de topo.
//
// Como sabe: pede ao próprio site o index.html (o mesmo caminho do jogo, só com
// ?nv=<hora> e cache desligada; sem o resto do endereço, por isso nada do
// jogador nem do Telegram vai no pedido) e compara a lista dos
// <script src="js/...?v=N"> e <script src="dados/...?v=N"> desse index.html com
// a dos <script> que esta página carregou. Conjuntos diferentes = versão nova.
// Só a ordem diferente não conta (os mesmos ficheiros nas mesmas versões).
//
// Quando: uma vez, uns 5 s depois de abrir, e sempre que a app volta ao
// primeiro plano; no máximo uma verificação de 10 em 10 minutos.
// Sem rede, pedido falhado ou resposta que não é o index.html do jogo: nada
// aparece e nada rebenta. Nunca atrasa o arranque (só corre depois).
//
// Onde aparece: nunca na capa, na Escolher Língua, nos minijogos (Proteger,
// cenas da Festa e do Lagar), nem por cima de painéis abertos (balão de fala,
// cartões de nova entrada e do pedido do dia, cartão do topo aberto,
// confirmação de apagar). Se for o caso, espera até sair.
// «Atualizar» chama perfilAtualizarJogo() (js/definicoes.js: grava na nuvem e
// recarrega). «Mais tarde» esconde-a durante 1 hora (só em memória: volta na
// próxima abertura). Não grava nada no estado, nem no aparelho, nem na nuvem.
// ---------------------------------------------------------------------
const NOVAVERSAO_CONFIG = {
  atrasoInicialMs: 5000,
  intervaloMinimoMs: 10 * 60 * 1000,
  adiarMs: 60 * 60 * 1000,
  reverMs: 1000,          // de quanto em quanto tempo revê se a faixa pode aparecer (só depois de haver versão nova)
  tempoLimitePedidoMs: 8000,
  minimoScripts: 10       // um index.html do jogo tem muitos; menos do que isto não é o esperado
};
const NOVAVERSAO_ECRAS_EXCLUIDOS = ['home', 'lingua', 'proteger'];
const NOVAVERSAO_RE_SCRIPT = /<script\s+src="((?:js|dados)\/[A-Za-z0-9_.\/-]+\.js\?v=[A-Za-z0-9._-]+)"\s*>/g;

let _novaVersaoUltima = 0;        // hora da última verificação (0 = nunca)
let _novaVersaoEmCurso = false;
let _novaVersaoEncontrada = false;
let _novaVersaoAdiadaAte = 0;
let _novaVersaoTimer = null;
let _novaVersaoAtualizando = false;

// Lista "ficheiro?v=N" dos scripts js/ e dados/ de um texto de index.html, pela ordem em que aparecem.
function novaVersaoListaDoHtml(html) {
  if (typeof html !== 'string') return [];
  const lista = []; let m;
  NOVAVERSAO_RE_SCRIPT.lastIndex = 0;
  while ((m = NOVAVERSAO_RE_SCRIPT.exec(html))) lista.push(m[1]);
  return lista;
}

// A mesma lista para os <script> que esta página carregou (o atributo src tal como está no index.html).
function novaVersaoListaCarregada(doc) {
  const lista = [];
  try {
    (doc || document).querySelectorAll('script[src]').forEach(function (s) {
      const src = s.getAttribute('src') || '';
      if (/^(?:js|dados)\/[A-Za-z0-9_.\/-]+\.js\?v=[A-Za-z0-9._-]+$/.test(src)) lista.push(src);
    });
  } catch (e) { return []; }
  return lista;
}

// 'igual' | 'nova' | 'invalida'. Compara os conjuntos (a ordem não conta). 'invalida' quando a resposta não parece o
// index.html do jogo (poucos scripts, sem js/main.js ou sem este ficheiro) ou quando a lista desta página está vazia.
function novaVersaoComparar(carregada, nova) {
  if (!Array.isArray(carregada) || !Array.isArray(nova) || !carregada.length) return 'invalida';
  if (nova.length < NOVAVERSAO_CONFIG.minimoScripts) return 'invalida';
  const tem = function (l, nome) { return l.some(function (s) { return s.indexOf(nome + '?v=') === 0; }); };
  if (!tem(nova, 'js/main.js') || !tem(nova, 'js/novaversao.js')) return 'invalida';
  const a = carregada.slice().sort().join('\n'), b = nova.slice().sort().join('\n');
  return a === b ? 'igual' : 'nova';
}

// Pode verificar agora? (no máximo uma vez de 10 em 10 minutos, e nunca duas ao mesmo tempo)
function novaVersaoPodeVerificar(agora) {
  if (_novaVersaoEmCurso) return false;
  return _novaVersaoUltima === 0 || agora - _novaVersaoUltima >= NOVAVERSAO_CONFIG.intervaloMinimoMs;
}

// Pede o index.html e compara. Nunca lança: qualquer falha fica em silêncio.
function novaVersaoVerificar() {
  try {
    const agora = Date.now();
    if (!novaVersaoPodeVerificar(agora)) return;
    if (typeof fetch !== 'function') return;
    _novaVersaoUltima = agora;
    _novaVersaoEmCurso = true;
    let controlo = null, limite = null;
    if (typeof AbortController === 'function') {
      controlo = new AbortController();
      limite = setTimeout(function () { _novaVersaoEmCurso = false; try { controlo.abort(); } catch (e) { /* nada */ } }, NOVAVERSAO_CONFIG.tempoLimitePedidoMs);
    }
    const endereco = location.pathname + '?nv=' + agora; // só o caminho: o ? e o # do jogo (dados do Telegram) não vão
    fetch(endereco, { cache: 'no-store', credentials: 'same-origin', signal: controlo ? controlo.signal : undefined })
      .then(function (r) { return r && r.ok ? r.text() : ''; })
      .then(function (texto) {
        if (novaVersaoComparar(novaVersaoListaCarregada(), novaVersaoListaDoHtml(texto)) === 'nova') {
          _novaVersaoEncontrada = true;
          novaVersaoLigarRevisao();
        }
      })
      .catch(function () { /* sem rede ou resposta estranha: não aparece nada */ })
      .then(function () { _novaVersaoEmCurso = false; if (limite) clearTimeout(limite); });
  } catch (e) {
    _novaVersaoEmCurso = false;
  }
}

function novaVersaoVisivel(el) {
  return !!el && !el.hidden;
}

// A faixa pode estar à vista agora? (não nos ecrãs excluídos, minijogos ou por cima de painéis abertos)
function novaVersaoPodeMostrar() {
  const ativo = document.querySelector('.screen.active');
  const ecra = ativo ? ativo.id.replace(/^screen-/, '') : null;
  if (!ecra || NOVAVERSAO_ECRAS_EXCLUIDOS.indexOf(ecra) !== -1) return false;
  // Minijogos fora do Proteger: as cenas da Festa (castanhas e outras) e o assalto do Lagar.
  if (typeof festaCenaAtual !== 'undefined' && festaCenaAtual) return false;
  if (typeof castanhasFestaAtual !== 'undefined' && castanhasFestaAtual) return false;
  if (typeof lagarAssaltoCenaAtual !== 'undefined' && lagarAssaltoCenaAtual) return false;
  // Painéis abertos.
  if (novaVersaoVisivel(document.getElementById('app-dialogue'))) return false;
  if (novaVersaoVisivel(document.getElementById('app-unlock'))) return false;
  if (novaVersaoVisivel(document.getElementById('app-pedido'))) return false;
  if (ativo.querySelector('.topcard.aberto')) return false;
  if (ativo.querySelector('#perfil-apagar-confirmar')) return false;
  return true;
}

// Mostra ou esconde a faixa conforme o que há agora.
function novaVersaoAtualizarFaixa() {
  const faixa = document.getElementById('app-novaversao');
  if (!faixa) return;
  const mostrar = _novaVersaoEncontrada && !_novaVersaoAtualizando && Date.now() >= _novaVersaoAdiadaAte && novaVersaoPodeMostrar();
  if (mostrar && faixa.hidden) {
    const texto = document.getElementById('novaversao-texto');
    const atualizar = document.getElementById('novaversao-atualizar');
    const depois = document.getElementById('novaversao-mais-tarde');
    if (texto) texto.textContent = t('novaversao.texto');
    if (atualizar) atualizar.textContent = t('novaversao.atualizar');
    if (depois) depois.textContent = t('novaversao.maisTarde');
  }
  faixa.hidden = !mostrar;
}

// Depois de haver versão nova: revê de segundo a segundo se a faixa pode aparecer (ou tem de sair).
function novaVersaoLigarRevisao() {
  novaVersaoAtualizarFaixa();
  if (_novaVersaoTimer === null && typeof setInterval === 'function') _novaVersaoTimer = setInterval(novaVersaoAtualizarFaixa, NOVAVERSAO_CONFIG.reverMs);
}

function novaVersaoMaisTarde() {
  _novaVersaoAdiadaAte = Date.now() + NOVAVERSAO_CONFIG.adiarMs;
  novaVersaoAtualizarFaixa();
}

function novaVersaoAtualizar() {
  if (_novaVersaoAtualizando) return;
  _novaVersaoAtualizando = true;
  const faixa = document.getElementById('app-novaversao');
  if (faixa) faixa.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
  if (typeof perfilAtualizarJogo === 'function') perfilAtualizarJogo();
}

// Arranque: só depois de o jogo abrir (nada aqui atrasa o arranque) e quando a app volta ao primeiro plano.
setTimeout(novaVersaoVerificar, NOVAVERSAO_CONFIG.atrasoInicialMs);
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible') novaVersaoVerificar();
});
