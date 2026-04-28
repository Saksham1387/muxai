import { MessageRole } from '@/lib/generated/prisma/enums';
import type { Context } from '../../../context';
import type { CreateMessageInput } from './schema';

export async function createMessageHandler(
  input: CreateMessageInput,
  ctx: Context
) {
  const message = await ctx.db.message.create({
    data: {
      content: input.content,
      role: input.role == 'user' ? MessageRole.User : MessageRole.Assistant,
      model: input.model || 'openai/gpt-4o-mini',
      conversationId: input.conversationId,
      reasoningText: input.reasoningText,
      hasReasoned: input.hasReasoned ?? false
    }
  });

  return message;
}

export async function getMessagesByConversationHandler(
  input: { conversationId: string },
  ctx: Context
) {
  const messages = await ctx.db.message.findMany({
    where: {
      conversationId: input.conversationId
    }
  });

  return messages;
}