import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const apiUrl = process.env.NG_APP_API_URL || process.env.VIRA_API_URL || '';
const targetDir = join(process.cwd(), 'public');
const targetFile = join(targetDir, 'runtime-config.js');

mkdirSync(targetDir, { recursive: true });

const content = `window.__VIRA_CONFIG__ = Object.freeze({
  apiUrl: ${JSON.stringify(apiUrl)}
});
`;

writeFileSync(targetFile, content, 'utf8');
console.log(`[runtime-config] apiUrl=${apiUrl || '(fallback to environment default)'}`);
