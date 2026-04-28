import { router, publicProcedure, protectedProcedure } from '../../trpc';
import { createConversation, deleteConversationSchema, deleteMultipleConversationsSchema, getByIdSchema, getByProfileSchema, updateConversationTitleSchema } from './schema';
import { createConversationHandler, deleteConversationHandler, deleteMultipleConversationsHandler, getAllConversationsHandler, getConversationByIdHandler, getConversationsByProfileHandler, updateConversationTitleHandler } from './handler';

export const conversationRouter = router({
  getById: publicProcedure
    .input(getByIdSchema)
    .query(({input,ctx}) => getConversationByIdHandler(input,ctx)),

  getAllConversations: protectedProcedure
    .query(({ctx}) => getAllConversationsHandler(ctx)),

  getByProfile: protectedProcedure
    .input(getByProfileSchema)
    .query(({input,ctx}) => getConversationsByProfileHandler(input,ctx)),
    
  deleteConversation: protectedProcedure
    .input(deleteConversationSchema)
    .mutation(({input,ctx}) => deleteConversationHandler(input,ctx)),

  deleteMultiple: protectedProcedure
    .input(deleteMultipleConversationsSchema)
    .mutation(({input,ctx}) => deleteMultipleConversationsHandler(input,ctx)),

  createConversation: protectedProcedure
    .input(createConversation)
    .mutation(({input,ctx}) => createConversationHandler(input,ctx)),

  updateTitle: protectedProcedure
    .input(updateConversationTitleSchema)
    .mutation(({input,ctx}) => updateConversationTitleHandler(input,ctx))
});