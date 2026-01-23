import { TRPCError } from '@trpc/server';
import type { Context } from '../../../context';
import type {
  Conversation
} from './types';

export async function getConversationById(
  input: { id: string },
  ctx: Context
): Promise<Conversation> {

    const conversation = await ctx.db.conversation.findFirst({
        where:{
            id:input.id
        }
    })
    
    if(!conversation) {
        throw new TRPCError({
            code:"NOT_FOUND",
            message:"Conversaion not found"
        })
    }

  return conversation;
}
