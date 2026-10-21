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
  1: ["ASDF", "FDSA", "ASAS", "DFDF", "A FADA ASSA", "FADA ASSA FADA", "A FADA ASSA FADA"],
  2: ["JKLÇ", "ÇLKJ", "JKJK", "FADA FALA", "A FADA FALA", "FALA DA SALA", "A FADA FALA DA SALA"],
  3: ["ASDF JKLÇ", "QWERT YUIOP", "ZXCV BNM", "CASA SAPO VIDA", "A FOCA PULA", "A FOCA LEVA O SAPO", "O SAPO VAI PARA CASA"],
  4: ["A FOCA PULA", "O SAPO VAI PARA CASA", "A FOCA LEVA O SAPO", "YOSHI PULA NA CASA", "O YOSHI PULA COM A FOCA", "A FOCA LEVA O SAPO PARA CASA", "YOSHI E A FOCA PULAM PARA CASA"],
};
const upperRow = new Set([..."QWERTYUIOP".toLocaleLowerCase("pt-BR")]);
const homeRow = new Set([..."ASDFGHJKLÇ".toLocaleLowerCase("pt-BR")]);
const lowerRow = new Set([..."ZXCVBNM".toLocaleLowerCase("pt-BR")]);

assert.equal(Object.keys(worlds).length, 4, "four worlds are defined");
for (const [idText, targets] of Object.entries(expectedTargets)) {
  const id = Number(idText);
  assert.deepEqual(JSON.parse(JSON.stringify(worlds[id].checkpoints.map(({ target }) => target))), targets, `world ${id} has the requested seven sequences`);
  assert.equal(worlds[id].checkpoints.length, 7, `world ${id} has exactly seven checkpoints`);
  assert.ok(targets[5].length > targets[4].length, `world ${id} checkpoint 6 is more complex than checkpoint 5`);
  assert.ok(targets[6].length > targets[5].length, `world ${id} checkpoint 7 is more complex than checkpoint 6`);
  const permitted = new Set(worlds[id].taughtKeys);
  for (const target of targets) {
    for (const char of target.toLocaleLowerCase("pt-BR")) {
      assert.ok(permitted.has(char), `world ${id} teaches ${JSON.stringify(char)} before requiring it`);
      assert.ok(char === " " || /^[a-zç]$/.test(char), `world ${id} does not require accents or punctuation`);
    }
  }
}
assert.equal(worlds[1].taughtKeys.join(""), "asdf ", "World 1 introduces only A S D F and space");
assert.equal(worlds[2].taughtKeys.join(""), "asdf jklç", "World 2 keeps the left hand taught and adds J K L Ç");
for (const id of [1, 2]) {
  for (const checkpoint of worlds[id].checkpoints) {
    for (const char of checkpoint.target.toLocaleLowerCase("pt-BR")) {
      assert.ok(char === " " || homeRow.has(char), `World ${id} stays on the home row`);
      assert.ok(!upperRow.has(char) && !lowerRow.has(char), `World ${id} does not require upper/lower row keys`);
    }
  }
}
assert.ok([...worlds[1].checkpoints[4].target.toLocaleLowerCase("pt-BR")].every((char) => char === " " || new Set([..."asdf"]).has(char)), "World 1's final phrase only uses A S D F and space");
for (const { target } of worlds[4].checkpoints) {
  const chars = new Set([...target.toLocaleLowerCase("pt-BR")]);
  assert.ok([...chars].some((char) => upperRow.has(char)), `bonus phrase ${target} uses upper-row keys`);
  assert.ok([...chars].some((char) => homeRow.has(char)), `bonus phrase ${target} uses home-row keys`);
  assert.ok([...chars].some((char) => lowerRow.has(char)), `bonus phrase ${target} uses lower-row keys`);
}
assert.match(worlds[1].intro, /mão esquerda/i, "World 1 introduces the left hand only");
assert.doesNotMatch(worlds[1].intro, /duas mãos|ambas as mãos/i, "World 1 does not imply both hands are taught");
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
  for (let checkpoint = 1; checkpoint <= 7; checkpoint += 1) {
    assert.equal(core.completeCheckpoint(progress, id, checkpoint).ok, true);
  }
  if (id < 3) assert.equal(core.canEnterWorld(progress, id + 1), true);
}
assert.equal(progress.checkpoints[1], 7);
assert.equal(progress.checkpoints[2], 7);
assert.equal(progress.checkpoints[3], 7);
assert.equal(core.isMainComplete(progress), true, "the three required worlds complete the main reward after 7 checkpoints each");
assert.equal(core.canEnterWorld(progress, 4), true, "the optional world unlocks after the main worlds");
for (let checkpoint = 1; checkpoint <= 7; checkpoint += 1) assert.equal(core.completeCheckpoint(progress, 4, checkpoint).ok, true);
assert.equal(core.isMainComplete(progress), true, "the bonus does not replace or change main completion");
assert.equal(progress.completedBonus, true);
assert.deepEqual(JSON.parse(JSON.stringify(core.normalizeProgress({ version: 1, currentWorld: 99, checkpoints: { 1: 100, 2: -1 } }).checkpoints)), { 1: 7, 2: 0, 3: 0, 4: 0 }, "saved checkpoints are bounded to seven");
const oldFiveCheckpointProgress = core.normalizeProgress({ version: 1, currentWorld: 3, completedWorlds: [1, 2, 3], completedBonus: true, checkpoints: { 1: 5, 2: 5, 3: 5, 4: 5 } });
assert.deepEqual(JSON.parse(JSON.stringify(oldFiveCheckpointProgress.checkpoints)), { 1: 5, 2: 5, 3: 5, 4: 5 }, "old five-checkpoint progress is preserved");
assert.deepEqual(JSON.parse(JSON.stringify(oldFiveCheckpointProgress.completedWorlds)), [], "old 5/5 flags do not bypass the two new checkpoints");
assert.equal(oldFiveCheckpointProgress.completedBonus, false, "old bonus completion is not marked complete before 7/7");
assert.equal(core.canEnterWorld(oldFiveCheckpointProgress, 2), false, "the next world stays locked until extra checkpoints are completed");
const restoredProgress = core.normalizeProgress(JSON.parse(JSON.stringify(progress)));
assert.equal(core.isMainComplete(restoredProgress), true, "saved progress restores the three required worlds");
assert.equal(restoredProgress.completedBonus, true, "saved bonus completion also restores");

const memoryStore = () => {
  const items = new Map();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, String(value)),
    removeItem: (key) => items.delete(key),
  };
};
const localStore = memoryStore();
const sessionStore = memoryStore();
const allStores = { localStorage: localStore, sessionStorage: sessionStore };
const loadedFresh = core.readStoredProgress((name) => allStores[name], "progress-test");
assert.equal(loadedFresh.mode, "localStorage", "local storage is preferred when available");
const sessionOnly = core.readStoredProgress((name) => {
  if (name === "localStorage") throw new Error("blocked");
  return sessionStore;
}, "session-test");
assert.equal(sessionOnly.mode, "sessionStorage", "session storage is used when local storage is blocked");
sessionOnly.progress.checkpoints[1] = 2;
assert.deepEqual(JSON.parse(JSON.stringify(core.writeStoredProgress((name) => {
  if (name === "localStorage") throw new Error("blocked");
  return sessionStore;
}, "session-test", sessionOnly.progress, sessionOnly.mode))), { persisted: true, mode: "sessionStorage" });
const afterReload = core.readStoredProgress((name) => {
  if (name === "localStorage") throw new Error("blocked");
  return sessionStore;
}, "session-test");
assert.equal(afterReload.progress.checkpoints[1], 2, "session progress resumes after a page reload");
const noStorage = core.readStoredProgress(() => { throw new Error("blocked"); }, "memory-test");
assert.equal(noStorage.mode, "memory", "the app detects when every storage is unavailable");
assert.deepEqual(JSON.parse(JSON.stringify(core.writeStoredProgress(() => { throw new Error("blocked"); }, "memory-test", noStorage.progress))), { persisted: false, mode: "memory" }, "memory-only mode never promises persistence");
core.clearStoredProgress((name) => allStores[name], "session-test");
assert.equal(sessionStore.getItem("session-test"), null, "new game clears session progress after confirmation");

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
const yoshiPngUrl = "https://art.ngfiles.com/images/291000/291714_jamalmason_yoshi.png?f1393937531";
const flowerPngPath = "assets/images/flower.png";
const homeHtml = read("index.html");
assert.ok(homeHtml.includes(`src="${flowerPngPath}"`), "the home page uses the bundled flower PNG");
assert.equal(fs.existsSync(path.join(appRoot, flowerPngPath)), true, "the flower PNG is bundled locally, without an external image dependency");
assert.match(homeHtml, /class="hero-characters"[\s\S]*?<div class="yoshi-with-flower">[\s\S]*?class="yoshi-art"[\s\S]*?class="flower-art"[\s\S]*?<\/div>/, "the flower is grouped with Yoshi inside its own positioning container");
assert.doesNotMatch(homeHtml, /bonus-egg\.svg/, "the home page no longer uses the egg SVG");
assert.equal(fs.existsSync(path.join(appRoot, "assets/images/bonus-egg.svg")), false, "the unwanted egg SVG asset is removed");
for (const page of pages) {
  assert.ok(read(page).includes(yoshiPngUrl), `${page} uses the selected PNG artwork`);
  assert.ok(!read(page).includes("yoshi-companion.svg"), `${page} no longer uses the old SVG`);
}
assert.ok(read("assets/js/activity.js").includes(yoshiPngUrl), "dynamic completion scenes use the same PNG");
assert.ok(!read("assets/js/activity.js").includes("yoshi-companion.svg"), "dynamic scenes do not reference the old SVG");

const fingerClasses = new Set(["left-pinky", "left-ring", "left-middle", "left-index", "right-index", "right-middle", "right-ring", "right-pinky", "thumb"]);
for (const world of Object.values(worlds)) {
  for (const key of world.taughtKeys) {
    assert.ok(fingerClasses.has(browserWindow.YoshiWorldData.fingers[key]), `world ${world.id}: ${JSON.stringify(key)} has a finger color`);
  }
}

const activity = read("assets/js/activity.js");
assert.match(activity, /input\.addEventListener\("paste",\s*\(event\)\s*=>\s*\{\s*event\.preventDefault\(\)/, "paste is prevented in the exercise input");
assert.match(activity, /input\.addEventListener\("drop"/, "dropped text cannot enter the exercise");
assert.match(activity, /event\.ctrlKey \|\| event\.metaKey \|\| event\.altKey/, "global keyboard shortcuts are left alone");
assert.match(activity, /event\.isTrusted/, "only trusted physical key events can advance the exercise");
assert.match(activity, /showModal\(\)|global\.confirm/, "starting over asks for confirmation");
assert.match(activity, /checkpoint-progress"\)\.textContent = `CHECKPOINT \$\{number\}\/\$\{totalCheckpoints\}`/, "the permanent progress display changes as soon as a checkpoint opens");
assert.match(activity, /target-char \$\{type\}[\s\S]*?\$\{char === " " \? "␣" : char\}/, "every future target character stays visible and spaces have a marker");
assert.match(activity, /id="typed-display"[\s\S]*?typedDisplay\.textContent = visibleTyped \|\| "—"/, "accepted physical input is shown in a separate typed-text display");
assert.match(activity, /typedText = "";[\s\S]*?updateDisplay\(\);[\s\S]*?Exercício reiniciado/, "restarting clears only the current exercise display");
assert.match(activity, /story-audio[\s\S]*?YoshiAudio\?\.play\(world\.storyTrack\)/, "Kamek audio starts only from its explicit button");
assert.match(activity, /story-continue[\s\S]*?YoshiAudio\?\.pause\(\)[\s\S]*?changeTrack\(world\.track, false\)[\s\S]*?renderGuide\(world, host\)/, "leaving the Kamek scene stops its audio before showing the cave guide");
assert.ok(activity.indexOf('querySelector("#story-continue")') < activity.indexOf("YoshiAudio?.pause()") && activity.indexOf("YoshiAudio?.pause()") < activity.indexOf("changeTrack(world.track, false)") && activity.indexOf("changeTrack(world.track, false)") < activity.indexOf("YoshiAudio?.changeTrack(world.track, true)"), "the cave track is selected only after the Kamek message is stopped and the learner starts the world");
assert.match(activity, /Sem armazenamento: trocar de mundo ou recarregar reinicia/, "memory-only fallback explains that progress will not continue across pages");
const audio = read("assets/js/audio.js");
assert.match(audio, /catch \{[\s\S]*?desafios continuam funcionando normalmente/, "audio failure leaves the activity playable");
assert.match(audio, /requestVersion[\s\S]*?version !== requestVersion/, "late YouTube promises cannot restart a track after pause or track change");
assert.match(audio, /playerReadyPromise/, "concurrent requests share the player readiness promise");
const css = read("assets/css/yoshi.css");
assert.match(css, /@media \(max-width: 620px\)[\s\S]*?world-grid \{ grid-template-columns: minmax\(0,1fr\)/, "the world map becomes one column on narrow screens");
assert.match(css, /target-row \{[^}]*flex-wrap: wrap/, "target sequences wrap instead of being hidden on narrow screens");
assert.doesNotMatch(css, /\.egg-art\b/, "the unwanted SVG egg styling is removed");
assert.match(css, /\.yoshi-with-flower\s*\{[^}]*position:\s*relative;[^}]*width:/, "the positioning container hugs the Yoshi image");
assert.match(css, /\.yoshi-with-flower\s*>\s*\.yoshi-art\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*100%;[^}]*height:\s*auto;/, "Yoshi fills the positioning container without intrinsic width overflow");
assert.match(css, /\.flower-art\s*\{[^}]*position:\s*absolute;[^}]*top:\s*-8px;[^}]*right:\s*14px;[^}]*width:\s*24px;[^}]*height:\s*24px;[^}]*min-width:\s*24px;[^}]*max-width:\s*24px;/, "desktop flower size is explicit and independent of the PNG's intrinsic size");
assert.match(css, /@media \(max-width: 850px\)[\s\S]*?\.yoshi-with-flower > \.flower-art \{ width: 22px; height: 22px; min-width: 22px; min-height: 22px; max-width: 22px; max-height: 22px; \}/, "tablet flower size is explicitly 22px");
assert.match(css, /@media \(max-width: 620px\)[\s\S]*?\.yoshi-with-flower > \.flower-art \{ width: 20px; height: 20px; min-width: 20px; min-height: 20px; max-width: 20px; max-height: 20px; \}/, "mobile flower size is explicitly 20px");
assert.match(homeHtml, /assets\/css\/yoshi\.css\?v=hero-flower-2026-10-21-2/, "the CSS URL is versioned to bypass stale cached flower positioning");
assert.doesNotMatch(css, /\.hero-art \.hero-characters\s*>\s*\.flower-art/, "no competing rules size or position the flower against the full hero");
assert.match(css, /\.hero-characters \{[^}]*flex-wrap: nowrap;[^}]*min-width: 0;/, "Yoshi remains centered in its responsive hero column");
assert.match(css, /\.keycap\[data-key\] \{[^}]*background: var\(--finger-color\)/, "each taught key receives its finger background");
assert.match(css, /\.keycap\.is-next \{[^}]*background: var\(--finger-color\)/, "the active key keeps the finger background");
assert.match(css, /\.keycap\.is-used \{[^}]*border-bottom-color:/, "the used-key state preserves the background");
assert.match(activity, /cap\.classList\.toggle\("is-used", typedKeys\.has\(key\)\)/, "used state follows correctly typed input");
assert.doesNotMatch(css, /(?:html|body)\s*\{[^}]*overflow-x:\s*hidden/, "horizontal overflow is not masked at the page level");

console.log("OK: 4 worlds and 28 exact checkpoint sequences (7 per world)");
console.log("OK: ABNT2 case, Ç, space, wrong key, synthetic events, and ordered progression");
console.log("OK: main completion is independent of the optional bonus");
console.log("OK: session-storage fallback, reload continuity, and explicit memory-only behavior");
console.log("OK: live target, typed text, checkpoint header, Kamek audio order, and restart behavior");
console.log("OK: routes, resources, unique IDs, JavaScript syntax, responsive layout rules, paste blocking, and audio fallback");
