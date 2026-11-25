import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const gamesContext = vm.createContext({ window: {}, Date });
vm.runInContext(read("../assets/js/games.js"), gamesContext, { filename: "games.js" });
const data = gamesContext.window.CapiLogicGames;
assert.ok(data, "visual game data is registered");
assert.equal(data.worlds.length, 7, "seven visual logic areas exist");
assert.equal(data.tasks.length, 41, "seven areas contain 41 short challenges, including eight in the rules area");
assert.equal(new Set(data.worlds.map((world) => world.id)).size, 7, "world IDs are unique");
assert.equal(new Set(data.tasks.map((task) => task.id)).size, 41, "task IDs are unique");

for (const world of data.worlds) {
  const tasks = data.tasks.filter((task) => task.world === world.id);
  assert.equal(tasks.length, world.id === "cores" ? 6 : world.id === "formas" || world.id === "numeros" ? 9 : world.id === "regras" ? 8 : 3, world.id + " has the configured number of challenges");
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
const fishCount = data.tasks.find((task) => task.id === "numeros-04-fish-count");
assert.equal(fishCount.kind, "fish-crab-count", "number challenge four mixes fish and crabs");
assert.equal(fishCount.animals.filter((animal) => animal === "fish").length, 7, "fish-count challenge has seven fish");
assert.ok(fishCount.animals.includes("crab"), "fish-count challenge includes crabs as distractors");
assert.equal(fishCount.answer, 7, "fish-count answer counts fish only");

const applePaint = data.tasks.find((task) => task.id === "numeros-05-apple-paint");
assert.equal(applePaint.kind, "apple-paint-count", "number challenge five requires tapping and coloring apples");
assert.equal(applePaint.appleCount, 8, "apple painting contains eight apples");
assert.equal(applePaint.appleColors.length, 8, "every apple has a color to apply");
assert.equal(applePaint.answer, 8, "the apple painting challenge asks for the total number of apples");
assert.equal(applePaint.options.indexOf(applePaint.answer), 0, "the apple-count answer is not in the middle position");

const countdown = data.tasks.find((task) => task.id === "numeros-06-double-countdown");
assert.equal(countdown.kind, "double-countdown", "number challenge six has two missing countdown values");
assert.equal(countdown.sequence.filter((value) => value === null).length, 2, "countdown has exactly two empty positions");
assert.deepEqual(Array.from(countdown.answers), [8, 6], "countdown missing values descend from ten to three");
assert.equal(countdown.options.length, 2, "the two countdown gaps are answered one at a time");
for (let index = 0; index < 2; index++) assert.ok(countdown.options[index].includes(countdown.answers[index]), "each countdown gap includes its correct choice");

const tripleSum = data.tasks.find((task) => task.id === "numeros-07-triple-sum");
assert.deepEqual(Array.from(tripleSum.terms), [5, 3, 4], "number challenge seven adds three groups");
assert.equal(tripleSum.terms.reduce((sum, value) => sum + value, 0), 12, "triple addition totals twelve");
assert.ok(tripleSum.options.includes(tripleSum.answer), "triple addition includes the correct answer");
assert.equal(tripleSum.options.indexOf(tripleSum.answer), 2, "the three-group addition answer is shown in the last position");

const missingAddend = data.tasks.find((task) => task.id === "numeros-09-missing-addend");
assert.equal(missingAddend.knownCount + missingAddend.answer, missingAddend.total, "missing addend challenge has a consistent result");
assert.ok(missingAddend.options.includes(missingAddend.answer), "missing addend answer is a selectable option");

const formsFirst = data.tasks.find((task) => task.id === "formas-01");
assert.equal(formsFirst.kind, "shape-match", "the first shape challenge remains a matching task");
assert.equal(formsFirst.target, "red-circle", "the first shape challenge uses a colored tile and an inner shape");
assert.equal(formsFirst.options.length, 3, "the first shape challenge has three alternatives");
assert.ok(formsFirst.options.includes("blue-circle"), "one distractor keeps the circle but changes its color");
assert.ok(formsFirst.options.includes("red-square"), "one distractor keeps the color but changes its shape");
assert.ok(formsFirst.options.includes("red-circle"), "one alternative matches both the target color and shape");
assert.equal(formsFirst.answer, "red-circle", "the composite visual match has one correct answer");
const formsThird = data.tasks.find((task) => task.id === "formas-03");
assert.deepEqual(Array.from(formsThird.sequence), ["red-circle", "blue-square", "red-circle", "blue-square", null], "the approved third challenge sequence is preserved");
assert.equal(formsThird.answer, "red-circle", "the approved third challenge answer is preserved");

const rulesTasks = data.tasks.filter((task) => task.world === "regras");
assert.equal(rulesTasks.length, 8, "the rules area contains eight progressive challenges");
const arrowCopy = rulesTasks.find((task) => task.id === "regras-01-arrow-copy");
assert.equal(arrowCopy.kind, "arrow-order", "the first rules challenge copies a colored arrow order");
assert.equal(arrowCopy.sequence.length, 4, "the first arrow order has four reference arrows");
assert.equal(arrowCopy.choices.length, 8, "the first arrow order has eight selectable arrows");
assert.equal(new Set(arrowCopy.choices.map((choice) => choice.id)).size, 8, "each selectable arrow has a unique identity");
for (const arrow of arrowCopy.sequence) assert.equal(arrowCopy.choices.filter((choice) => choice.direction === arrow.direction && choice.color === arrow.color).length, 1, "each reference arrow has exactly one matching choice");

const irregularMatch = rulesTasks.find((task) => task.id === "regras-02-irregular-match");
assert.equal(irregularMatch.kind, "complex-match", "the second rules challenge compares irregular nested compositions");
assert.equal(irregularMatch.targetLayers.length, 3, "the irregular model has three nested elements");
assert.equal(irregularMatch.options.length, 4, "the irregular composition has four alternatives");
const allowedIrregularShapes = new Set(["cloud", "leaf", "wave", "blob", "shell", "ribbon"]);
for (const layer of irregularMatch.targetLayers) assert.ok(allowedIrregularShapes.has(layer.shape), "the nested model uses an irregular silhouette");
assert.deepEqual(Array.from(irregularMatch.options[irregularMatch.answerIndex].layers, (layer) => layer.shape + "-" + layer.color), Array.from(irregularMatch.targetLayers, (layer) => layer.shape + "-" + layer.color), "the correct irregular option matches all nested parts and colors");

const diagonalPattern = rulesTasks.find((task) => task.id === "regras-03-diagonal-pattern");
assert.equal(diagonalPattern.kind, "pattern", "the third rules challenge continues a diagonal arrow pattern");
assert.equal(diagonalPattern.options.length, 6, "the diagonal arrow pattern offers six alternatives");
assert.ok(diagonalPattern.options.includes(diagonalPattern.answer), "the diagonal arrow pattern includes its correct continuation");
for (const token of diagonalPattern.sequence.filter(Boolean).concat(diagonalPattern.options)) assert.ok(["up-right", "down-right", "down-left", "up-left"].includes(token.split("-").slice(-2).join("-")) || ["up-right", "down-right", "down-left", "up-left"].includes(token), "the diagonal task uses diagonal arrow directions");

const opposite = rulesTasks.find((task) => task.id === "regras-04-opposite");
assert.equal(opposite.kind, "odd-one", "challenge four asks the learner to find a different arrow");
const oppositeDirections = opposite.items.map((item) => item.token.split("-").slice(-2).join("-"));
assert.equal(oppositeDirections.filter((direction) => direction === "up-right").length, 5, "five arrows share the same diagonal direction");
assert.equal(opposite.items.find((item) => item.value === opposite.answer).token.split("-").slice(-2).join("-"), "down-left", "the odd arrow points in the opposite direction");

const colorDirection = rulesTasks.find((task) => task.id === "regras-05-color-direction");
assert.equal(colorDirection.kind, "pattern", "challenge five combines arrow color and direction");
assert.ok(colorDirection.options.includes(colorDirection.answer), "the color-direction sequence includes its correct combination");
assert.ok(colorDirection.sequence.some((token) => token.startsWith("red-")) && colorDirection.sequence.some((token) => token.startsWith("blue-")), "the color-direction pattern contains different arrow colors");

const arrowMatrix = rulesTasks.find((task) => task.id === "regras-06-arrow-matrix");
assert.equal(arrowMatrix.kind, "matrix", "challenge six is a directional matrix");
assert.equal(arrowMatrix.grid.length, 9, "directional matrix has nine cells");
assert.equal(arrowMatrix.grid.filter((value) => value === null).length, 1, "directional matrix has one missing cell");
assert.ok(arrowMatrix.options.includes(arrowMatrix.answer), "directional matrix includes its correct answer");

const longerCopy = rulesTasks.find((task) => task.id === "regras-07-arrow-copy-plus");
assert.equal(longerCopy.kind, "arrow-order", "challenge seven extends the arrow-copy interaction");
assert.equal(longerCopy.sequence.length, 6, "the advanced arrow-copy challenge has six steps");
assert.equal(longerCopy.choices.length, 12, "the advanced arrow-copy challenge has twelve selectable arrows");
for (const arrow of longerCopy.sequence) assert.equal(longerCopy.choices.filter((choice) => choice.direction === arrow.direction && choice.color === arrow.color).length, 1, "advanced arrow sequence has one exact choice per step");
const pathMatch = rulesTasks.find((task) => task.id === "regras-08-sequence-match");
assert.equal(pathMatch.kind, "arrow-sequence-match", "challenge eight compares complete arrow paths");
assert.equal(pathMatch.target.length, 5, "the path model has five arrows");
assert.equal(pathMatch.options.length, 4, "the path comparison has four complete alternatives");
assert.deepEqual(Array.from(pathMatch.options[pathMatch.answerIndex], (arrow) => arrow.direction + "-" + arrow.color), Array.from(pathMatch.target, (arrow) => arrow.direction + "-" + arrow.color), "the correct path matches direction, color and order");

const choicePositions = { first: 0, middle: 0, last: 0 };
const collectChoicePosition = (holder) => {
  if (!Array.isArray(holder.options) || holder.options.length !== 3) return;
  const index = Number.isInteger(holder.answerIndex)
    ? holder.answerIndex
    : holder.options.findIndex((option) => String(option) === String(holder.answer));
  if (index === 0) choicePositions.first += 1;
  else if (index === 1) choicePositions.middle += 1;
  else if (index === 2) choicePositions.last += 1;
};
for (const task of data.tasks) {
  if (task.kind === "addition-series") task.problems.forEach(collectChoicePosition);
  else if (task.kind === "double-countdown") task.options.forEach((options, index) => collectChoicePosition({ options, answer: task.answers[index] }));
  else collectChoicePosition(task);
}
assert.ok(choicePositions.first > 0 && choicePositions.middle > 0 && choicePositions.last > 0, "three-choice correct answers are distributed across first, middle and last positions");
assert.ok(Math.max(...Object.values(choicePositions)) - Math.min(...Object.values(choicePositions)) <= 4, "three-choice correct-answer positions are reasonably balanced");

const kinds = new Set(data.tasks.map((task) => task.kind));
for (const kind of ["pattern", "paint", "shape-match", "connect-polygon", "nested-shape-match", "shape-color-choice", "shape-sort", "number-path", "frog-jumps", "addition-series", "missing-addend", "arrow-order", "complex-match", "arrow-sequence-match", "fish-crab-count", "apple-paint-count", "double-countdown", "calculation", "odd-one", "grid-position", "position", "matrix", "pair", "proportion", "letter-pattern", "letter-match", "sound-pattern", "color-matrix"]) {
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
assert.equal(store.normalize({ version: 1, completed: ["formas-05", "formas-06", "formas-08", "numeros-01", "numeros-02", "numeros-03", "numeros-04", "numeros-05", "numeros-06", "numeros-07"] }).completed.length, 0, "redesigned shape and number challenges do not inherit completion from previous task IDs");
assert.equal(store.normalize({ version: 1, completed: ["regras-01", "regras-02", "regras-03"] }).completed.length, 0, "redesigned rules challenges do not inherit completion from previous task IDs");

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
assert.equal(shapeTasks.length, 9, "the shape area contains nine progressive challenges");
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
assert.ok(activity.includes("function arrowOrderVisual(task)") && activity.includes("function handleArrowOrderChoice(button)"), "colored arrows can be copied by clicking them in sequence");
assert.ok(activity.includes("function complexMatchVisual(task)") && activity.includes("function irregularCompositionHTML(layers)"), "irregular nested compositions have a dedicated visual renderer");
assert.ok(activity.includes("function arrowSequenceMatchVisual(task)") && activity.includes("task.kind === \"arrow-sequence-match\""), "complete arrow paths can be compared as alternatives");
assert.ok(activity.includes('target.closest("[data-arrow-choice-id]")'), "arrow order interaction uses delegated button input");
assert.ok(activity.includes("function numberPathVisual(task)") && activity.includes("function setupNumberPath(task)"), "the 3 by 3 number path has a dedicated renderer and drag controller");
assert.ok(activity.includes("function frogJumpVisual(task)") && activity.includes("function playFrogJumps(task)"), "frog jumps have a visual renderer and timed animation");
assert.ok(activity.includes("function additionSeriesVisual(task)") && activity.includes("additionSeriesStep += 1"), "addition series advances after each correct answer");
assert.ok(activity.includes("function missingAddendVisual(task)"), "missing addend has a dedicated visual equation renderer");
assert.ok(activity.includes("function fishCrabCountVisual(task)"), "fish counting differentiates fish from crabs");
assert.ok(activity.includes("function applePaintVisual(task)") && activity.includes("function handleApplePaint(button)"), "apple counting requires painting each apple by touch");
assert.ok(activity.includes("function doubleCountdownVisual(task)") && activity.includes("countdownStep += 1"), "countdown asks for the two missing numbers sequentially");
assert.ok(activity.includes("Array.isArray(task.terms)"), "calculation renderer supports three or more addends");
assert.ok(activity.includes("function nestedLayersHTML(layers)") && activity.includes("function nestedShapeVisual(task)"), "nested shape matching renders multiple inner layers");
assert.ok(activity.includes("function shapeColorChoiceVisual(task)") && activity.includes("shape-color-options"), "the fourteen colored shapes have a dedicated choice grid");
assert.ok(activity.includes("function setupShapeSorting(task)") && activity.includes('root.addEventListener("pointerdown"') && activity.includes('root.addEventListener("pointerup"'), "shape classification supports pointer drag and drop");
assert.ok(activity.includes('document.elementFromPoint(event.clientX, event.clientY)'), "shape sorting detects the drop target under the pointer");
console.log("OK: seven worlds, 41 visual challenges, colors, shapes, numbers, rules, positions, proportions, letters, sound and progress");
