import { matchRoute } from './routes.mjs';
import { renderShell, updateActiveLinks, updateBreadcrumbs } from './shell.mjs';

const app = document.querySelector('#app');
if (!app) throw new Error('Missing #app root');
app.innerHTML = renderShell();

const state = {
  mode: 'sfn',
  theme: 'light'
};

const toPathname = () => {
  const hash = globalThis.location.hash.replace(/^#/, '');
  return hash || '/overview';
};

const renderRoute = () => {
  const path = toPathname();
  const matched = matchRoute(path);
  const target = document.querySelector('#route-view');
  if (!target) return;
  if (!matched) {
    target.innerHTML = '<section><h2>Not found</h2><p>Route is not available in the clone.</p></section>';
    return;
  }
  const { route, params } = matched;
  target.innerHTML = route.render(params);
  const title = document.querySelector('#page-title');
  if (title) title.textContent = route.path;
  updateBreadcrumbs(path);
  updateActiveLinks(path);
};

const toggleTheme = () => {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark', state.theme === 'dark');
  const control = document.querySelector('#theme-toggle');
  if (control) control.textContent = `Theme: ${state.theme === 'dark' ? 'Dark' : 'Light'}`;
};

const toggleMode = () => {
  state.mode = state.mode === 'sfn' ? 'stn' : 'sfn';
  const control = document.querySelector('#shipping-mode-switch');
  if (control) control.textContent = `Mode: ${state.mode === 'sfn' ? 'Export' : 'Import'}`;
};

document.querySelector('#theme-toggle')?.addEventListener('click', toggleTheme);
document.querySelector('#shipping-mode-switch')?.addEventListener('click', toggleMode);
globalThis.addEventListener('hashchange', renderRoute);

renderRoute();
