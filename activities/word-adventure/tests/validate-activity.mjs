import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const context = { window: {}, Date };
vm.runInNewContext(read("../assets/js/content.js"), context);
vm.runInNewContext(read("../assets/js/progress.js"), context);
const data = context.window.WordAdventureContent;
const progress = context.window.WordAdventureProgress;

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
assert.equal(progress.currentRound(p, "sound-island", 2), 0, "the next checkpoint starts at its first microactivity");
assert.equal(progress.completeRound(p, "sound-lagoon", 2, 0, 3), false, "checkpoints cannot be skipped");
assert.equal(progress.completeRound(p, "unknown-world", 1, 0, 3), false, "unknown worlds are rejected");
assert.equal(progress.normalize({ version: 2, completed: { "sound-island": 99 } }).completed["sound-island"], 4, "stored progress is bounded");
assert.equal((progress.normalize({ version: 1, completed: { "sound-island": 4 } }).completed["sound-island"] || 0), 0, "v1 data is not misread as v2 completion");
console.log("OK: 5 worlds, 25 checkpoints, microactivities, task coverage and resumable v2 progress");
