-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "hasReasoned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reasoningText" TEXT;
