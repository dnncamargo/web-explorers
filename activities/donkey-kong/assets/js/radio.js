(function (global) {
  const config = {
    map: "DTLfV7Ru5VY",
    jungle: "eAm9fk39c50",
    mine: "cBK2YIrY62I",
    camp: "wxAZfLenfa0",
    boss: "i3qYmvTq6uI"
  };
  const page = document.body.dataset.page;
  const world = document.body.dataset.world;
  const isMapPage = page === "map";
  const videoId = isMapPage ? config.map : page === "boss" ? config.boss : config[world];
  const status = document.getElementById("radio-status");
  const toggle = document.getElementById("radio-toggle");
  const fallback = document.getElementById("radio-fallback");
  const host = document.getElementById("radio-player");
  if (!videoId || !status || !toggle || !host) return;

  let player = null;
  let ready = false;
  let playing = false;
  let apiFailed = false;
  let monitor = null;

  const setStatus = (message) => { status.textContent = message; };
  function signal(name) {
    global.dispatchEvent(new CustomEvent("donkeykong:" + name));
  }

  if (fallback) fallback.href = "https://www.youtube.com/watch?v=" + videoId;

  function startPlayback() {
    if (!ready || !player) {
      setStatus("Conectando à rádio. Você também pode abrir a trilha no YouTube.");
      return false;
    }
    try {
      player.setVolume(25);
      player.playVideo();
      setStatus("Tentando iniciar a trilha...");
      return true;
    } catch {
      setStatus("Não foi possível iniciar a trilha. Use Play no player ou abra no YouTube.");
      return false;
    }
  }

  function playFromGesture() {
    // This method is called synchronously by the barrel button click while
    // the YouTube player is already ready, preserving the user's activation.
    if (!ready || !player) return false;
    return startPlayback();
  }

  function pausePlayback() {
    try { if (player) player.pauseVideo(); } catch { /* player can be unavailable */ }
  }

  function stopMonitor() {
    if (monitor) global.clearInterval(monitor);
    monitor = null;
  }

  function markUnavailable(message) {
    if (apiFailed) return;
    apiFailed = true;
    setStatus(message || "A rádio não carregou. Você pode entrar sem música e abrir a trilha no YouTube.");
    signal("radio-error");
  }

  function loadApi() {
    if (global.YT && global.YT.Player) {
      createPlayer();
      return;
    }
    if (document.querySelector("script[data-dk-youtube-api]")) return;

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.dataset.dkYoutubeApi = "true";
    script.onerror = () => markUnavailable();
    document.head.appendChild(script);

    global.setTimeout(() => {
      if (!ready && !apiFailed && !(global.YT && global.YT.Player)) {
        markUnavailable("A rádio demorou para responder. Você pode entrar sem música ou abrir a trilha no YouTube.");
      }
    }, 9000);
  }

  function createPlayer() {
    if (player || !global.YT || !global.YT.Player) return;
    try {
      const playerVars = {
        autoplay: isMapPage ? 0 : 1,
        controls: 1,
        playsinline: 1,
        rel: 0,
        loop: 1,
        playlist: videoId
      };
      if (location.protocol === "https:" || location.protocol === "http:") playerVars.origin = location.origin;

      player = new global.YT.Player(host, {
        width: "360",
        height: "203",
        videoId,
        playerVars,
        events: {
          onReady() {
            ready = true;
            player.setVolume(25);
            if (isMapPage) {
              setStatus("Rádio pronta. Clique no barril para entrar e iniciar a música.");
              signal("radio-ready");
            } else {
              setStatus("Rádio conectada. A trilha tenta iniciar automaticamente; use Play se o navegador bloquear.");
              startPlayback();
            }
          },
          onStateChange(event) {
            const states = global.YT.PlayerState;
            if (event.data === states.PLAYING) {
              playing = true;
              toggle.textContent = "Ⅱ Pausar trilha";
              toggle.setAttribute("aria-pressed", "true");
              setStatus("♪ Trilha tocando. Volume inicial: 25/100.");
              stopMonitor();
              monitor = global.setInterval(() => {
                if (player && player.getPlayerState && player.getPlayerState() === states.ENDED) startPlayback();
              }, 1500);
            } else if (event.data === states.PAUSED) {
              playing = false;
              toggle.textContent = "♪ Ouvir trilha";
              toggle.setAttribute("aria-pressed", "false");
              setStatus("Trilha pausada.");
            } else if (event.data === states.BUFFERING) {
              setStatus("Carregando a trilha...");
            } else if (event.data === states.ENDED) {
              startPlayback();
            }
          },
          onAutoplayBlocked() {
            playing = false;
            toggle.textContent = "♪ Ouvir trilha";
            toggle.setAttribute("aria-pressed", "false");
            setStatus("O navegador bloqueou o início automático. Clique em Ouvir trilha para começar.");
          },
          onError(event) {
            playing = false;
            toggle.textContent = "♪ Ouvir trilha";
            toggle.setAttribute("aria-pressed", "false");
            markUnavailable("A trilha não pôde ser reproduzida (erro " + event.data + "). A atividade continua normalmente; tente o link do YouTube.");
          }
        }
      });
    } catch {
      markUnavailable("A rádio não pôde ser carregada. Você pode entrar sem música.");
    }
  }

  toggle.addEventListener("click", () => {
    if (playing) pausePlayback();
    else startPlayback();
  });

  global.DonkeyKongRadio = {
    isReady: () => ready,
    hasFailed: () => apiFailed,
    playFromGesture
  };
  global.onYouTubeIframeAPIReady = createPlayer;
  loadApi();
})(window);
