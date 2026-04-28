import { z } from 'zod';

export const createProfileSchema = z.object({
  name: z.string()
});

export const getProfileSchema = z.object({
  id: z.string()
});

export const deleteProfileSchema = z.object({
  id: z.string()
});


export const updatePrefrencesSchema = z.object({
    id:z.string(),
    userName: z.string(),
    userOccupation:z.string(),
    preferredTraits: z.string(),
    userDescription: z.string()
});

export const updateProfileSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  preferences: z.record(z.any()).optional()
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type GetProfileInput = z.infer<typeof getProfileSchema>;
export type DeleteProfileInput = z.infer<typeof deleteProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type updatePrefrencesInput = z.infer<typeof updatePrefrencesSchema>;
