// ---------------------------------------------------------------------
// DEFINIÇÕES — ecrã aberto pela roda dentada do cartão do título do Perfil
// (ver renderPerfil() em js/perfil.js). Tem o que antes estava no fundo do
// Perfil, com a mesma lógica: Vibração, Som, a linha da nuvem («última
// gravação», escrita por nuvemAtualizarLinhaPerfil() em js/nuvem.js no
// elemento #perfil-nuvem-estado), a versão, o diagnóstico escondido (5 toques
// no título), «Atualizar o jogo» e, à parte e em baixo, «Apagar o meu
// progresso» com o aviso forte e a confirmação em dois passos.
// Os ids (perfil-*) e os nomes das funções ficaram os de antes: o js/nuvem.js
// e os testes procuram-nos assim. Sem nível mínimo e sem estado próprio:
// só a Vibração e o Som gravam (como antes), e o Apagar.
// ---------------------------------------------------------------------
function renderDefinicoes() {
  const container = document.getElementById('definicoes-container');
  if (!container) return;
  container.innerHTML =
    '<div class="topcard"><p class="mini-title" id="definicoes-titulo" data-i18n="definicoes.title" onclick="perfilToqueTitulo()"></p></div>' +
    '<div class="scroll-panel definicoes-painel">' +
      '<p class="info-text">' +
        '<label><input type="checkbox" id="perfil-vibracao-check" onchange="alternarVibracao(this.checked)"> ' +
        '<span data-i18n="perfil.vibracao"></span></label>' +
      '</p>' +
      '<p class="info-text">' +
        '<label><input type="checkbox" id="perfil-som-check" onchange="alternarSom(this.checked)"> ' +
        '<span data-i18n="perfil.som"></span></label>' +
      '</p>' +
      '<p class="info-text nuvem-estado" id="perfil-nuvem-estado"></p>' +
      '<p class="info-text nuvem-estado" id="perfil-diagnostico" style="white-space: pre-line" hidden></p>' +
      '<p class="info-text nuvem-estado" id="perfil-versao"></p>' +
      '<button type="button" class="btn-ghost" id="perfil-atualizar" onclick="perfilAtualizarJogo()" data-i18n="perfil.btnAtualizar"></button>' +
      // Zona de perigo, separada do resto e em baixo: o aviso forte vem SEMPRE antes do botão.
      '<div class="definicoes-perigo">' +
        '<p class="definicoes-perigo-aviso" data-i18n="definicoes.apagarAvisoForte"></p>' +
        '<p class="info-text" id="perfil-apagar-aviso" data-i18n="perfil.apagarAviso" hidden></p>' +
        '<button type="button" class="btn-ghost btn-perigo" id="perfil-apagar-pedir" onclick="perfilPedirApagar()" data-i18n="perfil.btnApagar"></button>' +
      '</div>' +
    '</div>' +
    '<div class="action-panel">' +
      '<button type="button" class="btn-pill pill-main pill-grande" onclick="voltarEcraAnterior()" data-i18n="nav.voltar"></button>' +
    '</div>';

  const checkVibracao = document.getElementById('perfil-vibracao-check');
  if (checkVibracao) checkVibracao.checked = state.vibracao;
  const checkSom = document.getElementById('perfil-som-check');
  if (checkSom) checkSom.checked = state.som;

  atualizarDialogo('', '');
  applyTranslations();
  if (typeof nuvemAtualizarLinhaPerfil === 'function') nuvemAtualizarLinhaPerfil();
  perfilAtualizarDiagnostico();
  perfilMostrarVersao();
}

// ---------------------------------------------------------------------
// DIAGNÓSTICO ESCONDIDO (só para o Nuno ver): aparece com 5 toques seguidos, em
// menos de 3 segundos, no título «Definições» (e esconde-se com outros 5; antes era no título do Perfil). Só LÊ e mostra:
//   - o id do utilizador do Telegram (tg.initDataUnsafe.user.id) é pessoal: fica só no
//     texto do ecrã, em memória. Nunca vai para o state, localStorage, nuvem nem logs;
//   - o resto vem de nuvemDiag, nuvemEstado e arranque (js/nuvem.js, js/state.js), tudo
//     em memória, sem leituras extra da nuvem (por isso as chaves yc_state_* são as que o
//     meta diz: 1 + partes; partes órfãs, se as houver, não se veem aqui);
//   - a versão do state.js é o ?v= do index.html.
// O bloco só tem texto quando está visível (escondido, é um <p> vazio).
// ---------------------------------------------------------------------
const PERFIL_DIAG_TOQUES = 5;
const PERFIL_DIAG_JANELA_MS = 3000;
let _perfilDiagToques = [];
let _perfilDiagVisivel = false;

function perfilToqueTitulo() {
  const agora = Date.now();
  _perfilDiagToques.push(agora);
  if (_perfilDiagToques.length > PERFIL_DIAG_TOQUES) _perfilDiagToques.shift();
  if (_perfilDiagToques.length < PERFIL_DIAG_TOQUES) return;
  if (agora - _perfilDiagToques[0] >= PERFIL_DIAG_JANELA_MS) return;
  _perfilDiagToques = [];
  _perfilDiagVisivel = !_perfilDiagVisivel;
  perfilAtualizarDiagnostico();
}

function perfilDiagHora(ms) {
  if (!ms) return t('perfil.diag.nada');
  const d = new Date(ms);
  function dois(n) { return ('0' + n).slice(-2); }
  return dois(d.getDate()) + '/' + dois(d.getMonth() + 1) + ' ' + dois(d.getHours()) + ':' + dois(d.getMinutes()) + ':' + dois(d.getSeconds());
}

function perfilDiagVersaoStateJs() {
  try {
    const el = document.querySelector('script[src*="js/state.js"]');
    const m = el && /[?&]v=([^&#]+)/.exec(el.getAttribute('src') || '');
    return m ? 'v' + m[1] : t('perfil.diag.nada');
  } catch (e) { return t('perfil.diag.nada'); }
}

function perfilDiagnosticoTexto() {
  const utilizador = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
  const id = utilizador && Number.isSafeInteger(utilizador.id) && utilizador.id > 0 ? String(utilizador.id) : t('perfil.diag.semId');
  const d = (typeof nuvemDiag === 'object' && nuvemDiag) || { origem: null, estatus: null, lidaEm: 0, metaEm: null, partesMeta: null };
  const origens = { 'nuvem': 'perfil.diag.o.nuvem', 'local': 'perfil.diag.o.local', 'novo': 'perfil.diag.o.novo', 'sem nuvem': 'perfil.diag.o.semNuvem', 'erro': 'perfil.diag.o.erro' };
  let origem = t(origens[d.origem] || 'perfil.diag.o.aLer');
  if (d.estatus) origem += ' (' + t('perfil.diag.estatuto') + ': ' + d.estatus + ')';
  const gravou = (typeof nuvemEstado === 'object' && nuvemEstado && nuvemEstado.ok === true) ? perfilDiagHora(nuvemEstado.em) : t('perfil.diag.nada');
  // Nuvem vazia: 0 chaves. Com save: o meta + as partes que ele diz ter.
  const chaves = d.partesMeta === null ? t('perfil.diag.nada') : String(d.partesMeta === 0 ? 0 : 1 + d.partesMeta);
  return [
    t('perfil.diag.titulo'),
    t('perfil.diag.id') + ': ' + id,
    t('perfil.diag.origem') + ': ' + origem,
    t('perfil.diag.gravou') + ': ' + gravou,
    t('perfil.diag.leu') + ': ' + perfilDiagHora(d.lidaEm),
    t('perfil.diag.meta') + ': ' + (d.metaEm === null ? t('perfil.diag.nada') : perfilDiagHora(d.metaEm)),
    t('perfil.diag.chaves') + ': ' + chaves,
    t('perfil.diag.versao') + ': ' + perfilDiagVersaoStateJs()
  ].join('\n');
}

function perfilAtualizarDiagnostico() {
  const el = document.getElementById('perfil-diagnostico');
  if (!el) return;
  if (!_perfilDiagVisivel) { el.hidden = true; el.textContent = ''; return; }
  el.textContent = perfilDiagnosticoTexto();
  el.hidden = false;
}

function alternarVibracao(ligada) {
  state.vibracao = ligada;
  saveState(state);
}

function alternarSom(ligada) {
  state.som = ligada;
  saveState(state);
  somAplicarInterruptor(ligada);
}

// ---------------------------------------------------------------------
// APAGAR O MEU PROGRESSO — confirmação em dois toques (1.º: botão das
// Definições, por baixo do aviso forte; 2.º: "Apagar tudo", a vermelho, ao lado do
// "Cancelar" em destaque, que volta a desenhar as Definições sem apagar nada). Só o 2.º apaga. Ver nuvemApagarTudo() em
// js/nuvem.js (nuvem primeiro; se falhar, não se apaga nada).
// ---------------------------------------------------------------------

function perfilPedirApagar() {
  const aviso = document.getElementById('perfil-apagar-aviso');
  const painel = document.querySelector('#definicoes-container .action-panel');
  if (!aviso || !painel) return;
  aviso.hidden = false;
  const primeiro = document.getElementById('perfil-apagar-pedir');
  if (primeiro) primeiro.hidden = true; // o 1.º botão sai: só sobram o Cancelar e o "Apagar tudo"
  painel.innerHTML =
    '<button type="button" id="perfil-apagar-cancelar" class="btn-pill pill-main pill-grande" onclick="renderDefinicoes()" data-i18n="perfil.apagarCancelar"></button>' +
    '<button type="button" id="perfil-apagar-confirmar" class="btn-ghost btn-perigo" onclick="perfilApagarTudo()" data-i18n="perfil.apagarConfirmar"></button>';
  applyTranslations();
  aviso.scrollIntoView({ block: 'nearest' });
}

function perfilApagarBotoes(ativos) {
  ['perfil-apagar-cancelar', 'perfil-apagar-confirmar'].forEach(function (id) {
    const b = document.getElementById(id);
    if (b) { b.disabled = !ativos; b.style.opacity = ativos ? '' : '0.5'; }
  });
}

function perfilApagarTudo() {
  if (apagando) return;
  // Trava tudo o que grava, ANTES de apagar.
  apagando = true;
  nuvemCancelarGravacaoPendente();
  if (typeof pararRelogioVinha === 'function') pararRelogioVinha();
  perfilApagarBotoes(false);
  const aviso = document.getElementById('perfil-apagar-aviso');
  if (aviso) aviso.textContent = t('perfil.apagarA');

  nuvemApagarTudo(function (ok) {
    if (!ok) {
      // Falhou ou não respondeu: não se apagou nada, nem no aparelho.
      apagando = false;
      if (aviso) aviso.textContent = t('perfil.apagarAviso');
      perfilApagarBotoes(true);
      showMessage(t('perfil.apagarFalha'));
      return;
    }
    // Nuvem apagada (ou inexistente): só as duas chaves conhecidas. STORAGE_KEY é a desta conta
    // (com id do Telegram, a por utilizador; sem id, a de sempre; ver js/state.js): nunca a de outra conta.
    // A cache do tempo (TEMPO_CACHE_KEY) é a única partilhada: não tem nada de pessoal e volta a pedir-se.
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TEMPO_CACHE_KEY);
    } catch (e) { /* sem acesso ao localStorage: nada mais a apagar */ }
    if (aviso) aviso.textContent = t('perfil.apagarFeito');
    // "apagando" fica ligado: nada volta a gravar antes do reload.
    setTimeout(function () { location.reload(); }, 600);
  });
}

// ---------------------------------------------------------------------
// VERSÃO VISÍVEL E BOTÃO «ATUALIZAR O JOGO» — a versão (o ?v= do state.js no
// index.html, o mesmo método do diagnóstico) mostra-se SEMPRE, em letra pequena.
// O botão só recarrega a página; não grava nem apaga nada. O Telegram passa os
// dados de arranque na parte do endereço a seguir ao # (tgWebAppData): essa parte
// mantém-se tal e qual; só muda o ?r=<hora> (um endereço novo, por isso o
// index.html é pedido outra vez em vez de vir da cache; os ?v= dos scripts já
// trazem as versões novas). Antes de recarregar, o que estiver por enviar à
// nuvem é enviado já (nuvemGravarJa() em js/nuvem.js) e espera-se que acabe.
// ---------------------------------------------------------------------
const PERFIL_ATUALIZAR_ESPERA_MS = 3000; // tempo máximo à espera de uma gravação em curso
const PERFIL_ATUALIZAR_PASSO_MS = 150;
let _perfilAtualizando = false;

function perfilMostrarVersao() {
  const el = document.getElementById('perfil-versao');
  if (el) el.textContent = t('perfil.versao').replace('{v}', perfilDiagVersaoStateJs());
}

// Endereço para recarregar: o mesmo caminho e o mesmo # (sem lhe tocar), os outros
// parâmetros do ? como estavam e r=<hora> posto ou mudado.
function perfilEnderecoAtualizado(loc, agora) {
  const params = new URLSearchParams(loc.search || '');
  params.set('r', String(agora));
  return loc.pathname + '?' + params.toString() + (loc.hash || '');
}

function perfilAtualizarJogo() {
  if (_perfilAtualizando) return;
  _perfilAtualizando = true;
  const botao = document.getElementById('perfil-atualizar');
  if (botao) { botao.disabled = true; botao.textContent = t('perfil.atualizando'); }
  if (typeof nuvemGravarJa === 'function') nuvemGravarJa();
  const inicio = Date.now();
  (function esperar() {
    const aGravar = typeof nuvemGravacaoEmCurso === 'function' && nuvemGravacaoEmCurso();
    if (aGravar && Date.now() - inicio < PERFIL_ATUALIZAR_ESPERA_MS) { setTimeout(esperar, PERFIL_ATUALIZAR_PASSO_MS); return; }
    location.replace(perfilEnderecoAtualizado(location, Date.now()));
  })();
}
