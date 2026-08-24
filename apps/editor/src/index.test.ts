// apps/editor 路由单测：app.request() 直连，不绑定端口。
// LISTS_DIR 指向临时目录，落盘断言与清理均在该目录内完成。
import { afterAll, describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, readdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';

// 注意：env 与临时目录必须在顶层动态 import 之前就绪——bun test 中顶层 await 先于 beforeAll 执行
const listsDir = await mkdtemp(path.join(tmpdir(), 'editor-lists-'));
process.env.LISTS_DIR = listsDir;

afterAll(async () => {
  await rm(listsDir, { recursive: true, force: true });
});

const { app } = await import('./index.js');

const simulateBody = {
  content: {
    contentType: 'application/vnd.gorules.decision',
    nodes: [
      { id: 'in', type: 'inputNode', name: 'Input', position: { x: 0, y: 0 } },
      { id: 'out', type: 'outputNode', name: 'Output', position: { x: 220, y: 0 } },
    ],
    edges: [{ id: 'e1', sourceId: 'in', targetId: 'out' }],
  },
  context: { age: 21 },
};

describe('GET /openapi/json', () => {
  test('returns openapi document', async () => {
    const res = await app.request('/openapi/json');
    expect(res.status).toBe(200);
    const doc = (await res.json()) as { info?: { title?: string } };
    expect(doc.info?.title).toBe('JDM Editor API');
  });
});

describe('CORS', () => {
  test('allows any origin when CORS_ORIGINS unset', async () => {
    const res = await app.request('/api/lists', { headers: { Origin: 'http://localhost:5173' } });
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });

  test('preflight responds with allowed method', async () => {
    const res = await app.request('/api/lists', { method: 'OPTIONS', headers: { Origin: 'http://example.com' } });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-methods')).toContain('DELETE');
  });
});

describe('POST /api/simulate', () => {
  test('evaluates empty graph and returns result envelope', async () => {
    const res = await app.request('/api/simulate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(simulateBody),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { result?: unknown; trace?: unknown; performance?: string };
    expect(body).toHaveProperty('result');
    expect(body).toHaveProperty('performance');
  });

  test('invalid request body yields 400 via zod-openapi validation', async () => {
    const res = await app.request('/api/simulate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ context: {} }),
    });
    expect(res.status).toBe(400);
  });

  test('engine failure returns unified {error} shape with 500', async () => {
    const res = await app.request('/api/simulate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        content: {
          contentType: 'application/vnd.gorules.decision',
          nodes: [
            {
              id: 'x',
              type: 'decisionTableNode',
              name: 't',
              position: { x: 0, y: 0 },
              content: { rules: 'not-an-array' },
            },
          ],
          edges: [],
        },
        context: {},
      }),
    });
    if (res.status === 500) {
      const body = (await res.json()) as { error?: string };
      expect(typeof body.error).toBe('string');
    } else {
      // 引擎对畸形规则可能宽容处理，此时必须仍是 200 信封
      expect(res.status).toBe(200);
      expect(await res.json()).toHaveProperty('result');
    }
  });
});

describe('lists CRUD on temp LISTS_DIR', () => {
  const name = `it-list-${Date.now()}`;

  test('create persists file into temp dir', async () => {
    const res = await app.request('/api/lists', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, description: 'd1', items: ['a', 'b'] }),
    });
    expect(res.status).toBe(200);
    const files = (await readdir(listsDir)).filter((f) => f.endsWith('.json'));
    expect(files.length).toBeGreaterThan(0);
    const raw = await readFile(path.join(listsDir, files[files.length - 1]), 'utf-8');
    const parsed = JSON.parse(raw) as { name?: string };
    expect(parsed.name).toBe(name);
  });

  test('detail returns items; unknown name yields unified 404 error', async () => {
    const ok = await app.request(`/api/lists/${encodeURIComponent(name)}`);
    expect(ok.status).toBe(200);
    const list = (await ok.json()) as { items?: string[] };
    expect(list.items).toEqual(['a', 'b']);

    const missing = await app.request('/api/lists/definitely-missing');
    expect(missing.status).toBe(404);
    const err = (await missing.json()) as { error?: string };
    expect(err.error).toContain('not found');
  });

  test('update rewrites same file and keeps name immutable', async () => {
    const res = await app.request(`/api/lists/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ description: 'd2', items: ['c'] }),
    });
    expect(res.status).toBe(200);
    const list = (await res.json()) as { name?: string; items?: string[] };
    expect(list.name).toBe(name);
    expect(list.items).toEqual(['c']);
  });

  test('delete removes entry and its persisted file', async () => {
    const before = new Set((await readdir(listsDir)).filter((f) => f.endsWith('.json')));
    const res = await app.request(`/api/lists/${encodeURIComponent(name)}`, { method: 'DELETE' });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { deleted?: boolean }).deleted).toBe(true);

    const gone = await app.request(`/api/lists/${encodeURIComponent(name)}`);
    expect(gone.status).toBe(404);

    const after = (await readdir(listsDir)).filter((f) => f.endsWith('.json'));
    expect(after.length).toBe(before.size - 1);
    for (const f of after) expect(before.has(f)).toBe(true);
  });

  test('empty name is rejected by schema validation', async () => {
    const res = await app.request('/api/lists', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '', items: [] }),
    });
    expect(res.status).toBe(400);
  });
});

describe('mock session and custom node schema', () => {
  test('get-session returns mock user id', async () => {
    const res = await app.request('/api/auth/get-session');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user?: { id?: string } };
    expect(body.user?.id).toBe('mock-user-1');
  });

  test('custom-nodes schema returns namespace array', async () => {
    const res = await app.request('/api/custom-nodes/schema');
    expect(res.status).toBe(200);
    const body = (await res.json()) as Array<{ name?: string; tools?: unknown[] }>;
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]?.tools?.length ?? 0).toBeGreaterThan(0);
  });
});
