import {icaSourceRecipes} from './ica-source-recipes.mjs';
import {products} from './data.mjs';
import {auditIcaRecipe} from './ica-budget-audit.mjs';
const root=document.getElementById('recipes'),search=document.getElementById('search');
function render(){const query=search.value.trim().toLocaleLowerCase('sv-SE');const found=icaSourceRecipes.filter(r=>(r.name+' '+r.ingredients.join(' ')).toLocaleLowerCase('sv-SE').includes(query));root.replaceChildren();document.getElementById('count').textContent=found.length+' ICA-recept';for(const r of found){const card=document.createElement('article'),title=document.createElement('h2'),source=document.createElement('small'),yieldText=document.createElement('p'),details=document.createElement('details'),summary=document.createElement('summary'),list=document.createElement('ul'),link=document.createElement('a');title.textContent=r.name;source.textContent='Receptkälla: ICA';yieldText.textContent='Originalets receptmängd: '+r.originalYield+' · angiven tid: '+String(r.duration||'se originalet').replace('PT','').replace('H',' tim ').replace('M',' min');summary.textContent='Ingredienser enligt originalet';for(const text of r.ingredients){const li=document.createElement('li');li.textContent=text;list.append(li);}details.append(summary,list);link.href=r.sourceUrl;link.target='_blank';link.rel='noopener';link.className='source';link.textContent='Se originalrecept och bild hos ICA ↗';card.append(source,title,yieldText,details,link);root.append(card);}}
const originalRender=render;
function renderWithReview(){
 originalRender();
 const query=search.value.trim().toLocaleLowerCase('sv-SE');
 const found=icaSourceRecipes.filter(r=>(r.name+' '+r.ingredients.join(' ')).toLocaleLowerCase('sv-SE').includes(query));
 [...root.children].forEach((card,index)=>{
  const audit=auditIcaRecipe(found[index],products),details=document.createElement('details'),summary=document.createElement('summary'),note=document.createElement('p'),list=document.createElement('ul');
  details.className='budget-review';summary.textContent='Budgetkoppling: '+audit.candidateCount+' av '+audit.lineCount+' råvaror har en möjlig koppling';
  note.textContent=audit.blockers.join(' ')+' Ingen totalsumma visas före granskningen.';
  for(const line of audit.lines){const li=document.createElement('li');li.textContent=line.text+' — '+line.issue;list.append(li);}
  details.append(summary,note,list);card.append(details);
 });
}
search.addEventListener('input',renderWithReview);renderWithReview();
