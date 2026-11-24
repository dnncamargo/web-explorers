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

const catalog = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert.ok(catalog.includes('href="activities/capi-logica/index.html"'), "the catalog opens Capi Logic Games");
assert.equal([...catalog.matchAll(/class="activity-card(?:\s|")/g)].length, 5, "the catalog lists five independent activities");
console.log("OK: Capi Logic activity files, script order, painter configuration, responsive CSS and catalog route");
