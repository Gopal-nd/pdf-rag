import DocumentUpload from "@/components/DocumentUpload"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export default function ResizableDemo() {
  return (
    <div className="flex-1 h-[calc(100vh-65px)] ">

    <ResizablePanelGroup
      direction="horizontal"
      className="" >
      <ResizablePanel defaultSize={25}>
        <div className="flex h-full items-center justify-center p-6">
          {/* // create a form to upload the pdf using react query to /backend/api/upload  */}
          <DocumentUpload />
        </div>
      </ResizablePanel >
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75}>
        <div className="flex h-full items-center justify-center p-6">
          <span className="font-semibold">Content</span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
        </div>
  )
}
