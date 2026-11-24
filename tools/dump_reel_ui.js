const { chromium } = require('playwright'); const serve = require('/home/user/yazan/render/serve'); const fs = require('fs');
(async () => { const srv = await serve(0); const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
 const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); await p.goto(`http://127.0.0.1:${srv.address().port}/scene/?lang=en&reel=3`);
 await p.waitForFunction(() => window.__ready === true, null, { timeout: 180000 });
 const out = await p.evaluate(() => ({ styles: [...document.querySelectorAll('style')].map(s => s.textContent),
   ui: [...document.querySelectorAll('#ui > div')].map(d => ({ cls: d.className, style: d.getAttribute('style'), html: d.innerHTML })), words: window.__reelWords }));
 fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1)); await b.close(); srv.close(); })();
