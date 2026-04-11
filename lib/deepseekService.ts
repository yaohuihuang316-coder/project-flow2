export type DeepSeekModel = 'deepseek-chat' | 'deepseek-reasoner';
export type DeepSeekRole = 'system' | 'user' | 'assistant';

export interface DeepSeekMessage {
  role: DeepSeekRole;
  content: string;
}

interface DeepSeekCompletionOptions {
  messages: DeepSeekMessage[];
  model?: DeepSeekModel;
  temperature?: number;
  responseFormat?: 'json_object';
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

export const DEFAULT_DEEPSEEK_MODEL: DeepSeekModel = 'deepseek-chat';

export const getDeepSeekApiKey = (): string => {
  try {
    // @ts-ignore - Vite env
    const env = typeof import.meta !== 'undefined' ? import.meta.env || {} : {};
    return env.VITE_DEEPSEEK_API_KEY || env.API_KEY || '';
  } catch {
    return '';
  }
};

export const hasDeepSeekApiKey = (): boolean => Boolean(getDeepSeekApiKey());

export async function createDeepSeekCompletion({
  messages,
  model = DEFAULT_DEEPSEEK_MODEL,
  temperature = 0.7,
  responseFormat,
}: DeepSeekCompletionOptions): Promise<string> {
  const apiKey = getDeepSeekApiKey();

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY_MISSING');
  }

  const payload: Record<string, unknown> = {
    model,
    messages,
    temperature,
    stream: false,
  };

  if (responseFormat) {
    payload.response_format = { type: responseFormat };
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`DeepSeek API ${response.status}: ${detail}`);
  }

  const result = await response.json();
  return result.choices?.[0]?.message?.content?.trim() || '';
}

export function parseJsonFromText<T>(text: string): T {
  const normalized = (text || '').trim();

  if (!normalized) {
    throw new Error('EMPTY_JSON_RESPONSE');
  }

  try {
    return JSON.parse(normalized) as T;
  } catch {
    const withoutFence = normalized
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    try {
      return JSON.parse(withoutFence) as T;
    } catch {
      const arrayStart = withoutFence.indexOf('[');
      const arrayEnd = withoutFence.lastIndexOf(']');
      if (arrayStart >= 0 && arrayEnd > arrayStart) {
        return JSON.parse(withoutFence.slice(arrayStart, arrayEnd + 1)) as T;
      }

      const objectStart = withoutFence.indexOf('{');
      const objectEnd = withoutFence.lastIndexOf('}');
      if (objectStart >= 0 && objectEnd > objectStart) {
        return JSON.parse(withoutFence.slice(objectStart, objectEnd + 1)) as T;
      }

      throw new Error('INVALID_JSON_RESPONSE');
    }
  }
}

export function mapDeepSeekError(
  error: unknown,
  missingKeyMessage = '⚠️ 未配置 DeepSeek API Key，请检查 VITE_DEEPSEEK_API_KEY。'
): string {
  const message = String((error as Error | undefined)?.message || error || '');

  if (message.includes('DEEPSEEK_API_KEY_MISSING')) {
    return missingKeyMessage;
  }
  if (message.includes('401') || message.includes('403')) {
    return '⚠️ DeepSeek API Key 无效或权限不足，请检查当前环境变量。';
  }
  if (message.includes('429')) {
    return '⚠️ DeepSeek 请求过于频繁，请稍后再试。';
  }
  if (message.includes('Timeout')) {
    return '⚠️ DeepSeek 响应超时，请稍后重试。';
  }
  return '⚠️ DeepSeek 服务暂时不可用，请稍后重试。';
}
