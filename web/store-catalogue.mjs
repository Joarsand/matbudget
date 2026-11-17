import {stores} from './data.mjs';
import {maxPriceAge} from './price-book.mjs';
import {money} from './engine.mjs';
export function validCatalogueRecord(r,now=Date.now()){
 const host={willys:'www.willys.se',hemkop:'www.hemkop.se',mathem:'www.mathem.se'};
 try{return host[r.chain]===new URL(r.sourceUrl).hostname&&new URL(r.sourceUrl).protocol==='https:'&&typeof r.sku==='string'&&typeof r.name==='string'&&typeof r.storeName==='string'&&typeof r.storeId==='string'&&Number.isSafeInteger(r.priceOre)&&r.priceOre>0&&['kr/st','kr/kg','published-price'].includes(r.retailUnit)&&r.priceType==='regular'&&(r.chain==='mathem'||r.storeVerified===true)&&Number.isFinite(Date.parse(r.checkedAt))&&now-Date.parse(r.checkedAt)>=-60000&&now-Date.parse(r.checkedAt)<=maxPriceAge;}catch{return false;}
}
let root,rows=[],limit=20;
export function renderStoreCatalogue(book){
 if(!root){root=document.createElement('section');root.className='store-catalogue';root.innerHTML='<h3>Butiksvaror och priser</h3><p class="field-hint">Det här är varor som hämtats från butikernas sökresultat. Det är ännu inte hela sortimentet. Receptbudgeten använder bara separat granskade produktkopplingar. Medlemspriser, leverans och villkorade rabatter räknas inte av här. Mathems breda sökresultat visar publicerat onlinepris; kontrollera prisenheten på produktsidan.</p><div id="catalogue-coverage"></div><details id="catalogue-browse"><summary>Sök bland hämtade butiksvaror</summary><div class="library-tools"><label>Sök produkt<input id="catalogue-search" type="search" placeholder="Till exempel havregryn eller kaffe"></label><label>Butik<select id="catalogue-chain"><option value="all">Alla anslutna</option></select></label></div><p id="catalogue-count" role="status"></p><div id="catalogue-products"></div><button type="button" class="button outline" id="catalogue-more">Visa fler varor</button></details>';
 document.querySelector('.price-source-panel').after(root);
 for(const store of stores){const option=document.createElement('option');option.value=store.id;option.textContent=store.name;root.querySelector('#catalogue-chain').append(option);}
 for(const id of ['catalogue-search','catalogue-chain'])root.querySelector('#'+id).addEventListener('input',()=>{limit=20;draw();});
 root.querySelector('#catalogue-more').onclick=()=>{limit+=20;draw();};
 }
 rows=[...new Map((book.catalogue||[]).filter(r=>validCatalogueRecord(r)).map(r=>[r.chain+':'+r.storeId+':'+r.sku,r])).values()];
 const coverage=root.querySelector('#catalogue-coverage');coverage.replaceChildren();
 for(const store of stores){const count=rows.filter(r=>r.chain===store.id).length,p=document.createElement('p');p.className='field-hint';p.textContent=store.name+': '+(count?count+' aktuella produktobservationer · delvis hämtat sortiment':'komplett produktflöde inte anslutet');coverage.append(p);}
 draw();
}
function draw(){
 const query=root.querySelector('#catalogue-search').value.trim().toLocaleLowerCase('sv-SE'),chain=root.querySelector('#catalogue-chain').value;
 const found=rows.filter(r=>(chain==='all'||r.chain===chain)&&(r.name+' '+r.brand+' '+r.package).toLocaleLowerCase('sv-SE').includes(query)).sort((a,b)=>a.name.localeCompare(b.name,'sv'));
 root.querySelector('#catalogue-count').textContent=found.length+' varor matchar · visar '+Math.min(limit,found.length);const list=root.querySelector('#catalogue-products');list.replaceChildren();
 for(const r of found.slice(0,limit)){const row=document.createElement('article');row.className='verified-price-row';const title=document.createElement('strong');title.textContent=r.name+' · '+money(r.priceOre)+(r.chain==='mathem'?' · visat onlinepris':r.retailUnit==='kr/kg'?'/kg':'/förpackning');const detail=document.createElement('p');detail.textContent=[r.brand,r.package,r.storeName].filter(Boolean).join(' · ');const time=document.createElement('small');time.textContent='Kontrollerat '+new Date(r.checkedAt).toLocaleString('sv-SE',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})+' · ';const source=document.createElement('a');source.href=r.sourceUrl;source.target='_blank';source.rel='noopener';source.textContent='Butikens priskälla';row.append(title,detail,time,source);list.append(row);}
 root.querySelector('#catalogue-more').hidden=found.length<=limit;
}
