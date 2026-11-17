import {cleanEdit,requestEditFor,parseEdit} from './server/edit-plan.mjs';
import http from 'node:http';
import {readFileSync,writeFileSync,renameSync,mkdirSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import {timingSafeEqual} from 'node:crypto';
import {cleanSettings,requestFor,parsePlan,invokeBedrock} from './server/ai.mjs';
import {localPriceBook} from './server/location.mjs';
import {applyPriceBook} from './web/price-book.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const web=path.join(root,'web');
const publicFiles=new Set(['ica-recipes.html','ica-recipes.mjs','ica-source-recipes.mjs','store-catalogue.mjs','preferences.mjs','plan-tools.mjs','lunchboxes.mjs','food-atlas-v1.png','extra-recipes.mjs','index.html','styles.css','theme.css','theme.js','data.mjs','engine.mjs','app.mjs','quiz.mjs','ai-client.mjs','price-book.mjs','price-panel.mjs','matmoms-panel.mjs']);
publicFiles.add('ica-budget-audit.mjs');
const mime={'.png':'image/png','.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript'};

export function createApp({invoke=invokeBedrock,enabled=process.env.AI_ENABLED==='1',accessCode=process.env.AI_ACCESS_CODE||'',dailyLimit=Number(process.env.AI_DAILY_LIMIT||20),stateFile=process.env.AI_STATE_FILE||path.join(root,'var','ai-usage.json'),priceFile=process.env.PRICEBOOK_STATE_FILE||path.join(root,'var','price-book.json')}={}){
 if(!Number.isInteger(dailyLimit)||dailyLimit<1||dailyLimit>1000)throw Error('AI_DAILY_LIMIT must be 1–1000.');
 if(enabled&&accessCode.length<16)throw Error('AI_ACCESS_CODE must have at least 16 characters.');
 let busy=false,nextAttempt=0;
 function prices(basis='current',postalCode=''){
  let snapshot;try{snapshot=JSON.parse(readFileSync(priceFile,'utf8'));if(snapshot.version!==1||!Array.isArray(snapshot.records))throw Error();}catch{snapshot={version:1,records:[],sources:{}};}
  try{const reference=JSON.parse(readFileSync(process.env.MATMOMS_STATE_FILE||path.join(root,'var','matmoms-reference.json'),'utf8'));if(reference.version===1&&Array.isArray(reference.references)){snapshot.references=reference.references;snapshot.matmoms=reference;}}catch{}
  if(postalCode){const postal=JSON.parse(readFileSync(process.env.POSTAL_STATE_FILE||path.join(root,'var','postal-se.json'),'utf8'));const directory=JSON.parse(readFileSync(process.env.STORE_DIRECTORY_FILE||path.join(root,'var','store-directory.json'),'utf8'));snapshot=localPriceBook(snapshot,postalCode,postal,directory);}
  applyPriceBook(snapshot,Date.now(),basis);return snapshot;
 }
 function reserve(){
  mkdirSync(path.dirname(stateFile),{recursive:true});
  let usage;try{usage=JSON.parse(readFileSync(stateFile,'utf8'));if(typeof usage.day!=='string'||!Number.isInteger(usage.calls)||usage.calls<0)throw Error();}catch(e){if(e.code!=='ENOENT')throw Error('Användningsräknaren behöver kontrolleras.');usage={day:'',calls:0};}
  const day=new Date().toISOString().slice(0,10);if(usage.day!==day)usage={day,calls:0};
  if(usage.calls>=dailyLimit)throw Error('Dagens gräns för AI-försök är nådd. Demoplaneringen fungerar fortfarande.');
  usage.calls++;writeFileSync(stateFile+'.tmp',JSON.stringify(usage),{mode:0o600});renameSync(stateFile+'.tmp',stateFile);
 }
 function sameCode(value){const a=Buffer.from(value||''),b=Buffer.from(accessCode);return a.length===b.length&&timingSafeEqual(a,b);}
 return http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','same-origin');
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
  let url;try{url=new URL(req.url,'http://localhost');}catch{return send(400,{error:'Ogiltig adress.'});}
  if(url.pathname==='/api/status'&&req.method==='GET')return send(200,{enabled,provider:enabled?'Amazon Bedrock':null,verified:false,dailyLimit:enabled?dailyLimit:null});
  if((url.pathname==='/api/prices'||/^\/api\/prices\/[^/]+$/.test(url.pathname))&&req.method==='GET'){
   try{return send(200,prices('current',(url.pathname.startsWith('/api/prices/')?decodeURIComponent(url.pathname.slice('/api/prices/'.length)):url.searchParams.get('postalCode'))||''));}catch(error){return send(400,{error:error.message});}
  }
  if(['/api/plan','/api/edit-plan'].includes(url.pathname)&&req.method==='POST'){
   const editing=url.pathname==='/api/edit-plan';
   if(!enabled)return send(503,{error:'AI är inte aktiverad. Använd demoplaneringen.'});
   if(!sameCode(req.headers['x-ai-access-code']))return send(401,{error:'Ange rätt åtkomstkod för AI-testningen.'});
   // JSON + a custom header prevent cross-site form requests; no permissive CORS.
   if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return send(415,{error:'JSON krävs.'});
   if(busy||Date.now()<nextAttempt)return send(429,{error:'AI:n arbetar redan, eller behöver en kort paus. Försök om en stund.'});
   busy=true;
   try{
    let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>65536){send(413,{error:'Förfrågan är för stor.'});return;}}
    let settings,edit;try{const data=JSON.parse(body);if(editing){edit=cleanEdit(data);settings=edit.plan.settings;}else settings=cleanSettings(data.settings);}catch(error){return send(400,{error:error.message});}
    try{prices(settings.priceBasis,settings.postalCode);}catch(error){return send(400,{error:error.message});}
    try{reserve();}catch(error){return send(429,{error:error.message});}
    nextAttempt=Date.now()+10000;

    const text=await invoke(editing?requestEditFor(edit.plan,edit.message):requestFor(settings));
    let plan;try{plan=editing?parseEdit(text,edit.plan):parsePlan(text,settings);}catch{return send(502,{error:'AI-svaret klarade inte kontrollen av måltider och matval. Din tidigare plan är kvar.'});}
    return send(200,{plan});
   }catch(error){return send(502,{error:error.message});}finally{busy=false;}
  }
  if(req.method!=='GET'&&req.method!=='HEAD')return send(405,{error:'Metoden stöds inte.'});
  const file=url.pathname==='/'?'index.html':url.pathname.slice(1);
  if(!publicFiles.has(file))return send(404,{error:'Sidan finns inte.'});
  try{const body=readFileSync(path.join(web,file));if(file==='food-atlas-v1.png')res.setHeader('Cache-Control','public, max-age=31536000, immutable');res.writeHead(200,{'Content-Type':mime[path.extname(file)]});res.end(req.method==='HEAD'?undefined:body);}catch{return send(404,{error:'Filen finns inte.'});}
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const server=createApp();server.requestTimeout=20000;server.headersTimeout=10000;
 server.listen(Number(process.env.PORT||8787),process.env.HOST||'127.0.0.1',()=>console.log('Matbudget server ready; AI '+(process.env.AI_ENABLED==='1'?'configured (not yet verified)':'disabled')));
}
