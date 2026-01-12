import { useState, useEffect, useRef, type ComponentType, type FC, type RefObject } from "react";
import * as React from "react";
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  CalendarIcon,
  CheckSquareIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  HighlighterIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  QuoteIcon,
  SearchIcon,
  SmileIcon,
  StrikethroughIcon,
  TableIcon,
  UnderlineIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { EditorRefActions } from "../Editor";
import { formatMarkdown } from "./formattingHelpers";
import TableDialog from "./TableDialog";
import EmojiPicker from "./EmojiPicker";
import FindReplaceDialog from "./FindReplaceDialog";
import HighlightColorPicker, { type HighlightColorPickerRef } from "./HighlightColorPicker";

interface FormattingToolbarProps {
  editorRef: RefObject<EditorRefActions>;
  className?: string;
}

const FormattingToolbar: FC<FormattingToolbarProps> = ({ editorRef, className }) => {
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [findReplaceMode, setFindReplaceMode] = useState<"find" | "replace">("find");
  const highlightPickerRef = useRef<HighlightColorPickerRef>(null);
  const [isColorfulTheme, setIsColorfulTheme] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.getAttribute("data-theme") === "colorful";
    }
    return false;
  });
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== "undefined") {
      const theme = document.documentElement.getAttribute("data-theme");
      const darkThemes = ["default-dark", "midnight"];
      return darkThemes.includes(theme || "");
    }
    return false;
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      setIsColorfulTheme(theme === "colorful");
      const darkThemes = ["default-dark", "midnight"];
      setIsDark(darkThemes.includes(theme || ""));
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    
    return () => observer.disconnect();
  }, []);

  // Keyboard shortcuts for Find/Replace
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? event.metaKey : event.ctrlKey;

      if (modKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        if (event.shiftKey) {
          setFindReplaceMode("replace");
        } else {
          setFindReplaceMode("find");
        }
        setFindReplaceOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleFormat = (formatFn: (editor: EditorRefActions) => void) => {
    const editor = editorRef.current;
    if (!editor) return;
    formatFn(editor);
    editor.focus();
  };

  const handleTableInsert = (rows: number, cols: number) => {
    const editor = editorRef.current;
    if (!editor) return;
    formatMarkdown.table(editor, rows, cols);
    editor.focus();
  };

  interface ToolbarButtonProps {
    icon: ComponentType<{ className?: string }>;
    label: string;
    shortcut?: string;
    onClick: () => void;
    disabled?: boolean;
    colorScheme?: "blue" | "purple" | "green" | "sky" | "orange" | "rose" | "slate";
  }

  const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(({
    icon: Icon,
    label,
    shortcut,
    onClick,
    disabled,
    colorScheme = "blue",
  }, ref) => {
    // Theme-aware color schemes: dark for dark themes, colorful for colorful theme, theme-aware for others
    const colorSchemes = isDark ? {
      blue: {
        hover: "hover:bg-white/10 hover:border-white/20",
        active: "active:bg-white/15",
        text: "text-white/90 hover:text-white",
        ring: "focus-visible:ring-white/40",
        tooltip: "bg-gray-800 text-white border-gray-700",
      },
      purple: {
        hover: "hover:bg-white/10 hover:border-white/20",
        active: "active:bg-white/15",
        text: "text-white/90 hover:text-white",
        ring: "focus-visible:ring-white/40",
        tooltip: "bg-gray-800 text-white border-gray-700",
      },
      green: {
        hover: "hover:bg-white/10 hover:border-white/20",
        active: "active:bg-white/15",
        text: "text-white/90 hover:text-white",
        ring: "focus-visible:ring-white/40",
        tooltip: "bg-gray-800 text-white border-gray-700",
      },
      sky: {
        hover: "hover:bg-white/10 hover:border-white/20",
        active: "active:bg-white/15",
        text: "text-white/90 hover:text-white",
        ring: "focus-visible:ring-white/40",
        tooltip: "bg-gray-800 text-white border-gray-700",
      },
      orange: {
        hover: "hover:bg-white/10 hover:border-white/20",
        active: "active:bg-white/15",
        text: "text-white/90 hover:text-white",
        ring: "focus-visible:ring-white/40",
        tooltip: "bg-gray-800 text-white border-gray-700",
      },
      rose: {
        hover: "hover:bg-white/10 hover:border-white/20",
        active: "active:bg-white/15",
        text: "text-white/90 hover:text-white",
        ring: "focus-visible:ring-white/40",
        tooltip: "bg-gray-800 text-white border-gray-700",
      },
      slate: {
        hover: "hover:bg-white/10 hover:border-white/20",
        active: "active:bg-white/15",
        text: "text-white/90 hover:text-white",
        ring: "focus-visible:ring-white/40",
        tooltip: "bg-gray-800 text-white border-gray-700",
      },
    } : isColorfulTheme ? {
      blue: {
        hover: "hover:bg-blue-500/12 hover:border-blue-400/30",
        active: "active:bg-blue-500/18",
        text: "text-blue-600/70 hover:text-blue-700",
        ring: "focus-visible:ring-blue-400/40",
        tooltip: "bg-blue-500/95 text-white border-blue-400/30",
      },
      purple: {
        hover: "hover:bg-purple-500/12 hover:border-purple-400/30",
        active: "active:bg-purple-500/18",
        text: "text-purple-600/70 hover:text-purple-700",
        ring: "focus-visible:ring-purple-400/40",
        tooltip: "bg-purple-500/95 text-white border-purple-400/30",
      },
      green: {
        hover: "hover:bg-emerald-500/12 hover:border-emerald-400/30",
        active: "active:bg-emerald-500/18",
        text: "text-emerald-600/70 hover:text-emerald-700",
        ring: "focus-visible:ring-emerald-400/40",
        tooltip: "bg-emerald-500/95 text-white border-emerald-400/30",
      },
      sky: {
        hover: "hover:bg-sky-500/12 hover:border-sky-400/30",
        active: "active:bg-sky-500/18",
        text: "text-sky-600/70 hover:text-sky-700",
        ring: "focus-visible:ring-sky-400/40",
        tooltip: "bg-sky-500/95 text-white border-sky-400/30",
      },
      orange: {
        hover: "hover:bg-orange-500/12 hover:border-orange-400/30",
        active: "active:bg-orange-500/18",
        text: "text-orange-600/70 hover:text-orange-700",
        ring: "focus-visible:ring-orange-400/40",
        tooltip: "bg-orange-500/95 text-white border-orange-400/30",
      },
      rose: {
        hover: "hover:bg-rose-500/12 hover:border-rose-400/30",
        active: "active:bg-rose-500/18",
        text: "text-rose-600/70 hover:text-rose-700",
        ring: "focus-visible:ring-rose-400/40",
        tooltip: "bg-rose-500/95 text-white border-rose-400/30",
      },
      slate: {
        hover: "hover:bg-slate-500/12 hover:border-slate-400/30",
        active: "active:bg-slate-500/18",
        text: "text-slate-600/70 hover:text-slate-700",
        ring: "focus-visible:ring-slate-400/40",
        tooltip: "bg-slate-500/95 text-white border-slate-400/30",
      },
    } : {
      blue: {
        hover: "hover:bg-primary/12 hover:border-primary/30",
        active: "active:bg-primary/18",
        text: "text-primary hover:text-primary/80",
        ring: "focus-visible:ring-primary/40",
        tooltip: "bg-primary text-primary-foreground border-primary/30",
      },
      purple: {
        hover: "hover:bg-accent/12 hover:border-accent/30",
        active: "active:bg-accent/18",
        text: "text-accent-foreground hover:text-accent-foreground/80",
        ring: "focus-visible:ring-accent/40",
        tooltip: "bg-accent text-accent-foreground border-accent/30",
      },
      green: {
        hover: "hover:bg-primary/12 hover:border-primary/30",
        active: "active:bg-primary/18",
        text: "text-primary hover:text-primary/80",
        ring: "focus-visible:ring-primary/40",
        tooltip: "bg-primary text-primary-foreground border-primary/30",
      },
      sky: {
        hover: "hover:bg-accent/12 hover:border-accent/30",
        active: "active:bg-accent/18",
        text: "text-accent-foreground hover:text-accent-foreground/80",
        ring: "focus-visible:ring-accent/40",
        tooltip: "bg-accent text-accent-foreground border-accent/30",
      },
      orange: {
        hover: "hover:bg-secondary/12 hover:border-secondary/30",
        active: "active:bg-secondary/18",
        text: "text-secondary-foreground hover:text-secondary-foreground/80",
        ring: "focus-visible:ring-secondary/40",
        tooltip: "bg-secondary text-secondary-foreground border-secondary/30",
      },
      rose: {
        hover: "hover:bg-accent/12 hover:border-accent/30",
        active: "active:bg-accent/18",
        text: "text-accent-foreground hover:text-accent-foreground/80",
        ring: "focus-visible:ring-accent/40",
        tooltip: "bg-accent text-accent-foreground border-accent/30",
      },
      slate: {
        hover: "hover:bg-muted/12 hover:border-muted-foreground/30",
        active: "active:bg-muted/18",
        text: "text-muted-foreground hover:text-muted-foreground/80",
        ring: "focus-visible:ring-muted-foreground/40",
        tooltip: "bg-muted text-muted-foreground border-muted-foreground/30",
      },
    };

    const colors = colorSchemes[colorScheme];

    return (
      <Tooltip>
        <TooltipTrigger asChild>
        <Button
          ref={ref}
          variant="ghost"
          size="icon"
          className={cn(
            // Responsive sizing: scales down on desktop to fit all in one row
            "h-8 w-8 sm:h-7 sm:w-7 md:h-6 md:w-6 lg:h-5 lg:w-5 xl:h-[18px] xl:w-[18px] relative",
            // Allow buttons to shrink proportionally on desktop while maintaining minimum size
            "md:flex-shrink",
            // Prevent shrinking on mobile for touch targets
            "shrink-0 sm:shrink-0",
            // Minimum size constraints to ensure usability
            "min-w-[32px] sm:min-w-[28px] md:min-w-[24px] lg:min-w-[20px]",
            "touch-manipulation",
            colors.text,
            colors.hover,
            "transition-all duration-200 ease-out",
            "border border-transparent",
            "rounded-md",
            colors.active,
            colors.ring,
            "focus-visible:ring-offset-1 focus-visible:ring-offset-background",
            "backdrop-blur-[2px]",
            disabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:border-transparent",
          )}
            onClick={onClick}
            disabled={disabled}
            type="button"
          >
            <Icon className={cn(
              "h-4 w-4 sm:h-3.5 sm:w-3.5 md:h-3 md:w-3 lg:h-2.5 lg:w-2.5 xl:h-[14px] xl:w-[14px]",
              "transition-all duration-200",
              "drop-shadow-sm"
            )} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className={cn(colors.tooltip, "backdrop-blur-sm")}>
          <div className="flex items-center gap-2">
            <span className="font-medium">{label}</span>
            {shortcut && (
              <span className="text-xs opacity-90 bg-white/20 px-1.5 py-0.5 rounded font-mono backdrop-blur-sm">
                {shortcut}
              </span>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  });
  ToolbarButton.displayName = "ToolbarButton";

  return (
    <div className="w-full relative min-w-0 overflow-hidden">
      <div
        className={cn(
          // Responsive spacing: scales down on desktop
          "flex items-center gap-1 sm:gap-0.5 md:gap-0.5 lg:gap-0.5",
          "rounded-lg",
          // Match expand button container styling
          isColorfulTheme 
            ? "bg-gradient-to-br from-blue-50/40 via-purple-50/30 to-pink-50/40 border border-blue-200/40"
            : "bg-muted/40 border border-border/60",
          // Responsive padding: scales down on desktop
          "px-1 py-1 sm:px-0.5 sm:py-0.5 md:px-0.5 md:py-0.5",
          "shadow-sm",
          "backdrop-blur-sm",
          "transition-all duration-200 ease-out",
          // On desktop: allow horizontal scrolling if needed, but prefer fitting
          "overflow-x-auto overflow-y-hidden",
          "scrollbar-hide",
          "w-full",
          "flex-nowrap",
          // On desktop: use flexbox to distribute space evenly
          "md:justify-start",
          className,
        )}
        style={{ 
          scrollbarWidth: "none", 
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          scrollPaddingRight: "1rem",
          scrollPaddingLeft: "0.5rem",
          paddingRight: "0.75rem",
        }}
      >
      {/* Text Formatting - Blue/Indigo */}
      <ToolbarButton
        icon={BoldIcon}
        label="Bold"
        shortcut="⌘B"
        colorScheme="blue"
        onClick={() => handleFormat((editor) => formatMarkdown.bold(editor))}
      />
      <ToolbarButton
        icon={ItalicIcon}
        label="Italic"
        shortcut="⌘I"
        colorScheme="blue"
        onClick={() => handleFormat((editor) => formatMarkdown.italic(editor))}
      />
      <ToolbarButton
        icon={StrikethroughIcon}
        label="Strikethrough"
        shortcut="⌘⇧X"
        colorScheme="blue"
        onClick={() => handleFormat((editor) => formatMarkdown.strikethrough(editor))}
      />
      <ToolbarButton
        icon={UnderlineIcon}
        label="Underline"
        shortcut="⌘U"
        colorScheme="blue"
        onClick={() => handleFormat((editor) => formatMarkdown.underline(editor))}
      />
      <HighlightColorPicker ref={highlightPickerRef} editorRef={editorRef}>
        <ToolbarButton
          icon={HighlighterIcon}
          label="Highlight"
          shortcut="⌘⇧H"
          colorScheme="blue"
          onClick={() => highlightPickerRef.current?.open()}
        />
      </HighlightColorPicker>

      <Separator orientation="vertical" className={cn(
        // Match responsive button heights
        "h-8 sm:h-7 md:h-6 lg:h-5 xl:h-[18px]",
        "mx-0.5 shrink-0",
        isDark 
          ? "bg-gradient-to-b from-gray-600/40 via-gray-500/40 to-transparent"
          : isColorfulTheme
            ? "bg-gradient-to-b from-blue-300/40 via-purple-300/40 to-transparent"
            : "bg-border/60"
      )} />

      {/* Headings - Purple/Violet */}
      <ToolbarButton
        icon={Heading1Icon}
        label="Heading 1"
        shortcut="⌘⇧1"
        colorScheme="purple"
        onClick={() => handleFormat((editor) => formatMarkdown.heading(editor, 1))}
      />
      <ToolbarButton
        icon={Heading2Icon}
        label="Heading 2"
        shortcut="⌘⇧2"
        colorScheme="purple"
        onClick={() => handleFormat((editor) => formatMarkdown.heading(editor, 2))}
      />
      <ToolbarButton
        icon={Heading3Icon}
        label="Heading 3"
        shortcut="⌘⇧3"
        colorScheme="purple"
        onClick={() => handleFormat((editor) => formatMarkdown.heading(editor, 3))}
      />

      <Separator orientation="vertical" className={cn(
        "h-10 sm:h-7 md:h-6 mx-0.5 shrink-0",
        isDark 
          ? "bg-gradient-to-b from-gray-600/40 via-gray-500/40 to-transparent"
          : isColorfulTheme
            ? "bg-gradient-to-b from-purple-300/40 via-emerald-300/40 to-transparent"
            : "bg-border/60"
      )} />

      {/* Lists - Green/Emerald */}
      <ToolbarButton
        icon={ListIcon}
        label="Bullet List"
        shortcut="⌘⇧8"
        colorScheme="green"
        onClick={() => handleFormat((editor) => formatMarkdown.bulletList(editor))}
      />
      <ToolbarButton
        icon={ListOrderedIcon}
        label="Numbered List"
        shortcut="⌘⇧7"
        colorScheme="green"
        onClick={() => handleFormat((editor) => formatMarkdown.numberedList(editor))}
      />
      <ToolbarButton
        icon={CheckSquareIcon}
        label="Task List"
        shortcut="⌘⇧9"
        colorScheme="green"
        onClick={() => handleFormat((editor) => formatMarkdown.taskList(editor))}
      />

      <Separator orientation="vertical" className={cn(
        "h-10 sm:h-7 md:h-6 mx-0.5 shrink-0",
        isDark 
          ? "bg-gradient-to-b from-gray-600/40 via-gray-500/40 to-transparent"
          : isColorfulTheme
            ? "bg-gradient-to-b from-emerald-300/40 via-sky-300/40 to-transparent"
            : "bg-border/60"
      )} />

      {/* Other Formatting */}
      <ToolbarButton
        icon={LinkIcon}
        label="Link"
        shortcut="⌘K"
        colorScheme="sky"
        onClick={() => handleFormat((editor) => formatMarkdown.link(editor))}
      />
      <ToolbarButton
        icon={CodeIcon}
        label="Code"
        shortcut="⌘⇧`"
        colorScheme="orange"
        onClick={() => handleFormat((editor) => formatMarkdown.code(editor))}
      />
      <ToolbarButton
        icon={QuoteIcon}
        label="Quote"
        shortcut="⌘⇧>"
        colorScheme="rose"
        onClick={() => handleFormat((editor) => formatMarkdown.quote(editor))}
      />
      <ToolbarButton
        icon={MinusIcon}
        label="Horizontal Rule"
        colorScheme="slate"
        onClick={() => handleFormat((editor) => formatMarkdown.horizontalRule(editor))}
      />

      <Separator orientation="vertical" className={cn(
        "h-10 sm:h-7 md:h-6 mx-0.5 shrink-0",
        isDark 
          ? "bg-gradient-to-b from-gray-600/40 via-gray-500/40 to-transparent"
          : isColorfulTheme
            ? "bg-gradient-to-b from-slate-300/40 via-indigo-300/40 to-transparent"
            : "bg-border/60"
      )} />

      {/* Table - Indigo */}
      <ToolbarButton
        icon={TableIcon}
        label="Insert Table"
        shortcut="⌘⇧T"
        colorScheme="sky"
        onClick={() => setTableDialogOpen(true)}
      />

      <Separator orientation="vertical" className={cn(
        "h-10 sm:h-7 md:h-6 mx-0.5 shrink-0",
        isDark 
          ? "bg-gradient-to-b from-gray-600/40 via-gray-500/40 to-transparent"
          : isColorfulTheme
            ? "bg-gradient-to-b from-indigo-300/40 via-violet-300/40 to-transparent"
            : "bg-border/60"
      )} />

      {/* Quick Insert - Teal */}
      <ToolbarButton
        icon={CalendarIcon}
        label="Insert Date & Time"
        shortcut="⌘⇧D"
        colorScheme="sky"
        onClick={() => handleFormat((editor) => formatMarkdown.insertDateTime(editor, "datetime"))}
      />
      <EmojiPicker
        onSelect={(emoji) => {
          const editor = editorRef.current;
          if (editor) {
            editor.insertText(emoji, "", "");
            editor.focus();
          }
        }}
      >
        <ToolbarButton
          icon={SmileIcon}
          label="Insert Emoji"
          shortcut="⌘⇧M"
          colorScheme="rose"
          onClick={() => {}}
        />
      </EmojiPicker>

      <Separator orientation="vertical" className={cn(
        "h-10 sm:h-7 md:h-6 mx-0.5 shrink-0",
        isDark 
          ? "bg-gradient-to-b from-gray-600/40 via-gray-500/40 to-transparent"
          : isColorfulTheme
            ? "bg-gradient-to-b from-rose-300/40 via-violet-300/40 to-transparent"
            : "bg-border/60"
      )} />

      {/* Text Alignment - Violet */}
      <ToolbarButton
        icon={AlignLeftIcon}
        label="Align Left"
        shortcut="⌘⇧L"
        colorScheme="purple"
        onClick={() => handleFormat((editor) => formatMarkdown.align(editor, "left"))}
      />
      <ToolbarButton
        icon={AlignCenterIcon}
        label="Align Center"
        shortcut="⌘⇧E"
        colorScheme="purple"
        onClick={() => handleFormat((editor) => formatMarkdown.align(editor, "center"))}
      />
      <ToolbarButton
        icon={AlignRightIcon}
        label="Align Right"
        shortcut="⌘⇧R"
        colorScheme="purple"
        onClick={() => handleFormat((editor) => formatMarkdown.align(editor, "right"))}
      />
      <ToolbarButton
        icon={AlignJustifyIcon}
        label="Justify"
        shortcut="⌘⇧J"
        colorScheme="purple"
        onClick={() => handleFormat((editor) => formatMarkdown.align(editor, "justify"))}
      />

      <Separator orientation="vertical" className={cn(
        "h-10 sm:h-7 md:h-6 mx-0.5 shrink-0",
        isDark 
          ? "bg-gradient-to-b from-gray-600/40 via-gray-500/40 to-transparent"
          : isColorfulTheme
            ? "bg-gradient-to-b from-violet-300/40 via-blue-300/40 to-transparent"
            : "bg-border/60"
      )} />

      {/* Find/Replace */}
      <ToolbarButton
        icon={SearchIcon}
        label="Find & Replace"
        shortcut="⌘F"
        colorScheme="sky"
        onClick={() => {
          setFindReplaceMode("find");
          setFindReplaceOpen(true);
        }}
      />
      {/* Spacer to ensure last button is visible when scrolling */}
      <div className="w-8 shrink-0" aria-hidden="true" />
      </div>
      <TableDialog open={tableDialogOpen} onOpenChange={setTableDialogOpen} onConfirm={handleTableInsert} />
      <FindReplaceDialog
        open={findReplaceOpen}
        onOpenChange={setFindReplaceOpen}
        editorRef={editorRef}
        mode={findReplaceMode}
      />
    </div>
  );
};

export default FormattingToolbar;
