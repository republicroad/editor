// apps/editor 路由单测：app.request() 直连，不绑定端口。
// ROSTERS_DIR 指向临时目录，落盘断言与清理均在该目录内完成。
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';

// 注意：env 与临时目录必须在顶层动态 import 之前就绪——bun test 中顶层 await 先于 beforeAll 执行
const rostersDir = await mkdtemp(path.join(tmpdir(), 'editor-rosters-'));
process.env.ROSTERS_DIR = rostersDir;
const graphsDir = await mkdtemp(path.join(tmpdir(), 'editor-graphs-'));
process.env.GRAPHS_DIR = graphsDir;
const logsDir = await mkdtemp(path.join(tmpdir(), 'editor-logs-'));
process.env.LOGS_DIR = logsDir;

afterAll(async () => {
  await rm(rostersDir, { recursive: true, force: true });
  await rm(graphsDir, { recursive: true, force: true });
  await rm(logsDir, { recursive: true, force: true });
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
    const res = await app.request('/api/rosters', { headers: { Origin: 'http://localhost:5173' } });
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });

  test('preflight responds with allowed method', async () => {
    const res = await app.request('/api/rosters', { method: 'OPTIONS', headers: { Origin: 'http://example.com' } });
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

describe('rosters CRUD on temp ROSTERS_DIR', () => {
  const name = `it-roster-${Date.now()}`;

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
    const res = await app.request('/api/rosters', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, description: 'd1', items: ['a', 'b'] }),
    });
    expect(res.status).toBe(200);
    const created = (await res.json()) as { owner?: string };
    expect(created.owner).toBe('mock-user-1');
    const files = await jsonFilesRec(rostersDir);
    expect(files.length).toBeGreaterThan(0);
    const hit = files.find((f) => f.includes('mock-user-1'));
    expect(hit).toBeTruthy();
    const raw = await readFile(hit as string, 'utf-8');
    const parsed = JSON.parse(raw) as { name?: string; owner?: string };
    expect(parsed.name).toBe(name);
    expect(parsed.owner).toBe('mock-user-1');
  });

  test('detail returns items; unknown name yields unified 404 error', async () => {
    const ok = await app.request(`/api/rosters/${encodeURIComponent(name)}`);
    expect(ok.status).toBe(200);
    const roster = (await ok.json()) as { items?: string[] };
    expect(roster.items).toEqual(['a', 'b']);

    const missing = await app.request('/api/rosters/definitely-missing');
    expect(missing.status).toBe(404);
    const err = (await missing.json()) as { error?: string };
    expect(err.error).toContain('not found');
  });

  test('update rewrites same file and keeps name immutable', async () => {
    const res = await app.request(`/api/rosters/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ description: 'd2', items: ['c'] }),
    });
    expect(res.status).toBe(200);
    const roster = (await res.json()) as { name?: string; items?: string[] };
    expect(roster.name).toBe(name);
    expect(roster.items).toEqual(['c']);
  });

  test('delete removes entry and its persisted file', async () => {
    const before = await jsonFilesRec(rostersDir);
    const res = await app.request(`/api/rosters/${encodeURIComponent(name)}`, { method: 'DELETE' });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { deleted?: boolean }).deleted).toBe(true);

    const gone = await app.request(`/api/rosters/${encodeURIComponent(name)}`);
    expect(gone.status).toBe(404);

    const after = await jsonFilesRec(rostersDir);
    expect(after.length).toBe(before.length - 1);
  });

  test('empty name is rejected by schema validation', async () => {
    const res = await app.request('/api/rosters', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '', items: [] }),
    });
    expect(res.status).toBe(400);
  });
});

describe('roster owner scoping', () => {
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
    const res = await app.request('/api/rosters', {
      method: 'POST',
      headers: asUser('user-a'),
      body: JSON.stringify({ name, items: ['a'] }),
    });
    expect(res.status).toBe(200);
    const created = (await res.json()) as { owner?: string };
    expect(created.owner).toBe('user-a');
    const files = await readdir(path.join(rostersDir, 'users', 'user-a'));
    expect(files.some((f) => f.endsWith('.json'))).toBe(true);
  });

  test('GET 列表对他人隐藏私有名单，对自己可见', async () => {
    const name = `vis-${Date.now()}`;
    await app.request('/api/rosters', {
      method: 'POST',
      headers: asUser('user-a'),
      body: JSON.stringify({ name, items: ['x'] }),
    });

    const resB = await app.request('/api/rosters', { headers: asUser('user-b') });
    expect(((await resB.json()) as Array<{ name: string }>).map((l) => l.name)).not.toContain(name);

    const resA = await app.request('/api/rosters', { headers: asUser('user-a') });
    expect(((await resA.json()) as Array<{ name: string }>).map((l) => l.name)).toContain(name);
  });

  test('他人私有名单 detail/PUT/DELETE 均 404', async () => {
    const name = `for-${Date.now()}`;
    await app.request('/api/rosters', {
      method: 'POST',
      headers: asUser('user-a'),
      body: JSON.stringify({ name, items: ['x'] }),
    });
    const url = `/api/rosters/${encodeURIComponent(name)}`;

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
    const { registerRoster } = await import('zen-rule');
    registerRoster({ name, items: ['s'] });
    await writeFile(path.join(rostersDir, `${name}.json`), JSON.stringify({ name, items: ['s'] }), 'utf-8');

    const listed = await app.request(`/api/rosters?q=${encodeURIComponent(name)}`, { headers: asUser('user-b') });
    expect(((await listed.json()) as Array<{ name: string }>).map((l) => l.name)).toContain(name);

    const del = await app.request(`/api/rosters/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: asUser('user-b'),
    });
    expect(del.status).toBe(200);
  });

  test('两用户各建同名名单互不干扰(自有遮蔽)', async () => {
    const name = `dup-${Date.now()}`;
    await app.request('/api/rosters', {
      method: 'POST',
      headers: asUser('user-a'),
      body: JSON.stringify({ name, items: ['from-a'] }),
    });
    await app.request('/api/rosters', {
      method: 'POST',
      headers: asUser('user-b'),
      body: JSON.stringify({ name, items: ['from-b'] }),
    });

    const a = (await (
      await app.request(`/api/rosters/${encodeURIComponent(name)}`, { headers: asUser('user-a') })
    ).json()) as { items?: string[]; owner?: string };
    expect(a.items).toEqual(['from-a']);
    expect(a.owner).toBe('user-a');

    const b = (await (
      await app.request(`/api/rosters/${encodeURIComponent(name)}`, { headers: asUser('user-b') })
    ).json()) as { items?: string[]; owner?: string };
    expect(b.items).toEqual(['from-b']);
    expect(b.owner).toBe('user-b');

    const rosterB = (
      (await (await app.request('/api/rosters', { headers: asUser('user-b') })).json()) as Array<{ name: string }>
    ).filter((l) => l.name === name);
    expect(rosterB.length).toBe(1);
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

describe('graph persistence routes', () => {
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

  const graphBody = (name: string) => ({
    name,
    content: {
      contentType: 'application/vnd.gorules.decision',
      nodes: [{ id: 'in', type: 'inputNode', name: 'Input' }],
      edges: [],
    },
  });

  test('新建注入 owner 并落盘 users/{owner}/，revision 初始 v1', async () => {
    const name = `graph-own-${Date.now()}`;
    const res = await app.request('/api/graphs', {
      method: 'POST',
      headers: asUser('user-a'),
      body: JSON.stringify(graphBody(name)),
    });
    expect(res.status).toBe(200);
    const created = (await res.json()) as { id: string; revision: string };
    expect(created.revision).toBe('v1');
    const files = await readdir(path.join(graphsDir, 'users', 'user-a'));
    expect(files).toContain(`${created.id}.json`);
    // 客户端传入的 owner/字段被剥离，不进入响应
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/i);
  });

  test('detail 返回 content；他人私有一律 404', async () => {
    const name = `graph-vis-${Date.now()}`;
    const created = (await (
      await app.request('/api/graphs', {
        method: 'POST',
        headers: asUser('user-a'),
        body: JSON.stringify(graphBody(name)),
      })
    ).json()) as { id: string };

    const resA = await app.request(`/api/graphs/${created.id}`, { headers: asUser('user-a') });
    expect(resA.status).toBe(200);
    const detail = (await resA.json()) as { name: string; content: { nodes: unknown[] }; owner: string };
    expect(detail.name).toBe(name);
    expect(Array.isArray(detail.content.nodes)).toBe(true);
    expect(detail.owner).toBe('user-a');

    expect((await app.request(`/api/graphs/${created.id}`, { headers: asUser('user-b') })).status).toBe(404);
    // 列表对他人隐藏
    const rosterB = (await (await app.request('/api/graphs', { headers: asUser('user-b') })).json()) as Array<{
      id: string;
    }>;
    expect(rosterB.map((g) => g.id)).not.toContain(created.id);
  });

  test('version 递增 v1→v2→v3，且可读历史版本与版本表', async () => {
    const name = `ver-${Date.now()}`;
    const created = (await (
      await app.request('/api/graphs', {
        method: 'POST',
        headers: asUser('user-a'),
        body: JSON.stringify(graphBody(name)),
      })
    ).json()) as { id: string };

    const put1 = await app.request(`/api/graphs/${created.id}`, {
      method: 'PUT',
      headers: asUser('user-a'),
      body: JSON.stringify({ ...graphBody('updated'), baseRevision: 'v1' }),
    });
    expect(put1.status).toBe(200);
    expect(((await put1.json()) as { revision: string }).revision).toBe('v2');

    const put2 = await app.request(`/api/graphs/${created.id}`, {
      method: 'PUT',
      headers: asUser('user-a'),
      body: JSON.stringify({ ...graphBody('updated-2'), baseRevision: 'v2' }),
    });
    expect(put2.status).toBe(200);
    expect(((await put2.json()) as { revision: string }).revision).toBe('v3');

    // 读旧版
    const v1 = await app.request(`/api/graphs/${created.id}?revision=v1`, { headers: asUser('user-a') });
    const v1Body = (await v1.json()) as { name: string; revision: string };
    expect(v1Body.revision).toBe('v1');
    expect(v1Body.name).toBe(name);

    // 版本表含归档 + head（当前版本）
    const versions = (await (
      await app.request(`/api/graphs/${created.id}/versions`, { headers: asUser('user-a') })
    ).json()) as Array<{ revision: string }>;
    expect(versions.map((v) => v.revision)).toEqual(['v1', 'v2', 'v3']);
  });

  test('content.session 随保存透传落盘，detail 返回原样（UI 现场快照）', async () => {
    const name = `session-${Date.now()}`;
    const created = (await (
      await app.request('/api/graphs', {
        method: 'POST',
        headers: asUser('user-a'),
        body: JSON.stringify(graphBody(name)),
      })
    ).json()) as { id: string };

    const session = {
      graph: { viewport: { x: 10, y: 20, zoom: 1.5 }, tabs: { openTabs: ['graph'], activeTab: 'graph' } },
    };
    const put = await app.request(`/api/graphs/${created.id}`, {
      method: 'PUT',
      headers: asUser('user-a'),
      body: JSON.stringify({
        ...graphBody('with-session'),
        baseRevision: 'v1',
        content: { ...graphBody('with-session').content, session },
      }),
    });
    expect(put.status).toBe(200);

    const detail = (await (await app.request(`/api/graphs/${created.id}`, { headers: asUser('user-a') })).json()) as {
      content: { session?: unknown; nodes: unknown[] };
    };
    expect(detail.content.session).toEqual(session);
    expect(Array.isArray(detail.content.nodes)).toBe(true);
  });

  test('auto 条目在版本表中带 auto 标记', async () => {
    const name = `auto-flag-${Date.now()}`;
    const created = (await (
      await app.request('/api/graphs', {
        method: 'POST',
        headers: asUser('user-a'),
        body: JSON.stringify(graphBody(name)),
      })
    ).json()) as { id: string };

    await app.request(`/api/graphs/${created.id}`, {
      method: 'PUT',
      headers: asUser('user-a'),
      body: JSON.stringify({ ...graphBody('auto-upd'), baseRevision: 'v1', auto: true }),
    });
    // 第二次 auto 保存：v2 归档进版本表（归档的 meta.auto 取自旧 head 的 auto 标记）
    await app.request(`/api/graphs/${created.id}`, {
      method: 'PUT',
      headers: asUser('user-a'),
      body: JSON.stringify({ ...graphBody('auto-upd-2'), baseRevision: 'v2', auto: true }),
    });

    const versions = (await (
      await app.request(`/api/graphs/${created.id}/versions`, { headers: asUser('user-a') })
    ).json()) as Array<{ revision: string; auto?: boolean }>;
    // 版本表 = 归档(v1 manual head + v2 auto head) + head v3(auto)——含当前版本
    expect(versions).toHaveLength(3);
    const byRevision = new Map(versions.map((v) => [v.revision, v]));
    expect(byRevision.get('v1')?.auto).toBeFalsy(); // 首次 POST 为 manual head
    expect(byRevision.get('v2')?.auto).toBe(true); // 首次 auto PUT 的 head
    expect(byRevision.get('v3')?.auto).toBe(true); // 当前 head
  });

  test('auto 版本保留策略：全部 manual 保留 + 最近 20 条 auto，超限最旧 auto 被删', async () => {
    const name = `auto-prune-${Date.now()}`;
    const created = (await (
      await app.request('/api/graphs', {
        method: 'POST',
        headers: asUser('user-a'),
        body: JSON.stringify(graphBody(name)),
      })
    ).json()) as { id: string };

    // 22 次 auto 保存 → 归档 v1(manual POST 产生的 head) + v2..v22(21 条 auto)
    // 保留策略：auto 仅保留最近 20 条 → 最旧的 v2 归档被删
    for (let i = 2; i <= 23; i++) {
      const put = await app.request(`/api/graphs/${created.id}`, {
        method: 'PUT',
        headers: asUser('user-a'),
        body: JSON.stringify({ ...graphBody(`${name}-a${i}`), baseRevision: `v${i - 1}`, auto: true }),
      });
      expect(put.status).toBe(200);
    }

    const versions = (await (
      await app.request(`/api/graphs/${created.id}/versions`, { headers: asUser('user-a') })
    ).json()) as Array<{ revision: string; auto?: boolean }>;
    // 数字序排列 + 含 head：v1(manual) + v2..v22(21 auto 归档) + v23(head auto)
    expect(versions).toHaveLength(22); // v1(manual) + 21 auto 归档 + head v23
    const byRevision = new Map(versions.map((v) => [v.revision, v]));
    expect(byRevision.has('v1')).toBe(true); // manual 保留
    expect(byRevision.get('v1')?.auto).toBeUndefined();
    expect(byRevision.get('v22')?.auto).toBe(true); // 最新归档的 auto 保留
    expect(byRevision.get('v23')?.auto).toBe(true); // head（当前版本）
    expect(versions.filter((v) => v.auto)).toHaveLength(21); // 21 归档 auto + head
  });

  test('命名版本豁免 auto 保留策略（appshell 0.2.0 契约）：滚动溢出后仍保留', async () => {
    const name = `auto-named-${Date.now()}`;
    const created = (await (
      await app.request('/api/graphs', {
        method: 'POST',
        headers: asUser('user-a'),
        body: JSON.stringify(graphBody(name)),
      })
    ).json()) as { id: string };

    // 21 次 auto 保存 → 归档 v1(manual) + v2..v21(20 条 auto)，head v22
    for (let i = 2; i <= 22; i++) {
      const put = await app.request(`/api/graphs/${created.id}`, {
        method: 'PUT',
        headers: asUser('user-a'),
        body: JSON.stringify({ ...graphBody(`${name}-a${i}`), baseRevision: `v${i - 1}`, auto: true }),
      });
      expect(put.status).toBe(200);
    }
    // 命名最旧的归档 auto（v2）——PATCH body 与 appshell renameVersion 契约一致（{versionName}）
    const patch = await app.request(`/api/graphs/${created.id}/versions/v2`, {
      method: 'PATCH',
      headers: asUser('user-a'),
      body: JSON.stringify({ versionName: 'keep-me' }),
    });
    expect(patch.status).toBe(200);

    // 再 1 次 auto 保存 → 归档 auto = v2..v22(21 条)：滚动窗口(20)溢出 v2，但 v2 已命名 → 豁免
    const put = await app.request(`/api/graphs/${created.id}`, {
      method: 'PUT',
      headers: asUser('user-a'),
      body: JSON.stringify({ ...graphBody(`${name}-a23`), baseRevision: 'v22', auto: true }),
    });
    expect(put.status).toBe(200);

    const versions = (await (
      await app.request(`/api/graphs/${created.id}/versions`, { headers: asUser('user-a') })
    ).json()) as Array<{ revision: string; versionName?: string; auto?: boolean }>;
    const byRevision = new Map(versions.map((v) => [v.revision, v]));
    // 命名的 v2 存活且命名在列；若无豁免，v2 已被滚动窗口删除
    expect(byRevision.get('v2')?.versionName).toBe('keep-me');
    expect(byRevision.get('v2')?.auto).toBe(true);
    // 总量：v1(manual) + v2(命名 auto 豁免) + v3..v22(20 auto) + v23(head) = 23
    expect(versions).toHaveLength(23);
  });

  test('钉住豁免（S007）：PATCH {pinned:true} 的 auto 版本滚动溢出后仍保留', async () => {
    const name = `auto-pinned-${Date.now()}`;
    const created = (await (
      await app.request('/api/graphs', {
        method: 'POST',
        headers: asUser('user-a'),
        body: JSON.stringify(graphBody(name)),
      })
    ).json()) as { id: string };

    // 21 次 auto 保存 → 归档 v1(manual) + v2..v21(20 条 auto)，head v22
    for (let i = 2; i <= 22; i++) {
      const put = await app.request(`/api/graphs/${created.id}`, {
        method: 'PUT',
        headers: asUser('user-a'),
        body: JSON.stringify({ ...graphBody(`${name}-a${i}`), baseRevision: `v${i - 1}`, auto: true }),
      });
      expect(put.status).toBe(200);
    }
    // 钉住最旧的归档 auto（v2）——PATCH body 与 appshell updateVersionMeta 契约一致（{pinned}）
    const patch = await app.request(`/api/graphs/${created.id}/versions/v2`, {
      method: 'PATCH',
      headers: asUser('user-a'),
      body: JSON.stringify({ pinned: true }),
    });
    expect(patch.status).toBe(200);
    expect(((await patch.json()) as { pinned?: boolean }).pinned).toBe(true);

    // 再 1 次 auto 保存 → 归档 auto = v2..v22(21 条)：滚动窗口(20)溢出 v2，但 v2 已钉住 → 豁免
    const put = await app.request(`/api/graphs/${created.id}`, {
      method: 'PUT',
      headers: asUser('user-a'),
      body: JSON.stringify({ ...graphBody(`${name}-a23`), baseRevision: 'v22', auto: true }),
    });
    expect(put.status).toBe(200);

    const versions = (await (
      await app.request(`/api/graphs/${created.id}/versions`, { headers: asUser('user-a') })
    ).json()) as Array<{ revision: string; versionName?: string; pinned?: boolean; auto?: boolean }>;
    const byRevision = new Map(versions.map((v) => [v.revision, v]));
    // 钉住的 v2 存活且标记在列；若无豁免，v2 已被滚动窗口删除
    expect(byRevision.get('v2')?.pinned).toBe(true);
    expect(byRevision.get('v2')?.auto).toBe(true);
    // 总量：v1(manual) + v2(钉住 auto 豁免) + v3..v22(20 auto) + v23(head) = 23
    expect(versions).toHaveLength(23);
  });

  test('auto 版本按天折叠：检查点救回滚动溢出条目，同日折叠以最新替代（第六十一批按天检查点）', async () => {
    const name = `auto-daily-${Date.now()}`;
    const created = (await (
      await app.request('/api/graphs', {
        method: 'POST',
        headers: asUser('user-a'),
        body: JSON.stringify(graphBody(name)),
      })
    ).json()) as { id: string };

    // 22 次 auto 保存 → 归档 v1(manual) + v2..v22(21 auto) + head v23；
    // 全部同一 UTC 日 → 按天检查点不参与，滚动窗口(20)删除最旧 v2（与上一用例一致）
    for (let i = 2; i <= 23; i++) {
      const put = await app.request(`/api/graphs/${created.id}`, {
        method: 'PUT',
        headers: asUser('user-a'),
        body: JSON.stringify({ ...graphBody(`${name}-a${i}`), baseRevision: `v${i - 1}`, auto: true }),
      });
      expect(put.status).toBe(200);
    }

    const ownerDir = path.join(graphsDir, 'users', 'user-a');
    const dayIso = (offsetDaysAgo: number) => new Date(Date.now() - offsetDaysAgo * 86_400_000).toISOString();
    const rewriteUpdatedAt = async (revision: string, isoUpdatedAt: string) => {
      const filePath = path.join(ownerDir, `${created.id}.${revision}.json`);
      const raw = JSON.parse(await readFile(filePath, 'utf-8')) as { meta: { updatedAt: string } };
      raw.meta.updatedAt = isoUpdatedAt;
      await writeFile(filePath, `${JSON.stringify(raw, null, 2)}\n`, 'utf-8');
    };
    const listRevisions = async () => {
      const versions = (await (
        await app.request(`/api/graphs/${created.id}/versions`, { headers: asUser('user-a') })
      ).json()) as Array<{ revision: string }>;
      return new Set(versions.map((v) => v.revision));
    };

    // v3 改为前天 → 下一次保存治理时 v3 已被滚动窗口挤出，但作为前天检查点被救回
    await rewriteUpdatedAt('v3', dayIso(2));
    await app.request(`/api/graphs/${created.id}`, {
      method: 'PUT',
      headers: asUser('user-a'),
      body: JSON.stringify({ ...graphBody(`${name}-a24`), baseRevision: 'v23', auto: true }),
    });
    expect((await listRevisions()).has('v3')).toBe(true); // 按天检查点救回

    // v4 也改为前天 → 前天检查点归最新 v4，v3 被同日折叠删除；v4 作为检查点保留
    await rewriteUpdatedAt('v4', dayIso(2));
    await app.request(`/api/graphs/${created.id}`, {
      method: 'PUT',
      headers: asUser('user-a'),
      body: JSON.stringify({ ...graphBody(`${name}-a25`), baseRevision: 'v24', auto: true }),
    });
    const revisions = await listRevisions();
    expect(revisions.has('v3')).toBe(false); // 同日旧检查点被最新替代
    expect(revisions.has('v4')).toBe(true); // 当日最新检查点保留
  });

  test('auto 条目：detail 与版本表均带 auto 标记', async () => {
    const name = `auto-flag-${Date.now()}`;
    const created = (await (
      await app.request('/api/graphs', {
        method: 'POST',
        headers: asUser('user-a'),
        body: JSON.stringify(graphBody(name)),
      })
    ).json()) as { id: string };

    await app.request(`/api/graphs/${created.id}`, {
      method: 'PUT',
      headers: asUser('user-a'),
      body: JSON.stringify({ ...graphBody('auto-upd'), baseRevision: 'v1', auto: true }),
    });

    const detail = (await (await app.request(`/api/graphs/${created.id}`, { headers: asUser('user-a') })).json()) as {
      auto?: boolean;
    };
    expect(detail.auto).toBe(true); // auto 标记在 head 上

    const versions = (await (
      await app.request(`/api/graphs/${created.id}/versions`, { headers: asUser('user-a') })
    ).json()) as Array<{ revision: string; auto?: boolean }>;
    // 版本表含 head：v1(manual 首存) + v2(首次 auto 保存)——均为 manual/auto 演进的真实序列
    expect(versions).toHaveLength(2);
    expect(versions[0].revision).toBe('v1');
    expect(versions[1].revision).toBe('v2');
  });

  test('PATCH 版本元数据：归档 auto 升格 manual + head 升格 + 未知版本 404', async () => {
    const name = `auto-pin-${Date.now()}`;
    const created = (await (
      await app.request('/api/graphs', {
        method: 'POST',
        headers: asUser('user-a'),
        body: JSON.stringify(graphBody(name)),
      })
    ).json()) as { id: string };

    // v2(auto 归档) + v3(head auto)
    await app.request(`/api/graphs/${created.id}`, {
      method: 'PUT',
      headers: asUser('user-a'),
      body: JSON.stringify({ ...graphBody('pin-upd'), baseRevision: 'v1', auto: true }),
    });
    await app.request(`/api/graphs/${created.id}`, {
      method: 'PUT',
      headers: asUser('user-a'),
      body: JSON.stringify({ ...graphBody('pin-upd-2'), baseRevision: 'v2', auto: true }),
    });

    // 升格归档 v2 + 命名
    const pinArchived = await app.request(`/api/graphs/${created.id}/versions/v2`, {
      method: 'PATCH',
      headers: asUser('user-a'),
      body: JSON.stringify({ auto: false, versionName: 'release-candidate' }),
    });
    expect(pinArchived.status).toBe(200);
    const pinned = (await pinArchived.json()) as { revision: string; auto?: boolean; versionName?: string };
    expect(pinned.revision).toBe('v2');
    expect(pinned.auto).toBe(false);
    expect(pinned.versionName).toBe('release-candidate');

    // 升格 head v3
    const pinHead = await app.request(`/api/graphs/${created.id}/versions/v3`, {
      method: 'PATCH',
      headers: asUser('user-a'),
      body: JSON.stringify({ auto: false }),
    });
    expect(pinHead.status).toBe(200);

    // 版本表复核：v2/v3 已无 auto 标记；content 不受影响
    const versions = (await (
      await app.request(`/api/graphs/${created.id}/versions`, { headers: asUser('user-a') })
    ).json()) as Array<{ revision: string; auto?: boolean; versionName?: string }>;
    const byRevision = new Map(versions.map((v) => [v.revision, v]));
    expect(byRevision.get('v2')?.auto).toBeFalsy();
    expect(byRevision.get('v2')?.versionName).toBe('release-candidate');
    expect(byRevision.get('v3')?.auto).toBeFalsy();
    const detail = (await (await app.request(`/api/graphs/${created.id}`, { headers: asUser('user-a') })).json()) as {
      content: { nodes: unknown[] };
    };
    expect(Array.isArray(detail.content.nodes)).toBe(true);

    // 未知 revision 404（含形态非法的穿越尝试）
    const missing = await app.request(`/api/graphs/${created.id}/versions/v999`, {
      method: 'PATCH',
      headers: asUser('user-a'),
      body: JSON.stringify({ auto: false }),
    });
    expect(missing.status).toBe(404);
    const evil = await app.request(`/api/graphs/${created.id}/versions/..%2F..%2Fetc`, {
      method: 'PATCH',
      headers: asUser('user-a'),
      body: JSON.stringify({ auto: false }),
    });
    expect(evil.status).toBe(404);
  });

  test('baseRevision 不匹配 head 返回 409 CONFLICT', async () => {
    const created = (await (
      await app.request('/api/graphs', {
        method: 'POST',
        headers: asUser('user-a'),
        body: JSON.stringify(graphBody(`conf-${Date.now()}`)),
      })
    ).json()) as { id: string };

    const res = await app.request(`/api/graphs/${created.id}`, {
      method: 'PUT',
      headers: asUser('user-a'),
      body: JSON.stringify({ ...graphBody('x'), baseRevision: 'v999' }),
    });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: { code?: string } };
    expect(body.error?.code).toBe('CONFLICT');
  });

  test('PUT 保留原 owner(共享图编辑后仍共享)', async () => {
    // 通过写入 shared 目录构造无 owner 图
    const id = 'shared-graph-test';
    const sharedDir = path.join(graphsDir, 'shared');
    const { mkdir } = await import('fs/promises');
    await mkdir(sharedDir, { recursive: true });
    await writeFile(
      path.join(sharedDir, `${id}.json`),
      JSON.stringify({
        meta: {
          id,
          name: 'shared-graph',
          revision: 'v1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        content: graphBody('shared-graph').content,
      }),
      'utf-8',
    );

    const put = await app.request(`/api/graphs/${id}`, {
      method: 'PUT',
      headers: asUser('user-b'),
      body: JSON.stringify({ ...graphBody('shared-graph-updated'), baseRevision: 'v1' }),
    });
    expect(put.status).toBe(200);
    expect(((await put.json()) as { revision: string }).revision).toBe('v2');

    const detail = await app.request(`/api/graphs/${id}`, { headers: asUser('user-a') });
    const body = (await detail.json()) as { owner?: string; name: string };
    expect(body.owner).toBeUndefined(); // 仍为共享
    expect(body.name).toBe('shared-graph-updated');
  });

  test('delete 移除 head 与全部历史版本文件', async () => {
    const created = (await (
      await app.request('/api/graphs', {
        method: 'POST',
        headers: asUser('user-a'),
        body: JSON.stringify(graphBody(`del-${Date.now()}`)),
      })
    ).json()) as { id: string };
    await app.request(`/api/graphs/${created.id}`, {
      method: 'PUT',
      headers: asUser('user-a'),
      body: JSON.stringify({ ...graphBody('d'), baseRevision: 'v1' }),
    });

    const res = await app.request(`/api/graphs/${created.id}`, {
      method: 'DELETE',
      headers: asUser('user-a'),
    });
    expect(res.status).toBe(200);
    expect((await res.json()) as { deleted: boolean }).toEqual({ deleted: true });

    expect((await app.request(`/api/graphs/${created.id}`, { headers: asUser('user-a') })).status).toBe(404);
    const dir = path.join(graphsDir, 'users', 'user-a');
    const remaining = (await readdir(dir)).filter((f) => f.startsWith(created.id));
    expect(remaining).toHaveLength(0);
  });
});

describe('GET /healthz', () => {
  test('存活与存储可写探测（匿名可达）', async () => {
    const res = await app.request('/healthz');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; graphsDirWritable: boolean };
    expect(body.ok).toBe(true);
    expect(body.graphsDirWritable).toBe(true);
  });
});

describe('GET /api/graphs 分页', () => {
  const asUser = (userId: string): Record<string, string> => ({ 'x-user-id': userId });
  const graphBody = (name: string) => ({
    name,
    content: {
      contentType: 'application/vnd.gorules.decision',
      nodes: [{ id: 'in', type: 'inputNode', name: 'Input' }],
      edges: [],
    },
  });

  test('缺省全量；page/pageSize 切片与全量排序一致', async () => {
    const asUserJson = (userId: string): Record<string, string> => ({
      'x-user-id': userId,
      'content-type': 'application/json',
    });
    for (const n of ['pg-a', 'pg-b', 'pg-c']) {
      const res = await app.request('/api/graphs', {
        method: 'POST',
        headers: asUserJson('user-a'),
        body: JSON.stringify(graphBody(`${n}-${Date.now()}`)),
      });
      expect(res.status).toBe(200);
    }
    const all = (await (await app.request('/api/graphs', { headers: asUser('user-a') })).json()) as Array<{
      id: string;
    }>;
    expect(Array.isArray(all)).toBe(true);

    const page1 = (await (
      await app.request('/api/graphs?page=1&pageSize=2', { headers: asUser('user-a') })
    ).json()) as Array<{ id: string }>;
    expect(page1).toHaveLength(2);
    expect(page1.map((g) => g.id)).toEqual(all.slice(0, 2).map((g) => g.id));

    const page2 = (await (
      await app.request('/api/graphs?page=2&pageSize=2', { headers: asUser('user-a') })
    ).json()) as Array<{ id: string }>;
    expect(page2.map((g) => g.id)).toEqual(all.slice(2, 4).map((g) => g.id));
  });
});

describe('部署态身份（AUTH_SECRET，方案 B）', () => {
  const SECRET = 'unit-test-secret-key';
  // asUser/graphBody 定义在 graphs describe 内，此处用本地 helper
  const asForgedUser = (userId: string): Record<string, string> => ({ 'x-user-id': userId });
  const graphBody = (name: string) => ({
    name,
    content: {
      contentType: 'application/vnd.gorules.decision',
      nodes: [{ id: 'in', type: 'inputNode', name: 'Input' }],
      edges: [],
    },
  });

  test('签名 cookie 身份生效；伪造 x-user-id 失效；篡改 cookie 重签发', async () => {
    process.env.AUTH_SECRET = SECRET;
    try {
      // 第一发：无 cookie → Set-Cookie 签发；伪造 header 不被信任（图归新匿名身份）
      const r1 = await app.request('/api/graphs', {
        method: 'POST',
        headers: { ...asForgedUser('attacker'), 'Content-Type': 'application/json' },
        body: JSON.stringify(graphBody(`authn-${Date.now()}`)),
      });
      expect(r1.status).toBe(200);
      const created = (await r1.json()) as { id: string };
      const setCookie = r1.headers.get('set-cookie') ?? '';
      expect(setCookie).toContain('gid=');
      const cookie = setCookie.split(';')[0];

      // 带 cookie（身份 A）：可见自己创建的图
      const r2 = await app.request('/api/graphs', { headers: { cookie } });
      const visible = (await r2.json()) as Array<{ id: string }>;
      expect(visible.some((g) => g.id === created.id)).toBe(true);

      // 不带 cookie（新身份 B）+ 伪造 header：不可见 A 的私有图
      const r3 = await app.request('/api/graphs', { headers: asForgedUser('attacker') });
      expect(r3.headers.get('set-cookie')).toContain('gid=');
      const invisible = (await r3.json()) as Array<{ id: string }>;
      expect(invisible.some((g) => g.id === created.id)).toBe(false);

      // 篡改 cookie → 验证失败 → 重签发新 cookie
      const r4 = await app.request('/api/graphs', { headers: { cookie: `${cookie}xx` } });
      expect(r4.headers.get('set-cookie')).toContain('gid=');

      // 形态非法 cookie → 重签发
      const r5 = await app.request('/api/graphs', { headers: { cookie: 'not-a-signed-cookie' } });
      expect(r5.headers.get('set-cookie')).toContain('gid=');
    } finally {
      delete process.env.AUTH_SECRET;
    }
  });
});

describe('决策请求日志（LOGS_DIR，第六十二批）', () => {
  test('simulate 完成后落盘 JSONL：字段齐全', async () => {
    const res = await app.request('/api/simulate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(simulateBody),
    });
    expect(res.status).toBe(200);
    const { flushDecisionLog } = await import('./decision-request-log.js');
    await flushDecisionLog();

    const files = (await readdir(logsDir)).filter((name) => name.startsWith('decision-requests-'));
    expect(files).toEqual([`decision-requests-${new Date().toISOString().slice(0, 10)}.jsonl`]);
    const lines = (await readFile(path.join(logsDir, files[0]), 'utf-8'))
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    const record = lines.at(-1)!;
    expect(record.route).toBe('/api/simulate');
    expect(record.method).toBe('POST');
    expect(record.status).toBe(200);
    expect(record.ok).toBe(true);
    expect(record.userId).toBe('mock-user-1'); // 无 TRUST_PROXY_HEADERS/AUTH_SECRET → mock 用户
    expect(Number(record.durationMs)).toBeGreaterThanOrEqual(0);
    expect(typeof record.requestId).toBe('string');
    expect(new Date(record.ts as string).toString()).not.toBe('Invalid Date');
  });

  test('校验失败(400)同样落盘且 ok=false；非决策路由不落盘', async () => {
    const logFile = path.join(logsDir, `decision-requests-${new Date().toISOString().slice(0, 10)}.jsonl`);
    const linesBefore = (await readFile(logFile, 'utf-8')).trim().split('\n').length;

    await app.request('/api/simulate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ context: {} }),
    });
    const { flushDecisionLog } = await import('./decision-request-log.js');
    await flushDecisionLog();
    const lines = (await readFile(logFile, 'utf-8')).trim().split('\n');
    expect(lines.length).toBe(linesBefore + 1); // 决策路由 +1
    const last = JSON.parse(lines.at(-1)!) as Record<string, unknown>;
    expect(last.status).toBe(400);
    expect(last.ok).toBe(false);

    // 非 simulate/decision 路由不产生日志
    await app.request('/api/rosters');
    await flushDecisionLog();
    expect((await readFile(logFile, 'utf-8')).trim().split('\n').length).toBe(lines.length);
  });

  test('pruneDecisionLogs：保留今天+最近 keepDays，更早文件删除', async () => {
    const { pruneDecisionLogs } = await import('./decision-request-log.js');
    const keepDir = await mkdtemp(path.join(tmpdir(), 'editor-logkeep-'));
    for (const day of ['2025-12-31', '2026-01-01', '2026-01-02', '2026-01-08', '2026-01-09']) {
      await writeFile(path.join(keepDir, `decision-requests-${day}.jsonl`), '{}\n', 'utf-8');
    }
    await writeFile(path.join(keepDir, 'unrelated.txt'), 'x', 'utf-8');
    const removed = await pruneDecisionLogs({
      dir: keepDir,
      now: new Date('2026-01-09T12:00:00.000Z'),
      keepDays: 7,
    });
    expect(removed).toBe(2); // 12-31(9天前)/01-01(8天前) 超出窗口；恰好 7 天前的 01-02 属保留窗口
    expect((await readdir(keepDir)).sort()).toEqual([
      'decision-requests-2026-01-02.jsonl',
      'decision-requests-2026-01-08.jsonl',
      'decision-requests-2026-01-09.jsonl',
      'unrelated.txt',
    ]);
    await rm(keepDir, { recursive: true, force: true });
  });
});
