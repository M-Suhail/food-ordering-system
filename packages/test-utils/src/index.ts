/**
 * Test Utilities & Factories
 * Shared test helpers, mocks, and fixtures for all services
 */

import { v4 as uuidv4 } from 'uuid';

// ============ FACTORIES ============

export function createOrderId(): string {
  return `order-${uuidv4()}`;
}

export function createRestaurantId(): string {
  return `restaurant-${uuidv4()}`;
}

export function createUserId(): string {
  return `user-${uuidv4()}`;
}

export function createPaymentId(): string {
  return `payment-${uuidv4()}`;
}

export function createDriverId(): string {
  return `driver-${uuidv4()}`;
}

export function createTraceId(): string {
  return uuidv4();
}

// ============ ORDER FACTORIES ============

export interface OrderData {
  orderId: string;
  restaurantId: string;
  total: number;
  status: 'CREATED' | 'CANCELLED' | 'DELIVERY_ASSIGNED' | 'DELIVERED';
  createdAt?: string;
}

export function createOrderFactory(overrides?: Partial<OrderData>): OrderData {
  return {
    orderId: createOrderId(),
    restaurantId: createRestaurantId(),
    total: 99.99,
    status: 'CREATED',
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

// ============ EVENT FACTORIES ============

export interface OrderCreatedEvent {
  orderId: string;
  restaurantId: string;
  total: number;
}

export function createOrderCreatedEvent(
  overrides?: Partial<OrderCreatedEvent>
): OrderCreatedEvent {
  return {
    orderId: createOrderId(),
    restaurantId: createRestaurantId(),
    total: 99.99,
    ...overrides
  };
}

export interface OrderCancelledEvent {
  orderId: string;
  reason: 'customer_requested' | 'payment_failed' | 'kitchen_rejected' | 'delivery_unavailable';
  cancelledAt: string;
  refundAmount?: number;
}

export function createOrderCancelledEvent(
  overrides?: Partial<OrderCancelledEvent>
): OrderCancelledEvent {
  return {
    orderId: createOrderId(),
    reason: 'customer_requested',
    cancelledAt: new Date().toISOString(),
    refundAmount: 99.99,
    ...overrides
  };
}

export interface PaymentData {
  id: string;
  orderId: string;
  amount: number;
  status: 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
  reason?: string;
}

export function createPaymentFactory(overrides?: Partial<PaymentData>): PaymentData {
  return {
    id: createPaymentId(),
    orderId: createOrderId(),
    amount: 99.99,
    status: 'SUCCEEDED',
    ...overrides
  };
}

export interface DeliveryData {
  orderId: string;
  driverId: string;
  status: 'ASSIGNED' | 'CANCELLED';
  assignedAt: string;
}

export function createDeliveryFactory(overrides?: Partial<DeliveryData>): DeliveryData {
  return {
    orderId: createOrderId(),
    driverId: createDriverId(),
    status: 'ASSIGNED',
    assignedAt: new Date().toISOString(),
    ...overrides
  };
}

// ============ MOCKS ============

export class MockPrismaClient {
  order = {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn()
  };
  payment = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  };
  processedEvent = {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn()
  };
  user = {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn()
  };
  $disconnect = jest.fn();
  $executeRaw = jest.fn();
}

export class MockMongoDb {
  collection = jest.fn().mockReturnValue({
    insertOne: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    find: jest.fn().mockReturnValue({
      toArray: jest.fn()
    })
  });
}

export class MockAmqpChannel {
  assertExchange = jest.fn();
  assertQueue = jest.fn();
  bindQueue = jest.fn();
  publish = jest.fn().mockReturnValue(true);
  consume = jest.fn();
  ack = jest.fn();
  nack = jest.fn();
  checkQueue = jest.fn();
}

// ============ TEST UTILITIES ============

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function expectError(fn: () => void, errorPattern?: string | RegExp): void {
  try {
    fn();
    throw new Error('Expected function to throw');
  } catch (err) {
    if (errorPattern) {
      expect((err as Error).message).toMatch(errorPattern);
    }
  }
}

export async function expectAsyncError(
  fn: () => Promise<void>,
  errorPattern?: string | RegExp
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected function to throw');
  } catch (err) {
    if (errorPattern) {
      expect((err as Error).message).toMatch(errorPattern);
    }
  }
}

// ============ ENVELOPE FACTORY ============

export interface EventEnvelope<T> {
  eventId: string;
  eventType: string;
  eventVersion: number;
  occurredAt: string;
  producer: string;
  traceId: string;
  data: T;
}

export function createEnvelope<T>(data: T, overrides?: Partial<EventEnvelope<T>>): EventEnvelope<T> {
  return {
    eventId: uuidv4(),
    eventType: 'test.event',
    eventVersion: 1,
    occurredAt: new Date().toISOString(),
    producer: 'test-service',
    traceId: createTraceId(),
    data,
    ...overrides
  };
}
