// Ficheiro de dados — ver dados/LEIAME.md. PALAVRAS DA QUINTA: o glossário (palavras difíceis ou técnicas, com uma explicação simples).
// Cada entrada acrescenta-se com dadosAcrescentar('palavras', { ... }), pela ORDEM ALFABÉTICA da palavra (sem contar acentos nem maiúsculas):
//   { id, palavra, explicacao: { pt, en, es }, nivel (opcional) }
//   id         texto simples, único, só a-z, 0-9 e _ (sem acentos)
//   palavra    a palavra em português, igual nas 3 línguas (é o termo do jogo)
//   explicacao as 3 línguas, simples e curtas, sem a palavra à frente (o ecrã é que a põe)
//   nivel      opcional: o nível (inteiro >= 1) a partir do qual a palavra aparece. Por preencher em todas por agora.
// AINDA NÃO ESTÁ NO JOGO: este ficheiro não é carregado pelo index.html e js/dados.js ainda não conhece o tipo 'palavras'. Não aparece em
// nenhum ecrã, não mexe no estado nem na nuvem. A PR seguinte mostra-o (e passa a carregá-lo).
// Os textos EN e ES foram escritos a partir do PT e NÃO foram revistos por um falante nativo.

dadosAcrescentar('palavras', {
  id: 'aguardente_vinica',
  palavra: 'aguardente vínica',
  explicacao: {
    pt: 'aguardente feita a partir de vinho. Junta-se ao mosto para fazer vinhos como o Moscatel.',
    en: 'a spirit made from wine. It is added to the must to make wines like Moscatel.',
    es: 'aguardiente hecho a partir de vino. Se añade al mosto para hacer vinos como el Moscatel.'
  }
});

dadosAcrescentar('palavras', {
  id: 'alambique',
  palavra: 'alambique',
  explicacao: {
    pt: 'aparelho onde se ferve o vinho ou o bagaço para fazer aguardente.',
    en: 'a device in which wine or pomace is boiled to make a spirit.',
    es: 'aparato donde se hierve el vino o el orujo para hacer aguardiente.'
  }
});

dadosAcrescentar('palavras', {
  id: 'bacelo',
  palavra: 'bacelo',
  explicacao: {
    pt: 'videira nova, acabada de plantar.',
    en: 'a young vine, just planted.',
    es: 'vid joven, recién plantada.'
  }
});

dadosAcrescentar('palavras', {
  id: 'bagaceira',
  palavra: 'bagaceira',
  explicacao: {
    pt: 'aguardente feita com o bagaço, destilada no alambique.',
    en: 'a spirit made from the pomace (bagaço), distilled in the still.',
    es: 'aguardiente hecho con el orujo (bagaço), destilado en el alambique.'
  }
});

dadosAcrescentar('palavras', {
  id: 'bagaco',
  palavra: 'bagaço',
  explicacao: {
    pt: 'o que sobra das uvas depois de prensadas: as cascas e as grainhas.',
    en: 'what is left of the grapes after pressing: the skins and the seeds.',
    es: 'lo que queda de las uvas después de prensarlas: los hollejos y las pepitas.'
  }
});

dadosAcrescentar('palavras', {
  id: 'casta',
  palavra: 'casta',
  explicacao: {
    pt: 'o tipo de uva, como o Moscatel ou o Castelão.',
    en: 'the type of grape, like Moscatel or Castelão.',
    es: 'el tipo de uva, como el Moscatel o el Castelão.'
  }
});

dadosAcrescentar('palavras', {
  id: 'curtimenta',
  palavra: 'curtimenta',
  explicacao: {
    pt: 'o tempo em que o mosto fica em contacto com as cascas, para ganhar cor e aroma.',
    en: 'the time the must stays in contact with the skins, to gain colour and aroma.',
    es: 'el tiempo en que el mosto está en contacto con los hollejos, para ganar color y aroma.'
  }
});

dadosAcrescentar('palavras', {
  id: 'dop',
  palavra: 'DOP',
  explicacao: {
    pt: 'Denominação de Origem Protegida: um nome protegido por lei, que só se usa se o produto vier daquela região.',
    en: 'PDO (Protected Designation of Origin): a name protected by law, used only if the product comes from that region.',
    es: 'DOP (Denominación de Origen Protegida): un nombre protegido por ley, que solo se usa si el producto viene de esa región.'
  }
});

dadosAcrescentar('palavras', {
  id: 'estuario',
  palavra: 'estuário',
  explicacao: {
    pt: 'o sítio onde um rio entra no mar e a água doce se mistura com a salgada.',
    en: 'the place where a river meets the sea and fresh water mixes with salt water.',
    es: 'el lugar donde un río entra en el mar y el agua dulce se mezcla con la salada.'
  }
});

dadosAcrescentar('palavras', {
  id: 'fortificar',
  palavra: 'fortificar',
  explicacao: {
    pt: 'juntar aguardente ao mosto para parar a fermentação: o vinho fica doce e mais forte.',
    en: 'to add spirit to the must to stop the fermentation: the wine stays sweet and gets stronger.',
    es: 'añadir aguardiente al mosto para detener la fermentación: el vino queda dulce y más fuerte.'
  }
});

dadosAcrescentar('palavras', {
  id: 'jeropiga',
  palavra: 'jeropiga',
  explicacao: {
    pt: 'bebida doce feita com mosto e aguardente, típica de festas como o São Martinho.',
    en: 'a sweet drink made from must and spirit, typical of festivals like St. Martin.',
    es: 'bebida dulce hecha con mosto y aguardiente, típica de fiestas como San Martín.'
  }
});

dadosAcrescentar('palavras', {
  id: 'lagar',
  palavra: 'lagar',
  explicacao: {
    pt: 'o sítio onde se pisam e espremem as uvas.',
    en: 'the place where grapes are trodden and pressed.',
    es: 'el lugar donde se pisan y se exprimen las uvas.'
  }
});

dadosAcrescentar('palavras', {
  id: 'mildio',
  palavra: 'míldio',
  explicacao: {
    pt: 'doença da vinha que aparece com humidade e chuva.',
    en: 'a vine disease that appears with humidity and rain.',
    es: 'enfermedad de la vid que aparece con humedad y lluvia.'
  }
});

dadosAcrescentar('palavras', {
  id: 'montado',
  palavra: 'montado',
  explicacao: {
    pt: 'paisagem de sobreiros, com pasto por baixo.',
    en: 'a landscape of cork oaks, with pasture underneath.',
    es: 'paisaje de alcornoques, con pasto debajo.'
  }
});

dadosAcrescentar('palavras', {
  id: 'mosto',
  palavra: 'mosto',
  explicacao: {
    pt: 'o sumo das uvas, antes de virar vinho.',
    en: 'grape juice, before it becomes wine.',
    es: 'el zumo de las uvas, antes de convertirse en vino.'
  }
});

dadosAcrescentar('palavras', {
  id: 'oidio',
  palavra: 'oídio',
  explicacao: {
    pt: 'doença da vinha que aparece com calor, e deixa um pó esbranquiçado nas folhas.',
    en: 'a vine disease that appears with heat, and leaves a whitish powder on the leaves.',
    es: 'enfermedad de la vid que aparece con calor y deja un polvo blanquecino en las hojas.'
  }
});

dadosAcrescentar('palavras', {
  id: 'pousio',
  palavra: 'pousio',
  explicacao: {
    pt: 'terra deixada a descansar, sem plantar nada.',
    en: 'land left to rest, with nothing planted.',
    es: 'tierra que se deja descansar, sin plantar nada.'
  }
});

dadosAcrescentar('palavras', {
  id: 'redura',
  palavra: 'redura',
  explicacao: {
    pt: 'a colheita do sal nas salinas.',
    en: 'the salt harvest in the salt pans.',
    es: 'la cosecha de la sal en las salinas.'
  }
});

dadosAcrescentar('palavras', {
  id: 'torna_viagem',
  palavra: 'torna-viagem',
  explicacao: {
    pt: 'vinho que ia de barco para terras distantes e voltava: a viagem melhorava-o.',
    en: 'wine that went by ship to faraway lands and came back: the voyage improved it.',
    es: 'vino que iba en barco a tierras lejanas y volvía: el viaje lo mejoraba.'
  }
});

dadosAcrescentar('palavras', {
  id: 'vinho_generoso',
  palavra: 'vinho generoso',
  explicacao: {
    pt: 'vinho a que se junta aguardente, por isso é mais forte e doce.',
    en: 'wine to which spirit is added, so it is stronger and sweet.',
    es: 'vino al que se añade aguardiente, por eso es más fuerte y dulce.'
  }
});
