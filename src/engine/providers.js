// Which LLM provider a key belongs to. Kept free of SDK imports so the UI can use it cheaply.

export const PROVIDERS = {
  anthropic: { label: 'Anthropic (Claude)', baseUrl: 'https://api.anthropic.com', example: 'claude-opus-5' },
  openai: { label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', example: 'your OpenAI model id' },
  gemini: { label: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', example: 'e.g. gemini-2.5-flash' },
  openrouter: { label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', example: 'vendor/model, e.g. anthropic/claude-opus-5' },
  groq: { label: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', example: 'your Groq model id' },
  custom: { label: 'OpenAI-compatible server', baseUrl: '', example: 'model served at your base URL' },
};

// Key prefixes are checked most specific first ("sk-ant-" and "sk-or-" before plain "sk-")
export function detectProvider({ apiKey = '', baseUrl = '' }) {
  if (baseUrl.trim()) return 'custom';
  const key = apiKey.trim();
  if (key.startsWith('sk-ant-')) return 'anthropic';
  if (key.startsWith('sk-or-')) return 'openrouter';
  if (key.startsWith('gsk_')) return 'groq';
  if (key.startsWith('AIza') || key.startsWith('AQ.')) return 'gemini'; // AI Studio issues both formats
  if (key.startsWith('sk-')) return 'openai';
  return null;
}
