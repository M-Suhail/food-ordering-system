#!/usr/bin/env node

// usage:
// npm run new:service -- auth
// npm run new:service -- --name=auth

const fs = require('fs');
const path = require('path');

/* ---------------------------
   helpers
---------------------------- */

const mkdir = dir => fs.mkdirSync(dir, { recursive: true });

const write = (file, content) =>
  fs.writeFileSync(file, content.trimStart() + '\n');

/* ---------------------------
   args parsing
---------------------------- */

const args = process.argv.slice(2);

const rawName =
  args.find(a => a.startsWith('--name=')) ??
  args[0];

if (!rawName) {
  console.error('Usage: npm run new:service -- auth');
  console.error('   or: npm run new:service -- --name=auth');
  process.exit(1);
}

const name = rawName.includes('=')
  ? rawName.split('=')[1]
  : rawName;

if (!/^[a-z][a-z0-9-]+$/.test(name)) {
  console.error(
    'Invalid service name. Use kebab-case, e.g. order-service'
  );
  process.exit(1);
}

/* ---------------------------
   paths
---------------------------- */

const root = path.join(__dirname, '..');
const dest = path.join(root, 'services', name);

if (fs.existsSync(dest)) {
  console.error(`Service already exists: ${name}`);
  process.exit(1);
}

/* ---------------------------
   directory structure
---------------------------- */

mkdir(dest);
mkdir(path.join(dest, 'src', 'lib'));
mkdir(path.join(dest, 'src', 'routes'));
mkdir(path.join(dest, 'src', 'swagger'));

/* ---------------------------
   package.json
---------------------------- */

write(
  path.join(dest, 'package.json'),
  JSON.stringify(
    {
      name: `@services/${name}`,
      version: '0.0.1',
      private: true,
      engines: {
        node: '>=18'
      },
      scripts: {
        dev: 'ts-node-dev --respawn --transpile-only src/server.ts',
        build: 'tsc -p tsconfig.json',
        start: 'node dist/server.js',
        test: 'jest --passWithNoTests'
      },
      dependencies: {
        express: '^4.18.2',
        dotenv: '^16.0.0',
        pino: '^8.0.0'
      },
      devDependencies: {
        typescript: '^5.0.0',
        'ts-node-dev': '^2.0.0',
        '@types/express': '^4.17.17'
      }
    },
    null,
    2
  )
);

/* ---------------------------
   tsconfig.json
---------------------------- */

write(
  path.join(dest, 'tsconfig.json'),
  JSON.stringify(
    {
      extends: '../../tsconfig.base.json',
      compilerOptions: {
        rootDir: 'src',
        outDir: 'dist'
      },
      include: ['src']
    },
    null,
    2
  )
);

/* ---------------------------
   env
---------------------------- */

write(
  path.join(dest, '.env.example'),
  `PORT=`
);

write(
  path.join(dest, '.env'),
  `PORT=`
);

/* ---------------------------
   logger
---------------------------- */

write(
  path.join(dest, 'src', 'lib', 'logger.ts'),
  `
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info'
});
`
);

/* ---------------------------
   app.ts
---------------------------- */

write(
  path.join(dest, 'src', 'app.ts'),
  `
import express from 'express';

export function createServer() {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/ready', (_req, res) => res.json({ status: 'ready' }));

  return app;
}
`
);

/* ---------------------------
   server.ts
---------------------------- */

write(
  path.join(dest, 'src', 'server.ts'),
  `
import { createServer } from './app';
import { logger } from './lib/logger';

const port = process.env.PORT || 3000;

const app = createServer();

app.listen(port, () => {
  logger.info('service-${name} listening on port ' + port);
});
`
);

console.log(`Service '${name}' created successfully`);


