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

// Models that can't answer a chat request: embeddings, speech, images, video, moderation
const NOT_CHAT = /embed|whisper|tts|transcri|audio|realtime|speech|dall-e|image|imagen|veo|moderation|guard|aqa|babbage|davinci|instruct|computer-use|search-preview|deep-research|-live|codex|lyria|banana|robotics|antigravity|customtools/i;

// Which model to preselect: a fast, reliable default per provider
// (the newest Gemini models are often overloaded or think for minutes on a short triage)
const PREFERRED = {
  gemini: [/^gemini-2\.5-flash$/, /^gemini-[\d.]+-flash$/, /^gemini-[\d.]+-pro$/, /flash/],
  openai: [/^gpt-[\d.]+-mini$/, /^gpt-[\d.]+$/, /^gpt-/],
  groq: [/versatile/, /llama/],
};

const byVersionDesc = (a, b) => b.localeCompare(a, undefined, { numeric: true });

// Asks the provider which models this key can use, so nobody has to type a model name
export async function listModels(config) {
  const provider = detectProvider(config);
  if (!provider) throw new Error('Unrecognized API key.');

  let ids;
  if (provider === 'anthropic') {
    const { listClaudeModels } = await import('./claude.js');
    ids = await listClaudeModels(config.apiKey);
  } else {
    const base = (config.baseUrl || PROVIDERS[provider].baseUrl).replace(/\/+$/, '');
    const headers = config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {};
    let res;
    try {
      res = await fetch(`${base}/models`, { headers });
    } catch {
      throw new Error(`Could not reach ${new URL(base).host} to list models.`);
    }
    const body = await res.json().catch(() => null);
    if (!res.ok) throw providerError(provider, res, body);
    ids = (body?.data || body?.models || []).map(m => String(m.id || m.name || '').replace(/^models\//, ''));
  }

  ids = [...new Set(ids.filter(id => id && !NOT_CHAT.test(id)))];
  if (provider === 'gemini' || provider === 'openai' || provider === 'groq') {
    // Stable releases before previews and experiments, newest version first
    const unstable = (id) => /preview|exp|latest|\d{4}-\d{2}-\d{2}|-\d{4}$/.test(id);
    ids.sort((a, b) => unstable(a) - unstable(b) || byVersionDesc(a, b));
  }
  const prefer = (PREFERRED[provider] || []).map(re => ids.find(id => re.test(id))).find(Boolean);
  return { models: ids, defaultModel: prefer || ids[0] || '' };
}

function providerError(provider, res, body) {
  // Google wraps errors in an array and answers a bad key with 400, not 401
  const err = Array.isArray(body) ? body[0] : body;
  const detail = err?.error?.message || err?.message || res.statusText || 'No details from the provider.';
  const badKey = /api key|auth key|credential|unauthenticated/i.test(detail);
  if (res.status === 401 || res.status === 403 || badKey) return new Error(`The API key was rejected (${res.status}): ${detail} Check you pasted the whole key and that it hasn't been deleted.`);
  if (res.status === 404 || /model/i.test(detail)) return new Error(`Model not found or not available (${res.status}): ${detail} Pick another model in LLM settings.`);
  if (res.status === 429) return new Error('Rate limited. Wait a moment and retry.');
  if (res.status === 503 || res.status === 529) return new Error('This model is busy right now. Retry, or pick another model in LLM settings.');
  return new Error(`${PROVIDERS[provider].label} error ${res.status}: ${detail}`);
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
  if (!res.ok) throw providerError(provider, res, body);

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
