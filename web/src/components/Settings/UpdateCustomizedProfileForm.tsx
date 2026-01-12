import { create } from "@bufbuild/protobuf";
import { XIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useInstance } from "@/contexts/InstanceContext";
import { buildInstanceSettingName } from "@/helpers/resource-names";
import { handleError } from "@/lib/error";
import {
  InstanceSetting_GeneralSetting_CustomProfile,
  InstanceSetting_GeneralSetting_CustomProfileSchema,
  InstanceSetting_Key,
  InstanceSettingSchema,
} from "@/types/proto/api/v1/instance_service_pb";
import { useTranslate } from "@/utils/i18n";

interface Props {
  onSuccess?: () => void;
  onCancel: () => void;
}

function UpdateCustomizedProfileForm({ onSuccess, onCancel }: Props) {
  const t = useTranslate();
  const { generalSetting: instanceGeneralSetting, updateSetting } = useInstance();
  const [customProfile, setCustomProfile] = useState<InstanceSetting_GeneralSetting_CustomProfile>(
    create(InstanceSetting_GeneralSetting_CustomProfileSchema, instanceGeneralSetting.customProfile || {}),
  );

  const [isLoading, setIsLoading] = useState(false);

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
  const restoreButtonRef = React.useRef<HTMLButtonElement>(null);

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

    // Apply styles to Save button
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

    // Apply styles to Cancel button
    if (cancelButtonRef.current) {
      const btn = cancelButtonRef.current;
      setTimeout(() => {
        btn.style.setProperty("color", "var(--foreground)", "important");
      }, 0);
    }
  }, [currentTheme, isDark, isColorfulTheme]);

  // Reset state when instance settings change
  useEffect(() => {
    setCustomProfile(create(InstanceSetting_GeneralSetting_CustomProfileSchema, instanceGeneralSetting.customProfile || {}));
  }, [instanceGeneralSetting]);

  const setPartialState = (partialState: Partial<InstanceSetting_GeneralSetting_CustomProfile>) => {
    setCustomProfile((state) => ({
      ...state,
      ...partialState,
    }));
  };

  const handleNameChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPartialState({
      title: e.target.value as string,
    });
  };

  const handleLogoUrlChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPartialState({
      logoUrl: e.target.value as string,
    });
  };

  const handleDescriptionChanged = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPartialState({
      description: e.target.value as string,
    });
  };

  const handleRestoreButtonClick = () => {
    setPartialState({
      title: "Memos",
      logoUrl: "/logo.webp",
      description: "",
    });
  };

  const handleSaveButtonClick = async () => {
    if (customProfile.title === "") {
      toast.error("Title cannot be empty.");
      return;
    }

    setIsLoading(true);
    try {
      await updateSetting(
        create(InstanceSettingSchema, {
          name: buildInstanceSettingName(InstanceSetting_Key.GENERAL),
          value: {
            case: "generalSetting",
            value: {
              ...instanceGeneralSetting,
              customProfile: customProfile,
            },
          },
        }),
      );
      toast.success(t("message.update-succeed"));
      onSuccess?.();
      onCancel();
    } catch (error) {
      handleError(error, toast.error, {
        context: "Update customized profile",
        fallbackMessage: "Failed to update profile",
      });
    } finally {
      setIsLoading(false);
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
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t("setting.system-section.customize-server.title")}</h3>
          <p className="text-sm text-muted-foreground mt-1">Customize your instance appearance and settings.</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="server-name">{t("setting.system-section.server-name")}</Label>
          <Input id="server-name" type="text" value={customProfile.title} onChange={handleNameChanged} placeholder="Enter server name" />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="icon-url">{t("setting.system-section.customize-server.icon-url")}</Label>
          <Input id="icon-url" type="text" value={customProfile.logoUrl} onChange={handleLogoUrlChanged} placeholder="Enter icon URL" />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">{t("setting.system-section.customize-server.description")}</Label>
          <Textarea
            id="description"
            rows={3}
            value={customProfile.description}
            onChange={handleDescriptionChanged}
            placeholder="Enter description"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-6 pt-4 border-t border-border">
        <Button
          ref={restoreButtonRef}
          variant="outline"
          onClick={handleRestoreButtonClick}
          disabled={isLoading}
          className="sm:mr-auto"
        >
          {t("common.restore")}
        </Button>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            ref={cancelButtonRef}
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 sm:flex-initial transition-all"
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
            onClick={handleSaveButtonClick}
            disabled={isLoading}
            variant="default"
            className={cn("flex-1 sm:flex-initial shadow-md hover:shadow-lg transition-all")}
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
            {isLoading ? "Saving..." : t("common.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default UpdateCustomizedProfileForm;

