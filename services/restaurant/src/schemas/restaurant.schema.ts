import { z } from 'zod';

export const CreateRestaurantSchema = z.object({
  id: z.string(),
  name: z.string().min(1)
});

export type CreateRestaurant = z.infer<typeof CreateRestaurantSchema>;
