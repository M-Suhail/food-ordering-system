import { z } from 'zod';

export const DeliveryAssignedV1Schema = z.object({
  orderId: z.string(),
  driverId: z.string()
});

export type DeliveryAssignedV1 = z.infer<typeof DeliveryAssignedV1Schema>;
