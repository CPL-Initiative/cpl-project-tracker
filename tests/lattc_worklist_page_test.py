"""Browser guard for the LATTC military-CPL worklist page.

Run:  python3 tests/lattc_worklist_page_test.py
Not picked up by tests/run.js (which discovers tests/*.test.js) - this needs a
browser, so it stays a deliberate local/manual check rather than a CI gate.

It guards the things that would silently break the WORKLIST rather than the
look: that the units and the recommendation bullets are in the collapsed header
(the whole point of the rework - nobody should have to expand a card to work),
that every bullet carries BOTH a confidence band and a peer/no-peer chip, that
selecting persists, and that the bulk fill only ever touches High-confidence
rows.
"""
import json, pathlib, sys, os
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print('SKIP: playwright not installed'); sys.exit(0)

CHROME = os.environ.get('CPL_CHROME', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
if not os.path.exists(CHROME):
    print('SKIP: no chromium at ' + CHROME + ' (set CPL_CHROME)'); sys.exit(0)

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = ROOT / 'kb/college_cr_evidence/lattc_military_2026-08-27.html'
OUT  = ROOT / 'kb/college_cr_evidence/_test_render.html'

# The published page is a fragment (head/body added at publish time) - wrap it
# the same way so the test exercises what viewers actually get.
frag = PAGE.read_text()
OUT.write_text('<!doctype html><html><head><meta charset="utf-8">'
    + '</head><body>' + frag + '</body></html>')

errs, fails = [], []
def ck(name, cond, extra=''):
    (print if cond else fails.append)(('[ok] ' if cond else '[FAIL] ')+name+(' '+str(extra) if extra else ''))
    if cond: pass

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
    pg = b.new_page()
    pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
    pg.goto('file://'+str(OUT))
    pg.wait_for_timeout(900)

    cards = pg.locator('article.card').count()
    ck('139 course cards render', cards==139, cards)
    ck('no page errors (the blocked Google Fonts fetch is the sandbox, not the page)', not errs, errs[:3])

    secs = pg.locator('section.subject').count()
    ck('12 subject sections', secs==12, secs)

    # units in the header row
    u = pg.locator('article.card .units').count()
    ck('every card has a units cell', u==139, u)
    utext = pg.locator('article[data-code="CRPNTRY111"] .units').inner_text()
    ck('CRPNTRY111 shows COCI units (7.0)', '7.0' in utext, utext)
    ck('a missing-units card says so',
       'not in COCI' in pg.locator('article[data-code="ST MAIN206"] .units').inner_text())

    # bullets with confidence + peer chip, in the header (not behind the details)
    first = pg.locator('article[data-code="WELDG/E121"]')
    ck('bullets are visible without expanding', first.locator('.recitem').first.is_visible())
    ck('confidence chip on bullet', first.locator('.recitem').first.locator('.tag').first.is_visible())
    chips = first.locator('.recitem').first.locator('.tag').all_inner_texts()
    ck('bullet carries BOTH a confidence band and a peer chip', len(chips)>=2, chips)
    ck('peer chip text present', any('Peer' in c for c in chips), chips)

    # a no-peer bullet gets the other chip
    nop = pg.locator('.recitem .tag.t-cr').count()
    ck('no-peer bullets carry the "No peer yet" chip', nop>0, nop)

    # evidence is collapsed by default
    ck('evidence hidden until asked', not first.locator('.ev').first.is_visible())
    first.locator('.more > summary').first.click(); pg.wait_for_timeout(150)
    ck('evidence opens on click', first.locator('.ev').first.is_visible())

    # SELECT
    btn = first.locator('.selbtn').first
    ck('select button says Select', btn.inner_text().strip()=='Select', btn.inner_text())
    btn.click(); pg.wait_for_timeout(200)
    ck('card marked chosen', 'chosen' in (first.get_attribute('class') or ''))
    ck('counter moved to 1', '1 of 139' in pg.locator('#count').inner_text(), pg.locator('#count').inner_text())
    ck('chosen chip shows the rec', 'Chosen:' in first.locator('.chead').inner_text())
    ck('button flips to Chosen', first.locator('.selbtn').first.inner_text().strip().endswith('Chosen'))

    # deselect
    first.locator('.selbtn').first.click(); pg.wait_for_timeout(200)
    ck('deselect returns to 0', '0 of 139' in pg.locator('#count').inner_text())

    # persistence across reload
    first.locator('.selbtn').first.click(); pg.wait_for_timeout(200)
    pg.reload(); pg.wait_for_timeout(900)
    ck('choice survives a reload (localStorage)',
       '1 of 139' in pg.locator('#count').inner_text(), pg.locator('#count').inner_text())

    # bulk fill only touches High band
    pg.locator('#pick').click(); pg.wait_for_timeout(500)
    n = int(pg.locator('#count').inner_text().split(' ')[0])
    ck('bulk fill = the 82 High-confidence courses', n==82, n)

    # filters
    pg.locator('.fbtn[data-f="none"]').click(); pg.wait_for_timeout(250)
    vis = pg.locator('article.card:not(.hidden)').count()
    ck('needs-a-human filter shows 6', vis==6, vis)
    pg.locator('.fbtn[data-f="all"]').click()
    pg.fill('#q','welding'); pg.wait_for_timeout(250)
    ck('search narrows', pg.locator('article.card:not(.hidden)').count()<139)
    pg.fill('#q','')

    # divergence warning
    pg.locator('.fbtn[data-f="all"]').click(); pg.wait_for_timeout(200)
    ck('5 divergent-number warnings', pg.locator('.warnbox').count()==5, pg.locator('.warnbox').count())

    # graceful absence: no window.claude in this harness at all
    ck('save button degrades without the runtime', pg.locator('#save').is_enabled())
    pg.locator('#save').click(); pg.wait_for_timeout(600)
    ck('save explains itself when it cannot save',
       'cannot save' in pg.locator('#toast').inner_text() or 'Download' in pg.locator('#toast').inner_text(),
       pg.locator('#toast').inner_text())

    # no horizontal page scroll at desktop and mobile
    for w,h,label in [(1280,900,'desktop'),(390,844,'mobile')]:
        pg.set_viewport_size({'width':w,'height':h}); pg.wait_for_timeout(300)
        sw = pg.evaluate('document.documentElement.scrollWidth')
        ck('no sideways body scroll at '+label, sw <= w+1, (sw,w))
    b.close()

print()
if fails:
    print('FAILURES:'); [print(' ', f) for f in fails]; raise SystemExit(1)
print('all checks passed')

finally_note = OUT.unlink(missing_ok=True)
