"""Postcode, local store directory and explicitly labelled reference prices. No AI call."""
import os,subprocess,time,atexit,json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
url=os.environ.get('MATBUDGET_TEST_URL','http://127.0.0.1:8899/')
if '127.0.0.1' in url:
 server=subprocess.Popen(['C:/Users/joars/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe','server.mjs'],env={**os.environ,'PORT':'8899'},stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 atexit.register(server.terminate);time.sleep(1)
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True);p=b.new_page(viewport={'width':1440,'height':1050})
 errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(url,wait_until='domcontentloaded')
 # Postcode is collected in the quiz and used even without AI.
 p.locator('#quiz-postal').fill('411 02')
 for _ in range(4):p.locator('#quiz-next').click()
 p.locator('#quiz-use-ai').uncheck();p.locator('#quiz-next').click()
 expect(p.locator('#preference-quiz')).to_be_hidden()
 expect(p.locator('#location-label')).to_contain_text('Göteborg',timeout=15000)
 saved=p.evaluate('JSON.parse(localStorage.getItem("matbudget-prototype-v1")).plan')
 assert saved['settings']['postalCode']=='41102'
 data=p.request.get(url+'api/prices/41102').json()
 assert data['location']['city']=='Göteborg' and data['location']['nearby']
 assert len(data['matmoms']['allCatalogue'])==3319
 assert all(r['distanceKm']<=30 for r in data['location']['nearby'])
 assert any(r['city']=='Göteborg' for r in data['references'])
 assert any('annan butik' in t.lower() or 'samma butik' in t.lower() for t in p.locator('.local-price-source').all_inner_texts())
 slots=saved['slots']
 p.locator('#postal-code').fill('11247');p.locator('#find-nearby').click()
 expect(p.locator('#location-label')).to_contain_text('Stockholm')
 assert p.evaluate('JSON.parse(localStorage.getItem("matbudget-prototype-v1")).plan.slots')==slots
 expect(p.locator('#nearby-stores')).to_contain_text('km')
 assert p.locator('#nearby-stores a').first.get_attribute('href').startswith('https://www.google.com/maps/search/')
 p.locator('#postal-code').fill('99999');p.locator('#find-nearby').click()
 expect(p.locator('#location-status')).to_contain_text('finns inte')
 assert p.evaluate('JSON.parse(localStorage.getItem("matbudget-prototype-v1")).plan.settings.postalCode')=='11247'
 # Reload restores the postcode and correctly scoped price data.
 p.reload(wait_until='domcontentloaded')
 expect(p.locator('#location-label')).to_contain_text('Stockholm',timeout=15000)
 expect(p.locator('#postal-code')).to_have_value('11247')
 p.locator('#nearby-section summary').click();p.locator('#nearby-section').scroll_into_view_if_needed()
 p.screenshot(path=str(Path('test-artifacts/postcode-stores-live.png').resolve()))
 p.set_viewport_size({'width':390,'height':844})
 assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
 # Browse the whole public export, not only the stores selected for the plan.
 p.get_by_text('Sök i Matmoms prisobservationer',exact=True).click()
 p.locator('#matmoms-all-stores').check()
 expect(p.locator('#matmoms-result-count')).to_contain_text('3319')
 assert not errors,errors
 b.close()
print('PASS: quiz postcode, Göteborg/Stockholm store and price binding, explicit fallback labels, unknown postcode rejection, saved postcode restore, national catalogue, mobile; no AI usage.')
