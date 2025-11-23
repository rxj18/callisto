import "./App.css";
import { lazy, Suspense } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { AppSidebar } from "./components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";

// Lazy load heavy components
const Workspace = lazy(() => import("./components/workspace"));
const ResponseViewer = lazy(() => import("./components/response-viewer"));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function App() {
  return (
    <div className="w-full h-screen">
      <Toaster />
      <ResizablePanelGroup
        direction="horizontal"
        className="w-full border h-full"
      >

        {/* Left Sidebar */}
        <ResizablePanel defaultSize={15} minSize={15} maxSize={50}>
          <AppSidebar />
        </ResizablePanel>
        <ResizableHandle />

        {/* Right Panel */}
        <ResizablePanel defaultSize={80}>

          {/* Main workarea */}
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={70} minSize={20} maxSize={80} className="p-3">
              <Suspense fallback={<LoadingFallback />}>
                <Workspace />
              </Suspense>
            </ResizablePanel>
            <ResizableHandle />

            {/* Response area */}
            <ResizablePanel defaultSize={30} minSize={10} maxSize={80}>
              <Suspense fallback={<LoadingFallback />}>
                <ResponseViewer />
              </Suspense>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

      </ResizablePanelGroup>
    </div>
  );
}

export default App;
