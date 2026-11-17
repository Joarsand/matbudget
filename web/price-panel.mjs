import {renderStoreCatalogue} from './store-catalogue.mjs';
import {stores,productMap} from './data.mjs';
import {applyPriceBook,validObservation} from './price-book.mjs';
import {showMatmoms} from './matmoms-panel.mjs';
const links={willys:'https://www.willys.se/',hemkop:'https://www.hemkop.se/',ica:'https://www.ica.se/',coop:'https://www.coop.se/',lidl:'https://www.lidl.se/',mathem:'https://www.mathem.se/'};
let activePostalCode='',lastUpdate,lastChoose;
export async function changePostalCode(code){await loadPrices(lastUpdate,lastChoose,code,true);}
let previous={version:1,records:[],sources:{}};
export async function loadPrices(onUpdate,onChooseReference,postalCode=activePostalCode,strict=false){
 lastUpdate=onUpdate||lastUpdate;lastChoose=onChooseReference||lastChoose;onUpdate=lastUpdate||(()=>{});onChooseReference=lastChoose;
 const section=document.querySelector('.comparison-section');
 let box=section.querySelector('.price-source-panel');
 if(!box){box=document.createElement('div');box.className='price-source-panel';
 box.innerHTML='<p id="price-loading" role="status">Hämtar verifierade butikspriser…</p><details><summary>Priskällor för alla '+stores.length+' kedjor</summary><ul id="price-source-list"></ul></details><details><summary id="price-record-count">Kontrollerade varupriser</summary><p>Publicerade ordinarie onlinepriser för namngivna butiker. Erbjudanden, medlems- och flerköpspriser räknas inte av. Dessa villkor kan ge ett annat pris i kassan. Kontrollera alltid varans innehåll. Priser gäller vid senaste kontrollen och döljs efter 36 timmar utan ny kontroll.</p><div id="verified-price-list"></div></details>';
 section.append(box);
 const show=document.getElementById('show-verified-prices');if(show)show.onclick=()=>{const target=document.getElementById('price-record-count');target.parentElement.open=true;target.scrollIntoView({behavior:'smooth',block:'start'});};
 setInterval(()=>loadPrices(onUpdate,onChooseReference),10*60*1000);
 }
 let failed=false;
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetch('/api/prices'+(postalCode?'/'+encodeURIComponent(postalCode):''),{signal:controller.signal});if(!response.ok){const error=await response.json();throw Error(error.error||'Prisuppgifterna kunde inte hämtas.');}
  const snapshot=await response.json();if(snapshot.version!==1||!Array.isArray(snapshot.records))throw Error();previous=snapshot;activePostalCode=postalCode;
 }catch(error){if(strict)throw error;failed=true;}finally{clearTimeout(timeout);}
  const snapshot=previous,count=applyPriceBook(snapshot);
  const records=(snapshot.records||[]).filter(r=>validObservation(r));
  document.getElementById('price-loading').textContent=(failed?'Uppdateringen misslyckades. Visar endast tidigare kontrollerade priser som fortfarande är giltiga. ':'')+(count?count+' kontrollerade varupriser från '+new Set(records.map(r=>r.chain)).size+' priskällor. Övriga kedjor saknar ansluten prisdata.':'Inga aktuella verifierade butikspriser kunde hämtas.');
  document.getElementById('price-source-list').replaceChildren();document.getElementById('verified-price-list').replaceChildren();
  document.getElementById('price-record-count').textContent='Se '+count+' kontrollerade varupriser';
  const overview=document.getElementById('price-overview');if(overview)overview.textContent=count+' kontrollerade varupriser · '+new Set(records.map(r=>r.chain)).size+' av '+stores.length+' kedjor anslutna · ordinarie onlinepriser';
  const show=document.getElementById('show-verified-prices');if(show)show.disabled=count===0;
  for(const store of stores){
   const li=document.createElement('li'),a=document.createElement('a');a.href=links[store.id];a.target='_blank';a.rel='noopener';a.textContent=store.name;li.append(a);
   const available=records.filter(r=>r.chain===store.id);
   li.append(document.createTextNode(available.length?' · '+available[0].storeName+' · '+available.length+' varor':' · prisdata är inte ansluten'));
   const state=snapshot.sources?.[store.id];
   if(state?.expectedIngredients)li.append(document.createTextNode(' · '+available.length+' av '+state.expectedIngredients+' receptingredienser'));
   const oldest=available.map(r=>Date.parse(r.checkedAt)).filter(Number.isFinite).sort((a,b)=>a-b)[0];
   if(oldest)li.append(document.createTextNode(' · äldsta priset kontrollerat '+new Intl.DateTimeFormat('sv-SE',{dateStyle:'short',timeStyle:'short'}).format(oldest)));
   if(state?.missingIngredients?.length)li.append(document.createTextNode(' · saknar: '+state.missingIngredients.map(id=>productMap[id]?.name||id).join(', ')));
   document.getElementById('price-source-list').append(li);
  }
  for(const r of records){
   const row=document.createElement('article');row.className='verified-price-row';
   const heading=document.createElement('strong');heading.textContent=productMap[r.ingredient].name+' · '+(r.priceOre/100).toLocaleString('sv-SE')+' kr / '+r.package;
   const detail=document.createElement('p');detail.textContent=r.brand+' '+r.name+' · '+r.storeName+(r.ingredient==='chickpeas'||r.ingredient==='corn'||r.ingredient==='beans'?' · avrunnen mängd '+r.quantity+' g':'');
   const source=document.createElement('a');source.href=r.sourceUrl;source.target='_blank';source.rel='noopener';source.textContent='Butikens priskälla';
   const time=document.createElement('small');time.textContent=' · kontrollerat '+new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(r.checkedAt));
   row.append(heading,detail,source,time);document.getElementById('verified-price-list').append(row);
  }
  renderStoreCatalogue(snapshot);showMatmoms(snapshot.matmoms,onChooseReference);onUpdate();
}
