/**
 * Wraps the actual LLM provider call. Keeping this isolated means swapping
 * providers later (or adding a fallback provider) only touches this file.
 */

export interface LlmRequest {
  systemPrompt: string;
  userMessage: string;
  context: string;
}

export interface LlmResponse {
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function callLlm(request: LlmRequest): Promise<LlmResponse> {
  if (!process.env.LLM_API_KEY) {
    throw new Error('LLM_API_KEY is not set');
  }

  const model = process.env.LLM_MODEL ?? 'openrouter/free';
  // NOTE: using a free-tier OpenRouter model for now. Free models have
  // shared rate limits and variable quality — check openrouter.ai/models
  // for the current free-tier list, and plan to move to a paid model
  // before this goes to production. Swap by changing LLM_MODEL, no code change needed.

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LLM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: `${request.context}\n\n${request.userMessage}` },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('LLM_RATE_LIMITED');
    }
    throw new Error(`LLM request failed: ${response.status}`);
  }

  const data = (await response.json()) as OpenRouterResponse;
  return { content: data.choices[0].message.content };
}