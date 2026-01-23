import { TRPCError } from '@trpc/server';
import type { Context } from '../../../context';
import type {
  Conversation
} from './types';

export async function getConversationByIdHandler(
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

export async function getAllConversationsHandler(
  ctx: Context
): Promise<Conversation[]> {
    const conversations = await ctx.db.conversation.findMany({
      where:{
        userId:ctx.session.user.id
      }
    })

    if(!conversations) {
        return []
    }

  return conversations;
}

export async function createConversationHandler(
  input: { title: string },
  ctx: Context
): Promise<Conversation> {

    const conversation = await ctx.db.conversation.create({
      data:{
        title:input.title,
        userId:ctx.session.user.id
      }
    })
    
    if(!conversation) {
        throw new TRPCError({
            code:"TIMEOUT",
            message:"Failed to create conversation"
        })
    }

  return conversation;
}
