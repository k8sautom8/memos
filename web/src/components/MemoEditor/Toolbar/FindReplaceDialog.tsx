import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SearchIcon, ReplaceIcon, ChevronUpIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EditorRefActions } from "../Editor";

interface FindReplaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editorRef: React.RefObject<EditorRefActions>;
  mode?: "find" | "replace";
}

export default function FindReplaceDialog({
  open,
  onOpenChange,
  editorRef,
  mode: initialMode = "find",
}: FindReplaceDialogProps) {
  const [searchText, setSearchText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [mode, setMode] = useState<"find" | "replace">(initialMode);
  const [matchCase, setMatchCase] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [matches, setMatches] = useState<Array<{ start: number; end: number }>>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const editor = editorRef.current;

  // Find all matches
  const findMatches = (text: string, search: string, caseSensitive: boolean): Array<{ start: number; end: number }> => {
    if (!search) return [];
    const matches: Array<{ start: number; end: number }> = [];
    const flags = caseSensitive ? "g" : "gi";
    const regex = new RegExp(escapeRegex(search), flags);
    let match;

    while ((match = regex.exec(text)) !== null) {
      matches.push({ start: match.index, end: match.index + match[0].length });
    }

    return matches;
  };

  const escapeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  // Update matches when search text changes
  useEffect(() => {
    if (!editor || !searchText) {
      setMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const content = editor.getContent();
    const foundMatches = findMatches(content, searchText, matchCase);
    setMatches(foundMatches);
    setCurrentMatchIndex(foundMatches.length > 0 ? 0 : -1);
  }, [searchText, matchCase, editor]);

  // Highlight current match
  useEffect(() => {
    if (!editor || matches.length === 0 || currentMatchIndex < 0) return;

    const match = matches[currentMatchIndex];
    editor.setCursorPosition(match.start, match.end);
    editor.scrollToCursor();
  }, [currentMatchIndex, matches, editor]);

  // Focus search input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (mode === "replace" && replaceInputRef.current) {
          replaceInputRef.current.focus();
        } else if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }, 100);
    } else {
      setSearchText("");
      setReplaceText("");
      setMatches([]);
      setCurrentMatchIndex(-1);
    }
  }, [open, mode]);

  const handleFindNext = () => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
  };

  const handleFindPrevious = () => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
  };

  const handleReplace = () => {
    if (!editor || matches.length === 0 || currentMatchIndex < 0) return;

    const match = matches[currentMatchIndex];
    const content = editor.getContent();
    const before = content.slice(0, match.start);
    const after = content.slice(match.end);
    const newContent = before + replaceText + after;

    editor.setContent(newContent);

    // Recalculate matches after replacement
    const newMatches = findMatches(newContent, searchText, matchCase);
    setMatches(newMatches);
    if (newMatches.length > 0) {
      // Adjust current index if needed
      const newIndex = Math.min(currentMatchIndex, newMatches.length - 1);
      setCurrentMatchIndex(newIndex);
    } else {
      setCurrentMatchIndex(-1);
    }
  };

  const handleReplaceAll = () => {
    if (!editor || matches.length === 0) return;

    let content = editor.getContent();
    const flags = matchCase ? "g" : "gi";
    const regex = new RegExp(escapeRegex(searchText), flags);
    content = content.replace(regex, replaceText);

    editor.setContent(content);
    setMatches([]);
    setCurrentMatchIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      handleFindPrevious();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (mode === "replace" && matches.length > 0) {
        handleReplace();
      } else {
        handleFindNext();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "replace" ? "Find & Replace" : "Find"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {/* Search Input */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="search">Find</Label>
            <div className="relative">
              <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                ref={searchInputRef}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search..."
                className="pl-8"
              />
            </div>
          </div>

          {/* Replace Input (only in replace mode) */}
          {mode === "replace" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="replace">Replace</Label>
              <div className="relative">
                <ReplaceIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="replace"
                  ref={replaceInputRef}
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Replace with..."
                  className="pl-8"
                />
              </div>
            </div>
          )}

          {/* Options */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
                className="rounded"
              />
              <span>Match case</span>
            </label>
          </div>

          {/* Match Info and Navigation */}
          {searchText && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {matches.length > 0
                  ? `${currentMatchIndex + 1} of ${matches.length}`
                  : "No matches found"}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleFindPrevious}
                  disabled={matches.length === 0}
                >
                  <ChevronUpIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleFindNext}
                  disabled={matches.length === 0}
                >
                  <ChevronDownIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            {mode === "find" && (
              <Button variant="outline" onClick={() => setMode("replace")}>
                Replace
              </Button>
            )}
            {mode === "replace" && (
              <>
                <Button variant="outline" onClick={handleReplace} disabled={matches.length === 0}>
                  Replace
                </Button>
                <Button variant="outline" onClick={handleReplaceAll} disabled={matches.length === 0}>
                  Replace All
                </Button>
                <Button variant="ghost" onClick={() => setMode("find")}>
                  Find Only
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

