import { matchRoute } from './routes.mjs';
import { renderShell, updateActiveLinks, updateBreadcrumbs } from './shell.mjs';
import { applyUtilities, utilities } from './styles.mjs';

const sdkModulePath = '../../../packages/sdk/dist/africanies-web-sdk.esm.js';
let sdk;
try {
 sdk = await import(sdkModulePath);
 sdk.defineAfricaniesElements();
 document.documentElement.dataset.sdk='registered';
} catch {
 // A static playground copy can still render; production builds must make the SDK bundle reachable.
 document.documentElement.dataset.sdk='unavailable';
}
const app=document.querySelector('#app'); if(!app) throw new Error('Missing #app root'); app.innerHTML=renderShell();
const jsonStorage={get(key){try{const value=localStorage.getItem(key);return value===null?null:JSON.parse(value);}catch{return null;}},set(key,value){localStorage.setItem(key,JSON.stringify(value));}};
const themeService=sdk ? new sdk.ThemeService({document,storage:jsonStorage,storageKey:'africanies-playground-theme'}) : null;
const responseCache=sdk ? new sdk.HttpResponseCache() : null;
const shippingModeService=sdk ? new sdk.ShippingModeService(undefined,responseCache) : null;
const modeColorService=sdk ? new sdk.ModeColorService(shippingModeService) : null;
const toastService=sdk ? new sdk.ToastService({document}) : null;
const modalService=sdk ? new sdk.ModalService({document}) : null;
const drawerService=sdk ? new sdk.DrawerService({document}) : null;
const confirmService=sdk ? new sdk.ConfirmService(modalService) : null;
const filterQueryService=sdk ? new sdk.FilterQueryService(history,location) : null;
const filterResolver={resolve:async()=>({shipment_status:[{label:'In process',value:'in-process'}]})};
const filterDrawerService=sdk ? new sdk.FilterDrawerService(drawerService,filterQueryService,filterResolver) : null;
const notificationAdapter={list:async page=>({data:[{id:`notice-${page}`,title:'Shipment update',message:'AFR-102948 departed Lagos',read:false}],has_next_page:page<2}),markRead:async id=>({id,read:true})};
const notificationDrawerService=sdk ? new sdk.NotificationDrawerService(drawerService,notificationAdapter) : null;
const state={mode:shippingModeService?.getMode()||'sfn',theme:themeService?.getTheme()||'light',lastFocus:null};
const $=(selector,root=document)=>root.querySelector(selector);
const path=()=>location.hash.replace(/^#/,'')||'/overview';

function syncTheme(){ document.documentElement.dataset.theme=state.theme; document.documentElement.classList.toggle('dark',state.theme==='dark'); const el=$('#theme-toggle'); if(el){el.textContent=state.theme==='dark'?'☀':'☾';el.setAttribute('aria-label',`Use ${state.theme==='dark'?'light':'dark'} theme`);} }
function syncMode(){ const element=$('#shipping-mode-switch');if(!element)return;element.controller=shippingModeService;element.setAttribute('mode',shippingModeService?.getMode()??state.mode);document.documentElement.dataset.shippingMode=element.getAttribute('mode');}
function closeMobile(){ const panel=$('#mobile-navigation'); const toggle=$('#mobile-navigation-toggle'); if(panel)panel.hidden=true;if(toggle){toggle.setAttribute('aria-expanded','false');} }
function renderRoute(){ const pathname=path(), matched=matchRoute(pathname), target=$('#route-view'); if(!target)return; target.innerHTML=matched?matched.route.render(matched.params):'<article class="not-found"><p class="eyebrow">404</p><h2>Page not found</h2><p>The requested playground route is unavailable.</p><a href="#/overview">Return to overview</a></article>'; updateBreadcrumbs(pathname);updateActiveLinks(pathname);closeMobile();target.scrollIntoView({block:'start'});configureSdkDemos();bindRoute(); }

export function showToast(tone='success',title='Shipment saved'){if(toastService){toastService.show({variant:tone==='danger'?'danger':tone,message:tone==='danger'?'Please try again.':'Your action completed successfully.',title});return;}const region=$('#toast-region');if(!region)return;const item=document.createElement('article');item.className=utilities('toast',tone);item.innerHTML=`<strong>${title}</strong>`;region.append(item);}
export function openOverlay(kind='modal',trigger=document.activeElement){ state.lastFocus=trigger; const root=$('#overlay-root');if(!root)return; const drawer=kind==='drawer';root.innerHTML=applyUtilities(`<div class="overlay-backdrop" data-overlay-backdrop><section class="overlay ${drawer?'drawer':''}" role="dialog" aria-modal="true" aria-labelledby="overlay-title"><header><div><p class="eyebrow">${kind==='confirm'?'CONFIRM ACTION':'SHIPMENT'}</p><h2 id="overlay-title">${kind==='confirm'?'Cancel shipment?':drawer?'Shipment details':'Create shipment'}</h2></div><button class="icon-button" data-overlay-close aria-label="Close dialog">×</button></header><div class="overlay-body"><p>${kind==='confirm'?'This cannot be undone. The customer will be notified.':'Keep focused work visible without leaving the current route.'}</p>${kind==='modal'?'<label><span>Shipment name</span><input class="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800" autofocus placeholder="Weekly stock"></label>':''}</div><footer>${btnHtml('Cancel','secondary','data-overlay-close')}${btnHtml(kind==='confirm'?'Cancel shipment':'Continue',kind==='confirm'?'danger':'primary','data-overlay-action')}</footer></section></div>`); const dialog=root.querySelector('[role="dialog"]');(dialog.querySelector('[autofocus]')||dialog.querySelector('button'))?.focus(); }
const btnHtml=(label,variant,attrs)=>`<button type="button" class="${utilities('sdk-button',variant)}" ${attrs}>${label}</button>`;
function closeOverlay(){ const root=$('#overlay-root');if(root)root.innerHTML='';state.lastFocus?.focus?.();state.lastFocus=null; }

function configureSdkDemos(){
 const actionMenu=$('[data-sdk-action-menu]'); if(actionMenu){actionMenu.items=[{id:'view',label:'View shipment'},{id:'duplicate',label:'Duplicate'},{id:'cancel',label:'Cancel shipment',danger:true}];actionMenu.open=true;}
 const select=$('[data-sdk-select]'); if(select) select.options=[{label:'Express air',value:'express'},{label:'Ocean freight',value:'ocean'}];
 const combo=$('[data-sdk-combobox]'); if(combo) combo.options=[{label:'Nigeria',value:'NG'},{label:'Kenya',value:'KE'},{label:'Ghana',value:'GH'}];
 const table=$('[data-sdk-table]'); if(table){table.columns=[{key:'tracking',label:'Tracking',sortable:true},{key:'status',label:'Status',sortable:true},{key:'route',label:'Route'}];table.rows=[{tracking:'AFR-102948',status:'In transit',route:'LOS → NBO'},{tracking:'AFR-102771',status:'Delivered',route:'ACC → LOS'}];}
 const stepper=$('[data-sdk-stepper]'); if(stepper){stepper.steps=[{id:'address',label:'Addresses'},{id:'package',label:'Package'},{id:'service',label:'Service'},{id:'review',label:'Review'}];stepper.activeIndex=1;}
 const tabs=$('[data-sdk-tabs]'); if(tabs){tabs.tabs=[{id:'overview',label:'Overview'},{id:'documents',label:'Documents'},{id:'events',label:'Events'}];tabs.selected=path().split('/').at(-1);}
 const segment=$('[data-sdk-segment]'); if(segment){segment.tabs=[{id:'all',label:'All'},{id:'active',label:'Active'}];segment.selected='all';}
 const breadcrumb=$('[data-sdk-breadcrumb]'); if(breadcrumb) breadcrumb.items=[{href:'#/overview',label:'Home'},{href:path(),label:'Navigation',current:true}];
 const filterPanel=$('[data-sdk-filter-panel]'); if(filterPanel){filterPanel.initial={shipment_status:'in-process'};filterPanel.resolveOptions=()=>filterResolver.resolve(sdk.trackShipmentsFilterConfig);filterPanel.addEventListener('filter-apply',event=>{const output=$('#sdk-filter-output');if(output)output.textContent=JSON.stringify(event.detail);});}
 const notificationPanel=$('[data-sdk-notification-panel]'); if(notificationPanel){notificationPanel.adapter=notificationAdapter;void notificationPanel.loadMore();}
 const parentOutput=$('#sdk-parent-output'); if(parentOutput&&sdk){const snapshot={url:['components'],firstChild:{url:['navigation'],firstChild:{url:['overview']}}};parentOutput.textContent=`parent: ${sdk.resolveParentPathFromRootSnapshot(snapshot)} · back: ${JSON.stringify(sdk.resolveContentBackTarget('/components/navigation','/components/navigation/overview'))}`;}
 const greetingOutput=$('#sdk-greeting-output'); if(greetingOutput&&sdk) greetingOutput.textContent=JSON.stringify(sdk.pickHeaderGreeting('Amara Okafor',new Date('2026-08-28T09:00:00'),{kind:'clear',temperatureC:27,city:'Lagos'}));
 const model=$('#sdk-model-output'); if(model&&sdk) model.textContent=JSON.stringify({emptyFilter:sdk.emptyFilterState(),vendors:sdk.DELIVERY_VENDORS?.slice(0,3)},null,2);
 const api=$('#sdk-api-output'); if(api&&sdk) api.textContent=JSON.stringify({validEmail:sdk.isValidEmail('ops@africanies.com'),mode:sdk.asShippingMode('sfn'),csv:sdk.toCsvString({headers:['tracking','status'],rows:[['AFR-1','ready']]})},null,2);
}

function bindRoute(){
 document.querySelectorAll('.dismiss-alert').forEach(x=>x.onclick=()=>x.closest('.alert')?.remove()); document.querySelectorAll('.remove-chip').forEach(x=>x.onclick=()=>x.closest('.chip')?.remove());
 document.querySelectorAll('[data-open-overlay]').forEach(x=>x.onclick=()=>openOverlay(x.dataset.openOverlay,x)); document.querySelectorAll('[data-toast]').forEach(x=>x.onclick=()=>showToast(x.dataset.toast,`${x.dataset.toast[0].toUpperCase()+x.dataset.toast.slice(1)} notification`));
 const menu=$('[data-action-menu]');if(menu)menu.onclick=()=>{const pop=menu.nextElementSibling,open=pop.hidden;pop.hidden=!open;menu.setAttribute('aria-expanded',String(open));if(open)pop.querySelector('[role="menuitem"]')?.focus();};
 document.querySelectorAll('[data-feedback]').forEach(control=>control.onclick=()=>{document.querySelectorAll('[data-feedback]').forEach(x=>x.setAttribute('aria-pressed',String(x===control)));const preview=$('#feedback-preview'),s=control.dataset.feedback;const values={loading:['<span class="large-spinner"></span>','Loading shipments','This will only take a moment.'],empty:['◇','No shipments yet','Create a shipment to get started.'],error:['!','Unable to load shipments','Check your connection and try again.'],success:['✓','Shipments loaded','Everything is up to date.']}[s];preview.className=utilities('feedback-state',s);preview.innerHTML=applyUtilities(`<span class="feedback-symbol">${values[0]}</span><strong>${values[1]}</strong><p>${values[2]}</p>${s==='error'?btnHtml('Try again','secondary','data-feedback="loading"'):''}`);});
 document.querySelectorAll('[data-demo-submit]').forEach(x=>x.onclick=e=>{e.preventDefault();showToast('success','Details saved');}); document.querySelectorAll('.copy-code').forEach(x=>x.onclick=async()=>{try{await navigator.clipboard.writeText(x.dataset.copy);showToast('success','Code copied');}catch{showToast('danger','Copy failed');}});
 document.querySelectorAll('[data-sort]').forEach(control=>control.onclick=()=>{const body=control.closest('table')?.querySelector('tbody'),index=control.closest('th')?.cellIndex??0;if(!body)return;const rows=[...body.rows].sort((a,b)=>a.cells[index]?.textContent.localeCompare(b.cells[index]?.textContent));body.replaceChildren(...rows);control.textContent=control.textContent.replace('↕','↑');});
 document.querySelectorAll('.table-tools .sdk-button').forEach(control=>control.onclick=()=>showToast('success',`CSV ready · ${sdk?.toCsvString?.([['tracking','status'],['AFR-102948','in_transit']]).length??0} bytes`));
 document.querySelectorAll('.pagination button:not([disabled])').forEach(control=>control.onclick=()=>{const label=control.parentElement?.querySelector('span');if(label)label.textContent='Page 2 of 3';});
 $('[data-clear-filters]')?.addEventListener('click',()=>{document.querySelectorAll('.filter-bar input').forEach(input=>{input.value='';});showToast('info','Host filters cleared');});
 const iconSearch=$('[data-icon-search]');if(iconSearch)iconSearch.oninput=()=>document.querySelectorAll('[data-icon-name]').forEach(x=>x.hidden=!x.dataset.iconName.includes(iconSearch.value.toLowerCase()));
 document.querySelectorAll('[data-sdk-overlay]').forEach(control=>control.onclick=async()=>{const kind=control.dataset.sdkOverlay;if(kind==='confirm'){const result=await confirmService?.confirm({title:'Cancel shipment?',message:'This action cannot be undone.',danger:true});showToast('info',`SDK confirm result: ${String(result)}`);return;}const service=kind==='drawer'?drawerService:modalService;service?.open(({document:owner,ref})=>{const frame=owner.createElement('africanies-overlay-frame');frame.innerHTML='<strong slot="header">SDK overlay</strong><p>Opened by the SDK overlay service.</p><button slot="footer" type="button">Close</button>';frame.querySelector('button')?.addEventListener('click',()=>ref.close('closed'));return frame;},{dismissible:true});});
 document.querySelectorAll('[data-sdk-toast]').forEach(control=>control.onclick=()=>{const kind=control.dataset.sdkToast;if(kind==='stack'){toastService?.success('Duplicate notification','SDK toast');toastService?.success('Duplicate notification','SDK toast');}else if(kind==='error')toastService?.error('Persistent SDK error','Action failed');else toastService?.success('Shipment saved','SDK toast');});
 $('[data-sdk-with-toast]')?.addEventListener('click',()=>{const output=$('#sdk-with-toast-output');if(output)output.textContent=JSON.stringify(sdk.withToast({successMessage:'Shipment saved',errorMessage:'Shipment failed'}));});
 $('[data-sdk-filter-drawer]')?.addEventListener('click',()=>{const ref=filterDrawerService?.open(sdk.trackShipmentsFilterConfig);void ref?.closed.then(result=>{const output=$('#sdk-filter-output');if(output)output.textContent=JSON.stringify(result??{});});});
 $('[data-sdk-notifications]')?.addEventListener('click',()=>{notificationDrawerService?.open();});
 $('[data-sdk-confirm-retry]')?.addEventListener('click',()=>{let attempts=0;const output=$('#sdk-confirm-output');const onError=()=>{if(output)output.textContent='Async error surfaced · retry available';};document.addEventListener('confirm-error',onError,{once:true});void confirmService?.confirm({title:'Retryable confirmation',message:'The first attempt fails; retry succeeds.',confirmLabel:'Run async work',onConfirm:async()=>{attempts+=1;await Promise.resolve();if(attempts===1)throw new Error('Simulated transient failure');}}).then(result=>{if(output)output.textContent=`Confirmed after retry: ${result}`;});});
 $('[data-sdk-form-submit]')?.addEventListener('click',event=>{event.preventDefault();const form=event.currentTarget.closest('form');const output=$('#sdk-form-output');if(output)output.textContent=JSON.stringify(Object.fromEntries(new FormData(form)),null,2);});
 $('[data-sdk-filter-apply]')?.addEventListener('click',()=>{const params=sdk?.toFilterParams?.({search:'Lagos',order:'desc',values:{shipment_status:'in-process'}},sdk.trackShipmentsFilterConfig);const output=$('#sdk-filter-output');if(output)output.textContent=JSON.stringify(params);});
 $('[data-sdk-filter-clear]')?.addEventListener('click',()=>{const output=$('#sdk-filter-output');if(output)output.textContent=JSON.stringify(sdk?.emptyFilterState?.()??{});});
 $('[data-sdk-icons]')?.addEventListener('click',async()=>{const output=$('#sdk-icon-output');try{const spriteUrl=sdkModulePath.startsWith('../sdk/')?'../sdk/icons.sprite.svg':'/packages/icons/assets/icons.sprite.svg';const registry=new sdk.IconRegistryService({document,fetch,spriteUrl});await registry.ensureLoaded();if(output)output.textContent=`SDK sprite loaded · ${sdk.ICON_NAMES.length} names`;}catch(error){if(output)output.textContent=`SDK sprite error · ${sdk.formatApiErrorMessage(error)}`;}});
}

$('#theme-toggle').onclick=()=>{state.theme=themeService?.toggle()??(state.theme==='light'?'dark':'light');syncTheme();};
$('#shipping-mode-switch')?.addEventListener('mode-change',event=>{state.mode=event.detail.mode;document.documentElement.dataset.shippingMode=state.mode;toastService?.info(`${state.mode==='sfn'?'Export':'Import'} mode enabled`,'SDK mode service');});
$('#mobile-navigation-toggle').onclick=()=>{const panel=$('#mobile-navigation'),open=panel.hidden;panel.hidden=!open;$('#mobile-navigation-toggle').setAttribute('aria-expanded',String(open));if(open)$('#mobile-navigation-close')?.focus();};$('#mobile-navigation-close').onclick=closeMobile;
$('#notifications').onclick=()=>showToast('info','No new notifications');$('#access-token').onclick=()=>openOverlay('modal',$('#access-token'));
document.addEventListener('click',e=>{if(e.target.matches('[data-overlay-close],[data-overlay-backdrop]'))closeOverlay();if(e.target.matches('[data-overlay-action]')){closeOverlay();showToast('success','Action completed');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeOverlay();closeMobile();const menu=$('[data-action-menu][aria-expanded="true"]');if(menu){menu.nextElementSibling.hidden=true;menu.setAttribute('aria-expanded','false');menu.focus();}}if(e.key==='Tab'){const dialog=$('[role="dialog"]');if(dialog){const focus=[...dialog.querySelectorAll('button,input,[href]')];if(!focus.length)return;const first=focus[0],last=focus.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}});
setInterval(()=>{const el=$('#clock');if(el)el.textContent=new Intl.DateTimeFormat('en',{hour:'2-digit',minute:'2-digit'}).format(new Date());},1000);
addEventListener('hashchange',renderRoute);syncTheme();syncMode();renderRoute();
