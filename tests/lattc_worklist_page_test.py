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
    ck('CRPNTRY111 shows COCI units (7)', '7 unit' in utext, utext)
    # units sit inside the title span, at the title's own size
    same = pg.evaluate("""() => {
        const t = document.querySelector('article[data-code="CRPNTRY111"] .ct');
        const u = t.querySelector('.units');
        return u ? getComputedStyle(t).fontSize === getComputedStyle(u).fontSize : null; }""")
    ck('units render at the course title font size', same is True, same)
    ck('a missing-units card says so',
       'not in COCI' in pg.locator('article[data-code="ST MAIN206"] .units').inner_text())

    # bullets with confidence + peer chip, in the header (not behind the details)
    first = pg.locator('article[data-code="WELDG/E121"]')
    ck('bullets are visible without expanding', first.locator('.recitem').first.is_visible())
    ck('confidence chip on bullet', first.locator('.recitem').first.locator('.tag').first.is_visible())
    chips = first.locator('.recitem').first.locator('.tag').all_inner_texts()
    ck('bullet carries a confidence band and a peer/no-peer chip', len(chips)>=2, chips)
    # ⚠️ Pinned to the page, not to one card: WELDG/E121's top pick changed from a
    # peer-backed 3h rec to a 6h one when the unit cut landed, and an assertion
    # naming that card's chip stopped testing anything real.
    ck('every bullet on the page carries exactly one peer/no-peer chip',
       pg.locator('.recitem').count() ==
       pg.locator('.recitem .tag.t-peer').count() + pg.locator('.recitem .tag.t-cr').count(),
       (pg.locator('.recitem').count(), pg.locator('.recitem .tag.t-peer').count(),
        pg.locator('.recitem .tag.t-cr').count()))
    ck('peer-backed bullets exist', pg.locator('.recitem .tag.t-peer').count() > 0)

    # Jessica, 2026-08-27: no ACE exhibits in the header
    meta = first.locator('.recitem').first.locator('.rmeta').inner_text()
    ck('no ACE exhibit count in the header', 'ACE exhibit' not in meta, meta)
    ck('header still names the colleges count', 'college' in meta, meta)

    # every count opens the names behind it
    hovs = first.locator('.recitem').first.locator('.hov').count()
    ck('header counts are hoverable', hovs >= 1, hovs)
    hb = first.locator('.recitem').first.locator('.hov').first
    ck('hover control is keyboard reachable', hb.evaluate('e=>e.tagName')=='BUTTON')
    hb.click(); pg.wait_for_timeout(250)
    ck('popover opens with college NAMES', pg.locator('.pop li').count() > 1, pg.locator('.pop li').count())
    ck('popover names a real college', 'College' in pg.locator('.pop').inner_text())
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    ck('Escape closes the popover', pg.locator('.pop').count()==0)

    # a no-peer bullet gets the other chip
    nop = pg.locator('.recitem .tag.t-cr').count()
    ck('no-peer bullets carry the "No peer yet" chip', nop>0, nop)

    # evidence is collapsed by default
    ck('evidence hidden until asked', not first.locator('.ev').first.is_visible())
    first.locator('.more > summary').first.click(); pg.wait_for_timeout(150)
    ck('evidence opens on click', first.locator('.ev').first.is_visible())
    heads = first.locator('.ev table thead').first.inner_text()
    ck('details table has no ACE id column', 'exhibit' not in heads.lower(), heads)
    ck('details leads with the CR and a college count',
       'hold this' in first.locator('.ev .evmeta').first.inner_text(),
       first.locator('.ev .evmeta').first.inner_text())
    import re as _re
    ck('no bare ACE id rendered as its own emphasised cell',
       first.locator('.ev .mono').count()==0, first.locator('.ev .mono').count())

    # SELECT
    btn = first.locator('.selbtn').first
    ck('select button says Select', btn.inner_text().strip()=='Select', btn.inner_text())
    btn.click(); pg.wait_for_timeout(200)
    ck('card marked chosen', 'chosen' in (first.get_attribute('class') or ''))
    ck('counter moved to 1', '1 of 139' in pg.locator('#count').inner_text(), pg.locator('#count').inner_text())
    ck('chosen chip names the recommendation',
       '1 chosen' in first.locator('.chead').inner_text(), first.locator('.chead').inner_text()[:80])
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
    # Bulk fill takes the best HIGH-band option, preferring one whose hours match
    # the units. Reuse is allowed, so nothing is skipped for being claimed.
    pg.locator('#clear').click(); pg.wait_for_timeout(400)   # start from empty
    expect_n = pg.evaluate("""() => {
        const D = JSON.parse(document.getElementById('cpl-data').textContent);
        return D.courses.filter(c => c.cands.some(cd => cd.band === 'High')).length; }""")
    pg.locator('#pick').click(); pg.wait_for_timeout(900)
    n = int(pg.locator('#count').inner_text().split(' ')[0])
    ck('bulk fill covers every course that HAS a high-confidence option',
       n == expect_n, (n, expect_n))
    lowband = pg.evaluate("""() => {
        const D = JSON.parse(document.getElementById('cpl-data').textContent);
        const sel = JSON.parse(localStorage.getItem('lattc_mil_cpl_choices_v1')||'{}');
        let bad = 0;
        D.courses.forEach(c => (sel[c.code]||[]).forEach(rec => {
          const cd = c.cands.find(x => x.rec === rec);
          if (cd && cd.band !== 'High') bad++; }));
        return bad; }""")
    ck('bulk fill never puts a non-High recommendation in', lowband==0, lowband)
    pg.locator('#clear').click(); pg.wait_for_timeout(400)

    # MULTI-SELECT: a course may carry several recommendations, and the header
    # keeps a running total of their hours against the course's units.
    lab = pg.locator('article[data-code="WELDG/E030"]')
    lab.locator('.selbtn').nth(0).click(); pg.wait_for_timeout(250)
    lab.locator('.selbtn').nth(1).click(); pg.wait_for_timeout(250)
    head = lab.locator('.chead').inner_text()
    ck('a course can hold two recommendations at once', '2 chosen' in head, head[:90])
    ck('and the header totals their hours against the units', 'against 1 unit' in head, head[:120])
    stored = pg.evaluate("() => JSON.parse(localStorage.getItem('lattc_mil_cpl_choices_v1'))['WELDG/E030'].length")
    ck('both are stored', stored==2, stored)

    # REUSE IS ALLOWED and is stated, not warned about
    pg.locator('#clear').click(); pg.wait_for_timeout(300)
    ck('no duplicate WARNING exists any more', pg.locator('.warnbox.wb-dup').count()==0)

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
    ck('5 divergent-number warnings', pg.locator('.warnbox.wb-num').count()==5,
       pg.locator('.warnbox.wb-num').count())

    # a recommendation's HOURS shown against the course's UNITS
    lab = pg.locator('article[data-code="WELDG/E030"]')
    chips = lab.locator('.recitem .tag').all_inner_texts()
    # Jessica's cut: more than one unit apart is NOT LISTED; exactly one apart
    # stays with a lower score. A 1-unit lab must therefore never be offered a
    # 3-hour recommendation.
    ck('a 3-hour rec is GONE from a 1-unit lab', not any('3h' in c for c in chips), chips[:8])
    ck('the 1-hour match is offered', any('1h fits 1 unit' in c for c in chips), chips[:8])
    ck('an off-by-one (2h) rec is still offered', any('2h rec' in c for c in chips), chips[:8])
    gaps = pg.evaluate("""() => {
        const D = JSON.parse(document.getElementById('cpl-data').textContent);
        let bad = 0;
        D.courses.forEach(c => { if (c.u == null) return;
          c.cands.forEach(cd => { if (cd.h != null && Math.abs(cd.h - c.u) > 1.01) bad++; }); });
        return bad; }""")
    ck('NO listed recommendation is more than one unit from its course', gaps==0, gaps)
    nounits = pg.evaluate("""() => {
        const D = JSON.parse(document.getElementById('cpl-data').textContent);
        return D.courses.filter(c => c.u == null && c.cands.length).length; }""")
    ck('courses with no COCI units are NOT filtered (absent != failed)', nounits > 0, nounits)

    # the fix that matters for small courses: a unit match that ranks BELOW the
    # top five is still surfaced (22 were hidden on this 2-unit carpentry course)
    cb = pg.locator('article[data-code="CRPNTRY111B"]')
    ck('a 2-unit course surfaces its 2-hour options',
       cb.locator('.tag.t-fits').count() > 0, cb.locator('.tag.t-fits').count())

    pg.locator('.fbtn[data-f="low"]').click(); pg.wait_for_timeout(300)
    lowc = pg.locator('article.card:not(.hidden)').count()
    ck('the 1-2 unit filter shows the 28 small courses', lowc==28, lowc)
    pg.locator('.fbtn[data-f="all"]').click(); pg.wait_for_timeout(200)
    pg.locator('.fbtn[data-f="unitgap"]').click(); pg.wait_for_timeout(300)
    ug = pg.locator('article.card:not(.hidden)').count()
    ck('hours-not-equal-units filter narrows the list', 0 < ug < 139, ug)
    pg.locator('.fbtn[data-f="all"]').click(); pg.wait_for_timeout(200)

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
