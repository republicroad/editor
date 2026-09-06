import { Pin } from 'lucide-react';
import { Button } from '@republicroad/jdm-appshell/src/components/ui/button';
import { ScrollArea } from '@republicroad/jdm-appshell/src/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@republicroad/jdm-appshell/src/components/ui/sheet';

export interface VersionEntry {
  revision: string;
  updatedAt?: string;
  versionName?: string;
  auto?: boolean;
}

interface PinVersionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: VersionEntry[];
  /** 钉住请求进行中的 revision（对应按钮进入禁用态） */
  pinningRevision?: string;
  onPin: (revision: string) => void;
}

/** 钉住 auto 版本面板：升格 manual 免于滚动删除（manual 全保留 + 最近 20 条 auto） */
export const PinVersionsSheet = ({ open, onOpenChange, versions, pinningRevision, onPin }: PinVersionsSheetProps) => {
  const autos = versions.filter((entry) => entry.auto);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-4 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Pin auto versions</SheetTitle>
          <SheetDescription>
            Pinned versions are marked manual and exempt from auto-version cleanup (server keeps all manual versions
            plus the latest 20 auto ones).
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="-mx-2 min-h-0 flex-1 px-2">
          {autos.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No auto versions yet. They are created by idle autosave.
            </div>
          ) : (
            <ul className="flex flex-col gap-2 py-1">
              {autos.map((entry) => (
                <li
                  key={entry.revision}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {entry.revision}
                      {entry.versionName && (
                        <span className="truncate text-xs text-muted-foreground">{entry.versionName}</span>
                      )}
                    </div>
                    {entry.updatedAt && (
                      <div className="text-xs text-muted-foreground">{new Date(entry.updatedAt).toLocaleString()}</div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pinningRevision === entry.revision}
                    onClick={() => onPin(entry.revision)}
                  >
                    <Pin size={13} />
                    Pin
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
