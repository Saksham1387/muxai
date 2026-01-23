import { prisma } from "@/lib/prisma";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  return {
    req: opts.req,
    db: prisma
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;