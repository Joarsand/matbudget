"""Verify that all authored recipes have a real price-backed total in the reference store."""
import json,time
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
url='https://dw911x8c8grll.cloudfront.net/'
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True);p=b.new_page(viewport={'width':1440,'height':1050})
 errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 # Wait for the atomic server refresh to publish all 36 approved ingredient quotes.
 deadline=time.monotonic()+180
 while True:
  data=p.request.get(url+'api/prices',timeout=20000).json()
  rows=[r for r in data['records'] if r['chain']=='willys']
  if len({r['ingredient'] for r in rows})==36:break
  if time.monotonic()>deadline:raise AssertionError(('Incomplete server import',len(rows)))
  time.sleep(5)
 p.add_init_script('localStorage.setItem("matbudget-onboarding-v1","done")')
 p.goto(url,wait_until='domcontentloaded');expect(p.locator('#price-loading')).to_contain_text('kontrollerade varupriser',timeout=20000)
 expect(p.locator('#price-basis')).to_have_value('current')
 expect(p.locator('#stat-cost-note')).to_have_text('Hela förpackningar')
 assert p.locator('#stat-cost').inner_text() not in ['Saknar priser','Ej komplett']
 assert p.locator('#stat-left').inner_text()!='—'
 result=p.evaluate("""async()=>{const {recipes}=await import('/data.mjs');const {compare}=await import('/engine.mjs');const settings={people:2,stores:['willys'],memberships:[],maxStores:1,pantry:{}};return {count:recipes.length,incomplete:recipes.filter(r=>compare([{recipe:r.id}],settings).total===null).map(r=>r.id)};}""")
 assert result=={'count':100,'incomplete':[]},result
 expect(p.locator('#budget-message')).to_contain_text('snittvikt')
 p.locator('#shopping-tab').click();expect(p.locator('#shopping-list')).to_contain_text('/kg')
 assert p.locator('#shopping-list').get_by_text('Pris saknas',exact=True).count()==0
 # Old historical plans can change price basis without a new AI call or menu changes.
 p.locator('#price-basis').select_option('matmoms')
 slots=p.evaluate('JSON.parse(localStorage.getItem("matbudget-prototype-v1")).plan.slots')
 expect(p.locator('#use-complete-prices')).to_be_visible();p.locator('#use-complete-prices').click()
 expect(p.locator('#price-basis')).to_have_value('current')
 expect(p.locator('#stat-cost-note')).to_have_text('Hela förpackningar')
 assert p.evaluate('JSON.parse(localStorage.getItem("matbudget-prototype-v1")).plan.slots')==slots
 assert p.locator('.store-card').count()==1
 p.locator('#stat-cost').scroll_into_view_if_needed();p.screenshot(path=str(Path('test-artifacts/complete-price-budget.png').resolve()))
 p.set_viewport_size({'width':390,'height':844});assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 b.close()
print('PASS: live ordinary-product importer: 36/36 ingredients, 100/100 recipes priced, full budget and remaining amount, genuine kr/kg plus explicit average-weight estimate, same-menu switch from historical data, mobile; no AI calls.')
