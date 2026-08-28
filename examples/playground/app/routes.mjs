const page = (title, copy) => () => `
  <section>
    <h2>${title}</h2>
    <p>${copy}</p>
  </section>
`;

export const PLAYGROUND_ROUTE_CONFIG = Object.freeze([
  { path: '/overview', render: page('Overview', 'Playground overview clone scaffold.') },
  { path: '/components/button', render: page('Button', 'Button route scaffold.') },
  { path: '/components/alert', render: page('Alert', 'Alert route scaffold.') },
  { path: '/components/chip', render: page('Chip', 'Chip route scaffold.') },
  { path: '/components/action-menu', render: page('Action menu', 'Action menu route scaffold.') },
  { path: '/components/feedback', render: page('Feedback', 'Feedback route scaffold.') },
  { path: '/components/overlays', render: page('Overlays', 'Overlays route scaffold.') },
  { path: '/components/forms', render: page('Forms', 'Forms route scaffold.') },
  { path: '/components/filters', render: page('Filters', 'Filters route scaffold.') },
  { path: '/components/tooltip', render: page('Tooltip', 'Tooltip route scaffold.') },
  { path: '/components/toast', render: page('Toast', 'Toast route scaffold.') },
  { path: '/components/table', render: page('Table', 'Table route scaffold.') },
  { path: '/components/stepper', render: page('Stepper', 'Stepper route scaffold.') },
  { path: '/components/navigation/overview', render: page('Navigation · Overview', 'Nested navigation overview scaffold.') },
  { path: '/components/navigation/documents', render: page('Navigation · Documents', 'Nested navigation documents scaffold.') },
  { path: '/components/navigation/events', render: page('Navigation · Events', 'Nested navigation events scaffold.') },
  { path: '/usecases/shipment', render: page('Use case · Shipment', 'Shipment list scaffold.') },
  { path: '/usecases/shipment/:id', render: ({ id }) => `<section><h2>Use case · Shipment ${id}</h2><p>Shipment detail scaffold.</p></section>` },
  { path: '/usecases/onboarding/login', render: page('Use case · Login', 'Onboarding login scaffold.') },
  { path: '/usecases/onboarding/forgot-password', render: page('Use case · Forgot password', 'Onboarding forgot-password scaffold.') },
  { path: '/usecases/onboarding/reset-password', render: page('Use case · Reset password', 'Onboarding reset-password scaffold.') },
  { path: '/lecture', render: page('Lecture', 'Lecture scaffold.') },
  { path: '/icons', render: page('Icons', 'Icons scaffold.') },
  { path: '/tokens', render: page('Tokens', 'Tokens scaffold.') },
  { path: '/models', render: page('Models', 'Models scaffold.') },
  { path: '/api', render: page('SDK API', 'API scaffold.') }
]);

const matchExact = (pattern, routePath) => pattern === routePath;

const matchWithShipmentParam = (pattern, routePath) => {
  if (pattern !== '/usecases/shipment/:id') return null;
  const match = routePath.match(/^\/usecases\/shipment\/([^/]+)$/);
  return match ? { id: decodeURIComponent(match[1]) } : null;
};

export function matchRoute(routePath) {
  for (const route of PLAYGROUND_ROUTE_CONFIG) {
    if (matchExact(route.path, routePath)) return { route, params: {} };
    const params = matchWithShipmentParam(route.path, routePath);
    if (params) return { route, params };
  }
  return null;
}
