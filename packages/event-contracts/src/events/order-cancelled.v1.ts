import { z } from 'zod';

export const OrderCancelledV1Schema = z.object({
  orderId: z.string(),
  reason: z.enum(['customer_requested', 'payment_failed', 'kitchen_rejected', 'delivery_unavailable']),
  cancelledAt: z.string().datetime(),
  refundAmount: z.number().positive().optional()
});

export type OrderCancelledV1 = z.infer<typeof OrderCancelledV1Schema>;
