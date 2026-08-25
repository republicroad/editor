// apps/editor 路由单测：app.request() 直连，不绑定端口。
// LISTS_DIR 指向临时目录，落盘断言与清理均在该目录内完成。
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';

// 注意：env 与临时目录必须在顶层动态 import 之前就绪——bun test 中顶层 await 先于 beforeAll 执行
const listsDir = await mkdtemp(path.join(tmpdir(), 'editor-lists-'));
process.env.LISTS_DIR = listsDir;

afterAll(async () => {
  await rm(listsDir, { recursive: true, force: true });
});

const { app, resolveExecContext } = await import('./index.js');

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

  const jsonFilesRec = async (dir: string): Promise<string[]> => {
    const out: string[] = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) out.push(...(await jsonFilesRec(p)));
      else if (entry.name.endsWith('.json')) out.push(p);
    }
    return out;
  };

  test('create persists file under owner subdir (mock user)', async () => {
    const res = await app.request('/api/lists', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, description: 'd1', items: ['a', 'b'] }),
    });
    expect(res.status).toBe(200);
    const created = (await res.json()) as { owner?: string };
    expect(created.owner).toBe('mock-user-1');
    const files = await jsonFilesRec(listsDir);
    expect(files.length).toBeGreaterThan(0);
    const hit = files.find((f) => f.includes('mock-user-1'));
    expect(hit).toBeTruthy();
    const raw = await readFile(hit as string, 'utf-8');
    const parsed = JSON.parse(raw) as { name?: string; owner?: string };
    expect(parsed.name).toBe(name);
    expect(parsed.owner).toBe('mock-user-1');
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
    const before = await jsonFilesRec(listsDir);
    const res = await app.request(`/api/lists/${encodeURIComponent(name)}`, { method: 'DELETE' });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { deleted?: boolean }).deleted).toBe(true);

    const gone = await app.request(`/api/lists/${encodeURIComponent(name)}`);
    expect(gone.status).toBe(404);

    const after = await jsonFilesRec(listsDir);
    expect(after.length).toBe(before.length - 1);
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

describe('list owner scoping', () => {
  beforeAll(() => {
    process.env.TRUST_PROXY_HEADERS = 'true';
  });
  afterAll(() => {
    delete process.env.TRUST_PROXY_HEADERS;
  });

  const asUser = (userId: string): Record<string, string> => ({
    'content-type': 'application/json',
    'x-user-id': userId,
  });

  test('POST 以会话用户为 owner 落盘 users/{owner}/', async () => {
    const name = `own-${Date.now()}`;
    const res = await app.request('/api/lists', {
      method: 'POST',
      headers: asUser('user-a'),
      body: JSON.stringify({ name, items: ['a'] }),
    });
    expect(res.status).toBe(200);
    const created = (await res.json()) as { owner?: string };
    expect(created.owner).toBe('user-a');
    const files = await readdir(path.join(listsDir, 'users', 'user-a'));
    expect(files.some((f) => f.endsWith('.json'))).toBe(true);
  });

  test('GET 列表对他人隐藏私有名单，对自己可见', async () => {
    const name = `vis-${Date.now()}`;
    await app.request('/api/lists', {
      method: 'POST',
      headers: asUser('user-a'),
      body: JSON.stringify({ name, items: ['x'] }),
    });

    const resB = await app.request('/api/lists', { headers: asUser('user-b') });
    expect(((await resB.json()) as Array<{ name: string }>).map((l) => l.name)).not.toContain(name);

    const resA = await app.request('/api/lists', { headers: asUser('user-a') });
    expect(((await resA.json()) as Array<{ name: string }>).map((l) => l.name)).toContain(name);
  });

  test('他人私有名单 detail/PUT/DELETE 均 404', async () => {
    const name = `for-${Date.now()}`;
    await app.request('/api/lists', {
      method: 'POST',
      headers: asUser('user-a'),
      body: JSON.stringify({ name, items: ['x'] }),
    });
    const url = `/api/lists/${encodeURIComponent(name)}`;

    expect((await app.request(url, { headers: asUser('user-b') })).status).toBe(404);
    expect(
      (
        await app.request(url, {
          method: 'PUT',
          headers: asUser('user-b'),
          body: JSON.stringify({ items: ['y'] }),
        })
      ).status,
    ).toBe(404);
    expect((await app.request(url, { method: 'DELETE', headers: asUser('user-b') })).status).toBe(404);

    expect((await app.request(url, { headers: asUser('user-a') })).status).toBe(200);
  });

  test('存量无 owner 名单视为共享，任意用户可读可删', async () => {
    const name = `legacy-${Date.now()}`;
    const { registerList } = await import('zen-rule');
    registerList({ name, items: ['s'] });
    await writeFile(path.join(listsDir, `${name}.json`), JSON.stringify({ name, items: ['s'] }), 'utf-8');

    const listed = await app.request(`/api/lists?q=${encodeURIComponent(name)}`, { headers: asUser('user-b') });
    expect(((await listed.json()) as Array<{ name: string }>).map((l) => l.name)).toContain(name);

    const del = await app.request(`/api/lists/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: asUser('user-b'),
    });
    expect(del.status).toBe(200);
  });

  test('两用户各建同名名单互不干扰(自有遮蔽)', async () => {
    const name = `dup-${Date.now()}`;
    await app.request('/api/lists', {
      method: 'POST',
      headers: asUser('user-a'),
      body: JSON.stringify({ name, items: ['from-a'] }),
    });
    await app.request('/api/lists', {
      method: 'POST',
      headers: asUser('user-b'),
      body: JSON.stringify({ name, items: ['from-b'] }),
    });

    const a = (await (
      await app.request(`/api/lists/${encodeURIComponent(name)}`, { headers: asUser('user-a') })
    ).json()) as { items?: string[]; owner?: string };
    expect(a.items).toEqual(['from-a']);
    expect(a.owner).toBe('user-a');

    const b = (await (
      await app.request(`/api/lists/${encodeURIComponent(name)}`, { headers: asUser('user-b') })
    ).json()) as { items?: string[]; owner?: string };
    expect(b.items).toEqual(['from-b']);
    expect(b.owner).toBe('user-b');

    const listB = (
      (await (await app.request('/api/lists', { headers: asUser('user-b') })).json()) as Array<{ name: string }>
    ).filter((l) => l.name === name);
    expect(listB.length).toBe(1);
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

describe('resolveExecContext', () => {
  const getterFrom = (headers: Record<string, string>) => (name: string) => headers[name];

  test('默认回退 Mock 开发用户并生成 requestId', () => {
    delete process.env.TRUST_PROXY_HEADERS;
    const ctx = resolveExecContext(getterFrom({ 'x-user-id': 'spoofed' }));
    expect(ctx.userId).toBe('mock-user-1');
    expect(ctx.requestId).toBeTruthy();
  });

  test('TRUST_PROXY_HEADERS=true 时信任网关头', () => {
    process.env.TRUST_PROXY_HEADERS = 'true';
    try {
      const ctx = resolveExecContext(getterFrom({ 'x-user-id': 'gw-user-7', 'x-request-id': 'req-9' }));
      expect(ctx.userId).toBe('gw-user-7');
      expect(ctx.requestId).toBe('req-9');
    } finally {
      delete process.env.TRUST_PROXY_HEADERS;
    }
  });

  test('TRUST_PROXY_HEADERS=true 但缺 X-User-Id 时仍回退 Mock 用户', () => {
    process.env.TRUST_PROXY_HEADERS = 'true';
    try {
      const ctx = resolveExecContext(getterFrom({}));
      expect(ctx.userId).toBe('mock-user-1');
    } finally {
      delete process.env.TRUST_PROXY_HEADERS;
    }
  });
});
