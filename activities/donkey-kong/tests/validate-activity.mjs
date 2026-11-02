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
  JSON.parse(JSON.stringify(data.worlds.mine.checkpoints.map(({ title }) => title))),
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
assert.deepEqual(
  JSON.parse(JSON.stringify(data.worlds.camp.checkpoints.map(({ kind }) => kind))),
  ["line-breaks", "select-copy", "paste-build", "paste-undo", "history-sequence", "cut-paste-particles", "delete-undo-redo"],
  "Camp follows the seven requested text-operation checkpoints"
);
assert.deepEqual(
  JSON.parse(JSON.stringify(data.worlds.camp.checkpoints.map(({ title }) => title))),
  ["Organizando três linhas", "Selecionando e copiando um trecho", "Colando o trecho copiado", "Desfazendo colagens", "Desfazer e refazer", "Recortando e colando duas partes", "Apagar, desfazer e refazer"],
  "Camp names match the revised learning progression"
);
assert.equal(data.worlds.camp.checkpoints[0].initial, "Bananada Marmelada Goiabada", "the first Camp task begins with the requested phrase");
assert.equal(data.worlds.camp.checkpoints[0].expected, "Bananada\nMarmelada\nGoiabada", "the first Camp task accepts exactly three requested lines");
assert.deepEqual(
  JSON.parse(JSON.stringify(data.worlds.camp.checkpoints[1].stages.map(({ target }) => target))),
  ["BANANA", "KONG"],
  "checkpoint two contains exactly two separate selection targets"
);
assert.equal(data.worlds.camp.checkpoints[1].stages[0].instruction, "Dê dois cliques rápidos sobre a palavra BANANA até que ela fique selecionada em azul.", "checkpoint two gives the requested BANANA instruction");
assert.equal(data.worlds.camp.checkpoints[1].stages[0].hint, "Trecho a selecionar: BANANA.", "checkpoint two identifies BANANA as the first expected selection");
assert.equal(data.worlds.camp.checkpoints[1].stages[1].instruction, "Arraste sobre a palavra KONG para selecioná-la. Você pode arrastar do início ao fim ou do fim ao início.", "checkpoint two gives the requested KONG drag instruction");
assert.equal(data.worlds.camp.checkpoints[1].stages[1].hint, "Trecho a selecionar: KONG.", "checkpoint two identifies KONG as the second expected selection");
assert.equal(data.worlds.camp.checkpoints[1].copyInstruction, "Agora mantenha Ctrl pressionado e pressione C para copiar.", "Ctrl+C finalization belongs to checkpoint two");
assert.ok(!("source" in data.worlds.camp.checkpoints[1]), "checkpoint two has no combined selection text");
assert.equal(data.worlds.camp.checkpoints[2].expected, "DONKEY KONG e DIDDY KONG", "paste checkpoint builds the requested phrase");
assert.equal(data.worlds.camp.checkpoints[2].copySource, "BANANA", "paste checkpoint ends by copying another word");
assert.equal(data.worlds.camp.checkpoints[3].pasteCount, 4, "checkpoint four requires four pastes");
assert.equal(data.worlds.camp.checkpoints[3].undoCount, 3, "checkpoint four requires three undos, leaving one copy");
assert.equal(data.worlds.camp.checkpoints[3].extraCopyText, "SAPO", "checkpoint four copies another text particle");
assert.equal(data.worlds.camp.checkpoints[4].pasteCount, 4, "checkpoint five starts with four pastes");
assert.equal(data.worlds.camp.checkpoints[4].undoBeforeRedo, 3, "checkpoint five practices undo before redo");
assert.equal(data.worlds.camp.checkpoints[4].redoCount, 2, "checkpoint five practises redo twice");
assert.equal(data.worlds.camp.checkpoints[4].undoAfterRedo, 2, "checkpoint five returns to one copy with two final undos");
assert.deepEqual(JSON.parse(JSON.stringify(data.worlds.camp.checkpoints[5].pieces)), ["BARRIL", "SAPO"], "checkpoint six recuts two different text particles");
assert.equal(data.worlds.camp.checkpoints[6].firstDelete, "DIDDY", "checkpoint seven starts by deleting a selected word");
assert.equal(data.worlds.camp.checkpoints[6].finalDelete, "KONG", "checkpoint seven ends by deleting the final selected word");

const world3ActivitySource = read("assets/js/activity.js");
const world3ActivityCss = read("assets/css/donkey-kong.css");
const islandMapHtml = read("index.html");
assert.ok(data.worlds.camp.characters.some(({ alt, src, credit }) => alt === "Krusha" && src === "https://snesmaps.com/maps/DonkeyKongCountry/sprites/Krusha.png" && credit === "SNESMaps"), "Camp uses and credits the verified SNESMaps Krusha sprite");
assert.ok(islandMapHtml.includes('src="https://giffiles.alphacoders.com/157/15792.gif"'), "the requested GIF appears on the Island of the Kongs map");
assert.ok(world3ActivitySource.includes('function renderShortcutKeyboard'), "World 3 draws native shortcut keys");
const lineBreakRenderer = world3ActivitySource.slice(world3ActivitySource.indexOf("function renderLineBreaks"), world3ActivitySource.indexOf("function renderSelectCopy"));
assert.ok(lineBreakRenderer.includes('renderShortcutKeyboard([["ENTER"]])'), "checkpoint one draws only the Enter key");
assert.ok(lineBreakRenderer.includes("enterCount === 2") && lineBreakRenderer.includes('split("\\n").length === 3'), "checkpoint one requires exactly two real Enter breaks and exactly three lines");
assert.ok(!lineBreakRenderer.includes("Backspace") && !lineBreakRenderer.includes("Delete"), "checkpoint one neither demonstrates nor requires Backspace or Delete");
assert.ok(lineBreakRenderer.includes("input.setSelectionRange") === false, "checkpoint one leaves cursor placement to the learner");
const selectCopyRenderer = world3ActivitySource.slice(world3ActivitySource.indexOf("function renderSelectCopy"), world3ActivitySource.indexOf("function renderPasteBuild"));
assert.ok(selectCopyRenderer.includes('addEventListener("dblclick"') && selectCopyRenderer.includes('addEventListener("pointermove"') && selectCopyRenderer.includes("dragObserved"), "checkpoint two recognizes double-click and pointer drag selection");
assert.ok(selectCopyRenderer.includes('class="sequence-progress" id="select-copy-progress"') && selectCopyRenderer.includes('class="sequence-instruction" id="select-copy-instruction"') && selectCopyRenderer.includes('class="sequence-hint" id="select-copy-hint"'), "checkpoint two reuses the World 2 stage components");
assert.ok(selectCopyRenderer.includes('progress.textContent = "ETAPA " + (stageIndex + 1) + "/" + checkpoint.stages.length') && selectCopyRenderer.includes("input.value = stage.target"), "checkpoint two replaces the target and updates its two-stage indicator");
assert.ok(selectCopyRenderer.includes('checkButton.addEventListener("click"') && selectCopyRenderer.includes('checkButton.textContent = "Avançar"') && selectCopyRenderer.includes("bananaReady = true"), "BANANA selection requires the existing Avançar button");
assert.ok(selectCopyRenderer.includes('"Trecho selecionado: BANANA"') && selectCopyRenderer.includes('"Você selecionou corretamente. (Clique em Avançar)"'), "checkpoint two shows BANANA confirmation before manual stage advance");
assert.ok(selectCopyRenderer.includes('keys.innerHTML = renderShortcutKeyboard([["CTRL", "C"]])') && selectCopyRenderer.includes("copyReady = true"), "checkpoint two presents Ctrl+C in the second stage after KONG is selected");
assert.ok(selectCopyRenderer.includes('"Trecho selecionado: KONG"') && selectCopyRenderer.includes("checkpoint.copyInstruction") && selectCopyRenderer.includes('"Trecho copiado: KONG"') && selectCopyRenderer.includes('"Você selecionou e copiou corretamente. (Clique em Avançar)"'), "KONG confirmation changes only after the native copy event");
assert.ok(selectCopyRenderer.includes('document.addEventListener("keydown"') && selectCopyRenderer.includes('document.addEventListener("copy"') && selectCopyRenderer.includes("capture: true") && selectCopyRenderer.includes("eventController.signal"), "checkpoint two observes native clipboard events in document capture phase");
assert.ok(selectCopyRenderer.includes('event.target !== input') && selectCopyRenderer.includes("document.activeElement !== input") && selectCopyRenderer.includes('event.key.toLowerCase() !== "c"') && selectCopyRenderer.includes('selectionIs(checkpoint.stages[1].target)'), "checkpoint two requires a trusted Ctrl+C on the focused input with exactly KONG selected");
assert.ok(selectCopyRenderer.includes("attempt.selectedText !== checkpoint.stages[1].target") && selectCopyRenderer.includes("input.selectionStart !== attempt.selectionStart") && selectCopyRenderer.includes("input.selectionEnd !== attempt.selectionEnd") && selectCopyRenderer.includes("Date.now() > attempt.expiresAt"), "native copy must match the exact unexpired selection snapshot from the shortcut");
assert.ok(selectCopyRenderer.includes("return () => eventController.abort()") && world3ActivitySource.includes("cleanupCurrentCheckpoint();"), "checkpoint two removes document observers when it completes, resets or advances");
assert.ok(selectCopyRenderer.includes("copyCompleted = true") && selectCopyRenderer.includes("complete();") && world3ActivitySource.includes('checkpoint.kind === "select-copy" ? "Avançar"'), "copy completion is idempotent and releases the global advance button");
assert.ok(world3ActivityCss.includes("#select-copy-input::selection { background:#378bd6; color:#fff; }") && world3ActivityCss.includes("#select-copy-confirmation > span"), "checkpoint two preserves native selection and uses existing status styling");
assert.ok(world3ActivitySource.includes('event.key.toLowerCase() === "v"'), "paste exercises observe Ctrl+V");
assert.ok(world3ActivitySource.includes('event.key.toLowerCase() !== "x"') && world3ActivitySource.includes("cutShortcut = true"), "cut exercise observes Ctrl+X");
assert.ok(world3ActivitySource.includes('event.key.toLowerCase() === "z" && event.shiftKey'), "redo exercises observe Ctrl+Shift+Z");
assert.ok(world3ActivitySource.includes('event.key === "Backspace"'), "the final checkpoint observes Backspace");
assert.ok(world3ActivitySource.includes("function renderShortcutKeyboard") && world3ActivitySource.includes('CTRL: ["⌃", "CTRL"]') && world3ActivitySource.includes('SHIFT: ["⇧", "SHIFT"]') && world3ActivitySource.includes('BACKSPACE: ["⌫", "BACKSPACE"]') && world3ActivitySource.includes('DELETE: ["⌦", "DELETE"]'), "physical shortcut keycaps include recognizable modifier and deletion symbols");
const cutPasteRenderer = world3ActivitySource.slice(world3ActivitySource.indexOf("function renderCutPasteParticles"), world3ActivitySource.indexOf("function renderDeleteUndoRedo"));
assert.ok(!cutPasteRenderer.includes("cut-paste-focus-target") && !cutPasteRenderer.includes("target.focus()"), "checkpoint six never moves focus to the destination automatically");
assert.ok(cutPasteRenderer.includes("target.addEventListener(\"keydown\"") && cutPasteRenderer.includes("target.addEventListener(\"paste\""), "checkpoint six waits for Ctrl+V in the destination field");
assert.ok(world3ActivityCss.includes("max-width:min(100%,280px)") && world3ActivityCss.includes("max-height:150px") && world3ActivityCss.includes("width:auto") && world3ActivityCss.includes("height:auto"), "island GIF has responsive 280 by 150 pixel bounds and preserves its aspect ratio");
assert.ok(world3ActivityCss.includes(".shortcut-keyboard") && world3ActivityCss.includes(".shortcut-key"), "shortcut keys have a drawn keyboard style");

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
assert.ok(activitySource.includes('renderShift("left")') && activitySource.includes('renderShift("right")') && activitySource.includes('data-key="shift-'), "left and right Shift keys have independent physical positions");
assert.ok(activitySource.includes('"1":["1","!"]') && activitySource.includes('"2":["2","@"]') && activitySource.includes('"6":["6","¨"]') && activitySource.includes('"7":["7","&"]') && activitySource.includes('"=":["=","+"]'), "the complete ABNT2 keyboard shows the number-row symbols");
assert.ok(!data.worlds.camp.checkpoints.some((checkpoint) => checkpoint.kind === "typing-sequence"), "Camp now focuses on text operations rather than the old AltGr typing exercise");
assert.ok(activitySource.includes("playFromGesture()"), "barrel interaction calls the radio gesture method");
assert.ok(activitySource.includes('continueButton.focus({ preventScroll: true })'), "typing completion moves focus to the continue button");
assert.ok(activitySource.includes('id="sequence-tip"') && activitySource.includes('function updateSequenceTip'), "typing sequences render a live tip span that updates with progress");
assert.ok(activitySource.includes("Segure a tecla shift, mantenha-a pressionada e pressione O."), "the first O in the Mine sentence has the requested Shift teaching tip");
assert.ok(activitySource.includes("correctionNeeded = !isValidPrefix"), "wrong text enters the Backspace correction state");
assert.ok(activitySource.includes('renderControl("⌫","backspace-key","backspace")'), "the full keyboard exposes a dedicated Backspace key for correction");
assert.ok(activitySource.includes('keyId==="backspace" && correctionNeeded'), "Backspace highlights while the typed text is outside the correct prefix");
assert.ok(activityCss.includes(".sequence-tip") && activityCss.includes(".mine-keyboard .backspace-key.is-next"), "live tips and Backspace correction have dedicated visual styling");
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

console.log("OK: 22 ordered checkpoints, familiar Mine vocabulary, Camp operations, shortcut keycaps, responsive island art, sprites, progress and poem");
