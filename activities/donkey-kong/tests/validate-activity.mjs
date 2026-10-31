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
assert.equal(data.worlds.camp.checkpoints.length, 7, "Camp has seven checkpoints");
assert.equal(
  Object.values(data.worlds).reduce((sum, world) => sum + world.checkpoints.length, 0),
  22,
  "the three worlds contain 22 checkpoints"
);

assert.equal(data.worlds.jungle.checkpoints[0].target, "ASDF FDSA", "the first checkpoint practices the complete left home row");
assert.equal(data.worlds.jungle.checkpoints[0].title, "Mão esquerda", "the old second checkpoint is now the first exercise");
assert.equal(data.worlds.mine.checkpoints.length, 7, "Mine keeps seven planned checkpoints");
assert.ok(data.worlds.mine.checkpoints.every(({ kind }) => kind === "typing-sequence"), "all Mine checkpoints use automatic typing sequences");
assert.deepEqual(
  data.worlds.mine.checkpoints.map(({ title }) => title),
  ["Maiúsculas e minúsculas", "Shift, números e símbolos", "Acentos sem Shift · minúsculas", "Acentos com Shift · minúsculas", "Acentos sem Shift · maiúsculas", "Acentos com Shift · maiúsculas", "Misturando acentos e símbolos"],
  "Mine follows the seven-step Shift and accent progression"
);
assert.ok(data.worlds.mine.checkpoints[0].stages.some(({ target }) => target === "banana") && data.worlds.mine.checkpoints[0].stages.some(({ target }) => target === "BANANA"), "first Mine checkpoint distinguishes lowercase and uppercase with a real word");
assert.ok(["Barril","CROCODILO","Rinoceronte","O Sapo saltou sobre a Abelha."].every((target) => data.worlds.mine.checkpoints[0].stages.some((stage) => stage.target === target)), "first Mine checkpoint uses familiar objects and animal names");
assert.ok(data.worlds.mine.checkpoints[1].stages.some(({ target }) => target === "O barril tem 2 bananas!"), "second Mine checkpoint uses exclamation in a familiar sentence");
assert.ok(data.worlds.mine.checkpoints[1].stages.some(({ target }) => target === "3 sapos, 2 abelhas e 1 rinoceronte."), "second Mine checkpoint uses numbers and punctuation in a natural list");
assert.ok(data.worlds.mine.checkpoints[1].stages.some(({ target }) => target === "2 + 1 = 3 bananas."), "second Mine checkpoint uses plus and equals in a meaningful arithmetic expression");
assert.ok(data.worlds.mine.checkpoints[1].stages.some(({ target }) => target === "FRUTAS & ANIMAIS"), "second Mine checkpoint uses ampersand in a familiar title");
assert.ok(data.worlds.mine.checkpoints[2].stages.some(({ target }) => target === "café"), "third Mine checkpoint begins with unshifted acute accents");
assert.ok(data.worlds.mine.checkpoints[3].stages.some(({ target }) => target === "você"), "fourth Mine checkpoint practices Shift circumflex with lowercase vowels");
assert.ok(["Árvore","Érica","Índia","Óscar","Úrsula"].every((word) => data.worlds.mine.checkpoints[4].stages.some(({ target }) => target === word)), "fifth Mine checkpoint practices all acute uppercase vowels in words");
assert.ok(["Ângela","Ênio","Ônibus"].every((word) => data.worlds.mine.checkpoints[5].stages.some(({ target }) => target === word)), "sixth Mine checkpoint practices all uppercase circumflex vowels in words");
assert.ok(data.worlds.mine.checkpoints[6].stages.length >= 3, "seventh Mine checkpoint mixes accents and symbols");
assert.ok(data.worlds.mine.checkpoints[1].stages.some(({ symbolCodes }) => symbolCodes && symbolCodes["!"] === "Digit1"), "Shift+1 produces the exclamation mark");
assert.ok(data.worlds.mine.checkpoints[1].stages.some(({ symbolCodes }) => symbolCodes && symbolCodes["&"] === "Digit7"), "Shift+7 produces the ampersand");
assert.ok(data.worlds.mine.checkpoints[1].stages.some(({ symbolCodes }) => symbolCodes && symbolCodes["+"] === "Equal"), "Shift+= produces the plus sign");
assert.ok(data.worlds.mine.scene && data.worlds.mine.characters.length >= 3, "Mine has a game-stage scene and character art");
assert.ok(data.worlds.mine.characters.some(({ alt, src }) => alt === "Zinger" && src === "https://snesmaps.com/maps/DonkeyKongCountry/sprites/ZingerOrange.png"), "Mine uses the corrected Zinger sprite");
assert.ok(data.worlds.jungle.characters.some(({ alt, src }) => alt === "Necky" && src === "https://snesmaps.com/maps/DonkeyKongCountry/sprites/Necky.png"), "Jungle uses the corrected Necky sprite");
assert.ok(!/Diddy|Dixie|Donkey Kong/.test(data.worlds.mine.checkpoints.flatMap(({ stages }) => stages.map(({ target }) => target)).join(" ")), "Mine typing exercises avoid unfamiliar Kong names");
assert.ok(data.worlds.jungle.scene && data.worlds.jungle.characters.some(({ alt }) => /Donkey Kong e Diddy/.test(alt)), "Jungle includes DK and Diddy character art");
assert.ok(data.worlds.camp.scene && data.worlds.camp.characters.length >= 4, "Camp has a game-stage scene and multiple characters");
assert.equal(data.worlds.camp.checkpoints[2].title, "O ponto de interrogação", "AltGr+W is taught in Camp, not Mine");
assert.equal(data.worlds.camp.checkpoints[2].stages[0].altGrCodes["?"], "KeyW", "the question mark uses AltGr+W");
assert.equal(data.worlds.camp.checkpoints[3].kind, "navigation", "Ctrl text selection belongs to Camp");
assert.equal(data.worlds.mine.checkpoints[0].requireShift, undefined, "case distinction is taught directly instead of only requiring Shift");
assert.equal(data.worlds.jungle.checkpoints[1].target, "JKLÇ ÇLKJ", "the right home row includes Ç");
assert.ok(data.worlds.jungle.checkpoints.every(({ target }) => !/[áàâãéêíóôõú,;.!?]/i.test(target)), "Jungle targets do not demand accents or punctuation");
assert.ok(data.worlds.mine.checkpoints[2].stages.some(({ target }) => target === "café") && data.worlds.mine.checkpoints[2].stages.some(({ target }) => target === "maçã"), "Mine practices real accented words");
assert.equal(data.worlds.camp.checkpoints[1].key, "Delete", "Camp teaches forward delete");
assert.ok(data.worlds.camp.checkpoints[1].instruction.includes("Lupa (Launcher) + Backspace"), "Delete instruction uses the Chromebook shortcut confirmed by the teacher");
assert.equal(data.worlds.camp.checkpoints[5].expectedUndo, "DK KONG", "undo target is defined");
assert.equal(data.worlds.camp.checkpoints[5].expectedRedo, "DK KONG!", "redo target is defined");
assert.ok(data.worlds.camp.checkpoints[2].stages[0].altGrCodes["?"], "Camp requires AltGr+W for the question mark");
assert.equal(data.worlds.camp.checkpoints[3].source, "Diddy corre pela ilha", "Ctrl selection practice follows the AltGr checkpoint");

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

const resetProbe = store.fresh();
resetProbe.checkpoints = { jungle: 5, mine: 4, camp: 3 };
resetProbe.boss = { draft: "poema mantido", passed: false };
assert.equal(store.resetWorld(resetProbe, "mine"), true, "an individual world can be reset");
assert.deepEqual(JSON.parse(JSON.stringify(resetProbe.checkpoints)), { jungle: 5, mine: 0, camp: 3 }, "world reset preserves progress in other worlds");
assert.equal(resetProbe.boss.draft, "poema mantido", "world reset preserves the final poem draft");
assert.equal(store.resetWorld(resetProbe, "unknown"), false, "unknown worlds cannot be reset");
assert.equal(store.resetBoss(resetProbe), true, "the final mission can be reset independently");
assert.deepEqual(JSON.parse(JSON.stringify(resetProbe.boss)), { draft: "", passed: false }, "boss reset clears only its own draft and completion");
assert.deepEqual(JSON.parse(JSON.stringify(resetProbe.checkpoints)), { jungle: 5, mine: 0, camp: 3 }, "boss reset preserves every world counter");
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
assert.ok(mapHtml.includes('class="barrel-image"') && mapHtml.includes("DK_Barrel_DKCR.png"), "barrel entrance uses the DK Barrel image asset");
assert.ok(mapHtml.includes("ssbwiki.com/File:DK_Barrel_DKCR.png"), "barrel asset source is credited");
assert.ok(activitySource.includes('id="reset-activity"'), "each active checkpoint offers an activity reset");
assert.ok(activitySource.includes('id="reset-world"'), "each world guide offers a full-world reset");
assert.ok(activitySource.includes('id="reset-boss"'), "the final poem mission offers an activity reset");
assert.ok(activitySource.includes('id="reset-boss-finish"'), "the completed final mission also offers a reset");
assert.ok(activitySource.includes('kind === "typing-sequence"'), "Mine uses the automatic sequence renderer");
assert.ok(activitySource.includes('stage.requireNoShiftSymbols'), "unshifted punctuation is validated separately");
assert.ok(activitySource.includes("function renderMineSequenceKeyboard"), "Mine has its own restricted ABNT2 keyboard renderer");
assert.ok(activitySource.includes('renderKey("acute"),renderKey("bracket-left")'), "the acute accent key is placed after P");
assert.ok(activitySource.includes('renderKey("tilde"),renderKey("bracket-right")'), "the tilde/circumflex key is placed after Ç");
assert.ok(activitySource.includes('renderKey("comma"),renderKey("period"),renderKey("semicolon"),renderKey("slash")'), "comma, period, semicolon and slash are arranged after M");
assert.ok(activitySource.includes('class="shift-arrow">↑'), "Shift is shown with an upward arrow");
assert.ok(activitySource.includes('const showShift=!!action.shift'), "Shift highlighting follows the next character");
assert.ok(activitySource.includes('renderShift("left")') && activitySource.includes('renderShift("right")') && activitySource.includes('data-key="shift-"+side'), "left and right Shift keys have independent physical positions");
assert.ok(activitySource.includes('"1":["1","!"]') && activitySource.includes('"2":["2","@"]') && activitySource.includes('"6":["6","¨"]') && activitySource.includes('"7":["7","&"]') && activitySource.includes('"=":["=","+"]'), "the complete ABNT2 keyboard shows the number-row symbols");
assert.ok(activitySource.includes('ALTGR + W produz ?'), "the visible ABNT2 keyboard explains AltGr+W");
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

console.log("OK: 22 checkpoints, familiar Mine vocabulary, complete ABNT2 keyboard, two Shift arrows, image fallbacks, accent stages, AltGr+W, progress and poem");
