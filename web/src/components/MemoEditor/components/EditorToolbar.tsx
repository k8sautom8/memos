import type { FC } from "react";
import { useState, useEffect } from "react";
import { Maximize2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { validationService } from "../services";
import { useEditorContext } from "../state";
import InsertMenu from "../Toolbar/InsertMenu";
import VisibilitySelector from "../Toolbar/VisibilitySelector";
import FormattingToolbar from "../Toolbar/FormattingToolbar";
import WordCount from "../Toolbar/WordCount";
import ExportMenu from "../Toolbar/ExportMenu";
import TemplateMenu from "../Toolbar/TemplateMenu";
import AISuggestions from "../Toolbar/AISuggestions";
import { AutoSaveIndicator } from "./AutoSaveIndicator";
import type { EditorToolbarProps } from "../types";
import { useTranslate } from "@/utils/i18n";
import useMediaQuery from "@/hooks/useMediaQuery";

export const EditorToolbar: FC<EditorToolbarProps> = ({ onSave, onCancel, memoName, editorRef }) => {
  const { state, actions, dispatch } = useEditorContext();
  const { valid } = validationService.canSave(state);
  const t = useTranslate();

  const isSaving = state.ui.isLoading.saving;
  const isFocusMode = state.ui.isFocusMode;
  const hasContent = state.content.trim().length > 0;
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
      setCurrentTheme(theme);
      const darkThemes = ["default-dark", "midnight"];
      setIsDark(darkThemes.includes(theme));
      
      // Apply Save button styles for non-colorful themes using setProperty with important flag
      if (theme !== "colorful" && !darkThemes.includes(theme)) {
        setTimeout(() => {
          const saveButtons = document.querySelectorAll('button[data-save-button="true"]');
          saveButtons.forEach((btn) => {
            const htmlBtn = btn as HTMLElement;
            htmlBtn.style.setProperty("background-color", "var(--primary)", "important");
            htmlBtn.style.setProperty("color", "var(--primary-foreground)", "important");
          });
        }, 0);
      }
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    
    return () => observer.disconnect();
  }, []);

  const handleLocationChange = (location: typeof state.metadata.location) => {
    dispatch(actions.setMetadata({ location }));
  };

  const handleToggleFocusMode = () => {
    dispatch(actions.toggleFocusMode());
  };

  const handleVisibilityChange = (visibility: typeof state.metadata.visibility) => {
    dispatch(actions.setMetadata({ visibility }));
  };

  return (
    <div className="w-full flex flex-col gap-2 min-w-0">
      {/* Formatting toolbar */}
      {editorRef && <FormattingToolbar editorRef={editorRef} />}

      {/* Compact combined row: Actions + Stats + Save */}
      <div className="w-full relative min-w-0">
        {/* Mobile: single compact row with proper overflow handling */}
        <div className="flex md:hidden flex-row items-center gap-1.5 min-w-0 overflow-x-auto scrollbar-hide flex-nowrap">
          {/* Left: Action buttons */}
          <div className={cn(
            "flex flex-row items-center gap-0.5",
            "border border-border/60 rounded-lg",
            "p-0.5",
            "flex-nowrap shrink-0",
            currentTheme === "colorful"
              ? "bg-gradient-to-br from-blue-50/40 via-purple-50/30 to-pink-50/40"
              : "bg-muted/40",
            "shadow-sm backdrop-blur-sm",
            "transition-all duration-200 ease-out"
          )}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    "border-0 shadow-none",
                    isFocusMode && "bg-primary/10",
                    "bg-transparent hover:bg-primary/5 active:bg-primary/10",
                    "transition-all duration-200 ease-out",
                    "rounded-md",
                  )}
                  onClick={handleToggleFocusMode}
                >
                  <Maximize2Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("editor.focus-mode")}</p>
                <p className="text-xs text-muted-foreground">⌘⇧F</p>
              </TooltipContent>
            </Tooltip>
            {editorRef && <TemplateMenu editorRef={editorRef} />}
            {editorRef && <AISuggestions editorRef={editorRef} />}
            {editorRef && (
              <InsertMenu
                isUploading={state.ui.isLoading.uploading}
                location={state.metadata.location}
                onLocationChange={handleLocationChange}
                onToggleFocusMode={handleToggleFocusMode}
                memoName={memoName}
                editorRef={editorRef}
              />
            )}
            {editorRef && <ExportMenu editorRef={editorRef} />}
          </div>
          
          {/* Right: Stats + Visibility + Save (mobile: no word count) */}
          <div className="flex flex-row items-center gap-1 min-w-0 shrink-0 flex-nowrap">
            <AutoSaveIndicator />
            <VisibilitySelector value={state.metadata.visibility} onChange={handleVisibilityChange} />
            {onCancel && (
              <Button 
                variant="ghost" 
                onClick={onCancel} 
                disabled={isSaving}
                className="h-8 px-2 text-[10px] rounded-md transition-all duration-200 ease-out shrink-0"
              >
                Cancel
              </Button>
            )}
            <Button 
              variant="success"
              onClick={onSave} 
              disabled={!valid || isSaving}
              data-save-button="true"
              className={cn(
                "save-button",
                "h-8 px-3 rounded-lg shrink-0",
                "font-medium text-xs",
                "shadow-sm hover:shadow-md active:shadow-sm",
                "backdrop-blur-sm",
                "transition-all duration-200 ease-out",
                isDark && "bg-muted/40 border-border/60",
              )}
              style={(() => {
                if (isDark) {
                  return {
                    backgroundColor: "var(--muted)",
                    opacity: 0.4,
                    borderColor: "var(--border)",
                    color: "#10b981",
                  } as React.CSSProperties & { backgroundColor?: string; opacity?: number };
                }
                
                // Theme-specific colors for light themes
                if (currentTheme === "colorful") {
                  // Colorful theme: bright emerald
                  return {
                    backgroundColor: hasContent ? "#059669" : "#34d399",
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
                    const colors = { empty: "#10b981", filled: "#047857" };
                    e.currentTarget.style.setProperty("background-color", hasContent ? colors.filled : colors.empty, "important");
                  } else {
                    // Paper, Whitewall, Default: darken primary color slightly on hover
                    e.currentTarget.style.setProperty("filter", "brightness(0.9)", "important");
                  }
                }
              }}
              onMouseLeave={(e) => {
                if (isDark) {
                  e.currentTarget.style.setProperty("opacity", "0.4", "important");
                } else {
                  if (currentTheme === "colorful") {
                    const colors = { empty: "#34d399", filled: "#059669" };
                    e.currentTarget.style.setProperty("background-color", hasContent ? colors.filled : colors.empty, "important");
                  } else {
                    // Paper, Whitewall, Default: restore filter
                    e.currentTarget.style.setProperty("filter", "none", "important");
                  }
                }
              }}
            >
              <span style={isDark ? { color: "#10b981" } : { color: "#ffffff" }}>
                {isSaving ? "Saving..." : "Save"}
              </span>
            </Button>
          </div>
        </div>
        {/* Desktop: normal justify-between layout */}
        <div className="hidden md:flex flex-row justify-between items-center min-w-0 gap-2">
          <div className="flex flex-row justify-start items-center gap-2 min-w-0">
            <div className={cn(
              // Consistent spacing: match formatting toolbar container
              "flex flex-row items-center gap-1",
              "border border-border/60 rounded-lg p-0.5",
              currentTheme === "colorful"
                ? "bg-gradient-to-br from-blue-50/40 via-purple-50/30 to-pink-50/40"
                : "bg-muted/40",
              "shadow-sm backdrop-blur-sm",
              "transition-all duration-200 ease-out"
            )}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      // Consistent sizing: match formatting toolbar buttons
                      "h-8 w-8 md:h-7 md:w-7 lg:h-6 lg:w-6",
                      "border-0 shadow-none",
                      isFocusMode && "bg-primary/10",
                      "bg-transparent hover:bg-primary/5 active:bg-primary/10",
                      "transition-all duration-200 ease-out",
                      "rounded-lg",
                    )}
                    onClick={handleToggleFocusMode}
                  >
                    <Maximize2Icon className="h-5 w-5 md:h-4 md:w-4 lg:h-3.5 lg:w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("editor.focus-mode")}</p>
                  <p className="text-xs text-muted-foreground">⌘⇧F</p>
                </TooltipContent>
              </Tooltip>
              {editorRef && <TemplateMenu editorRef={editorRef} />}
              {editorRef && <AISuggestions editorRef={editorRef} />}
              {editorRef && (
                <InsertMenu
                  isUploading={state.ui.isLoading.uploading}
                  location={state.metadata.location}
                  onLocationChange={handleLocationChange}
                  onToggleFocusMode={handleToggleFocusMode}
                  memoName={memoName}
                  editorRef={editorRef}
                />
              )}
              {editorRef && <ExportMenu editorRef={editorRef} />}
            </div>
          </div>

          <div className="flex flex-row justify-end items-center gap-2 min-w-0 flex-shrink-0">
            <AutoSaveIndicator />
            {editorRef && <WordCount editorRef={editorRef} />}
            <VisibilitySelector value={state.metadata.visibility} onChange={handleVisibilityChange} />

            {onCancel && (
              <Button variant="ghost" onClick={onCancel} disabled={isSaving}>
                Cancel
              </Button>
            )}

            <Button 
              variant="success"
              onClick={onSave} 
              disabled={!valid || isSaving}
              data-save-button="true"
              className={cn(
                "save-button",
                isDark && "bg-muted/40 border-border/60 backdrop-blur-sm shadow-sm",
              )}
              style={(() => {
                if (isDark) {
                  return {
                    backgroundColor: "var(--muted)",
                    opacity: 0.4,
                    borderColor: "var(--border)",
                    color: "#10b981",
                  } as React.CSSProperties & { backgroundColor?: string; opacity?: number };
                }
                
                // Theme-specific colors for light themes
                if (currentTheme === "colorful") {
                  // Colorful theme: bright emerald
                  return {
                    backgroundColor: hasContent ? "#059669" : "#34d399",
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
                  e.currentTarget.style.setProperty("background-color", "var(--accent)", "important");
                } else {
                  if (currentTheme === "colorful") {
                    const colors = { empty: "#10b981", filled: "#047857" };
                    e.currentTarget.style.setProperty("background-color", hasContent ? colors.filled : colors.empty, "important");
                  } else {
                    // Paper, Whitewall, Default: darken primary color slightly on hover
                    e.currentTarget.style.setProperty("filter", "brightness(0.9)", "important");
                  }
                }
              }}
              onMouseLeave={(e) => {
                if (isDark) {
                  e.currentTarget.style.setProperty("background-color", "var(--card)", "important");
                } else {
                  if (currentTheme === "colorful") {
                    const colors = { empty: "#34d399", filled: "#059669" };
                    e.currentTarget.style.setProperty("background-color", hasContent ? colors.filled : colors.empty, "important");
                  } else {
                    // Paper, Whitewall, Default: restore filter
                    e.currentTarget.style.setProperty("filter", "none", "important");
                  }
                }
              }}
            >
              <span style={isDark ? { color: "#10b981" } : { color: "#ffffff" }}>
                {isSaving ? "Saving..." : "Save"}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
