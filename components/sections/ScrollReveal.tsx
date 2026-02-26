"use client"

import * as React from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

export function ScrollReveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode
  delay?: number
}) {
  const ref = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    if (!ref.current) return

    const ctx = gsap.context(() => {
      gsap.set(ref.current, { opacity: 1, x: 0, y: 0 })
      gsap.from(ref.current, {
        opacity: 0,
        y: 40,
        duration: 0.7,
        delay,
        immediateRender: false,
        clearProps: "opacity,transform",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
        },
      })
    }, ref)

    return () => {
      ctx.revert()
    }
  }, [delay])

  return <div ref={ref}>{children}</div>
}
