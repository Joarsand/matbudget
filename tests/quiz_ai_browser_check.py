"""AI is on by default; quiz submits preferences securely; no paid requests in mock mode."""
import os,json,subprocess,time,atexit
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
url=os.environ.get('MATBUDGET_TEST_URL','http://127.0.0.1:8898/')
if '127.0.0.1' in url:
 server=subprocess.Popen(['C:/Users/joars/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe','server.mjs'],env={**os.environ,'PORT':'8898'},stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 atexit.register(server.terminate);time.sleep(1)
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True);c=b.new_context(viewport={'width':1360,'height':1000})
 p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.route('**/api/status',lambda r:r.fulfill(json={'enabled':True,'dailyLimit':20}))
 p.goto(url,wait_until='domcontentloaded')
 expect(p.locator('#use-ai')).to_be_checked()
 expect(p.locator('#use-ai')).to_be_enabled()
 original=p.evaluate('JSON.parse(localStorage.getItem("matbudget-prototype-v1")).plan')
 expect(p.locator('#matmoms-status')).to_contain_text('449',timeout=15000)
 expect(p.locator('.recipe-card .recipe-missing-prices').first).to_be_attached()
 assert 'delsumma / portion' in p.locator('#recipe-cards').inner_text()
 p.locator('#quiz-budget').fill('900')
 for _ in range(4):p.locator('#quiz-next').click()
 expect(p.locator('#quiz-use-ai')).to_be_checked()
 p.locator('#quiz-next').click()
 expect(p.locator('#quiz-error')).to_contain_text('åtkomstkoden',ignore_case=True)
 calls=[]
 def respond(route):
  req=route.request.post_data_json;calls.append(req)
  assert route.request.headers.get('x-ai-access-code')=='test-code-never-saved'
  plan={**original,'settings':req['settings'],'ai':{'provider':'Amazon Bedrock','explanation':'Quizvalen används för en personlig meny.'}}
  route.fulfill(json={'plan':plan})
 p.route('**/api/plan',respond)
 p.locator('#quiz-ai-code').fill('test-code-never-saved')
 p.locator('#quiz-next').click()
 expect(p.locator('#preference-quiz')).to_be_hidden()
 expect(p.locator('#ai-explanation')).to_contain_text('Quizvalen')
 assert len(calls)==1 and calls[0]['settings']['budget']==90000
 assert 'test-code-never-saved' not in p.evaluate('JSON.stringify(localStorage)')
 saved=p.evaluate('localStorage.getItem("matbudget-prototype-v1")')
 p.unroute('**/api/plan');p.route('**/api/plan',lambda r:r.fulfill(status=502,json={'error':'Kontrollerat AI-fel'}))
 p.locator('#generate').click();expect(p.locator('#form-error')).to_contain_text('Kontrollerat AI-fel')
 assert p.evaluate('localStorage.getItem("matbudget-prototype-v1")')==saved
 p.locator('#open-quiz').click()
 for _ in range(4):p.locator('#quiz-next').click()
 p.set_viewport_size({'width':390,'height':844})
 assert p.locator('#preference-quiz').evaluate('e=>e.scrollWidth<=e.clientWidth')
 p.screenshot(path=str(Path('test-artifacts/quiz-default-ai.png').resolve()))
 assert not errors,errors
 b.close()
print('PASS: AI default; inline quiz code; actual quiz settings in request; secret never stored; failures preserve plan; recipe partial prices; mobile. Controlled responses, no paid AI call.')
