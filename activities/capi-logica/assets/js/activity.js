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
  function tokenHTML(value) {
    const key = String(value);
    if (DATA.COLORS[key]) return '<span class="token token-color ' + esc(key) + '" aria-label="cor"></span>';
    if (DATA.SHAPES[key]) return '<span class="token token-shape" aria-label="forma">' + DATA.SHAPES[key] + '</span>';
    if (DATA.ARROWS[key]) return '<span class="token token-arrow" aria-label="direção">' + DATA.ARROWS[key] + '</span>';
    if (/^[A-Z]$/.test(key)) return '<span class="token token-letter">' + esc(key) + '</span>';
    const parts = key.split("-");
    if (parts.length === 2 && DATA.COLORS[parts[0]] && DATA.SHAPES[parts[1]]) {
      return '<span class="token combo-token ' + esc(parts[0]) + '" aria-label="combinação de forma e cor">' + DATA.SHAPES[parts[1]] + '</span>';
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
  function patternVisual(sequence) {
    return '<div class="sequence-row">' + sequence.map((value) =>
      value === null
        ? '<span class="sequence-tile missing" aria-label="espaço vazio">?</span>'
        : '<span class="sequence-tile">' + tokenHTML(value) + '</span>'
    ).join("") + '</div>';
  }
  function groupVisual(emoji, count) {
    return '<span class="counter-row">' + Array.from({ length: count }, () => '<span class="counter" aria-hidden="true">' + esc(emoji) + '</span>').join("") + '</span>';
  }
  function paintVisual(task) {
    return '<div class="paint-legend">' + task.legend.map((item) =>
      '<div class="legend-item"><span class="option-number">' + item.number + '</span><span class="legend-dot" style="background:' + DATA.COLORS[item.color] + '"></span></div>'
    ).join("") + '</div>' +
    '<div class="paint-palette" aria-label="Paleta de cores">' + task.legend.map((item) =>
      '<button type="button" class="palette-button" data-paint-color="' + item.color + '" aria-label="Escolher cor ' + item.number + '"><span class="paint-swatch ' + item.color + '"></span></button>'
    ).join("") + '</div>' +
    '<div class="paint-targets">' + task.targets.map((number, index) =>
      '<button type="button" class="paint-target" data-paint-target="' + index + '" data-number="' + number + '" aria-label="Pintar círculo ' + (index + 1) + ', número ' + number + '">' + number + '</button>'
    ).join("") + '</div>' +
    '<p class="micro-hint" id="paint-hint">Escolha uma cor e depois toque no círculo correspondente.</p>';
  }
  function shapeVisual(task) {
    return '<div class="shape-target">' + tokenHTML(task.target) + '</div><div class="option-grid">' +
      task.options.map((value, index) => optionButton(value, "Opção " + (index + 1), index)).join("") + '</div>';
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
        (index === task.startIndex ? '<small class="start-paw">🐾</small>' : '') + esc(value) + '</button>'
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
    return '<div class="matrix-grid">' + task.grid.map((value) =>
      '<div class="matrix-cell ' + (value === null ? "missing" : "") + '">' + (value === null ? "?" : tokenHTML(value)) + '</div>'
    ).join("") + '</div><div class="option-grid">' + task.options.map((value, index) => optionButton(value, "Peça " + (index + 1), index)).join("") + '</div>';
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
      return patternVisual(task.sequence) + '<div class="option-grid">' + task.options.map((value, index) => optionButton(value, "Opção " + (index + 1), index)).join("") + '</div>';
    }
    if (task.kind === "paint") return paintVisual(task);
    if (task.kind === "shape-match") return shapeVisual(task);
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
        '<h2>' + esc(world.title) + '</h2><p>' + esc(world.subtitle) + '</p>' +
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
    app.innerHTML = '<section class="game-card"><div class="game-top"><div class="game-top-left"><button type="button" class="map-button" data-action="back-world">←</button><span>ÁREA ' + world.number + ' · DESAFIO ' + (index + 1) + '/' + tasks.length + '</span></div><span class="capi-avatar" aria-hidden="true"><i></i><b></b></span></div>' +
      '<h1>' + esc(task.title) + '</h1><p class="game-prompt"><button type="button" class="listen-button" data-speak="' + esc(task.prompt) + '" aria-label="Ouvir instrução">🔊</button><span>' + esc(task.prompt) + '</span></p>' +
      '<div class="game-board">' + renderVisual(task) + '</div>' +
      '<p id="task-feedback" class="task-feedback" role="status" aria-live="polite">' + (isDone ? "Este desafio já foi concluído. Você pode praticar novamente." : (isPaint ? "Escolha uma cor na paleta e pinte os círculos." : "Toque na opção que completa o desafio.")) + '</p>' +
      '<div class="game-actions"><button type="button" class="quiet-button" data-action="back-world">Voltar aos desafios</button>' +
      '<button type="button" class="next-button" data-action="next-task" ' + (!isDone ? "disabled" : "") + '>' + (index < tasks.length - 1 ? "Próximo desafio →" : "Concluir área ✓") + '</button></div>' +
      '<p class="painter-note">A Capi está aqui para ajudar. Você pode ouvir a instrução novamente sempre que precisar.</p></section>';
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
  function handleChoice(button) {
    const task = currentTask();
    if (!task) return;
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
  function playSoundSequence(sequence) {
    const AudioContextClass = global.AudioContext || global.webkitAudioContext;
    if (!AudioContextClass) { feedback("O som não está disponível neste navegador. Você ainda pode observar as opções.", "hint"); return; }
    try {
      if (!audioContext) audioContext = new AudioContextClass();
      const context = audioContext;
      const start = context.currentTime + 0.08;
      if (context.state === "suspended") context.resume();
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
