import z from "zod"

export type Messages = {
    role: String,
    content:String
}[]

export const CreateChatScehma = z.object({
    model: z.string(),
    messages: z.array(z.object({
        role:z.string(),
        message:z.string()
    }))
})