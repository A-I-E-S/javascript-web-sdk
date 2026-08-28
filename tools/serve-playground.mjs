import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { createServer } from 'node:http';

const workspaceRoot = resolve('.');
const playgroundRoot = resolve('examples/playground');
const port = Number(process.env.AFRICANIES_PLAYGROUND_PORT ?? 4173);
const types = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.svg', 'image/svg+xml']
]);

createServer(async (request, response) => {
  const requestPath = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  const candidate = requestPath.startsWith('/packages/')
    ? resolve(workspaceRoot, `.${requestPath}`)
    : resolve(playgroundRoot, `.${requestPath === '/' ? '/index.html' : requestPath}`);
  const inWorkspace = candidate === workspaceRoot || candidate.startsWith(`${workspaceRoot}${sep}`);
  if (!inWorkspace) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const metadata = await stat(candidate);
    if (!metadata.isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'content-type': types.get(extname(candidate)) ?? 'application/octet-stream' });
    createReadStream(candidate).pipe(response);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(port, '127.0.0.1', () => {
  process.stdout.write(`Playground available at http://127.0.0.1:${port}\n`);
});
