/**
 * 部署冒烟链固化（第六十六批 A4，复刻第五十九批手工链）：
 *   build → up → healthz → 签名 cookie 建图 → auto 保存 v2/v3 → PATCH 钉住 v2
 *   → 容器重启 → 版本表/钉住/内容持久化复核。
 *
 * 任一步失败即非零退出；成功打印 PASS 摘要退出 0。
 *
 * 用法（容器运行时需可用，本仓标准为 podman compose）：
 *   bun run smoke:deploy
 * 环境变量：
 *   SMOKE_COMPOSE  compose 命令前缀（默认 "podman compose"，空格分词）
 *   SMOKE_PORT     宿主侧端口（默认 3000，经 compose PORT 插值映射容器 3000）
 *   SMOKE_KEEP=1   结束后保留栈运行（供浏览器级 UI 实机验证；否则 down 停栈）
 *   SMOKE_CLEAN=1  结束时连卷一起删除（down -v；默认保留卷，冒烟数据留待人工检视）
 *   SMOKE_CONTAINER 主容器名（默认 jdm-editor，与 compose container_name 一致）
 *
 * 前提：AUTH_SECRET 已在 docker-compose.yml 给出本地默认值（签名 cookie 模式生效）。
 * A3 硬化配套：历史卷（A3 之前以容器 root 创建）属主会被自动一次性迁移为 bun(1000)，
 * 见 waitHealthz 内 migrateVolumeOwnership——存量部署升级到硬化镜像时同样适用。
 */

const composePrefix = (process.env.SMOKE_COMPOSE ?? 'podman compose').trim().split(/\s+/);
const port = process.env.SMOKE_PORT ?? '3000';
const base = `http://localhost:${port}`;
const keep = process.env.SMOKE_KEEP === '1';
const clean = process.env.SMOKE_CLEAN === '1';

let failed = false;
const step = (name: string, fn: () => Promise<string>): Promise<string> =>
  fn().then(
    (detail) => {
      console.log(`[smoke] ✓ ${name}${detail ? ` — ${detail}` : ''}`);
      return detail;
    },
    (e) => {
      failed = true;
      console.error(`[smoke] ✗ ${name} — ${e instanceof Error ? e.message : e}`);
      throw e;
    },
  );

/** compose 子命令（继承 env 并注入 PORT 供插值） */
const compose = async (...args: string[]) => {
  const proc = Bun.spawn([...composePrefix, ...args], {
    stdout: 'inherit',
    stderr: 'inherit',
    env: { ...process.env, PORT: port },
  });
  const code = await proc.exited;
  if (code !== 0) throw new Error(`compose ${args.join(' ')} exited ${code}`);
};

/** 一次性卷属主迁移：A3 硬化前的历史卷属主为容器 root，非 root 进程不可写——
 *  以 --user 0 借用主容器的卷挂载（--volumes-from，卷名无关），把 /data 归属改为 bun(1000)。
 *  幂等：仅当 healthz 报 graphsDirWritable=false 时执行一次。 */
const migrateVolumeOwnership = async () => {
  const container = process.env.SMOKE_CONTAINER ?? 'jdm-editor';
  const image = 'ghcr.io/republicroad/editor:local';
  const proc = Bun.spawn(
    [
      ...composePrefix.slice(0, 1),
      'run',
      '--rm',
      '--user',
      '0',
      '--volumes-from',
      container,
      image,
      'chown',
      '-R',
      '1000:1000',
      '/data',
    ],
    { stdout: 'inherit', stderr: 'inherit' },
  );
  const code = await proc.exited;
  if (code !== 0) throw new Error(`卷属主迁移 helper exited ${code}`);
};

/** 轮询 healthz 直至 ok 且数据目录可写（自动执行一次旧卷属主迁移） */
const waitHealthz = async (label: string) => {
  const deadline = Date.now() + 120_000;
  let migrated = false;
  for (;;) {
    try {
      const res = await fetch(`${base}/healthz`);
      const body = (await res.json()) as { ok?: boolean; graphsDirWritable?: boolean };
      if (res.ok && body.ok && body.graphsDirWritable) {
        await step(`${label} healthz`, async () => `ok, graphsDirWritable=true`);
        return;
      }
      if (body.graphsDirWritable === false && !migrated) {
        migrated = true;
        await step(`${label} 旧卷属主迁移（历史 root 卷 → bun）`, () =>
          migrateVolumeOwnership().then(() => 'chown 1000:1000 /data'),
        );
      }
    } catch {
      // 未就绪，继续轮询
    }
    if (Date.now() > deadline) throw new Error(`${label} healthz 超时（120s）`);
    await Bun.sleep(2000);
  }
};

const content = {
  contentType: 'application/vnd.gorules.decision',
  nodes: [
    { id: 'in', type: 'inputNode', name: 'Input', position: { x: 0, y: 0 } },
    { id: 'out', type: 'outputNode', name: 'Output', position: { x: 220, y: 0 } },
  ],
  edges: [{ id: 'e1', sourceId: 'in', targetId: 'out' }],
};

try {
  await step('compose up -d --build', () => compose('up', '-d', '--build').then(() => ''));
  await waitHealthz('首次启动');

  // 签名 cookie：首个请求无 cookie → 服务端签发新匿名身份（Set-Cookie gid），会话内复用
  let cookie = '';
  const authorized = async (path: string, init?: RequestInit) => {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}), ...init?.headers },
    });
    const setCookies = res.headers.getSetCookie();
    if (setCookies.length > 0) {
      cookie = setCookies.map((c) => c.split(';')[0]).join('; ');
    }
    if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path} → HTTP ${res.status}`);
    return res;
  };

  const name = `smoke-${Date.now()}`;
  const created = (await await step('签名 cookie 建图(v1 manual)', async () => {
    const res = await authorized('/api/graphs', { method: 'POST', body: JSON.stringify({ name, content }) });
    return (await res.json()) as { id: string; revision: string };
  })) as { id: string; revision: string };
  if (!cookie) throw new Error('未捕获到签名 cookie（Set-Cookie 缺失）——AUTH_SECRET 模式未生效？');
  if (created.revision !== 'v1') throw new Error(`首版 revision=${created.revision}，预期 v1`);

  await step('auto 保存 v2/v3', async () => {
    for (const i of [2, 3]) {
      await authorized(`/api/graphs/${created.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, content, baseRevision: `v${i - 1}`, auto: true }),
      });
    }
    return 'v2, v3 archived';
  });

  await step('PATCH 钉住 v2(versionName=smoke-pinned, auto=false)', () =>
    authorized(`/api/graphs/${created.id}/versions/v2`, {
      method: 'PATCH',
      body: JSON.stringify({ versionName: 'smoke-pinned', auto: false }),
    }).then(() => ''),
  );

  await step('容器重启', () => compose('restart', 'editor').then(() => ''));
  await waitHealthz('重启后');

  const versions = (await await step('重启后版本表复核', async () => {
    const res = await authorized(`/api/graphs/${created.id}/versions`);
    return (await res.json()) as Array<{ revision: string; versionName?: string; auto?: boolean }>;
  })) as Array<{ revision: string; versionName?: string; auto?: boolean }>;
  const v2 = versions.find((v) => v.revision === 'v2');
  if (!v2) throw new Error('重启后 v2 丢失——卷持久化失败');
  if (v2.versionName !== 'smoke-pinned' || v2.auto !== false) {
    throw new Error(`重启后 v2 钉住标记丢失：${JSON.stringify(v2)}`);
  }
  const detail = (await (await authorized(`/api/graphs/${created.id}`)).json()) as { content?: unknown };
  if (!detail.content || (detail.content as { nodes?: unknown[] }).nodes?.length !== 2) {
    throw new Error('重启后 head 内容异常');
  }

  console.log(`\n[smoke] PASS — 图 ${created.id}（${name}）：建图/auto 保存/钉住/重启持久化 全链通过`);
} catch {
  failed = true;
} finally {
  if (!keep && !failed) {
    await compose('down', ...(clean ? ['-v'] : [])).catch(() => {});
    console.log(`[smoke] 栈已停止${clean ? '（含卷删除）' : '（卷保留，冒烟数据可人工检视）'}`);
  } else if (keep) {
    console.log(`[smoke] 栈保留运行（SMOKE_KEEP=1）— ${base} 可供浏览器级 UI 实机验证`);
  }
}
if (failed) process.exit(1);
