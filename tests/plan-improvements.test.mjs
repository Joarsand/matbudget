import {createApp} from '../server.mjs';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {generate,requirements,validatePlan,replaceRecipe,candidates,slotPortions,compare,cheaperProductSwaps,priceFor} from '../web/engine.mjs';
import {products,recipeMap,productMap} from '../web/data.mjs';
import {applyPriceBook} from '../web/price-book.mjs';
import {cleanEdit,parseEdit} from '../server/edit-plan.mjs';
const settings={period:'week',startDate:'2026-11-09',month:'2026-11',people:2,budget:120000,meals:['lunch','dinner'],diet:'vegetarian',maxTime:30,easy:true,exclusions:[],avoidIngredients:[],stores:['willys'],memberships:[],maxStores:1,pantry:{},lunchboxes:true,lunchboxCount:3};
const action=(plan,data)=>parseEdit(JSON.stringify({explanation:'FÃ¶rslag',...data}),plan);
test('leftovers charge a double dinner once, keep first lunch separate and final dinner single',()=>{
 const plan=generate(settings);validatePlan(plan);
 assert.equal(plan.slots.filter(s=>s.leftoverFrom!==undefined).length,3);
 assert.equal(plan.slots[0].leftoverFrom,undefined);
 assert.equal(slotPortions(plan.slots.at(-1),plan.slots,settings),2);
 const expected={};for(const slot of plan.slots){if(slot.leftoverFrom!==undefined)continue;const r=recipeMap[slot.recipe];for(const i of r.ingredients)expected[i.id]=(expected[i.id]||0)+i.amount*slotPortions(slot,plan.slots,settings)/r.servings;}
 for(const row of requirements(plan.slots,settings))assert.equal(row.amount,expected[row.product.id]);
 const next=replaceRecipe(plan,2,candidates('dinner',settings).find(r=>r.id!==plan.slots[1].recipe).id);
 assert.equal(next.slots[1].recipe,next.slots[2].recipe);
 const broken=structuredClone(plan);broken.slots[2].leftoverFrom=5;assert.throws(()=>validatePlan(broken));
});
test('AI lunchbox edits reduce, disable and extend a monthly plan without illegal lunch recipes',()=>{
 const original=generate({...settings,period:'month',lunchboxCount:7});
 const reduced=action(original,{kind:'lunchboxes',enabled:true,count:2});validatePlan(reduced);
 assert.equal(reduced.slots.filter(s=>s.leftoverFrom!==undefined).length,9);
 const off=action(reduced,{kind:'lunchboxes',enabled:false,count:2});validatePlan(off);
 assert.ok(off.slots.every(s=>s.leftoverFrom===undefined));
 assert.equal(original.settings.lunchboxCount,7);
});
test('AI rejects bad days, unknown recipes, excluded food and malformed links without mutating original',()=>{
 const plan=generate({...settings,avoidIngredients:['beans']});const before=JSON.stringify(plan);
 for(const change of [{day:99,meal:'dinner',recipe:'bean-wrap'},{day:0,meal:'dinner',recipe:'unknown'},{day:0,meal:'dinner',recipe:'bean-wrap'}])assert.throws(()=>action(plan,{kind:'replace',changes:[change]}));
 assert.throws(()=>cleanEdit({message:'Ã¤ndra',plan:{...plan,slots:plan.slots.slice(1)}}));
 assert.throws(()=>action(plan,{kind:'lunchboxes',enabled:true,count:8}));assert.equal(JSON.stringify(plan),before);
});
function quote(p,changes={}){return {ingredient:p.id,chain:'willys',storeId:'2295',storeName:'Willys Stockholm SkÃ¶ndal',sku:'base-'+p.id,name:p.name,brand:'Fixture',quantity:p.quantity,unit:p.unit,priceOre:2000,package:'test package',checkedAt:new Date().toISOString(),channel:'online',priceType:'regular',sourceUrl:'https://www.willys.se/search?q=test',...changes};}
test('product swaps require fresh same-store prices and lower rounded whole-basket cost',()=>{
 const records=products.map(p=>quote(p));const plan=generate({...settings,lunchboxes:false,budget:10000000});const before=compare(plan.slots,plan.settings);
 const ingredient=before.required.find(r=>r.needed>0).product;
 const cheap=quote(ingredient,{sku:'cheap',priceOre:100,reviewedAlternative:true,allergens:[]});
 const wrongStore=quote(ingredient,{sku:'wrong',storeId:'other',priceOre:1,reviewedAlternative:true,allergens:[]});
 const falseSaving=quote(ingredient,{sku:'huge',priceOre:999999,quantity:99999,reviewedAlternative:true,allergens:[]});
 applyPriceBook({records,alternatives:[cheap,wrongStore,falseSaving]});
 const result=cheaperProductSwaps(plan);assert.ok(result.some(p=>p.offer.sku==='cheap'));assert.ok(!result.some(p=>['wrong','huge'].includes(p.offer.sku)));
 const proposal=result.find(p=>p.offer.sku==='cheap');assert.equal(compare(plan.slots,plan.settings).total-compare(plan.slots,proposal.settings).total,proposal.saving);
 const selected={willys:0};assert.ok(!productMap[ingredient.id].offers.willys.some(p=>p.sku==='wrong'));
 assert.equal(priceFor(ingredient,'willys',[],{['willys:'+ingredient.id]:'expired'}).price,null);
 applyPriceBook({records:records.filter(r=>r.ingredient!==ingredient.id),alternatives:[cheap]});assert.equal(cheaperProductSwaps(plan).length,0);
 applyPriceBook({records:[]});
});

test('edit endpoint checks access and input before one quota-counted invocation',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'matbudget-edit-')),stateFile=path.join(dir,'usage.json'),code='test-token-sixteen-characters';let calls=0;
 const server=createApp({enabled:true,accessCode:code,stateFile,invoke:async()=>{calls++;return JSON.stringify({kind:'lunchboxes',enabled:true,count:2,explanation:'Två matlådeluncher.'});}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/api/edit-plan';
 const post=(body,token=code)=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json','X-AI-Access-Code':token},body:JSON.stringify(body)});
 try{const plan=generate(settings);assert.equal((await post({plan,message:'två matlådor'},'bad')).status,401);assert.equal((await post({plan,message:'x'})).status,400);assert.equal(calls,0);
 const result=await post({plan,message:'två matlådor'});assert.equal(result.status,200);const body=await result.json();assert.equal(body.plan.settings.lunchboxCount,2);assert.equal(body.plan.slots.filter(s=>s.leftoverFrom!==undefined).length,2);assert.equal(JSON.parse(readFileSync(stateFile)).calls,1);assert.equal((await post({plan,message:'två matlådor'})).status,429);assert.equal(calls,1);
 }finally{await new Promise(r=>server.close(r));rmSync(dir,{recursive:true,force:true});}
});
