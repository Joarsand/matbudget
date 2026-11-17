import {productMap} from './data.mjs';
export function showMatmoms(data,onChoose){
 let panel=document.querySelector('.matmoms-source-panel');
 if(!panel){panel=document.createElement('section');panel.className='price-source-panel matmoms-source-panel';document.querySelector('.comparison-section').append(panel);}
 panel.replaceChildren();
 const title=document.createElement('h3');title.textContent='Matmoms Tracker';panel.append(title);
 if(!data?.catalogue?.length){const p=document.createElement('p');p.textContent='Matmoms prisobservationer är inte tillgängliga just nu.';panel.append(p);return;}
 const status=document.createElement('p');status.id='matmoms-status';status.textContent=data.catalogue.length+' butiksspecifika prisobservationer i valt prisunderlag · '+data.references.length+' kopplingar till receptens ingredienser · senast observerat '+data.observedThrough+'.';panel.append(status);
 const warning=document.createElement('p');warning.className='budget-message';warning.textContent='Historiska referenspriser från '+data.release.replace('data-','')+'. Detta är inte dagens butikspriser och de blandas inte med aktuella priser.';panel.append(warning);
 const attribution=document.createElement('p');attribution.className='field-hint';attribution.append(document.createTextNode(data.attribution+' · '));
 const provider=document.createElement('a');provider.href='https://matmoms.se/';provider.textContent='Matmoms';provider.target='_blank';provider.rel='noopener';attribution.append(provider,document.createTextNode(' · '));
 const license=document.createElement('a');license.href='https://creativecommons.org/licenses/by/4.0/';license.textContent='CC BY 4.0';license.target='_blank';license.rel='noopener';attribution.append(license,document.createTextNode(' · filtrerat och bearbetat för Matbudget.'));panel.append(attribution);
 const notice=document.createElement('p');notice.className='field-hint';notice.textContent=data.notice;panel.append(notice);
 if(data.importReport){
  const diagnostics=document.createElement('details'),heading=document.createElement('summary');heading.textContent='Importstatus och saknade produktkopplingar';diagnostics.append(heading);
  const info=document.createElement('p');info.textContent=data.importReport.mappedIngredients+' granskade ingredienskopplingar i hela exporten. Förpackningsfel, villkorade priser och otillgängliga varor tas inte med i ordinarie prisunderlag.';diagnostics.append(info);
  const selected=new Set(data.references.map(r=>r.storeId));
  for(const store of data.importReport.coverage.filter(s=>selected.has(s.storeId))){const row=document.createElement('p');row.textContent=store.storeName+': '+store.matched.length+' av '+(store.matched.length+store.missing.length)+' ingredienser kopplade. Saknar matchning: '+store.missing.map(m=>productMap[m.ingredient]?.name||m.ingredient).join(', ')+'.';diagnostics.append(row);}
  panel.append(diagnostics);
 }
 const button=document.createElement('button');button.type='button';button.id='use-matmoms';button.className='button outline';button.textContent='Skapa referensplan med Matmoms';button.onclick=onChoose;button.disabled=!onChoose;panel.append(button);
 const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Sök i Matmoms prisobservationer';details.append(summary);panel.append(details);
 const label=document.createElement('label');label.className='field-label';label.htmlFor='matmoms-search';label.textContent='Sök vara eller butik';
 const search=document.createElement('input');search.id='matmoms-search';search.type='search';search.placeholder='Till exempel mjölk eller ICA';
 const count=document.createElement('p');count.className='field-hint';count.id='matmoms-result-count';
 const rows=document.createElement('div');rows.id='matmoms-results';details.append(label,search,count,rows);
 const all=document.createElement('input');all.type='checkbox';all.id='matmoms-all-stores';const allLabel=document.createElement('label');allLabel.append(all,document.createTextNode(' Sök i hela exporten ('+(data.allCatalogue||data.catalogue).length+' prisobservationer)'));details.insertBefore(allLabel,rows);
 const render=()=>{const query=search.value.trim().toLocaleLowerCase('sv-SE');const found=(all.checked?(data.allCatalogue||data.catalogue):data.catalogue).filter(r=>(r.name+' '+r.storeName).toLocaleLowerCase('sv-SE').includes(query));rows.replaceChildren();count.textContent='Visar '+Math.min(40,found.length)+' av '+found.length+' träffar.';
  for(const r of found.slice(0,40)){const row=document.createElement('article');row.className='verified-price-row';const name=document.createElement('strong');name.textContent=r.name+' · '+(r.priceOre/100).toLocaleString('sv-SE',{minimumFractionDigits:2})+' kr';
   const info=document.createElement('p');info.textContent=r.package+' · '+r.storeName+' · observerat '+r.observedOn;
   const source=document.createElement('a');source.href=data.sourceUrl;source.textContent='Matmoms ursprungliga export';source.target='_blank';source.rel='noopener';row.append(name,info,source);rows.append(row);}
 };search.oninput=render;all.onchange=render;render();
}
