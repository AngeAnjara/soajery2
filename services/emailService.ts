import nodemailer from "nodemailer"

import { env } from "@/lib/env"
import { logger } from "@/utils/logger"

function createTransporter() {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  })
}

export async function sendAppointmentConfirmation(
  to: string,
  name: string,
  date: Date,
  price: number,
) {
  try {
    const transporter = createTransporter()

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Confirmation de rendez-vous</h2>
        <p>Bonjour ${name},</p>
        <p>Votre rendez-vous a été créé.</p>
        <ul>
          <li><b>Date</b>: ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short" }).format(
            date,
          )}</li>
          <li><b>Prix</b>: ${Number(price).toLocaleString("fr-FR")} Ar</li>
        </ul>
        <p>Instructions MVola: composez le code USSD affiché dans l’application puis envoyez la preuve.</p>
      </div>
    `

    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject: "Confirmation de rendez-vous",
      html,
    })
  } catch (error: any) {
    logger.error("Email sendAppointmentConfirmation failed", { to, error: error?.message || String(error) })
  }
}

export async function sendPaymentApproved(
  to: string,
  name: string,
  amount: number,
  relatedTo: "appointment" | "verification",
  pdfBuffer?: Buffer,
) {
  try {
    const transporter = createTransporter()

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Paiement approuvé</h2>
        <p>Bonjour ${name},</p>
        <p>Votre paiement a été approuvé.</p>
        <ul>
          <li><b>Montant</b>: ${Number(amount).toLocaleString("fr-FR")} Ar</li>
          <li><b>Type</b>: ${relatedTo}</li>
        </ul>
      </div>
    `

    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject: "Paiement approuvé",
      html,
      attachments: pdfBuffer
        ? [
            {
              filename: "recu-paiement.pdf",
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ]
        : [],
    })
  } catch (error: any) {
    logger.error("Email sendPaymentApproved failed", { to, error: error?.message || String(error) })
  }
}

export async function sendPaymentRejected(to: string, name: string, amount: number, reason?: string) {
  try {
    const transporter = createTransporter()

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Paiement rejeté</h2>
        <p>Bonjour ${name},</p>
        <p>Votre paiement a été rejeté.</p>
        <ul>
          <li><b>Montant</b>: ${Number(amount).toLocaleString("fr-FR")} Ar</li>
          ${reason ? `<li><b>Raison</b>: ${reason}</li>` : ""}
        </ul>
      </div>
    `

    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject: "Paiement rejeté",
      html,
    })
  } catch (error: any) {
    logger.error("Email sendPaymentRejected failed", { to, error: error?.message || String(error) })
  }
}

export async function sendPdfUnlocked(to: string, name: string, downloadUrl: string) {
  try {
    const transporter = createTransporter()

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Rapport disponible</h2>
        <p>Bonjour ${name},</p>
        <p>Votre rapport de vérification est maintenant disponible.</p>
        <p><a href="${downloadUrl}">Télécharger le PDF</a></p>
      </div>
    `

    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject: "Rapport de vérification débloqué",
      html,
    })
  } catch (error: any) {
    logger.error("Email sendPdfUnlocked failed", { to, error: error?.message || String(error) })
  }
}
