"use client"

import * as React from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function animateCounter(el: HTMLSpanElement, value: number) {
  const obj = { val: 0 }
  gsap.to(obj, {
    val: value,
    duration: 1.2,
    ease: "power2.out",
    snap: { val: 1 },
    onUpdate: () => {
      el.textContent = String(Math.round(obj.val))
    },
  })
}

export function AboutSection() {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const c1 = React.useRef<HTMLSpanElement | null>(null)
  const c2 = React.useRef<HTMLSpanElement | null>(null)
  const c3 = React.useRef<HTMLSpanElement | null>(null)

  React.useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    if (!ref.current) return

    const ctx = gsap.context(() => {
      gsap.set(ref.current, { opacity: 1, x: 0, y: 0 })
      gsap.from(ref.current, {
        opacity: 0,
        y: 40,
        duration: 0.7,
        immediateRender: false,
        clearProps: "opacity,transform",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 80%",
        },
        onStart: () => {
          if (c1.current) animateCounter(c1.current, 3)
          if (c2.current) animateCounter(c2.current, 120)
          if (c3.current) animateCounter(c3.current, 8)
        },
      })
    }, ref)

    return () => {
      ctx.revert()
    }
  }, [])

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div ref={ref} className="grid items-start gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">À propos de Soajery</h2>
          <p className="mt-4 text-muted-foreground">
            Notre mission est de rendre l’immobilier plus accessible, transparent et sécurisé. Nous vous accompagnons
            dans le choix de votre lotissement, la prise de rendez-vous et la vérification de vos documents.
          </p>
          <p className="mt-4 text-muted-foreground">
            Un service moderne, une équipe à l’écoute et des processus clairs pour avancer en confiance.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>
                <span ref={c1}>0</span> Lotissements
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Des opportunités sélectionnées.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <span ref={c2}>0</span>+ Clients
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Une expérience de terrain.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <span ref={c3}>0</span> Ans d’expérience
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Une expertise reconnue.</CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
