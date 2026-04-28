import { z } from 'zod';

export const attachmentInputSchema = z.object({
  fileName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  key: z.string(),
  url: z.string(),
});

export const createMessageSchema = z.object({
  content: z.string(),
  role: z.enum(['user', 'assistant']),
  model: z.string().optional(),
  conversationId: z.string(),
  reasoningText: z.string().optional(),
  hasReasoned: z.boolean().optional(),
  attachments: z.array(attachmentInputSchema).optional(),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;