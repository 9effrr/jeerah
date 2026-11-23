// Real-network check of the phone sessions (PeerJS), run on GitHub Actions.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'https://9effrr.github.io/jeerah/';
const Q = process.env.Q || '';
const names = ['سالم','مريم','خالد','فاطمة','ناصر'];
const log = (...a) => console.log(new Date().toISOString().slice(11,19), ...a);
const b = await chromium.launch();
async function phone(i, url) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  p.on('pageerror', e => log(`p${i} ERROR`, e.message));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') log(`p${i} console`, m.text().slice(0, 200)); });
  await p.goto(url); await p.waitForTimeout(800); return p;
}
let ok = true;
// A: a phone opens a session, four phones join with the code
log('A: phone-hosted session');
const h = await phone(0, BASE + 'join.html' + Q);
await h.fill('#nm', names[0]); await h.click('[data-act=host]');
let code = null;
for (let s = 0; s < 40 && !code; s++) { await h.waitForTimeout(500); code = await h.evaluate(() => window.__join && window.__join.S.status === 'in' ? window.__join.S.code : null); }
log('host via', await h.evaluate(() => window.Net.via), 'host status', await h.evaluate(() => window.__join.S.status), 'err', await h.evaluate(() => window.__join.S.err), 'code', code);
if (!code) { ok = false; await h.screenshot({ path: 'A-host.png' }); }
else {
  const js = [];
  for (let i = 1; i < 5; i++) {
    const p = await phone(i, BASE + 'join.html' + Q + '#' + code);
    await p.fill('#nm', names[i]); await p.click('#go'); js.push(p);
  }
  for (let s = 0; s < 40; s++) { await h.waitForTimeout(500); const n = await h.evaluate(() => (window.__join.S.state && window.__join.S.state.players || []).length); if (n >= 5) break; }
  const n = await h.evaluate(() => (window.__join.S.state && window.__join.S.state.players || []).length);
  for (const [i, p] of js.entries()) log('joiner', i + 1, await p.evaluate(() => window.__join.S.status), await p.evaluate(() => window.__join.S.err), await p.evaluate(() => window.Net.via));
  log('A players in lobby:', n); if (n < 5) ok = false;
  // start the round and reveal roles on every phone
  await h.click('[data-act=ctl]'); await h.waitForTimeout(2500);
  for (const p of [h, ...js]) { try { const st = await p.$('#stage'); const bx = await st.boundingBox(); await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await p.mouse.down(); await p.waitForTimeout(300); await p.mouse.up(); await p.click('#nextb'); } catch (e) { log('reveal fail', e.message.slice(0, 80)); } }
  let ph = '';
  for (let s = 0; s < 30; s++) { await h.waitForTimeout(500); ph = await h.evaluate(() => window.__join.S.state && window.__join.S.state.phase); if (ph === 'night') break; }
  log('A phase after roles:', ph); if (ph !== 'night') ok = false;
  await h.screenshot({ path: 'A-host.png' }); await js[0].screenshot({ path: 'A-joiner.png' });
}
// B: council screen hosts, two phones join
log('B: council screen');
const tvctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
const tv = await tvctx.newPage(); tv.on('pageerror', e => log('tv ERROR', e.message));
await tv.goto(BASE + 'tv.html' + Q); let tcode = null;
for (let s = 0; s < 40 && !tcode; s++) { await tv.waitForTimeout(500); tcode = await tv.evaluate(() => window.__tv && window.__tv.G && window.__tv.G.code && !document.querySelector('.spinner') && document.querySelector('.bigcode') ? window.__tv.G.code : null); }
log('tv code', tcode);
if (tcode) {
  for (let i = 0; i < 2; i++) { const p = await phone(10 + i, BASE + 'join.html' + Q + '#' + tcode); await p.fill('#nm', names[i]); await p.click('#go'); }
  await tv.waitForTimeout(8000);
  const n = await tv.evaluate(() => window.__tv.G.players.length); log('B players:', n); if (n < 2) ok = false;
} else ok = false;
await tv.screenshot({ path: 'B-tv.png' });
await b.close();
log(ok ? 'RESULT OK' : 'RESULT FAILED'); process.exit(ok ? 0 : 1);
