import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server.mjs';
import {cleanSettings,parsePlan,requestFor} from '../server/ai.mjs';
import {candidates,compare} from '../web/engine.mjs';
const settings=()=>({period:'week',startDate:'2026-11-09',month:'2026-11',people:2,budget:120000,meals:['dinner'],diet:'vegan',maxTime:30,easy:true,exclusions:['nuts'],avoidIngredients:['onion'],stores:['willys','coop'],memberships:[],maxStores:2,pantry:{}});
function answer(s=settings()){return JSON.stringify({days:Array.from({length:7},()=>Object.fromEntries(s.meals.map(m=>[m,candidates(m,s)[0].id]))),explanation:'Råvarorna återkommer under veckan.'});}
test('AI cannot introduce unknown recipes, extra meals or excluded ingredients',()=>{
 const s=cleanSettings(settings());assert.equal(parsePlan(answer(s),s).slots.length,7);
 const bad=JSON.parse(answer(s));bad.days[0].dinner='invented';assert.throws(()=>parsePlan(JSON.stringify(bad),s));
 bad.days[0].dinner='banana-oats';assert.throws(()=>parsePlan(JSON.stringify(bad),s));
 bad.days[0].breakfast='banana-oats';assert.throws(()=>parsePlan(JSON.stringify(bad),s));
 assert.throws(()=>parsePlan('{}',s));
});
test('month expands seven-day AI choices; prices always use the existing engine',()=>{
 const s=cleanSettings({...settings(),period:'month',month:'2028-02'}),p=parsePlan(answer(s),s);
 assert.equal(p.slots.length,29);assert.equal(p.slots[0].recipe,p.slots[28].recipe);
 assert.equal(compare(p.slots,s).total,null);assert.equal(p.ai.provider,'Amazon Bedrock');
 assert.equal(requestFor(s).inferenceConfig.maxTokens,1600);
});
test('public input rejects malformed constraints before any paid invocation',()=>{
 for(const change of [{easy:'yes'},{maxStores:99},{exclusions:['invented']},{pantry:{oats:Infinity}},{avoidIngredients:'onion'},{stores:['invented']}])assert.throws(()=>cleanSettings({...settings(),...change}));
});
test('API authenticates, validates, persists daily quota and serves only public files',async()=>{
 const temp=mkdtempSync(path.join(os.tmpdir(),'matbudget-ai-')),stateFile=path.join(temp,'usage.json'),code='test-access-code-long-enough';let calls=0;
 async function start(){const server=createApp({enabled:true,accessCode:code,dailyLimit:1,stateFile,invoke:async()=>{calls++;return answer();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));return server;}
 let server=await start();let base='http://127.0.0.1:'+server.address().port;
 const post=(value,token=code)=>fetch(base+'/api/plan',{method:'POST',headers:{'Content-Type':'application/json','X-AI-Access-Code':token},body:JSON.stringify(value)});
 try{
  assert.equal((await fetch(base+'/.env')).status,404);
  assert.equal((await fetch(base+'/server.mjs')).status,404);
  assert.equal((await post({settings:settings()},'wrong')).status,401);
  assert.equal((await post({settings:{...settings(),budget:-1}})).status,400);assert.equal(calls,0);
  const response=await post({settings:settings()});assert.equal(response.status,200);assert.equal((await response.json()).plan.slots.length,7);assert.equal(calls,1);
  assert.equal(JSON.parse(readFileSync(stateFile)).calls,1);
  await new Promise(r=>server.close(r));server=await start();base='http://127.0.0.1:'+server.address().port;
  assert.equal((await post({settings:settings()})).status,429);assert.equal(calls,1);
 }finally{await new Promise(r=>server.close(r));rmSync(temp,{recursive:true,force:true});}
});
test('failed model answers consume an attempt and never replace a plan',async()=>{
 const temp=mkdtempSync(path.join(os.tmpdir(),'matbudget-ai-'));
 const server=createApp({enabled:true,accessCode:'sixteen-characters-long',stateFile:path.join(temp,'usage.json'),invoke:async()=>'{"days":[]}'});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/plan',{method:'POST',headers:{'Content-Type':'application/json','X-AI-Access-Code':'sixteen-characters-long'},body:JSON.stringify({settings:settings()})});assert.equal(response.status,502);assert.equal((await response.json()).plan,undefined);assert.equal(JSON.parse(readFileSync(path.join(temp,'usage.json'))).calls,1);}finally{await new Promise(r=>server.close(r));rmSync(temp,{recursive:true,force:true});}
});
