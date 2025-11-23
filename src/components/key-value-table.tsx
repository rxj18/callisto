import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";

export interface KeyValuePair {
  id: string;
  enabled: boolean;
  key: string;
  value: string;
  preset?: boolean; // Marks if this is a preset pair
}

interface KeyValueTableProps {
  pairs?: KeyValuePair[];
  onChange?: (pairs: KeyValuePair[]) => void;
  parseFunction?: (text: string) => KeyValuePair[] | null;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export function KeyValueTable({
  pairs: initialPairs,
  onChange,
  parseFunction,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
}: KeyValueTableProps) {
  const [pairs, setPairs] = useState<KeyValuePair[]>(() => {
    // Ensure at least one empty row exists
    if (initialPairs && initialPairs.length > 0) {
      const hasEmptyRow = initialPairs.some(p => p.key === "" && p.value === "");
      if (hasEmptyRow) {
        return initialPairs;
      }
      // Add empty row if missing
      return [...initialPairs, { id: Date.now().toString(), enabled: false, key: "", value: "" }];
    }
    return [{ id: Date.now().toString(), enabled: false, key: "", value: "" }];
  });

  // Notify parent of changes
  useEffect(() => {
    onChange?.(pairs);
  }, [pairs, onChange]);

  const removePair = (id: string) => {
    const pairToRemove = pairs.find((p) => p.id === id);

    // Don't allow removing preset pairs
    if (pairToRemove?.preset) {
      return;
    }

    // Get all non-preset pairs
    const nonPresetPairs = pairs.filter((p) => !p.preset);

    // Don't allow removing if this is the last non-preset pair
    if (nonPresetPairs.length <= 1) {
      return;
    }

    // Remove the pair
    setPairs(pairs.filter((pair) => pair.id !== id));
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    id: string
  ) => {
    if (!parseFunction) return;

    const pastedText = e.clipboardData.getData("text");
    const parsedPairs = parseFunction(pastedText);

    if (parsedPairs) {
      e.preventDefault();

      // Replace empty rows or add to existing pairs
      const currentPair = pairs.find((p) => p.id === id);
      const isCurrentEmpty =
        currentPair && currentPair.key === "" && currentPair.value === "";

      let newPairs: KeyValuePair[];
      if (isCurrentEmpty) {
        // Replace the current empty row with parsed pairs
        newPairs = pairs.filter((p) => p.id !== id);
        newPairs = [...newPairs, ...parsedPairs];
      } else {
        // Add after current position
        const currentIndex = pairs.findIndex((p) => p.id === id);
        newPairs = [
          ...pairs.slice(0, currentIndex + 1),
          ...parsedPairs,
          ...pairs.slice(currentIndex + 1),
        ];
      }

      // Add an empty row at the end if there isn't one
      const hasEmptyRow = newPairs.some((p) => p.key === "" && p.value === "");
      if (!hasEmptyRow) {
        newPairs.push({
          id: Date.now().toString() + Math.random(),
          enabled: false,
          key: "",
          value: "",
        });
      }

      setPairs(newPairs);
    }
  };

  const updatePair = (
    id: string,
    field: keyof KeyValuePair,
    value: string | boolean
  ) => {
    const pairIndex = pairs.findIndex((p) => p.id === id);
    const pair = pairs[pairIndex];

    // Don't allow editing preset key names
    if (pair.preset && field === "key") {
      return;
    }

    const isLastRow = pairIndex === pairs.length - 1;
    const wasEmpty = pair.key === "" && pair.value === "";

    // Update the parameter
    let updatedPairs = pairs.map((p) =>
      p.id === id ? { ...p, [field]: value } : p
    );

    const updatedPair = updatedPairs[pairIndex];

    // Auto-disable checkbox if key or value becomes empty
    if (field !== "enabled" && typeof value === "string") {
      const isEmpty =
        (field === "key" && value === "") ||
        (field === "value" && value === "") ||
        (field === "key" && updatedPair.value === "") ||
        (field === "value" && updatedPair.key === "");

      if (isEmpty) {
        updatedPairs = updatedPairs.map((p) =>
          p.id === id ? { ...p, enabled: false } : p
        );
      }
      // Auto-enable checkbox when both key and value have content
      else if (value.length > 0 && !pair.enabled) {
        const hasContent =
          (field === "key" && updatedPair.value !== "") ||
          (field === "value" && updatedPair.key !== "");

        if (hasContent) {
          updatedPairs = updatedPairs.map((p) =>
            p.id === id ? { ...p, enabled: true } : p
          );
        }
      }
    }

    // If typing in the last empty row, add a new empty row below
    if (
      isLastRow &&
      wasEmpty &&
      field !== "enabled" &&
      typeof value === "string" &&
      value.length > 0
    ) {
      const newPair: KeyValuePair = {
        id: Date.now().toString(),
        enabled: false,
        key: "",
        value: "",
      };
      updatedPairs.push(newPair);
    }

    setPairs(updatedPairs);
  };

  return (
    <Table>
      <TableBody>
        <TableRow>
          <TableCell className="divide-y">
            {pairs.map((pair) => {
              // Count non-preset pairs
              const nonPresetPairs = pairs.filter((p) => !p.preset);

              // Show delete button for non-preset rows only if there's more than one non-preset pair
              const showDeleteButton =
                !pair.preset && nonPresetPairs.length > 1;

              return (
                <div
                  key={pair.id}
                  className={`grid grid-cols-[40px_1fr_1fr_40px] gap-2 px-2 py-2 items-center ${
                    !pair.enabled ? "opacity-50" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={pair.enabled}
                      onCheckedChange={(checked: boolean) =>
                        updatePair(pair.id, "enabled", checked === true)
                      }
                    />
                  </div>

                  {/* Key Input */}
                  <Input
                    placeholder={keyPlaceholder}
                    value={pair.key}
                    onChange={(e) => updatePair(pair.id, "key", e.target.value)}
                    onPaste={(e) => handlePaste(e, pair.id)}
                    className="h-9 border-none"
                    disabled={pair.preset} // Disable editing preset keys
                  />

                  {/* Value Input */}
                  <Input
                    placeholder={valuePlaceholder}
                    value={pair.value}
                    onChange={(e) =>
                      updatePair(pair.id, "value", e.target.value)
                    }
                    onPaste={(e) => handlePaste(e, pair.id)}
                    className="h-9 border-none"
                  />

                  {/* Delete Button */}
                  <div className="flex items-center justify-center">
                    {showDeleteButton && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePair(pair.id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
