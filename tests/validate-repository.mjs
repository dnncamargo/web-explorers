import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function listFiles(directory, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) listFiles(target, output);
    else output.push(target);
  }
  return output;
}

const files = listFiles(root);
const relative = (file) => path.relative(root, file).replaceAll(path.sep, "/");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const htmlFiles = files.filter((file) => file.endsWith(".html"));
const cssFiles = files.filter((file) => file.endsWith(".css"));
const errors = [];

function checkLocalReference(sourceFile, reference, label) {
  const value = reference.trim();
  if (!value || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value) || value.includes("${")) return;
  const cleanValue = decodeURIComponent(value.split(/[?#]/, 1)[0]);
  const target = path.resolve(path.dirname(sourceFile), cleanValue);
  if (!target.startsWith(`${root}${path.sep}`) && target !== root) {
    errors.push(`${relative(sourceFile)} ${label} escapes the repository: ${value}`);
  } else if (!fs.existsSync(target)) {
    errors.push(`${relative(sourceFile)} ${label} does not resolve: ${value}`);
  }
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  for (const match of html.matchAll(/<[a-z][\w:-]*\b[^>]*?\b(href|src|action|formaction|poster|xlink:href)\s*=\s*(["'])(.*?)\2[^>]*>/gis)) {
    checkLocalReference(file, match[3], match[1]);
  }
  for (const match of html.matchAll(/<meta\b[^>]*http-equiv\s*=\s*["']refresh["'][^>]*content\s*=\s*["'][^"']*?url\s*=\s*([^;"']+)/gi)) {
    checkLocalReference(file, match[1], "meta refresh");
  }
  for (const style of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    for (const match of style[1].matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
      checkLocalReference(file, match[1], "CSS url()");
    }
  }
}

for (const file of cssFiles) {
  const css = fs.readFileSync(file, "utf8");
  for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
    checkLocalReference(file, match[1], "CSS url()");
  }
}

const readme = read("README.md");
for (const match of readme.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
  checkLocalReference(path.join(root, "README.md"), match[1], "README link");
}

assert.deepEqual(errors, [], `local references resolve:\n${errors.join("\n")}`);

for (const target of [
  "activities/digital-explorers/index.html",
  "activities/digital-explorers/assets/js/main.js",
  "activities/digital-explorers/stages/01-overworld.html",
  "activities/digital-explorers/stages/02-submundo.html",
  "activities/digital-explorers/stages/03-water.html",
  "activities/digital-explorers/stages/04-ghost-house.html",
  "activities/digital-explorers/stages/05-final-boss.html",
  "activities/digital-explorers/stages/game-complete.html",
  "public/02-entrar-no-submundo.html",
  "public/flower.png",
  "activities/yoshi-typing/index.html",
]) assert.ok(fs.existsSync(path.join(root, target)), `${target} exists`);

for (const obsolete of ["assets", "stages", "index2.html", "index3.html", "index_final.html", "02-entrar-no-submundo.html"]) {
  assert.equal(fs.existsSync(path.join(root, obsolete)), false, `${obsolete} no longer occupies its former root path`);
}

const menu = read("index.html");
assert.ok(menu.includes('href="activities/digital-explorers/index.html"'), "the catalog opens the first activity's entry page");
assert.ok(menu.includes('href="activities/yoshi-typing/index.html"'), "the catalog opens the Yoshi activity's entry page");
assert.equal([...menu.matchAll(/class="activity-card(?:\s|"?)/g)].length, 2, "the catalog lists only the two existing activities");

const digitalRoot = "activities/digital-explorers";
const routes = new Map([
  ["index.html", "01-overworld.html"],
  ["index2.html", "02-submundo.html"],
  ["index3.html", "03-water.html"],
  ["index_final.html", "05-final-boss.html"],
]);
for (const [alias, stage] of routes) {
  const html = read(`${digitalRoot}/${alias}`);
  const target = `stages/${stage}`;
  assert.ok(html.includes(`url=${target}`), `${alias} auto-redirects to ${target}`);
  assert.ok(html.includes(`href="${target}"`), `${alias} has a manual fallback to ${target}`);
}

const movedEntry = read(`${digitalRoot}/index.html`);
assert.ok(movedEntry.includes('rel="canonical" href="stages/01-overworld.html"'), "the first activity entry identifies its canonical first stage");
assert.ok(read(`${digitalRoot}/stages/04-final-boss.html`).includes('href="05-final-boss.html"'), "the internal Final Boss compatibility page remains intact");
assert.ok(read(`${digitalRoot}/stages/05-final-boss.html`).includes('href="game-complete.html"'), "the final phase still opens the completion page");
assert.ok(read(`${digitalRoot}/stages/02-submundo.html`).includes('href="03-water.html"'), "Submundo advances to the neighboring Water stage by a relative link");
assert.ok(read("public/02-entrar-no-submundo.html").includes('href="../activities/digital-explorers/stages/02-submundo.html"'), "the public download material advances to the canonical Submundo stage");
assert.ok(!files.some((file) => /dnncamargo\.github\.io\/web-explorers\/(?:index2\.html|stages\/03-water\.html)/.test(fs.readFileSync(file, "utf8"))), "obsolete absolute GitHub Pages routes are removed");

const yoshiHome = read("activities/yoshi-typing/index.html");
assert.ok(yoshiHome.includes('href="../../index.html"'), "Yoshi's return link opens the new root catalog");
assert.ok(read("activities/yoshi-typing/tests/validate-activity.mjs").includes("assets/js/world-data.js"), "the independent Yoshi validation suite remains in place");

console.log(`OK: ${htmlFiles.length} HTML pages and ${cssFiles.length} stylesheets have valid local references`);
console.log("OK: root catalog, activity entry points, stage redirects, Submundo material, and Yoshi return route");
