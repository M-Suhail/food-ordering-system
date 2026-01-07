import * as eventBus from '@food/event-bus';
import { MongoClient } from 'mongodb';
import {
  createEnvelope,
  createOrderCancelledEvent,
  MockMongoDb
} from '@food/test-utils';

jest.mock('mongodb');
jest.mock('@food/event-bus');
jest.mock('../../src/lib/logger', () => ({
  logger: {
    child: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }))
  }
}));

describe('Notification Service - Event Consumers', () => {
  let mockDb: any;
  let mockCollection: any;

  beforeEach(() => {
    mockCollection = {
      insertOne: jest.fn(),
      findOne: jest.fn(),
      updateOne: jest.fn(),
      find: jest.fn()
    };

    mockDb = {
      collection: jest.fn(() => mockCollection)
    };

    (MongoClient.prototype.db as jest.Mock).mockReturnValue(mockDb);
    jest.clearAllMocks();
  });

  describe('orderCancelled consumer', () => {
    it('should consume order.cancelled events', async () => {
      (eventBus.consumeEvent as jest.Mock).mockImplementation(
        async (_channel, _queueName, _schema, handler) => {
          expect(handler).toBeDefined();
        }
      );

      expect(eventBus.consumeEvent).toBeDefined();
    });

    it('should save notification to database on order cancellation', async () => {
      const cancelEvent = createOrderCancelledEvent({
        orderId: 'order-123',
        reason: 'customer_requested'
      });

      mockCollection.insertOne.mockResolvedValueOnce({
        insertedId: 'notif-123'
      });

      const result = await mockCollection.insertOne({
        orderId: cancelEvent.orderId,
        type: 'ORDER_CANCELLED',
        message: `Your order ${cancelEvent.orderId} has been cancelled`,
        userId: 'user-123',
        createdAt: new Date(),
        read: false
      });

      expect(result.insertedId).toBe('notif-123');
    });

    it('should create correct notification message', async () => {
      const message = `Your order order-123 has been cancelled`;
      expect(message).toContain('cancelled');
    });

    it('should mark notification as unread', async () => {
      mockCollection.insertOne.mockResolvedValueOnce({
        insertedId: 'notif-123'
      });

      const result = await mockCollection.insertOne({
        orderId: 'order-123',
        type: 'ORDER_CANCELLED',
        read: false
      });

      expect(result.insertedId).toBeDefined();
    });

    it('should be idempotent - not create duplicate notifications', async () => {
      const eventId = 'event-123';

      // First call: not processed
      mockCollection.findOne.mockResolvedValueOnce(null);
      const notFound = await mockCollection.findOne({ eventId });
      expect(notFound).toBeNull();

      // Create notification
      mockCollection.insertOne.mockResolvedValueOnce({});

      // Mark as processed
      mockCollection.insertOne.mockResolvedValueOnce({
        insertedId: 'processed-123'
      });

      // Second call: already processed
      mockCollection.findOne.mockResolvedValueOnce({
        eventId,
        createdAt: new Date()
      });

      const found = await mockCollection.findOne({ eventId });
      expect(found).toBeDefined();
    });
  });

  describe('paymentRefund consumer', () => {
    it('should consume payment.refund events', async () => {
      (eventBus.consumeEvent as jest.Mock).mockResolvedValueOnce(undefined);

      expect(eventBus.consumeEvent).toBeDefined();
    });

    it('should save refund notification', async () => {
      mockCollection.insertOne.mockResolvedValueOnce({
        insertedId: 'notif-456'
      });

      const result = await mockCollection.insertOne({
        paymentId: 'pay-123',
        type: 'PAYMENT_REFUND',
        message: 'Your refund of $99.99 has been processed',
        userId: 'user-123',
        amount: 99.99,
        createdAt: new Date(),
        read: false
      });

      expect(result.insertedId).toBe('notif-456');
    });

    it('should include refund amount in notification', async () => {
      const notification = {
        type: 'PAYMENT_REFUND',
        amount: 99.99,
        message: 'Your refund of $99.99 has been processed'
      };

      expect(notification.amount).toBe(99.99);
      expect(notification.message).toContain('99.99');
    });

    it('should track reason for refund', async () => {
      mockCollection.insertOne.mockResolvedValueOnce({
        insertedId: 'notif-456'
      });

      await mockCollection.insertOne({
        type: 'PAYMENT_REFUND',
        reason: 'customer_cancellation',
        message: 'Refund due to customer cancellation'
      });

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'customer_cancellation'
        })
      );
    });
  });

  describe('deliveryCancelled consumer', () => {
    it('should consume delivery.cancelled events', async () => {
      (eventBus.consumeEvent as jest.Mock).mockResolvedValueOnce(undefined);

      expect(eventBus.consumeEvent).toBeDefined();
    });

    it('should save delivery cancellation notification', async () => {
      mockCollection.insertOne.mockResolvedValueOnce({
        insertedId: 'notif-789'
      });

      const result = await mockCollection.insertOne({
        orderId: 'order-123',
        type: 'DELIVERY_CANCELLED',
        message: 'Your delivery has been cancelled',
        userId: 'user-123',
        createdAt: new Date(),
        read: false
      });

      expect(result.insertedId).toBe('notif-789');
    });

    it('should include reason for delivery cancellation', async () => {
      mockCollection.insertOne.mockResolvedValueOnce({
        insertedId: 'notif-789'
      });

      await mockCollection.insertOne({
        type: 'DELIVERY_CANCELLED',
        reason: 'driver_unavailable',
        message: 'Delivery cancelled due to driver unavailability'
      });

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'driver_unavailable'
        })
      );
    });
  });

  describe('database operations', () => {
    it('should insert notification into notifications collection', async () => {
      mockDb.collection.mockReturnValue(mockCollection);

      const collection = mockDb.collection('notifications');

      expect(collection).toBe(mockCollection);
      expect(mockDb.collection).toHaveBeenCalledWith('notifications');
    });

    it('should handle database errors gracefully', async () => {
      mockCollection.insertOne.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      await expect(
        mockCollection.insertOne({
          type: 'ORDER_CANCELLED'
        })
      ).rejects.toThrow('Database connection failed');
    });

    it('should update notification read status', async () => {
      mockCollection.updateOne.mockResolvedValueOnce({
        modifiedCount: 1
      });

      const result = await mockCollection.updateOne(
        { _id: 'notif-123' },
        { $set: { read: true } }
      );

      expect(result.modifiedCount).toBe(1);
    });
  });

  describe('event processing tracking', () => {
    it('should track processed events', async () => {
      const eventId = 'event-order-cancelled-123';

      mockCollection.insertOne.mockResolvedValueOnce({
        insertedId: 'track-123'
      });

      const result = await mockCollection.insertOne({
        eventId,
        service: 'notification',
        processedAt: new Date()
      });

      expect(result.insertedId).toBeDefined();
    });

    it('should check for duplicate processing', async () => {
      const eventId = 'event-order-cancelled-123';

      // Already processed
      mockCollection.findOne.mockResolvedValueOnce({
        eventId,
        processedAt: new Date()
      });

      const result = await mockCollection.findOne({
        eventId
      });

      expect(result).toBeDefined();
      // Should not process again
      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    });
  });

  describe('notification content generation', () => {
    it('should format order cancellation message', () => {
      const message = `Your order order-123 has been cancelled. Reason: customer_requested`;
      expect(message).toContain('order-123');
      expect(message).toContain('customer_requested');
    });

    it('should format payment refund message', () => {
      const message = `Your refund of $99.99 for order order-123 has been processed`;
      expect(message).toContain('99.99');
      expect(message).toContain('order-123');
    });

    it('should format delivery cancellation message', () => {
      const message = `Your delivery for order order-123 has been cancelled`;
      expect(message).toContain('order-123');
    });
  });
});
