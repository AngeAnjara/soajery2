import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { verifyTokenPayload } from "@/lib/jwt"

import { RendezVousHero } from "@/components/rendez-vous/RendezVousHero"
import { AppointmentStepper } from "@/components/rendez-vous/AppointmentStepper"

export default async function RendezVousPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    redirect("/login?next=/rendez-vous")
  }

  const payload = verifyTokenPayload(token)

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <RendezVousHero />
      <AppointmentStepper userId={payload.userId} />
    </main>
  )
}
