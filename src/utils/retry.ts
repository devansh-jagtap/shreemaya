/** Retries an async function with exponential backoff. */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 500,
): Promise<T> => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt >= maxAttempts) {
        break;
      }

      const waitTime = delayMs * 2 ** (attempt - 1);
      await Bun.sleep(waitTime);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unknown retry failure');
};
