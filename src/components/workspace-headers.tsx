import { KeyValueTable } from "./key-value-table";
import { useWorkspaceStore } from "@/stores/workspace";

const WorkspaceHeaders = () => {
  const selectedRequest = useWorkspaceStore((state) => state.selectedRequest);
  const headers = useWorkspaceStore((state) => state.headers);
  const setHeaders = useWorkspaceStore((state) => state.setHeaders);

  // Use request ID as key to force remount when switching requests
  const key = selectedRequest?.id || "no-request";

  return (
    <KeyValueTable
      key={`headers-${key}`}
      pairs={headers}
      onChange={setHeaders}
      keyPlaceholder="Header"
      valuePlaceholder="Value"
    />
  );
};

export default WorkspaceHeaders;
