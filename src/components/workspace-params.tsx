import { KeyValueTable, KeyValuePair } from "./key-value-table";
import { useWorkspaceStore } from "@/stores/workspace";

const WorkspaceParams = () => {
  const selectedRequest = useWorkspaceStore((state) => state.selectedRequest);
  const params = useWorkspaceStore((state) => state.params);
  const setParams = useWorkspaceStore((state) => state.setParams);

  // Use request ID as key to force remount when switching requests
  const key = selectedRequest?.id || "no-request";

  const parseQueryString = (text: string): KeyValuePair[] | null => {
    // Check if the text contains query parameters
    const hasQueryParams = text.includes("?") || text.includes("&") || text.includes("=");
    if (!hasQueryParams) return null;

    try {
      // Extract query string part (remove leading ?)
      let queryString = text.trim();
      const questionMarkIndex = queryString.indexOf("?");
      if (questionMarkIndex !== -1) {
        queryString = queryString.substring(questionMarkIndex + 1);
      }

      // Remove trailing fragments or anything after #
      const hashIndex = queryString.indexOf("#");
      if (hashIndex !== -1) {
        queryString = queryString.substring(0, hashIndex);
      }

      // Parse the query string
      const pairs = queryString.split("&").filter((pair) => pair.length > 0);
      if (pairs.length === 0) return null;

      const parsedParams: KeyValuePair[] = [];
      pairs.forEach((pair) => {
        const [key, value = ""] = pair.split("=");
        if (key) {
          const decodedKey = decodeURIComponent(key.trim());
          const decodedValue = decodeURIComponent(value.trim());
          parsedParams.push({
            id: Date.now().toString() + Math.random(),
            enabled: decodedKey !== "" && decodedValue !== "",
            key: decodedKey,
            value: decodedValue,
          });
        }
      });

      return parsedParams.length > 0 ? parsedParams : null;
    } catch (e) {
      return null;
    }
  };

  return (
    <KeyValueTable
      key={`params-${key}`}
      pairs={params}
      onChange={setParams}
      parseFunction={parseQueryString}
      keyPlaceholder="Key"
      valuePlaceholder="Value"
    />
  );
};

export default WorkspaceParams;
