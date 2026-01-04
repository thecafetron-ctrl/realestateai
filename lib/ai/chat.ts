import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import { getOpenAIClient, isTestingMode } from "@/lib/ai/openai";

type ChatOptions = {
  responseFormat?: "json_object" | undefined;
  temperature?: number;
};

export async function runChatCompletion(
  messages: ChatCompletionMessageParam[],
  { responseFormat, temperature = 0.6 }: ChatOptions = {},
) {
  const client = getOpenAIClient();

  if (!client) {
    return null;
  }

  const completion = await client.chat.completions.create({
    model: "gpt-4-turbo",
    temperature,
    messages,
    response_format: responseFormat ? { type: responseFormat } : undefined,
  });

  return completion.choices[0]?.message?.content ?? null;
}

export { isTestingMode };


