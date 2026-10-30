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
assert.equal(data.worlds.jungle.checkpoints.length, 9, "Jungle has nine checkpoints");
assert.equal(data.worlds.mine.checkpoints.length, 7, "Mine has seven checkpoints");
assert.equal(data.worlds.camp.checkpoints.length, 6, "Camp has six checkpoints");
assert.equal(
  Object.values(data.worlds).reduce((sum, world) => sum + world.checkpoints.length, 0),
  22,
  "the three worlds contain 22 checkpoints"
);

assert.equal(data.worlds.jungle.checkpoints[0].target, "FJ", "the first checkpoint practices the F/J tactile landmarks");
assert.equal(data.worlds.mine.checkpoints[0].requireShift, true, "the introductory Shift checkpoint requires the Shift key");
assert.equal(data.worlds.jungle.checkpoints[2].target, "JKLÇ ÇLKJ", "the right home row includes Ç");
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
assert.equal(store.normalize({ version: 1, checkpoints: { jungle: 99, mine: -4, camp: "x" } }).checkpoints.jungle, 9, "stored checkpoint counts are bounded");
assert.equal(store.normalize({ version: 1, checkpoints: { jungle: 99, mine: -4, camp: "x" } }).checkpoints.mine, 0, "negative progress is rejected");
assert.equal(store.normalize({ version: 9 }).checkpoints.jungle, 0, "unknown storage versions reset safely");

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

console.log("OK: 22 ordered checkpoints, ABNT2 finger map, Delete/undo/redo targets, eight poem corrections and isolated progress schema");
