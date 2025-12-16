import { z } from 'zod';

export const CreateMenuItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  price: z.number().positive()
});
