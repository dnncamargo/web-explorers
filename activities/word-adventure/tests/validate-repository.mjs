import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const required = [
  "activities/word-adventure/index.html",
  "activities/word-adventure/assets/css/word-adventure.css",
  "activities/word-adventure/assets/js/content.js",
  "activities/word-adventure/assets/js/progress.js",
  "activities/word-adventure/assets/js/activity.js",
  "activities/word-adventure/worlds/01-sound-island.html",
  "activities/word-adventure/worlds/02-letter-village.html",
  "activities/word-adventure/worlds/03-syllable-workshop.html",
  "activities/word-adventure/worlds/04-word-market.html",
  "activities/word-adventure/worlds/05-story-city.html",
  "activities/word-adventure/tests/validate-activity.mjs",
];
for (const file of required) assert.ok(fs.existsSync(path.join(root,file)), file + " exists");
const catalog = fs.readFileSync(path.join(root,"index.html"),"utf8");
for (const route of [
  "activities/digital-explorers/index.html",
  "activities/yoshi-typing/index.html",
  "activities/donkey-kong/index.html",
  "activities/word-adventure/index.html",
]) assert.ok(catalog.includes('href="' + route + '"'), route + " remains in catalog");
assert.equal([...catalog.matchAll(/class="activity-card(?:\s|")/g)].length,4,"catalog lists four independent activities");
const home = fs.readFileSync(path.join(root,"activities/word-adventure/index.html"),"utf8");
assert.ok(home.includes('href="../../index.html"'),"activity returns to root catalog");
assert.ok(home.includes('assets/js/content.js') && home.includes('assets/js/progress.js') && home.includes('assets/js/activity.js'),"scripts load in required order");
for (const [file, hash] of [
  ["01-sound-island.html","sound-island"],
  ["02-letter-village.html","letter-village"],
  ["03-syllable-workshop.html","syllable-workshop"],
  ["04-word-market.html","word-market"],
  ["05-story-city.html","story-city"],
]) {
  const html = fs.readFileSync(path.join(root,"activities/word-adventure/worlds",file),"utf8");
  assert.ok(html.includes("index.html#" + hash), file + " has a manual path to canonical world");
}
const css = fs.readFileSync(path.join(root,"activities/word-adventure/assets/css/word-adventure.css"),"utf8");
assert.ok(css.includes("@media(prefers-reduced-motion:reduce)"),"reduced-motion preference is respected");
assert.ok(css.includes("@media(max-width:650px)"),"mobile layout exists");
console.log("OK: activity files, catalog preservation, world routes and responsive/accessibility rules");
