(function (global) {
  const KEY = "exploradores.donkey-kong.progress.v1";
  const TOTALS = { jungle: 9, mine: 7, camp: 6 };
  const memory = { raw: null };
  function fresh() {
    return { version: 1, checkpoints: { jungle: 0, mine: 0, camp: 0 }, boss: { draft: "", passed: false }, updatedAt: null };
  }
  function normalize(value) {
    const result = fresh();
    if (!value || value.version !== 1) return result;
    for (const id of Object.keys(TOTALS)) {
      const count = Number(value.checkpoints && value.checkpoints[id]);
      result.checkpoints[id] = Number.isInteger(count) ? Math.max(0, Math.min(TOTALS[id], count)) : 0;
    }
    if (value.boss && typeof value.boss === "object") {
      result.boss.draft = typeof value.boss.draft === "string" ? value.boss.draft.slice(0, 20000) : "";
      result.boss.passed = value.boss.passed === true;
    }
    result.updatedAt = typeof value.updatedAt === "string" ? value.updatedAt : null;
    return result;
  }
  function storage(name) {
    if (name === "memory") return {
      getItem: () => memory.raw,
      setItem: (_, value) => { memory.raw = value; },
      removeItem: () => { memory.raw = null; }
    };
    return global[name];
  }
  function load() {
    let firstAvailable = "memory";
    for (const name of ["localStorage", "sessionStorage"]) {
      try {
        const store = storage(name);
        const saved = store.getItem(KEY);
        if (firstAvailable === "memory") firstAvailable = name;
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.version === 1) return { progress: normalize(parsed), mode: name };
          } catch { /* try the next available store */ }
        }
      } catch { /* storage can be unavailable in managed browser profiles */ }
    }
    return { progress: fresh(), mode: firstAvailable };
  }
  function save(progress, preferred) {
    const value = JSON.stringify(Object.assign(normalize(progress), { updatedAt: new Date().toISOString() }));
    const order = [preferred, "localStorage", "sessionStorage", "memory"].filter((name, index, all) => name && all.indexOf(name) === index);
    for (const name of order) {
      try {
        storage(name).setItem(KEY, value);
        return { persisted: name !== "memory", mode: name };
      } catch { /* continue through available storage options */ }
    }
    memory.raw = value;
    return { persisted: false, mode: "memory" };
  }
  function reset() {
    for (const name of ["localStorage", "sessionStorage", "memory"]) {
      try { storage(name).removeItem(KEY); } catch { /* ignore unavailable storage */ }
    }
    return fresh();
  }
  function completeCheckpoint(progress, worldId, number) {
    if (!Object.prototype.hasOwnProperty.call(TOTALS, worldId)) return false;
    if (number !== progress.checkpoints[worldId] + 1 || number > TOTALS[worldId]) return false;
    progress.checkpoints[worldId] = number;
    return true;
  }
  global.DonkeyKongProgress = { KEY, TOTALS, fresh, normalize, load, save, reset, completeCheckpoint };
})(window);
