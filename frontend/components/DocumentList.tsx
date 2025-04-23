'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { useState } from "react"

type Document = {
    id: string
    originalName: string
    url: string
}

interface DocumentAccordionProps {
    documents: Document[]
    setpfdUrl: (url: string) => void
}

export default function DocumentAccordion({ documents, setpfdUrl }: DocumentAccordionProps) {
    const [open, setOpen] = useState(false)


    return (
        <div className="max-w-3xl mx-auto ">
  

            <Accordion type="single" collapsible value={open ? "item-1" : ""} onValueChange={(v) => setOpen(v === "item-1")}>
                <AccordionItem value="item-1">
                    <AccordionTrigger>Show/Hide context</AccordionTrigger>
                    <AccordionContent>
                        <ul className="list-disc pl-4 space-y-2">
                            {documents?.map((doc) => (
                                <li key={doc.id}>
                                    <span onClick={() => setpfdUrl(doc.url)}
                                        className="text-blue-600 hover:underline"
                                    >
                                        {doc.originalName}

                                    </span>

                                </li>
                            ))}
                        </ul>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}
