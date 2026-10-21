(function (global) {
  const status = document.getElementById("audio-status");
  const toggle = document.getElementById("audio-toggle");
  const mute = document.getElementById("audio-mute");
  const volume = document.getElementById("audio-volume");
  const host = document.getElementById("youtube-player");
  const worldId = Number(document.body.dataset.world || 1);
  const initialTrack = global.YoshiWorldData?.worlds?.[worldId]?.track || global.YoshiWorldData?.worlds?.[1]?.track;

  if (!status || !toggle || !host) return;

  let player = null;
  let playerPromise = null;
  let playerReadyPromise = null;
  let currentTrack = initialTrack;
  let isPlaying = false;
  let isMuted = false;
  let volumeLevel = Number(volume?.value || 35);
  let requestVersion = 0;

  function setStatus(message) {
    status.textContent = message;
  }

  function setPlaying(value) {
    isPlaying = value;
    toggle.setAttribute("aria-pressed", String(value));
    toggle.textContent = value ? "Ⅱ Pausar trilha" : "♪ Ouvir trilha";
  }

  function addFallback(track) {
    let link = document.getElementById("audio-fallback");
    if (!link) {
      link = document.createElement("a");
      link.id = "audio-fallback";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Abrir a trilha no YouTube";
      link.className = "audio-fallback";
      status.insertAdjacentElement("afterend", link);
    }
    link.href = `https://www.youtube.com/watch?v=${encodeURIComponent(track)}`;
    link.hidden = false;
  }

  function loadApi() {
    if (global.YT?.Player) return Promise.resolve(global.YT);
    if (playerPromise) return playerPromise;

    playerPromise = new Promise((resolve, reject) => {
      const timeout = global.setTimeout(() => reject(new Error("YouTube API indisponível")), 9000);
      const previousCallback = global.onYouTubeIframeAPIReady;
      global.onYouTubeIframeAPIReady = function () {
        if (typeof previousCallback === "function") previousCallback();
        global.clearTimeout(timeout);
        resolve(global.YT);
      };
      let script = document.querySelector('script[data-yoshi-youtube-api]');
      if (!script) {
        script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        script.dataset.yoshiYoutubeApi = "true";
        script.onerror = () => {
          global.clearTimeout(timeout);
          reject(new Error("Não foi possível carregar o YouTube"));
        };
        document.head.append(script);
      }
    });
    return playerPromise;
  }

  async function ensurePlayer(track) {
    const YT = await loadApi();
    if (playerReadyPromise) return playerReadyPromise;
    playerReadyPromise = new Promise((resolve, reject) => {
      try {
        player = new YT.Player(host, {
          width: "200",
          height: "200",
          videoId: track,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            loop: 1,
            modestbranding: 1,
            playsinline: 1,
            playlist: track,
            origin: global.location.origin,
          },
          events: {
            onReady(event) {
              event.target.setVolume(volumeLevel);
              if (isMuted) event.target.mute();
              resolve(event.target);
            },
            onError() {
              setPlaying(false);
              setStatus("A trilha não está disponível agora. Você pode continuar a atividade normalmente.");
              addFallback(currentTrack);
              reject(new Error("A trilha não está disponível"));
            },
            onStateChange(event) {
              const playingTrack = event.target.getVideoData?.().video_id;
              if (playingTrack && playingTrack !== currentTrack) return;
              if (event.data === YT.PlayerState.PLAYING) {
                setPlaying(true);
                setStatus("A trilha está tocando. Use os controles para pausar, ajustar ou silenciar.");
              } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
                setPlaying(false);
                setStatus("Trilha pausada. Os desafios continuam disponíveis.");
              }
            },
          },
        });
      } catch (error) {
        reject(error);
      }
    });
    return playerReadyPromise;
  }

  async function play(track = currentTrack) {
    const version = ++requestVersion;
    currentTrack = track || initialTrack;
    const requestedTrack = currentTrack;
    setStatus("Conectando à trilha… se o serviço não responder, você pode seguir sem música.");
    setPlaying(true);
    try {
      const readyPlayer = await ensurePlayer(requestedTrack);
      if (version !== requestVersion || currentTrack !== requestedTrack) return;
      if (readyPlayer.getVideoData?.().video_id !== requestedTrack) {
        readyPlayer.loadVideoById({ videoId: requestedTrack, suggestedQuality: "small" });
      } else {
        readyPlayer.playVideo();
      }
      readyPlayer.setVolume(volumeLevel);
      if (isMuted) readyPlayer.mute();
      const fallback = document.getElementById("audio-fallback");
      if (fallback) fallback.hidden = true;
      setPlaying(true);
    } catch {
      if (version !== requestVersion || currentTrack !== requestedTrack) return;
      setPlaying(false);
      setStatus("A trilha não está disponível agora. Os desafios continuam funcionando normalmente.");
      addFallback(requestedTrack);
    }
  }

  function pause() {
    requestVersion += 1;
    try { player?.pauseVideo(); } catch { /* o painel continua utilizável sem o player */ }
    setPlaying(false);
    setStatus("Trilha pausada. Os desafios continuam disponíveis.");
  }

  async function changeTrack(track, start = false) {
    if (!track) return;
    const version = ++requestVersion;
    const changed = currentTrack !== track;
    currentTrack = track;
    if (!start && !isPlaying) return;
    try {
      const readyPlayer = await ensurePlayer(track);
      if (version !== requestVersion || currentTrack !== track) return;
      if (changed || readyPlayer.getVideoData?.().video_id !== track) readyPlayer.loadVideoById({ videoId: track, suggestedQuality: "small" });
      else readyPlayer.playVideo();
      if (isMuted) readyPlayer.mute();
      setPlaying(true);
    } catch {
      if (version !== requestVersion || currentTrack !== track) return;
      setPlaying(false);
      setStatus("A trilha não está disponível agora. Os desafios continuam funcionando normalmente.");
      addFallback(track);
    }
  }

  toggle.addEventListener("click", () => isPlaying ? pause() : play());
  mute?.addEventListener("click", () => {
    isMuted = !isMuted;
    mute.setAttribute("aria-pressed", String(isMuted));
    mute.setAttribute("aria-label", isMuted ? "Ativar som da trilha" : "Silenciar trilha");
    mute.textContent = isMuted ? "🔇" : "🔊";
    try { isMuted ? player?.mute() : player?.unMute(); } catch { /* o áudio é opcional */ }
  });
  volume?.addEventListener("input", () => {
    volumeLevel = Number(volume.value);
    try { player?.setVolume(volumeLevel); } catch { /* o áudio é opcional */ }
  });

  global.YoshiAudio = { play, pause, stop: pause, changeTrack, get isPlaying() { return isPlaying; } };
})(window);
