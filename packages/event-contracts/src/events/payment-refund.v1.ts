import { z } from 'zod';

export const PaymentRefundV1Schema = z.object({
  paymentId: z.string(),
  orderId: z.string(),
  amount: z.number().positive(),
  reason: z.enum(['customer_cancellation', 'kitchen_rejected', 'delivery_failed', 'system_error']),
  initiatedAt: z.string().datetime()
});

export type PaymentRefundV1 = z.infer<typeof PaymentRefundV1Schema>;
