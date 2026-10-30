import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const source = fs.readFileSync(path.join(root, "assets/js/radio.js"), "utf8");

function createElement(id) {
  return {
    id,
    textContent: "",
    href: "",
    dataset: {},
    attributes: {},
    handlers: {},
    addEventListener(type, callback) { this.handlers[type] = callback; },
    setAttribute(name, value) { this.attributes[name] = value; },
    getAttribute(name) { return this.attributes[name] || ""; }
  };
}

function boot(page, world = "") {
  const elements = Object.fromEntries(
    ["radio-status", "radio-toggle", "radio-fallback", "radio-player"].map((id) => [id, createElement(id)])
  );
  const events = [];
  const appendedScripts = [];
  const iframe = createElement("youtube-iframe");
  iframe.setAttribute("allow", "encrypted-media");
  let player;

  const document = {
    body: { dataset: { page, world } },
    getElementById(id) { return elements[id] || null; },
    querySelector() { return null; },
    createElement() { return createElement("script"); },
    head: { appendChild(script) { appendedScripts.push(script); } }
  };

  const window = {
    document,
    location: { protocol: "https:", origin: "https://classroom.test" },
    YT: {
      PlayerState: { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 },
      Player: function (_host, options) {
        player = this;
        this.options = options;
        this.calls = [];
        this.state = -1;
        this.setVolume = (value) => this.calls.push(["setVolume", value]);
        this.unMute = () => { this.calls.push(["unMute"]); this.muted = false; };
        this.mute = () => { this.calls.push(["mute"]); this.muted = true; };
        this.playVideo = () => { this.calls.push(["playVideo"]); };
        this.pauseVideo = () => { this.calls.push(["pauseVideo"]); };
        this.getPlayerState = () => this.state;
        this.getIframe = () => iframe;
      },
      PlayerState: { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 }
    },
    setTimeout() { return 1; },
    setInterval() { return 1; },
    clearInterval() {},
    dispatchEvent(event) { events.push(event.type); }
  };

  class CustomEvent {
    constructor(type) { this.type = type; }
  }

  const context = vm.createContext({ window, document, location: window.location, CustomEvent });
  vm.runInContext(source, context, { filename: "radio.js" });

  return { window, elements, events, appendedScripts, get player() { return player; }, iframe };
}

{
  const app = boot("world", "jungle");
  assert.equal(app.player.options.playerVars.autoplay, 1, "world pages request autoplay");
  app.player.options.events.onReady();
  assert.ok(app.player.calls.some(([name]) => name === "playVideo"), "world page attempts playback as soon as the player is ready");
  assert.ok(app.player.calls.some(([name]) => name === "unMute"), "first attempt requests audible playback");
  assert.ok(app.iframe.getAttribute("allow").includes("autoplay"), "iframe explicitly receives autoplay permission");

  app.player.options.events.onAutoplayBlocked();
  assert.ok(app.player.calls.some(([name]) => name === "mute"), "blocked audible autoplay falls back to muted playback");
  assert.equal(app.elements["radio-toggle"].textContent, "♪ Ativar som", "the control offers sound activation");
  app.player.state = 1;
  app.player.options.events.onStateChange({ data: 1 });
  assert.match(app.elements["radio-status"].textContent, /sem som/i, "status says when autoplay is muted");

  app.elements["radio-toggle"].handlers.click();
  assert.ok(app.player.calls.some(([name]) => name === "unMute"), "a user click unmutes the player");
  assert.equal(app.elements["radio-toggle"].textContent, "Ⅱ Pausar trilha", "control returns to pause after sound activation");
  app.elements["radio-toggle"].handlers.click();
  assert.ok(app.player.calls.some(([name]) => name === "pauseVideo"), "the same control can pause playback");
}

{
  const app = boot("world", "mine");
  app.player.options.events.onAutoplayBlocked();
  app.player.options.events.onReady();
  assert.ok(app.player.calls.some(([name]) => name === "mute"), "a blocked event before onReady is handled");
  assert.ok(app.player.calls.some(([name]) => name === "playVideo"), "muted fallback starts after onReady");
}

for (const [world, expectedVideoId] of [
  ["jungle", "eAm9fk39c50"],
  ["mine", "cBK2YIrY62I"],
  ["camp", "wxAZfLenfa0"]
]) {
  const app = boot("world", world);
  assert.equal(app.player.options.videoId, expectedVideoId, world + " page selects its own soundtrack");
  assert.equal(app.player.options.playerVars.autoplay, 1, world + " page requests autoplay");
}

{
  const app = boot("boss");
  assert.equal(app.player.options.videoId, "i3qYmvTq6uI", "boss page selects its soundtrack");
  assert.equal(app.player.options.playerVars.autoplay, 1, "boss page requests autoplay");
}

{
  const app = boot("map");
  assert.equal(app.player.options.playerVars.autoplay, 0, "map page waits for its barrel click");
  app.player.options.events.onReady();
  assert.equal(app.player.calls.some(([name]) => name === "playVideo"), false, "map page does not play before barrel interaction");
  assert.equal(app.events.includes("donkeykong:radio-ready"), true, "map signals when the radio is ready");
  app.window.DonkeyKongRadio.playFromGesture();
  assert.ok(app.player.calls.some(([name]) => name === "playVideo"), "barrel interaction can start playback");
}

console.log("OK: world-page autoplay, blocked-audio muted fallback, sound activation, pause, and map gesture behavior");
