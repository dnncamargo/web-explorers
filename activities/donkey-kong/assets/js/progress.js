(function (global) {
  const KEY = "exploradores.donkey-kong.progress.v2";
  const LEGACY_KEY = "exploradores.donkey-kong.progress.v1";
  const TOTALS = { jungle: 8, mine: 7, camp: 6 };
  const memory = { raw: null };

  function fresh() {
    return {
      version: 2,
      checkpoints: { jungle: 0, mine: 0, camp: 0 },
      boss: { draft: "", passed: false },
      updatedAt: null
    };
  }

  function normalize(value) {
    const result = fresh();
    if (!value || ![1, 2].includes(value.version)) return result;

    for (const id of Object.keys(TOTALS)) {
      let count = Number(value.checkpoints && value.checkpoints[id]);
      if (!Number.isInteger(count)) count = 0;

      // In version 2 the old FJ-only checkpoint was removed. Shift the
      // stored Jungle count back by one so only completed ASDF work remains.
      if (id === "jungle" && value.version === 1) count = Math.max(0, count - 1);

      result.checkpoints[id] = Math.max(0, Math.min(TOTALS[id], count));
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

  function load() {
    let firstAvailable = "memory";
    for (const name of ["localStorage", "sessionStorage"]) {
      try {
        const store = storage(name);
        const currentSaved = store.getItem(KEY);
        const legacySaved = store.getItem(LEGACY_KEY);
        const saved = currentSaved || legacySaved;
        if (firstAvailable === "memory") firstAvailable = name;
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && [1, 2].includes(parsed.version)) {
              const progress = normalize(parsed);
              if (parsed.version === 1 || !currentSaved) save(progress, name);
              if (legacySaved) {
                try { store.removeItem(LEGACY_KEY); } catch { /* legacy data is already migrated */ }
              }
              return { progress, mode: name };
            }
          } catch { /* try the next available store */ }
        }
      } catch { /* storage can be unavailable in managed browser profiles */ }
    }
    return { progress: fresh(), mode: firstAvailable };
  }

  function reset() {
    for (const name of ["localStorage", "sessionStorage", "memory"]) {
      try {
        storage(name).removeItem(KEY);
        storage(name).removeItem(LEGACY_KEY);
      } catch { /* ignore unavailable storage */ }
    }
    return fresh();
  }

  function completeCheckpoint(progress, worldId, number) {
    if (!Object.prototype.hasOwnProperty.call(TOTALS, worldId)) return false;
    if (number !== progress.checkpoints[worldId] + 1 || number > TOTALS[worldId]) return false;
    progress.checkpoints[worldId] = number;
    return true;
  }

  global.DonkeyKongProgress = { KEY, LEGACY_KEY, TOTALS, fresh, normalize, load, save, reset, completeCheckpoint };
})(window);
