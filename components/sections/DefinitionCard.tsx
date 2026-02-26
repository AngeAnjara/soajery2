import { Book } from "lucide-react"

import type { DefinitionDTO } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DefinitionCard({ definition }: { definition: DefinitionDTO }) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">{definition.title}</CardTitle>
          <Badge variant="outline">
            <Book className="mr-2 h-3.5 w-3.5" />
            Définition
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{definition.content}</CardContent>
    </Card>
  )
}
