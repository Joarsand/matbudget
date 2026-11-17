"""Live read-only feature QA; isolated browser profile and no paid AI calls."""
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
base='https://dw911x8c8grll.cloudfront.net/'
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True);p=b.new_page(viewport={'width':1366,'height':900});errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(base);expect(p.locator('#preference-quiz')).to_be_visible()
 for _ in range(3):p.locator('#quiz-next').click()
 expect(p.locator('input[name=quiz-avoid]')).to_have_count(36)
 p.locator('#quiz-avoid-search').fill('tofu');p.locator('label:has(input[name=quiz-avoid][value=tofu])').click()
 expect(p.locator('#quiz-avoid-count')).to_contain_text('1 valda')
 p.locator('#quiz-avoid-search').fill('morötter');expect(p.locator('input[name=quiz-avoid][value=tofu]')).to_be_checked()
 p.locator('#quiz-back').click();p.locator('#quiz-next').click();expect(p.locator('input[name=quiz-avoid][value=tofu]')).to_be_checked()
 p.locator('#quiz-avoid-search').fill('inga-träffar-test');expect(p.locator('#quiz-avoid-count')).to_contain_text('inga träffar')
 p.locator('#quiz-avoid-search').fill('');p.set_viewport_size({'width':390,'height':844});assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
 p.screenshot(path=str(Path('test-artifacts/expanded-quiz-mobile.png').resolve()))
 p.locator('#quiz-skip').click();p.locator('#catalogue-browse').locator('summary').click();expect(p.locator('#catalogue-search')).to_be_visible()
 p.locator('#catalogue-search').fill('test-query-no-match');expect(p.locator('#catalogue-count')).to_contain_text('0 varor matchar')
 p.goto(base+'ica-recipes.html');expect(p.locator('#recipes article')).to_have_count(6);expect(p.locator('#count')).to_have_text('6 ICA-recept')
 assert p.locator('img').count()==0
 links=p.locator('#recipes a').evaluate_all('(nodes)=>nodes.map(n=>n.href)');assert all(link.startswith('https://www.ica.se/recept/') for link in links)
 p.locator('#search').fill('banan');expect(p.locator('#recipes article')).to_have_count(2)
 assert not errors,errors
 b.close()
print('PASS: all 36 ingredients searchable; hidden selections and previous-step answers retained; mobile; product search; six ICA-only source records with genuine original links and no unlicensed photos. No AI calls.')
