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
  let additionSeriesStep = 0;
  let countdownStep = 0;
  let applePainted = [];
  let arrowOrderStep = 0;
  let frogRunToken = 0;
  let frogTimer = null;
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
    if (parts.length === 3 && DATA.COLORS[parts[0]] && DATA.ARROWS[parts.slice(1).join("-")]) {
      return '<span class="token token-arrow colored-arrow" style="color:' + DATA.COLORS[parts[0]] + '" aria-label="seta colorida">' + DATA.ARROWS[parts.slice(1).join("-")] + '</span>';
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
  function arrowVisual(arrow, extraClass) {
    const glyph = DATA.ARROWS[arrow.direction] || "?";
    const color = DATA.COLORS[arrow.color] || DATA.COLORS.black;
    return '<span class="arrow-visual ' + (extraClass || "") + '" style="--arrow-color:' + color + '" aria-hidden="true">' + glyph + '</span>';
  }
  function arrowOrderVisual(task) {
    return '<div class="arrow-order-game">' +
      '<div class="arrow-reference-panel"><p>OLHE A ORDEM</p><div class="arrow-reference-row">' +
        task.sequence.map((arrow, index) => '<span class="arrow-reference-step" data-arrow-step="' + index + '">' + arrowVisual(arrow, "reference-arrow") + '</span>').join("") +
      '</div></div>' +
      '<p class="arrow-order-instruction">Agora toque nas setas de baixo na mesma ordem.</p>' +
      '<div class="arrow-choice-grid">' + task.choices.map((arrow) =>
        '<button type="button" class="arrow-choice-button" data-arrow-choice-id="' + esc(arrow.id) + '" aria-label="Seta ' + esc(arrow.color) + '">' + arrowVisual(arrow, "choice-arrow") + '</button>'
      ).join("") + '</div>' +
      '<div class="arrow-order-progress" id="arrow-order-progress" aria-live="polite">0 / ' + task.sequence.length + '</div>' +
    '</div>';
  }
  const IRREGULAR_PATHS = {
    cloud: "M17 54 C7 43 15 25 31 27 C36 9 61 8 68 27 C87 23 96 43 82 57 C87 74 67 86 52 76 C37 91 15 78 17 54Z",
    leaf: "M12 63 C16 37 43 13 87 15 C83 52 57 84 12 63Z",
    wave: "M12 27 C28 7 42 28 54 17 C69 5 87 20 80 36 C99 51 80 75 63 66 C46 89 23 70 28 57 C7 55 4 40 12 27Z",
    blob: "M49 8 C66 2 78 18 74 32 C93 40 91 63 72 70 C65 90 43 92 34 75 C13 78 5 57 20 42 C13 23 31 12 49 8Z",
    shell: "M18 70 C9 52 18 23 39 15 C58 7 80 22 84 43 C88 63 65 85 42 83 C29 83 21 79 18 70Z",
    ribbon: "M15 18 C34 8 45 31 61 18 C75 7 91 21 82 37 C75 51 56 42 45 59 C35 77 17 86 11 69 C4 51 29 43 15 18Z"
  };
  function irregularCompositionHTML(layers) {
    const transforms = ["", "translate(20 20) scale(.60)", "translate(37 37) scale(.27)", "translate(43 43) scale(.14)"];
    return '<svg class="irregular-composition" viewBox="0 0 100 100" role="img" aria-label="Composição de formas irregulares encaixadas">' +
      layers.map((layer, index) =>
        '<path d="' + IRREGULAR_PATHS[layer.shape] + '" transform="' + transforms[Math.min(index, transforms.length - 1)] + '" fill="' + (DATA.COLORS[layer.color] || DATA.COLORS.black) + '" stroke="#334b3b" stroke-width="2.2" stroke-linejoin="round"/>'
      ).join("") + '</svg>';
  }
  function complexMatchVisual(task) {
    return '<div class="complex-match-game">' +
      '<p class="complex-match-label">MODELO</p>' +
      '<div class="complex-match-target">' + irregularCompositionHTML(task.targetLayers) + '</div>' +
      '<p class="complex-match-instruction">Encontre a mesma combinação.</p>' +
      '<div class="complex-match-options">' + task.options.map((option, index) =>
        '<button type="button" class="option-button complex-match-option" data-choice="' + index + '" data-choice-index="' + index + '" data-option-index="' + index + '" aria-label="Combinação ' + (index + 1) + '">' +
          irregularCompositionHTML(option.layers) +
        '</button>'
      ).join("") + '</div>' +
    '</div>';
  }
  function arrowSequenceMatchVisual(task) {
    const renderRow = (sequence) => sequence.map(arrow => arrowVisual(arrow, "sequence-match-arrow")).join("");
    return '<div class="arrow-sequence-match-game">' +
      '<p class="arrow-match-label">CAMINHO MODELO</p>' +
      '<div class="arrow-match-target">' + renderRow(task.target) + '</div>' +
      '<div class="arrow-sequence-options">' + task.options.map((sequence, index) =>
        '<button type="button" class="option-button arrow-sequence-option" data-choice="' + index + '" data-choice-index="' + index + '" data-option-index="' + index + '" aria-label="Caminho ' + (index + 1) + '">' +
          renderRow(sequence) +
        '</button>'
      ).join("") + '</div>' +
    '</div>';
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
  function frogJumpVisual(task) {
    return '<div class="frog-game" id="frog-game">' +
      '<div class="frog-stage" id="frog-stage">' +
        '<div class="frog-pads">' + Array.from({ length: task.jumpCount + 1 }, (_, index) =>
          '<span class="frog-pad" aria-hidden="true">🪷</span>'
        ).join("") + '</div>' +
        '<span class="frog-character" id="frog-character" aria-label="Sapo">🐸</span>' +
      '</div>' +
      '<button type="button" class="frog-start-button" data-action="start-frog">▶️</button>' +
      '<p class="frog-hint" id="frog-hint">Toque para ver o sapo pular.</p>' +
      '<div class="frog-answer" id="frog-answer" hidden><p>Quantos pulos o sapo deu?</p>' + numberOptions(task.options) + '</div>' +
    '</div>';
  }
  function additionSeriesVisual(task) {
    const problem = task.problems[additionSeriesStep] || task.problems[0];
    const dots = task.problems.map((item, index) =>
      '<i class="addition-step-dot ' + (index < additionSeriesStep ? "done" : index === additionSeriesStep ? "current" : "") + '"></i>'
    ).join("");
    return '<div class="addition-series">' +
      '<div class="addition-series-top"><span class="addition-level">+' + problem.increment + '</span><span class="addition-count">' + (additionSeriesStep + 1) + ' / ' + task.problems.length + '</span></div>' +
      '<div class="addition-progress">' + dots + '</div>' +
      '<div class="addition-equation">' +
        '<span class="addition-number">' + problem.base + '</span><span class="addition-symbol">+</span>' +
        '<span class="addition-number">' + problem.increment + '</span><span class="addition-symbol">=</span>' +
        '<span class="addition-missing">?</span>' +
      '</div>' +
      '<div class="addition-visual-groups"><div class="addition-visual-group">' +
        Array.from({ length: problem.base }, () => '<span>' + esc(task.emoji) + '</span>').join("") +
      '</div><span class="addition-symbol">+</span><div class="addition-visual-group extra">' +
        Array.from({ length: problem.increment }, () => '<span>' + esc(task.emoji) + '</span>').join("") +
      '</div></div>' +
      '<p class="addition-hint">Encontre o total.</p>' +
      numberOptions(problem.options) +
    '</div>';
  }
  function missingAddendVisual(task) {
    return '<div class="missing-addend-game">' +
      '<div class="missing-addend-equation">' +
        '<span class="addition-number">' + task.knownCount + '</span><span class="addition-symbol">+</span>' +
        '<span class="addition-missing">?</span><span class="addition-symbol">=</span>' +
        '<span class="addition-number">' + task.total + '</span>' +
      '</div>' +
      '<div class="missing-addend-pictures"><div class="addition-visual-group">' +
        Array.from({ length: task.knownCount }, () => '<span>🍊</span>').join("") +
      '</div><span class="addition-symbol">+</span><span class="addition-missing">?</span>' +
      '<span class="addition-symbol">=</span><div class="addition-visual-group total">' +
        Array.from({ length: task.total }, () => '<span>🍊</span>').join("") +
      '</div></div>' +
      numberOptions(task.options) +
    '</div>';
  }
  function numberPathVisual(task) {
    const points = task.points.map((point) =>
      '<g class="number-path-dot ' + (point.value === 1 ? "is-next" : "") + '" data-point-value="' + point.value + '">' +
        '<circle cx="' + point.x + '" cy="' + point.y + '" r="21"></circle>' +
        '<text x="' + point.x + '" y="' + (point.y + 7) + '">' + point.value + '</text>' +
      '</g>'
    ).join("");
    return '<div class="number-path-game">' +
      '<p class="number-path-instruction">Ligue do 1 ao 9 sem pular nenhum número.</p>' +
      '<div class="number-path-stage">' +
        '<svg id="number-path-svg" class="number-path-svg" viewBox="0 0 360 300" role="img" aria-label="Grade três por três de pontos numerados fora de ordem">' +
          '<polyline id="number-path-lines" class="number-path-lines" points=""></polyline>' +
          '<line id="number-path-preview" class="number-path-preview" x1="0" y1="0" x2="0" y2="0" visibility="hidden"></line>' +
          points +
        '</svg>' +
        '<span id="number-path-face" class="polygon-face" hidden>🙂</span>' +
      '</div>' +
      '<p id="number-path-hint" class="number-path-hint" aria-live="polite">Comece no número 1. O próximo número vai crescer.</p>' +
      '<div class="number-path-controls"><button type="button" class="quiet-button" data-action="reset-number-path">↻ Recomeçar</button></div>' +
    '</div>';
  }
  function fishCrabCountVisual(task) {
    const animals = task.animals.map((animal, index) =>
      '<span class="count-animal ' + animal + '" aria-label="' + (animal === "fish" ? "peixe" : "caranguejo") + '">' +
        (animal === "fish" ? "🐟" : "🦀") +
      '</span>'
    ).join("");
    return '<div class="fish-count-game">' +
      '<div class="fish-count-target"><span>🐟</span><strong>CONTE OS PEIXES</strong><small>Não conte os caranguejos!</small></div>' +
      '<div class="fish-count-group">' + animals + '</div>' +
      '<p class="fish-count-reminder">🐟 Conte os peixes. 🦀 Ignore os caranguejos.</p>' +
      numberOptions(task.options) +
    '</div>';
  }
  function appleSVG() {
    return '<svg viewBox="0 0 72 72" aria-hidden="true">' +
      '<path class="apple-body" d="M36 23 C25 15 10 25 12 43 C14 59 25 66 36 61 C47 66 58 59 60 43 C62 25 47 15 36 23Z" fill="#fff" stroke="#496b4d" stroke-width="3.5" stroke-linejoin="round"/>' +
      '<path d="M36 23 C35 16 38 11 43 7" fill="none" stroke="#765334" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M39 13 C48 4 57 9 55 17 C49 21 43 19 39 13Z" fill="#a9cf7a" stroke="#496b4d" stroke-width="2"/>' +
    '</svg>';
  }
  function applePaintVisual(task) {
    return '<div class="apple-paint-game">' +
      '<div class="apple-paint-grid">' + Array.from({ length: task.appleCount }, (_, index) =>
        '<button type="button" class="apple-paint-item" data-apple-index="' + index + '" aria-label="Pintar maçã ' + (index + 1) + '">' + appleSVG() + '</button>'
      ).join("") + '</div>' +
      '<div class="apple-paint-counter" id="apple-paint-counter" aria-live="polite"><span>🍎</span> Maçãs pintadas: <strong>0 / ' + task.appleCount + '</strong></div>' +
      '<div class="apple-paint-answer" id="apple-paint-answer" hidden><p>Quantas maçãs você pintou?</p>' + numberOptions(task.options) + '</div>' +
    '</div>';
  }
  function doubleCountdownVisual(task) {
    const missingIndex = task.missingIndexes[countdownStep];
    const sequence = task.sequence.map((value, index) => {
      if (value !== null) return '<span class="countdown-number">' + value + '</span>';
      const missingPosition = task.missingIndexes.indexOf(index);
      if (missingPosition < countdownStep) {
        return '<span class="countdown-number filled">' + task.answers[missingPosition] + '</span>';
      }
      return '<span class="countdown-number missing ' + (index === missingIndex ? "active" : "") + '">?</span>';
    }).join("");
    return '<div class="double-countdown-game">' +
      '<div class="countdown-progress"><span>FALTA PREENCHER</span><strong>' + (countdownStep + 1) + ' / 2</strong></div>' +
      '<div class="countdown-sequence">' + sequence + '</div>' +
      '<p class="countdown-hint">Qual número vem aqui?</p>' +
      numberOptions(task.options[countdownStep]) +
    '</div>';
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
    if (Array.isArray(task.terms)) {
      const groups = task.terms.map((count) => '<div class="math-group">' + Array.from({ length: count }, () => '<span>' + esc(task.emoji) + '</span>').join("") + '</div>');
      return '<div class="math-row triple-math-row">' + groups.join('<span class="math-symbol">' + esc(task.operator || "+") + '</span>') + '<span class="math-symbol">=</span><span class="option-number">?</span></div>' + numberOptions(task.options);
    }
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
    const dimension = Math.sqrt(task.grid.length);
    return '<div class="position-cue"><span class="start-marker">🐾</span>' +
      task.moves.map((move) => '<span>' + DATA.ARROWS[move] + '</span>').join("") + '</div>' +
      '<div class="position-grid" style="--grid-columns:' + dimension + '">' + task.grid.map((value, index) =>
        '<button type="button" class="position-cell ' + (index === task.startIndex ? "start" : "") + '" data-cell="' + index + '" aria-label="Casa ' + (index + 1) + '">' +
        (index === task.startIndex ? "🐾" : esc(value)) + '</button>'
      ).join("") + '</div>';
  }
  function relativePositionBoard(layout) {
    const occupied = new Map(layout.items.map((item) => [item.cell, item.emoji]));
    return '<div class="relative-position-grid">' + Array.from({ length: 9 }, (_, index) =>
      '<span class="relative-position-cell">' + (occupied.get(index) || "") + '</span>'
    ).join("") + '</div>';
  }
  function relativePositionVisual(task) {
    return '<div class="relative-position-game">' +
      '<p class="relative-position-label">MODELO</p>' +
      '<div class="relative-position-model">' + relativePositionBoard(task.target) + '</div>' +
      '<p class="relative-position-instruction">Encontre a mesma organização.</p>' +
      '<div class="relative-position-options">' + task.options.map((layout, index) =>
        '<button type="button" class="option-button relative-position-option" data-choice="' + index + '" data-choice-index="' + index + '" data-option-index="' + index + '" aria-label="Organização ' + (index + 1) + '">' +
          relativePositionBoard(layout) +
        '</button>'
      ).join("") + '</div>' +
    '</div>';
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
  function nestedLayersHTML(layers) {
    if (!Array.isArray(layers) || !layers.length) return "";
    const layer = layers[0];
    const color = DATA.COLORS[layer.color] || "#334139";
    return '<span class="nested-shape-layer shape-' + esc(layer.shape) + '" style="background:' + color + '">' +
      nestedLayersHTML(layers.slice(1)) + '</span>';
  }
  function nestedShapeVisual(task) {
    const makeCard = (layers, index, isTarget) =>
      '<' + (isTarget ? 'div' : 'button type="button" data-choice="' + index + '" data-option-index="' + index + '" aria-label="Combinação ' + (index + 1) + '"') +
      ' class="nested-option' + (isTarget ? ' nested-model' : ' option-button') + '">' +
      '<span class="nested-shape-frame">' + nestedLayersHTML(layers) + '</span>' +
      (isTarget ? '</div>' : '</button>');
    return '<div class="nested-challenge"><div class="nested-target-label">MODELO</div>' +
      makeCard(task.targetLayers, 0, true) +
      '<div class="nested-options option-grid">' +
      task.options.map((option, index) => makeCard(option.layers, index, false)).join("") +
      '</div></div>';
  }
  function coloredShapeHTML(shape, color) {
    return '<span class="colored-shape shape-glyph shape-' + esc(shape) + '" style="background:' + (DATA.COLORS[color] || "#334139") + '"></span>';
  }
  function shapeColorChoiceVisual(task) {
    return '<div class="shape-color-challenge">' +
      '<div class="shape-color-model"><span class="shape-color-model-label">MODELO</span>' +
        coloredShapeHTML(task.targetShape, task.targetColor) +
      '</div>' +
      '<div class="shape-color-options">' + task.options.map((option, index) =>
        '<button type="button" class="option-button shape-color-option" data-choice="' + index + '" data-option-index="' + index + '" aria-label="Figura colorida ' + (index + 1) + '">' +
          coloredShapeHTML(option.shape, option.color) +
        '</button>'
      ).join("") + '</div>' +
    '</div>';
  }
  function shapeSortVisual(task) {
    const zoneMarkup = task.zones.map((shape) =>
      '<div class="sort-zone" role="group" aria-label="Conjunto de formas" data-sort-zone="' + esc(shape) + '">' +
        '<div class="sort-zone-heading">' + coloredShapeHTML(shape, "black") + '</div>' +
        '<div class="sort-zone-items" data-sort-items="' + esc(shape) + '"></div>' +
        '<span class="sort-zone-count" data-sort-count="' + esc(shape) + '">0</span>' +
      '</div>'
    ).join("");
    const itemsMarkup = task.items.map((item) =>
      '<button type="button" class="sort-item" data-sort-id="' + esc(item.id) + '" data-sort-shape="' + esc(item.shape) + '" aria-label="Arrastar forma colorida">' +
        coloredShapeHTML(item.shape, item.color) +
      '</button>'
    ).join("");
    return '<div class="shape-sort-game" id="shape-sort">' +
      '<div class="sort-source-panel"><div class="sort-panel-heading">FORMAS MISTURADAS</div>' +
        '<div class="sort-source-tray" id="sort-source-tray">' + itemsMarkup + '</div>' +
      '</div>' +
      '<div class="sort-zones">' + zoneMarkup + '</div>' +
      '<div class="sort-controls"><button type="button" class="quiet-button" data-action="reset-sorting">↻ Recomeçar</button></div>' +
      '<p class="sort-instruction" id="sort-instruction" aria-live="polite">Arraste cada figura para o grupo da mesma forma.</p>' +
    '</div>';
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
    if (task.kind === "arrow-order") return arrowOrderVisual(task);
    if (task.kind === "complex-match") return complexMatchVisual(task);
    if (task.kind === "arrow-sequence-match") return arrowSequenceMatchVisual(task);
    if (task.kind === "pattern" || task.kind === "letter-pattern") {
      return patternVisual(task.sequence, task.options);
    }
    if (task.kind === "paint") return paintVisual(task);
    if (task.kind === "color-matrix") return colorMatrixVisual(task);
    if (task.kind === "shape-match") return shapeMatchVisual(task);
    if (task.kind === "connect-polygon") return polygonVisual(task);
    if (task.kind === "nested-shape-match") return nestedShapeVisual(task);
    if (task.kind === "shape-color-choice") return shapeColorChoiceVisual(task);
    if (task.kind === "shape-sort") return shapeSortVisual(task);
    if (task.kind === "number-path") return numberPathVisual(task);
    if (task.kind === "frog-jumps") return frogJumpVisual(task);
    if (task.kind === "addition-series") return additionSeriesVisual(task);
    if (task.kind === "missing-addend") return missingAddendVisual(task);
    if (task.kind === "fish-crab-count") return fishCrabCountVisual(task);
    if (task.kind === "apple-paint-count") return applePaintVisual(task);
    if (task.kind === "double-countdown") return doubleCountdownVisual(task);
    if (task.kind === "shape-count") return shapeCountVisual(task);
    if (task.kind === "side-count") {
      return '<div class="shape-target">' + tokenHTML(task.target) + '</div>' + numberOptions(task.options);
    }
    if (task.kind === "count") return countVisual(task);
    if (task.kind === "compare") return compareVisual(task);
    if (task.kind === "calculation") return calculationVisual(task);
    if (task.kind === "odd-one") return oddVisual(task);
    if (task.kind === "grid-position") return gridVisual(task);
    if (task.kind === "relative-position") return relativePositionVisual(task);
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
    additionSeriesStep = 0;
    countdownStep = 0;
    applePainted = [];
    arrowOrderStep = 0;
    frogRunToken += 1;
    if (frogTimer !== null) global.clearTimeout(frogTimer);
    frogTimer = null;
    const isDone = progress.completed.includes(task.id);
    const isPaint = task.kind === "paint";
    app.innerHTML = '<section class="game-card"><div class="game-top"><div class="game-top-left"><button type="button" class="map-button" data-action="back-world">←</button><span>ÁREA ' + world.number + ' · DESAFIO ' + (index + 1) + '/' + tasks.length + '</span></div><span class="capi-avatar" aria-hidden="true"><i></i><b></b><span></span></span></div>' +
      '<h1>' + esc(task.title) + '</h1><p class="game-prompt"><button type="button" class="listen-button" data-speak="' + esc(task.prompt) + '" aria-label="Ouvir instrução">🔊</button><span>' + esc(task.prompt) + '</span></p>' +
      '<div class="game-board">' + renderVisual(task) + '</div>' +
      '<p id="task-feedback" class="task-feedback" role="status" aria-live="polite">' + (isDone ? "Este desafio já foi concluído. Você pode praticar novamente." : (isPaint ? "Escolha uma cor na paleta e pinte os círculos." : task.kind === "apple-paint-count" ? "Toque em cada maçã para colori-la." : task.kind === "fish-crab-count" ? "Conte somente os peixes." : task.kind === "double-countdown" ? "Descubra os dois números que estão faltando." : "Toque na opção que completa o desafio.")) + '</p>' +
      '<div class="game-actions"><button type="button" class="quiet-button" data-action="back-world">Voltar aos desafios</button>' +
      '<button type="button" class="next-button" data-action="next-task" ' + (!isDone ? "disabled" : "") + '>' + (index < tasks.length - 1 ? "Próximo desafio →" : "Concluir área ✓") + '</button></div>' +
      '<p class="painter-note">A Capi está aqui para ajudar. Você pode ouvir a instrução novamente sempre que precisar.</p></section>';
    if (task.kind === "connect-polygon") setupPolygonDrawing(task);
    if (task.kind === "shape-sort") setupShapeSorting(task);
    if (task.kind === "number-path") setupNumberPath(task);
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
  function handleArrowOrderChoice(button) {
    const task = currentTask();
    if (!task || task.kind !== "arrow-order" || button.disabled) return;
    const choice = task.choices.find(item => item.id === button.dataset.arrowChoiceId);
    const expected = task.sequence[arrowOrderStep];
    if (!choice || !expected) return;
    if (choice.direction !== expected.direction || choice.color !== expected.color) {
      feedback("Observe a seta que vem agora e tente outra.", "hint");
      return;
    }
    button.disabled = true;
    button.classList.add("is-selected");
    const reference = document.querySelector('[data-arrow-step="' + arrowOrderStep + '"]');
    if (reference) reference.classList.add("is-complete");
    arrowOrderStep += 1;
    const counter = document.getElementById("arrow-order-progress");
    if (counter) counter.textContent = arrowOrderStep + " / " + task.sequence.length;
    if (arrowOrderStep === task.sequence.length) {
      completeTask("Você copiou todas as setas na ordem certa! 🌟");
    } else {
      feedback("Muito bem! Agora encontre a próxima seta.", "good");
    }
  }
  function handleChoice(button) {
    const task = currentTask();
    if (!task) return;
    if (task.kind === "connect-polygon" && !document.getElementById("polygon-answer")?.contains(button)) return;
    if (task.kind === "frog-jumps" && document.getElementById("frog-answer")?.hidden !== false) return;
    highlightOption(button);
    const value = decodeURIComponent(button.dataset.choice || "");

    if (task.kind === "addition-series") {
      const problem = task.problems[additionSeriesStep];
      if (Number(value) !== problem.answer) {
        feedback("Quase! Conte os grupos e tente novamente.", "hint");
        return;
      }
      if (additionSeriesStep === task.problems.length - 1) {
        completeTask("Você resolveu todas as somas de +1, +2 e +3! 🌟");
        return;
      }
      additionSeriesStep += 1;
      const board = document.querySelector(".game-board");
      if (board) board.innerHTML = renderVisual(task);
      feedback("Muito bem! Vamos para a próxima soma.", "good");
      return;
    }

    if (task.kind === "double-countdown") {
      if (Number(value) !== task.answers[countdownStep]) {
        feedback("Quase! Conte para trás e tente novamente.", "hint");
        return;
      }
      if (countdownStep === task.answers.length - 1) {
        completeTask("Você encontrou os dois números que faltavam! 🌟");
        return;
      }
      countdownStep += 1;
      const board = document.querySelector(".game-board");
      if (board) board.innerHTML = renderVisual(task);
      feedback("Muito bem! Agora descubra o próximo número que falta.", "good");
      return;
    }
    if (task.kind === "apple-paint-count" && document.getElementById("apple-paint-answer")?.hidden !== false) return;

    let correct = false;
    if (task.kind === "proportion" || task.kind === "sound-pattern" || task.kind === "nested-shape-match" || task.kind === "shape-color-choice" || task.kind === "complex-match" || task.kind === "arrow-sequence-match" || task.kind === "relative-position") {
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
    const dimension = Math.sqrt(task.grid.length);
    if (!Number.isInteger(dimension) || dimension < 2) return;
    const rowCol = task.moves.reduce((position, move) => {
      const row = position.row + (move === "up" ? -1 : move === "down" ? 1 : 0);
      const col = position.col + (move === "left" ? -1 : move === "right" ? 1 : 0);
      return {
        row: Math.max(0, Math.min(dimension - 1, row)),
        col: Math.max(0, Math.min(dimension - 1, col))
      };
    }, { row: Math.floor(task.startIndex / dimension), col: task.startIndex % dimension });
    const answer = rowCol.row * dimension + rowCol.col;
    if (Number(button.dataset.cell) === answer && answer === task.answerIndex) completeTask("Caminho encontrado! Você seguiu todas as setas.");
    else feedback("Siga uma seta de cada vez, partindo da pegada.", "hint");
  }
  function handleApplePaint(button) {
    const task = currentTask();
    if (!task || task.kind !== "apple-paint-count" || button.dataset.painted === "true") return;
    const index = Number(button.dataset.appleIndex);
    if (!Number.isInteger(index) || index < 0 || index >= task.appleCount) return;
    const color = task.appleColors[index % task.appleColors.length];
    const body = button.querySelector(".apple-body");
    if (!body) return;
    body.setAttribute("fill", DATA.COLORS[color] || "#e64b42");
    button.dataset.painted = "true";
    button.disabled = true;
    button.classList.add("is-painted");
    button.setAttribute("aria-label", "Maçã " + (index + 1) + " pintada");
    applePainted[index] = color;
    const count = applePainted.filter(Boolean).length;
    const counter = document.getElementById("apple-paint-counter");
    if (counter) counter.innerHTML = '<span>🍎</span> Maçãs pintadas: <strong>' + count + ' / ' + task.appleCount + '</strong>';
    if (count === task.appleCount) {
      const answer = document.getElementById("apple-paint-answer");
      if (answer) answer.hidden = false;
      feedback("Todas as maçãs foram pintadas! Agora conte quantas são.", "good");
    } else {
      feedback("Mais uma maçã pintada! Continue contando.", "good");
    }
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
  function setupNumberPath(task) {
    const svg = document.getElementById("number-path-svg");
    const stage = document.querySelector(".number-path-stage");
    const preview = document.getElementById("number-path-preview");
    const lines = document.getElementById("number-path-lines");
    const face = document.getElementById("number-path-face");
    const hint = document.getElementById("number-path-hint");
    if (!svg || !stage || !preview || !lines || !face || !hint) return;
    let accepted = [];
    let drawing = false;
    let pointerId = null;
    let completed = false;
    const pointByValue = new Map(task.points.map((point) => [point.value, point]));
    const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const coordinates = (event) => {
      const rect = svg.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(360, (event.clientX - rect.left) / rect.width * 360)),
        y: Math.max(0, Math.min(300, (event.clientY - rect.top) / rect.height * 300))
      };
    };
    const expectedValue = () => accepted.length + 1;
    const lastValue = () => accepted.length ? accepted[accepted.length - 1] : null;
    const renderLines = () => {
      const path = accepted.map((value) => pointByValue.get(value).x + "," + pointByValue.get(value).y).join(" ");
      lines.setAttribute("points", path);
    };
    const updateDots = () => {
      svg.querySelectorAll("[data-point-value]").forEach((node) => {
        const value = Number(node.dataset.pointValue);
        node.classList.toggle("is-next", !completed && value === expectedValue());
        node.classList.toggle("is-visited", accepted.includes(value));
      });
    };
    const hideFace = () => { face.hidden = true; };
    const showFace = (event, mood) => {
      const rect = stage.getBoundingClientRect();
      face.textContent = mood === "happy" ? "😊" : "😟";
      face.style.left = Math.max(18, Math.min(rect.width - 18, event.clientX - rect.left)) + "px";
      face.style.top = Math.max(6, event.clientY - rect.top - 24) + "px";
      face.hidden = false;
      face.classList.toggle("happy", mood === "happy");
      face.classList.toggle("sad", mood === "sad");
    };
    const showPreview = (from, to) => {
      preview.setAttribute("x1", from.x);
      preview.setAttribute("y1", from.y);
      preview.setAttribute("x2", to.x);
      preview.setAttribute("y2", to.y);
      preview.setAttribute("visibility", "visible");
    };
    const hidePreview = () => preview.setAttribute("visibility", "hidden");
    const reset = () => {
      accepted = [];
      drawing = false;
      pointerId = null;
      completed = false;
      lines.setAttribute("points", "");
      hidePreview();
      hideFace();
      hint.textContent = "Comece no número 1. O próximo número vai crescer.";
      updateDots();
      const next = document.querySelector('[data-action="next-task"]');
      if (next) next.disabled = true;
    };
    const finish = () => {
      completed = true;
      drawing = false;
      renderLines();
      hidePreview();
      hideFace();
      hint.textContent = "Você ligou todos os números em ordem!";
      updateDots();
      completeTask("Muito bem! Você chegou do 1 ao 9 sem pular nenhum número. 🌟");
    };
    const handlePointerDown = (event) => {
      if (completed || (event.pointerType === "mouse" && event.button !== 0)) return;
      const position = coordinates(event);
      const startValue = lastValue() || 1;
      const start = pointByValue.get(startValue);
      if (distance(position, start) > 32) {
        showFace(event, "sad");
        hint.textContent = "Comece no último número que você ligou.";
        return;
      }
      event.preventDefault();
      drawing = true;
      pointerId = event.pointerId;
      try { svg.setPointerCapture(pointerId); } catch { /* captura opcional */ }
      if (!accepted.length) {
        accepted.push(1);
        renderLines();
        updateDots();
      }
      const from = pointByValue.get(lastValue());
      showPreview(from, position);
    };
    const handlePointerMove = (event) => {
      if (!drawing || event.pointerId !== pointerId) return;
      event.preventDefault();
      const position = coordinates(event);
      const target = pointByValue.get(expectedValue());
      const targetDistance = distance(position, target);
      const nearest = task.points.find(point => distance(position, point) <= 29);
      if (targetDistance <= 36) showFace(event, "happy");
      else if (nearest && nearest.value !== expectedValue() && nearest.value !== lastValue()) showFace(event, "sad");
      else hideFace();
      if (targetDistance <= 25) {
        const nextValue = expectedValue();
        accepted.push(nextValue);
        renderLines();
        updateDots();
        hidePreview();
        if (nextValue === 9) {
          finish();
          return;
        }
        hint.textContent = "Muito bem! Continue para o próximo número.";
      } else {
        showPreview(pointByValue.get(lastValue()), position);
      }
    };
    const handlePointerUp = (event) => {
      if (!drawing || event.pointerId !== pointerId) return;
      handlePointerMove(event);
      drawing = false;
      pointerId = null;
      hidePreview();
      if (!completed && accepted.length) hint.textContent = "Soltou? Continue do último número conectado.";
      try { if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId); } catch { /* captura opcional */ }
    };
    svg.addEventListener("pointerdown", handlePointerDown);
    svg.addEventListener("pointermove", handlePointerMove);
    svg.addEventListener("pointerup", handlePointerUp);
    svg.addEventListener("pointercancel", () => {
      drawing = false;
      pointerId = null;
      hidePreview();
      hideFace();
    });
    document.querySelector('[data-action="reset-number-path"]')?.addEventListener("click", reset);
    updateDots();
  }

    function playFrogJumps(task) {
    const frog = document.getElementById("frog-character");
    const answer = document.getElementById("frog-answer");
    const button = document.querySelector('[data-action="start-frog"]');
    const hint = document.getElementById("frog-hint");
    if (!frog || !answer || !button || !hint) return;
    frogRunToken += 1;
    const runToken = frogRunToken;
    if (frogTimer !== null) global.clearTimeout(frogTimer);
    let jumps = 0;
    answer.hidden = true;
    button.disabled = true;
    button.textContent = "🐸";
    frog.style.left = "11.43%";
    hint.textContent = "Observe os pulos do sapo!";
    const jump = () => {
      if (runToken !== frogRunToken) return;
      jumps += 1;
      frog.style.left = (11.43 + jumps / task.jumpCount * 77.14) + "%";
      frog.classList.remove("is-hopping");
      void frog.offsetWidth;
      frog.classList.add("is-hopping");
      hint.textContent = "🐸";
      if (jumps < task.jumpCount) {
        frogTimer = global.setTimeout(jump, 650);
      } else {
        frogTimer = global.setTimeout(() => {
          if (runToken !== frogRunToken) return;
          frog.classList.remove("is-hopping");
          button.disabled = false;
          button.textContent = "↻";
          hint.textContent = "Quantos pulos você contou?";
          answer.hidden = false;
          feedback("Agora escolha quantos pulos o sapo deu.", "good");
          frogTimer = null;
        }, 520);
      }
    };
    frogTimer = global.setTimeout(jump, 280);
  }

    function setupShapeSorting(task) {
    const root = document.getElementById("shape-sort");
    const sourceTray = document.getElementById("sort-source-tray");
    if (!root || !sourceTray) return;
    const items = new Map(task.items.map((item) => [item.id, item]));
    let drag = null;

    const setCount = (shape) => {
      const countNode = root.querySelector('[data-sort-count="' + shape + '"]');
      const zone = root.querySelector('[data-sort-items="' + shape + '"]');
      if (countNode && zone) countNode.textContent = String(zone.querySelectorAll("[data-sort-id]").length);
    };
    const removeGhost = () => {
      if (drag?.ghost?.parentNode) drag.ghost.parentNode.removeChild(drag.ghost);
      drag?.item?.classList.remove("is-dragging");
    };
    const moveGhost = (event) => {
      if (!drag?.ghost) return;
      drag.ghost.style.left = (event.clientX - drag.offsetX) + "px";
      drag.ghost.style.top = (event.clientY - drag.offsetY) + "px";
    };
    const reset = () => {
      task.items.forEach((item) => {
        const node = root.querySelector('[data-sort-id="' + item.id + '"]');
        if (!node) return;
        node.disabled = false;
        node.dataset.placed = "false";
        node.classList.remove("is-placed", "is-dragging");
        sourceTray.appendChild(node);
      });
      task.zones.forEach(setCount);
      const instruction = document.getElementById("sort-instruction");
      if (instruction) instruction.textContent = "Arraste cada figura para o grupo da mesma forma.";
    };
    root.addEventListener("pointerdown", (event) => {
      const itemNode = event.target.closest("[data-sort-id]");
      if (!itemNode || itemNode.dataset.placed === "true" || (event.pointerType === "mouse" && event.button !== 0)) return;
      event.preventDefault();
      const rect = itemNode.getBoundingClientRect();
      const ghost = itemNode.cloneNode(true);
      ghost.classList.add("sort-drag-ghost");
      ghost.style.width = rect.width + "px";
      ghost.style.height = rect.height + "px";
      document.body.appendChild(ghost);
      drag = {
        item: itemNode,
        ghost,
        pointerId: event.pointerId,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top
      };
      itemNode.classList.add("is-dragging");
      try { root.setPointerCapture(event.pointerId); } catch { /* captura opcional */ }
      moveGhost(event);
    });
    root.addEventListener("pointermove", (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      event.preventDefault();
      moveGhost(event);
      const underPointer = document.elementFromPoint(event.clientX, event.clientY);
      const zone = underPointer?.closest("[data-sort-zone]");
      root.querySelectorAll("[data-sort-zone]").forEach((node) => node.classList.toggle("is-hovered", node === zone));
    });
    root.addEventListener("pointerup", (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const underPointer = document.elementFromPoint(event.clientX, event.clientY);
      const zone = underPointer?.closest("[data-sort-zone]");
      const item = drag.item;
      const itemData = items.get(item.dataset.sortId);
      removeGhost();
      root.querySelectorAll("[data-sort-zone]").forEach((node) => node.classList.remove("is-hovered"));
      if (zone && itemData && zone.dataset.sortZone === itemData.shape) {
        const target = zone.querySelector(".sort-zone-items");
        target.appendChild(item);
        item.disabled = true;
        item.dataset.placed = "true";
        item.classList.add("is-placed");
        setCount(itemData.shape);
        const placed = root.querySelectorAll('[data-sort-id][data-placed="true"]').length;
        const instruction = document.getElementById("sort-instruction");
        if (instruction) instruction.textContent = placed === task.items.length
          ? "Todos os grupos estão completos!"
          : "Muito bem! Continue separando as formas parecidas.";
        if (placed === task.items.length) completeTask("Você separou todas as formas nos grupos certos! 🌟");
        else feedback("Boa escolha! Encontre o lugar das próximas formas.", "good");
      } else {
        feedback("Essa forma pertence a outro grupo. Observe o modelo e tente novamente.", "hint");
      }
      drag = null;
      try { if (root.hasPointerCapture(event.pointerId)) root.releasePointerCapture(event.pointerId); } catch { /* captura opcional */ }
    });
    root.addEventListener("pointercancel", () => {
      removeGhost();
      drag = null;
      root.querySelectorAll("[data-sort-zone]").forEach((node) => node.classList.remove("is-hovered"));
    });
    root.querySelector('[data-action="reset-sorting"]')?.addEventListener("click", () => {
      reset();
      feedback("Vamos tentar organizar as formas novamente.");
    });
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
        if (name === "start-frog") { const task = currentTask(); if (task?.kind === "frog-jumps") playFrogJumps(task); return; }
    }
    const speechButton = target.closest("[data-speak]");
    if (speechButton) {
      if (!speak(speechButton.dataset.speak)) feedback("A leitura em voz alta não está disponível. Peça ajuda ao professor.", "hint");
      return;
    }
    const colorButton = target.closest("[data-paint-color]");
    if (colorButton) { handlePaintColor(colorButton); return; }
    const appleButton = target.closest("[data-apple-index]");
    if (appleButton) { handleApplePaint(appleButton); return; }
    const paintTarget = target.closest("[data-paint-target]");
    if (paintTarget) { handlePaintTarget(paintTarget); return; }
    const cell = target.closest("[data-cell]");
    if (cell) { handleGridCell(cell); return; }
    const arrowChoice = target.closest("[data-arrow-choice-id]");
    if (arrowChoice) { handleArrowOrderChoice(arrowChoice); return; }
    const choice = target.closest("[data-choice]");
    if (choice) { handleChoice(choice); return; }
    const option = target.closest("[data-option-index]");
    if (option) {
      const task = currentTask();
      if (task && (task.kind === "proportion" || task.kind === "sound-pattern" || task.kind === "complex-match" || task.kind === "arrow-sequence-match")) handleChoice(option);
    }
  });

  global.addEventListener("pagehide", () => {
    frogRunToken += 1;
    if (frogTimer !== null) global.clearTimeout(frogTimer);
    try { global.speechSynthesis?.cancel(); } catch { /* voz opcional */ }
    try { audioContext?.close(); } catch { /* áudio opcional */ }
  });

  renderMap();
})(window);
