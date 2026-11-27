#!/usr/bin/env node
// As visitas valentim_5 (verão, a tirada da cortiça) e henrique_6 (inverno, a maquia do azeite), vindas de dados/visitas.js.
// Prova: existem com os campos certos; são possíveis só na sua estação e só do nível 4 em diante; o verão deixa de ficar sem
// visitas; os totais (16 visitas; por estação: inverno 2, primavera 2, verão 1); o texto sai nas 3 línguas, sem «[por escrever]»,
// sem «Mestre», «bot» nem «IA».
// Uso: node scripts/verificar-visitas-cortica-azeite.js   (JS_DIR=pasta corre sobre outra versão dos js/)
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const path = require('path');
const { abrirJogo } = require('./_jogo-vm');

const JS_DIR = process.env.JS_DIR || path.join(__dirname, '..', 'js');
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }

const g = abrirJogo({ jsDir: JS_DIR });
const ev = g.ev;
const ctx = function (nivel, estacao) { return JSON.stringify({ nivel: nivel, estacao: estacao, fase: null, festaAtiva: false, caveAberta: false, garrafaDias: null }); };
const possivel = function (id, nivel, estacao) { return ev('visitaCondicaoOk(visitaPorId(' + JSON.stringify(id) + '), ' + ctx(nivel, estacao) + ')'); };

// Campos.
ok(ev('VISITAS.length') === 16, 'devia haver 16 visitas, há ' + ev('VISITAS.length'));
[['valentim_5', 'valentim', 'verao'], ['henrique_6', 'henrique', 'inverno']].forEach(function (v) {
  const id = v[0];
  ok(ev('visitaPorId(' + JSON.stringify(id) + ') !== null'), id + ' devia existir no jogo (vem de dados/visitas.js)');
  ok(ev('visitaPorId(' + JSON.stringify(id) + ').personagem') === v[1] && ev('visitaPorId(' + JSON.stringify(id) + ').reputacao') === 1, id + ': personagem ' + v[1] + ', reputação 1');
  ok(ev('JSON.stringify(visitaPorId(' + JSON.stringify(id) + ').condicao)') === '{"tipo":"estacao","valor":"' + v[2] + '"}', id + ': condição estacao ' + v[2]);
  ok(ev('Object.keys(visitaPorId(' + JSON.stringify(id) + ')).sort().join()') === 'condicao,id,personagem,reputacao,texto', id + ': só id, personagem, reputacao, condicao e texto');
  // Só na sua estação e só do nível 4 em diante.
  ['inverno', 'primavera', 'verao', 'outono'].forEach(function (e) {
    ok(possivel(id, 4, e) === (e === v[2]) && possivel(id, 10, e) === (e === v[2]), id + ': só devia ser possível em ' + v[2] + ' (' + e + ')');
    ok(possivel(id, 3, e) === false, id + ': nunca abaixo do nível 4 (' + e + ')');
  });
});
const estacoesJs = require('fs').readFileSync(path.join(JS_DIR, 'estacoes.js'), 'utf8');
ok(/ESTACAO_DO_MES = \[[^\]]*'verao'/.test(estacoesJs) && estacoesJs.indexOf("'verão'") === -1, 'o valor do verão no jogo (js/estacoes.js) é «verao», sem acento');

// Totais por estação: o verão deixa de ficar sem visitas.
const porEstacao = JSON.parse(ev('JSON.stringify(VISITAS.reduce(function (m, v) { if (v.condicao && v.condicao.tipo === "estacao") m[v.condicao.valor] = (m[v.condicao.valor] || 0) + 1; return m; }, {}))'));
ok(JSON.stringify(porEstacao) === JSON.stringify({ inverno: 2, primavera: 2, verao: 1 }), 'visitas por estação: inverno 2, primavera 2, verão 1: ' + JSON.stringify(porEstacao));
function saiu(id, nivel, estacao) {
  for (let n = 0; n < 80; n++) {
    const dia = '2026-07-' + String(1 + n % 28).padStart(2, '0') + '#' + n;
    if (ev('(escolherVisitaDoDia([], ' + ctx(nivel, estacao) + ', ' + JSON.stringify(dia) + ').visita || {}).id') === id) return true;
  }
  return false;
}
ok(saiu('valentim_5', 4, 'verao') === true, 'no verão devia haver visita (valentim_5 sai em algum dia)');
ok(saiu('henrique_6', 4, 'inverno') === true, 'no inverno a henrique_6 devia sair em algum dia');
ok(saiu('valentim_5', 4, 'inverno') === false && saiu('henrique_6', 4, 'verao') === false, 'fora da sua estação nunca saem');
ok(saiu('valentim_5', 3, 'verao') === false, 'abaixo do nível 4 nunca sai');

// Texto nas 3 línguas.
const TEXTOS = {
  valentim_5: {
    pt: 'A tirada da cortiça vai de maio a agosto, e cada sobreiro só a dá de nove em nove anos. Depois essa casca vem fechar-me as garrafas: tanta paciência para uma rolha.',
    en: 'The cork stripping runs from May to August, and each cork oak only gives its bark every nine years. Then that bark comes to seal my bottles: so much patience for one stopper.',
    es: 'La saca del corcho va de mayo a agosto, y cada alcornoque solo lo da cada nueve años. Luego esa corteza viene a cerrarme las botellas: tanta paciencia para un tapón.'
  },
  henrique_6: {
    pt: 'Antigamente pagava-se ao lagar com azeite: era a maquia. A minha é em copos, e não aceito vales.',
    en: 'In the old days you paid the oil mill in olive oil: that was the maquia. Mine is in glasses, and I don\'t accept vouchers.',
    es: 'Antiguamente se pagaba a la almazara con aceite: era la maquia. La mía es en copas, y no acepto vales.'
  }
};
Object.keys(TEXTOS).forEach(function (id) {
  ['pt', 'en', 'es'].forEach(function (l) {
    ok(ev('visitaPorId("' + id + '").texto.' + l) === TEXTOS[id][l], id + ': texto ' + l + ' diferente do pedido');
    ok(ev('(function () { currentLang = ' + JSON.stringify(l) + '; return visitaFalaDe(visitaPorId("' + id + '")).texto; })()') === TEXTOS[id][l], id + ': a fala devia sair em ' + l);
    ok(ev('visitaTextoPorEscrever(visitaPorId("' + id + '"))') === false, id + ': não devia ficar «[por escrever]» (' + l + ')');
    ok(!/mestre|master|maestro|\bbot\b|\bIA\b|\bAI\b/i.test(TEXTOS[id][l]), id + ' ' + l + ': sem «Mestre», «bot» nem «IA»');
  });
  ok(new Set(['pt', 'en', 'es'].map(function (l) { return TEXTOS[id][l]; })).size === 3, id + ': os textos das 3 línguas são diferentes');
});
ok(ev('visitaFalaDe(visitaPorId("valentim_5")).nome.length > 0') && ev('visitaFalaDe(visitaPorId("henrique_6")).nome.length > 0'), 'a fala devia trazer o nome da personagem');

if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); }
console.log('OK');
