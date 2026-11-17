"""Browser integration with controlled API responses; no paid model requests."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

out=Path(__file__).resolve().parents[1]/'test-artifacts'
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True)
    page=browser.new_page(viewport={'width':1360,'height':1000})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.route('**/api/status',lambda route:route.fulfill(json={'enabled':True,'dailyLimit':20}))
    page.goto('http://127.0.0.1:8787/',wait_until='domcontentloaded')
    page.locator('#quiz-skip').click()
    original=json.loads(page.evaluate("localStorage.getItem('matbudget-prototype-v1')"))['plan']
    next_plan={**original,'ai':{'provider':'Amazon Bedrock','explanation':'Testad meny med återkommande råvaror.'}}
    page.route('**/api/plan',lambda route:route.fulfill(json={'plan':next_plan}))
    page.locator('#use-ai').check()
    page.locator('#generate').click()
    expect(page.locator('#form-error')).to_contain_text('åtkomstkoden')
    page.locator('#ai-code').fill('isolated-browser-test-code')
    page.locator('#generate').click()
    expect(page.locator('#ai-explanation')).to_contain_text('Testad meny')
    expect(page.locator('#ai-status')).to_contain_text('skapats med Amazon Bedrock')
    saved=page.evaluate("localStorage.getItem('matbudget-prototype-v1')")
    assert 'isolated-browser-test-code' not in saved
    page.unroute('**/api/plan')
    page.route('**/api/plan',lambda route:route.fulfill(status=502,json={'error':'Test: modellen är inte tillgänglig.'}))
    page.locator('#generate').click()
    expect(page.locator('#form-error')).to_contain_text('inte tillgänglig')
    assert page.evaluate("localStorage.getItem('matbudget-prototype-v1')")==saved
    page.locator('#use-ai').uncheck()
    page.locator('#generate').click()
    expect(page.locator('#ai-explanation')).to_have_text('')
    assert not errors,errors
    page.locator('.ai-preview').scroll_into_view_if_needed()
    page.screenshot(path=str(out/'ai-controls.png'))
    browser.close()
print('PASS: optional AI; access code required and never saved; AI result rendered; failure preserves prior plan; demo remains usable.')
