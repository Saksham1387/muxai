import { router, publicProcedure, protectedProcedure } from '../../trpc';
import { createConversation, deleteConversationSchema, getByIdSchema, updateConversationTitleSchema } from './schema';
import { createConversationHandler, deleteConversationHandler, getAllConversationsHandler, getConversationByIdHandler, updateConversationTitleHandler } from './handler';

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
    .mutation(({input,ctx}) => createConversationHandler(input,ctx)),

  updateTitle: protectedProcedure
    .input(updateConversationTitleSchema)
    .mutation(({input,ctx}) => updateConversationTitleHandler(input,ctx))
});