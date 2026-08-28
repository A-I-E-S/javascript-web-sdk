import { PLAYGROUND_ROUTE_CONFIG } from './routes.mjs';

const navItems = PLAYGROUND_ROUTE_CONFIG
  .filter((route) => !route.path.includes('/:id'))
  .map((route) => route.path);

const labelFromPath = (path) =>
  path
    .replace(/^\//, '')
    .replaceAll('/', ' / ')
    .replace(/\b\w/g, (m) => m.toUpperCase());

export function renderShell() {
  return `
    <div class="layout">
      <aside id="side-nav" aria-label="Catalog">
        <h1>AFRICANIES Playground</h1>
        <ul>
          ${navItems
            .map((path) => `<li><a data-nav-link href="#${path}">${labelFromPath(path)}</a></li>`)
            .join('')}
        </ul>
      </aside>
      <main id="content">
        <div class="header">
          <div>
            <div id="breadcrumbs"></div>
            <strong id="page-title">Playground</strong>
          </div>
          <div class="toolbar">
            <button id="access-token" class="pill" type="button">Access token</button>
            <button id="shipping-mode-switch" class="pill" type="button" data-mode="sfn">Mode: Export</button>
            <button id="theme-toggle" class="pill" type="button">Theme: Light</button>
            <button id="notifications" class="pill" type="button">Notifications</button>
            <button id="account-menu" class="pill" type="button">Account</button>
          </div>
        </div>
        <section id="route-view"></section>
      </main>
    </div>
  `;
}

export function updateBreadcrumbs(pathname, root = document) {
  const crumbs = pathname
    .replace(/^\//, '')
    .split('/')
    .filter(Boolean)
    .map((item) => item.replace(/-/g, ' '))
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1));
  const text = crumbs.length ? `Home / ${crumbs.join(' / ')}` : 'Home / Overview';
  const breadcrumbs = root.querySelector('#breadcrumbs');
  if (breadcrumbs) breadcrumbs.textContent = text;
}

export function updateActiveLinks(pathname, root = document) {
  root.querySelectorAll('[data-nav-link]').forEach((link) => {
    const href = link.getAttribute('href')?.slice(1) ?? '';
    if (href === pathname) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}
