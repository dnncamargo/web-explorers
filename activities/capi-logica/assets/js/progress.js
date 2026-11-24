(function (global) {
  const KEY = "exploradores.capi-logica.progress.v1";
  const MEMORY = { value: null };
  function taskIds() { return global.CapiLogicGames.tasks.map((task) => task.id); }
  function fresh() { return { version: 1, completed: [], updatedAt: null }; }
  function normalize(value) {
    const valid = new Set(taskIds());
    const completed = Array.isArray(value?.completed) ? value.completed.filter((id) => valid.has(id)) : [];
    return { version: 1, completed: Array.from(new Set(completed)), updatedAt: typeof value?.updatedAt === "string" ? value.updatedAt : null };
  }
  function storage(name) {
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
        const value = storage(name).getItem(KEY);
        if (value) { const result = normalize(JSON.parse(value)); MEMORY.value = JSON.stringify(result); return { progress: result, mode: name }; }
      } catch { /* armazenamento pode ser bloqueado */ }
    }
    return { progress: fresh(), mode: "memory" };
  }
  function save(progress, preferred) {
    const snapshot = Object.assign(normalize(progress), { updatedAt: new Date().toISOString() });
    const names = [preferred, "localStorage", "sessionStorage", "memory"].filter((name, index, all) => name && all.indexOf(name) === index);
    for (const name of names) {
      try { storage(name).setItem(KEY, JSON.stringify(snapshot)); MEMORY.value = JSON.stringify(snapshot); return { mode: name, persisted: name !== "memory" }; }
      catch { /* tenta o próximo armazenamento */ }
    }
    MEMORY.value = JSON.stringify(snapshot);
    return { mode: "memory", persisted: false };
  }
  function complete(progress, id) {
    if (!taskIds().includes(id) || progress.completed.includes(id)) return false;
    progress.completed.push(id);
    return true;
  }
  function reset() {
    for (const name of ["localStorage", "sessionStorage", "memory"]) {
      try { storage(name).removeItem(KEY); } catch { /* indisponível */ }
    }
    return fresh();
  }
  function countWorld(progress, worldId) {
    return global.CapiLogicGames.tasks.filter((task) => task.world === worldId && progress.completed.includes(task.id)).length;
  }
  function countAll(progress) { return progress.completed.length; }
  global.CapiLogicProgress = { KEY, fresh, normalize, load, save, complete, reset, countWorld, countAll };
})(window);
