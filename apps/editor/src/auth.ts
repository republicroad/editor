// 签名 cookie 身份（第五十八批，认证方案 B——初期单机部署）。
// 设计：AUTH_SECRET 设置后，/api/* 中间件验证签名 cookie `gid`（`<userId>.<HMAC-SHA256>`）；
// 缺失/篡改 → 签发新匿名身份并回写 Set-Cookie（HttpOnly/SameSite=Lax/一年）。
// 此模式下 x-user-id header 不再被信任（封堵伪造越权）；AUTH_SECRET 未设则行为
// 完全不变（TRUST_PROXY_HEADERS / MOCK 回退，见 index.ts resolveExecContext）。
// 升级路径：better-auth 账号体系（docs/14「五、认证演进备案」）。
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export const AUTH_COOKIE = 'gid';

const sign = (value: string, secret: string): string => createHmac('sha256', secret).update(value).digest('base64url');

/** 签发新身份：返回待写入 cookie 的完整值与已验证的 userId */
export const createSignedIdentity = (secret: string): { value: string; userId: string } => {
  const userId = randomUUID();
  return { value: `${userId}.${sign(userId, secret)}`, userId };
};

/** 验证签名 cookie；返回 null = 缺失/篡改/形态非法（调用方应重签发） */
export const verifySignedIdentity = (cookieValue: string | undefined, secret: string): { userId: string } | null => {
  if (!cookieValue) return null;
  const dot = cookieValue.lastIndexOf('.');
  if (dot <= 0) return null;
  const userId = cookieValue.slice(0, dot);
  const mac = cookieValue.slice(dot + 1);
  const expected = sign(userId, secret);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  // userId 形态兜底校验（uuid 家族：字母数字连字符）
  if (!/^[\w-]{8,64}$/.test(userId)) return null;
  return { userId };
};
