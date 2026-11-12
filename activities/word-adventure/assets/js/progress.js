(function (global) {
  const KEY = "exploradores.expedicao-natureza.progress.v2";
  const LEGACY_KEY = "exploradores.word-adventure.progress.v1";
  const MEMORY = { value: null };
  const LIMITS = {
    "sound-island": 4,
    "sound-lagoon": 5,
    "letter-trail": 5,
    "syllable-workshop": 6,
    "research-post": 5,
    "field-journal": 3
  };
  const WORLD_IDS = Object.keys(LIMITS);

  function fresh() {
    return { version: 2, completed: {}, rounds: {}, updatedAt: null };
  }
  function normalize(value) {
    const result = fresh();
    if (!value || value.version !== 2) return result;
    for (const id of WORLD_IDS) {
      const count = Number(value.completed?.[id]);
      result.completed[id] = Number.isInteger(count) ? Math.max(0, Math.min(LIMITS[id], count)) : 0;
      const saved = value.rounds?.[id];
      if (saved && Number.isInteger(saved.checkpoint) && Number.isInteger(saved.roundIndex)) {
        const checkpoint = result.completed[id] + 1;
        if (saved.checkpoint === checkpoint && saved.roundIndex >= 0 && saved.roundIndex < 10) {
          result.rounds[id] = { checkpoint, roundIndex: saved.roundIndex };
        }
      }
    }
    result.updatedAt = typeof value.updatedAt === "string" ? value.updatedAt : null;
    return result;
  }
  function getStore(name) {
    if (name === "memory") return {
      getItem: () => MEMORY.value,
      setItem: (_, value) => { MEMORY.value = value; },
      removeItem: () => { MEMORY.value = null; }
    };
    return global[name];
  }
  function load() {
    for (const name of ["localStorage", "sessionStorage"]) {
      try {
        const raw = getStore(name).getItem(KEY);
        if (raw) {
          const progress = normalize(JSON.parse(raw));
          MEMORY.value = JSON.stringify(progress);
          return { progress, mode: name, legacyFound: false };
        }
      } catch { /* managed browsers can disable storage */ }
    }
    let legacyFound = false;
    try { legacyFound = Boolean(global.localStorage?.getItem(LEGACY_KEY)); } catch { /* old storage is optional */ }
    return { progress: fresh(), mode: "memory", legacyFound };
  }
  function save(progress, preferred) {
    const snapshot = Object.assign(normalize(progress), { updatedAt: new Date().toISOString() });
    const order = preferred === "memory" ? ["localStorage", "sessionStorage", "memory"] : [preferred, "localStorage", "sessionStorage", "memory"];
    for (const name of order.filter((v, i, a) => v && a.indexOf(v) === i)) {
      try {
        getStore(name).setItem(KEY, JSON.stringify(snapshot));
        MEMORY.value = JSON.stringify(snapshot);
        return { mode: name, persisted: name !== "memory" };
      } catch { /* fall through */ }
    }
    MEMORY.value = JSON.stringify(snapshot);
    return { mode: "memory", persisted: false };
  }
  function reset() {
    for (const name of ["localStorage", "sessionStorage", "memory"]) {
      try { getStore(name).removeItem(KEY); } catch { /* unavailable */ }
    }
    return fresh();
  }
  function completedCount(progress, worldId) {
    return WORLD_IDS.includes(worldId) ? (progress.completed[worldId] || 0) : 0;
  }
  function currentRound(progress, worldId, checkpoint) {
    const saved = progress.rounds[worldId];
    return saved && saved.checkpoint === checkpoint ? saved.roundIndex : 0;
  }
  function resetCheckpoint(progress, worldId, checkpoint) {
    if (!WORLD_IDS.includes(worldId) || !Number.isInteger(checkpoint)) return false;
    const current = completedCount(progress, worldId);

    // The active checkpoint can be restarted at any point in its microactivities.
    if (checkpoint === current + 1 && checkpoint <= LIMITS[worldId]) {
      delete progress.rounds[worldId];
      return true;
    }

    // The last microactivity marks the checkpoint complete immediately. Keep the
    // current screen restartable by reopening only that most recently completed checkpoint.
    if (checkpoint === current && current > 0) {
      progress.completed[worldId] = current - 1;
      delete progress.rounds[worldId];
      return true;
    }

    return false;
  }
  function completeRound(progress, worldId, checkpoint, roundIndex, roundsTotal) {
    if (!WORLD_IDS.includes(worldId) || !Number.isInteger(roundIndex) || !Number.isInteger(roundsTotal) || roundsTotal < 1) return false;
    const current = completedCount(progress, worldId);
    if (checkpoint !== current + 1 || checkpoint > LIMITS[worldId]) return false;
    if (currentRound(progress, worldId, checkpoint) !== roundIndex) return false;
    if (roundIndex < 0 || roundIndex >= roundsTotal) return false;
    if (roundIndex === roundsTotal - 1) {
      progress.completed[worldId] = checkpoint;
      delete progress.rounds[worldId];
    } else {
      progress.rounds[worldId] = { checkpoint, roundIndex: roundIndex + 1 };
    }
    return true;
  }
  global.WordAdventureProgress = { KEY, LEGACY_KEY, WORLD_IDS, LIMITS, fresh, normalize, load, save, reset, completedCount, currentRound, resetCheckpoint, completeRound };
})(window);
