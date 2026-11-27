#!/usr/bin/env node
// Validador dos «pacotes» de conteúdo (dados/pacotes/*.json; ver dados/LEIAME.md). Um pacote é uma lista do que uma
// PR acrescenta aos ficheiros de dados/ (ids por tipo) mais as imagens e os sons que ainda faltam criar.
// Corre o jogo REAL em vm (scripts/_jogo-vm.js, como o verificar-dados.js) e só LÊ: não altera nada.
//
// Confere, para cada pacote (os ficheiros que começam por «_», como _modelo.json e _base.json, não são pacotes):
//   1. a forma do ficheiro (id igual ao nome, chaves conhecidas, ids de tipos conhecidos, imagens e sons completos);
//   2. os ids existem nos ficheiros de dados/ (uma entrada ignorada pelo jogo conta como em falta, com o motivo);
//   3. nenhum id repetido (no mesmo pacote nem entre pacotes) e nenhum id que já existia antes dos pacotes (_base.json);
//   4. nenhum id «órfão»: uma entrada de dados/ que não vem de _base.json tem de estar num pacote;
//   5. textos com pt, en e es, e com en e es DIFERENTES do pt (excecoes: ["tipo:id:campo"], p. ex. um nome próprio);
//   6. as entradas da Enciclopédia (nas 3 línguas) sem dinheiro, tokens nem links;
//   7. imagens e sons: «feita» = o ficheiro existe e tem linha em CREDITOS.md; «por_criar» = nenhuma entrada do pacote
//      o usa (sem o campo imagem, sem foto nem som na fala); e tudo o que uma entrada usa tem de estar no pacote como «feita»;
//   8. as palavras novas do glossário não repetem as que existem (sem contar acentos nem maiúsculas).
// Sem pacotes, passa.
//
// Uso: node scripts/verificar-pacote.js
// PACOTES_DIR=pasta  lê os pacotes de outra pasta (para provar que o teste apanha o que se estraga).
// DADOS_DIR=pasta    lê os ficheiros de dados de outra pasta.
// CREDITOS_MD=ficheiro  lê outro CREDITOS.md.
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const { abrirJogo } = require('./_jogo-vm');

const RAIZ = path.join(__dirname, '..');
const PACOTES_DIR = process.env.PACOTES_DIR || path.join(RAIZ, 'dados', 'pacotes');
const DADOS_DIR = process.env.DADOS_DIR || path.join(RAIZ, 'dados');
const CREDITOS_MD = process.env.CREDITOS_MD || path.join(RAIZ, 'CREDITOS.md');
const LINGUAS = ['pt', 'en', 'es'];
const TIPOS = ['visitas', 'niveis', 'historias', 'capitulos', 'enciclopedia', 'palavras', 'provas'];
const ESTADOS_PACOTE = ['ideia', 'aprovada', 'em PR', 'feita'];
const ESTADOS_ATIVO = ['por_criar', 'feita'];
const CHAVES_PACOTE = ['id', 'nome', 'estado', 'clima', 'terras', 'fontes', 'ids', 'imagens', 'sons', 'excecoes'];
const CHAVES_ATIVO = ['caminho', 'uso', 'descricao', 'estado'];
const FORMATO_ID = /^[a-z0-9_]+$/;
const FORMATO_IMAGEM = /^assets\/[A-Za-z0-9_\-\/.]+\.(jpg|jpeg|png|webp|gif)$/;
const FORMATO_SOM = /^assets\/[A-Za-z0-9_\-\/.]+\.(mp3|ogg|wav|m4a)$/;
// Dinheiro e tokens (nas 3 línguas) e links. Palavras inteiras, para «europeu» ou «pagão» não darem falso alarme.
const PROIBIDO_DINHEIRO = /(€|\$)|\b(dinheiro|moedas?|euros?|tokens?|pagamentos?|pagar|paga|pago|money|coins?|pay|pays|payment|dinero|monedas?|cripto\w*|crypto\w*|bitcoin)\b/i;
const PROIBIDO_LINK = /https?:|www\.|\b[a-z0-9-]+\.(com|pt|org|net|es|dev|io)\b/i;

const faltas = [];
function falta(onde, o) { faltas.push(onde + ': ' + o); }
function temTexto(v) { return typeof v === 'string' && v.trim() !== ''; }
function eObjeto(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
function semAcentos(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }
function norm(s) { return String(s).replace(/\s+/g, ' ').trim().toLowerCase(); }

// --- Ler os pacotes ---------------------------------------------------------------------------------------------
function lerJson(ficheiro, onde) {
  try { return JSON.parse(fs.readFileSync(ficheiro, 'utf8')); } catch (e) { falta(onde, 'não é um JSON válido (' + e.message + ')'); return null; }
}

const pacotes = [];
if (fs.existsSync(PACOTES_DIR)) {
  fs.readdirSync(PACOTES_DIR).filter(function (f) { return /\.json$/.test(f) && f.charAt(0) !== '_'; }).sort().forEach(function (f) {
    const p = lerJson(path.join(PACOTES_DIR, f), f);
    if (p) pacotes.push({ ficheiro: f, p: p });
  });
}
const basePath = path.join(PACOTES_DIR, '_base.json');
const base = fs.existsSync(basePath) ? lerJson(basePath, '_base.json') : {};

// --- O jogo real, com os avisos do dadosAcrescentar -----------------------------------------------------------------
const avisosJogo = [];
const jogo = abrirJogo({ dadosDir: DADOS_DIR, explorar: true, aoAvisar: function (m) { avisosJogo.push(m); } });
const J = JSON.parse(jogo.ev('JSON.stringify({' +
  ' ADD: DADOS_ACRESCENTADOS, ENC: ENCYCLOPEDIA_ENTRIES, VIS: VISITAS, NIV: NIVEIS_CONFIG, HIST: HISTORIA_NIVEIS, CAP: CAPITULOS_CONFIG,' +
  ' PAL: typeof PALAVRAS_DA_QUINTA === "undefined" ? [] : PALAVRAS_DA_QUINTA,' +
  ' PRO: typeof PROVA_DESCRICOES === "undefined" ? [] : PROVA_DESCRICOES,' +
  ' ENS: typeof PROVA_ENSINO === "undefined" ? {} : PROVA_ENSINO })'));
const creditos = fs.existsSync(CREDITOS_MD) ? fs.readFileSync(CREDITOS_MD, 'utf8') : '';

function motivoIgnorada(tipo, id) {
  const marca = '[dados] ' + tipo + ' "' + id + '" ignorada: ';
  const a = avisosJogo.filter(function (m) { return m.indexOf(marca) === 0; })[0];
  return a ? a.slice(marca.length) : null;
}

// --- Os textos de cada entrada (por tipo): lista de { campo, texto: { pt, en, es }, enc? } ---------------------------
function achar(lista, id) { return lista.filter(function (x) { return x && x.id === id; })[0] || null; }

function textosDe(tipo, id) {
  const r = [];
  if (tipo === 'enciclopedia') {
    const porLingua = {};
    LINGUAS.forEach(function (l) { porLingua[l] = achar(J.ENC[l] || [], id); });
    if (!LINGUAS.every(function (l) { return porLingua[l]; })) return null;
    ['titulo', 'texto'].forEach(function (c) {
      const t = {}; LINGUAS.forEach(function (l) { t[l] = porLingua[l][c]; }); r.push({ campo: c, texto: t });
    });
  } else if (tipo === 'visitas') {
    const e = achar(J.VIS, id); if (!e) return null; r.push({ campo: 'texto', texto: e.texto });
  } else if (tipo === 'palavras') {
    const e = achar(J.PAL, id); if (!e) return null; r.push({ campo: 'explicacao', texto: e.explicacao });
  } else if (tipo === 'niveis') {
    const e = achar(J.NIV, id); if (!e) return null; if (e.nome) r.push({ campo: 'nome', texto: e.nome });
  } else if (tipo === 'capitulos') {
    const e = achar(J.CAP, id); if (!e) return null;
    ['titulo', 'objetivo', 'conclusao'].forEach(function (c) { r.push({ campo: c, texto: e[c] }); });
  } else if (tipo === 'historias') {
    const a = achar(J.ADD.historias, id); if (!a) return null;
    (J.HIST[a.nivel] || []).forEach(function (f, i) { if (f && f.texto) r.push({ campo: 'falas.' + i, texto: f.texto }); });
  } else if (tipo === 'provas') {
    const e = achar(J.PRO, id) || Object.keys(J.ENS).map(function (k) { return J.ENS[k]; }).filter(function (x) { return x && x.id === id; })[0];
    if (!e) return null; r.push({ campo: 'texto', texto: e.texto });
  }
  return r;
}

// Imagens e sons que as entradas do pacote usam (para cruzar com a lista do pacote).
function usosDe(tipo, id) {
  const usos = { imagens: [], sons: [] };
  if (tipo === 'enciclopedia') {
    LINGUAS.forEach(function (l) { const e = achar(J.ENC[l] || [], id); if (e && e.imagem && usos.imagens.indexOf(e.imagem) === -1) usos.imagens.push(e.imagem); });
  } else if (tipo === 'historias') {
    const a = achar(J.ADD.historias, id);
    (a ? J.HIST[a.nivel] || [] : []).forEach(function (f) {
      if (f && f.foto) usos.imagens.push(f.foto);
      if (f && f.som) usos.sons.push(f.som);
    });
  }
  return usos;
}

// --- Conferir cada pacote -----------------------------------------------------------------------------------------
const vistos = {};        // 'tipo:id' -> pacote que o tem
const caminhosVistos = {}; // caminho -> pacote
const nosPacotes = {};    // tipo -> { id: true }
TIPOS.forEach(function (t) { nosPacotes[t] = {}; });

pacotes.forEach(function (pk) {
  const p = pk.p;
  const nome = pk.ficheiro;
  if (!eObjeto(p)) { falta(nome, 'devia ser um objeto'); return; }
  Object.keys(p).forEach(function (k) { if (CHAVES_PACOTE.indexOf(k) === -1) falta(nome, 'chave desconhecida «' + k + '» (' + CHAVES_PACOTE.join(', ') + ')'); });
  if (!temTexto(p.id) || !FORMATO_ID.test(p.id)) falta(nome, 'o id devia ter só a-z, 0-9 e _');
  else if (nome !== p.id + '.json') falta(nome, 'o ficheiro devia chamar-se ' + p.id + '.json');
  if (!temTexto(p.nome)) falta(nome, 'falta o nome');
  if (p.estado !== undefined && ESTADOS_PACOTE.indexOf(p.estado) === -1) falta(nome, 'o estado devia ser um de ' + ESTADOS_PACOTE.join(', '));
  if (p.clima !== undefined && !temTexto(p.clima)) falta(nome, 'clima devia ser um texto (o fio condutor do clima)');
  if (p.fontes !== undefined && (!Array.isArray(p.fontes) || !p.fontes.every(temTexto))) falta(nome, 'fontes devia ser uma lista de textos (só no pacote, nunca no jogo)');
  if (p.terras !== undefined && (!eObjeto(p.terras) || !Object.keys(p.terras).every(function (k) { return temTexto(k) && Array.isArray(p.terras[k]) && p.terras[k].every(temTexto); }))) falta(nome, 'terras devia ser um objeto {nome: [concelhos]} (só no pacote, nunca no jogo)');
  const excecoes = Array.isArray(p.excecoes) ? p.excecoes : [];
  if (p.excecoes !== undefined && (!Array.isArray(p.excecoes) || !p.excecoes.every(temTexto))) falta(nome, 'excecoes devia ser uma lista de «tipo:id:campo»');
  if (!eObjeto(p.ids)) { falta(nome, 'falta «ids» (um objeto com listas por tipo)'); return; }

  const idsDoPacote = {};
  Object.keys(p.ids).forEach(function (tipo) {
    const onde = nome + ' ids.' + tipo;
    if (TIPOS.indexOf(tipo) === -1) { falta(onde, 'tipo desconhecido (' + TIPOS.join(', ') + ')'); return; }
    if (!Array.isArray(p.ids[tipo])) { falta(onde, 'devia ser uma lista de ids'); return; }
    p.ids[tipo].forEach(function (id) {
      if (!temTexto(id) || !FORMATO_ID.test(id)) { falta(onde, 'id «' + id + '» devia ter só a-z, 0-9 e _'); return; }
      const chave = tipo + ':' + id;
      if (vistos[chave]) { falta(onde, 'o id «' + id + '» já está no pacote ' + vistos[chave] + (vistos[chave] === nome ? ' (repetido)' : '')); return; }
      vistos[chave] = nome;
      nosPacotes[tipo][id] = true;
      (idsDoPacote[tipo] = idsDoPacote[tipo] || []).push(id);
      if ((base && Array.isArray(base[tipo]) ? base[tipo] : []).indexOf(id) !== -1) { falta(onde, 'o id «' + id + '» já existia antes dos pacotes (_base.json)'); return; }
      const dados = J.ADD[tipo] || [];
      if (!dados.some(function (x) { return x.id === id; })) {
        const m = motivoIgnorada(tipo, id);
        falta(onde, 'o id «' + id + '» não existe em dados/' + (m ? ' (o jogo ignorou-o: ' + m + ')' : ''));
        return;
      }
      // 5. textos nas 3 línguas, com en e es diferentes do pt
      const textos = textosDe(tipo, id);
      if (!textos) { falta(onde, 'a entrada «' + id + '» não está nas listas do jogo'); return; }
      textos.forEach(function (t) {
        const donde = nome + ' ' + tipo + ' «' + id + '» ' + t.campo;
        if (!eObjeto(t.texto) || !LINGUAS.every(function (l) { return temTexto(t.texto[l]); })) { falta(donde, 'falta texto em pt, en ou es'); return; }
        if (excecoes.indexOf(tipo + ':' + id + ':' + t.campo) !== -1) return;
        ['en', 'es'].forEach(function (l) {
          if (norm(t.texto[l]) === norm(t.texto.pt)) falta(donde, 'o texto em ' + l + ' é igual ao pt (se for um nome próprio, põe «' + tipo + ':' + id + ':' + t.campo + '» em excecoes)');
        });
        // 6. Enciclopédia sem dinheiro, tokens nem links
        if (tipo === 'enciclopedia') {
          LINGUAS.forEach(function (l) {
            if (PROIBIDO_DINHEIRO.test(t.texto[l])) falta(donde, 'o texto em ' + l + ' fala de dinheiro ou de tokens');
            if (PROIBIDO_LINK.test(t.texto[l])) falta(donde, 'o texto em ' + l + ' tem um link');
          });
        }
      });
    });
  });

  // 7. imagens e sons
  const feitas = { imagens: [], sons: [] };
  [['imagens', FORMATO_IMAGEM], ['sons', FORMATO_SOM]].forEach(function (par) {
    const lista = p[par[0]] === undefined ? [] : p[par[0]];
    if (!Array.isArray(lista)) { falta(nome, par[0] + ' devia ser uma lista'); return; }
    lista.forEach(function (a, i) {
      const onde = nome + ' ' + par[0] + '[' + i + ']';
      if (!eObjeto(a)) { falta(onde, 'devia ser um objeto'); return; }
      Object.keys(a).forEach(function (k) { if (CHAVES_ATIVO.indexOf(k) === -1) falta(onde, 'chave desconhecida «' + k + '»'); });
      if (!temTexto(a.caminho) || !par[1].test(a.caminho) || a.caminho.indexOf('..') !== -1) { falta(onde, 'o caminho devia ser um ficheiro de assets/ (' + (par[0] === 'imagens' ? 'jpg, png, webp ou gif' : 'mp3, ogg, wav ou m4a') + ')'); return; }
      if (caminhosVistos[a.caminho]) falta(onde, 'o caminho «' + a.caminho + '» já está no pacote ' + caminhosVistos[a.caminho]);
      caminhosVistos[a.caminho] = nome;
      if (!temTexto(a.uso)) falta(onde, 'falta o uso');
      if (!temTexto(a.descricao)) falta(onde, 'falta a descricao');
      if (ESTADOS_ATIVO.indexOf(a.estado) === -1) { falta(onde, 'o estado devia ser um de ' + ESTADOS_ATIVO.join(', ')); return; }
      const existe = fs.existsSync(path.join(RAIZ, a.caminho));
      if (a.estado === 'feita') {
        if (!existe) falta(onde, 'está «feita» mas o ficheiro ' + a.caminho + ' não existe');
        if (creditos.indexOf(a.caminho) === -1) falta(onde, 'está «feita» mas falta a linha de ' + a.caminho + ' em CREDITOS.md');
        feitas[par[0]].push(a.caminho);
      }
    });
  });
  // o que as entradas do pacote usam tem de estar «feita» no pacote (senão devia ficar por_criar e sem o campo)
  Object.keys(idsDoPacote).forEach(function (tipo) {
    idsDoPacote[tipo].forEach(function (id) {
      const usos = usosDe(tipo, id);
      ['imagens', 'sons'].forEach(function (k) {
        usos[k].forEach(function (caminho) {
          if (feitas[k].indexOf(caminho) === -1) falta(nome + ' ' + tipo + ' «' + id + '»', 'usa ' + caminho + ' que não está como «feita» em ' + k + ' (por_criar = a entrada não usa o ficheiro: sem o campo imagem, foto ou som)');
        });
      });
    });
  });
});

// 4. órfãos: entradas de dados/ que não vêm de _base.json nem de nenhum pacote
TIPOS.forEach(function (tipo) {
  (J.ADD[tipo] || []).forEach(function (x) {
    const naBase = base && Array.isArray(base[tipo]) && base[tipo].indexOf(x.id) !== -1;
    if (!naBase && !nosPacotes[tipo][x.id]) falta('dados/ ' + tipo, 'o id «' + x.id + '» não está em nenhum pacote (nem em _base.json): ids órfãos');
  });
});

// 8. palavras novas: nenhuma repete outra (sem acentos nem maiúsculas)
const vistasPalavras = {};
J.PAL.forEach(function (x) {
  const k = semAcentos(x.palavra);
  if (vistasPalavras[k]) falta('palavras', '«' + x.palavra + '» repete «' + vistasPalavras[k] + '» (sem contar acentos nem maiúsculas)');
  else vistasPalavras[k] = x.palavra;
});
// uma palavra de um pacote que o jogo ignorou por repetida já aparece acima como «não existe», com o motivo
avisosJogo.forEach(function (m) {
  if (/^\[dados\] palavras "[^"]*" ignorada: já existe esta palavra/.test(m)) falta('palavras', m.replace('[dados] ', ''));
});

if (faltas.length === 0) {
  console.log('OK (' + pacotes.length + (pacotes.length === 1 ? ' pacote' : ' pacotes') + ')');
  process.exit(0);
}
console.log('FALHOU (' + faltas.length + '):');
faltas.forEach(function (f) { console.log(' - ' + f); });
process.exit(1);
