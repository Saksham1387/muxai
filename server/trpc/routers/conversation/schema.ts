import z from "zod"

export const getByIdSchema = z.object({
    id: z.string().uuid('Invalid conversation ID format'),
});

export const createConversation = z.object({
    title: z.string()
})

export const deleteConversationSchema = z.object({
    id:z.string()
})

export const updateConversationTitleSchema = z.object({
    id: z.string(),
    title: z.string()
})