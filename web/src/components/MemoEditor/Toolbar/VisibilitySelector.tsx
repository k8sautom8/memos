import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import VisibilityIcon from "@/components/VisibilityIcon";
import { Visibility } from "@/types/proto/api/v1/memo_service_pb";
import { useTranslate } from "@/utils/i18n";
import { cn } from "@/lib/utils";
import useMediaQuery from "@/hooks/useMediaQuery";
import type { VisibilitySelectorProps } from "../types";

const VisibilitySelector = (props: VisibilitySelectorProps) => {
  const { value, onChange } = props;
  const t = useTranslate();
  const isMobile = !useMediaQuery("md"); // Mobile is when NOT md (768px+)
  const [currentTheme, setCurrentTheme] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.getAttribute("data-theme") || "default";
    }
    return "default";
  });
  const isColorfulTheme = currentTheme === "colorful";
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
      const theme = document.documentElement.getAttribute("data-theme") || "default";
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

  const visibilityOptions = [
    { value: Visibility.PRIVATE, label: t("memo.visibility.private") },
    { value: Visibility.PROTECTED, label: t("memo.visibility.protected") },
    { value: Visibility.PUBLIC, label: t("memo.visibility.public") },
  ] as const;

  const currentLabel = visibilityOptions.find((option) => option.value === value)?.label || "";

  // Keyboard shortcut: "P" to cycle through visibility modes (mobile only)
  useEffect(() => {
    if (!isMobile) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // Check for "P" key (case-insensitive)
      if (e.key.toLowerCase() === "p" && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        const currentIndex = visibilityOptions.findIndex((opt) => opt.value === value);
        const nextIndex = (currentIndex + 1) % visibilityOptions.length;
        onChange(visibilityOptions[nextIndex].value);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isMobile, value, onChange, visibilityOptions]);

  // Get color for mobile "P" letter based on visibility (background and border follow theme)
  const getMobileLetterColor = () => {
    if (value === Visibility.PRIVATE) {
      // Red for private - darker, more saturated red
      return isDark ? "#f87171" : "#b91c1c"; // red-400 for dark, red-700 for light
    }
    if (value === Visibility.PUBLIC) {
      // Green for public
      return isDark ? "#86efac" : "#16a34a"; // green-300 for dark, green-600 for light
    }
    // PROTECTED - Bright orange/amber - more yellow-orange to distinguish from red
    return isDark ? "#fbbf24" : "#ea580c"; // amber-400 for dark, orange-600 for light
  };

  return (
    <DropdownMenu onOpenChange={props.onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button 
          className={cn(
            "inline-flex items-center justify-center rounded-md transition-colors border",
            // Mobile: compact "P" button
            isMobile && "h-8 w-8 px-0 py-0 text-sm font-semibold",
            // Desktop: full label with icon
            !isMobile && "px-1.5 py-0.5 text-[10px] sm:text-xs",
            // Match expand button container styling for dark theme
            isDark && "bg-muted/40 border-border/60 backdrop-blur-sm shadow-sm",
            !isDark && value === Visibility.PRIVATE && !isMobile && (
              isColorfulTheme
                ? "border-red-500/40 bg-red-50/30 text-red-600/80 hover:bg-red-500/12 hover:border-red-500/60"
                : (currentTheme === "paper" || currentTheme === "whitewall" || currentTheme === "default")
                  ? "border-[var(--muted-foreground)]/40 bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:bg-[var(--muted)]/70"
                  : "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15"
            ),
            !isDark && value === Visibility.PUBLIC && !isMobile && (
              isColorfulTheme
                ? "border-green-500/40 bg-green-50/30 text-green-600/80 hover:bg-green-500/12 hover:border-green-500/60"
                : (currentTheme === "paper" || currentTheme === "whitewall" || currentTheme === "default")
                  ? "border-[var(--primary)]/40 bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/15"
                  : "border-[var(--chart-3)]/40 bg-[var(--chart-3)]/10 text-[var(--chart-3)] hover:bg-[var(--chart-3)]/15"
            ),
            !isDark && value === Visibility.PROTECTED && !isMobile && (
              isColorfulTheme
                ? "border-amber-500/40 bg-amber-50/30 text-amber-600/80 hover:bg-amber-500/12 hover:border-amber-500/60"
                : (currentTheme === "paper" || currentTheme === "whitewall" || currentTheme === "default")
                  ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent-foreground)] hover:bg-[var(--accent)]/15"
                  : "border-[var(--chart-4)]/40 bg-[var(--chart-4)]/10 text-[var(--chart-4)] hover:bg-[var(--chart-4)]/15"
            ),
          )}
          style={isMobile ? {
            // Mobile: natural theme background and border (like expand button), only letter is colored
            backgroundColor: isDark ? "var(--muted)" : (isColorfulTheme ? undefined : "var(--muted)"),
            opacity: isDark ? 0.4 : (isColorfulTheme ? undefined : 0.4),
            borderColor: "var(--border)",
            color: getMobileLetterColor(),
          } : (isDark ? {
            backgroundColor: "var(--muted)",
            opacity: 0.4,
            borderColor: "var(--border)",
            color: "var(--card-foreground)",
          } : undefined)}
          onMouseEnter={(e) => {
            if (isDark && !isMobile) {
              e.currentTarget.style.setProperty("opacity", "0.6", "important");
            } else if (isMobile) {
              // On mobile, darken the background slightly on hover
              e.currentTarget.style.setProperty("filter", "brightness(0.85)", "important");
            }
          }}
          onMouseLeave={(e) => {
            if (isDark && !isMobile) {
              e.currentTarget.style.setProperty("opacity", "0.4", "important");
            } else if (isMobile) {
              // Restore original brightness
              e.currentTarget.style.setProperty("filter", "none", "important");
            }
          }}
        >
          {isMobile ? (
            // Mobile: Just show "P" with color coding (color comes from getMobileLetterColor)
            <span>P</span>
          ) : (
            // Desktop: Show icon + label + chevron
            <>
              <span style={isDark ? { color: "var(--card-foreground)" } : undefined}>
                <VisibilityIcon visibility={value} className={cn(
                  "mr-1.5 w-3.5 h-3.5",
                  isColorfulTheme ? "opacity-80" : "opacity-70"
                )} />
              </span>
              <span style={isDark ? { color: "var(--card-foreground)" } : undefined}>{currentLabel}</span>
              <span style={isDark ? { color: "var(--card-foreground)" } : undefined}>
                <ChevronDownIcon className={cn(
                  "ml-0.5 w-4 h-4",
                  isColorfulTheme ? "opacity-70" : "opacity-60"
                )} />
              </span>
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {visibilityOptions.map((option) => (
          <DropdownMenuItem key={option.value} className="cursor-pointer gap-2" onClick={() => onChange(option.value)}>
            <VisibilityIcon visibility={option.value} />
            <span className="flex-1">{option.label}</span>
            {value === option.value && <CheckIcon className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default VisibilitySelector;
