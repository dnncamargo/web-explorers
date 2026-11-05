(function (global) {
  const DATA = global.WordAdventureContent;
  const STORE = global.WordAdventureProgress;
  if (!DATA || !STORE) return;

  const loaded = STORE.load();
  let progress = loaded.progress;
  let storageMode = loaded.mode;
  const app = document.getElementById("app");

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);
  }
  function worldList() { return [...DATA.worlds, DATA.bonus]; }
  function count(world) { return progress.completed[world.id] || 0; }
  function save() {
    const result = STORE.save(progress, storageMode);
    storageMode = result.mode;
    updateStorageStatus();
  }
  function updateStorageStatus() {
    const node = document.getElementById("storage-status");
    if (node) node.textContent = storageMode === "memory"
      ? "O navegador não permite salvar o progresso. Ele ficará disponível enquanto esta página estiver aberta."
      : "Seu progresso fica salvo neste navegador.";
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
    try { global.speechSynthesis?.cancel(); } catch { /* voice is optional */ }
  }
  function renderPrompt(world, stage, item, promptText) {
    const spokenText = promptText || item?.word || stage.prompt;
    const prompt = document.getElementById("stage-prompt");
    if (prompt) prompt.textContent = promptText || stage.prompt;
    const host = document.getElementById("prompt-audio");
    if (host) host.innerHTML = speakButton(spokenText, "Ouvir instrução");
  }
  function speakButton(text, label = "Ouvir palavra") {
    return '<button class="audio-button" type="button" data-speak="' + esc(text) + '" aria-label="' + esc(label) + '">🔊 Ouvir</button>';
  }
  function progressDots(current, total) {
    return Array.from({length:total},(_,i)=>'<span class="dot ' +(i<current?"done":"")+'"></span>').join("");
  }
  function renderMap() {
    const cards = worldList().map((world) => {
      const current = count(world);
      const total = world.stages.length;
      const done = current >= total;
      return '<a class="world-card world-' + esc(world.theme) + '" href="#' + esc(world.id) + '">' +
        '<div class="card-top"><span>MUNDO ' + world.number + '</span><span>' + (world.id === "story-city" ? "BÔNUS" : (done ? "CONCLUÍDO" : "AVENTURA")) + '</span></div>' +
        '<div class="world-art" aria-hidden="true">' + worldArt(world.id) + '</div>' +
        '<h2>' + esc(world.title) + '</h2><p>' + esc(world.subtitle) + '</p>' +
        '<div class="dots" aria-label="' + current + ' de ' + total + ' fases concluídas">' + progressDots(current,total) + '</div>' +
        '<span class="card-progress">' + current + ' de ' + total + ' fases</span><span class="card-action">' + (done ? "Revisitar mundo" : "Entrar no mundo") + ' →</span></a>';
    }).join("");
    app.innerHTML = '<section class="map-intro"><p class="eyebrow">UMA AVENTURA DE LEITURA</p><h1>Aventura das Palavras</h1><p>Escute, descubra os sons, encontre letras, junte sílabas e use a leitura para resolver pequenas missões.</p><div class="intro-note"><strong>Uma dica:</strong> você pode ouvir as palavras quantas vezes precisar. Não existe relógio nem punição por tentar.</div></section>' +
      '<section class="world-grid" aria-label="Mapa de mundos">' + cards + '</section>' +
      '<section class="teacher-note"><h2>Uma aventura para aprender junto</h2><p>O professor pode falar as palavras com a criança, bater palmas para separar as sílabas e conversar sobre o significado. O jogo ajuda a praticar; a conversa e a leitura compartilhada também fazem parte da missão.</p></section>';
    updateStorageStatus();
  }
  function worldArt(id) {
    return ({ "sound-island":"🌴🐚🔊","letter-village":"🏡🔤⭐","syllable-workshop":"🛠️🧩🔠","word-market":"🏪🧺📋","story-city":"🏙️📖💬" })[id] || "⭐";
  }
  function optionButton(item, index, selected = false) {
    const content = item.emoji
      ? '<span class="option-emoji" aria-hidden="true">' + esc(item.emoji) + '</span>' + (item.word ? '<span class="option-word">' + esc(item.word) + '</span>' : '')
      : '<span class="letter-option">' + esc(item) + '</span>';
    const value = typeof item === "string" ? item : item.word;
    return '<button type="button" class="choice-card' + (selected ? " selected" : "") + '" data-choice="' + esc(value) + '" data-choice-index="' + index + '">' + content + '</button>';
  }
  function stageShell(world, stage, number) {
    return '<section class="stage-card"><div class="stage-top"><a class="map-link" href="#">← Mapa</a><span>MUNDO ' + world.number + ' · FASE ' + number + '/' + world.stages.length + '</span></div>' +
      '<div class="stage-progress">' + progressDots(number-1, world.stages.length) + '</div>' +
      '<h1>' + esc(stage.title) + '</h1><p class="objective">' + esc(stage.objective) + '</p>' +
      '<div class="prompt-row"><p class="prompt" id="stage-prompt">' + esc(stage.prompt) + '</p><span id="prompt-audio">' + speakButton(stage.prompt, "Ouvir instrução") + '</span></div>' +
      '<div class="stage-support"><span>1. Escute</span><span>2. Observe</span><span>3. Escolha</span></div>' +
      '<div id="challenge" class="challenge"></div>' +
      '<p id="feedback" class="feedback" role="status" aria-live="polite">Faça com calma. Você pode ouvir novamente.</p>' +
      '<div class="stage-actions"><button id="help-button" class="secondary-button" type="button">💡 Me dê uma pista</button><button id="next-button" class="primary-button" type="button" disabled>Continuar</button></div>' +
      '<p class="skill-tag">Habilidade desta fase: ' + esc(stage.objective) + '</p></section>';
  }
  function renderWorld(world) {
    const current = count(world);
    if (current >= world.stages.length) {
      app.innerHTML = '<section class="finish-card"><div class="finish-art">' + worldArt(world.id) + '</div><p class="eyebrow">MISSÃO CONCLUÍDA</p><h1>Você explorou ' + esc(world.title) + '!</h1><p>As palavras têm sons, partes e significados. Você pode voltar para praticar novamente.</p><div class="finish-actions"><a href="#" class="primary-link" id="return-map">Voltar ao mapa</a><button type="button" class="secondary-button" id="review-world">Rever o mundo</button></div></section>';
      document.getElementById("return-map").addEventListener("click", (event) => { event.preventDefault(); global.location.hash = ""; renderMap(); });
      document.getElementById("review-world").addEventListener("click", () => renderStage(world, 1));
      return;
    }
    renderStage(world, current + 1);
  }
  function renderStage(world, number) {
    const stage = world.stages[number-1];
    app.innerHTML = stageShell(world, stage, number);
    const challenge = document.getElementById("challenge");
    const feedback = document.getElementById("feedback");
    const next = document.getElementById("next-button");
    let complete = false;
    let selected = [];

    function setFeedback(message, kind = "") {
      feedback.className = "feedback " + kind;
      feedback.textContent = message;
    }
    function finish(message = "Muito bem! Você descobriu a resposta.") {
      if (complete) return;
      complete = true;
      if (!STORE.complete(progress, world.id, number)) {
        complete = false;
        setFeedback("Não foi possível atualizar o progresso. Volte ao mapa e tente novamente.", "gentle");
        return;
      }
      save();
      setFeedback(message, "good");
      next.disabled = false;
      next.textContent = number < world.stages.length ? "Próxima fase →" : "Concluir mundo";
    }
    function wrong(message) {
      setFeedback(message || "Vamos observar novamente. Tente outra vez.", "gentle");
    }
    function renderChoices(items, onAnswer, className = "") {
      const choiceGrid = document.createElement("div");
      choiceGrid.className = "choice-grid " + className;
      choiceGrid.innerHTML = items.map((item,i)=>optionButton(item,i)).join("");
      challenge.append(choiceGrid);
      choiceGrid.querySelectorAll("[data-choice]").forEach((button) => {
        button.addEventListener("click", () => {
          if (complete) return;
          onAnswer(button.dataset.choice, Number(button.dataset.choiceIndex), button);
        });
      });
    }
    function audioWord(word) {
      if (!spoken(word)) setFeedback("A leitura em voz alta não está disponível neste navegador. Peça ao professor para falar a palavra e continue a missão.", "hint");
      else setFeedback("Escute com atenção e repita em voz alta, se puder.");
    }

    if (stage.kind === "listen-picture") {
      const item = stage.items[(number - 1) % stage.items.length];
      challenge.innerHTML = '<div class="sound-target"><div class="big-emoji">' + item.emoji + '</div>' + speakButton(item.word) + '</div>';
      renderChoices(stage.items.map(v=>({word:v.word,emoji:v.emoji})), (value) => {
        if (value === item.word) finish("Você ouviu a palavra e encontrou o que ela nomeia!");
        else wrong("Ouça mais uma vez. Que palavra foi falada?");
      });
      challenge.querySelector(".audio-button").addEventListener("click",()=>audioWord(item.word));
      setTimeout(()=>spoken(item.word),150);
    }

    if (stage.kind === "syllable-count") {
      const item = stage.items[(number - 1) % stage.items.length];
      challenge.innerHTML = '<div class="sound-target"><div class="big-emoji">' + item.emoji + '</div><div class="word-display">' + esc(item.word) + '</div>' + speakButton(item.word,"Ouvir e falar a palavra") + '</div><p class="micro-instruction">Fale devagar e bata uma palma para cada pedaço.</p>';
      renderChoices(["1","2","3","4"], value => {
        if (Number(value) === item.syllables.length) finish("Isso! " + item.word + " tem " + item.syllables.length + " partes faladas: " + item.syllables.join(" · ") + ".");
        else wrong("Vamos falar devagar e bater palmas mais uma vez.");
      });
      challenge.querySelector(".audio-button").addEventListener("click",()=>audioWord(item.word));
      setTimeout(()=>spoken(item.word),150);
    }

    if (stage.kind === "initial-sound") {
      const item = stage.items[(number - 1) % stage.items.length];
      challenge.innerHTML = '<div class="sound-target"><div class="big-emoji">' + item.emoji + '</div><div class="word-display">' + item.word + '</div>' + speakButton(item.word) + '</div><p class="micro-instruction">Qual outra palavra começa com o mesmo som?</p>';
      renderChoices(item.options, value => {
        if(value===item.answer) finish("Muito bem! " + item.word + " e " + item.answer + " começam com " + item.syllables[0] + ".");
        else wrong("Repita as duas palavras. Escute como cada uma começa.");
      });
      challenge.querySelector(".audio-button").addEventListener("click",()=>audioWord(item.word));
      setTimeout(()=>spoken(item.word),150);
    }

    if (stage.kind === "first-syllable") {
      const item = stage.items[(number-1)%stage.items.length];
      challenge.innerHTML = '<div class="sound-target"><div class="big-emoji">' + item.emoji + '</div><div class="word-display">' + item.word + '</div>' + speakButton(item.word) + '</div><div class="syllable-blocks">' + item.syllables.map((s,i)=>'<span class="syllable-chip" data-syllable="' + s + '">' + s + '</span>').join("") + '</div><p class="micro-instruction">Ouça e escolha o primeiro pedaço da palavra.</p>';
      renderChoices(item.syllables, value => {
        if (value === item.syllables[0]) finish("O primeiro pedaço é " + value + ". A palavra começa assim!");
        else wrong("Acompanhe os pedaços da esquerda para a direita e tente de novo.");
      }, "compact-choices");
      challenge.querySelector(".audio-button").addEventListener("click",()=>audioWord(item.word));
      setTimeout(()=>spoken(item.word),150);
    }

    if (stage.kind === "find-letter" || stage.kind === "sound-letter" || stage.kind === "word-initial") {
      const item = stage.items[(number-1)%stage.items.length];
      const key = item.letter;
      const showInitial = stage.kind !== "sound-letter";
      challenge.innerHTML = '<div class="sound-target"><div class="big-emoji">' + (item.emoji || "🔤") + '</div>' +
        (item.word && showInitial ? '<div class="word-display">' + item.word.split("").map((char,i)=>'<span class="' + (i===0?"first-letter":"") + '">' + esc(char) + '</span>').join("") + '</div>' : '') +
        (stage.kind === "sound-letter" ? '<p class="micro-instruction">Ouça a palavra e perceba o som que aparece no começo.</p>' : '') +
        (stage.kind === "word-initial" ? '<p class="word-display">' + esc(item.word) + '</p>' : '') +
        speakButton(item.word || key) + '</div>';
      renderChoices(item.options, value => {
        if (value === key) finish("Você encontrou a letra " + key + ". Ela representa o som que aparece no começo!");
        else wrong("Observe a forma da letra e escute o começo da palavra novamente.");
      }, "letter-choices");
      challenge.querySelector(".audio-button").addEventListener("click",()=>audioWord(item.word || key));
      setTimeout(()=>spoken(item.word || key),150);
    }

    if (stage.kind === "case-match") {
      const item = stage.items[(number-1)%stage.items.length];
      challenge.innerHTML = '<div class="case-pair"><span class="target-letter">' + item.letter + '</span><span class="case-arrow">↔</span><span class="target-letter">?</span></div><p class="micro-instruction">Encontre a mesma letra em formato minúsculo.</p>';
      renderChoices(item.options, value => {
        if(value === item.answer) finish("Essa é a mesma letra em outro formato: " + item.letter + " e " + item.answer + ".");
        else wrong("Compare o desenho: a letra é a mesma, mesmo quando muda de tamanho e forma.");
      }, "letter-choices");
    }

    if (stage.kind === "syllable-family") {
      const item = stage.items[(number-1)%stage.items.length];
      challenge.innerHTML = '<div class="build-syllable"><span class="letter-piece">' + item.consonant + '</span><span class="join-symbol">+</span><span class="letter-piece vowel">' + item.vowel + '</span><span class="join-symbol">=</span><span class="syllable-result">' + item.answer + '</span></div>' + speakButton(item.answer,"Ouvir sílaba");
      renderChoices(item.options, value => {
        if(value===item.answer) finish("Você juntou " + item.consonant + " com " + item.vowel + " e formou " + item.answer + ".");
        else wrong("Ouça novamente e observe as duas letras que se juntam.");
      }, "compact-choices");
      challenge.querySelector(".audio-button").addEventListener("click",()=>spoken(item.answer));
      setTimeout(()=>spoken(item.answer),150);
    }

    if (stage.kind === "build-word") {
      const item=stage.items[(number-1)%stage.items.length];
      challenge.innerHTML='<div class="sound-target"><div class="big-emoji">' + item.emoji + '</div><div class="word-display">' + item.word + '</div>' + speakButton(item.word) + '</div><div class="build-slots">' + item.syllables.map((_,i)=>'<span class="build-slot" data-slot="' + i + '">?</span>').join("") + '</div><p class="micro-instruction">Escolha os blocos na ordem em que você ouve a palavra.</p>';
      let chosen=[];
      renderChoices(item.pool, value=>{
        const expected=item.syllables[chosen.length];
        if(value===expected) {
          chosen.push(value);
          challenge.querySelector('[data-slot="' + (chosen.length-1) + '"]').textContent=value;
          if(chosen.length===item.syllables.length) finish("Você juntou os pedaços e formou " + item.word + ".");
          else setFeedback("Boa! Agora procure o próximo pedaço.");
        } else wrong("Diga a palavra devagar e procure o próximo bloco.");
      },"compact-choices");
      challenge.querySelector(".audio-button").addEventListener("click",()=>audioWord(item.word));
      setTimeout(()=>spoken(item.word),150);
    }

    if (stage.kind === "decode-word" || stage.kind === "read-label" || stage.kind === "word-choice") {
      const item=stage.items[(number-1)%stage.items.length];
      challenge.innerHTML='<div class="reading-card"><div class="reading-word">' + (item.parts ? item.parts.join(" · ") + ' <span class="word-equals">→</span> ' : '') + '<strong>' + item.word + '</strong></div>' +
        (stage.kind==="decode-word" ? '<div class="big-emoji">' + item.emoji + '</div>' : '') + speakButton(item.word) + '</div>';
      renderChoices(item.options.map(v=>typeof v==="string"?v:v), value=>{
        if(value===item.word) finish("Você leu a palavra e encontrou seu significado.");
        else wrong("Leia cada pedaço com calma e junte os sons.");
      });
      challenge.querySelector(".audio-button").addEventListener("click",()=>audioWord(item.word));
      setTimeout(()=>spoken(item.word),150);
    }

    if (stage.kind === "list-task") {
      const item=stage.items[0];
      challenge.innerHTML='<div class="functional-text"><h3>LISTA</h3>' + item.list.map(w=>'<p>□ ' + esc(w) + '</p>').join("") + '</div><p class="micro-instruction">Selecione os itens que aparecem na lista.</p>';
      renderChoices(item.options, (value,_,button)=>{
        if(selected.includes(value)){ selected=selected.filter(v=>v!==value); button.classList.remove("selected"); }
        else { selected.push(value); button.classList.add("selected"); }
        if(selected.length===2){
          if(item.answer.every(v=>selected.includes(v))) finish("Você usou a lista para escolher os itens certos.");
          else { selected=[]; challenge.querySelectorAll(".choice-card").forEach(b=>b.classList.remove("selected")); wrong("Compare os nomes da lista com as etiquetas e tente novamente."); }
        }
      });
    }

    if (stage.kind === "message-task" || stage.kind === "sign-task" || stage.kind === "note-task") {
      const item=stage.items[0];
      const message=item.message;
      challenge.innerHTML='<div class="functional-text"><h3>' + (stage.kind==="sign-task"?"PLACA":stage.kind==="note-task"?"BILHETE":"MENSAGEM") + '</h3><p class="message-text">' + esc(message) + '</p>' + speakButton(item.spoken || message) + '</div>';
      renderChoices(item.options, value=>{
        if(value===item.target) finish("Você compreendeu a mensagem e encontrou o que ela pediu.");
        else wrong("Leia ou escute a mensagem de novo. Qual palavra mostra o que fazer?");
      });
      challenge.querySelector(".audio-button").addEventListener("click",()=>spoken(item.spoken || message));
      setTimeout(()=>spoken(item.spoken || message),150);
    }

    if (stage.kind === "sentence-order") {
      const item=stage.items[0];
      let sequence=[];
      let pool = item.words.slice();
      challenge.innerHTML='<div class="sentence-builder"><div class="sentence-slots" id="sentence-slots"></div><div class="sentence-pool" id="sentence-pool"></div></div><p class="micro-instruction">Escolha as palavras para montar a frase.</p>';
      function draw() {
        challenge.querySelector("#sentence-slots").innerHTML=item.answer.map((_,i)=>'<span class="sentence-slot">' + esc(sequence[i] || "·") + '</span>').join("");
        challenge.querySelector("#sentence-pool").innerHTML=pool.map((word,index)=>'<button class="word-token" type="button" data-word="' + esc(word) + '" data-index="' + index + '"' + (sequence.includes(word) ? " disabled" : "") + '>' + esc(word) + '</button>').join("");
        challenge.querySelectorAll(".word-token").forEach((button)=>button.addEventListener("click",()=>{
          if(complete || button.disabled) return;
          const expected=item.answer[sequence.length];
          if(button.dataset.word===expected) {
            sequence.push(button.dataset.word);
            if(sequence.length===item.answer.length) finish("Você organizou as palavras e formou uma frase com sentido!");
            else draw();
          } else {
            sequence=[];
            pool = pool.slice().reverse();
            draw();
            wrong("Observe o começo da frase. Qual palavra deve vir primeiro?");
          }
        }));
      }
      draw();
    }

    document.getElementById("help-button").addEventListener("click",()=>{
      const first=itemForHint(stage);
      if(first) setFeedback(first,"hint");
      if (!spoken(stage.prompt)) setFeedback(first + " A voz não está disponível; o professor pode ler a instrução.", "hint");
    });
    const promptAudio = document.getElementById("prompt-audio");
    promptAudio?.querySelector("[data-speak]")?.addEventListener("click", () => {
      if (!spoken(stage.prompt)) setFeedback("Peça ao professor para ler a instrução.", "hint");
    });
    next.addEventListener("click",()=>{
      if(!complete)return;
      stopSpeech();
      if(number<world.stages.length)renderStage(world,number+1);
      else renderWorld(world);
    });
    document.querySelector(".map-link").addEventListener("click",(event)=>{event.preventDefault();stopSpeech();global.location.hash="";renderMap();});
    updateStorageStatus();
  }
  function itemForHint(stage) {
    if(stage.kind==="syllable-count")return "Diga a palavra devagar e bata uma palma a cada vez que a boca abre para formar uma sílaba.";
    if(stage.kind==="initial-sound")return "Alongue o primeiro pedaço das duas palavras e compare como elas começam.";
    if(stage.kind==="first-syllable")return "A primeira sílaba é o bloco que aparece no início, antes dos outros.";
    if(stage.kind==="build-word")return "Comece pelo som que você ouve primeiro. Depois procure a próxima sílaba.";
    if(stage.kind==="decode-word")return "Olhe cada bloco, fale os sons juntos e leia a palavra inteira.";
    if(stage.kind==="message-task"||stage.kind==="note-task"||stage.kind==="sign-task")return "Ouça a mensagem e procure a palavra que indica o que fazer ou encontrar.";
    return "Peça ao professor para falar a palavra devagar e mostrar como ela começa.";
  }
  function route() {
    stopSpeech();
    const id=decodeURIComponent(global.location.hash.replace(/^#/,""));
    if(!id){renderMap();return;}
    const world=worldList().find(item=>item.id===id);
    if(world){renderWorld(world);return;}
    renderMap();
  }
  document.addEventListener("click",(event)=>{
    const button=event.target.closest("[data-speak]");
    if(button && !button.closest("#prompt-audio")) {
      if (!spoken(button.dataset.speak)) {
        const feedback = document.getElementById("feedback");
        if (feedback) {
          feedback.className = "feedback hint";
          feedback.textContent = "A leitura em voz alta não está disponível. Peça ao professor para falar a palavra.";
        }
      }
    }
  });
  document.getElementById("reset-progress").addEventListener("click",()=>{
    if(!global.confirm("Apagar somente o progresso da Aventura das Palavras neste navegador?"))return;
    progress=STORE.reset();storageMode="localStorage";save();renderMap();
  });
  global.addEventListener("hashchange",route);
  global.addEventListener("pagehide",stopSpeech);
  route();
})(window);
