// Drives headless Chromium over DevTools: renders the score offline to music.wav, then
// captures every frame of render.html at 30 fps into .frames/. render.sh calls it.
import {spawn} from 'child_process'; import fs from 'fs';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const FPS = 30, DUR = 90, dir = process.cwd();
const ch = spawn(CHROME, ['--headless=new','--no-sandbox','--disable-gpu','--allow-file-access-from-files','--hide-scrollbars','--remote-debugging-port=9333','--window-size=1920,1080','about:blank']);
await new Promise(r => setTimeout(r, 2500));
const tabs = await (await fetch('http://127.0.0.1:9333/json')).json();
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = {}; ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; } };
const cmd = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({id: i, method, params})); });
const val = async (expression, awaitPromise = false) => (await cmd('Runtime.evaluate', {expression, awaitPromise})).result.result.value;
await cmd('Emulation.setDeviceMetricsOverride', {width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false});
await cmd('Page.enable'); await cmd('Page.navigate', {url: 'file://' + dir + '/' + (process.env.PAGE || 'render.html')});
await new Promise(r => setTimeout(r, 3000)); await val('document.fonts.ready.then(()=>1)', true);
// The WAV comes back in 1 MB slices: one 29 MB DevTools message stalls.
const L = await val('window.__film.audio().then(s=>{window.__w=s;return s.length;})', true); let b = '';
for (let o = 0; o < L; o += 1e6) b += await val(`window.__w.slice(${o},${o + 1e6})`);
fs.writeFileSync('.music.wav', Buffer.from(b, 'base64')); console.log('music rendered');
fs.mkdirSync('.frames', {recursive: true});
for (let f = 0; f <= DUR * FPS; f++) {
  await val(`window.__film.seek(${(f / FPS).toFixed(4)})`);
  const s = await cmd('Page.captureScreenshot', {format: 'jpeg', quality: 92, clip: {x: 0, y: 0, width: 1920, height: 1080, scale: 1}});
  fs.writeFileSync(`.frames/f${String(f).padStart(5, '0')}.jpg`, Buffer.from(s.result.data, 'base64'));
  if (f % 300 === 0) console.log('frame', f);
}
ws.close(); ch.kill(); process.exit(0);
