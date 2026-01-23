import { NextApiResponse } from "next";
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, UIMessage, convertToModelMessages } from 'ai';

export async function POST(request: Request,res: NextApiResponse) {
  const { messages , model }: { messages: UIMessage[], model:string } = await request.json();

  console.log(model)
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY
  });

  const result = streamText({
    model: openrouter("openai/gpt-4o-mini"),
    messages: await convertToModelMessages(messages),
  });

  
  return result.toUIMessageStreamResponse();
}
