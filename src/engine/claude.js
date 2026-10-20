// Anthropic provider, through the official SDK. Called straight from the browser with the
// user's own key; the trace is redacted before it gets here.
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { TriageSchema, SYSTEM_PROMPT, buildUserMessage, toReport } from './triage-schema.js';

// Models that accept output_config.effort, and those that support server-side fallbacks
const SUPPORTS_EFFORT = /^claude-(opus-5|opus-4-[5-8]|sonnet-5|sonnet-4-6|fable)/;
const SUPPORTS_FALLBACK = /^claude-(opus-5|fable)/;

export async function analyzeWithClaude({ apiKey, model, redactedText, localReport }) {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 1 });

  const params = {
    model,
    max_tokens: 16000,
    output_config: { format: betaZodOutputFormat(TriageSchema) },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserMessage(redactedText, localReport) }],
  };
  // Triage is a short task, so low effort keeps answers fast
  if (SUPPORTS_EFFORT.test(model)) params.output_config.effort = 'low';
  if (SUPPORTS_FALLBACK.test(model)) {
    params.betas = ['server-side-fallback-2026-07-01'];
    params.fallbacks = 'default';
  }

  let response;
  try {
    response = await client.beta.messages.parse(params);
  } catch (err) {
    throw new Error(describeError(err));
  }

  if (response.stop_reason === 'refusal') {
    throw new Error('The model declined to analyze this trace. The local diagnosis is still shown.');
  }
  if (response.stop_reason === 'max_tokens' || !response.parsed_output) {
    throw new Error('The model returned an incomplete answer. Try again.');
  }

  return toReport(response.parsed_output, { provider: 'Anthropic', model: response.model || model });
}

function describeError(err) {
  if (err instanceof Anthropic.AuthenticationError) return 'That API key was rejected. Check it in LLM settings.';
  if (err instanceof Anthropic.PermissionDeniedError) return 'This API key does not have access to that model.';
  if (err instanceof Anthropic.NotFoundError) return 'Model not found. Check the model name in LLM settings.';
  if (err instanceof Anthropic.RateLimitError) return 'Rate limited by the Anthropic API. Wait a moment and retry.';
  if (err instanceof Anthropic.APIConnectionError) return 'Could not reach api.anthropic.com. Check your connection.';
  if (err instanceof Anthropic.APIError) return `Anthropic API error ${err.status ?? ''}: ${err.message}`;
  return err?.message || 'Unknown error while calling the Anthropic API.';
}
