import { z } from 'zod';

export const CreateMenuSchema = z.object({
  id: z.string(),
  name: z.string().min(1)
});
