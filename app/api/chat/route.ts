import { NextApiResponse } from "next";
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, UIMessage, convertToModelMessages } from 'ai';

export async function POST(request: Request,res: NextApiResponse) {
  const { messages }: { messages: UIMessage[] } = await request.json();

  console.log('messages', messages)
  
  // Extract metadata from the last message
  const lastMessage = messages[messages.length - 1];
  const metadata = lastMessage?.metadata as { model?: string, conversationId?: string } || {};
  const { model, conversationId } = metadata;
  
  console.log('conversation id', conversationId)
  console.log('model', model)
  
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY
  });

  const result = streamText({
    model: openrouter(model || "openai/gpt-4o-mini"),
    messages: await convertToModelMessages(messages),
  });

  
  return result.toUIMessageStreamResponse();
}