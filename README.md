# Food Ordering System

Production-grade microservices system built with Express, TypeScript, RabbitMQ, and independent databases per service.

## Architecture Overview

- The system follows a choreography-based SAGA pattern using RabbitMQ topic exchanges.
- Each service owns its data and communicates asynchronously via events.
- Synchronous REST APIs are used only where appropriate (e.g., CRUD operations).

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
├── services/
│   ├── auth/               # Authentication service (Express, JWT, RabbitMQ integration)
│   │   ├── src/
│   │   │   ├── controllers/    # Route handlers
│   │   │   ├── events/         # Event publishing logic
│   │   │   ├── lib/            # Logger, RabbitMQ utils
│   │   │   ├── routes.ts       # Express route definitions
│   │   │   ├── swagger.ts      # Swagger (OpenAPI) config
│   │   │   └── server.ts       # Entry point
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── .env.example        # Example environment variables
│   ├── order/              # Order management service (Express + RabbitMQ)
│   │   ├── src/
│   │   │   ├── controllers/    # Route handlers
│   │   │   ├── events/         # Event subscribing logic
│   │   │   ├── lib/            # DB, RabbitMQ utils
│   │   │   ├── routes.ts       # Express route definitions
│   │   │   ├── swagger.ts      # Swagger (OpenAPI) config
│   │   │   └── server.ts       # Entry point
│   │   ├── .env.example        # Example environment variables
│   │   ├── prisma/             # Prisma schema and migrations
│   │   ├── package.json
│   │   ├── tsconfig.json
│   ├── kitchen/            # Kitchen service (Express + Prisma + RabbitMQ)
│   │   ├── src/
│   │   │   ├── decision/       # Business logic for kitchen decisions
│   │   │   ├── lib/            # DB, logger, RabbitMQ utils
│   │   │   ├── app.ts          # Express app setup
│   │   │   └── server.ts       # Entry point
│   │   ├── .env.example        # Example environment variables
│   │   ├── prisma/             # Prisma schema and migrations
│   │   ├── package.json
│   │   ├── tsconfig.json
│   ├── payment/            # Payment service (Express + Prisma + RabbitMQ)
│   │   ├── src/
│   │   │   ├── lib/            # DB, logger, RabbitMQ utils
│   │   │   ├── payment/        # Payment processing logic
│   │   │   ├── app.ts          # Express app setup
│   │   │   └── server.ts       # Entry point
│   │   ├── .env.example        # Example environment variables
│   │   ├── prisma/             # Prisma schema and migrations
│   │   ├── package.json
│   │   ├── tsconfig.json
│   └── restaurant/         # Restaurant management service (Express + Prisma + Swagger)
│       ├── src/
│       │   ├── controllers/    # Route handlers
│       │   ├── lib/            # DB and logger utils
│       │   ├── routes/         # Express route definitions
│       │   ├── schemas/        # Zod schemas
│       │   ├── swagger/        # Swagger (OpenAPI) config
│       │   └── server.ts       # Entry point
│       ├── .env.example        # Example environment variables
│       ├── prisma/             # Prisma schema and migrations
│       ├── package.json
│       └── tsconfig.json
├── infra
│   └── docker-compose.yml  # Local infrastructure (RabbitMQ, PostgreSQL)
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
- Docker & Docker Compose (for local infrastructure)

### Installation

```bash
npm install
```

### Running Infrastructure

Start the local infrastructure (RabbitMQ, PostgreSQL):

```bash
cd infra && docker-compose up -d
```

Access RabbitMQ Management UI at http://localhost:15672 (guest/guest)

### Running Services

```bash
# Start Auth service (port 3001)
npm run dev:auth

# Start Order service (port 3002)
npm run dev:order

# Start Restaurant service (port 3003)
npm run dev:restaurant

# Start Kitchen service (port 3004)
npm run dev:kitchen

# Start Payment service (port 3005)
npm run dev:payment
```
### Scripts

| Command | Description |
|---------|-------------|
| `npm run bootstrap` | Install all dependencies |
| `npm run lint` | Run ESLint across all packages |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run tests across all workspaces |
| `npm run new:service -- --name=<name>` | Generate a new service |
| `npm run dev:auth` | Start Auth service in dev mode |
| `npm run dev:order` | Start Order service in dev mode |
| `npm run dev:restaurant` | Start Restaurant service in dev mode |
| `npm run dev:kitchen` | Start Kitchen service in dev mode |
| `npm run dev:payment` | Start Payment service in dev mode |

## Development Phases

### Phase 0: Foundation ✅
- [x] Monorepo initialized using npm workspaces
- [x] Root-level TypeScript, ESLint, and Prettier configurations established
- [x] Shared-types package created for cross-service contracts and schemas
- [x] Service generator script implemented for consistent service scaffolding
- [x] GitHub Actions CI pipeline set up for linting, type-checking, and testing
- [x] Initial project documentation added (architecture overview and setup instructions)

### Phase 1: Core Services ✅
- [x] Auth and Order services scaffolded using Express and TypeScript
- [x] Local development infrastructure set up via Docker Compose (RabbitMQ, PostgreSQL)
- [x] RabbitMQ connection wrapper implemented with topic exchange support
- [x] Initial event publishing and consumption flow established (order.created)
- [x] Health and readiness endpoints implemented (/health, /ready)
- [x] Structured logging added using Pino
- [x] Dockerfiles created for each service

### Phase 2: Event Infrastructure ✅
- [x] Defined a shared event envelope for all domain events
- [x] Implemented versioned event schemas using Zod
- [x] Enforced schema validation at publish time to prevent invalid events
- [x] Enforced schema validation at consume time for safe event handling
- [x] Configured retry queues and dead-letter queues (DLQ) in RabbitMQ
- [x] Implemented robust subscriber lifecycle management (init, consume, shutdown)

### Phase 3.1: Order Service Persistence & Schema Fixes ✅
- [x] Integrated Prisma ORM into the Order service
- [x] Defined Order and ProcessedEvent data models with initial Prisma schema and migrations
- [x] Resolved schema drift and ensured database and migration history consistency
- [x] Implemented Prisma client lifecycle management in the Order service
- [x] Updated shared-types to use Zod for contract-first event schema validation
- [x] Persisted orders on order.created events with idempotent consumption logic
- [x] Ensured correct dependency ownership and workspace-level dependency management

### Phase 3.2: Restaurant Service & API Documentation ✅
- [x] Restaurant service implemented with Express and TypeScript
- [x] Independent database schema using Prisma and PostgreSQL
- [x] Verified data persistence and service restart safety via migrations
- [x] Integrated Swagger (OpenAPI) documentation for all services (auth, order, restaurant)
- [x] Standardized Swagger setup and OpenAPI schema definitions across services
- [x] Documented all REST API endpoints using OpenAPI JSDoc annotations
- [x] Enforced strict event schema validation and persistence consistency
- [x] Phase 3.2 intentionally scoped to REST APIs and data modeling (no events)

### Phase 3.3: Kitchen Service & Order Decisioning ✅
- [x] Kitchen service implemented with Express, TypeScript, Prisma, and RabbitMQ
- [x] Defined Kitchen domain schema with Prisma (KitchenOrder, ProcessedEvent)
- [x] Consumed order.created events and applied acceptance/rejection logic
- [x] Published kitchen.accepted and kitchen.rejected events
- [x] Enforced idempotent event consumption and restart safety
- [x] Updated workspace scripts and documentation to include Kitchen service
- [x] Enforced strict event schema validation and persistence consistency

### Phase 3.4: Payment Service & Payment Processing ✅
- [x] Payment service implemented with Express, TypeScript, Prisma, and RabbitMQ
- [x] Defined Payment domain schema with Prisma (Payment, ProcessedEvent)
- [x] Consumed kitchen.accepted events to initiate payment processing
- [x] Implemented payment decision logic and persisted payment outcomes
- [x] Published payment.succeeded and payment.failed events
- [x] Enforced idempotent event consumption and restart safety
- [x] Added payment-related event schemas to shared-types package
- [x] Updated workspace scripts and documentation to include Payment service

## Environment Variables

Copy `.env.example` to `.env` and configure as needed:

```
RABBITMQ_URL=amqp://guest:guest@localhost:5672
DATABASE_URL=postgres://postgres:password@localhost:5432/postgres
JWT_SECRET=replace_me
```
