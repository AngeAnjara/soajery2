import Image from "next/image"

import type { NewsDTO } from "@/types"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function NewsCard({ news }: { news: NewsDTO }) {
  const rawSrc = typeof news.image === "string" ? news.image.trim() : ""
  const imageSrc =
    rawSrc && (rawSrc.startsWith("/") || rawSrc.startsWith("http://") || rawSrc.startsWith("https://"))
      ? rawSrc
      : ""

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-3">
        <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 to-muted">
          {imageSrc ? (
            <Image src={imageSrc} alt={news.title} fill className="object-cover" />
          ) : null}
        </div>
        <CardTitle className="text-xl">{news.title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground line-clamp-2">{news.description}</CardContent>
      <CardFooter>
        <Button asChild variant="link" className="px-0">
          <a href={news.facebookUrl} target="_blank" rel="noreferrer">
            Voir sur Facebook
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
