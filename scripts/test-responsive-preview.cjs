const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const puppeteer = require('puppeteer');

const source = ts.transpileModule(fs.readFileSync('lib/frame-wrapper.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const exportsObject = {};
vm.runInNewContext(source, {
  exports: exportsObject,
  require: (name) => name.includes('themes')
    ? { BASE_VARIABLES: '', OCEAN_BREEZE_THEME: '' }
    : { getFontById: () => null },
});
const wrap = exportsObject.getHTMLWrapper;
const fixture = `<style>
body{margin:0}.flex{display:flex}.grid{display:grid}.grid-cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}
.fixed{position:fixed}.left-0{left:0}.w-64{width:256px}.ml-64{margin-left:256px;flex:1}
article{height:140px} aside{height:100px}
</style><div class="flex"><aside class="fixed left-0 w-64">Navigation</aside>
<main class="ml-64"><div class="grid grid-cols-4"><article>A</article><article>B</article><article>C</article><article>D</article></div></main></div>`;

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', request => request.abort());
    await page.setViewport({ width: 1280, height: 400 });
    await page.setContent(wrap(fixture, 'Test', '', 'frame', { responsivePreview: true }));
    for (const [width, columns, position] of [[1280,4,'fixed'],[768,2,'static'],[393,1,'static'],[1280,4,'fixed']]) {
      await page.setViewport({ width, height: 400 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const state = await page.evaluate(() => ({
        columns: getComputedStyle(document.querySelector('.grid')).gridTemplateColumns.split(' ').length,
        sidebar: getComputedStyle(document.querySelector('aside')).position,
        overflow: document.documentElement.scrollWidth > innerWidth,
      }));
      assert.equal(state.columns, columns);
      assert.equal(state.sidebar, position);
      assert.equal(state.overflow, false);
    }
    assert.ok(!wrap(fixture, 'Test', '', 'frame').includes('data-preview-grid]'));
    assert.ok(!wrap(fixture + '<div class="md:grid-cols-2"></div>', 'Test', '', 'frame', { responsivePreview:true }).includes('data-preview-grid]'));
    await page.evaluate(() => {
      window.heights = [];
      window.addEventListener('message', event => { if(event.data.type === 'FRAME_HEIGHT') window.heights.push(event.data.height); });
      document.querySelector('article').style.height = '900px';
    });
    await page.waitForFunction(() => window.heights.some(h => h >= 900));
    await page.evaluate(() => { document.querySelector('article').style.height = '140px'; });
    await page.waitForFunction(() => window.heights.at(-1) < 900);
    console.log('PASS: desktop/tablet/mobile reflow, restore, no overflow, authored CSS preserved, height grows and shrinks.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
