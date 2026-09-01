import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ZenRule, registerUdf, registerRoster } from './src/index.ts';

// Register a UDF similar to the `foo` in main.py
registerUdf('foo', undefined, {
  parameters: {
    a: { type: 'string', description: '参数 a' },
    b: { type: 'string', description: '参数 b' },
    c: { type: 'string', description: '参数 c' },
  },
  returns: { type: 'string', description: 'foo 函数返回' },
})(function foo(kwargs: Record<string, unknown>) {
  console.log('function: foo args:', JSON.stringify(Object.keys(kwargs)));
  console.log('function: foo kwargs:', kwargs);
  return 'foo value';
});

async function testZenruleFoo() {
  const zr = new ZenRule({});
  let filename: string;
  if (import.meta.url.startsWith('file:///$bunfs/root')) {
    const executionDirectory = process.execPath.split('/').slice(0, -1).join('/');
    filename = resolve(executionDirectory, 'graph', 'custom_fullnode.json');
  } else {
    const executionDirectory = import.meta.dir;
    filename = resolve(executionDirectory, 'graph', 'custom_fullnode.json');
  }
  const key = filename;
  if (!zr.getDecisionCache(key)) {
    const content = readFileSync(filename, 'utf-8');
    zr.createDecisionWithCacheKey(key, content);
  }
  for (let i = 0; i < 1; i++) {
    const result = await zr.evaluateAsync(key, { input: 7, myvar: 15 });
    console.log('zen rule custom result:', JSON.stringify(result, null, 2));
    const resultValue = (result.result as { result?: unknown } | undefined)?.result;
    if (resultValue !== 'foo value') {
      throw new Error(`custom rule execution failed, got: ${resultValue}`);
    }
    console.log(`------------------${i}------------------------`);
  }
}

async function testZenrule() {
  const zr = new ZenRule({});
  // Returns the full absolute path of the binary (e.g., /usr/local/bin/myapp)
  const executablePath = process.execPath;
  // Returns the true physical directory containing the binary
  const executionDirectory = process.execPath.split('/').slice(0, -1).join('/');
  console.log('executionDirectory:', executionDirectory);
  console.log('executablePath:', executablePath);
  console.log('import.meta.url:', import.meta.url);
  console.log('import.meta.path:', import.meta.path);
  console.log('import.meta.dir:', import.meta.dir);
  console.log('process.cwd():', process.cwd());
  let filename: string;
  if (import.meta.url.startsWith('file:///$bunfs/root')) {
    const execDir = process.execPath.split('/').slice(0, -1).join('/');
    filename = resolve(execDir, 'graph', 'custom.json');
  } else {
    const execDir = import.meta.dir;
    filename = resolve(execDir, 'graph', 'custom.json');
  }
  const key = filename;
  if (!zr.getDecisionCache(key)) {
    const content = readFileSync(filename, 'utf-8');
    zr.createDecisionWithCacheKey(key, content);
  }
  for (let i = 0; i < 1; i++) {
    const result = await zr.evaluateAsync(key, { input: 7, myvar: 15 });
    console.log('zen rule custom result:', JSON.stringify(result, null, 2));
    console.log(`------------------${i}------------------------`);
  }
}

async function testZenruleRoster() {
  registerRoster({ name: 'blacklist', description: '手机号黑名单', items: ['13800000001', '13800000002'] });

  const buildContent = (value: string): object => ({
    contentType: 'application/vnd.gorules.decision',
    nodes: [
      {
        type: 'inputNode',
        content: {
          schema: '{"type":"object","properties":{}}',
          expressions: [],
          inputField: null,
          outputPath: null,
        },
        id: 'input_1',
        name: 'Request',
        position: { x: 140, y: 215 },
      },
      {
        type: 'customNode',
        content: {
          kind: 'roster.roster',
          config: {
            expressions: [{ id: 'expr_1', key: 'result', value: ['roster', '"blacklist"', value] }],
            passThrough: true,
            inputField: null,
            outputPath: null,
          },
        },
        id: 'custom_1',
        name: 'custom_1',
        position: { x: 500, y: 215 },
      },
      {
        type: 'outputNode',
        content: { schema: '' },
        id: 'output_1',
        name: 'Response',
        position: { x: 800, y: 215 },
      },
    ],
    edges: [
      { id: 'e1', sourceId: 'input_1', targetId: 'custom_1', type: 'edge' },
      { id: 'e2', sourceId: 'custom_1', targetId: 'output_1', type: 'edge' },
    ],
  });

  const zr = new ZenRule({});
  const hitDecision = zr.createDecision(buildContent('"13800000001"'));
  const hitResult = (await hitDecision.evaluate({ input: {} }, { trace: false })) as {
    result?: { result?: { hit?: boolean } };
  };
  if (hitResult.result?.result?.hit !== true) {
    throw new Error(`roster hit expected true, got: ${JSON.stringify(hitResult.result)}`);
  }
  console.log('zen rule roster hit:', JSON.stringify(hitResult.result));

  const missDecision = zr.createDecision(buildContent('"13800009999"'));
  const missResult = (await missDecision.evaluate({ input: {} }, { trace: false })) as {
    result?: { result?: { hit?: boolean } };
  };
  if (missResult.result?.result?.hit !== false) {
    throw new Error(`roster miss expected false, got: ${JSON.stringify(missResult.result)}`);
  }
  console.log('zen rule roster miss:', JSON.stringify(missResult.result));
}

async function testZenruleRosterMulti() {
  registerRoster({ name: 'blacklist', description: '手机号黑名单', items: ['13800000001', '13800000002'] });
  registerRoster({ name: 'whitelist', description: '白名单', items: ['alice@example.com', 'bob@example.com'] });

  const buildContent = (value1: string, value2: string): object => ({
    contentType: 'application/vnd.gorules.decision',
    nodes: [
      {
        type: 'inputNode',
        content: {
          schema: '{"type":"object","properties":{}}',
          expressions: [],
          inputField: null,
          outputPath: null,
        },
        id: 'input_1',
        name: 'Request',
        position: { x: 140, y: 215 },
      },
      {
        type: 'customNode',
        content: {
          kind: 'roster.roster',
          config: {
            expressions: [
              { id: 'expr_1', key: 'result', value: ['roster', '"blacklist"', value1] },
              { id: 'expr_2', key: 'result2', value: ['roster', '"whitelist"', value2] },
            ],
            passThrough: true,
            inputField: null,
            outputPath: null,
          },
        },
        id: 'custom_1',
        name: 'custom_1',
        position: { x: 500, y: 215 },
      },
      {
        type: 'outputNode',
        content: { schema: '' },
        id: 'output_1',
        name: 'Response',
        position: { x: 800, y: 215 },
      },
    ],
    edges: [
      { id: 'e1', sourceId: 'input_1', targetId: 'custom_1', type: 'edge' },
      { id: 'e2', sourceId: 'custom_1', targetId: 'output_1', type: 'edge' },
    ],
  });

  const zr = new ZenRule({});
  const hitBoth = zr.createDecision(buildContent('"13800000001"', '"alice@example.com"'));
  const hitBothResult = (await hitBoth.evaluate({ input: {} }, { trace: false })) as {
    result?: { result?: { hit?: boolean }; result2?: { hit?: boolean } };
  };
  if (hitBothResult.result?.result?.hit !== true || hitBothResult.result?.result2?.hit !== true) {
    throw new Error(`roster multi both-hit expected true, got: ${JSON.stringify(hitBothResult.result)}`);
  }
  console.log('zen rule roster multi both-hit:', JSON.stringify(hitBothResult.result));

  const mixed = zr.createDecision(buildContent('"13800009999"', '"bob@example.com"'));
  const mixedResult = (await mixed.evaluate({ input: {} }, { trace: false })) as {
    result?: { result?: { hit?: boolean }; result2?: { hit?: boolean } };
  };
  if (mixedResult.result?.result?.hit !== false || mixedResult.result?.result2?.hit !== true) {
    throw new Error(`roster multi mixed expected hit=false/result2=true, got: ${JSON.stringify(mixedResult.result)}`);
  }
  console.log('zen rule roster multi mixed:', JSON.stringify(mixedResult.result));
}

async function main() {
  console.log('\n=== test_zenrule ===');
  await testZenrule();
  console.log('=== test_zenrule_foo ===');
  await testZenruleFoo();
  console.log('=== test_zenrule_roster ===');
  await testZenruleRoster();
  console.log('=== test_zenrule_roster_multi ===');
  await testZenruleRosterMulti();
}

main().catch(console.error);

// import.meta.url 在 bun compile 中是 file:///$bunfs/root/xxx.exe 路径.
