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

// Factos que o jogo já diz: a tirada (tiradia) da cortiça é de maio a agosto, de nove em nove anos, e a cortiça fecha as garrafas (Enciclopédia e glossário).
dadosAcrescentar('visitas', {
  id: 'valentim_5',
  personagem: 'valentim',
  reputacao: 1,
  condicao: { tipo: 'estacao', valor: 'verao' },
  texto: {
    pt: 'A tirada da cortiça vai de maio a agosto, e cada sobreiro só a dá de nove em nove anos. Depois essa casca vem fechar-me as garrafas: tanta paciência para uma rolha.',
    en: 'The cork stripping runs from May to August, and each cork oak only gives its bark every nine years. Then that bark comes to seal my bottles: so much patience for one stopper.',
    es: 'La saca del corcho va de mayo a agosto, y cada alcornoque solo lo da cada nueve años. Luego esa corteza viene a cerrarme las botellas: tanta paciencia para un tapón.'
  }
});

// Factos que o jogo já diz: no lagar de azeite pagava-se em azeite, a maquia (Enciclopédia e glossário).
dadosAcrescentar('visitas', {
  id: 'henrique_6',
  personagem: 'henrique',
  reputacao: 1,
  condicao: { tipo: 'estacao', valor: 'inverno' },
  texto: {
    pt: 'Antigamente pagava-se ao lagar com azeite: era a maquia. A minha é em copos, e não aceito vales.',
    en: 'In the old days you paid the oil mill in olive oil: that was the maquia. Mine is in glasses, and I don\'t accept vouchers.',
    es: 'Antiguamente se pagaba a la almazara con aceite: era la maquia. La mía es en copas, y no acepto vales.'
  }
});
