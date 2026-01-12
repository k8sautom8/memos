import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { EDITOR_HEIGHT } from "../constants";
import type { EditorProps } from "../types";
import { editorCommands } from "./commands";
import SlashCommands from "./SlashCommands";
import TagSuggestions from "./TagSuggestions";
import { useListCompletion } from "./useListCompletion";

export interface EditorRefActions {
  getEditor: () => HTMLTextAreaElement | null;
  focus: () => void;
  scrollToCursor: () => void;
  insertText: (text: string, prefix?: string, suffix?: string) => void;
  removeText: (start: number, length: number) => void;
  setContent: (text: string) => void;
  getContent: () => string;
  getSelectedContent: () => string;
  getCursorPosition: () => number;
  setCursorPosition: (startPos: number, endPos?: number) => void;
  getCursorLineNumber: () => number;
  getLine: (lineNumber: number) => string;
  setLine: (lineNumber: number, text: string) => void;
}

const Editor = forwardRef(function Editor(props: EditorProps, ref: React.ForwardedRef<EditorRefActions>) {
  const {
    className,
    initialContent,
    placeholder,
    onPaste,
    onContentChange: handleContentChangeCallback,
    isFocusMode,
    isInIME = false,
    onCompositionStart,
    onCompositionEnd,
  } = props;
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof window !== "undefined") {
      const theme = document.documentElement.getAttribute("data-theme");
      const darkThemes = ["default-dark", "midnight"];
      return darkThemes.includes(theme || "");
    }
    return false;
  });

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const checkDark = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      const darkThemes = ["default-dark", "midnight"];
      setIsDark(darkThemes.includes(theme || ""));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const updateEditorHeight = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.style.height = "auto";
      editorRef.current.style.height = `${editorRef.current.scrollHeight ?? 0}px`;
    }
  }, []);

  const updateContent = useCallback(() => {
    if (editorRef.current) {
      handleContentChangeCallback(editorRef.current.value);
      updateEditorHeight();
    }
  }, [handleContentChangeCallback, updateEditorHeight]);

  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.value = initialContent;
      handleContentChangeCallback(initialContent);
      updateEditorHeight();
    }
    // Only run once on mount to set initial content
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update editor when content is externally changed (e.g., reset after save)
  useEffect(() => {
    if (editorRef.current && editorRef.current.value !== initialContent) {
      editorRef.current.value = initialContent;
      updateEditorHeight();
    }
  }, [initialContent, updateEditorHeight]);

  const editorActions: EditorRefActions = useMemo(
    () => ({
      getEditor: () => editorRef.current,
      focus: () => editorRef.current?.focus(),
      scrollToCursor: () => {
        if (editorRef.current) {
          editorRef.current.scrollTop = editorRef.current.scrollHeight;
        }
      },
      insertText: (content = "", prefix = "", suffix = "") => {
        const editor = editorRef.current;
        if (!editor) return;

        const cursorPos = editor.selectionStart;
        const endPos = editor.selectionEnd;
        const prev = editor.value;
        const actual = content || prev.slice(cursorPos, endPos);
        editor.value = prev.slice(0, cursorPos) + prefix + actual + suffix + prev.slice(endPos);

        editor.focus();
        editor.setSelectionRange(cursorPos + prefix.length + actual.length, cursorPos + prefix.length + actual.length);
        updateContent();
      },
      removeText: (start: number, length: number) => {
        const editor = editorRef.current;
        if (!editor) return;

        editor.value = editor.value.slice(0, start) + editor.value.slice(start + length);
        editor.focus();
        editor.setSelectionRange(start, start);
        updateContent();
      },
      setContent: (text: string) => {
        const editor = editorRef.current;
        if (editor) {
          editor.value = text;
          updateContent();
        }
      },
      getContent: () => editorRef.current?.value ?? "",
      getCursorPosition: () => editorRef.current?.selectionStart ?? 0,
      getSelectedContent: () => {
        const editor = editorRef.current;
        if (!editor) return "";
        return editor.value.slice(editor.selectionStart, editor.selectionEnd);
      },
      setCursorPosition: (startPos: number, endPos?: number) => {
        const editor = editorRef.current;
        if (!editor) return;
        // setSelectionRange requires valid arguments; default to startPos if endPos is undefined
        const endPosition = endPos !== undefined && !Number.isNaN(endPos) ? endPos : startPos;
        editor.setSelectionRange(startPos, endPosition);
      },
      getCursorLineNumber: () => {
        const editor = editorRef.current;
        if (!editor) return 0;
        const lines = editor.value.slice(0, editor.selectionStart).split("\n");
        return lines.length - 1;
      },
      getLine: (lineNumber: number) => editorRef.current?.value.split("\n")[lineNumber] ?? "",
      setLine: (lineNumber: number, text: string) => {
        const editor = editorRef.current;
        if (!editor) return;
        const lines = editor.value.split("\n");
        lines[lineNumber] = text;
        editor.value = lines.join("\n");
        editor.focus();
        updateContent();
      },
    }),
    [updateContent],
  );

  useImperativeHandle(ref, () => editorActions, [editorActions]);

  const handleEditorInput = useCallback(() => {
    if (editorRef.current) {
      handleContentChangeCallback(editorRef.current.value);
      updateEditorHeight();
    }
  }, [handleContentChangeCallback, updateEditorHeight]);

  // Auto-complete markdown lists when pressing Enter
  useListCompletion({
    editorRef,
    editorActions,
    isInIME,
  });

  // Handle keyboard shortcuts for formatting
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (isInIME) return; // Don't handle shortcuts during IME composition

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? event.metaKey : event.ctrlKey;

      if (!modKey) return;

      // Import formatting helpers dynamically to avoid circular dependencies
      import("../Toolbar/formattingHelpers").then(({ formatMarkdown }) => {
        switch (event.key.toLowerCase()) {
          case "b":
            if (!event.shiftKey) {
              event.preventDefault();
              formatMarkdown.bold(editorActions);
            }
            break;
          case "i":
            if (!event.shiftKey) {
              event.preventDefault();
              formatMarkdown.italic(editorActions);
            }
            break;
          case "x":
            if (event.shiftKey) {
              event.preventDefault();
              formatMarkdown.strikethrough(editorActions);
            }
            break;
          case "u":
            if (!event.shiftKey) {
              event.preventDefault();
              formatMarkdown.underline(editorActions);
            }
            break;
          case "h":
            if (event.shiftKey) {
              event.preventDefault();
              // Highlight will be handled by the toolbar button which opens the color picker
              // For keyboard shortcut, we'll use default highlight
              formatMarkdown.highlight(editorActions);
            }
            break;
          case "1":
            if (event.shiftKey) {
              event.preventDefault();
              formatMarkdown.heading(editorActions, 1);
            }
            break;
          case "2":
            if (event.shiftKey) {
              event.preventDefault();
              formatMarkdown.heading(editorActions, 2);
            }
            break;
          case "3":
            if (event.shiftKey) {
              event.preventDefault();
              formatMarkdown.heading(editorActions, 3);
            }
            break;
          case "8":
            if (event.shiftKey) {
              event.preventDefault();
              formatMarkdown.bulletList(editorActions);
            }
            break;
          case "7":
            if (event.shiftKey) {
              event.preventDefault();
              formatMarkdown.numberedList(editorActions);
            }
            break;
          case "9":
            if (event.shiftKey) {
              event.preventDefault();
              formatMarkdown.taskList(editorActions);
            }
            break;
          case "k":
            if (!event.shiftKey) {
              event.preventDefault();
              formatMarkdown.link(editorActions);
            }
            break;
          case "`":
            if (event.shiftKey) {
              event.preventDefault();
              formatMarkdown.code(editorActions);
            }
            break;
          case ">":
            if (event.shiftKey) {
              event.preventDefault();
              formatMarkdown.quote(editorActions);
            }
            break;
          case "t":
            if (event.shiftKey) {
              event.preventDefault();
              formatMarkdown.table(editorActions, 3, 3);
            }
            break;
          case "l":
            if (event.shiftKey) {
              event.preventDefault();
              formatMarkdown.align(editorActions, "left");
            }
            break;
          case "e":
            if (event.shiftKey) {
              event.preventDefault();
              formatMarkdown.align(editorActions, "center");
            }
            break;
          case "r":
            if (event.shiftKey) {
              event.preventDefault();
              formatMarkdown.align(editorActions, "right");
            }
            break;
          case "j":
            if (event.shiftKey) {
              event.preventDefault();
              formatMarkdown.align(editorActions, "justify");
            }
            break;
          case "d":
            if (event.shiftKey) {
              event.preventDefault();
              formatMarkdown.insertDateTime(editorActions, "datetime");
            }
            break;
          case "m":
            if (event.shiftKey) {
              event.preventDefault();
              // Insert random emoji
              const emojis = ["😀", "😊", "👍", "❤️", "🎉", "✨", "🔥", "💡", "📝", "✅", "❌", "⚠️", "💭", "🚀", "⭐"];
              const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
              editorActions.insertText(randomEmoji, "", "");
            }
            break;
        }
      });
    },
    [isInIME, editorActions],
  );

  return (
    <div
      className={cn(
        "flex flex-col justify-start items-start relative w-full bg-inherit",
        // Focus mode: flex-1 to grow and fill space; Normal: h-auto with max-height
        isFocusMode ? "flex-1" : `h-auto ${EDITOR_HEIGHT.normal}`,
        className,
      )}
    >
      <textarea
        className={cn(
          "w-full resize-none overflow-x-hidden overflow-y-auto",
          // Apple-style spacing: generous on mobile, refined on desktop
          "my-1 sm:my-1.5 md:my-1",
          "text-base sm:text-[15px] md:text-base",
          !isDark && "bg-transparent",
          "outline-none",
          "placeholder:opacity-60 placeholder:text-muted-foreground",
          "whitespace-pre-wrap break-words",
          "transition-all duration-200 ease-out",
          "focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-background",
          "rounded-lg sm:rounded-md px-3 py-2 sm:px-2.5 sm:py-1.5 md:px-2 md:py-1",
          !isDark && "text-foreground",
          // Focus mode: flex-1 h-0 to grow within flex container; Normal: h-full to fill wrapper
          isFocusMode ? "flex-1 h-0" : "h-full",
        )}
        style={isDark ? {
          backgroundColor: "var(--card)",
          borderColor: "var(--border)",
          color: "var(--card-foreground)",
        } : undefined}
        rows={1}
        placeholder={placeholder}
        ref={editorRef}
        onPaste={onPaste}
        onInput={handleEditorInput}
        onKeyDown={handleKeyDown}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
      ></textarea>
      <TagSuggestions editorRef={editorRef} editorActions={ref} />
      <SlashCommands editorRef={editorRef} editorActions={ref} commands={editorCommands} />
    </div>
  );
});

export default Editor;
