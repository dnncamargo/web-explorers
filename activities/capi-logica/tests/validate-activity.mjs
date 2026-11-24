import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const gamesContext = vm.createContext({ window: {}, Date });
vm.runInContext(read("../assets/js/games.js"), gamesContext, { filename: "games.js" });
const data = gamesContext.window.CapiLogicGames;
assert.ok(data, "visual game data is registered");
assert.equal(data.worlds.length, 7, "seven visual logic areas exist");
assert.equal(data.tasks.length, 21, "each area has three short challenges");
assert.equal(new Set(data.worlds.map((world) => world.id)).size, 7, "world IDs are unique");
assert.equal(new Set(data.tasks.map((task) => task.id)).size, 21, "task IDs are unique");

for (const world of data.worlds) {
  const tasks = data.tasks.filter((task) => task.world === world.id);
  assert.equal(tasks.length, 3, world.id + " has three challenges");
  for (const task of tasks) assert.ok(task.prompt && task.title && task.icon, task.id + " has an audio prompt and visual identity");
}
const kinds = new Set(data.tasks.map((task) => task.kind));
for (const kind of ["pattern", "paint", "shape-match", "side-count", "count", "compare", "calculation", "odd-one", "grid-position", "position", "matrix", "pair", "proportion", "letter-pattern", "letter-match", "sound-pattern"]) {
  assert.ok(kinds.has(kind), kind + " is represented");
}

const paint = data.tasks.find((task) => task.kind === "paint");
assert.equal(paint.legend.length, 3, "paint task has a simple three-color legend");
for (const number of paint.targets) assert.ok(paint.legend.some((item) => item.number === number), "each paint target has a matching legend entry");

const route = data.tasks.find((task) => task.kind === "grid-position");
const finalPosition = route.moves.reduce((position, move) => ({
  row: position.row + (move === "up" ? -1 : move === "down" ? 1 : 0),
  col: position.col + (move === "left" ? -1 : move === "right" ? 1 : 0)
}), { row: Math.floor(route.startIndex / 3), col: route.startIndex % 3 });
assert.equal(finalPosition.row * 3 + finalPosition.col, route.answerIndex, "arrow route leads to the configured grid answer");

const proportion = data.tasks.find((task) => task.kind === "proportion");
const ratio = (stack) => {
  const red = stack.filter((color) => color === "red").length;
  const blue = stack.filter((color) => color === "blue").length;
  return red / stack.length + ":" + blue / stack.length;
};
assert.equal(ratio(proportion.model), ratio(proportion.options[proportion.answerIndex]), "the proportion answer preserves the model ratio");

const sound = data.tasks.find((task) => task.kind === "sound-pattern");
assert.deepEqual(Array.from(sound.options[sound.answerIndex]), Array.from(sound.sound), "sound answer repeats the played pattern");
assert.ok(data.tasks.some((task) => task.kind === "calculation" && task.leftCount + task.rightCount === task.answer), "visual addition has a consistent answer");

const progressContext = vm.createContext({ window: { CapiLogicGames: data }, Date });
vm.runInContext(read("../assets/js/progress.js"), progressContext, { filename: "progress.js" });
const store = progressContext.window.CapiLogicProgress;
const state = store.fresh();
assert.equal(store.complete(state, "cores-01"), true, "a valid challenge can be completed");
assert.equal(store.complete(state, "cores-01"), false, "a completed challenge cannot be counted twice");
assert.equal(store.complete(state, "unknown-task"), false, "unknown challenge IDs are rejected");
assert.equal(store.countWorld(state, "cores"), 1, "world progress counts its completed challenges");
assert.equal(store.countAll(state), 1, "overall progress counts completed challenges");
assert.equal(store.normalize({ version: 9, completed: ["cores-01"] }).completed.length, 0, "unknown progress versions reset safely");

const activity = read("../assets/js/activity.js");
assert.ok(activity.includes('target.closest("[data-speak]")'), "audio instructions use one delegated click handler");
assert.ok(activity.includes("AudioContextClass"), "the sound-pattern game uses local browser audio");
assert.ok(activity.includes('startsWith("https://")'), "the painter integration accepts only HTTPS links");
assert.ok(activity.includes("data-paint-target") && activity.includes("data-paint-color"), "palette painting uses explicit color and target controls");
console.log("OK: seven worlds, 21 visual challenges, colors, shapes, numbers, rules, positions, proportions, letters, sound and progress");
