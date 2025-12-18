import { z } from 'zod';

export const PaymentSucceededV1Schema = z.object({
  orderId: z.string(),
  amount: z.number().positive()
});

export type PaymentSucceededV1 = z.infer<typeof PaymentSucceededV1Schema>;
