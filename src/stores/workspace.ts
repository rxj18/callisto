import { create } from "zustand";
import { IRequest } from "@/types/config";

export interface ResponseData {
  status: number;
  statusText: string;
  data: string;
  headers: Record<string, string>;
  time: number; // in milliseconds
  size: number; // in bytes
}

interface IWorkspaceState {
  selectedRequest: IRequest | null;
  workspaceId: string | null;
  collectionId: string | null;
  
  // Request data
  requestName: string;
  method: string;
  url: string;
  params: Array<{ id: string; enabled: boolean; key: string; value: string }>;
  headers: Array<{ id: string; enabled: boolean; key: string; value: string; preset?: boolean }>;
  body: string;
  bodyType: "none" | "form-data" | "x-www-form-urlencoded" | "raw" | "binary";
  
  // Response data
  response: ResponseData | null;
  isLoading: boolean;
  
  // Actions
  setSelectedRequest: (request: IRequest | null, workspaceId: string | null, collectionId: string | null) => void;
  setRequestName: (name: string) => void;
  setMethod: (method: string) => void;
  setUrl: (url: string) => void;
  setParams: (params: Array<{ id: string; enabled: boolean; key: string; value: string }>) => void;
  setHeaders: (headers: Array<{ id: string; enabled: boolean; key: string; value: string; preset?: boolean }>) => void;
  setBody: (body: string) => void;
  setBodyType: (bodyType: "none" | "form-data" | "x-www-form-urlencoded" | "raw" | "binary") => void;
  setResponse: (response: ResponseData | null) => void;
  setIsLoading: (loading: boolean) => void;
  resetWorkspace: () => void;
}

const initialState = {
  selectedRequest: null,
  workspaceId: null,
  collectionId: null,
  requestName: "",
  method: "GET",
  url: "",
  params: [],
  headers: [
    {
      id: "user-agent",
      enabled: true,
      key: "User-Agent",
      value: "Callisto/0.1.0",
      preset: true,
    },
    {
      id: "accept",
      enabled: true,
      key: "Accept",
      value: "*/*",
      preset: true,
    },
    {
      id: "accept-encoding",
      enabled: true,
      key: "Accept-Encoding",
      value: "gzip, deflate, br",
      preset: true,
    },
    {
      id: "connection",
      enabled: true,
      key: "Connection",
      value: "keep-alive",
      preset: true,
    },
  ],
  body: "",
  bodyType: "raw" as const,
  response: null,
  isLoading: false,
};

export const useWorkspaceStore = create<IWorkspaceState>((set) => ({
  ...initialState,

  setSelectedRequest: (request, workspaceId, collectionId) => {
    if (!request) {
      set(initialState);
      return;
    }

    // Parse request data and populate workspace
    const parsedUrl = parseCurlForUrl(request.curl);
    const parsedParams = parseCurlForParams(request.curl);
    const parsedHeaders = parseCurlForHeaders(request.curl);
    const parsedBody = parseCurlForBody(request.curl);

    // Always include preset headers, merging with parsed headers
    const presetHeaders = initialState.headers;
    let mergedHeaders = [...presetHeaders];
    
    if (parsedHeaders.length > 0) {
      // Update preset headers if they exist in parsed headers
      parsedHeaders.forEach(parsed => {
        const presetIndex = mergedHeaders.findIndex(
          h => h.preset && h.key.toLowerCase() === parsed.key.toLowerCase()
        );
        
        if (presetIndex >= 0) {
          // Update the preset header's value
          mergedHeaders[presetIndex] = {
            ...mergedHeaders[presetIndex],
            value: parsed.value,
            enabled: parsed.enabled,
          };
        } else {
          // Add non-preset header
          mergedHeaders.push({ ...parsed, preset: false });
        }
      });
    }

    set({
      selectedRequest: request,
      workspaceId,
      collectionId,
      requestName: request.name,
      method: request.method || "GET",
      url: parsedUrl,
      params: parsedParams.length > 0 ? parsedParams : [],
      headers: mergedHeaders,
      body: parsedBody,
      bodyType: parsedBody ? "raw" : "none",
    });
  },

  setRequestName: (name) => set({ requestName: name }),
  setMethod: (method) => set({ method }),
  setUrl: (url) => set({ url }),
  setParams: (params) => set({ params }),
  setHeaders: (headers) => set({ headers }),
  setBody: (body) => set({ body }),
  setBodyType: (bodyType) => set({ bodyType }),
  setResponse: (response) => set({ response }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  resetWorkspace: () => set(initialState),
}));

// Helper functions to parse cURL
function parseCurlForUrl(curl: string): string {
  if (!curl) return "";
  
  // Try multiple patterns to extract URL
  // Pattern 1: curl -X METHOD "URL"
  let urlMatch = curl.match(/curl\s+(?:-X\s+\w+\s+)?['"]?(https?:\/\/[^\s'"?]+)/);
  
  // Pattern 2: Just the URL after curl
  if (!urlMatch) {
    urlMatch = curl.match(/https?:\/\/[^\s'"?]+/);
  }
  
  if (urlMatch) {
    const url = urlMatch[0].replace(/^curl\s+(?:-X\s+\w+\s+)?['"]?/, "");
    return url.split("?")[0].replace(/['"]$/, "");
  }
  
  return "";
}

function parseCurlForParams(curl: string): Array<{ id: string; enabled: boolean; key: string; value: string }> {
  if (!curl) return [];
  
  // Extract full URL with query params
  const urlMatch = curl.match(/https?:\/\/[^\s'"]+/);
  if (!urlMatch) return [];
  
  const fullUrl = urlMatch[0].replace(/['"]$/, "");
  const questionMarkIndex = fullUrl.indexOf("?");
  
  if (questionMarkIndex === -1) return [];
  
  const queryString = fullUrl.substring(questionMarkIndex + 1);
  const params: Array<{ id: string; enabled: boolean; key: string; value: string }> = [];
  
  // Split by & and handle each pair
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
}

function parseCurlForHeaders(curl: string): Array<{ id: string; enabled: boolean; key: string; value: string; preset?: boolean }> {
  if (!curl) return [];
  
  const headers: Array<{ id: string; enabled: boolean; key: string; value: string }> = [];
  
  // Match -H or --header flags
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
}

function parseCurlForBody(curl: string): string {
  if (!curl) return "";
  
  // Match -d, --data, --data-raw, or --data-binary flags
  // Handle single quotes, double quotes, and JSON with escaped quotes
  const patterns = [
    /(?:-d|--data(?:-raw|-binary)?)\s+'([^']+)'/,  // Single quotes
    /(?:-d|--data(?:-raw|-binary)?)\s+"([^"]+)"/,  // Double quotes
    /(?:-d|--data(?:-raw|-binary)?)\s+(.+?)(?=\s+-|$)/,  // No quotes, up to next flag or end
  ];
  
  for (const pattern of patterns) {
    const match = curl.match(pattern);
    if (match) {
      let body = match[1];
      // Unescape common escape sequences
      body = body.replace(/\\"/g, '"');
      body = body.replace(/\\'/g, "'");
      body = body.replace(/\\n/g, "\n");
      body = body.replace(/\\t/g, "\t");
      return body;
    }
  }
  
  return "";
}

