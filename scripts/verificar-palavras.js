#!/usr/bin/env node
// As PALAVRAS DA QUINTA (o glossário) em dados/palavras.js e a lista PALAVRAS_DA_QUINTA de js/palavras.js. Só LÊ os ficheiros e corre-os num
// ambiente simulado (módulo vm): o ficheiro de dados, com um dadosAcrescentar() falso que só guarda o que recebe, e o jogo real
// (scripts/_jogo-vm.js). Nunca toca em browser, estado nem conta real.
//
// Prova:
//  (a) as 20 palavras combinadas existem, por esta ordem (alfabética) e com estes ids; nem uma a mais nem uma a menos;
//  (b) ids únicos, só com a-z, 0-9 e _; palavras repetidas não há; a palavra é o termo em português e vem igual nas 3 línguas
//      (a explicação não repete a palavra em inglês ou espanhol por outro nome: é só texto);
//  (c) pt, en e es existem e não estão vazios (nem só espaços) em todas as explicações; «DOP» abre com «PDO (Protected Designation of Origin)»
//      em inglês e com «DOP (Denominación de Origen Protegida)» em espanhol; montado e vinho generoso com os textos aprovados;
//  (d) a ordem é alfabética (sem contar acentos nem maiúsculas);
//  (e) o campo opcional «nivel», se existir, é um inteiro >= 1 (por agora nenhuma palavra o traz, e nenhuma entrada tem campos a mais);
//  (f) nenhum texto tem < > & (os ecrãs montam HTML), links, emails nem fala de bots ou de IA;
//  (g) o ficheiro só tem comentários e chamadas dadosAcrescentar('palavras', ...);
//  (h) no jogo real as 20 entram em PALAVRAS_DA_QUINTA, sem nenhum aviso, tal e qual estão no ficheiro; palavrasTotal() é 20, palavrasResumo()
//      é «20» e palavrasOrdenadas() dá a ordem alfabética sem mexer na lista; o index.html carrega js/palavras.js antes de js/dados.js e
//      dados/palavras.js a seguir a dados/enciclopedia.js;
//  (i) SÓ LÊ: só js/palavras.js, js/dados.js, js/perfil.js (o cartão) e js/main.js (abre o ecrã) falam das palavras; nada no estado, na nuvem nem em
//      js/state.js; js/palavras.js não toca em estado, armazenamento, nuvem nem rede (o ecrã e o cartão provam-se em scripts/verificar-palavras-ecra.js).
//
// Uso: node scripts/verificar-palavras.js
// PALAVRAS_JS=ficheiro  corre sobre outra versão de dados/palavras.js (para provar que o teste apanha o que se estraga); com ele as provas (h)
//   do jogo real não correm.
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { abrirJogo } = require('./_jogo-vm');

const RAIZ = path.join(__dirname, '..');
const FICHEIRO = process.env.PALAVRAS_JS || path.join(RAIZ, 'dados', 'palavras.js');
const LINGUAS = ['pt', 'en', 'es'];
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }
const temTexto = function (s) { return typeof s === 'string' && s.trim() !== ''; };

// As 20 palavras combinadas, por ordem alfabética: id e palavra.
const ESPERADAS = [
  ['aguardente_vinica', 'aguardente vínica'], ['alambique', 'alambique'], ['bacelo', 'bacelo'], ['bagaceira', 'bagaceira'], ['bagaco', 'bagaço'],
  ['casta', 'casta'], ['curtimenta', 'curtimenta'], ['dop', 'DOP'], ['estuario', 'estuário'], ['fortificar', 'fortificar'],
  ['jeropiga', 'jeropiga'], ['lagar', 'lagar'], ['mildio', 'míldio'], ['montado', 'montado'], ['mosto', 'mosto'],
  ['oidio', 'oídio'], ['pousio', 'pousio'], ['redura', 'redura'], ['torna_viagem', 'torna-viagem'], ['vinho_generoso', 'vinho generoso']
];

const codigoFonte = fs.readFileSync(FICHEIRO, 'utf8');
const entradas = [];
const chamadas = [];
const sb = { dadosAcrescentar: function (tipo, entrada) { chamadas.push(tipo); entradas.push(entrada); return true; } };
vm.runInContext(codigoFonte, vm.createContext(sb), { filename: 'dados/palavras.js' });

const chave = function (s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };

// (a) as 20, por ordem, com estes ids
ok(entradas.length === 20, 'devia haver 20 palavras, há ' + entradas.length);
ok(entradas.map(function (e) { return e && e.id; }).join() === ESPERADAS.map(function (x) { return x[0]; }).join(), 'os ids (e a ordem) não são os combinados: ' + entradas.map(function (e) { return e && e.id; }).join());
ok(entradas.map(function (e) { return e && e.palavra; }).join() === ESPERADAS.map(function (x) { return x[1]; }).join(), 'as palavras não são as combinadas: ' + entradas.map(function (e) { return e && e.palavra; }).join());
ok(chamadas.every(function (t) { return t === 'palavras'; }), 'todas as chamadas deviam ser dadosAcrescentar(\'palavras\', ...)');

// (b) ids únicos e bem formados, palavras únicas
const ids = entradas.map(function (e) { return e && e.id; });
ok(new Set(ids).size === ids.length, 'há ids repetidos');
ok(ids.every(function (id) { return typeof id === 'string' && /^[a-z0-9_]+$/.test(id); }), 'cada id devia ter só a-z, 0-9 e _ (sem acentos)');
const palavras = entradas.map(function (e) { return e && chave(e.palavra); });
ok(new Set(palavras).size === palavras.length, 'há palavras repetidas');
entradas.forEach(function (e) {
  const onde = (e && e.id) || '?';
  ok(e && temTexto(e.palavra), onde + ': falta a palavra');
  // (e) campos: só id, palavra, explicacao e, opcional, nivel
  const campos = Object.keys(e || {}).sort().join();
  ok(campos === 'explicacao,id,palavra' || campos === 'explicacao,id,nivel,palavra', onde + ': campos a mais ou a menos: ' + campos);
  if (e && e.nivel !== undefined) ok(Number.isInteger(e.nivel) && e.nivel >= 1, onde + ': o nivel, se existir, devia ser um inteiro >= 1');
  // (c) as 3 línguas
  const ex = e && e.explicacao;
  ok(ex && typeof ex === 'object' && !Array.isArray(ex) && Object.keys(ex).sort().join() === 'en,es,pt', onde + ': a explicação devia ter só pt, en e es');
  LINGUAS.forEach(function (l) {
    const t = ex && ex[l];
    ok(temTexto(t), onde + ': falta a explicação em ' + l);
    if (!temTexto(t)) return;
    ok(t === t.trim() && t.length <= 160, onde + ' (' + l + '): a explicação devia ser curta (até 160 letras) e sem espaços nas pontas');
    ok(/[.)]$/.test(t), onde + ' (' + l + '): a explicação devia acabar com ponto');
    // (f)
    ok(!/[<>&]/.test(t), onde + ' (' + l + '): a explicação não devia ter < > &');
    ok(!/https?:|www\.|@/.test(t), onde + ' (' + l + '): a explicação não devia ter links nem emails');
    // «ia» em minúsculas é o verbo «ir» (vinho que ia de barco): só se apanha «IA» e «AI» em maiúsculas.
    ok(!/\bbots?\b|\b(inteligência|inteligencia) artificial\b|\bartificial intelligence\b/i.test(t) && !/\b(IA|AI)\b/.test(t), onde + ' (' + l + '): a explicação não devia falar de bots nem de IA');
  });
});

// (c) textos fixados
const porId = {};
entradas.forEach(function (e) { if (e && e.id) porId[e.id] = e; });
ok(porId.dop && porId.dop.explicacao.en.indexOf('PDO (Protected Designation of Origin)') === 0, 'DOP (en) devia abrir com «PDO (Protected Designation of Origin)»');
ok(porId.dop && porId.dop.explicacao.es.indexOf('DOP (Denominación de Origen Protegida)') === 0, 'DOP (es) devia abrir com «DOP (Denominación de Origen Protegida)»');
ok(porId.dop && porId.dop.explicacao.pt.indexOf('Denominação de Origem Protegida') === 0, 'DOP (pt) devia abrir com «Denominação de Origem Protegida»');
ok(porId.montado && porId.montado.explicacao.pt === 'paisagem de sobreiros, com pasto por baixo.', 'montado (pt): o texto aprovado é «paisagem de sobreiros, com pasto por baixo.»');
ok(porId.vinho_generoso && porId.vinho_generoso.explicacao.pt === 'vinho a que se junta aguardente, por isso é mais forte e doce.', 'vinho generoso (pt): o texto aprovado é «vinho a que se junta aguardente, por isso é mais forte e doce.»');
ok(porId.mosto && porId.mosto.explicacao.pt === 'o sumo das uvas, antes de virar vinho.', 'mosto (pt): o texto aprovado mudou');

// (d) ordem alfabética
for (let i = 1; i < entradas.length; i++) {
  const a = chave(entradas[i - 1].palavra), b = chave(entradas[i].palavra);
  ok(a < b, 'fora de ordem alfabética: «' + entradas[i - 1].palavra + '» antes de «' + entradas[i].palavra + '»');
}

// (g) só chamadas dadosAcrescentar('palavras', ...)
{
  const codigo = codigoFonte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').trim();
  ok(/^dadosAcrescentar\('palavras', \{/.test(codigo), 'o ficheiro devia começar numa chamada dadosAcrescentar(\'palavras\', ...)');
  ok(codigo.split('dadosAcrescentar(').length - 1 === 20, 'o ficheiro devia ter 20 chamadas dadosAcrescentar');
  ok(!/\b(localStorage|saveState|state\b|Math\.random|Date\.now|fetch|XMLHttpRequest|document|window)\b/.test(codigo), 'o ficheiro não devia tocar em estado, rede nem ecrã');
}

const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');

// (h) o jogo real: as 20 entram, sem avisos, e o index.html carrega tudo pela ordem certa
if (!process.env.PALAVRAS_JS) {
  const avisos = [];
  const jogo = abrirJogo({ aoAvisar: function (m) { avisos.push(m); } });
  ok(avisos.filter(function (m) { return /palavras/.test(m); }).length === 0, 'nenhuma palavra devia gerar aviso ao entrar: ' + avisos.filter(function (m) { return /palavras/.test(m); }).join(' | '));
  const naLista = JSON.parse(jogo.ev('JSON.stringify(PALAVRAS_DA_QUINTA)'));
  ok(naLista.length === 20, 'PALAVRAS_DA_QUINTA devia ter as 20 palavras, tem ' + naLista.length);
  ok(JSON.stringify(naLista) === JSON.stringify(entradas), 'as palavras da lista deviam ser exatamente as do ficheiro (mesmos campos, mesma ordem)');
  ok(jogo.ev('palavrasTotal()') === 20 && jogo.ev('palavrasResumo()') === '20' && jogo.ev('DADOS_ACRESCENTADOS.palavras.length') === 20, 'palavrasTotal() devia ser 20 e palavrasResumo() «20»');
  const antes = jogo.ev('JSON.stringify(PALAVRAS_DA_QUINTA)');
  ok(jogo.ev("palavrasOrdenadas().map(function (p) { return p.id; }).join()") === ESPERADAS.map(function (x) { return x[0]; }).join(), 'palavrasOrdenadas() devia dar a ordem alfabética combinada');
  ok(jogo.ev('JSON.stringify(PALAVRAS_DA_QUINTA)') === antes, 'palavrasOrdenadas() não devia mexer na lista');
  // Mesmo com a lista ao contrário, a ordem sai alfabética (sem contar acentos nem maiúsculas).
  jogo.ev('PALAVRAS_DA_QUINTA.reverse()');
  ok(jogo.ev("palavrasOrdenadas().map(function (p) { return p.id; }).join()") === ESPERADAS.map(function (x) { return x[0]; }).join(), 'palavrasOrdenadas() devia ordenar mesmo com a lista ao contrário');
  const pos = function (f) { return html.indexOf('<script src="' + f + '?v='); };
  ok(pos('js/palavras.js') !== -1 && pos('js/palavras.js') < pos('js/dados.js') && pos('js/dados.js') < pos('js/main.js'), 'o index.html devia carregar js/palavras.js ANTES de js/dados.js (e este antes de js/main.js)');
  ok(pos('dados/palavras.js') > pos('dados/enciclopedia.js') && pos('dados/enciclopedia.js') !== -1 && pos('dados/palavras.js') < pos('js/main.js'), 'o index.html devia carregar dados/palavras.js a seguir a dados/enciclopedia.js e antes de js/main.js');
}

// (i) só lê: só estes ficheiros falam da lista; nada no estado, na nuvem, nem em armazenamento
{
  const jsDir = path.join(RAIZ, 'js');
  const mencionam = fs.readdirSync(jsDir).filter(function (f) { return /\.js$/.test(f) && /PALAVRAS_DA_QUINTA|palavrasOrdenadas|palavrasTotal|palavrasResumo|renderPalavras|dados\/palavras/.test(fs.readFileSync(path.join(jsDir, f), 'utf8')); }).sort();
  ok(mencionam.join() === 'dados.js,main.js,palavras.js,perfil.js', 'só js/palavras.js, js/dados.js, js/perfil.js (o cartão) e js/main.js (abre o ecrã) deviam falar das palavras (nada no estado nem na nuvem): ' + mencionam.join(', '));
  ok(html.indexOf('id="screen-palavras"') !== -1 && html.indexOf('id="palavras-container"') !== -1, 'o index.html devia ter o ecrã das palavras');
  const lista = fs.readFileSync(path.join(jsDir, 'palavras.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  ok(!/\b(state|saveState|localStorage|sessionStorage|fetch|XMLHttpRequest|Math\.random|Date\.now|tg\.|nuvem[A-Za-z]*)\b/.test(lista), 'js/palavras.js não devia tocar em estado, armazenamento, nuvem nem rede');
  ok(/^const PALAVRAS_DA_QUINTA = \[\];$/m.test(lista), 'a lista PALAVRAS_DA_QUINTA devia começar vazia (const PALAVRAS_DA_QUINTA = [];)');
}

if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); }
console.log('OK (20 palavras)');
