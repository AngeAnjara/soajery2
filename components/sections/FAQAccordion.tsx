"use client"

import * as Accordion from "@radix-ui/react-accordion"

import type { FAQDTO } from "@/types"

import { cn } from "@/lib/utils"

export function FAQAccordion({ faqs }: { faqs: FAQDTO[] }) {
  return (
    <Accordion.Root type="multiple" className="w-full">
      {faqs.map((f) => (
        <Accordion.Item key={f._id} value={f._id} className="border-b">
          <Accordion.Header>
            <Accordion.Trigger
              className={cn(
                "flex w-full items-center justify-between py-4 text-left text-sm font-medium transition-colors hover:text-foreground",
              )}
            >
              {f.question}
              <span className="text-muted-foreground">+</span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="pb-4 text-sm text-muted-foreground">{f.answer}</Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  )
}
