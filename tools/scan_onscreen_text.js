// Collect all on-screen overlay text of the final reel (sampled every 0.5 s) and flag any
// percentages, currency amounts or other financial figures.
const { chromium } = require('playwright'); const serve = require('../render/serve');
(async () => {
  const srv = await serve(0); const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto(`http://127.0.0.1:${srv.address().port}/scene/?lang=en&reel=3`); await p.waitForFunction(() => window.__ready);
  const seen = new Set(); const flags = [];
  for (let t = 0; t <= 34.85; t += 0.5) {
    await p.evaluate((tt) => window.renderAt(tt), t);
    const txt = await p.evaluate(() => [...document.querySelectorAll('#ui *')].filter((e) => e.offsetParent !== null && getComputedStyle(e).opacity > 0.05 && e.children.length === 0 && e.textContent.trim()).map((e) => e.textContent.trim()));
    for (const x of txt) { seen.add(x); if (/\d\s*%|%\s*\d|AED|\$|USD|€|\byield|\breturn/i.test(x)) flags.push(`${t.toFixed(1)}s: ${x}`); }
  }
  require('fs').writeFileSync(require('path').join(__dirname, '..', 'docs', 'reel_final_onscreen_text.json'), JSON.stringify({ flags, text: [...seen] }, null, 1));
  console.log(JSON.stringify({ flags, unique_text_items: seen.size }));
  await b.close(); srv.close();
})();
