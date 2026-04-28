import { router } from './trpc';
import { conversationRouter } from './routers/conversation';
import { messageRouter } from './routers/message';
import { profileRouter } from './routers/profile';

export const appRouter = router({
    conversation:conversationRouter,
    message:messageRouter,
    profile:profileRouter
});

export type AppRouter = typeof appRouter;