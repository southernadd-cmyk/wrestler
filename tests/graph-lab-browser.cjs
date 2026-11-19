'use strict';
// Runs only in the existing Playwright CI browser job; not a production dependency.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const URL = 'http://127.0.0.1:8765/tools/graph-lab/';

async function visit(browser, label, viewport) {
  const context = await browser.newContext({ viewport, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [], failed = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url()); });
  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await page.locator('#totalNodes').waitFor();
    await page.waitForFunction(() => document.querySelector('#totalNodes').textContent !== '—');
    assert.ok(Number((await page.locator('#totalNodes').innerText()).replaceAll(',', '')) >= 960);
    assert.equal(await page.locator('#validation').innerText(), 'Pass');
    assert.equal(await page.locator('#worker option').count(), 80);
    assert.equal(await page.locator('#opponent option').count(), 80);
    await page.locator('#bouts').selectOption('1');
    await page.locator('#run').click();
    await page.waitForFunction(() => document.querySelector('#status').textContent.startsWith('Complete — '), { timeout: 45000 });
    assert.equal(await page.locator('#completed').innerText(), '1');
    assert.ok(await page.locator('#trace .traceRow').count() > 5, 'real event trace');
    assert.ok((await page.locator('#nodeCoverage').innerText()).endsWith('%'), 'node coverage calculated');
    await page.locator('#search').fill('wristlock');
    assert.ok(await page.locator('#nodeList button').count() > 0, 'technique search works');
    await page.locator('#nodeList button').first().click();
    assert.ok(await page.locator('#diagram svg line').count() > 0, 'local graph connections rendered');
    if (label === 'desktop') {
      const promise = page.waitForEvent('download');
      await page.locator('#export').click();
      const download = await promise;
      const snapshot = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
      assert.equal(snapshot.schema, 'office-graph-lab-v1');
      assert.equal(snapshot.bouts, 1);
      assert.ok(snapshot.visitedNodes > 0);
    }
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(bodyWidth <= 3, label + ' horizontal overflow: ' + bodyWidth);
    assert.deepEqual(failed, [], 'all graph lab assets load without HTTP errors');
    assert.deepEqual(errors, [], 'no uncaught graph lab page errors');
    console.log('PASS graph lab browser ' + label + ': live graph, match run, trace, search, connections, export');
  } finally {
    await context.close();
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    await visit(browser, 'desktop', { width: 1280, height: 800 });
    await visit(browser, 'phone', { width: 390, height: 844 });
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
