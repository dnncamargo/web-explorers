(function (global) {
  const homeKeys = ["a", "s", "d", "f", "j", "k", "l", "ç", " "];
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
      intro: "Vamos acordar o jardim colocando a mão esquerda na posição-base.",
      guide: "A mão esquerda repousa em A, S, D e F. O polegar alcança a barra de espaço. Depois de cada tecla, volte com os dedos para casa.",
      taughtKeys: ["a", "s", "d", "f", " "],
      checkpoints: [
        { target: "ASDF", instruction: "Use os quatro dedos da mão esquerda, um de cada vez.", hint: "Comece no dedo mínimo em A e avance até o indicador em F." },
        { target: "FDSA", instruction: "Percorra as mesmas teclas de volta à posição-base.", hint: "Comece pelo indicador em F e volte até A." },
        { target: "ASAS", instruction: "Alterne entre as teclas A e S.", hint: "A fica sob o dedo mínimo; S fica sob o dedo anelar." },
        { target: "DFDF", instruction: "Alterne entre D e F sem pressa.", hint: "D fica sob o dedo médio; F fica sob o indicador." },
        { target: "ASDF FDSA", instruction: "Faça o caminho de ida, use o espaço e retorne.", hint: "O polegar toca a barra de espaço entre as duas sequências." },
      ],
    },
    2: {
      id: 2,
      name: "Forest Path",
      title: "Trilha da Floresta",
      theme: "forest",
      file: "02-forest-path.html",
      track: "tGukyQ10nlA",
      intro: "As frutas estão na trilha. Agora vamos conhecer a posição-base da mão direita.",
      guide: "A mão direita repousa em J, K, L e Ç. O indicador fica em J; o polegar também alcança a barra de espaço. Volte à posição-base depois de cada tecla.",
      taughtKeys: ["j", "k", "l", "ç", " "],
      checkpoints: [
        { target: "JKLÇ", instruction: "Caminhe pelas quatro teclas da mão direita.", hint: "Comece no indicador em J e termine no dedo mínimo em Ç." },
        { target: "ÇLKJ", instruction: "Volte pelas teclas até a posição-base.", hint: "Comece pelo dedo mínimo em Ç e retorne até J." },
        { target: "JKJK", instruction: "Alterne entre J e K.", hint: "J usa o indicador; K usa o dedo médio." },
        { target: "LÇLÇ", instruction: "Alterne entre L e Ç.", hint: "L usa o anelar; Ç usa o dedo mínimo." },
        { target: "JKLÇ ÇLKJ", instruction: "Percorra as teclas, use espaço e retorne.", hint: "Use o polegar na barra de espaço entre as duas sequências." },
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
      intro: "Os cristais guardam caminhos novos. Kamek tem uma mensagem rápida.",
      guide: "A posição-base continua em A S D F e J K L Ç. Veja as fileiras de cima e de baixo: mova os dedos até a tecla indicada e retorne à base.",
      taughtKeys: [...homeKeys, ...upperKeys, ...lowerKeys],
      checkpoints: [
        { target: "ASDF JKLÇ", instruction: "Prepare as duas mãos na posição-base.", hint: "Esquerda: A S D F. Direita: J K L Ç. O espaço fica sob os polegares." },
        { target: "QWERT YUIOP", instruction: "Suba os dedos até a fileira superior e retorne à base.", hint: "A fileira superior foi apresentada no mapa do teclado. Siga da esquerda para a direita." },
        { target: "ZXCV BNM", instruction: "Desça os dedos até a fileira inferior e retorne à base.", hint: "A fileira inferior foi apresentada no mapa. O espaço separa os grupos das mãos." },
        { target: "CASA SAPO VIDA", instruction: "Digite as palavras usando as fileiras que você conheceu.", hint: "Todas as letras de CASA, SAPO e VIDA apareceram no mapa do teclado." },
        { target: "A FOCA PULA", instruction: "Ajude a foca a pular com uma frase curta.", hint: "Digite A, espaço, FOCA, espaço e PULA." },
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
      guide: "Você já conhece as fileiras e a posição-base. Continue usando os dedos orientados e o polegar para os espaços.",
      taughtKeys: [...homeKeys, ...upperKeys, ...lowerKeys],
      checkpoints: [
        { target: "ASASDASDFFDFDSFDSA", instruction: "Faça uma sequência longa com a mão esquerda.", hint: "Use A, S, D e F. As cores mostram a orientação de dedos." },
        { target: "JKJKLJKLÇÇLÇLKÇLKJ", instruction: "Faça uma sequência longa com a mão direita.", hint: "Use J, K, L e Ç. Volte à posição-base quando quiser." },
        { target: "QWERT ZXCV", instruction: "Combine as fileiras superior e inferior.", hint: "Digite QWERT, espaço, ZXCV." },
        { target: "PATO LIVRO CAVALO", instruction: "Digite os nomes dos animais e do livro.", hint: "P, A, T, O, L, I, V, R e C foram apresentados nos mundos anteriores." },
        { target: "A FOCA PULA NA SALA", instruction: "Complete a brincadeira com uma frase.", hint: "Use espaços entre as palavras. Não há cronômetro." },
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
