import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "..");
const read = (relative) => fs.readFileSync(path.join(appRoot, relative), "utf8");
const browserWindow = {};
const context = vm.createContext({ window: browserWindow });
vm.runInContext(read("assets/js/world-data.js"), context, { filename: "world-data.js" });
vm.runInContext(read("assets/js/typing-core.js"), context, { filename: "typing-core.js" });
const { worlds } = browserWindow.YoshiWorldData;
const core = browserWindow.YoshiTypingCore;

const expectedTargets = {
  1: ["ASDF", "FDSA", "ASAS", "DFDF", "ASDF FDSA"],
  2: ["JKLÇ", "ÇLKJ", "JKJK", "LÇLÇ", "JKLÇ ÇLKJ"],
  3: ["ASDF JKLÇ", "QWERT YUIOP", "ZXCV BNM", "CASA SAPO VIDA", "A FOCA PULA"],
  4: ["ASASDASDFFDFDSFDSA", "JKJKLJKLÇÇLÇLKÇLKJ", "QWERT ZXCV", "PATO LIVRO CAVALO", "A FOCA PULA NA SALA"],
};

assert.equal(Object.keys(worlds).length, 4, "four worlds are defined");
for (const [idText, targets] of Object.entries(expectedTargets)) {
  const id = Number(idText);
  assert.deepEqual(JSON.parse(JSON.stringify(worlds[id].checkpoints.map(({ target }) => target))), targets, `world ${id} has the requested five sequences`);
  assert.equal(worlds[id].checkpoints.length, 5, `world ${id} has exactly five checkpoints`);
  const permitted = new Set(worlds[id].taughtKeys);
  for (const target of targets) {
    for (const char of target.toLocaleLowerCase("pt-BR")) {
      assert.ok(permitted.has(char), `world ${id} teaches ${JSON.stringify(char)} before requiring it`);
      assert.ok(char === " " || /^[a-zç]$/.test(char), `world ${id} does not require accents or punctuation`);
    }
  }
}
assert.equal(worlds[1].taughtKeys.join(""), "asdf ", "World 1 introduces only A S D F and space");
assert.equal(worlds[2].taughtKeys.join(""), "jklç ", "World 2 introduces only J K L Ç and space");
assert.deepEqual([worlds[1].track, worlds[3].track, worlds[4].track], ["tGukyQ10nlA", "IJy7jK-TM40", "n6-JFDTC_nI"], "each world uses its requested music reference");
assert.equal(worlds[3].storyTrack, "BEP3rdTy0-o", "Kamek's short scene has its requested music reference");
assert.equal(worlds[2].track, worlds[1].track, "World 2 may continue the Flower Garden track");

assert.equal(core.evaluateKey("a", "A", true).matches, true, "case does not matter");
assert.equal(core.evaluateKey("ç", "Ç", true).matches, true, "ABNT2 Ç is matched");
assert.equal(core.evaluateKey(" ", " ", true).matches, true, "space is matched");
assert.equal(core.evaluateKey("a", "s", true).matches, false, "wrong keys do not match");
assert.equal(core.evaluateKey("a", "a", false).kind, "ignored", "synthetic key events are ignored");
assert.deepEqual(JSON.parse(JSON.stringify(core.advanceInput("as", 0, "s", true))), { kind: "incorrect", matches: false, index: 0, complete: false }, "an incorrect key leaves the typed position unchanged");
assert.deepEqual(JSON.parse(JSON.stringify(core.advanceInput("as", 0, "A", true))), { kind: "correct", matches: true, index: 1, complete: false }, "a correct physical key advances one position");
assert.equal(core.advanceInput("a", 0, "a", false).index, 0, "a synthetic event cannot advance a sequence");

const progress = core.createProgress();
assert.equal(core.canEnterWorld(progress, 1), true);
assert.equal(core.canEnterWorld(progress, 2), false, "World 2 is locked until World 1 is complete");
assert.equal(core.completeCheckpoint(progress, 1, 2).reason, "out-of-order", "a checkpoint cannot be skipped");
for (let id = 1; id <= 3; id += 1) {
  for (let checkpoint = 1; checkpoint <= 5; checkpoint += 1) {
    assert.equal(core.completeCheckpoint(progress, id, checkpoint).ok, true);
  }
  if (id < 3) assert.equal(core.canEnterWorld(progress, id + 1), true);
}
assert.equal(core.isMainComplete(progress), true, "the three required worlds complete the main reward");
assert.equal(core.canEnterWorld(progress, 4), true, "the optional world unlocks after the main worlds");
for (let checkpoint = 1; checkpoint <= 5; checkpoint += 1) assert.equal(core.completeCheckpoint(progress, 4, checkpoint).ok, true);
assert.equal(core.isMainComplete(progress), true, "the bonus does not replace or change main completion");
assert.equal(progress.completedBonus, true);
assert.deepEqual(JSON.parse(JSON.stringify(core.normalizeProgress({ version: 1, currentWorld: 99, checkpoints: { 1: 100, 2: -1 } }).checkpoints)), { 1: 5, 2: 0, 3: 0, 4: 0 }, "saved checkpoints are bounded");
const restoredProgress = core.normalizeProgress(JSON.parse(JSON.stringify(progress)));
assert.equal(core.isMainComplete(restoredProgress), true, "saved progress restores the three required worlds");
assert.equal(restoredProgress.completedBonus, true, "saved bonus completion also restores");

const pages = ["index.html", ...Object.values(worlds).map(({ file }) => file)];
for (const page of pages) {
  const html = read(page);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, new Set(ids).size, `${page} has no duplicate HTML IDs`);
  for (const [, reference] of html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)) {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#|data:)/i.test(reference)) continue;
    const target = path.resolve(path.dirname(path.join(appRoot, page)), reference.split(/[?#]/)[0]);
    assert.ok(fs.existsSync(target), `${page} reference resolves: ${reference}`);
  }
}

for (const file of ["assets/js/world-data.js", "assets/js/typing-core.js", "assets/js/audio.js", "assets/js/activity.js"]) {
  assert.doesNotThrow(() => new vm.Script(read(file), { filename: file }), `${file} parses`);
}
const activity = read("assets/js/activity.js");
assert.match(activity, /input\.addEventListener\("paste",\s*\(event\)\s*=>\s*\{\s*event\.preventDefault\(\)/, "paste is prevented in the exercise input");
assert.match(activity, /input\.addEventListener\("drop"/, "dropped text cannot enter the exercise");
assert.match(activity, /event\.ctrlKey \|\| event\.metaKey \|\| event\.altKey/, "global keyboard shortcuts are left alone");
assert.match(activity, /event\.isTrusted/, "only trusted physical key events can advance the exercise");
assert.match(activity, /showModal\(\)|global\.confirm/, "starting over asks for confirmation");
const audio = read("assets/js/audio.js");
assert.match(audio, /catch \{[\s\S]*?desafios continuam funcionando normalmente/, "audio failure leaves the activity playable");

console.log("OK: 4 worlds and 20 exact checkpoint sequences");
console.log("OK: ABNT2 case, Ç, space, wrong key, synthetic events, and ordered progression");
console.log("OK: main completion is independent of the optional bonus");
console.log("OK: routes, resources, unique IDs, JavaScript syntax, paste blocking, and audio fallback");
