import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const required = [
  "activities/capi-logica/index.html",
  "activities/capi-logica/assets/css/capi-logica.css",
  "activities/capi-logica/assets/js/config.js",
  "activities/capi-logica/assets/js/games.js",
  "activities/capi-logica/assets/js/progress.js",
  "activities/capi-logica/assets/js/activity.js",
  "activities/capi-logica/assets/images/capi-pintora.svg",
  "activities/capi-logica/tests/validate-activity.mjs",
  "docs/activities/capi-logica-plan.md"
];
for (const file of required) assert.ok(fs.existsSync(path.join(root, file)), file + " exists");

const home = fs.readFileSync(path.join(root, "activities/capi-logica/index.html"), "utf8");
assert.ok(home.includes("assets/js/config.js") && home.includes("assets/js/games.js") && home.includes("assets/js/progress.js") && home.includes("assets/js/activity.js"), "configuration, games, progress and activity scripts are loaded");
assert.ok(home.includes("aria-label") && home.includes('id="app"'), "the activity has an accessible application region");

const config = fs.readFileSync(path.join(root, "activities/capi-logica/assets/js/config.js"), "utf8");
assert.ok(config.includes('painterUrl: ""'), "the hosted Capi Painter URL can be configured later");

const css = fs.readFileSync(path.join(root, "activities/capi-logica/assets/css/capi-logica.css"), "utf8");
assert.ok(css.includes("prefers-reduced-motion") && css.includes("@media(max-width:700px)"), "reduced motion and compact screens are supported");
assert.ok(css.includes(".paint-layout") && css.includes(".paint-sidebar") && css.includes("@media(max-width:560px)"), "paint palettes sit beside the drawing on wide screens and adapt on narrow screens");
assert.ok(css.includes(".shape-glyph") && css.includes(".shape-target .token-shape .shape-glyph"), "geometric shape glyphs are centered inside their tiles");
assert.ok(css.includes(".nested-shape-layer") && css.includes(".nested-options"), "nested shape layers have dedicated composition styles");
assert.ok(css.includes(".shape-color-options{display:grid;grid-template-columns:repeat(7") && css.includes(".shape-color-option"), "fourteen colored alternatives render in two rows of seven");
assert.ok(css.includes(".sort-zones") && css.includes(".sort-zone.is-hovered") && css.includes(".sort-drag-ghost"), "shape sorting has draggable items and visible drop zones");
assert.ok(css.includes(".polygon-point.is-next") && css.includes(".polygon-face.happy") && css.includes(".polygon-face.sad") && css.includes("transform:scale(1.5)"), "the guided polygon game enlarges the next point and shows proximity feedback");
assert.ok(css.includes(".nested-shape-layer") && css.includes(".nested-options"), "nested-shape challenge has multiple centered layers");
assert.ok(css.includes(".shape-color-options{display:grid;grid-template-columns:repeat(7") && css.includes(".shape-color-option"), "the fourteen color-shape alternatives fit two rows");
assert.ok(css.includes(".sort-zones") && css.includes(".sort-zone.is-hovered") && css.includes(".sort-drag-ghost"), "drag sorting has clear drop zones and dragging feedback");
assert.ok(css.includes(".frog-stage") && css.includes("@keyframes frog-hop"), "frog counting uses a visible hop animation");
assert.ok(css.includes(".addition-series") && css.includes(".addition-step-dot"), "incremental addition shows a nine-step progress strip");
assert.ok(css.includes(".number-path-svg") && css.includes(".number-path-dot.is-next"), "the numeric 3 by 3 path highlights its next point");
assert.ok(css.includes(".arrow-reference-row") && css.includes(".arrow-choice-grid") && css.includes(".arrow-visual"), "arrow order games have prominent colored reference arrows and selectable arrows");
assert.ok(css.includes(".complex-match-options") && css.includes(".irregular-composition"), "irregular nested compositions have comparison cards");
assert.ok(css.includes(".arrow-sequence-options") && css.includes(".sequence-match-arrow"), "diagonal arrow paths have larger comparison alternatives");
assert.ok(css.includes(".fish-count-group") && css.includes(".fish-count-target"), "fish counting visually identifies fish and distractor crabs");
assert.ok(css.includes(".apple-paint-grid") && css.includes(".apple-paint-answer"), "apple painting displays clickable apples and a final counting question");
assert.ok(css.includes(".double-countdown-game") && css.includes(".countdown-number.missing.active"), "double countdown highlights only the current missing position");
assert.ok(css.includes(".triple-math-row"), "three-group addition has a dedicated responsive layout");

const catalog = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert.ok(catalog.includes('href="activities/capi-logica/index.html"'), "the catalog opens Capi Logic Games");
assert.equal([...catalog.matchAll(/class="activity-card(?:\s|")/g)].length, 5, "the catalog lists five independent activities");
console.log("OK: Capi Logic activity files, script order, painter configuration, responsive CSS and catalog route");
