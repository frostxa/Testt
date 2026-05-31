import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDatabase, transaction } from './database.js';
import { hashPassword, signToken, verifyPassword, verifyToken } from './security.js';
import { validateItem, validateUser } from './validation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const port = Number(process.env.PORT ?? 4000);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

async function authenticate(req) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const payload = token ? verifyToken(token) : null;
  if (!payload) return null;

  const db = await readDatabase();
  return db.users.find((user) => user.id === payload.userId) ?? null;
}

async function handleApi(req, res, pathname) {
  if (req.method === 'GET' && pathname === '/api/health') {
    sendJson(res, 200, { status: 'ok', app: 'Frostxa Fullstack Dashboard' });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/auth/register') {
    const body = await parseBody(req);
    const validated = validateUser(body, 'register');
    if (!validated.valid) {
      sendJson(res, 400, { message: 'Validasi gagal.', errors: validated.errors });
      return;
    }

    const result = await transaction((db) => {
      const exists = db.users.some((user) => user.email === validated.value.email);
      if (exists) return { conflict: true };

      const now = new Date().toISOString();
      const user = {
        id: db.counters.users++,
        name: validated.value.name,
        email: validated.value.email,
        passwordHash: hashPassword(validated.value.password),
        role: 'admin',
        createdAt: now,
        updatedAt: now
      };
      db.users.push(user);
      return { user };
    });

    if (result.conflict) {
      sendJson(res, 409, { message: 'Email sudah terdaftar.' });
      return;
    }

    sendJson(res, 201, { user: publicUser(result.user), token: signToken({ userId: result.user.id, email: result.user.email }) });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/auth/login') {
    const body = await parseBody(req);
    const validated = validateUser(body, 'login');
    if (!validated.valid) {
      sendJson(res, 400, { message: 'Validasi gagal.', errors: validated.errors });
      return;
    }

    const db = await readDatabase();
    const user = db.users.find((item) => item.email === validated.value.email);
    if (!user || !verifyPassword(validated.value.password, user.passwordHash)) {
      sendJson(res, 401, { message: 'Email atau password salah.' });
      return;
    }

    sendJson(res, 200, { user: publicUser(user), token: signToken({ userId: user.id, email: user.email }) });
    return;
  }

  const user = await authenticate(req);
  if (!user) {
    sendJson(res, 401, { message: 'Token tidak ditemukan atau sesi sudah kedaluwarsa.' });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/auth/me') {
    sendJson(res, 200, { user: publicUser(user) });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/items') {
    const db = await readDatabase();
    const items = db.items.filter((item) => item.ownerId === user.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    sendJson(res, 200, { items });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/items') {
    const body = await parseBody(req);
    const validated = validateItem(body);
    if (!validated.valid) {
      sendJson(res, 400, { message: 'Validasi gagal.', errors: validated.errors });
      return;
    }

    const item = await transaction((db) => {
      const now = new Date().toISOString();
      const created = {
        id: db.counters.items++,
        ...validated.value,
        ownerId: user.id,
        createdAt: now,
        updatedAt: now
      };
      db.items.push(created);
      return created;
    });

    sendJson(res, 201, { item });
    return;
  }

  const itemMatch = pathname.match(/^\/api\/items\/(\d+)$/);
  if (itemMatch && (req.method === 'PUT' || req.method === 'DELETE')) {
    const id = Number(itemMatch[1]);
    const result = await transaction(async (db) => {
      const index = db.items.findIndex((item) => item.id === id && item.ownerId === user.id);
      if (index === -1) return { missing: true };

      if (req.method === 'DELETE') {
        db.items.splice(index, 1);
        return { deleted: true };
      }

      const body = await parseBody(req);
      const validated = validateItem(body);
      if (!validated.valid) return { validation: validated.errors };

      db.items[index] = { ...db.items[index], ...validated.value, updatedAt: new Date().toISOString() };
      return { item: db.items[index] };
    });

    if (result.missing) {
      sendJson(res, 404, { message: 'Data tidak ditemukan.' });
      return;
    }

    if (result.validation) {
      sendJson(res, 400, { message: 'Validasi gagal.', errors: result.validation });
      return;
    }

    if (result.deleted) {
      res.writeHead(204);
      res.end();
      return;
    }

    sendJson(res, 200, { item: result.item });
    return;
  }

  sendJson(res, 404, { message: 'Endpoint tidak ditemukan.' });
}

async function serveStatic(res, pathname) {
  const filePath = pathname === '/' ? path.join(publicDir, 'index.html') : path.join(publicDir, pathname);
  const safePath = path.normalize(filePath);

  if (!safePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const content = await readFile(safePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(safePath)] ?? 'application/octet-stream' });
    res.end(content);
  } catch {
    const fallback = await readFile(path.join(publicDir, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fallback);
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url.pathname);
      return;
    }

    await serveStatic(res, decodeURIComponent(url.pathname));
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { message: 'Terjadi kesalahan pada server.' });
  }
});

server.listen(port, () => {
  console.log(`Aplikasi berjalan di http://localhost:${port}`);
});
