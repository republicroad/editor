import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { httpRequest } from './contrib.js';
import { udfManager } from './register.js';

let server: ReturnType<typeof Bun.serve>;
let baseUrl: string;
let closedUrl: string;

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    fetch: async (request) => {
      const url = new URL(request.url);
      if (url.pathname === '/json') {
        return new Response(JSON.stringify({ ok: true, q: url.searchParams.get('q') ?? null }), {
          headers: { 'content-type': 'application/json' },
        });
      }
      if (url.pathname === '/echo') {
        const bodyText = await request.text();
        return new Response(
          JSON.stringify({
            method: request.method,
            contentType: request.headers.get('content-type'),
            body: bodyText ? JSON.parse(bodyText) : null,
          }),
          { headers: { 'content-type': 'application/json' } },
        );
      }
      return new Response('not found', { status: 404 });
    },
  });
  baseUrl = `http://127.0.0.1:${server.port}`;

  const throwaway = Bun.serve({ port: 0, fetch: () => new Response('ok') });
  closedUrl = `http://127.0.0.1:${throwaway.port}`;
  throwaway.stop(true);
});

afterAll(() => {
  server.stop(true);
});

const callUdf = async (kwargs: Record<string, unknown>) => (await httpRequest(kwargs)) as Record<string, unknown>;

describe('http_request udf', () => {
  test('GET 解析 JSON 响应体', async () => {
    const result = await callUdf({ url: `${baseUrl}/json?q=abc` });
    expect(result['status']).toBe(200);
    expect(result['error']).toBeUndefined();
    expect(result['body']).toEqual({ ok: true, q: 'abc' });
    const headers = result['headers'] as Record<string, string>;
    expect(headers['content-type']).toContain('application/json');
  });

  test('POST 自动 JSON 序列化并补充 content-type', async () => {
    const result = await callUdf({ url: `${baseUrl}/echo`, method: 'POST', body: { a: 1 } });
    expect(result['status']).toBe(200);
    expect(result['body']).toEqual({
      method: 'POST',
      contentType: 'application/json',
      body: { a: 1 },
    });
  });

  test('显式 content-type 不被覆盖，空对象视为无请求体', async () => {
    const withBody = await callUdf({
      url: `${baseUrl}/echo`,
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: { a: 1 },
    });
    expect((withBody['body'] as Record<string, unknown>)['contentType']).toBe('text/plain');

    const emptyBody = await callUdf({ url: `${baseUrl}/echo`, method: 'POST', body: {} });
    expect((emptyBody['body'] as Record<string, unknown>)['body']).toBeNull();
  });

  test('GET/HEAD 忽略 body，非 2xx 正常返回', async () => {
    const getWithBody = await callUdf({ url: `${baseUrl}/echo`, body: { a: 1 } });
    expect(getWithBody['status']).toBe(200);
    expect((getWithBody['body'] as Record<string, unknown>)['method']).toBe('GET');
    expect((getWithBody['body'] as Record<string, unknown>)['body']).toBeNull();

    const notFound = await callUdf({ url: `${baseUrl}/missing` });
    expect(notFound['status']).toBe(404);
    expect(notFound['body']).toBe('not found');
    expect(notFound['error']).toBeUndefined();
  });

  test('连接拒绝返回结构化错误而非抛出', async () => {
    const result = await callUdf({ url: closedUrl });
    expect(result['status']).toBe(0);
    expect(typeof result['error']).toBe('string');
    expect(String(result['error']).length).toBeGreaterThan(0);
  });

  test('非法 HTTP 方法被白名单拦截', async () => {
    const result = await callUdf({ url: `${baseUrl}/echo`, method: 'TRACE' });
    expect(result['status']).toBe(0);
    expect(result['error']).toBe("unsupported http method 'TRACE'");
  });

  test('引擎路径：funcBindParams 按声明顺序位置绑定，url 缺省参数回退默认值', async () => {
    const kwargs = udfManager.funcBindParams('http_request', [`${baseUrl}/json`]);
    expect(Object.keys(kwargs)).toEqual(['url', 'method', 'headers', 'body']);
    expect(kwargs['method']).toBe('GET');
    const result = (await udfManager.call('http_request', kwargs)) as Record<string, unknown>;
    expect(result['status']).toBe(200);
    expect(result['body']).toEqual({ ok: true, q: null });
  });
});
