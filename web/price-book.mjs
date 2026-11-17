import {products,productMap,stores} from './data.mjs';
export const maxPriceAge=36*60*60*1000;
let savedBook={records:[],references:[]};
export function getPriceBook(){return savedBook;}
export function validReference(r,now=Date.now()){
 try{const url=new URL(r.sourceUrl),date=new Date(r.observedOn+'T00:00:00Z');
 return r.provider==='Matmoms'&&r.priceBasis==='matmoms'&&['ica','coop','willys'].includes(r.chain)&&
 url.protocol==='https:'&&url.hostname==='github.com'&&url.pathname.startsWith('/Lingabton/matmoms-tracker/releases/download/')&&
 !!productMap[r.ingredient]&&r.unit===productMap[r.ingredient].unit&&
 typeof r.storeId==='string'&&typeof r.storeName==='string'&&typeof r.sku==='string'&&typeof r.name==='string'&&
 r.priceType==='regular'&&r.channel==='online'&&Number.isSafeInteger(r.priceOre)&&r.priceOre>0&&
 Number.isFinite(r.quantity)&&r.quantity>0&&r.quantity<100000&&/^\d{4}-\d{2}-\d{2}$/.test(r.observedOn)&&
 date.toISOString().slice(0,10)===r.observedOn&&date.getTime()<=now;
 }catch{return false;}
}
export function availablePriceStores(basis='current'){
 const rows=basis==='matmoms'?savedBook.references:savedBook.records;
 return [...new Set((Array.isArray(rows)?rows:[]).filter(r=>basis==='matmoms'?validReference(r):validObservation(r)).map(r=>r.chain))];
}
export function usePriceBasis(basis='current'){return applyPriceBook(savedBook,Date.now(),basis);}
export function validObservation(r,now=Date.now()){
 const hosts={willys:['www.willys.se'],hemkop:['www.hemkop.se'],mathem:['www.mathem.se'],ica:['www.ica.se','handlaprivatkund.ica.se'],coop:['www.coop.se'],lidl:['www.lidl.se']};
 try{return !!productMap[r.ingredient]&&hosts[r.chain]?.includes(new URL(r.sourceUrl).hostname)&&new URL(r.sourceUrl).protocol==='https:'&&
  typeof r.storeId==='string'&&typeof r.storeName==='string'&&typeof r.sku==='string'&&typeof r.name==='string'&&
  (r.retailPriceBasis===undefined||r.retailPriceBasis==='kg'&&r.unit==='st'&&r.quantity===1&&Number.isFinite(r.averageWeightKg)&&r.averageWeightKg>0&&r.averageWeightKg<=2&&r.estimatedWeight===true)&&
  r.channel==='online'&&r.priceType==='regular'&&r.unit===productMap[r.ingredient].unit&&
  Number.isFinite(r.quantity)&&r.quantity>0&&r.quantity<100000&&Number.isSafeInteger(r.priceOre)&&r.priceOre>0&&
  Number.isFinite(Date.parse(r.checkedAt))&&now-Date.parse(r.checkedAt)>=-60000&&now-Date.parse(r.checkedAt)<=maxPriceAge;
 }catch{return false;}
}
export function applyPriceBook(snapshot,now=Date.now(),basis='current'){
 savedBook=snapshot||{records:[],references:[]};
 for(const p of products){p.observations={};p.offers={};}
 for(const s of stores)delete s.priceStore;
 let count=0;
 const rows=basis==='matmoms'?snapshot?.references:snapshot?.records;
 for(const r of Array.isArray(rows)?rows:[]){if(!(basis==='matmoms'?validReference(r,now):validObservation(r,now)))continue;productMap[r.ingredient].observations[r.chain]=r;
  stores.find(s=>s.id===r.chain).priceStore=r.storeName;count++;}
 if(basis!=='matmoms'){
  for(const p of products)for(const [chain,r] of Object.entries(p.observations))p.offers[chain]=[r];
  for(const r of snapshot?.alternatives||[]){const p=productMap[r.ingredient],primary=p?.observations[r.chain];if(primary&&r.reviewedAlternative===true&&Array.isArray(r.allergens)&&r.storeId===primary.storeId&&validObservation(r,now)&&!p.offers[r.chain].some(o=>o.sku===r.sku))p.offers[r.chain].push(r);}
 }
 return count;
}
