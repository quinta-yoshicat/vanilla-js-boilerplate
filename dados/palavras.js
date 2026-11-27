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
  id: 'agua_ruca',
  palavra: 'água ruça',
  explicacao: {
    pt: 'Líquido aguado que sai da prensa junto com o azeite e depois se separa dele.',
    en: 'Watery liquid that runs from the press with the oil and is later separated from it.',
    es: 'Líquido acuoso que sale de la prensa junto al aceite y luego se separa de él.'
  }
});

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
  id: 'apicultor',
  palavra: 'apicultor',
  explicacao: {
    pt: 'Pessoa que cuida das colmeias e recolhe o mel das abelhas.',
    en: 'Person who looks after the beehives and collects the honey from the bees.',
    es: 'Persona que cuida de las colmenas y recoge la miel de las abejas.'
  }
});

dadosAcrescentar('palavras', {
  id: 'arrozal',
  palavra: 'arrozal',
  explicacao: {
    pt: 'Campo alagado onde se cultiva o arroz.',
    en: 'Flooded field where rice is grown.',
    es: 'Campo inundado donde se cultiva el arroz.'
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
  id: 'caldeacao',
  palavra: 'caldeação',
  explicacao: {
    pt: 'Água quente juntada à pasta antes de uma segunda prensagem.',
    en: 'Hot water added to the paste before a second pressing.',
    es: 'Agua caliente añadida a la pasta antes de un segundo prensado.'
  }
});

dadosAcrescentar('palavras', {
  id: 'cardo',
  palavra: 'cardo',
  explicacao: {
    pt: 'Planta de flor roxa que nasce sozinha no monte; a sua flor serve de coalho.',
    en: 'Plant with a purple flower that grows wild in the countryside; its flower is used as rennet.',
    es: 'Planta de flor morada que nace sola en el monte; su flor sirve de cuajo.'
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
  id: 'choco',
  palavra: 'choco',
  explicacao: {
    pt: 'Animal marinho de corpo mole, parente do polvo e da lula, muito pescado no estuário do Sado.',
    en: 'Soft-bodied sea animal, a relative of the octopus and the squid, widely fished in the Sado estuary.',
    es: 'Animal marino de cuerpo blando, pariente del pulpo y del calamar, muy pescado en el estuario del Sado.'
  }
});

dadosAcrescentar('palavras', {
  id: 'coalho',
  palavra: 'coalho',
  explicacao: {
    pt: 'Aquilo que faz o leite coalhar e virar queijo. No queijo de Azeitão vem da flor de cardo.',
    en: 'What makes milk curdle and turn into cheese. In Azeitão cheese it comes from the cardoon flower.',
    es: 'Lo que hace cuajar la leche y convertirla en queso. En el queso de Azeitão procede de la flor de cardo.'
  }
});

dadosAcrescentar('palavras', {
  id: 'colhereiro',
  palavra: 'colhereiro',
  explicacao: {
    pt: 'Ave de bico comprido e achatado na ponta, como uma colher, que procura comida na água pouco funda.',
    en: 'Bird with a long bill, flattened at the tip like a spoon, that looks for food in shallow water.',
    es: 'Ave de pico largo y aplanado en la punta, como una cuchara, que busca comida en el agua poco profunda.'
  }
});

dadosAcrescentar('palavras', {
  id: 'colmeia',
  palavra: 'colmeia',
  explicacao: {
    pt: 'Caixa onde vive uma colónia de abelhas e onde elas fazem o mel.',
    en: 'Box where a colony of bees lives and makes its honey.',
    es: 'Caja donde vive una colonia de abejas y donde hacen la miel.'
  }
});

dadosAcrescentar('palavras', {
  id: 'covo',
  palavra: 'covo',
  explicacao: {
    pt: 'Armadilha de pesca, como uma gaiola, onde o choco ou o polvo entram e já não saem.',
    en: 'Fishing trap, like a cage, that cuttlefish or octopus go into and cannot get out of.',
    es: 'Trampa de pesca, como una jaula, en la que el choco o el pulpo entran y ya no salen.'
  }
});

dadosAcrescentar('palavras', {
  id: 'cristalizador',
  palavra: 'cristalizador',
  explicacao: {
    pt: 'Tanque raso onde o sal cristaliza no fim do circuito da salina.',
    en: 'Shallow pond where the salt crystallizes at the end of the salina circuit.',
    es: 'Estanque poco profundo donde cristaliza la sal al final del circuito de la salina.'
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
  id: 'desboia',
  palavra: 'desbóia',
  explicacao: {
    pt: 'Primeiro descortiçamento de um sobreiro.',
    en: 'First stripping of a cork oak.',
    es: 'Primer descorche de un alcornoque.'
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
  id: 'entrecasco',
  palavra: 'entrecasco',
  explicacao: {
    pt: 'Camada viva por baixo da cortiça, que o machado não pode ferir.',
    en: 'Living layer under the cork that the axe must not hurt.',
    es: 'Capa viva bajo el corcho que el hacha no debe dañar.'
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
  id: 'flor_de_sal',
  palavra: 'flor de sal',
  explicacao: {
    pt: 'Película fina de cristais que se forma à superfície da água da salina quando há evaporação intensa e tempo estável.',
    en: 'Thin film of crystals that forms on the surface of the salina water when evaporation is intense and the weather is stable.',
    es: 'Fina película de cristales que se forma en la superficie del agua de la salina cuando hay evaporación intensa y tiempo estable.'
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
  id: 'galga',
  palavra: 'galga',
  explicacao: {
    pt: 'Mó de pedra que esmaga a azeitona no lagar.',
    en: 'Stone wheel that crushes the olives in the mill.',
    es: 'Rueda de piedra que machaca la aceituna en la almazara.'
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
  id: 'magusto',
  palavra: 'magusto',
  explicacao: {
    pt: 'festa de outono, por volta do São Martinho, em que se assam castanhas na fogueira e se prova o vinho novo.',
    en: "an autumn festival, around St. Martin's Day, where chestnuts are roasted on the bonfire and the new wine is tasted.",
    es: 'fiesta de otoño, en torno a San Martín, en la que se asan castañas en la hoguera y se prueba el vino nuevo.'
  }
});

dadosAcrescentar('palavras', {
  id: 'maquia',
  palavra: 'maquia',
  explicacao: {
    pt: 'Pagamento em azeite que se dava ao lagar pelo trabalho.',
    en: 'Payment in olive oil given to the mill for its work.',
    es: 'Pago en aceite que se daba a la almazara por su trabajo.'
  }
});

dadosAcrescentar('palavras', {
  id: 'marnoto',
  palavra: 'marnoto',
  explicacao: {
    pt: 'Salineiro que governa a água, a salinidade e a colheita numa salina.',
    en: 'Salt worker who manages the water, the salinity and the harvest in a salina.',
    es: 'Salinero que gobierna el agua, la salinidad y la cosecha en una salina.'
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
  id: 'miolo',
  palavra: 'miolo',
  explicacao: {
    pt: 'A parte branca de dentro do pinhão, depois de tirada a casca.',
    en: 'The white part inside the pine nut, after the shell is removed.',
    es: 'La parte blanca del interior del piñón, una vez quitada la cáscara.'
  }
});

dadosAcrescentar('palavras', {
  id: 'molheiro',
  palavra: 'molheiro',
  explicacao: {
    pt: 'Quem recolhe as pranchas de cortiça que se soltam do sobreiro.',
    en: 'Worker who gathers the cork planks that come off the tree.',
    es: 'Trabajador que recoge las planchas de corcho que se sueltan del árbol.'
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
  id: 'nectar',
  palavra: 'néctar',
  explicacao: {
    pt: 'Líquido açucarado que as flores produzem e de que as abelhas fazem o mel.',
    en: 'Sugary liquid that flowers produce and that bees turn into honey.',
    es: 'Líquido azucarado que producen las flores y con el que las abejas hacen la miel.'
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
  id: 'ourico',
  palavra: 'ouriço',
  explicacao: {
    pt: 'a cápsula espinhosa que protege as castanhas e se abre no outono (não é o animal).',
    en: 'the spiny husk that protects the chestnuts and opens in autumn (not the animal).',
    es: 'la cápsula espinosa que protege las castañas y se abre en otoño (no es el animal).'
  }
});

dadosAcrescentar('palavras', {
  id: 'pinha',
  palavra: 'pinha',
  explicacao: {
    pt: 'Fruto do pinheiro, em forma de ovo, que guarda os pinhões lá dentro.',
    en: 'The fruit of the pine tree, egg-shaped, that keeps the pine nuts inside.',
    es: 'Fruto del pino, con forma de huevo, que guarda los piñones dentro.'
  }
});

dadosAcrescentar('palavras', {
  id: 'pinhal',
  palavra: 'pinhal',
  explicacao: {
    pt: 'Floresta de pinheiros.',
    en: 'A forest of pine trees.',
    es: 'Bosque de pinos.'
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
  id: 'regadio',
  palavra: 'regadio',
  explicacao: {
    pt: 'Terreno que se rega com água de albufeiras ou canais, para as culturas crescerem no verão.',
    en: 'Land that is watered from reservoirs or canals so that crops can grow in summer.',
    es: 'Terreno que se riega con agua de embalses o canales para que los cultivos crezcan en verano.'
  }
});

dadosAcrescentar('palavras', {
  id: 'roaz',
  palavra: 'roaz',
  explicacao: {
    pt: 'Golfinho grande e robusto; no Sado vive uma comunidade que ali fica o ano inteiro.',
    en: 'Large, robust dolphin; in the Sado estuary there is a community that stays there all year round.',
    es: 'Delfín grande y robusto; en el Sado vive una comunidad que se queda allí todo el año.'
  }
});

dadosAcrescentar('palavras', {
  id: 'rosmaninho',
  palavra: 'rosmaninho',
  explicacao: {
    pt: 'Planta aromática de flores roxas, parecida com a lavanda, comum nas serras e boa para as abelhas.',
    en: 'Aromatic plant with purple flowers, similar to lavender, common in the hills and good for bees.',
    es: 'Planta aromática de flores moradas, parecida a la lavanda, común en las sierras y buena para las abejas.'
  }
});

dadosAcrescentar('palavras', {
  id: 'seira',
  palavra: 'seira',
  explicacao: {
    pt: 'Cesto redondo, de esparto, onde se põe a pasta da azeitona para a prensa.',
    en: 'Round esparto basket that holds the olive paste for the press.',
    es: 'Cesto redondo de esparto que sostiene la pasta de aceituna en la prensa.'
  }
});

dadosAcrescentar('palavras', {
  id: 'soro',
  palavra: 'soro',
  explicacao: {
    pt: 'Líquido que sai do queijo quando se espreme a massa.',
    en: 'Liquid that comes out of the cheese when the curd is pressed.',
    es: 'Líquido que sale del queso cuando se prensa la masa.'
  }
});

dadosAcrescentar('palavras', {
  id: 'souto',
  palavra: 'souto',
  explicacao: {
    pt: 'pomar de castanheiros.',
    en: 'an orchard of chestnut trees.',
    es: 'huerto de castaños.'
  }
});

dadosAcrescentar('palavras', {
  id: 'tiradia',
  palavra: 'tiradia',
  explicacao: {
    pt: 'Campanha de extração da cortiça, de maio a agosto.',
    en: 'The cork harvest season, from May to August.',
    es: 'Campaña de extracción del corcho, de mayo a agosto.'
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
