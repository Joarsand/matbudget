import {cheaperProductSwaps,compare,money,validatePlan} from './engine.mjs';
import {recipeMap,mealNames} from './data.mjs';
export function initPlanTools({getPlan,accept}){
 const $=id=>document.getElementById(id),box=document.createElement('section');
 box.className='plan-tools';box.innerHTML='<h3>Ändra din plan med AI</h3><label class="field-label" for="edit-request">Vad vill du ändra?</label><textarea id="edit-request" rows="2" maxlength="600" placeholder="Till exempel: gör menyn billigare, eller planera tre matlådeluncher"></textarea><p class="field-hint">Samma åtkomstkod och gemensamma dagsgräns som AI-planeringen. Du får granska förslaget innan något ändras.</p><button type="button" class="button outline" id="edit-send">Visa ändringsförslag</button><p id="edit-status" role="status"></p><div id="edit-preview" hidden><p id="edit-explanation"></p><p id="edit-cost"></p><ul id="edit-changes"></ul><button type="button" class="button" id="edit-accept">Använd förslaget</button> <button type="button" class="button outline" id="edit-cancel">Behåll min plan</button></div>';
 document.querySelector('.ai-preview').after(box);
 const swaps=document.createElement('section');swaps.className='product-swaps';swaps.innerHTML='<h3>Billigare produktval</h3><p class="field-hint">Granskade alternativa produkter från samma prisbutik. Besparingen gäller hela inköpet med hela förpackningar. Kontrollera alltid den verkliga ingredienslistan.</p><p id="swap-status"></p><div id="swap-options"></div><button type="button" class="text-button" id="swap-reset">Återställ produktval</button>';
 $('shopping-panel').prepend(swaps);
 let pending=null,original='';
 const fingerprint=()=>JSON.stringify(getPlan());
 $('edit-send').onclick=async()=>{
  const message=$('edit-request').value.trim(),code=$('ai-code').value;
  if(message.length<3){$('edit-status').textContent='Beskriv ändringen med minst tre tecken.';return;}
  if(!code){$('edit-status').textContent='Ange åtkomstkoden i AI-rutan först.';return;}
  $('edit-send').disabled=true;$('edit-preview').hidden=true;pending=null;original=fingerprint();$('edit-status').textContent='Tar fram ett förslag…';
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),55000);
  try{
   const response=await fetch('/api/edit-plan',{method:'POST',headers:{'Content-Type':'application/json','X-AI-Access-Code':code},body:JSON.stringify({plan:getPlan(),message}),signal:controller.signal});
   const data=await response.json();if(!response.ok)throw Error(data.error||'Förslaget kunde inte skapas.');validatePlan(data.plan);
   if(original!==fingerprint())throw Error('Din plan ändrades under tiden. Begär ett nytt förslag.');
   pending=data.plan;const before=getPlan(),a=compare(before.slots,before.settings),b=compare(pending.slots,pending.settings);
   $('edit-explanation').textContent=pending.ai?.explanation||'Granska ändringarna nedan.';
   $('edit-cost').textContent='Hela inköpet: '+(a.total===null?'okänt':money(a.total))+' → '+(b.total===null?'okänt':money(b.total))+(b.total!==null&&b.total>pending.settings.budget?' · över budget':'');
   $('edit-changes').replaceChildren();
   for(const slot of pending.slots){const old=before.slots.find(s=>s.day===slot.day&&s.meal===slot.meal);if(old.recipe===slot.recipe&&old.leftoverFrom===slot.leftoverFrom)continue;const li=document.createElement('li');li.textContent='Dag '+(slot.day+1)+' · '+mealNames[slot.meal]+': '+recipeMap[old.recipe].name+' → '+recipeMap[slot.recipe].name+(slot.leftoverFrom!==undefined?' (matlåda)':'');$('edit-changes').append(li);}
   $('edit-status').textContent=$('edit-changes').children.length?'Din plan är kvar tills du godkänner.':'Inga måltider ändrades. Inställningar kan ha justerats.';
   $('edit-preview').hidden=false;
  }catch(error){$('edit-status').textContent=(error.name==='AbortError'?'AI:n svarade inte i tid.':error.message)+' Din plan är kvar.';}finally{clearTimeout(timer);$('edit-send').disabled=false;}
 };
 $('edit-accept').onclick=()=>{if(!pending)return;if(original!==fingerprint()){$('edit-status').textContent='Planen har ändrats. Begär ett nytt förslag.';pending=null;return;}const next=pending;pending=null;$('edit-preview').hidden=true;accept(next);$('edit-status').textContent='Förslaget används. Inköpslistan har räknats om.';};
 $('edit-cancel').onclick=()=>{pending=null;$('edit-preview').hidden=true;$('edit-status').textContent='Din tidigare plan är kvar.';};
 $('swap-reset').onclick=()=>accept({...getPlan(),settings:{...getPlan().settings,productChoices:{}}});
 return ()=>{
  const plan=getPlan();if(!plan)return;
  const proposals=cheaperProductSwaps(plan);$('swap-options').replaceChildren();$('swap-reset').hidden=!Object.keys(plan.settings.productChoices||{}).length;
  $('swap-status').textContent=proposals.length?proposals.length+' billigare val hittades. Välj ett i taget så räknas resten om.':'Inga verifierade billigare produktbyten hittades för hela inköpet. Pristäckning och tillgängliga alternativ kan vara begränsade.';
  for(const p of proposals){const row=document.createElement('article');row.className='replacement-option';const text=document.createElement('p');text.textContent=p.oldOffer.brand+' '+p.oldOffer.name+' ('+p.oldOffer.package+') → '+p.offer.brand+' '+p.offer.name+' ('+p.offer.package+') · '+p.offer.storeName+' · varuraden '+money(p.oldCost)+' → '+money(p.newCost)+' · spara '+money(p.saving)+' på hela inköpet. Kontrollerat '+new Date(p.offer.checkedAt).toLocaleString('sv-SE',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});const button=document.createElement('button');button.type='button';button.className='button outline';button.textContent='Välj produkt';button.onclick=()=>accept({...getPlan(),settings:p.settings});const source=document.createElement('a');source.href=p.offer.sourceUrl;source.target='_blank';source.rel='noopener';source.textContent='Priskälla';row.append(text,source,button);$('swap-options').append(row);}
 };
}
