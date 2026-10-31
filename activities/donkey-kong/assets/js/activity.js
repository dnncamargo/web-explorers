(function (global) {
  const DATA = global.DonkeyKongData;
  const STORE = global.DonkeyKongProgress;
  if (!DATA || !STORE) return;

  const loaded = STORE.load();
  let progress = loaded.progress;
  let persistenceMode = loaded.mode;
  let saveTimer = null;
  let bossPagehideHandler = null;

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }
  function normalize(value) {
    return String(value).normalize("NFC");
  }
  function compareTyping(value, target) {
    return normalize(value).toLocaleLowerCase("pt-BR") === normalize(target).toLocaleLowerCase("pt-BR");
  }
  function saveProgress() {
    const result = STORE.save(progress, persistenceMode);
    persistenceMode = result.mode;
    updatePersistence();
  }
  function updatePersistence() {
    const element = document.getElementById("persistence-status");
    if (!element) return;
    const labels = { localStorage: "Progresso salvo neste navegador.", sessionStorage: "Progresso salvo nesta sessão do navegador.", memory: "O navegador não permitiu salvar; o progresso fica disponível enquanto esta página estiver aberta." };
    element.textContent = labels[persistenceMode] || labels.memory;
  }
  function countComplete() {
    return Object.values(progress.checkpoints).reduce((sum, count) => sum + count, 0);
  }
  function allWorldsComplete() {
    return Object.keys(DATA.worlds).every((id) => progress.checkpoints[id] >= DATA.worlds[id].checkpoints.length);
  }
  function renderGameArt(world, className, limit) {
    const characters = (world.characters || []).slice(0, limit || 5);
    return '<div class="' + className + '" aria-label="Personagens e elementos de ' + escapeHTML(world.title) + '">' +
      characters.map((character) =>
        '<img data-game-art src="' + escapeHTML(character.src) + '" alt="' + escapeHTML(character.alt) +
        '" title="' + escapeHTML(character.alt) + '" loading="lazy" referrerpolicy="no-referrer">'
      ).join("") + '</div>';
  }
  function bindGameArt(host) {
    if (!host) return;
    host.querySelectorAll("img[data-game-art]").forEach((image) => {
      image.addEventListener("error", () => {
        image.hidden = true;
        const wrapper = image.closest("a");
        if (wrapper) wrapper.hidden = true;
      }, { once: true });
    });
  }
  function renderMap() {
    const host = document.getElementById("world-map");
    if (!host) return;
    const cards = Object.values(DATA.worlds).map((world) => {
      const count = progress.checkpoints[world.id] || 0;
      const total = world.checkpoints.length;
      return '<a class="world-card world-card-' + world.id + '" href="' + world.page + '">' +
        '<span class="world-number">MUNDO ' + world.number + ' · ' + total + ' CHECKPOINTS</span>' +
        renderGameArt(world, "world-card-art", 2) +
        '<h2>' + escapeHTML(world.title) + '</h2>' +
        '<p>' + escapeHTML(world.intro) + '</p>' +
        '<span class="world-progress">' + count + ' de ' + total + ' checkpoints concluídos</span>' +
        '<span class="world-action"><span>' + (count ? "Continuar aventura" : "Explorar mundo") + '</span><span aria-hidden="true">→</span></span></a>';
    }).join("");
    const bossCount = progress.boss.passed ? "Missão concluída" : "8 correções · poema integral";
    host.innerHTML = cards +
      '<a class="world-card boss-card" href="king-k-rool.html"><span class="world-number">CHEFE FINAL · REVISÃO INTEGRADA</span>' +
      '<h2>King K. Rool</h2><p>Recupere a Canção do Exílio com seleção, edição, acentuação, pontuação e atalhos.</p>' +
      '<span class="world-progress">' + bossCount + '</span><span class="world-action"><span>' + (progress.boss.passed ? "Rever missão" : "Entrar no desafio") + '</span><span aria-hidden="true">→</span></span></a>';
    bindGameArt(host);
    const summary = document.getElementById("map-summary");
    const totalCheckpoints = Object.values(DATA.worlds).reduce((sum, item) => sum + item.checkpoints.length, 0);
    if (summary) summary.innerHTML = '<span>' + countComplete() + ' de ' + totalCheckpoints + ' checkpoints concluídos</span><span>' +
      (progress.boss.passed ? "Chefe final derrotado" : "Missão final disponível") + '</span><span>Sem cronômetro</span>';
    const reset = document.getElementById("reset-progress");
    if (reset) reset.onclick = () => {
      if (!global.confirm("Apagar somente o progresso de Donkey Kong Country neste navegador?")) return;
      progress = STORE.reset();
      persistenceMode = "localStorage";
      saveProgress();
      renderMap();
      updatePersistence();
    };
    updatePersistence();
  }

  function setupMapEntryOverlay() {
    const screen = document.getElementById("start-screen");
    const button = document.getElementById("start-button");
    const status = document.getElementById("start-status");
    const buttonLabel = document.getElementById("start-button-label");
    if (!screen || !button || !status || !buttonLabel) return;

    function allowEntry(withMusic) {
      button.disabled = false;
      buttonLabel.textContent = withMusic ? "ENTRAR" : "SEM MÚSICA";
      status.textContent = withMusic
        ? "Rádio pronta. Clique no barril para entrar e iniciar a trilha."
        : "A rádio não respondeu. Você pode entrar sem música; a trilha também pode ser aberta no controle do YouTube.";
      button.focus({ preventScroll: true });
    }

    button.disabled = true;
    buttonLabel.textContent = "AGUARDE…";
    status.textContent = "Conectando à trilha da Ilha dos Kongs…";

    global.addEventListener("donkeykong:radio-ready", () => allowEntry(true), { once: true });
    global.addEventListener("donkeykong:radio-error", () => allowEntry(false), { once: true });

    if (global.DonkeyKongRadio?.isReady()) allowEntry(true);
    else if (global.DonkeyKongRadio?.hasFailed()) allowEntry(false);

    button.addEventListener("click", () => {
      if (button.disabled) return;
      if (global.DonkeyKongRadio?.isReady()) global.DonkeyKongRadio.playFromGesture();
      button.disabled = true;
      button.classList.add("entering");
      screen.classList.add("leaving");
      global.setTimeout(() => screen.remove(), 600);
    });
  }

  function fingerName(finger) {
    return ({
      "left-pinky": "mínimo esquerdo", "left-ring": "anelar esquerdo", "left-middle": "médio esquerdo", "left-index": "indicador esquerdo",
      "right-index": "indicador direito", "right-middle": "médio direito", "right-ring": "anelar direito", "right-pinky": "mínimo direito", thumb: "polegares"
    })[finger] || "";
  }
  function keyFinger(key) {
    return DATA.fingers[String(key).toLocaleLowerCase("pt-BR")] || "";
  }
  function keyRows(currentKey, completedText = "") {
    const rows = ["qwertyuiop", "asdfghjklç", "zxcvbnm"];
    const activeKey = typeof currentKey === "string" ? currentKey.toLocaleLowerCase("pt-BR") : "";
    return rows.map((row, rowIndex) => '<div class="keyboard-row">' + Array.from(row).map((key) => {
      const finger = keyFinger(key);
      const home = rowIndex === 1 && "asdfghjklç".includes(key);
      const bump = key === "f" || key === "j";
      const active = activeKey && activeKey === key;
      const used = completedText.toLocaleLowerCase("pt-BR").includes(key);
      return '<span class="keycap ' + finger + (home ? " home" : "") + (bump ? " bump" : "") + (active ? " is-next" : "") + (used ? " is-used" : "") + '" data-key="' + key + '">' + key.toLocaleUpperCase("pt-BR") + '</span>';
    }).join("") + '</div>').join("") +
      '<div class="keyboard-row"><span class="keycap thumb key-space' + (activeKey === " " ? " is-next" : "") + (completedText.includes(" ") ? " is-used" : "") + '" data-key=" ">ESPAÇO · polegares</span></div>';
  }
  function keyboardGuide() {
    const fingers = [
      ["mínimo", "pinky"], ["anelar", "ring"], ["médio", "middle"], ["indicador", "index"], ["polegar", "thumb"]
    ];
    function hand(side, label) {
      const shapes = side === "left" ? fingers : fingers.slice().reverse();
      return '<div class="hand ' + side + '"><span class="hand-label">' + label + '</span><div class="finger-shapes">' +
        shapes.map((item) => '<span class="finger-shape ' + item[1] + '" aria-label="' + item[0] + '"></span>').join("") +
        '</div></div>';
    }
    return '<section class="finger-lesson"><h3>Conhecendo as mãos e a posição-base</h3>' +
      '<div class="hand-diagram">' + hand("left", "MÃO ESQUERDA") + hand("right", "MÃO DIREITA") + '</div>' +
      '<p>Os indicadores encontram as marcas tácteis em <strong>F</strong> e <strong>J</strong>. Na fileira-base, esquerda: A S D F. Direita: J K L Ç. Os polegares usam a barra de espaço.</p>' +
      '<div class="keyboard-guide"><h3>Teclado ABNT2 · três fileiras</h3>' + keyRows() +
      '<div class="finger-legend">' +
      '<span style="--swatch:#f2a6a1">mínimo E</span><span style="--swatch:#ffc47d">anelar E</span><span style="--swatch:#ffe27d">médio E</span><span style="--swatch:#99d994">indicador E</span><span style="--swatch:#89dcd3">indicador D</span><span style="--swatch:#92b9ef">médio D</span><span style="--swatch:#c2a7ef">anelar D</span><span style="--swatch:#f0a6cd">mínimo D</span><span style="--swatch:#b9c9c7">polegares</span></div></div>' +
      '<p><strong>Importante:</strong> as cores e o desenho são uma orientação. O aplicativo não consegue identificar qual dedo pressionou uma tecla; o professor observa a posição das mãos.</p></section>';
  }

  function renderGuide(world, host) {
    const guide = world.id === "jungle" ? keyboardGuide() :
      '<div class="guide-steps"><div class="guide-step"><strong>1. Veja a tecla e a combinação</strong><span>A ilustração mostra o modificador e a tecla física que será usada.</span></div><div class="guide-step"><strong>2. Digite no campo</strong><span>O sistema confere o texto à medida que você digita.</span></div><div class="guide-step"><strong>3. Avance automaticamente</strong><span>Ao concluir uma sequência, a próxima aparece nesta mesma página.</span></div></div>';
    const completed = progress.checkpoints[world.id] || 0;
    host.innerHTML = '<section class="guide-card"><p class="eyebrow pixel">MUNDO ' + world.number + ' · ' + world.checkpoints.length + ' CHECKPOINTS</p>' +
      '<h2>Antes de começar</h2><p>' + escapeHTML(world.guide) + '</p>' +
      '<div class="world-intro-art">' + renderGameArt(world, "world-character-strip", 5) + '</div>' +
      '<p class="world-reset-status">' + completed + ' de ' + world.checkpoints.length + ' checkpoints concluídos neste mundo.</p>' +
      guide +
      '<div class="guide-actions"><button class="button" id="start-world" type="button">Começar checkpoints</button>' +
      '<button class="button danger" id="reset-world" type="button"' + (completed === 0 ? ' disabled' : '') + '>↻ Resetar mundo</button>' +
      '<a class="button secondary" href="index.html">Voltar ao mapa</a></div></section>';
    bindGameArt(host);
    host.querySelector("#start-world").addEventListener("click", () => renderCheckpoint(world, host));
    host.querySelector("#reset-world").addEventListener("click", () => {
      if (!global.confirm("Resetar todo o progresso de " + world.title + "? Os outros mundos e a missão final serão preservados.")) return;
      if (!STORE.resetWorld(progress, world.id)) return;
      saveProgress();
      renderGuide(world, host);
    });
  }

  function renderDots(count, total) {
    return Array.from({ length: total }, (_, index) => '<span class="checkpoint-dot ' + (index < count ? "done" : "") + '" aria-hidden="true"></span>').join("");
  }
  function renderTarget(target, typed) {
    const chars = Array.from(target);
    return chars.map((char, index) => '<span class="target-char ' + keyFinger(char) + " " + (char === " " ? "space-char " : "") +
      (index < typed ? "is-done " : "") + (index === typed ? "is-current" : "") + '">' +
      (char === " " ? "␣" : escapeHTML(char)) + '</span>').join("");
  }
  function setFeedback(element, message, kind) {
    if (!element) return;
    element.className = "feedback" + (kind ? " " + kind : "");
    element.textContent = message;
  }

  function renderCheckpoint(world, host) {
    const completedCount = progress.checkpoints[world.id] || 0;
    const total = world.checkpoints.length;
    if (completedCount >= total) return renderWorldFinish(world, host);
    const number = completedCount + 1;
    const checkpoint = world.checkpoints[completedCount];
    const pageProgress = document.getElementById("page-progress");
    if (pageProgress) pageProgress.textContent = "CHECKPOINT " + number + "/" + total + " · " + world.title;
    host.innerHTML = '<section class="exercise-card">' +
      '<div class="checkpoint-strip"><span class="checkpoint-name pixel">CHECKPOINT ' + number + '/' + total + '</span><span class="checkpoint-dots" aria-label="' + completedCount + ' de ' + total + ' concluídos">' + renderDots(completedCount, total) + '</span></div>' +
      '<h2>' + escapeHTML(checkpoint.title) + '</h2><p class="instruction">' + escapeHTML(checkpoint.instruction) + '</p>' +
      (checkpoint.kind === "typing-sequence" ? "" : '<details class="demo-box"><summary>Ver demonstração e dica</summary><p>' + escapeHTML(checkpoint.hint) + '</p></details>') +
      '<div id="exercise-area"></div><p id="exercise-feedback" class="feedback" role="status" aria-live="polite">Faça a atividade usando o teclado físico, sem pressa.</p>' +
      '<div class="exercise-actions"><button id="reset-activity" class="button danger" type="button">↻ Resetar atividade</button>' +
      '<button id="check-action" class="button secondary" type="button" hidden>Conferir etapa</button>' +
      '<button id="continue-checkpoint" class="button" type="button" disabled>Continuar</button></div>' +
      '<p class="exercise-note">Não há cronômetro nem punição por erro. O sistema verifica texto, seleção e operações observáveis; não identifica os dedos usados.</p></section>';

    const area = host.querySelector("#exercise-area");
    const feedback = host.querySelector("#exercise-feedback");
    const checkButton = host.querySelector("#check-action");
    const continueButton = host.querySelector("#continue-checkpoint");
    const resetButton = host.querySelector("#reset-activity");
    let completed = false;

    function complete() {
      if (completed) return;
      completed = true;
      if (!STORE.completeCheckpoint(progress, world.id, number)) {
        setFeedback(feedback, "O progresso não foi atualizado. Volte ao mapa e tente novamente.", "gentle");
        completed = false;
        return;
      }
      saveProgress();
      setFeedback(feedback, "Checkpoint concluído. Você pode continuar quando estiver pronto.", "good");
      checkButton.disabled = true;
      continueButton.disabled = false;
      continueButton.textContent = number < total ? "Continuar para o checkpoint " + (number + 1) : "Concluir mundo";
    }
    function continueNext() {
      if (!completed) return;
      renderCheckpoint(world, host);
    }
    continueButton.addEventListener("click", continueNext);
    resetButton.addEventListener("click", () => {
      if (completed) {
        if (!global.confirm("Resetar esta atividade? Somente a conclusão deste checkpoint será desfeita.")) return;
        progress.checkpoints[world.id] = number - 1;
        saveProgress();
      }
      renderCheckpoint(world, host);
    });

    if (checkpoint.kind === "typing") renderTyping(checkpoint, area, feedback, checkButton, continueButton, complete);
    else if (checkpoint.kind === "typing-sequence") renderTypingSequence(checkpoint, area, feedback, checkButton, continueButton, complete);
    else if (checkpoint.kind === "selection") renderSelection(checkpoint, area, feedback, checkButton, complete);
    else if (checkpoint.kind === "edit-sequence") renderEditSequence(checkpoint, area, feedback, checkButton, complete);
    else if (checkpoint.kind === "native-edit") renderNativeEdit(checkpoint, area, feedback, checkButton, complete);
    else if (checkpoint.kind === "navigation") renderNavigation(checkpoint, area, feedback, checkButton, complete);
    else if (checkpoint.kind === "clipboard") renderClipboard(area, feedback, checkButton, complete);
    else if (checkpoint.kind === "undo") renderUndo(checkpoint, area, feedback, checkButton, complete);
    else if (checkpoint.kind === "integrated") renderIntegrated(checkpoint, area, feedback, checkButton, complete);
  }

  function renderTyping(checkpoint, area, feedback, checkButton, continueButton, complete) {
    let typed = 0;
    const target = checkpoint.target;
    area.innerHTML = '<div class="target-row" aria-label="Sequência que será digitada">' + renderTarget(target, 0) + '</div>' +
      '<div id="typing-keyboard" class="keyboard-guide"><h3>Teclado ABNT2 · próxima tecla em destaque</h3>' + keyRows(Array.from(target)[0], "") + '</div>' +
      '<label class="input-label" for="typing-input">Digite aqui com o teclado físico</label>' +
      '<textarea id="typing-input" class="exercise-area single-line" rows="1" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Digite a sequência do checkpoint"></textarea>';
    const input = area.querySelector("#typing-input");
    checkButton.hidden = true;
    continueButton.disabled = true;

    input.addEventListener("keydown", (event) => {
      if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1 || event.repeat) return;
      if (!event.isTrusted) {
        event.preventDefault();
        setFeedback(feedback, "Use uma tecla do teclado físico para praticar.", "gentle");
        return;
      }
      const expected = Array.from(target)[typed];
      if (expected === undefined) return;
      const actual = normalize(event.key).toLocaleLowerCase("pt-BR");
      if (checkpoint.requireShift && !event.shiftKey) {
        event.preventDefault();
        setFeedback(feedback, "Segure Shift enquanto pressiona esta tecla.", "gentle");
        return;
      }
      if (actual !== normalize(expected).toLocaleLowerCase("pt-BR")) {
        event.preventDefault();
        setFeedback(feedback, "Confira a próxima tecla no teclado e tente novamente. Sem pressa.", "gentle");
      } else {
        setFeedback(feedback, "Boa! Continue acompanhando a próxima tecla.", "good");
      }
    });
    input.addEventListener("input", () => {
      typed = Array.from(input.value).length;
      area.querySelector(".target-row").innerHTML = renderTarget(target, typed);
      const nextKey = Array.from(target)[typed];
      const keyboard = area.querySelector("#typing-keyboard");
      if (keyboard) keyboard.innerHTML = '<h3>Teclado ABNT2 · próxima tecla em destaque</h3>' + keyRows(nextKey, input.value);
      if (compareTyping(input.value, target)) {
        input.disabled = true;
        setFeedback(feedback, "Sequência completa. Muito bem!", "good");
        complete();
        continueButton.focus({ preventScroll: true });
      }
    });
    input.addEventListener("paste", (event) => {
      event.preventDefault();
      setFeedback(feedback, "Colar texto não conta como prática. Digite cada tecla com calma.", "gentle");
    });
    input.addEventListener("drop", (event) => event.preventDefault());
    input.focus();
  }

  function renderSequenceKeyboard(stage) {
    const target = stage.target || "";
    const uppercase = /[A-ZÁÉÍÓÚÂÊÔÃÕ]/u.test(target);
    const useShift = !!(stage.shiftLetters || stage.requireShiftSymbols || stage.deadKeyShift || uppercase);
    const numberKeys = [
      ["1", "!", "Digit1"], ["2", "@", "Digit2"], ["3", "#", "Digit3"], ["4", "$", "Digit4"],
      ["5", "%", "Digit5"], ["6", "¨", "Digit6"], ["7", "&", "Digit7"], ["8", "*", "Digit8"],
      ["9", "(", "Digit9"], ["0", ")", "Digit0"], ["-", "_", "Minus"], ["=", "+", "Equal"]
    ];
    function key(base, shifted, code, extra) {
      const highlighted = target.includes(shifted) || (extra && extra(stage));
      return '<kbd class="abnt-key' + (highlighted ? ' is-needed' : '') + '" data-code="' + code + '">' +
        '<span class="abnt-key-shift">' + shifted + '</span><span class="abnt-key-base">' + base + '</span></kbd>';
    }
    const shiftKeys = '<kbd class="modifier-key' + (useShift ? ' is-needed' : '') + '">SHIFT</kbd>';
    const altGr = stage.altGrCodes ? '<kbd class="modifier-key altgr-key is-needed">ALTGR</kbd>' : "";
    const accents = [
      ["´", "´", "acute", /[áéíóúÁÉÍÓÚ]/u.test(target)],
      ["~", "^", "circumflex", /[âêîôûÂÊÎÔÛ]/u.test(target)],
      [",", "<", "comma", target.includes(",")],
      [".", ">", "period", target.includes(".")]
    ];
    return '<div class="sequence-keyboard" aria-label="Teclado ABNT2: modificadores e símbolos">' +
      '<div class="sequence-keyboard-row sequence-modifiers">' + shiftKeys + altGr + '</div>' +
      '<div class="sequence-keyboard-row">' + numberKeys.map(([base, shifted, code]) => key(base, shifted, code)).join("") + '</div>' +
      '<div class="sequence-keyboard-row accent-keys">' + accents.map(([base, shifted, code, active]) => key(base, shifted, code, () => active)).join("") +
      '<span class="sequence-key-explainer">´ agudo · ~ til · ^ circunflexo</span></div>' +
      '<p class="sequence-keyboard-note">' +
      (stage.altGrCodes ? 'ALTGR + W produz ? neste teclado ABNT2.' :
        stage.symbolCodes ? 'SHIFT + 1 = ! · SHIFT + 7 = & · SHIFT + = = +' :
          stage.deadKeyShift === true ? 'SHIFT + ^ prepara o circunflexo; depois digite a vogal.' :
            'Pressione primeiro a tecla do acento e depois a vogal.') +
      '</p></div>';
  }

  function renderTypingSequence(checkpoint, area, feedback, checkButton, continueButton, complete) {
    let stageIndex = 0;
    let accepted = 0;
    let target = "";
    let stage = null;
    checkButton.hidden = true;
    continueButton.disabled = true;
    area.innerHTML = '<div class="sequence-progress" id="sequence-progress"></div>' +
      '<h3 class="sequence-instruction" id="sequence-instruction"></h3>' +
      '<p class="sequence-hint" id="sequence-hint"></p>' +
      '<div class="target-row" id="sequence-target" aria-label="Sequência que será digitada"></div>' +
      '<div id="sequence-keyboard-host"></div>' +
      '<label class="input-label" for="sequence-input">Digite aqui com o teclado físico</label>' +
      '<textarea id="sequence-input" class="exercise-area single-line" rows="1" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Digite a sequência indicada"></textarea>';
    const input = area.querySelector("#sequence-input");
    const progressLabel = area.querySelector("#sequence-progress");
    const instruction = area.querySelector("#sequence-instruction");
    const hint = area.querySelector("#sequence-hint");
    const targetRow = area.querySelector("#sequence-target");
    const keyboardHost = area.querySelector("#sequence-keyboard-host");

    function renderStage() {
      stage = checkpoint.stages[stageIndex];
      target = normalize(stage.target);
      accepted = 0;
      input.disabled = false;
      input.value = "";
      progressLabel.textContent = "ETAPA " + (stageIndex + 1) + "/" + checkpoint.stages.length;
      instruction.textContent = stage.instruction || ("Digite: " + target);
      hint.textContent = stage.hint || checkpoint.hint || "";
      targetRow.innerHTML = renderTarget(target, 0);
      keyboardHost.innerHTML = renderSequenceKeyboard(stage);
      input.focus();
    }

    function isAccentOutput(char) {
      return /[áéíóúÁÉÍÓÚâêîôûÂÊÎÔÛãõÃÕàèìòùÀÈÌÒÙ]/u.test(char || "");
    }

    function reject(event, message) {
      event.preventDefault();
      setFeedback(feedback, message, "gentle");
    }

    input.addEventListener("keydown", (event) => {
      if (event.isComposing || event.metaKey || event.repeat) return;
      if (!event.isTrusted) {
        reject(event, "Use o teclado físico para praticar. Sem pressa.");
        return;
      }
      const expected = Array.from(target)[accepted];
      if (expected === undefined || event.key === "Backspace" || event.key === "Tab" || event.key === "Shift") return;

      if (event.key === "Dead" || ["´", "~", "^"].includes(event.key)) {
        let requiredShift = stage.deadKeyShift;
        if (/[âêîôûÂÊÎÔÛ]/u.test(expected || "")) requiredShift = true;
        if (/[áéíóúÁÉÍÓÚãõÃÕàèìòùÀÈÌÒÙ]/u.test(expected || "")) requiredShift = false;
        if (requiredShift !== undefined && event.shiftKey !== requiredShift) {
          reject(event, requiredShift
            ? "Para preparar ^, segure Shift. Depois solte para digitar a vogal minúscula."
            : "Prepare este acento sem Shift; use Shift somente quando a vogal precisar ser maiúscula.");
        }
        return;
      }

      if (stage.altGrCodes && stage.altGrCodes[expected]) {
        const altGraph = (typeof event.getModifierState === "function" && event.getModifierState("AltGraph")) ||
          (event.altKey && event.code === stage.altGrCodes[expected]);
        if (!altGraph || event.code !== stage.altGrCodes[expected]) {
          reject(event, "Use AltGr + W para produzir o ponto de interrogação.");
        }
        return;
      }

      if (stage.symbolCodes && stage.symbolCodes[expected]) {
        const code = stage.symbolCodes[expected];
        if (!event.shiftKey || event.code !== code) {
          const combo = expected === "!" ? "Shift + 1" : expected === "&" ? "Shift + 7" : "Shift + =";
          reject(event, "Use " + combo + " para produzir " + expected + ".");
          return;
        }
      }

      if (/[A-ZÁÉÍÓÚÂÊÔÃÕ]/u.test(expected || "") && stage.shiftLetters && !event.shiftKey) {
        reject(event, "Segure Shift enquanto digita a letra maiúscula.");
        return;
      }
      if (/[a-z]/u.test(expected || "") && stage.caseSensitive && event.shiftKey) {
        reject(event, "Solte Shift para digitar esta letra minúscula.");
        return;
      }

      if (!isAccentOutput(expected) && event.key.length === 1 && stage.caseSensitive && event.key !== expected) {
        reject(event, "Confira se a tecla precisa de Shift ou se deve ser digitada sem Shift.");
      }
    });

    input.addEventListener("input", () => {
      const value = normalize(input.value);
      const chars = Array.from(value);
      accepted = chars.length;
      targetRow.innerHTML = renderTarget(target, accepted);
      if (value !== target && !target.startsWith(value)) {
        setFeedback(feedback, "Esta sequência ainda não corresponde ao exemplo. Corrija a tecla e continue.", "gentle");
        return;
      }
      if (value === target) {
        input.disabled = true;
        setFeedback(feedback, "Correto! " + (stageIndex + 1 < checkpoint.stages.length ? "Próxima etapa." : "Checkpoint concluído."), "good");
        if (stageIndex + 1 < checkpoint.stages.length) {
          stageIndex += 1;
          renderStage();
        } else {
          complete();
          continueButton.focus({ preventScroll: true });
        }
      }
    });

    input.addEventListener("paste", (event) => {
      event.preventDefault();
      setFeedback(feedback, "Colar texto não conta como prática. Digite cada tecla com calma.", "gentle");
    });
    input.addEventListener("drop", (event) => event.preventDefault());
    renderStage();
  }

  function renderSelection(checkpoint, area, feedback, checkButton, complete) {
    let stageIndex = 0;
    let shiftCount = 0;
    area.innerHTML = '<label class="input-label" for="selection-input">Texto para selecionar</label>' +
      '<textarea id="selection-input" class="exercise-area" rows="2" readonly></textarea>' +
      '<p id="selection-status" class="selection-status" aria-live="polite"></p>';
    const input = area.querySelector("#selection-input");
    const status = area.querySelector("#selection-status");
    input.value = checkpoint.source;
    checkButton.hidden = false;
    checkButton.disabled = false;

    function prepareStage() {
      const stage = checkpoint.stages[stageIndex];
      shiftCount = 0;
      input.focus();
      input.setSelectionRange(stage.caret, stage.caret);
      status.textContent = stage.name + ": seleção 0 caracteres. Use Shift + " + (stage.direction === "ArrowLeft" ? "←" : "→") + " " + stage.presses + (stage.presses === 1 ? " vez." : " vezes.");
    }
    input.addEventListener("keydown", (event) => {
      const stage = checkpoint.stages[stageIndex];
      if (event.isTrusted && event.shiftKey && event.key === stage.direction && !event.ctrlKey && !event.altKey) shiftCount += 1;
    });
    input.addEventListener("select", () => {
      status.textContent = "Trecho selecionado: " + (input.value.slice(input.selectionStart, input.selectionEnd) || "nenhum");
    });
    checkButton.addEventListener("click", () => {
      const stage = checkpoint.stages[stageIndex];
      const correct = input.selectionStart === stage.start && input.selectionEnd === stage.end &&
        input.value.slice(input.selectionStart, input.selectionEnd) === stage.expected && shiftCount >= stage.presses;
      if (!correct) {
        setFeedback(feedback, "A seleção ainda não está correta. Mantenha Shift pressionado e use a seta indicada.", "gentle");
        return;
      }
      if (stageIndex + 1 < checkpoint.stages.length) {
        stageIndex += 1;
        prepareStage();
        setFeedback(feedback, "Primeira seleção correta. Vamos à próxima.", "good");
      } else {
        input.readOnly = true;
        checkButton.disabled = true;
        setFeedback(feedback, "As seleções foram feitas com Shift e as setas.", "good");
        complete();
      }
    });
    prepareStage();
  }

  function findLiteralRange(text, descriptor) {
    const lines = text.split("\n");
    let absolute = 0;
    if (descriptor.type === "literal") {
      if (descriptor.context) {
        const lineIndex = lines.findIndex((line) => line.includes(descriptor.context));
        if (lineIndex < 0) return null;
        const contextPosition = lines[lineIndex].indexOf(descriptor.context);
        const relativePosition = descriptor.context.indexOf(descriptor.value);
        if (contextPosition < 0 || relativePosition < 0) return null;
        const start = absoluteOffset(lines, lineIndex) + contextPosition + relativePosition;
        return { start, end: start + descriptor.value.length };
      }
      const lineIndex = lines.findIndex((line) => line.includes(descriptor.value));
      if (lineIndex < 0) return null;
      const local = lines[lineIndex].indexOf(descriptor.value);
      return { start: absoluteOffset(lines, lineIndex) + local, end: absoluteOffset(lines, lineIndex) + local + descriptor.value.length };
    }
    if (descriptor.type === "line") {
      const lineIndex = lines.findIndex((line) => line === descriptor.value);
      if (lineIndex < 0) return null;
      const start = absoluteOffset(lines, lineIndex);
      const end = start + lines[lineIndex].length + (descriptor.includeNewline && lineIndex < lines.length - 1 ? 1 : 0);
      return { start, end };
    }
    if (descriptor.type === "line-token") {
      const lineIndex = lines.findIndex((line) => line.startsWith(descriptor.linePrefix));
      if (lineIndex < 0) return null;
      const local = lines[lineIndex].indexOf(descriptor.value);
      if (local < 0) return null;
      const start = absoluteOffset(lines, lineIndex) + local;
      return { start, end: start + descriptor.value.length };
    }
    return null;
  }
  function absoluteOffset(lines, lineIndex) {
    let total = 0;
    for (let index = 0; index < lineIndex; index += 1) total += lines[index].length + 1;
    return total;
  }
  function stageSelection(text, stage) {
    if (stage.range) return findLiteralRange(text, stage.range);
    if (stage.caret !== undefined) return { start: stage.caret, end: stage.caret };
    return null;
  }

  function renderEditSequence(checkpoint, area, feedback, checkButton, complete) {
    let stageIndex = 0;
    let observed = {};
    area.innerHTML = '<p id="edit-stage-instruction" class="demo-box"></p>' +
      '<label class="input-label" for="edit-input">Edite este texto usando o teclado</label>' +
      '<textarea id="edit-input" class="exercise-area" rows="3" spellcheck="false"></textarea>';
    const input = area.querySelector("#edit-input");
    input.value = checkpoint.initial;
    checkButton.hidden = false;

    function prepareStage() {
      const stage = checkpoint.stages[stageIndex];
      observed = { shiftEnd: false, backspace: false, shiftLetter: false, shiftNumber: false };
      area.querySelector("#edit-stage-instruction").textContent = (stage.name || "Etapa " + (stageIndex + 1)) + " — " + stage.instruction;
      const range = stageSelection(input.value, stage);
      if (range) {
        input.focus();
        input.setSelectionRange(range.start, range.end);
      } else input.focus();
      checkButton.textContent = "Conferir etapa";
    }
    input.addEventListener("keydown", (event) => {
      if (!event.isTrusted) return;
      if (event.key === "Backspace") observed.backspace = true;
      if (event.shiftKey && event.key === "End") observed.shiftEnd = true;
      if (event.shiftKey && event.key.length === 1 && /[a-z]/i.test(event.key)) observed.shiftLetter = true;
      if (event.shiftKey && (event.key === "1" || event.key === "!" || event.code === "Digit1")) observed.shiftNumber = true;
    });
    checkButton.addEventListener("click", () => {
      const stage = checkpoint.stages[stageIndex];
      let actionObserved = true;
      if (stage.key === "Backspace") actionObserved = observed.backspace;
      if (stage.selectToEnd) actionObserved = observed.shiftEnd && observed.backspace;
      if (stageIndex === 0 && checkpoint.initial === "os kongs chegaram a selva?") actionObserved = observed.shiftLetter;
      if (stageIndex === 2 && checkpoint.initial === "os kongs chegaram a selva?") actionObserved = observed.shiftNumber;
      if (input.value !== stage.expected || !actionObserved) {
        setFeedback(feedback, "Ainda não está correto. Confira a instrução e faça a edição com o teclado.", "gentle");
        return;
      }
      if (stageIndex + 1 < checkpoint.stages.length) {
        stageIndex += 1;
        prepareStage();
        setFeedback(feedback, "Etapa correta. Siga para o próximo trecho.", "good");
      } else {
        input.disabled = true;
        checkButton.disabled = true;
        setFeedback(feedback, "Texto corrigido. Muito bem!", "good");
        complete();
      }
    });
    prepareStage();
  }

  function renderNativeEdit(checkpoint, area, feedback, checkButton, complete) {
    area.innerHTML = '<label class="input-label" for="native-edit-input">Campo de edição</label>' +
      '<textarea id="native-edit-input" class="exercise-area" rows="2" spellcheck="false"></textarea>' +
      '<p id="native-edit-status" class="selection-status"></p>';
    const input = area.querySelector("#native-edit-input");
    const status = area.querySelector("#native-edit-status");
    input.value = checkpoint.initial;
    input.focus();
    input.setSelectionRange(checkpoint.caret, checkpoint.caret);
    let observed = false;
    let completed = false;
    checkButton.hidden = true;
    status.textContent = checkpoint.actionLabel + ". O sistema avança automaticamente quando a edição correta acontece.";

    input.addEventListener("keydown", (event) => {
      if (!event.isTrusted) return;
      if (checkpoint.key === "Enter" && event.key === "Enter") observed = true;
      if (checkpoint.key === "Delete" && event.key === "Delete") observed = true;
    });
    input.addEventListener("beforeinput", (event) => {
      if (checkpoint.key === "Delete" && event.inputType === "deleteContentForward") observed = true;
      if (checkpoint.key === "Enter" && (event.inputType === "insertLineBreak" || event.inputType === "insertParagraph")) observed = true;
    });
    input.addEventListener("input", () => {
      if (completed) return;
      if (input.value === checkpoint.expected && observed) {
        completed = true;
        input.disabled = true;
        status.textContent = "Ação reconhecida. Próximo checkpoint liberado.";
        setFeedback(feedback, "Edição correta. Muito bem!", "good");
        complete();
        return;
      }
      if (input.value !== checkpoint.initial) {
        setFeedback(feedback, checkpoint.key === "Delete"
          ? "Confira: Lupa (Launcher) + Backspace apaga o caractere à direita."
          : "Confira a posição do cursor e use Enter para criar a nova linha.", "gentle");
      }
    });
  }

  function renderNavigation(checkpoint, area, feedback, checkButton, complete) {
    let step = 0;
    let observed = false;
    area.innerHTML = '<label class="input-label" for="navigation-input">Texto de prática</label>' +
      '<textarea id="navigation-input" class="exercise-area" rows="2" readonly></textarea>' +
      '<p id="navigation-status" class="selection-status"></p>';
    const input = area.querySelector("#navigation-input");
    const status = area.querySelector("#navigation-status");
    input.value = checkpoint.source;
    checkButton.hidden = false;
    function prepare() {
      observed = false;
      input.focus();
      const start = step === 0 ? checkpoint.caret : step === 1 ? input.selectionEnd : 0;
      input.setSelectionRange(start, start);
      status.textContent = ["1. Ctrl + → avança uma palavra.", "2. Ctrl + Shift + → seleciona a palavra seguinte.", "3. Ctrl + A seleciona todo o texto."][step];
    }
    input.addEventListener("keydown", (event) => {
      if (!event.isTrusted || !event.ctrlKey) return;
      if (step === 0 && event.key === "ArrowRight" && !event.shiftKey) observed = true;
      if (step === 1 && event.key === "ArrowRight" && event.shiftKey) observed = true;
      if (step === 2 && event.key.toLowerCase() === "a" && !event.shiftKey) observed = true;
    });
    checkButton.addEventListener("click", () => {
      const selectionLength = input.selectionEnd - input.selectionStart;
      const okay = observed && (step === 0 ? input.selectionStart > checkpoint.caret :
        step === 1 ? selectionLength > 0 : input.selectionStart === 0 && input.selectionEnd === input.value.length);
      if (!okay) {
        setFeedback(feedback, "A navegação ainda não corresponde ao atalho desta etapa. Mantenha o campo focado e tente novamente.", "gentle");
        return;
      }
      if (step < 2) {
        step += 1;
        prepare();
        setFeedback(feedback, "Atalho reconhecido. Próxima etapa.", "good");
      } else {
        input.readOnly = true;
        checkButton.disabled = true;
        setFeedback(feedback, "Navegação e seleção com Ctrl concluídas.", "good");
        complete();
      }
    });
    prepare();
  }

  function renderClipboard(area, feedback, checkButton, complete) {
    let stage = 0;
    let copied = false;
    let cut = false;
    let pasted = false;
    area.innerHTML = '<div class="clipboard-grid"><div><label class="input-label" for="clipboard-source">Origem</label><textarea id="clipboard-source" class="exercise-area" rows="2"></textarea></div>' +
      '<div><label class="input-label" for="clipboard-target">Destino</label><textarea id="clipboard-target" class="exercise-area" rows="2"></textarea></div></div>' +
      '<p id="clipboard-instruction" class="selection-status"></p>' +
      '<div class="exercise-actions"><button class="button secondary small" id="focus-source" type="button">Focar origem</button><button class="button secondary small" id="focus-target" type="button">Focar destino</button></div>';
    const source = area.querySelector("#clipboard-source");
    const target = area.querySelector("#clipboard-target");
    const instruction = area.querySelector("#clipboard-instruction");
    function prepare() {
      copied = false; cut = false; pasted = false;
      if (stage === 0) {
        source.value = "BANANA";
        target.value = "Destino: ";
        source.focus(); source.select();
        instruction.textContent = "Selecione BANANA. Pressione Ctrl+C. Depois, use Focar destino e Ctrl+V.";
      } else {
        source.value = "DK";
        target.value = "KONG ";
        source.focus(); source.select();
        instruction.textContent = "Selecione DK. Pressione Ctrl+X. Depois, use Focar destino e Ctrl+V.";
      }
    }
    source.addEventListener("copy", (event) => { if (event.isTrusted) copied = true; });
    source.addEventListener("cut", (event) => { if (event.isTrusted) cut = true; });
    target.addEventListener("paste", (event) => { if (event.isTrusted) pasted = true; });
    area.querySelector("#focus-source").addEventListener("click", () => { source.focus(); source.select(); });
    area.querySelector("#focus-target").addEventListener("click", () => { target.focus(); target.setSelectionRange(target.value.length, target.value.length); });
    checkButton.hidden = false;
    checkButton.addEventListener("click", () => {
      const okay = stage === 0 ? copied && pasted && target.value === "Destino: BANANA" :
        cut && pasted && source.value === "" && target.value === "KONG DK";
      if (!okay) {
        setFeedback(feedback, "A operação ainda não foi concluída. Use o atalho indicado e a área de transferência nativa do navegador.", "gentle");
        return;
      }
      if (stage === 0) {
        stage = 1;
        prepare();
        setFeedback(feedback, "Cópia e colagem corretas. Agora vamos recortar.", "good");
      } else {
        source.disabled = true; target.disabled = true;
        checkButton.disabled = true;
        setFeedback(feedback, "Copiar, recortar e colar concluídos.", "good");
        complete();
      }
    });
    prepare();
  }

  function renderUndo(checkpoint, area, feedback, checkButton, complete) {
    let stage = 0;
    let observed = false;
    area.innerHTML = '<label class="input-label" for="undo-input">Texto de prática</label><textarea id="undo-input" class="exercise-area single-line" rows="1"></textarea><p id="undo-status" class="selection-status"></p>';
    const input = area.querySelector("#undo-input");
    const status = area.querySelector("#undo-status");
    input.value = checkpoint.initial;
    input.focus(); input.setSelectionRange(input.value.length, input.value.length);
    checkButton.hidden = false;
    function prepare() {
      observed = false;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
      status.textContent = ["1. Digite ! no final.", "2. Pressione Ctrl+Z para desfazer.", "3. Pressione Ctrl+Shift+Z para refazer."][stage];
    }
    input.addEventListener("keydown", (event) => {
      if (!event.isTrusted) return;
      if (stage === 1 && event.ctrlKey && event.key.toLowerCase() === "z" && !event.shiftKey) observed = true;
      if (stage === 2 && event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "z") observed = true;
    });
    checkButton.addEventListener("click", () => {
      const expected = stage === 0 ? checkpoint.expectedTyped : stage === 1 ? checkpoint.expectedUndo : checkpoint.expectedRedo;
      const typedOkay = stage !== 0 || input.value === expected;
      const actionOkay = stage === 0 ? input.value === expected : observed && input.value === expected;
      if (!typedOkay || !actionOkay) {
        setFeedback(feedback, "O texto não está no estado esperado. Confira o atalho e tente novamente com o campo focado.", "gentle");
        return;
      }
      if (stage < 2) {
        stage += 1;
        prepare();
        setFeedback(feedback, "Estado correto. Próxima etapa.", "good");
      } else {
        input.disabled = true; checkButton.disabled = true;
        setFeedback(feedback, "Desfazer e refazer funcionaram no campo do navegador.", "good");
        complete();
      }
    });
    prepare();
  }

  function renderIntegrated(checkpoint, area, feedback, checkButton, complete) {
    let stage = 0;
    let observed = false;
    area.innerHTML = '<p id="integrated-instruction" class="demo-box"></p><label class="input-label" for="integrated-input">Campo de edição</label><textarea id="integrated-input" class="exercise-area" rows="3" spellcheck="false"></textarea>';
    const input = area.querySelector("#integrated-input");
    input.value = "";
    checkButton.hidden = false;
    function prepare() {
      observed = false;
      if (stage === 0) {
        input.value = "";
        input.focus(); input.setSelectionRange(0, 0);
        area.querySelector("#integrated-instruction").textContent = "Etapa 1: digite exatamente " + checkpoint.accents + ". Use as teclas mortas e as vogais maiúsculas.";
      } else {
        if (stage === 1) input.value = checkpoint.initial;
        else if (stage === 2) input.value = "Os kongs\nchegaram a mina?\ntraga bananas!";
        else if (stage === 3) input.value = "Os kongs\nchegaram à mina?\ntraga bananas!";
        else input.value = "Os kongs\nchegaram à mina?\nTraga bananas!";
        area.querySelector("#integrated-instruction").textContent =
          stage === 1 ? "Etapa 2: corrija o primeiro o para O usando Shift." :
          stage === 2 ? "Etapa 3: corrija a antes de mina para à." :
          stage === 3 ? "Etapa 4: coloque T maiúsculo no início da segunda frase usando Shift." :
          "Etapa 5: troque ? por ! usando Shift.";
        selectIntegratedTarget(input, stage);
      }
    }
    input.addEventListener("keydown", (event) => {
      if (!event.isTrusted) return;
      if (stage === 1 && event.shiftKey && event.key.toLowerCase() === "o") observed = true;
      if (stage === 3 && event.shiftKey && event.key.toLowerCase() === "t") observed = true;
      if (stage === 4 && event.shiftKey && (event.key === "1" || event.key === "!" || event.code === "Digit1")) observed = true;
    });
    checkButton.addEventListener("click", () => {
      let expected;
      if (stage === 0) expected = checkpoint.accents;
      else if (stage === 1) expected = "Os kongs\nchegaram a mina?\ntraga bananas!";
      else if (stage === 2) expected = "Os kongs\nchegaram à mina?\ntraga bananas!";
      else if (stage === 3) expected = "Os kongs\nchegaram à mina?\nTraga bananas!";
      else expected = checkpoint.expected;
      const actionOkay = ![1, 3, 4].includes(stage) || observed;
      if (input.value !== expected || !actionOkay) {
        setFeedback(feedback, "Confira as letras, os acentos e a pontuação. A correção ainda não está completa.", "gentle");
        return;
      }
      if (stage < 4) {
        stage += 1;
        prepare();
        setFeedback(feedback, "Etapa correta. Continue a revisão.", "good");
      } else {
        input.disabled = true; checkButton.disabled = true;
        setFeedback(feedback, "As maiúsculas acentuadas e o recado foram corrigidos.", "good");
        complete();
      }
    });
    function selectIntegratedTarget(target, currentStage) {
      if (currentStage === 1) target.setSelectionRange(0, 1);
      if (currentStage === 2) {
        const lineStart = target.value.indexOf("chegaram");
        const index = lineStart < 0 ? -1 : target.value.indexOf(" a mina", lineStart);
        if (index >= 0) target.setSelectionRange(index + 1, index + 2);
      }
      if (currentStage === 3) {
        const lineStart = target.value.indexOf("\ntraga");
        if (lineStart >= 0) target.setSelectionRange(lineStart + 1, lineStart + 2);
      }
      if (currentStage === 4) {
        const lineStart = target.value.indexOf("chegaram");
        const question = lineStart < 0 ? -1 : target.value.indexOf("?", lineStart);
        if (question >= 0) target.setSelectionRange(question, question + 1);
      }
      target.focus();
    }
    prepare();
  }

  function renderWorldFinish(world, host) {
    const total = world.checkpoints.length;
    host.innerHTML = '<section class="world-finish"><p class="eyebrow pixel">MUNDO CONCLUÍDO</p>' + renderGameArt(world, "finish-art", 4) +
      '<h2>' + escapeHTML(world.title) + '</h2><p>Você concluiu os ' + total + ' checkpoints deste mundo. O progresso foi salvo neste navegador.</p>' +
      '<div class="finish-actions"><a class="button" href="index.html">Voltar ao mapa</a><a class="button secondary" href="king-k-rool.html">Ir ao chefe final</a></div></section>';
    const pageProgress = document.getElementById("page-progress");
    if (pageProgress) pageProgress.textContent = total + "/" + total + " checkpoints concluídos";
    updatePersistence();
  }

  function renderWorldPage() {
    const id = document.body.dataset.world;
    const world = DATA.worlds[id];
    const host = document.getElementById("world-content");
    if (!world || !host) return;
    const title = document.getElementById("world-title");
    const description = document.getElementById("world-description");
    if (title) title.textContent = world.title;
    if (description) description.textContent = world.intro;
    document.body.classList.add("world-theme-" + id);
    const artHost = document.getElementById("world-character-art");
    if (artHost) {
      artHost.innerHTML = renderGameArt(world, "world-character-strip", 5);
      bindGameArt(artHost);
    }
    renderGuide(world, host);
    updatePersistence();
  }

  function validatePoemStep(text, key) {
    const lines = text.split("\n");
    if (key === "first-capital") return lines[0] === "Minha terra tem palmeiras,";
    if (key === "verse-order") return lines[1] === "Onde canta o sabiá;" && lines[2] === "As aves que aqui gorjeiam,";
    if (key === "question-to-period") return lines[3] === "Não gorjeiam como lá.";
    if (key === "sky-accent") return lines.includes("Nosso céu tem mais estrelas,");
    if (key === "plural-circumflex") return lines.includes("Nossas várzeas têm mais flores,");
    if (key === "grave-accent") {
      const firstEmCismar = lines.find((line) => line.startsWith("Em cismar, sozinho,"));
      return firstEmCismar === "Em cismar, sozinho, à noite,";
    }
    if (key === "there-accent") return lines.includes("Sem que eu volte para lá;");
    if (key === "birds-comma") return lines.includes("As aves, que aqui gorjeiam,");
    return false;
  }
  function firstUnresolvedPoemStep(text) {
    for (let index = 0; index < DATA.poemSteps.length; index += 1) {
      if (!validatePoemStep(text, DATA.poemSteps[index].validate)) return index;
    }
    return DATA.poemSteps.length;
  }
  function renderBoss() {
    const host = document.getElementById("boss-content");
    if (!host) return;
    let draft = typeof progress.boss.draft === "string" && progress.boss.draft ? progress.boss.draft : DATA.poemDamaged;
    if (progress.boss.passed && draft === DATA.poemReference) return renderBossFinish(host);
    host.innerHTML = '<section class="poem-card"><p class="eyebrow pixel">MISSÃO FINAL · CANÇÃO DO EXÍLIO</p>' +
      '<h2>Recupere os versos</h2><p>O poema foi alterado em oito pontos. Leia cada missão, selecione o trecho atual e corrija diretamente no texto. Use os atalhos praticados nas etapas anteriores.</p>' +
      '<div class="poem-progress" id="poem-progress" aria-live="polite"></div>' +
      '<div class="boss-step"><strong id="poem-step-title"></strong><p id="poem-step-instruction" class="instruction"></p>' +
      '<div class="exercise-actions"><button id="select-poem-target" class="button secondary small" type="button">Selecionar trecho atual</button><button id="check-poem" class="button small" type="button">Conferir correção</button><button id="reset-boss" class="button danger small" type="button">↻ Resetar atividade</button></div></div>' +
      '<div class="poem-layout"><div><label class="input-label" for="poem-editor">Texto para editar</label><textarea id="poem-editor" class="poem-editor" spellcheck="false"></textarea>' +
      '<p id="poem-feedback" class="feedback" role="status" aria-live="polite"></p></div>' +
      '<details class="poem-reference" open><summary>Consultar o poema de referência</summary><pre class="poem-reference-content" id="poem-reference"></pre></details></div>' +
      '<p class="exercise-note">Canção do Exílio, de Gonçalves Dias. Texto de referência modernizado para esta atividade com base em Primeiros Cantos (1846); não é uma transcrição diplomática da edição.</p>' +
      '<div class="finish-actions"><a class="button secondary" href="index.html">Voltar ao mapa</a></div></section>';
    const editor = host.querySelector("#poem-editor");
    const title = host.querySelector("#poem-step-title");
    const instruction = host.querySelector("#poem-step-instruction");
    const progressLabel = host.querySelector("#poem-progress");
    const feedback = host.querySelector("#poem-feedback");
    const reference = host.querySelector("#poem-reference");
    const selectButton = host.querySelector("#select-poem-target");
    const checkButton = host.querySelector("#check-poem");
    editor.value = draft;
    reference.textContent = DATA.poemReference;
    const referenceDetails = host.querySelector(".poem-reference");
    if (global.matchMedia && global.matchMedia("(max-width: 760px)").matches) referenceDetails.open = false;

    function saveDraft() {
      progress.boss.draft = editor.value;
      progress.boss.passed = false;
      saveProgress();
    }
    function updateStep() {
      const index = firstUnresolvedPoemStep(editor.value);
      progressLabel.textContent = "CORREÇÃO " + Math.min(index + 1, DATA.poemSteps.length) + "/" + DATA.poemSteps.length;
      if (index >= DATA.poemSteps.length) {
        title.textContent = "Todas as correções foram encontradas";
        instruction.textContent = "Agora confira o poema inteiro. A missão só termina quando todo o texto estiver igual à referência, incluindo quebras de linha.";
      } else {
        title.textContent = DATA.poemSteps[index].title;
        instruction.textContent = DATA.poemSteps[index].instruction;
      }
      return index;
    }
    function selectCurrent() {
      const index = updateStep();
      if (index >= DATA.poemSteps.length) {
        editor.focus();
        setFeedback(feedback, "As oito correções já estão feitas. Revise o texto integral.", "good");
        return;
      }
      const range = findLiteralRange(editor.value, DATA.poemSteps[index].selection);
      if (!range) {
        setFeedback(feedback, "O trecho desta missão não foi encontrado. Confira as linhas e tente novamente.", "gentle");
        return;
      }
      editor.focus();
      editor.setSelectionRange(range.start, range.end);
      setFeedback(feedback, "Trecho selecionado no editor. Faça a correção usando o teclado.", "");
    }
    editor.addEventListener("blur", saveDraft);
    if (bossPagehideHandler) global.removeEventListener("pagehide", bossPagehideHandler);
    bossPagehideHandler = saveDraft;
    global.addEventListener("pagehide", bossPagehideHandler);
    editor.addEventListener("input", () => {
      progress.boss.draft = editor.value;
      progress.boss.passed = false;
      if (saveTimer) global.clearTimeout(saveTimer);
      saveTimer = global.setTimeout(saveDraft, 300);
      updateStep();
    });
    selectButton.addEventListener("click", selectCurrent);
    host.querySelector("#reset-boss").addEventListener("click", () => {
      if (!global.confirm("Resetar a missão final? O poema voltará ao texto com os oito erros iniciais.")) return;
      if (saveTimer) global.clearTimeout(saveTimer);
      saveTimer = null;
      STORE.resetBoss(progress);
      editor.value = DATA.poemDamaged;
      saveDraft();
      updateStep();
      selectCurrent();
      setFeedback(feedback, "Missão reiniciada. O poema voltou ao texto inicial.", "good");
    });
    checkButton.addEventListener("click", () => {
      saveDraft();
      const index = updateStep();
      if (index < DATA.poemSteps.length) {
        setFeedback(feedback, "A correção atual ainda não corresponde ao verso de referência. Consulte o trecho selecionado e tente novamente.", "gentle");
        return;
      }
      if (editor.value !== DATA.poemReference) {
        setFeedback(feedback, "As oito correções estão corretas, mas ainda há diferenças no poema integral. Confira espaços e quebras de linha.", "gentle");
        return;
      }
      progress.boss.passed = true;
      progress.boss.draft = DATA.poemReference;
      saveProgress();
      renderBossFinish(host);
    });
    updateStep();
    selectCurrent();
    updatePersistence();
  }

  function renderBossFinish(host) {
    progress.boss.passed = true;
    progress.boss.draft = DATA.poemReference;
    saveProgress();
    host.innerHTML = '<section class="world-finish"><p class="eyebrow pixel">CHEFE FINAL DERROTADO</p><div class="hero-icon" aria-hidden="true">👑</div>' +
      '<h2>A Canção do Exílio foi recuperada!</h2><p>Você corrigiu os oito trechos e conferiu o poema integral. A aventura de consolidação está concluída.</p>' +
      '<div class="finish-actions"><button id="reset-boss-finish" class="button danger" type="button">↻ Resetar atividade</button><a class="button" href="index.html">Voltar ao mapa</a><a class="button secondary" href="../../index.html">Catálogo de atividades</a></div></section>';
    host.querySelector("#reset-boss-finish").addEventListener("click", () => {
      if (!global.confirm("Resetar a missão final e apagar as correções do poema?")) return;
      if (saveTimer) global.clearTimeout(saveTimer);
      saveTimer = null;
      STORE.resetBoss(progress);
      saveProgress();
      renderBoss();
    });
  }

  const page = document.body.dataset.page;
  if (page === "map") {
    renderMap();
    setupMapEntryOverlay();
  }
  else if (page === "world") renderWorldPage();
  else if (page === "boss") renderBoss();
  updatePersistence();
})(window);
