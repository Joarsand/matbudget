import test from 'node:test';
import assert from 'node:assert/strict';
import {products,avoidOptions} from '../web/data.mjs';
import {validCatalogueRecord} from '../web/store-catalogue.mjs';
import {icaSourceRecipes} from '../web/ica-source-recipes.mjs';
test('every current recipe ingredient can be excluded without duplicate options',()=>{assert.equal(avoidOptions.length,products.length);assert.equal(new Set(avoidOptions).size,products.length);assert.ok(products.every(p=>avoidOptions.includes(p.id)));});
test('ICA source preview contains only verified ICA links, no copied instructions or unlicensed images',()=>{
 assert.equal(icaSourceRecipes.length,6);
 for(const r of icaSourceRecipes){const url=new URL(r.sourceUrl);assert.equal(url.hostname,'www.ica.se');assert.equal(url.protocol,'https:');assert.ok(url.pathname.startsWith('/recept/'));assert.equal(r.source,'ICA');assert.ok(r.ingredients.length);assert.equal(r.image,undefined);assert.equal(r.recipeInstructions,undefined);assert.equal(r.imagePermission,'not-confirmed');}
});
test('broader product catalogue rejects stale prices, foreign sources and unconfirmed physical stores',()=>{
 const r={chain:'willys',sku:'123_ST',name:'Test product',storeId:'2295',storeName:'Willys Stockholm Sköndal',priceOre:1234,retailUnit:'kr/st',checkedAt:new Date().toISOString(),sourceUrl:'https://www.willys.se/search?q=test',priceType:'regular',storeVerified:true};assert.ok(validCatalogueRecord(r));
 for(const changes of [{storeVerified:false},{priceOre:0},{retailUnit:'unknown'},{checkedAt:'2001-01-01'},{sourceUrl:'https://example.com/'}])assert.equal(validCatalogueRecord({...r,...changes}),false);
});
