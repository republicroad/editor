import { authClient } from './auth-client';
import type { UserResolver } from '@gorules/jdm-editor';

export const createBetterAuthResolver = (): UserResolver => {
  return async () => {
    try {
      const { data: session } = await authClient.getSession();
      if (!session?.user) {
        return { user: '' };
      }
      return {
        user: session.user.id,
      };
    } catch {
      return { user: '' };
    }
  };
};
