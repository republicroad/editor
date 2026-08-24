import { describe, expect, test } from 'bun:test';

import fallbackSchema from '../../assets/custom-node-schema.json';
import { fetchCustomNodeSchema, parseCustomNodeSchemaPayload } from '../custom-node-schema-source';
import type { CustomNodeNamespace } from '../custom-node-types';

const FALLBACK_SCHEMA = fallbackSchema as CustomNodeNamespace[];

describe('parseCustomNodeSchemaPayload', () => {
  test('accepts namespace arrays', () => {
    const payload = [{ type: 'namespace' as const, name: 'contrib', title: 'Contrib', tools: [] }];
    expect(parseCustomNodeSchemaPayload(payload)).toEqual(payload);
  });

  test('rejects non-array payloads', () => {
    expect(() => parseCustomNodeSchemaPayload({})).toThrow('schema response is not an array');
    expect(() => parseCustomNodeSchemaPayload(null)).toThrow();
  });
});

describe('fetchCustomNodeSchema', () => {
  test('uses injected async loader without touching the network', async () => {
    const injected: CustomNodeNamespace[] = [{ type: 'namespace', name: 'host', title: 'Host Nodes', tools: [] }];
    const result = await fetchCustomNodeSchema(async () => injected);
    expect(result).toBe(injected);
  });

  test('uses injected sync loader result directly', async () => {
    const injected: CustomNodeNamespace[] = [{ type: 'namespace', name: 'sync-host', title: 'Sync', tools: [] }];
    expect(await fetchCustomNodeSchema(() => injected)).toEqual(injected);
  });

  test('falls back to bundled fixture when loader throws', async () => {
    const result = await fetchCustomNodeSchema(async () => {
      throw new Error('backend unavailable');
    });
    expect(result).toEqual(FALLBACK_SCHEMA);
  });

  test('falls back to bundled fixture on invalid URL payload shape', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ broken: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })) as unknown as typeof fetch;
    try {
      const result = await fetchCustomNodeSchema('/api/custom-nodes/schema');
      expect(result).toEqual(FALLBACK_SCHEMA);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
