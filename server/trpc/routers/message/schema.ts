import { z } from 'zod';

export const createMessageSchema = z.object({
  content: z.string(),
  role: z.enum(['user', 'assistant']),
  model: z.string().optional(),
  conversationId: z.string()
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;