# Food Ordering System

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
├── services/
│   ├── auth/               # Authentication service (Express + RabbitMQ)
│   └── order/              # Order management service (Express + RabbitMQ)
├── infra/
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

## API Usage

### POST /orders (Auth Service)

Create a new order and publish an order.created event.

**Request Body:**

```
{
	"orderId": "order-123",
	"items": [
		{ "id": "pizza", "qty": 1 }
	],
	"total": 12.5
}
```

**Validation:**
- `orderId`: string (required)
- `items`: array of objects with `id` (string) and `qty` (positive integer)
- `total`: positive number

**Example Error Responses:**
- Missing or invalid `orderId`, `items`, or `total` will result in a validation error with details in the response.

### Testing the Endpoint

You can use Postman or curl to test the endpoint:

```
curl -X POST http://localhost:3001/orders \
	-H "Content-Type: application/json" \
	-d '{
		"orderId": "order-123",
		"items": [{ "id": "pizza", "qty": 1 }],
		"total": 12.5
	}'
```

See the todo list for additional test cases and validation scenarios.

## Development Phases

### Phase 0: Foundation ✅
- [x] Monorepo setup with npm workspaces
- [x] Root TypeScript, ESLint, and Prettier configs
- [x] Shared-types package
- [x] Service generator script
- [x] CI pipeline (GitHub Actions)
- [x] Documentation

### Phase 1: Core Services ✅
- [x] Auth service with Express setup
- [x] Order service with Express setup
- [x] Local infra via Docker Compose (RabbitMQ, PostgreSQL)
- [x] RabbitMQ connection wrapper with topic exchange
- [x] Event publishing/subscribing (order.created)
- [x] Health check endpoints (/health, /ready)
- [x] Pino structured logging
- [x] Dockerfiles for each service


### Phase 2: Event Infrastructure ✅
- [x] Shared event envelope defined
- [x] Event schemas implemented
- [x] Publish validation enforced
- [x] Consume validation enforced
- [x] Retry + DLQ queues configured
- [x] Subscriber lifecycle managed
- [x] Dev-only endpoints removed

### Phase 3.1: Order Service Persistence & Schema Fixes ✅
- [x] Integrated Prisma ORM in the order service
- [x] Added initial Prisma schema and migration for Order and ProcessedEvent models
- [x] Added Prisma client setup in order service
- [x] Updated shared-types to use zod and correct event schema
- [x] Updated order service to persist orders and handle idempotency
- [x] Added required dependencies to package.json files
- [x] Ensured event schemas are validated and persisted correctly

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
