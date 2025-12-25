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
├── README.md
├── infra/
│   |── docker-compose.yml
│   └── prometheus.yml
├── package.json
├── tsconfig.base.json
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
│   │       ├── events/
│   │       │   ├── delivery-assigned.v1.ts
│   │       │   ├── kitchen-accepted.v1.ts
│   │       │   ├── kitchen-rejected.v1.ts
│   │       │   ├── order-created.v1.ts
│   │       │   ├── payment-failed.v1.ts
│   │       │   ├── payment-succeeded.v1.ts
│   │       │   └── index.ts
│   └── observability/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── logger.ts
│           ├── metrics.ts
│           └── trace.ts
├── scripts/
│   └── new-service.js
├── services/
│   ├── auth/
│   │   ├── .env
│   │   ├── .env.example
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── app.ts
│   │       ├── server.ts
│   │       ├── controllers/
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
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── app.ts
│   │       ├── assign/
│   │       │   └── assignDriver.ts
│   │       ├── lib/
│   │       │   ├── logger.ts
│   │       │   ├── mongo.ts
│   │       │   └── rabbitmq.ts
│   │       └── server.ts
│   ├── kitchen/
│   │   ├── .env
│   │   ├── .env.example
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── app.ts
│   │       ├── decision/
│   │       │   └── decideKitchen.ts
│   │       ├── lib/
│   │       │   ├── db.ts
│   │       │   ├── logger.ts
│   │       │   └── rabbitmq.ts
│   │       └── server.ts
│   ├── notification/
│   │   ├── .env
│   │   ├── .env.example
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── app.ts
│   │       ├── consumers/
│   │       │   ├── deliveryAssigned.consumer.ts
│   │       │   ├── kitchenAccepted.consumer.ts
│   │       │   ├── kitchenRejected.consumer.ts
│   │       │   ├── orderCreated.consumer.ts
│   │       │   ├── paymentFailed.consumer.ts
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
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── app.ts
│   │       ├── controllers/
│   │       │   └── healthController.ts
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
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── app.ts
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
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── app.ts
│           ├── lib/
│           │   ├── logger.ts
│           │   └── proxy.ts
│           ├── middlewares/
│           │   ├── auth.middleware.ts
│           │   ├── error.middleware.ts
│           │   ├── trace.middleware.ts
│           │   └── rateLimit.middleware.ts
│           ├── routes/
│           │   ├── auth.routes.ts
│           │   ├── order.routes.ts
│           │   └── restaurant.routes.ts
│           └── server.ts
```

## Getting Started

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

## Environment Variables

Copy `.env.example` to `.env` and configure as needed:

```
RABBITMQ_URL=amqp://guest:guest@localhost:5672
DATABASE_URL=postgres://postgres:password@localhost:5432/postgres
MONGO_URL=mongodb://localhost:27017
JWT_SECRET=replace_me
AUTH_SERVICE_URL=http://localhost:3001
ORDER_SERVICE_URL=http://localhost:3002
RESTAURANT_SERVICE_URL=http://localhost:3003
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
SERVICE_NAME=service-name
LOG_LEVEL=level
```
