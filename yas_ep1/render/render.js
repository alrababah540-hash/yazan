// Deterministic frame capture: drives window.renderAt(t) in headless Chromium and pipes frames to FFmpeg.
// usage: node ad27/render/render.js [--w 3840] [--from 0] [--to 810] [--workers 3]  |  --stills 1,5.5,9 --w 1920 --dir out
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');           // repo root: serves /data, /node_modules, /ad27
const A = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1]]]) : a), []));
const FPS = 30, WID = +(A.w || 1440), HEI = Math.round(WID * 16 / 9), TOTAL = 600;
const OUT = path.resolve(ROOT, 'yas_ep1', A.out || `frames_${WID}`); fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
const serve = () => new Promise((res) => { const s = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); }); s.listen(0, '127.0.0.1', () => res(s)); });
async function openPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: WID, height: HEI }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) console.log('[page]', m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${port}/yas_ep1/scene/index.html?w=${WID}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  return page;
}
const shot = async (page, t, type = 'jpeg') => { await page.evaluate((tt) => window.renderAt(tt), t); return page.screenshot({ type, ...(type === 'jpeg' ? { quality: 96 } : {}), animations: 'disabled', caret: 'hide' }); };
(async () => {
  const srv = await serve(), port = srv.address().port, browser = await chromium.launch();
  if (A.stills) {
    const page = await openPage(browser, port), dir = path.resolve(A.dir || OUT); fs.mkdirSync(dir, { recursive: true });
    for (const s of A.stills.split(',')) { const t0 = Date.now(); fs.writeFileSync(path.join(dir, `t${(+s).toFixed(2).padStart(5, '0')}.jpg`), await shot(page, +s)); console.log('still', s, Date.now() - t0, 'ms'); }
  } else {
    const from = +(A.from || 0), to = +(A.to || TOTAL), SEG = 90, q = [];
    for (let a = from; a < to; a += SEG) { const f = path.join(OUT, `seg_${String(a).padStart(4, '0')}.mp4`); if (!A.force && fs.existsSync(f)) continue; q.push([a, Math.min(to, a + SEG), f]); }
    await Promise.all(Array.from({ length: +(A.workers || 3) }, async (_, id) => {
      const page = await openPage(browser, port);
      while (q.length) {
        const [a, b, f] = q.shift(), tmp = f + '.tmp.mp4', t0 = Date.now();
        const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-pix_fmt', 'yuv420p', '-r', String(FPS), tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
        for (let fr = a; fr < b; fr++) { const buf = await shot(page, fr / FPS); if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r)); }
        ff.stdin.end(); await new Promise((r) => ff.on('close', r)); fs.renameSync(tmp, f);
        console.log(`[w${id}] seg ${a}-${b} ${((Date.now() - t0) / 1000 / (b - a)).toFixed(2)} s/frame`);
      }
    }));
  }
  await browser.close(); srv.close();
})().catch((e) => { console.error(e); process.exit(1); });
