// Headless probe: load map.rccd.edu/cplstories/ in real Chromium (passes the
// SiteGround JS challenge a plain curl can't), then dump the rendered structure
// so we can write the real extractor. Throwaway — read the Actions log.
import { chromium } from 'playwright';

const URL = 'https://map.rccd.edu/cplstories/';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const browser = await chromium.launch();
const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1366, height: 2200 } });
const page = await ctx.newPage();

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
// SiteGround anti-bot resolves via JS then reloads — give it room.
await page.waitForTimeout(9000);
try { await page.waitForLoadState('networkidle', { timeout: 30000 }); } catch {}
// One more settle in case of a challenge → real-page reload.
await page.waitForTimeout(3000);

console.log('FINAL URL :', page.url());
console.log('TITLE     :', await page.title());
const html = await page.content();
console.log('HTML BYTES:', html.length);
console.log('CHALLENGE? :', /sg-captcha|captcha|challenge/i.test(html));

const data = await page.evaluate(() => {
  const cls = {};
  document.querySelectorAll('[class]').forEach((el) => {
    String(el.className || '').split(/\s+/).forEach((c) => {
      if (/stor|card|tile|post|swiper|slide|testimon|grid|column|item|video|embed/i.test(c)) cls[c] = (cls[c] || 0) + 1;
    });
  });
  const txt = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim();
  return {
    topClasses: Object.entries(cls).sort((a, b) => b[1] - a[1]).slice(0, 45),
    iframes: [...document.querySelectorAll('iframe')].map((f) => f.src).slice(0, 25),
    headings: [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => h.tagName + ' ' + txt(h)).filter(Boolean).slice(0, 50),
    storyLinks: [...new Set([...document.querySelectorAll('a[href]')].map((a) => a.href).filter((h) => /stor/i.test(h)))].slice(0, 50),
    imgs: [...document.querySelectorAll('img')].map((i) => ({ src: i.currentSrc || i.src, alt: i.alt }))
      .filter((i) => i.src && !/logo|icon|sprite|spacer|\.svg/i.test(i.src)).slice(0, 30),
    // A guess at the repeating "window": look for the most common parent of story links.
    sampleArticleHTML: (() => {
      const a = [...document.querySelectorAll('article, .elementor-post, [class*="story"], [class*="card"]')][0];
      return a ? a.outerHTML.slice(0, 1200) : '(none)';
    })(),
  };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
