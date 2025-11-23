import { useState, useMemo } from "react";
import { useTheme, AccentColor } from "@/contexts/theme-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";

// Labels for the theme colors
const colorLabels: Record<AccentColor, string> = {
  blue: "Blue",
  red: "Red",
  green: "Green",
  yellow: "Yellow",
  purple: "Purple",
  pink: "Pink",
  orange: "Orange",
  cyan: "Cyan",
};

// Color indicators for visual swatch
const colorIndicators: Record<AccentColor, string> = {
  blue: "bg-[oklch(0.6_0.24_264.376)]",
  red: "bg-[oklch(0.63_0.25_27.325)]",
  green: "bg-[oklch(0.65_0.22_142.495)]",
  yellow: "bg-[oklch(0.85_0.20_95.285)]",
  purple: "bg-[oklch(0.63_0.27_303.9)]",
  pink: "bg-[oklch(0.70_0.22_3.179)]",
  orange: "bg-[oklch(0.72_0.20_49.78)]",
  cyan: "bg-[oklch(0.70_0.17_195.04)]",
};

export function ThemeSwitcher() {
  const { accentColor, setAccentColor } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Memoize the list of colors for efficiency
  const colors = useMemo(() => Object.keys(colorLabels) as AccentColor[], []);

  // Handler factory to avoid creating new functions in map
  const handleColorClick = (color: AccentColor) => () => setAccentColor(color);

  return (
    <TooltipProvider>
      {/* Theme Dropdown */}
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <Tooltip open={dropdownOpen ? false : undefined}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Palette className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Change Theme</TooltipContent>
        </Tooltip>

        <DropdownMenuContent align="end" className="w-40">
          {colors.map((color) => (
            <DropdownMenuItem
              key={color}
              onClick={handleColorClick(color)}
              className="flex items-center gap-2"
            >
              <div
                className={`h-4 w-4 rounded-full ${colorIndicators[color]} ${
                  accentColor === color
                    ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                    : ""
                }`}
              />
              <span>{colorLabels[color]}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
