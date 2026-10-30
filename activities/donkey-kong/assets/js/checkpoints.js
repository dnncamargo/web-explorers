(function (global) {
  const worlds = {
    jungle: {
      id: "jungle",
      number: 1,
      title: "A Selva dos Kongs",
      subtitle: "Treino de digitação · Teclado ABNT2",
      icon: "🌴",
      page: "jungle.html",
      track: "eAm9fk39c50",
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
      subtitle: "Seleção, edição e acentuação",
      icon: "🛢️",
      page: "mine.html",
      track: "cBK2YIrY62I",
      intro: "Use Shift, selecione trechos, apague, escreva símbolos e pratique os acentos.",
      guide: "Nesta mina, você vai selecionar letras e palavras com Shift e as setas, apagar com Backspace e escrever palavras com acentos. O campo de texto precisa estar focado para que as teclas atuem nele.",
      checkpoints: [
        { title: "O poder do Shift", instruction: "Digite DK! usando Shift para escrever as letras maiúsculas e o sinal de exclamação.", hint: "Segure Shift enquanto pressiona D e K. Para !, use a combinação que produz esse sinal no teclado ABNT2.", kind: "typing", target: "DK!", requireShift: true },
        { title: "Barris selecionados", instruction: "O cursor já está depois do D. Segure Shift e pressione ← uma vez para selecionar D. Depois, o cursor será posicionado depois do K: use Shift+← duas vezes para selecionar DK.", hint: "A seleção real aparece destacada no campo. Mantenha Shift pressionado enquanto usa a seta.", kind: "selection", source: "DK BANANA", stages: [
          { name: "Selecione D", caret: 1, direction: "ArrowLeft", presses: 1, start: 0, end: 1, expected: "D" },
          { name: "Selecione DK", caret: 2, direction: "ArrowLeft", presses: 2, start: 0, end: 2, expected: "DK" }
        ] },
        { title: "Abrindo caminho", instruction: "No texto DK BANANA DOS KONGS, selecione DK BANANA usando Shift+→. São nove pressões da seta para a direita, mantendo Shift.", hint: "Comece com o cursor antes do D. A seleção deve incluir o espaço entre DK e BANANA, mas não o espaço seguinte.", kind: "selection", source: "DK BANANA DOS KONGS", stages: [
          { name: "Selecione DK BANANA", caret: 0, direction: "ArrowRight", presses: 9, start: 0, end: 9, expected: "DK BANANA" }
        ] },
        { title: "Limpando a mina", instruction: "Primeiro, com o cursor depois do ponto de exclamação, use Backspace para apagá-lo. Depois, selecione KONG com Shift+End e apague a seleção com Backspace.", hint: "Backspace apaga o caractere que fica antes do cursor. Quando houver uma seleção, Backspace apaga todo o trecho selecionado.", kind: "edit-sequence", initial: "DK! KONG", stages: [
          { name: "Apague o ponto de exclamação", caret: 3, key: "Backspace", expected: "DK KONG", instruction: "O cursor está depois de !. Pressione Backspace uma vez." },
          { name: "Selecione e apague KONG", caret: 3, selectToEnd: true, expectedSelection: "KONG", key: "Backspace", expected: "DK ", instruction: "Com o cursor antes de KONG, segure Shift e pressione End. Depois, pressione Backspace." }
        ] },
        { title: "Símbolos dos barris", instruction: "Digite / e ? no campo. Use as teclas físicas ou a combinação que produz esses símbolos no seu ABNT2.", hint: "O resultado pode variar conforme o teclado e o método de entrada. Este exercício verifica os símbolos digitados, não presume uma combinação AltGr que ainda não foi confirmada em todos os Chromebooks.", kind: "typing", target: "/ ?" },
        { title: "A oficina de palavras", instruction: "Digite as três palavras com seus acentos: café, irmã e água.", hint: "Em muitas teclas ABNT2, o acento é uma tecla morta: pressione o acento e depois a vogal. A composição final é o que vale.", kind: "typing", target: "café irmã água" },
        { title: "A mensagem dos Kongs", instruction: "Revise a mensagem em três etapas: transforme o primeiro o em O; corrija a para à; troque ? por !.", hint: "Use Shift para a maiúscula e para !. Para à, use a tecla de acento grave e depois a vogal a. A seleção atual está destacada; digite a correção no lugar.", kind: "edit-sequence", initial: "os kongs chegaram a selva?", stages: [
          { name: "Comece com maiúscula", range: { type: "literal", value: "o", occurrence: 0 }, expected: "Os kongs chegaram a selva?", instruction: "O primeiro o está selecionado. Digite O usando Shift." },
          { name: "Acento grave", range: { type: "literal", value: "a", occurrence: 0, context: " a selva" }, expected: "Os kongs chegaram à selva?", instruction: "A letra a antes de selva está selecionada. Faça o acento grave e depois digite a." },
          { name: "Pontuação", range: { type: "literal", value: "?", occurrence: 0 }, expected: "Os kongs chegaram à selva!", instruction: "O ponto de interrogação está selecionado. Digite ! usando Shift." }
        ] }
      ]
    },
    camp: {
      id: "camp",
      number: 3,
      title: "O Acampamento dos Kongs",
      subtitle: "Navegação e atalhos de texto",
      icon: "⛺",
      page: "camp.html",
      track: "wxAZfLenfa0",
      intro: "Crie linhas, apague à frente, navegue pelo texto e use os atalhos de edição.",
      guide: "Agora você vai conhecer Enter, Delete e atalhos com Ctrl. As combinações serão praticadas dentro dos campos de texto, sem bloquear os atalhos do navegador fora deles.",
      checkpoints: [
        { title: "Uma nova linha", instruction: "O cursor está entre as palavras equipe e chegou. Pressione Enter para iniciar uma nova linha.", hint: "Enter cria uma quebra de linha. O texto esperado terá duas linhas.", kind: "native-edit", initial: "A equipe chegou", caret: 8, key: "Enter", expected: "A equipe\nchegou", actionLabel: "Inserir uma quebra de linha" },
        { title: "Apagando pela frente", instruction: "O cursor está entre K e !. Pressione Lupa (Launcher) + Backspace para apagar o caractere à direita.", hint: "Backspace sozinho apaga à esquerda. No Chromebook testado, Lupa + Backspace apaga à direita, como Delete.", kind: "native-edit", initial: "DK!", caret: 2, key: "Delete", expected: "DK", actionLabel: "Apagar pela frente" },
        { title: "A força do Ctrl", instruction: "No texto, use Ctrl+→ para avançar uma palavra, Ctrl+Shift+→ para selecionar a palavra seguinte e Ctrl+A para selecionar todo o texto.", hint: "O campo já posiciona o cursor antes de corre. A seleção deve ser feita com o teclado; não use o mouse para marcar o trecho.", kind: "navigation", source: "Diddy corre pela ilha", caret: 6 },
        { title: "Barris transportadores", instruction: "Use Ctrl+C para copiar BANANA e Ctrl+V para colar no destino. Depois, use Ctrl+X para recortar DK e Ctrl+V para colar depois de KONG.", hint: "Os campos de origem e destino usam a área de transferência nativa do navegador. Nenhum texto é copiado pelo aplicativo.", kind: "clipboard" },
        { title: "Voltando no tempo", instruction: "Digite ! no fim de DK KONG. Depois, use Ctrl+Z para desfazer e Ctrl+Shift+Z para refazer.", hint: "Esses atalhos funcionam quando o campo de texto está focado. O navegador mantém o histórico nativo de edição.", kind: "undo", initial: "DK KONG", expectedTyped: "DK KONG!", expectedUndo: "DK KONG", expectedRedo: "DK KONG!" },
        { title: "O recado do Cranky", instruction: "Primeiro, digite as maiúsculas acentuadas Á É Ê Õ Ú. Depois, corrija o recado: coloque maiúscula no início das duas frases, use à em chegaram à mina e termine a pergunta com !.", hint: "Para cada letra acentuada, pressione a tecla do acento e depois a vogal com Shift. O acento pode ser composto em duas teclas; confira o resultado no campo.", kind: "integrated", accents: "Á É Ê Õ Ú", initial: "os kongs\nchegaram a mina?\ntraga bananas!", expected: "Os kongs\nchegaram à mina!\nTraga bananas!" }
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
