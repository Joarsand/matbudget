// Review gate for the ICA migration. Suggestions never enter the shopping engine.
// Each index refers to an unchanged ingredient fact in ica-source-recipes.mjs.
const reviewedCandidates={
 'ica-730321':{0:'oats',2:'salt',3:'milk',5:'apple'},
 'ica-740417':{0:'banana',1:'eggs',3:'salt'},
 'ica-725856':{0:'banana',3:'oatdrink',4:'salt'},
 'ica-723863':{0:'onion',1:'oil',2:'garlic',4:'lentils',9:'salt',10:'pepper',11:'bread'},
 'ica-715181':{1:'pasta',6:'milk',7:'salt',8:'pepper'},
 'ica-715086':{0:'onion',1:'carrot',3:'oil',5:'curry',9:'salt',10:'pepper'}
};
export function auditIcaRecipe(recipe,products,records=[],chain='willys',now=Date.now()){
 const catalogue=new Map(products.map(p=>[p.id,p]));
 const original=String(recipe.originalYield||'').trim();
 const portionMatch=/^([1-9]\d*)$/.exec(original);
 const portions=portionMatch?Number(portionMatch[1]):null;
 const lines=recipe.ingredients.map((text,index)=>{
  const ingredient=reviewedCandidates[recipe.id]?.[index],product=catalogue.get(ingredient);
  // Candidate identification is separate from approval of product type and units.
  const metric=/^(?:ca\s+)?(\d+(?:[.,]\d+)?)\s*(g|ml)\b/i.exec(text);
  const quantity=metric?Number(metric[1].replace(',','.')):null,unit=metric?.[2].toLowerCase()||null;
  const quote=product&&records.find(r=>r.ingredient===ingredient&&r.chain===chain&&r.unit===product.unit&&r.priceType==='regular'&&Number.isSafeInteger(r.priceOre)&&r.priceOre>0&&Number.isFinite(Date.parse(r.checkedAt))&&now-Date.parse(r.checkedAt)>=-60000&&now-Date.parse(r.checkedAt)<=36*3600000);
  const issue=!product?'Rätt råvara eller produktvariant behöver granskas.':!metric?'Mängd eller omräkning till butikens enhet behöver granskas.':unit!==product.unit?'Receptets mått och butikens enhet behöver kopplas ihop.':!quote?'Färskt pris saknas för denna butik.':'Produktvalet behöver godkännas mot originalet.';
  return {index,text,candidateIngredient:product?ingredient:null,quantity,unit,hasFreshCandidatePrice:Boolean(quote),status:'needs_review',issue};
 });
 return {recipeId:recipe.id,originalYield:original,portions,yieldStatus:portions?'portions_recorded':'pieces_not_portions',candidateCount:lines.filter(l=>l.candidateIngredient).length,lineCount:lines.length,lines,readyForPlanner:false,total:null,
  blockers:[...(!portions?['Originalets antal är stycken, inte verifierade personportioner.']:[]),'Råvaror, mått, tillbehör och produktvarianter behöver slutgranskas före budgetkoppling.']};
}
