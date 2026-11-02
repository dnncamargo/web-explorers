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
    const credits = Array.from(new Set(characters.map((character) => character.credit).filter(Boolean))).join(" · ");
    return '<div class="' + className + '" aria-label="Personagens e elementos de ' + escapeHTML(world.title) + '">' +
      characters.map((character) =>
        '<img data-game-art src="' + escapeHTML(character.src) + '" alt="' + escapeHTML(character.alt) +
        '" title="' + escapeHTML(character.alt + " · " + character.credit) + '" loading="lazy" referrerpolicy="no-referrer">'
      ).join("") +
      (credits ? '<span class="world-art-credit">Arte: ' + escapeHTML(credits) + '</span>' : '') + '</div>';
  }
  function bindGameArt(host) {
    if (!host) return;
    host.querySelectorAll("img[data-game-art]").forEach((image) => {
      const hideBrokenImage = () => {
        image.hidden = true;
        image.removeAttribute("src");
        image.setAttribute("aria-hidden", "true");
      };
      image.addEventListener("error", hideBrokenImage, { once: true });
      if (image.complete && image.naturalWidth === 0) hideBrokenImage();
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
    bindGameArt(document.getElementById("island-gif-panel"));
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
    else if (checkpoint.kind === "line-breaks") renderLineBreaks(checkpoint, area, feedback, checkButton, complete);
    else if (checkpoint.kind === "select-copy") renderSelectCopy(checkpoint, area, feedback, checkButton, complete);
    else if (checkpoint.kind === "paste-build") renderPasteBuild(checkpoint, area, feedback, checkButton, complete);
    else if (checkpoint.kind === "paste-undo") renderPasteUndo(checkpoint, area, feedback, checkButton, complete);
    else if (checkpoint.kind === "history-sequence") renderHistorySequence(checkpoint, area, feedback, checkButton, complete);
    else if (checkpoint.kind === "cut-paste-particles") renderCutPasteParticles(checkpoint, area, feedback, checkButton, complete);
    else if (checkpoint.kind === "delete-undo-redo") renderDeleteUndoRedo(checkpoint, area, feedback, checkButton, complete);
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

  function renderCampSequenceKeyboard(stage) {
    const target = stage.target || "";
    const uppercase = /[A-ZÁÉÍÓÚÂÊÔÃÕ]/u.test(target);
    const useShift = !!(stage.shiftLetters || stage.requireShiftSymbols || stage.deadKeyShift || uppercase);
    const numberKeys = [
      ["1", "!", "Digit1"], ["2", "@", "Digit2"], ["3", "#", "Digit3"], ["4", "$", "Digit4"],
      ["5", "%", "Digit5"], ["6", "¨", "Digit6"], ["7", "&", "Digit7"], ["8", "*", "Digit8"],
      ["9", "(", "Digit9"], ["0", ")", "Digit0"], ["-", "_", "Minus"], ["=", "+", "Equal"]
    ];
    function key(base, shifted, code) {
      const highlighted = target.includes(shifted) || target.includes(base);
      return '<kbd class="abnt-key' + (highlighted ? ' is-needed' : '') + '" data-code="' + code + '">' +
        '<span class="abnt-key-shift">' + shifted + '</span><span class="abnt-key-base">' + base + '</span></kbd>';
    }
    const shiftKeys = '<kbd class="modifier-key' + (useShift ? ' is-needed' : '') + '"><span>↑</span> SHIFT</kbd>' +
      '<kbd class="modifier-key right-shift' + (useShift ? ' is-needed' : '') + '"><span>↑</span> SHIFT</kbd>';
    const altGr = stage.altGrCodes ? '<kbd class="modifier-key altgr-key is-needed">ALTGR</kbd>' : "";
    const altGrW = stage.altGrCodes
      ? '<kbd class="abnt-key is-needed altgr-target" data-code="KeyW"><span class="abnt-key-altgr">ALTGR · ?</span><span class="abnt-key-base">W</span></kbd>'
      : "";
    return '<div class="sequence-keyboard" aria-label="Teclado ABNT2: Shift, AltGr, números, símbolos e acentos">' +
      '<div class="sequence-keyboard-row sequence-modifiers">' + shiftKeys + altGr + '</div>' +
      '<div class="sequence-keyboard-row">' + numberKeys.map(([base, shifted, code]) => key(base, shifted, code)).join("") + '</div>' +
      '<div class="sequence-keyboard-row accent-keys">' +
      key("´", "`", "BracketLeft") + key("~", "^", "Backslash") + altGrW + '</div>' +
      '<p class="sequence-keyboard-note">' +
      (stage.altGrCodes ? 'ALTGR + W produz ? neste teclado ABNT2.' :
        'Observe a tecla e o modificador destacados no desenho.') +
      '</p></div>';
  }

  function renderMineSequenceKeyboard(stage, nextChar, pendingDeadKey, correctionNeeded) {
    const numberFingers = {
      quote:"left-pinky",
      "1":"left-pinky","2":"left-ring","3":"left-middle","4":"left-index","5":"left-index",
      "6":"right-index","7":"right-index","8":"right-middle","9":"right-ring","0":"right-pinky",
      "-":"right-pinky","=":"right-pinky",
      acute:"right-pinky","bracket-left":"right-pinky",
      ç:"right-pinky",tilde:"right-pinky","bracket-right":"right-pinky",
      backslash:"left-pinky",comma:"right-index",period:"right-middle",semicolon:"right-ring",slash:"right-pinky"
    };
    function fingerFor(keyId) {
      return DATA.fingers[keyId] || numberFingers[keyId] || "";
    }
    function activeAction(char, pending) {
      if (!char) return {key:"",shift:false};
      const parts=Array.from(char.normalize("NFD"));
      const base=parts[0]||"";
      const marks=parts.slice(1);
      const uppercase=base!==base.toLocaleLowerCase("pt-BR");
      if (marks.includes("\u0327")) return {key:"ç",shift:uppercase};
      if (marks.length) {
        const accent=marks.includes("\u0301")?"acute":
          (marks.includes("\u0303")||marks.includes("\u0302"))?"tilde":"";
        if (!pending) return {key:accent,shift:marks.includes("\u0302")};
        return {key:base.toLocaleLowerCase("pt-BR"),shift:uppercase};
      }
      if (/[A-Z]/u.test(char)) return {key:char.toLocaleLowerCase("pt-BR"),shift:true};
      const shiftedSymbols = {
        "!":"1","@":"2","#":"3","$":"4","%":"5","¨":"6","&":"7","*":"8",
        "(":"9",")":"0","_":"-","+":"=","{":"bracket-left","^":"tilde",
        "}":"bracket-right","|":"backslash","<":"comma",">":"period",":":"semicolon","?":"slash"
      };
      if (shiftedSymbols[char]) return {key:shiftedSymbols[char],shift:true};
      if (char===String.fromCharCode(96)) return {key:"acute",shift:true};
      const plainSymbols = {
        "[":"bracket-left","~":"tilde","]":"bracket-right","\\":"backslash",
        ",":"comma",".":"period",";":"semicolon","/":"slash","=":"=",
        "'":"quote","1":"1","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9","0":"0","-":"-"
      };
      if (plainSymbols[char]) return {key:plainSymbols[char],shift:false};
      if (char===" ") return {key:"space",shift:false};
      return {key:char.toLocaleLowerCase("pt-BR"),shift:false};
    }
    const action=correctionNeeded ? {key:"",shift:false} : activeAction(nextChar,pendingDeadKey);
    const showShift=!!action.shift;
    const keyLabels = {
      quote:["'","\""],"1":["1","!"],"2":["2","@"],"3":["3","#"],"4":["4","$"],"5":["5","%"],"6":["6","¨"],
      "7":["7","&"],"8":["8","*"],"9":["9","("],"0":["0",")"],"-":["-","_"],"=":["=","+"],
      acute:["´",String.fromCharCode(96)],"bracket-left":["[","{"],ç:["ç","Ç"],tilde:["~","^"],"bracket-right":["]", "}"],
      backslash:["\\","|"],comma:[",","<"],period:[".",">"],semicolon:[";",":"],slash:["/","?"]
    };
    function renderKey(keyId, options={}) {
      const labels=keyLabels[keyId]||[keyId.toLocaleUpperCase("pt-BR"),""];
      const classes=["keycap",fingerFor(keyId)];
      if (options.home) classes.push("home");
      if (options.bump) classes.push("bump");
      if (action.key===keyId) classes.push("is-next");
      return '<span class="'+classes.join(" ")+'" data-key="'+escapeHTML(keyId)+'">' +
        '<span class="mine-keycap-shift">'+escapeHTML(labels[1])+'</span>' +
        '<span class="mine-keycap-main">'+escapeHTML(labels[0])+'</span></span>';
    }
    function renderLetter(keyId) {
      return renderKey(keyId,{home:"asdfghjklç".includes(keyId),bump:keyId==="f"||keyId==="j"});
    }
    function renderControl(label,className,keyId) {
      const active=keyId==="backspace" && correctionNeeded;
      return '<span class="keycap mine-control-key '+className+(active?" is-next":"")+'"'+
        (keyId?' data-key="'+escapeHTML(keyId)+'"':'')+'>'+label+'</span>';
    }
    function renderShift(side) {
      const finger=side==="left"?"left-pinky":"right-pinky";
      return '<span class="keycap keycap-shift '+finger+(showShift?" is-next":"")+'" data-key="shift-'+side+'"><span class="shift-arrow">↑</span><span class="shift-label">SHIFT</span></span>';
    }
    const numberRow=[
      renderKey("quote"),...Array.from("1234567890").map(k=>renderKey(k)),
      renderKey("-"),renderKey("="),renderControl("⌫","backspace-key","backspace")
    ].join("");
    const topRow=[
      renderControl("TAB","tab-key"),
      ...Array.from("qwertyuiop").map(k=>renderLetter(k)),
      renderKey("acute"),renderKey("bracket-left")
    ].join("");
    const homeRow=[
      renderControl("CAPS","caps-key"),
      ...Array.from("asdfghjklç").map(k=>renderLetter(k)),
      renderKey("tilde"),renderKey("bracket-right"),renderControl("ENTER","enter-key")
    ].join("");
    const bottomRow=[
      renderShift("left"),renderKey("backslash"),
      ...Array.from("zxcvbnm").map(k=>renderLetter(k)),
      renderKey("comma"),renderKey("period"),renderKey("semicolon"),renderKey("slash"),renderShift("right")
    ].join("");
    const spaceRow='<div class="keyboard-row mine-keyboard-row space-row"><span class="keycap thumb key-space'+
      (action.key==="space"?" is-next":"")+'" data-key="space">ESPAÇO · polegares</span></div>';
    return '<section class="keyboard-guide mine-keyboard" aria-label="Teclado ABNT2 completo: números, letras, símbolos e acentos">' +
      '<h3>Teclado ABNT2 · números, letras e símbolos</h3>' +
      '<div class="mine-keyboard-map">' +
      '<div class="keyboard-row mine-keyboard-row number-row">'+numberRow+'</div>' +
      '<div class="keyboard-row mine-keyboard-row top-row">'+topRow+'</div>' +
      '<div class="keyboard-row mine-keyboard-row home-row">'+homeRow+'</div>' +
      '<div class="keyboard-row mine-keyboard-row bottom-row">'+bottomRow+'</div>' +
      spaceRow +
      '</div>' +
      '<p class="mine-keyboard-note">Quando uma letra ou símbolo exige Shift, as duas setas ↑ brilham junto com a tecla correspondente. O destaque acompanha a próxima tecla, inclusive depois de preparar um acento.</p>' +
      '</section>';
  }

  function renderSequenceKeyboard(stage, nextChar, pendingDeadKey, correctionNeeded) {
    if (document.body.dataset.world === "mine") return renderMineSequenceKeyboard(stage, nextChar, pendingDeadKey, correctionNeeded);
    return renderCampSequenceKeyboard(stage);
  }

  function renderTypingSequence(checkpoint, area, feedback, checkButton, continueButton, complete) {
    let stageIndex = 0;
    let accepted = 0;
    let target = "";
    let stage = null;
    let pendingDeadKey = false;
    let correctionNeeded = false;
    let hadCorrection = false;
    checkButton.hidden = true;
    continueButton.disabled = true;
    area.innerHTML = '<div class="sequence-progress" id="sequence-progress"></div>' +
      '<h3 class="sequence-instruction" id="sequence-instruction"></h3>' +
      '<p class="sequence-hint" id="sequence-hint"></p>' +
      '<span class="sequence-tip" id="sequence-tip" role="status" aria-live="polite"></span>' +
      '<div class="target-row" id="sequence-target" aria-label="Sequência que será digitada"></div>' +
      '<div id="sequence-keyboard-host"></div>' +
      '<label class="input-label" for="sequence-input">Digite aqui com o teclado físico</label>' +
      '<textarea id="sequence-input" class="exercise-area single-line" rows="1" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Digite a sequência indicada"></textarea>';
    const input = area.querySelector("#sequence-input");
    const progressLabel = area.querySelector("#sequence-progress");
    const instruction = area.querySelector("#sequence-instruction");
    const hint = area.querySelector("#sequence-hint");
    const liveTip = area.querySelector("#sequence-tip");
    const targetRow = area.querySelector("#sequence-target");
    const keyboardHost = area.querySelector("#sequence-keyboard-host");

    function renderStage() {
      stage = checkpoint.stages[stageIndex];
      target = normalize(stage.target);
      accepted = 0;
      pendingDeadKey = false;
      correctionNeeded = false;
      hadCorrection = false;
      input.disabled = false;
      input.value = "";
      progressLabel.textContent = "ETAPA " + (stageIndex + 1) + "/" + checkpoint.stages.length;
      instruction.textContent = stage.instruction || ("Digite: " + target);
      hint.textContent = stage.hint || checkpoint.hint || "";
      targetRow.innerHTML = renderTarget(target, 0);
      keyboardHost.innerHTML = renderSequenceKeyboard(stage, Array.from(target)[0], pendingDeadKey, correctionNeeded);
      updateSequenceTip(Array.from(target)[0]);
      input.focus();
    }

    function updateSequenceTip(expected, isCorrection, isPendingDeadKey) {
      if (isCorrection) {
        liveTip.textContent = "Pressione Backspace até voltar ao trecho correto da escrita.";
        return;
      }
      if (expected === undefined) {
        liveTip.textContent = "Sequência completa.";
        return;
      }
      if (isPendingDeadKey) {
        const vowel = expected.normalize("NFD").slice(0, 1).toLocaleUpperCase("pt-BR");
        liveTip.textContent = "Agora pressione a vogal " + vowel + " para completar o acento.";
        return;
      }
      if (target === "O Sapo saltou sobre a Abelha." && expected === "O") {
        liveTip.textContent = "Segure a tecla shift, mantenha-a pressionada e pressione O.";
        return;
      }
      if (/[A-ZÁÉÍÓÚÂÊÔÃÕ]/u.test(expected)) {
        liveTip.textContent = "Segure a tecla Shift, mantenha-a pressionada e pressione " + expected + ".";
        return;
      }
      if (/[a-zç]/u.test(expected)) {
        liveTip.textContent = "Pressione a letra " + expected.toLocaleUpperCase("pt-BR") + " sem segurar Shift.";
        return;
      }
      if (expected === " ") {
        liveTip.textContent = "Pressione a barra de espaço.";
        return;
      }
      const symbolTips = {
        "!":"Segure Shift e pressione 1 para produzir !.",
        "&":"Segure Shift e pressione 7 para produzir &.",
        "+":"Segure Shift e pressione = para produzir +.",
        ",":"Pressione a tecla de vírgula sem Shift.",
        ".":"Pressione a tecla de ponto sem Shift."
      };
      liveTip.textContent = symbolTips[expected] || ("Próximo caractere: " + expected + ".");
    }

    function reject(event, message, preventInput) {
      if (preventInput) event.preventDefault();
      liveTip.textContent = message;
      setFeedback(feedback, message, "gentle");
    }

    input.addEventListener("keydown", (event) => {
      if (event.isComposing || event.metaKey || event.repeat) return;
      if (!event.isTrusted) {
        reject(event, "Use o teclado físico para praticar. Sem pressa.", true);
        return;
      }
      if (correctionNeeded) return;
      const expected = Array.from(target)[accepted];
      if (expected === undefined || event.key === "Backspace" || event.key === "Tab" || event.key === "Shift") return;

      if (event.key === "Dead" || ["´", "~", "^"].includes(event.key)) {
        let requiredShift = stage.deadKeyShift;
        if (/[âêîôûÂÊÎÔÛ]/u.test(expected || "")) requiredShift = true;
        if (/[áéíóúÁÉÍÓÚãõÃÕàèìòùÀÈÌÒÙ]/u.test(expected || "")) requiredShift = false;
        if (requiredShift !== undefined && event.shiftKey !== requiredShift) {
          pendingDeadKey = true;
          keyboardHost.innerHTML = renderSequenceKeyboard(stage, expected, pendingDeadKey, correctionNeeded);
          updateSequenceTip(expected, false, true);
          reject(event, requiredShift
            ? "Para preparar ^, segure Shift. Depois solte ou mantenha conforme a letra que será escrita."
            : "Prepare este acento sem Shift; use Shift somente quando a vogal precisar ser maiúscula.", false);
          return;
        }
        pendingDeadKey = true;
        keyboardHost.innerHTML = renderSequenceKeyboard(stage, expected, pendingDeadKey, correctionNeeded);
        updateSequenceTip(expected, false, true);
        return;
      }

      if (stage.altGrCodes && stage.altGrCodes[expected]) {
        const altGraph = (typeof event.getModifierState === "function" && event.getModifierState("AltGraph")) ||
          (event.altKey && event.code === stage.altGrCodes[expected]);
        if (!altGraph || event.code !== stage.altGrCodes[expected]) {
          reject(event, "Use AltGr + W para produzir o ponto de interrogação.", false);
        }
        return;
      }

      if (stage.symbolCodes && stage.symbolCodes[expected]) {
        const code = stage.symbolCodes[expected];
        if (!event.shiftKey || event.code !== code) {
          const combo = expected === "!" ? "Shift + 1" : expected === "&" ? "Shift + 7" : "Shift + =";
          reject(event, "Use " + combo + " para produzir " + expected + ".", false);
          return;
        }
      }
      if (stage.requireNoShiftSymbols && /[.,]/u.test(expected || "") && event.shiftKey) {
        reject(event, "Ponto e vírgula são digitados sem Shift nesta etapa.", false);
        return;
      }

      if (/[A-ZÁÉÍÓÚÂÊÔÃÕ]/u.test(expected || "") && stage.shiftLetters && !event.shiftKey) {
        reject(event, "Segure Shift enquanto digita a letra maiúscula.", false);
        return;
      }
      if (/[a-z]/u.test(expected || "") && stage.caseSensitive && event.shiftKey) {
        reject(event, "Solte Shift para digitar esta letra minúscula.", false);
        return;
      }

    });

    input.addEventListener("input", () => {
      const value = normalize(input.value);
      const chars = Array.from(value);
      let prefixLength = 0;
      while (prefixLength < chars.length && prefixLength < Array.from(target).length &&
        chars[prefixLength] === Array.from(target)[prefixLength]) prefixLength += 1;
      const isValidPrefix = value === target || target.startsWith(value);
      correctionNeeded = !isValidPrefix;
      accepted = isValidPrefix ? chars.length : prefixLength;
      pendingDeadKey = false;
      targetRow.innerHTML = renderTarget(target, accepted);
      keyboardHost.innerHTML = renderSequenceKeyboard(stage, Array.from(target)[accepted], pendingDeadKey, correctionNeeded);
      updateSequenceTip(Array.from(target)[accepted], correctionNeeded, false);
      if (correctionNeeded) {
        hadCorrection = true;
        setFeedback(feedback, "Esta sequência saiu do caminho correto. Use Backspace para apagar o trecho digitado a mais.", "gentle");
        return;
      }
      if (hadCorrection) {
        setFeedback(feedback, "Você voltou ao ponto correto. Continue a digitação.", "good");
        hadCorrection = false;
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

  function renderShortcutKeyboard(chords) {
    return '<div class="shortcut-keyboard" aria-label="Teclas usadas nesta atividade">' +
      chords.map((chord) => '<div class="shortcut-chord">' +
        chord.map((key, index) => (index ? '<span class="shortcut-plus" aria-hidden="true">+</span>' : '') +
          '<kbd class="shortcut-key">' + escapeHTML(key) + '</kbd>').join("") +
      '</div>').join("") + '</div>';
  }

  function renderLineBreaks(checkpoint, area, feedback, checkButton, complete) {
    area.innerHTML = renderShortcutKeyboard([["ENTER"], ["BACKSPACE"], ["DELETE"]]) +
      '<label class="input-label" for="line-break-input">Frase para organizar</label>' +
      '<textarea id="line-break-input" class="exercise-area" rows="3" spellcheck="false"></textarea>' +
      '<p id="line-break-status" class="selection-status" aria-live="polite"></p>';
    const input = area.querySelector("#line-break-input");
    const status = area.querySelector("#line-break-status");
    let enterCount = 0;
    let completed = false;
    checkButton.hidden = true;
    input.value = checkpoint.initial;
    const firstBreak = checkpoint.initial.indexOf(" sobre");
    input.focus();
    input.setSelectionRange(firstBreak, firstBreak);
    status.textContent = "ENTER cria uma linha nova. Backspace apaga à esquerda; Delete apaga à direita. O resultado precisa ter três linhas.";

    input.addEventListener("keydown", (event) => {
      if (!event.isTrusted || event.isComposing || event.repeat) return;
      if (event.key === "Enter") enterCount += 1;
      if (event.key === "Backspace") status.textContent = "Backspace: apaga o caractere ou a quebra de linha à esquerda do cursor.";
      if (event.key === "Delete") status.textContent = "Delete: apaga o caractere ou a quebra de linha à direita do cursor.";
    });
    input.addEventListener("input", () => {
      if (completed) return;
      const lineCount = input.value.split("\n").length;
      if (input.value === checkpoint.expected && enterCount >= 2 && lineCount === 3) {
        completed = true;
        input.readOnly = true;
        status.textContent = "A frase ficou organizada em três linhas. Enter foi usado duas vezes.";
        setFeedback(feedback, "Três linhas criadas. Muito bem!", "good");
        complete();
      } else if (lineCount > 3) {
        status.textContent = "Há mais de três linhas. Use Backspace ou Delete para ajustar as quebras.";
        setFeedback(feedback, "Confira as quebras de linha e corrija com Backspace ou Delete.", "gentle");
      } else {
        status.textContent = "Use Enter duas vezes para separar a frase em três linhas. Você pode corrigir a posição com Backspace ou Delete.";
      }
    });
  }

  function renderSelectCopy(checkpoint, area, feedback, checkButton, complete) {
    let stage = 0;
    let doubleClickObserved = false;
    let pointerDown = false;
    let dragObserved = false;
    let copyShortcut = false;
    let advancing = false;
    area.innerHTML = '<label class="input-label" for="select-copy-input">Texto para selecionar</label>' +
      '<textarea id="select-copy-input" class="exercise-area" rows="2" readonly></textarea>' +
      renderShortcutKeyboard([["CTRL", "C"]]) +
      '<p id="select-copy-status" class="selection-status" aria-live="polite"></p>';
    const input = area.querySelector("#select-copy-input");
    const status = area.querySelector("#select-copy-status");
    input.value = checkpoint.source;
    const firstStart = checkpoint.source.indexOf(checkpoint.selectionText);
    const secondStart = checkpoint.source.lastIndexOf(checkpoint.selectionText);
    const end = checkpoint.selectionText.length;
    checkButton.hidden = true;

    function updateStatus() {
      if (stage === 0) {
        status.textContent = "ETAPA 1/3 · Dê dois cliques rápidos sobre a primeira palavra KONG para selecioná-la.";
      } else if (stage === 1) {
        status.textContent = "ETAPA 2/3 · Arraste sobre a segunda palavra KONG. Você pode arrastar do começo ao fim ou do fim ao começo.";
      } else {
        status.textContent = "ETAPA 3/3 · Mantenha Ctrl pressionado e pressione C com a palavra KONG selecionada.";
      }
    }
    function selectionIs(start) {
      return input.selectionStart === start && input.selectionEnd === start + end &&
        input.value.slice(input.selectionStart, input.selectionEnd) === checkpoint.selectionText;
    }
    function advanceSelection() {
      if (advancing) return;
      const valid = stage === 0 ? doubleClickObserved && selectionIs(firstStart)
        : stage === 1 ? dragObserved && selectionIs(secondStart) : false;
      if (!valid) return;
      advancing = true;
      stage += 1;
      if (stage === 1) {
        doubleClickObserved = false;
        input.setSelectionRange(secondStart, secondStart);
        status.textContent = "Primeira seleção correta. Agora arraste sobre a segunda ocorrência de KONG.";
      } else {
        input.setSelectionRange(secondStart, secondStart + end);
        status.textContent = "As duas formas de seleção foram praticadas. Agora copie KONG com Ctrl+C.";
      }
      setFeedback(feedback, stage === 1 ? "Seleção por dois cliques reconhecida." : "Seleção por arraste reconhecida.", "good");
      advancing = false;
      updateStatus();
    }
    input.addEventListener("dblclick", (event) => {
      if (!event.isTrusted || stage !== 0) return;
      doubleClickObserved = true;
      global.requestAnimationFrame(advanceSelection);
    });
    input.addEventListener("mousedown", (event) => {
      if (!event.isTrusted || stage !== 1 || event.button !== 0) return;
      pointerDown = true;
      dragObserved = false;
    });
    input.addEventListener("mousemove", () => {
      if (!pointerDown || stage !== 1) return;
      if (input.selectionEnd > input.selectionStart) dragObserved = true;
    });
    input.addEventListener("mouseup", (event) => {
      if (!event.isTrusted || stage !== 1) return;
      pointerDown = false;
      global.requestAnimationFrame(advanceSelection);
    });
    input.addEventListener("select", advanceSelection);
    input.addEventListener("keydown", (event) => {
      if (!event.isTrusted || stage !== 2 || !event.ctrlKey || event.shiftKey || event.key.toLowerCase() !== "c") return;
      if (input.value.slice(input.selectionStart, input.selectionEnd) === checkpoint.selectionText) copyShortcut = true;
    });
    input.addEventListener("copy", (event) => {
      if (!event.isTrusted || stage !== 2 || !copyShortcut ||
        input.value.slice(input.selectionStart, input.selectionEnd) !== checkpoint.selectionText) return;
      input.readOnly = true;
      status.textContent = "KONG foi copiado usando Ctrl+C. O próximo checkpoint vai ensinar a colar.";
      setFeedback(feedback, "Seleção, Ctrl e C concluídos.", "good");
      complete();
    });
    input.focus();
    updateStatus();
  }

  function renderPasteBuild(checkpoint, area, feedback, checkButton, complete) {
    let stage = 0;
    let ctrlVObserved = false;
    let pasteObserved = false;
    let copyShortcut = false;
    area.innerHTML = '<label class="input-label" for="paste-build-input">Complete a frase colando a palavra copiada</label>' +
      '<textarea id="paste-build-input" class="exercise-area" rows="2" spellcheck="false"></textarea>' +
      '<label class="input-label" for="paste-build-source">Outra palavra para copiar</label>' +
      '<textarea id="paste-build-source" class="exercise-area single-line" rows="1" readonly></textarea>' +
      renderShortcutKeyboard([["CTRL", "C"], ["CTRL", "V"]]) +
      '<p id="paste-build-status" class="selection-status" aria-live="polite"></p>';
    const target = area.querySelector("#paste-build-input");
    const source = area.querySelector("#paste-build-source");
    const status = area.querySelector("#paste-build-status");
    const placeholder = "____";
    checkButton.hidden = true;
    target.value = checkpoint.initial;
    source.value = checkpoint.copySource;
    let firstSlot = target.value.indexOf(placeholder);
    target.focus();
    target.setSelectionRange(firstSlot, firstSlot + placeholder.length);
    status.textContent = "ETAPA 1/3 · Pressione Ctrl+V para colar KONG no primeiro espaço.";
    function prepareSecondPaste() {
      stage = 1;
      const secondSlot = target.value.lastIndexOf(placeholder);
      target.focus();
      target.setSelectionRange(secondSlot, secondSlot + placeholder.length);
      ctrlVObserved = false;
      pasteObserved = false;
      status.textContent = "ETAPA 2/3 · Pressione Ctrl+V novamente para completar DIDDY KONG.";
    }
    function prepareCopy() {
      stage = 2;
      source.focus();
      source.select();
      status.textContent = "ETAPA 3/3 · BANANA está selecionada. Pressione Ctrl+C para copiá-la.";
    }
    target.addEventListener("keydown", (event) => {
      if (event.isTrusted && event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === "v") ctrlVObserved = true;
    });
    target.addEventListener("paste", (event) => {
      if (event.isTrusted && ctrlVObserved) pasteObserved = true;
    });
    target.addEventListener("input", () => {
      if (stage > 1 || !ctrlVObserved || !pasteObserved) return;
      const expected = stage === 0 ? checkpoint.firstExpected : checkpoint.expected;
      if (target.value !== expected) return;
      setFeedback(feedback, "Ctrl+V reconhecido. A palavra foi colada no lugar certo.", "good");
      if (stage === 0) prepareSecondPaste();
      else prepareCopy();
    });
    source.addEventListener("keydown", (event) => {
      if (event.isTrusted && event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === "c" &&
        source.value.slice(source.selectionStart, source.selectionEnd) === checkpoint.copySource) copyShortcut = true;
    });
    source.addEventListener("copy", (event) => {
      if (!event.isTrusted || !copyShortcut ||
        source.value.slice(source.selectionStart, source.selectionEnd) !== checkpoint.copySource) return;
      source.readOnly = true;
      target.readOnly = true;
      status.textContent = "A frase está completa e BANANA foi copiada com Ctrl+C.";
      setFeedback(feedback, "Duas colagens e uma cópia realizadas.", "good");
      complete();
    });
  }

  function renderPasteUndo(checkpoint, area, feedback, checkButton, complete) {
    let phase = "paste-four";
    let pasteCount = 0;
    let undoCount = 0;
    let pendingShortcut = "";
    let pasteObserved = false;
    let copyObserved = false;
    let extraPasteObserved = false;
    let extraUndoObserved = false;
    area.innerHTML = '<label class="input-label" for="paste-undo-input">Cole a palavra repetidas vezes</label>' +
      '<textarea id="paste-undo-input" class="exercise-area" rows="3"></textarea>' +
      '<label class="input-label" for="paste-undo-copy">Outra partícula para copiar</label>' +
      '<textarea id="paste-undo-copy" class="exercise-area single-line" rows="1" readonly></textarea>' +
      '<label class="input-label" for="paste-undo-extra">Destino da segunda colagem</label>' +
      '<textarea id="paste-undo-extra" class="exercise-area single-line" rows="1"></textarea>' +
      renderShortcutKeyboard([["CTRL", "V"], ["CTRL", "Z"], ["CTRL", "C"]]) +
      '<p id="paste-undo-status" class="selection-status" aria-live="polite"></p>';
    const target = area.querySelector("#paste-undo-input");
    const source = area.querySelector("#paste-undo-copy");
    const extra = area.querySelector("#paste-undo-extra");
    const status = area.querySelector("#paste-undo-status");
    source.value = checkpoint.extraCopyText;
    extra.value = checkpoint.extraPastePrefix;
    checkButton.hidden = true;
    target.focus();
    status.textContent = "ETAPA 1/4 · Pressione Ctrl+V quatro vezes para colar BANANA quatro vezes.";
    function enterUndoPhase() {
      phase = "undo-three";
      undoCount = 0;
      pendingShortcut = "";
      status.textContent = "ETAPA 2/4 · Pressione Ctrl+Z três vezes. Deve restar uma BANANA.";
    }
    function enterCopyPhase() {
      phase = "copy-extra";
      source.focus();
      source.select();
      status.textContent = "ETAPA 3/4 · SAPO está selecionado. Pressione Ctrl+C para copiar outra partícula.";
    }
    target.addEventListener("keydown", (event) => {
      if (!event.isTrusted || event.repeat) return;
      if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === "v") pendingShortcut = "paste";
      else if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === "z") pendingShortcut = "undo";
      else if (event.key === "Backspace" || event.key === "Delete") pendingShortcut = "";
    });
    target.addEventListener("paste", (event) => {
      if (event.isTrusted && pendingShortcut === "paste") pasteObserved = true;
    });
    target.addEventListener("input", () => {
      if (phase === "paste-four" && pendingShortcut === "paste" && pasteObserved) {
        pasteCount = target.value.length / checkpoint.text.length;
        if (Number.isInteger(pasteCount) && pasteCount >= 1 && pasteCount <= checkpoint.pasteCount &&
          target.value === checkpoint.text.repeat(pasteCount)) {
          pasteObserved = false;
          pendingShortcut = "";
          if (pasteCount === checkpoint.pasteCount) enterUndoPhase();
          else status.textContent = "Colagem " + pasteCount + "/" + checkpoint.pasteCount + ". Continue com Ctrl+V.";
        }
        return;
      }
      if (phase === "undo-three" && pendingShortcut === "undo") {
        undoCount += 1;
        const expected = checkpoint.text.repeat(checkpoint.pasteCount - undoCount);
        if (target.value === expected) {
          pendingShortcut = "";
          if (undoCount === checkpoint.undoCount) enterCopyPhase();
          else status.textContent = "Desfeito " + undoCount + "/" + checkpoint.undoCount + ". Continue com Ctrl+Z.";
        } else {
          undoCount = Math.max(0, undoCount - 1);
          setFeedback(feedback, "O histórico ainda não chegou ao resultado esperado. Confira o campo e tente novamente.", "gentle");
        }
      }
    });
    source.addEventListener("keydown", (event) => {
      if (event.isTrusted && event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === "c" &&
        source.value.slice(source.selectionStart, source.selectionEnd) === checkpoint.extraCopyText) copyObserved = true;
    });
    source.addEventListener("copy", (event) => {
      if (!event.isTrusted || !copyObserved) return;
      phase = "paste-extra";
      extra.focus();
      extra.setSelectionRange(extra.value.length, extra.value.length);
      status.textContent = "ETAPA 4/4 · Cole SAPO com Ctrl+V e depois pressione Ctrl+Z para desfazer essa colagem.";
    });
    extra.addEventListener("keydown", (event) => {
      if (!event.isTrusted || event.repeat) return;
      if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === "v") pendingShortcut = "extra-paste";
      else if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === "z") pendingShortcut = "extra-undo";
    });
    extra.addEventListener("paste", (event) => {
      if (event.isTrusted && pendingShortcut === "extra-paste") extraPasteObserved = true;
    });
    extra.addEventListener("input", () => {
      if (phase === "paste-extra" && pendingShortcut === "extra-paste" && extraPasteObserved &&
        extra.value === checkpoint.extraPastePrefix + checkpoint.extraCopyText) {
        pendingShortcut = "";
        extraPasteObserved = false;
        status.textContent = "Agora pressione Ctrl+Z para desfazer a colagem de SAPO.";
      } else if (phase === "paste-extra" && pendingShortcut === "extra-undo") {
        if (extra.value === checkpoint.extraPastePrefix) {
          phase = "done";
          extra.readOnly = true;
          target.readOnly = true;
          status.textContent = "Uma BANANA permaneceu e a colagem de SAPO foi desfeita.";
          setFeedback(feedback, "Desfazer colagens concluído.", "good");
          complete();
        }
      }
    });
  }

  function renderHistorySequence(checkpoint, area, feedback, checkButton, complete) {
    let phase = "paste";
    let pasteCount = 0;
    let undoCount = 0;
    let redoCount = 0;
    let finalUndoCount = 0;
    let pendingShortcut = "";
    let pasteObserved = false;
    area.innerHTML = '<label class="input-label" for="history-sequence-input">Campo de prática</label>' +
      '<textarea id="history-sequence-input" class="exercise-area" rows="3"></textarea>' +
      renderShortcutKeyboard([["CTRL", "V"], ["CTRL", "Z"], ["CTRL", "SHIFT", "Z"]]) +
      '<p id="history-sequence-status" class="selection-status" aria-live="polite"></p>';
    const input = area.querySelector("#history-sequence-input");
    const status = area.querySelector("#history-sequence-status");
    checkButton.hidden = true;
    input.focus();
    status.textContent = "ETAPA 1/4 · Cole SAPO quatro vezes com Ctrl+V.";
    function setPhase(next, message) {
      phase = next;
      pendingShortcut = "";
      status.textContent = message;
    }
    input.addEventListener("keydown", (event) => {
      if (!event.isTrusted || event.repeat) return;
      if (event.ctrlKey && event.key.toLowerCase() === "v") pendingShortcut = "paste";
      else if (event.ctrlKey && event.key.toLowerCase() === "z" && event.shiftKey) pendingShortcut = "redo";
      else if (event.ctrlKey && event.key.toLowerCase() === "z" && !event.shiftKey) pendingShortcut = "undo";
    });
    input.addEventListener("paste", (event) => {
      if (event.isTrusted && pendingShortcut === "paste") pasteObserved = true;
    });
    input.addEventListener("input", () => {
      if (phase === "paste" && pendingShortcut === "paste" && pasteObserved) {
        pasteCount = input.value.length / checkpoint.text.length;
        if (Number.isInteger(pasteCount) && pasteCount >= 1 && pasteCount <= checkpoint.pasteCount &&
          input.value === checkpoint.text.repeat(pasteCount)) {
          pasteObserved = false;
          pendingShortcut = "";
          if (pasteCount === checkpoint.pasteCount) setPhase("undo-before-redo", "ETAPA 2/4 · Pressione Ctrl+Z três vezes. Deve restar uma palavra.");
          else status.textContent = "Colagem " + pasteCount + "/" + checkpoint.pasteCount + ". Continue com Ctrl+V.";
        }
        return;
      }
      if (phase === "undo-before-redo" && pendingShortcut === "undo") {
        undoCount += 1;
        if (input.value === checkpoint.text.repeat(checkpoint.pasteCount - undoCount)) {
          pendingShortcut = "";
          if (undoCount === checkpoint.undoBeforeRedo) setPhase("redo", "ETAPA 3/4 · Refaça duas vezes com Ctrl+Shift+Z. Devem aparecer três palavras.");
          else status.textContent = "Desfeito " + undoCount + "/" + checkpoint.undoBeforeRedo + ". Continue com Ctrl+Z.";
        } else {
          undoCount = Math.max(0, undoCount - 1);
          pendingShortcut = "";
        }
        return;
      }
      if (phase === "redo" && pendingShortcut === "redo") {
        redoCount += 1;
        if (input.value === checkpoint.text.repeat(checkpoint.pasteCount - checkpoint.undoBeforeRedo + redoCount)) {
          pendingShortcut = "";
          if (redoCount === checkpoint.redoCount) setPhase("undo-final", "ETAPA 4/4 · Desfaça duas vezes com Ctrl+Z até restar uma palavra.");
          else status.textContent = "Refeito " + redoCount + "/" + checkpoint.redoCount + ". Continue com Ctrl+Shift+Z.";
        } else {
          redoCount = Math.max(0, redoCount - 1);
          pendingShortcut = "";
        }
        return;
      }
      if (phase === "undo-final" && pendingShortcut === "undo") {
        finalUndoCount += 1;
        const countAfterUndo = checkpoint.pasteCount - checkpoint.undoBeforeRedo + checkpoint.redoCount - finalUndoCount;
        if (input.value === checkpoint.text.repeat(countAfterUndo)) {
          pendingShortcut = "";
          if (finalUndoCount === checkpoint.undoAfterRedo && countAfterUndo === checkpoint.finalCount) {
            phase = "done";
            input.readOnly = true;
            status.textContent = "Você desfez, refez e voltou a deixar uma única palavra.";
            setFeedback(feedback, "Ctrl+Z e Ctrl+Shift+Z concluídos.", "good");
            complete();
          } else {
            status.textContent = "Agora restam " + countAfterUndo + " palavras. Continue com Ctrl+Z.";
          }
        } else {
          finalUndoCount = Math.max(0, finalUndoCount - 1);
          pendingShortcut = "";
        }
      }
    });
  }

  function renderCutPasteParticles(checkpoint, area, feedback, checkButton, complete) {
    let stage = 0;
    let cutObserved = false;
    let pasteObserved = false;
    let cutShortcut = false;
    let pasteShortcut = false;
    area.innerHTML = '<div class="clipboard-grid"><div><label class="input-label" for="cut-paste-source">Origem</label>' +
      '<textarea id="cut-paste-source" class="exercise-area" rows="2"></textarea></div>' +
      '<div><label class="input-label" for="cut-paste-target">Destino</label>' +
      '<textarea id="cut-paste-target" class="exercise-area" rows="2"></textarea></div></div>' +
      '<div class="exercise-actions"><button class="button secondary small" id="cut-paste-focus-source" type="button">Focar origem</button>' +
      '<button class="button secondary small" id="cut-paste-focus-target" type="button">Focar destino</button></div>' +
      renderShortcutKeyboard([["CTRL", "X"], ["CTRL", "V"]]) +
      '<p id="cut-paste-status" class="selection-status" aria-live="polite"></p>';
    const source = area.querySelector("#cut-paste-source");
    const target = area.querySelector("#cut-paste-target");
    const status = area.querySelector("#cut-paste-status");
    source.value = checkpoint.source;
    target.value = checkpoint.targetPrefix;
    checkButton.hidden = true;
    function currentPiece() { return checkpoint.pieces[stage]; }
    function selectedPiece() { return source.value.slice(source.selectionStart, source.selectionEnd); }
    function prepareSelection() {
      cutShortcut = false;
      cutObserved = false;
      source.focus();
      source.setSelectionRange(0, 0);
      status.textContent = "ETAPA " + (stage + 1) + "/2 · Selecione " + currentPiece() + " na origem e pressione Ctrl+X.";
    }
    function preparePaste() {
      pasteShortcut = false;
      pasteObserved = false;
      target.focus();
      target.setSelectionRange(target.value.length, target.value.length);
      status.textContent = "ETAPA " + (stage + 1) + "/2 · A parte foi recortada. Foque o destino e pressione Ctrl+V.";
    }
    source.addEventListener("keydown", (event) => {
      if (!event.isTrusted || !event.ctrlKey || event.shiftKey || event.key.toLowerCase() !== "x") return;
      if (selectedPiece() !== currentPiece()) {
        event.preventDefault();
        setFeedback(feedback, "Selecione exatamente " + currentPiece() + " antes de usar Ctrl+X.", "gentle");
        return;
      }
      cutShortcut = true;
    });
    source.addEventListener("cut", (event) => { if (event.isTrusted && cutShortcut) cutObserved = true; });
    source.addEventListener("input", () => {
      if (!cutObserved || stage > 1) return;
      const expectedSource = stage === 0 ? " SAPO" : " ";
      if (source.value !== expectedSource) return;
      cutObserved = false;
      preparePaste();
    });
    target.addEventListener("keydown", (event) => {
      if (event.isTrusted && event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === "v") pasteShortcut = true;
    });
    target.addEventListener("paste", (event) => { if (event.isTrusted && pasteShortcut) pasteObserved = true; });
    target.addEventListener("input", () => {
      if (!pasteObserved) return;
      const expected = checkpoint.targetPrefix + checkpoint.pieces.slice(0, stage + 1).join(" ");
      if (target.value !== expected) return;
      pasteObserved = false;
      if (stage === 0) {
        stage = 1;
        setFeedback(feedback, "Primeira parte recortada e colada. Agora faça o mesmo com SAPO.", "good");
        prepareSelection();
      } else {
        source.readOnly = true;
        target.readOnly = true;
        status.textContent = "BARRIL e SAPO saíram da origem e foram colados no destino.";
        setFeedback(feedback, "Duas partículas recortadas e coladas.", "good");
        complete();
      }
    });
    area.querySelector("#cut-paste-focus-source").addEventListener("click", () => source.focus());
    area.querySelector("#cut-paste-focus-target").addEventListener("click", () => {
      target.focus();
      target.setSelectionRange(target.value.length, target.value.length);
    });
    prepareSelection();
  }

  function renderDeleteUndoRedo(checkpoint, area, feedback, checkButton, complete) {
    let phase = "select-first";
    let shortcutObserved = false;
    let advancing = false;
    area.innerHTML = '<label class="input-label" for="delete-undo-input">Texto para editar</label>' +
      '<textarea id="delete-undo-input" class="exercise-area" rows="2"></textarea>' +
      renderShortcutKeyboard([["BACKSPACE"], ["CTRL", "Z"], ["CTRL", "SHIFT", "Z"]]) +
      '<p id="delete-undo-status" class="selection-status" aria-live="polite"></p>';
    const input = area.querySelector("#delete-undo-input");
    const status = area.querySelector("#delete-undo-status");
    input.value = checkpoint.initial;
    checkButton.hidden = true;
    function rangeFor(text, fromEnd) {
      const index = fromEnd ? input.value.lastIndexOf(text) : input.value.indexOf(text);
      return index < 0 ? null : { start: index, end: index + text.length };
    }
    function selectedText() { return input.value.slice(input.selectionStart, input.selectionEnd); }
    function setPhase(next, message) {
      phase = next;
      shortcutObserved = false;
      status.textContent = message;
    }
    input.addEventListener("select", () => {
      if (phase === "select-first" && selectedText() === checkpoint.firstDelete) {
        status.textContent = "DIDDY está selecionado. Pressione Backspace para apagá-lo.";
      }
      if (phase === "select-final" && selectedText() === checkpoint.finalDelete) {
        status.textContent = "KONG está selecionado. Pressione Backspace para apagá-lo também.";
      }
    });
    input.addEventListener("keydown", (event) => {
      if (!event.isTrusted || event.repeat) return;
      if (phase === "select-first" || phase === "select-final") {
        const word = phase === "select-first" ? checkpoint.firstDelete : checkpoint.finalDelete;
        if (event.key === "Backspace") {
          if (selectedText() !== word) {
            event.preventDefault();
            status.textContent = "Selecione " + word + " antes de pressionar Backspace.";
          } else shortcutObserved = true;
        }
      } else if (phase === "undo" && event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === "z") {
        shortcutObserved = true;
      } else if (phase === "redo" && event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "z") {
        shortcutObserved = true;
      }
    });
    input.addEventListener("input", () => {
      if (advancing || !shortcutObserved) return;
      if (phase === "select-first" && input.value === checkpoint.expectedAfterDelete) {
        advancing = true;
        setPhase("undo", "ETAPA 2/4 · Pressione Ctrl+Z para recuperar DIDDY.");
        setFeedback(feedback, "Backspace apagou a palavra selecionada.", "good");
        advancing = false;
      } else if (phase === "undo" && input.value === checkpoint.expectedRestored) {
        setPhase("redo", "ETAPA 3/4 · Pressione Ctrl+Shift+Z para refazer a exclusão. Lembre-se de manter Shift pressionado junto com Ctrl.");
        setFeedback(feedback, "A palavra foi recuperada.", "good");
      } else if (phase === "redo" && input.value === checkpoint.expectedAfterDelete) {
        const range = rangeFor(checkpoint.finalDelete, true);
        setPhase("select-final", "ETAPA 4/4 · Selecione o KONG final e pressione Backspace.");
        if (range) input.setSelectionRange(range.start, range.start);
        setFeedback(feedback, "A exclusão foi refeita.", "good");
      } else if (phase === "select-final" && input.value === checkpoint.expectedFinal) {
        input.readOnly = true;
        status.textContent = "Você apagou, desfez, refez e apagou novamente com Backspace.";
        setFeedback(feedback, "Sequência de edição concluída.", "good");
        complete();
      }
    });
    input.focus();
    const firstRange = rangeFor(checkpoint.firstDelete, false);
    if (firstRange) input.setSelectionRange(firstRange.start, firstRange.start);
    status.textContent = "ETAPA 1/4 · Selecione DIDDY com o mouse e pressione Backspace.";
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
    let advancing = false;
    area.innerHTML = '<label class="input-label" for="navigation-input">Texto de prática</label>' +
      '<textarea id="navigation-input" class="exercise-area" rows="2" readonly></textarea>' +
      '<p id="navigation-status" class="selection-status" aria-live="polite"></p>';
    const input = area.querySelector("#navigation-input");
    const status = area.querySelector("#navigation-status");
    input.value = checkpoint.source;
    checkButton.hidden = true;

    function prepare() {
      observed = false;
      advancing = false;
      input.focus();
      const start = step === 0 ? checkpoint.caret : step === 1 ? input.selectionEnd : 0;
      input.setSelectionRange(start, start);
      status.textContent = [
        "ETAPA 1/3 · Ctrl + → avança uma palavra.",
        "ETAPA 2/3 · Ctrl + Shift + → seleciona a palavra seguinte.",
        "ETAPA 3/3 · Ctrl + A seleciona todo o texto."
      ][step];
    }

    function verify() {
      if (!observed || advancing) return;
      const selectionLength = input.selectionEnd - input.selectionStart;
      const okay = step === 0
        ? input.selectionStart === input.selectionEnd && input.selectionStart > checkpoint.caret
        : step === 1
          ? selectionLength > 0
          : input.selectionStart === 0 && input.selectionEnd === input.value.length;
      if (!okay) {
        status.textContent = "A seleção ainda não corresponde ao atalho. Mantenha o campo focado e tente novamente.";
        return;
      }
      advancing = true;
      if (step < 2) {
        step += 1;
        setFeedback(feedback, "Atalho reconhecido. Próxima etapa.", "good");
        prepare();
      } else {
        input.readOnly = true;
        status.textContent = "Navegação e seleção com Ctrl concluídas.";
        setFeedback(feedback, "As três operações foram realizadas.", "good");
        complete();
      }
    }

    input.addEventListener("keydown", (event) => {
      if (!event.isTrusted || !event.ctrlKey) return;
      if (step === 0 && event.key === "ArrowRight" && !event.shiftKey) observed = true;
      if (step === 1 && event.key === "ArrowRight" && event.shiftKey) observed = true;
      if (step === 2 && event.key.toLowerCase() === "a" && !event.shiftKey) observed = true;
    });
    input.addEventListener("keyup", verify);
    input.addEventListener("select", verify);
    prepare();
  }

  function renderClipboard(area, feedback, checkButton, complete) {
    let stage = 0;
    let copied = false;
    let cut = false;
    let pasted = false;
    let advancing = false;
    area.innerHTML = '<div class="clipboard-grid"><div><label class="input-label" for="clipboard-source">Origem</label><textarea id="clipboard-source" class="exercise-area" rows="2"></textarea></div>' +
      '<div><label class="input-label" for="clipboard-target">Destino</label><textarea id="clipboard-target" class="exercise-area" rows="2"></textarea></div></div>' +
      '<p id="clipboard-instruction" class="selection-status" aria-live="polite"></p>' +
      '<div class="exercise-actions"><button class="button secondary small" id="focus-source" type="button">Focar origem</button><button class="button secondary small" id="focus-target" type="button">Focar destino</button></div>';
    const source = area.querySelector("#clipboard-source");
    const target = area.querySelector("#clipboard-target");
    const instruction = area.querySelector("#clipboard-instruction");
    checkButton.hidden = true;

    function prepare() {
      copied = false; cut = false; pasted = false; advancing = false;
      if (stage === 0) {
        source.value = "BANANA";
        target.value = "Destino: ";
        source.focus(); source.select();
        instruction.textContent = "ETAPA 1/2 · Selecione BANANA e pressione Ctrl+C. Depois, foque o destino e pressione Ctrl+V.";
      } else {
        source.value = "DK";
        target.value = "KONG ";
        source.focus(); source.select();
        instruction.textContent = "ETAPA 2/2 · Selecione DK e pressione Ctrl+X. Depois, foque o destino e pressione Ctrl+V.";
      }
    }

    function verify() {
      if (advancing || !pasted) return;
      const okay = stage === 0
        ? copied && target.value === "Destino: BANANA"
        : cut && source.value === "" && target.value === "KONG DK";
      if (!okay) return;
      advancing = true;
      if (stage === 0) {
        stage = 1;
        setFeedback(feedback, "Copiar e colar concluídos. Agora vamos recortar.", "good");
        prepare();
      } else {
        source.disabled = true;
        target.disabled = true;
        instruction.textContent = "Copiar, recortar e colar concluídos.";
        setFeedback(feedback, "Área de transferência nativa utilizada com sucesso.", "good");
        complete();
      }
    }

    source.addEventListener("copy", (event) => { if (event.isTrusted) copied = true; });
    source.addEventListener("cut", (event) => { if (event.isTrusted) cut = true; });
    target.addEventListener("paste", (event) => { if (event.isTrusted) pasted = true; });
    source.addEventListener("input", verify);
    target.addEventListener("input", verify);
    area.querySelector("#focus-source").addEventListener("click", () => { source.focus(); source.select(); });
    area.querySelector("#focus-target").addEventListener("click", () => { target.focus(); target.setSelectionRange(target.value.length, target.value.length); });
    prepare();
  }

  function renderUndo(checkpoint, area, feedback, checkButton, complete) {
    let stage = 0;
    let observed = false;
    let advancing = false;
    area.innerHTML = '<label class="input-label" for="undo-input">Texto de prática</label><textarea id="undo-input" class="exercise-area single-line" rows="1"></textarea><p id="undo-status" class="selection-status"></p>';
    const input = area.querySelector("#undo-input");
    const status = area.querySelector("#undo-status");
    input.value = checkpoint.initial;
    checkButton.hidden = true;

    function prepare() {
      observed = false;
      advancing = false;
      input.disabled = false;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
      status.textContent = [
        "ETAPA 1/3 · Digite ! no final.",
        "ETAPA 2/3 · Pressione Ctrl+Z para desfazer.",
        "ETAPA 3/3 · Pressione Ctrl+Shift+Z para refazer."
      ][stage];
    }

    function verify() {
      if (!observed || advancing) return;
      const expected = stage === 1 ? checkpoint.expectedUndo : checkpoint.expectedRedo;
      if (input.value !== expected) return;
      advancing = true;
      if (stage < 2) {
        stage += 1;
        setFeedback(feedback, "Estado correto. Próxima operação.", "good");
        prepare();
      } else {
        input.disabled = true;
        status.textContent = "Desfazer e refazer funcionaram no campo do navegador.";
        setFeedback(feedback, "Os dois atalhos foram executados.", "good");
        complete();
      }
    }

    input.addEventListener("keydown", (event) => {
      if (!event.isTrusted) return;
      if (stage === 0 && event.shiftKey && (event.key === "1" || event.key === "!" || event.code === "Digit1")) observed = true;
      if (stage === 1 && event.ctrlKey && event.key.toLowerCase() === "z" && !event.shiftKey) observed = true;
      if (stage === 2 && event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "z") observed = true;
    });
    input.addEventListener("input", () => {
      if (stage === 0) {
        if (input.value === checkpoint.expectedTyped) {
          observed = true;
          stage = 1;
          setFeedback(feedback, "Texto digitado. Agora desfaça.", "good");
          prepare();
        } else if (!checkpoint.expectedTyped.startsWith(input.value)) {
          setFeedback(feedback, "Digite o ponto de exclamação com Shift+1.", "gentle");
        }
      } else verify();
    });
    prepare();
  }

  function renderIntegrated(checkpoint, area, feedback, checkButton, complete) {
    let stage = 0;
    let observed = false;
    let advancing = false;
    area.innerHTML = '<p id="integrated-instruction" class="demo-box"></p><label class="input-label" for="integrated-input">Campo de edição</label><textarea id="integrated-input" class="exercise-area" rows="3" spellcheck="false"></textarea>';
    const input = area.querySelector("#integrated-input");
    const instruction = area.querySelector("#integrated-instruction");
    checkButton.hidden = true;

    function expectedForStage() {
      if (stage === 0) return checkpoint.accents;
      if (stage === 1) return "Os kongs\nchegaram a mina?\ntraga bananas!";
      if (stage === 2) return "Os kongs\nchegaram à mina?\ntraga bananas!";
      if (stage === 3) return "Os kongs\nchegaram à mina?\nTraga bananas!";
      return checkpoint.expected;
    }
    function prepare() {
      observed = false;
      advancing = false;
      input.disabled = false;
      if (stage === 0) {
        input.value = "";
        input.focus();
        input.setSelectionRange(0, 0);
        instruction.textContent = "ETAPA 1/5 · Digite exatamente " + checkpoint.accents + ". Prepare cada acento antes da vogal e use Shift nas vogais maiúsculas.";
      } else {
        input.value = stage === 1 ? checkpoint.initial :
          stage === 2 ? "Os kongs\nchegaram a mina?\ntraga bananas!" :
          stage === 3 ? "Os kongs\nchegaram à mina?\ntraga bananas!" :
          stage === 4 ? "Os kongs\nchegaram à mina?\nTraga bananas!" :
          "Os kongs\nchegaram à mina?\nTraga bananas!";
        instruction.textContent = [
          "",
          "ETAPA 2/5 · O primeiro o está selecionado. Digite O usando Shift.",
          "ETAPA 3/5 · A letra a antes de mina está selecionada. Prepare o acento grave e digite a.",
          "ETAPA 4/5 · A letra inicial da última linha está selecionada. Digite T usando Shift.",
          "ETAPA 5/5 · O ponto de interrogação está selecionado. Troque por ! usando Shift+1."
        ][stage];
        selectIntegratedTarget(input, stage);
      }
    }

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

    input.addEventListener("keydown", (event) => {
      if (!event.isTrusted) return;
      if (stage === 1 && event.shiftKey && event.key.toLowerCase() === "o") observed = true;
      if (stage === 3 && event.shiftKey && event.key.toLowerCase() === "t") observed = true;
      if (stage === 4 && event.shiftKey && (event.key === "1" || event.key === "!" || event.code === "Digit1")) observed = true;
    });
    input.addEventListener("input", () => {
      if (advancing) return;
      const expected = expectedForStage();
      if (input.value !== expected) return;
      if ([1, 3, 4].includes(stage) && !observed) {
        setFeedback(feedback, "Use Shift na tecla indicada para fazer esta correção.", "gentle");
        return;
      }
      advancing = true;
      if (stage < 4) {
        stage += 1;
        setFeedback(feedback, "Etapa concluída. A próxima edição já está selecionada.", "good");
        prepare();
      } else {
        input.disabled = true;
        instruction.textContent = "Recado corrigido. Muito bem!";
        setFeedback(feedback, "As maiúsculas acentuadas, a edição e a pontuação foram concluídas.", "good");
        complete();
      }
    });
    prepare();
  }

  function renderWorldFinish(world, host) {
    const total = world.checkpoints.length;
    host.innerHTML = '<section class="world-finish"><p class="eyebrow pixel">MUNDO CONCLUÍDO</p>' + renderGameArt(world, "finish-art", 4) +
      '<h2>' + escapeHTML(world.title) + '</h2><p>Você concluiu os ' + total + ' checkpoints deste mundo. O progresso foi salvo neste navegador.</p>' +
      '<div class="finish-actions"><a class="button" href="index.html">Voltar ao mapa</a><a class="button secondary" href="king-k-rool.html">Ir ao chefe final</a></div></section>';
    bindGameArt(host);
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
