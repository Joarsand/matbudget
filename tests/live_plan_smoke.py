"""Explicit one-attempt Bedrock smoke test of the public HTTPS app. Never exports the code."""
import json
from datetime import datetime,timezone
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'test-artifacts/live-plan-20261117.json'
URL='https://dw911x8c8grll.cloudfront.net/'
code=json.loads((ROOT/'var/server-secrets.json').read_text())['accessCode']
result={'created':datetime.now(timezone.utc).isoformat(),'target':URL,'max_paid_attempts':1,'status':'failed'}
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True)
 try:
  page=browser.new_page(viewport={'width':1440,'height':1000})
  errors=[];page.on('pageerror',lambda error:errors.append(type(error).__name__))
  page.goto(URL,wait_until='domcontentloaded')
  page.locator('#quiz-skip').click()
  page.locator('label:has(input[name=period][value=week])').click()
  page.locator('#ai-code').fill(code)
  page.locator('#use-ai').check();page.locator('#generate').click()
  expect(page.locator('#ai-status')).to_contain_text('skapats med Amazon Bedrock',timeout=55000)
  saved=page.evaluate('localStorage.getItem("matbudget-prototype-v1")')
  assert code not in saved
  plan=json.loads(saved)['plan'];assert plan['ai']['provider']=='Amazon Bedrock'
  assert len(plan['slots'])==7*len(plan['settings']['meals'])
  page.locator('#shopping-tab').click();assert page.locator('.shopping-row').count()>0
  page.locator('#ai-code').fill('')
  assert not errors
  page.locator('.ai-preview').scroll_into_view_if_needed()
  page.screenshot(path=str(ROOT/'test-artifacts/live-plan-20261117.png'))
  result.update(status='passed',meals=len(plan['slots']),secret_persisted=False,shopping_list=True)
 except Exception as error:
  result['error_type']=type(error).__name__
  # Record only the public validation message, never headers, code or response bodies.
  try:
   message=page.locator('#form-error').inner_text()
   result['public_message']=message.replace(code,'[redacted]')[:250]
  except Exception:pass
 finally:browser.close()
OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(result,ensure_ascii=False))
raise SystemExit(0 if result['status']=='passed' else 1)
