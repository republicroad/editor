import type { UserResolver } from '@gorules/jdm-editor';
import { createBetterAuthAdapter, type AuthAdapter } from './auth/adapter';

export const createUserResolver = (adapter: AuthAdapter): UserResolver => {
  return async () => {
    try {
      const authUser = await adapter();
      if (!authUser) {
        return { user: '' };
      }
      return { user: authUser.userId };
    } catch {
      return { user: '' };
    }
  };
};

export const createBetterAuthResolver = (): UserResolver => {
  return createUserResolver(createBetterAuthAdapter());
};
