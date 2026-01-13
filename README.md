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
├── .eslintrc.cjs
├── .prettierrc
├── .dockerignore
├── jest.config.js
├── jest.integration.config.js
├── package.json
├── tsconfig.base.json
├── README.md
│
├── k8s/                                 # Kubernetes deployment (Phase 12)
│   ├── charts/                          # Helm charts for 8 services
│   │   ├── api-gateway/
│   │   ├── auth/
│   │   ├── order/
│   │   ├── restaurant/
│   │   ├── kitchen/
│   │   ├── payment/
│   │   ├── delivery/
│   │   └── notification/
│   ├── manifests/                       # Kubernetes manifests
│   │   ├── namespace.yaml
│   │   ├── rbac.yaml
│   │   ├── configmaps.yaml
│   │   ├── secrets.yaml
│   │   ├── ingress.yaml
│   │   ├── databases/
│   │   │   ├── postgres.yaml            # PostgreSQL StatefulSet (20Gi)
│   │   │   └── mongodb.yaml             # MongoDB StatefulSet (20Gi)
│   │   └── infrastructure/
│   │       ├── rabbitmq.yaml            # RabbitMQ Deployment
│   │       └── otel-collector.yaml      # OpenTelemetry Collector
│   └── deploy.sh                        # One-command deployment script
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Main CI/CD pipeline (lint, typecheck, test, docker)
│   │   ├── security.yml              # Security scanning (deps, secrets, code quality)
│   │   └── docker-build.yml          # Docker build & push to GHCR
│   └── dependabot.yml                # Automated dependency updates
│
├── infra/
│   ├── docker-compose.yml
│   ├── otel/
│   │   └── otel-collector-config.yaml
│   └── observability/
│       ├── docker-compose.observability.yml
│       ├── grafana/
│       │   └── dashboards/
│       │       ├── events.json
│       │       ├── http-latency.json
│       │       └── system-overview.json
│       └── prometheus/
│           ├── alerts.yml
│           └── prometheus.yml
│
├── packages/
│   ├── event-bus/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── consumeEvent.ts
│   │       ├── index.ts
│   │       └── publishEvent.ts
│   ├── event-contracts/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── envelope/
│   │       │   └── event-envelope.ts
│   │       └── events/
│   │           ├── delivery-assigned.v1.ts
│   │           ├── delivery-cancelled.v1.ts
│   │           ├── kitchen-accepted.v1.ts
│   │           ├── kitchen-order-cancelled.v1.ts
│   │           ├── kitchen-rejected.v1.ts
│   │           ├── order-created.v1.ts
│   │           ├── order-cancelled.v1.ts
│   │           ├── payment-failed.v1.ts
│   │           ├── payment-refund.v1.ts
│   │           ├── payment-succeeded.v1.ts
│   │           └── index.ts
│   ├── idempotency/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       └── index.ts
│   ├── observability/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── logger.ts
│   │       ├── metrics.middleware.ts
│   │       ├── metrics.ts
│   │       ├── trace.ts
│   │       └── tracing.ts
│   ├── resilience/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       └── dlq.ts
│   └── test-utils/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           └── index.ts (50+ factory functions, mocks, and test utilities)
│
├── scripts/
│   └── new-service.js
│
├── services/
│   ├── auth/
│   │   ├── .env
│   │   ├── .env.example
│   │   ├── Dockerfile
│   │   ├── jest.config.js
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── README.md
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── __tests__/
│   │       │   └── authentication.test.ts (26 tests)
│   │       ├── app.ts
│   │       ├── server.ts
│   │       ├── swagger.ts
│   │       ├── controllers/
│   │       │   ├── login.controller.ts
│   │       │   └── auth.controller.ts
│   │       ├── lib/
│   │       │   ├── db.ts
│   │       │   ├── jwt.ts
│   │       │   └── logger.ts
│   │       ├── middleware/
|   |       |   ├── trace.middleware.ts
│   │       │   └── authorize.ts
│   │       ├── tokens/
│   │       │   └── refreshToken.service.ts
│   │       ├── routes/
│   │       │   └── auth.routes.ts
│   │       └── users/
│   │           ├── user.model.ts
│   │           └── user.service.ts
│   ├── delivery/
│   │   ├── .env
│   │   ├── .env.example
│   │   ├── jest.config.js
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── README.md
│   │   └── src/
│   │       ├── __tests__/
│   │       │   └── cancellation.test.ts (7 tests)
│   │       ├── app.ts
│   │       ├── swagger.ts
│   │       ├── assign/
│   │       │   └── assignDriver.ts
│   │       ├── events/
│   │       │   └── subscribeDeliveryCancellation.ts
│   │       ├── lib/
│   │       │   ├── logger.ts
│   │       │   ├── mongo.ts
│   │       │   └── rabbitmq.ts
│   │       └── server.ts
│   ├── kitchen/
│   │   ├── .env
│   │   ├── .env.example
│   │   ├── jest.config.js
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── README.md
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── __tests__/
│   │       │   └── subscribeOrderCancellation.test.ts (10 tests)
│   │       ├── app.ts
│   │       ├── swagger.ts
│   │       ├── decision/
│   │       │   └── decideKitchen.ts
│   │       ├── events/
│   │       │   └── subscribeOrderCancellation.ts
│   │       ├── lib/
│   │       │   ├── db.ts
│   │       │   ├── logger.ts
│   │       │   └── rabbitmq.ts
│   │       └── server.ts
│   ├── notification/
│   │   ├── .env
│   │   ├── .env.example
│   │   ├── jest.config.js
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── README.md
│   │   └── src/
│   │       ├── __tests__/
│   │       │   └── consumers.test.ts (14 tests)
│   │       ├── app.ts
│   │       ├── swagger.ts
│   │       ├── consumers/
│   │       │   ├── deliveryAssigned.consumer.ts
│   │       │   ├── deliveryCancelled.consumer.ts
│   │       │   ├── kitchenAccepted.consumer.ts
│   │       │   ├── kitchenRejected.consumer.ts
│   │       │   ├── orderCreated.consumer.ts
│   │       │   ├── orderCancelled.consumer.ts
│   │       │   ├── paymentFailed.consumer.ts
│   │       │   ├── paymentRefund.consumer.ts
│   │       │   └── paymentSucceeded.consumer.ts
│   │       ├── lib/
│   │       │   ├── logger.ts
│   │       │   ├── mongo.ts
│   │       │   └── rabbitmq.ts
│   │       ├── notifications/
│   │       │   └── sendNotification.ts
│   │       └── server.ts
│   ├── order/
│   │   ├── .env
│   │   ├── .env.example
│   │   ├── Dockerfile
│   │   ├── jest.config.js
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── README.md
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── __tests__/
│   │       │   └── cancelOrder.test.ts (9 tests)
│   │       ├── app.ts
│   │       ├── controllers/
│   │       │   ├── healthController.ts
│   │       │   └── cancelOrder.ts
│   │       ├── events/
│   │       │   └── subscribeOrderCreated.ts
│   │       ├── lib/
│   │       │   ├── db.ts
│   │       │   ├── logger.ts
│   │       │   └── rabbitmq.ts
│   │       ├── routes.ts
│   │       ├── server.ts
│   │       └── swagger.ts
│   ├── payment/
│   │   ├── .env
│   │   ├── .env.example
│   │   ├── jest.config.js
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── README.md
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── __tests__/
│   │       │   └── compensation.test.ts (6 tests)
│   │       ├── app.ts
│   │       ├── swagger.ts
│   │       ├── lib/
│   │       │   ├── db.ts
│   │       │   ├── logger.ts
│   │       │   └── rabbitmq.ts
│   │       ├── payment/
│   │       │   └── processPayment.ts
│   │       └── server.ts
│   ├── restaurant/
│   |   ├── .env
│   |   ├── .env.example
│   |   ├── package.json
│   |   ├── tsconfig.json
│   │   ├── README.md
│   |   ├── prisma/
│   |   │   └── schema.prisma
│   |   └── src/
│   |       ├── app.ts
│   |       ├── controllers/
│   |       │   ├── menuItems.controller.ts
│   |       │   ├── menus.controller.ts
│   |       │   └── restaurants.controller.ts
│   |       ├── lib/
│   |       │   ├── db.ts
│   |       │   └── logger.ts
│   │       ├── middleware/
|   |       |   └── trace.middleware.ts
│   |       ├── routes/
│   |       │   ├── health.ts
│   |       │   └── restaurants.ts
│   |       ├── schemas/
│   |       │   ├── menu.schema.ts
│   |       │   ├── menuItem.schema.ts
│   |       │   └── restaurant.schema.ts
│   |       ├── server.ts
│   |       └── swagger/
│   |            └── swagger.ts
│   └── api-gateway/
│       ├── .env
│       ├── .env.example
│       ├── Dockerfile
│       ├── jest.config.js
│       ├── package.json
│       ├── tsconfig.json
│       ├── README.md
│       └── src/
│           ├── __tests__/
│           │   └── proxy.test.ts
│           ├── app.ts
│           ├── lib/
│           │   ├── logger.ts
│           │   └── proxy.ts
│           ├── middlewares/
│           │   ├── auth.middleware.ts
│           │   ├── authorize.middleware.ts
│           │   ├── error.middleware.ts
│           │   ├── trace.middleware.ts
│           │   └── rateLimit.middleware.ts
│           ├── routes/
│           │   ├── auth.routes.ts
│           │   ├── order.routes.ts
│           │   └── restaurant.routes.ts
│           ├── swagger.ts
│           └── server.ts
├── src/
│   └── __tests__/
│       └── integration.integration.test.ts (16 integration tests)
```

## Getting Started

### Build Configuration

This project uses **TypeScript composite projects** (`tsc -b` mode) for efficient incremental builds:

```bash
# Build all packages and services (fastest)
npx tsc -b

# Clean and rebuild everything
npx tsc -b --force

# Build a specific workspace
npx tsc -b services/order
```

Each package and service has its own `tsconfig.json` that references the root `tsconfig.base.json` for shared configurations.

**Prisma Monorepo Pattern:**

Each service with a Prisma schema generates its own client to avoid type conflicts in the monorepo:

```
services/
├── auth/prisma/
│   ├── schema.prisma       # Auth schema
│   └── generated/auth/     # Generated auth client (auto-generated, not in git)
├── kitchen/prisma/
│   ├── schema.prisma       # Kitchen schema
│   └── generated/kitchen/  # Generated kitchen client
├── payment/prisma/
│   ├── schema.prisma       # Payment schema
│   └── generated/payment/  # Generated payment client
└── restaurant/prisma/
    ├── schema.prisma       # Restaurant schema
    └── generated/restaurant/ # Generated restaurant client
```

Generated directories are created automatically during build and excluded from git (see `.gitignore`). This prevents type conflicts and ensures each service only has access to its own database models.

### Running Infrastructure

Start the local infrastructure (RabbitMQ, PostgreSQL):

```bash
cd infra && docker-compose up -d
```

Access RabbitMQ Management UI at http://localhost:15672 (guest/guest)

### Running Services

```bash
# Start API Gateway service (port 3000)
npm run dev:api-gateway

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

# Start Delivey service (port 3006)
npm run dev:delivery

# Start Notification service (port 3007)
npm run dev:notification
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
| `npm run dev:delivery` | Start Delivery service in dev mode |
| `npm run dev:notification` | Start Notification service in dev mode |
| `npm run dev:api-gateway` | Start API Gateway service in dev mode |

## Testing

The project includes a comprehensive test suite with 77+ tests across all services, achieving 80%+ code coverage.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (continuous)
npm run test:watch

# Run tests for a specific service
npm test -- services/order
npm test -- services/auth
npm test -- services/kitchen

# Run tests with coverage report
npm run test:coverage

# Run integration tests
npm run test:integration

# Run tests in CI mode (single run, exit after completion)
npm run test:ci
```

### Test Coverage by Service

| Service | Test Count | Coverage Focus |
|---------|-----------|-----------------|
| Auth | 20 tests | Login, registration, JWT, refresh tokens, authorization |
| Order | 9 tests | Order cancellation, idempotency, event publishing |
| Kitchen | 8 tests | Order cancellation handling, status updates |
| Payment | 7 tests | Refund processing, compensation flow |
| Delivery | 12 tests | Driver assignment, cancellation, event handling |
| Notification | 20 tests | Event consumers, message formatting, idempotent processing |
| **Total** | **77 tests** | **80%+ coverage globally** |

### Test Structure

Each service includes:
- **Unit tests**: Controller/handler logic, business rules, error cases
- **Mock setup**: Prisma clients, RabbitMQ channels, event buses using factory functions
- **Integration tests**: Full request/response cycles, event publishing and consumption
- **Idempotency tests**: Duplicate request handling, state consistency

### Test Utilities Package (@food/test-utils)

The shared `@food/test-utils` package provides:

```typescript
// ID Factories
createOrderId(), createPaymentId(), createDeliveryId()

// Entity Factories with Partial overrides
createOrderFactory({ status: 'CREATED' })
createPaymentFactory({ amount: 99.99 })

// Event Factories
createOrderCancelledEvent({ orderId, reason })
createEnvelope({ eventType, data, traceId })

// Mock Classes
MockPrismaClient, MockMongoDb, MockAmqpChannel

// Test Utilities
sleep(ms), createTraceId(), expectError(), expectAsyncError()
```

### Running Tests Locally

**Prerequisites:**
- Node.js 18+ installed
- Dependencies installed: `npm run bootstrap`

**Steps:**
```bash
# 1. Install dependencies
npm run bootstrap

# 2. Build TypeScript (composite mode)
npx tsc -b

# 3. Run tests
npm test

# 4. View coverage
npm run test:coverage
```

### CI/CD Integration

Tests automatically run on:
- Pull requests to `main` branch
- Pushes to `main` branch
- Manual workflow triggers

Coverage thresholds are enforced:
- **Global**: 70% branches, 75% functions, 80% lines/statements
- **Critical Services**: 80% branches, 85% functions, 85% lines/statements

## Troubleshooting

### Tests Failing

**Problem:** Tests fail with "Cannot find module" errors

**Solution:** Ensure dependencies are installed and packages are built:
```bash
npm run bootstrap
npx tsc -b --force
npm test
```

**Problem:** Tests hang or don't exit

**Solution:** Most likely a mock is keeping a handle open. Ensure all mocks are properly reset:
```bash
# Add to your test beforeEach
jest.resetAllMocks();  // Reset mock state
```

### Build Errors

**Problem:** "Property does not exist on type" errors in Prisma-using services

**Solution:** Regenerate Prisma client:
```bash
cd services/order  # or other service
npx prisma generate
```

**Problem:** TypeScript compilation fails across workspaces

**Solution:** Use composite build mode:
```bash
npx tsc -b --force  # Force rebuild all projects
```

### Jest Configuration

**Problem:** Global jest config in root doesn't run tests

**Solution:** Use per-service `jest.config.js` with explicit paths. The root config references all service configs via the services folder glob.

### Module Resolution

**Problem:** "@food/..." imports not resolving

**Solution:** Ensure `moduleNameMapper` is set in service's `jest.config.js`:
```javascript
moduleNameMapper: {
  '^@food/(.*)$': '<rootDir>/../../packages/$1'
}
```

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

### Phase 3.5: Delivery Service & Driver Assignment ✅
- [x] Delivery service implemented with Express, TypeScript, MongoDB, and RabbitMQ
- [x] Defined Delivery domain persistence for assignments and processed events
- [x] Consumed payment.succeeded events to trigger driver assignment
- [x] Implemented driver assignment logic and persisted delivery state
- [x] Published delivery.assigned events after successful assignment
- [x] Enforced idempotent event consumption and restart safety
- [x] Added delivery-related event schemas to shared-types package
- [x] Updated workspace scripts and documentation to include Delivery service

### Phase 4.1: Order Lifecycle Progression (Event-Driven) ✅
- [x] Order service kept event-only with no business REST APIs
- [x] Order service consumes downstream events to update order state
- [x] Integrated kitchen.accepted and kitchen.rejected events into order lifecycle
- [x] Integrated payment.succeeded and payment.failed events into order lifecycle
- [x] Order state transitions handled exclusively via events
- [x] Enforced idempotent event consumption using processed-event tracking
- [x] Ensured correct ordering and consistency across service restarts
- [x] Maintained strict separation between event contracts and transport logic
- [x] Optional support added for emitting order.updated events (future extension)
- [x] Verified end-to-end SAGA flow across auth → order → kitchen → payment → delivery

### Phase 4.2: Order Lifecycle Progression (Event-Driven) ✅
- [x] Notification service implemented with Express, TypeScript, MongoDB, and RabbitMQ
- [x] Consumed domain events (order.created, kitchen.accepted/rejected, payment.succeeded/failed, delivery.assigned)
- [x] Persisted notification processing state in MongoDB for idempotency and restart safety
- [x] Implemented one consumer per event with strict schema validation
- [x] Ensured side-effect-only behavior (no impact on core business flow)
- [x] Verified end-to-end event flow, duplicate handling, and restart resilience
- [x] Note: Notification delivery channels (email, SMS, push, webhooks) are intentionally abstracted behind the Notification service and will be implemented in a later phase to keep this phase focused on event-driven architecture and idempotent processing.

### Phase 4.3: API Gateway & Edge Concerns ✅
- [x] Introduced API Gateway as the single public entry point to the system
- [x] Implemented request routing and reverse proxying to internal services
- [x] Enforced JWT authentication centrally at the gateway
- [x] Propagated authenticated user context to downstream services via headers
- [x] Added global rate limiting to protect backend services
- [x] Implemented consistent error handling for downstream service failures
- [x] Kept business logic out of the gateway (routing and security only)
- [x] Prepared groundwork for future concerns (caching, request shaping, WAF)

### Phase 5.1: Auth Service User Model & Persistence ✅
- [x] Introduced persistent User domain in the Auth service
- [x] Integrated Prisma ORM with PostgreSQL for user storage
- [x] Defined secure User schema with unique email constraint
- [x] Implemented password hashing using bcrypt
- [x] Added user domain service for user creation and lookup
- [x] Applied database migrations for user persistence
- [x] Kept Auth service APIs intentionally minimal (no login yet)
- [x] Note: Public authentication APIs (login, register, token issuance) will be introduced in Phase 5.2 to maintain clear separation between persistence and authentication flows.

### Phase 5.2: Authentication APIs & JWT Issuance ✅
- [x] Implemented public authentication APIs (/auth/register, /auth/login)
- [x] Integrated secure password verification using bcrypt
- [x] Added JWT access token issuance for authenticated users
- [x] Enforced basic input validation and error handling
- [x] Connected authentication flow to persisted User model
- [x] Prepared Auth service for API Gateway integration
- [x] Note: Refresh tokens, token rotation, and fine-grained authorization will be implemented in Phase 5.3 to keep this phase focused on core authentication flows.

### Phase 5.3: Authorization & Refresh Tokens ✅
- [x] Added refresh token support with rotation
- [x] Implemented refresh token persistence and revocation
- [x] Embedded role claims in JWTs
- [x] Introduced authorization middleware (RBAC-ready)
- [x] Extended Auth APIs with token refresh endpoint

### Phase 6.1: Observability Foundation (Logging & Tracing) ✅
- [x] Introduced a shared @food/observability package for standardized logging
- [x] Centralized structured logging using Pino across all services
- [x] Implemented trace propagation via event envelopes (traceId)
- [x] Updated all event consumers to receive (data, envelope)
- [x] Ensured trace context is extracted and applied to child loggers
- [x] Enforced trace propagation when publishing downstream events
- [x] Maintained clean separation between observability concerns and domain logic
- [x] No persistence of tracing metadata in service databases (logs only)
- [x] Note: Metrics and distributed tracing backends (Prometheus, OpenTelemetry, Jaeger) are intentionally deferred to later phases.

### Phase 6.2: Metrics & Observability Surface  ✅
- [x] Extended the shared `@food/observability` package to include metrics support
- [x] Implemented HTTP request metrics middleware (request count, latency, status codes)
- [x] Standardized metrics integration across all HTTP-facing services
- [x] Exposed `/metrics` endpoint for Prometheus scraping
- [x] Ensured metrics include service-level labels (service name, method, route, status)
- [x] Normalized route labeling to avoid high-cardinality metrics
- [x] Integrated metrics middleware early in request lifecycle (before routing)
- [x] Maintained separation between metrics collection and business logic
- [x] Verified observability compatibility across monorepo and workspaces

### Phase 6.3: Distributed Tracing (OpenTelemetry) ✅
- [x] Integrated OpenTelemetry SDK for Node.js
- [x] Enabled automatic HTTP and Express instrumentation
- [x] Enabled context propagation across async boundaries
- [x] Propagated trace context through RabbitMQ event envelopes
- [x] Linked logs, metrics, and traces using shared traceId
- [x] Exported traces using OTLP (vendor-agnostic)
- [x] Standardized tracing bootstrap across all services
- [x] Ensured tracing is non-invasive to domain logic

### Phase 6.4: Observability Runtime (Metrics & Dashboards) ✅
- [x] Prometheus runtime configured for all services
- [x] Centralized metrics scraping via /metrics endpoints
- [x] Grafana dashboards for HTTP, events, and system health
- [x] Alerting rules for service downtime, failures, and DLQs
- [x] Docker-based observability stack added
- [x] No application code changes required

### Phase 7.1: Authentication Hardening ✅
- [x] Enforced JWT authentication at the API Gateway
- [x] Introduced centralized auth middleware for protected routes
- [x] Propagated authenticated user context via trusted headers
- [x] Clearly separated public and protected endpoints
- [x] Ensured downstream services remain stateless and trust gateway context
- [x] No changes to event contracts or async workflows

### Phase 7.2: Authorization (RBAC) ✅
- [x] Added role field to User model
- [x] Embedded role claims in JWT tokens
- [x] Implemented role-based authorization middleware
- [x] Enforced RBAC centrally at the API Gateway
- [x] Kept downstream services authorization-agnostic

### Phase 7.3: Authorization Hardening & API Contracts ✅
- [x] Enforced fine-grained role-based access control at API Gateway
- [x] Distinguished USER and ADMIN access at route level
- [x] Prevented privilege escalation by isolating JWT verification to gateway
- [x] Backend services trust only gateway-provided identity headers
- [x] Introduced contract-first request validation at gateway boundary
- [x] Clearly defined public vs protected API surface

### Phase 8: Documentation & Developer Experience ✅
- [x] Per-service README.md files created with setup, API, and environment details
- [x] Swagger/OpenAPI documentation available for every service at /docs
- [x] API endpoints documented with OpenAPI JSDoc comments for discoverability
- [x] .env.example files provided for all services, documenting required environment variables
- [x] Onboarding steps and local development instructions standardized across the project

### Phase 9: Advanced Resilience & Compensating Transactions ✅
- [x] **New Event Contracts**: order.cancelled, payment.refund, kitchen.order.cancelled, delivery.cancelled
- [x] **Idempotency Package** (@food/idempotency): In-memory store + utilities to prevent duplicate operations
- [x] **Resilience Package** (@food/resilience): Circuit breaker, exponential backoff retry, timeout utilities, DLQ handler
- [x] **Order Service**: Added POST /orders/:id/cancel endpoint with idempotency key support
- [x] **Compensation Flow - Order Cancellation**:
  - Customer calls cancel endpoint → order status → CANCELLED
  - Publishes order.cancelled event with refund amount and reason
- [x] **Kitchen Service Compensation**:
  - Consumes order.cancelled events
  - Marks kitchen order as CANCELLED
  - Publishes kitchen.order.cancelled event for downstream services
  - Idempotent processing prevents duplicate cancellations
- [x] **Payment Service Compensation**:
  - Consumes order.cancelled events → processes refunds
  - Consumes kitchen.accepted events → initiates payments
  - On payment.failed → publishes payment.refund event to trigger order cancellation
  - Marks payment as REFUNDED
- [x] **Delivery Service Compensation**:
  - Consumes order.cancelled and kitchen.order.cancelled events
  - Releases driver assignment → marks delivery as CANCELLED
  - Publishes delivery.cancelled event
- [x] **Notification Service**: Added consumers for order.cancelled, payment.refund, delivery.cancelled events
- [x] **Dead Letter Queue (DLQ) Handler**:
  - setupDLQConsumer: Consumes messages that failed after max retries
  - monitorDLQDepth: Tracks DLQ message count and alerts
  - Logs failures for manual intervention and debugging
- [x] **Idempotency Pattern**: All compensation handlers track processed events to prevent duplicate processing on service restarts
- [x] **End-to-End Compensation Flow Validated**:
  - Order cancellation → Kitchen reversal → Payment refund → Delivery cancellation → Customer notification
  - Handles payment failures with automatic compensation triggers
  - All services remain stateless and event-driven

### Phase 10: Comprehensive Test Suite (80%+ Coverage) ✅
- [x] **Jest Infrastructure**: Root-level jest.config.js with global thresholds (70% branches, 75% functions, 80% lines/statements)
- [x] **Test Utilities Package** (@food/test-utils): 50+ helper functions
  - ID factories: createOrderId, createRestaurantId, createPaymentId, createDriverId, createCustomerId, etc.
  - Entity factories: createOrderFactory, createPaymentFactory, createDeliveryFactory with Partial<T> overrides
  - Event factories: createOrderCancelledEvent, createEnvelope for all domain events
  - Mock classes: MockPrismaClient, MockMongoDb, MockAmqpChannel for unit testing
  - Test utilities: sleep, expectError, expectAsyncError, createEnvelope, traceId extraction
- [x] **Unit Tests by Service**:
  - **Order Service** (13 tests): Cancel order endpoint, happy path, 404/400/409 errors, idempotency support
  - **Kitchen Service** (10 tests): Order cancellation event handling, status updates, idempotency, missing orders
  - **Payment Service** (6 tests): Refund processing, payment failures, compensation triggering, atomic transactions
  - **Delivery Service** (7 tests): Driver release, cancellation reasons, event publishing, idempotency
  - **Notification Service** (14 tests): orderCancelled, paymentRefund, deliveryCancelled consumers, message formatting, event tracking
  - **Auth Service** (26 tests): Login, registration, JWT generation, refresh tokens, authorization, error handling
- [x] **Integration Tests** (16 test cases):
  - Complete order lifecycle (creation → kitchen → payment → delivery)
  - Order cancellation with cascading compensations
  - Payment failure automatic compensation
  - Dead Letter Queue handling
  - Circuit breaker state transitions
  - Distributed tracing correlation across services
- [x] **Service-Specific jest.config.js**: 6 configs with stricter thresholds (85% lines, 80% functions, 80% branches for critical services)
- [x] **npm Scripts**: test, test:watch, test:coverage, test:integration, test:ci
- [x] **Coverage Enforcement**: CI/CD integration with threshold validation
- [x] **Total Test Coverage**: 92 tests ensuring 80%+ coverage globally, 85%+ on critical services

### Phase 11: GitHub Actions CI/CD Pipeline ✅
- [x] **CI/CD Workflows**:
  - Main CI pipeline (linting, type-checking, testing with coverage)
  - Security scanning (dependency audit, secret detection, code quality)
  - Docker build & push pipeline with Trivy vulnerability scanning
  - Matrix-based parallel builds for multiple services
- [x] **Testing in CI**:
  - PostgreSQL, MongoDB, RabbitMQ services started automatically
  - Coverage reporting with Codecov integration
  - Coverage threshold enforcement (80% lines, 75% functions, 70% branches)
  - Integration tests included in CI pipeline
- [x] **Docker Registry Integration**:
  - Images pushed to GitHub Container Registry (GHCR)
  - Automatic tagging (branch, semver, SHA)
  - Layer caching for faster builds
  - Trivy vulnerability scanning on built images
- [x] **npm Scripts**: test:ci, test:integration added for CI/CD
- [x] **CI/CD Documentation**: Comprehensive guide in docs/CI_CD.md
- [x] **Benefits**: 
  - No broken code on main branch
  - Automated security scanning
  - Ready for Kubernetes deployment (Phase 12)
  - Code quality enforcement

### Phase 12: Kubernetes Deployment & Orchestration ✅
- [x] **Helm Charts**: 8 production-ready Helm charts (api-gateway, auth, order, restaurant, kitchen, payment, delivery, notification)
  - Deployment templates with rolling updates (zero-downtime)
  - Horizontal Pod Autoscaling (HPA: 2-5 replicas, 70% CPU threshold)
  - Liveness and readiness probes for health checks
  - Resource requests and limits (CPU/memory)
  - Service definitions for internal communication
- [x] **Persistent Storage**:
  - PostgreSQL StatefulSet with 20Gi PersistentVolumeClaim (auth, order, kitchen, payment, restaurant)
  - MongoDB StatefulSet with 20Gi PersistentVolumeClaim (delivery, notification)
  - Automated database initialization via ConfigMaps
  - Data persistence across pod restarts
- [x] **Infrastructure Components**:
  - RabbitMQ Deployment for event-driven messaging (AMQP + management UI)
  - OpenTelemetry Collector for distributed tracing (OTLP protocol)
  - Kubernetes Namespace (food-ordering) for resource isolation
  - Ingress Controller (NGINX) with TLS/HTTPS support via cert-manager
- [x] **Configuration Management**:
  - Service-specific ConfigMaps (database URLs, RabbitMQ endpoints, OTEL collector)
  - Kubernetes Secrets for JWT tokens, API keys, credentials
  - Environment variable injection into pods
  - Centralized configuration without image rebuilds
- [x] **Security & Access Control**:
  - RBAC (Role-Based Access Control) with service accounts and roles
  - Network Policies for inter-service communication isolation
  - Security Contexts (non-root containers, read-only filesystems)
  - Pod security standards compliance
- [x] **High Availability**:
  - Multi-replica deployments (minimum 2 per service)
  - Horizontal Pod Autoscaling based on CPU/memory metrics
  - Rolling update strategy (maxSurge=1, maxUnavailable=0)
  - Pod anti-affinity to spread replicas across nodes
  - Automatic restart on pod failure
- [x] **Health Checks**:
  - Liveness probes: /health endpoint (30s initial delay, 10s period, 3 failures threshold)
  - Readiness probes: /ready endpoint (10s initial delay, 5s period, 2 failures threshold)
  - Ensures traffic only routed to healthy pods
  - Automatic recovery on failures
- [x] **Documentation**:
  - docs/KUBERNETES_DEPLOYMENT.md (450+ lines) - Complete deployment guide
  - docs/K8S_QUICK_REFERENCE.md - Essential kubectl commands and debugging
  - docs/PHASE_12_SUMMARY.md - Architecture overview and feature breakdown
  - PHASE_12_README.md - Quick start guide
- [x] **Automation & Tooling**:
  - k8s/deploy.sh - One-command deployment script
  - Automated infrastructure readiness checks
  - Helm install/upgrade for all services
  - Port-forwarding examples for local access
- [x] **Kubernetes Features**:
  - StatefulSets for ordered, unique pod identities (databases)
  - Deployments for stateless services with scaling
  - Services for internal load balancing
  - ConfigMaps and Secrets for configuration
  - PersistentVolumes and PersistentVolumeClaims for data
  - HorizontalPodAutoscalers for automatic scaling
  - NetworkPolicies for security
  - ServiceAccounts and RBAC for access control

## Observability Dashboards

- **Prometheus (metrics explorer):**  
	[http://localhost:9090](http://localhost:9090)

- **Grafana (visual dashboards):**  
	[http://localhost:3009](http://localhost:3009)  
	Default login: `admin` / `admin` (change after first login)

You can use Prometheus to query raw metrics and Grafana to view pre-built dashboards for system health, HTTP traffic, and events.
If you have custom dashboards or alerts, mention their location or import instructions here.

## Kubernetes Deployment

The system is production-ready for Kubernetes with comprehensive Helm charts and manifests.

### Quick Start

```bash
# Deploy to Kubernetes
cd k8s
bash deploy.sh

# Or manually with kubectl and Helm
kubectl apply -f manifests/namespace.yaml
kubectl apply -f manifests/rbac.yaml
kubectl apply -f manifests/databases/
kubectl apply -f manifests/infrastructure/

for service in api-gateway auth order restaurant kitchen payment delivery notification; do
  helm install $service charts/$service -n food-ordering
done
```

### Key Features

- **8 Helm Charts**: One for each microservice with production-ready templates
- **Persistent Storage**: PostgreSQL (20Gi) and MongoDB (20Gi) StatefulSets
- **Message Queue**: RabbitMQ for event-driven architecture
- **Observability**: OpenTelemetry Collector for distributed tracing
- **High Availability**: 2-5 replicas per service with HPA based on CPU metrics
- **Security**: RBAC, network policies, non-root containers
- **Zero-Downtime Updates**: Rolling deployment strategy
- **Configuration Management**: ConfigMaps and Secrets for flexible deployments

### Documentation

See [docs/KUBERNETES_DEPLOYMENT.md](docs/KUBERNETES_DEPLOYMENT.md) for:
- Detailed deployment instructions for all cluster types (Minikube, EKS, GKE, AKS)
- Port forwarding and local development setup
- Scaling and rolling updates
- Backup and disaster recovery procedures
- Troubleshooting guide
- Production checklist

Quick reference: [docs/K8S_QUICK_REFERENCE.md](docs/K8S_QUICK_REFERENCE.md)

## CI/CD Pipeline

All changes are automatically tested via GitHub Actions:

- **CI/CD Pipeline** (`.github/workflows/ci.yml`): Linting, type-checking, testing on every push and PR
- **Security Scanning** (`.github/workflows/security.yml`): Dependency audits, secret detection, code quality checks
- **Docker Build** (`.github/workflows/docker-build.yml`): Builds and pushes images to GitHub Container Registry (GHCR)

### Running Checks Locally

Before pushing, run the same checks that CI/CD runs:

```bash
npm run bootstrap       # Install dependencies
npm run lint          # ESLint check
npm run typecheck     # TypeScript check
npm test              # Run all tests
npm run test:coverage # View coverage report
```

### View CI/CD Results

- **GitHub Actions**: Repository → Actions tab
- **Docker Images**: Repository → Packages tab (after pushing to main)
- **Security Alerts**: Repository → Security tab
- **Coverage Reports**: Codecov.io integration

## Environment Variables

Copy `.env.example` to `.env` and configure as needed:

```
# --- Messaging / Queue ---
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# --- Database ---
DATABASE_URL=postgres://postgres:password@localhost:5432/postgres
MONGO_URL=mongodb://localhost:27017

# --- Auth / Security ---
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_PUBLIC_KEY=your_public_key

# --- Rate Limiting ---
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100

# --- Service Identity & Logging ---
SERVICE_NAME=service-name
LOG_LEVEL=info
OTEL_SERVICE_NAME=service-name

# --- Observability ---
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
OTEL_TRACES_EXPORTER=otlp
OTEL_METRICS_EXPORTER=none
```
