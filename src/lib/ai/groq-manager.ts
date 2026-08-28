import { GroqKeyStatus } from '../types';

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

export interface GroqChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  tools?: any[];
  tool_choice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
  response_format?: { type: 'json_object' | 'text' };
}

class GroqKeyPoolManager {
  private keys: string[] = [];
  private keyStatuses: GroqKeyStatus[] = [];
  private currentIndex: number = 0;

  constructor() {
    this.initKeys();
  }

  private initKeys() {
    const keyEnvVars = [
      process.env.GROQ_API_KEY_1,
      process.env.GROQ_API_KEY_2,
      process.env.GROQ_API_KEY_3,
      process.env.GROQ_API_KEY_4,
      process.env.GROQ_API_KEY_5,
      process.env.GROQ_API_KEY_6,
      process.env.GROQ_API_KEY_7,
      process.env.GROQ_API_KEY_8,
      process.env.GROQ_API_KEY_9,
      process.env.GROQ_API_KEY_10,
      process.env.GROQ_API_KEY_11,
    ];

    this.keys = keyEnvVars.filter((k): k is string => Boolean(k && k.startsWith('gsk_')));
    if (this.keys.length === 0) {
      // Fallback mock key for local testing if env not set
      this.keys = ['gsk_demo_pool_key_placeholder'];
    }
    this.keyStatuses = this.keys.map((k, idx) => ({
      key_index: idx,
      key_hint: `${k.substring(0, 8)}...${k.substring(k.length - 6)}`,
      is_active: true,
      request_count: 0,
      error_count: 0,
      cooldown_seconds: 0,
      avg_latency_ms: 220,
      status: 'HEALTHY'
    }));
  }

  public getKeyStatuses(): GroqKeyStatus[] {
    const now = Date.now();
    return this.keyStatuses.map(status => {
      if (status.rate_limited_until && now >= status.rate_limited_until) {
        status.status = 'HEALTHY';
        status.rate_limited_until = undefined;
        status.cooldown_seconds = 0;
      }
      return { ...status };
    });
  }

  private getNextAvailableKeyIndex(): number {
    const now = Date.now();
    const total = this.keys.length;
    if (total === 0) throw new Error('No Groq API keys configured in pool.');

    for (let attempt = 0; attempt < total; attempt++) {
      const idx = (this.currentIndex + attempt) % total;
      const status = this.keyStatuses[idx];
      if (status.rate_limited_until && now >= status.rate_limited_until) {
        status.status = 'HEALTHY';
        status.rate_limited_until = undefined;
        status.cooldown_seconds = 0;
      }
      if (status.status === 'HEALTHY' && status.is_active) {
        this.currentIndex = (idx + 1) % total;
        return idx;
      }
    }

    // If all in cooldown, return least recently throttled key
    this.currentIndex = (this.currentIndex + 1) % total;
    return this.currentIndex;
  }

  private recordSuccess(index: number, latencyMs: number) {
    const status = this.keyStatuses[index];
    if (!status) return;
    status.request_count++;
    status.last_used = new Date().toISOString();
    status.avg_latency_ms = Math.round((status.avg_latency_ms * 0.8) + (latencyMs * 0.2));
    status.status = 'HEALTHY';
  }

  private recordFailure(index: number, statusCode: number) {
    const status = this.keyStatuses[index];
    if (!status) return;
    status.error_count++;
    status.last_used = new Date().toISOString();

    if (statusCode === 429) {
      status.status = 'COOLDOWN';
      status.cooldown_seconds = 60;
      status.rate_limited_until = Date.now() + 60000;
    } else {
      status.status = 'ERROR';
      status.rate_limited_until = Date.now() + 15000;
    }
  }

  public async chatCompletion(
    messages: GroqMessage[],
    options: GroqChatOptions = {}
  ): Promise<{ response: any; keyIndex: number; latencyMs: number }> {
    const supportedModels = ['qwen/qwen3.8-27b', 'groq/compound', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'groq/compound-mini'];
    const requestedModel = options.model || 'qwen/qwen3.8-27b';
    const modelsToTry = [requestedModel, ...supportedModels.filter(m => m !== requestedModel)];
    let lastError: any = null;

    for (const model of modelsToTry) {
      const maxRetries = Math.min(this.keys.length, 5);

      for (let retry = 0; retry < maxRetries; retry++) {
        const keyIndex = this.getNextAvailableKeyIndex();
        const apiKey = this.keys[keyIndex];
        const startTime = Date.now();

        try {
          const body: any = {
            model,
            messages,
            temperature: options.temperature ?? 0.2,
            max_tokens: options.max_tokens ?? 1024,
          };

          if (options.tools && options.tools.length > 0) {
            body.tools = options.tools;
            body.tool_choice = options.tool_choice || 'auto';
          }

          if (options.response_format) {
            body.response_format = options.response_format;
          }

          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
          });

          const latencyMs = Date.now() - startTime;

          if (!res.ok) {
            const errorData: any = await res.json().catch(() => ({}));
            this.recordFailure(keyIndex, res.status);
            lastError = new Error(`Groq API Error (${res.status}): ${JSON.stringify(errorData)}`);

            // If model does not exist or decommissioned, break inner retry loop to try next model
            if (res.status === 404 || errorData?.error?.code === 'model_not_found' || errorData?.error?.code === 'model_decommissioned') {
              break;
            }
            continue; // failover to next key in pool
          }

          const data = await res.json();
          this.recordSuccess(keyIndex, latencyMs);

          // Clean any <think> tags if model produces reasoning
          if (data.choices?.[0]?.message?.content) {
            data.choices[0].message.content = data.choices[0].message.content
              .replace(/<think>[\s\S]*?<\/think>/gi, '')
              .trim();
          }

          return {
            response: data,
            keyIndex,
            latencyMs,
          };
        } catch (err: any) {
          this.recordFailure(keyIndex, 500);
          lastError = err;
        }
      }
    }

    throw lastError || new Error('All Groq API keys in pool failed.');
  }

  public async transcribeAudio(
    audioBuffer: Buffer,
    filename: string = 'voice_note.m4a',
    languagePrompt?: string
  ): Promise<{ text: string; latencyMs: number; keyIndex: number }> {
    const keyIndex = this.getNextAvailableKeyIndex();
    const apiKey = this.keys[keyIndex];
    const startTime = Date.now();

    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: 'audio/m4a' });
    formData.append('file', blob, filename);
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('temperature', '0.0');
    formData.append('response_format', 'json');
    if (languagePrompt) {
      formData.append('prompt', languagePrompt);
    }

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    const latencyMs = Date.now() - startTime;
    if (!res.ok) {
      this.recordFailure(keyIndex, res.status);
      throw new Error(`Whisper STT failed with status ${res.status}`);
    }

    const data = await res.json();
    this.recordSuccess(keyIndex, latencyMs);
    return {
      text: data.text || '',
      latencyMs,
      keyIndex,
    };
  }
}

export const groqPool = new GroqKeyPoolManager();
