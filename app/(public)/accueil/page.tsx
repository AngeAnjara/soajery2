import type { Metadata } from "next"

import { AboutSection } from "@/components/sections/AboutSection"
import { FacebookEmbed } from "@/components/sections/FacebookEmbed"
import { HeroSection } from "@/components/sections/HeroSection"

export const metadata: Metadata = {
  title: "Accueil | Soajery",
  description: "Accueil Soajery",
}

export default function AccueilPage() {
  return (
    <main>
      <HeroSection />
      <AboutSection />
      <FacebookEmbed pageUrl="https://web.facebook.com/profile.php?id=100083388368058" height={520} />
    </main>
  )
}
