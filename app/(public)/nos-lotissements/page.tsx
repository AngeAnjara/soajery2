import type { Metadata } from "next"

import { connectDB } from "@/lib/mongodb"
import { Lotissement } from "@/models"

import type { LotissementDTO } from "@/types"

import { LotissementCard } from "@/components/sections/LotissementCard"
import { ScrollReveal } from "@/components/sections/ScrollReveal"

export const metadata: Metadata = {
  title: "Nos Lotissements | Soajery",
  description: "Découvrez nos lotissements.",
}

export default async function NosLotissementsPage() {
  await connectDB()

  const lotissementsRaw = await Lotissement.find().lean()

  const lotissements: LotissementDTO[] = lotissementsRaw.map((l: any) => ({
    _id: l._id.toString(),
    name: l.name,
    description: l.description,
    images: l.images || [],
    location: l.location,
    googleMapLink: l.googleMapLink,
  }))

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-12">
      <section className="space-y-4">
        <ScrollReveal>
          <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-background px-6 py-10">
            <h1 className="text-3xl font-semibold tracking-tight">Nos Lotissements</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Explorez nos lotissements disponibles et prenez rendez-vous pour être accompagné.
            </p>
          </div>
        </ScrollReveal>
      </section>

      <section>
        <ScrollReveal>
          <div className="grid gap-6 md:grid-cols-2">
            {lotissements.map((l) => (
              <LotissementCard key={l._id} lotissement={l} />
            ))}
          </div>
        </ScrollReveal>
      </section>
    </main>
  )
}
