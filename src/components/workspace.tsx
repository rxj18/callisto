import { useEffect, useState, lazy, Suspense } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Lazy load heavy tab components
const WorkspaceBody = lazy(() => import("./workspace-body"));
const WorkspaceParams = lazy(() => import("./workspace-params"));
const WorkspaceHeaders = lazy(() => import("./workspace-headers"));
const WorkspaceAuth = lazy(() => import("./workspace-auth"));
const WorkspaceEnvironment = lazy(() => import("./workspace-environment"));
import { useWorkspaceStore } from "@/stores/workspace";
import { useEnvironmentStore, replaceEnvironmentVariables, checkAllMissingVariables, findVariableReferences } from "@/stores/environment";
import { useConfigStore } from "@/stores/config";
import { IEnvironment } from "@/types/config";
import { invoke } from "@tauri-apps/api/core";
import { FileQuestion, Copy, Check, X, Globe, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Loading fallback for lazy-loaded components
function TabLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

const Workspace = () => {
  const selectedRequest = useWorkspaceStore((state) => state.selectedRequest);
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);
  const collectionId = useWorkspaceStore((state) => state.collectionId);
  const requestName = useWorkspaceStore((state) => state.requestName);
  const method = useWorkspaceStore((state) => state.method);
  const url = useWorkspaceStore((state) => state.url);
  const params = useWorkspaceStore((state) => state.params);
  const headers = useWorkspaceStore((state) => state.headers);
  const body = useWorkspaceStore((state) => state.body);
  const bodyType = useWorkspaceStore((state) => state.bodyType);
  const isLoading = useWorkspaceStore((state) => state.isLoading);
  
  const setRequestName = useWorkspaceStore((state) => state.setRequestName);
  const setMethod = useWorkspaceStore((state) => state.setMethod);
  const setUrl = useWorkspaceStore((state) => state.setUrl);
  const setParams = useWorkspaceStore((state) => state.setParams);
  const setHeaders = useWorkspaceStore((state) => state.setHeaders);
  const setBody = useWorkspaceStore((state) => state.setBody);
  const setBodyType = useWorkspaceStore((state) => state.setBodyType);
  const setResponse = useWorkspaceStore((state) => state.setResponse);
  const setIsLoading = useWorkspaceStore((state) => state.setIsLoading);

  // Environment store
  const selectedEnvironmentId = useEnvironmentStore((state) => state.selectedEnvironmentId);
  const setSelectedEnvironment = useEnvironmentStore((state) => state.setSelectedEnvironment);
  const editingEnvironment = useEnvironmentStore((state) => state.editingEnvironment);
  const isCreatingEnvironment = useEnvironmentStore((state) => state.isCreatingEnvironment);
  const resetEnvironmentEditor = useEnvironmentStore((state) => state.resetEnvironmentEditor);
  
  // Config store
  const config = useConfigStore((state) => state.config);
  const environments = config?.environments || [];
  const selectedEnvironment = environments.find((env: IEnvironment) => env.id === selectedEnvironmentId);

  const [copiedCurl, setCopiedCurl] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Check for missing environment variables
  const envVariables = selectedEnvironment?.variables || [];
  const missingVariables = checkAllMissingVariables(
    url,
    params,
    headers,
    body,
    envVariables
  );
  const hasMissingVariables = missingVariables.length > 0;
  
  // Check if URL specifically has missing variables
  const urlVariables = findVariableReferences(url);
  const urlMissingVariables = urlVariables.filter(
    v => !envVariables.some((ev: { key: string; value: string }) => ev.key === v)
  );
  const urlHasMissingVars = urlMissingVariables.length > 0;

  // Build cURL from current state
  const buildCurl = (): string => {
    let curl = `curl -X ${method}`;

    // Add headers
    const enabledHeaders = headers.filter((h) => h.enabled && h.key && h.value);
    enabledHeaders.forEach((header) => {
      curl += ` -H "${header.key}: ${header.value}"`;
    });

    // Build URL with params
    let fullUrl = url || "";
    const enabledParams = params.filter((p) => p.enabled && p.key);
    if (enabledParams.length > 0) {
      const queryString = enabledParams
        .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
        .join("&");
      fullUrl += `?${queryString}`;
    }
    curl += ` "${fullUrl}"`;

    // Add body if present
    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      curl += ` -d '${body}'`;
    }

    return curl;
  };

  // Save request handler
  const handleSaveRequest = async () => {
    if (!selectedRequest || !workspaceId || !collectionId) {
      toast.warning("No request selected to save");
      return;
    }

    try {
      const curl = buildCurl();
      
      await invoke("update_request", {
        workspaceId,
        collectionId,
        requestId: selectedRequest.id,
        requestName,
        requestType: selectedRequest.req_type,
        method,
        curl,
      });

      toast.success("Request saved successfully", {
        description: `${method} ${requestName}`,
      });
    } catch (error) {
      console.error("❌ Failed to save request:", error);
      toast.error("Failed to save request", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Copy cURL to clipboard
  const handleCopyCurl = async () => {
    try {
      const curl = buildCurl();
      await navigator.clipboard.writeText(curl);
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } catch (error) {
      console.error("Failed to copy cURL:", error);
    }
  };

  // Cancel request
  const handleCancelRequest = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
    }
  };

  // Send HTTP request
  const handleSendRequest = async () => {
    if (!url.trim()) {
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setIsLoading(true);
    setResponse(null);

    try {
      // Get environment variables for replacement
      const envVariables = selectedEnvironment?.variables || [];
      
      // Replace environment variables in URL
      let processedUrl = replaceEnvironmentVariables(url, envVariables);
      
      // Build request headers with environment variable replacement
      const requestHeaders: Record<string, string> = {};
      headers
        .filter((h) => h.enabled && h.key && h.value)
        .forEach((h) => {
          const processedKey = replaceEnvironmentVariables(h.key, envVariables);
          const processedValue = replaceEnvironmentVariables(h.value, envVariables);
          requestHeaders[processedKey] = processedValue;
        });

      // Build full URL with query params (with environment variable replacement)
      let fullUrl = processedUrl;
      const enabledParams = params.filter((p) => p.enabled && p.key);
      if (enabledParams.length > 0) {
        const queryString = enabledParams
          .map((p) => {
            const processedKey = replaceEnvironmentVariables(p.key, envVariables);
            const processedValue = replaceEnvironmentVariables(p.value, envVariables);
            return `${encodeURIComponent(processedKey)}=${encodeURIComponent(processedValue)}`;
          })
          .join("&");
        fullUrl += (processedUrl.includes("?") ? "&" : "?") + queryString;
      }

      // Prepare request body based on bodyType (with environment variable replacement)
      let requestBody: string | null = null;
      if (bodyType === "raw" && body) {
        requestBody = replaceEnvironmentVariables(body, envVariables);
      } else if (bodyType === "form-data" || bodyType === "x-www-form-urlencoded") {
        // TODO: Handle form data from KeyValueTable
        // For now, we'll leave it null
        requestBody = null;
      }

      // Send request to Rust backend
      const response = await invoke<{
        status: number;
        status_text: string;
        headers: Record<string, string>;
        body: string;
        time: number;
        size: number;
      }>("send_http_request", {
        request: {
          method,
          url: fullUrl,
          headers: requestHeaders,
          body: requestBody,
        },
      });

      // Update response state
      setResponse({
        status: response.status,
        statusText: response.status_text,
        data: response.body,
        headers: response.headers,
        time: response.time,
        size: response.size,
      });

      // Check if request was aborted
      if (controller.signal.aborted) {
        return;
      }
    } catch (error) {
      // Check if request was aborted
      if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) {
        return;
      }

      console.error("Failed to send request:", error);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
        setAbortController(null);
      }
    }
  };

  // Keyboard shortcut for saving (Cmd+S or Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSaveRequest();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedRequest, workspaceId, collectionId, requestName, method, url, params, headers, body]);

  // cURL Parser Functions
  const parseCurlUrl = (curl: string): string => {
    const urlMatch = curl.match(/https?:\/\/[^\s'"?]+/);
    if (urlMatch) {
      return urlMatch[0].split("?")[0].replace(/['"]$/, "");
    }
    return "";
  };

  const parseCurlMethod = (curl: string): string => {
    const methodMatch = curl.match(/-X\s+(\w+)/);
    return methodMatch ? methodMatch[1].toUpperCase() : "GET";
  };

  const parseCurlParams = (curl: string): Array<{ id: string; enabled: boolean; key: string; value: string }> => {
    const urlMatch = curl.match(/https?:\/\/[^\s'"]+/);
    if (!urlMatch) return [];
    
    const fullUrl = urlMatch[0].replace(/['"]$/, "");
    const questionMarkIndex = fullUrl.indexOf("?");
    if (questionMarkIndex === -1) return [];
    
    const queryString = fullUrl.substring(questionMarkIndex + 1);
    const params: Array<{ id: string; enabled: boolean; key: string; value: string }> = [];
    
    queryString.split("&").forEach((pair) => {
      const equalIndex = pair.indexOf("=");
      if (equalIndex > 0) {
        const key = pair.substring(0, equalIndex);
        const value = pair.substring(equalIndex + 1);
        params.push({
          id: Date.now().toString() + Math.random(),
          enabled: true,
          key: decodeURIComponent(key),
          value: decodeURIComponent(value),
        });
      }
    });
    
    return params;
  };

  const parseCurlHeaders = (curl: string): Array<{ id: string; enabled: boolean; key: string; value: string; preset?: boolean }> => {
    const headers: Array<{ id: string; enabled: boolean; key: string; value: string }> = [];
    const headerRegex = /(?:-H|--header)\s+['"]([^:]+):\s*([^'"]+)['"]/g;
    let match;
    
    while ((match = headerRegex.exec(curl)) !== null) {
      headers.push({
        id: Date.now().toString() + Math.random(),
        enabled: true,
        key: match[1].trim(),
        value: match[2].trim(),
      });
    }
    
    return headers;
  };

  const parseCurlBody = (curl: string): string => {
    const patterns = [
      /(?:-d|--data(?:-raw|-binary)?)\s+'([^']+)'/,
      /(?:-d|--data(?:-raw|-binary)?)\s+"([^"]+)"/,
      /(?:-d|--data(?:-raw|-binary)?)\s+(.+?)(?=\s+-|$)/,
    ];
    
    for (const pattern of patterns) {
      const match = curl.match(pattern);
      if (match) {
        let body = match[1];
        body = body.replace(/\\"/g, '"');
        body = body.replace(/\\'/g, "'");
        body = body.replace(/\\n/g, "\n");
        body = body.replace(/\\t/g, "\t");
        return body;
      }
    }
    
    return "";
  };

  // Show Environment Editor if creating or editing
  if (isCreatingEnvironment || editingEnvironment) {
    return (
      <Suspense fallback={<TabLoadingFallback />}>
        <WorkspaceEnvironment
          environmentId={editingEnvironment?.id}
          initialName={editingEnvironment?.name || ""}
          initialVariables={editingEnvironment?.variables || []}
          onClose={resetEnvironmentEditor}
        />
      </Suspense>
    );
  }

  // Show "No Request Selected" state
  if (!selectedRequest) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground">
        <FileQuestion className="h-16 w-16 mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">No Request Selected</h3>
        <p className="text-sm">Select a request from the sidebar to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Request Name and Environment Selector */}
      <div className="flex items-center justify-between gap-4 mb-7">
        <input
          type="text"
          className="border-none flex-1 focus:outline-none text-4xl font-bold"
          placeholder="Untitled Request"
          value={requestName}
          onChange={(e) => setRequestName(e.target.value)}
        />
        
        {/* Environment Selector */}
        <Select
          value={selectedEnvironmentId || "no-environment"}
          onValueChange={(value) => setSelectedEnvironment(value === "no-environment" ? null : value)}
        >
          <SelectTrigger className="w-[200px]">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <SelectValue placeholder="No Environment" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-environment">
              <span className="text-muted-foreground">No Environment</span>
            </SelectItem>
            {environments.map((env: IEnvironment) => (
              <SelectItem key={env.id} value={env.id}>
                {env.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Request Bar */}
      <div className="flex items-start justify-between w-full mb-3">
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger className="w-[140px] rounded-r-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="PATCH">PATCH</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
              <SelectItem value="HEAD">HEAD</SelectItem>
              <SelectItem value="OPTIONS">OPTIONS</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Input
          placeholder="Enter URL or paste cURL"
          className={cn(
            "rounded-none flex-1 border-l-0 border-r-0",
            urlHasMissingVars && "border-destructive border-2 focus-visible:ring-destructive"
          )}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onPaste={(e) => {
            const pastedText = e.clipboardData.getData("text");
            
            // Check if it's a cURL command
            if (pastedText.trim().startsWith("curl")) {
              e.preventDefault();
              
              // Import parser functions
              const parsedUrl = parseCurlUrl(pastedText);
              const parsedParams = parseCurlParams(pastedText);
              const parsedHeaders = parseCurlHeaders(pastedText);
              const parsedBody = parseCurlBody(pastedText);
              const parsedMethod = parseCurlMethod(pastedText);
              
              // Update state
              if (parsedUrl) setUrl(parsedUrl);
              if (parsedMethod) setMethod(parsedMethod);
              if (parsedParams.length > 0) setParams(parsedParams);
              if (parsedHeaders.length > 0) setHeaders(parsedHeaders);
              if (parsedBody) {
                setBody(parsedBody);
                setBodyType("raw");
              }
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isLoading) {
              handleSendRequest();
            }
          }}
        />
        {isLoading ? (
          <Button 
            className="rounded-l-none" 
            variant="destructive"
            onClick={handleCancelRequest}
          >
            <X className="h-4 w-4 mr-2" />
            CANCEL
          </Button>
        ) : (
          <TooltipProvider>
            <Tooltip open={hasMissingVariables ? undefined : false}>
              <TooltipTrigger asChild>
                <Button 
                  className="rounded-l-none" 
                  onClick={handleSendRequest}
                  disabled={hasMissingVariables}
                >
                  {hasMissingVariables && (
                    <AlertCircle className="h-4 w-4 mr-2" />
                  )}
                  SEND
                </Button>
              </TooltipTrigger>
              {hasMissingVariables && (
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-semibold">Missing Environment Variables</p>
                    <p className="text-xs">
                      The following variables are not defined in the selected environment:
                    </p>
                    <ul className="text-xs list-disc list-inside">
                      {missingVariables.map((v) => (
                        <li key={v} className="text-destructive font-mono">{`{{${v}}}`}</li>
                      ))}
                    </ul>
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Tabs - flex-1 makes it fill remaining space */}
      <Tabs defaultValue="body" className="flex-1 min-h-0 gap-2">
        <TabsList className="w-full">
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="params">Params</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="auth">Auth</TabsTrigger>
          <TabsTrigger value="curl">CURL</TabsTrigger>
        </TabsList>

        {/* Tab content area - fills remaining space with scroll */}
        <TabsContent
          value="body"
          forceMount
          className="h-full overflow-y-auto border rounded-md m-0 p-0 data-[state=inactive]:hidden"
        >
          <Suspense fallback={<TabLoadingFallback />}>
            <WorkspaceBody />
          </Suspense>
        </TabsContent>
        <TabsContent
          value="params"
          forceMount
          className="h-full overflow-y-auto border rounded-md m-0 p-0 data-[state=inactive]:hidden"
        >
          <Suspense fallback={<TabLoadingFallback />}>
            <WorkspaceParams />
          </Suspense>
        </TabsContent>
        <TabsContent
          value="headers"
          forceMount
          className="h-full overflow-y-auto border rounded-md m-0 p-0 data-[state=inactive]:hidden"
        >
          <Suspense fallback={<TabLoadingFallback />}>
            <WorkspaceHeaders />
          </Suspense>
        </TabsContent>
        <TabsContent
          value="auth"
          forceMount
          className="h-full overflow-y-auto border rounded-md m-0 p-0 data-[state=inactive]:hidden"
        >
          <Suspense fallback={<TabLoadingFallback />}>
            <WorkspaceAuth />
          </Suspense>
        </TabsContent>
        <TabsContent
          value="curl"
          forceMount
          className="h-full overflow-y-auto border rounded-md m-0 p-0 data-[state=inactive]:hidden"
        >
          <div className="relative h-full">
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyCurl}
                title="Copy cURL"
              >
                {copiedCurl ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="p-4 font-mono text-sm whitespace-pre-wrap break-all">
              {buildCurl()}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Workspace;
