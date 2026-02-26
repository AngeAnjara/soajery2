"use client"

import gsap from "gsap"
import Image from "next/image"
import Link from "next/link"
import * as React from "react"
import Images from "../../app/Image.png"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  const wrapperRef = React.useRef<HTMLDivElement | null>(null)
  const titleRef = React.useRef<HTMLHeadingElement | null>(null)
  const subtitleRef = React.useRef<HTMLParagraphElement | null>(null)
  const primaryRef = React.useRef<HTMLDivElement | null>(null)
  const secondaryRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!wrapperRef.current) return

    const ctx = gsap.context(() => {
      gsap.set([wrapperRef.current, titleRef.current, subtitleRef.current, primaryRef.current, secondaryRef.current], {
        opacity: 1,
        clearProps: "transform",
      })

      const tl = gsap.timeline()

      tl.from(wrapperRef.current, { opacity: 0, duration: 0.6, immediateRender: false })

      if (titleRef.current) {
        tl.from(titleRef.current, { y: 60, opacity: 0, duration: 0.9, immediateRender: false }, "-=0.2")
      }

      if (subtitleRef.current) {
        tl.from(subtitleRef.current, { y: 30, opacity: 0, duration: 0.7, immediateRender: false }, "-=0.6")
      }

      const buttons = [primaryRef.current, secondaryRef.current].filter(Boolean)
      if (buttons.length > 0) {
        tl.from(
          buttons,
          {
            y: 20,
            opacity: 0,
            duration: 0.6,
            stagger: 0.15,
            ease: "back.out(1.7)",
            immediateRender: false,
            clearProps: "opacity,transform",
          },
          "-=0.4",
        )
      }
    }, wrapperRef)

    return () => {
      ctx.revert()
    }
  }, [])

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-background" />
      <div className="absolute inset-0 opacity-10">
        <Image
          src={Images}
          alt="Background"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div ref={wrapperRef} className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center px-4 py-20">
        <div className="max-w-2xl">
          <h1 ref={titleRef} className="text-4xl font-bold tracking-tight md:text-6xl">
            Construisez votre avenir avec Soajery
          </h1>
          <p ref={subtitleRef} className="mt-5 text-lg text-muted-foreground md:text-xl">
            Lotissements, rendez-vous et vérification de papiers — un accompagnement simple, rapide et fiable.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <div ref={primaryRef}>
              <Button asChild size="lg">
                <Link href="/rendez-vous">Prendre Rendez-vous</Link>
              </Button>
            </div>
            <div ref={secondaryRef}>
              <Button asChild size="lg" variant="secondary">
                <Link href="/verifier-papier">Vérifier vos Papiers</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
