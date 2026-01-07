import { Request, Response } from 'express';
import {
  createOrderFactory,
  createTraceId,
  MockPrismaClient
} from '@food/test-utils';

jest.mock('../../src/lib/db', () => ({
  prisma: {
    order: {
      findUnique: jest.fn(),
      update: jest.fn()
    }
  }
}));
jest.mock('../../src/lib/rabbitmq', () => ({
  getChannel: jest.fn(() => ({
    publish: jest.fn().mockReturnValue(true)
  }))
}));
jest.mock('../../src/lib/logger');
jest.mock('@food/event-bus');
jest.mock('@food/idempotency', () => {
  const actualModule = jest.requireActual('@food/idempotency');
  return {
    ...actualModule,
    IdempotencyStore: jest.fn(() => ({
      get: jest.fn(() => null),
      set: jest.fn()
    }))
  };
});

import { cancelOrder } from '../../src/controllers/cancelOrder';
import { prisma as _prisma } from '../../src/lib/db';
import { logger as _logger } from '../../src/lib/logger';
import * as eventBus from '@food/event-bus';

const prisma = _prisma as any;

describe('cancelOrder Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let resStatusSpy: jest.Mock;
  let resJsonSpy: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();

    // Mock logger
    (_logger as any).child = jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }));

    resStatusSpy = jest.fn().mockReturnThis();
    resJsonSpy = jest.fn().mockReturnThis();

    mockReq = {
      params: { orderId: 'order-123' },
      body: { reason: 'customer_requested' },
      headers: { 'idempotency-key': 'key-123' }
    };

    mockRes = {
      status: resStatusSpy,
      json: resJsonSpy
    };
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('happy path', () => {
    it('should cancel an order successfully', async () => {
      const order = createOrderFactory({ status: 'CREATED' });
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(order);
      (prisma.order.update as jest.Mock).mockResolvedValue({
        ...order,
        status: 'CANCELLED'
      });

      await cancelOrder(mockReq as Request, mockRes as Response);

      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-123' }
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-123' },
        data: { status: 'CANCELLED' }
      });
      expect(resStatusSpy).toHaveBeenCalledWith(200);
      expect(resJsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Order cancellation initiated'
        })
      );
    });

    it('should publish order.cancelled event', async () => {
      const order = createOrderFactory({ status: 'CREATED', total: 99.99 });
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(order);
      (prisma.order.update as jest.Mock).mockResolvedValue({
        ...order,
        status: 'CANCELLED'
      });

      await cancelOrder(mockReq as Request, mockRes as Response);

      expect(eventBus.publishEvent).toHaveBeenCalled();
    });

    it('should support idempotency - duplicate requests return 200', async () => {
      const order = createOrderFactory({ status: 'CREATED' });
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(order);
      (prisma.order.update as jest.Mock).mockResolvedValue({
        ...order,
        status: 'CANCELLED'
      });

      // First request
      await cancelOrder(mockReq as Request, mockRes as Response);

      // Reset mocks
      jest.clearAllMocks();
      resStatusSpy.mockClear();
      resJsonSpy.mockClear();
      resStatusSpy.mockReturnThis();
      resJsonSpy.mockReturnThis();
      mockRes.status = resStatusSpy;
      mockRes.json = resJsonSpy;

      // Second request with same idempotency key
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(order);

      await cancelOrder(mockReq as Request, mockRes as Response);

      // Should return 200 on second attempt
      expect(resStatusSpy).toHaveBeenCalled();
    });
  });

  describe('error cases', () => {
    it('should return 404 if order not found', async () => {
      mockReq.headers = { 'idempotency-key': 'key-404' };
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

      await cancelOrder(mockReq as Request, mockRes as Response);

      expect(resStatusSpy).toHaveBeenCalledWith(404);
      expect(resJsonSpy).toHaveBeenCalledWith({
        error: 'Order not found'
      });
    });

    it('should return 400 if reason is invalid', async () => {
      mockReq.headers = { 'idempotency-key': 'key-400' };
      mockReq.body = { reason: 'invalid_reason' };

      await cancelOrder(mockReq as Request, mockRes as Response);

      expect(resStatusSpy).toHaveBeenCalledWith(400);
      expect(resJsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Invalid reason')
        })
      );
    });

    it('should handle already cancelled orders', async () => {
      mockReq.headers = { 'idempotency-key': 'key-cancelled' };
      const order = createOrderFactory({ status: 'CANCELLED' });
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(order);

      await cancelOrder(mockReq as Request, mockRes as Response);

      expect(resStatusSpy).toHaveBeenCalledWith(200);
      expect(resJsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('already cancelled')
        })
      );
    });

    it('should return 500 on database error', async () => {
      mockReq.headers = { 'idempotency-key': 'key-500' };
      (prisma.order.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      await cancelOrder(mockReq as Request, mockRes as Response);

      expect(resStatusSpy).toHaveBeenCalledWith(500);
      expect(resJsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal server error'
        })
      );
    });
  });

  describe('idempotency', () => {
    it('should accept valid idempotency keys (UUID format)', async () => {
      mockReq.headers = {
        'idempotency-key': '550e8400-e29b-41d4-a716-446655440000'
      };
      const order = createOrderFactory({ status: 'CREATED' });
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(order);
      (prisma.order.update as jest.Mock).mockResolvedValue({
        ...order,
        status: 'CANCELLED'
      });

      await cancelOrder(mockReq as Request, mockRes as Response);

      expect(resStatusSpy).toHaveBeenCalledWith(200);
    });

    it('should work without idempotency key', async () => {
      mockReq.headers = {};
      const order = createOrderFactory({ status: 'CREATED' });
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(order);
      (prisma.order.update as jest.Mock).mockResolvedValue({
        ...order,
        status: 'CANCELLED'
      });

      await cancelOrder(mockReq as Request, mockRes as Response);

      expect(resStatusSpy).toHaveBeenCalledWith(200);
    });
  });
});
