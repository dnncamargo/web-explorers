import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const storageKey = "exploradores.yoshi-typing.progress.v1";
const targets = {
  1: ["ASDF", "FDSA", "ASAS", "DFDF", "ASDF FDSA"],
  2: ["JKLÇ", "ÇLKJ", "JKJK", "LÇLÇ", "JKLÇ ÇLKJ"],
  3: ["ASDF JKLÇ", "QWERT YUIOP", "ZXCV BNM", "CASA SAPO VIDA", "A FOCA PULA"],
  4: ["ASASDASDFFDFDSFDSA", "JKJKLJKLÇÇLÇLKÇLKJ", "QWERT ZXCV", "PATO LIVRO CAVALO", "A FOCA PULA NA SALA"],
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
  async function dispatchKey(char) {
    const key = char === " " ? " " : char;
    const code = char === " " ? "Space" : /^[A-Z]$/i.test(char) ? `Key${char.toUpperCase()}` : "Semicolon";
    await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key, code, text: char });
    await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key, code });
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
    const advanceState = await evaluate(`({disabled:document.querySelector('#next-checkpoint').disabled,header:document.querySelector('#checkpoint-progress').textContent,typed:document.querySelector('#typed-display').textContent,feedback:document.querySelector('#typing-feedback').textContent,finger:document.querySelector('#current-finger').textContent,active:[...document.querySelectorAll('.target-char.is-current')].map(e=>e.textContent),target:document.querySelector('#target-row').innerText,saved:JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)}))})`);
    assert.equal(advanceState.disabled, false, `checkpoint advances only after every character is typed (${JSON.stringify(advanceState)})`);
  }
  async function completeWorld(worldId) {
    for (const target of targets[worldId]) {
      await typeCurrentTarget(target);
      await click("#next-checkpoint");
      if (target !== targets[worldId].at(-1)) {
        const next = await evaluate(`document.querySelector('#checkpoint-progress').textContent`);
        assert.match(next, new RegExp(`CHECKPOINT ${targets[worldId].indexOf(target) + 2}/5`), "header updates immediately when the next checkpoint opens");
      }
    }
    assert.equal(await evaluate(`document.querySelector('#checkpoint-progress').textContent`), "CHECKPOINT 5/5", "fifth checkpoint remains in the header on completion");
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
    const responsiveStates = [
      { name: "home", path: "index.html", state: null, action: null },
      { name: "exercise", path: "01-flower-garden.html", state: null, action: "#start-world" },
      { name: "kamek", path: "03-crystal-caves.html", state: { version: 1, currentWorld: 3, completedWorlds: [1, 2], completedBonus: false, checkpoints: { 1: 5, 2: 5, 3: 0, 4: 0 } }, action: null },
      { name: "bonus-long", path: "04-bonus-challenge.html", state: { version: 1, currentWorld: 4, completedWorlds: [1, 2, 3], completedBonus: false, checkpoints: { 1: 5, 2: 5, 3: 5, 4: 0 } }, action: "#start-world", screenshot: true },
      { name: "main-finish", path: "03-crystal-caves.html", state: { version: 1, currentWorld: 3, completedWorlds: [1, 2, 3], completedBonus: false, checkpoints: { 1: 5, 2: 5, 3: 5, 4: 0 } }, action: null },
      { name: "bonus-finish", path: "04-bonus-challenge.html", state: { version: 1, currentWorld: 4, completedWorlds: [1, 2, 3], completedBonus: true, checkpoints: { 1: 5, 2: 5, 3: 5, 4: 5 } }, action: null },
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
        responsiveResults.push({ width, state: state.name, ...metrics });
        if (state.screenshot) {
          await fs.mkdir(screenshotDir, { recursive: true });
          await saveScreenshot(`yoshi-bonus-${width}px`);
          screenshots.push(path.join(screenshotDir, `yoshi-bonus-${width}px.png`));
        }
        if (state.name === "exercise" || state.name === "bonus-long") await assertFingerColors(`${width}px ${state.name}`);
        if (state.name === "exercise") {
          const allKeysShown = await evaluate(`(()=>{const a=[...document.querySelectorAll('#target-row .target-char')].map(el=>el.textContent==='␣'?' ':el.textContent).join('');return a==='ASDF'})()`);
          assert.equal(allKeysShown, true, `${width}px exercise displays its full target`);
        }
        if (state.name === "bonus-long") {
          const target = await evaluate(`[...document.querySelectorAll('#target-row .target-char')].map(el=>el.textContent==='␣'?' ':el.textContent).join('')`);
          assert.equal(target, targets[4][0], `${width}px bonus displays every target character`);
        }
        if (state.name === "main-finish") {
          assert.equal(await evaluate(`document.querySelector('#checkpoint-progress').textContent`), "CHECKPOINT 5/5");
          assert.equal(await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})).completedBonus`), false, "main reward does not require the bonus");
        }
      }
    }

    // Exercise trusted keydown, errors, paste/drop protection, typed feedback and restart.
    await setViewport(1366);
    await evaluate(`localStorage.removeItem(${JSON.stringify(storageKey)})`);
    await navigate(`${baseUrl}01-flower-garden.html`);
    await evaluate(`window.YoshiAudio={play(){},pause(){},changeTrack(){}}`);
    await click("#start-world");
    assert.equal(await evaluate(`document.querySelector('#checkpoint-progress').textContent`), "CHECKPOINT 1/5");
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
    await click("#next-checkpoint");
    assert.equal(await evaluate(`document.querySelector('#checkpoint-progress').textContent`), "CHECKPOINT 2/5", "the permanent indicator updates as soon as checkpoint 2 opens");
    await navigate(`${baseUrl}01-flower-garden.html?resume=1`);
    assert.equal(await evaluate(`document.querySelector('#checkpoint-progress').textContent`), "CHECKPOINT 2/5", "reloading resumes at the correct next checkpoint");

    // Finish the three required worlds with browser-dispatched physical key events.
    await click("#start-world");
    await typeCurrentTarget(targets[1][1]);
    await click("#next-checkpoint");
    for (let index = 2; index < 5; index += 1) {
      await typeCurrentTarget(targets[1][index]);
      await click("#next-checkpoint");
    }
    assert.match(await evaluate(`document.querySelector('.world-finish').innerText`), /Este mundo está concluído/);
    await click('a[href="02-forest-path.html"]', true);
    await evaluate(`window.YoshiAudio={play(){},pause(){},changeTrack(){}}`);
    await click("#start-world");
    await assertFingerColors("world 2 JKLÇ and space");
    await completeWorld(2);
    await click('a[href="03-crystal-caves.html"]', true);
    assert.equal(await evaluate(`document.querySelector('#checkpoint-progress').textContent`), "CHECKPOINT 1/5");
    assert.equal(await evaluate(`document.querySelector('#audio-toggle').disabled`), true, "the cave track cannot start while Kamek's scene is open");
    await evaluate(`window.__fakeAudioLog=[];window.__fakeAudioInstances=0;window.YT={PlayerState:{PLAYING:1,PAUSED:2,ENDED:0},Player:function(host,options){const player=this;window.__fakeAudioInstances+=1;player.video=options.videoId;player.setVolume=()=>{};player.mute=()=>{};player.unMute=()=>{};player.pauseVideo=()=>window.__fakeAudioLog.push('pause:'+player.video);player.playVideo=()=>window.__fakeAudioLog.push('play:'+player.video);player.loadVideoById=({videoId})=>{player.video=videoId;window.__fakeAudioLog.push('load:'+videoId)};player.getVideoData=()=>({video_id:player.video});setTimeout(()=>options.events.onReady({target:player}),500)}}`);
    await click("#story-audio");
    await click("#story-continue");
    assert.equal(await evaluate(`document.querySelector('#audio-toggle').disabled`), false);
    await click("#start-world");
    await assertFingerColors("world 3 upper/lower rows and space");
    await evaluate(`new Promise(resolve=>setTimeout(resolve,700))`);
    const trackLog = await evaluate(`window.__fakeAudioLog`);
    assert.equal(await evaluate(`window.__fakeAudioInstances`), 1, "concurrent audio requests share one not-yet-ready YouTube player");
    assert.ok(trackLog.includes("pause:BEP3rdTy0-o"), "leaving Kamek pauses the story audio");
    assert.ok(trackLog.includes("load:IJy7jK-TM40"), "the cave track loads after the player becomes ready");
    assert.ok(!trackLog.includes("play:BEP3rdTy0-o"), "a late story request cannot restart after leaving the scene");
    await completeWorld(3);
    assert.match(await evaluate(`document.querySelector('.world-finish').innerText`), /três mundos obrigatórios/);
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})).completedBonus`), false, "completing the main adventure leaves bonus optional");
    assert.equal(await evaluate(`document.querySelector('#checkpoint-progress').textContent`), "CHECKPOINT 5/5");

    // The end of the main adventure offers a true stop and keeps the bonus optional.
    await click('a[href="index.html?ending=main"]', true);
    assert.match(await evaluate(`document.querySelector('#ending-banner').innerText`), /aventura principal concluída/i);
    assert.equal(await evaluate(`!!document.querySelector('#ending-banner a[href="04-bonus-challenge.html"]')`), true);
    await click("#new-game");
    assert.equal(await evaluate(`document.querySelector('#reset-dialog').open`), true, "new game requires confirmation when progress is saved");
    await click("#cancel-reset");
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})).completedWorlds.length`), 3, "cancelling reset preserves the completed worlds");

    // Session storage preserves progress across route changes and reloads when local storage is blocked.
    const sessionState = { version: 1, currentWorld: 2, completedWorlds: [1], completedBonus: false, checkpoints: { 1: 5, 2: 1, 3: 0, 4: 0 } };
    await evaluate(`localStorage.removeItem(${JSON.stringify(storageKey)});sessionStorage.setItem(${JSON.stringify(storageKey)},${JSON.stringify(JSON.stringify(sessionState))})`);
    const localBlock = await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: "Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('blocked','SecurityError')}})" });
    await navigate(`${baseUrl}02-forest-path.html?storage=session`);
    assert.equal(await evaluate(`document.querySelector('#checkpoint-progress').textContent`), "CHECKPOINT 2/5", "session storage resumes the next open checkpoint");
    assert.match(await evaluate(`document.querySelector('#persistence-status').textContent`), /sessionStorage|sessão do navegador/i);
    await evaluate(`window.YoshiAudio={play(){},pause(){},changeTrack(){}}`);
    await click("#start-world");
    await navigate(`${baseUrl}02-forest-path.html?storage=reload`);
    assert.equal(await evaluate(`document.querySelector('#checkpoint-progress').textContent`), "CHECKPOINT 2/5", "session progress survives reload");
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
