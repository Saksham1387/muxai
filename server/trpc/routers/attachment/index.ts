import { router, protectedProcedure } from '../../trpc';
import {
  getAttachmentsByProfileSchema,
  deleteAttachmentSchema,
  deleteMultipleAttachmentsSchema,
  getSignedUrlSchema,
} from './schema';
import {
  getAttachmentsByProfileHandler,
  deleteAttachmentHandler,
  deleteMultipleAttachmentsHandler,
  getSignedUrlHandler,
} from './handler';

export const attachmentRouter = router({
  getByProfile: protectedProcedure
    .input(getAttachmentsByProfileSchema)
    .query(({ input, ctx }) => getAttachmentsByProfileHandler(input, ctx)),

  delete: protectedProcedure
    .input(deleteAttachmentSchema)
    .mutation(({ input, ctx }) => deleteAttachmentHandler(input, ctx)),

  deleteMultiple: protectedProcedure
    .input(deleteMultipleAttachmentsSchema)
    .mutation(({ input, ctx }) => deleteMultipleAttachmentsHandler(input, ctx)),

  getSignedUrl: protectedProcedure
    .input(getSignedUrlSchema)
    .query(({ input, ctx }) => getSignedUrlHandler(input, ctx)),
});
