import { useMemo, useState, useEffect } from "react";
import { TagIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Memo } from "@/types/proto/api/v1/memo_service_pb";

interface MemoTagsProps {
  memo: Memo;
  className?: string;
}

const MemoTags: React.FC<MemoTagsProps> = ({ memo, className }) => {
  // Only display existing tags - tag generation happens during save
  // Tags are stored with # in content for searchability, but displayed without #
  const displayTags = useMemo(() => {
    if (memo.tags && memo.tags.length > 0) {
      return memo.tags
        .slice(0, 3)
        .map((tag) => tag.replace(/^#+/, "")); // Remove any leading # symbols
    }
    return [];
  }, [memo.tags]);

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

  if (displayTags.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 text-xs",
        isColorfulTheme && !isDark && "bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30",
        isColorfulTheme && !isDark && "border border-blue-200/30",
        !isColorfulTheme && !isDark && "bg-muted/40 border border-border/60",
        "rounded-md",
        "backdrop-blur-sm",
        className,
      )}
      style={isDark ? {
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
        color: "var(--card-foreground)",
      } : undefined}
    >
      <TagIcon 
        className={cn(
          "w-3.5 h-3.5 shrink-0",
          isColorfulTheme && !isDark && "text-purple-600/70"
        )}
        style={isDark ? { color: "var(--card-foreground)" } : undefined}
      />
      <div className="flex items-center gap-1.5 flex-wrap">
        {displayTags.map((tag, index) => {
          const tagColors = [
            { bg: "bg-blue-500/15", text: "text-blue-700", border: "border-blue-400/30" },
            { bg: "bg-purple-500/15", text: "text-purple-700", border: "border-purple-400/30" },
            { bg: "bg-pink-500/15", text: "text-pink-700", border: "border-pink-400/30" },
          ];
          const colorScheme = isColorfulTheme && !isDark ? tagColors[index % tagColors.length] : null;
          
          return (
            <span
              key={index}
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-medium border",
                isColorfulTheme && !isDark && colorScheme && `${colorScheme.bg} ${colorScheme.text} ${colorScheme.border}`,
                !isColorfulTheme && !isDark && "bg-primary/10 text-primary border-primary/20"
              )}
              style={isDark ? {
                backgroundColor: "var(--muted)",
                color: "var(--card-foreground)",
                borderColor: "var(--border)",
              } : undefined}
            >
              {tag.replace(/_/g, " ")}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default MemoTags;

