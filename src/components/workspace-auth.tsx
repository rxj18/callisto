import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldOff, Key, Lock, Shield, Globe } from "lucide-react";

type AuthType = "no-auth" | "bearer-token" | "basic-auth" | "api-key";

const WorkspaceAuth = () => {
  const [authType, setAuthType] = useState<AuthType>("no-auth");
  const [bearerToken, setBearerToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [apiKeyKey, setApiKeyKey] = useState("");
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [apiKeyLocation, setApiKeyLocation] = useState<"header" | "query">("header");

  const authTypes = [
    { value: "no-auth", label: "No Auth", icon: ShieldOff, description: "Request has no authorization" },
    { value: "bearer-token", label: "Bearer Token", icon: Key, description: "Authorization via token" },
    { value: "basic-auth", label: "Basic Auth", icon: Lock, description: "Username and password" },
    { value: "api-key", label: "API Key", icon: Shield, description: "Custom API key" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Auth Type Selector - Sticky Header */}
      <div className="bg-muted/30 border-b p-4">
        <Label className="text-sm font-semibold mb-2 block">Authorization Type</Label>
        <Select value={authType} onValueChange={(val) => setAuthType(val as AuthType)}>
          <SelectTrigger className="w-full bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {authTypes.map((type) => {
              const Icon = type.icon;
              return (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Auth Configuration Area */}
      <div className="flex-1 overflow-y-auto p-6">{renderAuthContent()}</div>
    </div>
  );

  function renderAuthContent() {
    switch (authType) {
      case "no-auth":
        return (
          <div className="grid grid-cols-[1fr_2fr] gap-8 h-full">
            {/* Left: Description */}
            <div className="space-y-4 pr-6 border-r">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted/30">
                  <ShieldOff className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">No Auth</h3>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  This request will be sent without any authentication credentials.
                </p>
                <p>
                  Use this option when:
                </p>
                <ul className="space-y-1 text-xs list-disc list-inside">
                  <li>The API endpoint is public</li>
                  <li>Authentication is handled elsewhere</li>
                  <li>Testing without credentials</li>
                </ul>
              </div>
            </div>

            {/* Right: Empty state */}
            <div className="flex items-center justify-center text-center">
              <div className="space-y-2 text-muted-foreground">
                <p className="text-sm">No configuration required</p>
                <p className="text-xs">Request will be sent without authorization headers</p>
              </div>
            </div>
          </div>
        );

      case "bearer-token":
        return (
          <div className="grid grid-cols-[1fr_2fr] gap-8 h-full">
            {/* Left: Description */}
            <div className="space-y-4 pr-6 border-r">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Bearer Token</h3>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Bearer token authentication is used to access protected resources by including a token in the Authorization header.
                </p>
                <p>
                  The token will be sent as:
                </p>
                <code className="block px-3 py-2 bg-muted rounded text-xs font-mono">
                  Authorization: Bearer {"<your-token>"}
                </code>
                <p className="text-xs">
                  This is commonly used with OAuth 2.0, JWT tokens, and API keys.
                </p>
              </div>
            </div>

            {/* Right: Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bearer-token" className="text-sm font-medium">
                  Token
                </Label>
                <Input
                  id="bearer-token"
                  type="password"
                  placeholder="Enter your bearer token"
                  value={bearerToken}
                  onChange={(e) => setBearerToken(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>
        );

      case "basic-auth":
        return (
          <div className="grid grid-cols-[1fr_2fr] gap-8 h-full">
            {/* Left: Description */}
            <div className="space-y-4 pr-6 border-r">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Basic Auth</h3>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Basic authentication is a simple method that sends credentials with each request.
                </p>
                <p>
                  Your credentials will be Base64 encoded and sent as:
                </p>
                <code className="block px-3 py-2 bg-muted rounded text-xs font-mono break-all">
                  Authorization: Basic {"<base64(username:password)>"}
                </code>
                <p className="text-xs">
                  Note: Use HTTPS to ensure credentials are transmitted securely.
                </p>
              </div>
            </div>

            {/* Right: Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>
          </div>
        );

      case "api-key":
        return (
          <div className="grid grid-cols-[1fr_2fr] gap-8 h-full">
            {/* Left: Description */}
            <div className="space-y-4 pr-6 border-r">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">API Key</h3>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  API Key authentication allows you to pass an API key in your request headers or query parameters.
                </p>
                <p>
                  Common use cases:
                </p>
                <ul className="space-y-1 text-xs list-disc list-inside">
                  <li>REST API authentication</li>
                  <li>Third-party service integration</li>
                  <li>Simple token-based access</li>
                </ul>
                <p className="text-xs">
                  Example: <code className="px-1.5 py-0.5 bg-muted rounded">X-API-Key: your_key_here</code>
                </p>
              </div>
            </div>

            {/* Right: Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key-key" className="text-sm font-medium">
                  Key Name
                </Label>
                <Input
                  id="api-key-key"
                  placeholder="e.g., X-API-Key, api_key, apikey"
                  value={apiKeyKey}
                  onChange={(e) => setApiKeyKey(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Common names: X-API-Key, Authorization, api_key
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key-value" className="text-sm font-medium">
                  Key Value
                </Label>
                <Input
                  id="api-key-value"
                  type="password"
                  placeholder="Enter your API key"
                  value={apiKeyValue}
                  onChange={(e) => setApiKeyValue(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Add to</Label>
                <Select value={apiKeyLocation} onValueChange={(val) => setApiKeyLocation(val as "header" | "query")}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="header">Request Headers</SelectItem>
                    <SelectItem value="query">Query Parameters</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {apiKeyLocation === "header" ? "Added to HTTP request headers" : "Added to URL query string"}
                </p>
              </div>
            </div>
          </div>
        );
        return (
          <div className="grid grid-cols-[1fr_2fr] gap-8 h-full">
            {/* Left: Description */}
            <div className="space-y-4 pr-6 border-r">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">OAuth 2.0</h3>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  OAuth 2.0 is an authorization framework that enables secure delegated access.
                </p>
                <p>
                  Supported grant types will include:
                </p>
                <ul className="space-y-1 text-xs list-disc list-inside">
                  <li>Authorization Code</li>
                  <li>Implicit Flow</li>
                  <li>Client Credentials</li>
                  <li>Resource Owner Password</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }
};

export default WorkspaceAuth;

