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

  async function pressKey(key, code, modifiers = 0) {
    const virtualCodes = { Enter:13, ArrowRight:39, Backspace:8, Delete:46, Home:36, End:35, Control:17, Shift:16, c:67, v:86, x:88, z:90, C:67, V:86, X:88, Z:90 };
    const params = {
      key,
      code,
      windowsVirtualKeyCode: virtualCodes[key] || 0,
      nativeVirtualKeyCode: virtualCodes[key] || 0,
      modifiers,
      text: key === "Enter" ? "\r" : key.length === 1 && !modifiers ? key : undefined
    };
    await cdp.send("Input.dispatchKeyEvent", { ...params, type: "keyDown" });
    await cdp.send("Input.dispatchKeyEvent", { ...params, type: "keyUp" });
  }
  async function waitForExpression(expression, label, timeout = 5000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (await evaluate(expression)) return;
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    throw new Error(`Timed out waiting for ${label}`);
  }
  async function textPoint(selector, offset) {
    await evaluate(`(()=>{const element=document.querySelector(${JSON.stringify(selector)});window.scrollTo(0,Math.max(0,element.getBoundingClientRect().top+window.scrollY-innerHeight/2))})()`);
    await new Promise((resolve) => setTimeout(resolve, 40));
    return evaluate(`(()=>{
      const field=document.querySelector(${JSON.stringify(selector)});
      const style=getComputedStyle(field);
      const canvas=document.createElement("canvas");
      const context=canvas.getContext("2d");
      context.font=style.font;
      const offset=${offset};
      const whole=Math.floor(offset);
      const prefix=field.value.slice(0,whole);
      const partial=(offset-whole)*context.measureText(field.value[whole]||"").width;
      const rect=field.getBoundingClientRect();
      const left=rect.left+field.clientLeft+parseFloat(style.paddingLeft);
      const top=rect.top+field.clientTop+parseFloat(style.paddingTop);
      return {x:left+context.measureText(prefix).width+partial,y:top+parseFloat(style.lineHeight)/2};
    })()`);
  }
  async function doubleClickText(selector, text) {
    const start = await evaluate(`document.querySelector(${JSON.stringify(selector)}).value.indexOf(${JSON.stringify(text)})`);
    assert.ok(start >= 0, `found ${text} in ${selector}`);
    const point = await textPoint(selector, start + 0.5);
    const hit = await evaluate(`(()=>{const element=document.elementFromPoint(${point.x},${point.y});return {matches:element===document.querySelector(${JSON.stringify(selector)}),tag:element?.tagName,id:element?.id,point:{x:${point.x},y:${point.y}},rect:(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()}})()`);
    assert.equal(hit.matches, true, `double-click coordinates land on the text field: ${JSON.stringify(hit)}`);
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", ...point });
    await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", clickCount: 1 });
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 1 });
    await new Promise((resolve) => setTimeout(resolve, 100));
    await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", clickCount: 2 });
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 2 });
  }
  async function clickText(selector, text) {
    const start = await evaluate(`document.querySelector(${JSON.stringify(selector)}).value.indexOf(${JSON.stringify(text)})`);
    assert.ok(start >= 0, `found ${text} in ${selector}`);
    const point = await textPoint(selector, start + 0.5);
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", ...point });
    await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", clickCount: 1 });
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 1 });
  }
  async function clickTextFieldStart(selector) {
    const point = await evaluate(`(()=>{const field=document.querySelector(${JSON.stringify(selector)});const r=field.getBoundingClientRect();return {x:r.left+field.clientLeft+18,y:r.top+field.clientTop+parseFloat(getComputedStyle(field).paddingTop)+12};})()`);
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", ...point });
    await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", clickCount: 1 });
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 1 });
  }
  async function dragText(selector, text, direction) {
    const start = await evaluate(`document.querySelector(${JSON.stringify(selector)}).value.indexOf(${JSON.stringify(text)})`);
    assert.ok(start >= 0, `found ${text} in ${selector}`);
    const first = await textPoint(selector, start + 0.1);
    const last = await textPoint(selector, start + text.length - 0.1);
    const from = direction === "reverse" ? last : first;
    const to = direction === "reverse" ? first : last;
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", ...from });
    await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", ...from, button: "left", clickCount: 1 });
    for (let step = 1; step <= 8; step += 1) {
      const point = { x: from.x + (to.x - from.x) * step / 8, y: from.y + (to.y - from.y) * step / 8 };
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", ...point, button: "left", buttons: 1 });
    }
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...to, button: "left", clickCount: 1 });
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
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1366, height: 1600, deviceScaleFactor: 1, mobile: false });

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
    assert.equal(await evaluate('document.querySelector("#world-map .boss-card h2")?.textContent'), "Desafio do Poema", "the final map tile is named Desafio do Poema");
    assert.equal(await evaluate('document.querySelector("#world-map .boss-card")?.getAttribute("href")'), "final-challenge.html", "the final map tile opens the renamed challenge page");
    assert.equal(await evaluate('document.querySelector("#world-map .boss-card .boss-card-art img")?.getAttribute("src")'), "https://static.wikia.nocookie.net/donkeykong/images/f/f5/Funky-Kong.gif/revision/latest?cb=20120711220651", "the final map tile includes the requested Funky Kong GIF");

    assert.equal(await evaluate('!!document.querySelector("#island-gif-panel img[data-game-art]")'), true, "the requested animated GIF is included in the Island of the Kongs page");
    for (const [route, titlePattern, selector] of [
      ["jungle.html", /Selva dos Kongs/, "#typing-input"],
      ["mine.html", /Mina dos Barris/, "#sequence-input"],
      ["camp.html", /Acampamento dos Kongs/, "#line-break-input"],
      ["final-challenge.html", /King K. Rool/, "#poem-editor"],
    ]) {
      await navigate(baseUrl + "activities/donkey-kong/" + route, "/activities/donkey-kong/" + route);
      assert.match(await evaluate("document.title"), titlePattern);
      if (route !== "final-challenge.html") {
        const expectedTheme = route === "jungle.html" ? "world-theme-jungle" : route === "mine.html" ? "world-theme-mine" : "world-theme-camp";
        assert.equal(await evaluate('document.body.classList.contains(' + JSON.stringify(expectedTheme) + ')'), true, route + " applies its distinct visual theme");
        assert.ok(await evaluate('!!document.querySelector("#world-character-art img")'), route + " renders character artwork in the hero");
        assert.ok(await evaluate('!!document.querySelector("body[data-page=world]")'), route + " keeps the game-stage background context");
      }
      if (route === "final-challenge.html") {
        assert.equal(await evaluate('!!document.querySelector("#poem-editor")'), true, "the final poem editor renders");
        assert.equal(await evaluate('!!document.querySelector("#reset-boss")'), true, "the final poem mission offers an activity reset");
      } else {
        assert.equal(await evaluate('!!document.querySelector("#reset-world")'), true, route + " world guide offers a full-world reset");
        await evaluate('document.querySelector("#start-world")?.click()');
        assert.equal(await evaluate('!!document.querySelector(' + JSON.stringify(selector) + ')'), true, route + " opens its expected exercise control");
        assert.equal(await evaluate('!!document.querySelector("#reset-activity")'), true, route + " checkpoint offers an activity reset");
        assert.equal(await evaluate('document.querySelector("#check-action").hidden'), true, route + " advances without a Conferir etapa button");
        if (route === "mine.html") {
          assert.equal(await evaluate('document.querySelectorAll(".mine-keyboard").length'), 1, "Mine displays the complete World 1-style ABNT2 keyboard");
          assert.equal(await evaluate('document.querySelector("#sequence-tip")?.tagName'), "SPAN", "Mine renders a live span for changing typing tips");
          assert.equal(await evaluate('document.querySelector("#sequence-tip")?.textContent'), "Pressione a letra B sem segurar Shift.", "the live tip explains the current lowercase key");
          assert.equal(await evaluate('document.querySelectorAll(".mine-keyboard .keycap-shift").length'), 2, "Mine shows left and right Shift keys");
          assert.equal(await evaluate('document.querySelectorAll(".mine-keyboard .number-row .keycap").length'), 14, "the number row includes quote, ten digits, minus, equals and Backspace");
          assert.equal(await evaluate('Array.from("qwertyuiopasdfghjklçzxcvbnm").every((key) => !!Array.from(document.querySelectorAll(".mine-keyboard [data-key]")).find((item) => item.dataset.key === key))'), true, "all letters and Ç are displayed");
          assert.equal(await evaluate('!!document.querySelector(".mine-keyboard [data-key=acute]")'), true, "the acute key is shown beside P");
          assert.equal(await evaluate('!!document.querySelector(".mine-keyboard [data-key=tilde]")'), true, "the tilde/circumflex key is shown beside Ç");
          assert.equal(await evaluate('!!document.querySelector(".mine-keyboard [data-key=space]")'), true, "the space bar is shown");
          assert.equal(await evaluate('Array.from(document.querySelectorAll(".mine-keyboard [data-key]")).find((key) => key.dataset.key === "2")?.querySelector(".mine-keycap-shift")?.textContent'), "@", "the 2 key shows the at symbol");
          assert.equal(await evaluate('Array.from(document.querySelectorAll(".mine-keyboard [data-key]")).find((key) => key.dataset.key === "3")?.querySelector(".mine-keycap-shift")?.textContent'), "#", "the 3 key shows the number sign");
          assert.equal(await evaluate('Array.from(document.querySelectorAll(".mine-keyboard [data-key]")).find((key) => key.dataset.key === "6")?.querySelector(".mine-keycap-shift")?.textContent'), "¨", "the 6 key shows the diaeresis");
          assert.equal(await evaluate('Array.from(document.querySelectorAll(".mine-keyboard [data-key]")).find((key) => key.dataset.key === "7")?.querySelector(".mine-keycap-shift")?.textContent'), "&", "the 7 key shows the ampersand");
          assert.equal(await evaluate('Array.from(document.querySelectorAll(".mine-keyboard [data-key]")).find((key) => key.dataset.key === "=")?.querySelector(".mine-keycap-shift")?.textContent'), "+", "the equals key shows the plus symbol");
          await evaluate('(() => { const field = document.querySelector("#sequence-input"); field.value = "banana"; field.dispatchEvent(new Event("input", { bubbles: true })); })()');
          assert.equal(await evaluate('document.querySelector("#sequence-target").textContent.replace(/\\s+/g,"").startsWith("BANANA")'), true, "the next Mine sequence is the uppercase form");
          assert.equal(await evaluate('!!document.querySelector(".mine-keyboard [data-key=b].is-next")'), true, "the current letter key is highlighted");
          assert.equal(await evaluate('!!document.querySelector(".mine-keyboard [data-key=shift-left].is-next")'), true, "the left Shift arrow lights with uppercase letters");
          assert.equal(await evaluate('!!document.querySelector(".mine-keyboard [data-key=shift-right].is-next")'), true, "the right Shift arrow lights with uppercase letters");
          await evaluate('(() => { const field = document.querySelector("#sequence-input"); field.value = "BANANX"; field.dispatchEvent(new Event("input", { bubbles: true })); })()');
          assert.equal(await evaluate('!!document.querySelector(".mine-keyboard [data-key=backspace].is-next")'), true, "Backspace lights while the text has an incorrect suffix");
          assert.equal(await evaluate('document.querySelector("#sequence-tip")?.textContent.includes("Backspace")'), true, "the live tip tells the student to correct the text with Backspace");
          await evaluate('(() => { const field = document.querySelector("#sequence-input"); field.value = "BANAN"; field.dispatchEvent(new Event("input", { bubbles: true })); })()');
          assert.equal(await evaluate('!!document.querySelector(".mine-keyboard [data-key=backspace].is-next")'), false, "Backspace highlight turns off when the text returns to a correct prefix");
          assert.equal(await evaluate('document.querySelector("#sequence-tip")?.textContent'), "Segure a tecla Shift, mantenha-a pressionada e pressione A.", "the live tip advances to the next uppercase letter");
          await evaluate('(() => { const field = document.querySelector("#sequence-input"); field.value = "BANANA"; field.dispatchEvent(new Event("input", { bubbles: true })); })()');
          await evaluate('(() => { const field = document.querySelector("#sequence-input"); field.value = "Barril"; field.dispatchEvent(new Event("input", { bubbles: true })); })()');
          await evaluate('(() => { const field = document.querySelector("#sequence-input"); field.value = "CROCODILO"; field.dispatchEvent(new Event("input", { bubbles: true })); })()');
          await evaluate('(() => { const field = document.querySelector("#sequence-input"); field.value = "Rinoceronte"; field.dispatchEvent(new Event("input", { bubbles: true })); })()');
          assert.equal(await evaluate('document.querySelector("#sequence-tip")?.textContent'), "Segure a tecla shift, mantenha-a pressionada e pressione O.", "the first O in the sentence gets the requested Shift instruction");
        }
        if (route === "camp.html") {
          assert.equal(await evaluate('!!document.querySelector("#line-break-input")'), true, "Camp checkpoint one opens the line-break exercise");
          assert.equal(await evaluate('Array.from(document.querySelectorAll(".shortcut-key")).some((key) => key.dataset.key === "ENTER")'), true, "Enter is visibly drawn in checkpoint one");
          assert.equal(await evaluate('Array.from(document.querySelectorAll(".shortcut-key")).some((key) => ["BACKSPACE", "DELETE"].includes(key.dataset.key))'), false, "checkpoint one shows no deletion keys");
          assert.equal(await evaluate('document.querySelector("#line-break-input").value'), "Bananada Marmelada Goiabada", "checkpoint one begins with the current phrase");
          await evaluate('(() => { const field = document.querySelector("#line-break-input"); window.__campKeyLog=[]; field.addEventListener("keydown", event => window.__campKeyLog.push([event.key,event.isTrusted])); field.addEventListener("beforeinput", event => window.__campKeyLog.push([event.inputType,event.isTrusted])); field.focus(); field.setSelectionRange(8,8); })()');
          await pressKey("Enter", "Enter");
          assert.deepEqual(await evaluate('window.__campKeyLog'), [["Enter", true], ["insertLineBreak", true]], "the first physical Enter dispatches trusted keyboard and line-break events");
          assert.equal(await evaluate('document.querySelector("#line-break-input")?.value'), "Bananada\nMarmelada Goiabada", "the first native Enter inserts a line break");
          await evaluate('(() => { const field = document.querySelector("#line-break-input"); const end = field.value.indexOf("Marmelada") + "Marmelada".length; field.setSelectionRange(end,end); })()');
          await pressKey("Enter", "Enter");
          assert.equal(await evaluate('document.querySelector("#line-break-input")?.value'), "Bananada\nMarmelada\nGoiabada", "checkpoint one accepts exactly two Enter breaks in the requested phrase");
          assert.equal(await evaluate('document.querySelector("#continue-checkpoint")?.disabled'), false, "the three-line exercise completes automatically");
          await evaluate('document.querySelector("#continue-checkpoint").click()');
          assert.equal(await evaluate('document.querySelector(".checkpoint-name")?.textContent'), "CHECKPOINT 2/7", "the CP2 header keeps its checkpoint identity");
          assert.equal(await evaluate('(()=>{const ids=["select-copy-progress","select-copy-instruction","select-copy-hint","select-copy-input"];return ids.every((id,index)=>index===ids.length-1||document.getElementById(id).compareDocumentPosition(document.getElementById(ids[index+1]))&Node.DOCUMENT_POSITION_FOLLOWING)})()'), true, "CP2 reuses the World 2 order of stage, instruction, hint and activity");
          assert.equal(await evaluate('document.querySelector("#select-copy-progress")?.textContent'), "ETAPA 1/2", "checkpoint two starts at ETAPA 1/2");
          assert.equal(await evaluate('document.querySelector("#select-copy-instruction")?.textContent'), "Dê dois cliques rápidos sobre a palavra BANANA até que ela fique selecionada em azul.", "checkpoint two gives one main instruction for BANANA");
          assert.equal(await evaluate('document.querySelector("#select-copy-hint")?.textContent'), "Trecho a selecionar: BANANA.", "checkpoint two identifies BANANA as the expected selection");
          assert.equal(await evaluate('document.querySelector("#select-copy-input")?.value'), "BANANA", "stage one displays only BANANA");
          assert.equal(await evaluate('document.querySelector("#select-copy-input")?.readOnly'), true, "selection practice preserves the active word");
          assert.equal(await evaluate('document.querySelector("#check-action")?.hidden'), false, "stage one uses the existing check-action button");
          assert.equal(await evaluate('document.querySelector("#check-action")?.textContent'), "Avançar", "stage one labels the manual button Avançar");
          assert.equal(await evaluate('document.querySelector("#check-action")?.disabled'), true, "Avançar is disabled before the BANANA selection");
          assert.equal(await evaluate('document.querySelector("#continue-checkpoint")?.disabled'), true, "checkpoint two is incomplete before selection");
          assert.equal(await evaluate('document.querySelectorAll("#select-copy-keys .shortcut-key").length'), 0, "checkpoint two withholds Ctrl+C until both selections are practiced");
          await pressKey("c", "KeyC", 2);
          assert.equal(await evaluate('document.querySelector("#continue-checkpoint")?.disabled'), true, "Ctrl+C cannot complete checkpoint two before selection practice");
          await evaluate('(() => { const field=document.querySelector("#select-copy-input"); window.__selectionLog=[]; field.addEventListener("click", event=>window.__selectionLog.push(["click",event.detail,event.isTrusted,event.clientX,event.clientY,field.value.slice(field.selectionStart,field.selectionEnd)])); field.addEventListener("dblclick", event=>window.__selectionLog.push(["dblclick",event.detail,event.isTrusted,event.clientX,event.clientY,field.value.slice(field.selectionStart,field.selectionEnd)])); })()');
          await clickText("#select-copy-input", "BANANA");
          assert.equal(await evaluate('document.querySelector("#check-action")?.disabled'), true, "a single click does not validate BANANA");
          assert.equal(await evaluate('document.querySelector("#select-copy-confirmation")?.hidden'), true, "incorrect or incomplete selection shows no success confirmation");
          await doubleClickText("#select-copy-input", "BANANA");
          assert.equal(await evaluate('window.__selectionLog.some(([type,detail,trusted]) => type === "dblclick" && detail === 2 && trusted)'), true, `the browser produced a trusted double-click: ${JSON.stringify(await evaluate('window.__selectionLog'))}`);
          assert.equal(await evaluate('window.__selectionLog.some(([type,, , , , selected]) => type === "dblclick" && selected === "BANANA")'), true, `native double-click selects exactly BANANA: ${JSON.stringify(await evaluate('window.__selectionLog'))}`);
          await waitForExpression('document.querySelector("#check-action")?.disabled === false', "BANANA double-click enables manual advance");
          assert.equal(await evaluate('document.querySelector("#select-copy-progress")?.textContent'), "ETAPA 1/2", "correct BANANA selection remains in ETAPA 1/2");
          assert.equal(await evaluate('document.querySelector("#select-copy-input")?.value'), "BANANA", "BANANA remains the only content before manual advance");
          assert.deepEqual(await evaluate('Array.from(document.querySelectorAll("#select-copy-confirmation span")).map((span) => span.textContent)'), ["Trecho selecionado: BANANA", "Você selecionou corretamente. (Clique em Avançar)"], "correct double-click shows both BANANA confirmation spans");
          assert.equal(await evaluate('document.querySelector("#continue-checkpoint")?.disabled'), true, "BANANA selection does not complete checkpoint two");
          await doubleClickText("#select-copy-input", "BANANA");
          assert.equal(await evaluate('document.querySelector("#select-copy-progress")?.textContent'), "ETAPA 1/2", "repeated double-click does not advance the stage");
          assert.equal(await evaluate('document.querySelectorAll("#select-copy-confirmation span").length'), 2, "repeated double-click does not duplicate confirmations");
          await evaluate('(() => { const button=document.querySelector("#check-action"); button.click(); button.click(); })()');
          assert.equal(await evaluate('document.querySelector("#select-copy-progress")?.textContent'), "ETAPA 2/2", "the existing Avançar button changes to stage two only once");
          assert.equal(await evaluate('document.querySelector("#select-copy-input")?.value'), "KONG", "stage two replaces BANANA with only KONG");
          assert.equal(await evaluate('document.querySelector("#select-copy-instruction")?.textContent'), "Arraste sobre a palavra KONG para selecioná-la. Você pode arrastar do início ao fim ou do fim ao início.", "checkpoint two gives one main instruction for KONG");
          assert.equal(await evaluate('document.querySelector("#select-copy-hint")?.textContent'), "Trecho a selecionar: KONG.", "checkpoint two identifies KONG as the expected selection");
          assert.equal(await evaluate('document.querySelector("#check-action")?.hidden'), true, "stage two hides the stage-one advance control");
          await pressKey("c", "KeyC", 2);
          assert.equal(await evaluate('document.querySelector("#continue-checkpoint")?.disabled'), true, "Ctrl+C cannot complete checkpoint two before the KONG drag is validated");
          await dragText("#select-copy-input", "KON", "forward");
          assert.equal(await evaluate('document.querySelector("#select-copy-confirmation")?.hidden'), true, "a partial KONG drag shows no success confirmation");
          assert.equal(await evaluate('document.querySelector("#continue-checkpoint")?.disabled'), true, "a partial KONG drag does not complete checkpoint two");
          await waitForExpression('(() => { const field=document.querySelector("#select-copy-input"); return field.selectionStart === field.selectionEnd; })()', "an invalid partial drag is cleared so the learner can retry");
          await dragText("#select-copy-input", "KONG", "forward");
          await waitForExpression('document.querySelector("#select-copy-confirmation span")?.textContent === "Trecho selecionado: KONG"', "forward KONG drag confirms selection");
          assert.equal(await evaluate('(() => { const field=document.querySelector("#select-copy-input"); return field.value.slice(field.selectionStart,field.selectionEnd); })()'), "KONG", "a forward drag selects exactly KONG");
          assert.equal(await evaluate('document.querySelector("#select-copy-progress")?.textContent'), "ETAPA 2/2", "KONG selection remains in ETAPA 2/2");
          assert.equal(await evaluate('document.querySelector("#select-copy-instruction")?.hidden'), true, "drag confirmation replaces the completed selection instruction");
          assert.deepEqual(await evaluate('Array.from(document.querySelectorAll("#select-copy-confirmation span")).map((span) => span.textContent)'), ["Trecho selecionado: KONG", "Agora mantenha Ctrl pressionado e pressione C para copiar."], "KONG selection shows both requested pre-copy messages");
          assert.deepEqual(await evaluate('Array.from(document.querySelectorAll("#select-copy-keys .shortcut-key")).map((key) => key.dataset.key)'), ["CTRL", "C"], "checkpoint two presents Ctrl+C after selection");
          await evaluate('(() => { window.__nativeClipboardTrace=[]; for (const type of ["keydown","copy"]) document.addEventListener(type,event=>{const field=document.querySelector("#select-copy-input");const active=document.activeElement;window.__nativeClipboardTrace.push({type,target:event.target?.id||event.target?.nodeName,active:active?.id||active?.nodeName,isTrusted:event.isTrusted,ctrlKey:!!event.ctrlKey,key:event.key||"",code:event.code||"",selectionStart:field?.selectionStart,selectionEnd:field?.selectionEnd,selected:field?.value.slice(field.selectionStart,field.selectionEnd),stage:document.querySelector("#select-copy-progress")?.textContent,continueDisabled:document.querySelector("#continue-checkpoint")?.disabled});},true); })()');
          await pressKey("c", "KeyC", 2);
          await waitForExpression('document.querySelector("#continue-checkpoint")?.disabled === false', "native Ctrl+C completes checkpoint two");
          assert.equal(await evaluate('document.querySelector("#select-copy-progress")?.textContent'), "ETAPA 2/2", "the completed copy remains the second and final stage");
          assert.equal(await evaluate('window.__nativeClipboardTrace.some(event=>event.type==="keydown"&&event.target==="select-copy-input"&&event.active==="select-copy-input"&&event.isTrusted&&event.ctrlKey&&event.key.toLowerCase()==="c"&&event.selected==="KONG")'), true, `the document observed trusted Ctrl+C from the focused KONG selection: ${JSON.stringify(await evaluate('window.__nativeClipboardTrace'))}`);
          assert.equal(await evaluate('window.__nativeClipboardTrace.some(event=>event.type==="copy"&&event.target==="select-copy-input"&&event.active==="select-copy-input"&&event.isTrusted&&event.selected==="KONG"&&event.stage==="ETAPA 2/2"&&!event.continueDisabled)'), true, `the document observed native copy and enabled completion: ${JSON.stringify(await evaluate('window.__nativeClipboardTrace'))}`);
          assert.equal(await evaluate('document.querySelector("#continue-checkpoint")?.textContent'), "Avançar", "native copy enables the global Avançar button");
          assert.deepEqual(await evaluate('Array.from(document.querySelectorAll("#select-copy-confirmation span")).map((span) => span.textContent)'), ["Trecho copiado: KONG", "Você selecionou e copiou corretamente. (Clique em Avançar)"], "native copy replaces the selection messages with final confirmation");
          await pressKey("c", "KeyC", 2);
          assert.deepEqual(await evaluate('Array.from(document.querySelectorAll("#select-copy-confirmation span")).map((span) => span.textContent)'), ["Trecho copiado: KONG", "Você selecionou e copiou corretamente. (Clique em Avançar)"], "repeated Ctrl+C leaves the final confirmation intact");
          assert.equal(await evaluate('document.querySelector("#continue-checkpoint")?.disabled'), false, "repeated Ctrl+C does not disable or duplicate checkpoint completion");
          await evaluate('document.querySelector("#continue-checkpoint").click()');
          await waitForExpression('!!document.querySelector("#paste-build-input")', "checkpoint two releases checkpoint three");
          assert.equal(await evaluate('document.querySelector("#paste-build-progress")?.textContent'), "ETAPA 1/3", "checkpoint three starts at ETAPA 1/3");
          assert.equal(await evaluate('document.querySelector("#paste-build-input")?.value'), "DONKEY  e DIDDY", "checkpoint three begins with the exact unfilled phrase");
          assert.equal(await evaluate('document.querySelector("#paste-build-input")?.selectionStart'), 7, "the insertion cursor starts after DONKEY's first separator");
          assert.equal(await evaluate('!!document.querySelector("#paste-build-source")'), false, "checkpoint three has no separate BANANA source field");
          assert.equal(await evaluate('document.querySelector(".exercise-card")?.innerText.includes("BANANA")'), false, "checkpoint three does not mention or display BANANA");
          assert.equal(await evaluate('document.querySelector("#paste-build-input")?.value.includes("____")'), false, "checkpoint three has no placeholder underscores");
          assert.deepEqual(await evaluate('Array.from(document.querySelectorAll("#paste-build-keys .shortcut-key")).map((key) => key.dataset.key)'), ["CTRL", "V"], "checkpoint three starts with Ctrl+V");
          assert.equal(await evaluate('document.querySelector("#continue-checkpoint")?.disabled'), true, "checkpoint three starts incomplete");
          await cdp.send("Input.insertText", { text: "KONG" });
          assert.equal(await evaluate('document.querySelector("#paste-build-input")?.value'), "DONKEY KONG e DIDDY", "typing the expected first text does not substitute for Ctrl+V");
          assert.equal(await evaluate('document.querySelector("#continue-checkpoint")?.disabled'), true, "manual typing cannot advance checkpoint three");
          await evaluate('document.querySelector("#reset-activity").click()');
          assert.equal(await evaluate('document.querySelector("#paste-build-input")?.value'), "DONKEY  e DIDDY", "reset restores the exact first-paste starting text");
          await evaluate('(() => { window.__cp3PasteTrace=[]; for(const type of ["keydown","paste","input","copy"]) document.addEventListener(type,event=>{const field=document.querySelector("#paste-build-input");window.__cp3PasteTrace.push({type,target:event.target?.id,active:document.activeElement?.id,isTrusted:event.isTrusted,ctrlKey:!!event.ctrlKey,key:event.key||"",inputType:event.inputType||"",value:field?.value,selected:field?.value.slice(field.selectionStart,field.selectionEnd),stage:document.querySelector("#paste-build-progress")?.textContent});},true); })()');
          await pressKey("v", "KeyV", 2);
          await waitForExpression('document.querySelector("#paste-build-progress")?.textContent === "ETAPA 2/3"', "native first paste advances checkpoint three to step two");
          assert.equal(await evaluate('document.querySelector("#paste-build-input")?.value'), "DONKEY KONG e DIDDY ", "the first paste inserts KONG after DONKEY");
          assert.equal(await evaluate('document.querySelector("#paste-build-instruction")?.textContent'), "Agora pressione Ctrl+V novamente para colar KONG após DIDDY.", "the first paste updates the second-stage instruction");
          assert.equal(await evaluate('document.querySelector("#paste-build-input")?.selectionStart'), "DONKEY KONG e DIDDY ".length, "the cursor moves to the insertion point after DIDDY");
          assert.equal(await evaluate('document.querySelector("#continue-checkpoint")?.disabled'), true, "the first paste does not finish checkpoint three");
          await pressKey("v", "KeyV", 2);
          await waitForExpression('document.querySelector("#paste-build-progress")?.textContent === "ETAPA 3/3"', "the second native paste advances checkpoint three to its BANANA copy stage");
          assert.equal(await evaluate('document.querySelector("#paste-build-input")?.value'), "BANANA", "checkpoint three replaces the phrase with only BANANA in its final stage");
          assert.equal(await evaluate('document.querySelector("#paste-build-instruction")?.textContent'), "Selecione a palavra BANANA e pressione Ctrl+C para copiá-la. Depois, clique em Avançar.", "checkpoint three instructs the final BANANA copy");
          assert.equal(await evaluate('document.querySelector("#paste-build-input")?.readOnly'), true, "the final BANANA source remains protected while selectable");
          assert.equal(await evaluate('document.querySelector("#continue-checkpoint")?.disabled'), true, "the two pastes do not finish checkpoint three before BANANA is copied");
          assert.deepEqual(await evaluate('Array.from(document.querySelectorAll("#paste-build-keys .shortcut-key")).map((key) => key.dataset.key)'), ["CTRL", "C"], "checkpoint three changes the visual shortcut to Ctrl+C");
          assert.equal(await evaluate('window.__cp3PasteTrace.filter(event=>event.type==="keydown"&&event.target==="paste-build-input"&&event.isTrusted&&event.ctrlKey&&event.key.toLowerCase()==="v").length'), 2, "both paste shortcuts are real trusted Ctrl+V keydowns");
          assert.equal(await evaluate('window.__cp3PasteTrace.filter(event=>event.type==="paste"&&event.target==="paste-build-input"&&event.isTrusted).length'), 2, "both paste operations dispatch native paste events");
          assert.equal(await evaluate('window.__cp3PasteTrace.filter(event=>event.type==="input"&&event.target==="paste-build-input"&&event.isTrusted).length'), 2, "both native pastes change the field through trusted input events");
          await doubleClickText("#paste-build-input", "BANANA");
          assert.equal(await evaluate('(() => {const field=document.querySelector("#paste-build-input");return field.value.slice(field.selectionStart,field.selectionEnd);})()'), "BANANA", "the learner natively selects all of BANANA");
          await pressKey("c", "KeyC", 2);
          await waitForExpression('document.querySelector("#continue-checkpoint")?.disabled === false', "native BANANA copy completes checkpoint three");
          assert.equal(await evaluate('document.querySelector("#paste-build-progress")?.textContent'), "ETAPA 3/3", "the final copy remains in ETAPA 3/3");
          assert.equal(await evaluate('window.__cp3PasteTrace.some(event=>event.type==="keydown"&&event.target==="paste-build-input"&&event.active==="paste-build-input"&&event.isTrusted&&event.ctrlKey&&event.key.toLowerCase()==="c"&&event.selected==="BANANA")'), true, "the final stage observes trusted Ctrl+C with BANANA selected");
          assert.equal(await evaluate('window.__cp3PasteTrace.some(event=>event.type==="copy"&&event.target==="paste-build-input"&&event.active==="paste-build-input"&&event.isTrusted&&event.selected==="BANANA")'), true, "the final stage receives the native BANANA copy event");
          assert.deepEqual(await evaluate('Array.from(document.querySelectorAll("#paste-build-status span")).map((span) => span.textContent)'), ["Trecho copiado: BANANA", "Você copiou corretamente. Clique em Avançar para iniciar o próximo checkpoint."], "the copy confirmation remains visible until manual advance");
          assert.deepEqual(await evaluate('Array.from(document.querySelectorAll("#paste-build-status span")).map((span) => getComputedStyle(span).display)'), ["block", "block"], "checkpoint three renders its two confirmation messages as separate blocks");
          assert.equal(await evaluate('getComputedStyle(document.querySelector("#paste-build-status span + span")).marginTop'), "8px", "checkpoint three separates the confirmation blocks with visible spacing");
          assert.equal(await evaluate('document.querySelector("#paste-build-input")?.value'), "BANANA", "the original BANANA remains visible after copying");
          assert.equal(await evaluate('document.activeElement?.id'), "paste-build-input", "copy confirmation keeps focus on the visible BANANA field");
          assert.equal(await evaluate('document.querySelector("#paste-build-input")?.value.slice(document.querySelector("#paste-build-input").selectionStart,document.querySelector("#paste-build-input").selectionEnd)'), "BANANA", "copy confirmation preserves the native selection");
          assert.equal(await evaluate('document.querySelector("#continue-checkpoint")?.disabled'), false, "the two real pastes enable the global advance button");
          assert.equal(await evaluate('document.querySelector("#continue-checkpoint")?.textContent'), "Avançar", "checkpoint three's copy message matches the global advance label");
          await evaluate('document.querySelector("#continue-checkpoint").click()');
          await waitForExpression('!!document.querySelector("#paste-undo-input")', "checkpoint three releases checkpoint four");

          assert.equal(await evaluate('document.querySelector("#paste-undo-progress")?.textContent'), "ETAPA 1/5", "checkpoint four begins directly at its first of five stages");
          assert.equal(await evaluate('document.querySelector("#paste-undo-instruction")?.textContent'), "Você copiou BANANA no checkpoint anterior. Agora vamos colar essa palavra quatro vezes usando Ctrl+V.", "checkpoint four explains that it uses BANANA copied in checkpoint three");
          assert.equal(await evaluate('!!document.querySelector("#paste-undo-banana")'), false, "checkpoint four does not ask to copy BANANA again");
          assert.equal(await evaluate('document.querySelector("#paste-undo-input")?.value'), "", "checkpoint four begins with an empty paste field");
          assert.deepEqual(await evaluate('Array.from(document.querySelectorAll("#paste-undo-keys .shortcut-key")).map((key) => key.dataset.key)'), ["CTRL", "V"], "checkpoint four starts with Ctrl+V");
          await evaluate('(() => { window.__cp4ClipboardTrace=[]; for(const type of ["keydown","copy","paste","input"]) document.addEventListener(type,event=>{const field=event.target?.id?document.getElementById(event.target.id):null;window.__cp4ClipboardTrace.push({type,target:event.target?.id,active:document.activeElement?.id,isTrusted:event.isTrusted,ctrlKey:!!event.ctrlKey,key:event.key||"",inputType:event.inputType||"",selected:field?.value?.slice(field.selectionStart,field.selectionEnd),value:field?.value,stage:document.querySelector("#paste-undo-progress")?.textContent});},true); })()');
          await pressKey("v", "KeyV", 2);
          await waitForExpression('document.querySelector("#paste-undo-input")?.value === "BANANA"', "CP4 reads BANANA from the real clipboard");
          for (let pasteIndex = 2; pasteIndex <= 4; pasteIndex += 1) await pressKey("v", "KeyV", 2);
          await waitForExpression('document.querySelector("#paste-undo-progress")?.textContent === "ETAPA 2/5"', "four native BANANA pastes begin the undo phase");
          assert.equal(await evaluate('document.querySelector("#paste-undo-input")?.value'), "BANANABANANABANANABANANA", "CP4 preserves the four-paste result");
          assert.equal(await evaluate('window.__cp4ClipboardTrace.filter(event=>event.type==="paste"&&event.target==="paste-undo-input"&&event.isTrusted).length'), 4, "all four BANANA insertions use native paste events");
          assert.equal(await evaluate('window.__cp4ClipboardTrace.filter(event=>event.type==="input"&&event.target==="paste-undo-input"&&event.isTrusted&&event.inputType==="insertFromPaste").length'), 4, "all four BANANA pastes change the field through trusted input events");
          for (let undoIndex = 1; undoIndex <= 3; undoIndex += 1) await pressKey("z", "KeyZ", 2);
          await waitForExpression('document.querySelector("#paste-undo-progress")?.textContent === "ETAPA 3/5"', "three native undos leave one BANANA and advance to SAPO");
          assert.equal(await evaluate('document.querySelector("#paste-undo-input")?.value'), "BANANA", "three Ctrl+Z operations leave one BANANA");
          assert.equal(await evaluate('window.__cp4ClipboardTrace.filter(event=>event.type==="input"&&event.target==="paste-undo-input"&&event.isTrusted&&event.inputType==="historyUndo").length'), 3, "the original three Ctrl+Z operations each undo an edit");
          assert.equal(await evaluate('document.querySelector("#paste-undo-copy-container")?.hidden'), false, "the SAPO copy source appears at its original sequence point");
          assert.equal(await evaluate('document.querySelector("#paste-undo-copy")?.value.slice(document.querySelector("#paste-undo-copy").selectionStart,document.querySelector("#paste-undo-copy").selectionEnd)'), "SAPO", "the original SAPO source remains selected for copying");
          await pressKey("c", "KeyC", 2);
          await waitForExpression('document.querySelector("#paste-undo-progress")?.textContent === "ETAPA 4/5"', "native SAPO copy begins the destination paste stage");
          assert.equal(await evaluate('window.__cp4ClipboardTrace.some(event=>event.type==="copy"&&event.target==="paste-undo-copy"&&event.isTrusted&&event.selected==="SAPO")'), true, "the existing SAPO copy still uses a native copy event");
          assert.equal(await evaluate('document.querySelector("#paste-undo-copy")?.value'), "SAPO", "Ctrl+C keeps the SAPO original in its source field");
          assert.equal(await evaluate('document.activeElement?.id'), "paste-undo-copy", "copying SAPO does not move focus to the destination");
          assert.equal(await evaluate('document.querySelector("#paste-undo-extra-container")?.hidden'), false, "the original second destination appears at its sequence point");
          const destinationPoint = await evaluate('(()=>{const field=document.querySelector("#paste-undo-extra");const rect=field.getBoundingClientRect();return {x:rect.left+rect.width/2,y:rect.top+rect.height/2};})()');
          assert.equal(await evaluate(`document.elementFromPoint(${destinationPoint.x},${destinationPoint.y}) === document.querySelector("#paste-undo-extra")`), true, "the destination field receives the learner's click");
          await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", ...destinationPoint });
          await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", ...destinationPoint, button: "left", clickCount: 1 });
          await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...destinationPoint, button: "left", clickCount: 1 });
          await pressKey("End", "End");
          assert.equal(await evaluate('document.activeElement?.id'), "paste-undo-extra", "the learner manually focuses the destination field");
          assert.equal(await evaluate('document.querySelector("#paste-undo-extra")?.selectionStart'), "Destino: ".length, "the manual click places the insertion cursor after the destination label");
          assert.equal(await evaluate('document.querySelector("#paste-undo-instruction")?.textContent'), "Clique no campo Destino e pressione Ctrl+V seis vezes para colar SAPO.", "checkpoint four explains the six-paste destination action");
          assert.equal(await evaluate('document.querySelector("#paste-undo-hint")?.textContent'), "Ctrl+C copiou SAPO e o original continua no campo acima. Clique no destino para colar seis cópias.", "checkpoint four explains why the learner must focus the destination");
          assert.equal(await evaluate('document.querySelector("#continue-checkpoint")?.disabled'), true, "checkpoint four cannot be completed before six pastes and five undos");
          for (let pasteIndex = 1; pasteIndex <= 6; pasteIndex += 1) {
            await pressKey("v", "KeyV", 2);
            await waitForExpression(`document.querySelector("#paste-undo-extra")?.value === ${JSON.stringify("Destino: " + "SAPO".repeat(pasteIndex))}`, `native SAPO paste ${pasteIndex}/6 reaches the destination`);
            if (pasteIndex < 6) assert.equal(await evaluate('document.querySelector("#paste-undo-hint")?.textContent'), `Colagens: ${pasteIndex}/6`, `checkpoint four reports paste progress ${pasteIndex}/6`);
          }
          await waitForExpression('document.querySelector("#paste-undo-progress")?.textContent === "ETAPA 5/5"', "six native SAPO pastes advance to the five-undo final stage");
          assert.equal(await evaluate('document.querySelector("#paste-undo-instruction")?.textContent'), "Agora pressione Ctrl+Z cinco vezes. Deve restar apenas um SAPO.", "checkpoint four explains the five-undo requirement");
          assert.equal(await evaluate('document.querySelector("#paste-undo-hint")?.textContent'), "Colagens: 6/6", "checkpoint four confirms all six real pastes before undo begins");
          assert.deepEqual(await evaluate('Array.from(document.querySelectorAll("#paste-undo-keys .shortcut-key")).map((key) => key.dataset.key)'), ["CTRL", "Z"], "the final stage keeps Ctrl+Z visible");
          assert.equal(await evaluate('window.__cp4ClipboardTrace.filter(event=>event.type==="paste"&&event.target==="paste-undo-extra"&&event.isTrusted).length'), 6, "all six SAPO insertions use native paste events");
          assert.equal(await evaluate('window.__cp4ClipboardTrace.filter(event=>event.type==="keydown"&&event.target==="paste-undo-extra"&&event.isTrusted&&event.ctrlKey&&event.key.toLowerCase()==="v").length'), 6, "all six destination pastes begin with real trusted Ctrl+V keydowns");
          assert.equal(await evaluate('window.__cp4ClipboardTrace.filter(event=>event.type==="input"&&event.target==="paste-undo-extra"&&event.isTrusted&&event.inputType==="insertFromPaste").length'), 6, "all six native SAPO pastes change the field through trusted input events");
          for (let undoIndex = 1; undoIndex <= 5; undoIndex += 1) {
            await pressKey("z", "KeyZ", 2);
            const remaining = 6 - undoIndex;
            await waitForExpression(`document.querySelector("#paste-undo-extra")?.value === ${JSON.stringify("Destino: " + "SAPO".repeat(remaining))}`, `native SAPO undo ${undoIndex}/5 leaves ${remaining} SAPO`);
            if (undoIndex < 5) {
              assert.equal(await evaluate('document.querySelector("#paste-undo-hint")?.textContent'), `Desfeitas: ${undoIndex}/5`, `checkpoint four reports undo progress ${undoIndex}/5`);
              assert.equal(await evaluate('document.querySelector("#continue-checkpoint")?.disabled'), true, "the checkpoint stays locked until all five undos finish");
            }
          }
          await waitForExpression('document.querySelector("#continue-checkpoint")?.disabled === false', "five native undos leave one SAPO and complete checkpoint four");
          assert.equal(await evaluate('document.querySelector("#paste-undo-input")?.value'), "BANANA", "CP4 finishes with one BANANA remaining");
          assert.equal(await evaluate('document.querySelector("#paste-undo-extra")?.value'), "Destino: SAPO", "five Ctrl+Z operations leave one SAPO in the destination");
          assert.equal(await evaluate('window.__cp4ClipboardTrace.filter(event=>event.type==="input"&&event.target==="paste-undo-extra"&&event.isTrusted&&event.inputType==="historyUndo").length'), 5, "all five Ctrl+Z operations natively undo an edit");
          assert.equal(await evaluate('document.querySelector("#paste-undo-progress")?.textContent'), "ETAPA 5/5", "checkpoint four completes without adding a preparation stage");
          assert.equal(await evaluate('document.querySelector("#paste-undo-instruction")?.textContent'), "Agora pressione Ctrl+Z cinco vezes. Deve restar apenas um SAPO.", "checkpoint four retains the final stage instruction after completion");
          assert.equal(await evaluate('document.querySelector("#paste-undo-hint")?.textContent'), "Restou uma única palavra SAPO. Você concluiu o checkpoint. Clique em Continuar para o checkpoint 5.", "checkpoint four confirms exactly one remaining SAPO");
          assert.equal(await evaluate('document.querySelector("#exercise-feedback")?.textContent'), "Desfeitas: 5/5. Desfazer colagens concluído.", "checkpoint four displays the completed five-undo counter with success feedback");
          assert.equal(await evaluate('(document.querySelector("#paste-undo-extra")?.value.slice("Destino: ".length).match(/SAPO/g)||[]).length'), 1, "exactly one SAPO occurrence remains after five undos");
          assert.equal(await evaluate('window.__cp4ClipboardTrace.filter(event=>event.type==="keydown"&&event.target==="paste-undo-extra"&&event.isTrusted&&event.ctrlKey&&event.key.toLowerCase()==="z").length'), 5, "all five destination undos begin with real trusted Ctrl+Z keydowns");
          assert.equal(await evaluate('document.querySelector(".checkpoint-name")?.textContent'), "CHECKPOINT 4/7", "the final result stays on checkpoint four until the learner advances manually");
          assert.deepEqual(await evaluate('Array.from(document.querySelectorAll("#paste-undo-keys .shortcut-key")).map((key) => key.dataset.key)'), ["CTRL", "Z"], "the final shortcut keys remain visible after completion");
          await evaluate('document.querySelector("#continue-checkpoint").click()');
          await waitForExpression('!!document.querySelector("#history-sequence-input")', "checkpoint four releases checkpoint five");

          assert.equal(await evaluate('document.querySelector("#history-sequence-input")?.value'), "", "checkpoint five begins with an empty practice field");
          for (let pasteIndex = 1; pasteIndex <= 4; pasteIndex += 1) {
            await pressKey("v", "KeyV", 2);
            await waitForExpression(`document.querySelector("#history-sequence-input")?.value === ${JSON.stringify("SAPO".repeat(pasteIndex))}`, `CP5 native paste ${pasteIndex}/4`);
          }
          for (let undoIndex = 1; undoIndex <= 3; undoIndex += 1) {
            await pressKey("z", "KeyZ", 2);
            await waitForExpression(`document.querySelector("#history-sequence-input")?.value === ${JSON.stringify("SAPO".repeat(4 - undoIndex))}`, `CP5 native undo ${undoIndex}/3`);
          }
          for (let redoIndex = 1; redoIndex <= 2; redoIndex += 1) {
            await pressKey("z", "KeyZ", 10);
            await waitForExpression(`document.querySelector("#history-sequence-input")?.value === ${JSON.stringify("SAPO".repeat(1 + redoIndex))}`, `CP5 native redo ${redoIndex}/2`);
          }
          for (let undoIndex = 1; undoIndex <= 2; undoIndex += 1) {
            await pressKey("z", "KeyZ", 2);
            await waitForExpression(`document.querySelector("#history-sequence-input")?.value === ${JSON.stringify("SAPO".repeat(3 - undoIndex))}`, `CP5 final native undo ${undoIndex}/2`);
          }
          await waitForExpression('document.querySelector("#continue-checkpoint")?.disabled === false', "CP5 finishes with one SAPO for CP6");
          await evaluate('document.querySelector("#continue-checkpoint").click()');
          await waitForExpression('!!document.querySelector("#cut-paste-source")', "checkpoint five releases checkpoint six");

          assert.equal(await evaluate('document.querySelector("#cut-paste-progress")?.textContent'), "ETAPA 1/2", "checkpoint six begins at ETAPA 1/2");
          assert.equal(await evaluate('document.querySelector("#cut-paste-source")?.value'), "CHIMPANZÉ", "checkpoint six source contains only CHIMPANZÉ");
          assert.equal(await evaluate('document.querySelector("#cut-paste-target")?.value'), "", "checkpoint six destination starts completely empty");
          assert.equal(await evaluate('document.querySelector("#cut-paste-target")?.labels?.[0]?.textContent'), "Destino", "Destino exists only in the visible label, not in the textarea");
          assert.equal(await evaluate('document.querySelector("#cut-paste-source")?.value.includes("GORILA")'), false, "the first source stage does not show GORILA");
          assert.equal(await evaluate('(() => {const label=document.querySelector("label[for=cut-paste-source]");const style=getComputedStyle(label);return style.color==="rgb(242, 239, 207)"&&style.fontWeight==="900"&&parseFloat(style.fontSize)>=16;})()'), true, "Origem label has readable light color, bold weight and legible size");
          assert.equal(await evaluate('(() => {const label=document.querySelector("label[for=cut-paste-target]");const style=getComputedStyle(label);return style.color==="rgb(242, 239, 207)"&&style.fontWeight==="900"&&parseFloat(style.fontSize)>=16;})()'), true, "Destino label has readable light color, bold weight and legible size");
          assert.equal(await evaluate('document.querySelector("#cut-paste-instruction")?.textContent'), "Selecione toda a palavra CHIMPANZÉ e pressione Ctrl+X para recortá-la.", "the first stage instructs an exact native cut");
          assert.deepEqual(await evaluate('Array.from(document.querySelectorAll("#cut-paste-keys .shortcut-key")).map((key)=>key.dataset.key)'), ["CTRL", "X"], "the first stage shows Ctrl+X");
          assert.equal(await evaluate('document.querySelector("#continue-checkpoint")?.disabled'), true, "CP6 cannot release CP7 before either paste");
          await evaluate('(() => {window.__cp6Trace=[];for(const type of ["keydown","cut","paste","input"])document.addEventListener(type,event=>{const field=event.target?.id?document.getElementById(event.target.id):null;window.__cp6Trace.push({type,target:event.target?.id,active:document.activeElement?.id,isTrusted:event.isTrusted,ctrlKey:!!event.ctrlKey,key:event.key||"",inputType:event.inputType||"",selected:field?.value?.slice(field.selectionStart,field.selectionEnd),value:field?.value,stage:document.querySelector("#cut-paste-progress")?.textContent});},true);})()');

          await evaluate('(() => {const field=document.querySelector("#cut-paste-source");field.value="";field.dispatchEvent(new InputEvent("input",{bubbles:true,inputType:"deleteByCut"}));field.value="CHIMPANZÉ";})()');
          assert.equal(await evaluate('document.querySelector("#cut-paste-progress")?.textContent'), "ETAPA 1/2", "untrusted manual text mutation cannot advance the cut phase");
          assert.equal(await evaluate('document.querySelector("#continue-checkpoint")?.disabled'), true, "untrusted text changes cannot complete CP6");
          await clickTextFieldStart("#cut-paste-source");
          assert.equal(await evaluate('document.activeElement?.id'), "cut-paste-source", "a physical pointer click focuses the source");
          await pressKey("Home", "Home");
          await pressKey("End", "End", 8);
          assert.equal(await evaluate('(() => {const field=document.querySelector("#cut-paste-source");return {selected:field.value.slice(field.selectionStart,field.selectionEnd),value:field.value,start:field.selectionStart,end:field.selectionEnd,active:document.activeElement?.id};})()').then((state) => state.selected), "CHIMPANZÉ", `the learner selects exactly the source word before cutting: ${JSON.stringify(await evaluate('(()=>{const field=document.querySelector("#cut-paste-source");return {selected:field.value.slice(field.selectionStart,field.selectionEnd),value:field.value,start:field.selectionStart,end:field.selectionEnd,active:document.activeElement?.id};})()'))}`);
          await pressKey("x", "KeyX", 2);
          await waitForExpression('document.querySelector("#cut-paste-instruction")?.textContent.includes("Agora clique no campo Destino")', "native CHIMPANZÉ cut changes the instruction to manual paste");
          assert.equal(await evaluate('document.querySelector("#cut-paste-source")?.value'), "", "native Ctrl+X removes CHIMPANZÉ from Origem");
          assert.equal(await evaluate('document.querySelector("#cut-paste-target")?.value'), "", "cut does not change the unfocused Destino");
          assert.equal(await evaluate('document.activeElement?.id'), "cut-paste-source", "the cut does not move focus to Destino");
          assert.equal(await evaluate('document.querySelector("#cut-paste-progress")?.textContent'), "ETAPA 1/2", "cut confirmation stays in the first stage");
          assert.deepEqual(await evaluate('Array.from(document.querySelectorAll("#cut-paste-keys .shortcut-key")).map((key)=>key.dataset.key)'), ["CTRL", "V"], "after cutting, the visual shortcut changes to Ctrl+V");
          assert.equal(await evaluate('window.__cp6Trace.some(event=>event.type==="keydown"&&event.target==="cut-paste-source"&&event.active==="cut-paste-source"&&event.isTrusted&&event.ctrlKey&&event.key.toLowerCase()==="x"&&event.selected==="CHIMPANZÉ")'), true, "the source observes trusted Ctrl+X with the full word selected");
          assert.equal(await evaluate('window.__cp6Trace.some(event=>event.type==="cut"&&event.target==="cut-paste-source"&&event.active==="cut-paste-source"&&event.isTrusted)'), true, "the browser dispatches the real trusted cut event");
          assert.equal(await evaluate('window.__cp6Trace.some(event=>event.type==="input"&&event.target==="cut-paste-source"&&event.isTrusted&&event.inputType==="deleteByCut"&&event.value==="")'), true, "native cut removes the source through trusted deleteByCut input");
          assert.equal(await evaluate('document.querySelector("#check-action")?.hidden'), true, "stage advance remains unavailable until the destination paste");

          const firstTargetPoint = await evaluate('(()=>{const field=document.querySelector("#cut-paste-target");const r=field.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()');
          assert.equal(await evaluate(`document.elementFromPoint(${firstTargetPoint.x},${firstTargetPoint.y})===document.querySelector("#cut-paste-target")`), true, "the empty destination receives a manual learner click");
          await cdp.send("Input.dispatchMouseEvent", { type:"mouseMoved", ...firstTargetPoint });
          await cdp.send("Input.dispatchMouseEvent", { type:"mousePressed", ...firstTargetPoint, button:"left", clickCount:1 });
          await cdp.send("Input.dispatchMouseEvent", { type:"mouseReleased", ...firstTargetPoint, button:"left", clickCount:1 });
          assert.equal(await evaluate('document.activeElement?.id'), "cut-paste-target", "the learner manually focuses the first destination");
          await pressKey("v", "KeyV", 2);
          await waitForExpression('document.querySelector("#cut-paste-target")?.value === "CHIMPANZÉ"', "native paste puts CHIMPANZÉ in Destino");
          assert.deepEqual(await evaluate('Array.from(document.querySelectorAll("#cut-paste-status span")).map((span)=>span.textContent)'), ["CHIMPANZÉ foi colado corretamente no Destino.", "Clique em Avançar para continuar."], "the first paste confirmation and manual advance remain visible");
          assert.equal(await evaluate('document.querySelector("#check-action")?.textContent'), "Avançar", "the first stage offers its manual Avançar control");
          assert.equal(await evaluate('document.querySelector("#check-action")?.disabled'), false, "the first stage advance is enabled only after native paste");
          assert.equal(await evaluate('document.querySelector("#continue-checkpoint")?.disabled'), true, "the global CP7 advance remains disabled after only the first word");
          assert.equal(await evaluate('window.__cp6Trace.some(event=>event.type==="keydown"&&event.target==="cut-paste-target"&&event.active==="cut-paste-target"&&event.isTrusted&&event.ctrlKey&&event.key.toLowerCase()==="v")'), true, "destination observes trusted Ctrl+V");
          assert.equal(await evaluate('window.__cp6Trace.some(event=>event.type==="paste"&&event.target==="cut-paste-target"&&event.active==="cut-paste-target"&&event.isTrusted)'), true, "destination receives the native trusted paste event");
          assert.equal(await evaluate('window.__cp6Trace.some(event=>event.type==="input"&&event.target==="cut-paste-target"&&event.isTrusted&&event.inputType==="insertFromPaste"&&event.value==="CHIMPANZÉ")'), true, "native paste inserts the exact word through trusted input");
          await evaluate('(() => {const button=document.querySelector("#check-action");button.click();button.click();})()');
          assert.equal(await evaluate('document.querySelector("#cut-paste-progress")?.textContent'), "ETAPA 2/2", "repeated advance clicks change to the second stage only once");
          assert.equal(await evaluate('document.querySelector("#cut-paste-source")?.value'), "GORILA", "the second source stage contains only GORILA");
          assert.equal(await evaluate('document.querySelector("#cut-paste-target")?.value.trimEnd()'), "CHIMPANZÉ", "the second stage preserves CHIMPANZÉ in Destino");
          assert.equal(await evaluate('document.querySelector("#cut-paste-instruction")?.textContent'), "Selecione toda a palavra GORILA e pressione Ctrl+X para recortá-la.", "the second stage begins with its exact cut instruction");

          await clickTextFieldStart("#cut-paste-source");
          assert.equal(await evaluate('document.activeElement?.id'), "cut-paste-source", "a physical pointer click focuses the second source");
          await pressKey("Home", "Home");
          await pressKey("End", "End", 8);
          assert.equal(await evaluate('(() => {const field=document.querySelector("#cut-paste-source");return field.value.slice(field.selectionStart,field.selectionEnd);})()'), "GORILA", "the learner selects exactly GORILA before cutting");
          await pressKey("x", "KeyX", 2);
          await waitForExpression('document.querySelector("#cut-paste-instruction")?.textContent.includes("Agora clique no campo Destino")', "native GORILA cut changes the instruction to manual paste");
          assert.equal(await evaluate('document.querySelector("#cut-paste-source")?.value'), "", "native Ctrl+X removes GORILA from Origem");
          assert.equal(await evaluate('document.activeElement?.id'), "cut-paste-source", "second cut leaves focus in Origem until the learner moves it");
          const secondTargetPoint = await textPoint("#cut-paste-target", "CHIMPANZÉ ".length - 0.1);
          await cdp.send("Input.dispatchMouseEvent", { type:"mouseMoved", ...secondTargetPoint });
          await cdp.send("Input.dispatchMouseEvent", { type:"mousePressed", ...secondTargetPoint, button:"left", clickCount:1 });
          await cdp.send("Input.dispatchMouseEvent", { type:"mouseReleased", ...secondTargetPoint, button:"left", clickCount:1 });
          assert.equal(await evaluate('document.activeElement?.id'), "cut-paste-target", "the learner manually focuses the second destination");
          await pressKey("v", "KeyV", 2);
          await waitForExpression('document.querySelector("#cut-paste-target")?.value === "CHIMPANZÉ GORILA"', "native paste appends GORILA to the destination");
          await waitForExpression('document.querySelector("#continue-checkpoint")?.disabled === false', "the second native paste completes checkpoint six");
          assert.equal(await evaluate('document.querySelector("#cut-paste-target")?.value'), "CHIMPANZÉ GORILA", "the final destination matches the exact requested phrase");
          assert.deepEqual(await evaluate('Array.from(document.querySelectorAll("#cut-paste-status span")).map((span)=>span.textContent)'), ["GORILA foi colado corretamente no Destino.", "Você concluiu as duas etapas. Clique em Continuar para o checkpoint 7."], "the final confirmation waits for manual CP7 advance");
          assert.equal(await evaluate('document.querySelector("#continue-checkpoint")?.textContent'), "Continuar para o checkpoint 7", "the global button advances to CP7 only after the second paste");
          assert.equal(await evaluate('document.querySelector(".checkpoint-name")?.textContent'), "CHECKPOINT 6/7", "CP6 stays visible until the learner clicks Continuar");
          assert.equal(await evaluate('window.__cp6Trace.filter(event=>event.type==="cut"&&event.target==="cut-paste-source"&&event.isTrusted).length'), 2, "exactly two trusted native cut events complete the two stages");
          assert.equal(await evaluate('window.__cp6Trace.filter(event=>event.type==="paste"&&event.target==="cut-paste-target"&&event.isTrusted).length'), 2, "exactly two trusted native paste events complete the two stages");

          await cdp.send("Storage.clearDataForOrigin", { origin: new URL(baseUrl).origin, storageTypes: "all" });
          await navigate(baseUrl + "activities/donkey-kong/camp.html", "/activities/donkey-kong/camp.html");
          await evaluate('document.querySelector("#start-world").click()');
          await evaluate('(() => { const field=document.querySelector("#line-break-input"); field.focus(); field.setSelectionRange(8,8); })()');
          await pressKey("Enter", "Enter");
          await evaluate('(() => { const field=document.querySelector("#line-break-input"); const end=field.value.indexOf("Marmelada")+"Marmelada".length; field.setSelectionRange(end,end); })()');
          await pressKey("Enter", "Enter");
          await evaluate('document.querySelector("#continue-checkpoint").click()');
          await doubleClickText("#select-copy-input", "BANANA");
          await waitForExpression('document.querySelector("#check-action")?.disabled === false', "second attempt enables BANANA advance");
          await evaluate('document.querySelector("#check-action").click()');
          await dragText("#select-copy-input", "KONG", "reverse");
          await waitForExpression('document.querySelector("#select-copy-confirmation span")?.textContent === "Trecho selecionado: KONG"', "reverse KONG drag confirms selection");
          assert.equal(await evaluate('(() => { const field=document.querySelector("#select-copy-input"); return field.value.slice(field.selectionStart,field.selectionEnd); })()'), "KONG", "a reverse drag also selects exactly KONG");
          assert.equal(await evaluate('document.querySelector("#select-copy-progress")?.textContent'), "ETAPA 2/2", "reverse-drag copy finalization stays in ETAPA 2/2");
          assert.deepEqual(await evaluate('Array.from(document.querySelectorAll("#select-copy-confirmation span")).map((span) => span.textContent)'), ["Trecho selecionado: KONG", "Agora mantenha Ctrl pressionado e pressione C para copiar."], "reverse drag also shows the pre-copy messages");
          await pressKey("c", "KeyC", 2);
          await waitForExpression('document.querySelector("#continue-checkpoint")?.disabled === false', "reverse-drag selection copies and completes checkpoint two");
          await evaluate('document.querySelector("#continue-checkpoint").click()');
          await waitForExpression('!!document.querySelector("#paste-build-input")', "reverse-drag selection releases checkpoint three");
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
