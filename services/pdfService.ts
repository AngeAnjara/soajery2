import * as React from "react"
const QRCode = require("qrcode") as any
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 12,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    marginBottom: 4,
  },
  muted: {
    color: "#555",
  },
  section: {
    marginTop: 12,
  },
  block: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
  },
  item: {
    marginTop: 6,
  },
  premium: {
    color: "#7c3aed",
  },
})

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(value)
}

function PaymentReceiptDocument({
  receiptNumber,
  userName,
  userEmail,
  amount,
  relatedTo,
  transactionRef,
  mvolaPhone,
  approvedAt,
  logoSrc,
  qrSrc,
}: {
  receiptNumber: string
  userName: string
  userEmail: string
  amount: number
  relatedTo: "appointment" | "verification"
  transactionRef: string
  mvolaPhone: string
  approvedAt: Date
  logoSrc: string
  qrSrc: string
}) {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" } },
          React.createElement(
            View,
            { style: { flexDirection: "row", alignItems: "center", gap: 10 } },
            React.createElement(Image, { src: logoSrc, style: { width: 40, height: 40 } }),
            React.createElement(
              View,
              null,
              React.createElement(Text, { style: styles.title }, "Reçu de paiement"),
              React.createElement(Text, { style: styles.muted }, "Soajery"),
              React.createElement(Text, { style: styles.muted }, `Date: ${formatDate(approvedAt)}`),
            ),
          ),
          React.createElement(Image, { src: qrSrc, style: { width: 72, height: 72 } }),
        ),
      ),
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.muted }, "Détails"),
        React.createElement(
          View,
          { style: styles.block },
          React.createElement(Text, { style: styles.item }, `N° Reçu: ${receiptNumber}`),
          React.createElement(Text, { style: styles.item }, `Utilisateur: ${userName}`),
          React.createElement(Text, { style: styles.item }, `Email: ${userEmail}`),
          React.createElement(
            Text,
            { style: styles.item },
            `Montant: ${Number(amount).toLocaleString("fr-FR")} Ar`,
          ),
          React.createElement(Text, { style: styles.item }, `Type: ${relatedTo}`),
          React.createElement(Text, { style: styles.item }, `Téléphone MVola: ${mvolaPhone}`),
          React.createElement(Text, { style: styles.item }, `Référence: ${transactionRef}`),
        ),
      ),
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(
          View,
          { style: styles.block },
          React.createElement(
            Text,
            { style: styles.muted },
            "Merci pour votre paiement. Ce reçu est généré automatiquement.",
          ),
        ),
      ),
    ),
  )
}

function VerificationReportDocument({
  flowTitle,
  userName,
  date,
  summary,
  matchedConditions,
}: {
  flowTitle: string
  userName: string
  date: Date
  summary: string
  matchedConditions?: { resultText: string; isPremium: boolean }[]
}) {
  const list = Array.isArray(matchedConditions) ? matchedConditions : []

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.title }, "Rapport de vérification"),
        React.createElement(Text, { style: styles.muted }, flowTitle),
        React.createElement(Text, { style: styles.muted }, `Date: ${formatDate(date)}`),
      ),
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.muted }, "Utilisateur"),
        React.createElement(View, { style: styles.block }, React.createElement(Text, null, userName)),
      ),
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.muted }, "Résumé"),
        React.createElement(View, { style: styles.block }, React.createElement(Text, null, summary)),
      ),
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.muted }, "Résultats"),
        React.createElement(
          View,
          { style: styles.block },
          ...(list.length
            ? list.map((m, idx) =>
                React.createElement(
                  Text,
                  { key: idx, style: styles.item },
                  `- ${m.resultText}${m.isPremium ? " (Premium)" : ""}`,
                ),
              )
            : [React.createElement(Text, { key: "none", style: styles.item }, "- (aucun)")]),
        ),
      ),
    ),
  )
}

export async function generateVerificationReportPdf(data: {
  flowTitle: string
  userName: string
  date: Date
  summary: string
  matchedConditions?: { resultText: string; isPremium: boolean }[]
}): Promise<Buffer> {
  const element = React.createElement(VerificationReportDocument, {
    flowTitle: data.flowTitle,
    userName: data.userName,
    date: data.date,
    summary: data.summary,
    matchedConditions: data.matchedConditions,
  })

  const buffer = await renderToBuffer(element as any)

  return buffer
}

export async function generatePaymentReceiptPdf(data: {
  receiptNumber: string
  userName: string
  userEmail: string
  amount: number
  relatedTo: "appointment" | "verification"
  transactionRef: string
  mvolaPhone: string
  approvedAt: Date
}): Promise<Buffer> {
  const logoSrc =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAO0lEQVR4nO3BMQEAAADCoPVPbQ0PoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4G4B0mAAAZuC1nUAAAAASUVORK5CYII="

  const qrPayload = JSON.stringify({
    receiptNumber: data.receiptNumber,
    transactionRef: data.transactionRef,
    relatedTo: data.relatedTo,
  })

  const qrSrc = await QRCode.toDataURL(qrPayload, { errorCorrectionLevel: "M", margin: 1, width: 256 })

  const element = React.createElement(PaymentReceiptDocument, {
    receiptNumber: data.receiptNumber,
    userName: data.userName,
    userEmail: data.userEmail,
    amount: data.amount,
    relatedTo: data.relatedTo,
    transactionRef: data.transactionRef,
    mvolaPhone: data.mvolaPhone,
    approvedAt: data.approvedAt,
    logoSrc,
    qrSrc,
  })

  const buffer = await renderToBuffer(element as any)

  return buffer
}
