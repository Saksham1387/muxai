import { z } from 'zod';

export const createMessageSchema = z.object({
  content: z.string(),
  role: z.enum(['user', 'assistant']),
  model: z.string().optional(),
  conversationId: z.string(),
  reasoningText: z.string().optional(),
  hasReasoned: z.boolean().optional(),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;