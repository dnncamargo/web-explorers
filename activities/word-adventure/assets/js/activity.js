(function (global) {
  const DATA = global.WordAdventureContent;
  const STORE = global.WordAdventureProgress;
  if (!DATA || !STORE) return;

  const loaded = STORE.load();
  let progress = loaded.progress;
  let storageMode = loaded.mode;
  const legacyFound = loaded.legacyFound;
  const app = document.getElementById("app");
  const MAP_MUSIC_ID = "01pN6rnaJy8";
  const MAP_MUSIC_IMAGE = "https://http2.mlstatic.com/D_NQ_NP_2X_737962-MLA81129374435_122024-F.webp";
  const GRATITUDE_IMAGE = "https://marketplace.canva.com/bJxi8/MAHCGsbJxi8/1/tl/canva-uma-capivara-fofa-segurando-uma-rosa.-MAHCGsbJxi8.png";
  const SHAPE_COLORS = { blue: "#287bd1", green: "#36a65c", yellow: "#f3c632", red: "#d94d4d", orange: "#f28b27" };
  let resumeMapMusicOnReturn = false;
  let ignoreMapHashChange = false;

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }
  function worldList() { return [...DATA.worlds, DATA.bonus]; }
  function count(world) { return STORE.completedCount(progress, world.id); }
  function save() {
    const result = STORE.save(progress, storageMode);
    storageMode = result.mode;
    updateStorageStatus();
  }
  function updateStorageStatus() {
    const node = document.getElementById("storage-status");
    if (!node) return;
    node.textContent = storageMode === "memory"
      ? "O navegador não permite salvar o progresso. Ele ficará disponível enquanto esta página estiver aberta."
      : "Progresso salvo neste navegador. Você pode voltar depois.";
  }
  function spoken(text) {
    if (!("speechSynthesis" in global) || !text) return false;
    try {
      global.speechSynthesis.cancel();
      const utterance = new global.SpeechSynthesisUtterance(String(text));
      utterance.lang = "pt-BR";
      utterance.rate = 0.82;
      global.speechSynthesis.speak(utterance);
      return true;
    } catch { return false; }
  }
  function stopSpeech() {
    try { global.speechSynthesis?.cancel(); } catch { /* voz é opcional */ }
  }
  function speakButton(text, label = "Ouvir") {
    return '<button class="audio-button" type="button" data-speak="' + esc(text) + '" aria-label="' + esc(label) + '">🔊 Ouvir</button>';
  }
  function progressDots(current, total) {
    return Array.from({ length: total }, (_, i) => '<span class="dot ' + (i < current ? "done" : "") + '"></span>').join("");
  }
  function capi(size = "normal") {
    return '<span class="capi-avatar capi-' + size + '" role="img" aria-label="Capi, a capivara guia"><span class="capi-ear left"></span><span class="capi-ear right"></span><span class="capi-eye left"></span><span class="capi-eye right"></span><span class="capi-muzzle"></span></span>';
  }
  function musicIntroPanel() {
    return '<section class="music-intro" aria-labelledby="music-title">' +
      '<div class="music-copy"><span class="music-kicker">♪ MÚSICA DE ABERTURA</span><h2 id="music-title">Vamos começar a expedição?</h2><p>Toque na imagem para ouvir a música. A trilha fica no mapa inicial e para quando você entrar em uma missão.</p></div>' +
      '<div class="music-image-wrap"><button id="map-music-toggle" class="music-image-button" type="button" aria-pressed="false" aria-label="Iniciar música da Expedição Natureza"><img src="' + MAP_MUSIC_IMAGE + '" alt="" loading="lazy"><span class="music-image-caption">▶ Toque na imagem para ouvir</span></button></div>' +
      '<p id="map-music-status" class="music-status" role="status" aria-live="polite">A música começa quando você tocar na imagem.</p>' +
      '<div id="map-music-player" class="player-host" aria-hidden="true"></div></section>';
  }
  function renderMap() {
    const cards = worldList().map((world) => {
      const current = count(world);
      const total = world.stages.length;
      const done = current >= total;
      const optional = world.id === DATA.bonus.id;
      const status = optional ? "BÔNUS" : (done ? "CONCLUÍDO" : "EXPEDIÇÃO");
      return '<a class="world-card world-' + esc(world.theme) + '" href="#' + esc(world.id) + '">' +
        '<div class="card-top"><span>' + (optional ? "DIÁRIO EXTRA" : "PARADA " + world.number) + '</span><span>' + status + '</span></div>' +
        '<div class="world-art" aria-hidden="true">' + esc(world.art) + '</div>' +
        '<h2>' + esc(world.title) + '</h2><p>' + esc(world.subtitle) + '</p>' +
        '<div class="dots" aria-label="' + current + ' de ' + total + ' checkpoints concluídos">' + progressDots(current, total) + '</div>' +
        '<span class="card-progress">' + current + ' de ' + total + ' checkpoints</span><span class="card-action">' + (done ? "Revisitar parada" : "Explorar parada") + ' →</span></a>';
    }).join("");
    const completed = DATA.worlds.reduce((sum, world) => sum + count(world), 0);
    const total = DATA.worlds.reduce((sum, world) => sum + world.stages.length, 0);
    app.innerHTML = '<section class="map-intro"><div class="intro-character">' + capi("large") + '<span>Oi! Eu sou a Capi.</span></div><p class="eyebrow">EXPEDIÇÃO NATUREZA · O MAPA DAS DESCOBERTAS</p><h1>Vamos explorar juntos?</h1><p>Prepare a mochila, descubra os sons da natureza, encontre letras e use as palavras para realizar pequenas missões.</p><div class="intro-note"><strong>Uma dica da Capi:</strong> cada passo é importante. Você pode ouvir novamente, pedir ajuda e fazer tudo com calma.</div>' + (legacyFound ? '<p class="legacy-note">Seu progresso anterior foi preservado. Esta nova expedição começa com checkpoints novos.</p>' : '') + '<div class="overall-progress"><span>Seu diário de expedição</span><strong>' + completed + ' de ' + total + ' checkpoints</strong><div class="overall-track"><span style="width:' + (total ? completed / total * 100 : 0) + '%"></span></div></div></section>' +
      musicIntroPanel() + '<section class="world-grid" aria-label="Mapa da expedição">' + cards + '</section>' +
      '<section class="teacher-note"><h2>Uma expedição para aprender junto</h2><p>O professor pode conversar sobre as figuras, falar as palavras, bater palmas para separar sílabas e ajudar a usar o mouse ou touchpad. Arrastar objetos é opcional: também é possível selecionar e depois escolher o lugar.</p></section>';
    document.getElementById("map-music-toggle").addEventListener("click", toggleMapMusic);
    updateStorageStatus();
  }
  function setMapMusicControl(playing, message) {
    const button = document.getElementById("map-music-toggle");
    const status = document.getElementById("map-music-status");
    if (button) {
      button.setAttribute("aria-pressed", String(playing));
      button.setAttribute("aria-label", playing ? "Pausar música da Expedição Natureza" : "Iniciar música da Expedição Natureza");
      const caption = button.querySelector(".music-image-caption");
      if (caption) caption.textContent = playing ? "Ⅱ Pausar música" : "▶ Toque na imagem para ouvir";
    }
    if (status && message) status.textContent = message;
  }
  function toggleMapMusic() {
    const host = document.getElementById("map-music-player");
    if (!host) return;
    if (host.firstElementChild) {
      host.replaceChildren();
      resumeMapMusicOnReturn = false;
      setMapMusicControl(false, "Música pausada. Toque na imagem quando quiser ouvir novamente.");
      return;
    }
    resumeMapMusicOnReturn = false;
    const iframe = document.createElement("iframe");
    iframe.title = "Trilha sonora da Expedição Natureza";
    iframe.width = "200";
    iframe.height = "200";
    iframe.src = "https://www.youtube-nocookie.com/embed/" + MAP_MUSIC_ID + "?autoplay=1&controls=0&disablekb=1&loop=1&playlist=" + MAP_MUSIC_ID + "&playsinline=1&modestbranding=1&rel=0";
    iframe.allow = "autoplay; encrypted-media";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.tabIndex = -1;
    host.replaceChildren(iframe);
    setMapMusicControl(true, "♪ A música está tocando. Toque novamente na imagem para pausar.");
  }
  function stopMapMusic() {
    const host = document.getElementById("map-music-player");
    if (host?.firstElementChild) resumeMapMusicOnReturn = true;
    if (host) host.replaceChildren();
    setMapMusicControl(false, "A música foi pausada ao sair do mapa inicial.");
  }
  function returnToMap() {
    const resumeMusic = resumeMapMusicOnReturn;
    resumeMapMusicOnReturn = false;
    stopSpeech();
    if (global.location.hash) {
      ignoreMapHashChange = true;
      global.location.hash = "";
    }
    renderMap();
    if (resumeMusic) toggleMapMusic();
  }
  function optionValue(item) {
    if (typeof item === "string") return item;
    return item.value ?? String(item.word ?? item.label ?? "");
  }
  function optionVisual(item) {
    if (!item || typeof item === "string") return "";
    if (item.visual === "open-button") {
      return '<svg class="option-illustration open-button-visual" viewBox="0 0 100 76" aria-hidden="true" focusable="false"><rect x="7" y="11" width="86" height="54" rx="9" fill="#2f965c" stroke="#1d7041" stroke-width="4"/><path d="M29 38h33m-12-12 12 12-12 12" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    if (item.shape) {
      const fill = SHAPE_COLORS[item.color] || "#777";
      const geometry = {
        circle: '<circle cx="50" cy="50" r="35" fill="' + fill + '"/>',
        square: '<rect x="16" y="16" width="68" height="68" rx="3" fill="' + fill + '"/>',
        triangle: '<polygon points="50,10 91,86 9,86" fill="' + fill + '"/>',
        star: '<polygon points="50,5 61,36 94,36 67,56 77,90 50,70 23,90 33,56 6,36 39,36" fill="' + fill + '"/>'
      }[item.shape] || "";
      return '<svg class="option-illustration shape-option" viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + geometry + '</svg>';
    }
    return item.emoji ? '<span class="option-emoji" aria-hidden="true">' + esc(item.emoji) + '</span>' : "";
  }
  function optionButton(item, index, selected = false) {
    const isString = typeof item === "string";
    const label = isString ? item : (item.word ?? item.label ?? "Opção");
    const content = optionVisual(item) + '<span class="option-word">' + esc(label) + '</span>';
    return '<button type="button" class="choice-card' + (selected ? " selected" : "") + '" data-value="' + esc(optionValue(item)) + '" data-index="' + index + '">' + content + '</button>';
  }
  function stageShell(world, stage, number, roundIndex) {
    const rounds = stage.rounds.length;
    return '<section class="stage-card"><div class="stage-top"><a class="map-link" href="#">← Mapa</a><span>ROTEIRO ' + world.number + ' · PARADA ' + number + '/' + world.stages.length + '</span></div>' +
      '<div class="stage-progress">' + progressDots(number - 1, world.stages.length) + '</div>' +
      '<div class="stage-heading"><span class="checkpoint-tag">MISSÃO ' + number + '</span><span class="round-tag">DESCOBERTA ' + (roundIndex + 1) + ' DE ' + rounds + '</span></div>' +
      '<h1>' + esc(stage.title) + '</h1><p class="objective">' + esc(stage.objective) + '</p>' +
      '<div class="prompt-row"><p class="prompt" id="stage-prompt">' + esc(stage.rounds[roundIndex].prompt || stage.prompt) + '</p><span id="prompt-audio">' + speakButton(stage.rounds[roundIndex].prompt || stage.prompt, "Ouvir instrução") + '</span></div>' +
      '<div class="stage-support"><span>1. Escute</span><span>2. Observe</span><span>3. Experimente</span></div>' +
      '<div id="challenge" class="challenge"></div>' +
      '<div class="capi-feedback">' + capi() + '<p id="feedback" class="feedback" role="status" aria-live="polite">Faça com calma. A Capi está aqui para ajudar.</p></div>' +
      '<div class="stage-actions"><button id="help-button" class="secondary-button" type="button">💡 Dica da Capi</button><button id="restart-checkpoint" class="secondary-button" type="button">↻ Reiniciar checkpoint</button><button id="next-button" class="primary-button" type="button" disabled>Continuar</button></div>' +
      '<p class="skill-tag">' + esc(stage.objective) + '</p></section>';
  }
  function renderActivityFinish() {
    app.innerHTML = '<section class="finish-card activity-finish"><div class="finish-art">🌿🌼</div><p class="eyebrow">EXPEDIÇÃO CONCLUÍDA</p><h1>Obrigado por explorar comigo!</h1><p>Você percorreu os cinco mundos, descobriu sons, letras, sílabas e palavras. Cada passo foi uma grande descoberta!</p><img class="gratitude-image" src="' + GRATITUDE_IMAGE + '" alt="Uma capivara fofa segurando uma rosa" loading="lazy"><p class="gratitude-caption">Com carinho, Capi 💚</p><p class="bonus-reminder">O Diário de Bordo continua disponível como atividade bônus no mapa.</p><div class="finish-actions"><a href="#" class="primary-link" id="return-map">Voltar ao mapa</a></div></section>';
    document.getElementById("return-map").addEventListener("click", (event) => { event.preventDefault(); returnToMap(); });
  }
  function renderWorld(world) {
    const current = count(world);
    if (current >= world.stages.length) {
      const mainRouteComplete = DATA.worlds.every((item) => count(item) >= item.stages.length);
      if (world.id !== DATA.bonus.id && mainRouteComplete) {
        renderActivityFinish();
        return;
      }
      app.innerHTML = '<section class="finish-card"><div class="finish-art">' + esc(world.art) + '</div><p class="eyebrow">PARADA CONCLUÍDA</p><h1>Você explorou ' + esc(world.title) + '!</h1><p>A Capi está muito feliz com sua descoberta. Você pode voltar ao mapa para continuar a expedição.</p><div class="finish-actions"><a href="#" class="primary-link" id="return-map">Voltar ao mapa</a></div></section>';
      document.getElementById("return-map").addEventListener("click", (event) => { event.preventDefault(); returnToMap(); });
      return;
    }
    const checkpoint = current + 1;
    const roundIndex = STORE.currentRound(progress, world.id, checkpoint);
    renderStage(world, checkpoint, roundIndex);
  }
  function renderStage(world, number, roundIndex) {
    const stage = world.stages[number - 1];
    const rounds = stage.rounds;
    const round = rounds[Math.min(roundIndex, rounds.length - 1)];
    app.innerHTML = stageShell(world, stage, number, roundIndex);
    const challenge = document.getElementById("challenge");
    const feedback = document.getElementById("feedback");
    const next = document.getElementById("next-button");
    const restart = document.getElementById("restart-checkpoint");
    let complete = false;
    let selected = [];
    let selectedValue = null;

    function setFeedback(message, kind = "") {
      feedback.className = "feedback " + kind;
      feedback.textContent = message;
    }
    function finish(message = "Muito bem! Você conseguiu.") {
      if (complete) return;
      complete = true;
      if (!STORE.completeRound(progress, world.id, number, roundIndex, rounds.length)) {
        complete = false;
        setFeedback("Não foi possível atualizar o progresso. Tente novamente.", "gentle");
        return;
      }
      save();
      setFeedback(message, "good");
      next.disabled = false;
      next.textContent = roundIndex < rounds.length - 1 ? "Próxima atividade →" : "Checkpoint concluído →";
    }
    function wrong(message = "Vamos observar outra vez. Você pode tentar de novo.") {
      setFeedback(message, "gentle");
    }
    function renderChoices(items, onAnswer, className = "") {
      const grid = document.createElement("div");
      grid.className = "choice-grid " + className;
      grid.innerHTML = items.map((item, index) => optionButton(item, index)).join("");
      challenge.append(grid);
      grid.querySelectorAll("[data-value]").forEach((button) => button.addEventListener("click", () => {
        if (!complete) onAnswer(button.dataset.value, Number(button.dataset.index), button);
      }));
    }
    function audioFor(text) {
      if (!spoken(text)) setFeedback("A voz não está disponível neste navegador. Peça ao professor para falar e continue.", "hint");
      else setFeedback("Escute com atenção. Você pode repetir quantas vezes precisar.");
    }
    function renderChoiceRound({ showTarget = false, showWord = false, className = "" } = {}) {
      const speech = round.speech || (typeof round.target === "string" ? round.target : "");
      if (showTarget || showWord || speech) {
        challenge.innerHTML = '<div class="reading-card">' + (round.emoji ? '<div class="big-emoji" aria-hidden="true">' + esc(round.emoji) + '</div>' : '') +
          (showTarget ? '<div class="reading-word"><strong>' + esc(stage.kind === "case-match" ? round.letter : round.target) + '</strong></div>' : '') +
          (showWord ? '<div class="reading-word"><strong>' + esc(round.word || speech) + '</strong></div>' : '') +
          (speech ? speakButton(speech) : '') + '</div>';
        challenge.querySelector(".audio-button")?.addEventListener("click", () => audioFor(speech));
        if (speech) setTimeout(() => spoken(speech), 180);
      }
      renderChoices(round.options, (value) => {
        const target = String(round.target ?? round.answer ?? "").toLocaleUpperCase("pt-BR");
        if (String(value).toLocaleUpperCase("pt-BR") === target) finish(round.success || "Você encontrou! Muito bem.");
        else wrong(round.tryAgain || "Observe as opções e tente novamente. A Capi espera com você.");
      }, className);
    }

    if (["click-target", "find-shape", "find-letter", "sound-letter", "case-match", "rhyme", "initial-syllable", "listen-picture", "read-label", "sign-task", "note-task"].includes(stage.kind)) {
      const showTarget = stage.kind === "read-label" || stage.kind === "case-match";
      const showWord = stage.kind === "initial-syllable" || stage.kind === "rhyme";
      renderChoiceRound({ showTarget, showWord, className: stage.kind === "find-letter" || stage.kind === "sound-letter" || stage.kind === "case-match" ? "letter-choices" : "" });
    }

    if (stage.kind === "syllable-count") {
      challenge.innerHTML = '<div class="sound-target"><div class="big-emoji">' + esc(round.emoji) + '</div><div class="word-display">' + esc(round.word) + '</div>' + speakButton(round.word, "Ouvir palavra") + '</div><p class="micro-instruction">Fale devagar e bata uma palma para cada pedaço.</p>';
      challenge.querySelector(".audio-button").addEventListener("click", () => audioFor(round.word));
      setTimeout(() => spoken(round.word), 180);
      renderChoices(["1", "2", "3", "4"], (value) => {
        if (Number(value) === round.syllables.length) finish("Isso! " + round.word + " tem " + round.syllables.length + " partes: " + round.syllables.join(" · ") + ".");
        else wrong("Vamos falar devagar e bater palmas mais uma vez.");
      }, "compact-choices");
    }

    if (stage.kind === "first-syllable") {
      challenge.innerHTML = '<div class="sound-target"><div class="big-emoji">' + esc(round.emoji) + '</div><div class="word-display">' + esc(round.word) + '</div>' + speakButton(round.word, "Ouvir palavra") + '</div><div class="syllable-blocks">' + round.syllables.map((value) => '<span class="syllable-chip">' + esc(value) + '</span>').join("") + '</div><p class="micro-instruction">Ouça e escolha o primeiro pedaço da palavra.</p>';
      challenge.querySelector(".audio-button").addEventListener("click", () => audioFor(round.word));
      setTimeout(() => spoken(round.word), 180);
      renderChoices(round.syllables, (value) => {
        if (value === round.syllables[0]) finish("O primeiro pedaço é " + value + ". A palavra começa assim!");
        else wrong("Acompanhe os pedaços da esquerda para a direita e tente de novo.");
      }, "compact-choices");
    }

    if (stage.kind === "syllable-family") {
      challenge.innerHTML = '<div class="build-syllable"><span class="letter-piece">' + esc(round.consonant) + '</span><span class="join-symbol">+</span><span class="letter-piece vowel">' + esc(round.vowel) + '</span><span class="join-symbol">=</span><span class="syllable-result">?</span></div>' + speakButton(round.consonant + " " + round.vowel, "Ouvir os sons das letras") + '<p class="micro-instruction">Qual sílaba aparece quando juntamos os sons?</p>';
      challenge.querySelector(".audio-button").addEventListener("click", () => audioFor(round.consonant + " " + round.vowel));
      renderChoices(round.options, (value) => {
        if (value === round.answer) finish("Você juntou " + round.consonant + " com " + round.vowel + " e formou " + round.answer + ".");
        else wrong("Observe as duas letras. Qual bloco mostra esses sons juntos?");
      }, "compact-choices");
    }

    if (stage.kind === "connect-dots" || stage.kind === "trace-letter") {
      const sequence = stage.kind === "trace-letter" ? round.points : round.sequence;
      const displayOrder = stage.kind === "connect-dots" ? (round.displayOrder || sequence) : sequence;
      const shuffled = stage.kind === "connect-dots" && Array.isArray(round.displayOrder);
      const boardClass = shuffled ? "dot-board shuffled-dot-board" : "dot-board";
      const target = stage.kind === "trace-letter" ? '<div class="trace-letter">' + esc(round.letter) + '</div>' : '<div class="trail-illustration" aria-hidden="true">🐾</div>';
      challenge.innerHTML = target + '<p class="micro-instruction">' + (stage.kind === "trace-letter" ? "Acompanhe o caminho da letra, do primeiro ao último ponto." : "Os números estão espalhados. Clique neles na ordem indicada.") + '</p><div class="' + boardClass + '" role="group" aria-label="Pontos para conectar">' + displayOrder.map((value) => '<button type="button" class="trail-dot" data-dot="' + esc(value) + '" aria-label="Ponto ' + value + '">' + esc(value) + '</button>').join("") + '</div><p class="trail-status" id="trail-status">Próximo ponto ' + esc(sequence[0]) + ' (1 de ' + sequence.length + ')</p>';
      let at = 0;
      challenge.querySelectorAll("[data-dot]").forEach((button) => button.addEventListener("click", () => {
        if (complete || button.disabled) return;
        const value = button.dataset.dot;
        if (value !== String(sequence[at])) { wrong("Procure o próximo número da sequência: " + sequence[at] + "."); return; }
        button.classList.add("connected");
        button.disabled = true;
        at += 1;
        challenge.querySelector("#trail-status").textContent = at < sequence.length ? "Próximo ponto " + sequence[at] + " (" + (at + 1) + " de " + sequence.length + ")" : "Caminho completo!";
        if (at === sequence.length) finish(stage.kind === "trace-letter" ? "Você acompanhou o caminho da letra " + round.letter + "!" : "Você completou a trilha de pegadas!");
      }));
    }

    if (stage.kind === "place-item") {
      challenge.innerHTML = '<div class="place-layout"><div class="place-items" id="place-items">' + round.options.map((item, index) => '<button type="button" draggable="true" class="place-item" data-value="' + esc(optionValue(item)) + '" data-index="' + index + '"><span>' + esc(item.emoji) + '</span><strong>' + esc(item.word) + '</strong></button>').join("") + '</div><button id="drop-zone" type="button" class="drop-zone"><span class="drop-icon">🎒</span><strong>' + esc(round.target) + '</strong><small>Solte aqui ou clique depois de escolher</small></button></div>';
      const destination = challenge.querySelector("#drop-zone");
      const selectItem = (value) => {
        selectedValue = value;
        challenge.querySelectorAll(".place-item").forEach((button) => button.classList.toggle("selected", button.dataset.value === value));
        setFeedback("Agora clique na mochila para guardar o objeto.", "hint");
      };
      challenge.querySelectorAll(".place-item").forEach((button) => {
        button.addEventListener("click", () => selectItem(button.dataset.value));
        button.addEventListener("dragstart", (event) => { event.dataTransfer.setData("text/plain", button.dataset.value); event.dataTransfer.effectAllowed = "move"; selectItem(button.dataset.value); });
      });
      destination.addEventListener("dragover", (event) => { event.preventDefault(); destination.classList.add("drop-ready"); });
      destination.addEventListener("dragleave", () => destination.classList.remove("drop-ready"));
      destination.addEventListener("drop", (event) => { event.preventDefault(); destination.classList.remove("drop-ready"); selectedValue = event.dataTransfer.getData("text/plain") || selectedValue; placeSelected(); });
      destination.addEventListener("click", placeSelected);
      function placeSelected() {
        if (!selectedValue) { wrong("Primeiro escolha um objeto para guardar."); return; }
        if (String(selectedValue).toLocaleUpperCase("pt-BR") === String(round.item.word).toLocaleUpperCase("pt-BR")) finish("Você guardou " + round.item.word + " na mochila!");
        else wrong("Esse objeto não foi pedido agora. Escolha outro para a mochila.");
      }
    }

    if (stage.kind === "complete-word") {
      challenge.innerHTML = '<div class="reading-card"><div class="reading-word">' + round.parts.map((part) => '<span class="syllable-chip inline-chip">' + esc(part) + '</span>').join(' <span class="word-equals">+</span> ') + '</div><p class="micro-instruction">Qual sílaba está faltando para formar ' + esc(round.word) + '?</p></div>';
      renderChoices(round.options, (value) => { if (value === round.answer) finish("Isso! A palavra formada é " + round.word + "."); else wrong("Fale a palavra devagar e descubra qual pedaço está faltando."); }, "compact-choices");
    }

    if (stage.kind === "build-word") {
      let built = [];
      challenge.innerHTML = '<div class="sound-target"><div class="big-emoji">' + esc(round.emoji) + '</div><div class="word-display">' + esc(round.word) + '</div>' + speakButton(round.word, "Ouvir palavra") + '</div><div class="build-slots">' + round.syllables.map((_, index) => '<span class="build-slot" data-slot="' + index + '">?</span>').join("") + '</div><p class="micro-instruction">Escolha os blocos na ordem em que você ouve a palavra.</p>';
      challenge.querySelector(".audio-button").addEventListener("click", () => audioFor(round.word));
      renderChoices(round.pool, (value, _, button) => {
        const expected = round.syllables[built.length];
        if (value === expected) {
          built.push(value); button.disabled = true;
          challenge.querySelector('[data-slot="' + (built.length - 1) + '"]').textContent = value;
          if (built.length === round.syllables.length) finish("Você juntou os pedaços e formou " + round.word + ".");
          else setFeedback("Boa! Agora procure o próximo pedaço.");
        } else wrong("Diga a palavra devagar e procure o próximo bloco.");
      }, "compact-choices");
    }

    if (stage.kind === "decode-word") {
      challenge.innerHTML = '<div class="reading-card"><div class="reading-word">' + round.parts.map((part) => '<span class="syllable-chip inline-chip">' + esc(part) + '</span>').join(' <span class="word-equals">+</span> ') + '</div><div class="word-equals">↓</div><div class="reading-word"><strong>' + esc(round.word) + '</strong></div><p class="micro-instruction">Junte os pedaços. Qual palavra você formou?</p></div>';
      renderChoices(round.options, (value) => { if (value === round.word) finish("Você leu " + round.word + " juntando as sílabas!"); else wrong("Leia cada pedaço com calma e junte os sons."); });
    }

    if (stage.kind === "list-task") {
      selected = [];
      challenge.innerHTML = '<div class="functional-text"><h3>LISTA DA EXPEDIÇÃO</h3>' + round.list.map((word) => '<p>□ ' + esc(word) + '</p>').join("") + '</div><p class="micro-instruction">Selecione os itens que aparecem na lista.</p>';
      renderChoices(round.options, (value, _, button) => {
        if (selected.includes(value)) { selected = selected.filter((item) => item !== value); button.classList.remove("selected"); }
        else { selected.push(value); button.classList.add("selected"); }
        if (selected.length === round.answer.length) {
          if (round.answer.every((answer) => selected.includes(answer))) finish("Você usou a lista para escolher os itens certos.");
          else { selected = []; challenge.querySelectorAll(".choice-card").forEach((node) => node.classList.remove("selected")); wrong("Compare os nomes da lista com os itens e tente novamente."); }
        }
      });
    }

    if (stage.kind === "sentence-order") {
      let sequence = [];
      const pool = round.words.slice().reverse();
      challenge.innerHTML = '<div class="journal-preview">' + (round.emoji ? '<span>' + esc(round.emoji) + '</span>' : '') + '<strong>DIÁRIO DE CAMPO</strong></div><div class="sentence-builder"><div class="sentence-slots" id="sentence-slots"></div><div class="sentence-pool" id="sentence-pool"></div></div><p class="micro-instruction">Escolha as palavras para montar a frase.</p>';
      function draw() {
        challenge.querySelector("#sentence-slots").innerHTML = round.answer.map((_, index) => '<span class="sentence-slot">' + esc(sequence[index] || "·") + '</span>').join("");
        challenge.querySelector("#sentence-pool").innerHTML = pool.map((word, index) => '<button class="word-token" type="button" data-word="' + esc(word) + '"' + (sequence.includes(word) ? " disabled" : "") + '>' + esc(word) + '</button>').join("");
        challenge.querySelectorAll(".word-token").forEach((button) => button.addEventListener("click", () => {
          if (complete || button.disabled) return;
          const expected = round.answer[sequence.length];
          if (button.dataset.word === expected) {
            sequence.push(button.dataset.word);
            if (sequence.length === round.answer.length) finish("Você organizou as palavras e registrou sua descoberta!");
            else draw();
          } else wrong("Observe as palavras e pense em como a frase começa. Tente de novo.");
        }));
      }
      draw();
    }

    document.getElementById("help-button").addEventListener("click", () => {
      const hints = {
        "connect-dots": "Procure o número 1. Depois siga para o número seguinte.",
        "trace-letter": "Comece pelo ponto 1 e continue seguindo os números.",
        "place-item": "Escolha o objeto que a Capi pediu e depois coloque na mochila.",
        "syllable-count": "Diga a palavra bem devagar e bata palmas para cada pedaço.",
        "first-syllable": "A primeira sílaba é o pedaço que ouvimos no começo da palavra.",
        "syllable-family": "Observe a consoante e a vogal. Juntas, elas formam uma sílaba.",
        "build-word": "Comece pela sílaba que você fala primeiro.",
        "complete-word": "Fale a palavra devagar e descubra qual pedaço está faltando.",
        "decode-word": "Leia cada bloco e junte os sons para formar a palavra.",
        "list-task": "Compare os nomes da lista com os nomes dos objetos.",
        "sentence-order": "Pense em qual palavra pode começar a frase.",
        "note-task": "Ouça o recado novamente e procure o que Capi pediu.",
        "sign-task": "A placa mostra para onde devemos ir. Escute mais uma vez.",
        "rhyme": "Fale as duas palavras e observe como elas terminam.",
        "initial-syllable": "Compare o primeiro pedaço das duas palavras."
      };
      const hint = hints[stage.kind] || "Você pode ouvir de novo, observar as opções e pedir ajuda ao professor.";
      setFeedback(hint, "hint");
      if (round.speech) spoken(round.speech);
      else if (round.word) spoken(round.word);
    });
    document.getElementById("prompt-audio")?.querySelector("[data-speak]")?.addEventListener("click", () => {
      if (!spoken(round.prompt || stage.prompt)) setFeedback("Peça ao professor para ler a instrução.", "hint");
    });
    restart.addEventListener("click", () => {
      if (!global.confirm("Reiniciar este checkpoint? As atividades deste checkpoint serão refeitas, mas os checkpoints anteriores continuarão concluídos.")) return;
      stopSpeech();
      if (!STORE.resetCheckpoint(progress, world.id, number)) {
        setFeedback("Não foi possível reiniciar este checkpoint. Volte ao mapa e entre novamente.", "gentle");
        return;
      }
      save();
      renderStage(world, number, 0);
      global.scrollTo?.(0, 0);
    });
    next.addEventListener("click", () => {
      if (!complete) return;
      stopSpeech();
      if (roundIndex < rounds.length - 1) renderStage(world, number, roundIndex + 1);
      else renderWorld(world);
      global.scrollTo?.(0, 0);
    });
    document.querySelector(".map-link").addEventListener("click", (event) => {
      event.preventDefault();
      returnToMap();
    });
    updateStorageStatus();
  }
  function route() {
    stopSpeech();
    if (ignoreMapHashChange && !global.location.hash) {
      ignoreMapHashChange = false;
      return;
    }
    const id = decodeURIComponent(global.location.hash.replace(/^#/, ""));
    if (!id) {
      renderMap();
      if (resumeMapMusicOnReturn) setMapMusicControl(false, "Toque na imagem para retomar a música do acampamento.");
      return;
    }
    stopMapMusic();
    const world = worldList().find((item) => item.id === id);
    if (world) { renderWorld(world); return; }
    global.location.hash = "";
    renderMap();
  }
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-speak]");
    if (button && !button.closest("#prompt-audio")) {
      if (!spoken(button.dataset.speak)) {
        const feedback = document.getElementById("feedback");
        if (feedback) { feedback.className = "feedback hint"; feedback.textContent = "A leitura em voz alta não está disponível. Peça ao professor para falar a palavra."; }
      }
    }
  });
  document.getElementById("reset-progress").addEventListener("click", () => {
    if (!global.confirm("Apagar somente o progresso novo da Expedição Natureza neste navegador? O progresso antigo será preservado.")) return;
    progress = STORE.reset(); storageMode = "localStorage"; save(); stopSpeech(); stopMapMusic(); global.location.hash = ""; renderMap();
  });
  global.addEventListener("hashchange", route);
  global.addEventListener("pagehide", () => { stopSpeech(); stopMapMusic(); });
  route();
})(window);
