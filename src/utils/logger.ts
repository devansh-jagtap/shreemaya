/** Structured log payload emitted by the application logger. */
export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  event: string;
  data?: Record<string, unknown>;
}

/** Emits a structured JSON log line to stdout/stderr. */
export const logEvent = (
  level: LogEntry['level'],
  event: string,
  data?: Record<string, unknown>,
): void => {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    data,
  };

  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.log(line);
};
