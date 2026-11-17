"""Explicit paid live smoke check of the deployed app (one AI attempt)."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect

root=Path(__file__).resolve().parents[1]
url=json.loads((root/'var/aws-state.json').read_text())['url']
code=json.loads((root/'var/server-secrets.json').read_text())['accessCode']
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    response=page.goto(url,wait_until='domcontentloaded')
    assert response.status==200
    page.locator('#quiz-skip').click()
    expect(page.locator('#use-ai')).to_be_enabled()
    page.locator('#ai-code').fill(code)
    page.locator('#use-ai').check()
    page.locator('#generate').click()
    expect(page.locator('#ai-status')).to_contain_text('skapats med Amazon Bedrock',timeout=55000)
    saved=page.evaluate("localStorage.getItem('matbudget-prototype-v1')")
    assert code not in saved
    plan=json.loads(saved)['plan']
    assert plan['ai']['provider']=='Amazon Bedrock' and len(plan['slots'])==21
    expect(page.locator('.recipe-card')).to_have_count(3)
    page.locator('#shopping-tab').click()
    assert page.locator('.shopping-row').count()>0
    assert (page.request.post(url+'/api/plan',data={'settings':plan['settings']})).status==401
    assert (page.request.get(url+'/server.mjs')).status==404
    assert not errors,errors
    page.locator('#ai-code').fill('')
    page.locator('.ai-preview').scroll_into_view_if_needed()
    page.screenshot(path=str(root/'test-artifacts/aws-live-ai.png'))
    page.set_viewport_size({'width':390,'height':844})
    page.reload(wait_until='domcontentloaded')
    expect(page.locator('#ai-explanation')).to_contain_text('AI-förslag:')
    assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth'), 'Horizontal overflow'
    browser.close()
print('PASS: public HTTPS, real Bedrock generation of 21 meals, shopping list, protected endpoint, private files hidden, saved AI plan and mobile layout.')
