import { ZenEngine } from '@gorules/zen-engine';
import fs from 'fs/promises';
// import path from 'fs/path';
var path = require('path');

(async () => {
  // Example filesystem content, it is up to you how you obtain content
  console.log("__dirname:", __dirname);
  var filepath = path.join(__dirname, 'multi2.json');
  const content = await fs.readFile(filepath);
  const engine = new ZenEngine();

  const decision = engine.createDecision(content);
  const result = await decision.evaluate({ input: 15 });
  console.log("result:", result);
  engine.dispose();
})();