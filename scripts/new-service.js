// usage: npm run new:service -- --name=auth

const fs = require('fs');
const path = require('path');

const arg = process.argv.find(a => a.startsWith('--name='));
if (!arg) throw new Error('Provide service name: --name=xxxx');

const name = arg.split('=')[1];
const dest = path.join(__dirname, '..', 'services', name);

if (fs.existsSync(dest)) {
  console.error(`Service already exists: ${name}`);
  process.exit(1);
}

fs.mkdirSync(dest, { recursive: true });
fs.mkdirSync(path.join(dest, 'src', 'lib'), { recursive: true });
fs.mkdirSync(path.join(dest, 'src', 'routes'), { recursive: true });

// package.json
const pkg = {
  name: `service-${name}`,
  version: '0.0.1',
  private: true,
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
    'ts-node-dev': '^2.0.0',
    typescript: '^5.0.0',
    '@types/express': '^4.17.17'
  }
};

fs.writeFileSync(
  path.join(dest, 'package.json'),
  JSON.stringify(pkg, null, 2)
);

// tsconfig.json
fs.writeFileSync(
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

// .env.example
fs.writeFileSync(
  path.join(dest, '.env.example'),
  `PORT=3000
`
);

// logger
fs.writeFileSync(
  path.join(dest, 'src', 'lib', 'logger.ts'),
  `import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info'
});
`
);

// app.ts
fs.writeFileSync(
  path.join(dest, 'src', 'app.ts'),
  `import express from 'express';

export function createServer() {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/ready', (_req, res) => res.json({ status: 'ready' }));

  return app;
}
`
);

// server.ts
fs.writeFileSync(
  path.join(dest, 'src', 'server.ts'),
  `import { createServer } from './app';
import { logger } from './lib/logger';

const port = process.env.PORT || 3000;

const app = createServer();

app.listen(port, () => {
  logger.info(\`service-${name} listening on port \${port}\`);
});
`
);

console.log(`Service '${name}' created at ${dest}`);
