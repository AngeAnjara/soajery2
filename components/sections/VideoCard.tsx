import Image from "next/image"

import { PlayCircle } from "lucide-react"

import type { VideoDTO } from "@/types"

export function VideoCard({ video }: { video: VideoDTO }) {
  return (
    <a
      href={video.facebookUrl}
      target="_blank"
      rel="noreferrer"
      className="group block overflow-hidden rounded-lg border bg-card"
    >
      <div className="relative">
        <Image
          src={video.thumbnail}
          alt={video.title}
          width={800}
          height={450}
          className="h-auto w-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="rounded-full bg-background/70 p-3">
            <PlayCircle className="h-8 w-8" />
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="font-medium">{video.title}</div>
      </div>
    </a>
  )
}
