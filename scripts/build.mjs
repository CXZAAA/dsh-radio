import { mkdir, writeFile } from 'node:fs/promises';

import { build } from 'esbuild';

const OUT_DIR = 'lib';
const PLUGIN_ID = 'dsh-plugin-radio';

const client = await build({
  entryPoints: ['src/client/index.ts'],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'browser',
  target: ['chrome100', 'safari15', 'firefox100'],
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  external: ['react', 'react-dom/client'],
  minify: true,
  legalComments: 'none',
  logLevel: 'info',
});

const body = client.outputFiles[0].text;
const wrapped = `window.__ModuleLoader__.load({
\tid: ${JSON.stringify(PLUGIN_ID)},
\tfactory: (require) => {
\t\tvar module = { exports: {} };
\t\tvar exports = module.exports;
${body}
\t\treturn module.exports;
\t}
});
`;

await mkdir(OUT_DIR, { recursive: true });
await writeFile(`${OUT_DIR}/client.js`, wrapped);
console.log(`built ${OUT_DIR}/client.js (${Buffer.byteLength(wrapped)} bytes)`);

const host = await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  legalComments: 'none',
  logLevel: 'info',
});

await writeFile(`${OUT_DIR}/index.js`, host.outputFiles[0].text);
console.log(`built ${OUT_DIR}/index.js (${Buffer.byteLength(host.outputFiles[0].text)} bytes)`);
