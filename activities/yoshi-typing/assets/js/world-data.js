(function (global) {
  const leftHomeKeys = ["a", "s", "d", "f", " "];
  const rightHomeKeys = ["j", "k", "l", "ç"];
  const taughtBaseKeys = [...leftHomeKeys, ...rightHomeKeys];
  const fullHomeRowKeys = ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ç", " "];
  const upperKeys = [..."qwertyuiop"];
  const lowerKeys = [..."zxcvbnm"];

  const worlds = {
    1: {
      id: 1,
      name: "Flower Garden",
      title: "Jardim das Flores",
      theme: "flower",
      file: "01-flower-garden.html",
      track: "tGukyQ10nlA",
      intro: "Vamos acordar o jardim usando as duas mãos na posição-base e o espaço com os polegares.",
      guide: "A mão esquerda repousa em A, S, D e F; a direita, em J, K, L e Ç. Use os polegares na barra de espaço e retorne à posição-base depois de cada movimento.",
      taughtKeys: taughtBaseKeys,
      checkpoints: [
        { target: "ASDF JKLÇ ASDF JKLÇ", instruction: "Pratique as duas mãos na posição-base, alternando entre esquerda e direita.", hint: "Use A, S, D, F com a esquerda; J, K, L, Ç com a direita. Separe os grupos com espaço." },
        { target: "ASDF FDSA JKLÇ ÇLKJ ASDF", instruction: "Alterne os sentidos dos dedos e volte à posição-base.", hint: "Complete cada grupo antes de passar ao próximo." },
        { target: "FADA FALA DA SALA FADA FALA", instruction: "Leia a sequência de palavras usando dedos das duas mãos.", hint: "Todas as letras pertencem à fileira-base ensinada neste mundo." },
        { target: "ASDF JKLÇ FDSA ÇLKJ ASDF JKLÇ", instruction: "Combine movimentos de ida e volta das duas mãos em uma sequência longa.", hint: "Siga grupo por grupo e use o espaço para separar os movimentos." },
        { target: "A FADA FALA DA SALA FADA FALA", instruction: "Digite a frase completa mantendo os dedos próximos à posição-base.", hint: "Observe a próxima tecla e use o polegar para cada espaço." },
        { target: "ASDF FDSA JKLÇ ÇLKJ ASDF FDSA JKLÇ", instruction: "Alterne entre as duas mãos várias vezes antes de terminar.", hint: "Não acelere: confira a próxima tecla e a cor do dedo recomendado." },
        { target: "A FADA FALA DA SALA ASDF JKLÇ FADA", instruction: "Misture uma frase com sequências das duas mãos.", hint: "A frase usa somente A, S, D, F, J, K, L, Ç e espaço." },
        { target: "ASDF JKLÇ FDSA ÇLKJ ASDF JKLÇ FDSA", instruction: "Repita os grupos em ordens diferentes sem perder a posição-base.", hint: "Use a orientação visual para alternar os dedos de cada mão." },
        { target: "A FADA FALA DA SALA ASDF JKLÇ FDSA ÇLKJ", instruction: "Combine a frase com movimentos de ida e volta pelas duas mãos.", hint: "Leia tudo antes de começar e acompanhe a tecla destacada." },
        { target: "ASDF FDSA JKLÇ ÇLKJ ASDF JKLÇ A FADA FALA DA SALA", instruction: "Desafio final do jardim: coordene as duas mãos e conclua com uma frase longa.", hint: "Divida a sequência em grupos, use o espaço com os polegares e não tenha pressa." },
      ],
    },
    2: {
      id: 2,
      name: "Forest Path",
      title: "Trilha da Floresta",
      theme: "forest",
      file: "02-forest-path.html",
      track: "UKP3kPtweio",
      intro: "A trilha segue para a floresta. Vamos revisar as duas mãos e explorar a fileira superior.",
      guide: "Você já conhece A, S, D, F, J, K, L e Ç. Agora acrescente G e H na fileira-base e Q, W, E, R, T, Y, U, I, O e P na fileira superior. Use o espaço com os polegares e retorne à posição-base.",
      taughtKeys: [...fullHomeRowKeys, ...upperKeys],
      checkpoints: [
        { target: "ASDFGH JKLÇ ASDFGH", instruction: "Revise a fileira-base completa, incluindo G e H.", hint: "G usa o indicador esquerdo; H usa o indicador direito." },
        { target: "QWERTY UIOP QWERTY", instruction: "Percorra a fileira superior em grupos, voltando ao início.", hint: "Siga da esquerda para a direita em Q W E R T Y U I O P." },
        { target: "ASDFGH JKLÇ QWERTY UIOP", instruction: "Combine a fileira-base com a superior e volte à posição-base.", hint: "Use os dedos correspondentes às cores das teclas." },
        { target: "POIUYTREWQ ASDFGH JKLÇ", instruction: "Alterne a direção na fileira superior e depois retorne à base.", hint: "A primeira sequência percorre a fileira superior de volta." },
        { target: "O GATO PULA PARA O ALTO", instruction: "Escreva uma frase usando as duas fileiras ensinadas.", hint: "As palavras combinam letras da fileira-base e da superior." },
        { target: "A TARTARUGA PULA PARA O LAGO", instruction: "Digite uma frase maior sem sair das fileiras já aprendidas.", hint: "Observe G, T, R e U e retorne à base entre movimentos." },
        { target: "O GATO QUER OLHAR PARA O PAPAGAIO", instruction: "Alterne as duas mãos enquanto escreve uma frase mais longa.", hint: "A frase usa somente letras da fileira-base, da superior e espaço." },
        { target: "A TARTARUGA QUER OLHAR PARA O GATO", instruction: "Pratique mais uma frase longa, combinando letras frequentes.", hint: "Olhe a próxima tecla e mantenha o ritmo confortável." },
        { target: "O PAPAGAIO OLHA A TARTARUGA E O GATO", instruction: "Coordene as duas fileiras durante uma frase completa.", hint: "Todas as letras necessárias já foram apresentadas no teclado." },
        { target: "O GATO QUER OLHAR PARA O PAPAGAIO E A TARTARUGA", instruction: "Desafio final da floresta: escreva uma frase longa com a fileira-base e a superior.", hint: "Use os espaços com os polegares e acompanhe uma tecla por vez." },
      ],
    },
    3: {
      id: 3,
      name: "Crystal Caves",
      title: "Cavernas de Cristal",
      theme: "crystal",
      file: "03-crystal-caves.html",
      track: "IJy7jK-TM40",
      storyTrack: "BEP3rdTy0-o",
      intro: "As cavernas pedem precisão. Kamek tem uma mensagem rápida antes de você praticar sequências e frases mais longas.",
      guide: "Você já conhece a fileira-base completa e a fileira superior. Agora pratique a mesma faixa de teclas com combinações mais longas e frases diferentes. O bônus apresentará a fileira inferior.",
      taughtKeys: [...fullHomeRowKeys, ...upperKeys],
      checkpoints: [
        { target: "QWERTY UIOP ASDFGH JKLÇ", instruction: "Revise as duas fileiras em uma sequência que começa em cima e volta à base.", hint: "Use todas as teclas da fileira superior e a fileira-base completa." },
        { target: "O GATO PULA PARA O ALTO", instruction: "Escreva uma frase usando as duas fileiras já conhecidas.", hint: "Observe a posição de cada tecla e separe as palavras com espaço." },
        { target: "A TARTARUGA PULA PARA O LAGO", instruction: "Coordene as mãos enquanto alterna letras frequentes.", hint: "A frase usa apenas fileira-base, fileira superior e espaço." },
        { target: "O PAPAGAIO PULA PARA O TOPO", instruction: "Pratique uma frase com repetições de vogais e consoantes.", hint: "Use o dedo recomendado para cada tecla e retorne à base." },
        { target: "O GATO OLHA O PAPAGAIO", instruction: "Escreva a frase sem perder a posição das duas mãos.", hint: "Olhe para a próxima tecla antes de pressioná-la." },
        { target: "A TARTARUGA OLHA O PAPAGAIO", instruction: "Digite uma frase maior, mantendo o ritmo.", hint: "O espaço separa as palavras; use os polegares." },
        { target: "O PAPAGAIO OLHA A TARTARUGA", instruction: "Alterne entre palavras que exigem movimentos diferentes.", hint: "Todas as letras estão na fileira-base ou na fileira superior." },
        { target: "O GATO QUER OLHAR PARA O PAPAGAIO", instruction: "Combine leitura e coordenação em uma frase longa.", hint: "Siga a próxima tecla destacada e volte à base quando necessário." },
        { target: "A TARTARUGA QUER OLHAR PARA O GATO", instruction: "Pratique outra frase longa usando as mesmas fileiras.", hint: "Não há cronômetro; priorize precisão e conforto." },
        { target: "O PAPAGAIO OLHA A TARTARUGA E O GATO", instruction: "Desafio final das cavernas: termine a frase sem sair das duas fileiras ensinadas.", hint: "Todas as letras foram trabalhadas nos checkpoints anteriores deste mundo." },
      ],
    },
    4: {
      id: 4,
      name: "Bonus Challenge",
      title: "Sala Secreta de Bônus",
      theme: "bonus",
      file: "04-bonus-challenge.html",
      track: "n6-JFDTC_nI",
      intro: "Este mundo é opcional. As estrelas esperam por quem quiser brincar mais.",
      guide: "Desafio opcional: use todas as letras do teclado, incluindo a fileira inferior, e separe cada palavra com a barra de espaço.",
      taughtKeys: [...fullHomeRowKeys, ...upperKeys, ...lowerKeys],
      checkpoints: [
        { target: "A ZEBRA E O CAVALO BRINCAM NO BOSQUE", instruction: "Misture as três fileiras em uma frase para abrir o desafio bônus.", hint: "Procure as letras de cada fileira e use espaço entre as palavras." },
        { target: "O JACARE VAI PARA A FLORESTA", instruction: "Continue combinando letras de todas as regiões do teclado.", hint: "A frase usa teclas da fileira superior, da base e da inferior." },
        { target: "O YOSHI QUER KIWI E XALE", instruction: "Pratique letras menos frequentes, sem sair da frase.", hint: "Observe especialmente Q, K, W, X e Y." },
        { target: "O CAÇADOR OBSERVA A ZEBRA", instruction: "Use também a tecla Ç no meio de uma frase completa.", hint: "A Ç é uma tecla própria do layout ABNT2; não é preciso usar acento." },
        { target: "A TARTARUGA E O GATO PULAM PARA O TOPO", instruction: "Alterne dedos das duas mãos e das três fileiras.", hint: "A frase inclui letras que não apareceram nos mundos obrigatórios." },
        { target: "O PAPAGAIO ESCREVE NO QUADRO", instruction: "Combine novas letras em uma frase com muitas mudanças de posição.", hint: "Procure Q, V, N e D no teclado e retorne à base quando possível." },
        { target: "A ZEBRA E O YOSHI BRINCAM COM O CAVALO NO BOSQUE", instruction: "Desafio final: pratique todas as letras do teclado ao longo da aventura bônus.", hint: "As frases do bônus, em conjunto, percorrem A–Z e Ç. Use o espaço e digite sem pressa." },
      ],
    },
  };

  const fingers = {
    a: "left-pinky", q: "left-pinky", z: "left-pinky",
    s: "left-ring", w: "left-ring", x: "left-ring",
    d: "left-middle", e: "left-middle", c: "left-middle",
    f: "left-index", r: "left-index", t: "left-index", g: "left-index", v: "left-index", b: "left-index",
    j: "right-index", y: "right-index", u: "right-index", h: "right-index", n: "right-index", m: "right-index",
    k: "right-middle", i: "right-middle",
    l: "right-ring", o: "right-ring",
    ç: "right-pinky", p: "right-pinky",
    " ": "thumb",
  };

  global.YoshiWorldData = { worlds, fingers };
})(window);
