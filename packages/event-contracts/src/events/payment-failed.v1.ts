import { z } from 'zod';

export const PaymentFailedV1Schema = z.object({
  orderId: z.string(),
  reason: z.string()
});

export type PaymentFailedV1 = z.infer<typeof PaymentFailedV1Schema>;
