// Offline postal lookup. Never send a postcode to AI or an external geocoder.
export function normalizePostalCode(value){
 const code=String(value??'').replace(/\s/g,'');
 if(code&&!/^[1-9]\d{4}$/.test(code))throw Error('Ange ett svenskt postnummer med fem siffror.');
 return code;
}
export function distanceKm(a,b){
 const rad=n=>n*Math.PI/180,dlat=rad(b.lat-a.lat),dlon=rad(b.lon-a.lon);
 const h=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlon/2)**2;
 return 6371*2*Math.asin(Math.sqrt(Math.min(1,h)));
}
export function localPriceBook(book,postalCode,postalData,directory){
 const code=normalizePostalCode(postalCode);if(!code)return book;
 const place=postalData.places?.[code];if(!place)throw Error('Postnumret finns inte i vår postnummerkälla. Kontrollera siffrorna.');
 const ranked=(directory.stores||[]).map(s=>({...s,distanceKm:Math.round(distanceKm(place,s)*10)/10})).sort((a,b)=>a.distanceKm-b.distanceKm||a.id.localeCompare(b.id));
 const nearby=ranked.filter(s=>s.precision==='store'&&s.distanceKm<=30).slice(0,24);
 const sources=[];
 const reference=book.matmoms||{},allRefs=reference.allReferences||reference.references||[],allCatalogue=reference.allCatalogue||reference.catalogue||[];
 const sourcePosition=r=>ranked.find(s=>s.chain===r.chain&&(s.id===r.storeId||s.name===r.storeName));
 const choose=(rows,historical)=>{
  const result=[];
  for(const chain of [...new Set(rows.map(r=>r.chain))]){
   const candidates=[...new Map(rows.filter(r=>r.chain===chain).map(r=>[r.storeId,r])).values()];
   candidates.sort((a,b)=>(sourcePosition(a)?.distanceKm??Infinity)-(sourcePosition(b)?.distanceKm??Infinity)||a.storeId.localeCompare(b.storeId));
   const selected=candidates[0],pos=sourcePosition(selected),nearest=nearby.find(s=>s.chain===chain);
   const exact=pos?.precision==='store'&&nearest?.precision==='store'&&pos.id===nearest.id;
   sources.push({chain,historical,storeId:selected.storeId,storeName:selected.storeName,distanceKm:pos?.distanceKm??null,match:exact?'exact-store':pos&&pos.distanceKm<=30?'nearby-reference':'other-online-reference',precision:pos?.precision||'unknown',nearestStoreId:nearest?.id||null});
   result.push(...rows.filter(r=>r.chain===chain&&r.storeId===selected.storeId));
  }
  return result;
 };
 const records=choose(book.records||[],false),references=choose(allRefs,true);
 const ids=new Set(references.map(r=>r.storeId));
 const catalogue=allCatalogue.filter(r=>ids.has(r.storeId));
 return {...book,records,alternatives:(book.alternatives||[]).filter(a=>records.some(r=>r.chain===a.chain&&r.storeId===a.storeId)),references,matmoms:{...reference,references,catalogue},location:{postalCode:code,city:place.city,nearby,priceSources:sources,
  notice:'Närmaste bland adressverifierade butiker i vår katalog, inom 30 km. Adresstäckning finns för Willys och Hemköp; andra kedjors butiker kan saknas. Ungefärlig fågelväg från postortens position, inte din adress. Matmoms butikslägen kan endast vara postområden. Pris från en annan butik är ett jämförelseunderlag, inte den närmaste butikens pris.'}};
}
