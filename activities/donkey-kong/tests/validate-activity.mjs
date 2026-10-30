import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const window = {};
const context = vm.createContext({ window });
vm.runInContext(read("assets/js/checkpoints.js"), context, { filename: "checkpoints.js" });
vm.runInContext(read("assets/js/progress.js"), context, { filename: "progress.js" });

const data = window.DonkeyKongData;
const store = window.DonkeyKongProgress;
assert.ok(data, "Donkey Kong checkpoint data is exposed");
assert.ok(store, "Donkey Kong progress store is exposed");
assert.deepEqual(
  Object.keys(data.worlds).sort(),
  ["camp", "jungle", "mine"],
  "the three independent worlds are defined"
);
assert.equal(data.worlds.jungle.checkpoints.length, 8, "Jungle has eight checkpoints");
assert.equal(data.worlds.mine.checkpoints.length, 7, "Mine has seven checkpoints");
assert.equal(data.worlds.camp.checkpoints.length, 6, "Camp has six checkpoints");
assert.equal(
  Object.values(data.worlds).reduce((sum, world) => sum + world.checkpoints.length, 0),
  21,
  "the three worlds contain 21 checkpoints"
);

assert.equal(data.worlds.jungle.checkpoints[0].target, "ASDF FDSA", "the first checkpoint practices the complete left home row");
assert.equal(data.worlds.jungle.checkpoints[0].title, "Mão esquerda", "the old second checkpoint is now the first exercise");
assert.equal(data.worlds.mine.checkpoints[0].requireShift, true, "the introductory Shift checkpoint requires the Shift key");
assert.equal(data.worlds.jungle.checkpoints[1].target, "JKLÇ ÇLKJ", "the right home row includes Ç");
assert.ok(data.worlds.jungle.checkpoints.every(({ target }) => !/[áàâãéêíóôõú,;.!?]/i.test(target)), "Jungle targets do not demand accents or punctuation");
assert.ok(data.worlds.mine.checkpoints.some(({ target }) => target === "café irmã água"), "Mine practices real accented words");
assert.equal(data.worlds.camp.checkpoints[1].key, "Delete", "Camp teaches forward delete");
assert.ok(data.worlds.camp.checkpoints[1].instruction.includes("Lupa (Launcher) + Backspace"), "Delete instruction uses the Chromebook shortcut confirmed by the teacher");
assert.equal(data.worlds.camp.checkpoints[4].expectedUndo, "DK KONG", "undo target is defined");
assert.equal(data.worlds.camp.checkpoints[4].expectedRedo, "DK KONG!", "redo target is defined");

const letters = "abcdefghijklmnopqrstuvwxyzç";
for (const letter of letters) assert.ok(data.fingers[letter], "finger guidance exists for " + letter);
assert.equal(data.fingers[" "], "thumb", "the space bar is assigned to the thumbs");

assert.equal(data.poemSteps.length, 8, "the final mission has eight corrections");
assert.equal(data.poemSteps[5].selection.linePrefix, "Em cismar, sozinho, a noite,", "the grave-accent correction is anchored to the first occurrence");
assert.notEqual(data.poemDamaged, data.poemReference, "the initial poem is intentionally damaged");
assert.ok(data.poemReference.includes("Sem qu'inda aviste as palmeiras,"), "the canonical poem keeps the modernized ASCII apostrophe");
assert.ok(data.poemReference.includes("Nossas várzeas têm mais flores,"), "the canonical poem uses modern plural accentuation");

// Apply the eight specified corrections to confirm that the damaged text can
// reach the one canonical reference without changing any unrelated verse.
const lines = data.poemDamaged.split("\n");
lines[0] = "Minha terra tem palmeiras,";
lines[1] = "Onde canta o sabiá;";
lines[2] = "As aves, que aqui gorjeiam,";
lines[3] = "Não gorjeiam como lá.";
lines[5] = "Nosso céu tem mais estrelas,";
lines[6] = "Nossas várzeas têm mais flores,";
lines[10] = "Em cismar, sozinho, à noite,";
lines[22] = "Sem que eu volte para lá;";
assert.equal(lines.join("\n"), data.poemReference, "the eight corrections reconstruct the canonical poem exactly");

const fresh = store.fresh();
assert.deepEqual(
  JSON.parse(JSON.stringify(fresh.checkpoints)),
  { jungle: 0, mine: 0, camp: 0 },
  "progress begins with independent zeroed counters"
);
assert.equal(store.completeCheckpoint(fresh, "jungle", 2), false, "a checkpoint cannot be completed out of order");
assert.equal(store.completeCheckpoint(fresh, "jungle", 1), true, "the first checkpoint can be completed");
assert.equal(store.completeCheckpoint(fresh, "jungle", 1), false, "a completed checkpoint cannot be counted twice");
assert.equal(store.completeCheckpoint(fresh, "mine", 1), true, "worlds can be entered independently");
assert.equal(store.normalize({ version: 2, checkpoints: { jungle: 99, mine: -4, camp: "x" } }).checkpoints.jungle, 8, "stored checkpoint counts are bounded");
assert.equal(store.normalize({ version: 2, checkpoints: { jungle: 99, mine: -4, camp: "x" } }).checkpoints.mine, 0, "negative progress is rejected");
assert.equal(store.normalize({ version: 9 }).checkpoints.jungle, 0, "unknown storage versions reset safely");
const migratedFjOnly = store.normalize({ version: 1, checkpoints: { jungle: 1, mine: 2, camp: 3 }, boss: { draft: "rascunho", passed: false } });
assert.equal(migratedFjOnly.checkpoints.jungle, 0, "old FJ-only progress is not mistaken for the new left-hand checkpoint");
assert.equal(migratedFjOnly.checkpoints.mine, 2, "migration preserves other world progress");
assert.equal(migratedFjOnly.boss.draft, "rascunho", "migration preserves the final poem draft");
const migratedLeftHand = store.normalize({ version: 1, checkpoints: { jungle: 2, mine: 0, camp: 0 } });
assert.equal(migratedLeftHand.checkpoints.jungle, 1, "migration retains completion of the old left-hand exercise");

class TestStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}
const legacyLocalStorage = new TestStorage();
legacyLocalStorage.setItem(store.LEGACY_KEY, JSON.stringify({
  version: 1,
  checkpoints: { jungle: 1, mine: 3, camp: 4 },
  boss: { draft: "rascunho antigo", passed: false }
}));
const migrationWindow = { localStorage: legacyLocalStorage, sessionStorage: new TestStorage() };
const migrationContext = vm.createContext({ window: migrationWindow });
vm.runInContext(read("assets/js/progress.js"), migrationContext, { filename: "progress-migration.js" });
const migrationStore = migrationWindow.DonkeyKongProgress;
const migrated = migrationStore.load();
assert.equal(migrated.progress.version, 2, "stored progress is upgraded to schema version 2");
assert.equal(migrated.progress.checkpoints.jungle, 0, "old FJ-only completion is removed during migration");
assert.equal(migrated.progress.checkpoints.mine, 3, "Mine progress survives migration");
assert.equal(migrated.progress.checkpoints.camp, 4, "Camp progress survives migration");
assert.equal(migrated.progress.boss.draft, "rascunho antigo", "the poem draft survives migration");
assert.equal(legacyLocalStorage.getItem(migrationStore.LEGACY_KEY), null, "legacy storage is removed after migration");
assert.equal(JSON.parse(legacyLocalStorage.getItem(migrationStore.KEY)).version, 2, "the migrated progress is written under the v2 key");

const mapHtml = read("index.html");
const activitySource = read("assets/js/activity.js");
const activityCss = read("assets/css/donkey-kong.css");
assert.ok(mapHtml.includes('id="start-screen"') && mapHtml.includes('id="start-button-label"'), "map has a Kong barrel entrance overlay");
assert.ok(activitySource.includes("playFromGesture()"), "barrel interaction calls the radio gesture method");
assert.ok(activitySource.includes('continueButton.focus({ preventScroll: true })'), "typing completion moves focus to the continue button");
assert.ok(activityCss.includes(".hand.left .finger-shape.thumb { transform:rotate(28deg); }"), "left thumb illustration angles inward");
assert.ok(activityCss.includes(".keycap.is-next"), "keyboard next-key treatment is defined");

const calls = [];
const memoryOnlyWindow = {};
const memoryContext = vm.createContext({ window: memoryOnlyWindow });
vm.runInContext(read("assets/js/progress.js"), memoryContext, { filename: "progress-memory.js" });
const memoryStore = memoryOnlyWindow.DonkeyKongProgress;
const memoryProgress = memoryStore.fresh();
memoryStore.completeCheckpoint(memoryProgress, "camp", 1);
const memorySave = memoryStore.save(memoryProgress, "memory");
assert.equal(memorySave.mode, "memory", "memory fallback is reported");
assert.equal(memorySave.persisted, false, "memory fallback does not claim durable storage");
assert.equal(memoryStore.load().progress.checkpoints.camp, 0, "new memory-only store starts clean");

console.log("OK: 21 ordered checkpoints, ABNT2 finger map, progress migration, Delete/undo/redo targets, and eight poem corrections");
