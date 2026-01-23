import z from "zod"

export const getByIdSchema = z.object({
    id: z.string().uuid('Invalid conversation ID format'),
});

