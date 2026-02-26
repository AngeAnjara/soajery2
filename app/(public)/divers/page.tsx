import type { Metadata } from "next"

import { connectDB } from "@/lib/mongodb"
import { Definition, FAQ, News, Video } from "@/models"

import type { DefinitionDTO, FAQDTO, NewsDTO, VideoDTO } from "@/types"

import { DefinitionCard } from "@/components/sections/DefinitionCard"
import { FAQAccordion } from "@/components/sections/FAQAccordion"
import { NewsCard } from "@/components/sections/NewsCard"
import { ScrollReveal } from "@/components/sections/ScrollReveal"
import { VideoCard } from "@/components/sections/VideoCard"

export const metadata: Metadata = {
  title: "Divers | Soajery",
  description: "Ressources, actualités, vidéos et FAQ.",
}

export default async function DiversPage() {
  let definitions: DefinitionDTO[] = []
  let faqs: FAQDTO[] = []
  let videos: VideoDTO[] = []
  let news: NewsDTO[] = []

  try {
    await connectDB()
    const [definitionsRaw, faqsRaw, videosRaw, newsRaw] = await Promise.all([
      Definition.find().lean(),
      FAQ.find().lean(),
      Video.find().lean(),
      News.find().lean(),
    ])

    definitions = definitionsRaw.map((d: any) => ({
      _id: d._id.toString(),
      title: d.title,
      content: d.content,
    }))

    faqs = faqsRaw.map((f: any) => ({
      _id: f._id.toString(),
      question: f.question,
      answer: f.answer,
    }))

    videos = videosRaw.map((v: any) => ({
      _id: v._id.toString(),
      title: v.title,
      thumbnail: v.thumbnail,
      facebookUrl: v.facebookUrl,
    }))

    news = newsRaw.map((n: any) => ({
      _id: n._id.toString(),
      title: n.title,
      description: n.description,
      image: n.image,
      facebookUrl: n.facebookUrl,
    }))
  } catch {
    // Gracefully handle DB connection errors during build prerender
  }

  return (
    <main className="mx-auto max-w-6xl space-y-14 px-4 py-12">
      <section className="space-y-6">
        <ScrollReveal>
          <h1 className="text-3xl font-semibold tracking-tight">Divers</h1>
        </ScrollReveal>
      </section>

      <section className="space-y-6">
        <ScrollReveal>
          <h2 className="text-2xl font-semibold tracking-tight">Définitions</h2>
        </ScrollReveal>
        <ScrollReveal>
          <div className="grid gap-4 md:grid-cols-2">
            {definitions.map((d) => (
              <DefinitionCard key={d._id} definition={d} />
            ))}
          </div>
        </ScrollReveal>
      </section>

      <section className="space-y-6">
        <ScrollReveal>
          <h2 className="text-2xl font-semibold tracking-tight">Actualités</h2>
        </ScrollReveal>
        <ScrollReveal>
          <div className="grid gap-4 md:grid-cols-3">
            {news.map((n) => (
              <NewsCard key={n._id} news={n} />
            ))}
          </div>
        </ScrollReveal>
      </section>

      <section className="space-y-6">
        <ScrollReveal>
          <h2 className="text-2xl font-semibold tracking-tight">Vidéos</h2>
        </ScrollReveal>
        <ScrollReveal>
          <div className="grid gap-4 md:grid-cols-3">
            {videos.map((v) => (
              <VideoCard key={v._id} video={v} />
            ))}
          </div>
        </ScrollReveal>
      </section>

      <section className="space-y-6">
        <ScrollReveal>
          <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>
        </ScrollReveal>
        <ScrollReveal>
          <FAQAccordion faqs={faqs} />
        </ScrollReveal>
      </section>
    </main>
  )
}
