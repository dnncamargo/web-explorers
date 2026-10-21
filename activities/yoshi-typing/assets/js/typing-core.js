(function (global) {
  const MAIN_WORLDS = [1, 2, 3];
  const DEFAULT_CHECKPOINTS_PER_WORLD = 7;

  function checkpointCountForWorld(worldId) {
    const configured = global.YoshiWorldData?.worlds?.[worldId]?.checkpoints;
    return Array.isArray(configured) && configured.length > 0 ? configured.length : DEFAULT_CHECKPOINTS_PER_WORLD;
  }

  function createProgress() {
    return {
      version: 1,
      currentWorld: 1,
      completedWorlds: [],
      completedBonus: false,
      checkpoints: { 1: 0, 2: 0, 3: 0, 4: 0 },
    };
  }

  function normalizeProgress(value) {
    const fresh = createProgress();
    if (!value || value.version !== 1) return fresh;
    for (const id of [1, 2, 3, 4]) {
      const count = Number(value.checkpoints?.[id]);
      fresh.checkpoints[id] = Number.isInteger(count) ? Math.max(0, Math.min(checkpointCountForWorld(id), count)) : 0;
    }
    fresh.completedWorlds = MAIN_WORLDS.filter((id) => fresh.checkpoints[id] === checkpointCountForWorld(id));
    fresh.completedBonus = fresh.checkpoints[4] === checkpointCountForWorld(4);
    fresh.currentWorld = [1, 2, 3, 4].includes(Number(value.currentWorld)) ? Number(value.currentWorld) : 1;
    return fresh;
  }

  function readStoredProgress(getStorage, key) {
    let firstAvailable = "memory";
    for (const name of ["localStorage", "sessionStorage"]) {
      try {
        const store = getStorage(name);
        const saved = store.getItem(key);
        if (firstAvailable === "memory") firstAvailable = name;
        if (saved) {
          try { return { progress: normalizeProgress(JSON.parse(saved)), mode: name }; }
          catch { /* ignore malformed data and check the next store */ }
        }
      } catch { /* storage may be disabled by browser policy */ }
    }
    return { progress: createProgress(), mode: firstAvailable };
  }

  function writeStoredProgress(getStorage, key, progress, preferred = "localStorage") {
    const order = [preferred, "localStorage", "sessionStorage"].filter((name, index, all) => name !== "memory" && all.indexOf(name) === index);
    for (const name of order) {
      try {
        getStorage(name).setItem(key, JSON.stringify(progress));
        return { persisted: true, mode: name };
      } catch { /* continue to the next available store */ }
    }
    return { persisted: false, mode: "memory" };
  }

  function clearStoredProgress(getStorage, key) {
    for (const name of ["localStorage", "sessionStorage"]) {
      try { getStorage(name).removeItem(key); }
      catch { /* storage may be disabled by browser policy */ }
    }
  }

  function isMainComplete(progress) {
    return MAIN_WORLDS.every((id) => progress.completedWorlds.includes(id));
  }

  function canEnterWorld(progress, worldId) {
    if (worldId === 1) return true;
    if (worldId === 2) return progress.completedWorlds.includes(1);
    if (worldId === 3) return progress.completedWorlds.includes(2);
    if (worldId === 4) return isMainComplete(progress);
    return false;
  }

  function evaluateKey(expected, actual, isTrusted) {
    if (!isTrusted) return { kind: "ignored", matches: false };
    const normalize = (key) => key === " " ? " " : String(key).normalize("NFC").toLocaleLowerCase("pt-BR");
    const matches = normalize(expected) === normalize(actual);
    return { kind: matches ? "correct" : "incorrect", matches };
  }

  function advanceInput(target, index, actual, isTrusted) {
    const result = evaluateKey(target[index], actual, isTrusted);
    const nextIndex = result.matches ? index + 1 : index;
    return { ...result, index: nextIndex, complete: nextIndex === target.length };
  }

  function enterWorld(progress, worldId) {
    if (!canEnterWorld(progress, worldId)) return false;
    progress.currentWorld = worldId;
    return true;
  }

  function completeCheckpoint(progress, worldId, checkpointNumber) {
    if (!canEnterWorld(progress, worldId)) return { ok: false, reason: "locked" };
    const completed = progress.checkpoints[worldId] || 0;
    const total = checkpointCountForWorld(worldId);
    if (checkpointNumber !== completed + 1 || checkpointNumber > total) {
      return { ok: false, reason: "out-of-order" };
    }
    progress.checkpoints[worldId] = checkpointNumber;
    if (checkpointNumber === total) {
      if (worldId === 4) progress.completedBonus = true;
      else if (!progress.completedWorlds.includes(worldId)) progress.completedWorlds.push(worldId);
    }
    return { ok: true, worldComplete: checkpointNumber === total, mainComplete: isMainComplete(progress) };
  }

  global.YoshiTypingCore = {
    checkpointCountForWorld,
    createProgress,
    normalizeProgress,
    readStoredProgress,
    writeStoredProgress,
    clearStoredProgress,
    isMainComplete,
    canEnterWorld,
    evaluateKey,
    advanceInput,
    enterWorld,
    completeCheckpoint,
  };
})(window);
