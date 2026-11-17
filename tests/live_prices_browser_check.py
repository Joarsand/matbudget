"""Read-only production smoke check, using isolated local preferences. No AI call."""
import json,math
from pathlib import Path
from playwright.sync_api import sync_playwright,expect

url='https://dw911x8c8grll.cloudfront.net/'
out=Path(__file__).resolve().parents[1]/'test-artifacts'
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True)
 context=browser.new_context(viewport={'width':1440,'height':1050})
 s={'period':'week','startDate':'2026-11-09','month':'2026-11','people':2,'budget':120000,'meals':['breakfast'],'diet':'vegetarian','maxTime':30,'easy':True,'exclusions':[],'avoidIngredients':[],'stores':['mathem'],'memberships':[],'maxStores':1,'pantry':{}}
 saved={'version':1,'plan':{'settings':s,'slots':[{'day':i,'meal':'breakfast','recipe':'egg-toast'} for i in range(7)],'adjusted':False},'checked':[]}
 # Fixture sets only ordinary user preferences/valid recipes, never injects prices.
 context.add_init_script('localStorage.setItem("matbudget-onboarding-v1","done");localStorage.setItem("matbudget-prototype-v1",'+json.dumps(json.dumps(saved))+');')
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(url,wait_until='domcontentloaded')
 expect(page.locator('#price-loading')).to_contain_text('kontrollerade varupriser',timeout=15000)
 page.locator('#use-ai').uncheck()
 prices=page.request.get(url+'api/prices').json()
 records=[r for r in prices['records'] if r['chain']=='mathem']
 by_id={r['ingredient']:r for r in records}
 expected=sum(math.ceil(amount/by_id[ing]['quantity']-1e-10)*by_id[ing]['priceOre'] for ing,amount in [('eggs',28),('bread',1120),('salt',7)])
 actual=page.locator('#stat-cost').inner_text()
 numeric=''.join(c for c in actual if c.isdigit() or c==',')
 assert round(float(numeric.replace(',','.'))*100)==expected,(actual,expected)
 assert 'Pris saknas' not in page.locator('.recipe-price strong').inner_text()
 page.locator('#shopping-tab').click()
 expect(page.locator('.shopping-row')).to_have_count(3)
 assert 'Mathem online' in page.locator('#shopping-list').inner_text()
 # All stores remain visible; no unsupported chain inherits one of these prices.
 page.locator('#select-all-stores').click()
 page.locator('#generate').click()
 expect(page.locator('.store-card')).to_have_count(6)
 assert 'Prisdata är inte ansluten' in page.locator('.store-card').filter(has_text='ICA').inner_text()
 page.get_by_text('Priskällor för alla 6 kedjor',exact=True).click()
 expect(page.locator('#price-source-list li')).to_have_count(6)
 page.locator('#price-record-count').click()
 expect(page.locator('.verified-price-row')).to_have_count(len(prices['records']))
 assert all(a.startswith('https://') for a in page.locator('#verified-price-list a').evaluate_all('(items)=>items.map(i=>i.href)'))
 page.locator('.price-source-panel').scroll_into_view_if_needed()
 page.screenshot(path=str(out/'verified-prices-live.png'))
 page.set_viewport_size({'width':390,'height':844})
 assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth'), 'Mobile horizontal overflow'
 assert not errors,errors
 browser.close()
print('PASS: actual HTTPS price feed; complete basket uses real pack quantities; 6-chain source status; source links; mobile; no AI usage.')
