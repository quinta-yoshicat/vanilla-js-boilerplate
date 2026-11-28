// Ficheiro de dados — ver dados/LEIAME.md. Cada entrada acrescenta-se com dadosAcrescentar('enciclopedia', { ... }) (js/dados.js).
// Aqui vão as HISTÓRIAS NOVAS DA ENCICLOPÉDIA: { id, titulo: { pt, en, es }, texto: { pt, en, es }, nivelMinimo (inteiro >= 1),
// imagem (opcional, caminho que exista em assets/), meses (opcional), estacao (opcional), manual (opcional, true) }.
// A entrada só existe para o jogador a partir do nível "nivelMinimo" e, depois, sai primeiro no Explorar (prioridade). O id não pode repetir nenhum id da Enciclopédia.

// Níveis 5 e 6 («Cave de Reserva» e «A Coleção»), sobre a idade e o envelhecimento do Moscatel de Setúbal: 3 histórias de cada nível. Sem imagem.
// Vêm primeiro (por ordem de nível). As fontes de cada uma vão no comentário que a antecede.

// Nível 5.
// Fontes: Diário da República, Portaria 118/2014 alterada em 2015 (https://informador.pt/?p=80327); Bacalhôa, Moscatel de Setúbal 5 anos (https://media.bacalhoa.pt/1/documentos/993/bacalhoa-moscatel-de-setubal-5-anosptpdf.pdf).
dadosAcrescentar('enciclopedia', {
  id: 'cave_idade_rotulo',
  nivelMinimo: 5,
  titulo: { pt: 'Quantos anos tem o Moscatel?', en: 'How old is the Moscatel?', es: '¿Cuántos años tiene el Moscatel?' },
  texto: {
    pt: 'Num Moscatel de Setúbal, o rótulo pode dizer «5 anos», «10 anos», «20 anos», de 5 em 5 anos até «40 anos». Só se pode escrever esse número se os vinhos da garrafa tiverem, no mínimo, essa idade.',
    en: 'On a Moscatel de Setúbal, the label may say "5 years", "10 years", "20 years", in steps of 5 up to "40 years". The number can only be written if the wines in the bottle are at least that old.',
    es: 'En un Moscatel de Setúbal, la etiqueta puede decir «5 años», «10 años», «20 años», de 5 en 5 hasta «40 años». Solo se puede escribir ese número si los vinos de la botella tienen, como mínimo, esa edad.'
  }
});

// Fontes: Bacalhôa (o mesmo pdf de 5 anos: lote de várias colheitas); Cavelusa, Moscatel Alambre 20 Anos (https://www.cavelusa.pt/en/product-category/fortified/moscatel/page/3/); José Maria da Fonseca, Moscatel 10 anos (https://jmf.pt/pdf/pt/ABD_10P.pdf).
dadosAcrescentar('enciclopedia', {
  id: 'cave_varias_colheitas',
  nivelMinimo: 5,
  titulo: { pt: 'Muitas colheitas na mesma garrafa', en: 'Many harvests in the same bottle', es: 'Muchas cosechas en la misma botella' },
  texto: {
    pt: 'Um Moscatel «de 20 anos» pode juntar vinhos de muitas colheitas. Um lote conhecido reúne 19, e a mais nova tem pelo menos 20 anos.',
    en: 'A "20-year-old" Moscatel can blend wines from many harvests. One well-known blend brings together 19, and the youngest is at least 20 years old.',
    es: 'Un Moscatel «de 20 años» puede juntar vinos de muchas cosechas. Un lote conocido reúne 19, y la más joven tiene al menos 20 años.'
  }
});

// Fontes: Bacalhôa, Moscatel de Setúbal Superior 10 anos (https://media.bacalhoa.pt/1/documentos/1304/moscatel-de-setubal-sup-10-y-2010enpdf.pdf); Universidade de Lisboa, estudo sobre as condições de envelhecimento do Moscatel de Setúbal (https://repositorio.ulisboa.pt/entities/publication/1f44521f-c6c8-4c7f-b835-19c03b6ce20a).
dadosAcrescentar('enciclopedia', {
  id: 'cave_estufa',
  nivelMinimo: 5,
  titulo: { pt: 'A «estufa» dos Moscatéis', en: 'The Moscatel "greenhouse"', es: 'La «estufa» de los Moscateles' },
  texto: {
    pt: 'Alguns produtores guardam o Moscatel em armazéns a que chamam «estufas», onde a temperatura varia muito ao longo do ano. Um estudo concluiu que essas variações fazem o vinho envelhecer mais depressa.',
    en: 'Some producers keep the Moscatel in warehouses they call "greenhouses", where the temperature varies a lot through the year. A study concluded that these variations make the wine age faster.',
    es: 'Algunos productores guardan el Moscatel en almacenes a los que llaman «estufas», donde la temperatura varía mucho a lo largo del año. Un estudio concluyó que esas variaciones hacen que el vino envejezca más deprisa.'
  }
});

// Nível 6.
// Fontes: José Maria da Fonseca, Moscatel de Setúbal 10 anos (https://jmf.pt/pdf/pt/ABD_10P.pdf); Cavelusa, Moscatel Bacalhôa Superior 10 anos e Alambre 40 anos (https://www.cavelusa.pt/en/product-category/fortified/moscatel/page/3/).
dadosAcrescentar('enciclopedia', {
  id: 'colecao_cores_do_tempo',
  nivelMinimo: 6,
  titulo: { pt: 'As cores do tempo', en: 'The colours of time', es: 'Los colores del tiempo' },
  texto: {
    pt: 'Com os anos, o Moscatel muda de cor: um de 10 anos é dourado carregado ou cor de topázio, e um de 40 anos já é âmbar, com laivos avermelhados.',
    en: 'With the years, Moscatel changes colour: a 10-year-old is deep gold or topaz, and a 40-year-old is already amber, with reddish tinges.',
    es: 'Con los años, el Moscatel cambia de color: uno de 10 años es dorado intenso o color topacio, y uno de 40 años ya es ámbar, con matices rojizos.'
  }
});

// Fontes: Agroportal, leilão de Moscatel de Setúbal (https://bo.agroportal.pt/?p=1125811); José Maria da Fonseca, Moscatel 10 anos (https://jmf.pt/pdf/pt/ABD_10P.pdf).
dadosAcrescentar('enciclopedia', {
  id: 'colecao_colheitas_antigas',
  nivelMinimo: 6,
  titulo: { pt: 'A coleção de colheitas', en: 'The collection of vintages', es: 'La colección de cosechas' },
  texto: {
    pt: 'Uma casa de Azeitão guarda uma coleção de colheitas antigas de Moscatel de Setúbal, que envelhecem numa adega chamada «dos Teares Velhos».',
    en: 'A house in Azeitão keeps a collection of old Moscatel de Setúbal vintages, which age in a cellar called "dos Teares Velhos".',
    es: 'Una casa de Azeitão guarda una colección de cosechas antiguas de Moscatel de Setúbal, que envejecen en una bodega llamada «dos Teares Velhos».'
  }
});

// Fontes: Agroportal (o mesmo endereço); Garrafeira Nacional, 1900 Moscatel de Setúbal José Maria da Fonseca (https://www.garrafeiranacional.com/en/1900-moscatel-de-setubal-jose-maria-da-fonseca.html).
dadosAcrescentar('enciclopedia', {
  id: 'colecao_cem_anos',
  nivelMinimo: 6,
  titulo: { pt: 'Garrafas com mais de cem anos', en: 'Bottles over a hundred years old', es: 'Botellas de más de cien años' },
  texto: {
    pt: 'Há Moscatéis de Setúbal de colheitas muito antigas, como as de 1911 e de 1924. Uma casa de Azeitão foi lançando estas edições especiais: a de 1911 em 2014 e a de 1924 em 2024.',
    en: 'There are Moscatel de Setúbal wines from very old vintages, such as 1911 and 1924. A house in Azeitão has been releasing these special editions: 1911 in 2014 and 1924 in 2024.',
    es: 'Hay Moscateles de Setúbal de cosechas muy antiguas, como las de 1911 y 1924. Una casa de Azeitão fue lanzando estas ediciones especiales: la de 1911 en 2014 y la de 1924 en 2024.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'azeite_do_olival_ao_lagar',
  imagem: 'assets/ecras/azeite_do_olival_ao_lagar.jpg',
  nivelMinimo: 8,
  titulo: { pt: 'Do olival ao lagar', en: 'From the grove to the mill', es: 'Del olivar a la almazara' },
  texto: {
    pt: 'A oliveira chegou à Península Ibérica com os fenícios e os gregos, e os romanos deram força ao azeite. No lagar, mós de pedra, a galga, esmagavam a azeitona. A pasta ia para as seiras e era prensada com varas; depois juntava-se água quente, prensava-se outra vez e deixava-se o azeite separar-se da água. Muitos lagares eram de família ou da aldeia, e o dono da azeitona pagava com parte do azeite: a maquia. Clima: uma onda de calor pode estragar a floração, a gordura do fruto ou a maturação, conforme a altura em que chega.',
    en: 'The olive tree reached the Iberian Peninsula with the Phoenicians and the Greeks, and the Romans gave olive oil a strong boost. In the mill, stone wheels, the galga, crushed the olives. The paste went into seiras and was pressed with a lever press; then hot water was added, it was pressed again, and the oil was left to separate from the water. Many mills belonged to a family or a village, and the owner of the olives paid with part of the oil: the maquia. Climate: a heat wave can harm flowering, the fat in the fruit or ripening, depending on when it arrives.',
    es: 'El olivo llegó a la Península Ibérica con los fenicios y los griegos, y los romanos dieron un gran impulso al aceite. En la almazara, ruedas de piedra, la galga, machacaban la aceituna. La pasta se ponía en seiras y se prensaba con varas; luego se añadía agua caliente, se prensaba otra vez y se dejaba que el aceite se separara del agua. Muchas almazaras eran de una familia o de una aldea, y el dueño de la aceituna pagaba con parte del aceite: la maquia. Clima: una ola de calor puede dañar la floración, la grasa del fruto o la maduración, según el momento en que llegue.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'tirada_da_cortica',
  imagem: 'assets/ecras/tirada_da_cortica.jpg',
  nivelMinimo: 10,
  titulo: { pt: 'A tirada da cortiça', en: 'Stripping the cork', es: 'El descorche' },
  texto: {
    pt: 'De nove em nove anos, entre o fim de maio e agosto, os tiradores sobem ao sobreiro com o machado e tiram a cortiça, sem cortar a árvore. O machado só pode ir até ao ponto em que não fere o entrecasco; por baixo, a casca volta a crescer. O primeiro descortiçamento, chama-se desbóia. Depois a cortiça repousa nos estaleiros pelo menos seis meses. Clima: em anos de seca o anel de crescimento da cortiça fica mais fino, e em alguns anos a tirada só pode começar em junho, em vez de meados de maio.',
    en: 'Every nine years, between the end of May and August, the cork strippers climb the cork oak with an axe and take the bark without cutting down the tree. The axe may only go as deep as the point where it does not hurt the inner bark, so the cork can grow back. The first stripping, is called the desbóia. Then the cork rests in yards for at least six months. Climate: in drought years the growth ring of the cork is thinner, and in some years stripping can start only in June instead of mid-May.',
    es: 'Cada nueve años, entre finales de mayo y agosto, los sacadores de corcho suben al alcornoque con el hacha y le quitan la corteza sin talar el árbol. El hacha solo puede llegar hasta donde no daña la capa interna, y así el corcho vuelve a crecer. El primer descorche, se llama desbóia. Después el corcho reposa en patios al menos seis meses. Clima: en años de sequía el anillo de crecimiento del corcho es más fino, y en algunos años el descorche solo puede empezar en junio y no a mediados de mayo.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'salina_marnoto',
  imagem: 'assets/ecras/salina_marnoto.jpg',
  nivelMinimo: 7,
  titulo: { pt: 'O marnoto e a salina', en: 'The marnoto and the salina', es: 'El marnoto y la salina' },
  texto: {
    pt: 'Numa salina, a água do mar corre por tanques rasos até ao cristalizador. O sol e o vento evaporam a água e o sal fica. Quem manda em tudo é o marnoto: regula a água, vigia a salinidade e escolhe o momento da colheita. À superfície aparece por vezes a flor de sal, uma película fina de cristais que se apanha e que é muito mais valorizada (e cara) do que o sal comum. Clima: o sal depende do sol e do vento; um projeto da Universidade do Algarve, em Castro Marim, mostrou que as salinas tradicionais também podem ajudar a combater as alterações climáticas.',
    en: 'In a salina, sea water flows through shallow ponds to the crystallizer. The sun and the wind evaporate the water and the salt is left behind. The marnoto runs it all: he controls the water, watches the salinity and picks the moment to harvest. Sometimes the flor de sal appears on the surface, a thin film of crystals that is skimmed off and is much more valued (and more expensive) than ordinary salt. Climate: salt depends on sun and wind; a University of the Algarve project in Castro Marim showed that traditional salinas can also help fight climate change.',
    es: 'En una salina, el agua del mar corre por estanques poco profundos hasta el cristalizador. El sol y el viento evaporan el agua y queda la sal. Quien lo gobierna todo es el marnoto: regula el agua, vigila la salinidad y elige el momento de la cosecha. En la superficie aparece a veces la flor de sal, una fina película de cristales que se recoge y que está mucho más valorada (y es más cara) que la sal común. Clima: la sal depende del sol y del viento; un proyecto de la Universidad del Algarve, en Castro Marim, mostró que las salinas tradicionales también pueden ayudar a combatir el cambio climático.'
  }
});

// Pacote «Cultura do Mel (Arrábida)»: leva a imagem mel_arrabida.jpg (feita, ver dados/pacotes/cultura_mel.json).
dadosAcrescentar('enciclopedia', {
  id: 'mel_arrabida',
  imagem: 'assets/ecras/mel_arrabida.jpg',
  nivelMinimo: 7,
  titulo: { pt: 'O mel da Arrábida', en: 'Arrábida honey', es: 'La miel de la Arrábida' },
  texto: {
    pt: 'Na serra da Arrábida há colmeias, até nos jardins do Convento da Arrábida. O apicultor cuida delas e as abelhas fazem mel com o néctar de flores como o alecrim e o rosmaninho. Mas, quando a primavera é seca, as flores secam cedo, há menos néctar e há menos mel. Em 2023, as estimativas apontavam para quebras de mais de 60% na produção de mel em Portugal.',
    en: 'In the Arrábida mountains there are beehives, even in the gardens of the Arrábida Convent. The beekeeper looks after them and the bees make honey from the nectar of flowers such as rosemary and rosmaninho (French lavender). But when spring is dry, the flowers wither early, there is less nectar and there is less honey. In 2023, estimates pointed to drops of more than 60% in honey production in Portugal.',
    es: 'En la sierra de la Arrábida hay colmenas, incluso en los jardines del Convento de la Arrábida. El apicultor las cuida y las abejas hacen miel con el néctar de flores como el romero y el rosmaninho (cantueso). Pero, cuando la primavera es seca, las flores se secan pronto, hay menos néctar y hay menos miel. En 2023, las estimaciones apuntaban a caídas de más de un 60 % en la producción de miel en Portugal.'
  }
});

// Pacote «Pesca do choco e golfinhos»: sem imagem por agora (a imagem prevista, para sado_golfinhos, está «por_criar» em dados/pacotes/cultura_choco.json).
dadosAcrescentar('enciclopedia', {
  id: 'pesca_choco_sado',
  nivelMinimo: 9,
  titulo: { pt: 'O choco do Sado', en: 'The Sado cuttlefish', es: 'El choco del Sado' },
  texto: {
    pt: 'No estuário do Sado apanha-se choco com covos, que são armadilhas, e com redes. O choco também é uma das comidas preferidas dos golfinhos-roazes que vivem no estuário. Em 2023 nasceram seis crias, o maior número desde que esta comunidade começou a ser acompanhada, há cerca de 40 anos. Cientistas estudam como a água do estuário mudou nas últimas décadas, por causa do clima e de outros fatores.',
    en: 'In the Sado estuary, cuttlefish are caught with covos, which are traps, and with nets. Cuttlefish are also one of the favorite foods of the bottlenose dolphins that live in the estuary. In 2023, six calves were born, the highest number since this community began to be monitored about 40 years ago. Scientists are studying how the water of the estuary has changed over recent decades, because of climate and other factors.',
    es: 'En el estuario del Sado se pesca choco con covos, que son trampas, y con redes. El choco también es una de las comidas preferidas de los delfines mulares que viven en el estuario. En 2023 nacieron seis crías, el mayor número desde que se empezó a seguir a esta comunidad, hace unos 40 años. Los científicos estudian cómo ha cambiado el agua del estuario en las últimas décadas, por el clima y por otros factores.'
  }
});

// Pacote «Cultura do Arroz»: arroz_agua leva uma imagem que já existia (yoshi_nos_arrozais, com linha no CREDITOS.md); arroz_aves fica sem imagem (a imagem está «por_criar» em dados/pacotes/cultura_arroz.json).
dadosAcrescentar('enciclopedia', {
  id: 'arroz_agua',
  imagem: 'assets/ecras/yoshi_nos_arrozais.jpg',
  nivelMinimo: 9,
  titulo: { pt: 'Sem água não há arroz', en: 'No water, no rice', es: 'Sin agua no hay arroz' },
  texto: {
    pt: 'O arroz precisa de muita água. No Vale do Sado, os campos são regados a partir de albufeiras. Em 2022, a seca fez os produtores estimar que cerca de 2500 hectares não se poderiam cultivar. Hoje há formas de poupar: a sementeira enterrada gasta cerca de 20% menos água de rega.',
    en: 'Rice needs a lot of water. In the Sado Valley, the fields are irrigated from reservoirs. In 2022, the drought led producers to estimate that about 2,500 hectares could not be cultivated. Today there are ways to save water: buried seeding uses about 20% less irrigation water.',
    es: 'El arroz necesita mucha agua. En el Valle del Sado, los campos se riegan a partir de embalses. En 2022, la sequía hizo que los productores estimaran que unas 2500 hectáreas no se podrían cultivar. Hoy hay formas de ahorrar: la siembra enterrada gasta cerca de un 20 % menos de agua de riego.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'arroz_aves',
  imagem: 'assets/ecras/aves_arrozais_sado.jpg',
  nivelMinimo: 9,
  titulo: { pt: 'As aves dos arrozais', en: 'The birds of the rice paddies', es: 'Las aves de los arrozales' },
  texto: {
    pt: 'Um arrozal é uma zona húmida feita pelo homem. Muitas aves aquáticas usam os arrozais como casa, porque as zonas húmidas naturais têm diminuído. Perto de Possanco, no estuário do Sado, veem-se no inverno bandos de centenas de aves, como íbis-pretas e colhereiros.',
    en: 'A rice paddy is a wetland made by people. Many waterbirds use rice paddies as a home, because natural wetlands have been shrinking. Near Possanco, in the Sado estuary, flocks of hundreds of birds can be seen in winter, such as glossy ibises and spoonbills.',
    es: 'Un arrozal es una zona húmeda creada por el ser humano. Muchas aves acuáticas usan los arrozales como casa, porque las zonas húmedas naturales han disminuido. Cerca de Possanco, en el estuario del Sado, se ven en invierno bandadas de cientos de aves, como moritos y espátulas.'
  }
});

// Pacote «Cultura do Queijo de Azeitão»: azeitao_coalho leva uma imagem que já existia (estrada_amelia, com linha no CREDITOS.md). Não mexe em azeitao_queijo (nível 14).
dadosAcrescentar('enciclopedia', {
  id: 'azeitao_coalho',
  imagem: 'assets/ecras/estrada_amelia.jpg',
  nivelMinimo: 7,
  titulo: { pt: 'Como se faz o queijo de Azeitão', en: 'How Azeitão cheese is made', es: 'Cómo se hace el queso de Azeitão' },
  texto: {
    pt: 'O queijo de Azeitão coalha com a flor de cardo, que nasce sozinha no monte. O leite é filtrado, juntam-se o cardo e o sal, e a massa é espremida para tirar o soro. Depois descansa cerca de 20 dias numa casa fresca. O cardo que coalha o queijo da Serra da Estrela vem do sul do país, onde cientistas dizem que a seca e o calor excessivo estão a aumentar.',
    en: 'Azeitão cheese is curdled with cardoon flower, which grows wild in the countryside. The milk is filtered, the cardoon and salt are added, and the curd is pressed to remove the whey. Then it rests for about 20 days in a cool room. The cardoon that curdles Serra da Estrela cheese comes from the south of the country, where scientists say that drought and excessive heat are increasing.',
    es: 'El queso de Azeitão cuaja con la flor de cardo, que nace sola en el monte. La leche se filtra, se añaden el cardo y la sal, y la masa se prensa para sacar el suero. Después reposa unos 20 días en un lugar fresco. El cardo que cuaja el queso de la Serra da Estrela viene del sur del país, donde los científicos dicen que la sequía y el calor excesivo están aumentando.'
  }
});

// Pacote «Cultura das Pinhas e do Pinhão»: pinha_tres_anos leva uma imagem que já existia (estrada_sr_albano, com linha no CREDITOS.md). Não mexe na Estrada (sr_albano).
dadosAcrescentar('enciclopedia', {
  id: 'pinha_tres_anos',
  imagem: 'assets/ecras/estrada_sr_albano.jpg',
  nivelMinimo: 8,
  titulo: { pt: 'A pinha que demora três anos', en: 'The cone that takes three years', es: 'La piña que tarda tres años' },
  texto: {
    pt: 'A pinha do pinheiro-manso demora cerca de três anos a ficar pronta e apanha-se no inverno, entre dezembro e março. Durante esse tempo pode ser atacada por pragas, como o sugador das pinhas, um inseto que surgiu em Portugal em 2010. Na campanha de 2022/23, as pinhas foram poucas, depois de vários anos quentes e secos.',
    en: 'The stone pine cone takes about three years to be ready and is harvested in winter, between December and March. During that time it can be attacked by pests, such as the western conifer seed bug, an insect that appeared in Portugal in 2010. In the 2022/23 season, there were few cones, after several hot and dry years.',
    es: 'La piña del pino piñonero tarda unos tres años en estar lista y se recoge en invierno, entre diciembre y marzo. Durante ese tiempo puede ser atacada por plagas, como la chinche de las piñas, un insecto que apareció en Portugal en 2010. En la campaña de 2022/23 hubo pocas piñas, tras varios años cálidos y secos.'
  }
});

// Pacote «Castanhas»: souto leva a imagem souto_castanheiros.jpg (feita, ver dados/pacotes/castanhas.json).
dadosAcrescentar('enciclopedia', {
  id: 'souto',
  imagem: 'assets/ecras/souto_castanheiros.jpg',
  nivelMinimo: 8,
  titulo: { pt: 'O souto', en: 'The souto', es: 'El souto' },
  texto: {
    pt: 'Souto é um pomar de castanheiros, alguns com mais de cem anos. O castanheiro floresce em junho e julho; no outono, os ouriços (as cápsulas espinhosas onde crescem as castanhas) abrem-se e caem. A apanha vai de outubro a novembro, mesmo a tempo do São Martinho. Antes de a batata chegar, a castanha era a base da alimentação de muita gente, sobretudo no Norte. Hoje há quatro castanhas com Denominação de Origem Protegida: Terra Fria e Padrela, em Trás-os-Montes; Soutos da Lapa, entre Viseu e a Guarda; e Marvão-Portalegre, no Alto Alentejo. As variedades têm nomes bonitos: Longal, Martaínha, Judia, Colarinha. O YoshiCat jura que o Fygmo II não distingue uma Longal de uma Martaínha. Para ele, todas têm o mesmo destino: o assador.',
    en: "A souto is a chestnut orchard, with some trees more than a hundred years old. The chestnut tree flowers in June and July; in autumn, the burrs (the spiny husks where chestnuts grow) open and fall. The harvest runs from October to November, just in time for St. Martin's Day. Before the potato arrived, the chestnut was the staple food of many people, especially in the north. Today there are four chestnuts with Protected Designation of Origin: Terra Fria and Padrela, in Trás-os-Montes; Soutos da Lapa, between Viseu and Guarda; and Marvão-Portalegre, in the Alto Alentejo. The varieties have beautiful names: Longal, Martaínha, Judia, Colarinha. YoshiCat swears that Fygmo II cannot tell a Longal from a Martaínha. To him, they all have the same destiny: the roaster.",
    es: 'El souto es un castañar, un huerto de castaños, algunos con más de cien años. El castaño florece en junio y julio; en otoño, los erizos (las cápsulas espinosas donde crecen las castañas) se abren y caen. La recogida va de octubre a noviembre, justo a tiempo para San Martín. Antes de que llegara la patata, la castaña era la base de la alimentación de mucha gente, sobre todo en el norte. Hoy hay cuatro castañas con Denominación de Origen Protegida: Terra Fria y Padrela, en Trás-os-Montes; Soutos da Lapa, entre Viseu y Guarda; y Marvão-Portalegre, en el Alto Alentejo. Las variedades tienen nombres bonitos: Longal, Martaínha, Judia, Colarinha. El YoshiCat jura que el Fygmo II no distingue una Longal de una Martaínha. Para él, todas tienen el mismo destino: el asador.'
  }
});

// Pacote «feira_santiago» (parte 2 de 2: a festa «santiago», em js/festas.js, abre esta entrada ao entrar); a imagem é a santiago_festa.jpg, a mesma do menu da festa.
dadosAcrescentar('enciclopedia', {
  id: 'feira_santiago',
  imagem: 'assets/ecras/santiago_festa.jpg',
  nivelMinimo: 7,
  titulo: { pt: "A Feira de Sant'Iago", en: "The Sant'Iago Fair", es: "La Feria de Sant'Iago" },
  texto: {
    pt: "A Feira de Sant'Iago nasceu por alvará régio de 9 de julho de 1582, depois de os procuradores de Setúbal a pedirem às Cortes, reunidas em Tomar. Repete-se de verão em verão e hoje faz-se no Parque Sant'Iago, nas Manteigadas, com feirantes, artesanato, produtores da região, diversões e concertos. Em 2026 durou 11 dias, de 23 de julho a 2 de agosto, e as datas mudam de ano para ano. Tem mais de 400 anos e é uma das maiores feiras do Sul do país. O YoshiCat diz que o Fygmo II já a conhece de cor: sabe onde ficam todas as bancas de comida.",
    en: "The Sant'Iago Fair was created by a royal alvará of 9 July 1582, after the representatives of Setúbal asked the Cortes, meeting in Tomar, for it. It comes back every summer and today it is held in Parque Sant'Iago, in Manteigadas, with stallholders, crafts, local producers, rides and concerts. In 2026 it lasted 11 days, from 23 July to 2 August, and the dates change from year to year. It is more than 400 years old and is one of the biggest fairs in the south of the country. YoshiCat says that Fygmo II already knows it by heart: he knows where all the food stalls are.",
    es: "La Feria de Sant'Iago nació por un alvará real de 9 de julio de 1582, después de que los procuradores de Setúbal la pidieran a las Cortes, reunidas en Tomar. Se repite de verano en verano y hoy se celebra en el Parque Sant'Iago, en Manteigadas, con feriantes, artesanía, productores de la región, atracciones y conciertos. En 2026 duró 11 días, del 23 de julio al 2 de agosto, y las fechas cambian de un año a otro. Tiene más de 400 años y es una de las mayores ferias del sur del país. El YoshiCat dice que el Fygmo II ya la conoce de memoria: sabe dónde están todos los puestos de comida."
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'moinho_mare_mourisca',
  imagem: 'assets/ecras/moinho_mare_a.jpg',
  nivelMinimo: 10,
  titulo: { pt: 'O Moinho de Maré da Mourisca', en: 'The Mourisca Tide Mill', es: 'El Molino de Mareas de la Mourisca' },
  texto: {
    pt: 'O Moinho de Maré da Mourisca é um dos quatro moinhos de maré conhecidos no estuário do Sado, na Herdade da Mourisca, no concelho de Setúbal. Possivelmente data do século XVII e tem cerca de 280 m²: ali funcionavam ao mesmo tempo 8 mós, que moíam cereal para fazer farinha. Está ao lado de um grande tanque que enche com a maré. Com a maré cheia, fecha-se a comporta e, depois, solta-se a água represada, que move as mós. Trabalhou até aos anos 60, foi recuperado pelo ICNF em 1995 e hoje é gerido pela Câmara Municipal de Setúbal.',
    en: 'The Mourisca Tide Mill is one of the four tide mills known on the Sado estuary, at the Herdade da Mourisca, in the municipality of Setúbal. It possibly dates from the 17th century and has an area of about 280 m²: 8 millstones worked there at the same time, grinding grain to make flour. It stands beside a large tank that fills with the tide. At high tide the sluice gate is closed and, later, the water that was held back is released, and it turns the millstones. It worked until the 1960s, was restored by the ICNF in 1995 and is now run by the Setúbal Municipal Council.',
    es: 'El Molino de Mareas de la Mourisca es uno de los cuatro molinos de mareas conocidos en el estuario del Sado, en la Herdade da Mourisca, en el municipio de Setúbal. Posiblemente data del siglo XVII y tiene unos 280 m²: allí funcionaban a la vez 8 piedras de molino, que molían cereal para hacer harina. Está junto a un gran tanque que se llena con la marea. Con la marea alta se cierra la compuerta y, después, se suelta el agua represada, que mueve las piedras de molino. Trabajó hasta los años 60, fue recuperado por el ICNF en 1995 y hoy lo gestiona el Ayuntamiento de Setúbal.'
  }
});

// Nível 11, "Moscatel da Arrábida": as 3 histórias que o capítulo 11 (dados/capitulos.js) pede. Só a arrabida_biosfera leva imagem (arrabida_colina.jpg, que já existia como foto da história do nível 11); as outras duas, sem imagem.
dadosAcrescentar('enciclopedia', {
  id: 'arrabida_biosfera',
  imagem: 'assets/ecras/arrabida_colina.jpg',
  nivelMinimo: 11,
  titulo: { pt: 'A Arrábida, Reserva da Biosfera', en: 'The Arrábida, a Biosphere Reserve', es: 'La Arrábida, Reserva de la Biosfera' },
  texto: {
    pt: 'A 27 de setembro de 2025, a UNESCO reconheceu a Arrábida como Reserva da Biosfera, a 13.ª de Portugal. O pedido foi feito pelos municípios de Setúbal, Palmela e Sesimbra, com o ICNF.',
    en: "On 27 September 2025, UNESCO recognised the Arrábida as a Biosphere Reserve, the 13th in Portugal. The application was made by the municipalities of Setúbal, Palmela and Sesimbra, together with the ICNF (Portugal's nature conservation institute).",
    es: 'El 27 de septiembre de 2025, la UNESCO reconoció la Arrábida como Reserva de la Biosfera, la 13.ª de Portugal. La candidatura la presentaron los municipios de Setúbal, Palmela y Sesimbra, junto con el ICNF (el instituto de conservación de la naturaleza de Portugal).'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'arrabida_plantas',
  nivelMinimo: 11,
  titulo: { pt: 'Um Jardim de 1400 Plantas', en: 'A Garden of 1,400 Plants', es: 'Un Jardín de 1400 Plantas' },
  texto: {
    pt: 'Na Arrábida vivem mais de 1400 espécies de plantas, cerca de 40% da flora de Portugal. Setenta delas são raras ou endémicas.',
    en: "Over 1,400 plant species live in the Arrábida, about 40% of Portugal's flora. Seventy of them are rare or endemic.",
    es: 'En la Arrábida viven más de 1400 especies de plantas, cerca del 40% de la flora de Portugal. Setenta de ellas son raras o endémicas.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'arrabida_mar',
  nivelMinimo: 11,
  titulo: { pt: 'Da Serra ao Mar', en: 'From Sierra to Sea', es: 'De la Sierra al Mar' },
  texto: {
    pt: 'A reserva junta a serra e o mar: cerca de 200 espécies de vertebrados e mais de 2000 espécies marinhas. A pesca artesanal, a oliveira e o Moscatel de Setúbal fazem parte desta paisagem.',
    en: 'The reserve joins sierra and sea: about 200 vertebrate species and over 2,000 marine species. Artisanal fishing, the olive tree and Moscatel de Setúbal are part of this landscape.',
    es: 'La reserva une sierra y mar: unas 200 especies de vertebrados y más de 2000 especies marinas. La pesca artesanal, el olivo y el Moscatel de Setúbal forman parte de este paisaje.'
  }
});

// Nível 12, «Moscatel do Sado»: as 3 histórias que o capítulo 12 (dados/capitulos.js) pede. Sem imagem.
dadosAcrescentar('enciclopedia', {
  id: 'sado_reserva',
  imagem: 'assets/ecras/sado_estuario.jpg',
  nivelMinimo: 12,
  titulo: { pt: 'Uma Reserva Entre o Rio e o Mar', en: 'A Reserve Between River and Sea', es: 'Una Reserva Entre el Río y el Mar' },
  texto: {
    pt: 'A Reserva Natural do Estuário do Sado foi criada em 1980. A 8 de maio de 1996, foi reconhecida como zona húmida de importância internacional (Ramsar).',
    en: 'The Sado Estuary Nature Reserve was created in 1980. On 8 May 1996, it was recognised as a wetland of international importance (Ramsar).',
    es: 'La Reserva Natural del Estuario del Sado se creó en 1980. El 8 de mayo de 1996 fue reconocida como humedal de importancia internacional (Ramsar).'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'sado_golfinhos',
  imagem: 'assets/ecras/golfinhos_sado.jpg',
  nivelMinimo: 12,
  titulo: { pt: 'Os Golfinhos do Sado', en: 'The Dolphins of the Sado', es: 'Los Delfines del Sado' },
  texto: {
    pt: 'No estuário vive uma comunidade residente de golfinhos-roazes, que ali fica todo o ano. É acompanhada por cientistas desde pelo menos 1981.',
    en: 'A resident community of bottlenose dolphins lives in the estuary all year round. Scientists have followed it since at least 1981.',
    es: 'En el estuario vive una comunidad residente de delfines mulares, que permanece allí todo el año. Los científicos la siguen desde al menos 1981.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'sado_troia',
  nivelMinimo: 12,
  titulo: { pt: 'O Peixe Salgado de Tróia', en: 'The Salted Fish of Tróia', es: 'El Pescado Salado de Tróia' },
  texto: {
    pt: 'Em Tróia, mesmo em frente a Setúbal, os romanos preparavam peixe salgado e garum, um molho de peixe. O local foi ocupado até ao século VI.',
    en: 'At Tróia, right across from Setúbal, the Romans prepared salted fish and garum, a fish sauce. The site was occupied until the 6th century.',
    es: 'En Tróia, justo frente a Setúbal, los romanos preparaban pescado salado y garum, una salsa de pescado. El lugar estuvo ocupado hasta el siglo VI.'
  }
});

// Nível 13, «Moscatel de Palmela»: as 3 histórias que o capítulo 13 (dados/capitulos.js) pede. Sem imagem.
dadosAcrescentar('enciclopedia', {
  id: 'palmela_castelo',
  imagem: 'assets/ecras/palmela_castelo.jpg',
  nivelMinimo: 13,
  titulo: { pt: 'O Castelo de Palmela', en: 'Palmela Castle', es: 'El Castillo de Palmela' },
  texto: {
    pt: 'O castelo de Palmela foi tomado aos mouros no século XII e entregue depois à Ordem de Santiago. O antigo convento é hoje uma pousada.',
    en: 'Palmela castle was taken from the Moors in the 12th century and later given to the Order of Santiago. The old convent is now an inn.',
    es: 'El castillo de Palmela fue tomado a los moros en el siglo XII y entregado después a la Orden de Santiago. El antiguo convento es hoy una posada.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'palmela_capelo',
  nivelMinimo: 13,
  titulo: { pt: 'Hermenegildo Capelo', en: 'Hermenegildo Capelo', es: 'Hermenegildo Capelo' },
  texto: {
    pt: 'Hermenegildo Capelo nasceu em Palmela, em 1841. Foi explorador e, com Roberto Ivens, atravessou África de Angola a Moçambique.',
    en: 'Hermenegildo Capelo was born in Palmela in 1841. He was an explorer and, with Roberto Ivens, crossed Africa from Angola to Mozambique.',
    es: 'Hermenegildo Capelo nació en Palmela en 1841. Fue explorador y, con Roberto Ivens, atravesó África de Angola a Mozambique.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'palmela_castelao',
  nivelMinimo: 13,
  titulo: { pt: 'O Castelão de Palmela', en: 'The Castelão of Palmela', es: 'El Castelão de Palmela' },
  texto: {
    pt: 'Os vinhos tintos da DOC Palmela, reconhecida em 2009, levam pelo menos 67% de uva Castelão.',
    en: 'Red wines of the Palmela DOC, recognised in 2009, contain at least 67% Castelão grapes.',
    es: 'Los vinos tintos de la DOC Palmela, reconocida en 2009, llevan al menos un 67% de uva Castelão.'
  }
});

// Nível 13, 4.ª entrada: Festa das Vindimas de Palmela (fora do capítulo 13, que continua a pedir só as 3 de Palmela): abre ao entrar na festa «vindimas» (js/festas.js); a imagem é a vindimas_palmela_festa.jpg, a mesma do menu da festa.
dadosAcrescentar('enciclopedia', {
  id: 'festa_vindimas_palmela',
  imagem: 'assets/ecras/vindimas_palmela_festa.jpg',
  nivelMinimo: 13,
  titulo: { pt: 'A Festa das Vindimas de Palmela', en: 'The Palmela Harvest Festival', es: 'La Fiesta de las Vendimias de Palmela' },
  texto: {
    pt: 'A Festa das Vindimas de Palmela realiza-se no início de setembro e inclui cortejos, espetáculos e arraial. Fazem parte da tradição a bênção do primeiro mosto e a eleição da Rainha das Vindimas. A Dona Lurdes, vindimadora de Palmela, diz que o primeiro copo de mosto novo sabe sempre melhor.',
    en: 'The Palmela Harvest Festival takes place in early September and includes parades, shows and a street party. The blessing of the first must and the election of the Harvest Queen are part of the tradition. Dona Lurdes, a grape picker from Palmela, says the first glass of new must always tastes the best.',
    es: 'La Fiesta de las Vendimias de Palmela se celebra a principios de septiembre e incluye desfiles, espectáculos y arraial. Forman parte de la tradición la bendición del primer mosto y la elección de la Reina de las Vendimias. Dona Lurdes, vendimiadora de Palmela, dice que el primer vaso de mosto nuevo siempre sabe mejor.'
  }
});

// Nível 14, «Moscatel de Azeitão»: as 3 histórias que o capítulo 14 (dados/capitulos.js) pede. Sem imagem.
dadosAcrescentar('enciclopedia', {
  id: 'azeitao_queijo',
  imagem: 'assets/ecras/azeitao_vila.jpg',
  nivelMinimo: 14,
  titulo: { pt: 'O Queijo de Azeitão', en: 'Azeitão Cheese', es: 'El Queso de Azeitão' },
  texto: {
    pt: 'O Queijo de Azeitão é feito com leite de ovelha em Palmela, Sesimbra e Setúbal. Tem pasta mole e amanteigada e é DOP, ou seja, tem nome protegido.',
    en: "Azeitão Cheese is made with sheep's milk in Palmela, Sesimbra and Setúbal. It has a soft, buttery paste and is a PDO, which means its name is protected.",
    es: 'El Queso de Azeitão se hace con leche de oveja en Palmela, Sesimbra y Setúbal. Tiene pasta blanda y mantecosa y es DOP, es decir, su nombre está protegido.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'azeitao_adega',
  nivelMinimo: 14,
  titulo: { pt: 'Uma Adega de 1834', en: 'A Cellar from 1834', es: 'Una Bodega de 1834' },
  texto: {
    pt: 'Em Vila Nogueira de Azeitão, a casa José Maria da Fonseca foi fundada em 1834. Nas suas adegas ainda descansam moscatéis com mais de cem anos.',
    en: 'In Vila Nogueira de Azeitão, the house of José Maria da Fonseca was founded in 1834. In its cellars, Moscatel wines over a hundred years old still rest.',
    es: 'En Vila Nogueira de Azeitão, la casa José Maria da Fonseca se fundó en 1834. En sus bodegas todavía reposan moscateles de más de cien años.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'azeitao_palacio',
  nivelMinimo: 14,
  titulo: { pt: 'O Palácio dos Duques de Aveiro', en: 'The Palace of the Dukes of Aveiro', es: 'El Palacio de los Duques de Aveiro' },
  texto: {
    pt: 'Em Vila Nogueira de Azeitão fica o Palácio dos Duques de Aveiro. É um palácio renascentista, no chamado estilo chão português.',
    en: 'In Vila Nogueira de Azeitão stands the Palace of the Dukes of Aveiro. It is a Renaissance palace, in the so-called "plain Portuguese" style.',
    es: 'En Vila Nogueira de Azeitão se encuentra el Palacio de los Duques de Aveiro. Es un palacio renacentista, en el llamado estilo "chão" portugués.'
  }
});

// Pacote «Torta de Azeitão» (nível 14): a 4.ª entrada do nível 14, com imagem (a mesma da ação «Mesa de Azeitão», na Estrada). Fora do capítulo 14, que continua a pedir as 3 de Azeitão.
dadosAcrescentar('enciclopedia', {
  id: 'torta_azeitao_doce',
  imagem: 'assets/ecras/mesa_azeitao.jpg',
  nivelMinimo: 14,
  titulo: { pt: 'A Torta de Azeitão', en: 'The Azeitão Roll Cake', es: 'La Torta de Azeitão' },
  texto: {
    pt: 'A Torta de Azeitão é um bolo enrolado de massa fina de ovos, recheado com doce de ovos, e sabe a limão e a canela. A sua origem remonta ao fim do século XIX e deve-se a Manuel Rodrigues, o «Cego». A pastelaria O Cego, em Azeitão, vende as tortas originais desde 1901.',
    en: 'The Torta de Azeitão is a rolled cake made of thin egg batter, filled with doce de ovos (a sweet egg filling), and it tastes of lemon and cinnamon. Its origin goes back to the end of the 19th century, at the hands of Manuel Rodrigues, known as "O Cego". The pastry shop O Cego, in Azeitão, has sold the original tortas since 1901.',
    es: 'La Torta de Azeitão es un bizcocho enrollado de masa fina de huevos, relleno de dulce de huevos, y sabe a limón y a canela. Su origen se remonta a finales del siglo XIX y se debe a Manuel Rodrigues, el «Cego». La pastelería O Cego, en Azeitão, vende las tortas originales desde 1901.'
  }
});

// Nível 15, «Moscatel de Sesimbra»: as 3 histórias que o capítulo 15 (dados/capitulos.js) pede. Sem imagem.
dadosAcrescentar('enciclopedia', {
  id: 'sesimbra_castelo',
  nivelMinimo: 15,
  titulo: { pt: 'Castelo de Sesimbra', en: 'Sesimbra Castle', es: 'Castillo de Sesimbra' },
  texto: {
    pt: 'Fortificação de origem islâmica, conquistada em 1165 por D. Afonso Henriques e entregue mais tarde à Ordem de Santiago.',
    en: 'A fortress of Islamic origin, taken in 1165 by Afonso Henriques and later handed over to the Order of Santiago.',
    es: 'Fortaleza de origen islámico, conquistada en 1165 por Afonso Henriques y entregada más tarde a la Orden de Santiago.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'sesimbra_vila',
  imagem: 'assets/ecras/sesimbra_vila.jpg',
  nivelMinimo: 15,
  titulo: { pt: 'A vila desce ao mar', en: 'The town comes down to the sea', es: 'La villa baja al mar' },
  texto: {
    pt: 'A partir do século XV, a pesca e a construção naval levaram os habitantes do castelo para a baía, onde nasceu a vila de hoje.',
    en: "From the 15th century on, fishing and shipbuilding drew the people of the castle down to the bay, where today's town was born.",
    es: 'A partir del siglo XV, la pesca y la construcción naval llevaron a los habitantes del castillo hasta la bahía, donde nació la villa de hoy.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'sesimbra_espichel',
  nivelMinimo: 15,
  titulo: { pt: 'Cabo Espichel', en: 'Cape Espichel', es: 'Cabo Espichel' },
  texto: {
    pt: 'O culto à Senhora do Cabo remonta a 1410. A igreja atual foi construída entre 1701 e 1707.',
    en: 'Worship of Our Lady of the Cape dates back to 1410. The present church was built between 1701 and 1707.',
    es: 'El culto a Nuestra Señora del Cabo se remonta a 1410. La iglesia actual se construyó entre 1701 y 1707.'
  }
});

// Nível 16, «Moscatel de Setúbal»: as 3 histórias que o capítulo 16 (dados/capitulos.js) pede. Sem imagem.
dadosAcrescentar('enciclopedia', {
  id: 'setubal_forte',
  nivelMinimo: 16,
  titulo: { pt: 'Forte de São Filipe', en: 'São Filipe Fort', es: 'Fuerte de São Filipe' },
  texto: {
    pt: 'Fortaleza do século XVI, construída no tempo de Filipe II de Espanha, que também foi rei de Portugal, para defender Setúbal dos piratas. Domina o estuário do Sado.',
    en: 'A 16th-century fortress, built in the time of Philip II of Spain, who was also king of Portugal, to defend Setúbal from pirates. It overlooks the Sado estuary.',
    es: 'Fortaleza del siglo XVI, construida en tiempos de Felipe II de España, que también fue rey de Portugal, para defender Setúbal de los piratas. Domina el estuario del Sado.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'setubal_roxo',
  imagem: 'assets/ecras/moscatel_roxo_com_uvas.jpg',
  nivelMinimo: 16,
  titulo: { pt: 'A uva que quase se perdeu', en: 'The Grape That Was Almost Lost', es: 'La uva que casi se perdió' },
  texto: {
    pt: 'O Moscatel Roxo é uma casta rara, de uvas rosadas, usada há muito nos vinhos de Setúbal. Chegou a estar perto da extinção, mas foi replantada e volta a dar moscatéis premiados.',
    en: "Moscatel Roxo is a rare grape with pink berries, used for a long time in Setúbal's wines. It came close to extinction, but it was replanted and is again making award-winning moscatels.",
    es: 'La Moscatel Roxo es una variedad rara, de uvas rosadas, usada desde hace mucho en los vinos de Setúbal. Estuvo cerca de la extinción, pero se replantó y vuelve a dar moscateles premiados.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'setubal_familias',
  nivelMinimo: 16,
  titulo: { pt: 'Famílias do Moscatel', en: 'Moscatel Families', es: 'Familias del Moscatel' },
  texto: {
    pt: 'Na Península de Setúbal há produtores familiares que fazem moscatéis há mais de cem anos. A Venâncio da Costa Lima, por exemplo, produz-os desde 1914.',
    en: 'On the Setúbal Peninsula there are family producers who have been making moscatel for over a hundred years. Venâncio da Costa Lima, for example, has produced it since 1914.',
    es: 'En la Península de Setúbal hay productores familiares que elaboran moscatel desde hace más de cien años. Venâncio da Costa Lima, por ejemplo, lo produce desde 1914.'
  }
});

// Nível 17, «Moscatel de Alcácer» (o sal do Sado): as 3 histórias que o capítulo 17 (dados/capitulos.js) pede, cada uma com a sua imagem.
dadosAcrescentar('enciclopedia', {
  id: 'sal_alcacer',
  imagem: 'assets/ecras/sal_alcacer.jpg',
  nivelMinimo: 17,
  titulo: { pt: 'Alcácer do Sal', en: 'Alcácer do Sal', es: 'Alcácer do Sal' },
  texto: {
    pt: 'Os romanos chamavam-lhe Salacia. Com os árabes passou a Alcácer e, mais tarde, a Alcácer do Sal, por ter sido um grande centro de produção de sal.',
    en: 'The Romans called it Salacia. Under the Arabs it became Alcácer and, later, Alcácer do Sal, because it was a great salt-producing centre.',
    es: 'Los romanos la llamaban Salacia. Con los árabes pasó a Alcácer y, más tarde, a Alcácer do Sal, por haber sido un gran centro de producción de sal.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'sal_setubal',
  imagem: 'assets/ecras/sal_setubal.jpg',
  nivelMinimo: 17,
  titulo: { pt: 'O sal de Setúbal', en: "Setúbal's Salt", es: 'La sal de Setúbal' },
  texto: {
    pt: 'Nos séculos XVI e XVII, Setúbal foi o principal centro de produção e exportação de sal do país, sobretudo para o Norte da Europa. No fim do século XVII havia navios holandeses a carregar sal no seu porto.',
    en: 'In the 16th and 17th centuries, Setúbal was the country\'s main salt-producing and exporting centre, mainly to Northern Europe. At the end of the 17th century, Dutch ships were loading salt in its port.',
    es: 'En los siglos XVI y XVII, Setúbal fue el principal centro de producción y exportación de sal del país, sobre todo hacia el norte de Europa. A finales del siglo XVII había barcos holandeses cargando sal en su puerto.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'sal_redura',
  imagem: 'assets/ecras/sal_redura.jpg',
  nivelMinimo: 17,
  titulo: { pt: 'A redura', en: 'The Redura', es: 'La redura' },
  texto: {
    pt: 'A colheita do sal chama-se redura. No século XIX, as salinas do Sado foram perdendo para as do Tejo, mas ainda hoje se faz sal tradicional no estuário do Sado.',
    en: 'The salt harvest is called the redura. In the 19th century, the Sado salt pans lost ground to those of the Tagus, but traditional salt is still made in the Sado estuary today.',
    es: 'La cosecha de la sal se llama redura. En el siglo XIX, las salinas del Sado fueron perdiendo frente a las del Tajo, pero todavía hoy se hace sal tradicional en el estuario del Sado.'
  }
});

// Nível 18, «Moscatel da Comporta» (o arroz do Sado): as 3 histórias que o capítulo 18 (dados/capitulos.js) pede. Sem imagem.
dadosAcrescentar('enciclopedia', {
  id: 'arroz_arrozais',
  imagem: 'assets/ecras/arrozal_personagens.jpg',
  nivelMinimo: 18,
  titulo: { pt: 'Os arrozais do Sado', en: "The Sado's Rice Paddies", es: 'Los arrozales del Sado' },
  texto: {
    pt: 'O arroz cultiva-se em campos planos, regados por alagamento. Em Portugal há três grandes zonas: os estuários do Sado, do Tejo e do Mondego.',
    en: 'Rice grows on flat fields, watered by flooding. In Portugal there are three main areas: the Sado, Tagus and Mondego estuaries.',
    es: 'El arroz se cultiva en campos llanos, regados por inundación. En Portugal hay tres grandes zonas: los estuarios del Sado, del Tajo y del Mondego.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'arroz_carolino',
  imagem: 'assets/ecras/arrozal_2.jpg',
  nivelMinimo: 18,
  titulo: { pt: 'O arroz carolino', en: 'Carolino Rice', es: 'El arroz carolino' },
  texto: {
    pt: 'O carolino é um arroz português de grão redondo, muito usado na cozinha tradicional porque absorve bem os sabores. Faz o arroz de marisco, o de tamboril e o malandro.',
    en: 'Carolino is a Portuguese round-grain rice, widely used in traditional cooking because it absorbs flavours well. It makes seafood rice, monkfish rice and arroz malandro.',
    es: 'El carolino es un arroz portugués de grano redondo, muy usado en la cocina tradicional porque absorbe bien los sabores. Con él se hacen el arroz de marisco, el de rape y el malandro.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'arroz_consumo',
  nivelMinimo: 18,
  titulo: { pt: 'Maiores comedores de arroz', en: "Europe's Biggest Rice Eaters", es: 'Los mayores comedores de arroz de Europa' },
  texto: {
    pt: 'Portugal é o país europeu que mais arroz come por pessoa, muito acima de qualquer outro.',
    en: 'Portugal is the European country that eats the most rice per person, far more than any other.',
    es: 'Portugal es el país europeo que más arroz come por persona, muy por encima de cualquier otro.'
  }
});

// Nível 19, «Moscatel do Montado» (o sobreiro e a cortiça): as 3 histórias que o capítulo 19 (dados/capitulos.js) pede. Levam imagem sobreiro_assobiador (sobreiro_assobiador.jpg) e sobreiro_rolha (cortica.jpg); sobreiro_cortica, sem imagem.
dadosAcrescentar('enciclopedia', {
  id: 'sobreiro_cortica',
  nivelMinimo: 19,
  titulo: { pt: 'O sobreiro e a cortiça', en: 'The Cork Oak and Cork', es: 'El alcornoque y el corcho' },
  texto: {
    pt: 'O sobreiro é a Árvore Nacional de Portugal desde 2011 e é protegido por lei. A cortiça só se tira pela primeira vez aos 25 anos e depois de nove em nove anos, sem matar a árvore.',
    en: "The cork oak has been Portugal's National Tree since 2011 and is protected by law. Cork can only be taken for the first time at 25 years old and then every nine years, without killing the tree.",
    es: 'El alcornoque es el Árbol Nacional de Portugal desde 2011 y está protegido por ley. El corcho solo se extrae por primera vez a los 25 años y después cada nueve años, sin matar al árbol.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'sobreiro_assobiador',
  imagem: 'assets/ecras/sobreiro_assobiador.jpg',
  nivelMinimo: 19,
  titulo: { pt: 'O Assobiador', en: 'The Assobiador', es: 'El Assobiador' },
  texto: {
    pt: 'Em Águas de Moura, em Palmela, vive o Assobiador, o sobreiro mais produtivo do mundo. Numa só colheita deu cortiça para 100 mil rolhas.',
    en: "In Águas de Moura, in Palmela, lives the Assobiador, the world's most productive cork oak. In a single harvest it gave enough cork for 100,000 stoppers.",
    es: 'En Águas de Moura, en Palmela, vive el Assobiador, el alcornoque más productivo del mundo. En una sola cosecha dio corcho para 100 000 tapones.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'sobreiro_rolha',
  imagem: 'assets/ecras/cortica.jpg',
  nivelMinimo: 19,
  titulo: { pt: 'A rolha', en: 'The Stopper', es: 'El tapón' },
  texto: {
    pt: 'A cortiça fecha a maioria das garrafas de vinho do mundo, e as rolhas são mais de 70% do que Portugal exporta em cortiça.',
    en: "Cork seals most of the world's wine bottles, and stoppers make up over 70% of what Portugal exports in cork.",
    es: 'El corcho cierra la mayoría de las botellas de vino del mundo, y los tapones son más del 70 % de lo que Portugal exporta en corcho.'
  }
});

// Nível 20, «Moscatel do Poeta» (Bocage): as 3 histórias que o capítulo 20 (dados/capitulos.js) pede. Sem imagem.
dadosAcrescentar('enciclopedia', {
  id: 'bocage_poeta',
  nivelMinimo: 20,
  titulo: { pt: 'Bocage, o poeta de Setúbal', en: 'Bocage, the Poet of Setúbal', es: 'Bocage, el poeta de Setúbal' },
  texto: {
    pt: 'Manuel Maria Barbosa du Bocage nasceu em Setúbal em 1765. Saiu de casa aos 16 anos para estudar em Lisboa e tornou-se um dos grandes sonetistas da língua portuguesa. Morreu em Lisboa em 1805.',
    en: 'Manuel Maria Barbosa du Bocage was born in Setúbal in 1765. He left home at 16 to study in Lisbon and became one of the great sonnet writers of the Portuguese language. He died in Lisbon in 1805.',
    es: 'Manuel Maria Barbosa du Bocage nació en Setúbal en 1765. Salió de casa a los 16 años para estudiar en Lisboa y se convirtió en uno de los grandes sonetistas de la lengua portuguesa. Murió en Lisboa en 1805.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'bocage_casa',
  imagem: 'assets/ecras/casa_bocage.jpg',
  nivelMinimo: 20,
  titulo: { pt: 'A Casa Bocage', en: 'Casa Bocage', es: 'La Casa Bocage' },
  texto: {
    pt: 'Em Setúbal, a Casa Bocage é uma casa-museu com uma biblioteca sobre a vida e a obra do poeta e com o arquivo fotográfico da cidade.',
    en: "In Setúbal, Casa Bocage is a house-museum with a library on the poet's life and work and the city's photographic archive.",
    es: 'En Setúbal, la Casa Bocage es una casa-museo con una biblioteca sobre la vida y la obra del poeta y el archivo fotográfico de la ciudad.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'bocage_dia',
  nivelMinimo: 20,
  titulo: { pt: '15 de setembro', en: '15 September', es: '15 de septiembre' },
  texto: {
    pt: '15 de setembro é o dia do nascimento de Bocage e feriado municipal em Setúbal.',
    en: '15 September is the day Bocage was born and a municipal holiday in Setúbal.',
    es: 'El 15 de septiembre es el día del nacimiento de Bocage y fiesta municipal en Setúbal.'
  }
});
