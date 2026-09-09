import { Button } from '@republicroad/jdm-appshell/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@republicroad/jdm-appshell/src/components/ui/dropdown-menu';
import { Separator } from '@republicroad/jdm-appshell/src/components/ui/separator';
import { Stack } from '../../components/stack.tsx';
import type { JdmUiMode } from '@republicroad/jdm-editor';
import classes from './decision-simple.module.css';
import { EditableTitle } from './editable-title.tsx';

// 模板菜单静态白名单（键存在性校验在页面 onOpenTemplate 内：Object.hasOwn(decisionTemplates, key)）
const TEMPLATE_MENU_ITEMS = [
  { label: 'Fintech: Company analysis', key: 'company-analysis' },
  { label: 'Fintech: AML', key: 'aml' },
  { label: 'Retail: Shipping fees', key: 'shipping-fees' },
];

interface PageToolbarProps {
  fileName: string;
  onRenameFile: (name: string) => void;
  onNew: () => void;
  /** 宿主存储可用（Graph library 子菜单显隐） */
  hasLibrary: boolean;
  libraryGraphs: Array<{ id: string; name: string; updatedAt?: string }> | undefined;
  onRefreshLibrary: () => void;
  onOpenLibraryGraph: (id: string) => void;
  onOpenFromFileSystem: () => void;
  onOpenTemplate: (key: string) => void;
  /** 版本历史入口显隐（宿主存储支持 listVersions 且已打开图） */
  hasVersions: boolean;
  onOpenVersions: () => void;
  showSave: boolean;
  onSave: () => void;
  onSaveAs: () => void;
  mode: JdmUiMode;
  onModeChange: (mode: JdmUiMode) => void;
}

/** 顶栏工具条：标题改名 + New/Open/版本/钉住/Save/Dev-Business 各入口（纯展示，DOM 结构对齐原页面） */
export const PageToolbar = ({
  fileName,
  onRenameFile,
  onNew,
  hasLibrary,
  libraryGraphs,
  onRefreshLibrary,
  onOpenLibraryGraph,
  onOpenFromFileSystem,
  onOpenTemplate,
  hasVersions,
  onOpenVersions,
  showSave,
  onSave,
  onSaveAs,
  mode,
  onModeChange,
}: PageToolbarProps) => {
  return (
    <div className={classes.heading}>
      <Button asChild variant="ghost" size="icon" className="size-8" aria-label="GoRules">
        <a href="https://gorules.io" target="_blank" rel="noreferrer">
          <img height={32} width={32} src={'/favicon.svg'} alt="" />
        </a>
      </Button>
      <Separator orientation="vertical" className="h-5 self-center" />
      <div className={classes.headingContent}>
        <EditableTitle value={fileName} onChange={onRenameFile} />
        <Stack horizontal verticalAlign="center" gap={8}>
          <Button type="button" onClick={onNew} variant="ghost" size="sm">
            New
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm">
                Open
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-44" align="start">
              {hasLibrary && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger onSelect={onRefreshLibrary}>Graph library</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="min-w-52">
                    {libraryGraphs === undefined ? (
                      <DropdownMenuItem disabled>Loading…</DropdownMenuItem>
                    ) : libraryGraphs.length === 0 ? (
                      <DropdownMenuItem disabled>No graphs</DropdownMenuItem>
                    ) : (
                      libraryGraphs.map((g) => (
                        <DropdownMenuItem key={g.id} onSelect={() => onOpenLibraryGraph(g.id)}>
                          {g.name}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              <DropdownMenuItem onSelect={onOpenFromFileSystem}>File system</DropdownMenuItem>
              <DropdownMenuSeparator />
              {TEMPLATE_MENU_ITEMS.map((item) => (
                <DropdownMenuItem key={item.key} onSelect={() => onOpenTemplate(item.key)}>
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {hasVersions && (
            <Button type="button" variant="ghost" size="sm" onClick={onOpenVersions}>
              Versions
            </Button>
          )}
          {showSave && (
            <Button type="button" onClick={onSave} variant="ghost" size="sm">
              Save
            </Button>
          )}
          <Button type="button" onClick={onSaveAs} variant="ghost" size="sm">
            Save as
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'dev' ? 'default' : 'outline'}
            onClick={() => onModeChange('dev')}
          >
            Dev
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'business' ? 'default' : 'outline'}
            onClick={() => onModeChange('business')}
          >
            Business
          </Button>
        </Stack>
      </div>
    </div>
  );
};
