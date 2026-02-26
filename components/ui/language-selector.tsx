"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"

export function LanguageSelector() {
  const router = useRouter()
  const pathname = usePathname()

  const switchLanguage = (lang: "mg" | "fr") => {
    const newPath = pathname.replace(/^\/(mg|fr)/, `/${lang}`)
    router.push(newPath)
  }

  const currentLang = /^\/mg/.test(pathname) ? "mg" : /^\/fr/.test(pathname) ? "fr" : "fr"

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={() => switchLanguage("fr")}
        className={`px-2 py-1 rounded ${currentLang === "fr" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
      >
        FR
      </button>
      <button
        onClick={() => switchLanguage("mg")}
        className={`px-2 py-1 rounded ${currentLang === "mg" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
      >
        MG
      </button>
    </div>
  )
}
