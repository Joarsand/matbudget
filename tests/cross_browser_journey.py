"""Three-engine UI journey; isolated local server, real price snapshot, controlled AI responses."""
import json,os,subprocess,time,urllib.request,tempfile
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone
from pathlib import Path
from playwright.sync_api import sync_playwright,expect

ROOT=Path(__file__).resolve().parents[1]
# Keep Windows Firefox's temporary profile path short and native. Never use a personal profile.
SHORT_TEMP=ROOT.parents[3]/'qa-tmp'
if os.name=='nt':
 SHORT_TEMP=Path(os.environ.get('MATBUDGET_QA_TEMP',str(SHORT_TEMP)))
 SHORT_TEMP.mkdir(parents=True,exist_ok=True)
 for key in ('TEMP','TMP','TMPDIR'):os.environ[key]=str(SHORT_TEMP)
OUT=ROOT/'test-artifacts'/('journey-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
BASE='http://127.0.0.1:8971/'
SECRET='isolated-fixture-not-a-real-key'

def journey(engine):
 result={'engine':engine,'status':'failed','checks':[],'ai':'controlled responses; no paid calls'}
 with sync_playwright() as pw:
  browser=None
  try:
   browser=getattr(pw,engine).launch(headless=True)
   page=browser.new_page(viewport={'width':1440,'height':1000})
   errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
   page.route('**/api/status',lambda route:route.fulfill(json={'enabled':True,'dailyLimit':20}))
   def ai(route):
    request=route.request.post_data_json
    assert route.request.headers.get('x-ai-access-code')==SECRET
    plan=page.evaluate("""async settings=>{const {generate}=await import('/engine.mjs');return generate(settings)}""",request['settings'])
    plan['ai']={'provider':'Amazon Bedrock','explanation':'Kontrollerad QA-meny.'}
    route.fulfill(json={'plan':plan})
   page.route('**/api/plan',ai)
   page.goto(BASE,wait_until='domcontentloaded')
   expect(page.locator('#price-loading')).not_to_contain_text('Hämtar',timeout=20000)
   result['price_status']=page.locator('#price-loading').inner_text()
   page.locator('#quiz-budget').fill('1200')
   for _ in range(4):page.locator('#quiz-next').click()
   page.locator('#quiz-ai-code').fill(SECRET);page.locator('#quiz-next').click()
   expect(page.locator('#preference-quiz')).to_be_hidden()
   expect(page.locator('#ai-explanation')).to_contain_text('Kontrollerad QA-meny')
   plan=lambda:page.evaluate('JSON.parse(localStorage.getItem("matbudget-prototype-v1")).plan')
   assert plan()['settings']['budget']==120000
   assert SECRET not in page.evaluate('JSON.stringify(localStorage)')
   result['checks'].append('quiz → validated controlled AI plan; access code not persisted')
   page.locator('.recipe-card .view-recipe').first.click()
   expect(page.locator('#recipe-dialog')).to_be_visible();page.locator('#recipe-dialog .close-dialog').click()
   # A swap button opens the compatible alternatives dialog.
   before=plan()['slots'][0]['recipe']
   page.locator('.recipe-card .replace-recipe').first.click()
   expect(page.locator('#replace-dialog')).to_be_visible()
   page.locator('#replacement-list button').first.click()
   assert plan()['slots'][0]['recipe']!=before
   result['checks'].append('recipe details and compatible recipe replacement')
   page.locator('#shopping-tab').click();expect(page.locator('#shopping-list')).to_be_visible()
   assert page.locator('#shopping-list').inner_text().strip()
   result['checks'].append('aggregated shopping list')
   theme=page.locator('[data-theme-toggle]').first
   old=page.locator('html').get_attribute('data-theme');theme.click()
   assert page.locator('html').get_attribute('data-theme')!=old
   saved=plan();page.reload(wait_until='domcontentloaded')
   assert plan()['slots']==saved['slots']
   result['checks'].append('theme and saved plan reload')
   page.screenshot(path=str(OUT/(engine+'-desktop.png')))
   page.set_viewport_size({'width':390,'height':844})
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   page.screenshot(path=str(OUT/(engine+'-mobile.png')))
   result['checks'].append('390px mobile layout')
   page.goto(BASE+'ica-recipes.html')
   expect(page.locator('.budget-review')).to_have_count(6)
   page.locator('#search').fill('linssoppa');expect(page.locator('#count')).to_contain_text('2 ICA-recept')
   assert not errors,errors
   result['checks'].append('ICA source and migration review view')
   result['status']='passed'
  except Exception as error:
   result['error']=str(error)[:1400];result['page_errors']=errors if browser else []
   if browser:
    try:page.screenshot(path=str(OUT/(engine+'-failure.png')))
    except Exception:pass
  finally:
   if browser:browser.close()
 return result

if __name__=='__main__':
 OUT.mkdir(parents=True,exist_ok=True)
 server=subprocess.Popen(['node','server.mjs'],cwd=ROOT,env={**os.environ,'PORT':'8971','HOST':'127.0.0.1','AI_ENABLED':'0','PRICEBOOK_STATE_FILE':str(ROOT/'var/price-book-verified-20261117.json')},stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 try:
  for attempt in range(60):
   try:
    with urllib.request.urlopen(BASE+'api/status',timeout=1):break
   except Exception:time.sleep(.1)
  # This Windows environment cannot open Firefox's disposable profile. Keep normal
  # local runs free of error dialogs; Linux CI still runs all three engines.
  defaults='chromium,webkit' if os.name=='nt' else 'chromium,firefox,webkit'
  engines=os.environ.get('MATBUDGET_TEST_BROWSERS',defaults).split(',')
  assert all(engine in ('chromium','firefox','webkit') for engine in engines)
  with ThreadPoolExecutor(max_workers=len(engines)) as pool:results=list(pool.map(journey,engines))
  summary={'results':results,'workers':len(engines),'created':datetime.now(timezone.utc).isoformat(),'scope':'local current source; controlled AI, not live model validation','firefox_note':'Windows local default excludes Firefox after profile startup failures; Linux CI covers Firefox.' if os.name=='nt' and 'firefox' not in engines else None}
  (OUT/'results.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf8')
  print(json.dumps(summary,ensure_ascii=False));print('Artifacts:',OUT)
  raise SystemExit(0 if all(r['status']=='passed' for r in results) else 1)
 finally:
  server.terminate();server.wait(timeout=10)
