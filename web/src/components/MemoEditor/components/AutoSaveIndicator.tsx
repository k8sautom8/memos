import { useMemo, useState, useEffect } from "react";
import { CheckIcon, LoaderIcon, SaveIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useEditorContext } from "../state";

interface AutoSaveIndicatorProps {
  className?: string;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({ className }) => {
  const { state } = useEditorContext();
  const [isColorfulTheme, setIsColorfulTheme] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.getAttribute("data-theme") === "colorful";
    }
    return false;
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    
    const checkTheme = () => {
      setIsColorfulTheme(document.documentElement.getAttribute("data-theme") === "colorful");
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    
    return () => observer.disconnect();
  }, []);

  const saveStatus = useMemo(() => {
    const hasContent = state.content.trim().length > 0;
    const isSaving = state.ui.isLoading.saving;
    const hasUnsavedChanges = state.ui.hasUnsavedChanges;

    if (isSaving) {
      return { status: "saving", text: "Saving...", icon: LoaderIcon };
    }

    if (hasUnsavedChanges && hasContent) {
      return { status: "unsaved", text: "Unsaved", icon: SaveIcon };
    }

    if (hasContent) {
      return { status: "saved", text: "Saved", icon: CheckIcon };
    }

    return { status: "empty", text: "", icon: null };
  }, [state.content, state.ui.isLoading.saving, state.ui.hasUnsavedChanges]);

  if (saveStatus.status === "empty") {
    return null;
  }

  const Icon = saveStatus.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-0.5 px-1 py-0.5 text-[10px] sm:text-xs rounded-md",
            "transition-colors cursor-default",
            isColorfulTheme
              ? cn(
                  saveStatus.status === "saving" && "text-blue-600 dark:text-white bg-blue-50/50 dark:bg-gray-800/90 dark:border-gray-700",
                  saveStatus.status === "unsaved" && "text-amber-600 dark:text-white bg-amber-50/50 dark:bg-gray-800/90 dark:border-gray-700",
                  saveStatus.status === "saved" && "text-green-600 dark:text-white bg-green-50/50 dark:bg-gray-800/90 dark:border-gray-700",
                )
              : cn(
                  saveStatus.status === "saving" && "text-primary dark:text-white bg-primary/10 dark:bg-gray-800/90 dark:border-gray-700",
                  saveStatus.status === "unsaved" && "text-[var(--chart-4)] dark:text-white bg-[var(--chart-4)]/10 dark:bg-gray-800/90 dark:border-gray-700",
                  saveStatus.status === "saved" && "text-[var(--chart-3)] dark:text-white bg-[var(--chart-3)]/10 dark:bg-gray-800/90 dark:border-gray-700",
                ),
            className,
          )}
        >
          {Icon && (
            <Icon
              className={cn(
                "w-2.5 h-2.5 sm:w-3 sm:h-3",
                saveStatus.status === "saving" && "animate-spin",
              )}
            />
          )}
          <span className="font-medium">{saveStatus.text}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {saveStatus.status === "saving"
            ? "Saving changes..."
            : saveStatus.status === "unsaved"
              ? "You have unsaved changes"
              : "All changes saved"}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

