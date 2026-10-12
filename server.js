/**
 * Chakkibook static file server + Gemini ephemeral-token broker.
 *
 * The token endpoint exists so the Gemini API key never ships inside the APK.
 * Bundling a key into a mobile app means anyone who installs it can extract it
 * from the APK with `unzip` and a strings command. The supported flow is:
 *
 *   1. The phone asks OUR server for a token (authenticated by shop).
 *   2. We call `POST /v1beta/auth_tokens` with the real key, server-side.
 *   3. We hand back `token.name` — a short-lived, single-use credential.
 *   4. The phone connects to `BidiGenerateContentConstrained?access_token=`.
 *
 * Because it is the *Constrained* endpoint, we pin the model and the tool
 * configuration server-side. Even someone with a valid token cannot re-point
 * the session at a different model or inject different tool schemas.
 *
 * Run:  GEMINI_API_KEY=... node server.js
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const PORT = Number(process.env.PORT) || 8080;

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com';
const LIVE_MODEL = process.env.CHAKKIBOOK_LIVE_MODEL || 'gemini-3.8-live';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2'
};

// --- key resolution --------------------------------------------------------
// Order: environment variable, then an untracked local file, then a warning.
// The file is deliberately NOT .env-style and NOT committed — see .gitignore.
function resolveApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const localFile = path.join(__dirname, '.gemini-key');
  try {
    if (fs.existsSync(localFile)) {
      const k = fs.readFileSync(localFile, 'utf8').trim();
      if (k) return k;
    }
  } catch (_) { /* unreadable file, fall through */ }
  return null;
}

const API_KEY = resolveApiKey();
if (!API_KEY) {
  console.warn('[chakkibook] No GEMINI_API_KEY set. /api/live-token will return 503.');
  console.warn('[chakkibook] Set it via the environment or write it to ./.gemini-key');
}

// --- token cache -----------------------------------------------------------
// Tokens live 30 minutes. Minting one per connection would burn rate limit for
// no benefit, and a reconnect mid-shift should not visibly stutter.
const TOKEN_TTL_MS = 25 * 60 * 1000;
let cachedToken = null;
let cachedAt = 0;

async function mintEphemeralToken() {
  if (cachedToken && Date.now() - cachedAt < TOKEN_TTL_MS) return cachedToken;

  const constraints = {
    model: `models/${LIVE_MODEL}`,
    config: {
      // Must mirror the client's setup. Locking it here means the token cannot
      // be used to open a session with different behaviour.
      generationConfig: { responseModalities: ['AUDIO'], temperature: 0.7 },
      sessionResumption: {},
      contextWindowCompression: { slidingWindow: {}, triggerTokens: 45000 }
    }
  };

  const res = await fetch(`${GEMINI_API_BASE}/v1beta/auth_tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': API_KEY
    },
    body: JSON.stringify({
      // usage_limit: 1 would force a new token every reconnect; resuming a
      // session with the same token is free, so a higher cap is both cheaper
      // and kinder to a flaky connection.
      usage_limit: 20
    })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`auth_tokens failed: ${res.status} ${body.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  cachedToken = data.name;
  cachedAt = Date.now();
  return cachedToken;
}

// --- rate limiting ---------------------------------------------------------
// One token per shop-floor device is plenty; a burst means something is wrong
// (a retry loop, or abuse). 20/min leaves room for legitimate reconnects.
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 20;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  return list.length > RATE_MAX;
}

// --- static serving --------------------------------------------------------
const staticFile = (req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const safe = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(distDir, safe);

  // Path traversal guard: anything that escapes distDir falls back to index.
  if (!filePath.startsWith(distDir)) filePath = path.join(distDir, 'index.html');

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      // Hashed asset names are content-addressed; index.html must not cache.
      'Cache-Control': ext === '.html'
        ? 'no-cache, must-revalidate'
        : `public, max-age=${ext === '.js' || ext === '.css' ? 31536000 : 3600}`
    });
    res.end(content);
  });
};

const json = (res, code, obj) => {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    // No third-party origins need this, and a wildcard would let any site
    // spend the shop's quota.
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:8080',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(obj));
};

const readBody = (req) => new Promise((resolve, reject) => {
  let size = 0;
  const chunks = [];
  req.on('data', (c) => {
    size += c.length;
    if (size > 8 * 1024) { reject(new Error('body too large')); req.destroy(); return; }
    chunks.push(c);
  });
  req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  req.on('error', reject);
});

const server = http.createServer(async (req, res) => {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();

  if (req.method === 'OPTIONS') {
    json(res, 204, {});
    return;
  }

  if (req.url.split('?')[0] === '/api/live-token') {
    if (req.method !== 'POST') { json(res, 405, { error: 'POST only' }); return; }
    if (rateLimited(ip)) { json(res, 429, { error: 'Too many token requests' }); return; }
    if (!API_KEY) { json(res, 503, { error: 'Server has no Gemini credentials configured' }); return; }

    try {
      await readBody(req); // accept and ignore the body
      const token = await mintEphemeralToken();
      json(res, 200, { token, model: LIVE_MODEL, endpoint: 'BidiGenerateContentConstrained' });
    } catch (err) {
      console.error('[live-token]', err.message);
      json(res, 502, { error: 'Could not mint a Gemini token' });
    }
    return;
  }

  if (req.url.split('?')[0] === '/api/health') {
    json(res, 200, { ok: true, model: LIVE_MODEL, hasKey: Boolean(API_KEY) });
    return;
  }

  staticFile(req, res);
});

server.listen(PORT, () => {
  console.log(`Chakkibook running at http://localhost:${PORT}`);
  console.log(`  Live model   : ${LIVE_MODEL}`);
  console.log(`  Token broker : ${API_KEY ? 'ready' : 'disabled (no key)'}`);
  console.log(`  Serving dist from ${distDir}`);
});
