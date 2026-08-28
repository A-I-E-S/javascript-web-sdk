const groups = [
  ['GETTING STARTED',[['Overview','/overview'],['Lecture','/lecture']]],
  ['COMPONENTS',[['Button','/components/button'],['Alert','/components/alert'],['Chip','/components/chip'],['Action menu','/components/action-menu'],['Feedback','/components/feedback'],['Overlays','/components/overlays'],['Forms','/components/forms'],['Filters','/components/filters'],['Tooltip','/components/tooltip'],['Toast','/components/toast'],['Table','/components/table'],['Stepper','/components/stepper'],['Navigation','/components/navigation/overview']]],
  ['USE CASES',[['Shipments','/usecases/shipment'],['Onboarding','/usecases/onboarding/login']]],
  ['FOUNDATIONS',[['Icons','/icons'],['Tokens','/tokens'],['Models','/models'],['SDK API','/api']]]
];
const nav = () => groups.map(([title,items])=>`<section class="nav-group"><h2 class="mb-2 px-2.5 text-[10px] font-bold tracking-[.12em] text-slate-400">${title}</h2><ul class="m-0 grid list-none gap-0.5 p-0">${items.map(([label,path])=>`<li><a class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 font-medium text-slate-600 hover:bg-slate-50 aria-[current=page]:bg-blue-50 aria-[current=page]:font-bold aria-[current=page]:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:aria-[current=page]:bg-slate-800 dark:aria-[current=page]:text-blue-300" data-nav-link href="#${path}"><span class="nav-mark">◇</span>${label}</a></li>`).join('')}</ul></section>`).join('');

export function renderShell() {
 return applyUtilities(`<div class="layout">
  <aside id="side-nav" class="sticky top-0 h-screen overflow-auto border-r border-slate-200 bg-white px-4 py-6 max-[900px]:hidden dark:border-slate-700 dark:bg-slate-900" aria-label="Catalog"><a class="brand" href="#/overview"><span class="brand-mark">A</span><span><strong class="block text-[13px] tracking-wide">AFRICANIES</strong><small class="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">Web SDK</small></span></a><nav>${nav()}</nav><div class="sidebar-footer"><span class="status-dot"></span><span><strong class="block text-xs">Vanilla JavaScript</strong><small class="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">Framework independent</small></span></div></aside>
  <div id="mobile-navigation" class="mobile-nav-backdrop" hidden><nav class="mobile-nav" aria-label="Mobile catalog"><div class="mobile-nav-head"><a class="brand" href="#/overview"><span class="brand-mark">A</span><strong>AFRICANIES</strong></a><button id="mobile-navigation-close" class="icon-button" aria-label="Close navigation">×</button></div>${nav()}</nav></div>
  <main id="content" class="min-w-0"><header class="header"><div class="flex min-w-0 items-center gap-3 max-[900px]:flex-1"><button id="mobile-navigation-toggle" class="icon-button hamburger" aria-label="Open navigation" aria-expanded="false">☰</button><div class="header-title"><div id="breadcrumbs" class="flex gap-1.5 text-[11px] text-slate-500 dark:text-slate-400"></div><strong id="page-title" class="mt-1 block text-[15px]">Overview</strong></div></div><div class="context"><span class="weather">Lagos&nbsp; 27°C</span><span class="clock" id="clock">--:--</span></div><div class="toolbar"><button id="access-token" class="pill max-[520px]:hidden" type="button">Access token</button><africanies-shipping-mode-switch id="shipping-mode-switch" collapsed mode="sfn"></africanies-shipping-mode-switch><button id="theme-toggle" class="icon-button" type="button" aria-label="Use dark theme">☾</button><button id="notifications" class="icon-button" type="button" aria-label="Notifications">♢<span class="notification-dot"></span></button><button id="account-menu" class="account" type="button" aria-haspopup="menu" aria-expanded="false"><span class="avatar">AO</span><span class="max-[520px]:hidden"><strong class="block text-[11px]">Amara Okafor</strong><small class="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">Operations</small></span><span class="max-[520px]:hidden">⌄</span></button></div></header>
  <section id="route-view" class="mx-auto max-w-[1200px] px-11 pb-20 pt-12 max-[900px]:px-7 max-[900px]:pb-[70px] max-[900px]:pt-9 max-[520px]:px-4 max-[520px]:pb-16 max-[520px]:pt-7" tabindex="-1"></section></main>
  <div id="overlay-root"></div><section id="toast-region" class="fixed right-5 top-[88px] z-40 grid gap-2.5 max-[520px]:right-3 max-[520px]:top-20" aria-label="Notifications" aria-live="polite"></section>
 </div>`);
}

const title = path => path.split('/').filter(Boolean).at(-1)?.replaceAll('-',' ').replace(/\b\w/g,m=>m.toUpperCase()) ?? 'Overview';
export function updateBreadcrumbs(pathname, root=document) {
 const parts=pathname.split('/').filter(Boolean).map(x=>x.replaceAll('-',' ').replace(/\b\w/g,m=>m.toUpperCase()));
 const el=root.querySelector('#breadcrumbs'); if(el) el.innerHTML=`<a href="#/overview">Home</a>${parts.map(x=>`<span>›</span><span>${x}</span>`).join('')}`;
 const heading=root.querySelector('#page-title'); if(heading) heading.textContent=title(pathname);
}
export function updateActiveLinks(pathname, root=document) {
 root.querySelectorAll('[data-nav-link]').forEach(link=>{ const href=link.getAttribute('href')?.slice(1)??''; const active=href===pathname || (href==='/components/navigation/overview'&&pathname.startsWith('/components/navigation/')) || (href==='/usecases/onboarding/login'&&pathname.startsWith('/usecases/onboarding/')); if(active) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current'); });
}
import { applyUtilities } from './styles.mjs';
