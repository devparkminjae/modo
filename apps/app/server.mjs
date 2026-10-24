import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, normalize } from 'node:path';

const root = join(process.cwd(), 'dist');
if (!existsSync(join(root, 'index.html'))) {
  console.error('Web build missing. Run `pnpm build:web` before starting the server.');
  process.exit(1);
}
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.ttf':'font/ttf', '.woff2':'font/woff2' };
createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  const safe = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\]|\.\.(?:[/\\]|$))+/, '');
  let file = join(root, safe);
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(root, 'index.html');
  res.writeHead(200, { 'Content-Type': mime[file.slice(file.lastIndexOf('.'))] || 'application/octet-stream', 'X-Content-Type-Options':'nosniff' });
  createReadStream(file).pipe(res);
}).listen(Number(process.env.PORT || 10000), '0.0.0.0', () => console.log(`Modo web listening on ${process.env.PORT || 10000}`));
