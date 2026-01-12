import { useState, useImperativeHandle, forwardRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { HighlighterIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EditorRefActions } from "../Editor";
import { formatMarkdown } from "./formattingHelpers";

interface HighlightColorPickerProps {
  editorRef: React.RefObject<EditorRefActions>;
  children: React.ReactNode;
}

export interface HighlightColorPickerRef {
  open: () => void;
}

// Elegant, professional highlight colors
const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "rgba(255, 237, 153, 0.6)", class: "bg-yellow-200/60" },
  { name: "Peach", value: "rgba(255, 218, 185, 0.65)", class: "bg-orange-200/65" },
  { name: "Coral", value: "rgba(255, 182, 193, 0.6)", class: "bg-pink-200/60" },
  { name: "Lavender", value: "rgba(230, 230, 250, 0.7)", class: "bg-purple-200/70" },
  { name: "Mint", value: "rgba(189, 252, 201, 0.6)", class: "bg-emerald-200/60" },
  { name: "Sky", value: "rgba(176, 224, 230, 0.65)", class: "bg-cyan-200/65" },
  { name: "Rose", value: "rgba(255, 192, 203, 0.6)", class: "bg-rose-200/60" },
  { name: "Lilac", value: "rgba(200, 162, 200, 0.65)", class: "bg-violet-200/65" },
  { name: "Sage", value: "rgba(188, 184, 177, 0.6)", class: "bg-stone-200/60" },
  { name: "Azure", value: "rgba(173, 216, 230, 0.65)", class: "bg-blue-200/65" },
  { name: "Apricot", value: "rgba(251, 206, 177, 0.65)", class: "bg-amber-200/65" },
  { name: "Periwinkle", value: "rgba(204, 204, 255, 0.65)", class: "bg-indigo-200/65" },
];

const HighlightColorPicker = forwardRef<HighlightColorPickerRef, HighlightColorPickerProps>(
  ({ editorRef, children }, ref) => {
    const [open, setOpen] = useState(false);

    useImperativeHandle(ref, () => ({
      open: () => setOpen(true),
    }));

    const handleColorSelect = (color: string) => {
      const editor = editorRef.current;
      if (!editor) return;

      formatMarkdown.highlight(editor, color);
      editor.focus();
      setOpen(false);
    };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold text-muted-foreground mb-1">Choose Highlight Color</div>
          <div className="grid grid-cols-4 gap-2">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => handleColorSelect(color.value)}
                className={cn(
                  "w-10 h-10 rounded-md border-2 border-transparent",
                  "hover:border-primary/50 hover:scale-110",
                  "transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  color.class,
                )}
                style={{ backgroundColor: color.value }}
                title={color.name}
                aria-label={`Highlight with ${color.name}`}
              />
            ))}
          </div>
          <div className="mt-2 pt-2 border-t">
            <button
              onClick={() => handleColorSelect("")}
              className={cn(
                "w-full px-3 py-1.5 text-xs rounded-md",
                "bg-muted hover:bg-muted/80",
                "text-muted-foreground hover:text-foreground",
                "transition-colors",
              )}
            >
              Default Highlight
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

HighlightColorPicker.displayName = "HighlightColorPicker";

export default HighlightColorPicker;

