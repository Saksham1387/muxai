import { z } from 'zod';

export const getAttachmentsByProfileSchema = z.object({
  profileId: z.string(),
});

export const deleteAttachmentSchema = z.object({
  id: z.string(),
});

export const deleteMultipleAttachmentsSchema = z.object({
  ids: z.array(z.string()),
});

export const getSignedUrlSchema = z.object({
  key: z.string(),
});
