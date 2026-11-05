(function (global) {
  const KEY = "exploradores.word-adventure.progress.v1";
  const MEMORY = { value: null };
  const WORLD_IDS = ["sound-island", "letter-village", "syllable-workshop", "word-market", "story-city"];

  function fresh() {
    return { version: 1, completed: {}, updatedAt: null };
  }
  function normalize(value) {
    const result = fresh();
    if (!value || value.version !== 1) return result;
    for (const id of WORLD_IDS) {
      const count = Number(value.completed?.[id]);
      const max = id === "story-city" ? 3 : 4;
      result.completed[id] = Number.isInteger(count) ? Math.max(0, Math.min(max, count)) : 0;
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
        if (raw) return { progress: normalize(JSON.parse(raw)), mode: name };
      } catch { /* managed browsers can disable storage */ }
    }
    return { progress: fresh(), mode: "memory" };
  }
  function save(progress, preferred) {
    const snapshot = Object.assign(normalize(progress), { updatedAt: new Date().toISOString() });
    for (const name of [preferred, "localStorage", "sessionStorage", "memory"].filter((v, i, a) => v && a.indexOf(v) === i)) {
      try {
        getStore(name).setItem(KEY, JSON.stringify(snapshot));
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
  function complete(progress, worldId, checkpoint, expected) {
    if (!WORLD_IDS.includes(worldId)) return false;
    const total = worldId === "story-city" ? 3 : 4;
    const current = progress.completed[worldId] || 0;
    if (checkpoint !== current + 1 || checkpoint > total) return false;
    progress.completed[worldId] = checkpoint;
    return true;
  }
  global.WordAdventureProgress = { KEY, WORLD_IDS, fresh, normalize, load, save, reset, complete };
})(window);
