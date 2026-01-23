import { router, publicProcedure, protectedProcedure } from '../../trpc';
import { createConversation, getByIdSchema } from './schema';
import { createConversationHandler, getAllConversationsHandler, getConversationByIdHandler } from './handler';

export const conversationRouter = router({
  getById: publicProcedure
    .input(getByIdSchema)
    .query(({input,ctx}) => getConversationByIdHandler(input,ctx)),

  getAllConversations: protectedProcedure
    .query(({ctx}) => getAllConversationsHandler(ctx)),

  createConversation: protectedProcedure
    .input(createConversation)
    .mutation(({input,ctx}) => createConversationHandler(input,ctx))
});