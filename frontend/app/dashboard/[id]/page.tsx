'use client'
import ChatComponent from "@/components/ChatComponent"
import DocumentUpload from "@/components/DocumentUpload"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useParams } from "next/navigation"

export default function ResizableDemo() {
    const params = useParams();
    const id = params.id
  return (
    <div className="flex-1 h-[calc(100vh-65px)] ">

    <ResizablePanelGroup
      direction="horizontal"
      className="" >
      <ResizablePanel defaultSize={25}>
        <div className="flex h-full items-center justify-center p-6">
          {/* // create a form to upload the pdf using react query to /backend/api/upload  */}
          <DocumentUpload id={id}/>
        </div>
      </ResizablePanel >
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75}>

        <ChatComponent />
    
      </ResizablePanel>
    </ResizablePanelGroup>
        </div>
  )
}
