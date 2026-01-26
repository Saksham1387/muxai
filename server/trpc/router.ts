import { router } from './trpc';
import { conversationRouter } from './routers/conversation';
import { messageRouter } from './routers/message';

export const appRouter = router({
    conversation:conversationRouter,
    message:messageRouter
});

export type AppRouter = typeof appRouter;