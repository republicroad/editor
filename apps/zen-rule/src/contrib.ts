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
const HTTP_REQUEST_TIMEOUT_MS = 10_000;

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const httpErrorResult = (error: string) => ({ status: 0, headers: {}, body: null, error });

export const httpRequest = registerUdf('http_request', 'contrib', {
  description:
    '发起 HTTP 请求, 返回响应结果 { status, headers, body }. 网络异常或超时(10s)时返回结构化错误 { status: 0, error }, 不抛出异常.',
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
    },
    required: ['url'],
    title: 'http_request',
    type: 'object',
  },
  returnsSchema: { type: 'object', title: 'http_request 函数返回', properties: {} },
})(async function httpRequestUdf(kwargs: Record<string, unknown>) {
  const url = String(kwargs?.url ?? '').trim();
  const method =
    String(kwargs?.method ?? 'GET')
      .trim()
      .toUpperCase() || 'GET';
  const rawBody = asRecord(kwargs?.body);

  if (!url) {
    return httpErrorResult('url is required');
  }
  if (!HTTP_METHODS.has(method)) {
    return httpErrorResult(`unsupported http method '${method}'`);
  }

  const requestHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(asRecord(kwargs?.headers))) {
    requestHeaders[String(key)] = String(value);
  }

  let requestBody: string | undefined;
  if (method !== 'GET' && method !== 'HEAD' && Object.keys(rawBody).length > 0) {
    requestBody = JSON.stringify(rawBody);
    const hasContentType = Object.keys(requestHeaders).some((k) => k.toLowerCase() === 'content-type');
    if (!hasContentType) {
      requestHeaders['content-type'] = 'application/json';
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HTTP_REQUEST_TIMEOUT_MS);
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
    return httpErrorResult(e instanceof Error ? e.message : String(e));
  } finally {
    clearTimeout(timer);
  }
});
