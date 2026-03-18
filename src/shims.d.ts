declare const Bun: {
  sleep(ms: number): Promise<void>;
};

declare const process: {
  env: Record<string, string | undefined>;
};

declare module 'elysia' {
  export class Elysia {
    use(plugin: unknown): this;
    get(path: string, handler: (...args: never[]) => unknown): this;
    post(path: string, handler: (...args: never[]) => unknown, options?: unknown): this;
    listen(port: number): this;
  }

  export const t: {
    Object(value: unknown): unknown;
    Optional(value: unknown): unknown;
    String(options?: unknown): unknown;
    Union(values: unknown[]): unknown;
    Literal(value: string): unknown;
    Boolean(): unknown;
  };
}

declare module 'ai' {
  export type LanguageModel = unknown;
  export function generateText(options: unknown): Promise<{
    text: string;
    usage?: {
      inputTokens?: number;
      outputTokens?: number;
    };
  }>;
}

declare module '@ai-sdk/anthropic' {
  export function anthropic(model: string): unknown;
}

declare module '@ai-sdk/google' {
  export function google(model: string): unknown;
}

declare module '@ai-sdk/mistral' {
  export function mistral(model: string): unknown;
}

declare module '@ai-sdk/openai' {
  export function openai(model: string): unknown;
}
