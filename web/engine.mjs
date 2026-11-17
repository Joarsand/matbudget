import {withLunchboxes,slotPortions} from './lunchboxes.mjs';
export {withLunchboxes,slotPortions};
import {products,productMap,recipes,recipeMap,stores} from './data.mjs';
import {validObservation,validReference} from './price-book.mjs';
export const money=ore=>new Intl.NumberFormat('sv-SE',{style:'currency',currency:'SEK',minimumFractionDigits:0,maximumFractionDigits:2}).format(ore/100);
export function datesFor(settings){
 const text=settings.period==='month'?settings.month+'-01':settings.startDate;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(text||''))throw Error('Välj ett datum.');
 const [y,m,d]=text.split('-').map(Number),start=new Date(y,m-1,d,12);
 if(start.getFullYear()!==y||start.getMonth()!==m-1||start.getDate()!==d)throw Error('Välj ett giltigt datum.');
 const n=settings.period==='month'?new Date(y,m,0).getDate():7;
 return Array.from({length:n},(_,i)=>new Date(y,m-1,d+i,12));
}
export function validate(settings){
 if(settings.lunchboxes!==undefined&&typeof settings.lunchboxes!=='boolean')throw Error('Välj ett giltigt matlådealternativ.');
 if(settings.lunchboxCount!==undefined&&(!Number.isInteger(settings.lunchboxCount)||settings.lunchboxCount<1||settings.lunchboxCount>7))throw Error('Välj mellan en och sju matlådeluncher.');
 if(settings.lunchboxes&&(!settings.meals?.includes('lunch')||!settings.meals?.includes('dinner')))throw Error('Välj både lunch och middag för att planera matlådor.');
 if(settings.productChoices!==undefined){if(!settings.productChoices||typeof settings.productChoices!=='object'||Array.isArray(settings.productChoices)||Object.keys(settings.productChoices).length>100)throw Error('Ogiltiga produktval.');for(const [key,sku] of Object.entries(settings.productChoices)){const [store,id,...extra]=key.split(':');if(extra.length||!stores.some(s=>s.id===store)||!productMap[id]||typeof sku!=='string'||!/^[-A-Za-z0-9_]{1,80}$/.test(sku))throw Error('Ett produktval är ogiltigt.');}}

 if(settings.variety!==undefined&&!['varied','repeat'].includes(settings.variety))throw Error('Välj en giltig menyvariation.');
 if(settings.cuisines!==undefined&&(!Array.isArray(settings.cuisines)||settings.cuisines.length>4||settings.cuisines.some(c=>!['nordic','mediterranean','asian','texmex'].includes(c))))throw Error('Välj giltiga smakpreferenser.');
 if(settings.favoriteRecipes!==undefined&&(!Array.isArray(settings.favoriteRecipes)||settings.favoriteRecipes.length>100||settings.favoriteRecipes.some(id=>!recipeMap[id])))throw Error('Ett favoritrecept känns inte igen.');
 if(settings.postalCode&&!/^[1-9]\d{4}$/.test(settings.postalCode))throw Error('Ange ett svenskt postnummer med fem siffror.');
 if(settings.priceBasis!==undefined&&!['current','matmoms'].includes(settings.priceBasis))throw Error('Välj en giltig priskälla.');
 if(!Number.isInteger(settings.people)||settings.people<1||settings.people>8)throw Error('Välj mellan 1 och 8 personer.');
 if(!Number.isSafeInteger(settings.budget)||settings.budget<100||settings.budget>10000000)throw Error('Ange en budget mellan 1 och 100 000 kr.');
 if(!Array.isArray(settings.meals)||!settings.meals.length||settings.meals.some(m=>!['breakfast','lunch','dinner'].includes(m)))throw Error('Välj minst en måltid.');
 if(!settings.stores?.length||settings.stores.some(s=>!stores.some(x=>x.id===s)))throw Error('Välj minst en butik.');
 if(!['all','vegetarian','vegan'].includes(settings.diet))throw Error('Välj en matpreferens.');
 if(![15,20,30,60].includes(settings.maxTime))throw Error('Välj en tidsgräns.');
 if(!['week','month'].includes(settings.period))throw Error('Välj vecka eller månad.');
 if((settings.avoidIngredients||[]).some(id=>!productMap[id]))throw Error('En ingrediens att undvika känns inte igen.');
 for(const amount of Object.values(settings.pantry||{}))if(!Number.isFinite(amount)||amount<0)throw Error('Mängden hemma måste vara noll eller större.');
 datesFor(settings);
}
export function candidates(meal,settings){const result=recipes.filter(r=>r.meal===meal&&r.minutes<=settings.maxTime&&(!settings.easy||r.easy)&&(settings.diet==='all'||r.diet==='vegan'||settings.diet==='vegetarian'&&r.diet==='vegetarian')&&!r.ingredients.some(i=>(settings.avoidIngredients||[]).includes(i.id)||productMap[i.id].allergens.some(a=>settings.exclusions.includes(a))));
 const score=r=>((settings.favoriteRecipes||[]).includes(r.id)?10:0)+((settings.cuisines||[]).includes(r.cuisine)?3:0);
 return result.sort((a,b)=>score(b)-score(a));
}
export function priceFor(product,store,memberships=[],choices={}){
 const selected=choices?.[store+':'+product.id];
 const observation=selected?(product.offers?.[store]||[]).find(r=>r.sku===selected):product.observations?.[store];
 if(selected&&!observation)return {price:null,quantity:null,member:false};
 if(observation)return (observation.priceBasis==='matmoms'?validReference(observation):validObservation(observation))?{price:observation.retailPriceBasis==='kg'?Math.round(observation.priceOre*observation.averageWeightKg):observation.priceOre,quantity:observation.quantity,observation,member:false}:{price:null,quantity:null,member:false};
 const standard=product.prices[store],member=product.memberPrices?.[store];
 const useMember=memberships.includes(store)&&Number.isInteger(member)&&member<standard;
 return {price:useMember?member:standard,member:useMember};
}
export function requirements(slots,settings){
 const amounts={};
 slots=withLunchboxes(slots,settings);for(const slot of slots){if(slot.leftoverFrom!==undefined)continue;const recipe=recipeMap[slot.recipe];if(!recipe)throw Error('Receptet saknas.');for(const ingredient of recipe.ingredients)amounts[ingredient.id]=(amounts[ingredient.id]||0)+ingredient.amount*slotPortions(slot,slots,settings)/recipe.servings;}
 return Object.entries(amounts).map(([id,amount])=>({product:productMap[id],amount,pantry:Math.min(amount,settings.pantry?.[id]||0),needed:Math.max(0,amount-(settings.pantry?.[id]||0))}));
}
function cartFor(requirements,store,settings){
 const lines=requirements.map(r=>{const p=priceFor(r.product,store,settings.memberships,settings.productChoices),packQuantity=p.quantity||r.product.quantity;const packs=Math.max(0,Math.ceil(r.needed/packQuantity-1e-10));return {...r,store,packs,packQuantity,observation:p.observation,unitPrice:p.price,member:p.member,cost:packs===0?0:Number.isInteger(p.price)?packs*p.price:null};});
 return {store,lines,complete:lines.every(l=>l.cost!==null),total:lines.every(l=>l.cost!==null)?lines.reduce((n,l)=>n+l.cost,0):null};
}
export function compare(slots,settings){
 const required=requirements(slots,settings),carts=settings.stores.map(s=>cartFor(required,s,settings));
 const complete=carts.filter(c=>c.complete).sort((a,b)=>a.total-b.total||a.store.localeCompare(b.store));
 const best=complete[0]||null;
 let split=null;
 if(settings.maxStores===2&&settings.stores.length>1){
  const options=[];
  for(let i=0;i<settings.stores.length;i++)for(let j=i+1;j<settings.stores.length;j++){
   const pair=carts.filter(c=>[settings.stores[i],settings.stores[j]].includes(c.store));
   const lines=required.map((_,k)=>pair.map(c=>c.lines[k]).filter(l=>l.cost!==null).sort((a,b)=>a.cost-b.cost||a.store.localeCompare(b.store))[0]);
   if(lines.every(Boolean))options.push({lines,total:lines.reduce((n,l)=>n+l.cost,0),stores:[...new Set(lines.filter(l=>l.packs).map(l=>l.store))]});
  }
  split=options.sort((a,b)=>a.total-b.total||a.stores.length-b.stores.length)[0]||null;
 }
 const chosen=split&&(!best||split.total<best.total)?split:best;
 const displayCart=chosen||[...carts].sort((a,b)=>b.lines.filter(l=>l.needed>0&&l.cost!==null).length-a.lines.filter(l=>l.needed>0&&l.cost!==null).length)[0];
 return {required,carts,best,split,chosen,displayCart,total:chosen?.total??null};
}
export function recipeCostDetails(recipe,people,store,memberships=[],choices={}){
 const lines=recipe.ingredients.map(i=>{const product=productMap[i.id],quote=priceFor(product,store,memberships,choices);return {product,cost:Number.isInteger(quote.price)?i.amount*people/recipe.servings/(quote.quantity||product.quantity)*quote.price:null};});
 const missing=lines.filter(l=>l.cost===null).map(l=>l.product),subtotal=Math.round(lines.reduce((sum,l)=>sum+(l.cost??0),0));
 return {total:missing.length?null:subtotal,subtotal,missing,knownCount:lines.length-missing.length,totalCount:lines.length};
}
export function recipeConsumptionCost(recipe,people,store,memberships=[],choices={}){return recipeCostDetails(recipe,people,store,memberships,choices).total;}
export function generate(settings){
 validate(settings);const dates=datesFor(settings),pools={};
 for(const meal of settings.meals){pools[meal]=candidates(meal,settings);if(!pools[meal].length)throw Error('Inget '+({breakfast:'frukostrecept',lunch:'lunchrecept',dinner:'middagsrecept'}[meal])+' matchar alla val i demokatalogen. Prova längre tillagningstid eller andra val. Allergiundantag ändras aldrig automatiskt.');}
 let slots=dates.flatMap((_,day)=>settings.meals.map((meal,i)=>({day,meal,recipe:pools[meal][(day+i)%(settings.variety==='repeat'?Math.min(2,pools[meal].length):pools[meal].length)].id})));
 slots=withLunchboxes(slots,settings);let result=compare(slots,settings),adjusted=false,proposals=0;
 // Bounded local search, not a claim of globally optimal meal selection.
 if(result.total!==null&&result.total>settings.budget){
  for(let pass=0;pass<2&&result.total>settings.budget&&proposals<200;pass++){
   let improved=false;
   for(let i=0;i<slots.length&&result.total>settings.budget&&proposals<200;i++){
    if(slots[i].leftoverFrom!==undefined)continue;
    let winner=slots[i],winning=result;
    for(const recipe of pools[slots[i].meal]){
     if(proposals++>=200)break;
     const proposal=withLunchboxes(slots.map((s,j)=>j===i?{...s,recipe:recipe.id}:s),settings),priced=compare(proposal,settings);
     if(priced.total!==null&&priced.total<winning.total){winner=proposal[i];winning=priced;}
    }
    if(winner!==slots[i]){slots=withLunchboxes(slots.map((s,j)=>j===i?winner:s),settings);result=winning;improved=true;adjusted=true;}
   }
   if(!improved)break;
  }
 }
 return {settings:structuredClone(settings),slots,adjusted};
}
export function validatePlan(plan){
 validate(plan.settings);const days=datesFor(plan.settings).length,keys=new Set();
 if(!Array.isArray(plan.slots)||plan.slots.length!==days*plan.settings.meals.length)throw Error('Planens måltider är ofullständiga.');
 const canonical=withLunchboxes(plan.slots,plan.settings);
 for(let i=0;i<plan.slots.length;i++){
  const slot=plan.slots[i],next=canonical[i];
  if(!Number.isInteger(slot.day)||slot.day<0||slot.day>=days||!plan.settings.meals.includes(slot.meal)||keys.has(slot.day+':'+slot.meal))throw Error('Planens dagar eller måltider är ogiltiga.');
  keys.add(slot.day+':'+slot.meal);
  if(slot.recipe!==next.recipe||slot.leftoverFrom!==next.leftoverFrom)throw Error('En matlåda är felkopplad till middagen.');
  if(slot.leftoverFrom===undefined&&!candidates(slot.meal,plan.settings).some(r=>r.id===slot.recipe))throw Error('Ett recept följer inte dina matval.');
 }
 return plan;
}
export function replaceRecipe(plan,slotIndex,id){
 let slot=plan.slots[slotIndex];if(!slot)throw Error('Måltiden saknas.');
 if(slot.leftoverFrom!==undefined){slotIndex=plan.slots.findIndex(s=>s.meal==='dinner'&&s.day===slot.leftoverFrom);slot=plan.slots[slotIndex];}
 if(!slot||!candidates(slot.meal,plan.settings).some(r=>r.id===id))throw Error('Receptet matchar inte dina val.');
 const next={...plan,slots:withLunchboxes(plan.slots.map((s,i)=>i===slotIndex?{...s,recipe:id}:s),plan.settings)};
 validatePlan(next);return next;
}
export function cheaperPlan(plan,maxProposals=200){
 validatePlan(plan);let result=compare(plan.slots,plan.settings),best=structuredClone(plan),attempts=0;
 if(result.total===null)return best;
 for(let i=0;i<best.slots.length&&attempts<maxProposals;i++){
  if(best.slots[i].leftoverFrom!==undefined)continue;
  for(const recipe of candidates(best.slots[i].meal,best.settings)){
   if(attempts++>=maxProposals)break;
   const next=replaceRecipe(best,i,recipe.id),priced=compare(next.slots,next.settings);
   if(priced.total!==null&&priced.total<result.total){best=next;result=priced;}
  }
 }
 return best;
}
export function cheaperProductSwaps(plan){
 const current=compare(plan.slots,plan.settings);if(current.total===null||plan.settings.priceBasis==='matmoms')return [];
 const proposals=[];
 for(const line of current.chosen.lines){
  if(!line.needed||!line.observation)continue;
  for(const offer of line.product.offers?.[line.store]||[]){
   if(offer.sku===line.observation.sku||!validObservation(offer)||!offer.reviewedAlternative)continue;
   if((offer.allergens||[]).some(a=>plan.settings.exclusions.includes(a)))continue;
   const settings={...plan.settings,productChoices:{...plan.settings.productChoices,[line.store+':'+line.product.id]:offer.sku}};
   const priced=compare(plan.slots,settings),selected=priced.chosen?.lines.find(l=>l.product.id===line.product.id);
   if(priced.total!==null&&priced.total<current.total&&selected?.observation?.sku===offer.sku)proposals.push({ingredient:line.product.id,store:line.store,offer,oldOffer:line.observation,oldCost:line.cost,newCost:selected.cost,saving:current.total-priced.total,settings});
  }
 }
 return proposals.sort((a,b)=>b.saving-a.saving).slice(0,8);
}
