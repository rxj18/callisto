import { create } from "zustand";

interface IEnvironment {
  id: string;
  name: string;
  variables: Array<{ key: string; value: string }>;
}

interface IEnvironmentState {
  selectedEnvironmentId: string | null;
  editingEnvironment: IEnvironment | null; // null for creating new, object for editing
  isCreatingEnvironment: boolean;
  
  setSelectedEnvironment: (environmentId: string | null) => void;
  setEditingEnvironment: (environment: IEnvironment | null) => void;
  setIsCreatingEnvironment: (isCreating: boolean) => void;
  resetEnvironmentEditor: () => void;
}

export const useEnvironmentStore = create<IEnvironmentState>((set) => ({
  selectedEnvironmentId: null,
  editingEnvironment: null,
  isCreatingEnvironment: false,
  
  setSelectedEnvironment: (environmentId) => set({ selectedEnvironmentId: environmentId }),
  setEditingEnvironment: (environment) => set({ editingEnvironment: environment }),
  setIsCreatingEnvironment: (isCreating) => set({ isCreatingEnvironment: isCreating }),
  resetEnvironmentEditor: () => set({ editingEnvironment: null, isCreatingEnvironment: false }),
}));

// Helper function to replace environment variables in a string
export function replaceEnvironmentVariables(
  text: string,
  variables: Array<{ key: string; value: string }>
): string {
  if (!text || !variables || variables.length === 0) return text;
  
  let result = text;
  variables.forEach(({ key, value }) => {
    if (key) {
      // Replace {{variable_name}} with actual value
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(regex, value);
    }
  });
  
  return result;
}

// Helper function to find all variable references in text
export function findVariableReferences(text: string): string[] {
  if (!text) return [];
  
  const regex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
  const matches: string[] = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1]);
  }
  
  return [...new Set(matches)]; // Remove duplicates
}

// Helper function to check if all variables in text are defined
export function getMissingVariables(
  text: string,
  variables: Array<{ key: string; value: string }>
): string[] {
  const references = findVariableReferences(text);
  const definedKeys = new Set(variables.map(v => v.key));
  
  return references.filter(ref => !definedKeys.has(ref));
}

// Helper function to check all request fields for missing variables
export function checkAllMissingVariables(
  url: string,
  params: Array<{ key: string; value: string; enabled: boolean }>,
  headers: Array<{ key: string; value: string; enabled: boolean }>,
  body: string,
  variables: Array<{ key: string; value: string }>
): string[] {
  const allMissing = new Set<string>();
  
  // Check URL
  getMissingVariables(url, variables).forEach(v => allMissing.add(v));
  
  // Check enabled params
  params.filter(p => p.enabled).forEach(p => {
    getMissingVariables(p.key, variables).forEach(v => allMissing.add(v));
    getMissingVariables(p.value, variables).forEach(v => allMissing.add(v));
  });
  
  // Check enabled headers
  headers.filter(h => h.enabled).forEach(h => {
    getMissingVariables(h.key, variables).forEach(v => allMissing.add(v));
    getMissingVariables(h.value, variables).forEach(v => allMissing.add(v));
  });
  
  // Check body
  getMissingVariables(body, variables).forEach(v => allMissing.add(v));
  
  return Array.from(allMissing);
}

