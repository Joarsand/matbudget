import {spawn} from 'node:child_process';
import {candidates,datesFor,validate,compare,recipeCostDetails,withLunchboxes,validatePlan} from '../web/engine.mjs';
import {productMap,recipeMap} from '../web/data.mjs';

// Validate the public request before sending any preferences to a paid service.
export function cleanSettings(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Inställningar saknas.');
 const list=(key,allowed)=>{const a=raw[key]??[];if(!Array.isArray(a)||a.length>(key==='favoriteRecipes'?100:50)||a.some(x=>typeof x!=='string'||allowed&&!allowed.includes(x)))throw Error('Ogiltiga matval.');return [...new Set(a)]};
 const s={lunchboxes:raw.lunchboxes??false,lunchboxCount:raw.lunchboxCount??7,productChoices:raw.productChoices??{},postalCode:String(raw.postalCode??'').replace(/\s/g,''),priceBasis:raw.priceBasis??'current',period:raw.period,startDate:raw.startDate,month:raw.month,people:raw.people,budget:raw.budget,
 cuisines:list('cuisines',['nordic','mediterranean','asian','texmex']),favoriteRecipes:list('favoriteRecipes',Object.keys(recipeMap)),variety:raw.variety??'varied',
 meals:list('meals'),diet:raw.diet,maxTime:raw.maxTime,easy:raw.easy,
 exclusions:list('exclusions',['milk','egg','nuts','soy','gluten','fish']),avoidIngredients:list('avoidIngredients',Object.keys(productMap)),
 stores:list('stores'),memberships:list('memberships',['willys','coop','ica']),maxStores:raw.maxStores,pantry:{}};
 if(typeof s.easy!=='boolean'||![1,2].includes(s.maxStores))throw Error('Ogiltiga planeringsval.');
 for(const [id,amount] of Object.entries(raw.pantry??{})){if(!productMap[id]||!Number.isFinite(amount)||amount<0||amount>100000)throw Error('Ogiltig mängd hemma.');s.pantry[id]=amount;}
 validate(s);
 for(const meal of s.meals)if(!candidates(meal,s).length)throw Error('Inget recept matchar alla dina val. Ändra dina val eller använd demoplanen.');
 return s;
}
export function requestFor(settings){
 const allowed=Object.fromEntries(settings.meals.map(meal=>[meal,candidates(meal,settings).map(r=>({id:r.id,name:r.name,cuisine:r.cuisine,favorite:(settings.favoriteRecipes||[]).includes(r.id),ingredients:r.ingredients.map(i=>productMap[i.id].name),priceCoverage:settings.stores.map(store=>{const d=recipeCostDetails(r,settings.people,store,settings.memberships);return {store,known:d.knownCount,total:d.totalCount};})}))]));
 return {modelId:process.env.BEDROCK_MODEL_ID||'eu.amazon.nova-micro-v1:0',
 system:[{text:'Du är en svensk matplanerare. Svara ENDAST med JSON: {"days":[{"breakfast":"recept-id","lunch":"recept-id","dinner":"recept-id"},...],"explanation":"kort svensk förklaring"}. Skapa exakt sju dagar och bara de måltider som efterfrågas. Använd ENDAST tillåtna recept-id för respektive måltid. Variera maten och återanvänd råvaror. Följ önskade smakpreferenser och prioritera favoriter när de är tillåtna. Vid variety=repeat återanvänd två rätter per måltid under veckan för matlådor; vid varied välj olika rätter där det går. Prioritera recept med bättre priceCoverage bland de tillåtna alternativen; saknade priser får aldrig uppskattas eller hittas på. Förklaringen får vara högst 400 tecken och ska beskriva variation/råvaror, aldrig ange priser eller lova att budget, allergisäkerhet eller näringsbehov uppfylls. Recepten är förskrivna. Pristäckningen är ofullständig; påstå aldrig att planen ryms i budgeten. Kostnaden kontrolleras separat av programmet. En månad upprepar sjudagarsmenyn.'}],
 messages:[{role:'user',content:[{text:JSON.stringify({people:settings.people,period:settings.period,budgetSEK:settings.budget/100,diet:settings.diet,cuisines:settings.cuisines,variety:settings.variety,favoriteRecipes:settings.favoriteRecipes,meals:settings.meals,allowed})}]}],
 inferenceConfig:{maxTokens:1600,temperature:0.3}};
}
export function parsePlan(text,settings){
 const data=JSON.parse(text.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));
 if(!Array.isArray(data.days)||data.days.length!==7||typeof data.explanation!=='string'||data.explanation.length>400)throw Error('AI-svaret hade fel format.');
 for(const day of data.days){if(!day||Object.keys(day).length!==settings.meals.length)throw Error('AI-svaret saknade måltider.');for(const meal of settings.meals)if(!candidates(meal,settings).some(r=>r.id===day[meal]))throw Error('AI:n valde ett recept som inte följer dina val.');}
 if(settings.variety==='repeat'){
  const chosen=Object.fromEntries(settings.meals.map(meal=>[meal,[...new Set(data.days.map(day=>day[meal]))].slice(0,2)]));
  data.days=Array.from({length:7},(_,day)=>Object.fromEntries(settings.meals.map((meal,i)=>[meal,chosen[meal][(day+i)%chosen[meal].length]])));
 }
 const plan={settings:structuredClone(settings),slots:withLunchboxes(datesFor(settings).flatMap((_,day)=>settings.meals.map(meal=>({day,meal,recipe:data.days[day%7][meal]}))),settings),adjusted:false,
 ai:{provider:'Amazon Bedrock',explanation:data.explanation,createdAt:new Date().toISOString()}};
 // Only deterministic code computes price; never accept a model-provided total.
 validatePlan(plan);compare(plan.slots,settings);
 return plan;
}
export function invokeBedrock(input){
 return new Promise((resolve,reject)=>{
  // AWS CLI uses the EC2 role in production, with no credentials in the website.
  // Local Windows development can explicitly select its existing Ubuntu CLI.
  const wsl=process.env.BEDROCK_USE_WSL==='1';
  const args=[...(wsl?['-e','aws']:[]),'bedrock-runtime','converse','--region',process.env.AWS_REGION||'eu-north-1','--cli-input-json',JSON.stringify(input),'--output','json','--no-cli-pager'];
  const child=spawn(wsl?'wsl.exe':'aws',args,{windowsHide:true,env:{...process.env,AWS_MAX_ATTEMPTS:'1',AWS_PAGER:''},stdio:['ignore','pipe','pipe']});
  let out='',err='',finished=false;
  const timer=setTimeout(()=>{child.kill();finish(Error('AI-tjänsten svarade inte i tid. Försök senare.'));},45000);
  function finish(error,value){if(finished)return;finished=true;clearTimeout(timer);error?reject(error):resolve(value);}
  child.stdout.on('data',b=>{out+=b;if(out.length>100000){child.kill();finish(Error('AI-svaret var för stort.'));}});
  child.stderr.on('data',b=>{if(err.length<4000)err+=b;});
  child.on('error',()=>finish(Error('AI-anslutningen är inte installerad på servern.')));
  child.on('close',code=>{if(code!==0)return finish(Error(/AccessDenied|Unauthorized/.test(err)?'AWS saknar behörighet för AI-modellen.':'AI-tjänsten kunde inte skapa en plan. Försök senare.'));try{const result=JSON.parse(out);if(result.stopReason!=='end_turn')throw Error();finish(null,result.output.message.content.filter(c=>typeof c.text==='string').map(c=>c.text).join(''));}catch{finish(Error('AI-svaret kunde inte läsas.'));}});
 });
}
