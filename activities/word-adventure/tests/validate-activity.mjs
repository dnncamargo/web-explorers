import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const contentSource = read("../assets/js/content.js");
const progressSource = read("../assets/js/progress.js");
const context = { window: {}, Date };
vm.runInNewContext(contentSource, context);
vm.runInNewContext(progressSource, context);
const data = context.window.WordAdventureContent;
const progress = context.window.WordAdventureProgress;

assert.equal(data.worlds.length, 4, "four required worlds exist");
assert.equal(data.bonus.id, "story-city", "story city is separate optional bonus");
for (const world of data.worlds) {
  assert.equal(world.stages.length, 4, world.id + " has four short stages");
  assert.ok(world.skills.length >= 2, world.id + " declares learning goals");
  assert.ok(world.bncc.length > 0, world.id + " maps to BNCC skills");
  for (const stage of world.stages) {
    assert.ok(stage.title && stage.objective && stage.kind && stage.prompt, "each stage has a defined objective and prompt");
    assert.ok(Array.isArray(stage.items) && stage.items.length > 0, "each stage has actual activity data");
  }
}
assert.ok(data.worlds[0].stages.some((stage) => stage.kind === "syllable-count"), "sound island includes oral syllable segmentation");
assert.ok(data.worlds[0].stages.some((stage) => stage.kind === "initial-sound"), "sound island compares initial sounds");
assert.ok(data.worlds[1].stages.some((stage) => stage.kind === "find-letter"), "letter village teaches grapheme recognition");
assert.ok(data.worlds[2].stages.some((stage) => stage.kind === "syllable-family"), "syllable workshop teaches CV families");
assert.ok(data.worlds[3].stages.some((stage) => stage.kind === "list-task"), "word market includes meaningful functional reading");
assert.ok(data.bonus.stages.some((stage) => stage.kind === "note-task"), "story city includes short text comprehension");

const p = progress.fresh();
assert.equal(progress.complete(p, "sound-island", 1), true);
assert.equal(progress.complete(p, "sound-island", 1), false, "duplicate checkpoint cannot be completed twice");
assert.equal(progress.complete(p, "letter-village", 2), false, "out-of-order checkpoint cannot be skipped");
assert.equal(progress.complete(p, "letter-village", 1), true);
assert.equal(progress.complete(p, "invalid-world", 1), false, "unknown world is rejected");
assert.equal(progress.normalize({version:1,completed:{"sound-island":99}}).completed["sound-island"], 4, "stored counts are bounded");
console.log("OK: four worlds, optional literacy bonus, BNCC mapping, task coverage and progress invariants");
