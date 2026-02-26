"use client"

import * as React from "react"

export function FacebookEmbed({ pageUrl, height }: { pageUrl: string; height: number }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const src = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(
    pageUrl,
  )}&tabs=timeline&width=500&height=${height}&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId=`

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <div className="w-full overflow-hidden rounded-xl border bg-card">
        <div className="relative w-full" style={{ height }}>
          <iframe
            title="Facebook"
            src={src}
            width="100%"
            height={height}
            style={{ border: "none", overflow: "hidden" }}
            scrolling="no"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          />
        </div>
      </div>
    </div>
  )
}
