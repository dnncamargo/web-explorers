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
      intro: "Vamos acordar o jardim colocando a mão esquerda na posição-base.",
      guide: "A mão esquerda repousa em A, S, D e F. O polegar alcança a barra de espaço. Depois de cada tecla, volte com os dedos para casa.",
      taughtKeys: leftHomeKeys,
      checkpoints: [
        { target: "ASDF", instruction: "Use os quatro dedos da mão esquerda, um de cada vez.", hint: "Comece no dedo mínimo em A e avance até o indicador em F." },
        { target: "FDSA", instruction: "Percorra as mesmas teclas de volta à posição-base.", hint: "Comece pelo indicador em F e volte até A." },
        { target: "ASAS", instruction: "Alterne entre as teclas A e S.", hint: "A fica sob o dedo mínimo; S fica sob o dedo anelar." },
        { target: "DFDF", instruction: "Alterne entre D e F sem pressa.", hint: "D fica sob o dedo médio; F fica sob o indicador." },
        { target: "A FADA ASSA", instruction: "Leia a frase e use apenas a fileira-base esquerda.", hint: "Use A, F, D, S e a barra de espaço para escrever A FADA ASSA." },
        { target: "FADA ASSA FADA", instruction: "Checkpoint 6: digite três palavras, mantendo a mão esquerda na posição-base.", hint: "Digite FADA, espaço, ASSA, espaço, FADA. Use somente A, S, D, F e espaço." },
        { target: "A FADA ASSA FADA", instruction: "Checkpoint 7: conclua o jardim com uma frase mais longa usando a fileira-base esquerda.", hint: "Use apenas A, S, D, F e o polegar na barra de espaço." },
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
      guide: "Você já conhece A, S, D e F na mão esquerda. Agora, a mão direita repousa em J, K, L e Ç. O indicador fica em J; o polegar também alcança a barra de espaço. Volte à posição-base depois de cada tecla.",
      taughtKeys: taughtBaseKeys,
      checkpoints: [
        { target: "JKLÇ", instruction: "Caminhe pelas quatro teclas da mão direita.", hint: "Comece no indicador em J e termine no dedo mínimo em Ç." },
        { target: "ÇLKJ", instruction: "Volte pelas teclas até a posição-base.", hint: "Comece pelo dedo mínimo em Ç e retorne até J." },
        { target: "JKJK", instruction: "Alterne entre J e K.", hint: "J usa o indicador; K usa o dedo médio." },
        { target: "FADA FALA", instruction: "Combine as duas mãos sem sair da fileira-base.", hint: "As letras da mão esquerda foram ensinadas no primeiro mundo; pratique FADA FALA." },
        { target: "A FADA FALA", instruction: "Leia a frase curta usando somente a fileira-base.", hint: "Combine A, F e D da esquerda com L da direita e use os espaços." },
        { target: "FALA DA SALA", instruction: "Checkpoint 6: combine as duas mãos em uma sequência de palavras maior.", hint: "Use somente as teclas já aprendidas nas duas mãos e o espaço." },
        { target: "A FADA FALA DA SALA", instruction: "Checkpoint 7: digite a frase completa, retornando à posição-base entre os movimentos.", hint: "Todas as letras pertencem às teclas A, S, D, F e J, K, L, Ç." },
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
      taughtKeys: [...fullHomeRowKeys, ...upperKeys, ...lowerKeys],
      checkpoints: [
        { target: "ASDF JKLÇ", instruction: "Prepare as duas mãos na posição-base.", hint: "Esquerda: A S D F. Direita: J K L Ç. O espaço fica sob os polegares." },
        { target: "QWERT YUIOP", instruction: "Suba os dedos até a fileira superior e retorne à base.", hint: "A fileira superior foi apresentada no mapa do teclado. Siga da esquerda para a direita." },
        { target: "ZXCV BNM", instruction: "Desça os dedos até a fileira inferior e retorne à base.", hint: "A fileira inferior foi apresentada no mapa. O espaço separa os grupos das mãos." },
        { target: "CASA SAPO VIDA", instruction: "Digite as palavras usando as fileiras que você conheceu.", hint: "Todas as letras de CASA, SAPO e VIDA apareceram no mapa do teclado." },
        { target: "A FOCA PULA", instruction: "Ajude a foca a pular com uma frase curta.", hint: "Digite A, espaço, FOCA, espaço e PULA." },
        { target: "A FOCA LEVA O SAPO", instruction: "Checkpoint 6: combine letras das três fileiras em uma frase maior.", hint: "Alterne a fileira-base com as fileiras superior e inferior, retornando à base." },
        { target: "O SAPO VAI PARA CASA", instruction: "Checkpoint 7: complete uma frase ainda mais longa combinando as três fileiras.", hint: "Observe a próxima tecla e use a barra de espaço entre as palavras." },
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
      taughtKeys: [...fullHomeRowKeys, ...upperKeys, ...lowerKeys],
      checkpoints: [
        { target: "A FOCA PULA", instruction: "Leia uma frase curta que combina as três fileiras.", hint: "Mova os dedos entre a posição-base e as fileiras superior e inferior." },
        { target: "O SAPO VAI PARA CASA", instruction: "Pratique outra frase com letras das três fileiras.", hint: "As teclas novas aparecem no mapa antes dos exercícios deste mundo." },
        { target: "A FOCA LEVA O SAPO", instruction: "Continue combinando movimentos de todas as fileiras.", hint: "Volte à posição-base sempre que mudar de região do teclado." },
        { target: "YOSHI PULA NA CASA", instruction: "Escreva a frase usando as três fileiras.", hint: "Olhe a próxima tecla, mova o dedo e depois retorne à base." },
        { target: "O YOSHI PULA COM A FOCA", instruction: "Encerre o quinto desafio com uma frase que combina o teclado todo.", hint: "Use os espaços entre as palavras. Não há cronômetro." },
        { target: "A FOCA LEVA O SAPO PARA CASA", instruction: "Checkpoint 6: digite uma frase maior, alternando as três fileiras do teclado.", hint: "A frase usa letras da fileira superior, da base e da fileira inferior." },
        { target: "YOSHI E A FOCA PULAM PARA CASA", instruction: "Checkpoint 7: finalize o bônus com a frase mais longa desta aventura.", hint: "Combine as três fileiras e mantenha o ritmo sem pressa." },
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
