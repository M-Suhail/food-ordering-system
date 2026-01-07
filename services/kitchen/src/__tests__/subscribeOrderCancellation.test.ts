import { subscribeOrderCancellation } from '../../src/events/subscribeOrderCancellation';
import { Db, Collection } from 'mongodb';
import { Channel } from 'amqplib';
import { MockMongoDb, MockAmqpChannel, createOrderCancelledEvent, createEnvelope } from '@food/test-utils';
import * as eventBus from '@food/event-bus';

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

describe('subscribeOrderCancellation (Kitchen Service)', () => {
  let mockDb: Db;
  let mockChannel: Channel;
  let mockCollection: Collection;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCollection = {
      insertOne: jest.fn().mockResolvedValue({}),
      findOne: jest.fn(),
      updateOne: jest.fn().mockResolvedValue({}),
      deleteOne: jest.fn().mockResolvedValue({})
    } as any;

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    } as any;

    mockChannel = {
      consume: jest.fn()
    } as any;
  });

  describe('event handling', () => {
    it('should consume order.cancelled events', async () => {
      (eventBus.consumeEvent as jest.Mock).mockImplementation(
        async (channel, queueName, schema, handler) => {
          // Call the handler with mock data
          const mockData = createOrderCancelledEvent({
            orderId: 'order-123',
            reason: 'customer_requested'
          });
          const envelope = createEnvelope(mockData);
          await handler(mockData, envelope);
        }
      );

      await subscribeOrderCancellation(mockDb, mockChannel);

      expect(eventBus.consumeEvent).toHaveBeenCalled();
    });

    it('should mark kitchen order as CANCELLED', async () => {
      const cancelEvent = createOrderCancelledEvent({
        orderId: 'order-123',
        reason: 'customer_requested'
      });
      const envelope = createEnvelope(cancelEvent);

      // Mock the consumeEvent to call the handler immediately
      (eventBus.consumeEvent as jest.Mock).mockImplementation(
        async (_channel, _queueName, _schema, handler) => {
          await handler(cancelEvent, envelope);
        }
      );

      mockCollection.findOne = jest.fn().mockResolvedValueOnce(null); // No processed event
      mockCollection.findOne = jest.fn()
        .mockResolvedValueOnce(null) // No processed event
        .mockResolvedValueOnce({ orderId: 'order-123', status: 'ACCEPTED' }); // Kitchen order exists

      await subscribeOrderCancellation(mockDb, mockChannel);

      // Verify updateOne was called with CANCELLED status
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { orderId: 'order-123' },
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'CANCELLED'
          })
        })
      );
    });

    it('should publish kitchen.order.cancelled event', async () => {
      const cancelEvent = createOrderCancelledEvent({
        orderId: 'order-123'
      });
      const envelope = createEnvelope(cancelEvent);

      (eventBus.consumeEvent as jest.Mock).mockImplementation(
        async (_channel, _queueName, _schema, handler) => {
          await handler(cancelEvent, envelope);
        }
      );

      mockCollection.findOne = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ orderId: 'order-123', status: 'ACCEPTED' });

      await subscribeOrderCancellation(mockDb, mockChannel);

      expect(eventBus.publishEvent).toHaveBeenCalledWith(
        mockChannel,
        'kitchen_service.kitchen_order_cancelled',
        expect.objectContaining({
          data: expect.objectContaining({
            orderId: 'order-123'
          })
        })
      );
    });

    it('should be idempotent - not process duplicate events', async () => {
      const cancelEvent = createOrderCancelledEvent({ orderId: 'order-123' });
      const envelope = createEnvelope(cancelEvent);

      (eventBus.consumeEvent as jest.Mock).mockImplementation(
        async (_channel, _queueName, _schema, handler) => {
          await handler(cancelEvent, envelope);
        }
      );

      // Mock: processed event already exists
      mockCollection.findOne = jest.fn().mockResolvedValueOnce({
        eventId: `cancelled-order-123`,
        createdAt: new Date()
      });

      await subscribeOrderCancellation(mockDb, mockChannel);

      // updateOne should NOT be called
      expect(mockCollection.updateOne).not.toHaveBeenCalled();
    });

    it('should handle missing kitchen order gracefully', async () => {
      const cancelEvent = createOrderCancelledEvent({ orderId: 'order-999' });
      const envelope = createEnvelope(cancelEvent);

      (eventBus.consumeEvent as jest.Mock).mockImplementation(
        async (_channel, _queueName, _schema, handler) => {
          await handler(cancelEvent, envelope);
        }
      );

      // No processed event
      mockCollection.findOne = jest.fn().mockResolvedValueOnce(null);
      // No kitchen order found
      mockCollection.findOne = jest.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await subscribeOrderCancellation(mockDb, mockChannel);

      // Should still mark as processed
      expect(mockCollection.insertOne).toHaveBeenCalled();
    });

    it('should track processed events with correct eventId', async () => {
      const cancelEvent = createOrderCancelledEvent({ orderId: 'order-123' });
      const envelope = createEnvelope(cancelEvent);

      (eventBus.consumeEvent as jest.Mock).mockImplementation(
        async (_channel, _queueName, _schema, handler) => {
          await handler(cancelEvent, envelope);
        }
      );

      mockCollection.findOne = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ orderId: 'order-123', status: 'ACCEPTED' });

      await subscribeOrderCancellation(mockDb, mockChannel);

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 'cancelled-order-123'
        })
      );
    });
  });

  describe('cancellation reasons', () => {
    it('should handle customer_requested cancellations', async () => {
      const cancelEvent = createOrderCancelledEvent({
        orderId: 'order-123',
        reason: 'customer_requested'
      });
      const envelope = createEnvelope(cancelEvent);

      (eventBus.consumeEvent as jest.Mock).mockImplementation(
        async (_channel, _queueName, _schema, handler) => {
          await handler(cancelEvent, envelope);
        }
      );

      mockCollection.findOne = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ orderId: 'order-123', status: 'ACCEPTED' });

      await subscribeOrderCancellation(mockDb, mockChannel);

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { orderId: 'order-123' },
        expect.objectContaining({
          $set: expect.objectContaining({
            reason: 'customer_requested'
          })
        })
      );
    });

    it('should handle payment_failed cancellations', async () => {
      const cancelEvent = createOrderCancelledEvent({
        orderId: 'order-124',
        reason: 'payment_failed'
      });
      const envelope = createEnvelope(cancelEvent);

      (eventBus.consumeEvent as jest.Mock).mockImplementation(
        async (_channel, _queueName, _schema, handler) => {
          await handler(cancelEvent, envelope);
        }
      );

      mockCollection.findOne = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ orderId: 'order-124', status: 'ACCEPTED' });

      await subscribeOrderCancellation(mockDb, mockChannel);

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { orderId: 'order-124' },
        expect.objectContaining({
          $set: expect.objectContaining({
            reason: 'payment_failed'
          })
        })
      );
    });
  });
});
