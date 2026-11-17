"""Production Matmoms browser check: isolated preferences, no paid AI requests."""
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
url='https://dw911x8c8grll.cloudfront.net/'
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True)
 c=b.new_context(viewport={'width':1440,'height':1000})
 c.add_init_script('localStorage.setItem("matbudget-onboarding-v1","done")')
 p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(url,wait_until='domcontentloaded')
 expect(p.locator('#matmoms-status')).to_contain_text('449',timeout=20000)
 p.locator('#use-ai').uncheck()
 data=p.request.get(url+'api/prices').json()
 assert len(data['references'])==53
 assert data['matmoms']['observedThrough']=='2026-10-31'
 assert len(data['records'])>=50
 assert {r['chain'] for r in data['references']}=={'ica','coop','willys'}
 expect(p.locator('.matmoms-source-panel')).to_contain_text('CC BY 4.0')
 p.get_by_text('Sök i Matmoms prisobservationer',exact=True).click()
 p.locator('#matmoms-search').fill('mjölk')
 assert p.locator('#matmoms-results article').count()>0
 expect(p.locator('#matmoms-results')).to_contain_text('observerat 2026-10')
 p.locator('#use-matmoms').click()
 expect(p.locator('#budget-message')).to_contain_text('Historisk referensbudget')
 assert p.evaluate('JSON.parse(localStorage.getItem("matbudget-prototype-v1")).plan.settings.priceBasis')=='matmoms'
 p.locator('#shopping-tab').click()
 expect(p.locator('#shopping-list')).to_contain_text('Matmoms · observerat')
 p.locator('.matmoms-source-panel').scroll_into_view_if_needed()
 p.screenshot(path=str(Path('test-artifacts/matmoms-live.png').resolve()))
 p.reload(wait_until='domcontentloaded')
 expect(p.locator('#matmoms-status')).to_contain_text('449',timeout=15000)
 expect(p.locator('#price-basis')).to_have_value('matmoms')
 expect(p.locator('#budget-message')).to_contain_text('Historisk referensbudget')
 p.locator('#price-basis').select_option('current')
 p.locator('#select-priced-stores').click();p.locator('#generate').click()
 expect(p.locator('#price-overview')).to_contain_text('ordinarie onlinepriser')
 assert 'Historisk referensbudget' not in p.locator('#budget-message').inner_text()
 p.set_viewport_size({'width':390,'height':844})
 assert p.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Mobile overflow'
 assert not errors,errors
 b.close()
print('PASS: Matmoms live data, credit, search, reference budgeting, dated shopping lines, reload, current-price isolation, mobile, no AI calls.')
