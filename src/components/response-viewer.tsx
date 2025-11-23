import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Clock, FileText, Braces } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace";

const ResponseViewer = () => {
  const [copied, setCopied] = useState(false);
  const response = useWorkspaceStore((state) => state.response);
  const [formattedBody, setFormattedBody] = useState<string | null>(null);

  const handleCopyResponse = async () => {
    if (!response) return;
    
    try {
      await navigator.clipboard.writeText(response.data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy response:", error);
    }
  };

  const handleFormatJson = () => {
    if (!response) return;
    
    try {
      const parsed = JSON.parse(response.data);
      const formatted = JSON.stringify(parsed, null, 2);
      setFormattedBody(formatted);
    } catch (error) {
      console.error("Failed to format JSON:", error);
    }
  };

  const isJsonResponse = () => {
    if (!response) return false;
    const contentType = response.headers["content-type"] || "";
    return contentType.includes("application/json") || contentType.includes("application/javascript");
  };

  const displayBody = formattedBody || response?.data || "";

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getStatusColor = (status: number): string => {
    if (status >= 200 && status < 300) return "text-green-500";
    if (status >= 300 && status < 400) return "text-blue-500";
    if (status >= 400 && status < 500) return "text-yellow-500";
    if (status >= 500) return "text-red-500";
    return "text-gray-500";
  };

  // No response state
  if (!response) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground">
        <FileText className="h-16 w-16 mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">No Response Yet</h3>
        <p className="text-sm">Send a request to see the response here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Response Metrics Bar */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${getStatusColor(response.status)}`}>
              {response.status} {response.statusText}
            </span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{response.time}ms</span>
          </div>

          {/* Size */}
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{formatBytes(response.size)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isJsonResponse() && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleFormatJson}
              title="Format JSON"
              className="h-8"
            >
              <Braces className="h-4 w-4 mr-1" />
              Format
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyResponse}
            title="Copy Response"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Response Content Tabs */}
      <Tabs defaultValue="body" className="flex-1 min-h-0">
        <TabsList className="w-full">
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
        </TabsList>

        {/* Body Tab - Parsed/Pretty */}
        <TabsContent
          value="body"
          forceMount
          className="h-full overflow-hidden m-0 p-0 data-[state=inactive]:hidden"
        >
          <div className="h-full overflow-auto p-4 font-mono text-sm whitespace-pre-wrap break-all">
            {displayBody}
          </div>
        </TabsContent>

        {/* Headers Tab */}
        <TabsContent
          value="headers"
          forceMount
          className="h-full overflow-y-auto m-0 p-4 data-[state=inactive]:hidden"
        >
          <div className="space-y-2">
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key} className="grid grid-cols-[200px_1fr] gap-4 text-sm">
                <span className="font-semibold text-muted-foreground">{key}:</span>
                <span className="break-all">{value}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResponseViewer;

