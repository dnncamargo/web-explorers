(function (global) {
  const CORE = global.YoshiTypingCore;
  const DATA = global.YoshiWorldData;
  const STORAGE_KEY = "exploradores.yoshi-typing.progress.v1";
  const worldFiles = Object.fromEntries(Object.values(DATA.worlds).map((world) => [world.id, world.file]));
  const pageKind = document.body.dataset.page;
  let storageMode = "memory";
  let progress = loadProgress();

  function loadProgress() {
    const loaded = CORE.readStoredProgress((name) => global[name], STORAGE_KEY);
    storageMode = loaded.mode;
    return loaded.progress;
  }

  function saveProgress() {
    const saved = CORE.writeStoredProgress((name) => global[name], STORAGE_KEY, progress, storageMode);
    storageMode = saved.mode;
    updatePersistenceStatus();
    return saved.persisted;
  }

  function persistenceMessage() {
    if (storageMode === "memory") return "Sem armazenamento: trocar de mundo ou recarregar reinicia o progresso desta página.";
    if (storageMode === "sessionStorage") return "Progresso disponível durante esta sessão do navegador; ao fechá-la, será apagado.";
    return "Progresso salvo neste navegador. Em dispositivo compartilhado, escolha Nova partida antes de começar.";
  }

  function updatePersistenceStatus() {
    const message = persistenceMessage();
    const status = document.getElementById("persistence-status");
    if (status) status.textContent = message;
  }

  function setAudioStatus(message) {
    const status = document.getElementById("audio-status");
    if (status && !status.textContent.startsWith("Conectando")) status.textContent = message;
  }

  function hasSavedProgress() {
    return progress.completedWorlds.length > 0 || progress.completedBonus || Object.values(progress.checkpoints).some((count) => count > 0);
  }

  function enterWorld(worldId) {
    if (!CORE.enterWorld(progress, worldId)) return;
    saveProgress();
    global.location.href = worldFiles[worldId];
  }

  function cardProgress(world) {
    const completed = progress.checkpoints[world.id] || 0;
    if (world.id === 4 && progress.completedBonus) return "Bônus concluído · 5/5";
    if (world.id < 4 && progress.completedWorlds.includes(world.id)) return "Mundo concluído · 5/5";
    return completed ? `${completed}/5 checkpoints concluídos` : "5 checkpoints";
  }

  function renderHome() {
    const map = document.getElementById("world-map");
    const actions = document.getElementById("save-actions");
    const summary = document.getElementById("save-summary");
    const banner = document.getElementById("ending-banner");
    const saved = hasSavedProgress();

    if (saved) {
      const current = DATA.worlds[progress.currentWorld] || DATA.worlds[1];
      actions.innerHTML = `<button class="button" id="continue-game" type="button">Continuar · ${current.name}</button><button class="button button-quiet" id="new-game" type="button">Nova partida</button>`;
      document.getElementById("continue-game").addEventListener("click", () => {
        const world = CORE.canEnterWorld(progress, progress.currentWorld) ? progress.currentWorld : 1;
        enterWorld(world);
      });
      document.getElementById("new-game").addEventListener("click", requestNewGame);
      summary.textContent = `Mundos principais: ${progress.completedWorlds.length}/3 · Bônus: ${progress.completedBonus ? "concluído" : "opcional"}. ${persistenceMessage()}`;
    } else {
      actions.innerHTML = `<button class="button" id="begin-adventure" type="button">Começar aventura</button>`;
      document.getElementById("begin-adventure").addEventListener("click", () => enterWorld(1));
      summary.textContent = `${persistenceMessage()} Você ainda pode jogar.`;
    }

    map.innerHTML = Object.values(DATA.worlds).map((world) => {
      const unlocked = CORE.canEnterWorld(progress, world.id);
      const complete = world.id === 4 ? progress.completedBonus : progress.completedWorlds.includes(world.id);
      const buttonText = !unlocked ? "Conclua o mundo anterior" : complete ? "Ver conquista" : world.id === 4 ? "Jogar bônus" : "Entrar no mundo";
      const description = world.id === 4 ? "Opcional · ovos, moedas e estrelas" : `${world.id}/3 · 5 checkpoints`;
      return `<article class="world-card ${unlocked ? "" : "is-locked"}" data-theme="${world.theme}"><p class="card-kicker pixel">${world.id === 4 ? "EXTRA" : `MUNDO ${world.id}/3`}</p><h3>${world.name}</h3><p>${description}</p><p class="card-progress">${cardProgress(world)}</p><button type="button" data-enter-world="${world.id}" ${unlocked ? "" : "disabled"} aria-label="${unlocked ? `${buttonText}: ${world.name}` : `${world.name} bloqueado até concluir o mundo anterior`}">${buttonText}</button></article>`;
    }).join("");
    map.querySelectorAll("[data-enter-world]").forEach((button) => button.addEventListener("click", () => enterWorld(Number(button.dataset.enterWorld))));

    const query = new URLSearchParams(global.location.search);
    const ending = query.get("ending");
    if (ending === "main" && CORE.isMainComplete(progress)) {
      banner.hidden = false;
      banner.innerHTML = `<h2>🌟 Aventura principal concluída!</h2><p>Você completou os três mundos da Floresta do Yoshi. Parabéns pelo cuidado e pela coordenação no teclado.</p><p>Seu caminho terminou quando você escolheu. A sala de bônus continua opcional.</p><div class="finish-actions"><a class="button" href="${worldFiles[4]}">Jogar Bonus Challenge</a><a class="button button-quiet" href="#map-title">Voltar ao mapa</a></div>`;
    } else if (ending === "bonus" && CORE.isMainComplete(progress) && progress.completedBonus) {
      banner.hidden = false;
      banner.innerHTML = `<h2>🥚 Bônus concluído!</h2><p>Você também encontrou as surpresas da sala secreta. Os três mundos principais continuam registrados como concluídos.</p><div class="finish-actions"><a class="button" href="#map-title">Voltar ao mapa</a><a class="button button-quiet" href="${worldFiles[3]}">Rever a conquista principal</a></div>`;
    }

    setupResetDialog();
    updatePersistenceStatus();
  }

  function requestNewGame() {
    const dialog = document.getElementById("reset-dialog");
    if (!hasSavedProgress()) {
      resetAndStart();
      return;
    }
    if (typeof dialog.showModal === "function") dialog.showModal();
    else if (global.confirm("Apagar o progresso salvo neste navegador e começar uma nova partida?")) resetAndStart();
  }

  function resetAndStart() {
    CORE.clearStoredProgress((name) => global[name], STORAGE_KEY);
    storageMode = "memory";
    progress = CORE.createProgress();
    enterWorld(1);
  }

  function setupResetDialog() {
    const dialog = document.getElementById("reset-dialog");
    if (!dialog) return;
    document.getElementById("cancel-reset")?.addEventListener("click", () => dialog.close());
    document.getElementById("confirm-reset")?.addEventListener("click", () => {
      dialog.close();
      resetAndStart();
    });
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  function fingerName(finger) {
    return ({
      "left-pinky": "mínimo esquerdo", "left-ring": "anelar esquerdo", "left-middle": "médio esquerdo", "left-index": "indicador esquerdo",
      "right-index": "indicador direito", "right-middle": "médio direito", "right-ring": "anelar direito", "right-pinky": "mínimo direito", thumb: "polegares",
    })[finger] || "dedo indicado";
  }

  const legendFingers = [
    ["left-pinky", "Mínimo E"], ["left-ring", "Anelar E"], ["left-middle", "Médio E"], ["left-index", "Indicador E"],
    ["right-index", "Indicador D"], ["right-middle", "Médio D"], ["right-ring", "Anelar D"], ["right-pinky", "Mínimo D"], ["thumb", "Polegares"],
  ];

  function renderKeyboard(world, activeKey = "", completedText = "") {
    const full = world.id >= 3;
    const rows = full ? ["qwertyuiop", "asdfghjklç", "zxcvbnm"] : ["asdfghjklç"];
    const normalize = (value) => value === " " ? " " : value.toLocaleLowerCase("pt-BR");
    const rowHtml = rows.map((row) => `<div class="keyboard-row" aria-label="Fileira do teclado">${[...row].map((key) => {
      if (!world.taughtKeys.includes(normalize(key))) return `<span class="keycap key-blank" aria-hidden="true"></span>`;
      const finger = DATA.fingers[normalize(key)];
      const next = normalize(activeKey) === normalize(key);
      const used = completedText.toLocaleLowerCase("pt-BR").includes(normalize(key));
      return `<span class="keycap ${finger} ${next ? "is-next" : ""} ${used ? "is-used" : ""}" data-key="${key}" ${next ? 'aria-current="true"' : ""}>${key.toLocaleUpperCase("pt-BR")}</span>`;
    }).join("")}</div>`).join("");
    const spaceNext = activeKey === " ";
    return `<div class="keyboard-wrap"><p class="keyboard-caption">Teclado ABNT2 · ${full ? "fileiras exploradas" : "posição-base"}</p><div class="keyboard" aria-label="Ilustração do teclado ABNT2">${rowHtml}<div class="keyboard-row"><span class="keycap key-space thumb ${spaceNext ? "is-next" : ""}" data-key=" " ${spaceNext ? 'aria-current="true"' : ""}>ESPAÇO · POLEGARES</span></div></div><div class="keyboard-legend">${legendFingers.map(([finger,label]) => `<span class="legend-item"><span class="legend-swatch ${finger}"></span>${label}</span>`).join("")}</div></div>`;
  }

  function renderFingerGuide(world) {
    let entries;
    if (world.id === 1) entries = [["A", "left-pinky"], ["S", "left-ring"], ["D", "left-middle"], ["F", "left-index"], ["ESPAÇO", "thumb"]];
    else if (world.id === 2) entries = [["J", "right-index"], ["K", "right-middle"], ["L", "right-ring"], ["Ç", "right-pinky"], ["ESPAÇO", "thumb"]];
    else entries = [["A", "left-pinky"], ["S", "left-ring"], ["D", "left-middle"], ["F", "left-index"], ["J", "right-index"], ["K", "right-middle"], ["L", "right-ring"], ["Ç", "right-pinky"], ["ESPAÇO", "thumb"]];
    return entries.map(([key,finger]) => `<div class="finger-card"><span class="finger-dot ${finger}" aria-hidden="true"></span><span><strong>${key}</strong><small>${fingerName(finger)}</small></span></div>`).join("");
  }

  function renderStory(world, host) {
    host.innerHTML = `<article class="story-card"><div class="kamek-art" aria-hidden="true">🧙</div><div><p class="eyebrow pixel">UMA CENA CURTA · FORA DOS CHECKPOINTS</p><h2>Kamek e os cristais</h2><p>“As luzes mostram novas fileiras. Seus dedos podem sair da base e voltar para casa. Sem pressa!”</p><p class="story-note">A fala musical é opcional. O botão continua mesmo se o áudio estiver bloqueado.</p><div class="story-actions"><button class="button button-quiet" id="story-audio" type="button">Ouvir mensagem musical</button><button class="button" id="story-continue" type="button">Continuar sem áudio</button></div></div></article>`;
    host.querySelector("#story-audio").addEventListener("click", () => {
      global.YoshiAudio?.play(world.storyTrack);
    });
    host.querySelector("#story-continue").addEventListener("click", () => {
      global.YoshiAudio?.pause();
      global.YoshiAudio?.changeTrack(world.track, false);
      document.getElementById("audio-toggle").disabled = false;
      renderGuide(world, host);
    });
  }

  function renderGuide(world, host) {
    const count = progress.checkpoints[world.id] || 0;
    const rowIntro = world.id === 3 ? `<div class="row-teaching"><strong>Fileira superior:</strong> Q W E R T Y U I O P. <strong>Fileira inferior:</strong> Z X C V B N M. Olhe para a tecla, mova o dedo e retorne à posição-base. Estas fileiras são apresentadas antes de aparecerem nos exercícios.</div>` : "";
    host.innerHTML = `<section class="guide-card"><p class="eyebrow pixel">${world.id === 4 ? "OPCIONAL · 5 CHECKPOINTS" : `MUNDO ${world.id}/3 · 5 CHECKPOINTS`}</p><h2>Antes de começar</h2><p>${world.guide}</p><div class="guide-steps">${renderFingerGuide(world)}</div>${rowIntro}${renderKeyboard(world)}<p class="keyboard-tip">As cores orientam sobre os dedos. O navegador não consegue verificar qual dedo você usou.</p><div class="guide-actions"><button id="start-world" class="button" type="button">${count ? `Continuar do checkpoint ${count + 1}` : "Começar os checkpoints"}</button><a class="button button-quiet" href="index.html">Fazer uma pausa no mapa</a></div></section>`;
    host.querySelector("#start-world").addEventListener("click", () => {
      global.YoshiAudio?.changeTrack(world.track, true);
      renderCheckpoint(world, host);
    });
  }

  function targetMarkup(target, typed) {
    return [...target].map((char,index) => {
      const type = char === " " ? "space-char" : "";
      const done = index < typed;
      const current = index === typed;
      const label = char === " " ? "ESPAÇO" : char;
      return `<span class="target-char ${type} ${done ? "is-done" : ""} ${current ? "is-current" : ""}" aria-label="${label}">${char === " " ? "␣" : char}</span>`;
    }).join("");
  }

  function renderDots(completeCount) {
    return Array.from({ length: 5 }, (_, index) => `<span class="checkpoint-dot ${index < completeCount ? "done" : ""}" aria-hidden="true"></span>`).join("");
  }

  function renderCheckpoint(world, host) {
    const completedCount = progress.checkpoints[world.id] || 0;
    if (completedCount >= 5) return renderWorldFinish(world, host);
    const number = completedCount + 1;
    document.getElementById("checkpoint-progress").textContent = `CHECKPOINT ${number}/5`;
    const checkpoint = world.checkpoints[completedCount];
    let typed = 0;
    let typedText = "";
    host.innerHTML = `<section class="exercise-card"><div class="checkpoint-strip"><span class="checkpoint-name pixel">CHECKPOINT ${number}/5</span><span class="checkpoint-dots" aria-label="${completedCount} de 5 checkpoints concluídos">${renderDots(completedCount)}</span></div><h2>Digite a sequência</h2><p class="typing-instruction">${checkpoint.instruction}</p><div id="target-row" class="target-row" role="img" aria-label="Sequência-alvo: ${checkpoint.target.replaceAll(" ", ", espaço, ")}"></div><div class="typed-row"><strong>Você digitou</strong><output id="typed-display" class="typed-display" aria-live="polite" aria-label="Você ainda não digitou nenhuma tecla">—</output><small>␣ indica um espaço.</small></div><p class="current-finger" id="current-finger" aria-live="polite"></p>${renderKeyboard(world)}<label class="visually-hidden" for="typing-box">Área para digitar usando o teclado físico</label><textarea id="typing-box" class="typing-box" rows="2" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="Clique aqui e digite com o teclado físico"></textarea><p id="typing-feedback" class="feedback" role="status" aria-live="polite">Clique na área e digite sem pressa. Maiúsculas e minúsculas são aceitas.</p><div class="exercise-actions"><button id="show-hint" class="button button-quiet" type="button" aria-expanded="false" aria-controls="help-panel">Mostrar dica</button><button id="restart-exercise" class="button button-quiet" type="button">Reiniciar este exercício</button><button id="next-checkpoint" class="button" type="button" disabled>Concluir checkpoint ${number}/5</button></div><p id="help-panel" class="help-panel" hidden>${checkpoint.hint} Use os dedos como orientação e volte à posição-base quando possível.</p><p class="exercise-note">O progresso vem das teclas pressionadas. Colar texto não conclui o exercício. Não contamos tentativas nem velocidade.</p></section>`;

    const input = host.querySelector("#typing-box");
    const targetRow = host.querySelector("#target-row");
    const typedDisplay = host.querySelector("#typed-display");
    const fingerLabel = host.querySelector("#current-finger");
    const feedback = host.querySelector("#typing-feedback");
    const continueButton = host.querySelector("#next-checkpoint");
    let finished = false;

    function updateDisplay() {
      targetRow.innerHTML = targetMarkup(checkpoint.target, typed);
      const visibleTyped = [...typedText].map((char) => char === " " ? "␣" : char).join("");
      typedDisplay.textContent = visibleTyped || "—";
      typedDisplay.setAttribute("aria-label", visibleTyped ? `Você digitou: ${[...typedText].map((char) => char === " " ? "espaço" : char).join(" ")}` : "Você ainda não digitou nenhuma tecla");
      const expected = checkpoint.target[typed];
      const finger = !expected ? "" : expected === " " ? "polegares" : fingerName(DATA.fingers[expected.toLocaleLowerCase("pt-BR")]);
      fingerLabel.innerHTML = expected
        ? `Próxima tecla: <kbd>${expected === " " ? "ESPAÇO" : expected.toLocaleUpperCase("pt-BR")}</kbd> · orientação: <strong>${finger}</strong>`
        : "Sequência completa!";
      const caps = host.querySelectorAll(".keycap[data-key]");
      caps.forEach((cap) => cap.classList.toggle("is-next", cap.dataset.key.toLocaleLowerCase("pt-BR") === (expected === " " ? " " : (expected || "").toLocaleLowerCase("pt-BR"))));
    }

    updateDisplay();
    input.focus({ preventScroll: true });

    input.addEventListener("keydown", (event) => {
      if (finished || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
      event.preventDefault();
      if (event.repeat) return;
      if (!event.isTrusted) {
        feedback.textContent = "Use uma tecla do teclado físico para praticar.";
        return;
      }
      const expected = checkpoint.target[typed];
      const result = CORE.advanceInput(checkpoint.target, typed, event.key, event.isTrusted);
      if (!result.matches) {
        feedback.className = "feedback gentle";
        feedback.textContent = `Tudo bem. Encontre ${expected === " " ? "a barra de espaço" : `a tecla ${expected.toLocaleUpperCase("pt-BR")}`} e tente novamente. Sem pressa.`;
        return;
      }

      typedText += event.key;
      typed = [...typedText].length;
      feedback.className = "feedback good";
      feedback.textContent = "Boa! Continue olhando para a próxima tecla.";
      updateDisplay();
      if (typed === checkpoint.target.length) {
        finished = true;
        input.disabled = true;
        const result = CORE.completeCheckpoint(progress, world.id, number);
        if (!result.ok) {
          finished = false;
          input.disabled = false;
          feedback.textContent = "Não foi possível salvar este checkpoint. Volte ao mapa e tente novamente.";
          return;
        }
        saveProgress();
        document.getElementById("checkpoint-progress").textContent = `CHECKPOINT ${number}/5`;
        feedback.textContent = "Sequência completa! Você pode avançar quando quiser.";
        continueButton.disabled = false;
        continueButton.textContent = number < 5 ? `Continuar para checkpoint ${number + 1}` : "Concluir mundo";
      }
    });

    input.addEventListener("paste", (event) => {
      event.preventDefault();
      feedback.className = "feedback gentle";
      feedback.textContent = "Colar não conta como prática. Digite cada tecla com calma.";
    });
    input.addEventListener("beforeinput", (event) => {
      if (event.inputType === "insertFromPaste" || event.inputType === "insertFromDrop") event.preventDefault();
    });
    input.addEventListener("input", () => {
      input.value = "";
      if (!finished) {
        feedback.className = "feedback gentle";
        feedback.textContent = "Use uma tecla do teclado físico para praticar; texto inserido não completa a sequência.";
      }
    });
    input.addEventListener("drop", (event) => {
      event.preventDefault();
      feedback.className = "feedback gentle";
      feedback.textContent = "Soltar texto não conclui o exercício. Use o teclado físico.";
    });
    host.querySelector("#show-hint").addEventListener("click", (event) => {
      const panel = host.querySelector("#help-panel");
      const isHidden = panel.hidden;
      panel.hidden = !isHidden;
      event.currentTarget.setAttribute("aria-expanded", String(isHidden));
      event.currentTarget.textContent = isHidden ? "Ocultar dica" : "Mostrar dica";
    });
    host.querySelector("#restart-exercise").addEventListener("click", () => {
      if (finished) return;
      typed = 0;
      typedText = "";
      feedback.className = "feedback";
      feedback.textContent = "Exercício reiniciado. Tente de novo, sem pressa.";
      updateDisplay();
      input.focus({ preventScroll: true });
    });
    continueButton.addEventListener("click", () => {
      if (continueButton.disabled || !finished) return;
      if (progress.checkpoints[world.id] === 5) renderWorldFinish(world, host);
      else renderCheckpoint(world, host);
    });
  }

  function renderLocked(world, host) {
    const required = world.id === 4 ? "Conclua os três mundos principais" : `Conclua o Mundo ${world.id - 1}`;
    host.innerHTML = `<section class="world-finish"><img class="yoshi-art" src="https://art.ngfiles.com/images/291000/291714_jamalmason_yoshi.png?f1393937531" alt=""><p class="eyebrow pixel">CAMINHO FECHADO POR ENQUANTO</p><h2>${world.title}</h2><p>${required} para abrir este caminho. Cada mundo tem cinco checkpoints.</p><div class="finish-actions"><a class="button" href="index.html">Voltar ao mapa</a></div></section>`;
  }

  function renderWorldFinish(world, host) {
    global.YoshiAudio?.pause();
    document.getElementById("checkpoint-progress").textContent = "CHECKPOINT 5/5";
    const isBonus = world.id === 4;
    const mainComplete = CORE.isMainComplete(progress);
    let body;
    if (isBonus) {
      body = `<p>Você encontrou as surpresas da sala secreta. Não houve cronômetro nem perda por erro.</p><p class="main-reward">${mainComplete ? "Os três mundos principais continuam concluídos." : "A aventura principal segue seu próprio caminho."}</p><div class="finish-actions"><a class="button" href="index.html?ending=bonus">Concluir bônus</a><a class="button button-quiet" href="index.html">Voltar ao mapa</a></div>`;
    } else if (world.id === 3) {
      body = `<p>Você concluiu os três mundos obrigatórios da Floresta do Yoshi.</p><p class="main-reward">🏆 Recompensa principal liberada · Aventura completa</p><div class="finish-actions"><a class="button" href="${worldFiles[4]}">JOGAR BONUS CHALLENGE</a><a class="button button-quiet" href="index.html?ending=main">ENCERRAR AVENTURA</a><a class="map-finish-link" href="index.html">Voltar ao mapa</a></div>`;
    } else {
      const nextId = world.id + 1;
      body = `<p>Este mundo está concluído. Você pode fazer uma pausa ou continuar quando quiser.</p><div class="finish-actions"><a class="button" href="${worldFiles[nextId]}">Continuar para ${DATA.worlds[nextId].name}</a><a class="button button-quiet" href="index.html">Encerrar sessão e voltar ao mapa</a></div>`;
    }
    host.innerHTML = `<section class="world-finish"><img class="yoshi-art" src="https://art.ngfiles.com/images/291000/291714_jamalmason_yoshi.png?f1393937531" alt=""><p class="eyebrow pixel">${isBonus ? "BÔNUS OPCIONAL CONCLUÍDO" : `MUNDO ${world.id}/3 CONCLUÍDO`}</p><h2>${isBonus ? "Ovos e estrelas encontrados!" : "Muito bem, explorador!"}</h2>${body}</section>`;
  }

  function renderWorld() {
    const worldId = Number(document.body.dataset.world);
    const world = DATA.worlds[worldId];
    const host = document.getElementById("world-content");
    if (!world || !host) return;
    document.body.dataset.theme = world.theme;
    document.getElementById("world-scene").dataset.theme = world.theme;
    const decorations = document.getElementById("scene-decorations");
    const sceneIcons = { flower: ["✿", "🌼", "✿"], forest: ["🍓", "🍎", "🍇"], crystal: ["💎", "✦", "🔷"], bonus: ["🥚", "⭐", "🪙"] };
    decorations.innerHTML = sceneIcons[world.theme].map((icon) => `<span>${icon}</span>`).join("");
    document.getElementById("world-title").textContent = world.title;
    document.getElementById("world-intro").textContent = world.intro;
    document.getElementById("world-kicker").textContent = world.id === 4 ? "BONUS CHALLENGE · OPCIONAL" : `MUNDO ${world.id}/3 · ${world.name.toUpperCase()}`;
    document.getElementById("world-progress").textContent = world.id === 4 ? "MUNDO BÔNUS" : `MUNDO ${world.id}/3`;

    if (!CORE.canEnterWorld(progress, world.id)) {
      renderLocked(world, host);
      document.getElementById("audio-toggle").disabled = true;
      return;
    }
    CORE.enterWorld(progress, world.id);
    saveProgress();
    updatePersistenceStatus();
    const count = progress.checkpoints[world.id] || 0;
    document.getElementById("checkpoint-progress").textContent = `CHECKPOINT ${Math.min(count + 1, 5)}/5`;
    if (count === 5) return renderWorldFinish(world, host);
    if (world.id === 3 && count === 0) {
      document.getElementById("audio-toggle").disabled = true;
      return renderStory(world, host);
    }
    document.getElementById("audio-toggle").disabled = false;
    renderGuide(world, host);
  }

  if (pageKind === "home") renderHome();
  else if (pageKind === "world") renderWorld();
})(window);
