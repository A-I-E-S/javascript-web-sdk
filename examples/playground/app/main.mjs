import { matchRoute } from './routes.mjs';
import { renderShell, updateActiveLinks, updateBreadcrumbs } from './shell.mjs';
import { applyUtilities, utilities } from './styles.mjs';

const sdkModulePath = '../../../packages/sdk/dist/africanies-web-sdk.esm.js';
try {
 const { defineAfricaniesElements } = await import(sdkModulePath);
 defineAfricaniesElements();
 document.documentElement.dataset.sdk='registered';
} catch {
 // A static playground copy can still render; production builds must make the SDK bundle reachable.
 document.documentElement.dataset.sdk='unavailable';
}
const app=document.querySelector('#app'); if(!app) throw new Error('Missing #app root'); app.innerHTML=renderShell();
const state={mode:localStorage.getItem('africanies-playground-mode')||'sfn',theme:localStorage.getItem('africanies-playground-theme')||'light',lastFocus:null};
const $=(selector,root=document)=>root.querySelector(selector);
const path=()=>location.hash.replace(/^#/,'')||'/overview';

function syncTheme(){ document.documentElement.dataset.theme=state.theme; document.documentElement.classList.toggle('dark',state.theme==='dark'); const el=$('#theme-toggle'); if(el){el.textContent=state.theme==='dark'?'☀':'☾';el.setAttribute('aria-label',`Use ${state.theme==='dark'?'light':'dark'} theme`);} }
function syncMode(){ const el=$('#shipping-mode-switch'); if(el){el.textContent=state.mode==='sfn'?'Export':'Import';el.dataset.mode=state.mode;} }
function closeMobile(){ const panel=$('#mobile-navigation'); const toggle=$('#mobile-navigation-toggle'); if(panel)panel.hidden=true;if(toggle){toggle.setAttribute('aria-expanded','false');} }
function renderRoute(){ const pathname=path(), matched=matchRoute(pathname), target=$('#route-view'); if(!target)return; target.innerHTML=matched?matched.route.render(matched.params):'<article class="not-found"><p class="eyebrow">404</p><h2>Page not found</h2><p>The requested playground route is unavailable.</p><a href="#/overview">Return to overview</a></article>'; updateBreadcrumbs(pathname);updateActiveLinks(pathname);closeMobile();target.scrollIntoView({block:'start'});bindRoute(); }

export function showToast(tone='success',title='Shipment saved'){ const region=$('#toast-region');if(!region)return; const item=document.createElement('article');item.className=utilities('toast',tone);item.setAttribute('role',tone==='danger'||tone==='warning'?'alert':'status');item.innerHTML=`<span>${tone==='success'?'✓':tone==='danger'?'!':'i'}</span><div><strong>${title}</strong><p>${tone==='danger'?'Please try again.':'Your action completed successfully.'}</p></div><button aria-label="Dismiss notification">×</button>`;region.append(item);item.querySelector('button').onclick=()=>item.remove();if(tone!=='danger')setTimeout(()=>item.remove(),5000); }
export function openOverlay(kind='modal',trigger=document.activeElement){ state.lastFocus=trigger; const root=$('#overlay-root');if(!root)return; const drawer=kind==='drawer';root.innerHTML=applyUtilities(`<div class="overlay-backdrop" data-overlay-backdrop><section class="overlay ${drawer?'drawer':''}" role="dialog" aria-modal="true" aria-labelledby="overlay-title"><header><div><p class="eyebrow">${kind==='confirm'?'CONFIRM ACTION':'SHIPMENT'}</p><h2 id="overlay-title">${kind==='confirm'?'Cancel shipment?':drawer?'Shipment details':'Create shipment'}</h2></div><button class="icon-button" data-overlay-close aria-label="Close dialog">×</button></header><div class="overlay-body"><p>${kind==='confirm'?'This cannot be undone. The customer will be notified.':'Keep focused work visible without leaving the current route.'}</p>${kind==='modal'?'<label><span>Shipment name</span><input class="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800" autofocus placeholder="Weekly stock"></label>':''}</div><footer>${btnHtml('Cancel','secondary','data-overlay-close')}${btnHtml(kind==='confirm'?'Cancel shipment':'Continue',kind==='confirm'?'danger':'primary','data-overlay-action')}</footer></section></div>`); const dialog=root.querySelector('[role="dialog"]');(dialog.querySelector('[autofocus]')||dialog.querySelector('button'))?.focus(); }
const btnHtml=(label,variant,attrs)=>`<button type="button" class="${utilities('sdk-button',variant)}" ${attrs}>${label}</button>`;
function closeOverlay(){ const root=$('#overlay-root');if(root)root.innerHTML='';state.lastFocus?.focus?.();state.lastFocus=null; }

function bindRoute(){
 document.querySelectorAll('.dismiss-alert').forEach(x=>x.onclick=()=>x.closest('.alert')?.remove()); document.querySelectorAll('.remove-chip').forEach(x=>x.onclick=()=>x.closest('.chip')?.remove());
 document.querySelectorAll('[data-open-overlay]').forEach(x=>x.onclick=()=>openOverlay(x.dataset.openOverlay,x)); document.querySelectorAll('[data-toast]').forEach(x=>x.onclick=()=>showToast(x.dataset.toast,`${x.dataset.toast[0].toUpperCase()+x.dataset.toast.slice(1)} notification`));
 const menu=$('[data-action-menu]');if(menu)menu.onclick=()=>{const pop=menu.nextElementSibling,open=pop.hidden;pop.hidden=!open;menu.setAttribute('aria-expanded',String(open));if(open)pop.querySelector('[role="menuitem"]')?.focus();};
 document.querySelectorAll('[data-feedback]').forEach(control=>control.onclick=()=>{document.querySelectorAll('[data-feedback]').forEach(x=>x.setAttribute('aria-pressed',String(x===control)));const preview=$('#feedback-preview'),s=control.dataset.feedback;const values={loading:['<span class="large-spinner"></span>','Loading shipments','This will only take a moment.'],empty:['◇','No shipments yet','Create a shipment to get started.'],error:['!','Unable to load shipments','Check your connection and try again.'],success:['✓','Shipments loaded','Everything is up to date.']}[s];preview.className=utilities('feedback-state',s);preview.innerHTML=applyUtilities(`<span class="feedback-symbol">${values[0]}</span><strong>${values[1]}</strong><p>${values[2]}</p>${s==='error'?btnHtml('Try again','secondary','data-feedback="loading"'):''}`);});
 document.querySelectorAll('[data-demo-submit]').forEach(x=>x.onclick=e=>{e.preventDefault();showToast('success','Details saved');}); document.querySelectorAll('.copy-code').forEach(x=>x.onclick=async()=>{try{await navigator.clipboard.writeText(x.dataset.copy);showToast('success','Code copied');}catch{showToast('danger','Copy failed');}});
 const iconSearch=$('[data-icon-search]');if(iconSearch)iconSearch.oninput=()=>document.querySelectorAll('[data-icon-name]').forEach(x=>x.hidden=!x.dataset.iconName.includes(iconSearch.value.toLowerCase()));
}

$('#theme-toggle').onclick=()=>{state.theme=state.theme==='light'?'dark':'light';localStorage.setItem('africanies-playground-theme',state.theme);syncTheme();};
$('#shipping-mode-switch').onclick=()=>{state.mode=state.mode==='sfn'?'stn':'sfn';localStorage.setItem('africanies-playground-mode',state.mode);syncMode();showToast('info',`${state.mode==='sfn'?'Export':'Import'} mode enabled`);};
$('#mobile-navigation-toggle').onclick=()=>{const panel=$('#mobile-navigation'),open=panel.hidden;panel.hidden=!open;$('#mobile-navigation-toggle').setAttribute('aria-expanded',String(open));if(open)$('#mobile-navigation-close')?.focus();};$('#mobile-navigation-close').onclick=closeMobile;
$('#notifications').onclick=()=>showToast('info','No new notifications');$('#access-token').onclick=()=>openOverlay('modal',$('#access-token'));
document.addEventListener('click',e=>{if(e.target.matches('[data-overlay-close],[data-overlay-backdrop]'))closeOverlay();if(e.target.matches('[data-overlay-action]')){closeOverlay();showToast('success','Action completed');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeOverlay();closeMobile();const menu=$('[data-action-menu][aria-expanded="true"]');if(menu){menu.nextElementSibling.hidden=true;menu.setAttribute('aria-expanded','false');menu.focus();}}if(e.key==='Tab'){const dialog=$('[role="dialog"]');if(dialog){const focus=[...dialog.querySelectorAll('button,input,[href]')];if(!focus.length)return;const first=focus[0],last=focus.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}});
setInterval(()=>{const el=$('#clock');if(el)el.textContent=new Intl.DateTimeFormat('en',{hour:'2-digit',minute:'2-digit'}).format(new Date());},1000);
addEventListener('hashchange',renderRoute);syncTheme();syncMode();renderRoute();
