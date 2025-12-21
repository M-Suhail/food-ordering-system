import { z } from 'zod';

export const OrderCreatedV1Schema = z.object({
  orderId: z.string(),
  restaurantId: z.string(),
  items: z.array(
    z.object({
      menuItemId: z.string(),
      qty: z.number().int().positive()
    })
  ),
  total: z.number().positive()
});

export type OrderCreatedV1 = z.infer<typeof OrderCreatedV1Schema>;
