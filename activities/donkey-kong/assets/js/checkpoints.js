(function (global) {
  const worlds = {
    jungle: {
      id: "jungle",
      number: 1,
      title: "A Selva dos Kongs",
      subtitle: "Treino de digitação · Teclado ABNT2",
      page: "jungle.html",
      track: "eAm9fk39c50",
      scene: "https://m.media-amazon.com/images/M/MV5BZjM0OWI5NjgtMmUwMS00MjlhLTg0ZTktNDQ3MTBkYWNhMzkwXkEyXkFqcGc%40._V1_.jpg",
      characters: [
        { src: "https://static.wikia.nocookie.net/nintendo/images/f/f9/DK_and_Diddy.PNG/revision/latest?cb=20141007152903&path-prefix=en", alt: "Donkey Kong e Diddy Kong", credit: "Nintendo Fandom" },
        { src: "https://static.wikia.nocookie.net/donkeykong/images/7/7b/Squawks_-_DKC2.gif/revision/latest?cb=20190113015723", alt: "Squawks", credit: "Donkey Kong Wiki" },
        { src: "https://static.wikia.nocookie.net/donkeykong/images/1/14/Necky_1.png/revision/latest/scale-to-width-down/1000?cb=20170823192107&path-prefix=pt", alt: "Necky", credit: "Donkey Kong Wiki" }
      ],
      intro: "Encontre a posição-base, explore as três fileiras e digite as primeiras frases.",
      guide: "Encontre as marcas tácteis em F e J. Coloque o indicador esquerdo em F e o direito em J. Acomode os outros dedos na fileira-base e deixe os polegares próximos à barra de espaço. Ao alcançar outra fileira, volte a F e J.",
      checkpoints: [
        { title: "Mão esquerda", instruction: "Comece posicionando os indicadores nas marcas tácteis F e J e acomode os outros dedos na fileira-base. Depois, use a mão esquerda para digitar a sequência de ida e volta.", hint: "Na fileira-base esquerda: A, S, D, F. Use o mínimo em A, o anelar em S, o médio em D e o indicador em F. Faça o caminho de volta até A. O professor acompanha o posicionamento dos dedos.", kind: "typing", target: "ASDF FDSA" },
        { title: "Mão direita", instruction: "Agora pratique a fileira-base direita. Digite a sequência e volte.", hint: "Use J, K, L e Ç. A tecla Ç fica à direita do L.", kind: "typing", target: "JKLÇ ÇLKJ" },
        { title: "Duas mãos", instruction: "Alterne as mãos e use os polegares para o espaço entre os grupos.", hint: "Esquerda: A S D F. Direita: J K L Ç. Retorne à posição-base em F e J quando ajudar.", kind: "typing", target: "ASDF JKLÇ FDSA ÇLKJ" },
        { title: "Subindo pelas árvores", instruction: "Alcance a fileira superior e retorne à posição-base entre os grupos.", hint: "Fileira superior: Q W E R T Y U I O P. Use o mesmo dedo correspondente à cor indicada no teclado.", kind: "typing", target: "QWERTY UIOP" },
        { title: "Descendo pela selva", instruction: "Pratique a fileira inferior. Vá até o fim e volte.", hint: "Fileira inferior: Z X C V B N M. O indicador esquerdo alcança V/B; o direito alcança N/M.", kind: "typing", target: "ZXCVBNM MNBVCXZ" },
        { title: "As bananas", instruction: "Digite as quatro palavras separadas por espaços. Não precisa correr.", hint: "As palavras combinam teclas das três fileiras. Use os polegares para cada espaço.", kind: "typing", target: "KONG BANANA DIDDY FLORESTA" },
        { title: "Diddy Kong", instruction: "Digite a frase completa, usando as duas mãos e os polegares nos espaços.", hint: "Leia a frase em grupos: Diddy / corre / pela / floresta.", kind: "typing", target: "Diddy corre pela floresta" },
        { title: "A turma dos Kongs", instruction: "Conclua o treino com uma frase inteira. Acompanhe uma tecla por vez.", hint: "Não há cronômetro. Se precisar, volte a consultar o teclado e divida a frase em palavras.", kind: "typing", target: "Os Kongs exploram a ilha" }
      ]
    },
    mine: {
      id: "mine",
      number: 2,
      title: "A Mina dos Barris",
      subtitle: "Shift, símbolos e acentuação",
      page: "mine.html",
      track: "cBK2YIrY62I",
      scene: "https://i1.sndcdn.com/artworks-GFTiQ1tx2yLRObMR-XVi6NQ-t1080x1080.jpg",
      characters: [
        { src: "https://static.wikia.nocookie.net/donkeykong/images/4/47/Dixie_rambi_and_klobble.gif/revision/latest?cb=20210429024957", alt: "Dixie Kong, Rambi e Klobber", credit: "Donkey Kong Wiki" },
        { src: "https://media.tenor.com/GXqnaxylERQAAAAi/dk-coin-dk.gif", alt: "Moeda DK", credit: "Tenor" },
        { src: "https://static.wikia.nocookie.net/donkeykong/images/7/7a/Zinger.png/revision/latest?cb=20170908235819&path-prefix=pt", alt: "Zinger", credit: "Donkey Kong Wiki" }
      ],
      intro: "Explore o teclado ABNT2: diferencie maiúsculas, minúsculas, números, símbolos e acentos.",
      guide: "A Mina dos Barris agora é uma sequência de oficinas. Cada etapa mostra a tecla e a combinação necessárias; ao digitar corretamente, a atividade avança sozinha. Use Shift apenas quando a tecla ou o símbolo pedir.",
      checkpoints: [
        {
          title: "Maiúsculas e minúsculas",
          instruction: "Compare letras pequenas e grandes. Digite cada exemplo exatamente como aparece.",
          hint: "Letras minúsculas são digitadas sem Shift. Para maiúsculas, segure Shift enquanto pressiona a letra. Observe que o texto diferencia K de k.",
          kind: "typing-sequence",
          caseSensitive: true,
          stages: [
            { target: "diddy", instruction: "Primeiro, escreva Diddy em letras minúsculas.", hint: "Não segure Shift: digite d i d d y." },
            { target: "DIDDY", instruction: "Agora escreva a mesma palavra em letras maiúsculas.", hint: "Segure Shift para cada letra: D I D D Y.", shiftLetters: true },
            { target: "Diddy Kong", instruction: "Use maiúscula apenas no começo de cada nome.", hint: "Shift aparece em D e K. As outras letras são minúsculas.", shiftLetters: true },
            { target: "KONG kong", instruction: "Compare uma palavra toda em maiúsculas com outra toda em minúsculas.", hint: "Na primeira palavra, use Shift nas quatro letras. Na segunda, solte Shift." , shiftLetters: true }
          ]
        },
        {
          title: "Shift, números e símbolos",
          instruction: "Use letras maiúsculas, números e os símbolos que aparecem na parte superior das teclas.",
          hint: "O teclado abaixo destaca Shift e as teclas físicas. No ABNT2: Shift+1 produz !, Shift+7 produz & e Shift+= produz +. Ponto e vírgula são digitados sem Shift.",
          kind: "typing-sequence",
          caseSensitive: true,
          stages: [
            { target: "DK 123", instruction: "Misture letras maiúsculas com números.", hint: "Use Shift em D e K. Digite 1, 2 e 3 sem Shift.", shiftLetters: true },
            { target: "! & +", instruction: "Agora produza três símbolos com Shift.", hint: "Shift+1 → ! · Shift+7 → & · Shift+= → +.", symbolCodes: { "!": "Digit1", "&": "Digit7", "+": "Equal" }, requireShiftSymbols: true },
            { target: ".,", instruction: "Digite ponto e vírgula. Nesta etapa, não use Shift.", hint: "Use as teclas de pontuação do teclado ABNT2. Digite primeiro o ponto e depois a vírgula.", requireNoShiftSymbols: true },
            { target: "KONG! 7 + 1.", instruction: "Misture maiúsculas, números, símbolos e pontuação.", hint: "KONG usa Shift nas letras; ! usa Shift+1; + usa Shift+=. O ponto final é digitado sem Shift.", shiftLetters: true, symbolCodes: { "!": "Digit1", "+": "Equal" }, requireShiftSymbols: true }
          ]
        },
        {
          title: "Acentos sem Shift · minúsculas",
          instruction: "Prepare o acento e depois digite a vogal. Complete cada palavra em letras minúsculas.",
          hint: "O agudo ´ fica na tecla à direita do P e é usado sem Shift. O til ~ fica à direita do Ç e também é usado sem Shift. Primeiro pressione o acento; depois a vogal.",
          kind: "typing-sequence",
          caseSensitive: true,
          deadKeyShift: false,
          stages: [
            { target: "café", instruction: "Digite café.", hint: "Para é: pressione ´ sem Shift e depois e." },
            { target: "jacaré", instruction: "Digite jacaré.", hint: "Repita o agudo ´ sem Shift antes do e." },
            { target: "irmã", instruction: "Digite irmã.", hint: "Para ã: pressione ~ sem Shift e depois a." },
            { target: "maçã", instruction: "Digite maçã.", hint: "Use ç normalmente; para ã, prepare ~ sem Shift e depois a." }
          ]
        },
        {
          title: "Acento com Shift · minúsculas",
          instruction: "Agora use o circunflexo, que fica na mesma tecla do til, mas exige Shift. As vogais continuam minúsculas.",
          hint: "Segure Shift para produzir ^. Solte Shift antes de digitar a vogal minúscula: ^ + e → ê; ^ + o → ô.",
          kind: "typing-sequence",
          caseSensitive: true,
          deadKeyShift: true,
          stages: [
            { target: "você", instruction: "Digite você.", hint: "Para ê, use Shift+^ e depois e minúsculo." },
            { target: "avô", instruction: "Digite avô.", hint: "Para ô, use Shift+^ e depois o minúsculo." },
            { target: "câmera", instruction: "Digite câmera.", hint: "Para â, use Shift+^ e depois a minúsculo." },
            { target: "pêssego", instruction: "Digite pêssego.", hint: "Prepare ^ com Shift; depois pressione e sem Shift." }
          ]
        },
        {
          title: "Acentos sem Shift · maiúsculas",
          instruction: "O acento é preparado sem Shift; a vogal será maiúscula. Digite as cinco letras.",
          hint: "Pressione ´ sem Shift. Depois segure Shift ao digitar a vogal: ´ + Shift+A → Á. Repita com E, I, O e U.",
          kind: "typing-sequence",
          caseSensitive: true,
          deadKeyShift: false,
          shiftLetters: true,
          stages: [
            { target: "Á É Í Ó Ú", instruction: "Digite Á, É, Í, Ó e Ú.", hint: "Em cada letra: primeiro ´ sem Shift; depois Shift + vogal maiúscula.", shiftLetters: true }
          ]
        },
        {
          title: "Acentos com Shift · maiúsculas",
          instruction: "Use Shift para preparar o circunflexo e mantenha Shift ao digitar a vogal maiúscula.",
          hint: "Shift+^ prepara o circunflexo. Depois, Shift+A → Â; Shift+E → Ê; Shift+O → Ô.",
          kind: "typing-sequence",
          caseSensitive: true,
          deadKeyShift: true,
          stages: [
            { target: "Â Ê Ô", instruction: "Digite Â, Ê e Ô.", hint: "Para cada letra, use Shift+^ e depois Shift + vogal maiúscula.", shiftLetters: true }
          ]
        },
        {
          title: "Misturando acentos e símbolos",
          instruction: "Use tudo o que aprendeu: maiúsculas, minúsculas, acentos, números e símbolos.",
          hint: "Lembre-se: ! = Shift+1; & = Shift+7; + = Shift+=. Para os acentos, prepare a tecla antes da vogal.",
          kind: "typing-sequence",
          caseSensitive: true,
          stages: [
            { target: "DIDDY & KONG! 7 + 1.", instruction: "Digite a frase com letras maiúsculas, números e símbolos.", hint: "Use Shift nas letras maiúsculas, Shift+7 para &, Shift+1 para ! e Shift+= para +.", shiftLetters: true, symbolCodes: { "!": "Digit1", "&": "Digit7", "+": "Equal" }, requireShiftSymbols: true },
            { target: "Café, maçã & você.", instruction: "Agora misture acentos, vírgula, ponto e comercial.", hint: "´ prepara é; ~ prepara ã; Shift+^ prepara ê. Vírgula e ponto são digitados sem Shift; Shift+7 produz &.", deadKeyShift: false, shiftLetters: true, symbolCodes: { "&": "Digit7" }, requireShiftSymbols: true },
            { target: "AVÔ, VOCÊ & AVÓ!", instruction: "Conclua misturando maiúsculas acentuadas e símbolos.", hint: "Use Shift para as letras maiúsculas, Shift+^ para Ô/Ê e Shift+1 para !.", shiftLetters: true, deadKeyShift: true, symbolCodes: { "!": "Digit1", "&": "Digit7" }, requireShiftSymbols: true }
          ]
        }
      ]
    },
    camp: {
      id: "camp",
      number: 3,
      title: "O Acampamento dos Kongs",
      subtitle: "Navegação e atalhos de texto",
      page: "camp.html",
      track: "wxAZfLenfa0",
      scene: "https://www.mezunian.com/wp-content/uploads/2020/05/donkey-kong-country-2-diddys-kong-quest-screechs-sprint-cat-o-9-tails-near-start.png?m=1701871908",
      characters: [
        { src: "https://static.wikia.nocookie.net/donkeykong/images/7/7b/Squawks_-_DKC2.gif/revision/latest?cb=20190113015723", alt: "Squawks, o papagaio", credit: "Donkey Kong Wiki" },
        { src: "https://static.wikia.nocookie.net/donkeykong/images/8/8e/Krusha_4.png/revision/latest?cb=20190503205924&path-prefix=pt", alt: "Krusha", credit: "Donkey Kong Wiki" },
        { src: "https://static.wikia.nocookie.net/donkeykong/images/1/14/Necky_1.png/revision/latest/scale-to-width-down/1000?cb=20170823192107&path-prefix=pt", alt: "Necky", credit: "Donkey Kong Wiki" },
        { src: "https://media.tenor.com/HomN6gM7WcEAAAAj/diddy-kong-donkey-kong.gif", alt: "Diddy e Donkey Kong", credit: "Tenor" },
        { src: "https://media.tenor.com/GXqnaxylERQAAAAi/dk-coin-dk.gif", alt: "Moeda DK", credit: "Tenor" }
      ],
      intro: "Crie linhas, apague à frente, selecione trechos e use os atalhos de edição.",
      guide: "Agora você vai praticar Enter, Delete, AltGr e atalhos com Ctrl. As seleções de texto aparecem junto das operações de Ctrl, sempre com avanço automático quando a ação correta é reconhecida.",
      checkpoints: [
        { title: "Uma nova linha", instruction: "O cursor está entre as palavras equipe e chegou. Pressione Enter para iniciar uma nova linha.", hint: "Enter cria uma quebra de linha. O texto esperado terá duas linhas.", kind: "native-edit", initial: "A equipe chegou", caret: 8, key: "Enter", expected: "A equipe\nchegou", actionLabel: "Inserir uma quebra de linha" },
        { title: "Apagando pela frente", instruction: "O cursor está entre K e !. Pressione Lupa (Launcher) + Backspace para apagar o caractere à direita.", hint: "Backspace sozinho apaga à esquerda. No Chromebook testado, Lupa + Backspace apaga à direita, como Delete.", kind: "native-edit", initial: "DK!", caret: 2, key: "Delete", expected: "DK", actionLabel: "Apagar pela frente" },
        { title: "O ponto de interrogação", instruction: "Digite ? usando AltGr+W no teclado ABNT2.", hint: "Mantenha AltGr pressionado e toque W. Essa combinação produz o ponto de interrogação no layout ABNT2.", kind: "typing-sequence", caseSensitive: true, stages: [
          { target: "?", instruction: "Produza o ponto de interrogação.", hint: "AltGr+W → ?.", altGrCodes: { "?": "KeyW" } }
        ] },
        { title: "A força do Ctrl", instruction: "Use Ctrl+→ para avançar uma palavra, Ctrl+Shift+→ para selecionar a palavra seguinte e Ctrl+A para selecionar todo o texto.", hint: "O campo posiciona o cursor antes de corre. A seleção é real e deve ser feita com o teclado; não use o mouse.", kind: "navigation", source: "Diddy corre pela ilha", caret: 6 },
        { title: "Barris transportadores", instruction: "Use Ctrl+C para copiar BANANA e Ctrl+V para colar no destino. Depois, use Ctrl+X para recortar DK e Ctrl+V para colar depois de KONG.", hint: "Os campos de origem e destino usam a área de transferência nativa do navegador. Nenhum texto é copiado pelo aplicativo.", kind: "clipboard" },
        { title: "Voltando no tempo", instruction: "Digite ! no fim de DK KONG. Depois, use Ctrl+Z para desfazer e Ctrl+Shift+Z para refazer.", hint: "Esses atalhos funcionam quando o campo de texto está focado. O navegador mantém o histórico nativo de edição.", kind: "undo", initial: "DK KONG", expectedTyped: "DK KONG!", expectedUndo: "DK KONG", expectedRedo: "DK KONG!" },
        { title: "O recado do Cranky", instruction: "Primeiro, digite as maiúsculas acentuadas Á É Ê Õ Ú. Depois, corrija o recado: coloque maiúscula no início das duas frases, use à em chegaram à mina e termine a pergunta com !.", hint: "Para cada letra acentuada, pressione a tecla do acento e depois a vogal com Shift. O acento pode ser composto em duas teclas; confira o resultado no campo.", kind: "integrated", accents: "Á É Ê Õ Ú", initial: "os kongs\nchegaram a mina?\ntraga bananas!", expected: "Os kongs\nchegaram à mina?\nTraga bananas!" }
      ]
    }
  };

  const poemReference = [
    "Minha terra tem palmeiras,",
    "Onde canta o sabiá;",
    "As aves, que aqui gorjeiam,",
    "Não gorjeiam como lá.",
    "",
    "Nosso céu tem mais estrelas,",
    "Nossas várzeas têm mais flores,",
    "Nossos bosques têm mais vida,",
    "Nossa vida mais amores.",
    "",
    "Em cismar, sozinho, à noite,",
    "Mais prazer encontro eu lá;",
    "Minha terra tem palmeiras,",
    "Onde canta o sabiá.",
    "Minha terra tem primores,",
    "Que tais não encontro eu cá;",
    "Em cismar, sozinho, à noite,",
    "Mais prazer encontro eu lá;",
    "Minha terra tem palmeiras,",
    "Onde canta o sabiá.",
    "",
    "Não permita Deus que eu morra,",
    "Sem que eu volte para lá;",
    "Sem que desfrute os primores",
    "Que não encontro por cá;",
    "Sem qu'inda aviste as palmeiras,",
    "Onde canta o sabiá."
  ].join("\n");

  const poemDamaged = [
    "minha terra tem palmeiras,",
    "As aves que aqui gorjeiam,",
    "Onde canta o sabiá,",
    "Não gorjeiam como lá?",
    "",
    "Nosso ceo tem mais estrelas,",
    "Nossas várzeas tem mais flores,",
    "Nossos bosques têm mais vida,",
    "Nossa vida mais amores.",
    "",
    "Em cismar, sozinho, a noite,",
    "Mais prazer encontro eu lá;",
    "Minha terra tem palmeiras,",
    "Onde canta o sabiá.",
    "Minha terra tem primores,",
    "Que tais não encontro eu cá;",
    "Em cismar, sozinho, à noite,",
    "Mais prazer encontro eu lá;",
    "Minha terra tem palmeiras,",
    "Onde canta o sabiá.",
    "",
    "Não permita Deus que eu morra,",
    "Sem que eu volte para la;",
    "Sem que desfrute os primores",
    "Que não encontro por cá;",
    "Sem qu'inda aviste as palmeiras,",
    "Onde canta o sabiá."
  ].join("\n");

  const poemSteps = [
    { title: "A primeira letra", instruction: "A primeira letra está selecionada. Digite M usando Shift para começar o poema com maiúscula.", selection: { type: "line-token", linePrefix: "minha terra", value: "m" }, validate: "first-capital" },
    { title: "A ordem dos versos", instruction: "Mova o verso “Onde canta o sabiá,” para antes de “As aves que aqui gorjeiam,”. Use Ctrl+X para recortar; depois pressione ↑ uma vez para voltar ao começo do verso das aves e Ctrl+V para colar. Depois de colar, pressione ↑ e End para ir ao fim do verso movido; Shift+← seleciona a vírgula final. Digite ponto e vírgula.", selection: { type: "line", value: "Onde canta o sabiá,", includeNewline: true }, validate: "verse-order" },
    { title: "O ponto final", instruction: "No quarto verso, troque o ponto de interrogação por ponto final.", selection: { type: "line-token", linePrefix: "Não gorjeiam como lá?", value: "?" }, validate: "question-to-period" },
    { title: "O céu", instruction: "Na primeira linha da segunda estrofe, corrija ceo para céu usando o acento agudo.", selection: { type: "line-token", linePrefix: "Nosso ceo", value: "ceo" }, validate: "sky-accent" },
    { title: "As várzeas", instruction: "Na linha das várzeas, corrija tem para têm usando o circunflexo.", selection: { type: "line-token", linePrefix: "Nossas várzeas", value: "tem" }, validate: "plural-circumflex" },
    { title: "À noite", instruction: "Na primeira ocorrência de “Em cismar”, corrija a noite para à noite com acento grave.", selection: { type: "line-token", linePrefix: "Em cismar, sozinho, a noite,", value: "a noite" }, validate: "grave-accent" },
    { title: "Volte para lá", instruction: "No verso “Sem que eu volte para la;”, coloque o acento agudo em lá. Preserve o ponto e vírgula.", selection: { type: "line-token", linePrefix: "Sem que eu volte para la;", value: "la" }, validate: "there-accent" },
    { title: "A vírgula das aves", instruction: "No verso das aves, insira uma vírgula depois de “As aves”.", selection: { type: "line-token", linePrefix: "As aves que aqui gorjeiam,", value: "As aves" }, validate: "birds-comma" }
  ];

  const fingers = {
    a: "left-pinky", q: "left-pinky", z: "left-pinky",
    s: "left-ring", w: "left-ring", x: "left-ring",
    d: "left-middle", e: "left-middle", c: "left-middle",
    f: "left-index", r: "left-index", t: "left-index", g: "left-index", v: "left-index", b: "left-index",
    j: "right-index", y: "right-index", u: "right-index", h: "right-index", n: "right-index", m: "right-index",
    k: "right-middle", i: "right-middle", l: "right-ring", o: "right-ring", ç: "right-pinky", p: "right-pinky", " ": "thumb"
  };

  global.DonkeyKongData = { worlds, poemReference, poemDamaged, poemSteps, fingers };
})(window);
