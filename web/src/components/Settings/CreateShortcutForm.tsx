import { create } from "@bufbuild/protobuf";
import { FieldMaskSchema } from "@bufbuild/protobuf/wkt";
import { XIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { shortcutServiceClient } from "@/connect";
import { useAuth } from "@/contexts/AuthContext";
import useCurrentUser from "@/hooks/useCurrentUser";
import useLoading from "@/hooks/useLoading";
import { handleError } from "@/lib/error";
import { Shortcut, ShortcutSchema } from "@/types/proto/api/v1/shortcut_service_pb";
import { useTranslate } from "@/utils/i18n";

interface Props {
  shortcut?: Shortcut;
  onSuccess?: () => void;
  onCancel: () => void;
}

function CreateShortcutForm({ shortcut: initialShortcut, onSuccess, onCancel }: Props) {
  const t = useTranslate();
  const user = useCurrentUser();
  const { refetchSettings } = useAuth();
  const [shortcut, setShortcut] = useState<Shortcut>(
    create(ShortcutSchema, {
      name: initialShortcut?.name || "",
      title: initialShortcut?.title || "",
      filter: initialShortcut?.filter || "",
    }),
  );
  const requestState = useLoading(false);
  const isCreating = shortcut.name === "";

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

  const saveButtonRef = React.useRef<HTMLButtonElement>(null);
  const cancelButtonRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
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
  useEffect(() => {
    const darkThemes = ["default-dark", "midnight"];

    if (saveButtonRef.current) {
      const btn = saveButtonRef.current;
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

    if (cancelButtonRef.current) {
      const btn = cancelButtonRef.current;
      setTimeout(() => {
        btn.style.setProperty("color", "var(--foreground)", "important");
      }, 0);
    }
  }, [currentTheme, isDark, isColorfulTheme]);

  useEffect(() => {
    if (shortcut.name) {
      setShortcut(shortcut);
    }
  }, [shortcut.name, shortcut.title, shortcut.filter]);

  // Reset state when initialShortcut changes
  useEffect(() => {
    if (initialShortcut) {
      setShortcut(
        create(ShortcutSchema, {
          name: initialShortcut.name,
          title: initialShortcut.title,
          filter: initialShortcut.filter,
        })
      );
    } else {
      setShortcut(
        create(ShortcutSchema, {
          name: "",
          title: "",
          filter: "",
        })
      );
    }
  }, [initialShortcut]);

  const onShortcutTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPartialState({
      title: e.target.value,
    });
  };

  const onShortcutFilterChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPartialState({
      filter: e.target.value,
    });
  };

  const setPartialState = (partialState: Partial<Shortcut>) => {
    setShortcut({
      ...shortcut,
      ...partialState,
    });
  };

  const handleSaveBtnClick = async () => {
    if (!shortcut.title || !shortcut.filter) {
      toast.error("Title and filter cannot be empty");
      return;
    }

    try {
      requestState.setLoading();
      if (isCreating) {
        await shortcutServiceClient.createShortcut({
          parent: user?.name,
          shortcut: {
            name: "",
            title: shortcut.title,
            filter: shortcut.filter,
          },
        });
        toast.success("Create shortcut successfully");
      } else {
        await shortcutServiceClient.updateShortcut({
          shortcut: {
            ...shortcut,
            name: initialShortcut!.name,
          },
          updateMask: create(FieldMaskSchema, { paths: ["title", "filter"] }),
        });
        toast.success("Update shortcut successfully");
      }
      await refetchSettings();
      requestState.setFinish();
      onSuccess?.();
      onCancel();
    } catch (error: unknown) {
      await handleError(error, toast.error, {
        context: isCreating ? "Create shortcut" : "Update shortcut",
        onError: () => requestState.setError(),
      });
    }
  };

  return (
    <div
      className={cn(
        "w-full border border-border rounded-lg bg-card p-6 shadow-md",
        "transition-all duration-300 ease-in-out",
        "opacity-100 translate-y-0"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{`${isCreating ? t("common.create") : t("common.edit")} ${t("common.shortcuts")}`}</h3>
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="title">{t("common.title")}</Label>
          <Input id="title" type="text" placeholder="" value={shortcut.title} onChange={onShortcutTitleChange} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="filter">{t("common.filter")}</Label>
          <Textarea
            id="filter"
            rows={3}
            placeholder={t("common.shortcut-filter")}
            value={shortcut.filter}
            onChange={onShortcutFilterChange}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
        <Button
          ref={cancelButtonRef}
          variant="ghost"
          disabled={requestState.isLoading}
          onClick={onCancel}
          className="transition-all"
          style={{
            color: isDark ? "var(--foreground)" : "var(--foreground)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.setProperty("background-color", "var(--accent)", "important");
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.setProperty("background-color", "transparent", "important");
          }}
        >
          {t("common.cancel")}
        </Button>
        <Button
          ref={saveButtonRef}
          disabled={requestState.isLoading}
          onClick={handleSaveBtnClick}
          variant="default"
          className={cn("shadow-md hover:shadow-lg transition-all")}
          style={(() => {
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
            if (isDark) {
              e.currentTarget.style.setProperty("background-color", "var(--accent)", "important");
            } else if (isColorfulTheme) {
              e.currentTarget.style.setProperty("background-color", "#1d4ed8", "important");
            } else {
              e.currentTarget.style.setProperty("background-color", "#2563eb", "important");
            }
          }}
          onMouseLeave={(e) => {
            if (isDark) {
              e.currentTarget.style.setProperty("background-color", "var(--card)", "important");
            } else if (isColorfulTheme) {
              e.currentTarget.style.setProperty("background-color", "#2563eb", "important");
            } else {
              e.currentTarget.style.setProperty("background-color", "#3b82f6", "important");
            }
          }}
        >
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
}

export default CreateShortcutForm;

