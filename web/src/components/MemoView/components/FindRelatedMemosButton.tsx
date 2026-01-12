import { useState, useEffect } from "react";
import { SearchIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useMemos } from "@/hooks/useMemoQueries";
import type { Memo } from "@/types/proto/api/v1/memo_service_pb";
import { ollamaService } from "@/components/MemoEditor/services/ollamaService";

interface FindRelatedMemosButtonProps {
  currentMemo: Memo;
  onRelatedMemosFound?: (memoNames: string[]) => void;
}

const FindRelatedMemosButton: React.FC<FindRelatedMemosButtonProps> = ({ currentMemo, onRelatedMemosFound }) => {
  const [isFinding, setIsFinding] = useState(false);
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

  const { data: allMemosResponse } = useMemos({ pageSize: 100 });
  const allMemos = allMemosResponse?.memos || [];

  const findRelatedMemos = async () => {
    if (!currentMemo.content || currentMemo.content.trim().length < 20) {
      return;
    }

    setIsFinding(true);
    
    try {
      // Get snippets of other memos for context
      const memoContexts = allMemos
        .filter((m) => m.name !== currentMemo.name && m.content)
        .slice(0, 20) // Limit to 20 memos for context
        .map((m) => ({
          name: m.name,
          snippet: m.snippet || m.content.slice(0, 200),
        }));

      const prompt = `Analyze the following memo and find the most related memos from the list provided.

Current Memo:
${currentMemo.content.slice(0, 1000)}

Available Memos:
${memoContexts.map((m) => `- ${m.name}: ${m.snippet}`).join("\n")}

Return only the memo names (format: memos/...) that are most related to the current memo, one per line, without numbering or bullets. Return up to 3 related memos:`;

      const response = await ollamaService.generateCompletion(prompt);
      
      const names = response
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("memos/"))
        .slice(0, 3);

      if (onRelatedMemosFound) {
        onRelatedMemosFound(names);
      }
    } catch (error) {
      console.error("Failed to find related memos:", error);
      // Fallback: find memos with similar tags
      if (currentMemo.tags && currentMemo.tags.length > 0) {
        const related = allMemos
          .filter((m) => m.name !== currentMemo.name && m.tags && m.tags.some((tag) => currentMemo.tags.includes(tag)))
          .slice(0, 3)
          .map((m) => m.name);
        if (onRelatedMemosFound) {
          onRelatedMemosFound(related);
        }
      }
    } finally {
      setIsFinding(false);
    }
  };

  const canSearch = currentMemo.content && currentMemo.content.trim().length >= 20;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={findRelatedMemos}
          disabled={isFinding || !canSearch}
          className={cn(
            "h-7 w-7 sm:h-8 sm:w-8",
            !isDark && "bg-transparent",
            isColorfulTheme && !isDark && "hover:bg-blue-500/12 hover:text-blue-600 text-blue-600/70"
          )}
          style={isDark ? {
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
            color: "var(--card-foreground)",
          } : undefined}
          onMouseEnter={(e) => {
            if (isDark) {
              e.currentTarget.style.backgroundColor = "var(--accent)";
            }
          }}
          onMouseLeave={(e) => {
            if (isDark) {
              e.currentTarget.style.backgroundColor = "var(--card)";
            }
          }}
        >
          <span style={isDark ? { color: "var(--card-foreground)", display: "inline-block" } : undefined}>
            {isFinding ? (
              <Loader2Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin", isColorfulTheme && !isDark && "text-blue-600/70")} />
            ) : (
              <SearchIcon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isColorfulTheme && !isDark && "text-blue-600/70")} />
            )}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Find Related Memos</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default FindRelatedMemosButton;

