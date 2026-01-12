import { useEffect, useState, useCallback } from "react";
import { FileTextIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorContext } from "../state";
import type { EditorRefActions } from "../Editor";

interface WordCountProps {
  editorRef: React.RefObject<EditorRefActions>;
  className?: string;
}

const WordCount: React.FC<WordCountProps> = ({ editorRef, className }) => {
  const { state } = useEditorContext();
  const [stats, setStats] = useState({
    words: 0,
    characters: 0,
    charactersNoSpaces: 0,
    paragraphs: 0,
    readingTime: 0,
  });
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

  const updateStats = useCallback(() => {
    const content = state.content || "";
    const words = content.trim() === "" ? 0 : content.trim().split(/\s+/).length;
    const characters = content.length;
    const charactersNoSpaces = content.replace(/\s/g, "").length;
    const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length || (content.trim() ? 1 : 0);
    
    // Estimate reading time (average 200 words per minute)
    const readingTimeMinutes = Math.ceil(words / 200);
    
    setStats({
      words,
      characters,
      charactersNoSpaces,
      paragraphs,
      readingTime: readingTimeMinutes,
    });
  }, [state.content]);

  useEffect(() => {
    updateStats();
  }, [updateStats]);

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-1.5 py-0.5 text-[10px] sm:text-xs rounded-md backdrop-blur-sm",
        !isDark && isColorfulTheme && "bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 border border-blue-200/30 text-muted-foreground",
        !isDark && !isColorfulTheme && "bg-muted/40 border border-border/60 text-muted-foreground",
        className,
      )}
      style={isDark ? {
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
        color: "var(--card-foreground)",
      } : undefined}
      title={`Words: ${stats.words} | Characters: ${stats.characters} | Reading time: ${stats.readingTime} min`}
    >
      <FileTextIcon 
        className="w-3 h-3 shrink-0"
        style={isDark ? { color: "var(--card-foreground)" } : undefined}
      />
      <div className="flex items-center gap-1 flex-nowrap whitespace-nowrap" style={isDark ? { color: "#ffffff" } : undefined}>
        <span className="font-medium">{stats.words}</span>
        <span className={cn("hidden sm:inline", isDark ? "opacity-70" : "opacity-60")}>words</span>
        <span className={isDark ? "opacity-50" : "opacity-40"}>•</span>
        <span className="font-medium">{stats.characters}</span>
        <span className={cn("hidden sm:inline", isDark ? "opacity-70" : "opacity-60")}>chars</span>
        {stats.readingTime > 0 && (
          <>
            <span className={isDark ? "opacity-50" : "opacity-40"}>•</span>
            <span className="font-medium">{stats.readingTime}</span>
            <span className={cn("hidden sm:inline", isDark ? "opacity-70" : "opacity-60")}>min</span>
          </>
        )}
      </div>
    </div>
  );
};

export default WordCount;

