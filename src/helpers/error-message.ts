import { toast } from 'sonner';
import { match, P } from 'ts-pattern';

export const errorMessage = (e: unknown): string => {
  return match(e)
    .with({ message: P.string }, ({ message }) => message)
    .with(
      P.when((d) => typeof d === 'object' && 'toString' in (d as object)),
      (data: object) => data.toString(),
    )
    .otherwise(() => 'Unknown error');
};

export const displayError = (e: unknown) => toast.error(errorMessage(e));

/** File System Access API 的 picker 被用户取消(AbortError)——正常交互，不视为错误 */
export const isUserAbort = (e: unknown): boolean => e instanceof DOMException && e.name === 'AbortError';
