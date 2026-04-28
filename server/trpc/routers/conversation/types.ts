import { MessageRole } from "@/lib/generated/prisma/enums";

export type Message = {
    id: string;
    model: string;
    content: string;
    role: MessageRole
    conversationId: string;
    reasoningText: string | null;
    hasReasoned: boolean;
};

export type Conversation = {
    id: string;
    title: string;
    userId: string;
    createdAt:Date

};

export type ConversationWithMessages = {
    id: string;
    title: string;
    userId: string;
    messages:Message[]
};