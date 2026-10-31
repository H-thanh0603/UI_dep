import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const PORT = 9333;
const chrome = spawn("google-chrome", [
  "--headless=new",
  "--use-gl=swiftshader",
  "--enable-unsafe-swiftshader",
  "--hide-scrollbars",
  "--window-size=1440,900",
  "--remote-debugging-address=127.0.0.1",
  `--remote-debugging-port=${PORT}`,
  "--user-data-dir=/tmp/chrome-check",
  "http://127.0.0.1:5173/",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function target() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === "page" && t.url.includes("5173"));
      if (page) return page;
    } catch {}
    await sleep(250);
  }
  throw new Error("no target");
}

const page = await target();
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));

let id = 0;
const pending = new Map();
const errors = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") {
    errors.push(m.params.args.map((a) => a.value || a.description).join(" "));
  }
  if (m.method === "Runtime.exceptionThrown") {
    errors.push("EXC: " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  }
};
const send = (method, params = {}) =>
  new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

const evaluate = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  return r.result?.result?.value;
};

await send("Runtime.enable");
await send("Page.enable");
await sleep(2500);

const sample = `
(() => {
  const v = document.querySelector('video');
  const c = document.querySelector('canvas');
  const gl = c.getContext('webgl');
  const probe = document.createElement('canvas');
  probe.width = 120; probe.height = 80;
  probe.getContext('2d').drawImage(c, 0, 0, 120, 80);
  const px = probe.getContext('2d').getImageData(30, 30, 1, 1).data;
  return { t: v.currentTime, paused: v.paused, rs: v.readyState, w: c.width, h: c.height,
           probe: [px[0], px[1], px[2]], glErr: gl.getError() };
})()`;

const before = await evaluate(sample);

// sweep the cursor to paint smoke
for (let i = 0; i <= 20; i++) {
  const x = 200 + i * 45;
  const y = 300 + Math.sin(i / 3) * 120;
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, button: "none", buttons: 0 });
  await sleep(45);
}
await sleep(400);
const after = await evaluate(sample);
const shot = await send("Page.captureScreenshot", { format: "png" });
writeFileSync("/tmp/hero2.png", Buffer.from(shot.result.data, "base64"));
console.log(JSON.stringify({ before, after, errors }, null, 1));
ws.close();
chrome.kill();
