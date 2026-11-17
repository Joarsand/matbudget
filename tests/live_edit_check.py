"""Explicit opt-in: one production Bedrock request, within the shared daily quota."""
import sys,json,subprocess,urllib.request
from pathlib import Path
if '--live-ai' not in sys.argv:raise SystemExit('Requires --live-ai (one paid production AI attempt).')
root=Path(__file__).resolve().parents[1]
node='C:/Users/joars/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
settings=dict(period='week',startDate='2026-11-10',month='2026-11',people=2,budget=150000,meals=['lunch','dinner'],diet='vegetarian',maxTime=30,easy=True,exclusions=[],avoidIngredients=[],stores=['willys'],memberships=[],maxStores=1,pantry={})
script="import {generate} from './web/engine.mjs';console.log(JSON.stringify(generate("+json.dumps(settings)+")));"
plan=json.loads(subprocess.check_output([node,'--input-type=module','-e',script],cwd=root,text=True,encoding='utf8'))
code=json.loads((root/'var/server-secrets.json').read_text(encoding='utf8'))['accessCode']
request=urllib.request.Request('https://dw911x8c8grll.cloudfront.net/api/edit-plan',method='POST',headers={'Content-Type':'application/json','X-AI-Access-Code':code},data=json.dumps({'plan':plan,'message':'Planera exakt tre matlådeluncher per sju dagar genom att laga extra middag. Behåll alla mina övriga matval.'}).encode())
with urllib.request.urlopen(request,timeout=60) as response:result=json.load(response)['plan']
assert result['settings']['lunchboxes'] is True
assert result['settings']['lunchboxCount']==3
assert sum('leftoverFrom' in s for s in result['slots'])==3
assert all(result['settings'][key]==value for key,value in settings.items())
assert result['ai']['provider']=='Amazon Bedrock'
print('PASS: production Bedrock interprets the lunchbox edit, preserves preferences and returns three validated linked lunches. One AI attempt; no code saved or printed.')
