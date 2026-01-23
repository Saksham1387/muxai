export type Message = {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    createdAt: Date;
};

export type Conversation = {
    id: string;
    title: string;
    userId:String
};