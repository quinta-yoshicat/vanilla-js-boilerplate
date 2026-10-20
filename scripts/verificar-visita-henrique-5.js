#!/usr/bin/env node
// A segunda visita vinda de dados/ (dados/visitas.js): henrique_5, o Dr. Henrique e a idade do Moscatel (condição 'cave').
// Prova: está no jogo com a pasta dados/, com os campos e os textos pedidos nas 3 línguas (só os campos permitidos, sem
// < > &, links, bots nem IA); é possível só com a Cave aberta (nível 5 ou mais) e nunca abaixo do nível 4; sai na escolha do
// dia só com a Cave aberta; depois de feita não volta a sair antes das outras; com a henrique_4 e a henrique_5 possíveis o
// sorteio funciona e nenhuma sai duas vezes antes das restantes; e quem já tem a visita de hoje guardada não muda.
// Uso: node scripts/verificar-visita-henrique-5.js   (JS_DIR=pasta corre sobre outra versão dos js/)
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { abrirJogo } = require('./_jogo-vm');

const JS_DIR = process.env.JS_DIR || path.join(__dirname, '..', 'js');
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }

const g = abrirJogo({ jsDir: JS_DIR });
const ev = g.ev;
const ctx = function (nivel, cave, extra) { return JSON.stringify(Object.assign({ nivel: nivel, estacao: 'verao', fase: 'repouso', festaAtiva: false, caveAberta: cave, garrafaDias: null }, extra || {})); };
const possivel = function (nivel, cave) { return ev('visitaCondicaoOk(visitaPorId("henrique_5"), ' + ctx(nivel, cave) + ')'); };
const escolher = function (feitas, contexto, dia) { return ev('(escolherVisitaDoDia(' + JSON.stringify(feitas) + ', ' + contexto + ', ' + JSON.stringify(dia) + ').visita || {}).id || null'); };
const dia = function (n) { return '2026-' + String(1 + Math.floor(n / 28) % 12).padStart(2, '0') + '-' + String(1 + n % 28).padStart(2, '0') + '#' + n; };

// ----- Dados -----
ok(ev('visitaPorId("henrique_5") !== null'), 'henrique_5 devia existir no jogo (vem de dados/visitas.js)');
ok(ev('visitaPorId("henrique_5").personagem') === 'henrique' && ev('visitaPorId("henrique_5").reputacao') === 2, 'henrique_5: personagem henrique, reputação 2');
ok(ev('JSON.stringify(visitaPorId("henrique_5").condicao)') === '{"tipo":"cave"}', 'henrique_5: condição cave');
ok(ev('Object.keys(visitaPorId("henrique_5")).sort().join()') === 'condicao,id,personagem,reputacao,texto', 'henrique_5: só id, personagem, reputacao, condicao e texto: ' + ev('Object.keys(visitaPorId("henrique_5")).join()'));
ok(ev('VISITAS[VISITAS.length - 1].id') === 'henrique_5' && ev('VISITAS.map(function (v) { return v.id; }).indexOf("henrique_5")') === ev('VISITAS.map(function (v) { return v.id; }).indexOf("marisa_5")') + 1, 'henrique_5 devia vir logo a seguir à marisa_5');

// Textos pedidos, escritos aqui à parte (não lidos de dados/).
const TEXTOS = {
  pt: 'Sabias que um Moscatel só pode dizer «10 anos» no rótulo se tiver mesmo, no mínimo, 10 anos? Era bom que tudo na vida fosse assim honesto.',
  en: 'Did you know a Moscatel can only say "10 years" on its label if it is really at least 10 years old? It would be nice if everything in life were that honest.',
  es: '¿Sabías que un Moscatel solo puede decir «10 años» en la etiqueta si tiene de verdad, como mínimo, 10 años? Ojalá todo en la vida fuera así de honesto.'
};
['pt', 'en', 'es'].forEach(function (l) {
  ok(ev('visitaPorId("henrique_5").texto.' + l) === TEXTOS[l], 'texto ' + l + ' diferente do pedido');
  ok(ev('(function () { currentLang = ' + JSON.stringify(l) + '; return visitaFalaDe(visitaPorId("henrique_5")).texto; })()') === TEXTOS[l], 'a fala devia sair em ' + l);
  ok(!/[<>&]|https?:|www\.|bot\b|bots\b|\bIA\b|inteligência artificial|inteligencia artificial|artificial intelligence/i.test(TEXTOS[l]), 'texto ' + l + ': sem < > &, links, bots nem IA');
  ok(ev('visitaTextoPorEscrever(visitaPorId("henrique_5"))') === false, 'não devia ficar «[por escrever]» (' + l + ')');
});
ok(ev('visitaFalaDe(visitaPorId("henrique_5")).nome.length > 0'), 'a fala devia trazer o nome do Dr. Henrique');

// ----- Condição: só com a Cave aberta (e nunca abaixo do nível 4) -----
[5, 6, 7, 10].forEach(function (n) { ok(possivel(n, true) === true, 'devia ser possível com a Cave aberta no nível ' + n); });
[4, 5, 7].forEach(function (n) { ok(possivel(n, false) === false, 'NÃO devia ser possível com a Cave fechada (nível ' + n + ')'); });
[1, 2, 3].forEach(function (n) { ok(possivel(n, true) === false, 'NÃO devia ser possível abaixo do nível 4 (nível ' + n + ')'); });
// A Cave do jogo real abre ao nível 5: com 299 de Reputação (nível 4) está fechada; com 300 (nível 5) está aberta.
// (a caveReservaAberta() vive em js/garrafa.js, que o ambiente base não carrega por inteiro: copiam-se para o vm só a constante
// CAVE_RESERVA_NIVEL e esta função, tal como estão no ficheiro.)
const garrafaJs = fs.readFileSync(path.join(JS_DIR, 'garrafa.js'), 'utf8');
const nivelCave = /const CAVE_RESERVA_NIVEL = \d+;/.exec(garrafaJs);
const funcaoCave = /function caveReservaAberta\(\) \{[^}]*\}/.exec(garrafaJs);
ok(!!nivelCave && !!funcaoCave, 'js/garrafa.js devia ter CAVE_RESERVA_NIVEL e caveReservaAberta()');
vm.runInContext(nivelCave[0] + '\n' + funcaoCave[0], g.cx, { filename: 'js/garrafa.js (caveReservaAberta)' });
function caveComReputacao(rep) { return ev('(function () { state.acesso.jogadorAntigo = false; state.reputacao = ' + rep + '; return visitaContextoAtual().caveAberta; })()'); }
ok(ev('nivelPelaReputacao(299)') === 4 && ev('nivelPelaReputacao(300)') === 5, 'o nível 5 devia começar nos 300 de Reputação');
ok(caveComReputacao(299) === false && caveComReputacao(300) === true && caveComReputacao(900) === true, 'no jogo real a Cave só abre ao nível 5');

// ----- Escolha do dia -----
const outras = ev('VISITAS.map(function (v) { return v.id; }).filter(function (id) { return id !== "henrique_5"; })');
function saiuAlgumDia(feitas, contexto, alvo) {
  for (let n = 0; n < 80; n++) if (escolher(feitas, contexto, dia(n)) === alvo) return true;
  return false;
}
ok(saiuAlgumDia([], ctx(5, true), 'henrique_5') === true, 'com a Cave aberta devia sair em algum dia');
ok(saiuAlgumDia([], ctx(5, false), 'henrique_5') === false, 'com a Cave fechada nunca devia sair');
ok(saiuAlgumDia([], ctx(3, true), 'henrique_5') === false, 'abaixo do nível 4 nunca devia sair');
ok(saiuAlgumDia([], ctx(4, false), 'henrique_5') === false, 'no nível 4 (Cave ainda fechada) nunca devia sair');
// Feita, não volta a sair enquanto houver visitas novas (a henrique_4 também está por fazer).
ok(saiuAlgumDia(['henrique_5'], ctx(5, true), 'henrique_5') === false, 'feita, não devia voltar a sair antes das outras');
// Tudo o resto feito (com datas): a mais recente é a dela, por isso as outras saem primeiro (ciclo).
const comDatas = {};
outras.forEach(function (id, i) { comDatas[id] = '2026-01-' + String(1 + i).padStart(2, '0'); });
comDatas.henrique_5 = '2026-03-01';
const possiveisHoje = JSON.parse(ev('JSON.stringify(VISITAS.filter(function (v) { return visitaCondicaoOk(v, ' + ctx(5, true) + '); }).map(function (v) { return v.id; }))'));
ok(possiveisHoje.indexOf('henrique_4') !== -1 && possiveisHoje.indexOf('henrique_5') !== -1, 'com a Cave aberta (verão, repouso) a henrique_4 e a henrique_5 são possíveis: ' + possiveisHoje);
let repetiu = false;
for (let n = 0; n < 80; n++) if (escolher(comDatas, ctx(5, true), dia(n)) === 'henrique_5') repetiu = true;
ok(repetiu === false, 'no ciclo, a feita há menos tempo (a henrique_5) não devia sair antes das outras');

// Com a henrique_4 e a henrique_5 possíveis: o sorteio funciona e nenhuma sai duas vezes antes das restantes.
// Simulação de 300 dias: cada visita escolhida fica feita nesse dia.
function simular(inicioDia) {
  const feitas = {}; const saidas = [];
  for (let n = 0; n < 300 && saidas.length < possiveisHoje.length; n++) {
    const d = dia(inicioDia + n);
    const id = escolher(feitas, ctx(5, true), d);
    if (id) { feitas[id] = d.slice(0, 10); saidas.push(id); }
  }
  return saidas;
}
const ordens = new Set();
for (let i = 0; i < 30; i++) {
  const s = simular(i * 11);
  ok(s.length === possiveisHoje.length, 'a simulação ' + i + ' devia chegar a todas as possíveis (' + s.length + ' de ' + possiveisHoje.length + ')');
  ok(new Set(s).size === s.length, 'simulação ' + i + ': nenhuma visita sai duas vezes antes das restantes: ' + s);
  ok(s.slice().sort().join() === possiveisHoje.slice().sort().join(), 'simulação ' + i + ': saem exatamente as possíveis: ' + s);
  ok(['henrique_4', 'henrique_5'].indexOf(s[0]) !== -1 && ['henrique_4', 'henrique_5'].indexOf(s[1]) !== -1, 'simulação ' + i + ': as duas «cave» (com condição) saem antes das sem condição: ' + s);
  ordens.add(s.slice(0, 2).join('>'));
}
ok(ordens.size === 2, 'o sorteio devia dar as duas ordens (henrique_4 primeiro e henrique_5 primeiro): ' + Array.from(ordens));

// ----- Quem já tem a visita de hoje guardada não muda -----
{
  const h = abrirJogo({ jsDir: JS_DIR }); const e = h.ev;
  e('state.acesso.jogadorAntigo = false; state.reputacao = 900; state.visitas = { feitas: {}, hoje: { dia: visitaDiaEfetivo(), id: "valentim_4", feita: false } };');
  const antes = e('JSON.stringify(state.visitas)');
  ok(e('visitaResolverHoje().visita.id') === 'valentim_4' && e('visitaResolverHoje().nova') === false, 'a visita de hoje já guardada (valentim_4) não devia mudar, mesmo com a henrique_5 possível');
  ok(e('JSON.stringify(state.visitas)') === antes, 'resolver a visita de hoje não devia mexer no estado guardado');
  // Guardada a henrique_5 e já feita: continua a ser a de hoje, feita, e não paga outra vez.
  e('state.visitas = { feitas: { henrique_5: visitaDiaEfetivo() }, hoje: { dia: visitaDiaEfetivo(), id: "henrique_5", feita: true } };');
  ok(e('visitaResolverHoje().visita.id') === 'henrique_5' && e('visitaResolverHoje().feita') === true, 'a henrique_5 de hoje, feita, devia continuar a ser a de hoje');
  const rep = e('state.reputacao');
  ok(e('visitaFazerHoje().ok') === false && e('state.reputacao') === rep, 'a henrique_5 já feita hoje não devia pagar outra vez');
}

if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); }
console.log('OK');
