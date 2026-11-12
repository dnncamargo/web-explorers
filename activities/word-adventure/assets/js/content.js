(function (global) {
  const choice = (prompt, target, options, speech = "") => ({ prompt, target, options, speech });
  const pic = (word, emoji) => ({ word, emoji });
  const shapePic = (word, shape, color) => ({ word, value: word, shape, color });
  const stage = (title, objective, kind, prompt, rounds) => ({ title, objective, kind, prompt, rounds });

  const worlds = [
    {
      id: "sound-island", number: 1, title: "Acampamento Base", subtitle: "Conhecer os comandos e preparar a mochila", theme: "camp", art: "🏕️🌿🧭",
      goal: "Ganhar confiança para usar o ponteiro, clicar, selecionar, conectar pontos e organizar objetos.",
      skills: ["Movimento do ponteiro", "Clique e seleção", "Formas e cores", "Organização de objetos"], bncc: ["Cultura digital", "EF01CO06"],
      stages: [
        stage("O primeiro clique", "Perceber que o clique provoca uma ação na tela", "click-target", "Encontre o objeto pedido e clique nele.", [
          choice("Clique na lanterna para acender a luz.", "Lanterna", [pic("Cantil", "🥤"), pic("Lanterna", "🔦"), pic("Mapa", "🗺️")]),
          choice("Clique na barraca onde vamos dormir durante o acampamento.", "Barraca", [pic("Mochila", "🎒"), pic("Barraca", "⛺"), pic("Fogueira", "🔥")]),
          choice("Clique na pegada para descobrir quem passou por aqui.", "Pegada", [pic("Folha", "🍃"), pic("Pegada", "🐾"), pic("Pedra", "🪨")])
        ]),
        stage("Siga as pegadas", "Movimentar o ponteiro e acompanhar uma sequência de pontos", "connect-dots", "Ligue os pontos na ordem. Você também pode clicar em cada ponto.", [
          { prompt: "Ligue os quatro pontos seguindo os números.", sequence: ["1", "2", "3", "4"] },
          { prompt: "Continue a trilha: encontre os pontos de 4 a 9.", sequence: ["4", "5", "6", "7", "8", "9"] },
          { prompt: "Os números estão embaralhados. Clique seguindo a ordem: 1, 3, 2, 4, 5, 6, 8, 7, 6, 9.", sequence: ["1", "3", "2", "4", "5", "6", "8", "7", "6", "9"], displayOrder: ["6", "2", "9", "1", "7", "3", "8", "5", "4", "6"] }
        ]),
        stage("Formas na mochila", "Reconhecer formas e cores sem depender somente da cor", "find-shape", "Encontre a forma indicada.", [
          choice("Encontre o círculo azul.", "Círculo azul", [shapePic("Círculo azul", "circle", "blue"), shapePic("Quadrado verde", "square", "green"), shapePic("Triângulo amarelo", "triangle", "yellow")]),
          choice("Encontre o quadrado verde.", "Quadrado verde", [shapePic("Círculo vermelho", "circle", "red"), shapePic("Quadrado verde", "square", "green"), shapePic("Triângulo azul", "triangle", "blue")]),
          choice("Encontre o triângulo amarelo.", "Triângulo amarelo", [shapePic("Estrela amarela", "star", "yellow"), shapePic("Triângulo amarelo", "triangle", "yellow"), shapePic("Círculo azul", "circle", "blue")]),
          choice("Agora encontre a estrela laranja.", "Estrela laranja", [shapePic("Estrela laranja", "star", "orange"), shapePic("Círculo laranja", "circle", "orange"), shapePic("Quadrado amarelo", "square", "yellow")])
        ]),
        stage("Arrume a mochila", "Preparar o que vamos usar para explorar a natureza durante o acampamento", "place-item", "Estamos arrumando a mochila para um acampamento. Escolha o objeto pedido e guarde-o na mochila. Você pode arrastar ou clicar no objeto e depois na mochila.", [
          { prompt: "Estamos arrumando a mochila para um acampamento. Escolha a lanterna, que vai iluminar nosso caminho quando escurecer.", item: pic("Lanterna", "🔦"), target: "Mochila", options: [pic("Lanterna", "🔦"), pic("Folha", "🍃"), pic("Pedra", "🪨"), pic("Nuvem", "☁️")] },
          { prompt: "Estamos arrumando a mochila para um acampamento. Vamos levar os binóculos para observar os pássaros e outros animais. Escolha os binóculos.", item: pic("Binóculos", "🔭"), target: "Mochila", options: [pic("Binóculos", "🔭"), pic("Flor", "🌼"), pic("Nuvem", "☁️"), pic("Bola", "⚽")] },
          { prompt: "Estamos arrumando a mochila para um acampamento. O mapa vai nos ajudar a encontrar o caminho e explorar a natureza. Escolha o mapa e coloque-o na mochila.", item: pic("Mapa", "🗺️"), target: "Mochila", options: [pic("Mapa", "🗺️"), pic("Concha", "🐚"), pic("Maçã", "🍎"), pic("Flor", "🌼")] }
        ])
      ]
    },
    {
      id: "sound-lagoon", number: 2, title: "Lagoa dos Sons", subtitle: "Escutar, brincar com as palavras e descobrir seus sons", theme: "lagoon", art: "🐸💧🪷",
      goal: "Perceber sílabas, rimas e semelhanças sonoras na fala.", skills: ["Atenção auditiva", "Segmentação oral em sílabas", "Rimas", "Sílabas iniciais"], bncc: ["EF01LP06", "EF01LP09"],
      stages: [
        stage("Quem chamou?", "Associar palavra falada ao que ela nomeia", "listen-picture", "Ouça o nome e escolha a figura correspondente.", [
          choice("Quem chamou?", "SAPO", [pic("Pato", "🦆"), pic("Sapo", "🐸"), pic("Peixe", "🐟")], "SAPO"),
          choice("Quem está na lagoa?", "PATO", [pic("Pato", "🦆"), pic("Gato", "🐱"), pic("Sapo", "🐸")], "PATO"),
          choice("Encontre o peixe.", "PEIXE", [pic("Pássaro", "🐦"), pic("Peixe", "🐟"), pic("Tartaruga", "🐢")], "PEIXE"),
          choice("Quem está perto da água?", "RÃ", [pic("Rã", "🐸"), pic("Arara", "🦜"), pic("Macaco", "🐒")], "RÃ")
        ]),
        stage("Palmas na lagoa", "Segmentar oralmente palavras em sílabas", "syllable-count", "Fale devagar e bata uma palma para cada pedaço.", [
          { word: "SAPO", emoji: "🐸", syllables: ["SA", "PO"] }, { word: "PATO", emoji: "🦆", syllables: ["PA", "TO"] },
          { word: "MACACO", emoji: "🐒", syllables: ["MA", "CA", "CO"] }, { word: "TATU", emoji: "🦔", syllables: ["TA", "TU"] }
        ]),
        stage("Rimas entre amigos", "Perceber palavras com terminações sonoras semelhantes", "rhyme", "Ouça a palavra e encontre outra que termina com som parecido.", [
          choice("Qual palavra rima com PATO?", "GATO", [pic("Gato", "🐱"), pic("PIPA", "🪁"), pic("MALA", "🧳")], "PATO"),
          choice("Qual palavra rima com MÃO?", "PÃO", [pic("Pão", "🍞"), pic("BOLA", "⚽"), pic("PATO", "🦆")], "MÃO"),
          choice("Qual palavra rima com BOLA?", "COLA", [pic("Cola", "🧴"), pic("PEIXE", "🐟"), pic("LATA", "🥫")], "BOLA")
        ]),
        stage("Pares do mesmo começo", "Comparar sílabas iniciais de palavras faladas", "initial-syllable", "Qual palavra começa com o mesmo pedaço?", [
          choice("Encontre uma palavra que começa como BOLA.", "BOLO", [pic("BOLO", "🍰"), pic("MALA", "🧳"), pic("PATO", "🦆")], "BOLA"),
          choice("Encontre uma palavra que começa como MALA.", "MATO", [pic("PATO", "🦆"), pic("MATO", "🌳"), pic("BOLA", "⚽")], "MALA"),
          choice("Encontre uma palavra que começa como PIPA.", "PATO", [pic("TATU", "🦔"), pic("PATO", "🦆"), pic("MALA", "🧳")], "PIPA")
        ]),
        stage("O primeiro pedaço", "Reconhecer a sílaba inicial em palavras familiares", "first-syllable", "Ouça a palavra e escolha o primeiro pedaço.", [
          { word: "BONECA", emoji: "🪆", syllables: ["BO", "NE", "CA"] },
          { word: "SAPATO", emoji: "👟", syllables: ["SA", "PA", "TO"] },
          { word: "MACACO", emoji: "🐒", syllables: ["MA", "CA", "CO"] }
        ])
      ]
    },
    {
      id: "letter-trail", number: 3, title: "Trilha das Letras", subtitle: "Descobrir letras, sinais e seus sons", theme: "trail", art: "🌳🔤🦋",
      goal: "Reconhecer vogais e consoantes selecionadas e relacionar sons iniciais a grafemas.", skills: ["Reconhecimento de letras", "Maiúsculas e minúsculas", "Traçado e direção", "Som inicial e grafema"], bncc: ["EF01LP04", "EF01LP05", "EF01LP07", "EF01LP10", "EF01LP11"],
      stages: [
        stage("Vogais no céu", "Reconhecer as vogais em meio a letras e símbolos", "find-letter", "Ouça o nome da vogal e encontre a letra.", [
          choice("Encontre a vogal A.", "A", ["A", "M", "⭐"]), choice("Encontre a vogal E.", "E", ["F", "E", "🌼"]),
          choice("Encontre a vogal I.", "I", ["1", "I", "O"]), choice("Encontre a vogal O.", "O", ["Q", "U", "O"]), choice("Encontre a vogal U.", "U", ["V", "U", "A"])
        ]),
        stage("Letras parceiras: M e P", "Relacionar grafias maiúsculas e minúsculas", "case-match", "Encontre a letra parceira em formato minúsculo.", [
          { letter: "M", target: "m", options: ["n", "m", "w"] }, { letter: "P", target: "p", options: ["q", "b", "p"] },
          { letter: "M", target: "m", options: ["m", "n", "u"] }, { letter: "P", target: "p", options: ["b", "p", "d"] }
        ]),
        stage("Trilha pontilhada", "Acompanhar a direção de traçado de letras grandes", "trace-letter", "Clique nos pontos na ordem para acompanhar o caminho da letra.", [
          { letter: "M", points: ["1", "2", "3", "4", "5"] }, { letter: "P", points: ["1", "2", "3", "4"] }, { letter: "M", points: ["1", "2", "3", "4", "5"] }
        ]),
        stage("Letras L, T e B", "Reconhecer grafias e associar letras a palavras conhecidas", "find-letter", "Observe a palavra falada e encontre a primeira letra.", [
          choice("Encontre L, de LATA.", "L", ["T", "L", "B"], "LATA"), choice("Encontre T, de TATU.", "T", ["B", "T", "L"], "TATU"), choice("Encontre B, de BOLA.", "B", ["P", "B", "M"], "BOLA")
        ]),
        stage("Quem começa com...?", "Relacionar o som inicial de palavras ao grafema", "sound-letter", "Escute a palavra e escolha a letra que aparece no começo.", [
          choice("Qual letra começa MALA?", "M", ["M", "P", "L"], "MALA"), choice("Qual letra começa PIPA?", "P", ["B", "P", "T"], "PIPA"),
          choice("Qual letra começa LATA?", "L", ["T", "L", "B"], "LATA"), choice("Qual letra começa TATU?", "T", ["P", "B", "T"], "TATU"), choice("Qual letra começa BOLA?", "B", ["B", "M", "P"], "BOLA")
        ])
      ]
    },
    {
      id: "syllable-workshop", number: 4, title: "Oficina das Palavras", subtitle: "Juntar letras e sílabas para formar palavras", theme: "workshop", art: "🧩🔠🪵",
      goal: "Construir sílabas CV ensinadas, combiná-las e começar a decodificar palavras regulares.", skills: ["Famílias silábicas CV", "Completar palavras", "Ordenar sílabas", "Decodificação gradual"], bncc: ["EF01LP05", "EF01LP08", "EF02LP03", "EF02LP04"],
      stages: [
        stage("Famílias M e P", "Ouvir e reconhecer sílabas das famílias M e P", "syllable-family", "Observe as letras, ouça a sílaba e encontre o bloco igual.", [
          { consonant: "M", vowel: "A", answer: "MA", options: ["MA", "ME", "PA"] }, { consonant: "M", vowel: "I", answer: "MI", options: ["MO", "MI", "MA"] },
          { consonant: "P", vowel: "A", answer: "PA", options: ["BA", "PA", "MA"] }, { consonant: "P", vowel: "I", answer: "PI", options: ["BI", "PI", "MI"] }
        ]),
        stage("Famílias L e T", "Combinar L e T com vogais para formar sílabas", "syllable-family", "Junte a consoante à vogal e escolha a sílaba formada.", [
          { consonant: "L", vowel: "A", answer: "LA", options: ["LA", "TA", "MA"] }, { consonant: "L", vowel: "I", answer: "LI", options: ["LU", "PI", "LI"] },
          { consonant: "T", vowel: "A", answer: "TA", options: ["PA", "TA", "LA"] }, { consonant: "T", vowel: "U", answer: "TU", options: ["TI", "PU", "TU"] }
        ]),
        stage("Família B", "Formar sílabas com a consoante B", "syllable-family", "Ouça o som e escolha a sílaba que aparece.", [
          { consonant: "B", vowel: "A", answer: "BA", options: ["BA", "PA", "MA"] }, { consonant: "B", vowel: "O", answer: "BO", options: ["BU", "BO", "TO"] },
          { consonant: "B", vowel: "I", answer: "BI", options: ["PI", "BI", "LI"] }, { consonant: "B", vowel: "U", answer: "BU", options: ["BO", "PU", "BU"] }
        ]),
        stage("Complete a palavra", "Escolher a sílaba que falta em uma palavra familiar", "complete-word", "Observe os blocos e escolha a sílaba que está faltando.", [
          { word: "MALA", parts: ["MA", "?"], answer: "LA", options: ["LA", "PA", "TA"] }, { word: "MAPA", parts: ["?", "PA"], answer: "MA", options: ["PI", "MA", "BA"] },
          { word: "PIPA", parts: ["PI", "?"], answer: "PA", options: ["PO", "PA", "MA"] }, { word: "BOLA", parts: ["BO", "?"], answer: "LA", options: ["TA", "LA", "BA"] }
        ]),
        stage("Quebra-cabeça silábico", "Organizar sílabas na ordem para formar palavras", "build-word", "Escolha os blocos na ordem em que você fala a palavra.", [
          { word: "MALA", emoji: "🧳", syllables: ["MA", "LA"], pool: ["LA", "MA", "PA"] }, { word: "PATO", emoji: "🦆", syllables: ["PA", "TO"], pool: ["TO", "TA", "PA"] },
          { word: "BOLA", emoji: "⚽", syllables: ["BO", "LA"], pool: ["LA", "BO", "BA"] }, { word: "TATU", emoji: "🦔", syllables: ["TA", "TU"], pool: ["TU", "TO", "TA"] }
        ]),
        stage("Palavra descoberta", "Decodificar palavras regulares formadas por sílabas ensinadas", "decode-word", "Leia cada bloco e depois encontre a palavra completa.", [
          { word: "MALA", parts: ["MA", "LA"], options: ["MALA", "MATA", "PALA"] }, { word: "MAPA", parts: ["MA", "PA"], options: ["MATA", "MAPA", "PAPA"] },
          { word: "PIPA", parts: ["PI", "PA"], options: ["PIPA", "PAPA", "PIMA"] }, { word: "BOLA", parts: ["BO", "LA"], options: ["BALA", "BOLA", "BOTA"] }
        ])
      ]
    },
    {
      id: "research-post", number: 5, title: "Posto de Pesquisa", subtitle: "Usar a leitura para descobrir, localizar e registrar", theme: "research", art: "🔎📋🌱",
      goal: "Compreender palavras e pequenos textos para realizar ações com propósito.", skills: ["Leitura de etiquetas", "Listas", "Placas", "Bilhetes", "Registro de observações"], bncc: ["EF12LP01", "EF12LP04"],
      stages: [
        stage("Etiquetas do posto", "Relacionar palavras escritas a objetos e animais", "read-label", "Leia a etiqueta e escolha o que ela identifica.", [
          choice("Encontre a etiqueta MALA.", "MALA", [pic("MALA", "🧳"), pic("MAPA", "🗺️"), pic("BOLA", "⚽")]), choice("Encontre a etiqueta PIPA.", "PIPA", [pic("PATO", "🦆"), pic("PIPA", "🪁"), pic("BOLA", "⚽")]), choice("Encontre a etiqueta BOLA.", "BOLA", [pic("MALA", "🧳"), pic("BOLA", "⚽"), pic("MAPA", "🗺️")])
        ]),
        stage("Lista de materiais", "Usar uma lista curta para selecionar itens", "list-task", "Observe a lista e selecione os dois itens que aparecem nela.", [
          { list: ["PIPA", "MALA"], options: [pic("PIPA", "🪁"), pic("BOLA", "⚽"), pic("MALA", "🧳")], answer: ["PIPA", "MALA"] },
          { list: ["MAPA", "BOLA"], options: [pic("PATO", "🦆"), pic("MAPA", "🗺️"), pic("BOLA", "⚽")], answer: ["MAPA", "BOLA"] },
          { list: ["LATA", "PATO"], options: [pic("LATA", "🥫"), pic("TATU", "🦔"), pic("PATO", "🦆")], answer: ["LATA", "PATO"] }
        ]),
        stage("Placas da expedição", "Compreender uma placa e localizar um destino", "sign-task", "Leia ou ouça a placa e escolha o destino indicado.", [
          choice("A placa diz: VÁ À LAGOA.", "Lagoa", [pic("Lagoa", "💧"), pic("Acampamento", "🏕️"), pic("Oficina", "🧩")], "Vá à lagoa."),
          choice("A placa diz: SIGA A TRILHA.", "Trilha", [pic("Posto", "🔬"), pic("Trilha", "🌳"), pic("Lagoa", "🐸")], "Siga a trilha."),
          choice("A placa diz: VOLTE AO POSTO.", "Posto", [pic("Posto", "🔬"), pic("Barraca", "⛺"), pic("Lagoa", "💧")], "Volte ao posto.")
        ]),
        stage("Recado do Capi", "Compreender a informação principal de um bilhete curto", "note-task", "Leia ou ouça o recado. O que Capi pediu?", [
          choice("Capi escreveu: LEVE O MAPA.", "MAPA", [pic("MALA", "🧳"), pic("MAPA", "🗺️"), pic("PIPA", "🪁")], "Leve o mapa."),
          choice("Capi escreveu: PEGUE A PIPA.", "PIPA", [pic("BOLA", "⚽"), pic("PIPA", "🪁"), pic("LATA", "🥫")], "Pegue a pipa."),
          choice("Capi escreveu: PROCURE O PATO.", "PATO", [pic("TATU", "🦔"), pic("PATO", "🦆"), pic("BOLA", "⚽")], "Procure o pato.")
        ]),
        stage("Diário de campo", "Organizar palavras conhecidas para registrar uma observação", "sentence-order", "Escolha as palavras para montar a frase do diário.", [
          { words: ["VI", "UM", "PATO"], answer: ["VI", "UM", "PATO"], emoji: "🦆" },
          { words: ["A", "MALA", "É", "AZUL"], answer: ["A", "MALA", "É", "AZUL"], emoji: "🧳" },
          { words: ["A", "PIPA", "É", "MINHA"], answer: ["A", "PIPA", "É", "MINHA"], emoji: "🪁" }
        ])
      ]
    }
  ];

  const bonus = {
    id: "field-journal", number: 6, title: "Diário de Bordo", subtitle: "Guardar lembranças da expedição", theme: "journal", art: "📓⭐🦫",
    goal: "Retomar a compreensão e organizar pequenas narrativas com apoio visual.", skills: ["Sequência narrativa", "Compreensão oral", "Produção de legenda"], bncc: ["EF12LP02", "EF12LP04"],
    stages: [
      stage("O que aconteceu primeiro?", "Organizar imagens em uma sequência", "sentence-order", "Coloque as palavras na ordem para lembrar a descoberta.", [{ words: ["A", "CAPI", "VIU", "O", "PATO"], answer: ["CAPI", "VIU", "O", "PATO"], emoji: "🦆" }]),
      stage("A história da lagoa", "Relacionar uma narrativa curta a uma imagem", "listen-picture", "Ouça a história e escolha a figura que combina com ela.", [choice("Capi encontrou uma tartaruga perto da água.", "TARTARUGA", [pic("Tartaruga", "🐢"), pic("Arara", "🦜"), pic("Macaco", "🐒")], "Capi encontrou uma tartaruga perto da água.")]),
      stage("Uma frase para lembrar", "Escolher palavras para registrar uma observação", "sentence-order", "Monte uma frase curta para o diário.", [{ words: ["EU", "VI", "UM", "SAPO"], answer: ["EU", "VI", "UM", "SAPO"], emoji: "🐸" }])
    ]
  };

  global.WordAdventureContent = { worlds, bonus };
})(window);
