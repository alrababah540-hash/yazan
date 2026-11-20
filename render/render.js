// Deterministic frame renderer: drives window.renderAt(t) in headless Chromium (WebGL via
// SwiftShader — CPU, no GPU required) and pipes JPEG frames into FFmpeg per segment.
// usage: node render/render.js [--from 0] [--to 2280] [--workers 2] [--stills 0,90,...] [--scale 1]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const serve = require('./serve');

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1]]]) : a), []));
const FPS = 30;
const LANG = args.lang === 'en' ? 'en' : 'ar';
const REEL = !!args.reel;
const OUT = path.resolve(__dirname, '..', REEL ? 'frames_reel' : LANG === 'en' ? 'frames_en' : 'frames');
fs.mkdirSync(OUT, { recursive: true });

async function openPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${port}/scene/${REEL ? '?lang=en&reel=1' : LANG === 'en' ? '?lang=en' : ''}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 180000 });
  return page;
}

async function frameJpeg(page, t) {
  await page.evaluate((tt) => window.renderAt(tt), t);
  return page.screenshot({ type: 'jpeg', quality: 95, animations: 'disabled', caret: 'hide' });
}

async function renderRange(browser, port, a, b, file, id) {
  const page = pages[id] || (pages[id] = await openPage(browser, port));
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', String(FPS), file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = a; f < b; f++) {
    const buf = await frameJpeg(page, f / FPS);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f - a) % 30 === 0) {
      const el = (Date.now() - t0) / 1000, done = f - a + 1;
      console.log(`[w${id}] frame ${f}/${b} ${(el / done).toFixed(2)}s/f eta ${((b - f) * el / done / 60).toFixed(1)}m`);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
}
const pages = {};

(async () => {
  const srv = await serve(0); const port = srv.address().port;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-vsync'] });
  if (args.stills) {
    const page = await openPage(browser, port);
    for (const s of args.stills.split(',')) {
      const t = parseFloat(s); const t0 = Date.now();
      await page.evaluate((tt) => window.renderAt(tt), t);
      const out = path.join(args.dir || OUT, `still_${t.toFixed(2).padStart(6, '0')}.jpg`);
      await page.screenshot({ path: out, type: 'jpeg', quality: 90 });
      console.log('still', t, ((Date.now() - t0) / 1000).toFixed(2) + 's', out);
    }
  } else {
    // fixed 120-frame segments (4 s) → resumable: finished segments are skipped
    const from = +(args.from || 0), to = +(args.to || (REEL ? 1035 : 2280)), W = +(args.workers || 2), SEG = 120;
    const queue = [];
    for (let a = from; a < to; a += SEG) {
      const b = Math.min(to, a + SEG), f = path.join(OUT, `seg_${String(a).padStart(5, '0')}.mp4`);
      if (!args.force && fs.existsSync(f) && fs.statSync(f).size > 1000) continue;
      queue.push([a, b, f]);
    }
    await Promise.all(Array.from({ length: W }, async (_, i) => {
      while (queue.length) { const [a, b, f] = queue.shift(); await renderRange(browser, port, a, b, f + '.tmp.mp4', i); fs.renameSync(f + '.tmp.mp4', f); }
    }));
  }
  await browser.close(); srv.close();
})().catch((e) => { console.error(e); process.exit(1); });
