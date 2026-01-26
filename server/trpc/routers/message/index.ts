import { router, publicProcedure, protectedProcedure } from '../../trpc';
import { createMessageSchema } from './schema';
import { createMessageHandler, getMessagesByConversationHandler } from './handler';

export const messageRouter = router({
  createMessage: protectedProcedure
    .input(createMessageSchema)
    .mutation(({input, ctx}) => createMessageHandler(input, ctx)),

  getMessagesByConversation: publicProcedure
    .input(createMessageSchema.pick({ conversationId: true }))
    .query(({input, ctx}) => getMessagesByConversationHandler(input, ctx))
});