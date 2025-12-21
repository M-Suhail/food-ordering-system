import { z } from 'zod';

export const KitchenRejectedV1Schema = z.object({
  orderId: z.string(),
  reason: z.string()
});

export type KitchenRejectedV1 = z.infer<typeof KitchenRejectedV1Schema>;
