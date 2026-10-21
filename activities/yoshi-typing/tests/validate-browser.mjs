import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const storageKey = "exploradores.yoshi-typing.progress.v2";
const targets = {
  1: ["ASDF JKLÇ ASDF JKLÇ", "ASDF FDSA JKLÇ ÇLKJ ASDF", "FADA FALA DA SALA FADA FALA", "ASDF JKLÇ FDSA ÇLKJ ASDF JKLÇ", "A FADA FALA DA SALA FADA FALA", "ASDF FDSA JKLÇ ÇLKJ ASDF FDSA JKLÇ", "A FADA FALA DA SALA ASDF JKLÇ FADA ASDF", "ASDF JKLÇ FDSA ÇLKJ ASDF JKLÇ FDSA ÇLKJ ASDF", "A FADA FALA DA SALA ASDF JKLÇ FDSA ÇLKJ ASDF JKLÇ", "ASDF FDSA JKLÇ ÇLKJ ASDF JKLÇ A FADA FALA DA SALA ASDF"],
  2: ["ASDFGH JKLÇ ASDFGH", "QWERTY UIOP QWERTY", "ASDFGH JKLÇ QWERTY UIOP", "POIUYTREWQ ASDFGH JKLÇ", "O GATO PULA PARA O ALTO", "A TARTARUGA PULA PARA O LAGO", "O GATO QUER OLHAR PARA O PAPAGAIO", "A TARTARUGA QUER OLHAR PARA O GATO", "O PAPAGAIO OLHA A TARTARUGA E O GATO", "O GATO QUER OLHAR PARA O PAPAGAIO E A TARTARUGA"],
  3: ["QWERTY UIOP ASDFGH JKLÇ", "O GATO PULA PARA O ALTO", "A TARTARUGA PULA PARA O LAGO", "O PAPAGAIO PULA PARA O TOPO", "O GATO OLHA O PAPAGAIO", "A TARTARUGA OLHA O PAPAGAIO", "O PAPAGAIO OLHA A TARTARUGA E O GATO", "A TARTARUGA QUER OLHAR PARA O PAPAGAIO", "O GATO QUER OLHAR PARA A TARTARUGA", "O PAPAGAIO QUER OLHAR PARA A TARTARUGA E O GATO"],
  4: ["O YOSHI QUER KIWI E XALE", "O JACARE VAI PARA A FLORESTA", "O CAÇADOR OBSERVA A ZEBRA NO BOSQUE", "A ZEBRA E O CAVALO BRINCAM NO BOSQUE", "A TARTARUGA E O GATO PULAM PARA O TOPO", "O PAPAGAIO ESCREVE NO QUADRO E OBSERVA A ZEBRA", "A ZEBRA E O YOSHI BRINCAM COM O CAVALO NO BOSQUE"],
};

function findBrowser() {
  const candidates = [
    process.env.YOSHI_BROWSER,
    process.env.EDGE_BIN,
    process.env.CHROME_BIN,
    process.platform === "win32" ? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" : null,
    process.platform === "win32" ? "C:/Program Files/Microsoft/Edge/Application/msedge.exe" : null,
    process.platform === "win32" ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : null,
  ].filter(Boolean);
  for (const candidate of candidates) {
    try { if (candidate.includes("/") || candidate.includes("\\")) { if (spawnSync(process.platform === "win32" ? "where.exe" : "which", [candidate], { stdio: "ignore" }).status === 0 || candidate.toLowerCase().endsWith(".exe")) return candidate; } }
    catch { /* check the next candidate */ }
  }
  for (const name of ["msedge", "microsoft-edge", "google-chrome", "chromium", "chromium-browser"]) {
    try {
      const found = spawnSync(process.platform === "win32" ? "where.exe" : "which", [name], { encoding: "utf8" });
      if (found.status === 0) return found.stdout.trim().split(/\r?\n/)[0];
    } catch { /* check the next candidate */ }
  }
  return null;
}

const browserPath = findBrowser();
if (!browserPath) {
  console.error("SKIP: Chromium/Edge was not found. Set YOSHI_BROWSER to its executable path to run browser checks.");
  process.exitCode = 2;
} else {
  const contentTypes = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml" };
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
      const file = path.resolve(appRoot, `.${pathname}`);
      if (file !== appRoot && !file.startsWith(`${appRoot}${path.sep}`)) throw new Error("outside app root");
      const body = await fs.readFile(file);
      response.writeHead(200, { "content-type": contentTypes[path.extname(file)] || "application/octet-stream", "cache-control": "no-store" });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });

  let browser;
  let cdp;
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), "yoshi-edge-"));
  const screenshotDir = process.env.YOSHI_SCREENSHOT_DIR || path.join(os.tmpdir(), "yoshi-typing-captures");

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
        evaluate: async (expression) => {
          const response = await client.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
          if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || "Browser evaluation failed");
          return response.result?.value;
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
        if (message.method) listeners.set(message.method, (listeners.get(message.method) || []).filter(() => false));
      });
      socket.addEventListener("error", () => failAll(new Error("DevTools WebSocket failed")));
      socket.addEventListener("close", () => failAll(new Error("DevTools WebSocket closed")));
      socket.addEventListener("error", reject, { once: true });
    });
  }

  async function evaluate(expression) { return cdp.evaluate(expression); }
  async function navigate(url) {
    const loaded = cdp.waitFor("Page.loadEventFired");
    await cdp.send("Page.navigate", { url });
    await loaded;
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  async function click(selector, navigation = false) {
    const loaded = navigation ? cdp.waitFor("Page.loadEventFired") : null;
    const found = await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)return false;el.click();return true})()`);
    assert.equal(found, true, `browser found ${selector}`);
    if (loaded) await loaded;
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  async function measure(label) {
    const result = await evaluate(`(()=>{const root=document.documentElement;const offenders=[...document.querySelectorAll('body *')].filter(el=>el.id!=='youtube-player'&&!el.closest('#youtube-player')).map(el=>{const r=el.getBoundingClientRect();return{tag:el.tagName.toLowerCase(),id:el.id,cls:typeof el.className==='string'?el.className:'',left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),text:(el.innerText||'').slice(0,50)}}).filter(el=>el.width>0&&(el.left < -1 || el.right > root.clientWidth+1)).slice(0,12);return{innerWidth,clientWidth:root.clientWidth,scrollWidth:root.scrollWidth,overflowByClient:Math.max(0,root.scrollWidth-root.clientWidth),offenders}})()`);
    assert.equal(result.overflowByClient, 0, `${label}: document scroll width stays within the content viewport (${JSON.stringify(result)})`);
    assert.deepEqual(result.offenders, [], `${label}: no visible interface element crosses the content width`);
    return result;
  }
  async function assertHomeFlowerLayout(label, viewportWidth) {
    const stylesheetUrl = await evaluate(`document.querySelector('link[rel="stylesheet"][href*="yoshi.css"]')?.getAttribute("href") || ""`);
    assert.match(stylesheetUrl, /yoshi\.css\?v=yoshi-kamek-shared-audio-2026-10-21-1/, `${label}: current flower CSS revision is loaded`);
    const result = await evaluate(`(async()=>{const flower=document.querySelector(".yoshi-with-flower > .flower-art");const yoshi=document.querySelector(".yoshi-with-flower > .yoshi-art");const container=document.querySelector(".yoshi-with-flower");const hero=document.querySelector(".hero-art");const scene=document.querySelector(".home-hero");if(!yoshi||!flower||!container||!hero||!scene)return null;if(!yoshi.complete)await Promise.race([new Promise(resolve=>yoshi.addEventListener("load",resolve,{once:true})),new Promise(resolve=>setTimeout(resolve,10000))]);const y=yoshi.getBoundingClientRect(),f=flower.getBoundingClientRect(),c=container.getBoundingClientRect(),h=hero.getBoundingClientRect(),g=scene.getBoundingClientRect(),s=getComputedStyle(flower);const canvas=document.createElement("canvas");canvas.width=flower.naturalWidth;canvas.height=flower.naturalHeight;const ctx=canvas.getContext("2d");ctx.drawImage(flower,0,0);const rgba=ctx.getImageData(0,0,canvas.width,canvas.height).data;let transparentPixels=0,opaquePixels=0;for(let i=3;i<rgba.length;i+=4){if(rgba[i]===0)transparentPixels++;if(rgba[i]===255)opaquePixels++}return{flower:{width:f.width,height:f.height,left:f.left,right:f.right,top:f.top,bottom:f.bottom,centerX:f.left+f.width/2,cssWidth:s.width,cssHeight:s.height,minWidth:s.minWidth,maxWidth:s.maxWidth,flex:s.flex,position:s.position,naturalWidth:flower.naturalWidth,naturalHeight:flower.naturalHeight,transparentPixels,opaquePixels,cornerAlpha:rgba[3]},yoshi:{left:y.left,right:y.right,top:y.top,height:y.height,centerX:y.left+y.width/2,naturalWidth:yoshi.naturalWidth,naturalHeight:yoshi.naturalHeight,complete:yoshi.complete},container:{left:c.left,right:c.right,top:c.top,bottom:c.bottom,width:c.width,height:c.height},hero:{left:h.left,right:h.right,top:h.top,bottom:h.bottom},scene:{left:g.left,right:g.right,top:g.top,bottom:g.bottom}}})()`);
    assert.ok(result, `${label}: Yoshi and flower exist in the hero`);
    const expectedSize = viewportWidth <= 620 ? 20 : viewportWidth <= 850 ? 22 : 24;
    assert.ok(result.yoshi.complete && result.yoshi.naturalWidth > 0, `${label}: the Yoshi artwork loaded for visual comparison (${JSON.stringify(result.yoshi)})`);
    assert.equal(result.flower.position, "absolute", `${label}: flower uses absolute positioning inside its dedicated container`);
    assert.equal(result.flower.width, expectedSize, `${label}: rendered flower width is ${expectedSize}px, independent of the ${result.flower.naturalWidth}px source`);
    assert.equal(result.flower.height, expectedSize, `${label}: rendered flower height is ${expectedSize}px`);
    assert.equal(result.flower.cssWidth, `${expectedSize}px`, `${label}: computed CSS width agrees with the rendered dimensions`);
    assert.equal(result.flower.cssHeight, `${expectedSize}px`, `${label}: computed CSS height agrees with the rendered dimensions`);
    assert.ok(result.flower.transparentPixels > 0 && result.flower.opaquePixels > 0 && result.flower.cornerAlpha === 0, `${label}: bundled PNG uses transparent pixels rather than a checkerboard background`);
    assert.ok(result.flower.centerX > result.yoshi.centerX, `${label}: flower is to the right of Yoshi (${JSON.stringify(result)})`);
    assert.ok(result.flower.top < result.yoshi.top, `${label}: flower is above Yoshi (${JSON.stringify(result)})`);
    assert.ok(result.flower.left >= result.container.left && result.flower.right <= result.container.right, `${label}: flower remains within the Yoshi illustration area (${JSON.stringify(result)})`);
    assert.ok(result.flower.top >= result.scene.top && result.flower.bottom <= result.scene.bottom, `${label}: flower is not clipped by the home hero section (${JSON.stringify(result)})`);
    return result;
  }
  async function assertFingerColors(label) {
    const info = await evaluate(`(()=>[...document.querySelectorAll(".keycap[data-key]")].map(key=>{const finger=window.YoshiWorldData.fingers[key.dataset.key];const swatch=document.querySelector(".legend-swatch."+finger);return{key:key.dataset.key,finger,background:getComputedStyle(key).backgroundColor,legend:swatch?getComputedStyle(swatch).backgroundColor:null,next:key.classList.contains("is-next"),used:key.classList.contains("is-used")}}))()`);
    assert.ok(info.length > 0, `${label}: the keyboard has mapped keys`);
    for (const key of info) {
      assert.ok(key.finger && key.legend, `${label}: ${key.key} has a finger in the legend`);
      assert.equal(key.background, key.legend, `${label}: ${key.key} matches the ${key.finger} legend for normal/active/used states`);
    }
    return info;
  }
  async function setViewport(width) {
    await cdp.send("Emulation.setDeviceMetricsOverride", { width, height: 1100, deviceScaleFactor: 1, mobile: false });
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  async function saveScreenshot(name) {
    const result = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, fromSurface: true });
    await fs.writeFile(path.join(screenshotDir, `${name}.png`), Buffer.from(result.data, "base64"));
  }
  async function saveHeroScreenshot(name) {
    await fs.mkdir(screenshotDir, { recursive: true });
    const clip = await evaluate(`(()=>{const r=document.querySelector('.home-hero').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}})()`);
    const result = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, fromSurface: true, clip: { ...clip, scale: 1 } });
    await fs.writeFile(path.join(screenshotDir, `${name}.png`), Buffer.from(result.data, "base64"));
  }
  async function dispatchKey(char) {
    const key = char === " " ? " " : char;
    const code = char === " " ? "Space" : /^[A-Z]$/i.test(char) ? `Key${char.toUpperCase()}` : "Semicolon";
    await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key, code, text: char });
    await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key, code });
  }
  async function pressEnter() {
    await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
    await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  async function typeCurrentTarget(expected) {
    const actualTarget = await evaluate(`[...document.querySelectorAll('#target-row .target-char')].map(el=>el.textContent==='␣'?' ':el.textContent).join('')`);
    assert.equal(actualTarget, expected, `browser target is fully visible: ${expected}`);
    let prefix = "";
    for (const char of expected) {
      await dispatchKey(char);
      prefix += char === " " ? "␣" : char;
      const typedSoFar = await evaluate(`document.querySelector('#typed-display')?.textContent`);
      assert.equal(typedSoFar, prefix, `browser accepted and displayed input through ${prefix}`);
      assert.equal(await evaluate(`document.querySelectorAll('#target-row .target-char.is-done').length`), [...prefix].length, `browser advances its character index through ${prefix}`);
    }
    const typed = await evaluate(`document.querySelector('#typed-display')?.textContent`);
    assert.equal(typed, [...expected].map((char) => char === " " ? "␣" : char).join(""), `browser accepted and displayed ${expected}`);
    const advanceState = await evaluate(`({disabled:document.querySelector('#next-checkpoint').disabled,header:document.querySelector('#checkpoint-progress').textContent,typed:document.querySelector('#typed-display').textContent,feedback:document.querySelector('#typing-feedback').textContent,finger:document.querySelector('#current-finger').textContent,active:[...document.querySelectorAll('.target-char.is-current')].map(e=>e.textContent),target:document.querySelector('#target-row').innerText,saved:JSON.parse(localStorage.getItem("exploradores.yoshi-typing.progress.v2")),focusedId:document.activeElement?.id,buttonText:document.querySelector('#next-checkpoint').textContent})`);
    assert.equal(advanceState.disabled, false, `checkpoint advances only after every character is typed (${JSON.stringify(advanceState)})`);
    assert.equal(advanceState.focusedId, "next-checkpoint", "the final character transfers focus to the continue button");
    assert.match(advanceState.feedback, /Pressione Enter para continuar/i, "the completed exercise explains the Enter shortcut");
    assert.match(advanceState.buttonText, /^Continuar para checkpoint \d+$|^Concluir mundo$/, "the focused button advertises the available action");
  }
  async function completeWorld(worldId) {
    for (const target of targets[worldId]) {
      await typeCurrentTarget(target);
      await pressEnter();
      if (target !== targets[worldId].at(-1)) {
        const next = await evaluate(`document.querySelector('#checkpoint-progress').textContent`);
        assert.match(next, new RegExp(`CHECKPOINT ${targets[worldId].indexOf(target) + 2}/${targets[worldId].length}`), "header updates immediately when the next checkpoint opens");
      }
    }
    assert.equal(await evaluate(`document.querySelector('#checkpoint-progress').textContent`), `CHECKPOINT ${targets[worldId].length}/${targets[worldId].length}`, "last checkpoint remains in the header on completion");
  }

  try {
    await new Promise((resolve, reject) => server.listen(0, "127.0.0.1", resolve).once("error", reject));
    const port = server.address().port;
    const args = ["--headless=new", "--disable-gpu", "--no-first-run", `--user-data-dir=${profile}`, "--remote-debugging-port=0", "about:blank"];
    if (process.platform !== "win32") args.splice(2, 0, "--no-sandbox");
    browser = spawn(browserPath, args, { stdio: "ignore" });
    const activePortFile = path.join(profile, "DevToolsActivePort");
    let activePort;
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
      try { activePort = (await fs.readFile(activePortFile, "utf8")).split(/\r?\n/); break; }
      catch { await new Promise((resolve) => setTimeout(resolve, 100)); }
    }
    assert.ok(activePort?.[0], "headless browser opened its DevTools endpoint");
    const targetsResponse = await fetch(`http://127.0.0.1:${activePort[0]}/json/list`);
    const targetsList = await targetsResponse.json();
    const page = targetsList.find((target) => target.type === "page");
    assert.ok(page?.webSocketDebuggerUrl, "headless browser exposed a page target");
    cdp = await connectCdp(page.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1366, height: 1100, deviceScaleFactor: 1, mobile: false });
    const baseUrl = `http://127.0.0.1:${port}/`;
    await navigate(`${baseUrl}index.html`);
    await evaluate(`localStorage.removeItem(${JSON.stringify(storageKey)});sessionStorage.removeItem(${JSON.stringify(storageKey)})`);

    // Check the responsive views in home, exercise, narrative, bonus and final-reward states.
    const screenshots = [];
    const heroScreenshots = [];
    const flowerMeasurements = [];
    const responsiveStates = [
      { name: "home", path: "index.html", state: null, action: null },
      { name: "exercise", path: "01-flower-garden.html", state: null, action: "#start-world" },
      { name: "kamek", path: "03-crystal-caves.html", state: { version: 2, currentWorld: 3, completedWorlds: [1, 2], completedBonus: false, checkpoints: { 1: 10, 2: 10, 3: 0, 4: 0 } }, action: null },
      { name: "bonus-long", path: "04-bonus-challenge.html", state: { version: 2, currentWorld: 4, completedWorlds: [1, 2, 3], completedBonus: false, checkpoints: { 1: 10, 2: 10, 3: 10, 4: 0 } }, action: "#start-world", screenshot: true },
      { name: "main-finish", path: "03-crystal-caves.html", state: { version: 2, currentWorld: 3, completedWorlds: [1, 2, 3], completedBonus: false, checkpoints: { 1: 10, 2: 10, 3: 10, 4: 0 } }, action: null },
      { name: "bonus-finish", path: "04-bonus-challenge.html", state: { version: 2, currentWorld: 4, completedWorlds: [1, 2, 3], completedBonus: true, checkpoints: { 1: 10, 2: 10, 3: 10, 4: 7 } }, action: null },
    ];
    const responsiveResults = [];
    for (const width of [320, 390, 768, 1366]) {
      await setViewport(width);
      for (const state of responsiveStates) {
        if (state.state) await evaluate(`localStorage.setItem(${JSON.stringify(storageKey)},${JSON.stringify(JSON.stringify(state.state))})`);
        else await evaluate(`localStorage.removeItem(${JSON.stringify(storageKey)})`);
        await navigate(`${baseUrl}${state.path}?layout=${width}-${state.name}`);
        if (state.action) {
          await evaluate(`window.YoshiAudio={play(){},pause(){},changeTrack(){}}`);
          await click(state.action);
        }
        const metrics = await measure(`${width}px ${state.name}`);
        let flowerLayout;
        if (state.name === "home") {
          flowerLayout = await assertHomeFlowerLayout(`${width}px home`, width);
          flowerMeasurements.push({ viewport: width, flower: flowerLayout.flower, yoshi: flowerLayout.yoshi, container: flowerLayout.container });
          if (width === 320 || width === 1366) {
            await saveHeroScreenshot(`yoshi-hero-${width}px`);
            heroScreenshots.push(path.join(screenshotDir, `yoshi-hero-${width}px.png`));
          }
        }
        responsiveResults.push({ width, state: state.name, ...metrics, ...(flowerLayout ? { flower: flowerLayout.flower } : {}) });
        if (state.screenshot) {
          await fs.mkdir(screenshotDir, { recursive: true });
          await saveScreenshot(`yoshi-bonus-${width}px`);
          screenshots.push(path.join(screenshotDir, `yoshi-bonus-${width}px.png`));
        }
        if (state.name === "exercise" || state.name === "bonus-long") await assertFingerColors(`${width}px ${state.name}`);
        if (state.name === "exercise") {
          const allKeysShown = await evaluate(`(()=>{const a=[...document.querySelectorAll('#target-row .target-char')].map(el=>el.textContent==='␣'?' ':el.textContent).join('');return a==='ASDF JKLÇ ASDF JKLÇ'})()`);
          assert.equal(allKeysShown, true, `${width}px exercise displays its full target`);
        }
        if (state.name === "bonus-long") {
          const target = await evaluate(`[...document.querySelectorAll('#target-row .target-char')].map(el=>el.textContent==='␣'?' ':el.textContent).join('')`);
          assert.equal(target, targets[4][0], `${width}px bonus displays every target character`);
        }
        if (state.name === "main-finish") {
          assert.equal(await evaluate(`document.querySelector('#checkpoint-progress').textContent`), "CHECKPOINT 10/10");
          assert.equal(await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})).completedBonus`), false, "main reward does not require the bonus");
        }
      }
    }

    // Exercise trusted keydown, errors, paste/drop protection, typed feedback and restart.
    await setViewport(1366);
    await evaluate(`localStorage.removeItem(${JSON.stringify(storageKey)})`);
    await navigate(`${baseUrl}01-flower-garden.html`);
    await evaluate(`window.YoshiAudio={play(){},pause(){},changeTrack(){}}`);
    assert.deepEqual(await evaluate(`[...document.querySelectorAll('.guide-card .keycap[data-key]')].map(el=>el.dataset.key)`), ["a", "s", "d", "f", "j", "k", "l", "ç", " "], "World 1 visually introduces both hands on the home row and space");
    await click("#start-world");
    assert.equal(await evaluate(`document.querySelector('#checkpoint-progress').textContent`), "CHECKPOINT 1/10");
    const captureState = await evaluate(`(()=>{const input=document.getElementById('typing-box');const rect=input.getBoundingClientRect();const style=getComputedStyle(input);return{height:rect.height,computedHeight:style.height,opacity:style.opacity,left:rect.left,active:document.activeElement===input}})()`);
    assert.equal(captureState.height, 0, `typing-box has zero rendered height: ${JSON.stringify(captureState)}`);
    assert.equal(captureState.computedHeight, '0px', 'typing-box computes to exactly zero height');
    assert.equal(captureState.opacity, '0', 'typing-box is visually transparent');
    assert.ok(captureState.left < -1000, 'typing-box is positioned offscreen');
    assert.equal(captureState.active, true, 'typing-box remains focused to receive physical keyboard events');
    await evaluate(`window.__trusted=false;document.querySelector('#typing-box').addEventListener('keydown',e=>window.__trusted=e.isTrusted,{capture:true})`);
    await dispatchKey("Z");
    assert.equal(await evaluate(`document.querySelector('#typed-display').textContent`), "—", "a wrong key does not erase or advance typed progress");
    await dispatchKey("A");
    const colorsAfterA = await assertFingerColors("A typed, S next");
    assert.equal(colorsAfterA.find((key) => key.key === "a")?.used, true, "A marked as previously used");
    assert.equal(colorsAfterA.find((key) => key.key === "s")?.next, true, "S now highlighted in its own finger color");
    assert.equal(await evaluate(`window.__trusted`), true, "CDP key input reaches the page as a trusted browser event");
    assert.equal(await evaluate(`document.querySelector('#typed-display').textContent`), "A", "the correctly typed character is visible");
    await evaluate(`document.querySelector('#typing-box').dispatchEvent(new KeyboardEvent('keydown',{key:'S',bubbles:true}));document.querySelector('#typing-box').dispatchEvent(new Event('paste',{bubbles:true,cancelable:true}));document.querySelector('#typing-box').dispatchEvent(new Event('drop',{bubbles:true,cancelable:true}))`);
    assert.equal(await evaluate(`document.querySelector('#typed-display').textContent`), "A", "synthetic keys, paste and drop cannot change correct input");
    await click("#restart-exercise");
    assert.equal(await evaluate(`document.querySelector('#typed-display').textContent`), "—", "restart clears only the current exercise display");
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})).checkpoints[1]`), 0, "restart leaves previously completed checkpoints intact");
    await typeCurrentTarget(targets[1][0]);
    assert.equal(await evaluate(`document.activeElement?.id`), "next-checkpoint", "the first checkpoint completion focuses its continue button");
    await pressEnter();
    assert.equal(await evaluate(`document.querySelector('#checkpoint-progress').textContent`), "CHECKPOINT 2/10", "Enter opens checkpoint 2 without a mouse click");
    await navigate(`${baseUrl}01-flower-garden.html?resume=1`);
    assert.equal(await evaluate(`document.querySelector('#checkpoint-progress').textContent`), "CHECKPOINT 2/10", "reloading resumes at the correct next checkpoint");

    // Finish the three required worlds with browser-dispatched physical key events.
    await click("#start-world");
    await typeCurrentTarget(targets[1][1]);
    await pressEnter();
    for (let index = 2; index < targets[1].length; index += 1) {
      await typeCurrentTarget(targets[1][index]);
      await pressEnter();
    }
    assert.match(await evaluate(`document.querySelector('.world-finish').innerText`), /Este mundo está concluído/);
    await click('a[href="02-forest-path.html"]', true);
    await evaluate(`window.YoshiAudio={play(){},pause(){},changeTrack(){}}`);
    const forestTip = await evaluate(`document.querySelector(".row-teaching")?.innerText || ""`);
    assert.ok(forestTip.includes("F · G · R · T"), "Forest Path groups F/G and R/T under the left index finger");
    assert.ok(forestTip.includes("J · H · Y · U"), "Forest Path groups J/H and Y/U under the right index finger");
    assert.ok(forestTip.includes("V/B") && forestTip.includes("N/M"), "Forest Path states that V/B/N/M are reserved for the bonus");
    const forestKeys = await evaluate(`[...document.querySelectorAll('.guide-card .keycap[data-key]')].map(el=>el.dataset.key)`);
    for (const key of ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ç", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", " "]) assert.ok(forestKeys.includes(key), `World 2 keeps taught key ${JSON.stringify(key)} visible`);
    for (const key of ["z", "x", "c", "v", "b", "n", "m"]) assert.ok(!forestKeys.includes(key), `World 2 does not present lower-row key ${key} yet`);
    await evaluate(`window.__forestTracks=[];window.YoshiAudio={play(){},pause(){},changeTrack(id,play){window.__forestTracks.push({id,play})}}`);
    await click("#start-world");
    const forestTracks = await evaluate(`window.__forestTracks`);
    assert.ok(forestTracks.some(track => track.id === "UKP3kPtweio" && track.play === true), "Forest Path starts its requested soundtrack");
    await assertFingerColors("world 2 upper/home rows and space");
    await completeWorld(2);
    await click('a[href="03-crystal-caves.html"]', true);
    assert.equal(await evaluate("document.querySelector('#checkpoint-progress').textContent"), "CHECKPOINT 1/10");
    assert.equal(await evaluate("document.querySelector('#audio-toggle').disabled"), false, "the shared toolbar control is enabled during Kamek's scene");
    assert.equal(await evaluate("!!document.querySelector('#story-audio')"), false, "Kamek has no second audio button");
    assert.equal(await evaluate("document.querySelector('#story-continue').textContent.trim()"), "Continuar", "the lower action has only the Continue label");
    await evaluate("window.__fakeAudioLog=[];window.__fakeAudioInstances=0;window.YT={PlayerState:{PLAYING:1,PAUSED:2,ENDED:0},Player:function(host,options){const player=this;window.__fakeAudioInstances+=1;player.video=options.videoId;player.setVolume=()=>{};player.mute=()=>{};player.unMute=()=>{};player.pauseVideo=()=>window.__fakeAudioLog.push('pause:'+player.video);player.playVideo=()=>window.__fakeAudioLog.push('play:'+player.video);player.loadVideoById=({videoId})=>{player.video=videoId;window.__fakeAudioLog.push('load:'+videoId)};player.getVideoData=()=>({video_id:player.video});setTimeout(()=>options.events.onReady({target:player}),500)}}");
    await click("#audio-toggle");
    await evaluate("new Promise(resolve=>setTimeout(resolve,600))");
    let trackLog = await evaluate("window.__fakeAudioLog");
    assert.equal(await evaluate("window.__fakeAudioInstances"), 1, "the shared toolbar creates one YouTube player for Kamek's message");
    assert.ok(trackLog.includes("play:BEP3rdTy0-o"), "Ouvir trilha starts Kamek's music");
    assert.equal(await evaluate("document.querySelector('#audio-toggle').textContent.trim()"), "Ⅱ Pausar trilha", "the toolbar offers pause while Kamek's music is playing");
    await click("#audio-toggle");
    trackLog = await evaluate("window.__fakeAudioLog");
    assert.ok(trackLog.includes("pause:BEP3rdTy0-o"), "the same toolbar pauses Kamek's music without navigating away");
    assert.equal(await evaluate("document.querySelector('#audio-toggle').textContent.trim()"), "♪ Ouvir trilha", "the toolbar returns to its play label after pausing");
    await click("#story-continue");
    assert.equal(await evaluate("document.querySelector('#audio-toggle').disabled"), false);
    const caveKeys = await evaluate("[...document.querySelectorAll('.guide-card .keycap[data-key]')].map(el=>el.dataset.key)");
    for (const key of ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "g", "h"]) assert.ok(caveKeys.includes(key), `Crystal Caves presents home/upper key ${key}`);
    for (const key of ["z", "x", "c", "v", "b", "n", "m"]) assert.ok(!caveKeys.includes(key), `Crystal Caves leaves lower-row key ${key} to the bonus`);
    await click("#start-world");
    await assertFingerColors("world 3 upper/lower rows and space");
    await evaluate("new Promise(resolve=>setTimeout(resolve,100))");
    trackLog = await evaluate("window.__fakeAudioLog");
    assert.ok(trackLog.includes("pause:BEP3rdTy0-o"), "leaving Kamek pauses the story audio");
    assert.ok(trackLog.includes("load:IJy7jK-TM40"), "the cave track loads after leaving the story");
    assert.ok(trackLog.lastIndexOf("play:BEP3rdTy0-o") < trackLog.lastIndexOf("load:IJy7jK-TM40"), "Kamek's message does not restart after the cave track is selected");
    await navigate(`${baseUrl}03-crystal-caves.html?shared-audio-race=1`);
    assert.equal(await evaluate("document.querySelector('#audio-toggle').disabled"), false, "Kamek's scene enables the shared audio control after reload");
    await evaluate("window.__fakeAudioLog=[];window.__fakeAudioInstances=0;window.YT={PlayerState:{PLAYING:1,PAUSED:2,ENDED:0},Player:function(host,options){const player=this;window.__fakeAudioInstances+=1;player.video=options.videoId;player.setVolume=()=>{};player.mute=()=>{};player.unMute=()=>{};player.pauseVideo=()=>window.__fakeAudioLog.push('pause:'+player.video);player.playVideo=()=>window.__fakeAudioLog.push('play:'+player.video);player.loadVideoById=({videoId})=>{player.video=videoId;window.__fakeAudioLog.push('load:'+videoId)};player.getVideoData=()=>({video_id:player.video});setTimeout(()=>options.events.onReady({target:player}),500)}}");
    await click("#audio-toggle");
    assert.equal(await evaluate("document.querySelector('#audio-toggle').textContent.trim()"), "Ⅱ Pausar trilha", "the toolbar can cancel audio while YouTube is still initializing");
    await click("#story-continue");
    await click("#start-world");
    await evaluate("new Promise(resolve=>setTimeout(resolve,700))");
    const lateTrackLog = await evaluate("window.__fakeAudioLog");
    assert.equal(await evaluate("window.__fakeAudioInstances"), 1, "late audio requests share the same not-yet-ready player");
    assert.ok(lateTrackLog.includes("load:IJy7jK-TM40"), "the cave track replaces the pending Kamek request");
    assert.ok(!lateTrackLog.includes("play:BEP3rdTy0-o"), "a pending Kamek request cannot start after Continue opens the cave guide");
    await completeWorld(3);
    assert.match(await evaluate(`document.querySelector('.world-finish').innerText`), /três mundos obrigatórios/);
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})).completedBonus`), false, "completing the main adventure leaves bonus optional");
    assert.equal(await evaluate(`document.querySelector('#checkpoint-progress').textContent`), "CHECKPOINT 10/10");

    // The end of the main adventure offers a true stop and keeps the bonus optional.
    await click('a[href="index.html?ending=main"]', true);
    assert.match(await evaluate(`document.querySelector('#ending-banner').innerText`), /aventura principal concluída/i);
    assert.equal(await evaluate(`!!document.querySelector('#ending-banner a[href="04-bonus-challenge.html"]')`), true);
    await click("#new-game");
    assert.equal(await evaluate(`document.querySelector('#reset-dialog').open`), true, "new game requires confirmation when progress is saved");
    await click("#cancel-reset");
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})).completedWorlds.length`), 3, "cancelling reset preserves the completed worlds");

    // Session storage preserves progress across route changes and reloads when local storage is blocked.
    const sessionState = { version: 2, currentWorld: 2, completedWorlds: [1], completedBonus: false, checkpoints: { 1: 10, 2: 1, 3: 0, 4: 0 } };
    await evaluate(`localStorage.removeItem(${JSON.stringify(storageKey)});sessionStorage.setItem(${JSON.stringify(storageKey)},${JSON.stringify(JSON.stringify(sessionState))})`);
    const localBlock = await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: "Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('blocked','SecurityError')}})" });
    await navigate(`${baseUrl}02-forest-path.html?storage=session`);
    assert.equal(await evaluate(`document.querySelector('#checkpoint-progress').textContent`), "CHECKPOINT 2/10", "session storage resumes the next open checkpoint");
    assert.match(await evaluate(`document.querySelector('#persistence-status').textContent`), /sessionStorage|sessão do navegador/i);
    await evaluate(`window.YoshiAudio={play(){},pause(){},changeTrack(){}}`);
    await click("#start-world");
    await navigate(`${baseUrl}02-forest-path.html?storage=reload`);
    assert.equal(await evaluate(`document.querySelector('#checkpoint-progress').textContent`), "CHECKPOINT 2/10", "session progress survives reload");
    await cdp.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: localBlock.identifier });

    // If both stores are unavailable, the page states the limit instead of promising continuity.
    await evaluate(`sessionStorage.removeItem(${JSON.stringify(storageKey)})`);
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: "Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('blocked','SecurityError')}});Object.defineProperty(window,'sessionStorage',{configurable:true,get(){throw new DOMException('blocked','SecurityError')}})" });
    await navigate(`${baseUrl}index.html?storage=memory`);
    assert.match(await evaluate(`document.querySelector('#save-summary').textContent`), /trocar de mundo ou recarregar reinicia/i);
    assert.match(await evaluate(`document.querySelector('#persistence-status').textContent`), /trocar de mundo ou recarregar reinicia/i);
    await click("#begin-adventure", true);
    assert.match(await evaluate(`document.querySelector('#persistence-status').textContent`), /trocar de mundo ou recarregar reinicia/i);

    console.log(`OK: ${responsiveResults.length} Chromium viewport/state layouts; screenshots: ${screenshots.join(", ")}`);
    console.log(`OK: measured flower and Yoshi boxes; hero screenshots: ${heroScreenshots.join(", ")}`);
    console.log(JSON.stringify(flowerMeasurements));
    console.log("OK: trusted physical-key path, displayed text/space, errors, paste/drop, restart, progress header and reload");
    console.log("OK: all three required worlds completed without the bonus; delayed YouTube readiness cannot restart Kamek over the cave track");
    console.log("OK: reset confirmation, session-only reload continuity and truthful memory-only messaging");
    console.log(JSON.stringify(responsiveResults.map(({ width, state, innerWidth, clientWidth, scrollWidth, overflowByClient }) => ({ width, state, innerWidth, clientWidth, scrollWidth, overflowByClient }))));
  } finally {
    cdp?.close();
    browser?.kill();
    await new Promise((resolve) => server.close(resolve));
  }
}
