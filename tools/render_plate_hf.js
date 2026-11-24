// Renders the final reel's 3D world (reel=3) with the HTML text layer hidden, as a background plate
// for the HyperFrames project, and records the projected island-label anchors per frame.
// usage: node tools/render_plate_hf.js [--workers 3] → frames_plate/seg_*.mp4 + frames_plate/anchors_*.json
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const serve = require('../render/serve');

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1]]]) : a), []));
const FPS = 30, TOTAL = 1047, SEG = 120;
const OUT = path.resolve(__dirname, '..', 'frames_plate');
fs.mkdirSync(OUT, { recursive: true });

async function openPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${port}/scene/?lang=en&reel=3`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 180000 });
  await page.addStyleTag({ content: '#ui{visibility:hidden!important}' });
  return page;
}

async function renderRange(page, a, b, file, id) {
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', String(FPS), file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const anchors = {}; const t0 = Date.now();
  for (let f = a; f < b; f++) {
    const A = await page.evaluate((tt) => { window.renderAt(tt); const o = {};
      for (const [k, p] of Object.entries(window.__A)) if (k.startsWith('isl_')) o[k] = { x: +p.x.toFixed(1), y: +p.y.toFixed(1), v: !!p.visible };
      return o; }, f / FPS);
    if (Object.keys(A).length) anchors[f] = A;
    const buf = await page.screenshot({ type: 'jpeg', quality: 95, animations: 'disabled', caret: 'hide' });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f - a) % 30 === 0) { const el = (Date.now() - t0) / 1000, d = f - a + 1; console.log(`[w${id}] frame ${f} ${(el / d).toFixed(2)}s/f`); }
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  fs.writeFileSync(file.replace(/seg_(\d+)\.mp4\.tmp\.mp4$/, 'anchors_$1.json'), JSON.stringify(anchors));
}

(async () => {
  const srv = await serve(0); const port = srv.address().port;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-vsync'] });
  const queue = [];
  for (let a = 0; a < TOTAL; a += SEG) {
    const b = Math.min(TOTAL, a + SEG), f = path.join(OUT, `seg_${String(a).padStart(5, '0')}.mp4`);
    if (fs.existsSync(f) && fs.statSync(f).size > 1000) continue;
    queue.push([a, b, f]);
  }
  const W = +(args.workers || 3);
  await Promise.all(Array.from({ length: W }, async (_, i) => {
    let page = null;
    while (queue.length) { const [a, b, f] = queue.shift(); page = page || await openPage(browser, port);
      await renderRange(page, a, b, f + '.tmp.mp4', i); fs.renameSync(f + '.tmp.mp4', f); }
  }));
  await browser.close(); srv.close(); console.log('plate done');
})().catch((e) => { console.error(e); process.exit(1); });
