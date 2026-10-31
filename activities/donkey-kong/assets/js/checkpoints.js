(function (global) {
  const worlds = {
    jungle: {
      id: "jungle",
      number: 1,
      title: "A Selva dos Kongs",
      subtitle: "Treino de digitação · Teclado ABNT2",
      page: "jungle.html",
      track: "eAm9fk39c50",
      scene: "https://www.mobygames.com/images/shots/l/27540-donkey-kong-country-snes-screenshot-now-we-ve-really-climbed.jpg",
      characters: [
        { src: "https://static.wikia.nocookie.net/nintendo/images/f/f9/DK_and_Diddy.PNG/revision/latest?cb=20141007152903&path-prefix=en", alt: "Donkey Kong e Diddy Kong", credit: "Nintendo Fandom" },
        { src: "https://static.wikia.nocookie.net/donkeykong/images/7/7b/Squawks_-_DKC2.gif/revision/latest?cb=20190113015723", alt: "Squawks", credit: "Donkey Kong Wiki" },
        { src: "https://snesmaps.com/maps/DonkeyKongCountry/sprites/Necky.png", alt: "Necky", credit: "SNESMaps" }
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
      scene: "https://images.squarespace-cdn.com/content/v1/55ef0e29e4b099e22cdc9eea/1446879156032-U8BD4PO9C0DRYDHWD8RA/image-asset.jpeg",
      characters: [
        { src: "https://static.wikia.nocookie.net/donkeykong/images/4/47/Dixie_rambi_and_klobble.gif/revision/latest?cb=20210429024957", alt: "Dixie Kong, Rambi e Klobber", credit: "Donkey Kong Wiki" },
        { src: "https://media.tenor.com/GXqnaxylERQAAAAi/dk-coin-dk.gif", alt: "Moeda DK", credit: "Tenor" },
        { src: "https://snesmaps.com/maps/DonkeyKongCountry/sprites/ZingerOrange.png", alt: "Zinger", credit: "SNESMaps" }
      ],
      intro: "Explore o teclado ABNT2: diferencie maiúsculas, minúsculas, números, símbolos e acentos.",
      guide: "A Mina dos Barris agora é uma sequência de oficinas. Cada etapa mostra a tecla e a combinação necessárias; ao digitar corretamente, a atividade avança sozinha. Use Shift apenas quando a tecla ou o símbolo pedir.",
      checkpoints: [
        {
          title: "Maiúsculas e minúsculas",
          instruction: "Compare letras minúsculas e maiúsculas. Depois, use maiúsculas no começo dos nomes e da frase.",
          hint: "Sem Shift, as letras ficam minúsculas. Segure Shift para escrever uma letra maiúscula. O desenho acende a tecla e a seta de Shift que você deve usar.",
          kind: "typing-sequence",
          caseSensitive: true,
          stages: [
            { target: "banana", instruction: "Escreva a palavra banana com letras minúsculas.", hint: "Digite todas as letras sem segurar Shift." },
            { target: "BANANA", instruction: "Agora escreva BANANA com todas as letras maiúsculas.", hint: "Segure Shift para cada letra. A seta de Shift brilha junto com a tecla da letra.", shiftLetters: true },
            { target: "Barril", instruction: "Escreva Barril com apenas a primeira letra em maiúscula.", hint: "Use Shift no B inicial. Depois, solte Shift e continue com letras minúsculas.", shiftLetters: true },
            { target: "CROCODILO", instruction: "Agora escreva CROCODILO com todas as letras maiúsculas.", hint: "Segure Shift em cada letra da palavra.", shiftLetters: true },
            { target: "Rinoceronte", instruction: "Escreva Rinoceronte com apenas a primeira letra em maiúscula.", hint: "Use Shift no R inicial. As outras letras ficam minúsculas.", shiftLetters: true },
            { target: "O Sapo saltou sobre a Abelha.", instruction: "Digite a frase O Sapo saltou sobre a Abelha.", hint: "Use Shift no começo da frase e no começo dos nomes Sapo e Abelha. Nas outras letras, solte Shift.", shiftLetters: true }
          ]
        },
        {
          title: "Shift, números e símbolos",
          instruction: "Use Shift com letras e números. Descubra também os sinais que ficam na parte de cima de algumas teclas.",
          hint: "No ABNT2: Shift+1 produz !, Shift+7 produz & e Shift+= produz +. Vírgula e ponto são digitados sem Shift. A seta de Shift acende junto com a tecla correspondente.",
          kind: "typing-sequence",
          caseSensitive: true,
          stages: [
            { target: "O barril tem 2 bananas!", instruction: "Digite a frase O barril tem 2 bananas!", hint: "Use Shift no O inicial e Shift+1 para o ponto de exclamação.", shiftLetters: true, symbolCodes: { "!": "Digit1" }, requireShiftSymbols: true },
            { target: "3 sapos, 2 abelhas e 1 rinoceronte.", instruction: "Digite a lista com quantidades de animais.", hint: "Use os números sem Shift. A vírgula e o ponto final também são digitados sem Shift.", requireNoShiftSymbols: true },
            { target: "2 + 1 = 3 bananas.", instruction: "Complete a conta que mostra quantas bananas há ao todo.", hint: "Para +, segure Shift e pressione a tecla =. O sinal = é digitado sem Shift.", symbolCodes: { "+": "Equal" }, requireShiftSymbols: true },
            { target: "FRUTAS & ANIMAIS", instruction: "Digite o título FRUTAS & ANIMAIS.", hint: "Use Shift em todas as letras maiúsculas e Shift+7 para produzir &.", shiftLetters: true, symbolCodes: { "&": "Digit7" }, requireShiftSymbols: true }
          ]
        },
        {
          title: "Acentos sem Shift · minúsculas",
          instruction: "Prepare o acento sem Shift e depois digite a vogal minúscula. Complete palavras e uma frase.",
          hint: "O agudo ´ fica à direita do P. O til ~ fica à direita do Ç. Pressione primeiro a tecla do acento e depois a vogal, sem segurar Shift.",
          kind: "typing-sequence",
          caseSensitive: true,
          deadKeyShift: false,
          stages: [
            { target: "café", instruction: "Escreva a palavra café.", hint: "Pressione ´ sem Shift e depois e." },
            { target: "jacaré", instruction: "Escreva a palavra jacaré.", hint: "Pressione ´ sem Shift e depois e." },
            { target: "irmã", instruction: "Escreva a palavra irmã.", hint: "Pressione ~ sem Shift e depois a." },
            { target: "maçã", instruction: "Escreva a palavra maçã.", hint: "Digite ç na tecla própria. Para ã, pressione ~ sem Shift e depois a." },
            { target: "o jacaré come maçã", instruction: "Complete a frase com o jacaré e a maçã.", hint: "Prepare o agudo em jacaré e o til em maçã. As letras desta frase são minúsculas.", deadKeyShift: false }
          ]
        },
        {
          title: "Acentos com Shift · minúsculas",
          instruction: "Agora prepare o circunflexo usando Shift. Depois, solte Shift para escrever a vogal minúscula.",
          hint: "A tecla ~ fica à direita do Ç. Com Shift, ela produz ^. Pressione Shift+^, solte Shift e digite a vogal minúscula.",
          kind: "typing-sequence",
          caseSensitive: true,
          deadKeyShift: true,
          stages: [
            { target: "você", instruction: "Escreva você.", hint: "Para ê, pressione Shift+^ e depois e minúsculo." },
            { target: "avô", instruction: "Escreva avô.", hint: "Para ô, pressione Shift+^ e depois o minúsculo." },
            { target: "câmera", instruction: "Escreva câmera.", hint: "Para â, pressione Shift+^ e depois a minúsculo." },
            { target: "pêssego", instruction: "Escreva pêssego.", hint: "Para ê, pressione Shift+^ e depois e minúsculo." },
            { target: "o avô vê a câmera", instruction: "Complete a frase sobre o avô e a câmera.", hint: "Prepare ^ com Shift para cada circunflexo; solte Shift antes de digitar a vogal minúscula." }
          ]
        },
        {
          title: "Acentos sem Shift · maiúsculas",
          instruction: "Prepare o agudo sem Shift. Em seguida, use Shift na vogal para formar a letra maiúscula acentuada.",
          hint: "Primeiro pressione ´ sem Shift. Depois, segure Shift e pressione a vogal: ´ + Shift+A forma Á.",
          kind: "typing-sequence",
          caseSensitive: true,
          deadKeyShift: false,
          shiftLetters: true,
          stages: [
            { target: "Árvore", instruction: "Escreva Árvore com a primeira letra maiúscula e acentuada.", hint: "Pressione ´ sem Shift. Depois, Shift+A forma Á." },
            { target: "Érica", instruction: "Escreva o nome Érica.", hint: "Pressione ´ sem Shift. Depois, Shift+E forma É." },
            { target: "Índia", instruction: "Escreva Índia.", hint: "Pressione ´ sem Shift. Depois, Shift+I forma Í." },
            { target: "Óscar", instruction: "Escreva o nome Óscar.", hint: "Pressione ´ sem Shift. Depois, Shift+O forma Ó." },
            { target: "Úrsula", instruction: "Escreva o nome Úrsula.", hint: "Pressione ´ sem Shift. Depois, Shift+U forma Ú." },
            { target: "Árvore alta", instruction: "Complete a expressão Árvore alta.", hint: "Apenas a primeira letra da expressão é maiúscula. Prepare ´ sem Shift e use Shift+A." }
          ]
        },
        {
          title: "Acentos com Shift · maiúsculas",
          instruction: "Use Shift para preparar o circunflexo e novamente para escrever a vogal maiúscula.",
          hint: "Pressione Shift+^ para preparar o circunflexo. Depois, mantenha Shift e pressione a vogal maiúscula.",
          kind: "typing-sequence",
          caseSensitive: true,
          deadKeyShift: true,
          shiftLetters: true,
          stages: [
            { target: "Ângela", instruction: "Escreva o nome Ângela.", hint: "Pressione Shift+^ e depois mantenha Shift para digitar A." },
            { target: "Ênio", instruction: "Escreva o nome Ênio.", hint: "Pressione Shift+^ e depois mantenha Shift para digitar E." },
            { target: "Ônibus", instruction: "Escreva a palavra Ônibus.", hint: "Pressione Shift+^ e depois mantenha Shift para digitar O." },
            { target: "Ângela pega o ônibus.", instruction: "Complete a frase Ângela pega o ônibus.", hint: "Use Shift+^ e Shift+A para Â. No fim, o ô de ônibus é minúsculo: prepare ^ com Shift e solte antes de digitar o." }
          ]
        },
        {
          title: "Misturando acentos e símbolos",
          instruction: "Use as letras, os números, os acentos e os sinais aprendidos para escrever frases completas.",
          hint: "Lembre-se: ´ e ~ são preparados sem Shift; ^ é preparado com Shift; ! usa Shift+1; & usa Shift+7; + usa Shift+=. O desenho destaca a próxima tecla e o Shift necessário.",
          kind: "typing-sequence",
          caseSensitive: true,
          stages: [
            { target: "O sapo tem 2 maçãs!", instruction: "Digite a frase sobre o sapo e as maçãs.", hint: "Use Shift no O inicial, prepare ~ sem Shift para ã e use Shift+1 para !.", shiftLetters: true, symbolCodes: { "!": "Digit1" }, requireShiftSymbols: true },
            { target: "Café, maçã e pêssego.", instruction: "Escreva os nomes das três frutas separados por vírgula.", hint: "Agudo e til sem Shift; circunflexo com Shift. Vírgula e ponto sem Shift.", deadKeyShift: false, requireNoShiftSymbols: true },
            { target: "2 + 1 = 3 bananas.", instruction: "Complete a conta das bananas.", hint: "Use Shift+= para +. O sinal =, os números e o ponto são digitados sem Shift.", symbolCodes: { "+": "Equal" }, requireShiftSymbols: true, requireNoShiftSymbols: true },
            { target: "FRUTAS & ANIMAIS", instruction: "Finalize com o título FRUTAS & ANIMAIS.", hint: "Use Shift em todas as letras maiúsculas e Shift+7 para &.", shiftLetters: true, symbolCodes: { "&": "Digit7" }, requireShiftSymbols: true }
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
      scene: "https://www.mezunian.com/wp-content/uploads/2020/05/donkey-kong-country-2-diddys-kong-quest-bramble-scramble-bramble-wall-near-start.png?m=1701871908",
      characters: [
        { src: "https://static.wikia.nocookie.net/donkeykong/images/7/7b/Squawks_-_DKC2.gif/revision/latest?cb=20190113015723", alt: "Squawks, o papagaio", credit: "Donkey Kong Wiki" },
        { src: "https://static.wikia.nocookie.net/donkeykong/images/8/8e/Krusha_4.png/revision/latest?cb=20190503205924&path-prefix=pt", alt: "Krusha", credit: "Donkey Kong Wiki" },
        { src: "https://snesmaps.com/maps/DonkeyKongCountry/sprites/Necky.png", alt: "Necky", credit: "SNESMaps" },
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
