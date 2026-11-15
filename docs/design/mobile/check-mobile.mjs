/**
 * Vérification du prototype mobile « Yakro Elite ».
 *
 * Prérequis : `npm run dev` (port 9005) lancé.
 * Usage    : node docs/design/mobile/check-mobile.mjs
 *
 * - capture les 4 écrans en clair et sombre (390 × 844, @2x) ;
 * - capture les petits écrans (320 px) ;
 * - vérifie débordement horizontal, images cassées, erreurs console et
 *   cibles tactiles < 40 px pour 320/390/430 px ;
 * - sort en erreur (code 1) si un écran est à revoir.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = process.env.DESIGN_BASE_URL ?? 'http://127.0.0.1:9005';
const OUT = 'docs/design/mobile/prototype';
const SCREENS = [
  { path: '/design/mobile', name: '01-accueil' },
  { path: '/design/mobile/restaurant', name: '02-restaurant' },
  { path: '/design/mobile/panier', name: '03-panier' },
  { path: '/design/mobile/suivi', name: '04-suivi' },
];
const VIEWPORTS = [320, 390, 430];

const browser = await chromium.launch();
let problems = 0;

/** Capture les écrans finaux (390 px) en clair et sombre. */
for (const theme of ['clair', 'sombre']) {
  const dir = `${OUT}/${theme}`;
  mkdirSync(dir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'fr-FR',
  });
  if (theme === 'sombre') {
    await context.addInitScript(() => {
      try {
        localStorage.setItem('theme', 'dark');
      } catch {
        /* stockage indisponible : on reste en clair */
      }
    });
  }
  for (const screen of SCREENS) {
    const page = await context.newPage();
    await page.goto(BASE + screen.path, { waitUntil: 'load', timeout: 120000 });
    await page.waitForTimeout(3500);
    await page.screenshot({ path: `${dir}/${screen.name}.png` });
    await page.close();
  }
  await context.close();
  console.log(`captures ${theme} -> ${dir}`);
}

/** Audit responsive + ergonomie. */
for (const width of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'fr-FR',
  });
  for (const screen of SCREENS) {
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('pageerror', (e) => consoleErrors.push(e.message.slice(0, 120)));
    page.on('console', (m) => {
      if (m.type() === 'error' && !m.text().includes('WebSocket')) consoleErrors.push(m.text().slice(0, 120));
    });
    await page.goto(BASE + screen.path, { waitUntil: 'load', timeout: 120000 });
    await page.waitForTimeout(1200);

    const info = await page.evaluate(() => {
      const doc = document.documentElement;
      const targets = Array.from(document.querySelectorAll('button, a[href], input, [role="button"]'));
      const small = targets
        .map((el) => {
          const r = el.getBoundingClientRect();
          const label = (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 34);
          return { label, w: Math.round(r.width), h: Math.round(r.height), visible: r.width > 0 && r.height > 0 };
        })
        .filter((t) => t.visible && (t.w < 40 || t.h < 40));
      return {
        overflow: doc.scrollWidth > doc.clientWidth + 1,
        sw: doc.scrollWidth,
        cw: doc.clientWidth,
        small,
        brokenImages: Array.from(document.images).filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc).length,
      };
    });

    const issues = [];
    if (info.overflow) issues.push(`débordement ${info.sw} > ${info.cw}`);
    if (info.brokenImages) issues.push(`${info.brokenImages} image(s) cassée(s)`);
    if (info.small.length) {
      issues.push(`cibles < 40px : ${info.small.slice(0, 6).map((t) => `${t.label} (${t.w}×${t.h})`).join(', ')}`);
    }
    if (consoleErrors.length) issues.push(`console : ${consoleErrors.slice(0, 3).join(' | ')}`);
    if (issues.length) problems++;

    console.log(`${width}px ${screen.name.padEnd(14)} ${issues.length ? '⚠ ' + issues.join(' ; ') : 'OK'}`);
    if (width === 320) {
      mkdirSync(`${OUT}/320`, { recursive: true });
      await page.screenshot({ path: `${OUT}/320/${screen.name.replace(/^\d+-/, '')}.png` });
    }
    await page.close();
  }
  await context.close();
}

await browser.close();
console.log(problems === 0 ? '✅ Aucun problème détecté' : `❌ ${problems} écran(s) à revoir`);
process.exit(problems === 0 ? 0 : 1);
