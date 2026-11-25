import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const gamesContext = vm.createContext({ window: {}, Date });
vm.runInContext(read("../assets/js/games.js"), gamesContext, { filename: "games.js" });
const data = gamesContext.window.CapiLogicGames;
assert.ok(data, "visual game data is registered");
assert.equal(data.worlds.length, 7, "seven visual logic areas exist");
assert.equal(data.tasks.length, 36, "seven areas contain 36 short challenges, including six in colors and nine each in shapes and numbers");
assert.equal(new Set(data.worlds.map((world) => world.id)).size, 7, "world IDs are unique");
assert.equal(new Set(data.tasks.map((task) => task.id)).size, 36, "task IDs are unique");

for (const world of data.worlds) {
  const tasks = data.tasks.filter((task) => task.world === world.id);
  assert.equal(tasks.length, world.id === "cores" ? 6 : world.id === "formas" || world.id === "numeros" ? 9 : 3, world.id + " has the configured number of challenges");
  for (const task of tasks) assert.ok(task.prompt && task.title && task.icon, task.id + " has an audio prompt and visual identity");
}
const numberPath = data.tasks.find((task) => task.id === "formas-09-number-path");
assert.equal(numberPath.kind, "number-path", "shape area challenge nine connects numbered dots");
assert.equal(numberPath.points.length, 9, "number path has a 3 by 3 set of nine points");
assert.deepEqual(Array.from(numberPath.points, (point) => point.value).sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9], "number path includes each number from one to nine exactly once");
assert.notDeepEqual(Array.from(numberPath.points, (point) => point.value), [1, 2, 3, 4, 5, 6, 7, 8, 9], "number path points are shuffled out of order");
assert.equal(new Set(numberPath.points.map((point) => point.x + "," + point.y)).size, 9, "all number path dots occupy distinct grid cells");

const frogTask = data.tasks.find((task) => task.id === "numeros-01-frog");
assert.equal(frogTask.kind, "frog-jumps", "number challenge one animates frog jumps");
assert.equal(frogTask.jumpCount, 6, "the frog performs exactly six jumps");
assert.equal(frogTask.answer, 6, "the frog jump count answer is six");

const additionSeries = data.tasks.find((task) => task.id === "numeros-02-addition-steps");
assert.equal(additionSeries.kind, "addition-series", "number challenge two is an incremental addition series");
assert.equal(additionSeries.problems.length, 9, "the addition series contains nine equations");
for (const increment of [1, 2, 3]) {
  const level = additionSeries.problems.filter((problem) => problem.increment === increment);
  assert.equal(level.length, 3, "the addition series contains three questions for +" + increment);
  for (const problem of level) {
    assert.equal(problem.base + problem.increment, problem.answer, "addition series result matches its addends");
    assert.ok(problem.options.includes(problem.answer), "addition series includes the correct result among its choices");
  }
}
const missingAddend = data.tasks.find((task) => task.id === "numeros-09-missing-addend");
assert.equal(missingAddend.knownCount + missingAddend.answer, missingAddend.total, "missing addend challenge has a consistent result");
assert.ok(missingAddend.options.includes(missingAddend.answer), "missing addend answer is a selectable option");

const formsFirst = data.tasks.find((task) => task.id === "formas-01");
assert.equal(formsFirst.kind, "shape-match", "the first shape challenge remains a matching task");
assert.equal(formsFirst.target, "red-circle", "the first shape challenge uses a colored tile and an inner shape");
assert.deepEqual(Array.from(formsFirst.options), ["blue-circle", "red-square", "red-circle"], "the learner must compare both color and inner shape");
assert.equal(formsFirst.answer, "red-circle", "the composite visual match has one correct answer");
const formsThird = data.tasks.find((task) => task.id === "formas-03");
assert.deepEqual(Array.from(formsThird.sequence), ["red-circle", "blue-square", "red-circle", "blue-square", null], "the approved third challenge sequence is preserved");
assert.equal(formsThird.answer, "red-circle", "the approved third challenge answer is preserved");

const kinds = new Set(data.tasks.map((task) => task.kind));
for (const kind of ["pattern", "paint", "shape-match", "connect-polygon", "nested-shape-match", "shape-color-choice", "shape-sort", "number-path", "frog-jumps", "addition-series", "missing-addend", "count", "compare", "calculation", "odd-one", "grid-position", "position", "matrix", "pair", "proportion", "letter-pattern", "letter-match", "sound-pattern", "color-matrix"]) {
  assert.ok(kinds.has(kind), kind + " is represented");
}

const paintTasks = data.tasks.filter((task) => task.kind === "paint");
assert.equal(paintTasks.length, 2, "the color area has two paint-by-key challenges");
const paint = paintTasks.find((task) => task.id === "cores-02");
assert.equal(paint.legend.length, 3, "the first paint task has a simple three-color legend");
for (const number of paint.targets) assert.ok(paint.legend.some((item) => item.number === number), "each paint target has a matching legend entry");
const advancedPaint = paintTasks.find((task) => task.id === "cores-06");
assert.equal(advancedPaint.legend.length, 4, "the advanced paint task uses four palette colors");
assert.equal(advancedPaint.targets.length, 9, "the advanced paint task contains nine targets");
for (const number of advancedPaint.targets) assert.ok(advancedPaint.legend.some((item) => item.number === number), "each advanced paint target maps to one palette color");
const colorMatrix = data.tasks.find((task) => task.id === "cores-05");
assert.equal(colorMatrix.grid.length, 9, "the advanced color matrix has nine cells");
assert.equal(colorMatrix.answer, "blue", "the color matrix completes the cyclic sequence with blue");

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

const memoryMap = new Map();
const localStorageStub = { getItem: (key) => memoryMap.get(key) ?? null, setItem: (key, value) => memoryMap.set(key, value), removeItem: (key) => memoryMap.delete(key) };
const sessionStorageStub = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const progressContext = vm.createContext({ window: { CapiLogicGames: data, localStorage: localStorageStub, sessionStorage: sessionStorageStub }, Date });
vm.runInContext(read("../assets/js/progress.js"), progressContext, { filename: "progress.js" });
const store = progressContext.window.CapiLogicProgress;
const firstLoad = store.load();
assert.equal(firstLoad.mode, "localStorage", "a fresh browser chooses available localStorage instead of temporary memory");
const state = store.fresh();
assert.equal(store.complete(state, "cores-01"), true, "a valid challenge can be completed");
assert.equal(store.complete(state, "cores-01"), false, "a completed challenge cannot be counted twice");
assert.equal(store.complete(state, "unknown-task"), false, "unknown challenge IDs are rejected");
assert.equal(store.countWorld(state, "cores"), 1, "world progress counts its completed challenges");
assert.equal(store.countAll(state), 1, "overall progress counts completed challenges");
store.save(state, firstLoad.mode);
assert.ok(memoryMap.has(store.KEY), "completed progress is written to localStorage on first use");
assert.equal(store.normalize({ version: 9, completed: ["cores-01"] }).completed.length, 0, "unknown progress versions reset safely");
assert.deepEqual(Array.from(store.normalize({ version: 1, completed: ["cores-01", "unknown-task", "cores-01"] }).completed), ["cores-01"], "current progress versions preserve valid unique challenge IDs only");
assert.equal(store.normalize({ completed: ["cores-01"] }).completed.length, 0, "progress without a version resets safely");
assert.equal(store.normalize({ version: 1, completed: ["formas-05", "formas-06", "formas-08", "numeros-01", "numeros-02", "numeros-03"] }).completed.length, 0, "redesigned shape and number challenges do not inherit completion from previous task IDs");

const activity = read("../assets/js/activity.js");
assert.ok(activity.includes('target.closest("[data-speak]")'), "audio instructions use one delegated click handler");
assert.ok(activity.includes("AudioContextClass"), "the sound-pattern game uses local browser audio");
assert.ok(activity.includes('startsWith("https://")'), "the painter integration accepts only HTTPS links");
assert.ok(activity.includes("data-paint-target") && activity.includes("data-paint-color"), "palette painting uses explicit color and target controls");
assert.ok(activity.includes("class=\"paint-layout\"") && activity.includes("class=\"paint-sidebar\""), "paint games render the palette in a lateral sidebar");
assert.ok(activity.includes("function colorMatrixVisual(task)") && activity.includes('task.kind === "color-matrix"'), "color matrix challenges have a dedicated renderer");
assert.ok(activity.includes("answer-tray") && activity.includes("patternVisual(task.sequence, task.options)"), "pattern alternatives are rendered in a separate answer tray");
assert.ok(activity.includes("function highlightOption(button)") && activity.includes('classList.toggle("is-selected"'), "selected answer options receive a persistent visual highlight");

const shapeTasks = data.tasks.filter((task) => task.world === "formas");
assert.equal(shapeTasks.length, 8, "the shape area contains eight progressive challenges");
const polygon = shapeTasks.find((task) => task.id === "formas-02");
assert.equal(polygon.kind, "connect-polygon", "the second shape challenge constructs a polygon by dragging");
assert.equal(polygon.points.length, 5, "the pentagon task has five vertices");
assert.equal(polygon.answer, 5, "the learner counts five vertices after closing the pentagon");
assert.ok(polygon.options.includes(5), "the pentagon vertex count is one of the choices");
for (const point of polygon.points) assert.ok(point.x >= 0 && point.x <= 360 && point.y >= 0 && point.y <= 270, "polygon points stay inside the drawing area");
const nestedTask = shapeTasks.find((task) => task.id === "formas-05-nested");
assert.equal(nestedTask.kind, "nested-shape-match", "challenge five compares nested shapes");
assert.equal(nestedTask.targetLayers.length, 4, "challenge five contains four nested layers");
assert.ok(nestedTask.targetLayers.slice(1).length >= 2, "challenge five adds two inner shapes beyond the first nested pair");
assert.equal(nestedTask.options.length, 3, "nested-shape challenge has three alternatives");
for (const option of nestedTask.options) assert.equal(option.layers.length, 4, "every nested alternative has four layers");
assert.equal(nestedTask.options[nestedTask.answerIndex].layers.map((layer) => layer.shape + "-" + layer.color).join("|"), nestedTask.targetLayers.map((layer) => layer.shape + "-" + layer.color).join("|"), "the nested answer matches all shapes and colors in order");

const colorChoice = shapeTasks.find((task) => task.id === "formas-06-color-search");
assert.equal(colorChoice.kind, "shape-color-choice", "challenge six searches for a shape with a specific color");
assert.equal(colorChoice.options.length, 14, "challenge six displays fourteen colored alternatives");
assert.equal(colorChoice.options.length / 7, 2, "fourteen alternatives are arranged as two rows of seven");
const selectedShape = colorChoice.options[colorChoice.answerIndex];
assert.equal(selectedShape.shape, colorChoice.targetShape, "the selected alternative has the requested pentagon shape");
assert.equal(selectedShape.color, colorChoice.targetColor, "the selected alternative has the requested target color");
assert.equal(colorChoice.options.filter((option) => option.shape === colorChoice.targetShape && option.color === colorChoice.targetColor).length, 1, "only one alternative matches both target attributes");

const sorting = shapeTasks.find((task) => task.id === "formas-08-sort");
assert.equal(sorting.kind, "shape-sort", "challenge eight sorts shapes into groups");
assert.equal(sorting.zones.length, 3, "shape sorting has three classification groups");
assert.equal(sorting.items.length, 12, "shape sorting has twelve mixed items");
for (const shape of sorting.zones) assert.equal(sorting.items.filter((item) => item.shape === shape).length, 4, "each sorting group contains four items");
assert.equal(new Set(sorting.items.map((item) => item.id)).size, sorting.items.length, "sorting item IDs are unique");
assert.notDeepEqual(Array.from(sorting.items, (item) => item.shape), Array.from(sorting.items, (item) => item.shape).slice().sort(), "sorting items are shuffled rather than grouped by type");


assert.ok(activity.includes("function setupPolygonDrawing(task)"), "pentagon drawing has a dedicated interaction controller");
assert.ok(activity.includes("accepted.push(targetIndex)") && activity.includes("const finishPointer"), "a continuous drag connects successive polygon vertices");
assert.ok(activity.includes('svg.addEventListener("pointermove"') && activity.includes('svg.addEventListener("pointerup"'), "pentagon drawing supports pointer and touch dragging");
assert.ok(activity.includes('face.textContent = mood === "happy" ? "😊" : "😟"'), "polygon drawing gives happy and sad proximity feedback");
assert.ok(activity.includes("function shapeGlyphHTML(shape)"), "shapes use centered CSS glyph elements rather than font glyph baselines");
assert.ok(activity.includes("function numberPathVisual(task)") && activity.includes("function setupNumberPath(task)"), "the 3 by 3 number path has a dedicated renderer and drag controller");
assert.ok(activity.includes("function frogJumpVisual(task)") && activity.includes("function playFrogJumps(task)"), "frog jumps have a visual renderer and timed animation");
assert.ok(activity.includes("function additionSeriesVisual(task)") && activity.includes("additionSeriesStep += 1"), "addition series advances after each correct answer");
assert.ok(activity.includes("function missingAddendVisual(task)"), "missing addend has a dedicated visual equation renderer");
assert.ok(activity.includes("function nestedLayersHTML(layers)") && activity.includes("function nestedShapeVisual(task)"), "nested shape matching renders multiple inner layers");
assert.ok(activity.includes("function shapeColorChoiceVisual(task)") && activity.includes("shape-color-options"), "the fourteen colored shapes have a dedicated choice grid");
assert.ok(activity.includes("function setupShapeSorting(task)") && activity.includes('root.addEventListener("pointerdown"') && activity.includes('root.addEventListener("pointerup"'), "shape classification supports pointer drag and drop");
assert.ok(activity.includes('document.elementFromPoint(event.clientX, event.clientY)'), "shape sorting detects the drop target under the pointer");
console.log("OK: seven worlds, 36 visual challenges, colors, shapes, numbers, rules, positions, proportions, letters, sound and progress");
