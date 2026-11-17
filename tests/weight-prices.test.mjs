import test from 'node:test';
import assert from 'node:assert/strict';
import {validObservation,applyPriceBook} from '../web/price-book.mjs';
import {priceFor,compare} from '../web/engine.mjs';
import {productMap} from '../web/data.mjs';
const banana={ingredient:'banana',chain:'willys',storeId:'2295',storeName:'Willys Stockholm Sköndal',sku:'100254920_KG',name:'Banan Klass 1',brand:'',quantity:1,unit:'st',priceOre:2190,retailPriceBasis:'kg',averageWeightKg:.18,estimatedWeight:true,package:'1 kg · lösvikt',checkedAt:new Date().toISOString(),channel:'online',priceType:'regular',sourceUrl:'https://www.willys.se/search?q=banan&storeId=2295'};
test('real kilogram prices are preserved; piece cost uses only the retailer average weight',()=>{
 assert.ok(validObservation(banana));applyPriceBook({records:[banana]});
 const quote=priceFor(productMap.banana,'willys');assert.equal(quote.price,394);assert.equal(quote.observation.priceOre,2190);
 assert.equal(quote.observation.averageWeightKg,.18);
 for(const change of [{averageWeightKg:0},{averageWeightKg:undefined},{estimatedWeight:false},{retailPriceBasis:'invented'}])assert.ok(!validObservation({...banana,...change}));
 applyPriceBook({records:[]});
});
