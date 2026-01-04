import { z } from 'zod';

export const DeliveryCancelledV1Schema = z.object({
  orderId: z.string(),
  driverId: z.string(),
  reason: z.enum(['customer_requested', 'payment_failed', 'kitchen_rejected', 'system_error']),
  cancelledAt: z.string().datetime()
});

export type DeliveryCancelledV1 = z.infer<typeof DeliveryCancelledV1Schema>;
