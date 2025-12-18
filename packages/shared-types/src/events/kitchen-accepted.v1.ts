import { z } from 'zod';

export const KitchenAcceptedV1Schema = z.object({
  orderId: z.string(),
  total: z.number().positive()
});

export type KitchenAcceptedV1 = z.infer<typeof KitchenAcceptedV1Schema>;

