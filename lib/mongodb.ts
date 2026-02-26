import mongoose from "mongoose"

import { env } from "@/lib/env"

type MongooseCache = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined
}

const cached = global.mongoose || (global.mongoose = { conn: null, promise: null })

export async function connectDB() {
  if (cached.conn) {
    console.log("[mongodb] already connected")
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(env.MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 10,
      })
      .then((m) => m)
  }

  try {
    cached.conn = await cached.promise
    console.log("[mongodb] connected")
    return cached.conn
  } catch (error) {
    cached.promise = null
    console.error("[mongodb] connection error", error)
    throw error
  }
}
