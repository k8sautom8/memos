import { useState, useCallback, useEffect, useRef } from "react";
import { SparklesIcon, LoaderIcon, XIcon, Wand2Icon, RefreshCwIcon, MessageSquareIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ollamaService } from "../services/ollamaService";
import type { EditorRefActions } from "../Editor";

interface AISuggestionsProps {
  editorRef: React.RefObject<EditorRefActions>;
}

type AIAction = "rewrite" | "enhance-slight" | "enhance-elaborate" | "suggestions" | "user-prompt" | null;

export default function AISuggestions({ editorRef }: AISuggestionsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<AIAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [userPrompt, setUserPrompt] = useState("");
  const [showUserPromptInput, setShowUserPromptInput] = useState(false);
  const applyButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
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
  const [currentTheme, setCurrentTheme] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.getAttribute("data-theme") || "default";
    }
    return "default";
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute("data-theme") || "default";
      setIsColorfulTheme(theme === "colorful");
      setCurrentTheme(theme);
      const darkThemes = ["default-dark", "midnight"];
      setIsDark(darkThemes.includes(theme));
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    
    return () => observer.disconnect();
  }, []);

  // Force button styles with important flags
  useEffect(() => {
    if (!applyButtonRef.current) return;
    const btn = applyButtonRef.current;
    
    setTimeout(() => {
      if (isDark) {
        btn.style.setProperty("background-color", "var(--muted)", "important");
        btn.style.setProperty("opacity", "0.4", "important");
        btn.style.setProperty("border-color", "var(--border)", "important");
        btn.style.setProperty("color", "#10b981", "important");
      } else if (currentTheme === "colorful") {
        btn.style.setProperty("background-color", "#059669", "important");
        btn.style.setProperty("color", "#ffffff", "important");
      } else {
        // Paper, Whitewall, Default - use theme's primary color
        btn.style.setProperty("background-color", "var(--primary)", "important");
        btn.style.setProperty("color", "var(--primary-foreground)", "important");
      }
    }, 0);
  }, [currentTheme, isDark, isColorfulTheme, showUserPromptInput]);

  useEffect(() => {
    if (!cancelButtonRef.current) return;
    const btn = cancelButtonRef.current;
    
    setTimeout(() => {
      if (isDark) {
        btn.style.setProperty("color", "#d1d5db", "important");
      } else {
        btn.style.setProperty("color", "#374151", "important");
      }
    }, 0);
  }, [currentTheme, isDark, showUserPromptInput]);

  const handleRewrite = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;

    const content = editor.getContent().trim();
    if (!content) {
      setError("Please write some content first before rewriting.");
      return;
    }

    setLoading("rewrite");
    setError(null);

    try {
      const rewritten = await ollamaService.rewriteContent(content);
      editor.setContent(rewritten);
      editor.focus();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rewrite content");
    } finally {
      setLoading(null);
    }
  }, [editorRef]);

  const handleEnhanceSlight = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;

    const content = editor.getContent().trim();
    if (!content) {
      setError("Please write some content first before enhancing.");
      return;
    }

    setLoading("enhance-slight");
    setError(null);

    try {
      const enhanced = await ollamaService.enhanceContentSlight(content);
      editor.setContent(enhanced);
      editor.focus();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enhance content");
    } finally {
      setLoading(null);
    }
  }, [editorRef]);

  const handleEnhanceElaborate = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;

    const content = editor.getContent().trim();
    if (!content) {
      setError("Please write some content first before enhancing.");
      return;
    }

    setLoading("enhance-elaborate");
    setError(null);

    try {
      const enhanced = await ollamaService.enhanceContentElaborate(content);
      editor.setContent(enhanced);
      editor.focus();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enhance content");
    } finally {
      setLoading(null);
    }
  }, [editorRef]);

  const handleGetSuggestions = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;

    const content = editor.getContent();
    const cursorPosition = editor.getCursorPosition();

    if (!content.trim()) {
      setError("Please write some content first before getting suggestions.");
      return;
    }

    setLoading("suggestions");
    setError(null);
    setSuggestions([]);

    try {
      const fetchedSuggestions = await ollamaService.getSuggestions(content, cursorPosition);
      if (fetchedSuggestions.length > 0) {
        setSuggestions(fetchedSuggestions);
      } else {
        setError("No suggestions available. Try writing more content.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get suggestions");
    } finally {
      setLoading(null);
    }
  }, [editorRef]);

  const handleSelectSuggestion = useCallback((suggestion: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const content = editor.getContent();
    const cursorPosition = editor.getCursorPosition();
    const beforeCursor = content.slice(0, cursorPosition);
    const afterCursor = content.slice(cursorPosition);
    const newContent = beforeCursor + suggestion + afterCursor;
    editor.setContent(newContent);
    editor.setCursorPosition(cursorPosition + suggestion.length);
    editor.focus();
    setSuggestions([]);
    setOpen(false);
  }, [editorRef]);

  const handleUserPrompt = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;

    const prompt = userPrompt.trim();
    if (!prompt) {
      setError("Please enter a prompt.");
      return;
    }

    const content = editor.getContent();
    if (!content.trim()) {
      setError("Please write some content first.");
      return;
    }

    setLoading("user-prompt");
    setError(null);

    try {
      // Use the content as context and the user's prompt
      const fullPrompt = `You are an AI writing assistant. The user has provided the following content and wants you to: ${prompt}\n\nContent:\n${content.length < 3000 ? content : content.slice(0, 3000)}\n\nPlease provide your response:`;
      const response = await ollamaService.generateCompletion(fullPrompt);
      const result = response.trim();
      
      if (result) {
        // Replace the entire content with the AI's response
        editor.setContent(result);
        editor.focus();
        setUserPrompt("");
        setShowUserPromptInput(false);
        setOpen(false);
      } else {
        setError("No response from AI. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process custom prompt");
    } finally {
      setLoading(null);
    }
  }, [editorRef, userPrompt]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                // Compact sizing: match formatting toolbar buttons
                "h-8 w-8 sm:h-7 sm:w-7 md:h-6 md:w-6",
                "border-0 shadow-none",
                "rounded-md",
                "transition-all duration-200 ease-out",
                isColorfulTheme && "bg-transparent hover:bg-rose-500/12 text-rose-600 hover:text-rose-700",
                !isColorfulTheme && "bg-transparent hover:bg-primary/5",
                loading && "opacity-70",
              )}
            >
              <SparklesIcon className={cn("h-4 w-4 sm:h-3.5 sm:w-3.5 md:h-3 md:w-3", loading && "animate-pulse", isColorfulTheme && "text-rose-600")} />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>AI Assistant</p>
          <p className="text-xs text-muted-foreground">Get AI suggestions</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent align="start" className="w-80 p-3">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold">AI Assistant</h4>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setOpen(false)}
          >
            <XIcon className="h-3 w-3" />
          </Button>
        </div>

        {/* Option 1: Get contextual suggestions */}
        <div className="mb-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={handleGetSuggestions}
            disabled={loading !== null}
          >
            <SparklesIcon className={cn("h-3.5 w-3.5", loading === "suggestions" && "animate-spin")} />
            <span>{loading === "suggestions" ? "Getting suggestions..." : "Get Contextual Suggestions"}</span>
          </Button>
          <p className="text-xs text-muted-foreground mt-1.5 ml-7">
            Get AI suggestions to continue writing at cursor position
          </p>
          {suggestions.length > 0 && (
            <div className="mt-2 space-y-1">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2 px-3 text-xs"
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  <span className="line-clamp-2">{suggestion}</span>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Option 2: Enhance current writeup */}
        <div className="mb-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                disabled={loading !== null}
              >
                <Wand2Icon className={cn("h-3.5 w-3.5", (loading === "enhance-slight" || loading === "enhance-elaborate") && "animate-spin")} />
                <span>Enhance Current Writeup</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              <DropdownMenuItem
                onClick={handleEnhanceSlight}
                disabled={loading !== null}
                className="cursor-pointer"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">1. Make Slight Changes</span>
                  <span className="text-xs text-muted-foreground">Minor grammar and clarity improvements only</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleEnhanceElaborate}
                disabled={loading !== null}
                className="cursor-pointer"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">2. Make More Elaborate</span>
                  <span className="text-xs text-muted-foreground">Expand on existing points only, no new ideas</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <p className="text-xs text-muted-foreground mt-1.5">
            Improve existing content without adding new ideas
          </p>
        </div>

        {/* Option 3: Re-write completely */}
        <div className="mb-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={handleRewrite}
            disabled={loading !== null}
          >
            <RefreshCwIcon className={cn("h-3.5 w-3.5", loading === "rewrite" && "animate-spin")} />
            <span>{loading === "rewrite" ? "Rewriting..." : "Re-write Completely"}</span>
          </Button>
          <p className="text-xs text-muted-foreground mt-1.5 ml-7">
            AI has full flexibility to rewrite the whole content
          </p>
        </div>

        {/* Option 4: User Prompt */}
        <div className="mb-3">
          {!showUserPromptInput ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => setShowUserPromptInput(true)}
              disabled={loading !== null}
            >
              <MessageSquareIcon className="h-3.5 w-3.5" />
              <span>Custom Prompt</span>
            </Button>
          ) : (
            <div className="space-y-2">
              <Textarea
                placeholder="Enter your custom prompt (e.g., 'Make it more formal', 'Add examples', 'Summarize')"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="text-xs min-h-[60px]"
                disabled={loading !== null}
              />
              <div className="flex gap-2">
                <Button
                  ref={applyButtonRef}
                  variant="default"
                  size="sm"
                  className={cn(
                    "flex-1 !font-medium",
                    isDark && "!bg-muted/40 !border-border/60 backdrop-blur-sm shadow-sm",
                    !isDark && currentTheme === "colorful" && "!bg-emerald-600 !text-white",
                    !isDark && currentTheme !== "colorful" && "!bg-blue-600 !text-white",
                  )}
                  onClick={handleUserPrompt}
                  disabled={loading !== null || !userPrompt.trim()}
                  style={(() => {
                    if (isDark) {
                      return {
                        backgroundColor: "var(--muted)",
                        opacity: 0.4,
                        borderColor: "var(--border)",
                        color: "#10b981",
                      } as React.CSSProperties & { backgroundColor?: string; opacity?: number; color?: string };
                    }
                    
                    // Theme-specific colors for light themes
                    if (currentTheme === "colorful") {
                      return {
                        backgroundColor: "#059669",
                        color: "#ffffff",
                      } as React.CSSProperties & { backgroundColor?: string; color?: string };
                    } else {
                      // Paper, Whitewall, Default: use theme's primary color
                      return {
                        backgroundColor: "var(--primary)",
                        color: "var(--primary-foreground)",
                      } as React.CSSProperties & { backgroundColor?: string; color?: string };
                    }
                  })()}
                  onMouseEnter={(e) => {
                    if (isDark) {
                      e.currentTarget.style.setProperty("opacity", "0.6", "important");
                    } else {
                      if (currentTheme === "colorful") {
                        e.currentTarget.style.setProperty("background-color", "#047857", "important");
                        e.currentTarget.style.setProperty("color", "#ffffff", "important");
                      } else {
                        // Use filter to darken primary color on hover
                        e.currentTarget.style.setProperty("filter", "brightness(0.9)", "important");
                      }
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isDark) {
                      e.currentTarget.style.setProperty("opacity", "0.4", "important");
                    } else {
                      if (currentTheme === "colorful") {
                        e.currentTarget.style.setProperty("background-color", "#059669", "important");
                        e.currentTarget.style.setProperty("color", "#ffffff", "important");
                      } else {
                        e.currentTarget.style.setProperty("filter", "none", "important");
                      }
                    }
                  }}
                >
                  <span style={isDark ? { color: "#10b981" } : { color: "#ffffff" }}>
                    {loading === "user-prompt" ? (
                      <>
                        <LoaderIcon className="h-3.5 w-3.5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Apply Prompt"
                    )}
                  </span>
                </Button>
                <Button
                  ref={cancelButtonRef}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "!font-medium",
                    isDark && "!text-gray-300 hover:!bg-muted/60",
                    !isDark && "!text-gray-700 hover:!bg-muted/40",
                  )}
                  onClick={() => {
                    setShowUserPromptInput(false);
                    setUserPrompt("");
                  }}
                  disabled={loading !== null}
                  style={(() => {
                    if (isDark) {
                      return {
                        color: "#d1d5db",
                      } as React.CSSProperties & { color?: string };
                    }
                    return {
                      color: "#374151",
                    } as React.CSSProperties & { color?: string };
                  })()}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1.5 ml-7">
            Provide your own instructions for AI to process the content
          </p>
        </div>

        {error && (
          <div className="py-3 text-xs text-destructive bg-destructive/10 rounded-md p-2">
            <p className="font-medium mb-1">Error</p>
            <p>{error}</p>
            <p className="mt-2 text-muted-foreground">
              Make sure Ollama is running and configured correctly.
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

