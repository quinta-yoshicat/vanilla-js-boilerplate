// Ficheiro de dados — ver dados/LEIAME.md. A Prova às cegas (js/prova.js): cada entrada acrescenta-se com
// dadosAcrescentar('provas', { id, cor, texto: { pt, en, es } }) (js/dados.js). cor: 1 Jovem, 2 Dourado, 3 Âmbar, 4 Cobre.
// Uma descrição fala só de cor, aroma e de «pouco» ou «muito» descanso, sem números, «dias», «horas» nem «anos», e nunca
// diz o nome de uma cor (seria dar a resposta). Com ensino: true é a linha que ensina a cor (uma por cor), e essa diz o
// nome da sua cor. As palavras seguem as que o jogo já usa («mel e frutos secos», «figo e noz») e a Enciclopédia
// («As cores do tempo»: com o tempo o Moscatel escurece; o mais velho é o mais escuro, com laivos avermelhados).

// Jovem: pouco descanso
dadosAcrescentar('provas', { id: 'prova_jovem_1', cor: 1, texto: {
  pt: 'Cor de palha clara, cheira a uva fresca e a flor de laranjeira. Mal descansou na Cave.',
  en: 'Pale straw colour, smells of fresh grapes and orange blossom. It barely rested in the Cellar.',
  es: 'Color paja claro, huele a uva fresca y a azahar. Apenas reposó en la Cava.'
} });
dadosAcrescentar('provas', { id: 'prova_jovem_2', cor: 1, texto: {
  pt: 'Quase transparente, com reflexos verdes. No nariz, casca de limão e uva acabada de colher.',
  en: 'Almost clear, with green glints. Lemon peel and just-picked grapes on the nose.',
  es: 'Casi transparente, con reflejos verdes. En nariz, piel de limón y uva recién cogida.'
} });
dadosAcrescentar('provas', { id: 'prova_jovem_3', cor: 1, texto: {
  pt: 'Claro como a luz da manhã, leve na boca, a lembrar flores do campo e fruta fresca.',
  en: 'Light as the morning sun, delicate in the mouth, with wild flowers and fresh fruit.',
  es: 'Claro como la luz de la mañana, ligero en boca, con flores del campo y fruta fresca.'
} });
dadosAcrescentar('provas', { id: 'prova_jovem_4', cor: 1, texto: {
  pt: 'Amarelo muito claro, cheiro a jasmim e a uva madura. Descansou pouco e nota-se.',
  en: 'Very pale yellow, smelling of jasmine and ripe grapes. A short rest, and it shows.',
  es: 'Amarillo muy claro, huele a jazmín y a uva madura. Reposó poco y se nota.'
} });
dadosAcrescentar('provas', { id: 'prova_jovem_5', cor: 1, texto: {
  pt: 'Brilhante e pálido, fresco e frutado, como quem acabou de sair do lagar.',
  en: 'Bright and pale, fresh and fruity, as if it had just left the wine press.',
  es: 'Brillante y pálido, fresco y afrutado, como recién salido del lagar.'
} });
dadosAcrescentar('provas', { id: 'prova_ensino_jovem', cor: 1, ensino: true, texto: {
  pt: 'Jovem: pouco tempo na Cave, cor clara e aromas frescos de uva e flor.',
  en: 'Young: a short time in the Cellar, pale colour and fresh aromas of grape and flowers.',
  es: 'Joven: poco tiempo en la Cava, color claro y aromas frescos de uva y flores.'
} });

// Dourado: algum descanso
dadosAcrescentar('provas', { id: 'prova_dourado_1', cor: 2, texto: {
  pt: 'Cor de ouro brilhante, cheira a mel novo e a casca de laranja.',
  en: 'Bright gold colour, smells of new honey and orange peel.',
  es: 'Color oro brillante, huele a miel nueva y a piel de naranja.'
} });
dadosAcrescentar('provas', { id: 'prova_dourado_2', cor: 2, texto: {
  pt: 'Amarelo carregado e luminoso, com damasco e flor de laranjeira já mais doces.',
  en: 'Deep, luminous yellow, with apricot and orange blossom, already sweeter.',
  es: 'Amarillo intenso y luminoso, con albaricoque y azahar, ya más dulces.'
} });
dadosAcrescentar('provas', { id: 'prova_dourado_3', cor: 2, texto: {
  pt: 'Cor de sol de fim de tarde, mel claro e pêssego maduro no nariz.',
  en: 'The colour of the late afternoon sun, light honey and ripe peach on the nose.',
  es: 'Color de sol al atardecer, miel clara y melocotón maduro en nariz.'
} });
dadosAcrescentar('provas', { id: 'prova_dourado_4', cor: 2, texto: {
  pt: 'Brilho de ouro polido, aroma de alperce seco e uma pitada de mel.',
  en: 'Polished gold shine, aromas of dried apricot and a touch of honey.',
  es: 'Brillo de oro pulido, aroma de orejón y un toque de miel.'
} });
dadosAcrescentar('provas', { id: 'prova_dourado_5', cor: 2, texto: {
  pt: 'Já não é pálido nem escuro: cor de ouro, com damasco maduro e um fio de mel novo.',
  en: 'Neither pale nor dark any more: gold, with ripe apricot and a thread of new honey.',
  es: 'Ya no es pálido ni oscuro: color oro, con albaricoque maduro y un hilo de miel nueva.'
} });
dadosAcrescentar('provas', { id: 'prova_ensino_dourado', cor: 2, ensino: true, texto: {
  pt: 'Dourado: algum descanso na Cave, cor de ouro e aromas de mel e laranja.',
  en: 'Golden: some rest in the Cellar, gold colour and aromas of honey and orange.',
  es: 'Dorado: algo de reposo en la Cava, color oro y aromas de miel y naranja.'
} });

// Âmbar: mais descanso
dadosAcrescentar('provas', { id: 'prova_ambar_1', cor: 3, texto: {
  pt: 'Cor de mel escuro, cheira a mel e frutos secos. Já descansou bastante na Cave.',
  en: 'The colour of dark honey, smells of honey and dried fruit. It has rested a good while in the Cellar.',
  es: 'Color de miel oscura, huele a miel y frutos secos. Ya reposó bastante en la Cava.'
} });
dadosAcrescentar('provas', { id: 'prova_ambar_2', cor: 3, texto: {
  pt: 'Tom de topázio, com aroma de tâmara e de laranja cristalizada.',
  en: 'Topaz tone, with date and candied orange on the nose.',
  es: 'Tono topacio, con dátil y naranja confitada en nariz.'
} });
dadosAcrescentar('provas', { id: 'prova_ambar_3', cor: 3, texto: {
  pt: 'Cor de chá forte e brilhante, com tâmara e passas no nariz.',
  en: 'Like strong, bright tea, with dates and raisins on the nose.',
  es: 'Como un té fuerte y brillante, con dátiles y pasas en nariz.'
} });
dadosAcrescentar('provas', { id: 'prova_ambar_4', cor: 3, texto: {
  pt: 'Tom de mel escuro, aroma de passas e de amêndoa torrada.',
  en: 'Dark honey tone, aromas of raisins and toasted almond.',
  es: 'Tono de miel oscura, aromas de pasas y almendra tostada.'
} });
dadosAcrescentar('provas', { id: 'prova_ambar_5', cor: 3, texto: {
  pt: 'Cor de mel de castanheiro, com aromas de frutos secos e de passas.',
  en: 'The colour of chestnut honey, with dried fruit and raisins.',
  es: 'Color de miel de castaño, con frutos secos y pasas.'
} });
dadosAcrescentar('provas', { id: 'prova_ensino_ambar', cor: 3, ensino: true, texto: {
  pt: 'Âmbar: mais tempo na Cave, aromas de mel e frutos secos.',
  en: 'Amber: more time in the Cellar, aromas of honey and dried fruit.',
  es: 'Ámbar: más tiempo en la Cava, aromas de miel y frutos secos.'
} });

// Cobre: o que mais descansou
dadosAcrescentar('provas', { id: 'prova_cobre_1', cor: 4, texto: {
  pt: 'Reflexos avermelhados, cheira a noz, caramelo e café. É o que mais descansou.',
  en: 'Reddish glints, smells of walnut, caramel and coffee. The one that rested the longest.',
  es: 'Reflejos rojizos, huele a nuez, caramelo y café. Es el que más reposó.'
} });
dadosAcrescentar('provas', { id: 'prova_cobre_2', cor: 4, texto: {
  pt: 'Escuro e profundo, quase castanho, com figo e noz e um final muito comprido.',
  en: 'Dark and deep, almost brown, with fig and walnut and a very long finish.',
  es: 'Oscuro y profundo, casi marrón, con higo y nuez y un final muy largo.'
} });
dadosAcrescentar('provas', { id: 'prova_cobre_3', cor: 4, texto: {
  pt: 'Cor de mogno com laivos vermelhos, aroma de cacau e de laranja amarga.',
  en: 'Mahogany with red streaks, aromas of cocoa and bitter orange.',
  es: 'Caoba con vetas rojas, aromas de cacao y naranja amarga.'
} });
dadosAcrescentar('provas', { id: 'prova_cobre_4', cor: 4, texto: {
  pt: 'Castanho com brilho avermelhado, cheiro a café torrado e a nozes.',
  en: 'Brown with a reddish shine, smelling of roasted coffee and walnuts.',
  es: 'Marrón con brillo rojizo, huele a café tostado y a nueces.'
} });
dadosAcrescentar('provas', { id: 'prova_cobre_5', cor: 4, texto: {
  pt: 'O mais escuro da Cave: tons de tijolo, caramelo queimado e nozes tostadas.',
  en: 'The darkest in the Cellar: brick tones, burnt caramel and toasted walnuts.',
  es: 'El más oscuro de la Cava: tonos de ladrillo, caramelo quemado y nueces tostadas.'
} });
dadosAcrescentar('provas', { id: 'prova_ensino_cobre', cor: 4, ensino: true, texto: {
  pt: 'Cobre: o que mais descansou, reflexos avermelhados, figo e noz.',
  en: 'Copper: the one that rested the longest, reddish glints, fig and walnut.',
  es: 'Cobre: el que más reposó, reflejos rojizos, higo y nuez.'
} });
