// "Ask AI" dispatcher. Anthropic goes through its SDK (claude.js); every other provider is
// reached through the OpenAI-compatible chat completions endpoint it exposes.
import { PROVIDERS, detectProvider } from './providers.js';
import { TriageSchema, SYSTEM_PROMPT, JSON_INSTRUCTIONS, buildUserMessage, toReport } from './triage-schema.js';

export async function analyzeWithLLM({ config, redactedText, localReport }) {
  const provider = detectProvider(config);
  if (!provider) throw new Error('Unrecognized API key. Add a base URL under Advanced for other providers.');
  if (!config.model) throw new Error('Enter a model name in LLM settings.');

  if (provider === 'anthropic') {
    const { analyzeWithClaude } = await import('./claude.js');
    return analyzeWithClaude({ apiKey: config.apiKey, model: config.model, redactedText, localReport });
  }
  return analyzeOpenAICompatible({ provider, config, redactedText, localReport });
}

async function analyzeOpenAICompatible({ provider, config, redactedText, localReport }) {
  const base = (config.baseUrl || PROVIDERS[provider].baseUrl).replace(/\/+$/, '');
  const headers = { 'Content-Type': 'application/json' };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
  if (provider === 'openrouter') headers['X-Title'] = 'ErrorSpeak';

  let res;
  try {
    res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + JSON_INSTRUCTIONS },
          { role: 'user', content: buildUserMessage(redactedText, localReport) },
        ],
      }),
    });
  } catch {
    throw new Error(`Could not reach ${new URL(base).host}. Check the connection, or the server may not allow browser requests (CORS).`);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = body?.error?.message || body?.message || res.statusText;
    if (res.status === 401 || res.status === 403) throw new Error(`The API key was rejected (${res.status}). ${detail}`);
    if (res.status === 404) throw new Error(`Model or endpoint not found. Check the model name. ${detail}`);
    if (res.status === 429) throw new Error('Rate limited. Wait a moment and retry.');
    throw new Error(`${PROVIDERS[provider].label} error ${res.status}: ${detail}`);
  }

  const choice = body?.choices?.[0];
  if (choice?.finish_reason === 'length') throw new Error('The model ran out of output tokens. Try again.');
  const text = choice?.message?.content || '';

  let data;
  try {
    data = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''));
  } catch {
    throw new Error('The model did not return valid JSON. Try again or use a different model.');
  }
  const parsed = TriageSchema.safeParse(data);
  if (!parsed.success) throw new Error('The model returned JSON in the wrong shape. Try a more capable model.');

  return toReport(parsed.data, { provider: PROVIDERS[provider].label, model: body.model || config.model });
}
