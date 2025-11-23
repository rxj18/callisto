import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Layers,
  Pencil,
  FolderPlus,
  Network,
  Code2,
  Globe,
  Trash2,
  Settings,
} from "lucide-react";
import { useState, useEffect } from "react";
import { ThemeSwitcher } from "./theme-switcher";
import { useConfigStore } from "@/stores/config";
import { useWorkspaceStore } from "@/stores/workspace";
import { useEnvironmentStore } from "@/stores/environment";
import { IRequest, IWorkspace, ICollection, IEnvironment } from "@/types/config";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { invoke } from "@tauri-apps/api/core";

type DialogMode =
  | "main" // Main create menu
  | "new-workspace" // Create new workspace
  | "new-collection" // Create new collection
  | "select-request-type" // Select request type (HTTP/GraphQL/WebSocket)
  | "new-http-request" // Create new HTTP request form
  | "rename-collection"; // Rename collection

type RequestType = "http" | "graphql" | "websocket";

type CreateOption = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function AppSidebar() {
  const config = useConfigStore((state) => state.config);
  const setSelectedRequest = useWorkspaceStore((state) => state.setSelectedRequest);
  const selectedRequestId = useWorkspaceStore((state) => state.selectedRequest?.id);
  
  // Environment store
  const setIsCreatingEnvironment = useEnvironmentStore((state) => state.setIsCreatingEnvironment);
  const setEditingEnvironment = useEnvironmentStore((state) => state.setEditingEnvironment);
  
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [openCollections, setOpenCollections] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("main");
  const [showEnvironments, setShowEnvironments] = useState(false);
  
  // Form states
  const [workspaceName, setWorkspaceName] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [renamingCollectionId, setRenamingCollectionId] = useState("");
  const [newCollectionName, setNewCollectionName] = useState("");
  
  // Request creation states
  const [targetCollectionId, setTargetCollectionId] = useState("");
  const [requestType, setRequestType] = useState<RequestType>("http");
  const [requestName, setRequestName] = useState("");
  const [requestMethod, setRequestMethod] = useState("GET");
  const [requestCurl, setRequestCurl] = useState("");
  
  // Delete confirmation states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"workspace" | "collection" | "request" | "environment">("workspace");
  const [deleteIds, setDeleteIds] = useState<{
    workspaceId?: string;
    collectionId?: string;
    requestId?: string;
    environmentId?: string;
  }>({});
  const [deleteItemName, setDeleteItemName] = useState<string>("");

  // Derive selected workspace from config (always up-to-date)
  const selected = config?.workspaces.find((w: IWorkspace) => w.id === selectedWorkspaceId);

  // Update selected workspace ID when config loads
  useEffect(() => {
    if (config && config.workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(config.workspaces[0].id);
    }
  }, [config, selectedWorkspaceId]);

  const mainCreateOptions: CreateOption[] = [
    {
      id: "new-workspace",
      title: "New Workspace",
      description: "Create a new workspace to organize your projects",
      icon: Layers,
    },
    {
      id: "new-collection",
      title: "New Collection",
      description: "Create a new collection in the current workspace",
      icon: FolderPlus,
    },
  ];

  const handleMainMenuSelect = (optionId: string) => {
    setDialogMode(optionId as DialogMode);
  };

  const handleCreateNewEnvironment = () => {
    setIsCreatingEnvironment(true);
    setShowEnvironments(true);
  };

  const handleEditEnvironment = (env: IEnvironment) => {
    setEditingEnvironment({
      id: env.id,
      name: env.name,
      variables: env.variables,
    });
    setShowEnvironments(true);
  };

  const handleDeleteEnvironment = (environmentId: string, environmentName: string) => {
    console.log("Delete environment clicked:", { environmentId, environmentName });
    setDeleteType("environment");
    setDeleteIds({ environmentId });
    setDeleteItemName(environmentName);
    setDeleteDialogOpen(true);
  };

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) return;
    
    try {
      await invoke("add_workspace", { name: workspaceName });
      setWorkspaceName("");
      setDialogOpen(false);
      setDialogMode("main");
    } catch (error) {
      console.error("Failed to create workspace:", error);
    }
  };

  const handleCreateCollection = async () => {
    if (!collectionName.trim() || !selected) return;
    
    try {
      await invoke("create_collection", {
        workspaceId: selected.id,
        collectionName: collectionName,
      });
      setCollectionName("");
      setDialogOpen(false);
      setDialogMode("main");
    } catch (error) {
      console.error("Failed to create collection:", error);
    }
  };

  const handleRenameCollection = async () => {
    if (!newCollectionName.trim() || !selected) return;
    
    try {
      await invoke("rename_collection", {
        workspaceId: selected.id,
        collectionId: renamingCollectionId,
        newName: newCollectionName,
      });
      setNewCollectionName("");
      setRenamingCollectionId("");
      setDialogOpen(false);
      setDialogMode("main");
    } catch (error) {
      console.error("Failed to rename collection:", error);
    }
  };

  const openRenameDialog = (collectionId: string, currentName: string) => {
    setRenamingCollectionId(collectionId);
    setNewCollectionName(currentName);
    setDialogMode("rename-collection");
    setDialogOpen(true);
  };

  // Delete handlers - Open confirmation dialog
  const handleDeleteWorkspace = (workspaceId: string) => {
    console.log("Delete workspace clicked:", workspaceId);
    setDeleteType("workspace");
    setDeleteIds({ workspaceId });
    setDeleteDialogOpen(true);
  };

  const handleDeleteCollection = (workspaceId: string, collectionId: string) => {
    console.log("Delete collection clicked:", { workspaceId, collectionId });
    setDeleteType("collection");
    setDeleteIds({ workspaceId, collectionId });
    setDeleteDialogOpen(true);
  };

  const handleDeleteRequest = (workspaceId: string, collectionId: string, requestId: string) => {
    console.log("Delete request clicked:", { workspaceId, collectionId, requestId });
    setDeleteType("request");
    setDeleteIds({ workspaceId, collectionId, requestId });
    setDeleteDialogOpen(true);
  };

  // Confirm delete - Actually perform the delete
  const confirmDelete = async () => {
    try {
      if (deleteType === "workspace" && deleteIds.workspaceId) {
        console.log("Invoking delete_workspace command...");
        await invoke("delete_workspace", { workspaceId: deleteIds.workspaceId });
        console.log("Workspace deleted successfully");
        
        // Reset selected workspace if it was deleted
        if (selectedWorkspaceId === deleteIds.workspaceId) {
          setSelectedWorkspaceId("");
        }
      } else if (deleteType === "collection" && deleteIds.workspaceId && deleteIds.collectionId) {
        console.log("Invoking delete_collection command...");
        await invoke("delete_collection", {
          workspaceId: deleteIds.workspaceId,
          collectionId: deleteIds.collectionId,
        });
        console.log("Collection deleted successfully");
      } else if (deleteType === "request" && deleteIds.workspaceId && deleteIds.collectionId && deleteIds.requestId) {
        console.log("Invoking delete_request command...");
        await invoke("delete_request", {
          workspaceId: deleteIds.workspaceId,
          collectionId: deleteIds.collectionId,
          requestId: deleteIds.requestId,
        });
        console.log("Request deleted successfully");
        
        // Reset selected request if it was deleted
        if (selectedRequestId === deleteIds.requestId) {
          useWorkspaceStore.getState().resetWorkspace();
        }
      } else if (deleteType === "environment" && deleteIds.environmentId) {
        console.log("Invoking delete_environment command...");
        await invoke("delete_environment", { environmentId: deleteIds.environmentId });
        console.log("Environment deleted successfully");
        
        // Close editor if the deleted environment was being edited
        const currentEditingEnv = useEnvironmentStore.getState().editingEnvironment;
        if (currentEditingEnv?.id === deleteIds.environmentId) {
          useEnvironmentStore.getState().resetEnvironmentEditor();
        }
        
        // Reset selected environment if it was deleted
        const selectedEnvId = useEnvironmentStore.getState().selectedEnvironmentId;
        if (selectedEnvId === deleteIds.environmentId) {
          useEnvironmentStore.getState().setSelectedEnvironment(null);
        }
      }
      
      setDeleteDialogOpen(false);
      setDeleteIds({});
      setDeleteItemName("");
    } catch (error) {
      console.error(`Failed to delete ${deleteType}:`, error);
    }
  };

  const openCreateRequestDialog = (collectionId: string) => {
    setTargetCollectionId(collectionId);
    setDialogMode("select-request-type");
    setDialogOpen(true);
  };

  const handleRequestTypeSelect = (type: RequestType) => {
    setRequestType(type);
    setDialogMode("new-http-request");
  };

  const handleCreateRequest = async () => {
    if (!requestName.trim() || !selected || !targetCollectionId) return;
    
    try {
      await invoke("create_request", {
        workspaceId: selected.id,
        collectionId: targetCollectionId,
        requestName: requestName,
        requestType: requestType,
        method: requestMethod,
        curl: requestCurl,
      });
      resetDialog();
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to create request:", error);
    }
  };

  const handleRequestClick = (request: IRequest, collectionId: string) => {
    if (!selected) return;
    setSelectedRequest(request, selected.id, collectionId);
  };

  const resetDialog = () => {
    setDialogMode("main");
    setWorkspaceName("");
    setCollectionName("");
    setRenamingCollectionId("");
    setNewCollectionName("");
    setTargetCollectionId("");
    setRequestType("http");
    setRequestName("");
    setRequestMethod("GET");
    setRequestCurl("");
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex flex-col h-full w-full bg-sidebar text-sidebar-foreground">
        {/* Header Section */}
        <div className="flex flex-col gap-2 p-2">
          {/* Workspace Selector */}
          <div className="flex justify-between gap-2 w-full">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full flex-1 justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  {selected?.name || "Select Workspace"}
                  <ChevronDown className="ml-auto h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]" align="start">
                {config?.workspaces.map((workspace: IWorkspace) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onSelect={(e) => {
                      // Don't select if clicking delete button
                      const target = e.target as HTMLElement;
                      if (target.closest('[data-delete-button]')) {
                        e.preventDefault();
                        return;
                      }
                      setSelectedWorkspaceId(workspace.id);
                    }}
                    className="flex items-center justify-between group"
                  >
                    <span className="flex-1">{workspace.name}</span>
                    <button
                      data-delete-button
                      className="h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 rounded cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteWorkspace(workspace.id);
                      }}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetDialog();
            }}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                {/* Main Create Menu */}
                {dialogMode === "main" && (
                  <>
                    <DialogHeader>
                      <DialogTitle>Create New</DialogTitle>
                      <DialogDescription>
                        Choose what you'd like to create
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-3 mt-4">
                      {mainCreateOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.id}
                            onClick={() => handleMainMenuSelect(option.id)}
                            className="group flex items-start gap-4 p-4 rounded-lg border-2 transition-all duration-200 text-left border-border hover:border-primary hover:bg-primary/5 cursor-pointer"
                          >
                            <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex flex-col gap-1 flex-1">
                              <h3 className="font-semibold text-sm">{option.title}</h3>
                              <p className="text-xs text-muted-foreground">{option.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* New Workspace Dialog */}
                {dialogMode === "new-workspace" && (
                  <>
                    <DialogHeader>
                      <DialogTitle>Create New Workspace</DialogTitle>
                      <DialogDescription>
                        Workspaces help you organize different projects
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="workspace-name">Workspace Name</Label>
                        <Input
                          id="workspace-name"
                          placeholder="My Project"
                          value={workspaceName}
                          onChange={(e) => setWorkspaceName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleCreateWorkspace()}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setDialogMode("main")}>
                        Back
                      </Button>
                      <Button onClick={handleCreateWorkspace} disabled={!workspaceName.trim()}>
                        Create Workspace
                      </Button>
                    </DialogFooter>
                  </>
                )}

                {/* New Collection Dialog */}
                {dialogMode === "new-collection" && (
                  <>
                    <DialogHeader>
                      <DialogTitle>Create New Collection</DialogTitle>
                      <DialogDescription>
                        Collections group related requests together
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="collection-name">Collection Name</Label>
                        <Input
                          id="collection-name"
                          placeholder="API Endpoints"
                          value={collectionName}
                          onChange={(e) => setCollectionName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleCreateCollection()}
                        />
                      </div>
                      {!selected && (
                        <p className="text-sm text-destructive">Please select a workspace first</p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setDialogMode("main")}>
                        Back
                      </Button>
                      <Button onClick={handleCreateCollection} disabled={!collectionName.trim() || !selected}>
                        Create Collection
                      </Button>
                    </DialogFooter>
                  </>
                )}

                {/* Rename Collection Dialog */}
                {dialogMode === "rename-collection" && (
                  <>
                    <DialogHeader>
                      <DialogTitle>Rename Collection</DialogTitle>
                      <DialogDescription>
                        Enter a new name for this collection
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-collection-name">Collection Name</Label>
                        <Input
                          id="new-collection-name"
                          placeholder="New name"
                          value={newCollectionName}
                          onChange={(e) => setNewCollectionName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleRenameCollection()}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => { setDialogOpen(false); resetDialog(); }}>
                        Cancel
                      </Button>
                      <Button onClick={handleRenameCollection} disabled={!newCollectionName.trim()}>
                        Rename
                      </Button>
                    </DialogFooter>
                  </>
                )}

                {/* Select Request Type Dialog */}
                {dialogMode === "select-request-type" && (
                  <>
                    <DialogHeader>
                      <DialogTitle>Select Request Type</DialogTitle>
                      <DialogDescription>
                        Choose the type of request you want to create
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-3 mt-4">
                      <button
                        onClick={() => handleRequestTypeSelect("http")}
                        className="group flex items-start gap-4 p-4 rounded-lg border-2 transition-all duration-200 text-left border-border hover:border-primary hover:bg-primary/5 cursor-pointer"
                      >
                        <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20">
                          <Globe className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                          <h3 className="font-semibold text-sm">HTTP/REST</h3>
                          <p className="text-xs text-muted-foreground">
                            Create a REST API request with methods like GET, POST, PUT, DELETE
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => handleRequestTypeSelect("graphql")}
                        className="group flex items-start gap-4 p-4 rounded-lg border-2 transition-all duration-200 text-left border-border hover:border-primary hover:bg-primary/5 cursor-pointer"
                      >
                        <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20">
                          <Code2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                          <h3 className="font-semibold text-sm">GraphQL</h3>
                          <p className="text-xs text-muted-foreground">
                            Create a GraphQL query or mutation request
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => handleRequestTypeSelect("websocket")}
                        className="group flex items-start gap-4 p-4 rounded-lg border-2 transition-all duration-200 text-left border-border hover:border-primary hover:bg-primary/5 cursor-pointer"
                      >
                        <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20">
                          <Network className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                          <h3 className="font-semibold text-sm">WebSocket</h3>
                          <p className="text-xs text-muted-foreground">
                            Create a WebSocket connection for real-time communication
                          </p>
                        </div>
                      </button>
                    </div>
                  </>
                )}

                {/* New HTTP Request Dialog */}
                {dialogMode === "new-http-request" && (
                  <>
                    <DialogHeader>
                      <DialogTitle>Create HTTP Request</DialogTitle>
                      <DialogDescription>
                        Configure your HTTP/REST API request
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="request-name">Request Name *</Label>
                        <Input
                          id="request-name"
                          placeholder="Get Users"
                          value={requestName}
                          onChange={(e) => setRequestName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="request-method">HTTP Method *</Label>
                        <Select value={requestMethod} onValueChange={setRequestMethod}>
                          <SelectTrigger id="request-method">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GET">GET</SelectItem>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="PUT">PUT</SelectItem>
                            <SelectItem value="PATCH">PATCH</SelectItem>
                            <SelectItem value="DELETE">DELETE</SelectItem>
                            <SelectItem value="HEAD">HEAD</SelectItem>
                            <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="request-curl">cURL Command (Optional)</Label>
                        <Textarea
                          id="request-curl"
                          placeholder="curl -X GET https://api.example.com/users"
                          value={requestCurl}
                          onChange={(e) => setRequestCurl(e.target.value)}
                          className="font-mono text-sm"
                          rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                          Paste a cURL command to auto-populate the request details
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setDialogMode("select-request-type")}>
                        Back
                      </Button>
                      <Button onClick={handleCreateRequest} disabled={!requestName.trim()}>
                        Create Request
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Environment List (when showEnvironments is true) */}
          {showEnvironments ? (
            <div className="flex-1 overflow-y-auto">
              <div className="p-2 space-y-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-muted-foreground px-2">Environments</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCreateNewEnvironment}
                    className="h-7 px-2"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {config?.environments && config.environments.length > 0 ? (
                  config.environments.map((env: IEnvironment) => (
                    <div
                      key={env.id}
                      className="group flex items-center justify-between px-2 py-2 hover:bg-sidebar-accent/50 rounded-md"
                    >
                      <button
                        className="flex-1 text-left text-sm cursor-pointer"
                        onClick={() => handleEditEnvironment(env)}
                      >
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{env.name}</span>
                        </div>
                      </button>
                      <button
                        className="h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-opacity cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteEnvironment(env.id, env.name);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground p-2">
                    No environments yet. Click + to create one.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Collections List */}
              {config && selected && selected.collections.length > 0 &&
            selected.collections.map((collection: ICollection) => (
              <Collapsible
                key={collection.id}
                open={!!openCollections[collection.id]}
                onOpenChange={(open) =>
                  setOpenCollections((prev) => ({
                    ...prev,
                    [collection.id]: open,
                  }))
                }
                className="mb-1"
              >
                <div className="group flex items-center gap-1 hover:bg-sidebar-accent/50 rounded-md pr-1">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex-1 justify-start gap-2 hover:bg-transparent"
                    >
                      <ChevronRight
                        className={`h-4 w-4 transition-transform duration-200 ${
                          openCollections[collection.id] ? "rotate-90" : ""
                        }`}
                      />
                      <FolderPlus className="h-4 w-4 text-muted-foreground" />
                      {collection.name}
                    </Button>
                  </CollapsibleTrigger>
                  
                  {/* Collection Actions (show on hover) */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 pointer-events-auto">
                    <button
                      className="h-7 w-7 flex items-center justify-center hover:bg-accent rounded transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("Rename button clicked");
                        openRenameDialog(collection.id, collection.name);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="h-7 w-7 flex items-center justify-center hover:bg-accent rounded transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("Add request button clicked");
                        openCreateRequestDialog(collection.id);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="h-7 w-7 flex items-center justify-center hover:bg-destructive/10 rounded transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("Delete collection button clicked");
                        if (selected) {
                          handleDeleteCollection(selected.id, collection.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                </div>

                {collection.requests && collection.requests.length > 0 && (
                  <CollapsibleContent>
                    <div className="ml-3.5 pl-2.5 py-0.5 border-l border-sidebar-border">
                      <div className="py-1 space-y-0.5">
                        {collection.requests.map((request: IRequest) => {
                          const methodColors: Record<string, string> = {
                            GET: "text-green-500",
                            POST: "text-yellow-500",
                            PUT: "text-blue-500",
                            PATCH: "text-orange-500",
                            DELETE: "text-red-500",
                            HEAD: "text-purple-500",
                            OPTIONS: "text-gray-500",
                          };
                          const methodColor = methodColors[request.method] || "text-gray-500";

                          return (
                            <div key={request.id} className="group flex items-center gap-1">
                              <Button
                                variant="ghost"
                                className={`flex-1 justify-start text-sm h-8 ${
                                  selectedRequestId === request.id
                                    ? "bg-accent/20 text-foreground hover:bg-accent/30"
                                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                                }`}
                                onClick={() => handleRequestClick(request, collection.id)}
                              >
                                <span className={`${methodColor} font-semibold text-xs w-12 text-left`}>
                                  {request.method || "GET"}
                                </span>
                                <span className="truncate">{request.name}</span>
                              </Button>
                              <button
                                className="h-7 w-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 rounded pointer-events-auto cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log("Delete request button clicked");
                                  if (selected) {
                                    handleDeleteRequest(selected.id, collection.id, request.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CollapsibleContent>
                )}
              </Collapsible>
            ))}

          {config && config.workspaces.length === 0 && (
            <div className="text-sm text-muted-foreground p-2">
              No workspaces found. Click + to create one.
            </div>
          )}

              {config && selected && selected.collections.length === 0 && (
                <div className="text-sm text-muted-foreground p-2">
                  No collections yet. Click + to create one.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-auto bg-sidebar border-t border-sidebar-border p-2">
        <div className="flex items-center gap-2">
          <Button
            variant={showEnvironments ? "default" : "ghost"}
            className="flex-1 justify-start"
            onClick={() => setShowEnvironments(!showEnvironments)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Environments
          </Button>
          <ThemeSwitcher />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              {deleteItemName ? (
                <>
                  Are you sure you want to delete <strong>"{deleteItemName}"</strong>? This action cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to delete this {deleteType}? This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
