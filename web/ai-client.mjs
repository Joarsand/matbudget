import {generate,validate} from './engine.mjs';
export function initAI(){
 const box=document.querySelector('.ai-preview');
 box.innerHTML='<div class="ai-symbol" aria-hidden="true">✳</div><div><span class="eyebrow">PERSONLIG MATPLAN</span><h3>Planera med AI.</h3><p id="ai-status" role="status">Kontrollerar AI-anslutningen…</p><label><input type="checkbox" id="use-ai" checked disabled> Använd AI när jag skapar min matplan</label><p class="field-hint">AI är förvalt och används även när du avslutar quizet. Dina matval skickas till Amazon Bedrock när du skapar planen. AI:n väljer ur demokatalogen; en månad upprepar en sjudagarsmeny. Budget och inköpslista räknas av programmet.</p><label class="field-label" for="ai-code">Åtkomstkod för AI-testning</label><input type="password" id="ai-code" autocomplete="off" maxlength="128"><p class="field-hint">Koden sparas inte. Demoplanering fungerar utan kod.</p><p id="ai-explanation"></p></div>';
 const status=document.getElementById('ai-status'),toggle=document.getElementById('use-ai');
 const ready=fetch('/api/status').then(r=>r.ok?r.json():null).then(data=>{if(data?.enabled){toggle.disabled=false;status.textContent='AI är konfigurerad. Anslutningen verifieras när en plan har skapats. Högst '+data.dailyLimit+' AI-försök per dag för hela prototypen.';}else {toggle.checked=false;status.textContent='AI är inte aktiverad på denna server. Du kan fortsätta skapa demoplaner.';}}).catch(()=>{toggle.checked=false;status.textContent='AI-anslutningen är inte tillgänglig. Demoplaneringen fungerar.';});
 return async settings=>{
  await ready;validate(settings);
  if(!toggle.checked)return generate(settings);
  const code=document.getElementById('ai-code').value;if(!code)throw Error('Ange åtkomstkoden för AI. I quizet finns kodfältet i sista steget; annars i AI-rutan längre ned på sidan.');
  status.textContent='AI:n väljer en meny som följer dina matval…';
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),55000);
  try{const response=await fetch('/api/plan',{method:'POST',headers:{'Content-Type':'application/json','X-AI-Access-Code':code},body:JSON.stringify({settings}),signal:controller.signal});const data=await response.json();if(!response.ok)throw Error(data.error||'AI-planeringen misslyckades.');status.textContent='Planen har skapats med Amazon Bedrock. Budgetkontroll kräver verifierade butikspriser.';return data.plan;}catch(error){status.textContent='AI-planen kunde inte skapas. Din tidigare plan är kvar.';throw Error(error.name==='AbortError'?'AI:n svarade inte i tid. Försök senare.':error.message);}finally{clearTimeout(timer);}
 };
}
