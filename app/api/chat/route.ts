import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, UIMessage, convertToModelMessages } from 'ai';

export const maxDuration = 60;

export async function POST(request: Request) {
  const { messages, model, conversationId }: {
    messages: UIMessage[];
    model?: string;
    conversationId?: string;
  } = await request.json(); 
  
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
