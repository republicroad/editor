import React, { useState } from 'react';
import { toast } from 'sonner';
import type { DecisionGraphRef, DecisionGraphType, GraphDiff } from '@republicroad/jdm-editor';
import { computeGraphDiff } from '@republicroad/jdm-editor';
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
  const [versionDiffs, setVersionDiffs] = useState<Record<string, GraphDiff>>();

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
      setVersionDiffs(undefined);
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
   *  HTTP 模式直连 PATCH（面板 Pin 入口属内核 S007 范围，交付后切换）。 */
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

  /** 重命名/清除历史版本命名（adapter.renameVersion → 后端 PATCH {versionName}，第六十四批接线；
   *  IndexedDB 本地适配器同款实现，本地模式亦可重命名） */
  const renameVersion = async (revision: string, versionName: string | null) => {
    if (!remoteSource || !persistence?.renameVersion) return;
    try {
      await persistence.renameVersion(remoteSource.id, revision, versionName);
      toast.success(versionName ? `Version ${revision} named “${versionName}”` : `Version ${revision} name cleared`);
      await refreshVersions(remoteSource.id);
    } catch (e) {
      displayError(e);
    }
  };

  /** 各版本相对前一版的差异摘要（S004 P1 消费：宿主只做基线计算，展示语义归内核面板）。
   *  以 adapter 返回序为时间序，第 i 版基线 = 第 i-1 版，键 = 版本 revision；
   *  每次打开历史面板时全量重算（本地存储逐版加载，量级受保留策略约束）。 */
  const computeVersionDiffs = async (id: string) => {
    if (!persistence?.listVersions || !persistence.load) return;
    try {
      const versions = await listRemoteVersions(persistence, id);
      const graphs: Array<{ revision: string; graph: GraphLike }> = [];
      for (const entry of versions) {
        const loaded = await loadFromRemote(persistence, id, { revision: entry.revision });
        if (loaded) graphs.push({ revision: entry.revision, graph: loaded.graph });
      }
      const diffs: Record<string, GraphDiff> = {};
      for (let i = 1; i < graphs.length; i++) {
        diffs[graphs[i].revision] = computeGraphDiff(
          graphs[i - 1].graph as DecisionGraphType,
          graphs[i].graph as DecisionGraphType,
        );
      }
      setVersionDiffs(diffs);
    } catch (e) {
      displayError(e);
    }
  };

  /** 新建空白图时清空远程来源（回到未打开状态） */
  const resetSource = () => {
    setRemoteSource(undefined);
    setVersionDiffs(undefined);
  };

  return {
    remoteSource,
    libraryGraphs,
    remoteVersions,
    pinningRevision,
    versionDiffs,
    persistToRemote,
    refreshLibrary,
    openRemoteGraph,
    refreshVersions,
    pinVersion,
    renameVersion,
    computeVersionDiffs,
    resetSource,
  };
};
