(function (global) {
  const COLORS = {
    red: "#ef3838", blue: "#25a5e8", yellow: "#ffd34f",
    green: "#63bd53", purple: "#8953d8", pink: "#ec70bd",
    orange: "#f28a3c", black: "#334139"
  };
  const SHAPES = {
    circle: "●", triangle: "▲", square: "■",
    diamond: "◆", star: "★", pentagon: "⬟",
    rectangle: "▬", heart: "♥"
  };
  const ARROWS = { up: "↑", down: "↓", left: "←", right: "→", "up-right": "↗", "down-right": "↘", "down-left": "↙", "up-left": "↖" };

  const worlds = [
    { id: "cores", number: 1, title: "Ateliê das Cores", icon: "🎨", color: "peach", subtitle: "Perceber cores, repetir padrões e pintar por uma legenda." },
    { id: "formas", number: 2, title: "Oficina das Formas", icon: "🔺", color: "blue", subtitle: "Reconhecer formas, comparar partes e descobrir composições." },
    { id: "numeros", number: 3, title: "Trilha dos Números", icon: "🔢", color: "yellow", subtitle: "Contar, comparar quantidades e resolver pequenas operações." },
    { id: "regras", number: 4, title: "Jardim das Regras", icon: "🧩", color: "green", subtitle: "Observar setas, comparar composições e seguir regras cada vez mais complexas." },
    { id: "posicoes", number: 5, title: "Mapa dos Caminhos", icon: "🧭", color: "purple", subtitle: "Seguir direções, localizar lugares e completar quadros." },
    { id: "combinacoes", number: 6, title: "Estação das Combinações", icon: "🟣", color: "pink", subtitle: "Juntar características e comparar proporções." },
    { id: "letras-sons", number: 7, title: "Cabana dos Sinais e Sons", icon: "🔔", color: "mint", subtitle: "Observar letras como formas e reconhecer padrões sonoros." }
  ];

  const tasks = [
    { id: "cores-01", world: "cores", number: 1, kind: "pattern", icon: "🔴", title: "Qual cor vem depois?", prompt: "Observe as cores. Qual delas completa o padrão?", sequence: ["red", "blue", "red", "blue", null], options: ["yellow", "red", "blue"], answer: "red" },
    { id: "cores-02", world: "cores", number: 2, kind: "paint", icon: "🖌️", title: "Pinte pela legenda", prompt: "Escolha a cor indicada por cada número e pinte todos os círculos.", legend: [{ number: 1, color: "red" }, { number: 2, color: "blue" }, { number: 3, color: "yellow" }], targets: [1, 2, 3, 1, 3, 2] },
    { id: "cores-03", world: "cores", number: 3, kind: "pattern", icon: "🌈", title: "Repita a sequência", prompt: "Observe o padrão de três cores. Qual cor aparece no próximo espaço?", sequence: ["red", "yellow", "green", "red", "yellow", null], options: ["blue", "green", "red"], answer: "green" },
    { id: "cores-04", world: "cores", number: 4, kind: "pattern", icon: "🔁", title: "Complete a volta das cores", prompt: "Observe o ciclo de três cores. Qual cor completa a volta?", sequence: ["red", "blue", "yellow", "red", "blue", null], options: ["purple", "yellow", "green", "red"], answer: "yellow" },
    { id: "cores-05", world: "cores", number: 5, kind: "color-matrix", icon: "▦", title: "Descubra o quadro de cores", prompt: "Observe como as cores mudam de lugar em cada linha. Qual cor completa o quadro?", grid: ["red", "blue", "yellow", "blue", "yellow", "red", "yellow", "red", null], options: ["green", "blue", "purple", "red"], answer: "blue" },
    { id: "cores-06", world: "cores", number: 6, kind: "paint", icon: "🖌️", title: "Pinte com quatro cores", prompt: "Use a paleta lateral. Descubra a cor de cada número e pinte todos os círculos.", legend: [{ number: 1, color: "red" }, { number: 2, color: "blue" }, { number: 3, color: "yellow" }, { number: 4, color: "purple" }], targets: [1, 3, 2, 4, 3, 1, 4, 2, 3] },

    { id: "formas-01", world: "formas", number: 1, kind: "shape-match", icon: "🔺", title: "Encontre a mesma combinação", prompt: "Observe a cor do cartão e a forma que aparece dentro dele. Encontre uma combinação igual.", target: "red-circle", options: ["blue-circle", "red-square", "red-circle"], answer: "red-circle" },
    { id: "formas-02", world: "formas", number: 2, kind: "connect-polygon", icon: "✏️", title: "Ligue as pontas", prompt: "Arraste começando no ponto que cresce. Ligue as pontas em ordem até fechar o pentágono. Depois conte quantas pontas existem.", points: [{ x: 180, y: 28 }, { x: 322, y: 132 }, { x: 268, y: 238 }, { x: 92, y: 238 }, { x: 38, y: 132 }], options: [3, 4, 5, 6], answer: 5 },
    { id: "formas-03", world: "formas", number: 3, kind: "pattern", icon: "🟠", title: "Forma e cor", prompt: "Observe a combinação de forma e cor. Qual combinação completa a sequência?", sequence: ["red-circle", "blue-square", "red-circle", "blue-square", null], options: ["blue-circle", "red-square", "red-circle"], answer: "red-circle" },
    { id: "formas-04", world: "formas", number: 4, kind: "pattern", icon: "🔺", title: "Qual forma vem depois?", prompt: "Observe a ordem das formas. Qual delas continua a sequência?", sequence: ["circle", "triangle", "square", "circle", "triangle", null], options: ["square", "pentagon", "star"], answer: "square" },
    { id: "formas-05-nested", world: "formas", number: 5, kind: "nested-shape-match", icon: "🪆", title: "Formas dentro de formas", prompt: "Observe as quatro formas, uma dentro da outra. Encontre outra figura com as mesmas formas e cores na mesma ordem.", targetLayers: [{ shape: "square", color: "green" }, { shape: "pentagon", color: "purple" }, { shape: "triangle", color: "yellow" }, { shape: "circle", color: "blue" }], options: [{ layers: [{ shape: "square", color: "green" }, { shape: "pentagon", color: "purple" }, { shape: "triangle", color: "yellow" }, { shape: "circle", color: "blue" }] }, { layers: [{ shape: "square", color: "green" }, { shape: "pentagon", color: "purple" }, { shape: "circle", color: "yellow" }, { shape: "triangle", color: "blue" }] }, { layers: [{ shape: "square", color: "green" }, { shape: "triangle", color: "purple" }, { shape: "pentagon", color: "yellow" }, { shape: "circle", color: "blue" }] }], answerIndex: 0 },
    { id: "formas-06-color-search", world: "formas", number: 6, kind: "shape-color-choice", icon: "🎯", title: "Encontre o pentágono roxo", prompt: "Observe o modelo. Entre as formas coloridas, encontre o pentágono da mesma cor.", targetShape: "pentagon", targetColor: "purple", options: [{ shape: "triangle", color: "blue" }, { shape: "square", color: "red" }, { shape: "circle", color: "yellow" }, { shape: "pentagon", color: "green" }, { shape: "star", color: "purple" }, { shape: "diamond", color: "orange" }, { shape: "triangle", color: "green" }, { shape: "pentagon", color: "blue" }, { shape: "circle", color: "red" }, { shape: "pentagon", color: "purple" }, { shape: "square", color: "yellow" }, { shape: "star", color: "blue" }, { shape: "diamond", color: "green" }, { shape: "pentagon", color: "orange" }], answerIndex: 9 },
    { id: "formas-07", world: "formas", number: 7, kind: "pattern", icon: "🌈", title: "Cor, forma e sequência", prompt: "Observe a repetição das combinações. Qual figura vem no espaço vazio?", sequence: ["red-circle", "blue-triangle", "yellow-square", "red-circle", "blue-triangle", null], options: ["green-circle", "yellow-square", "red-triangle"], answer: "yellow-square" },
    { id: "formas-08-sort", world: "formas", number: 8, kind: "shape-sort", icon: "🧺", title: "Separe as formas parecidas", prompt: "As formas estão misturadas. Arraste cada uma para o grupo da mesma forma: círculos, triângulos ou pentágonos.", zones: ["circle", "triangle", "pentagon"], items: [{ id: "shape-a", shape: "pentagon", color: "blue" }, { id: "shape-b", shape: "circle", color: "red" }, { id: "shape-c", shape: "triangle", color: "green" }, { id: "shape-d", shape: "pentagon", color: "yellow" }, { id: "shape-e", shape: "triangle", color: "blue" }, { id: "shape-f", shape: "circle", color: "orange" }, { id: "shape-g", shape: "circle", color: "purple" }, { id: "shape-h", shape: "pentagon", color: "pink" }, { id: "shape-i", shape: "triangle", color: "red" }, { id: "shape-j", shape: "circle", color: "blue" }, { id: "shape-k", shape: "pentagon", color: "green" }, { id: "shape-l", shape: "triangle", color: "purple" }] },
    { id: "formas-09-number-path", world: "formas", number: 9, kind: "number-path", icon: "🔢", title: "Ligue os números em ordem", prompt: "Comece no número 1. Arraste e ligue os pontos na ordem: 1, 2, 3, até chegar ao 9.", points: [{ value: 4, x: 60, y: 50 }, { value: 1, x: 180, y: 50 }, { value: 8, x: 300, y: 50 }, { value: 2, x: 60, y: 150 }, { value: 9, x: 180, y: 150 }, { value: 5, x: 300, y: 150 }, { value: 7, x: 60, y: 250 }, { value: 3, x: 180, y: 250 }, { value: 6, x: 300, y: 250 }] },

    { id: "numeros-01-frog", world: "numeros", number: 1, kind: "frog-jumps", icon: "🐸", title: "Conte os pulos do sapo", prompt: "Observe o sapo. Ele vai pular seis vezes. Conte cada pulo e escolha quantos foram.", jumpCount: 6, options: [4, 5, 6, 7, 8], answer: 6 },
    { id: "numeros-02-addition-steps", world: "numeros", number: 2, kind: "addition-series", icon: "➕", title: "Some +1, +2 e +3", prompt: "Resolva as somas. Primeiro some mais um, depois mais dois e por fim mais três.", emoji: "⭐", problems: [{"base":4,"increment":1,"answer":5,"options":[4,5,6]},{"base":2,"increment":1,"answer":3,"options":[2,3,4]},{"base":7,"increment":1,"answer":8,"options":[7,8,9]},{"base":3,"increment":2,"answer":5,"options":[4,5,6]},{"base":5,"increment":2,"answer":7,"options":[6,7,8]},{"base":6,"increment":2,"answer":8,"options":[7,8,9]},{"base":1,"increment":3,"answer":4,"options":[3,4,5]},{"base":4,"increment":3,"answer":7,"options":[6,7,8]},{"base":6,"increment":3,"answer":9,"options":[8,9,10]}] },
    { id: "numeros-03-group-sum", world: "numeros", number: 3, kind: "calculation", icon: "🧮", title: "Junte os grupos", prompt: "Conte os dois grupos de frutas. Junte tudo e escolha o total.", emoji: "🍎", leftCount: 4, operator: "+", rightCount: 3, options: [6, 7, 8], answer: 7 },
    { id: "numeros-04-fish-count", world: "numeros", number: 4, kind: "fish-crab-count", icon: "🐟", title: "Conte só os peixes", prompt: "Conte apenas os peixes. Os caranguejos estão aqui para confundir: queremos saber quantos peixes existem.", animals: ["crab", "fish", "fish", "crab", "fish", "crab", "fish", "fish", "crab", "fish", "fish", "crab"], targetAnimal: "fish", answer: 7, options: [6, 7, 8, 9] },
    { id: "numeros-05-apple-paint", world: "numeros", number: 5, kind: "apple-paint-count", icon: "🍎", title: "Pinte e conte as maçãs", prompt: "Toque em cada maçã para pintá-la. Quando todas estiverem coloridas, conte quantas maçãs você pintou.", appleCount: 8, appleColors: ["red", "yellow", "green", "red", "yellow", "green", "red", "yellow"], options: [7, 8, 9], answer: 8 },
    { id: "numeros-06-double-countdown", world: "numeros", number: 6, kind: "double-countdown", icon: "🔟", title: "Complete a contagem regressiva", prompt: "A contagem está diminuindo de um em um. Descubra os dois números que estão faltando.", sequence: [10, 9, null, 7, null, 5, 4, 3], missingIndexes: [2, 4], answers: [8, 6], options: [[7, 8, 9], [5, 6, 7]] },
    { id: "numeros-07-triple-sum", world: "numeros", number: 7, kind: "calculation", icon: "➕", title: "Some três grupos", prompt: "Conte os três grupos e junte as quantidades: cinco mais três mais quatro.", emoji: "🍐", terms: [5, 3, 4], operator: "+", options: [11, 12, 13], answer: 12 },
    { id: "numeros-08", world: "numeros", number: 8, kind: "pattern", icon: "🔟", title: "Conte de dois em dois", prompt: "Observe os números. Aumentam de dois em dois. Qual completa a sequência?", sequence: [1, 3, 5, 7, null], options: [8, 9, 10], answer: 9 },
    { id: "numeros-09-missing-addend", world: "numeros", number: 9, kind: "missing-addend", icon: "🧩", title: "Descubra o número que falta", prompt: "Seis mais um número formam dez. Qual número está faltando?", knownCount: 6, total: 10, options: [3, 4, 5], answer: 4 },

    { id: "regras-01-arrow-copy", world: "regras", number: 1, kind: "arrow-order", icon: "⬆️", title: "Copie a ordem das setas", prompt: "Observe as setas grandes. Depois, toque nas setas de baixo na mesma ordem.", sequence: [{ direction: "up", color: "red" }, { direction: "right", color: "blue" }, { direction: "down", color: "yellow" }, { direction: "left", color: "purple" }], choices: [{ id: "arrow-a", direction: "down", color: "green" }, { id: "arrow-b", direction: "up", color: "red" }, { id: "arrow-c", direction: "left", color: "orange" }, { id: "arrow-d", direction: "right", color: "blue" }, { id: "arrow-e", direction: "up", color: "pink" }, { id: "arrow-f", direction: "down", color: "yellow" }, { id: "arrow-g", direction: "right", color: "green" }, { id: "arrow-h", direction: "left", color: "purple" }] },
    { id: "regras-02-irregular-match", world: "regras", number: 2, kind: "complex-match", icon: "🪺", title: "Encontre a combinação igual", prompt: "Observe as formas diferentes, uma dentro da outra. Encontre a combinação que tem as mesmas três partes e cores.", targetLayers: [{ shape: "cloud", color: "orange" }, { shape: "leaf", color: "blue" }, { shape: "wave", color: "pink" }], options: [{ layers: [{ shape: "cloud", color: "orange" }, { shape: "leaf", color: "blue" }, { shape: "wave", color: "pink" }] }, { layers: [{ shape: "cloud", color: "orange" }, { shape: "leaf", color: "green" }, { shape: "wave", color: "pink" }] }, { layers: [{ shape: "cloud", color: "purple" }, { shape: "leaf", color: "blue" }, { shape: "wave", color: "pink" }] }, { layers: [{ shape: "cloud", color: "orange" }, { shape: "wave", color: "blue" }, { shape: "leaf", color: "pink" }] }], answerIndex: 0 },
    { id: "regras-03-diagonal-pattern", world: "regras", number: 3, kind: "pattern", icon: "↗️", title: "Continue as setas diagonais", prompt: "Observe a direção das setas diagonais. Qual seta continua o caminho?", sequence: ["red-up-right", "blue-down-right", "yellow-down-left", "purple-up-left", "red-up-right", null], options: ["green-up-right", "blue-down-right", "red-up-left", "yellow-down-left", "purple-up-left", "orange-down-right"], answer: "blue-down-right" },
    { id: "regras-04-opposite", world: "regras", number: 4, kind: "odd-one", icon: "🧭", title: "Encontre a seta diferente", prompt: "Observe as setas. Cinco apontam para a mesma direção. Toque na que aponta para o outro lado.", items: [{ value: "a", token: "red-up-right" }, { value: "b", token: "blue-up-right" }, { value: "c", token: "yellow-up-right" }, { value: "d", token: "purple-down-left" }, { value: "e", token: "green-up-right" }, { value: "f", token: "orange-up-right" }], answer: "d" },
    { id: "regras-05-color-direction", world: "regras", number: 5, kind: "pattern", icon: "🎨", title: "Cor e direção", prompt: "A cor e a direção das setas se repetem juntas. Qual combinação vem depois?", sequence: ["red-up-right", "blue-down-right", "red-up-right", "blue-down-right", null], options: ["green-up-right", "red-up-right", "blue-down-right", "yellow-down-left"], answer: "red-up-right" },
    { id: "regras-06-arrow-matrix", world: "regras", number: 6, kind: "matrix", icon: "▦", title: "Complete o quadro de setas", prompt: "Observe as cores e direções em cada linha. Qual seta completa o quadro?", grid: ["red-up-right", "blue-down-right", "yellow-down-left", "blue-down-right", "yellow-down-left", "red-up-right", "yellow-down-left", "red-up-right", null], options: ["green-up-left", "blue-down-right", "orange-up-right", "purple-down-left", "red-down-right"], answer: "blue-down-right" },
    { id: "regras-07-arrow-copy-plus", world: "regras", number: 7, kind: "arrow-order", icon: "🧭", title: "Copie um caminho maior", prompt: "Observe as seis setas coloridas. Depois, encontre e toque nas mesmas setas na ordem certa.", sequence: [{ direction: "up-right", color: "red" }, { direction: "down", color: "blue" }, { direction: "down-left", color: "yellow" }, { direction: "right", color: "green" }, { direction: "up-left", color: "purple" }, { direction: "down-right", color: "orange" }], choices: [{ id: "long-a", direction: "left", color: "pink" }, { id: "long-b", direction: "up-right", color: "red" }, { id: "long-c", direction: "down-left", color: "yellow" }, { id: "long-d", direction: "up", color: "orange" }, { id: "long-e", direction: "down", color: "blue" }, { id: "long-f", direction: "right", color: "green" }, { id: "long-g", direction: "up-left", color: "purple" }, { id: "long-h", direction: "down-right", color: "orange" }, { id: "long-i", direction: "left", color: "blue" }, { id: "long-j", direction: "down", color: "pink" }, { id: "long-k", direction: "up", color: "yellow" }, { id: "long-l", direction: "right", color: "red" }] },
    { id: "regras-08-sequence-match", world: "regras", number: 8, kind: "arrow-sequence-match", icon: "🧩", title: "Encontre o caminho igual", prompt: "Compare as cinco setas do modelo. Qual caminho tem as mesmas direções e cores na mesma ordem?", target: [{ direction: "up-right", color: "red" }, { direction: "right", color: "blue" }, { direction: "down-left", color: "yellow" }, { direction: "down", color: "green" }, { direction: "up-left", color: "purple" }], options: [
      [{ direction: "up-right", color: "red" }, { direction: "right", color: "blue" }, { direction: "down-left", color: "yellow" }, { direction: "down", color: "green" }, { direction: "up-left", color: "purple" }],
      [{ direction: "up-right", color: "red" }, { direction: "right", color: "blue" }, { direction: "down-left", color: "yellow" }, { direction: "up", color: "green" }, { direction: "up-left", color: "purple" }],
      [{ direction: "up-right", color: "red" }, { direction: "down", color: "blue" }, { direction: "down-left", color: "yellow" }, { direction: "down", color: "green" }, { direction: "up-left", color: "purple" }],
      [{ direction: "up-right", color: "red" }, { direction: "right", color: "blue" }, { direction: "down-left", color: "orange" }, { direction: "down", color: "green" }, { direction: "up-left", color: "purple" }]
    ], answerIndex: 0 },

    { id: "posicoes-01", world: "posicoes", number: 1, kind: "grid-position", icon: "🗺️", title: "Siga as setas", prompt: "Comece na pegada do centro. Siga as setas e toque no lugar onde você chegar.", grid: ["🏠", "🌳", "🏡", "🌼", "🐾", "🌻", "🏕️", "🌲", "🏡"], startIndex: 4, moves: ["up", "right"], answerIndex: 2 },
    { id: "posicoes-02", world: "posicoes", number: 2, kind: "position", icon: "⬆️", title: "Onde está a estrela?", prompt: "Observe a posição da estrela no quadro-modelo. Encontre a mesma posição.", target: "top-left", options: ["bottom-left", "top-left", "top-right"], answer: "top-left" },
    { id: "posicoes-03", world: "posicoes", number: 3, kind: "matrix", icon: "▦", title: "Complete o quadro", prompt: "Observe o que muda em cada linha e coluna. Qual peça está faltando?", grid: ["red-circle", "blue-circle", "red-square", null], options: ["blue-square", "red-triangle", "green-square"], answer: "blue-square" },

    { id: "combinacoes-01", world: "combinacoes", number: 1, kind: "pair", icon: "🟣", title: "Junte forma e cor", prompt: "Encontre a combinação com a mesma forma e a mesma cor do modelo.", target: "purple-triangle", options: ["purple-circle", "purple-triangle", "blue-triangle"], answer: "purple-triangle" },
    { id: "combinacoes-02", world: "combinacoes", number: 2, kind: "proportion", icon: "🧱", title: "Compare as partes", prompt: "Observe a proporção de cores no modelo. Escolha a pilha que mantém a mesma proporção.", model: ["red", "red", "blue", "blue"], options: [["red", "blue"], ["red", "red", "red", "blue"], ["blue", "blue", "blue", "red"]], answerIndex: 0 },
    { id: "combinacoes-03", world: "combinacoes", number: 3, kind: "pattern", icon: "🎭", title: "Duas características", prompt: "A sequência combina forma e cor. Qual combinação vem depois?", sequence: ["yellow-star", "purple-circle", "yellow-star", "purple-circle", null], options: ["purple-star", "yellow-circle", "yellow-star"], answer: "yellow-star" },

    { id: "letras-sons-01", world: "letras-sons", number: 1, kind: "letter-pattern", icon: "🔤", title: "Formas das letras", prompt: "Observe as letras como desenhos. Qual letra completa a sequência?", sequence: ["M", "A", "M", "A", null], options: ["M", "A", "N"], answer: "M" },
    { id: "letras-sons-02", world: "letras-sons", number: 2, kind: "letter-match", icon: "🅱️", title: "Encontre a igual", prompt: "Observe o desenho da letra. Toque na mesma letra entre as opções.", target: "B", options: ["P", "B", "D"], answer: "B" },
    { id: "letras-sons-03", world: "letras-sons", number: 3, kind: "sound-pattern", icon: "🔔", title: "Escute o padrão", prompt: "Toque para ouvir a sequência de sons. Depois escolha o desenho sonoro igual.", sound: ["low", "high", "low"], options: [["high", "low", "high"], ["low", "high", "low"], ["low", "low", "high"]], answerIndex: 1 }
  ];

  function spreadCorrectOptionPositions(items) {
    const cursors = Object.create(null);
    const preferred = {
      2: [0, 1],
      3: [0, 2, 1],
      4: [0, 3, 1, 2],
      5: [0, 4, 2, 1, 3],
      6: [1, 4, 0, 5, 2, 3],
      7: [0, 6, 3, 5, 1, 4, 2],
      8: [0, 7, 3, 6, 1, 5, 2, 4]
    };
    function rebalance(holder, forcedIndex) {
      if (!Array.isArray(holder.options) || !holder.options.length) return;
      const options = holder.options;
      const correctIndex = Number.isInteger(holder.answerIndex)
        ? holder.answerIndex
        : options.findIndex((option) => String(option) === String(holder.answer));
      if (correctIndex < 0 || correctIndex >= options.length) return;
      const length = options.length;
      const positions = preferred[length] || Array.from({ length }, (_, index) => index);
      const cursor = cursors[length] || 0;
      cursors[length] = cursor + 1;
      const targetIndex = Number.isInteger(forcedIndex)
        ? Math.max(0, Math.min(length - 1, forcedIndex))
        : positions[cursor % positions.length];
      if (targetIndex === correctIndex) return;
      const correctOption = options.splice(correctIndex, 1)[0];
      options.splice(targetIndex, 0, correctOption);
      if (Number.isInteger(holder.answerIndex)) holder.answerIndex = targetIndex;
    }
    items.forEach((task) => {
      if (task.kind === "addition-series" && Array.isArray(task.problems)) {
        task.problems.forEach((problem) => rebalance(problem));
      } else if (task.kind === "double-countdown" && Array.isArray(task.options)) {
        task.options.forEach((options, index) => {
          const holder = { options, answer: task.answers[index] };
          rebalance(holder);
          task.options[index] = holder.options;
        });
      } else {
        const forcedIndex = task.id === "numeros-05-apple-paint" ? 0
          : task.id === "numeros-07-triple-sum" ? 2
          : undefined;
        rebalance(task, forcedIndex);
      }
    });
  }
  spreadCorrectOptionPositions(tasks);

  global.CapiLogicGames = Object.freeze({ COLORS, SHAPES, ARROWS, worlds, tasks });
})(window);
