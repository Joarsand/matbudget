import test from 'node:test';
import assert from 'node:assert/strict';
import {applyPriceBook,usePriceBasis,availablePriceStores,validReference,validObservation} from '../web/price-book.mjs';
import {productMap,recipeMap} from '../web/data.mjs';
import {priceFor,compare,validate,recipeCostDetails,recipeConsumptionCost} from '../web/engine.mjs';
const ref={ingredient:'eggs',chain:'ica',storeId:'provider-store',storeName:'Matmoms test store',sku:'provider-eggs',name:'Eggs',quantity:12,unit:'st',priceOre:3600,provider:'Matmoms',priceBasis:'matmoms',priceType:'regular',channel:'online',observedOn:'2026-10-31',sourceUrl:'https://github.com/Lingabton/matmoms-tracker/releases/download/data-2026-10/snapshot.zip'};
test('historical observations never pass the current-price freshness validator',()=>{
 assert.ok(validReference(ref));assert.ok(!validObservation(ref));
 assert.ok(!validReference({...ref,observedOn:'2050-01-01'}));
 assert.ok(!validReference({...ref,observedOn:'2026-02-31'}));
 assert.ok(!validReference({...ref,sourceUrl:'https://untrusted.example/prices'}));
});
test('Matmoms prices are isolated until the reference source is explicitly selected',()=>{
 const book={records:[],references:[ref]};
 applyPriceBook(book);assert.equal(priceFor(productMap.eggs,'ica').price,undefined);
 assert.deepEqual(availablePriceStores('current'),[]);assert.deepEqual(availablePriceStores('matmoms'),['ica']);
 usePriceBasis('matmoms');assert.equal(priceFor(productMap.eggs,'ica').price,3600);
 assert.equal(priceFor(productMap.eggs,'coop').price,undefined);
 usePriceBasis('current');assert.equal(priceFor(productMap.eggs,'ica').price,undefined);
});
test('reference baskets use observed pack counts but remain incomplete for missing products',()=>{
 applyPriceBook({records:[],references:[ref]},Date.now(),'matmoms');
 const settings={people:2,stores:['ica'],memberships:[],maxStores:1,pantry:{}};
 const result=compare([{recipe:'egg-toast'}],settings);assert.equal(result.total,null);
 const line=result.displayCart.lines.find(l=>l.product.id==='eggs');assert.equal(line.cost,3600);assert.equal(line.packQuantity,12);
 applyPriceBook({records:[],references:[]});
});

test('partial recipe costs show only priced ingredients and enumerate missing ones',()=>{
 applyPriceBook({records:[],references:[ref]},Date.now(),'matmoms');
 const detail=recipeCostDetails(recipeMap['egg-toast'],2,'ica');
 assert.equal(detail.total,null);assert.equal(detail.subtotal,1200);assert.equal(detail.knownCount,1);
 assert.deepEqual(detail.missing.map(p=>p.id),['bread','salt']);
 assert.equal(recipeConsumptionCost(recipeMap['egg-toast'],2,'ica'),null);
 assert.equal(recipeCostDetails(recipeMap['egg-toast'],1,'ica').subtotal,600);
 applyPriceBook({records:[],references:[]});
});
