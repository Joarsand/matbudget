import test from 'node:test';
import assert from 'node:assert/strict';
import {applyPriceBook,validObservation,maxPriceAge} from '../web/price-book.mjs';
import {compare,priceFor,recipeConsumptionCost} from '../web/engine.mjs';
import {productMap,recipeMap} from '../web/data.mjs';
const observation=(ingredient,quantity,priceOre)=>({ingredient,quantity,priceOre,unit:productMap[ingredient].unit,chain:'willys',storeId:'2295',storeName:'Willys Stockholm Sköndal',sku:'reviewed-'+ingredient,name:ingredient,channel:'online',priceType:'regular',checkedAt:new Date().toISOString(),sourceUrl:'https://www.willys.se/search/campaigns?storeId=2295&size=500'});
test('only fresh positive prices with compatible quantities and retailer provenance are accepted',()=>{
 const r=observation('eggs',10,3790);assert.ok(validObservation(r));
 for(const edit of [{priceOre:0},{priceOre:12.5},{quantity:0},{unit:'g'},{sourceUrl:'https://evil.example/x'},{checkedAt:'not-a-date'},{checkedAt:new Date(Date.now()-maxPriceAge-1000).toISOString()}])assert.ok(!validObservation({...r,...edit}));
});
test('actual store pack sizes are used for rounding and per-portion cost',()=>{
 applyPriceBook({records:[observation('eggs',10,3790),observation('bread',450,2190),observation('salt',1000,1000)]});
 const settings={people:2,stores:['willys'],maxStores:1,memberships:[],pantry:{}};
 const slots=[{recipe:'egg-toast'},{recipe:'egg-toast'},{recipe:'egg-toast'}];
 const result=compare(slots,settings),eggs=result.chosen.lines.find(l=>l.product.id==='eggs');
 assert.equal(eggs.needed,12);assert.equal(eggs.packs,2);assert.equal(eggs.cost,7580);assert.equal(eggs.packQuantity,10);
 assert.equal(recipeConsumptionCost(recipeMap['egg-toast'],2,'willys'),Math.round(4/10*3790+160/450*2190+1/1000*1000));
});
test('unpriced ingredients keep the total unknown and another retailer never inherits a quote',()=>{
 applyPriceBook({records:[observation('eggs',10,3790)]});
 const s={people:2,stores:['willys','coop'],maxStores:2,memberships:[],pantry:{}};
 const result=compare([{recipe:'egg-toast'}],s);
 assert.equal(result.total,null);assert.equal(result.best,null);assert.equal(priceFor(productMap.eggs,'coop').price,undefined);
 assert.equal(result.displayCart.store,'willys');
 const quote=productMap.eggs.observations.willys;
 quote.checkedAt=new Date(Date.now()-maxPriceAge-1000).toISOString();assert.equal(priceFor(productMap.eggs,'willys').price,null);
 applyPriceBook({records:[]});
});
