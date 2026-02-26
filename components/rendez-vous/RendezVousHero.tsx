"use client"

import * as React from "react"
import gsap from "gsap"

export function RendezVousHero() {
  const titleRef = React.useRef<HTMLHeadingElement | null>(null)

  React.useEffect(() => {
    if (!titleRef.current) return

    const ctx = gsap.context(() => {
      gsap.set(titleRef.current, { opacity: 1, x: 0, y: 0 })
      gsap.from(titleRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.7,
        ease: "power2.out",
        immediateRender: false,
        clearProps: "opacity,transform",
      })
    }, titleRef)

    return () => {
      ctx.revert()
    }
  }, [])

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-background px-6 py-10">
      <h1 ref={titleRef} className="text-3xl font-semibold tracking-tight">
        Prendre rendez-vous
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Choisissez une date, effectuez le paiement MVola, puis envoyez la preuve.
      </p>
    </div>
  )
}
