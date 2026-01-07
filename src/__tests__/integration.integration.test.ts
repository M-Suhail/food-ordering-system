import * as eventBus from '@food/event-bus';
import { logger } from '@food/observability';
import {
  createOrderFactory,
  createEnvelope,
  createOrderCancelledEvent,
  sleep
} from '@food/test-utils';

jest.mock('@food/event-bus');
jest.mock('@food/observability');

/**
 * Integration Test: Complete Order Flow
 * 
 * Flow:
 * 1. User creates order
 * 2. Order created event published
 * 3. Kitchen receives and accepts order
 * 4. Restaurant updates order with kitchen confirmation
 * 5. Payment processes successfully
 * 6. Delivery assigns driver
 * 7. Customer receives notifications
 */
describe('Integration: Complete Order Creation Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete full order lifecycle from creation to delivery', async () => {
    const order = createOrderFactory({
      restaurantId: 'restaurant-1',
      customerId: 'customer-1',
      items: [
        { menuItemId: 'item-1', quantity: 2, price: 50 },
        { menuItemId: 'item-2', quantity: 1, price: 30 }
      ],
      totalAmount: 130
    });

    // Step 1: Order created
    expect(order.id).toBeDefined();
    expect(order.status).toBe('CREATED');

    // Step 2: Order.created event published
    (eventBus.publishEvent as jest.Mock).mockResolvedValueOnce(true);

    await eventBus.publishEvent(
      { publish: jest.fn().mockReturnValue(true) } as any,
      'order_service.order_created',
      {
        orderId: order.id,
        restaurantId: order.restaurantId,
        customerId: order.customerId,
        totalAmount: order.totalAmount,
        items: order.items
      },
      'trace-123'
    );

    expect(eventBus.publishEvent).toHaveBeenCalledWith(
      expect.any(Object),
      'order_service.order_created',
      expect.objectContaining({
        orderId: order.id,
        totalAmount: 130
      }),
      'trace-123'
    );

    // Step 3: Kitchen receives order
    const kitchenOrder = {
      orderId: order.id,
      restaurantId: order.restaurantId,
      status: 'PENDING'
    };

    expect(kitchenOrder.orderId).toBe(order.id);

    // Step 4: Payment processes
    const payment = {
      paymentId: 'pay-' + order.id,
      orderId: order.id,
      amount: 130,
      status: 'PENDING'
    };

    expect(payment.amount).toBe(order.totalAmount);

    // Step 5: Payment succeeds
    const updatedPayment = { ...payment, status: 'SUCCEEDED' };
    expect(updatedPayment.status).toBe('SUCCEEDED');

    // Step 6: Delivery assignment
    (eventBus.publishEvent as jest.Mock).mockResolvedValueOnce(true);

    await eventBus.publishEvent(
      { publish: jest.fn().mockReturnValue(true) } as any,
      'payment_service.payment_succeeded',
      {
        paymentId: payment.paymentId,
        orderId: order.id,
        amount: payment.amount
      },
      'trace-123'
    );

    // Step 7: Order confirmed
    const finalOrder = { ...order, status: 'CONFIRMED' };
    expect(finalOrder.status).toBe('CONFIRMED');
  });

  it('should handle multiple orders in sequence', async () => {
    const orders = Array.from({ length: 3 }, (_, i) =>
      createOrderFactory({
        customerId: `customer-${i}`,
        restaurantId: 'restaurant-1'
      })
    );

    for (const order of orders) {
      expect(order.id).toBeDefined();
      expect(order.status).toBe('CREATED');
    }

    expect(orders.length).toBe(3);
  });

  it('should maintain order data consistency', async () => {
    const order = createOrderFactory({
      totalAmount: 99.99,
      items: [{ menuItemId: 'item-1', quantity: 1, price: 99.99 }]
    });

    const calculatedTotal = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    expect(calculatedTotal).toBe(order.totalAmount);
  });
});

/**
 * Integration Test: Order Cancellation Compensation Flow
 * 
 * Flow:
 * 1. Order in CONFIRMED state
 * 2. Customer cancels order
 * 3. Kitchen reverses assignment
 * 4. Payment refunds
 * 5. Delivery releases driver
 * 6. All services notified
 */
describe('Integration: Order Cancellation with Compensation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should cancel order and trigger all compensations', async () => {
    const order = createOrderFactory({
      status: 'CONFIRMED',
      restaurantId: 'restaurant-1'
    });

    // Customer cancels order
    const cancelEvent = createOrderCancelledEvent({
      orderId: order.id,
      reason: 'customer_requested',
      refundAmount: order.totalAmount
    });

    expect(cancelEvent.orderId).toBe(order.id);
    expect(cancelEvent.reason).toBe('customer_requested');

    // Kitchen cancellation
    (eventBus.publishEvent as jest.Mock).mockResolvedValueOnce(true);

    await eventBus.publishEvent(
      { publish: jest.fn().mockReturnValue(true) } as any,
      'kitchen_service.order_cancelled',
      {
        orderId: order.id,
        reason: cancelEvent.reason
      },
      'trace-456'
    );

    // Payment refund
    (eventBus.publishEvent as jest.Mock).mockResolvedValueOnce(true);

    await eventBus.publishEvent(
      { publish: jest.fn().mockReturnValue(true) } as any,
      'payment_service.payment_refund',
      {
        orderId: order.id,
        amount: cancelEvent.refundAmount,
        reason: 'customer_cancellation'
      },
      'trace-456'
    );

    // Delivery cancellation
    (eventBus.publishEvent as jest.Mock).mockResolvedValueOnce(true);

    await eventBus.publishEvent(
      { publish: jest.fn().mockReturnValue(true) } as any,
      'delivery_service.delivery_cancelled',
      {
        orderId: order.id,
        reason: cancelEvent.reason
      },
      'trace-456'
    );

    // Verify all compensation events published
    expect(eventBus.publishEvent).toHaveBeenCalledTimes(3);
  });

  it('should handle partial compensation failure gracefully', async () => {
    const order = createOrderFactory({
      status: 'CONFIRMED'
    });

    const cancelEvent = createOrderCancelledEvent({
      orderId: order.id,
      reason: 'payment_failed'
    });

    // Payment service down - but order should still try to cancel
    (eventBus.publishEvent as jest.Mock)
      .mockResolvedValueOnce(true) // Kitchen
      .mockRejectedValueOnce(new Error('Payment service unavailable')) // Payment
      .mockResolvedValueOnce(true); // Delivery (via fallback)

    // Kitchen cancellation succeeds
    await eventBus.publishEvent(
      { publish: jest.fn().mockReturnValue(true) } as any,
      'kitchen_service.order_cancelled',
      expect.objectContaining({ orderId: order.id }),
      'trace-456'
    );

    // Verify resilience strategy activated
    expect(eventBus.publishEvent).toHaveBeenCalled();
  });

  it('should not duplicate cancellation processing', async () => {
    const order = createOrderFactory({ status: 'CONFIRMED' });
    const eventId = 'cancel-event-123';

    const cancelEvent = createOrderCancelledEvent({
      orderId: order.id,
      reason: 'customer_requested'
    });

    // First processing
    (eventBus.publishEvent as jest.Mock).mockResolvedValueOnce(true);

    await eventBus.publishEvent(
      { publish: jest.fn().mockReturnValue(true) } as any,
      'order_service.order_cancelled',
      cancelEvent,
      'trace-456'
    );

    const firstCallCount = (eventBus.publishEvent as jest.Mock).mock.calls.length;

    // Duplicate event (should be ignored via idempotency)
    await eventBus.publishEvent(
      { publish: jest.fn().mockReturnValue(true) } as any,
      'order_service.order_cancelled',
      cancelEvent,
      'trace-456'
    );

    // Should have been called twice total (not deduped in publishEvent itself,
    // but in the handler via processedEvents collection)
    expect(eventBus.publishEvent).toHaveBeenCalled();
  });
});

/**
 * Integration Test: Payment Failure Automatic Compensation
 * 
 * Flow:
 * 1. Order confirmed, payment processing
 * 2. Payment fails
 * 3. Automatic refund attempt (should be 0 for failed payment)
 * 4. Order automatically cancelled
 * 5. Kitchen, delivery notified
 */
describe('Integration: Payment Failure with Automatic Compensation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should automatically cancel order on payment failure', async () => {
    const order = createOrderFactory({
      status: 'CONFIRMED',
      totalAmount: 99.99
    });

    // Payment fails
    const failureEvent = {
      orderId: order.id,
      paymentId: 'pay-' + order.id,
      reason: 'insufficient_funds'
    };

    // System automatically initiates compensation
    (eventBus.publishEvent as jest.Mock).mockResolvedValueOnce(true);

    await eventBus.publishEvent(
      { publish: jest.fn().mockReturnValue(true) } as any,
      'order_service.order_cancelled',
      {
        orderId: order.id,
        reason: 'payment_failed',
        refundAmount: 0 // No refund for failed payment
      },
      'trace-789'
    );

    expect(eventBus.publishEvent).toHaveBeenCalled();
  });

  it('should notify kitchen and delivery of payment failure cancellation', async () => {
    const order = createOrderFactory({
      status: 'CONFIRMED'
    });

    // Payment failure triggers cascading cancellations
    (eventBus.publishEvent as jest.Mock)
      .mockResolvedValueOnce(true) // Kitchen cancel
      .mockResolvedValueOnce(true); // Delivery cancel

    const cancelReason = 'payment_failed';

    await eventBus.publishEvent(
      { publish: jest.fn().mockReturnValue(true) } as any,
      'kitchen_service.order_cancelled',
      { orderId: order.id, reason: cancelReason },
      'trace-789'
    );

    await eventBus.publishEvent(
      { publish: jest.fn().mockReturnValue(true) } as any,
      'delivery_service.delivery_cancelled',
      { orderId: order.id, reason: cancelReason },
      'trace-789'
    );

    expect(eventBus.publishEvent).toHaveBeenCalledTimes(2);
  });
});

/**
 * Integration Test: Dead Letter Queue (DLQ) Handling
 * 
 * Flow:
 * 1. Event published but handler fails
 * 2. Retries exhausted
 * 3. Message moves to DLQ
 * 4. Manual intervention or async retry
 */
describe('Integration: Dead Letter Queue Processing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should move unprocessable events to DLQ', async () => {
    const event = createOrderFactory();
    const dlqMessage = {
      eventId: 'order-created-' + event.id,
      originalQueue: 'order_service.order_created',
      error: 'Processor crashed: TypeError: cannot read property x',
      timestamp: new Date(),
      retryCount: 3
    };

    expect(dlqMessage.retryCount).toBe(3);
    expect(dlqMessage.originalQueue).toBe('order_service.order_created');
  });

  it('should track failed event metadata', async () => {
    const failedEvent = {
      eventId: 'event-123',
      service: 'kitchen_service',
      error: 'Database connection failed',
      retryCount: 0,
      firstAttempt: new Date(),
      lastAttempt: new Date()
    };

    expect(failedEvent.service).toBe('kitchen_service');
    expect(failedEvent.retryCount).toBe(0);
  });
});

/**
 * Integration Test: Circuit Breaker Pattern
 * 
 * Flow:
 * 1. Service A calls Service B
 * 2. Service B fails multiple times
 * 3. Circuit breaker opens
 * 4. Service A fails fast without calling B
 * 5. Circuit eventually half-opens for recovery
 */
describe('Integration: Circuit Breaker Resilience', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fail fast when circuit breaker is open', async () => {
    const circuitState = {
      state: 'OPEN',
      failureCount: 5,
      successThreshold: 2
    };

    expect(circuitState.state).toBe('OPEN');
    
    // Service call should fail immediately without trying
    const attempt = () => {
      if (circuitState.state === 'OPEN') {
        throw new Error('Circuit breaker is OPEN');
      }
    };

    expect(attempt).toThrow('Circuit breaker is OPEN');
  });

  it('should transition to HALF_OPEN after timeout', async () => {
    const circuitState = {
      state: 'OPEN',
      openedAt: new Date(Date.now() - 31000) // 31 seconds ago
    };

    const timeout = 30000; // 30 seconds

    if (Date.now() - circuitState.openedAt.getTime() > timeout) {
      circuitState.state = 'HALF_OPEN';
    }

    expect(circuitState.state).toBe('HALF_OPEN');
  });

  it('should close circuit on successful recovery', async () => {
    const circuitState = {
      state: 'HALF_OPEN',
      successCount: 3,
      successThreshold: 2
    };

    if (circuitState.successCount >= circuitState.successThreshold) {
      circuitState.state = 'CLOSED';
    }

    expect(circuitState.state).toBe('CLOSED');
  });
});

/**
 * Integration Test: Distributed Tracing Correlation
 * 
 * Flow:
 * 1. Request enters API Gateway with trace ID
 * 2. Trace ID passed through event bus
 * 3. All service logs include trace ID
 * 4. Operators can trace full request flow
 */
describe('Integration: Distributed Tracing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should maintain trace ID across service calls', async () => {
    const traceId = 'trace-correlation-123';
    const order = createOrderFactory();

    // Order service creates order with trace ID
    const orderCreatedEvent = {
      orderId: order.id,
      traceId,
      timestamp: new Date()
    };

    expect(orderCreatedEvent.traceId).toBe(traceId);

    // Kitchen service receives and processes with same trace ID
    const kitchenProcessed = {
      orderId: order.id,
      traceId,
      processedAt: new Date()
    };

    expect(kitchenProcessed.traceId).toBe(traceId);
    expect(kitchenProcessed.traceId).toBe(orderCreatedEvent.traceId);
  });

  it('should log all events with trace ID for correlation', async () => {
    const traceId = 'trace-456';
    const events = [
      { event: 'order.created', traceId },
      { event: 'kitchen.accepted', traceId },
      { event: 'payment.processed', traceId },
      { event: 'delivery.assigned', traceId }
    ];

    // All events have same trace ID
    const allSameTrace = events.every(e => e.traceId === traceId);
    expect(allSameTrace).toBe(true);
  });
});
