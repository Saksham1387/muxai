import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60;

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

  const modelMessages = await convertToModelMessages(messages);

  if (model?.startsWith('google/')) {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const geminiModel = model === 'auto'
      ? 'gemini-2.5-flash'
      : model.replace('google/', '');

    const result = streamText({
      model: google(geminiModel),
      system: USER_SYSTEM_PROMPT,
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
  }

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

  // You can wait for reasoning in the background without blocking the response
  result.reasoningText.then((text) => {
    if (text) console.log('Generated Reasoning:', text);
  });

  return result.toUIMessageStreamResponse();
}
