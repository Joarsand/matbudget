import test from 'node:test';
import assert from 'node:assert/strict';
import {products,stores,recipes} from '../web/data.mjs';
import {generate,compare,recipeConsumptionCost} from '../web/engine.mjs';
const settings={period:'week',startDate:'2026-11-09',month:'2026-11',people:2,budget:120000,meals:['breakfast','lunch','dinner'],diet:'vegetarian',maxTime:30,easy:true,exclusions:[],avoidIngredients:[],stores:stores.map(s=>s.id),memberships:['willys','coop','ica'],maxStores:2,pantry:{}};
test('production catalogue contains no invented regular or member prices',()=>{
 for(const product of products){assert.deepEqual(product.prices,{});assert.equal(product.memberPrices,undefined);}
});
test('missing prices yield no basket total, savings or cheapest-store claim',()=>{
 const plan=generate(settings),result=compare(plan.slots,settings);
 assert.equal(plan.slots.length,21);assert.equal(plan.adjusted,false);
 assert.equal(result.total,null);assert.equal(result.best,null);assert.equal(result.split,null);assert.equal(result.chosen,null);
 assert.ok(result.carts.every(c=>!c.complete&&c.total===null&&c.lines.every(l=>l.cost===null)));
 for(const recipe of recipes)assert.equal(recipeConsumptionCost(recipe,2,'willys',['willys']),null);
});
test('fully stocked ingredients cost zero without inventing retail prices',()=>{
 const plan=generate(settings),pantry=Object.fromEntries(products.map(p=>[p.id,100000]));
 const result=compare(plan.slots,{...settings,pantry});
 assert.equal(result.total,0);assert.ok(result.chosen.lines.every(l=>l.needed===0&&l.cost===0));
});
