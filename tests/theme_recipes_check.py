from pathlib import Path
from playwright.sync_api import sync_playwright,expect

out=Path(__file__).resolve().parents[1]/'test-artifacts';out.mkdir(exist_ok=True)
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1050},color_scheme='light')
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://127.0.0.1:8787/',wait_until='domcontentloaded')
    quiz=page.locator('#preference-quiz')
    expect(quiz).to_be_visible()
    expect(page.locator('html')).to_have_attribute('data-theme','light')
    page.locator('#quiz-budget').fill('900')
    quiz.locator('[data-theme-toggle]').click()
    expect(page.locator('html')).to_have_attribute('data-theme','dark')
    expect(page.locator('#quiz-budget')).to_have_value('900')
    page.screenshot(path=str(out/'quiz-dark.png'))
    page.locator('#quiz-skip').click()
    expect(page.locator('#budget')).to_have_value('1200')
    page.reload(wait_until='domcontentloaded')
    expect(quiz).to_be_hidden();expect(page.locator('html')).to_have_attribute('data-theme','dark')
    expect(page.locator('#catalog-count')).to_contain_text('50 demorecept')
    page.get_by_role('button',name='↻ Byt recept').first.click()
    assert page.locator('.replacement-option').count()>=8
    page.locator('#replacement-list button').last.click()
    name=page.locator('.recipe-card h4').first.inner_text()
    page.get_by_role('button',name='Se recept →').first.click()
    expect(page.locator('#recipe-detail h2')).to_have_text(name)
    assert page.locator('.ingredient-list li').count()>=3
    assert page.locator('.cooking-steps li').count()>=2
    page.get_by_role('button',name='Stäng recept',exact=True).click()
    page.screenshot(path=str(out/'dark-desktop.png'),full_page=True)
    page.locator('#shopping-tab').click()
    expect(page.locator('.shopping-row').first).to_be_visible()
    expect(page.locator('.auto-list-label')).to_contain_text('automatiskt')
    page.locator('.shopping-row input').first.check()
    before=page.locator('#shopping-list').inner_text()
    page.locator('.topbar [data-theme-toggle]').click()
    expect(page.locator('html')).to_have_attribute('data-theme','light')
    expect(page.locator('.shopping-row.done')).to_have_count(1)
    assert page.locator('#shopping-list').inner_text()==before
    page.reload(wait_until='domcontentloaded');expect(page.locator('html')).to_have_attribute('data-theme','light')
    assert page.locator('.recipe-card h4').first.inner_text()==name
    page.set_viewport_size({'width':390,'height':844})
    for theme in ('dark','light'):
        page.locator('.topbar [data-theme-toggle]').click()
        expect(page.locator('html')).to_have_attribute('data-theme',theme)
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        page.screenshot(path=str(out/f'{theme}-mobile.png'),full_page=True)
    # With no saved choice, use the system preference.
    second=browser.new_page(color_scheme='dark')
    second.goto('http://127.0.0.1:8787/',wait_until='domcontentloaded')
    expect(second.locator('html')).to_have_attribute('data-theme','dark')
    second.close()
    assert not errors,errors
    browser.close()
print('PASS: 50 recipes; new recipe replacement; automatic list; theme controls in quiz and planner; persistence/system default; preferences/list untouched by theme; both mobile themes.')
