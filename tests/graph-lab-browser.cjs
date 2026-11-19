'use strict';
// Graph Lab CI: real browser journeys, workspace keyboard support, download and mobile sizing.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const URL = 'http://127.0.0.1:8765/tools/graph-lab/';

async function visit(browser, label, viewport) {
  const context = await browser.newContext({ viewport, acceptDownloads: true, reducedMotion: label === 'reduced-motion' ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  const errors = [], failed = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url()); });
  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('#totalNodes').textContent !== '—');
    assert.ok(Number((await page.locator('#totalNodes').innerText()).replaceAll(',', '')) >= 960);
    assert.equal((await page.locator('#validation').innerText()).toLowerCase(), 'pass');
    assert.equal(await page.locator('#worker option').count(), 80);
    assert.equal(await page.locator('#opponent option').count(), 80);

    // The main experience is an accessible four-workspace tool, not a long stack of inert cards.
    assert.equal(await page.locator('[role="tab"]').count(), 4);
    assert.equal(await page.locator('#tab-run').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('#workspace-atlas').isVisible(), false);
    await page.locator('#tab-run').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#tab-tape').getAttribute('aria-selected'), 'true');
    await page.locator('#tab-run').click();
    assert.equal(await page.locator('#workspace-run').isVisible(), true);

    await page.locator('#bouts').selectOption('1');
    await page.locator('#run').click();
    await page.waitForFunction(() => document.querySelector('#status').textContent.startsWith('Complete — '), { timeout: 45000 });
    assert.equal(await page.locator('#completed').innerText(), '1');
    assert.ok((await page.locator('#nodeCoverage').innerText()).endsWith('%'), 'measured graph coverage');
    assert.ok((await page.locator('#families li').count()) > 0);

    await page.locator('#viewTape').click();
    assert.equal(await page.locator('#tab-tape').getAttribute('aria-selected'), 'true');
    assert.ok(await page.locator('#trace .traceRow').count() > 5, 'actual graph event trace');
    assert.equal(await page.locator('#tapeViz .timebar').count(), 24, 'observed density per clock interval');
    assert.match(await page.locator('#traceMeta').innerText(), / vs .*seed /i);
    await page.locator('#traceFilter').selectOption('Counter');
    assert.equal(await page.locator('#trace .traceRow:not([data-kind="Counter"]):visible').count(), 0, 'trace filtering works');
    await page.locator('#traceFilter').selectOption('all');

    await page.locator('#tab-atlas').click();
    await page.locator('#search').fill('wristlock');
    assert.ok(await page.locator('#nodeList button').count() > 0, 'action search works');
    await page.locator('#nodeList button').first().click();
    assert.ok(await page.locator('#diagram svg line').count() > 0, 'real graph neighbours render');

    await page.locator('#tab-run').click();
    if (label === 'desktop') {
      const promise = page.waitForEvent('download');
      await page.locator('#export').click();
      const download = await promise;
      const snapshot = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
      assert.equal(snapshot.schema, 'office-graph-lab-v1');
      assert.equal(snapshot.bouts, 1);
      assert.ok(snapshot.visitedNodes > 0);
      await page.locator('#tab-compare').click();
      await page.locator('#baseline').setInputFiles(await download.path());
      await page.waitForFunction(() => document.querySelectorAll('#comparison tbody tr').length >= 5);
      assert.ok(await page.locator('#comparison tbody tr').count() >= 5, 'baseline compare can load exported report');
    }

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 3, label + ': horizontal overflow of ' + overflow + 'px');
    assert.deepEqual(failed, [], label + ': all assets load without HTTP errors');
    assert.deepEqual(errors, [], label + ': no uncaught browser exceptions');
    console.log('PASS graph lab ' + label + ': tabs, real bouts, tape histogram, move atlas, responsive layout');
  } finally {
    await context.close();
  }
}
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    await visit(browser, 'desktop', { width: 1440, height: 900 });
    await visit(browser, 'tablet', { width: 768, height: 1024 });
    await visit(browser, 'phone', { width: 390, height: 844 });
    await visit(browser, 'small-phone', { width: 375, height: 812 });
    await visit(browser, 'reduced-motion', { width: 1280, height: 800 });
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
