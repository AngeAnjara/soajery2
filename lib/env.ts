import { z } from "zod"

const envSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().min(1, "JWT_EXPIRES_IN is required"),

  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().min(1, "SMTP_USER is required"),
  SMTP_PASS: z.string().min(1, "SMTP_PASS is required"),
  SMTP_FROM: z.string().min(1, "SMTP_FROM is required"),

  UPLOAD_DIR: z.string().min(1, "UPLOAD_DIR is required"),

  MVOLA_MERCHANT_PHONE: z.string().min(1, "MVOLA_MERCHANT_PHONE is required"),
  NEXT_PUBLIC_MVOLA_MERCHANT_PHONE: z
    .string()
    .min(1, "NEXT_PUBLIC_MVOLA_MERCHANT_PHONE is required"),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const formatted = parsed.error.format()
  throw new Error(
    `Invalid environment variables. Fix your .env file and restart the server.\n${JSON.stringify(
      formatted,
      null,
      2,
    )}`,
  )
}

export const env = parsed.data
