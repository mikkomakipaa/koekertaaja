import pino from 'pino';

/**
 * Structured logger using Pino
 * Provides consistent logging across the application
 *
 * Note: In development, pino-pretty transport can cause worker thread issues.
 * Using synchronous logging in development to avoid crashes.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  // Disable pino-pretty transport in development due to worker thread issues
  // Use basic console output instead
  base: {
    env: process.env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
});

/**
 * Create a child logger with additional context
 */
export function createLogger(context: Record<string, any>) {
  return logger.child(context);
}
