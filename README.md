# Food Ordering Microservices

Production-grade microservices system built with Express, TypeScript, RabbitMQ, and independent databases per service.

## Features

- Event-driven architecture
- Choreography-based SAGA pattern
- npm workspaces monorepo
- Shared types package
- CI pipeline (GitHub Actions)
- Testing and linting ready

## Project Structure

```
food-ordering-system/
├── packages/
│   └── shared-types/       # Shared TypeScript types and interfaces
├── services/               # Microservices (Phase 1+)
├── infra/                  # Infrastructure configs (Docker, K8s, etc.)
├── scripts/
│   └── new-service.js      # Service generator script
├── .github/
│   └── workflows/
│       └── ci.yml          # CI pipeline
├── tsconfig.base.json      # Base TypeScript configuration
├── .eslintrc.cjs           # ESLint configuration
├── .prettierrc             # Prettier configuration
└── package.json            # Root package with workspaces
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+

### Installation

```bash
npm install
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run bootstrap` | Install all dependencies |
| `npm run lint` | Run ESLint across all packages |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run tests across all workspaces |
| `npm run new:service -- --name=<name>` | Generate a new service |

## Development Phases

### Phase 0: Foundation ✅
- [x] Monorepo setup with npm workspaces
- [x] Root TypeScript, ESLint, and Prettier configs
- [x] Shared-types package
- [x] Service generator script
- [x] CI pipeline (GitHub Actions)
- [x] Documentation

### Phase 1: Core Services (Planned)
- [ ] Auth service
- [ ] Order service
- [ ] Local infra via Docker Compose
- [ ] Base Express setup
- [ ] RabbitMQ connection wrapper

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
RABBITMQ_URL=amqp://guest:guest@localhost:5672
POSTGRES_URL=postgres://postgres:password@localhost:5432/postgres
MONGO_URL=mongodb://localhost:27017
JWT_SECRET=replace_me
```

## License

MIT
