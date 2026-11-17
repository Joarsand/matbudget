"""Check missing prices in the actual UI; no paid AI requests."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect

url=os.environ.get('MATBUDGET_TEST_URL','http://127.0.0.1:8787/')
out=Path(__file__).resolve().parents[1]/'test-artifacts'
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True)
    page=browser.new_page(viewport={'width':1360,'height':1000})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.route('**/api/prices',lambda route:route.fulfill(json={'version':1,'records':[],'sources':{}}))
    page.goto(url,wait_until='domcontentloaded')
    page.locator('#quiz-skip').click()
    expect(page.locator('#stat-cost')).to_have_text('Saknar priser')
    expect(page.locator('#stat-left')).to_have_text('—')
    expect(page.locator('#budget-percent')).to_have_text('—')
    expect(page.locator('#budget-progress')).to_be_hidden()
    expect(page.locator('#budget-message')).to_contain_text('kan därför inte beräknas')
    assert page.locator('.best-label').count()==0
    expect(page.locator('.recipe-price strong')).to_have_text(['Pris saknas']*3)
    page.locator('#select-all-stores').click()
    page.locator('#generate').click()
    expect(page.locator('.store-card')).to_have_count(13)
    expect(page.locator('.store-card > strong')).to_have_text(['Pris saknas']*13)
    page.locator('#shopping-tab').click()
    assert page.locator('.shopping-row').count()>0
    for row in page.locator('.shopping-row').all():
        assert 'Pris saknas' in row.inner_text()
        assert 'Kvar efter planen' not in row.inner_text()
        assert 'förpackning är inte verifierade' in row.inner_text()
    page.reload(wait_until='domcontentloaded')
    expect(page.locator('#stat-cost')).to_have_text('Saknar priser')
    page.screenshot(path=str(out/'no-demo-prices.png'))
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth')
    assert not errors,errors
    browser.close()
print('PASS: no demo totals or recipe/store prices; unknown budget percentage; no cheapest-store badge; no fictitious packs; reload and mobile layout.')
