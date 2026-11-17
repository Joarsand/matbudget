// Runs before the stylesheet so an existing theme preference avoids a light flash.
(()=>{
 const key='matbudget-theme',system=window.matchMedia('(prefers-color-scheme: dark)');
 const stored=()=>{try{const value=localStorage.getItem(key);return ['light','dark'].includes(value)?value:null}catch{return null}};
 function paint(theme){
  document.documentElement.dataset.theme=theme;
  for(const button of document.querySelectorAll('[data-theme-toggle]')){
   button.textContent=theme==='dark'?'☾ Mörkt':'☀ Ljust';
   button.setAttribute('aria-label',button.textContent+' – '+(theme==='dark'?'växla till ljust läge':'växla till mörkt läge'));
   button.setAttribute('aria-pressed',String(theme==='dark'));
  }
 }
 paint(stored()||(system.matches?'dark':'light'));
 document.addEventListener('click',e=>{if(!e.target.closest('[data-theme-toggle]'))return;const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem(key,theme)}catch{}paint(theme)});
 document.addEventListener('DOMContentLoaded',()=>paint(document.documentElement.dataset.theme));
 system.addEventListener('change',e=>{if(!stored())paint(e.matches?'dark':'light')});
})();
