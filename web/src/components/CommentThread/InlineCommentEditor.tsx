import { useQueryClient } from "@tanstack/react-query";
import { XIcon } from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import useCurrentUser from "@/hooks/useCurrentUser";
import { memoKeys } from "@/hooks/useMemoQueries";
import { userKeys } from "@/hooks/useUserQueries";
import { handleError } from "@/lib/error";
import { useTranslate } from "@/utils/i18n";
import { convertVisibilityFromString } from "@/utils/memo";
import { EditorContent } from "@/components/MemoEditor/components";
import { FormattingToolbar } from "@/components/MemoEditor/Toolbar";
import { EditorProvider, useEditorContext } from "@/components/MemoEditor/state";
import { useAutoSave, useKeyboard, useMemoInit } from "@/components/MemoEditor/hooks";
import { cacheService, errorService, memoService, validationService } from "@/components/MemoEditor/services";
import type { EditorRefActions } from "@/components/MemoEditor/Editor";
import UserAvatar from "../UserAvatar";
import { memoServiceClient } from "@/connect";

interface InlineCommentEditorProps {
  parentMemoName: string;
  placeholder?: string;
  autoFocus?: boolean;
  onConfirm?: (memoName: string) => void;
  onCancel?: () => void;
  cacheKey: string;
  isReply?: boolean; // true for replies, false/undefined for top-level comments
}

const InlineCommentEditorImpl: React.FC<InlineCommentEditorProps> = ({
  parentMemoName,
  placeholder = "Add your reply here...",
  autoFocus = false,
  onConfirm,
  onCancel,
  cacheKey,
  isReply = false,
}) => {
  const t = useTranslate();
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const editorRef = useRef<EditorRefActions>(null);
  const { state, actions, dispatch } = useEditorContext();
  const { userGeneralSetting } = useAuth();
  const [showFormatting, setShowFormatting] = useState(false);

  // Theme detection for button styling
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
  const [isColorfulTheme, setIsColorfulTheme] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.getAttribute("data-theme") === "colorful";
    }
    return false;
  });

  const replyButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute("data-theme") || "default";
      setCurrentTheme(theme);
      const darkThemes = ["default-dark", "midnight"];
      setIsDark(darkThemes.includes(theme));
      setIsColorfulTheme(theme === "colorful");
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  // Apply button styles after render with important flag
  React.useEffect(() => {
    const darkThemes = ["default-dark", "midnight"];

    if (replyButtonRef.current) {
      const btn = replyButtonRef.current;
      setTimeout(() => {
        if (darkThemes.includes(currentTheme)) {
          btn.style.setProperty("background-color", "var(--card)", "important");
          btn.style.setProperty("color", "#10b981", "important");
          btn.style.setProperty("border-color", "var(--border)", "important");
        } else if (currentTheme === "colorful") {
          btn.style.setProperty("background-color", "#2563eb", "important");
          btn.style.setProperty("color", "#ffffff", "important");
        } else {
          btn.style.setProperty("background-color", "#3b82f6", "important");
          btn.style.setProperty("color", "#ffffff", "important");
        }
      }, 0);
    }
  }, [currentTheme, isDark, isColorfulTheme]);

  const defaultVisibility = userGeneralSetting?.memoVisibility
    ? convertVisibilityFromString(userGeneralSetting.memoVisibility)
    : undefined;

  useMemoInit(editorRef, undefined, cacheKey, currentUser?.name ?? "", autoFocus, defaultVisibility);
  useAutoSave(state.content, currentUser?.name ?? "", cacheKey);
  useKeyboard(editorRef, { onSave: handleSave });

  const hasContent = state.content.trim().length > 0;

  // Show formatting when user starts typing
  React.useEffect(() => {
    if (hasContent) {
      setShowFormatting(true);
    }
  }, [hasContent]);

  async function handleSave() {
    // Validate content is not empty
    if (!hasContent) {
      toast.error("Content cannot be empty");
      return;
    }

    const { valid, reason } = validationService.canSave(state);
    if (!valid) {
      toast.error(reason || "Cannot save");
      return;
    }

    dispatch(actions.setLoading("saving", true));

    try {
      const result = await memoService.save(state, { memoName: undefined, parentMemoName });

      if (!result.hasChanges) {
        toast.error(t("editor.no-changes-detected"));
        onCancel?.();
        return;
      }

      cacheService.clear(cacheService.key(currentUser?.name ?? "", cacheKey));
      
      // Find the root memo to invalidate its comments
      // For top-level comments, parentMemoName is already the root memo
      // For replies, we need to traverse up to find the root memo
      let rootMemoName = parentMemoName;
      
      if (isReply) {
        try {
          // Get the parent comment
          const parentMemo = await memoServiceClient.getMemo({ name: parentMemoName });
          
          // If parent has a parent, traverse up to find root
          if (parentMemo.parent) {
            let currentParentName = parentMemo.parent;
            let attempts = 0;
            const maxAttempts = 10; // Prevent infinite loops
            
            while (currentParentName && attempts < maxAttempts) {
              const currentMemo = await memoServiceClient.getMemo({ name: currentParentName });
              if (!currentMemo.parent) {
                // Found the root memo
                rootMemoName = currentMemo.name;
                break;
              }
              currentParentName = currentMemo.parent;
              attempts++;
            }
          } else {
            // Parent is the root memo
            rootMemoName = parentMemo.name;
          }
        } catch (error) {
          console.error("Failed to find root memo, using parentMemoName:", error);
          // Continue with parentMemoName as fallback
        }
      }

      // Invalidate and refetch queries
      // Always invalidate the root memo's comments (backend links all comments to root)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: memoKeys.comments(rootMemoName) }),
        queryClient.refetchQueries({ queryKey: memoKeys.comments(rootMemoName) }),
        queryClient.invalidateQueries({ queryKey: memoKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: userKeys.stats() }),
      ]);

      toast.success(isReply ? "Reply saved successfully" : "Comment saved successfully");
      
      dispatch(actions.markAsSaved());
      dispatch(actions.reset());
      
      // Call onConfirm callback
      if (onConfirm) {
        onConfirm(result.memoName);
      }
    } catch (error) {
      handleError(error, toast.error, {
        context: "Failed to save comment",
        fallbackMessage: errorService.getErrorMessage(error),
      });
    } finally {
      dispatch(actions.setLoading("saving", false));
    }
  }

  const isSaving = state.ui.isLoading.saving;

  return (
    <div className="flex gap-3 py-2">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <UserAvatar avatarUrl={currentUser?.avatarUrl} className="w-8 h-8" />
      </div>

      {/* Editor */}
      <div className="flex-1 min-w-0">
        <div className="rounded-lg border border-border/60 bg-card/50 p-2 transition-all hover:border-border">
          {/* Editor content */}
          <div className="min-h-[60px]">
            <EditorContent ref={editorRef} placeholder={placeholder} autoFocus={autoFocus} />
          </div>

          {/* Formatting toolbar - only show when user has content or clicks in editor */}
          {showFormatting && editorRef.current && (
            <div className="mt-2 pt-2 border-t border-border/40">
              <FormattingToolbar editorRef={editorRef} />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 mt-3">
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                {t("common.cancel")}
              </Button>
            )}
            <Button
              ref={replyButtonRef}
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSave();
              }}
              disabled={!hasContent || isSaving}
              variant="default"
              className={cn(
                "h-8 text-xs px-4 shadow-md hover:shadow-lg transition-all",
                (!hasContent || isSaving) && "opacity-50 cursor-not-allowed"
              )}
              style={(() => {
                if (!hasContent || isSaving) {
                  return {
                    opacity: 0.5,
                    cursor: "not-allowed",
                  } as React.CSSProperties;
                }
                
                if (isDark) {
                  return {
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    color: "#10b981",
                  } as React.CSSProperties & { backgroundColor?: string };
                }

                if (isColorfulTheme) {
                  return {
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                  } as React.CSSProperties & { backgroundColor?: string; color?: string };
                } else {
                  return {
                    backgroundColor: "#3b82f6",
                    color: "#ffffff",
                  } as React.CSSProperties & { backgroundColor?: string; color?: string };
                }
              })()}
              onMouseEnter={(e) => {
                if (!hasContent || isSaving) return;
                if (isDark) {
                  e.currentTarget.style.setProperty("background-color", "var(--accent)", "important");
                } else if (isColorfulTheme) {
                  e.currentTarget.style.setProperty("background-color", "#1d4ed8", "important");
                } else {
                  e.currentTarget.style.setProperty("background-color", "#2563eb", "important");
                }
              }}
              onMouseLeave={(e) => {
                if (!hasContent || isSaving) return;
                if (isDark) {
                  e.currentTarget.style.setProperty("background-color", "var(--card)", "important");
                } else if (isColorfulTheme) {
                  e.currentTarget.style.setProperty("background-color", "#2563eb", "important");
                } else {
                  e.currentTarget.style.setProperty("background-color", "#3b82f6", "important");
                }
              }}
            >
              {isSaving ? (t("common.saving") || "Saving...") : isReply ? (t("common.reply") || "Reply") : "Comment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InlineCommentEditor: React.FC<InlineCommentEditorProps> = (props) => {
  return (
    <EditorProvider>
      <InlineCommentEditorImpl {...props} />
    </EditorProvider>
  );
};

export default InlineCommentEditor;
