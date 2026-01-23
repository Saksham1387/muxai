import { initTRPC, TRPCError } from '@trpc/server';
import { type Context } from '../context';
import superjson from 'superjson';

const t = initTRPC.context<Context>().create({
  transformer: superjson, // Allows sending Dates, Maps, Sets, etc.
});

const isAuthed = t.middleware(({ctx,next}) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource'
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user }, 
    },
  });
})


export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);