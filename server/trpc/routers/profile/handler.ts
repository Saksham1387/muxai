import { TRPCError } from '@trpc/server';
import type { Context } from '../../../context';
import type { CreateProfileInput, DeleteProfileInput, GetProfileInput, updatePrefrencesInput } from './schema';
import { Prisma } from '@/lib/generated/prisma/client';

export async function createProfileHandler(
  input: CreateProfileInput,
  ctx: Context
) {
  const profile = await ctx.db.profile.create({
    data: {
      name: input.name,
      userId: ctx.session.user.id
    }
  });

  return profile;
}

export async function updatePrefrencesHandler(
    input: updatePrefrencesInput,
    ctx: Context
  ) {
    var prefrencesJson = { userName: input.userName, preferredTraits: input.preferredTraits, userOccupation: input.userOccupation, userDescription: input.userDescription } as Prisma.JsonObject;
    const profile = await ctx.db.profile.update({
      where:{
        id:input.id
      }, 
      data:{    
        prefrences:prefrencesJson
      }
    });
  
    return profile;
  }

export async function listProfilesHandler(
  ctx: Context
) {
  const profiles = await ctx.db.profile.findMany({
    where: {
      userId: ctx.session.user.id
    }
  });

  return profiles;
}

export async function getProfileHandler(
  input: GetProfileInput,
  ctx: Context
) {
  const profile = await ctx.db.profile.findFirst({
    where: {
      id: input.id,
      userId: ctx.session.user.id
    }
  });

  if (!profile) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Profile not found'
    });
  }

  return profile;
}

export async function deleteProfileHandler(
  input: DeleteProfileInput,
  ctx: Context
) {
  const profile = await ctx.db.profile.findFirst({
    where: {
      id: input.id,
      userId: ctx.session.user.id
    }
  });

  if (!profile) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Profile not found or you do not have permission'
    });
  }

  await ctx.db.profile.delete({
    where: {
      id: input.id
    }
  });

  return { success: true };
}
