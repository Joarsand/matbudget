import test from 'node:test';
import assert from 'node:assert/strict';
import {icaSourceRecipes} from '../web/ica-source-recipes.mjs';
import {products} from '../web/data.mjs';
import {auditIcaRecipe} from '../web/ica-budget-audit.mjs';
test('ICA migration keeps piece yields distinct and never hides unpriced ingredients',()=>{
 for(const recipe of icaSourceRecipes){
  const audit=auditIcaRecipe(recipe,products);
  assert.equal(audit.lines.length,recipe.ingredients.length);
  assert.deepEqual(audit.lines.map(l=>l.text),recipe.ingredients);
  assert.equal(audit.total,null);assert.equal(audit.readyForPlanner,false);
  if(recipe.originalYield.includes('st')){assert.equal(audit.portions,null);assert.equal(audit.yieldStatus,'pieces_not_portions');}
 }
 const oats=auditIcaRecipe(icaSourceRecipes[0],products);
 assert.equal(oats.lines[0].quantity,null); // dl oats must not silently become grams
 assert.equal(oats.portions,1);
 const soup=auditIcaRecipe(icaSourceRecipes.find(r=>r.id==='ica-723863'),products);
 assert.equal(soup.lines[5].candidateIngredient,null); // passata is not crushed tomatoes
});
