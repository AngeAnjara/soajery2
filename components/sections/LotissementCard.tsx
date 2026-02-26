"use client"

import Link from "next/link"
import * as React from "react"
import gsap from "gsap"

import { MapPin } from "lucide-react"

import type { LotissementDTO } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LotissementGallery } from "@/components/sections/LotissementGallery"

export function LotissementCard({ lotissement }: { lotissement: LotissementDTO }) {
  const cardRef = React.useRef<HTMLDivElement | null>(null)

  const onEnter = () => {
    if (!cardRef.current) return
    gsap.to(cardRef.current, {
      scale: 1.03,
      duration: 0.3,
      boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
    })
  }

  const onLeave = () => {
    if (!cardRef.current) return
    gsap.to(cardRef.current, {
      scale: 1,
      duration: 0.3,
      boxShadow: "0 0 0 rgba(0,0,0,0)",
    })
  }

  return (
    <div ref={cardRef} onMouseEnter={onEnter} onMouseLeave={onLeave} className="origin-center">
      <Card>
        <CardHeader className="space-y-3">
          <LotissementGallery images={lotissement.images} />
          <div className="space-y-2">
            <CardTitle className="text-xl">{lotissement.name}</CardTitle>
            {lotissement.location ? <Badge variant="secondary">{lotissement.location}</Badge> : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{lotissement.description}</p>

          {lotissement.googleMapLink ? (
            <div className="overflow-hidden rounded-lg border">
              <div className="relative aspect-[16/9] w-full">
                <iframe
                  title={`Google Map - ${lotissement.name}`}
                  src={lotissement.googleMapLink}
                  className="absolute inset-0 h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/rendez-vous">Prendre RDV</Link>
          </Button>

          {lotissement.googleMapLink ? (
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => window.open(lotissement.googleMapLink!, "_blank")}
            >
              <MapPin className="mr-2 h-4 w-4" />
              Google Maps
            </Button>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  )
}
