// usage: npm run new:service -- --name=auth

const fs = require('fs');
const path = require('path');

const arg = process.argv.find(a => a.includes('--name='));
if (!arg) throw new Error("Provide service name: --name=auth");

const name = arg.split('=')[1];
const dest = path.join(__dirname, '..', 'services', name);

if (fs.existsSync(dest)) {
  console.error(`Service already exists: ${name}`);
  process.exit(1);
}

fs.mkdirSync(dest, { recursive: true });

const pkg = {
  name: `service-${name}`,
  version: "0.0.1",
  private: true,
  scripts: {
    dev: "ts-node-dev --respawn --transpile-only src/server.ts",
    build: "tsc -p tsconfig.json",
    test: "jest --passWithNoTests"
  },
  dependencies: {
    express: "^4.18.0",
    amqplib: "^0.10.0"
  },
  devDependencies: {
    "ts-node-dev": "^2.0.0"
  }
};

fs.writeFileSync(path.join(dest, "package.json"), JSON.stringify(pkg, null, 2));

fs.mkdirSync(path.join(dest, "src"));
fs.writeFileSync(
  path.join(dest, "src", "server.ts"),
  `import express from 'express';
const app = express();

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.listen(3000, () => console.log('service-${name} running'));
`
);

console.log(`Service '${name}' created at ${dest}`);
