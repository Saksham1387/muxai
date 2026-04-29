import { TRPCError } from '@trpc/server';
import { S3Client, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Context } from '../../../context';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = process.env.R2_BUCKET!;

const S3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function getAttachmentsByProfileHandler(
  input: { profileId: string },
  ctx: Context
) {
  const attachments = await ctx.db.attachment.findMany({
    where: {
      message: {
        conversation: {
          profileId: input.profileId,
          userId: ctx.session!.user.id,
        },
      },
    },
    include: {
      message: {
        select: {
          conversation: {
            select: { title: true, id: true },
          },
        },
      },
    },
    orderBy: { id: 'desc' },
  });

  return attachments;
}

export async function deleteAttachmentHandler(
  input: { id: string },
  ctx: Context
) {
  const attachment = await ctx.db.attachment.findFirst({
    where: {
      id: input.id,
      message: {
        conversation: {
          userId: ctx.session!.user.id,
        },
      },
    },
  });

  if (!attachment) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Attachment not found',
    });
  }

  try {
    await S3.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: attachment.key }));
  } catch (e) {
    console.error('Failed to delete from R2:', e);
  }

  await ctx.db.attachment.delete({ where: { id: input.id } });
}

export async function deleteMultipleAttachmentsHandler(
  input: { ids: string[] },
  ctx: Context
) {
  const attachments = await ctx.db.attachment.findMany({
    where: {
      id: { in: input.ids },
      message: {
        conversation: {
          userId: ctx.session!.user.id,
        },
      },
    },
  });

  for (const attachment of attachments) {
    try {
      await S3.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: attachment.key }));
    } catch (e) {
      console.error('Failed to delete from R2:', e);
    }
  }

  await ctx.db.attachment.deleteMany({
    where: {
      id: { in: attachments.map((a) => a.id) },
    },
  });
}

export async function getSignedUrlHandler(
  input: { key: string },
  ctx: Context
) {
  const attachment = await ctx.db.attachment.findFirst({
    where: {
      key: input.key,
      message: {
        conversation: {
          userId: ctx.session!.user.id,
        },
      },
    },
  });

  if (!attachment) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Attachment not found or you do not have access to it.',
    });
  }

  const signedUrl = await getSignedUrl(
    S3,
    new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: input.key,
    }),
    { expiresIn: 3600 } // URL valid for 1 hour
  );

  console.log(signedUrl)
  return { url: signedUrl };
}
