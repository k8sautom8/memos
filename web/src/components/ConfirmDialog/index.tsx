import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void | Promise<void>;
  confirmVariant?: "default" | "destructive";
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  confirmVariant = "default",
}: ConfirmDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const confirmButtonRef = React.useRef<HTMLButtonElement>(null);
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof window !== "undefined") {
      const theme = document.documentElement.getAttribute("data-theme");
      const darkThemes = ["default-dark", "midnight"];
      return darkThemes.includes(theme || "");
    }
    return false;
  });
  const [isColorfulTheme, setIsColorfulTheme] = React.useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.getAttribute("data-theme") === "colorful";
    }
    return false;
  });

  React.useEffect(() => {
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

  // Ensure destructive button uses theme CSS variables correctly
  React.useEffect(() => {
    if (confirmVariant !== "destructive" || !open) return;

    const applyStyles = () => {
      const btn = confirmButtonRef.current;
      if (!btn) return;

      // Get CSS variables from computed styles
      const computedStyle = getComputedStyle(document.documentElement);
      const destructiveColor = computedStyle.getPropertyValue("--destructive").trim();
      const destructiveForeground = computedStyle.getPropertyValue("--destructive-foreground").trim();

      // Only apply if CSS variables are available and button doesn't have proper colors
      if (destructiveColor && destructiveForeground) {
        const btnStyle = getComputedStyle(btn);
        const currentBg = btnStyle.backgroundColor;
        const currentColor = btnStyle.color;

        // Check if button needs styling (if it's white/transparent or same as background)
        const needsStyling = 
          !currentBg || 
          currentBg === "rgba(0, 0, 0, 0)" || 
          currentBg === "transparent" ||
          currentColor === currentBg ||
          (currentColor.includes("255") && currentBg.includes("255")); // Both white

        if (needsStyling) {
          // Use CSS variables via inline styles as fallback
          btn.style.setProperty("background-color", `var(--destructive)`, "important");
          btn.style.setProperty("color", `var(--destructive-foreground)`, "important");
          btn.style.setProperty("border-color", `var(--destructive)`, "important");
        }
      }
    };

    // Apply styles after render
    const timeoutId = setTimeout(applyStyles, 10);
    const timeoutId2 = setTimeout(applyStyles, 100);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, [confirmVariant, open]);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onOpenChange(false);
    } catch (e) {
      // Intentionally swallow errors so user can retry; surface via caller's toast/logging
      console.error("ConfirmDialog error for action:", title, e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => !loading && onOpenChange(o)}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" disabled={loading} onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmButtonRef}
            variant={confirmVariant}
            disabled={loading}
            onClick={handleConfirm}
            data-loading={loading}
            className={confirmVariant === "destructive" ? "!bg-[var(--destructive)] !text-[var(--destructive-foreground)] hover:!opacity-90" : undefined}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
