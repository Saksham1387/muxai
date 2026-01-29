import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, UIMessage, convertToModelMessages } from 'ai';

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();

  const lastMessage = messages[messages.length - 1];
  const metadata = lastMessage?.metadata as { model?: string, conversationId?: string } || {};
  const { model, conversationId } = metadata;
  
  // Handle Google models separately with direct Gemini SDK
  if (model?.startsWith('google/')) {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY
    });
    
    // Extract the model name without the provider prefix
    const geminiModel = model.replace('google/', '');
    
    const result = streamText({
      model: google(geminiModel),
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  }

  // Handle auto model - defaults to Gemini 2.0 Flash for best balance
  if (model === 'auto') {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY
    });
    
    const result = streamText({
      model: google('gemini-2.5-flash'),
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  }
  
  // Use OpenRouter for all other models
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY
  });

  const result = streamText({
    model: openrouter(model || "openai/gpt-4o-mini"),
    messages: await convertToModelMessages(messages),
  });

  
  return result.toUIMessageStreamResponse();
}
