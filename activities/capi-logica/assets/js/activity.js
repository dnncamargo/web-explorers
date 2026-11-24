(function (global) {
  const DATA = global.CapiLogicGames;
  const STORE = global.CapiLogicProgress;
  const CONFIG = global.CapiLogicConfig || { painterUrl: "" };
  const app = document.getElementById("app");
  if (!DATA || !STORE || !app) return;

  const loaded = STORE.load();
  let progress = loaded.progress;
  let storageMode = loaded.mode;
  let activeWorld = null;
  let activeTaskIndex = 0;
  let selectedColor = null;
  let painted = [];
  let audioContext = null;

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }
  function worldTasks(worldId) {
    return DATA.tasks.filter((task) => task.world === worldId);
  }
  function worldById(id) {
    return DATA.worlds.find((world) => world.id === id);
  }
  function currentTask() {
    const tasks = worldTasks(activeWorld);
    return tasks[activeTaskIndex] || null;
  }
  function save() {
    const result = STORE.save(progress, storageMode);
    storageMode = result.mode;
  }
  function updateStorageNotice() {
    const node = document.getElementById("storage-notice");
    if (node) node.textContent = storageMode === "memory"
      ? "O progresso ficará disponível somente enquanto esta página estiver aberta."
      : "Seu progresso é salvo neste navegador.";
  }
  function speak(text) {
    if (!("speechSynthesis" in global) || !text) return false;
    try {
      global.speechSynthesis.cancel();
      const utterance = new global.SpeechSynthesisUtterance(String(text));
      utterance.lang = "pt-BR";
      utterance.rate = 0.88;
      global.speechSynthesis.speak(utterance);
      return true;
    } catch { return false; }
  }
  function shapeGlyphHTML(shape) {
    return '<span class="shape-glyph shape-' + esc(shape) + '" aria-hidden="true"></span>';
  }
  function tokenHTML(value) {
    const key = String(value);
    if (DATA.COLORS[key]) return '<span class="token token-color ' + esc(key) + '" aria-label="cor"></span>';
    if (DATA.SHAPES[key]) return '<span class="token token-shape" aria-label="forma">' + shapeGlyphHTML(key) + '</span>';
    if (DATA.ARROWS[key]) return '<span class="token token-arrow" aria-label="direção">' + DATA.ARROWS[key] + '</span>';
    if (/^[A-Z]$/.test(key)) return '<span class="token token-letter">' + esc(key) + '</span>';
    const parts = key.split("-");
    if (parts.length === 2 && DATA.COLORS[parts[0]] && DATA.SHAPES[parts[1]]) {
      return '<span class="token combo-token ' + esc(parts[0]) + '" aria-label="combinação de forma e cor">' + shapeGlyphHTML(parts[1]) + '</span>';
    }
    return '<span class="token">' + esc(key) + '</span>';
  }
  function optionButton(value, label, index, extraClass) {
    return '<button type="button" class="option-button ' + (extraClass || "") + '" data-choice="' + encodeURIComponent(String(value)) + '" data-choice-index="' + index + '" aria-label="' + esc(label || String(value)) + '">' + tokenHTML(value) + '</button>';
  }
  function numberOptions(options) {
    return '<div class="option-grid">' + options.map((value, index) =>
      '<button type="button" class="option-button" data-choice="' + encodeURIComponent(String(value)) + '" data-choice-index="' + index + '" aria-label="Número ' + value + '"><span class="option-number">' + value + '</span></button>'
    ).join("") + '</div>';
  }
  function patternVisual(sequence, options) {
    return '<div class="pattern-challenge">' +
      '<div class="sequence-row">' + sequence.map((value) =>
        value === null
          ? '<span class="sequence-tile missing" aria-label="espaço vazio">?</span>'
          : '<span class="sequence-tile">' + tokenHTML(value) + '</span>'
      ).join("") + '</div>' +
      '<div class="answer-tray"><span class="answer-tray-cue" aria-hidden="true">☝️</span>' +
      '<div class="option-grid">' + options.map((value, index) =>
        optionButton(value, "Alternativa " + (index + 1), index)
      ).join("") + '</div></div></div>';
  }
  function groupVisual(emoji, count) {
    return '<span class="counter-row">' + Array.from({ length: count }, () => '<span class="counter" aria-hidden="true">' + esc(emoji) + '</span>').join("") + '</span>';
  }
  function paintVisual(task) {
    return '<div class="paint-layout">' +
      '<aside class="paint-sidebar" aria-label="Paleta de cores">' +
        '<p class="palette-title" aria-hidden="true">🎨</p>' +
        '<div class="paint-palette">' + task.legend.map((item) =>
          '<button type="button" class="palette-button" data-paint-color="' + item.color + '" aria-label="Escolher cor número ' + item.number + '" title="Cor ' + item.number + '">' +
            '<span class="palette-number">' + item.number + '</span><span class="paint-swatch ' + item.color + '"></span>' +
          '</button>'
        ).join("") + '</div>' +
      '</aside>' +
      '<div class="paint-workspace">' +
        '<div class="paint-targets">' + task.targets.map((number, index) =>
          '<button type="button" class="paint-target" data-paint-target="' + index + '" data-number="' + number + '" aria-label="Pintar círculo ' + (index + 1) + ', número ' + number + '">' + number + '</button>'
        ).join("") + '</div>' +
        '<p class="micro-hint" id="paint-hint">Escolha uma cor na paleta lateral e pinte os círculos com o mesmo número.</p>' +
      '</div>' +
    '</div>';
  }
  function colorMatrixVisual(task) {
    return '<div class="color-matrix">' + task.grid.map((value) =>
      value === null
        ? '<span class="color-matrix-cell missing" aria-label="espaço vazio">?</span>'
        : '<span class="color-matrix-cell">' + tokenHTML(value) + '</span>'
    ).join("") + '</div>' +
    '<div class="answer-tray"><span class="answer-tray-cue" aria-hidden="true">☝️</span>' +
      '<div class="option-grid">' + task.options.map((value, index) => optionButton(value, "Alternativa " + (index + 1), index)).join("") + '</div>' +
    '</div>';
  }
  function shapeVisual(task) {
    return '<div class="shape-target">' + tokenHTML(task.target) + '</div><div class="option-grid">' +
      task.options.map((value, index) => optionButton(value, "Opção " + (index + 1), index)).join("") + '</div>';
  }
  function shapeMatchVisual(task) {
    return '<div class="shape-target">' + tokenHTML(task.target) + '</div><div class="option-grid">' +
      task.options.map((value, index) => optionButton(value, "Combinação " + (index + 1), index)).join("") + '</div>';
  }
  function countVisual(task) {
    return groupVisual(task.emoji, task.count) + numberOptions(task.options);
  }
  function compareVisual(task) {
    return '<div class="compare-grid">' +
      '<button type="button" class="compare-card" data-choice="left" aria-label="Primeiro grupo">' + groupVisual(task.emoji, task.leftCount) + '</button>' +
      '<button type="button" class="compare-card" data-choice="right" aria-label="Segundo grupo">' + groupVisual(task.emoji, task.rightCount) + '</button>' +
      '</div>';
  }
  function calculationVisual(task) {
    return '<div class="math-row">' +
      '<div class="math-group">' + Array.from({ length: task.leftCount }, () => '<span>' + esc(task.emoji) + '</span>').join("") + '</div>' +
      '<span class="math-symbol">' + esc(task.operator) + '</span>' +
      '<div class="math-group">' + Array.from({ length: task.rightCount }, () => '<span>' + esc(task.emoji) + '</span>').join("") + '</div>' +
      '<span class="math-symbol">=</span><span class="option-number">?</span></div>' + numberOptions(task.options);
  }
  function oddVisual(task) {
    return '<div class="odd-grid">' + task.items.map((item) =>
      '<button type="button" class="option-button shape-card" data-choice="' + encodeURIComponent(item.value) + '" aria-label="Figura para comparar">' + tokenHTML(item.token) + '</button>'
    ).join("") + '</div>';
  }
  function gridVisual(task) {
    return '<div class="position-cue"><span class="start-marker">🐾</span><span>→</span>' +
      task.moves.map((move) => '<span>' + DATA.ARROWS[move] + '</span>').join("") + '</div>' +
      '<div class="position-grid">' + task.grid.map((value, index) =>
        '<button type="button" class="position-cell ' + (index === task.startIndex ? "start" : "") + '" data-cell="' + index + '" aria-label="Casa ' + (index + 1) + '">' +
        (index === task.startIndex ? "🐾" : esc(value)) + '</button>'
      ).join("") + '</div>';
  }
  function positionBox(position, value) {
    return '<span class="position-box ' + esc(position) + '"><span>' + esc(value) + '</span></span>';
  }
  function positionVisual(task) {
    return '<div class="position-model">' + positionBox(task.target, "⭐") + '</div>' +
      '<div class="option-grid">' + task.options.map((position, index) =>
        '<button type="button" class="option-button" data-choice="' + position + '" data-choice-index="' + index + '" aria-label="Posição ' + (index + 1) + '">' + positionBox(position, "⭐") + '</button>'
      ).join("") + '</div>';
  }
  function matrixVisual(task) {
    const sizeClass = task.grid.length === 9 ? " matrix-grid-3" : "";
    return '<div class="matrix-grid' + sizeClass + '">' + task.grid.map((value) =>
      '<div class="matrix-cell ' + (value === null ? "missing" : "") + '">' + (value === null ? "?" : tokenHTML(value)) + '</div>'
    ).join("") + '</div><div class="option-grid">' + task.options.map((value, index) => optionButton(value, "Peça " + (index + 1), index)).join("") + '</div>';
  }
  function shapeCountVisual(task) {
    return '<div class="shape-count-board">' +
      '<div class="shape-count-model"><span>MODELO</span>' + tokenHTML(task.countShape) + '</div>' +
      '<div class="shape-count-items">' + task.items.map((shape) => '<span class="shape-count-item">' + tokenHTML(shape) + '</span>').join("") + '</div>' +
    '</div>' + numberOptions(task.options);
  }
  function polygonVisual(task) {
    const pointMarkup = task.points.map((point, index) =>
      '<circle class="polygon-point ' + (index === 0 ? "polygon-start is-next" : "") + '" data-point="' + index + '" cx="' + point.x + '" cy="' + point.y + '" r="10"></circle>'
    ).join("");
    return '<div class="polygon-game">' +
      '<p class="polygon-instruction">🐾 Comece no ponto que cresce. Ligue as pontas seguindo a ordem.</p>' +
      '<div class="polygon-stage">' +
        '<svg id="polygon-svg" class="polygon-svg" viewBox="0 0 360 270" role="img" aria-label="Cinco pontos para ligar e formar um pentágono">' +
          '<polyline id="polygon-lines" class="polygon-lines" points=""></polyline>' +
          '<line id="polygon-preview" class="polygon-preview" x1="0" y1="0" x2="0" y2="0" visibility="hidden"></line>' +
          pointMarkup +
        '</svg>' +
        '<span id="polygon-face" class="polygon-face" hidden>🙂</span>' +
      '</div>' +
      '<p id="polygon-hint" class="polygon-hint" aria-live="polite">Arraste do primeiro ponto até o próximo ponto que cresce.</p>' +
      '<div class="polygon-controls"><button type="button" class="quiet-button" data-action="reset-polygon">↻ Recomeçar</button></div>' +
      '<div id="polygon-answer" class="polygon-answer" hidden><p>Quantas pontas tem a figura?</p><div class="option-grid">' +
        task.options.map((value, index) => '<button type="button" class="option-button" data-choice="' + value + '" data-choice-index="' + index + '"><span class="option-number">' + value + '</span></button>').join("") +
      '</div></div>' +
    '</div>';
  }
  function pairVisual(task) {
    return '<div class="shape-target">' + tokenHTML(task.target) + '</div><div class="option-grid">' +
      task.options.map((value, index) => optionButton(value, "Combinação " + (index + 1), index)).join("") + '</div>';
  }
  function stackVisual(stack) {
    return '<span class="stack-model">' + stack.map((color) =>
      '<span class="stack-block stack-' + esc(color) + '"></span>'
    ).join("") + '</span>';
  }
  function proportionVisual(task) {
    return '<div class="stack-row"><div class="stack-card"><small>MODELO</small>' + stackVisual(task.model) + '</div></div>' +
      '<div class="stack-row">' + task.options.map((option, index) =>
        '<button type="button" class="stack-card" data-option-index="' + index + '" aria-label="Pilha ' + (index + 1) + '">' + stackVisual(option) + '</button>'
      ).join("") + '</div>';
  }
  function soundVisual(task) {
    return '<div class="sound-visual">' + task.sound.map((tone) => '<span class="sound-dot ' + tone + '"></span>').join("") + '</div>' +
      '<button type="button" class="help-button sound-play" data-action="play-sound">🔊 Ouvir padrão</button>' +
      '<div class="option-grid">' + task.options.map((option, index) =>
        '<button type="button" class="option-button" data-option-index="' + index + '" aria-label="Padrão sonoro ' + (index + 1) + '">' +
        '<span class="sound-visual">' + option.map((tone) => '<i class="sound-dot ' + tone + '"></i>').join("") + '</span></button>'
      ).join("") + '</div>';
  }
  function renderVisual(task) {
    if (task.kind === "pattern" || task.kind === "letter-pattern") {
      return patternVisual(task.sequence, task.options);
    }
    if (task.kind === "paint") return paintVisual(task);
    if (task.kind === "color-matrix") return colorMatrixVisual(task);
    if (task.kind === "shape-match") return shapeMatchVisual(task);
    if (task.kind === "connect-polygon") return polygonVisual(task);
    if (task.kind === "shape-count") return shapeCountVisual(task);
    if (task.kind === "side-count") {
      return '<div class="shape-target">' + tokenHTML(task.target) + '</div>' + numberOptions(task.options);
    }
    if (task.kind === "count") return countVisual(task);
    if (task.kind === "compare") return compareVisual(task);
    if (task.kind === "calculation") return calculationVisual(task);
    if (task.kind === "odd-one") return oddVisual(task);
    if (task.kind === "grid-position") return gridVisual(task);
    if (task.kind === "position") return positionVisual(task);
    if (task.kind === "matrix") return matrixVisual(task);
    if (task.kind === "pair") return pairVisual(task);
    if (task.kind === "proportion") return proportionVisual(task);
    if (task.kind === "letter-match") return '<div class="shape-target">' + tokenHTML(task.target) + '</div>' +
      '<div class="option-grid">' + task.options.map((value, index) => optionButton(value, "Letra " + (index + 1), index)).join("") + '</div>';
    if (task.kind === "sound-pattern") return soundVisual(task);
    return '<p>Desafio indisponível.</p>';
  }
  function mapPainterAction() {
    const url = String(CONFIG.painterUrl || "").trim();
    if (!url.startsWith("https://")) return '<span class="painter-link disabled" aria-disabled="true" title="O endereço será configurado quando a Capi Pintora estiver hospedada.">Link pendente</span>';
    return '<a class="painter-link" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">Abrir Capi Pintora ↗</a>';
  }
  function renderMap() {
    activeWorld = null;
    activeTaskIndex = 0;
    const completed = STORE.countAll(progress);
    const total = DATA.tasks.length;
    const cards = DATA.worlds.map((world) => {
      const done = STORE.countWorld(progress, world.id);
      const totalWorld = worldTasks(world.id).length;
      return '<button type="button" class="world-card world-' + esc(world.color) + '" data-open-world="' + esc(world.id) + '">' +
        '<span class="world-meta"><span>ÁREA ' + world.number + '</span><span>' + done + '/' + totalWorld + '</span></span>' +
        '<span class="world-icon" aria-hidden="true">' + world.icon + '</span>' +
        '<span class="world-title">' + esc(world.title) + '</span><span class="world-description">' + esc(world.subtitle) + '</span>' +
        '<span class="world-progress"><span class="mini-dots">' + Array.from({ length: totalWorld }, (_, index) => '<i class="' + (index < done ? "done" : "") + '"></i>').join("") + '</span>' +
        (done === totalWorld ? "Área explorada" : "Explorar desafios") + '</span></button>';
    }).join("");
    app.innerHTML = '<section class="hero"><div><p class="eyebrow">JOGOS VISUAIS DE RACIOCÍNIO</p><h1>Capi e os Desafios da Lógica</h1>' +
      '<p class="hero-copy">Olhe, experimente e descubra. A Capi preparou jogos de cores, formas, números, regras, caminhos, combinações, letras e sons.</p></div>' +
      '<img class="hero-art" src="assets/images/capi-pintora.svg" alt="Capi com pincel, paleta e cavalete"></section>' +
      '<div class="progress-strip"><span>🧩 ' + completed + ' de ' + total + ' desafios</span><div class="progress-track"><span style="width:' + (completed / total * 100) + '%"></span></div></div>' +
      '<section class="world-grid" aria-label="Áreas de jogos">' + cards + '</section>' +
      '<section class="painter-panel"><img src="assets/images/capi-pintora.svg" alt="Capi Pintora com paleta de cores"><div class="painter-copy"><h2>🎨 Capi Pintora</h2><p>Uma oficina complementar para colorir desenhos e explorar combinações. A atividade abre em uma página separada.</p></div>' +
      mapPainterAction() + '</section>' +
      '<div class="section-title"><span id="storage-notice"></span><button type="button" class="quiet-button" data-action="reset-progress">Reiniciar progresso</button></div>';
    updateStorageNotice();
  }
  function renderWorld(worldId) {
    const world = worldById(worldId);
    if (!world) return renderMap();
    activeWorld = worldId;
    const tasks = worldTasks(worldId);
    const done = STORE.countWorld(progress, worldId);
    const cards = tasks.map((task, index) => {
      const isDone = progress.completed.includes(task.id);
      return '<button type="button" class="task-card ' + (isDone ? "done" : "") + '" data-open-task="' + index + '">' +
        '<span class="task-number">DESAFIO ' + (index + 1) + '</span><span class="task-icon" aria-hidden="true">' + task.icon + '</span>' +
        '<strong>' + esc(task.title) + '</strong><small>' + (isDone ? "✓ Concluído" : "Toque para jogar") + '</small></button>';
    }).join("");
    app.innerHTML = '<div class="section-title"><button type="button" class="map-button" data-action="back-map">← Mapa</button><h2>' + esc(world.title) + '</h2><span>' + done + '/' + tasks.length + '</span></div>' +
      '<div class="progress-strip"><span>' + world.icon + ' ' + esc(world.subtitle) + '</span><div class="progress-track"><span style="width:' + (done / tasks.length * 100) + '%"></span></div></div>' +
      '<section class="task-grid" aria-label="Desafios de ' + esc(world.title) + '">' + cards + '</section>';
  }
  function renderTask(worldId, index) {
    const world = worldById(worldId);
    const tasks = worldTasks(worldId);
    const task = tasks[index];
    if (!world || !task) return renderWorld(worldId);
    activeWorld = worldId;
    activeTaskIndex = index;
    selectedColor = null;
    painted = [];
    const isDone = progress.completed.includes(task.id);
    const isPaint = task.kind === "paint";
    app.innerHTML = '<section class="game-card"><div class="game-top"><div class="game-top-left"><button type="button" class="map-button" data-action="back-world">←</button><span>ÁREA ' + world.number + ' · DESAFIO ' + (index + 1) + '/' + tasks.length + '</span></div><span class="capi-avatar" aria-hidden="true"><i></i><b></b><span></span></span></div>' +
      '<h1>' + esc(task.title) + '</h1><p class="game-prompt"><button type="button" class="listen-button" data-speak="' + esc(task.prompt) + '" aria-label="Ouvir instrução">🔊</button><span>' + esc(task.prompt) + '</span></p>' +
      '<div class="game-board">' + renderVisual(task) + '</div>' +
      '<p id="task-feedback" class="task-feedback" role="status" aria-live="polite">' + (isDone ? "Este desafio já foi concluído. Você pode praticar novamente." : (isPaint ? "Escolha uma cor na paleta e pinte os círculos." : "Toque na opção que completa o desafio.")) + '</p>' +
      '<div class="game-actions"><button type="button" class="quiet-button" data-action="back-world">Voltar aos desafios</button>' +
      '<button type="button" class="next-button" data-action="next-task" ' + (!isDone ? "disabled" : "") + '>' + (index < tasks.length - 1 ? "Próximo desafio →" : "Concluir área ✓") + '</button></div>' +
      '<p class="painter-note">A Capi está aqui para ajudar. Você pode ouvir a instrução novamente sempre que precisar.</p></section>';
    if (task.kind === "connect-polygon") setupPolygonDrawing(task);
  }
  function feedback(message, kind) {
    const node = document.getElementById("task-feedback");
    if (!node) return;
    node.className = "task-feedback" + (kind ? " " + kind : "");
    node.textContent = message;
  }
  function completeTask(message) {
    const task = currentTask();
    if (!task) return;
    if (!progress.completed.includes(task.id)) {
      STORE.complete(progress, task.id);
      save();
    }
    feedback(message || "Muito bem! Você descobriu a regra.", "good");
    const next = document.querySelector('[data-action="next-task"]');
    if (next) next.disabled = false;
  }
  function highlightOption(button) {
    const group = button.closest(".option-grid, .stack-row, .compare-grid");
    if (group) {
      group.querySelectorAll(".option-button, .stack-card, .compare-card").forEach((option) => {
        option.classList.toggle("is-selected", option === button);
      });
    } else {
      button.classList.add("is-selected");
    }
  }
  function handleChoice(button) {
    const task = currentTask();
    if (!task) return;
    if (task.kind === "connect-polygon" && !document.getElementById("polygon-answer")?.contains(button)) return;
    highlightOption(button);
    const value = decodeURIComponent(button.dataset.choice || "");
    let correct = false;
    if (task.kind === "proportion" || task.kind === "sound-pattern") {
      correct = Number(button.dataset.optionIndex) === task.answerIndex;
    } else {
      correct = String(value) === String(task.answer);
    }
    if (correct) completeTask("Muito bem! Você encontrou a resposta. 🌟");
    else feedback("Quase! Observe o modelo mais uma vez e tente outra opção.", "hint");
  }
  function handleGridCell(button) {
    const task = currentTask();
    if (!task || task.kind !== "grid-position") return;
    const rowCol = task.moves.reduce((position, move) => {
      const row = position.row + (move === "up" ? -1 : move === "down" ? 1 : 0);
      const col = position.col + (move === "left" ? -1 : move === "right" ? 1 : 0);
      return { row: Math.max(0, Math.min(2, row)), col: Math.max(0, Math.min(2, col)) };
    }, { row: Math.floor(task.startIndex / 3), col: task.startIndex % 3 });
    const answer = rowCol.row * 3 + rowCol.col;
    if (Number(button.dataset.cell) === answer && answer === task.answerIndex) completeTask("Caminho encontrado! Você seguiu todas as setas.");
    else feedback("Siga uma seta de cada vez, partindo da pegada.", "hint");
  }
  function handlePaintColor(button) {
    selectedColor = button.dataset.paintColor;
    document.querySelectorAll("[data-paint-color]").forEach((node) => node.classList.toggle("selected", node === button));
    feedback("Agora toque nos círculos que usam esta cor.");
  }
  function handlePaintTarget(button) {
    const task = currentTask();
    if (!task || task.kind !== "paint") return;
    const index = Number(button.dataset.paintTarget);
    const expected = task.legend.find((item) => item.number === Number(button.dataset.number));
    if (!selectedColor) { feedback("Escolha primeiro uma cor na paleta.", "hint"); return; }
    if (!expected || selectedColor !== expected.color) {
      feedback("Essa cor não corresponde ao número do círculo. Observe a legenda.", "hint");
      return;
    }
    painted[index] = selectedColor;
    button.style.background = DATA.COLORS[selectedColor];
    button.style.color = "#fff";
    button.style.borderColor = "#425c49";
    button.textContent = "✓";
    button.disabled = true;
    const hint = document.getElementById("paint-hint");
    if (hint) hint.textContent = "Muito bem! Continue pintando os outros círculos.";
    if (painted.filter(Boolean).length === task.targets.length) completeTask("Todos os círculos receberam a cor correta! 🎨");
  }
  function setupPolygonDrawing(task) {
    const svg = document.getElementById("polygon-svg");
    const stage = document.querySelector(".polygon-stage");
    const preview = document.getElementById("polygon-preview");
    const lines = document.getElementById("polygon-lines");
    const face = document.getElementById("polygon-face");
    const hint = document.getElementById("polygon-hint");
    const answer = document.getElementById("polygon-answer");
    if (!svg || !stage || !preview || !lines || !face || !hint || !answer) return;

    const points = task.points;
    let accepted = [];
    let drawing = false;
    let pointerId = null;
    let completed = false;
    const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const coordinates = (event) => {
      const rect = svg.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(360, (event.clientX - rect.left) / rect.width * 360)),
        y: Math.max(0, Math.min(270, (event.clientY - rect.top) / rect.height * 270))
      };
    };
    const lastIndex = () => accepted.length ? accepted[accepted.length - 1] : -1;
    const expectedIndex = () => !accepted.length ? 0 : (accepted.length === points.length ? 0 : accepted.length);
    const updateDots = () => {
      svg.querySelectorAll("[data-point]").forEach((dot) => {
        const index = Number(dot.dataset.point);
        dot.classList.toggle("is-visited", accepted.includes(index));
        dot.classList.toggle("is-next", !completed && index === expectedIndex());
      });
    };
    const renderLines = (close = false) => {
      const indexes = close ? accepted.concat(0) : accepted;
      lines.setAttribute("points", indexes.map((index) => points[index].x + "," + points[index].y).join(" "));
    };
    const movePreview = (from, to) => {
      preview.setAttribute("x1", points[from].x);
      preview.setAttribute("y1", points[from].y);
      preview.setAttribute("x2", to.x);
      preview.setAttribute("y2", to.y);
      preview.setAttribute("visibility", "visible");
    };
    const hidePreview = () => preview.setAttribute("visibility", "hidden");
    const showFace = (event, mood) => {
      const rect = stage.getBoundingClientRect();
      face.textContent = mood === "happy" ? "😊" : "😟";
      face.style.left = Math.max(18, Math.min(rect.width - 18, event.clientX - rect.left)) + "px";
      face.style.top = Math.max(6, event.clientY - rect.top - 24) + "px";
      face.hidden = false;
      face.classList.toggle("happy", mood === "happy");
      face.classList.toggle("sad", mood === "sad");
    };
    const hideFace = () => { face.hidden = true; };
    const updateGuidance = (event, position) => {
      const targetIndex = expectedIndex();
      const targetDistance = distance(position, points[targetIndex]);
      const nearby = points.findIndex((point) => distance(position, point) <= 30);
      if (targetDistance <= 38) showFace(event, "happy");
      else if (nearby >= 0 && nearby !== targetIndex && nearby !== lastIndex()) showFace(event, "sad");
      else hideFace();
    };
    const reset = () => {
      accepted = [];
      drawing = false;
      pointerId = null;
      completed = false;
      renderLines();
      hidePreview();
      hideFace();
      answer.hidden = true;
      hint.textContent = "Arraste do primeiro ponto até o próximo ponto que cresce. Segure enquanto liga os pontos.";
      const next = document.querySelector('[data-action="next-task"]');
      if (next) next.disabled = true;
      updateDots();
    };
    const finishPolygon = () => {
      completed = true;
      drawing = false;
      renderLines(true);
      hidePreview();
      hideFace();
      hint.textContent = "Figura fechada! Agora conte quantas pontas ela tem.";
      answer.hidden = false;
      feedback("Muito bem! Você fechou a figura. Quantas pontas existem?", "good");
      updateDots();
    };
    const handlePointerDown = (event) => {
      if (completed || (event.pointerType === "mouse" && event.button !== 0)) return;
      const position = coordinates(event);
      const startIndex = lastIndex() < 0 ? 0 : lastIndex();
      if (distance(position, points[startIndex]) > 31) {
        hint.textContent = accepted.length
          ? "Comece o próximo traço na última ponta ligada."
          : "Comece na bolinha que está crescendo.";
        showFace(event, "sad");
        return;
      }
      event.preventDefault();
      drawing = true;
      pointerId = event.pointerId;
      try { svg.setPointerCapture(pointerId); } catch { /* captura opcional */ }
      if (!accepted.length) {
        accepted.push(0);
        renderLines();
        updateDots();
        hint.textContent = "Ótimo começo! Segure e arraste até a próxima bolinha.";
      }
      movePreview(lastIndex(), position);
      updateGuidance(event, position);
    };
    const handlePointerMove = (event) => {
      if (!drawing || event.pointerId !== pointerId) return;
      event.preventDefault();
      const position = coordinates(event);
      updateGuidance(event, position);
      const targetIndex = expectedIndex();
      if (distance(position, points[targetIndex]) <= 25) {
        if (targetIndex === 0 && accepted.length === points.length) {
          finishPolygon();
          return;
        }
        accepted.push(targetIndex);
        renderLines();
        updateDots();
        hidePreview();
        hint.textContent = "Ponto ligado! Continue até fechar a figura.";
        return;
      }
      movePreview(lastIndex(), position);
    };
    const finishPointer = (event) => {
      if (!drawing || event.pointerId !== pointerId) return;
      handlePointerMove(event);
      drawing = false;
      pointerId = null;
      hidePreview();
      if (!completed) {
        const position = coordinates(event);
        const targetIndex = expectedIndex();
        const nearby = points.findIndex((point) => distance(position, point) <= 30);
        if (nearby >= 0 && nearby !== targetIndex && nearby !== lastIndex()) {
          showFace(event, "sad");
          hint.textContent = "Esse não é o próximo ponto. Siga a bolinha que está crescendo.";
        } else if (accepted.length) {
          hint.textContent = "Soltou? Tudo bem! Continue arrastando a partir da última ponta ligada.";
        }
      }
      try { if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId); } catch { /* captura opcional */ }
    };
    svg.addEventListener("pointerdown", handlePointerDown);
    svg.addEventListener("pointermove", handlePointerMove);
    svg.addEventListener("pointerup", finishPointer);
    svg.addEventListener("pointercancel", () => {
      drawing = false;
      pointerId = null;
      hidePreview();
      hideFace();
    });
    document.querySelector('[data-action="reset-polygon"]')?.addEventListener("click", reset);
    updateDots();
  }

  function playSoundSequence(sequence) {
    const AudioContextClass = global.AudioContext || global.webkitAudioContext;
    if (!AudioContextClass) { feedback("O som não está disponível neste navegador. Você ainda pode observar as opções.", "hint"); return; }
    try {
      if (!audioContext) audioContext = new AudioContextClass();
      const context = audioContext;
      const play = () => {
        const start = context.currentTime + 0.08;
        sequence.forEach((tone, index) => {
          const at = start + index * 0.34;
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.type = "sine";
          oscillator.frequency.value = tone === "high" ? 760 : 390;
          gain.gain.setValueAtTime(0.0001, at);
          gain.gain.exponentialRampToValueAtTime(0.13, at + 0.025);
          gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
          oscillator.connect(gain);
          gain.connect(context.destination);
          oscillator.start(at);
          oscillator.stop(at + 0.21);
        });
        feedback("Escute os sons e escolha a sequência que combina com eles.");
      };
      if (context.state === "suspended") context.resume().then(play).catch(() => feedback("Não foi possível iniciar o áudio neste navegador.", "hint"));
      else play();
    } catch { feedback("Não foi possível tocar o som neste navegador.", "hint"); }
  }

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!target || typeof target.closest !== "function") return;
    const worldButton = target.closest("[data-open-world]");
    if (worldButton) { renderWorld(worldButton.dataset.openWorld); return; }
    const taskButton = target.closest("[data-open-task]");
    if (taskButton) { renderTask(activeWorld, Number(taskButton.dataset.openTask)); return; }
    const action = target.closest("[data-action]");
    if (action) {
      const name = action.dataset.action;
      if (name === "back-map") { global.speechSynthesis?.cancel(); renderMap(); return; }
      if (name === "back-world") { global.speechSynthesis?.cancel(); renderWorld(activeWorld); return; }
      if (name === "next-task") {
        const tasks = worldTasks(activeWorld);
        if (activeTaskIndex < tasks.length - 1) renderTask(activeWorld, activeTaskIndex + 1);
        else renderWorld(activeWorld);
        return;
      }
      if (name === "reset-progress") {
        if (!global.confirm("Apagar somente o progresso dos Jogos da Capi neste navegador?")) return;
        progress = STORE.reset();
        storageMode = "localStorage";
        renderMap();
        return;
      }
      if (name === "play-sound") { const task = currentTask(); if (task?.kind === "sound-pattern") playSoundSequence(task.sound); return; }
    }
    const speechButton = target.closest("[data-speak]");
    if (speechButton) {
      if (!speak(speechButton.dataset.speak)) feedback("A leitura em voz alta não está disponível. Peça ajuda ao professor.", "hint");
      return;
    }
    const colorButton = target.closest("[data-paint-color]");
    if (colorButton) { handlePaintColor(colorButton); return; }
    const paintTarget = target.closest("[data-paint-target]");
    if (paintTarget) { handlePaintTarget(paintTarget); return; }
    const cell = target.closest("[data-cell]");
    if (cell) { handleGridCell(cell); return; }
    const choice = target.closest("[data-choice]");
    if (choice) { handleChoice(choice); return; }
    const option = target.closest("[data-option-index]");
    if (option) {
      const task = currentTask();
      if (task && (task.kind === "proportion" || task.kind === "sound-pattern")) handleChoice(option);
    }
  });

  global.addEventListener("pagehide", () => {
    try { global.speechSynthesis?.cancel(); } catch { /* voz opcional */ }
    try { audioContext?.close(); } catch { /* áudio opcional */ }
  });

  renderMap();
})(window);
