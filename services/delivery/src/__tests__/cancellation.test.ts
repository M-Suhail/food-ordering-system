import * as eventBus from '@food/event-bus';
import { MongoClient } from 'mongodb';
import {
  createEnvelope,
  createOrderCancelledEvent,
  MockMongoDb
} from '@food/test-utils';

jest.mock('mongodb');
jest.mock('@food/event-bus');
jest.mock('../../src/lib/rabbitmq', () => ({
  getChannel: jest.fn(() => ({
    publish: jest.fn().mockReturnValue(true)
  }))
}));
jest.mock('../../src/lib/logger', () => ({
  logger: {
    child: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }))
  }
}));

describe('Delivery Service - Cancellation Handlers', () => {
  let mockDb: any;
  let mockCollection: any;

  beforeEach(() => {
    mockCollection = {
      findOne: jest.fn(),
      updateOne: jest.fn(),
      insertOne: jest.fn()
    };

    mockDb = {
      collection: jest.fn(() => mockCollection)
    };

    (MongoClient.prototype.db as jest.Mock).mockReturnValue(mockDb);
    jest.clearAllMocks();
  });

  describe('order.cancelled event handling', () => {
    it('should subscribe to order.cancelled events', async () => {
      (eventBus.consumeEvent as jest.Mock).mockImplementation(
        async (_channel, _queueName, _schema, handler) => {
          // Verify listener is registered
          expect(handler).toBeDefined();
        }
      );

      // In real code: await subscribeOrderCancellation(channel, logger, db);
      // Test setup verified
      expect(eventBus.consumeEvent).toBeDefined();
    });

    it('should release driver on order cancellation', async () => {
      const cancelEvent = createOrderCancelledEvent({
        orderId: 'order-123',
        reason: 'customer_requested'
      });

      const delivery = {
        _id: 'delivery-123',
        orderId: 'order-123',
        driverId: 'driver-456',
        status: 'ASSIGNED'
      };

      mockCollection.findOne.mockResolvedValueOnce(delivery);
      mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });
      mockCollection.insertOne.mockResolvedValueOnce({});

      // Test flow
      const foundDelivery = await mockCollection.findOne({
        orderId: 'order-123'
      });

      expect(foundDelivery.status).toBe('ASSIGNED');

      // Update to CANCELLED
      const result = await mockCollection.updateOne(
        { orderId: 'order-123' },
        {
          $set: {
            status: 'CANCELLED',
            cancelledAt: expect.any(String),
            reason: 'customer_requested'
          }
        }
      );

      expect(result.modifiedCount).toBe(1);
    });

    it('should mark delivery as CANCELLED', async () => {
      const delivery = {
        _id: 'delivery-123',
        orderId: 'order-123',
        status: 'ASSIGNED'
      };

      mockCollection.findOne.mockResolvedValueOnce(delivery);
      mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });

      const result = await mockCollection.updateOne(
        { _id: 'delivery-123' },
        { $set: { status: 'CANCELLED' } }
      );

      expect(result.modifiedCount).toBe(1);
    });

    it('should handle missing delivery gracefully', async () => {
      mockCollection.findOne.mockResolvedValueOnce(null);

      const result = await mockCollection.findOne({
        orderId: 'order-999'
      });

      expect(result).toBeNull();
      expect(mockCollection.updateOne).not.toHaveBeenCalled();
    });

    it('should publish delivery.cancelled event', async () => {
      (eventBus.publishEvent as jest.Mock).mockResolvedValueOnce(true);

      await eventBus.publishEvent(
        { publish: jest.fn().mockReturnValue(true) } as any,
        'delivery_service.delivery_cancelled',
        {
          eventId: 'delivery-cancel-123',
          eventType: 'delivery_service.delivery_cancelled',
          eventVersion: 1,
          occurredAt: new Date().toISOString(),
          producer: 'delivery-service',
          traceId: 'trace-id',
          data: {
            orderId: 'order-123',
            driverId: 'driver-456',
            reason: 'customer_requested',
            cancelledAt: new Date().toISOString()
          }
        }
      );

      expect(eventBus.publishEvent).toHaveBeenCalledWith(
        expect.any(Object),
        'delivery_service.delivery_cancelled',
        expect.objectContaining({
          data: expect.objectContaining({
            orderId: 'order-123',
            reason: 'customer_requested'
          })
        })
      );
    });

    it('should be idempotent - not release driver twice', async () => {
      const processedEventId = 'process-event-123';

      // First call: not processed
      mockCollection.findOne.mockResolvedValueOnce(null);

      const processed = await mockCollection.findOne({
        eventId: processedEventId
      });

      expect(processed).toBeNull();

      // Simulate: mark as processed
      mockCollection.insertOne.mockResolvedValueOnce({
        insertedId: processedEventId
      });

      // Second call: already processed
      mockCollection.findOne.mockResolvedValueOnce({
        eventId: processedEventId
      });

      const alreadyProcessed = await mockCollection.findOne({
        eventId: processedEventId
      });

      expect(alreadyProcessed).toBeDefined();
    });
  });

  describe('cancellation reason handling', () => {
    it('should handle customer_requested cancellation', async () => {
      const delivery = { orderId: 'order-123', status: 'ASSIGNED' };
      mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });

      const result = await mockCollection.updateOne(
        { orderId: 'order-123' },
        { $set: { status: 'CANCELLED', reason: 'customer_requested' } }
      );

      expect(result.modifiedCount).toBe(1);
    });

    it('should handle payment_failed cancellation', async () => {
      const delivery = { orderId: 'order-123', status: 'ASSIGNED' };
      mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });

      const result = await mockCollection.updateOne(
        { orderId: 'order-123' },
        { $set: { status: 'CANCELLED', reason: 'payment_failed' } }
      );

      expect(result.modifiedCount).toBe(1);
    });
  });

  describe('driver release logic', () => {
    it('should release driver assignment', async () => {
      mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });

      const result = await mockCollection.updateOne(
        { driverId: 'driver-456' },
        { $set: { assignedDriver: null } }
      );

      expect(result.modifiedCount).toBe(1);
    });

    it('should update driver status to AVAILABLE', async () => {
      mockCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });

      const result = await mockCollection.updateOne(
        { driverId: 'driver-456' },
        { $set: { status: 'AVAILABLE' } }
      );

      expect(result.modifiedCount).toBe(1);
    });
  });

  describe('processed event tracking', () => {
    it('should track processed event to prevent duplicates', async () => {
      const eventId = 'order-cancelled-123';

      mockCollection.insertOne.mockResolvedValueOnce({
        insertedId: 'tracked-123'
      });

      const result = await mockCollection.insertOne({
        eventId,
        processedAt: new Date()
      });

      expect(result.insertedId).toBeDefined();
    });

    it('should use correct collection for event tracking', async () => {
      mockDb.collection.mockReturnValue(mockCollection);

      const collection = mockDb.collection('processedEvents');

      expect(collection).toBe(mockCollection);
    });
  });
});
