import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { getServerSession } from "next-auth";

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const session = await getServerSession(authOptions);

  return {
    req: opts.req,
    db: prisma,
    session
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;