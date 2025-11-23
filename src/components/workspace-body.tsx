import { useState } from "react";
import { CodeEditor, Language } from "./code-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { KeyValueTable } from "./key-value-table";
import { useWorkspaceStore } from "@/stores/workspace";
import { Braces } from "lucide-react";

type BodyType = "none" | "form-data" | "x-www-form-urlencoded" | "raw" | "binary";

const WorkspaceBody = () => {
  const selectedRequest = useWorkspaceStore((state) => state.selectedRequest);
  const body = useWorkspaceStore((state) => state.body);
  const bodyType = useWorkspaceStore((state) => state.bodyType);
  const setBody = useWorkspaceStore((state) => state.setBody);
  const setBodyType = useWorkspaceStore((state) => state.setBodyType);

  // Use request ID as key to force remount when switching requests
  const requestKey = selectedRequest?.id || "no-request";

  const [language, setLanguage] = useState<Language>("json");
  const [vimMode, setVimMode] = useState(true);

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(body);
      const formatted = JSON.stringify(parsed, null, 2);
      setBody(formatted);
    } catch (error) {
      console.error("Failed to format JSON:", error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Body Type Selector */}
      <div className="flex justify-between items-center gap-3 p-2 border-b bg-muted/30">
        <Select value={bodyType} onValueChange={(val) => setBodyType(val as BodyType)}>
          <SelectTrigger className="w-[200px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="form-data">form-data</SelectItem>
            <SelectItem value="x-www-form-urlencoded">x-www-form-urlencoded</SelectItem>
            <SelectItem value="raw">raw</SelectItem>
            <SelectItem value="binary">binary</SelectItem>
          </SelectContent>
        </Select>

        {/* Show language and vim controls only for raw type */}
        {bodyType === "raw" && (
          <div className="flex items-center gap-3">

            <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="xml">XML</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="text">Text</SelectItem>
              </SelectContent>
            </Select>

            {language === "json" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleFormatJson}
                className="h-8 px-3"
                title="Format JSON"
              >
                <Braces className="h-4 w-4 mr-1" />
                Format
              </Button>
            )}

            <Button
              variant={vimMode ? "default" : "outline"}
              size="sm"
              onClick={() => setVimMode(!vimMode)}
              className="h-8 px-3"
            >
              Vim
            </Button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {bodyType === "none" && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            This request does not have a body
          </div>
        )}

        {(bodyType === "form-data" || bodyType === "x-www-form-urlencoded") && (
          <div className="h-full overflow-y-auto p-4">
            <KeyValueTable
              key={`body-form-${requestKey}`}
              keyPlaceholder="Key"
              valuePlaceholder="Value"
            />
          </div>
        )}

        {bodyType === "raw" && (
          <CodeEditor
            value={body}
            onChange={setBody}
            language={language}
            vimMode={vimMode}
          />
        )}

        {bodyType === "binary" && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
            <p>Binary file upload</p>
            <Button variant="outline">Select File</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceBody;
