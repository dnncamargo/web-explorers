import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function findBrowser() {
  const candidates = [
    process.env.WEB_EXPLORERS_BROWSER,
    process.env.EDGE_BIN,
    process.env.CHROME_BIN,
    process.platform === "win32" ? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" : null,
    process.platform === "win32" ? "C:/Program Files/Microsoft/Edge/Application/msedge.exe" : null,
    process.platform === "win32" ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : null,
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      if (candidate.includes("/") || candidate.includes("\\")) {
        if (spawnSync(process.platform === "win32" ? "where.exe" : "which", [candidate], { stdio: "ignore" }).status === 0 || candidate.toLowerCase().endsWith(".exe")) return candidate;
      }
    } catch { /* try the next installed browser */ }
  }
  for (const name of ["msedge", "microsoft-edge", "google-chrome", "chromium", "chromium-browser"]) {
    try {
      const found = spawnSync(process.platform === "win32" ? "where.exe" : "which", [name], { encoding: "utf8" });
      if (found.status === 0) return found.stdout.trim().split(/\r?\n/)[0];
    } catch { /* try the next installed browser */ }
  }
  return null;
}

const browserPath = findBrowser();
if (!browserPath) {
  console.error("SKIP: Chromium/Edge was not found. Set WEB_EXPLORERS_BROWSER to run browser checks.");
  process.exitCode = 2;
} else {
  const screenshotDir = process.env.WEB_EXPLORERS_SCREENSHOT_DIR;
  const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".mp3": "audio/mpeg" };
  const missing = [];
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
      const file = path.resolve(repoRoot, `.${pathname}`);
      if (file !== repoRoot && !file.startsWith(`${repoRoot}${path.sep}`)) throw new Error("outside repository");
      const body = await fs.readFile(file);
      response.writeHead(200, { "content-type": types[path.extname(file).toLowerCase()] || "application/octet-stream", "cache-control": "no-store" });
      response.end(body);
    } catch {
      const pathname = new URL(request.url, "http://localhost").pathname;
      if (pathname !== "/favicon.ico") missing.push(pathname);
      response.writeHead(404);
      response.end("Not found");
    }
  });

  let browser;
  let cdp;
  let baseUrl;
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), "web-explorers-browser-"));

  function connectCdp(url) {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url);
      let commandId = 0;
      const pending = new Map();
      const listeners = new Map();
      let client;
      const failAll = (error) => {
        for (const item of pending.values()) item.reject(error);
        pending.clear();
      };
      socket.addEventListener("open", () => resolve(client = {
        send(method, params = {}) {
          const id = ++commandId;
          return new Promise((res, rej) => {
            pending.set(id, { resolve: res, reject: rej });
            socket.send(JSON.stringify({ id, method, params }));
          });
        },
        waitFor(method, timeout = 20000) {
          return new Promise((res, rej) => {
            const timer = setTimeout(() => rej(new Error(`Timed out waiting for ${method}`)), timeout);
            const handlers = listeners.get(method) || [];
            handlers.push((event) => { clearTimeout(timer); res(event); });
            listeners.set(method, handlers);
          });
        },
        close() { socket.close(); },
        async evaluate(expression) {
          const result = await client.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
          if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Browser evaluation failed");
          return result.result?.value;
        },
      }));
      socket.addEventListener("message", ({ data }) => {
        const message = JSON.parse(data);
        if (message.id && pending.has(message.id)) {
          const item = pending.get(message.id);
          pending.delete(message.id);
          if (message.error) item.reject(new Error(message.error.message));
          else item.resolve(message.result || {});
        }
        if (message.method) for (const callback of listeners.get(message.method) || []) callback(message.params || {});
        if (message.method) listeners.set(message.method, []);
      });
      socket.addEventListener("error", () => failAll(new Error("DevTools WebSocket failed")));
      socket.addEventListener("close", () => failAll(new Error("DevTools WebSocket closed")));
      socket.addEventListener("error", reject, { once: true });
    });
  }

  async function evaluate(expression) { return cdp.evaluate(expression); }
  async function saveCatalogScreenshot(width) {
    if (!screenshotDir) return;
    await fs.mkdir(screenshotDir, { recursive: true });
    const result = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, fromSurface: true });
    const target = path.join(screenshotDir, `web-explorers-menu-${width}px.png`);
    await fs.writeFile(target, Buffer.from(result.data, "base64"));
    return target;
  }
  async function waitForPath(pathname) {
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) {
      const current = await evaluate("location.pathname");
      if (current === pathname) return;
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    throw new Error(`Browser did not reach ${pathname}; current path: ${await evaluate("location.pathname")}`);
  }
  async function navigate(url, pathname) {
    const loaded = cdp.waitFor("Page.loadEventFired");
    await cdp.send("Page.navigate", { url });
    await loaded;
    await waitForPath(pathname);
  }
  async function clickAndWait(selector, pathname) {
    const found = await evaluate(`(()=>{const element=document.querySelector(${JSON.stringify(selector)});if(!element)return false;element.click();return true})()`);
    assert.equal(found, true, `browser found ${selector}`);
    await waitForPath(pathname);
  }
  async function responsiveCatalog(width) {
    await cdp.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await navigate(`${baseUrl}index.html?viewport=${width}`, "/index.html");
    const result = await evaluate(`(()=>({width:innerWidth,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,cards:[...document.querySelectorAll('.activity-card')].map(a=>({href:a.getAttribute('href'),left:a.getBoundingClientRect().left,right:a.getBoundingClientRect().right}))}))()`);
    assert.equal(result.scrollWidth, result.clientWidth, `${width}px catalog has no horizontal overflow: ${JSON.stringify(result)}`);
    assert.deepEqual(result.cards.map(({ href }) => href), ["activities/digital-explorers/index.html", "activities/yoshi-typing/index.html", "activities/donkey-kong/index.html"], `${width}px catalog lists all three independent activities`);
    for (const card of result.cards) assert.ok(card.left >= 0 && card.right <= result.clientWidth, `${width}px activity card stays within the viewport`);
    if (width === 390 || width === 1366) await saveCatalogScreenshot(width);
  }

  try {
    await new Promise((resolve, reject) => server.listen(0, "127.0.0.1", resolve).once("error", reject));
    baseUrl = `http://127.0.0.1:${server.address().port}/`;
    browser = spawn(browserPath, ["--headless=new", "--disable-gpu", "--no-first-run", `--user-data-dir=${profile}`, "--remote-debugging-port=0", "about:blank"], { stdio: "ignore" });
    const activePortFile = path.join(profile, "DevToolsActivePort");
    let activePort;
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
      try { activePort = (await fs.readFile(activePortFile, "utf8")).split(/\r?\n/); break; }
      catch { await new Promise((resolve) => setTimeout(resolve, 100)); }
    }
    assert.ok(activePort?.[0], "Chromium/Edge opened its DevTools endpoint");
    const targets = await (await fetch(`http://127.0.0.1:${activePort[0]}/json/list`)).json();
    const page = targets.find((target) => target.type === "page");
    assert.ok(page?.webSocketDebuggerUrl, "Chromium/Edge exposed a page target");
    cdp = await connectCdp(page.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    for (const width of [320, 390, 768, 1366]) await responsiveCatalog(width);
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1366, height: 1000, deviceScaleFactor: 1, mobile: false });

    // The main catalog opens the activity entry, which redirects to its first canonical stage.
    await navigate(`${baseUrl}index.html`, "/index.html");
    await clickAndWait('.activity-card[href="activities/digital-explorers/index.html"]', "/activities/digital-explorers/stages/01-overworld.html");
    assert.match(await evaluate("document.title"), /Mundo 1/);
    assert.equal(await evaluate(`document.querySelector('.map-image')?.complete && document.querySelector('.map-image')?.naturalWidth > 0`), true, "the moved first-stage map image loads");
    assert.ok((await evaluate(`document.querySelector('#worldMusic').src`)).includes("/activities/digital-explorers/assets/audio/stage-1-theme.mp3"), "the first-stage audio points at the moved assets folder");

    // Simulate opening the downloaded classroom material and follow its next-stage button.
    await navigate(`${baseUrl}public/02-entrar-no-submundo.html`, "/public/02-entrar-no-submundo.html");
    await clickAndWait(".next", "/activities/digital-explorers/stages/02-submundo.html");
    assert.match(await evaluate("document.title"), /Mundo 2/);
    assert.equal(await evaluate(`document.querySelector('a.pipe-button')?.getAttribute('href')`), "03-water.html", "the Submundo exit uses a relative link to the Water stage");
    await evaluate(`document.getElementById('finish').hidden=false`);
    await clickAndWait("a.pipe-button", "/activities/digital-explorers/stages/03-water.html");
    assert.match(await evaluate("document.title"), /Fase da água/i);
    assert.equal(await evaluate(`document.querySelector('#startButton img')?.complete && document.querySelector('#startButton img')?.naturalWidth > 0`), true, "the moved Water-stage character image loads");

    for (const [route, titlePattern] of [
      ["stages/04-ghost-house.html", /Casa Fantasma/],
      ["stages/05-final-boss.html", /Final Boss/],
    ]) {
      await navigate(`${baseUrl}activities/digital-explorers/${route}`, `/activities/digital-explorers/${route}`);
      assert.match(await evaluate("document.title"), titlePattern);
    }
    await clickAndWait('a[href="game-complete.html"]', "/activities/digital-explorers/stages/game-complete.html");
    assert.match(await evaluate("document.title"), /Jogo concluído/);

    for (const [alias, stage] of [["index2.html", "02-submundo.html"], ["index3.html", "03-water.html"], ["index_final.html", "05-final-boss.html"]]) {
      await navigate(`${baseUrl}activities/digital-explorers/${alias}`, `/activities/digital-explorers/stages/${stage}`);
    }

    // The Yoshi entry remains independent and its back link now returns to the catalog.
    await navigate(`${baseUrl}index.html`, "/index.html");
    await clickAndWait('.activity-card[href="activities/yoshi-typing/index.html"]', "/activities/yoshi-typing/index.html");
    assert.match(await evaluate("document.title"), /Floresta do Yoshi/);
    await clickAndWait(".back-link", "/index.html");
    assert.match(await evaluate("document.title"), /Atividades/);

    // Donkey Kong remains independent and exposes its map and four activity routes.
    await clickAndWait('.activity-card[href="activities/donkey-kong/index.html"]', "/activities/donkey-kong/index.html");
    assert.match(await evaluate("document.title"), /Donkey Kong Country/);
    assert.equal(await evaluate('document.querySelectorAll("#world-map .world-card").length'), 4, "Donkey Kong map offers three worlds and the final boss");
    assert.equal(await evaluate('!!document.querySelector("#start-screen")'), true, "the Kong barrel entrance overlay is visible on the island map");
    assert.equal(await evaluate('!!document.querySelector("#start-button")'), true, "the barrel entrance control is available");
    assert.equal(await evaluate('document.querySelectorAll("#world-map .world-card-art").length'), 3, "the map world cards include game character art");
    for (const [route, titlePattern, selector] of [
      ["jungle.html", /Selva dos Kongs/, "#typing-input"],
      ["mine.html", /Mina dos Barris/, "#sequence-input"],
      ["camp.html", /Acampamento dos Kongs/, "#native-edit-input"],
      ["king-k-rool.html", /King K. Rool/, "#poem-editor"],
    ]) {
      await navigate(baseUrl + "activities/donkey-kong/" + route, "/activities/donkey-kong/" + route);
      assert.match(await evaluate("document.title"), titlePattern);
      if (route !== "king-k-rool.html") {
        const expectedTheme = route === "jungle.html" ? "world-theme-jungle" : route === "mine.html" ? "world-theme-mine" : "world-theme-camp";
        assert.equal(await evaluate('document.body.classList.contains(' + JSON.stringify(expectedTheme) + ')'), true, route + " applies its distinct visual theme");
        assert.ok(await evaluate('!!document.querySelector("#world-character-art img")'), route + " renders character artwork in the hero");
        assert.ok(await evaluate('!!document.querySelector("body[data-page=world]")'), route + " keeps the game-stage background context");
      }
      if (route === "king-k-rool.html") {
        assert.equal(await evaluate('!!document.querySelector("#poem-editor")'), true, "the final poem editor renders");
        assert.equal(await evaluate('!!document.querySelector("#reset-boss")'), true, "the final poem mission offers an activity reset");
      } else {
        assert.equal(await evaluate('!!document.querySelector("#reset-world")'), true, route + " world guide offers a full-world reset");
        await evaluate('document.querySelector("#start-world")?.click()');
        assert.equal(await evaluate('!!document.querySelector(' + JSON.stringify(selector) + ')'), true, route + " opens its expected exercise control");
        assert.equal(await evaluate('!!document.querySelector("#reset-activity")'), true, route + " checkpoint offers an activity reset");
        assert.equal(await evaluate('document.querySelector("#check-action").hidden'), true, route + " advances without a Conferir etapa button");
        if (route === "mine.html") {
          assert.equal(await evaluate('document.querySelectorAll(".mine-keyboard").length'), 1, "Mine displays the World 1-style restricted ABNT2 keyboard");
          assert.equal(await evaluate('document.querySelectorAll(".mine-keyboard .keycap-shift").length'), 2, "Mine shows left and right Shift keys");
          assert.equal(await evaluate('!!document.querySelector(".mine-keyboard [data-key=acute]")'), true, "the acute key is shown beside P");
          assert.equal(await evaluate('!!document.querySelector(".mine-keyboard [data-key=tilde]")'), true, "the tilde/circumflex key is shown beside Ç");
          assert.equal(await evaluate('!!document.querySelector(".mine-keyboard [data-key=space]")'), true, "the space bar is shown");
          assert.equal(await evaluate('!!document.querySelector(".mine-keyboard [data-key=q]")'), false, "unused letter keys are omitted from the Mine keyboard");
          await evaluate('(() => { const field = document.querySelector("#sequence-input"); field.value = "banana"; field.dispatchEvent(new Event("input", { bubbles: true })); })()');
          assert.equal(await evaluate('document.querySelector("#sequence-target").textContent.replace(/\\s+/g,"").startsWith("BANANA")'), true, "the next Mine sequence is the uppercase form");
          assert.equal(await evaluate('!!document.querySelector(".mine-keyboard [data-key=b].is-next")'), true, "the current letter key is highlighted");
          assert.equal(await evaluate('!!document.querySelector(".mine-keyboard [data-key=right-shift].is-next")'), true, "the paired upward Shift arrow lights with an uppercase letter");
        }
        if (route === "jungle.html") {
          await evaluate('(() => { const field = document.querySelector("#typing-input"); field.value = "A"; field.dispatchEvent(new Event("input", { bubbles: true })); document.querySelector("#reset-activity").click(); })()');
          assert.equal(await evaluate('document.querySelector("#typing-input")?.value'), "", "activity reset clears only the current typing attempt");
        }
      }
    }

    assert.deepEqual(missing, [], `browser requested only existing local files: ${missing.join(", ")}`);
    console.log("OK: Chromium/Edge navigated from the catalog to World 1, Submundo material, World 2, Water, Ghost House, Final Boss and completion");
    console.log("OK: activity aliases redirect correctly; Yoshi and Donkey Kong open from the root catalog");
    console.log("OK: catalog fits 320, 390, 768 and 1366 px; existing and Donkey Kong local activity paths load");
    if (screenshotDir) console.log(`Menu screenshots: ${path.join(screenshotDir, "web-explorers-menu-390px.png")}, ${path.join(screenshotDir, "web-explorers-menu-1366px.png")}`);
  } finally {
    cdp?.close();
    browser?.kill();
    await new Promise((resolve) => server.close(resolve));
  }
}
