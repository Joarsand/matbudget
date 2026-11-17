"""Verify partial sums and direct source switching without modifying the menu."""
import os,json,re,subprocess,time,atexit
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
url=os.environ.get('MATBUDGET_TEST_URL','http://127.0.0.1:8897/')
if '127.0.0.1:8897' in url:
 server=subprocess.Popen(['C:/Users/joars/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe','server.mjs'],env={**os.environ,'PORT':'8897'},stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 atexit.register(server.terminate);time.sleep(1)
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True);c=b.new_context(viewport={'width':1142,'height':958})
 c.add_init_script('localStorage.setItem("matbudget-onboarding-v1","done")')
 p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(url,wait_until='domcontentloaded')
 expect(p.locator('#matmoms-status')).to_contain_text('449',timeout=15000)
 p.locator('#use-ai').uncheck()
 expect(p.locator('#price-basis')).to_have_value('matmoms')
 p.locator('#select-all-stores').click();p.locator('#generate').click()
 expect(p.locator('.store-card')).to_have_count(6)
 for brand in ['ICA Maxi Lindhagen','Coop Online Stockholm 1','Willys Stockholm Sköndal']:
  assert brand in p.locator('#store-cards').inner_text()
 assert p.locator('.brand-price-data').count()>=6
 history=p.locator('.brand-price-data').filter(has_text='Matmoms · historiska prisobservationer').first
 history.locator('summary').click()
 assert history.locator('.brand-price-list li').count()>50
 expect(history.locator('.brand-price-list')).to_contain_text('observerat 2026-10')
 slots=p.evaluate('JSON.parse(localStorage.getItem("matbudget-prototype-v1")).plan.slots')
 p.locator('#price-basis').select_option('current')
 expect(p.locator('#price-overview')).to_contain_text('ordinarie onlinepriser')
 p.locator('#apply-matmoms').click()
 expect(p.locator('#price-overview')).to_contain_text('MATMOMS')
 assert p.evaluate('JSON.parse(localStorage.getItem("matbudget-prototype-v1")).plan.slots')==slots
 # Assert each partial amount matches its known pack costs, never a full total.
 checks=p.evaluate('''async()=>{const {compare,money}=await import('/engine.mjs');const plan=JSON.parse(localStorage.getItem('matbudget-prototype-v1')).plan;return compare(plan.slots,plan.settings).carts.map(c=>({store:c.store,complete:c.complete,known:c.lines.filter(l=>l.needed>0&&l.cost!==null).length,missing:c.lines.filter(l=>l.cost===null).length,sum:money(c.lines.reduce((sum,l)=>sum+(l.cost||0),0))}));}''')
 for i,cart in enumerate(checks):
  card=p.locator('.store-card').nth(i)
  if cart['known'] and not cart['complete']:
   expect(card.locator(':scope > strong')).to_have_text(cart['sum'])
   expect(card.locator('.cart-price-label')).to_contain_text('Delsumma')
  if cart['missing']:
   expect(card.locator('.missing-prices li')).to_have_count(cart['missing'])
 assert 'ej totalsumma' in p.locator('#stat-cost-note').inner_text()
 expect(p.locator('#stat-left')).to_have_text('—')
 p.locator('#store-cards').scroll_into_view_if_needed()
 p.screenshot(path=str(Path('test-artifacts/partial-price-cards.png').resolve()))
 p.set_viewport_size({'width':390,'height':844})
 p.locator('.missing-prices summary').first.click()
 assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 b.close()
print('PASS: known subtotals, exact missing ingredients, Matmoms immediate switching, unchanged menu, no fabricated total or remaining budget, mobile.')

