import { router, publicProcedure, protectedProcedure } from '../../trpc';
import { createConversation, deleteConversationSchema, getByIdSchema } from './schema';
import { createConversationHandler, deleteConversationHandler, getAllConversationsHandler, getConversationByIdHandler } from './handler';

export const conversationRouter = router({
  getById: publicProcedure
    .input(getByIdSchema)
    .query(({input,ctx}) => getConversationByIdHandler(input,ctx)),

  getAllConversations: protectedProcedure
    .query(({ctx}) => getAllConversationsHandler(ctx)),
    
  deleteConversation: protectedProcedure
    .input(deleteConversationSchema)
    .mutation(({input,ctx}) => deleteConversationHandler(input,ctx)),

  createConversation: protectedProcedure
    .input(createConversation)
    .mutation(({input,ctx}) => createConversationHandler(input,ctx))
});