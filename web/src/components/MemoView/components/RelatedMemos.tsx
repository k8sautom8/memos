import { useMemo, useState } from "react";
import { Link2Icon, Loader2Icon, SearchIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useMemos } from "@/hooks/useMemoQueries";
import type { Memo } from "@/types/proto/api/v1/memo_service_pb";
import { ollamaService } from "@/components/MemoEditor/services/ollamaService";
import { Button } from "@/components/ui/button";

interface RelatedMemosProps {
  currentMemo: Memo;
  className?: string;
  maxResults?: number;
  relatedMemoNames?: string[];
  allMemos?: Memo[];
}

const RelatedMemos: React.FC<RelatedMemosProps> = ({ 
  currentMemo, 
  className, 
  maxResults = 3,
  relatedMemoNames: externalRelatedMemoNames,
  allMemos: externalAllMemos
}) => {
  const [relatedMemoNames, setRelatedMemoNames] = useState<string[]>(externalRelatedMemoNames || []);
  const [isFinding, setIsFinding] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const { data: allMemosResponse } = useMemos({ pageSize: 100 });
  const allMemos = externalAllMemos || allMemosResponse?.memos || [];

  const findRelatedMemos = async () => {
    if (!currentMemo.content || currentMemo.content.trim().length < 20) {
      return;
    }

    setIsFinding(true);
    setHasSearched(true);
    
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

Return only the memo names (format: memos/...) that are most related to the current memo, one per line, without numbering or bullets. Return up to ${maxResults} related memos:`;

      const response = await ollamaService.generateCompletion(prompt);
      
      const names = response
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("memos/"))
        .slice(0, maxResults);

      setRelatedMemoNames(names);
    } catch (error) {
      console.error("Failed to find related memos:", error);
      // Fallback: find memos with similar tags
      if (currentMemo.tags && currentMemo.tags.length > 0) {
        const related = allMemos
          .filter((m) => m.name !== currentMemo.name && m.tags && m.tags.some((tag) => currentMemo.tags.includes(tag)))
          .slice(0, maxResults)
          .map((m) => m.name);
        setRelatedMemoNames(related);
      }
    } finally {
      setIsFinding(false);
    }
  };

  const relatedMemos = useMemo(() => {
    const names = externalRelatedMemoNames || relatedMemoNames;
    return allMemos.filter((m) => names.includes(m.name));
  }, [allMemos, externalRelatedMemoNames, relatedMemoNames]);

  // If external props provided, skip button logic
  if (externalRelatedMemoNames !== undefined) {
    if (relatedMemos.length === 0) {
      return null;
    }
  } else {
    // Show button if user hasn't searched yet or if no results found
    if (!hasSearched || (!isFinding && relatedMemos.length === 0)) {
    const canSearch = currentMemo.content && currentMemo.content.trim().length >= 20;
    
    return (
      <div className={cn("flex items-center gap-2 px-2 py-1.5", className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={findRelatedMemos}
          disabled={isFinding || !canSearch}
          className={cn(
            "h-8 px-3 text-xs font-medium",
            "border-primary/30 hover:border-primary/50",
            "hover:bg-primary/5",
            !canSearch && "opacity-50 cursor-not-allowed"
          )}
        >
          {isFinding ? (
            <>
              <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
              Finding...
            </>
          ) : (
            <>
              <SearchIcon className="w-4 h-4 mr-2" />
              Find Related Memos
            </>
          )}
        </Button>
        {!canSearch && (
          <span className="text-xs text-muted-foreground">
            (Memo needs at least 20 characters)
          </span>
        )}
      </div>
    );
    }
  }

  if (isFinding && externalRelatedMemoNames === undefined) {
    return (
      <div className={cn("flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground", className)}>
        <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
        <span>Finding related memos...</span>
      </div>
    );
  }

  if (relatedMemos.length === 0 && externalRelatedMemoNames === undefined) {
    return (
      <div className={cn("flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground", className)}>
        <span>No related memos found.</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={findRelatedMemos}
          className="h-6 text-xs"
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 px-2 py-1.5 text-xs",
        "bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30",
        "dark:from-blue-950/10 dark:via-purple-950/8 dark:to-pink-950/10",
        "border border-blue-200/30 dark:border-blue-800/20 rounded-md",
        "backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
        <Link2Icon className="w-3.5 h-3.5" />
        <span>Related</span>
      </div>
      <div className="flex flex-col gap-1">
        {relatedMemos.map((memo) => {
          // Strip markdown/html and get clean text snippet
          const cleanSnippet = (memo.snippet || memo.content || "")
            .replace(/```[\s\S]*?```/g, "") // Remove code blocks
            .replace(/`[^`]+`/g, "") // Remove inline code
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Convert links to text
            .replace(/<[^>]+>/g, "") // Remove HTML tags
            .replace(/#{1,6}\s+/g, "") // Remove markdown headers
            .replace(/\*\*([^\*]+)\*\*/g, "$1") // Remove bold
            .replace(/\*([^\*]+)\*/g, "$1") // Remove italic
            .replace(/~~([^~]+)~~/g, "$1") // Remove strikethrough
            .replace(/\n+/g, " ") // Replace newlines with spaces
            .trim()
            .slice(0, 80); // Limit to 80 chars
          
          return (
            <Link
              key={memo.name}
              to={`/${memo.name}`}
              className="text-primary hover:underline truncate"
              viewTransition
            >
              {cleanSnippet || "Related memo"}...
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default RelatedMemos;

