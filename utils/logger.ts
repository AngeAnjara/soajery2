type LogLevel = "info" | "warn" | "error" | "debug"

type LogMeta = Record<string, unknown>

function serialize(level: LogLevel, message: string, meta?: LogMeta) {
  return JSON.stringify({
    level,
    timestamp: new Date().toISOString(),
    message,
    ...(meta || {}),
  })
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    console.log(serialize("info", message, meta))
  },
  warn(message: string, meta?: LogMeta) {
    console.log(serialize("warn", message, meta))
  },
  debug(message: string, meta?: LogMeta) {
    console.log(serialize("debug", message, meta))
  },
  error(message: string, meta?: LogMeta) {
    console.error(serialize("error", message, meta))
  },
} as const
