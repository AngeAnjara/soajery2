import { env } from "@/lib/env"

export function extractLast4(userId: string): string {
  return userId.slice(-4)
}

export function generateUSSDCode(merchantPhone: string, amount: number, last4: string): string {
  return `*111*1*2*${merchantPhone}*${amount}*${last4}#`
}

export function getMvolaPaymentInfo(userId: string, amount: number): { ussdCode: string; last4: string } {
  const last4 = extractLast4(userId)
  const ussdCode = generateUSSDCode(env.MVOLA_MERCHANT_PHONE, amount, last4)
  return { ussdCode, last4 }
}
