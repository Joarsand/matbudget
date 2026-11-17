import test from 'node:test';
import assert from 'node:assert/strict';
import {candidates,generate,validate} from '../web/engine.mjs';
import {recipeMap} from '../web/data.mjs';
import {cleanSettings,requestFor,parsePlan} from '../server/ai.mjs';
const settings={period:'week',startDate:'2026-11-09',month:'2026-11',people:2,budget:120000,meals:['breakfast','lunch','dinner'],diet:'vegetarian',maxTime:30,easy:true,exclusions:[],avoidIngredients:[],stores:['ica'],memberships:[],maxStores:1,pantry:{},cuisines:['texmex'],favoriteRecipes:['bean-wrap'],variety:'repeat'};
test('taste and favorites affect ranking while all hard food constraints still apply',()=>{
 const pool=candidates('dinner',settings);
 assert.equal(pool[0].id,'bean-wrap');
 assert.ok(!pool.some(r=>r.ingredients.some(i=>i.id==='chicken'||i.id==='salmon')));
 const excluded=candidates('dinner',{...settings,avoidIngredients:['beans']});
 assert.ok(!excluded.some(r=>r.id==='bean-wrap'));
 assert.ok(candidates('dinner',{...settings,favoriteRecipes:[]}).slice(0,2).every(r=>r.cuisine==='texmex'));
});
test('repeat mode uses at most two recipes per meal and varied mode uses more',()=>{
 const repeated=generate(settings),varied=generate({...settings,variety:'varied'});
 for(const meal of settings.meals){assert.ok(new Set(repeated.slots.filter(s=>s.meal===meal).map(s=>s.recipe)).size<=2);assert.ok(new Set(varied.slots.filter(s=>s.meal===meal).map(s=>s.recipe)).size>2);}
});
test('AI gets validated preference and favorite data rather than arbitrary recipe IDs',()=>{
 const clean=cleanSettings(settings);assert.deepEqual(clean.cuisines,['texmex']);assert.equal(clean.variety,'repeat');
 const prompt=JSON.parse(requestFor(clean).messages[0].content[0].text);
 assert.deepEqual(prompt.favoriteRecipes,['bean-wrap']);assert.deepEqual(prompt.cuisines,['texmex']);assert.equal(prompt.variety,'repeat');
 assert.ok(prompt.allowed.dinner.find(r=>r.id==='bean-wrap').favorite);
 assert.throws(()=>cleanSettings({...settings,cuisines:['invented']}));assert.throws(()=>validate({...settings,favoriteRecipes:['unknown']}));
 assert.ok(recipeMap['chicken-peanut-stew-new'].steps.some(s=>s.includes('72')));
});

test('AI repeat preference is enforced even when the model proposes seven different recipes',()=>{
 const s=cleanSettings(settings),days=Array.from({length:7},(_,i)=>Object.fromEntries(s.meals.map(meal=>[meal,candidates(meal,s)[i%candidates(meal,s).length].id])));
 const plan=parsePlan(JSON.stringify({days,explanation:'Råvaror återkommer i menyn.'}),s);
 for(const meal of s.meals)assert.ok(new Set(plan.slots.filter(slot=>slot.meal===meal).map(slot=>slot.recipe)).size<=2);
});
