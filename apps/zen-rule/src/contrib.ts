import { JSONPath } from 'jsonpath-plus';

import { registerUdf } from './register.js';

export const inout = registerUdf('inout', 'contrib', {
  description: 'Docstring for inout\n自定义函数测试, 返回值返回入参, 用于调试.',
  parametersSchema: {
    properties: {
      b: { description: '参数 b', title: 'B', type: 'integer' },
      a: {
        anyOf: [{ type: 'string' }, { type: 'integer' }],
        description: '参数 a',
        title: 'A',
      },
      c: { description: '参数 c', title: 'C', type: 'null' },
    },
    required: ['b', 'a', 'c'],
    title: 'inout',
    type: 'object',
  },
  returnsSchema: { type: 'string', title: 'inout 函数返回', properties: {} },
})(function (kwargs: Record<string, unknown>) {
  return kwargs?.['_node_input_'] ?? {};
});

export const funcWithoutArgs = registerUdf('func_without_args', 'contrib', {
  description: 'Docstring for func_without_args\n无参数函数, 用于自定义函数测试',
  parametersSchema: {
    properties: {},
    title: 'func_without_args',
    type: 'object',
  },
  returnsSchema: { type: 'string', title: 'func_without_args 函数返回', properties: {} },
})(function (kwargs: Record<string, unknown>) {
  return kwargs?.['_node_input_'] ?? {};
});

const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);
const DEFAULT_TIMEOUT_MS = 10_000;
const MIN_TIMEOUT_MS = 100;
const MAX_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 5;
const RETRY_BASE_DELAY_MS = 200;

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const httpErrorResult = (error: string) => ({ status: 0, headers: {}, body: null, error });

/** 宽松整数化：null/undefined/空串/非法值回退 fallback，并夹取 [min, max] */
const coerceCount = (value: unknown, min: number, max: number, fallback: number): number => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, n));
};

/** 查询参数合并：URL 解析失败返回 null（由调用方直接报错，不参与重试） */
const buildUrlWithParams = (rawUrl: string, params: Record<string, unknown>): string | null => {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }
  for (const [key, value] of Object.entries(params)) {
    parsed.searchParams.set(key, String(value));
  }
  return parsed.toString();
};

/** 认证注入：headers 显式 Authorization 优先；basic 编码 user:password，bearer 直填 token */
const applyAuthHeader = (requestHeaders: Record<string, string>, auth: Record<string, unknown>): void => {
  const hasAuthorization = Object.keys(requestHeaders).some((k) => k.toLowerCase() === 'authorization');
  if (hasAuthorization) {
    return;
  }
  const type = String(auth.type ?? '')
    .trim()
    .toLowerCase();
  if (type === 'basic') {
    const raw = `${String(auth.username ?? '')}:${String(auth.password ?? '')}`;
    const encoded = Buffer.from(raw, 'utf8').toString('base64');
    requestHeaders['authorization'] = `Basic ${encoded}`;
  } else if (type === 'bearer') {
    const token = String(auth.token ?? '');
    if (token) {
      requestHeaders['authorization'] = `Bearer ${token}`;
    }
  }
};

interface HttpAttemptResult {
  status: number;
  headers: Record<string, string>;
  body: unknown;
  error?: undefined | string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 网络异常/超时(status=0)、429 与 5xx 可重试；其余 4xx 属业务错误不重试 */
const shouldRetryResult = (result: HttpAttemptResult): boolean =>
  result.status === 0 || result.status === 429 || result.status >= 500;

export const httpRequest = registerUdf('http_request', 'contrib', {
  description:
    '发起 HTTP 请求, 返回响应结果 { status, headers, body }. 支持 params 查询参数合并、timeout 单次超时(默认 10s, 上限 60s)、' +
    'retry 重试(仅网络异常/超时/5xx/429, 指数退避)与 auth 认证({ type: "basic", username, password } 或 { type: "bearer", token }, ' +
    'headers 显式 Authorization 优先). 失败返回结构化错误 { status: 0, error }, 不抛出异常.',
  parametersSchema: {
    properties: {
      url: {
        type: 'string',
        title: 'URL',
        description: '请求地址',
      },
      method: {
        type: 'string',
        title: 'Method',
        description: 'HTTP 方法(GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS)，默认 GET',
        default: 'GET',
      },
      headers: {
        type: 'object',
        title: 'Headers',
        description: '请求头键值对对象，默认无',
        default: null,
      },
      body: {
        type: 'object',
        title: 'Body',
        description:
          '请求体对象(自动 JSON 序列化并补充 content-type: application/json)，GET/HEAD 忽略，空对象视为无请求体',
        default: null,
      },
      params: {
        type: 'object',
        title: 'Params',
        description: '查询参数键值对对象，合并到 URL 查询串(URL 已有同名参数时覆盖)，默认无',
        default: null,
      },
      timeout: {
        type: 'integer',
        title: 'Timeout',
        description: `单次请求超时毫秒数(${MIN_TIMEOUT_MS}–${MAX_TIMEOUT_MS})，默认 ${DEFAULT_TIMEOUT_MS}`,
        default: DEFAULT_TIMEOUT_MS,
      },
      retry: {
        type: 'integer',
        title: 'Retry',
        description: `失败重试次数(0–${MAX_RETRIES})，仅网络异常/超时/5xx/429 触发，指数退避，默认 0`,
        default: 0,
      },
      auth: {
        type: 'object',
        title: 'Auth',
        description:
          "认证配置。Basic: { type: 'basic', username, password }；Bearer: { type: 'bearer', token }。headers 显式 Authorization 优先，默认无",
        default: null,
      },
    },
    required: ['url'],
    title: 'http_request',
    type: 'object',
  },
  returnsSchema: { type: 'object', title: 'http_request 函数返回', properties: {} },
})(async function httpRequestUdf(kwargs: Record<string, unknown>) {
  const rawUrl = String(kwargs?.url ?? '').trim();
  const method =
    String(kwargs?.method ?? 'GET')
      .trim()
      .toUpperCase() || 'GET';
  const rawBody = asRecord(kwargs?.body);
  const rawParams = asRecord(kwargs?.params);
  const rawAuth = asRecord(kwargs?.auth);
  const retryCount = coerceCount(kwargs?.retry, 0, MAX_RETRIES, 0);

  if (!rawUrl) {
    return httpErrorResult('url is required');
  }
  if (!HTTP_METHODS.has(method)) {
    return httpErrorResult(`unsupported http method '${method}'`);
  }

  const url = buildUrlWithParams(rawUrl, rawParams);
  if (!url) {
    return httpErrorResult(`invalid url '${rawUrl}'`);
  }

  const requestHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(asRecord(kwargs?.headers))) {
    requestHeaders[String(key)] = String(value);
  }
  applyAuthHeader(requestHeaders, rawAuth);

  let requestBody: string | undefined;
  if (method !== 'GET' && method !== 'HEAD' && Object.keys(rawBody).length > 0) {
    requestBody = JSON.stringify(rawBody);
    const hasContentType = Object.keys(requestHeaders).some((k) => k.toLowerCase() === 'content-type');
    if (!hasContentType) {
      requestHeaders['content-type'] = 'application/json';
    }
  }

  const attemptOnce = async (): Promise<HttpAttemptResult> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
        signal: controller.signal,
      });
      const responseText = await response.text();
      let responseBody: unknown;
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = responseText;
      }
      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody,
      };
    } catch (e) {
      return { status: 0, headers: {}, body: null, error: e instanceof Error ? e.message : String(e) };
    } finally {
      clearTimeout(timer);
    }
  };

  const timeoutMs = coerceCount(kwargs?.timeout, MIN_TIMEOUT_MS, MAX_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
  let result = await attemptOnce();
  for (let attempt = 1; attempt <= retryCount && shouldRetryResult(result); attempt += 1) {
    await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
    result = await attemptOnce();
  }
  return result;
});

const CRYPTO_ALGORITHMS = new Set(['md5', 'sha1', 'sha256', 'sha512']);
const CRYPTO_ENCODINGS = new Set(['hex', 'base64', 'base64url']);

export const cryptoDigest = registerUdf('crypto', 'contrib', {
  description:
    '计算字符串摘要或 HMAC 签名，返回摘要字符串. algorithm 支持 md5/sha1/sha256/sha512(非法值回退 sha256)，' +
    'secret 非空时启用 HMAC 模式，encoding 支持 hex/base64/base64url(非法值回退 hex)，upper 仅对 hex 生效(大写输出).',
  parametersSchema: {
    properties: {
      input: {
        type: 'string',
        title: 'Input',
        description: '待摘要内容',
      },
      algorithm: {
        type: 'string',
        title: 'Algorithm',
        description: '摘要算法(md5/sha1/sha256/sha512)，默认 sha256，非法值回退 sha256',
        default: 'sha256',
      },
      secret: {
        type: 'string',
        title: 'Secret',
        description: 'HMAC 密钥，非空启用 HMAC 模式，留空则为普通摘要',
        default: '',
      },
      encoding: {
        type: 'string',
        title: 'Encoding',
        description: '输出编码(hex/base64/base64url)，默认 hex，非法值回退 hex',
        default: 'hex',
      },
      upper: {
        type: 'boolean',
        title: 'Upper',
        description: 'hex 输出转大写(仅 encoding=hex 时生效)，默认 false',
        default: false,
      },
    },
    required: ['input'],
    title: 'crypto',
    type: 'object',
  },
  returnsSchema: { type: 'string', title: 'crypto 函数返回', properties: {} },
})(function cryptoDigestUdf(kwargs: Record<string, unknown>) {
  const input = String(kwargs?.input ?? '');
  const algorithmRaw = String(kwargs?.algorithm ?? 'sha256')
    .trim()
    .toLowerCase();
  const algorithm = CRYPTO_ALGORITHMS.has(algorithmRaw) ? algorithmRaw : 'sha256';
  const secret = String(kwargs?.secret ?? '');
  const encodingRaw = String(kwargs?.encoding ?? 'hex')
    .trim()
    .toLowerCase();
  const encoding = CRYPTO_ENCODINGS.has(encodingRaw) ? encodingRaw : 'hex';
  const upper = kwargs?.upper === true;

  const algo = algorithm as ConstructorParameters<typeof Bun.CryptoHasher>[0];
  const hasher = secret ? new Bun.CryptoHasher(algo, secret) : new Bun.CryptoHasher(algo);
  hasher.update(input);
  const digest = hasher.digest(encoding as 'hex' | 'base64' | 'base64url');
  return upper && encoding === 'hex' ? digest.toUpperCase() : digest;
});

export const jsonPath = registerUdf('json_path', 'contrib', {
  description:
    '按 JSONPath 表达式从数据中提取值(标准语法，支持通配符/下标/过滤)，单个命中返回该值，多个命中返回数组；' +
    '无命中或表达式非法时返回 default. input 为对象，字符串会先尝试 JSON 解析.',
  parametersSchema: {
    properties: {
      input: {
        type: 'any',
        title: 'Input',
        description: '待提取的数据对象(字符串将尝试 JSON 解析)',
      },
      path: {
        type: 'string',
        title: 'Path',
        description: 'JSONPath 表达式，如 $.cart.items[*].price',
      },
      default: {
        type: 'any',
        title: 'Default',
        description: '无命中或解析失败时的回退值，默认 null',
        default: null,
      },
    },
    required: ['input', 'path'],
    title: 'json_path',
    type: 'object',
  },
  returnsSchema: { type: 'object', title: 'json_path 函数返回', properties: {} },
})(function jsonPathUdf(kwargs: Record<string, unknown>) {
  let data = kwargs?.input;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data) as unknown;
    } catch {
      data = kwargs?.input;
    }
  }
  const path = String(kwargs?.path ?? '').trim();
  const fallback = kwargs?.default ?? null;
  if (!path || data == null || typeof data !== 'object') {
    return fallback;
  }
  try {
    const hits = JSONPath({ path, json: data, wrap: true }) as unknown[];
    if (!hits || hits.length === 0) {
      return fallback;
    }
    return hits.length === 1 ? hits[0] : hits;
  } catch {
    return fallback;
  }
});

const TEMPLATE_VAR_PATTERN = /\$\{([^}]+)\}/g;

/** 点路径 + [n] 数组下标取值，缺失返回 undefined */
const resolveTemplatePath = (vars: Record<string, unknown>, path: string): unknown => {
  const segments = path
    .split('.')
    .flatMap((segment) => {
      const match = segment.match(/^(.*?)\[(\d+)\]$/);
      return match ? [match[1], Number(match[2])] : [segment];
    })
    .filter((segment) => segment !== '');
  let current: unknown = vars;
  for (const segment of segments) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string | number, unknown>)[segment as string];
  }
  return current;
};

export const templateRender = registerUdf('template', 'contrib', {
  description:
    '渲染模板字符串：${path} 形式插值 vars 对象(支持点路径与 [n] 数组下标)，缺失变量替换为空串；' +
    '非字符串值按 String() 序列化.',
  parametersSchema: {
    properties: {
      template: {
        type: 'string',
        title: 'Template',
        description: '模板字符串，如 "您好 ${user.name}"',
      },
      vars: {
        type: 'object',
        title: 'Vars',
        description: '插值变量键值对对象，默认空对象',
        default: {},
      },
    },
    required: ['template'],
    title: 'template',
    type: 'object',
  },
  returnsSchema: { type: 'string', title: 'template 函数返回', properties: {} },
})(function templateUdf(kwargs: Record<string, unknown>) {
  const tpl = String(kwargs?.template ?? '');
  const vars = asRecord(kwargs?.vars);
  return tpl.replace(TEMPLATE_VAR_PATTERN, (_match, expr: string) => {
    const value = resolveTemplatePath(vars, expr.trim());
    return value == null ? '' : String(value);
  });
});
