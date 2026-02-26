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
          <div className="mt-4 space-y-4 text-muted-foreground">
            <p>
              Nous sommes un acteur indépendant du foncier à Madagascar, avant tout issu de l’expérience du terrain.
            </p>
            <p>
              Au fil des années, nous avons acheté, vendu et géré plusieurs terrains, principalement à Antananarivo et dans ses environs. Comme beaucoup, nous avons fait face aux réalités du foncier malgache : procédures complexes, informations contradictoires, risques juridiques, lenteurs administratives… mais aussi de bonnes opportunités lorsqu’on est bien informé.
            </p>
            <p>
              C’est à partir de ces expériences concrètes que nous avons décidé de partager, expliquer et sensibiliser.
            </p>
            <p>
              À travers notre page Facebook et notre site web dédiée au foncier à Madagascar, nous partageons :
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>des retours d’expérience réels,</li>
              <li>des leçons tirées de réussites comme d’erreurs,</li>
              <li>des conseils pratiques basés sur ce que nous avons vécu,</li>
              <li>des explications simples sur les démarches foncières (titre, bornage, mutation, etc.).</li>
            </ul>
            <p>
              En parallèle, nous proposons à la vente des terrains que nous connaissons directement, situés à Antananarivo et alentours, avec une priorité donnée à la clarté de la situation foncière et à la transparence vis-à-vis des acheteurs.
            </p>
            <p>
              Notre objectif n’est pas de promettre l’impossible, mais de :
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>👉 partager une expérience utile,</li>
              <li>👉 aider à éviter les erreurs courantes,</li>
              <li>👉 favoriser des transactions foncières plus sûres et plus réfléchies à Madagascar.</li>
            </ul>
          </div>
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
