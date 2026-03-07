/**
 * Minimal structured logger for CLI/pipeline tasks.
 * Uses stderr for structured output so stdout stays clean for piped output.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogEntry = {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
};

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  constructor(
    private readonly name: string,
    private readonly minLevel: LogLevel = "info",
  ) {}

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.minLevel]) return;

    const entry: LogEntry = {
      level,
      message: `[${this.name}] ${message}`,
      ...(context !== undefined && { context }),
      timestamp: new Date().toISOString(),
    };

    const formatted =
      process.env.LOG_FORMAT === "json"
        ? JSON.stringify(entry)
        : `${entry.timestamp} ${entry.level.toUpperCase().padEnd(5)} ${entry.message}${
            context ? ` ${JSON.stringify(context)}` : ""
          }`;

    process.stderr.write(`${formatted}\n`);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log("error", message, context);
  }
}

const VALID_LOG_LEVELS = new Set<string>(["debug", "info", "warn", "error"]);

function resolveLogLevel(envValue: string | undefined): LogLevel {
  if (envValue === undefined) return "info";
  if (VALID_LOG_LEVELS.has(envValue)) return envValue as LogLevel;
  process.stderr.write(`[logger] Invalid LOG_LEVEL "${envValue}"; defaulting to "info"\n`);
  return "info";
}

export function createLogger(name: string, minLevel?: LogLevel): Logger {
  return new Logger(name, minLevel ?? resolveLogLevel(process.env.LOG_LEVEL));
}
