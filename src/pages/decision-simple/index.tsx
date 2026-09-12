import React, { useMemo, useRef, useState } from 'react';
import { CirclePlay, Lightbulb, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { decisionTemplates } from '../../assets/decision-templates';
import { useSearchParams } from 'react-router-dom';
import { DecisionGraphRef, DecisionGraphType, GraphSimulator, JdmUiMode, Simulation } from '@republicroad/jdm-editor';
import {
  ShellHeader,
  SkinnedDecisionGraph,
  VersionHistoryPanel,
  createGraphsHttpAdapter,
  createIndexedDbAdapter,
  EditorShellProvider,
  useEditorShell,
} from '@republicroad/jdm-appshell';
import { PageHeader } from '../../components/page-header.tsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@republicroad/jdm-appshell/src/components/ui/alert-dialog';
import { Button } from '@republicroad/jdm-appshell/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@republicroad/jdm-appshell/src/components/ui/dropdown-menu';
import { match, P } from 'ts-pattern';

import classes from './decision-simple.module.css';
import { ThemePreference, useTheme } from '@republicroad/jdm-appshell';
// I18nProvider 尚未进内核 barrel（libsuggest 跟进），源码直通相对导入
import { I18nProvider } from '../../../jdm-editor/packages/jdm-editor/src/theming/i18n';
import { PageToolbar } from './page-toolbar.tsx';
import { useAutosave } from './use-autosave.ts';
import { useConfirmDialog } from './use-confirm-dialog.ts';
import { isFileSystemApiSupported, useLocalFile } from './use-local-file.ts';
import { useRemoteGraph } from './use-remote-graph.ts';

const THEME_LABELS: Record<ThemePreference, string> = {
  [ThemePreference.Automatic]: 'Automatic',
  [ThemePreference.Dark]: 'Dark',
  [ThemePreference.Light]: 'Light',
};

export const DecisionSimplePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  // 持久化默认 local-first（第七十四批，业界演示仓惯例：excalidraw/tldraw 同款）：
  // IndexedDB 本地适配器，clone → bun run dev 纯前端即得完整编辑器，零服务端零滥用面；
  // ?storage=http 显式切换服务端适配器（apps/editor /api/graphs，作为 GraphPersistenceAdapter
  // 的后端集成示例保留，见 docs/15）。宿主应用换成自己的适配器即可。
  const storageMode = searchParams.get('storage') === 'http' ? 'http' : 'local';
  const persistence = useMemo(
    () => (storageMode === 'local' ? createIndexedDbAdapter() : createGraphsHttpAdapter()),
    [storageMode],
  );
  return (
    <I18nProvider locale="zh-CN">
      <EditorShellProvider options={{ persistence }}>
        <DecisionSimpleInner />
      </EditorShellProvider>
    </I18nProvider>
  );
};

const DecisionSimpleInner: React.FC = () => {
  const graphRef = React.useRef<DecisionGraphRef>(null);
  // 隐藏 <input type=file>：无 File System Access API 的浏览器回退打开通道
  const fileInput = useRef<HTMLInputElement>(null);
  const { themePreference, setThemePreference, skins, skinId, setSkinId, activeSkin } = useTheme();

  const { customNodes, schema, userResolver, runSimulate, persistence } = useEditorShell();

  const [searchParams] = useSearchParams();
  const [fileName, setFileName] = useState('Untitled Decision');
  const [graphTrace, setGraphTrace] = useState<Simulation>();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [mode, setMode] = useState<JdmUiMode>('business');
  const { pendingConfirm, confirm, close } = useConfirmDialog();

  const supportFSApi = isFileSystemApiSupported();

  const getTemplateGraph = (template: string): DecisionGraphType | undefined =>
    match(template)
      .with(P.string, (key) => decisionTemplates?.[key])
      .otherwise(() => undefined);

  // 模板直开（?template=key）：初始化即应用（原为 mount effect 内 setGraph，
  // 第六十一批改惰性 useState——行为等价且符合 react-hooks 编译期规则）
  const [graph, setGraph] = useState<DecisionGraphType>(() => {
    const templateParam = searchParams.get('template');
    const templateGraph = templateParam ? getTemplateGraph(templateParam) : undefined;
    return templateGraph ?? { nodes: [], edges: [] };
  });

  const localFile = useLocalFile({ fileInput, graph, setGraph, fileName, setFileName });
  const {
    remoteSource,
    libraryGraphs,
    remoteVersions,
    versionDiffs,
    diffBaseline,
    persistToRemote,
    refreshLibrary,
    openRemoteGraph,
    refreshVersions,
    setVersionPinned,
    renameVersion,
    restoreVersionToHead,
    computeVersionDiffs,
    clearDiffBaseline,
    resetSource,
  } = useRemoteGraph({ persistence, graph, fileName, graphRef, setGraph, setFileName });

  // 自动保存布防：仅宿主存储 + 已打开图 + 版本面板未开时；persist 成功返回 true 由 hook 清 dirty 位
  const graphSignature = useMemo(() => JSON.stringify(graph), [graph]);
  const autosave = useAutosave({
    armed: Boolean(persistence && remoteSource && !historyOpen),
    sourceKey: `${remoteSource?.id ?? ''}:${remoteSource?.revision ?? ''}`,
    graphSignature,
    persist: () => persistToRemote({ auto: true }).then((result) => result.ok),
  });

  const saveFileAs = async () => {
    if (persistence) {
      const result = await persistToRemote({ auto: false });
      if (result.ok) {
        // 保存成功即清 dirty 位（手动/自动共用语义；自动路径在 use-autosave 内清）
        autosave.clearDirty();
        setFileName(`${result.id}.json`);
        toast.success('Saved to graph library');
      } else if (result.reason === 'conflict') {
        toast.error('This graph was modified by someone else. Refresh before saving to avoid overwriting.');
      }
      return;
    }

    await localFile.saveFileAsLocal();
  };

  const saveFile = async () => {
    if (persistence) {
      return saveFileAs();
    }

    if (!supportFSApi) {
      toast.error('Unsupported file system API');
      return;
    }

    await localFile.saveFileLocal();
  };

  const handleNew = async () => {
    confirm({
      title: 'New decision',
      description: 'Are you sure you want to create new blank decision, your current work might be lost?',
      onConfirm: () => {
        setGraph({
          nodes: [],
          edges: [],
        });
        resetSource();
        setFileName('Untitled Decision');
      },
    });
  };

  const confirmTemplate = (key: string) => {
    confirm({
      title: 'Open example',
      description: 'Are you sure you want to open example decision, your current work might be lost?',
      onConfirm: () => {
        const templateGraph = getTemplateGraph(key);
        if (templateGraph) {
          setGraph(templateGraph);
        }
      },
    });
  };

  /** 恢复（restore-is-forward，库标准入口）：立即把目标版本固化为新 head 并重载画布 */
  const confirmRestoreVersion = (revision: string) => {
    confirm({
      title: 'Restore version',
      description: `Restore version ${revision} as the new head? It is saved immediately; the canvas will mark differences against the pre-restore content.`,
      onConfirm: () => void restoreVersionToHead(revision),
    });
  };

  const handleOpenTemplate = (key: string) => {
    if (Object.hasOwn(decisionTemplates, key)) {
      confirmTemplate(key);
    }
  };

  return (
    <>
      <input
        hidden
        accept="application/json"
        type="file"
        ref={fileInput}
        onChange={(event) => void localFile.handleUploadInput(event)}
        onClick={(event) => {
          if ('value' in event.target) {
            event.target.value = null;
          }
        }}
      />
      <div className={classes.page}>
        <PageHeader
          className="border-b bg-muted/50 p-2"
          title={
            <PageToolbar
              fileName={fileName}
              onRenameFile={(value) => setFileName(value.trim())}
              onNew={() => void handleNew()}
              hasLibrary={Boolean(persistence?.list)}
              libraryGraphs={libraryGraphs}
              onRefreshLibrary={() => void refreshLibrary()}
              onOpenLibraryGraph={(id) => void openRemoteGraph(id)}
              onOpenFromFileSystem={() => void localFile.openFile()}
              onOpenTemplate={handleOpenTemplate}
              hasVersions={Boolean(persistence?.listVersions && remoteSource)}
              onOpenVersions={() => {
                if (!remoteSource) return;
                void refreshVersions(remoteSource.id);
                void computeVersionDiffs(remoteSource.id);
                setHistoryOpen(true);
              }}
              showSave={Boolean(supportFSApi || persistence)}
              onSave={() => void saveFile()}
              onSaveAs={() => void saveFileAs()}
              mode={mode}
              onModeChange={setMode}
            />
          }
          ghost={false}
          extra={[
            skins.length > 0 && (
              <DropdownMenu key="skin-switcher">
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="gap-1.5" aria-label="切换皮肤">
                    <Palette className="size-4" />
                    {activeSkin?.label ?? '皮肤'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px]">
                  {skins.map((skin) => (
                    <DropdownMenuCheckboxItem
                      key={skin.id}
                      checked={skin.id === skinId}
                      onCheckedChange={() => setSkinId(skin.id)}
                    >
                      {skin.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ),
            <DropdownMenu key="theme-preference">
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="切换主题">
                  <Lightbulb />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[150px]">
                {(Object.values(ThemePreference) as ThemePreference[]).map((preference) => (
                  <DropdownMenuCheckboxItem
                    key={preference}
                    checked={themePreference === preference}
                    onCheckedChange={() => setThemePreference(preference)}
                  >
                    {THEME_LABELS[preference]}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>,
          ]}
        />
        {/* S005 P3：皮肤头部槽位增量行（无槽位皮肤返回 null 零影响；PageHeader 宿主自摆不动） */}
        <ShellHeader className="border-b px-2 py-1" graph={graph} graphRef={graphRef} />
        <div className={classes.contentWrapper}>
          <div className={classes.content}>
            <SkinnedDecisionGraph
              mode={mode}
              customNodes={customNodes}
              customFunctions={schema ?? undefined}
              diffBaseline={diffBaseline}
              ref={graphRef}
              value={graph}
              onChange={(value) => {
                // 编辑器内用户改动才标记 dirty——加载/恢复/模板等直接 setGraph 的路径不经过这里
                autosave.markDirty();
                // diffBaseline 是恢复时刻的差异标记：用户开始编辑即过期，立即清除
                clearDiffBaseline();
                setGraph(value);
              }}
              reactFlowProOptions={{ hideAttribution: true }}
              simulate={graphTrace}
              userResolver={userResolver}
              panels={[
                {
                  id: 'simulator',
                  title: 'Simulator',
                  icon: <CirclePlay />,
                  renderPanel: () => (
                    <GraphSimulator
                      onClear={() => setGraphTrace(undefined)}
                      onRun={async ({ graph, context }) => {
                        const { simulation, errorMessage } = await runSimulate(graph, context);
                        if (errorMessage) {
                          toast.error(errorMessage);
                        }
                        setGraphTrace(simulation);
                      }}
                    />
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>
      <AlertDialog open={pendingConfirm !== null} onOpenChange={(open) => (!open ? close() : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingConfirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{pendingConfirm?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                pendingConfirm?.onConfirm();
                close();
              }}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {remoteSource && (
        <VersionHistoryPanel
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          versions={remoteVersions}
          currentRevision={remoteSource.revision}
          onRestore={(revision) => confirmRestoreVersion(revision)}
          onRename={
            persistence?.renameVersion
              ? (revision, versionName) => void renameVersion(revision, versionName)
              : undefined
          }
          onPin={
            persistence?.updateVersionMeta ? (revision, pinned) => void setVersionPinned(revision, pinned) : undefined
          }
          diffs={versionDiffs}
        />
      )}
    </>
  );
};
