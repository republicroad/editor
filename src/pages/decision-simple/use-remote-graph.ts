import React, { useState } from 'react';
import { toast } from 'sonner';
import type { DecisionGraphRef, DecisionGraphType } from '@republicroad/jdm-editor';
import type { GraphPersistenceAdapter } from '@republicroad/jdm-appshell/src/shell/persistence';
import { displayError } from '../../helpers/error-message.ts';
import { DecisionEdge, DecisionNode, normalizeGraphNodes } from '../../helpers/graph.ts';
import { assertAcyclic } from '../../lib/graph-cycle.ts';
import { listRemoteVersions, loadFromRemote, saveToRemote, type GraphLike } from '../../lib/graph-persistence.ts';
import type { VersionEntry } from './pin-versions-sheet.tsx';

export interface RemoteSource {
  id: string;
  revision?: string;
}

export type RemoteSaveOutcome =
  | { ok: true; id: string; revision: string }
  | { ok: false; reason?: 'conflict' | 'no-source' };

interface UseRemoteGraphOptions {
  persistence: GraphPersistenceAdapter | undefined;
  /** 仅 http 模式提供版本钉住（PATCH 直连服务端；IndexedDB 适配器无该端点） */
  storageMode: 'local' | 'http';
  graph: DecisionGraphType;
  fileName: string;
  graphRef: React.RefObject<DecisionGraphRef>;
  setGraph: (graph: DecisionGraphType) => void;
  setFileName: (name: string) => void;
}

/** 宿主存储分支（Graph library / 保存 / 版本历史 / 钉住）——页面与 persistence 适配器之间的状态接线 */
export const useRemoteGraph = ({
  persistence,
  storageMode,
  graph,
  fileName,
  graphRef,
  setGraph,
  setFileName,
}: UseRemoteGraphOptions) => {
  // 当前打开来源：remote = 宿主存储(persistence)；undefined = 本地文件/未打开
  const [remoteSource, setRemoteSource] = useState<RemoteSource>();
  const [libraryGraphs, setLibraryGraphs] = useState<Array<{ id: string; name: string; updatedAt?: string }>>();
  const [remoteVersions, setRemoteVersions] = useState<VersionEntry[]>([]);
  const [pinningRevision, setPinningRevision] = useState<string>();

  /**
   * 远程持久化（手动/自动保存共用）：session 快照入库 + 乐观锁推进。
   * 返回 {ok:false, reason:'conflict'|'no-source'} 时调用方自行处理反馈。
   */
  const persistToRemote = async (opts: { auto: boolean }): Promise<RemoteSaveOutcome> => {
    if (!persistence) {
      return { ok: false, reason: 'no-source' };
    }
    try {
      assertAcyclic(graph.edges ?? []);
      // UI 会话现场（viewport/页签/各页签 slice）随保存入库——历史条目=完整现场快照
      const session = graphRef.current?.serialize();
      const result = await saveToRemote(persistence, {
        graph: graph as unknown as GraphLike,
        name: fileName.replaceAll('.json', ''),
        id: remoteSource?.id,
        baseRevision: remoteSource?.revision,
        session,
        auto: opts.auto,
      });
      if (result.kind === 'conflict') {
        return { ok: false, reason: 'conflict' };
      }
      // 乐观锁基线推进：auto 保存后手动保存才能命中新 head（否则必 CONFLICT 误报）
      setRemoteSource({ id: result.id, revision: result.revision });
      return { ok: true, id: result.id, revision: result.revision };
    } catch (e) {
      displayError(e);
      return { ok: false };
    }
  };

  const refreshLibrary = async () => {
    if (!persistence?.list) return;
    try {
      const graphs = await persistence.list();
      setLibraryGraphs(graphs.map(({ id, name, updatedAt }) => ({ id, name, updatedAt })));
    } catch (e) {
      displayError(e);
    }
  };

  const openRemoteGraph = async (id: string, revision?: string) => {
    if (!persistence) return;
    try {
      const loaded = await loadFromRemote(persistence, id, revision ? { revision } : undefined);
      if (!loaded) {
        toast.error('Graph not found');
        return;
      }
      setGraph({
        nodes: normalizeGraphNodes((loaded.graph as { nodes?: DecisionNode[] }).nodes ?? []),
        edges: (loaded.graph as { edges?: DecisionEdge[] }).edges ?? [],
      });
      // UI 会话现场恢复（viewport/页签/各页签 slice）——旧记录无 session 时跳过
      if (loaded.session) {
        graphRef.current?.restore(loaded.session);
      }
      // 恢复即前进（restore is forward）：加载历史版本后，remoteSource 不带 revision——
      // 后续保存创建新版本（不覆盖其后版本，历史不可破坏）
      setRemoteSource({ id });
      setFileName(id);
      if (revision) {
        toast.success(`Restored ${revision} — saving will create a new version`);
      }
    } catch (e) {
      displayError(e);
    }
  };

  const refreshVersions = async (id: string) => {
    if (!persistence?.listVersions) return;
    try {
      const versions = await listRemoteVersions(persistence, id);
      setRemoteVersions(versions);
    } catch (e) {
      displayError(e);
    }
  };

  /** 钉住 auto 版本（升格 manual，免于 AUTO_VERSIONS_KEEP 滚动删除）。
   *  HTTP 模式直连 PATCH（adapter.updateVersionMeta 待内核 S006 就绪后切换）。 */
  const pinVersion = async (revision: string) => {
    if (!remoteSource || storageMode !== 'http') return;
    setPinningRevision(revision);
    try {
      const res = await fetch(
        `/api/graphs/${encodeURIComponent(remoteSource.id)}/versions/${encodeURIComponent(revision)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ auto: false }),
        },
      );
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      toast.success(`Version ${revision} pinned — exempt from auto-version cleanup`);
      await refreshVersions(remoteSource.id);
    } catch (e) {
      displayError(e);
    } finally {
      setPinningRevision(undefined);
    }
  };

  /** 新建空白图时清空远程来源（回到未打开状态） */
  const resetSource = () => setRemoteSource(undefined);

  return {
    remoteSource,
    libraryGraphs,
    remoteVersions,
    pinningRevision,
    persistToRemote,
    refreshLibrary,
    openRemoteGraph,
    refreshVersions,
    pinVersion,
    resetSource,
  };
};
