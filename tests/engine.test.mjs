import test,{beforeEach} from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {generate,compare,datesFor,candidates,replaceRecipe,requirements,priceFor} from '../web/engine.mjs';
import {recipeMap,productMap,stores,recipes,products} from '../web/data.mjs';
// Synthetic prices belong only to arithmetic tests; never shipped in web/.
const fixture=JSON.parse(readFileSync(new URL('./fixtures/synthetic-prices.json',import.meta.url),'utf8'));
beforeEach(()=>{for(const f of fixture){const p=productMap[f.id];p.prices={...f.prices};p.memberPrices=f.memberPrices?{...f.memberPrices}:undefined;}});
const base=()=>({period:'week',startDate:'2026-11-09',month:'2026-11',people:2,budget:120000,meals:['breakfast','lunch','dinner'],diet:'vegetarian',maxTime:30,easy:true,exclusions:[],stores:['willys','coop','ica'],memberships:[],maxStores:1,pantry:{}});
test('selected meals and household are respected for every day',()=>{
 const s={...base(),people:3,meals:['dinner']},p=generate(s);
 assert.equal(p.slots.length,7);assert.ok(p.slots.every(slot=>slot.meal==='dinner'));
 assert.equal(new Set(p.slots.map(x=>x.day)).size,7);
 assert.equal(generate(base()).slots.length*2,42);
});
test('calendar months cover exact date counts including leap years',()=>{
 assert.equal(datesFor({...base(),period:'month',month:'2027-01'}).length,31);
 assert.equal(datesFor({...base(),period:'month',month:'2027-02'}).length,28);
 assert.equal(datesFor({...base(),period:'month',month:'2028-02'}).length,29);
 assert.equal(datesFor({...base(),period:'month',month:'2026-11'})[0].getDate(),1);
});
test('diet, easy setting, time and exclusions are hard constraints',()=>{
 const s={...base(),diet:'vegan',maxTime:20,exclusions:['nuts','soy']},p=generate(s);
 for(const slot of p.slots){const r=recipeMap[slot.recipe];assert.equal(r.diet,'vegan');assert.ok(r.easy&&r.minutes<=20);for(const i of r.ingredients)assert.ok(productMap[i.id].allergens.every(a=>!s.exclusions.includes(a)));}
 assert.throws(()=>generate({...s,maxTime:15,exclusions:['gluten','nuts']}),/matchar alla val/);
});
test('aggregate ingredients before pack rounding; subtract pantry only once',()=>{
 const slots=[{recipe:'banana-oats'},{recipe:'banana-oats'}],s={...base(),people:2,stores:['willys'],pantry:{oats:100}};
 const oat=requirements(slots,s).find(l=>l.product.id==='oats');
 assert.equal(oat.amount,240);assert.equal(oat.needed,140);assert.equal(oat.pantry,100);
 const cart=compare(slots,s).best;
 assert.equal(cart.lines.find(l=>l.product.id==='oats').packs,1);
 const threePortion=compare([{recipe:'banana-oats'}],{...s,people:13,pantry:{}}).best.lines.find(l=>l.product.id==='oats');
 assert.equal(threePortion.needed,780);assert.equal(threePortion.packs,1);
 const big=compare(slots,{...s,people:13,pantry:{}}).best.lines.find(l=>l.product.id==='oats');
 assert.equal(big.needed,1560);assert.equal(big.packs,2);
});
test('a fully stocked ingredient is not charged',()=>{
 const s={...base(),stores:['willys'],pantry:{oats:10000}};
 const line=compare([{recipe:'banana-oats'}],s).best.lines.find(l=>l.product.id==='oats');
 assert.equal(line.packs,0);assert.equal(line.cost,0);
});
test('membership pricing is opt-in',()=>{
 const p=productMap.oats;
 assert.equal(priceFor(p,'coop',[]).price,p.prices.coop);
 assert.equal(priceFor(p,'coop',['coop']).price,1500);
});
test('unknown prices cannot make an incomplete basket win',()=>{
 const original=productMap.oats.prices.willys;delete productMap.oats.prices.willys;
 try{const result=compare([{recipe:'banana-oats'}],base());assert.equal(result.carts.find(c=>c.store==='willys').total,null);assert.notEqual(result.best.store,'willys');}
 finally{productMap.oats.prices.willys=original;}
});
test('recipe replacement enforces preferences and reprices shared shopping requirements',()=>{
 const s=base(),p=generate(s),index=p.slots.findIndex(x=>x.meal==='dinner');
 const alternative=candidates('dinner',s).find(r=>r.id!==p.slots[index].recipe);
 const next=replaceRecipe(p,index,alternative.id);
 assert.notEqual(next.slots[index].recipe,p.slots[index].recipe);assert.equal(p.slots.length,next.slots.length);
 assert.equal(compare(next.slots,s).best.total,compare([...next.slots],s).best.total);
 assert.throws(()=>replaceRecipe(p,index,'mince-pasta'),/matchar inte/);
});
test('split shopping respects the store limit and cannot cost more than the best whole basket',()=>{
 const s={...base(),maxStores:2},p=generate(s),result=compare(p.slots,s);
 assert.ok(result.split.stores.length<=2);assert.ok(result.total<=result.best.total);
 assert.equal(result.chosen.lines.reduce((n,l)=>n+l.cost,0),result.total);
 assert.equal(compare(p.slots,{...s,maxStores:1}).split,null);
});
test('an infeasible low budget stays visible without dropping meals',()=>{
 const s={...base(),budget:100},p=generate(s),result=compare(p.slots,s);
 assert.equal(p.slots.length,21);assert.ok(result.total>s.budget);
 assert.ok(p.slots.every(slot=>candidates(slot.meal,s).some(r=>r.id===slot.recipe)));
});
test('invalid settings do not create a plan',()=>{
 for(const edit of [{meals:[]},{stores:[]},{people:0},{budget:-1},{startDate:'2026-02-31'},{pantry:{oil:-1}}])assert.throws(()=>generate({...base(),...edit}));
});
test('expanded chain catalogue supports every selected chain and honest partial coverage',()=>{
 assert.equal(stores.length,6);assert.equal(new Set(stores.map(s=>s.id)).size,stores.length);
 delete productMap.salt.prices.lidl;
 const s={...base(),stores:stores.map(s=>s.id),maxStores:2},p=generate(s),result=compare(p.slots,s);
 assert.equal(result.carts.length,6);assert.ok(result.best.complete);
 const partial=result.carts.find(c=>c.store==='lidl');
 assert.equal(partial.complete,false);assert.equal(partial.total,null);
 assert.ok(result.chosen.lines.every(l=>l.cost!==null));assert.ok(result.chosen.stores?.length<=2||result.chosen.store);
 assert.equal(stores.find(s=>s.id==='mathem').kind,'online');
});
test('selecting only a partial catalogue does not fabricate a full basket price',()=>{
 delete productMap.salt.prices.lidl;
 const s={...base(),stores:['lidl']},p=generate(s),result=compare(p.slots,s);
 assert.equal(result.total,null);assert.equal(result.best,null);
});
test('disliked ingredients are excluded from generation and replacements',()=>{
 const s={...base(),diet:'vegan',maxTime:20,avoidIngredients:['onion']},p=generate(s);
 assert.ok(p.slots.every(slot=>recipeMap[slot.recipe].ingredients.every(i=>i.id!=='onion')));
 const dinner=p.slots.findIndex(slot=>slot.meal==='dinner');
 assert.throws(()=>replaceRecipe(p,dinner,'bean-wrap'),/matchar inte/);
 assert.throws(()=>generate({...s,avoidIngredients:['unknown-product']}),/känns inte igen/);
});
test('expanded recipe catalogue has 100 unique, priced recipes with complete instructions',()=>{
 assert.equal(recipes.length,100);assert.equal(new Set(recipes.map(r=>r.id)).size,100);
 assert.equal(new Set(products.map(p=>p.id)).size,products.length);
 for(const recipe of recipes){
  assert.ok(recipe.steps.length>=2,recipe.id);assert.ok(recipe.ingredients.length>=3,recipe.id);
  assert.ok(['breakfast','lunch','dinner'].includes(recipe.meal));
  for(const ingredient of recipe.ingredients){assert.ok(productMap[ingredient.id],recipe.id);assert.ok(ingredient.amount>0);assert.ok(Number.isInteger(productMap[ingredient.id].prices.willys));}
 }
 for(const meal of ['breakfast','lunch','dinner'])assert.ok(recipes.filter(r=>r.meal===meal).length>=15);
});
test('fish recipes are excluded by vegetarian diets and by the explicit fish exclusion',()=>{
 const containsFish=r=>r.ingredients.some(i=>productMap[i.id].allergens.includes('fish'));
 const allowed=candidates('dinner',{...base(),diet:'all',maxTime:60});
 assert.ok(allowed.some(containsFish));
 assert.ok(!candidates('dinner',{...base(),maxTime:60}).some(containsFish));
 assert.ok(!candidates('dinner',{...base(),diet:'all',maxTime:60,exclusions:['fish']}).some(containsFish));
});
