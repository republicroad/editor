import React, { useEffect, useRef, useState } from 'react';
import { CirclePlay, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { decisionTemplates } from '../assets/decision-templates';
import { displayError } from '../helpers/error-message.ts';
import { DecisionContent, DecisionEdge, DecisionNode, normalizeGraphNodes } from '../helpers/graph.ts';
import { useSearchParams } from 'react-router-dom';
import {
  DecisionGraph,
  DecisionGraphRef,
  DecisionGraphType,
  GraphSimulator,
  JdmUiMode,
  Simulation,
} from '@gorules/jdm-editor';
import { PageHeader } from '../components/page-header.tsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Separator } from '../components/ui/separator';
import { Switch } from '../components/ui/switch';
import { DirectedGraph } from 'graphology';
import { hasCycle } from 'graphology-dag';
import { Stack } from '../components/stack.tsx';
import { match, P } from 'ts-pattern';

import classes from './decision-simple.module.css';
import { ThemePreference, useTheme } from '../context/theme.provider.tsx';
import { readStorage, writeStorage } from '../lib/storage-key.ts';
import { loadFromRemote, saveToRemote, type GraphLike } from '../lib/graph-persistence.ts';
import { EditorShellProvider, useEditorShell } from '../shell';

enum DocumentFileTypes {
  Decision = 'application/vnd.gorules.decision',
}

const supportFSApi = Object.hasOwn(window, 'showSaveFilePicker');

const THEME_LABELS: Record<ThemePreference, string> = {
  [ThemePreference.Automatic]: 'Automatic',
  [ThemePreference.Dark]: 'Dark',
  [ThemePreference.Light]: 'Light',
};

const EditableTitle: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  if (!editing && prevValue !== value) {
    setPrevValue(value);
    setDraft(value);
  }

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onChange(trimmed);
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        title={value}
        className="max-w-56 truncate rounded text-left text-base font-normal outline-none hover:bg-accent focus-visible:bg-accent"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
      >
        {value}
      </button>
    );
  }

  return (
    <input
      autoFocus
      value={draft}
      maxLength={24}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          commit();
        }
        if (event.key === 'Escape') {
          setEditing(false);
        }
      }}
      className="w-56 rounded-md border border-input bg-transparent px-1.5 py-0.5 text-base outline-none focus-visible:ring-1 focus-visible:ring-ring"
    />
  );
};

export const DecisionSimplePage: React.FC = () => {
  return (
    <EditorShellProvider>
      <DecisionSimpleInner />
    </EditorShellProvider>
  );
};

const DecisionSimpleInner: React.FC = () => {
  const fileInput = useRef<HTMLInputElement>(null);
  const graphRef = React.useRef<DecisionGraphRef>(null);
  const { themePreference, setThemePreference } = useTheme();

  const { customNodes, summaryCustomNodes, schema, userResolver, runSimulate, persistence } = useEditorShell();
  const [summaryCard, setSummaryCard] = useState(() => readStorage('custom-node-summary-card') === 'true');
  const toggleSummaryCard = (checked: boolean) => {
    setSummaryCard(checked);
    writeStorage('custom-node-summary-card', String(checked));
  };

  const [searchParams] = useSearchParams();
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle>();
  const [graph, setGraph] = useState<DecisionGraphType>({ nodes: [], edges: [] });
  const [fileName, setFileName] = useState('Untitled Decision');
  // 当前打开来源：remote = 宿主存储(persistence)，local = 浏览器本地文件
  const [remoteSource, setRemoteSource] = useState<{ id: string; revision?: string }>();
  const [libraryGraphs, setLibraryGraphs] = useState<Array<{ id: string; name: string; updatedAt?: string }>>();
  const [graphTrace, setGraphTrace] = useState<Simulation>();
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    const templateParam = searchParams.get('template');
    if (templateParam) {
      loadTemplateGraph(templateParam);
    }
  }, []);

  const loadTemplateGraph = (template: string) => {
    const templateGraph = match(template)
      .with(P.string, (template) => decisionTemplates?.[template])
      .otherwise(() => undefined);

    if (templateGraph) {
      setGraph(templateGraph);
    }
  };

  const openFile = async () => {
    if (!supportFSApi) {
      fileInput.current?.click?.();
      return;
    }

    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ accept: { 'application/json': ['.json'] } }],
      });

      setFileHandle(handle);

      const file = await handle.getFile();
      const content = await file.text();
      setFileName(file?.name);
      const parsed = JSON.parse(content);
      setGraph({
        nodes: normalizeGraphNodes(parsed?.nodes || []),
        edges: parsed?.edges || [],
      });
    } catch (err) {
      displayError(err);
    }
  };

  const saveFileAs = async () => {
    if (persistence) {
      try {
        checkCyclic();
        const result = await saveToRemote(persistence, {
          graph: graph as unknown as GraphLike,
          name: fileName.replaceAll('.json', ''),
          id: remoteSource?.id,
          baseRevision: remoteSource?.revision,
        });
        if (result.kind === 'conflict') {
          toast.error('This graph was modified by someone else. Refresh before saving to avoid overwriting.');
          return;
        }
        setRemoteSource({ id: result.id, revision: result.revision });
        setFileName(`${result.id}.json`);
        toast.success('Saved to graph library');
      } catch (e) {
        displayError(e);
      }
      return;
    }

    if (!supportFSApi) {
      return await handleDownload();
    }

    let writable: FileSystemWritableFileStream | undefined = undefined;
    try {
      checkCyclic();
      const json = JSON.stringify({ contentType: DocumentFileTypes.Decision, ...graph }, null, 2);
      const newFileName = `${fileName.replaceAll('.json', '')}.json`;
      const handle = await window.showSaveFilePicker({
        types: [{ description: newFileName, accept: { 'application/json': ['.json'] } }],
      });

      writable = await handle.createWritable();
      await writable.write(json);
      setFileHandle(handle);
      const file = await handle.getFile();
      setFileName(file.name);
      toast.success('File saved');
    } catch (e) {
      displayError(e);
    } finally {
      writable?.close?.();
    }
  };

  const saveFile = async () => {
    if (persistence) {
      return saveFileAs();
    }

    if (!supportFSApi) {
      toast.error('Unsupported file system API');
      return;
    }

    if (fileHandle) {
      let writable: FileSystemWritableFileStream | undefined = undefined;
      try {
        writable = await fileHandle.createWritable();
        checkCyclic();

        const json = JSON.stringify({ contentType: DocumentFileTypes.Decision, ...graph }, null, 2);
        await writable.write(json);
        toast.success('File saved');
      } catch (e) {
        displayError(e);
      } finally {
        writable?.close?.();
      }
    }
  };

  const handleNew = async () => {
    setPendingConfirm({
      title: 'New decision',
      description: 'Are you sure you want to create new blank decision, your current work might be lost?',
      onConfirm: () => {
        setGraph({
          nodes: [],
          edges: [],
        });
        setRemoteSource(undefined);
        setFileName('Untitled Decision');
      },
    });
  };

  const confirmTemplate = (key: string) => {
    setPendingConfirm({
      title: 'Open example',
      description: 'Are you sure you want to open example decision, your current work might be lost?',
      onConfirm: () => loadTemplateGraph(key),
    });
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

  const openRemoteGraph = async (id: string) => {
    if (!persistence) return;
    try {
      const content = await loadFromRemote(persistence, id);
      if (!content) {
        toast.error('Graph not found');
        return;
      }
      setGraph({
        nodes: normalizeGraphNodes((content as { nodes?: DecisionNode[] }).nodes ?? []),
        edges: (content as { edges?: DecisionEdge[] }).edges ?? [],
      });
      setRemoteSource({ id });
      setFileName(id);
    } catch (e) {
      displayError(e);
    }
  };

  const handleOpenMenu = async (e: { key: string }) => {
    switch (e.key) {
      case 'file-system':
        openFile();
        break;
      default: {
        if (Object.hasOwn(decisionTemplates, e.key)) {
          confirmTemplate(e.key);
        }
        break;
      }
    }
  };

  const checkCyclic = (dc: DecisionContent | undefined = undefined) => {
    const decisionContent = match(dc)
      .with(P.nullish, () => graph)
      .otherwise((data) => data);

    const diGraph = new DirectedGraph();
    (decisionContent?.edges || []).forEach((edge) => {
      diGraph.mergeEdge(edge.sourceId, edge.targetId);
    });

    if (hasCycle(diGraph)) {
      throw new Error('Circular dependencies detected');
    }
  };

  const handleDownload = async () => {
    try {
      checkCyclic();
      // create file in browser
      const newFileName = `${fileName.replaceAll('.json', '')}.json`;
      const json = JSON.stringify({ contentType: DocumentFileTypes.Decision, ...graph }, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const href = URL.createObjectURL(blob);

      // create "a" HTLM element with href to file
      const link = window.document.createElement('a');
      link.href = href;
      link.download = newFileName;
      window.document.body.appendChild(link);
      link.click();

      // clean up "a" element & remove ObjectURL
      window.document.body.removeChild(link);
      URL.revokeObjectURL(href);
    } catch (e) {
      displayError(e);
    }
  };

  const handleUploadInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event?.target?.files as FileList;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e?.target?.result as string);
        if (parsed?.contentType !== DocumentFileTypes.Decision) {
          throw new Error('Invalid content type');
        }

        const nodes: DecisionNode[] = parsed.nodes || [];
        const nodeIds = nodes.map((node) => node.id);
        const edges: DecisionEdge[] = ((parsed.edges || []) as DecisionEdge[]).filter(
          (edge) => nodeIds.includes(edge?.targetId) && nodeIds.includes(edge?.sourceId),
        );

        checkCyclic({ edges, nodes });
        setGraph({ edges, nodes: normalizeGraphNodes(nodes) });
        setFileName(fileList?.[0]?.name);
      } catch (e) {
        displayError(e);
      }
    };

    reader.readAsText(Array.from(fileList)?.[0], 'UTF-8');
  };
  const [mode, setMode] = useState<JdmUiMode>('business');

  return (
    <>
      <input
        hidden
        accept="application/json"
        type="file"
        ref={fileInput}
        onChange={handleUploadInput}
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
            <div className={classes.heading}>
              <Button asChild variant="ghost" size="icon" className="size-8" aria-label="GoRules">
                <a href="https://gorules.io" target="_blank" rel="noreferrer">
                  <img height={32} width={32} src={'/favicon.svg'} alt="" />
                </a>
              </Button>
              <Separator orientation="vertical" className="h-5 self-center" />
              <div className={classes.headingContent}>
                <EditableTitle value={fileName} onChange={(value) => setFileName(value.trim())} />
                <Stack horizontal verticalAlign="center" gap={8}>
                  <Button type="button" onClick={handleNew} variant="ghost" size="sm">
                    New
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="ghost" size="sm">
                        Open
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="min-w-44" align="start">
                      {persistence?.list && (
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger onSelect={() => void refreshLibrary()}>
                            Graph library
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="min-w-52">
                            {libraryGraphs === undefined ? (
                              <DropdownMenuItem disabled>Loading…</DropdownMenuItem>
                            ) : libraryGraphs.length === 0 ? (
                              <DropdownMenuItem disabled>No graphs</DropdownMenuItem>
                            ) : (
                              libraryGraphs.map((g) => (
                                <DropdownMenuItem key={g.id} onSelect={() => void openRemoteGraph(g.id)}>
                                  {g.name}
                                </DropdownMenuItem>
                              ))
                            )}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      )}
                      <DropdownMenuItem onSelect={() => openFile()}>File system</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {[
                        { label: 'Fintech: Company analysis', key: 'company-analysis' },
                        { label: 'Fintech: AML', key: 'aml' },
                        { label: 'Retail: Shipping fees', key: 'shipping-fees' },
                      ].map((item) => (
                        <DropdownMenuItem key={item.key} onSelect={() => handleOpenMenu({ key: item.key })}>
                          {item.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {(supportFSApi || persistence) && (
                    <Button type="button" onClick={saveFile} variant="ghost" size="sm">
                      Save
                    </Button>
                  )}
                  <Button type="button" onClick={saveFileAs} variant="ghost" size="sm">
                    Save as
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={mode === 'dev' ? 'default' : 'outline'}
                    onClick={() => setMode('dev')}
                  >
                    Dev
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={mode === 'business' ? 'default' : 'outline'}
                    onClick={() => setMode('business')}
                  >
                    Business
                  </Button>
                </Stack>
              </div>
            </div>
          }
          ghost={false}
          extra={[
            <span key="summary-switch" className="inline-flex items-center gap-2 whitespace-nowrap">
              <span className="text-xs text-muted-foreground">摘要卡片</span>
              <Switch
                checked={summaryCard}
                onCheckedChange={toggleSummaryCard}
                className="h-4 w-7 data-[state=checked]:bg-primary [&>span]:size-3 data-[state=checked]:[&>span]:translate-x-3"
              />
            </span>,
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
        <div className={classes.contentWrapper}>
          <div className={classes.content}>
            <DecisionGraph
              mode={mode}
              customNodes={summaryCard ? summaryCustomNodes : customNodes}
              customFunctions={schema ?? undefined}
              ref={graphRef}
              value={graph}
              onChange={(value) => setGraph(value)}
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
      <AlertDialog open={pendingConfirm !== null} onOpenChange={(open) => (!open ? setPendingConfirm(null) : null)}>
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
                setPendingConfirm(null);
              }}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
