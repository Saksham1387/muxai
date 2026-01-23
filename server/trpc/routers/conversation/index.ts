import { router, publicProcedure } from '../../trpc';
import { getByIdSchema } from './schema';
import { getConversationById } from './handler';

export const conversationRouter = router({
  getById: publicProcedure
    .input(getByIdSchema)
    .query(({input,ctx}) => getConversationById(input,ctx))
});