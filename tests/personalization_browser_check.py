"""Images, favorites, recipe search and quiz personalization; no paid AI requests."""
import os,subprocess,time,atexit,json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
url=os.environ.get('MATBUDGET_TEST_URL','http://127.0.0.1:8900/')
if '127.0.0.1' in url:
 server=subprocess.Popen(['C:/Users/joars/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe','server.mjs'],env={**os.environ,'PORT':'8900'},stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 atexit.register(server.terminate);time.sleep(1)
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True);p=b.new_page(viewport={'width':1440,'height':1100})
 errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(url,wait_until='domcontentloaded');p.locator('#quiz-skip').click()
 expect(p.locator('#matmoms-status')).to_contain_text('449',timeout=15000)
 p.locator('#use-ai').uncheck()
 expect(p.locator('#catalog-count')).to_contain_text('100 recept')
 assert p.locator('.recipe-card .recipe-photo').count()==3
 response=p.request.get(url+'food-atlas-v1.png');assert response.status==200 and 'image/png' in response.headers['content-type']
 assert len(response.body())>100000
 first=p.locator('.library-card').first;name=first.locator('h4').inner_text()
 first.locator('.favorite-recipe').click();p.locator('#library-favorites').check()
 expect(p.locator('.library-card')).to_have_count(1)
 expect(p.locator('.library-card h4')).to_have_text(name)
 p.locator('.library-open').click();expect(p.locator('#recipe-detail h2')).to_have_text(name)
 p.locator('#recipe-dialog .close-dialog').click()
 p.locator('#library-favorites').uncheck();p.locator('#recipe-search').fill('pasta')
 assert p.locator('.library-card').count()>0
 assert all('pasta' in n.lower() for n in p.locator('.library-card h4').all_inner_texts())
 p.locator('#recipe-search').fill('')
 p.locator('input[name=cuisines][value=texmex]').check();p.locator('#menu-variety').select_option('repeat');p.locator('#generate').click()
 p.wait_for_function('JSON.parse(localStorage.getItem("matbudget-prototype-v1")).plan.settings.variety==="repeat"')
 plan=p.evaluate('JSON.parse(localStorage.getItem("matbudget-prototype-v1")).plan')
 assert plan['settings']['cuisines']==['texmex'] and plan['settings']['favoriteRecipes']
 for meal in plan['settings']['meals']:assert len({s['recipe'] for s in plan['slots'] if s['meal']==meal})<=2
 p.reload(wait_until='domcontentloaded');expect(p.locator('#menu-variety')).to_have_value('repeat')
 expect(p.locator('input[name=cuisines][value=texmex]')).to_be_checked()
 p.locator('#library-favorites').check();expect(p.locator('.library-card')).to_have_count(1)
 p.locator('#open-quiz').click();p.locator('#quiz-next').click();p.locator('#quiz-next').click()
 expect(p.locator('input[name=quiz-cuisines][value=texmex]')).to_be_checked()
 expect(p.locator('#quiz-variety')).to_have_value('repeat')
 p.locator('label:has(input[name=quiz-cuisines][value=texmex])').click();p.locator('label:has(input[name=quiz-cuisines][value=asian])').click();p.locator('#quiz-variety').select_option('varied')
 p.locator('#quiz-next').click();p.locator('#quiz-next').click();p.locator('#quiz-use-ai').uncheck();p.locator('#quiz-next').click()
 expect(p.locator('#preference-quiz')).to_be_hidden()
 assert p.evaluate('JSON.parse(localStorage.getItem("matbudget-prototype-v1")).plan.settings.cuisines')==['asian']
 p.locator('#recipe-cards').scroll_into_view_if_needed();p.screenshot(path=str(Path('test-artifacts/personalized-recipes-desktop.png').resolve()))
 p.locator('#library-favorites').uncheck();p.locator('.theme-toggle').first.click()
 p.set_viewport_size({'width':390,'height':844});p.locator('.recipe-library').scroll_into_view_if_needed()
 p.screenshot(path=str(Path('test-artifacts/personalized-recipes-mobile.png').resolve()))
 assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
 p.screenshot(path=str(Path('test-artifacts/personalized-recipes-mobile.png').resolve()))
 assert not errors,errors
 b.close()
print('PASS: 100 recipes; served food photos; library/search; favorites and reload; taste preferences; repeat/varied generation; quiz propagation; mobile and theme; no paid AI calls.')
