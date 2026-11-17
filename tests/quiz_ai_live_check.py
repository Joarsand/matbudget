"""One authorized production AI quiz call. Never print or persist its access code."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
url='https://dw911x8c8grll.cloudfront.net/'
code=json.loads(Path('var/server-secrets.json').read_text(encoding='utf8'))['accessCode']
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True);p=b.new_page(viewport={'width':1360,'height':1000})
 errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(url,wait_until='domcontentloaded')
 expect(p.locator('#use-ai')).to_be_checked();expect(p.locator('#use-ai')).to_be_enabled(timeout=15000)
 expect(p.locator('#matmoms-status')).to_contain_text('449',timeout=15000)
 p.locator('#quiz-budget').fill('800')
 p.locator('#quiz-next').click();p.locator('#quiz-next').click()
 p.locator('label:has(input[name=quiz-cuisines][value=asian])').click();p.locator('#quiz-variety').select_option('repeat')
 p.locator('#quiz-next').click();p.locator('#quiz-next').click()
 expect(p.locator('#quiz-use-ai')).to_be_checked()
 p.locator('#quiz-ai-code').fill(code)
 with p.expect_response(lambda r:r.url.endswith('/api/plan'),timeout=65000) as response:
  p.locator('#quiz-next').click()
 result=response.value
 assert result.status==200,('AI returned',result.status)
 expect(p.locator('#preference-quiz')).to_be_hidden()
 expect(p.locator('#ai-explanation')).to_contain_text('AI-förslag:')
 plan=p.evaluate('JSON.parse(localStorage.getItem("matbudget-prototype-v1")).plan')
 assert plan['ai']['provider']=='Amazon Bedrock' and plan['settings']['budget']==80000
 assert code not in p.evaluate('JSON.stringify(localStorage)')
 assert plan['settings']['priceBasis']=='matmoms'
 assert plan['settings']['cuisines']==['asian'] and plan['settings']['variety']=='repeat'
 for meal in plan['settings']['meals']:assert len({s['recipe'] for s in plan['slots'] if s['meal']==meal})<=2
 p.locator('#recipe-cards').scroll_into_view_if_needed()
 p.screenshot(path=str(Path('test-artifacts/ai-quiz-live-result.png').resolve()))
 assert not errors,errors
 b.close()
print('PASS: real Bedrock response from default-enabled quiz, budget/preferences retained, valid AI menu, Matmoms recipe prices, code not stored. One production AI attempt used.')
