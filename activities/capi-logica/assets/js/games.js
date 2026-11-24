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
  const ARROWS = { up: "↑", down: "↓", left: "←", right: "→" };

  const worlds = [
    { id: "cores", number: 1, title: "Ateliê das Cores", icon: "🎨", color: "peach", subtitle: "Perceber cores, repetir padrões e pintar por uma legenda." },
    { id: "formas", number: 2, title: "Oficina das Formas", icon: "🔺", color: "blue", subtitle: "Reconhecer formas, comparar partes e descobrir composições." },
    { id: "numeros", number: 3, title: "Trilha dos Números", icon: "🔢", color: "yellow", subtitle: "Contar, comparar quantidades e resolver pequenas operações." },
    { id: "regras", number: 4, title: "Jardim das Regras", icon: "🧩", color: "green", subtitle: "Descobrir a regra, continuar sequências e encontrar diferenças." },
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
    { id: "formas-02", world: "formas", number: 2, kind: "side-count", icon: "⬟", title: "Quantos lados?", prompt: "Conte os lados desta forma e escolha a quantidade.", target: "pentagon", sides: 5, options: [3, 4, 5, 6], answer: 5 },
    { id: "formas-03", world: "formas", number: 3, kind: "pattern", icon: "🟠", title: "Forma e cor", prompt: "Observe a combinação de forma e cor. Qual combinação completa a sequência?", sequence: ["red-circle", "blue-square", "red-circle", "blue-square", null], options: ["blue-circle", "red-square", "red-circle"], answer: "red-circle" },

    { id: "numeros-01", world: "numeros", number: 1, kind: "count", icon: "🐸", title: "Conte os animais", prompt: "Conte os sapinhos e escolha o número que mostra quantos são.", emoji: "🐸", count: 5, options: [3, 4, 5, 6], answer: 5 },
    { id: "numeros-02", world: "numeros", number: 2, kind: "compare", icon: "🍎", title: "Onde há mais?", prompt: "Observe os dois grupos. Toque no grupo que tem mais elementos.", emoji: "🍎", leftCount: 3, rightCount: 5, answer: "right" },
    { id: "numeros-03", world: "numeros", number: 3, kind: "calculation", icon: "➕", title: "Junte as quantidades", prompt: "Conte as estrelas, junte os grupos e escolha o total.", emoji: "⭐", leftCount: 3, operator: "+", rightCount: 2, options: [4, 5, 6], answer: 5 },

    { id: "regras-01", world: "regras", number: 1, kind: "pattern", icon: "🔁", title: "Descubra a regra", prompt: "As formas se repetem na mesma ordem. Qual vem agora?", sequence: ["circle", "square", "circle", "square", null], options: ["triangle", "circle", "square"], answer: "circle" },
    { id: "regras-02", world: "regras", number: 2, kind: "odd-one", icon: "👀", title: "Quem está diferente?", prompt: "Três figuras seguem a mesma regra. Toque na figura diferente.", items: [{ value: "a", token: "green-circle" }, { value: "b", token: "green-circle" }, { value: "c", token: "purple-triangle" }, { value: "d", token: "green-circle" }], answer: "c" },
    { id: "regras-03", world: "regras", number: 3, kind: "pattern", icon: "➡️", title: "Continue o caminho", prompt: "Observe para onde as setas apontam. Qual é a próxima direção?", sequence: ["up", "right", "down", "up", "right", null], options: ["left", "down", "up"], answer: "down" },

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

  global.CapiLogicGames = Object.freeze({ COLORS, SHAPES, ARROWS, worlds, tasks });
})(window);
