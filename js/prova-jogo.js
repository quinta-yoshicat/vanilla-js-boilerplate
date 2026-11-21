// ---------------------------------------------------------------------
// PROVA ÀS CEGAS no ecrã da Coleção (PR 2 de 3: vê-se e joga-se).
//
// As regras são as de js/prova.js (provaPodeJogar, provaComecar, provaVerificar, provaPremio, provaTerminar,
// provaEnsino) e o estado é state.prova (js/state.js). Aqui só o que falta para se jogar: o botão no painel de ações
// da Coleção (por cima de «Arrumar a Coleção», ver renderColecaoDesenhar() em js/garrafa.js), a prova a decorrer DENTRO
// desse painel (sem ecrã novo, como as cenas do Proteger e do barril e o bloco da encomenda) e os toques.
//
//   - Botão: só no nível 6+ (provaPodeJogar diz 'nivel' abaixo). Pode jogar: botão normal. Já provou hoje: apagado,
//     «Já provaste hoje». Modo de teste (?prova=1 ou o modo de teste geral, visitaEmModoTeste): deixa jogar sempre,
//     mas NUNCA grava nem paga.
//   - Começar: provaComecar() grava ultimoDia LOGO (um saveState). A sessão fica só em memória (provaJogo): ao sair do
//     ecrã e voltar no mesmo dia sem fechar a app, retoma-se a mesma; fechar a app perde a prova do dia, sem castigo.
//   - Cada ronda: a cara (PERSONAGENS_CARAS_POR_ID, js/personagens.js) e o nome do Dr. Henrique, a descrição na língua do jogador e as 4 cores da Cave (2x2, com a
//     miniatura da garrafa). Depois de escolher: certo ou não, a cor certa e a linha que ensina (provaEnsino), e
//     «Seguinte» (ou «Ver resultado» na última). A resposta não muda e o toque duplo não conta.
//   - Fim: provaTerminar() paga UMA vez e grava UMA vez; «Acertaste X de 3», o prémio (só as partes > 0) e uma fala
//     do Dr. Henrique; atualiza a barra de cima. A subida de nível vem depois, ao entrar na Quinta, como com qualquer
//     outra Reputação (verificarSubidaNivel() em js/niveis.js).
//   - Sons: acertar toca o som de objetivoCumprido (como a bagaceira e a encomenda); errar não toca nada.
// Sem Math.random: as rondas vêm do dia (provaRondasDoDia).
// ---------------------------------------------------------------------

// A prova a decorrer (só em memória): { sessao (de provaComecar), teste, indice (0 a 2), respostas, revelada,
// resultado (null ou { certas, premio, pago }) }. null = nenhuma.
let provaJogo = null;
let provaOcupado = false; // trava o toque duplo

function provaDiaDeHoje() {
  return diaLisboaDeHoje();
}

// Modo de teste: ?prova=1 no endereço, ou o modo de teste geral (?visita=, ?dias=, ...: visitaEmModoTeste).
function provaModoTeste() {
  try { if (new URLSearchParams(location.search).get('prova') === '1') return true; } catch (e) { /* sem endereço */ }
  return typeof visitaEmModoTeste === 'function' && visitaEmModoTeste() === true;
}

// O que o botão mostra (só lê): 'escondido' (abaixo do nível 6, ou sem textos), 'pode' ou 'ja_hoje'.
// Em modo de teste não olha para o ultimoDia: deixa sempre jogar (sem gravar nem pagar).
function provaBotaoEstado() {
  const dia = provaDiaDeHoje();
  if (provaModoTeste()) {
    const p = provaPodeJogar(state, dia, false);
    return p.ok || p.motivo === 'ja_hoje' ? 'pode' : 'escondido';
  }
  const p = provaPodeJogar(state, dia, false);
  if (p.ok) return 'pode';
  if (p.motivo === 'ja_hoje') return 'ja_hoje';
  return 'escondido';
}

function provaEmCurso() {
  return !!provaJogo;
}

// O painel da Coleção reserva o lugar do botão? (só lê; ver .colecao-painel.com-prova no index.html)
function provaOcupaLugar() {
  return !provaJogo && provaBotaoEstado() !== 'escondido';
}

// Ao entrar no ecrã da Coleção (renderColecao): uma prova já acabada esquece-se; uma de outro dia também.
// Uma prova a meio, do mesmo dia, retoma-se.
function provaAoEntrarNaColecao() {
  if (provaJogo && (provaJogo.resultado || provaJogo.sessao.dia !== provaDiaDeHoje())) provaJogo = null;
}

function provaLingua() {
  return typeof currentLang === 'string' && currentLang ? currentLang : 'pt';
}

function provaEscapar(x) {
  return typeof escaparHtml === 'function' ? escaparHtml(x) : String(x);
}

// «Dr. Henrique» (sem o artigo de visita.nome.henrique: «o Dr. Henrique», «el Dr. Henrique»).
function provaNomeHenrique() {
  return String(t('visita.nome.henrique')).replace(/^(o|a|el|la|the)\s+/i, '');
}

function provaNomeCor(cor) {
  return t(garrafaPorDias(cor).nomeKey);
}

function provaCabecaHtml(subtitulo) {
  // As visitas procuram a cara pelo id (PERSONAGENS_CARAS_POR_ID, js/personagens.js), não pelo nome, que muda com a língua.
  const cara = typeof PERSONAGENS_CARAS_POR_ID === 'object' && PERSONAGENS_CARAS_POR_ID && PERSONAGENS_CARAS_POR_ID.henrique ? PERSONAGENS_CARAS_POR_ID.henrique : '';
  return '<div class="prova-cabeca">' +
    (cara ? '<img class="prova-cara" src="' + cara + '" alt="">' : '') +
    '<p><span class="prova-nome">' + provaEscapar(provaNomeHenrique()) + '</span>' + (subtitulo ? ' <span class="prova-ronda">· ' + subtitulo + '</span>' : '') + '</p>' +
  '</div>';
}

// O bloco da prova a decorrer (ronda, resposta revelada ou resultado). Só lê.
function provaBlocoHtml() {
  const j = provaJogo;
  if (j.resultado) {
    const r = j.resultado;
    const partes = [];
    if (r.pago && r.premio.gotas > 0) partes.push(t('prova.premioGotas').replace('{n}', r.premio.gotas));
    if (r.pago && r.premio.reputacao > 0) partes.push(t('prova.premioRep').replace('{n}', r.premio.reputacao));
    const fala = t(r.certas === PROVA_RONDAS ? 'prova.fala3' : (r.certas > 0 ? 'prova.fala1' : 'prova.fala0'));
    return '<div class="prova-bloco prova-fim">' + provaCabecaHtml('') +
      '<p class="prova-veredicto">' + t('prova.resultado').replace('{n}', r.certas) + '</p>' +
      (partes.length ? '<p class="prova-premio">' + partes.join(' · ') + '</p>' : '') +
      (j.teste ? '<p class="prova-nota">' + t('prova.teste') + '</p>' : '') +
      '<p class="prova-fala">«' + fala + '»</p>' +
    '</div>';
  }
  const ronda = j.sessao.rondas[j.indice];
  const lingua = provaLingua();
  const descricao = ronda.descricao.texto[lingua] || ronda.descricao.texto.pt;
  let corpo = '<p class="prova-descricao">' + provaEscapar(descricao) + '</p>';
  if (!j.revelada) {
    corpo += '<div class="prova-cores" role="group" aria-label="' + provaEscapar(t('prova.pergunta')) + '">' +
      PROVA_CORES.map(function (c) {
        return '<button type="button" class="btn-pill prova-cor" data-cor="' + c + '" onclick="provaResponderClique(' + c + ')">' +
          '<img src="' + garrafaPorDias(c).imagem + '" alt="" decoding="async"><span>' + provaNomeCor(c) + '</span></button>';
      }).join('') +
    '</div>';
  } else {
    const certo = provaVerificar(j.sessao, j.indice, j.respostas[j.indice]);
    corpo += '<p class="prova-veredicto ' + (certo ? 'certo' : 'errado') + '">' +
      (certo ? t('prova.certo') : t('prova.errado') + ' ' + t('prova.corCerta').replace('{cor}', provaNomeCor(ronda.cor))) + '</p>' +
      '<p class="prova-ensino">' + provaEscapar(provaEnsino(ronda.cor, lingua)) + '</p>' +
      '<button type="button" class="btn-pill pill-main prova-seguinte" onclick="provaSeguinteClique()">' +
        t(j.indice < PROVA_RONDAS - 1 ? 'prova.seguinte' : 'prova.verResultado') + '</button>';
  }
  return '<div class="prova-bloco">' + provaCabecaHtml(t('prova.ronda').replace('{n}', j.indice + 1)) + corpo + '</div>';
}

// O que vai para o painel de ações da Coleção: o bloco da prova a decorrer, ou o botão (ou nada). Só lê.
function provaColecaoHtml() {
  if (provaJogo) return provaBlocoHtml();
  const e = provaBotaoEstado();
  if (e === 'escondido') return '';
  if (e === 'ja_hoje') {
    return '<button type="button" class="btn-pill prova-botao" disabled><span>' + t('prova.jaHoje') + '</span></button>';
  }
  return '<button type="button" class="btn-pill prova-botao" onclick="provaComecarClique()"><span>' + t('prova.btn') + '</span></button>';
}

function provaRedesenhar() {
  if (typeof renderColecaoDesenhar === 'function') renderColecaoDesenhar();
}

// Tocar no botão: começa (grava ultimoDia LOGO, um saveState). Em modo de teste não grava nada.
function provaComecarClique() {
  if (provaOcupado || provaJogo) return;
  provaOcupado = true;
  try {
    const dia = provaDiaDeHoje();
    if (provaModoTeste()) {
      if (provaBotaoEstado() === 'pode') {
        provaJogo = { sessao: { dia: dia, rondas: provaRondasDoDia(dia), paga: false }, teste: true, indice: 0, respostas: [], revelada: false, resultado: null };
      }
    } else {
      const r = provaComecar(state, dia, false);
      if (r.ok) {
        saveState(state);
        provaJogo = { sessao: r.sessao, teste: false, indice: 0, respostas: [], revelada: false, resultado: null };
      }
    }
  } finally {
    provaOcupado = false;
  }
  provaRedesenhar();
}

// Escolher a cor da ronda: fica escolhida (não muda) e mostra-se se acertou.
function provaResponderClique(cor) {
  const j = provaJogo;
  if (provaOcupado || !j || j.resultado || j.revelada || PROVA_CORES.indexOf(cor) === -1) return;
  provaOcupado = true;
  try {
    j.respostas[j.indice] = cor;
    j.revelada = true;
    if (provaVerificar(j.sessao, j.indice, cor)) {
      if (typeof vibrar === 'function') vibrar('sucesso');
      if (typeof tocarSom === 'function') tocarSom('objetivoCumprido');
    }
  } finally {
    provaOcupado = false;
  }
  provaRedesenhar();
}

// «Seguinte» / «Ver resultado».
function provaSeguinteClique() {
  const j = provaJogo;
  if (provaOcupado || !j || j.resultado || !j.revelada) return;
  provaOcupado = true;
  try {
    if (j.indice < PROVA_RONDAS - 1) {
      j.indice++;
      j.revelada = false;
    } else {
      provaAcabar(j);
    }
  } finally {
    provaOcupado = false;
  }
  provaRedesenhar();
}

function provaContarCertas(j) {
  let n = 0;
  for (let i = 0; i < PROVA_RONDAS; i++) if (provaVerificar(j.sessao, i, j.respostas[i])) n++;
  return n;
}

// O fim: paga UMA vez (provaTerminar marca a sessão como paga) e grava UMA vez. Em modo de teste só conta.
function provaAcabar(j) {
  if (j.teste) {
    j.resultado = { certas: provaContarCertas(j), premio: provaPremio(0), pago: false };
    return;
  }
  const r = provaTerminar(state, j.sessao, j.respostas);
  if (r.ok) {
    saveState(state);
    if (typeof updateStatsDisplays === 'function') updateStatsDisplays();
    j.resultado = { certas: r.certas, premio: r.premio, pago: true };
  } else {
    j.resultado = { certas: provaContarCertas(j), premio: provaPremio(0), pago: false };
  }
}
