import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const context = { window: {}, Date };
vm.runInNewContext(read("../assets/js/content.js"), context);
vm.runInNewContext(read("../assets/js/progress.js"), context);
const data = context.window.WordAdventureContent;
const progress = context.window.WordAdventureProgress;
const activity = read("../assets/js/activity.js");
const styles = read("../assets/css/word-adventure.css");

const camp = data.worlds[0];
assert.deepEqual(Array.from(camp.stages[0].rounds[0].options, (option) => option.word), ["Lanterna", "Cantil", "Mapa"], "the first click task places the lantern first");
assert.deepEqual(Array.from(camp.stages[0].rounds[1].options, (option) => option.word), ["Mochila", "Fogueira", "Barraca"], "the second click task places the tent last");
assert.deepEqual(Array.from(camp.stages[0].rounds[2].options, (option) => option.word), ["Folha", "Pegada", "Pedra"], "the third click task places the footprint in the middle");
assert.deepEqual(Array.from(camp.stages[0].rounds, (round) => round.options.findIndex((option) => option.word === round.target)), [0, 2, 1], "the three correct answers occupy different positions");
assert.equal(camp.stages[0].rounds[1].target, "Barraca", "the second click task asks the learner to find the tent");
assert.match(camp.stages[0].rounds[1].prompt, /Clique na barraca/i, "the question clearly asks for the tent");
assert.deepEqual(Array.from(camp.stages[0].rounds[1].options, (option) => option.emoji), ["🎒", "🔥", "⛺"], "the camping choices use clear, matching pictograms");
assert.deepEqual(Array.from(camp.stages[1].rounds[1].sequence), ["4", "5", "6", "7", "8", "9"], "the second trail starts at four and ends at nine");
assert.deepEqual(Array.from(camp.stages[1].rounds[2].displayOrder), ["1", "3", "2", "4", "6", "8", "7", "5", "9"], "the third trail displays the exact requested visual order");
assert.deepEqual(Array.from(camp.stages[1].rounds[2].sequence), ["1", "2", "3", "4", "5", "6", "7", "8", "9"], "the third trail accepts only ascending clicks from one through nine");
assert.equal(camp.stages[1].rounds[2].displayOrder.length, 9, "the displayed line contains nine points");
assert.equal(camp.stages[1].rounds[2].displayOrder.includes("5"), true, "the displayed points include five");
assert.equal(camp.stages[1].rounds[2].displayOrder.filter((value) => value === "6").length, 1, "the visual line shows six only once");
assert.equal(camp.stages[1].rounds[2].sequence.filter((value) => value === "6").length, 1, "the learner clicks six only once");
assert.deepEqual([...camp.stages[1].rounds[2].displayOrder].sort(), [...camp.stages[1].rounds[2].sequence].sort(), "the display contains each number from one through nine exactly once");
assert.ok(camp.stages[2].rounds.every((round) => round.options.every((option) => option.shape && option.color)), "all shape choices use explicit SVG geometry and colors");
assert.equal(camp.stages[2].rounds[1].options[1].shape, "square", "the green square is a true square");
assert.equal(camp.stages[2].rounds[1].options[1].color, "green", "the square is green");
assert.equal(camp.stages[2].rounds[2].options[1].shape, "triangle", "the third exercise uses a triangle");
assert.equal(camp.stages[2].rounds[2].options[1].color, "yellow", "the triangle is yellow");
assert.equal(camp.stages[2].rounds[3].options[0].shape, "star", "the fourth shape exercise uses a star");
assert.equal(camp.stages[2].rounds[3].options[0].color, "orange", "the star is orange");
assert.match(camp.stages[3].prompt, /mochila para um acampamento/i, "the backpack instruction explains the camping purpose");
assert.equal(camp.stages[3].rounds[1].item.word, "Bússola", "the second backpack item is a compass");
assert.equal(camp.stages[3].rounds[1].item.emoji, "🧭", "the compass uses its matching compass emoji");
assert.deepEqual(Array.from(camp.stages[3].rounds[0].options, (option) => option.word), ["Folha", "Lanterna", "Pedra", "Nuvem"], "the first backpack task places the flashlight second");
assert.deepEqual(Array.from(camp.stages[3].rounds[1].options, (option) => option.word), ["Flor", "Nuvem", "Bola", "Bússola"], "the second backpack task places the compass fourth");
assert.deepEqual(Array.from(camp.stages[3].rounds[2].options, (option) => option.word), ["Concha", "Maçã", "Mapa", "Flor"], "the third backpack task places the map third");
assert.deepEqual(Array.from(camp.stages[3].rounds, (round) => round.options.findIndex((option) => option.word === round.item.word)), [1, 3, 2], "the three correct backpack answers occupy different positions");
assert.equal(camp.stages[3].rounds[1].options[3].emoji, "🧭", "the compass option displays the matching symbol");
assert.ok(camp.stages[3].rounds.every((round) => round.options.length === 4), "each backpack task has four alternatives");

const lagoon = data.worlds[1];
assert.equal(lagoon.stages[0].rounds[3].target, "ARARA", "the fourth listening task now expects the macaw");
assert.match(lagoon.stages[0].rounds[3].prompt, /ave.*lagoa/i, "the animal prompt refers to a bird near the lagoon");
assert.deepEqual(Array.from(lagoon.stages[0].rounds[3].options, (option) => option.word), ["Macaco", "Arara", "Tartaruga"], "the macaw replaces the frog and the distractors use distinct animals");
assert.equal(lagoon.stages[1].kind, "syllable-tap", "the second lagoon checkpoint requires tapping syllables");
assert.deepEqual(Array.from(lagoon.stages[1].rounds, (round) => round.word), ["SAPO", "JACARÉ", "MACACO", "ELEFANTE"], "the syllable activity uses the four requested animals");
assert.deepEqual(Array.from(lagoon.stages[1].rounds, (round) => Array.from(round.syllables)), [["SA", "PO"], ["JA", "CA", "RÉ"], ["MA", "CA", "CO"], ["E", "LE", "FAN", "TE"]], "each animal is divided into its spoken syllables");
assert.ok(!lagoon.stages[1].prompt.includes("pedaço") && lagoon.stages[1].prompt.includes("parte"), "the syllable instruction uses the word parte");
assert.ok(activity.includes('stage.kind === "syllable-tap"') && activity.includes('spoken(syllable.toLocaleLowerCase("pt-BR"))'), "tapping a syllable speaks its lowercase sound");
assert.ok(activity.includes('index !== currentPart') && activity.includes('button.classList.add("heard")') && activity.includes('button.disabled = true;'), "syllables must be tapped in order, once each, and change color when heard");
assert.ok(styles.includes(".syllable-tap-part.heard") && styles.includes(".syllable-tap-separator"), "tapped syllables change color and are separated by centered dots");

assert.ok(activity.includes("ROTEIRO ' + world.number + ' · PARADA ' + number + '/' + world.stages.length"), "checkpoint progress uses route and stop vocabulary");
assert.ok(activity.includes("DESCOBERTA ' + (roundIndex + 1) + ' DE ' + rounds"), "microactivity progress uses discovery vocabulary");
assert.ok(!activity.includes("ATIVIDADE ' + (roundIndex + 1)"), "the generic activity label is no longer shown");
assert.ok(!activity.includes("· CHECKPOINT ' + number"), "the technical checkpoint label is no longer shown");
assert.ok(activity.includes("function optionVisual(item)"), "the activity renders custom SVG option illustrations");
assert.ok(activity.includes("shape-option") && activity.includes("circle:") && activity.includes("square:") && activity.includes("triangle:") && activity.includes("star:"), "circle, square, triangle and star have dedicated SVG geometry");
assert.ok(activity.includes("restart-checkpoint") && activity.includes("STORE.resetCheckpoint"), "the current checkpoint has a restart control");
assert.ok(activity.includes('const value = button.dataset.dot;') && activity.includes('value !== String(sequence[at])'), "trail validation checks the displayed number, not the button position");
assert.ok(activity.includes("round.displayOrder || sequence") && activity.includes("button.disabled = true;") && activity.includes('button.classList.add("connected")'), "the trail validates ascending clicks and disables each selected point");
assert.ok(styles.includes(".shuffled-dot-board{display:flex;flex-wrap:nowrap;"), "the shuffled numeric points are displayed in one horizontal line, not a matrix");
assert.ok(activity.includes("if (resumeMusic) toggleMapMusic();") && activity.includes("function returnToMap()"), "returning through the map control resumes previously playing music");


const entryScreen = read("../index.html");
assert.ok(entryScreen.includes('id="capi-entry-screen"') && entryScreen.includes('id="capi-entry-button"'), "the initial screen presents a central clickable capybara");
assert.ok(entryScreen.includes("canva-uma-capivara-fofa-segurando-uma-rosa"), "the entry button displays the existing capybara illustration");
assert.ok(activity.includes("function setupMapEntryOverlay()") && activity.includes("toggleMapMusic();") && activity.includes("screen.remove();"), "clicking the capybara opens the map and starts the soundtrack");
assert.ok(activity.includes('if (global.location.hash) {') && activity.includes('shell.inert = true;'), "the entry screen applies only to the initial map and blocks background interaction");
assert.ok(activity.includes('global.document.body.classList.remove("entry-locked")'), "the page is unlocked after the capybara entry transition");
assert.ok(activity.includes('const MAP_MUSIC_ID = "01pN6rnaJy8"'), "the home map uses the selected soundtrack");
assert.ok(activity.includes("https://http2.mlstatic.com/D_NQ_NP_2X_737962-MLA81129374435_122024-F.webp"), "the supplied image introduces the home music");
assert.ok(activity.includes('id="map-music-toggle"') && activity.includes("toggleMapMusic"), "the introduction image is the music control");
assert.ok(activity.includes("controls=0&disablekb=1&loop=1&playlist="), "the YouTube player is hidden and loops the complete track");
assert.ok(activity.includes("function stopMapMusic()") && activity.includes("stopMapMusic();\n    const world = worldList().find"), "map music is removed when leaving the home map");
assert.ok(activity.includes("mainRouteComplete = DATA.worlds.every"), "the activity finish depends on all five required worlds");
assert.ok(activity.includes("https://marketplace.canva.com/bJxi8/MAHCGsbJxi8/1/tl/canva-uma-capivara-fofa-segurando-uma-rosa.-MAHCGsbJxi8.png"), "the final thank-you uses the supplied capybara image");
assert.ok(activity.includes('alt="Uma capivara fofa segurando uma rosa"'), "the gratitude image has descriptive alternative text");
assert.ok(styles.includes(".player-host{position:fixed;top:0;left:-240px"), "the YouTube player remains outside the visible page");
assert.ok(styles.includes(".music-image-button") && styles.includes(".gratitude-image"), "the music introduction and gratitude image have responsive styling");

assert.equal(data.worlds.length, 5, "five required nature expedition worlds exist");
assert.equal(data.bonus.id, "field-journal", "the field journal is optional");
assert.deepEqual(Array.from(data.worlds, (world) => world.stages.length), [4, 5, 5, 6, 5]);
assert.equal(data.worlds.reduce((sum, world) => sum + world.stages.length, 0), 25, "the main route has exactly 25 checkpoints");
assert.ok(data.worlds.every((world) => world.stages.every((checkpoint) => checkpoint.rounds.length >= 3 && checkpoint.rounds.length <= 5)), "each main checkpoint offers three to five microactivities");
assert.ok(data.worlds.every((world) => world.skills.length >= 2 && world.bncc.length > 0), "worlds declare learning goals and curriculum links");
assert.ok(data.worlds.every((world) => world.stages.every((checkpoint) => checkpoint.title && checkpoint.objective && checkpoint.kind && checkpoint.prompt)), "all checkpoints have an objective and instruction");

const kinds = new Set(data.worlds.flatMap((world) => world.stages.map((checkpoint) => checkpoint.kind)));
for (const kind of ["click-target", "connect-dots", "find-shape", "place-item", "listen-picture", "syllable-count", "rhyme", "initial-syllable", "first-syllable", "find-letter", "case-match", "trace-letter", "sound-letter", "syllable-family", "complete-word", "build-word", "decode-word", "read-label", "list-task", "sign-task", "note-task", "sentence-order"]) {
  assert.ok(kinds.has(kind), `the experience includes ${kind}`);
}
assert.equal(data.worlds[0].id, "sound-island", "the camp keeps the original world route for compatibility");
assert.equal(data.worlds[1].id, "sound-lagoon", "sound awareness precedes letter trail");
assert.equal(data.worlds[2].id, "letter-trail", "letter recognition follows oral sound awareness");
assert.equal(data.worlds[3].id, "syllable-workshop", "syllable decoding follows letters");
assert.equal(data.worlds[4].id, "research-post", "functional literacy follows decoding");

const p = progress.fresh();
assert.equal(p.version, 2);
assert.notEqual(progress.KEY, progress.LEGACY_KEY, "v2 uses a separate storage key");
assert.equal(progress.completeRound(p, "sound-island", 1, 0, 3), true, "the first microactivity is saved");
assert.equal(progress.currentRound(p, "sound-island", 1), 1, "the next microactivity is restored");
assert.equal(progress.completeRound(p, "sound-island", 1, 0, 3), false, "a saved microactivity cannot be completed twice");
assert.equal(progress.completeRound(p, "sound-island", 1, 1, 3), true);
assert.equal(progress.completeRound(p, "sound-island", 1, 2, 3), true);
assert.equal(progress.completedCount(p, "sound-island"), 1, "a checkpoint is completed only after its last microactivity");

const restartState = progress.fresh();
assert.equal(progress.completeRound(restartState, "sound-island", 1, 0, 3), true);
assert.equal(progress.completeRound(restartState, "sound-island", 1, 1, 3), true);
assert.equal(progress.currentRound(restartState, "sound-island", 1), 2);
assert.equal(progress.resetCheckpoint(restartState, "sound-island", 1), true, "the active checkpoint can be restarted");
assert.equal(progress.currentRound(restartState, "sound-island", 1), 0, "restart returns to the first microactivity");
for (let index = 0; index < 3; index += 1) {
  assert.equal(progress.completeRound(restartState, "sound-island", 1, index, 3), true);
}
assert.equal(progress.completedCount(restartState, "sound-island"), 1, "the first checkpoint is completed before testing the next one");
assert.equal(progress.resetCheckpoint(restartState, "sound-island", 2), true, "the next active checkpoint can be restarted");
assert.equal(progress.completedCount(restartState, "sound-island"), 1, "restarting does not erase previously completed checkpoints");
assert.equal(progress.currentRound(restartState, "sound-island", 2), 0, "the next checkpoint restarts at its first microactivity");
assert.equal(progress.resetCheckpoint(restartState, "sound-island", 3), false, "a future checkpoint cannot be reset");
assert.equal(progress.resetCheckpoint(restartState, "unknown-world", 1), false, "unknown worlds cannot be reset");

const finishedState = progress.fresh();
for (let index = 0; index < 3; index += 1) {
  assert.equal(progress.completeRound(finishedState, "sound-island", 1, index, 3), true);
}
assert.equal(progress.completedCount(finishedState, "sound-island"), 1, "the last microactivity immediately completes the checkpoint");
assert.equal(progress.resetCheckpoint(finishedState, "sound-island", 1), true, "the checkpoint can still be restarted from its completion screen");
assert.equal(progress.completedCount(finishedState, "sound-island"), 0, "restarting the latest completed checkpoint reopens it");
assert.equal(progress.currentRound(finishedState, "sound-island", 1), 0, "reopened checkpoint starts from its first microactivity");

const olderFinishedState = progress.fresh();
for (let checkpoint = 1; checkpoint <= 2; checkpoint += 1) {
  for (let index = 0; index < 3; index += 1) {
    assert.equal(progress.completeRound(olderFinishedState, "sound-island", checkpoint, index, 3), true);
  }
}
assert.equal(progress.resetCheckpoint(olderFinishedState, "sound-island", 1), false, "restarting does not reopen an older completed checkpoint");
assert.equal(progress.currentRound(p, "sound-island", 2), 0, "the next checkpoint starts at its first microactivity");
assert.equal(progress.completeRound(p, "sound-lagoon", 2, 0, 3), false, "checkpoints cannot be skipped");
assert.equal(progress.completeRound(p, "unknown-world", 1, 0, 3), false, "unknown worlds are rejected");
assert.equal(progress.normalize({ version: 2, completed: { "sound-island": 99 } }).completed["sound-island"], 4, "stored progress is bounded");
assert.equal((progress.normalize({ version: 1, completed: { "sound-island": 4 } }).completed["sound-island"] || 0), 0, "v1 data is not misread as v2 completion");
console.log("OK: 5 worlds, 25 checkpoints, microactivities, task coverage and resumable v2 progress");
