// Ficheiro de dados — ver dados/LEIAME.md. Cada entrada acrescenta-se com dadosAcrescentar('visitas', { ... }) (js/dados.js).
// Aqui vão as VISITAS novas: { id, personagem, reputacao (1 a 3), condicao (ou null), texto: { pt, en, es } }.
// A personagem tem de existir em VISITAS_PERSONAGENS (js/visitas.js).

dadosAcrescentar('visitas', {
  id: 'marisa_5',
  personagem: 'marisa',
  reputacao: 1,
  condicao: { tipo: 'fase', valores: ['quedaFolha'] },
  texto: {
    pt: 'Depois da vindima, a vinha parece uma sala depois da festa: folhas por todo o lado e ninguém com vontade de arrumar. Eu arrumo.',
    en: 'After the harvest, the vineyard looks like a room after a party: leaves everywhere and nobody feeling like tidying up. I tidy up.',
    es: 'Después de la vendimia, la viña parece una sala después de la fiesta: hojas por todas partes y nadie con ganas de recoger. Yo recojo.'
  }
});

// Fontes: Diário da República, Portaria 118/2014 alterada em 2015 (https://informador.pt/?p=80327); Bacalhôa, Moscatel de Setúbal 5 anos (https://media.bacalhoa.pt/1/documentos/993/bacalhoa-moscatel-de-setubal-5-anosptpdf.pdf).
dadosAcrescentar('visitas', {
  id: 'henrique_5',
  personagem: 'henrique',
  reputacao: 2,
  condicao: { tipo: 'cave' },
  texto: {
    pt: 'Sabias que um Moscatel só pode dizer «10 anos» no rótulo se tiver mesmo, no mínimo, 10 anos? Era bom que tudo na vida fosse assim honesto.',
    en: 'Did you know a Moscatel can only say "10 years" on its label if it is really at least 10 years old? It would be nice if everything in life were that honest.',
    es: '¿Sabías que un Moscatel solo puede decir «10 años» en la etiqueta si tiene de verdad, como mínimo, 10 años? Ojalá todo en la vida fuera así de honesto.'
  }
});
