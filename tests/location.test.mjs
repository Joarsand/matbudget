import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePostalCode,distanceKm,localPriceBook} from '../server/location.mjs';
const postal={places:{'11247':{city:'Stockholm',lat:59.3,lon:18},'41102':{city:'Göteborg',lat:57.7,lon:12}}};
const directory={stores:[{id:'local',chain:'willys',name:'Local Willys',lat:59.3,lon:18,precision:'store'},{id:'source',chain:'willys',name:'Price Willys',lat:59.31,lon:18,precision:'store'},{id:'west',chain:'willys',name:'West Willys',lat:57.7,lon:12,precision:'store'}]};
const rows=[{chain:'willys',storeId:'source',storeName:'Price Willys',ingredient:'milk',priceOre:1000},{chain:'willys',storeId:'west',storeName:'West Willys',ingredient:'milk',priceOre:1200}];
const book={records:rows,matmoms:{allReferences:rows,allCatalogue:rows,references:[],catalogue:[]}};
test('postcode normalization and validation never guess an unknown postcode',()=>{
 assert.equal(normalizePostalCode('112 47'),'11247');assert.throws(()=>normalizePostalCode('../11247'));
 assert.throws(()=>localPriceBook(book,'99999',postal,directory));assert.equal(distanceKm(directory.stores[0],directory.stores[0]),0);
});
test('nearest physical store is distinct from the store supplying fallback prices',()=>{
 const result=localPriceBook(book,'11247',postal,directory);
 assert.equal(result.location.nearby[0].id,'local');assert.equal(result.records[0].storeId,'source');
 assert.equal(result.location.priceSources[0].match,'nearby-reference');assert.equal(result.references.length,1);
 assert.equal(result.references[0].priceOre,1000);assert.equal(book.matmoms.references.length,0);
});
test('postcode change binds each quote to its actual store and hides distant stores from nearby list',()=>{
 const result=localPriceBook(book,'41102',postal,directory);
 assert.equal(result.records[0].storeId,'west');assert.equal(result.references[0].priceOre,1200);
 assert.deepEqual(result.location.nearby.map(s=>s.id),['west']);assert.equal(result.location.priceSources[0].match,'exact-store');
});
