const icon = (name, size = 16, className = '') => `<africanies-icon name="${name}" size="${size}" class="${className}" aria-hidden="true"></africanies-icon>`;
const badge = (visible) => visible ? '<span class="pointer-events-none absolute right-1.5 top-1 h-2 w-2"><span class="absolute inset-0 animate-ping rounded-full bg-danger"></span><span class="absolute inset-0 rounded-full bg-danger ring-2 ring-white dark:ring-ink"></span></span>' : '';

export const DISABLED_ROUTES = new Set(['/models', '/api']);
export const NAV_ITEMS = Object.freeze([
  { id: 'overview', label: 'Overview', icon: 'home', href: '/overview' },
  {
    id: 'components',
    label: 'Components',
    icon: 'grid',
    children: [
      { id: 'button', label: 'Button', href: '/components/button' },
      { id: 'alert', label: 'Alert', href: '/components/alert' },
      { id: 'chip', label: 'Chip', href: '/components/chip' },
      { id: 'action-menu', label: 'Action menu', href: '/components/action-menu' },
      { id: 'feedback', label: 'Feedback', href: '/components/feedback' },
      { id: 'overlays', label: 'Overlays', href: '/components/overlays' },
      { id: 'forms', label: 'Forms', href: '/components/forms' },
      { id: 'filters', label: 'Filters', href: '/components/filters' },
      { id: 'tooltip', label: 'Tooltip', href: '/components/tooltip' },
      { id: 'toast', label: 'Toast', href: '/components/toast' },
      { id: 'navigation', label: 'Navigation', href: '/components/navigation/overview' },
      { id: 'table', label: 'Table', href: '/components/table' },
      { id: 'stepper', label: 'Stepper', href: '/components/stepper' }
    ]
  },
  {
    id: 'usecases',
    label: 'Use cases',
    icon: 'truck',
    children: [
      { id: 'back-breadcrumbs', label: 'Back button and Breadcrumbs', href: '/usecases/shipment' },
      { id: 'onboarding-forgot', label: 'Forgot password', href: '/usecases/onboarding/login' }
    ]
  },
  {
    id: 'foundation',
    label: 'Foundation',
    icon: 'cube',
    children: [
      { id: 'icons', label: 'Icons', href: '/icons' },
      { id: 'tokens', label: 'Tokens', href: '/tokens' }
    ]
  },
  {
    id: 'learn',
    label: 'Learn',
    icon: 'book',
    children: [
      { id: 'lecture', label: 'Lecture', href: '/lecture' }
    ]
  }
]);

const matchHref = (pathname, href) => {
  if (!href) return false;
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  if (href.endsWith('/overview')) return pathname === href.slice(0, -9) || pathname.startsWith(`${href.slice(0, -9)}/`);
  if (href.endsWith('/login')) return pathname === href.slice(0, -6) || pathname.startsWith(`${href.slice(0, -6)}/`);
  return false;
};

const findTrail = (pathname, items = NAV_ITEMS, trail = []) => {
  for (const item of items) {
    const nextTrail = [...trail, item];
    if (item.children?.length) {
      const childTrail = findTrail(pathname, item.children, nextTrail);
      if (childTrail) return childTrail;
    }
    if (matchHref(pathname, item.href)) return nextTrail;
  }
  return null;
};

const humanize = (value) => value.split('/').filter(Boolean).at(-1)?.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) ?? 'Overview';

const renderDesktopItem = (item) => {
  if (!item.children?.length) {
    return `<li class="relative" data-nav-item="${item.id}"><a href="#${item.href}" class="group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-background-welcome hover:text-ink dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white" data-nav-link data-nav-row data-nav-id="${item.id}"><span class="inline-flex size-5 shrink-0 items-center justify-center">${icon(item.icon, 16)}</span><span class="nav-label min-w-0 flex-1 truncate">${item.label}</span>${badge(item.badge)}</a></li>`;
  }
  return `<li class="group relative" data-nav-item="${item.id}">
    <button type="button" class="group relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-background-welcome hover:text-ink dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white" data-nav-parent="${item.id}" data-nav-row data-nav-id="${item.id}" aria-expanded="true">
      <span class="inline-flex size-5 shrink-0 items-center justify-center">${icon(item.icon, 16)}</span>
      <span class="nav-label min-w-0 flex-1 truncate text-left">${item.label}</span>
      ${icon('chevron-down', 14, 'nav-chevron shrink-0 opacity-70 transition-transform duration-200')}
      ${badge(item.badge)}
    </button>
    <div data-nav-children="${item.id}" class="grid transition-[grid-template-rows] duration-200 ease-out" style="grid-template-rows:1fr">
      <ul class="relative m-0 mt-0.5 min-h-0 list-none space-y-0.5 overflow-hidden py-1 pl-4 before:absolute before:bottom-1 before:left-[1.35rem] before:top-0 before:w-px before:bg-border dark:before:bg-white/15">
        ${item.children.map((child) => `<li><a href="#${child.href}" class="relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-background-welcome hover:text-ink dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white" data-nav-link data-nav-child="${item.id}" data-nav-row data-nav-id="${child.id}"><span class="min-w-0 flex-1 truncate">${child.label}</span>${badge(child.badge)}</a></li>`).join('')}
      </ul>
    </div>
    <div data-nav-flyout="${item.id}" class="pointer-events-none absolute left-full top-0 z-50 ml-2 hidden min-w-[11rem] overflow-hidden rounded-md border border-border bg-ink text-white shadow-overlay">
      <div class="absolute inset-y-0 left-0 w-1 bg-export" data-mode-flyout></div>
      <div class="border-b border-white/10 px-3 py-2 pl-4"><p class="m-0 text-sm font-semibold">${item.label}</p></div>
      <ul class="m-0 list-none space-y-0.5 p-1.5">
        ${item.children.map((child) => `<li><a href="#${child.href}" class="relative flex items-center gap-2 rounded px-2.5 py-1.5 text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white" data-nav-link data-nav-child="${item.id}" data-nav-flyout-link="${child.id}">${child.label}${badge(child.badge)}</a></li>`).join('')}
      </ul>
    </div>
  </li>`;
};

const renderMobileItem = (item) => {
  if (!item.children?.length) return `<li><a href="#${item.href}" class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-background-welcome hover:text-ink dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white" data-nav-link data-nav-mobile-id="${item.id}"><span class="inline-flex size-5 shrink-0 items-center justify-center">${icon(item.icon, 16)}</span><span class="min-w-0 flex-1 truncate">${item.label}</span>${badge(item.badge)}</a></li>`;
  return `<li>
    <button type="button" class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-background-welcome hover:text-ink dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white" data-nav-mobile-parent="${item.id}" aria-expanded="true">
      <span class="inline-flex size-5 shrink-0 items-center justify-center">${icon(item.icon, 16)}</span>
      <span class="min-w-0 flex-1 truncate text-left">${item.label}</span>
      ${icon('chevron-down', 14, 'shrink-0 opacity-70 transition-transform duration-200')}
    </button>
    <div data-nav-mobile-children="${item.id}" class="grid transition-[grid-template-rows] duration-200 ease-out" style="grid-template-rows:1fr">
      <ul class="m-0 list-none space-y-0.5 overflow-hidden pb-1 pl-8 pt-1">
        ${item.children.map((child) => `<li><a href="#${child.href}" class="relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-background-welcome hover:text-ink dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white" data-nav-link data-nav-mobile-id="${child.id}">${child.label}${badge(child.badge)}</a></li>`).join('')}
      </ul>
    </div>
  </li>`;
};

export function renderShell() {
  return `<div class="relative flex h-[100dvh] overflow-hidden bg-background-welcome text-ink dark:bg-ink-950 dark:text-white">
    <div id="mobile-navigation" class="fixed inset-0 z-40 hidden lg:hidden" hidden>
      <button id="mobile-navigation-backdrop" type="button" class="absolute inset-0 bg-ink/40" aria-label="Close navigation"></button>
      <aside class="relative flex h-full w-[15rem] flex-col overflow-hidden border-r border-border bg-white dark:border-white/10 dark:bg-ink" aria-label="Catalog">
        <div class="flex items-center justify-between gap-3 border-b border-border px-4 py-3 dark:border-white/10">
          <img src="/assets/africanies-ui/brand/africanies-logo.svg" alt="African Import Export Solutions" class="h-9 w-auto object-contain object-left">
          <button id="mobile-navigation-close" type="button" class="inline-flex size-8 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-background-welcome hover:text-ink dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white" aria-label="Close navigation">${icon('close', 16)}</button>
        </div>
        <nav class="africanies-overlay-scroll flex-1 overflow-y-auto px-3 py-3"><ul class="m-0 flex list-none flex-col gap-0.5 p-0">${NAV_ITEMS.map(renderMobileItem).join('')}</ul></nav>
      </aside>
    </div>

    <aside id="side-nav" class="sticky top-0 z-20 hidden h-[100dvh] shrink-0 border-r border-border bg-white transition-[width] duration-200 ease-out lg:flex lg:flex-col dark:border-white/10 dark:bg-ink" aria-label="Catalog" data-collapsed="false" style="width:15rem">
      <div class="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-export transition-colors" id="side-nav-accent" aria-hidden="true"></div>
      <div class="flex shrink-0 items-center gap-2 border-b border-border py-3 pl-4 pr-2 dark:border-white/10">
        <div class="min-w-0 flex-1" id="brand-full"><img src="/assets/africanies-ui/brand/africanies-logo.svg" alt="African Import Export Solutions" class="h-9 max-w-full object-contain object-left"></div>
        <div class="hidden min-w-0 flex-1 justify-center" id="brand-mini">${icon('mini-partner', 24)}</div>
        <button id="side-nav-collapse" type="button" class="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-background-welcome hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white" aria-label="Collapse navigation" aria-expanded="true">${icon('angle-double-left', 16, 'collapse-icon')}</button>
      </div>
      <nav class="africanies-overlay-scroll relative flex-1 overflow-y-auto overflow-x-visible px-3 py-3">
        <button id="side-nav-collapse-all" type="button" class="absolute right-1.5 top-1.5 z-10 inline-flex size-7 items-center justify-center rounded-md bg-white text-neutral-500 shadow-card ring-1 ring-border/80 transition-colors hover:bg-background-welcome hover:text-ink dark:bg-ink dark:text-neutral-400 dark:ring-white/15 dark:hover:bg-white/10 dark:hover:text-white" aria-label="Collapse all">${icon('compress', 14)}</button>
        <ul class="m-0 flex list-none flex-col gap-0.5 p-0">${NAV_ITEMS.map(renderDesktopItem).join('')}</ul>
      </nav>
    </aside>

    <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div class="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2 dark:border-white/10 lg:hidden">
        <button id="mobile-navigation-toggle" type="button" class="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-ink transition-colors hover:bg-background-welcome dark:border-white/15 dark:text-white dark:hover:bg-white/10 lg:hidden" aria-label="Open navigation" aria-expanded="false">${icon('align-justify', 18)}</button>
        <img src="/assets/africanies-ui/brand/africanies-logo.svg" alt="African Import Export Solutions" class="h-7 w-auto object-contain">
      </div>

      <header class="header sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur-md dark:border-white/10 dark:bg-ink-950/90">
        <div class="flex min-w-0 items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
          <div class="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div class="min-w-0 overflow-hidden">
              <p id="header-kicker" class="m-0 truncate text-[0.75rem] leading-none text-neutral-500 dark:text-neutral-400">Morning momentum.</p>
              <p id="header-name" class="m-0 mt-1 truncate text-base font-semibold leading-none tracking-tight text-ink sm:text-lg dark:text-white">Amara</p>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <div class="hidden items-center gap-3 pr-2 sm:flex sm:border-r sm:border-border sm:pr-4 dark:sm:border-white/15">
              <div id="header-weather" class="flex items-center gap-1.5" aria-live="polite">
                ${icon('sun-o', 18, 'text-neutral-500 dark:text-neutral-400')}
                <span id="header-weather-temp" class="text-sm font-medium tabular-nums tracking-tight text-ink dark:text-white">--°</span>
                <span id="header-weather-place" class="hidden text-[0.75rem] text-neutral-500 md:inline dark:text-neutral-400">Loading…</span>
              </div>
              <div class="flex items-baseline gap-2" aria-live="polite">
                <time id="header-date" class="hidden text-[0.75rem] text-neutral-500 md:inline dark:text-neutral-400"></time>
                <time id="header-clock" class="text-sm font-medium tabular-nums tracking-tight text-ink dark:text-white">--:--</time>
              </div>
            </div>

            <div class="relative">
              <button id="access-token" type="button" class="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-background-welcome dark:border-white/15 dark:bg-ink dark:text-white dark:hover:bg-white/10" aria-expanded="false" aria-controls="access-token-panel">
                <span id="access-token-dot" class="size-1.5 shrink-0 rounded-full bg-warning shadow-[0_0_0_2px] shadow-warning/25" aria-hidden="true"></span>
                <span id="access-token-label">API token</span>
                ${icon('chevron-down', 12, 'shrink-0 text-neutral-500 transition-transform duration-200 dark:text-neutral-400')}
              </button>
              <div id="access-token-panel" class="absolute right-0 top-[calc(100%+0.5rem)] z-40 hidden w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-white shadow-overlay outline-none dark:border-white/15 dark:bg-ink-950">
                <div class="flex items-start justify-between gap-3 border-b border-border px-4 py-3 dark:border-white/10"><div class="flex min-w-0 items-start gap-3"><div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background-welcome text-ink dark:bg-white/10 dark:text-white">${icon('key', 16)}</div><div class="min-w-0"><h2 class="m-0 text-sm font-semibold text-ink dark:text-white">API access</h2><p class="m-0 mt-0.5 truncate font-mono text-[0.75rem] text-neutral-500 dark:text-neutral-400">local playground token</p></div></div><button type="button" id="access-token-panel-close" class="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-background-welcome hover:text-ink dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white" aria-label="Close">${icon('close', 16)}</button></div>
                <div class="flex flex-col gap-4 p-4"><p id="access-token-message" class="m-0 rounded-lg bg-warning-subtle px-3 py-2 text-sm text-ink dark:bg-warning/15 dark:text-white">Live SDK calls need a bearer token from the test API.</p><label class="flex flex-col gap-2 text-sm font-medium text-ink dark:text-white">Access token<textarea id="access-token-input" rows="3" class="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink outline-none ring-export/30 transition focus:ring-2 dark:border-white/15 dark:bg-ink dark:text-white" placeholder="******"></textarea></label></div>
                <div class="flex items-center justify-between gap-2 border-t border-border bg-background-welcome px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]"><button type="button" id="access-token-clear" class="inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-white hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white">Clear token</button><button type="button" id="access-token-save" class="inline-flex min-h-9 items-center justify-center rounded-lg bg-export px-3 text-sm font-semibold text-white transition-colors hover:bg-export-light">Save &amp; connect</button></div>
              </div>
            </div>

            <div id="shipping-mode-switch" class="inline-flex rounded-lg border border-border p-0.5 dark:border-white/15" role="group" aria-label="Import or export mode">
              <button id="shipping-mode-import" type="button" class="rounded-md px-3 py-2 text-sm font-medium transition-colors" data-mode="stn">Import</button>
              <button id="shipping-mode-export" type="button" class="rounded-md px-3 py-2 text-sm font-medium transition-colors" data-mode="sfn">Export</button>
            </div>

            <button id="theme-toggle" type="button" class="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-background-welcome dark:border-white/15 dark:bg-ink dark:text-white dark:hover:bg-white/10" aria-label="Switch to dark theme">${icon('adjust', 14)}<span id="theme-toggle-label">Dark</span></button>

            <button id="notifications" type="button" class="relative inline-flex size-9 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-background-welcome hover:text-ink dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white" aria-label="Open notifications">${icon('bell-o', 24, 'block translate-x-[-1px] translate-y-0.5')}<span id="notification-badge" class="pointer-events-none absolute -right-0.5 -top-0.5 hidden h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white dark:ring-ink-950"></span></button>

            <div class="relative">
              <button id="account-menu" type="button" class="inline-flex items-center gap-2 rounded-lg pl-1 pr-2 text-left text-sm text-ink transition-colors hover:bg-background-welcome dark:text-white dark:hover:bg-white/10" aria-haspopup="menu" aria-expanded="false">
                <span class="grid size-9 place-items-center rounded-full bg-background-welcome font-semibold text-ink dark:bg-white/10 dark:text-white">AO</span>
                <span class="hidden sm:block"><strong class="block text-[0.875rem] leading-tight">Amara Okafor</strong></span>
                ${icon('chevron-down', 14, 'hidden shrink-0 text-neutral-500 sm:block dark:text-neutral-400')}
              </button>
              <div id="account-menu-panel" class="absolute right-0 top-[calc(100%+0.5rem)] z-40 hidden min-w-[12rem] overflow-hidden rounded-xl border border-border bg-white shadow-overlay dark:border-white/15 dark:bg-ink-950" role="menu">
                <button type="button" class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-background-welcome dark:text-white dark:hover:bg-white/10" data-account-action="profile" role="menuitem">${icon('user', 16)}Profile</button>
                <button type="button" class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-background-welcome dark:text-white dark:hover:bg-white/10" data-account-action="settings" role="menuitem">${icon('cog', 16)}Settings</button>
                <div class="border-t border-border dark:border-white/10"></div>
                <button type="button" class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-danger-subtle dark:text-danger dark:hover:bg-danger/10" data-account-action="logout" role="menuitem">${icon('sign-out', 16)}Log out</button>
              </div>
            </div>
          </div>
        </div>
        <div id="header-accent" class="h-0.5 w-full bg-export transition-colors duration-300" aria-hidden="true"></div>
      </header>

      <main id="content-scroll-region" class="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 sm:px-6 sm:py-2 lg:px-8 lg:py-6 xl:px-10">
        <div class="mx-auto w-full max-w-[90rem] pb-10">
          <div class="mb-4 flex flex-col gap-2 sm:mb-3">
            <div class="flex min-w-0 items-center gap-2 sm:gap-3">
              <a id="content-back" class="hidden size-8 shrink-0 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-background-welcome hover:text-ink dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white" aria-label="Back">${icon('chevron-left', 18)}</a>
              <div id="breadcrumbs-wrap" class="min-w-0 flex-1"><div id="breadcrumbs" class="flex min-w-0 flex-wrap items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400"></div></div>
            </div>
            <div>
              <h1 id="page-title" class="m-0 text-2xl font-bold tracking-tight text-ink dark:text-white">Overview</h1>
            </div>
          </div>
          <section id="route-view" class="min-w-0" tabindex="-1"></section>
        </div>
      </main>

      <div id="overlay-root"></div>
      <section id="toast-region" class="fixed right-5 top-[88px] z-40 grid gap-2.5 max-[520px]:right-3 max-[520px]:top-20" aria-label="Notifications" aria-live="polite"></section>
    </div>
  </div>`;
}

export function resolveShellMeta(pathname) {
  const trail = findTrail(pathname) ?? [];
  const leaf = trail.at(-1);
  const dynamicShipment = pathname.match(/^\/usecases\/shipment\/([^/]+)$/);
  const title = dynamicShipment ? `Shipment ${decodeURIComponent(dynamicShipment[1])}` : leaf?.label ?? humanize(pathname);
  const breadcrumbs = [{ href: '/overview', label: 'Home' }, ...trail.map((item, index) => ({ href: item.href ?? null, label: item.label, current: index === trail.length - 1 }))];
  const backHref = leaf?.href && leaf.href !== pathname && matchHref(pathname, leaf.href) ? leaf.href : dynamicShipment ? '/usecases/shipment' : null;
  return { title, breadcrumbs, backHref, trail };
}

export function updateBreadcrumbs(pathname, root = document) {
  const meta = resolveShellMeta(pathname);
  const el = root.querySelector('#breadcrumbs');
  if (el) {
    el.innerHTML = meta.breadcrumbs.map((crumb, index) => {
      const divider = index > 0 ? `<span aria-hidden="true" class="text-neutral-400 dark:text-neutral-500">${icon('chevron-right', 14)}</span>` : '';
      const body = crumb.current || !crumb.href ? `<span class="truncate" aria-current="page">${crumb.label}</span>` : `<a class="truncate no-underline transition-colors hover:text-ink dark:hover:text-white" href="#${crumb.href}">${crumb.label}</a>`;
      return `${divider}${body}`;
    }).join('');
  }
  const heading = root.querySelector('#page-title');
  if (heading) heading.textContent = meta.title;
  const back = root.querySelector('#content-back');
  if (back) {
    if (meta.backHref) {
      back.href = `#${meta.backHref}`;
      back.classList.remove('hidden');
      back.classList.add('inline-flex');
    } else {
      back.removeAttribute('href');
      back.classList.add('hidden');
      back.classList.remove('inline-flex');
    }
  }
}

export function updateActiveLinks(pathname, root = document) {
  const trail = resolveShellMeta(pathname).trail;
  const activeIds = new Set(trail.map((item) => item.id));
  const leafId = trail.at(-1)?.id ?? null;
  root.querySelectorAll('[data-nav-row],[data-nav-flyout-link],[data-nav-mobile-id]').forEach((element) => {
    element.removeAttribute('aria-current');
    element.removeAttribute('data-active');
    const id = element.getAttribute('data-nav-id') || element.getAttribute('data-nav-flyout-link') || element.getAttribute('data-nav-mobile-id');
    if (!id) return;
    if (id === leafId) {
      element.setAttribute('aria-current', 'page');
      element.setAttribute('data-active', 'leaf');
      return;
    }
    if (activeIds.has(id)) element.setAttribute('data-active', 'ancestor');
  });
}
