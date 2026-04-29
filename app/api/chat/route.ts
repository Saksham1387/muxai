import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

export const maxDuration = 60;

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

async function resolveR2FileToDataUrl(url: string, mediaType: string): Promise<string> {
  const keyMatch = url.match(/attachments\/.+$/);
  if (!keyMatch) throw new Error(`Cannot extract key from URL: ${url}`);

  const key = keyMatch[0];
  const response = await S3.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  const bytes = await response.Body!.transformToByteArray();
  const base64 = Buffer.from(bytes).toString('base64');
  return `data:${mediaType};base64,${base64}`;
}

/**
 * Walk through UIMessages and replace R2 file URLs with base64 data URLs
 * so the AI SDK doesn't need to download them (R2 S3 endpoint isn't public).
 */
async function resolveFilePartsInMessages(messages: UIMessage[]): Promise<UIMessage[]> {
  return Promise.all(
    messages.map(async (msg) => {
      const resolvedParts = await Promise.all(
        msg.parts.map(async (part) => {
          if (part.type === 'file' && part.url && !part.url.startsWith('data:')) {
            try {
              const dataUrl = await resolveR2FileToDataUrl(part.url, part.mediaType || 'application/octet-stream');
              return { ...part, url: dataUrl };
            } catch (e) {
              console.error('Failed to resolve file part:', e);
              return part;
            }
          }
          return part;
        })
      );
      return { ...msg, parts: resolvedParts } as UIMessage;
    })
  );
}

export async function POST(request: Request) {
  const { messages, model, conversationId, profileId }: {
    messages: UIMessage[];
    model?: string;
    conversationId: string;
    profileId: string
  } = await request.json(); 
  
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userProfile = await prisma.profile.findFirst({
    where: {
      id: profileId,
      userId: session.user.id
    }
  });

  const prefs = userProfile?.prefrences as any;
  const USER_SYSTEM_PROMPT = `REMEMBER these facts about the user while answering any questions:
      FACTS:
      User's Name: ${prefs?.userName || 'Not provided'}
      User's Occupation: ${prefs?.userOccupation || 'Not provided'}
      Desired AI Traits: ${prefs?.preferredTraits || 'Not provided'}
      Additional Info: ${prefs?.userDescription || 'Not provided'}
  `;

  const resolvedMessages = await resolveFilePartsInMessages(messages);
  const modelMessages = await convertToModelMessages(resolvedMessages);

  // if (model?.startsWith('google/')) {
  //   const google = createGoogleGenerativeAI({
  //     apiKey: process.env.GOOGLE_API_KEY,
  //   });

  //   const geminiModel = model === 'auto'
  //     ? 'gemini-2.5-flash'
  //     : model.replace('google/', '');

  //   const result = streamText({
  //     model: google(geminiModel),
  //     system: USER_SYSTEM_PROMPT,
  //     messages: modelMessages,
  //   });

  //   return result.toUIMessageStreamResponse();
  // }

  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
    headers: {
      'X-OpenRouter-Cache': 'true',
    },
  });

  const result = streamText({
    model: openrouter(model || 'openai/gpt-oss-20b:free:thinking'),
    system: USER_SYSTEM_PROMPT,
    messages: modelMessages,
    providerOptions: {
      openrouter: {
        reasoning: {
          effort: 'low',
        },
      },
    },
  }); 


  return result.toUIMessageStreamResponse();
}
