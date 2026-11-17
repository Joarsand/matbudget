"""Browser checks use a mocked AI response; no paid calls or saved access codes."""
import os,json,subprocess,time,atexit
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
NODE='C:/Users/joars/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
base=os.environ.get('TEST_BASE_URL','http://127.0.0.1:8906/')
if base.startswith('http://127.0.0.1:8906'):
 server=subprocess.Popen([NODE,'server.mjs'],cwd=ROOT,env={**os.environ,'PORT':'8906'},stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 atexit.register(server.terminate)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True);p=browser.new_page(viewport={'width':1440,'height':1000});errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 for attempt in range(40):
  try:
   if p.request.get(base+'api/status',timeout=1000).ok:break
  except Exception:time.sleep(.1)
 p.goto(base);p.locator('#quiz-skip').click();expect(p.locator('#ai-status')).not_to_contain_text('Kontrollerar')
 if p.locator('#use-ai').is_checked():p.locator('#use-ai').uncheck()
 p.locator('#lunchboxes').check();p.locator('#lunchbox-count').select_option('3');p.locator('#generate').click()
 getplan='JSON.parse(localStorage.getItem("matbudget-prototype-v1")).plan'
 p.wait_for_function('JSON.parse(localStorage.getItem("matbudget-prototype-v1")).plan.settings.lunchboxes===true');plan=p.evaluate(getplan);assert sum('leftoverFrom' in s for s in plan['slots'])==3
 p.locator('.recipe-card').filter(has_text='Laga dubbelt').locator('.view-recipe').click();expect(p.locator('#recipe-detail')).to_contain_text('till nästa dags lunch');p.locator('#recipe-dialog .close-dialog').click()
 p.reload();expect(p.locator('#lunchboxes')).to_be_checked();assert p.evaluate(getplan)==plan
 # Proposals remain separate until accepted, and canceled proposals never alter shopping/settings.
 p.route('**/api/edit-plan',lambda route:route.fulfill(json={'plan':proposal}))
 proposal=p.evaluate('''async()=>{const {withLunchboxes}=await import('/engine.mjs');const p=JSON.parse(localStorage.getItem('matbudget-prototype-v1')).plan;p.settings.lunchboxCount=7;p.slots=withLunchboxes(p.slots,p.settings);p.ai={explanation:'Alla möjliga matlådeluncher.'};return p;}''')
 p.locator('#ai-code').fill('mock-test-only-not-a-real-code');p.locator('#edit-request').fill('Planera fler matlådor');p.locator('#edit-send').click()
 expect(p.locator('#edit-preview')).to_be_visible();assert p.evaluate(getplan)==plan
 p.locator('#edit-cancel').click();assert p.evaluate(getplan)==plan
 p.locator('#edit-send').click();expect(p.locator('#edit-preview')).to_be_visible();p.locator('#edit-accept').click()
 assert p.evaluate(getplan)['settings']['lunchboxCount']==7
 p.reload();assert sum('leftoverFrom' in s for s in p.evaluate(getplan)['slots'])==6
 assert p.locator('#ai-code').input_value()==''
 before=p.evaluate(getplan);p.unroute('**/api/edit-plan');p.route('**/api/edit-plan',lambda route:route.fulfill(status=502,json={'error':'Tillfälligt fel'}))
 p.locator('#ai-code').fill('mock-test-only-not-a-real-code');p.locator('#edit-request').fill('Gör menyn billigare');p.locator('#edit-send').click()
 expect(p.locator('#edit-status')).to_contain_text('Din plan är kvar');assert p.evaluate(getplan)==before
 # Use only the selected price store; verify real alternative SKUs through the UI.
 p.locator('#clear-stores').click();p.locator('label:has(input[name=stores][value=willys])').click()
 if p.locator('#use-ai').is_checked():p.locator('#use-ai').uncheck()
 p.locator('#generate').click();p.wait_for_function('JSON.parse(localStorage.getItem("matbudget-prototype-v1")).plan.settings.stores.length===1')
 p.locator('#shopping-tab').click();expect(p.locator('.product-swaps')).to_be_visible()
 expect(p.locator('#swap-options button').first).to_be_visible()
 old_cost=p.locator('#stat-cost').inner_text();p.locator('.product-swaps').screenshot(path=str(ROOT/'test-artifacts/real-product-swaps.png'))
 p.locator('#swap-options button').first.click();assert p.locator('#stat-cost').inner_text()!=old_cost
 assert p.evaluate(getplan)['settings']['productChoices']
 p.locator('#swap-reset').click();expect(p.locator('#stat-cost')).to_have_text(old_cost)
 assert p.evaluate(getplan)['settings']['productChoices']=={}

 p.set_viewport_size({'width':390,'height':844});assert p.evaluate('document.documentElement.scrollWidth<=innerWidth'), 'Mobile horizontal overflow'
 assert not errors,errors
 p.screenshot(path=str(ROOT/'test-artifacts/plan-improvements-mobile.png'),full_page=True)
 browser.close()
print('PASS: lunchbox generation/reload; AI preview, cancel, accept, failure; access code not saved; shopping panel and mobile. No paid AI calls.')
