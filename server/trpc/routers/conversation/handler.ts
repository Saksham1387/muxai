import { TRPCError } from '@trpc/server';
import type { Context } from '../../../context';
import type {
  Conversation,
  ConversationWithMessages
} from './types';

export async function getConversationByIdHandler(
  input: { id: string },
  ctx: Context
): Promise<ConversationWithMessages> {

    const conversation = await ctx.db.conversation.findFirst({
        where:{
            id:input.id
        },
        include:{
          messages:{
            include:{ attachments: true }
          }
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

export async function deleteConversationHandler(
  input: { id: string },
  ctx: Context
): Promise<void> {

  const conversation = await ctx.db.conversation.findFirst({
    where:{
      id:input.id
    }
  });

  if(!conversation) {
    throw new TRPCError({
      code:"NOT_FOUND",
      message:"Conversation not found"
    })
  }
  if(conversation?.userId != ctx.session.user.id) {
    throw new TRPCError({
      code:"BAD_REQUEST",
      message:"You are not the owner of the conversation"
    })
  }

  await ctx.db.conversation.delete({
    where:{
      id:conversation.id
    }
  })
}

export async function createConversationHandler(
  input: { title: string,profileId:string },
  ctx: Context
): Promise<Conversation> {

    const conversation = await ctx.db.conversation.create({
      data:{
        title:input.title,  
        userId:ctx.session.user.id,
        profileId: input.profileId
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

export async function getConversationsByProfileHandler(
  input: { profileId: string },
  ctx: Context
): Promise<Conversation[]> {
  const conversations = await ctx.db.conversation.findMany({
    where: {
      userId: ctx.session.user.id,
      profileId: input.profileId,
    },
    orderBy: { createdAt: 'desc' },
  });

  return conversations || [];
}

export async function deleteMultipleConversationsHandler(
  input: { ids: string[] },
  ctx: Context
): Promise<void> {
  await ctx.db.conversation.deleteMany({
    where: {
      id: { in: input.ids },
      userId: ctx.session.user.id,
    },
  });
}

export async function updateConversationTitleHandler(
  input: { id: string; title: string },
  ctx: Context
): Promise<Conversation> {
  const conversation = await ctx.db.conversation.findFirst({
    where: { id: input.id }
  });

  if (!conversation) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Conversation not found"
    });
  }

  if (conversation.userId !== ctx.session.user.id) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "You are not the owner of the conversation"
    });
  }

  const updatedConversation = await ctx.db.conversation.update({
    where: { id: input.id },
    data: { title: input.title }
  });

  return updatedConversation;
}
