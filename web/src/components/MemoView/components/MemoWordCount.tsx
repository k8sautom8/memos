import React, { useMemo, useState, useEffect } from "react";
import { timestampDate } from "@bufbuild/protobuf/wkt";
import { FileTextIcon, ClockIcon, TypeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import i18n from "@/i18n";
import type { Timestamp } from "@bufbuild/protobuf/wkt";
import TextToSpeech from "./TextToSpeech";

interface MemoWordCountProps {
  content: string;
  displayTime?: Timestamp;
  isArchived?: boolean;
  className?: string;
  onGotoDetail?: () => void;
  relatedMemosButton?: React.ReactNode;
  exportButton?: React.ReactNode;
}

const MemoWordCount: React.FC<MemoWordCountProps> = ({ content, displayTime, isArchived, className, onGotoDetail, relatedMemosButton, exportButton }) => {
  const [isColorfulTheme, setIsColorfulTheme] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.getAttribute("data-theme") === "colorful";
    }
    return false;
  });
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const theme = document.documentElement.getAttribute("data-theme");
      const darkThemes = ["default-dark", "midnight"];
      return darkThemes.includes(theme || "");
    }
    return false;
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const checkTheme = () => {
      setIsColorfulTheme(document.documentElement.getAttribute("data-theme") === "colorful");
      const theme = document.documentElement.getAttribute("data-theme");
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

  const stats = useMemo(() => {
    const words = content.trim() === "" ? 0 : content.trim().split(/\s+/).length;
    const characters = content.length;
    const charactersNoSpaces = content.replace(/\s/g, "").length;
    const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length || (content.trim() ? 1 : 0);
    const lines = content.split(/\n/).length;
    
    // Estimate reading time (average 200 words per minute)
    const readingTimeMinutes = Math.ceil(words / 200);
    
    return {
      words,
      characters,
      charactersNoSpaces,
      paragraphs,
      lines,
      readingTime: readingTimeMinutes,
    };
  }, [content]);

  const timeDisplay = useMemo(() => {
    if (!displayTime) return null;
    
    const date = timestampDate(displayTime);
    if (!date) return null;

    if (isArchived) {
      return date.toLocaleString(i18n.language);
    }

    // Use relative-time element for relative time display
    return (
      <relative-time
        datetime={date.toISOString()}
        lang={i18n.language}
        format="auto"
      ></relative-time>
    );
  }, [displayTime, isArchived]);

  return (
    <div
      className={cn(
        "flex items-center gap-1 sm:gap-2 px-1 sm:px-1.5 py-0.5 sm:py-1 text-xs w-full",
        "overflow-x-auto scrollbar-hide",
        isColorfulTheme && !isDark && "bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30",
        isColorfulTheme && !isDark && "border border-blue-200/30",
        !isColorfulTheme && !isDark && "bg-muted/40 border border-border/60 text-muted-foreground",
        "rounded-md",
        "backdrop-blur-sm",
        className,
      )}
      style={isDark ? {
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
        color: "var(--card-foreground)",
      } : undefined}
      title={`Words: ${stats.words} | Characters: ${stats.characters} | Paragraphs: ${stats.paragraphs} | Lines: ${stats.lines} | Reading time: ${stats.readingTime} min`}
    >
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {relatedMemosButton}
        {exportButton}
        <TextToSpeech content={content} />
      </div>
      <FileTextIcon 
        className={cn(
          "w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0",
          isColorfulTheme && !isDark && "text-blue-600/70"
        )}
        style={isDark ? { color: "var(--card-foreground)" } : undefined}
      />
      <div className={cn(
        "flex items-center gap-1 sm:gap-2 flex-nowrap whitespace-nowrap min-w-0 flex-1 overflow-x-auto scrollbar-hide",
        isColorfulTheme && !isDark && "text-blue-700/80"
      )} style={isDark ? { color: "var(--card-foreground)" } : undefined}>
        <span className={cn("font-medium shrink-0 text-[10px] sm:text-xs", isColorfulTheme && !isDark && "text-blue-800")}>{stats.words}</span>
        <span className={cn("hidden sm:inline text-[10px] sm:text-xs", isDark ? "opacity-70" : "opacity-60", isColorfulTheme && !isDark && "text-blue-600/70")}>words</span>
        <span className={cn("shrink-0 text-[8px] sm:text-[10px]", isDark ? "opacity-50" : "opacity-40", isColorfulTheme && !isDark && "text-purple-500/50")}>•</span>
        <TypeIcon 
          className={cn(
            "w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0",
            isColorfulTheme && !isDark && "text-purple-600/70"
          )}
          style={isDark ? { color: "var(--card-foreground)", opacity: 0.7 } : undefined}
        />
        <span className={cn("font-medium shrink-0 text-[10px] sm:text-xs", isColorfulTheme && !isDark && "text-purple-800")}>{stats.characters}</span>
        <span className={cn("hidden sm:inline text-[10px] sm:text-xs", isDark ? "opacity-70" : "opacity-60", isColorfulTheme && !isDark && "text-purple-600/70")}>chars</span>
        {stats.readingTime > 0 && (
          <>
            <span className={cn("shrink-0 text-[8px] sm:text-[10px]", isDark ? "opacity-50" : "opacity-40", isColorfulTheme && !isDark && "text-pink-500/50")}>•</span>
            <ClockIcon 
              className={cn(
                "w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0",
                isColorfulTheme && !isDark && "text-pink-600/70"
              )}
              style={isDark ? { color: "var(--card-foreground)", opacity: 0.7 } : undefined}
            />
            <span className={cn("font-medium shrink-0 text-[10px] sm:text-xs", isColorfulTheme && !isDark && "text-pink-800")}>{stats.readingTime}</span>
            <span className={cn("hidden sm:inline text-[10px] sm:text-xs", isDark ? "opacity-70" : "opacity-60", isColorfulTheme && !isDark && "text-pink-600/70")}>min</span>
          </>
        )}
        {timeDisplay && (
          <>
            <span className={cn("shrink-0 text-[8px] sm:text-[10px]", isDark ? "opacity-50" : "opacity-40", isColorfulTheme && !isDark && "text-blue-500/50")}>•</span>
            {onGotoDetail ? (
              <button
                type="button"
                onClick={onGotoDetail}
                className={cn("transition-opacity cursor-pointer flex items-center gap-0.5 sm:gap-1 shrink-0 touch-manipulation text-[10px] sm:text-xs", isDark ? "opacity-70 hover:opacity-100 active:opacity-100" : "opacity-60 hover:opacity-100 active:opacity-100", isColorfulTheme && !isDark && "text-blue-600/70 hover:text-blue-800")}
                style={isDark ? { color: "var(--card-foreground)" } : undefined}
              >
                <ClockIcon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0", isColorfulTheme && !isDark && "text-blue-600/70")} style={isDark ? { color: "var(--card-foreground)" } : undefined} />
                <span className="truncate max-w-[60px] sm:max-w-none">{timeDisplay}</span>
              </button>
            ) : (
              <span className={cn("flex items-center gap-0.5 sm:gap-1 shrink-0 text-[10px] sm:text-xs", isDark ? "opacity-70" : "opacity-60", isColorfulTheme && !isDark && "text-blue-600/70")}>
                <ClockIcon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0", isColorfulTheme && !isDark && "text-blue-600/70")} style={isDark ? { color: "var(--card-foreground)" } : undefined} />
                <span className="truncate max-w-[60px] sm:max-w-none">{timeDisplay}</span>
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MemoWordCount;

