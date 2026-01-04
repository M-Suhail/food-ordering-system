import { z } from 'zod';

export const KitchenOrderCancelledV1Schema = z.object({
  orderId: z.string(),
  reason: z.enum(['customer_requested', 'payment_failed', 'system_error']),
  cancelledAt: z.string().datetime()
});

export type KitchenOrderCancelledV1 = z.infer<typeof KitchenOrderCancelledV1Schema>;
