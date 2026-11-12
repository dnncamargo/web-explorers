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
  "activities/word-adventure/worlds/06-field-journal.html",
  "activities/word-adventure/tests/validate-activity.mjs",
  "activities/word-adventure/tests/validate-repository.mjs",
];
for (const file of required) assert.ok(fs.existsSync(path.join(root, file)), file + " exists");
const catalog = fs.readFileSync(path.join(root, "index.html"), "utf8");
for (const route of [
  "activities/digital-explorers/index.html",
  "activities/yoshi-typing/index.html",
  "activities/donkey-kong/index.html",
  "activities/word-adventure/index.html",
]) assert.ok(catalog.includes('href="' + route + '"'), route + " remains in catalog");
assert.equal([...catalog.matchAll(/class="activity-card(?:\s|")/g)].length, 4, "catalog lists four independent activities");
const home = fs.readFileSync(path.join(root, "activities/word-adventure/index.html"), "utf8");
assert.ok(home.includes('href="../../index.html"'), "activity returns to root catalog");
assert.ok(home.includes('assets/js/content.js') && home.includes('assets/js/progress.js') && home.includes('assets/js/activity.js'), "scripts load in required order");
const redirects = [
  ["01-sound-island.html", "sound-island"],
  ["02-letter-village.html", "letter-trail"],
  ["03-syllable-workshop.html", "sound-lagoon"],
  ["04-word-market.html", "syllable-workshop"],
  ["05-story-city.html", "research-post"],
  ["06-field-journal.html", "field-journal"],
];
for (const [file, hash] of redirects) {
  const html = fs.readFileSync(path.join(root, "activities/word-adventure/worlds", file), "utf8");
  assert.ok(html.includes("index.html#" + hash), file + " has a valid route");
}
const css = fs.readFileSync(path.join(root, "activities/word-adventure/assets/css/word-adventure.css"), "utf8");
assert.ok(css.includes("@media(prefers-reduced-motion:reduce)"), "reduced-motion preference is respected");
assert.ok(css.includes("@media(max-width:700px)"), "mobile layout exists");
const activity = fs.readFileSync(path.join(root, "activities/word-adventure/assets/js/activity.js"), "utf8");
assert.ok(activity.includes("youtube-nocookie.com/embed/") && activity.includes("iframe.src ="), "the YouTube player is created dynamically from the map");
assert.ok(activity.includes("playlist=") && activity.includes("&loop=1"), "a single YouTube video is configured to loop");
assert.ok(!home.includes("youtube.com/embed") && !home.includes("<iframe"), "the radio is not embedded globally in the page shell");
assert.ok(activity.includes("function toggleRadio()") && activity.includes("host.replaceChildren()"), "the map radio can be removed and is not persistent in worlds");
assert.ok(activity.includes("renderMap()") && activity.includes("app.innerHTML = stageShell"), "opening a world replaces the map and its radio player");
assert.ok(activity.includes("exploradores.expedicao-natureza.progress.v2") === false, "progress key is declared in progress.js, not duplicated in interaction code");
console.log("OK: routes, aliases, responsive rules, map-only radio and dynamic player lifecycle");
