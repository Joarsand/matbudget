"""Compare actual before/after imports with identical menus; no invented prices or AI calls."""
import os,json,subprocess,time,atexit
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
url=os.environ.get('MATBUDGET_TEST_URL','http://127.0.0.1:8901/')
if '127.0.0.1' in url:
 server=subprocess.Popen(['C:/Users/joars/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe','server.mjs'],env={**os.environ,'PORT':'8901'},stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 atexit.register(server.terminate);time.sleep(1)
root=Path(__file__).resolve().parents[1]
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True)
 results=[]
 for name in ['matmoms-before-importer-fix.json','matmoms-reference.json']:
  data=json.loads((root/'var'/name).read_text(encoding='utf8'))
  c=b.new_context(viewport={'width':1440,'height':1000});c.add_init_script('localStorage.setItem("matbudget-onboarding-v1","done")')
  p=c.new_page();p.route('**/api/prices',lambda route:route.fulfill(json={'version':1,'records':[],'sources':{},'references':data['references'],'matmoms':data}))
  p.goto(url,wait_until='domcontentloaded');expect(p.locator('#matmoms-status')).to_contain_text(str(len(data['references']))+' kopplingar',timeout=15000)
  result=p.evaluate('''async()=>{const {compare}=await import('/engine.mjs');const plan=JSON.parse(localStorage.getItem('matbudget-prototype-v1')).plan;const c=compare(plan.slots,plan.settings);return {slots:plan.slots,known:c.displayCart.lines.filter(l=>l.needed>0&&l.cost!==null).length,required:c.required.length,total:c.total};}''')
  results.append(result)
  if name=='matmoms-reference.json':
   p.get_by_text('Importstatus och saknade produktkopplingar',exact=True).click()
   expect(p.locator('.matmoms-source-panel')).to_contain_text('439 granskade')
   p.locator('.matmoms-source-panel').scroll_into_view_if_needed();p.screenshot(path=str(root/'test-artifacts/importer-coverage.png'))
  c.close()
 assert results[0]['slots']==results[1]['slots']
 assert results[1]['known']>results[0]['known'],results
 assert results[1]['total'] is None
 if '127.0.0.1' not in url:
  p=b.new_page();d=p.request.get(url+'api/prices').json()
  assert d['matmoms']['importVersion']==3 and len(d['matmoms']['allReferences'])==439
 b.close()
print('PASS: unchanged menu coverage improved from',results[0]['known'],'to',results[1]['known'],'of',results[1]['required'],'ingredients; missing prices remain unknown. Real before/after exports only.')

