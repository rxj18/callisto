import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { KeyValueTable, KeyValuePair } from "./key-value-table";
import { invoke } from "@tauri-apps/api/core";
import { Save, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface WorkspaceEnvironmentProps {
  environmentId?: string; // If provided, we're editing; otherwise creating
  initialName?: string;
  initialVariables?: Array<{ key: string; value: string }>;
  onClose: () => void;
}

const WorkspaceEnvironment = ({
  environmentId,
  initialName = "",
  initialVariables = [],
  onClose,
}: WorkspaceEnvironmentProps) => {
  const [environmentName, setEnvironmentName] = useState(initialName);
  const [variables, setVariables] = useState<KeyValuePair[]>(() => {
    if (initialVariables.length > 0) {
      return initialVariables.map((v) => ({
        id: Math.random().toString(),
        enabled: true,
        key: v.key,
        value: v.value,
      }));
    }
    return [];
  });

  const isEditing = !!environmentId;

  const handleSave = async () => {
    if (!environmentName.trim()) {
      toast.error("Environment name is required");
      return;
    }

    try {
      // Convert KeyValuePair to simple {key, value} format
      const validVariables = variables
        .filter((v) => v.key.trim() !== "")
        .map((v) => ({ key: v.key, value: v.value }));

      if (isEditing) {
        await invoke("update_environment", {
          environmentId,
          name: environmentName,
          variables: validVariables,
        });
        toast.success("Environment updated", {
          description: `${environmentName} has been updated successfully.`,
        });
      } else {
        await invoke("create_environment", {
          name: environmentName,
          variables: validVariables,
        });
        toast.success("Environment created", {
          description: `${environmentName} has been created successfully.`,
        });
      }

      onClose();
    } catch (error) {
      console.error("Failed to save environment:", error);
      toast.error("Failed to save environment", {
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    }
  };

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [environmentName, variables]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-muted/30 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Input
              placeholder="Environment Name (e.g., Development, Staging, Production)"
              className="text-3xl font-bold border-none bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
              value={environmentName}
              onChange={(e) => setEnvironmentName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm text-muted-foreground bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
          <div>
            <p className="font-medium text-blue-500 mb-1">Using Variables</p>
            <p>
              Reference variables in your requests using the syntax{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{`{{variable_name}}`}</code>.
              For example: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{`{{API_URL}}/users`}</code>
            </p>
          </div>
        </div>
      </div>

      {/* Variables Table */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-6 pb-2">
          <Label className="text-base font-semibold">Environment Variables</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Define key-value pairs that can be reused across all requests in this environment
          </p>
        </div>
        <div className="flex-1 overflow-hidden px-6 pb-6">
          <div className="border rounded-md h-full overflow-hidden">
            <KeyValueTable
              pairs={variables}
              onChange={setVariables}
              keyPlaceholder="Variable Key (e.g., API_URL, AUTH_TOKEN)"
              valuePlaceholder="Variable Value"
            />
          </div>
        </div>
      </div>

      {/* Footer with keyboard shortcut hint */}
      <div className="border-t bg-muted/30 px-6 py-3 text-xs text-muted-foreground flex items-center justify-between">
        <span>Press Cmd/Ctrl + S to save</span>
        <span>{variables.filter((v) => v.key.trim()).length} variable(s) defined</span>
      </div>
    </div>
  );
};

export default WorkspaceEnvironment;

