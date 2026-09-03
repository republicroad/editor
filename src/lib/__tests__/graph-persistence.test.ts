import { describe, expect, test } from 'bun:test';
import { GraphPersistenceError, type GraphPersistenceAdapter } from '@republicroad/jdm-appshell/src/shell/persistence';
import { listRemoteVersions, loadFromRemote, saveToRemote } from '../graph-persistence';

const graph = { nodes: [{ id: 'in' }], edges: [] };

describe('saveToRemote', () => {
  test('无 id 新建：调用 adapter.save 不加 baseRevision，返回分配的 id/revision', async () => {
    const calls: Array<{ id?: string; base?: string }> = [];
    const adapter: GraphPersistenceAdapter = {
      load: async () => null,
      save: async (record, opts) => {
        calls.push({ id: record.id, base: opts?.baseRevision });
        return { id: 'created-id', revision: 'v1' };
      },
    };
    const result = await saveToRemote(adapter, { graph: graph as never, name: 'n' });
    expect(result).toEqual({ kind: 'saved', id: 'created-id', revision: 'v1' });
    expect(calls).toEqual([{ id: '', base: undefined }]);
  });

  test('有 id：excel upsert 传 baseRevision', async () => {
    let seenOpts: { baseRevision?: string } | undefined;
    const adapter: GraphPersistenceAdapter = {
      load: async () => null,
      save: async (_record, opts) => {
        seenOpts = opts;
        return { id: 'g1', revision: 'v2' };
      },
    };
    const result = await saveToRemote(adapter, {
      graph: graph as never,
      name: 'n',
      id: 'g1',
      baseRevision: 'v1',
    });
    expect(result).toEqual({ kind: 'saved', id: 'g1', revision: 'v2' });
    expect(seenOpts).toEqual({ baseRevision: 'v1' });
  });

  test('CONFLICT 冲突：返回 {kind:"conflict"} 而不抛出', async () => {
    const adapter: GraphPersistenceAdapter = {
      load: async () => null,
      save: async () => {
        throw new GraphPersistenceError('CONFLICT', 'mismatch');
      },
    };
    const result = await saveToRemote(adapter, { graph: graph as never, name: 'n', id: 'g1', baseRevision: 'v1' });
    expect(result).toEqual({ kind: 'conflict' });
  });

  test('非 CONFLICT 错误：原样抛出', async () => {
    const adapter: GraphPersistenceAdapter = {
      load: async () => null,
      save: async () => {
        throw new GraphPersistenceError('NOT_FOUND', 'gone');
      },
    };
    await expect(saveToRemote(adapter, { graph: graph as never, name: 'n', id: 'g1' })).rejects.toThrow('gone');
  });
});

describe('loadFromRemote', () => {
  test('返回 content 解包为图', async () => {
    const adapter: GraphPersistenceAdapter = {
      load: async () => ({ id: 'g1', name: 'n', revision: 'v1', content: graph }),
      save: async () => ({ id: 'x', revision: 'v1' }),
    };
    expect(await loadFromRemote(adapter, 'g1')).toEqual(graph);
  });

  test('load 返回 null(不可见/不存在)时返回 null', async () => {
    const adapter: GraphPersistenceAdapter = {
      load: async () => null,
      save: async () => ({ id: 'x', revision: 'v1' }),
    };
    expect(await loadFromRemote(adapter, 'nope')).toBeNull();
  });

  test('load 透传 revision 到 adapter.load', async () => {
    let seen: { revision?: string } | undefined;
    const adapter: GraphPersistenceAdapter = {
      load: async (_id, opts) => {
        seen = opts;
        return { id: 'g1', name: 'n', revision: 'v2', content: graph };
      },
      save: async () => ({ id: 'x', revision: 'v1' }),
    };
    await loadFromRemote(adapter, 'g1', { revision: 'v2' });
    expect(seen).toEqual({ revision: 'v2' });
  });
});

describe('listRemoteVersions', () => {
  test('透传 adapter.listVersions 的结果', async () => {
    const adapter: GraphPersistenceAdapter = {
      load: async () => null,
      save: async () => ({ id: 'x', revision: 'v1' }),
      listVersions: async () => [
        { revision: 'v1', updatedAt: '2026-01-01' },
        { revision: 'v2', updatedAt: '2026-01-02' },
      ],
    };
    expect(await listRemoteVersions(adapter, 'g1')).toEqual([
      { revision: 'v1', updatedAt: '2026-01-01' },
      { revision: 'v2', updatedAt: '2026-01-02' },
    ]);
  });

  test('适配器未实现 listVersions 时返回空数组', async () => {
    const adapter: GraphPersistenceAdapter = {
      load: async () => null,
      save: async () => ({ id: 'x', revision: 'v1' }),
    };
    expect(await listRemoteVersions(adapter, 'g1')).toEqual([]);
  });
});
