"use client"

import Image from "next/image"
import * as React from "react"
import gsap from "gsap"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LotissementGallery({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const imgRef = React.useRef<HTMLDivElement | null>(null)

  const hasImages = images && images.length > 0

  const prev = () => {
    if (!hasImages) return
    setCurrentIndex((i) => (i - 1 + images.length) % images.length)
  }

  const next = () => {
    if (!hasImages) return
    setCurrentIndex((i) => (i + 1) % images.length)
  }

  React.useEffect(() => {
    if (!imgRef.current) return

    gsap.fromTo(imgRef.current, { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.4 })
  }, [currentIndex])

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg border bg-muted">
        <div ref={imgRef} className="absolute inset-0">
          {hasImages ? (
            <Image src={images[currentIndex]} alt="Lotissement" fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              Aucune image
            </div>
          )}
        </div>

        {hasImages && images.length > 1 ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70"
              onClick={prev}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70"
              onClick={next}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        ) : null}
      </div>

      {hasImages && images.length > 1 ? (
        <div className="flex items-center justify-center gap-2">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Image ${idx + 1}`}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "h-2 w-2 rounded-full bg-muted-foreground/30 transition-colors",
                idx === currentIndex && "bg-primary",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
