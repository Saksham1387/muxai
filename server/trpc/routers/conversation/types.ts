import { MessageRole } from "@/lib/generated/prisma/enums";

export type Attachment = {
    id: string;
    fileName: string;
    mimeType: string;
    size: number;
    key: string;
    url: string;
    messageId: string;
};

export type Message = {
    id: string;
    model: string;
    content: string;
    role: MessageRole
    conversationId: string;
    reasoningText: string | null;
    hasReasoned: boolean;
    attachments: Attachment[];
};

export type Conversation = {
    id: string;
    title: string;
    userId: string;
    profileId: string;
    createdAt:Date;
    updatedAt:Date;
};

export type ConversationWithMessages = {
    id: string;
    title: string;
    userId: string;
    messages:Message[]
};