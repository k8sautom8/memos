import { create } from "@bufbuild/protobuf";
import { FieldMaskSchema } from "@bufbuild/protobuf/wkt";
import { XIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { userServiceClient } from "@/connect";
import useCurrentUser from "@/hooks/useCurrentUser";
import useLoading from "@/hooks/useLoading";
import { handleError } from "@/lib/error";
import { useTranslate } from "@/utils/i18n";

interface Props {
  webhookName?: string;
  onSuccess?: () => void;
  onCancel: () => void;
}

interface State {
  displayName: string;
  url: string;
}

function CreateWebhookForm({ webhookName, onSuccess, onCancel }: Props) {
  const t = useTranslate();
  const currentUser = useCurrentUser();
  const [state, setState] = useState<State>({
    displayName: "",
    url: "",
  });
  const requestState = useLoading(false);
  const isCreating = webhookName === undefined;

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

  const createButtonRef = React.useRef<HTMLButtonElement>(null);
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

    if (createButtonRef.current) {
      const btn = createButtonRef.current;
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
    if (webhookName && currentUser) {
      userServiceClient
        .listUserWebhooks({
          parent: currentUser.name,
        })
        .then((response) => {
          const webhook = response.webhooks.find((w) => w.name === webhookName);
          if (webhook) {
            setState({
              displayName: webhook.displayName,
              url: webhook.url,
            });
          }
        });
    } else {
      setState({
        displayName: "",
        url: "",
      });
    }
  }, [webhookName, currentUser]);

  const setPartialState = (partialState: Partial<State>) => {
    setState({
      ...state,
      ...partialState,
    });
  };

  const handleTitleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPartialState({
      displayName: e.target.value,
    });
  };

  const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPartialState({
      url: e.target.value,
    });
  };

  const handleSaveBtnClick = async () => {
    if (!state.displayName || !state.url) {
      toast.error(t("message.fill-all-required-fields"));
      return;
    }

    if (!currentUser) {
      toast.error("User not authenticated");
      return;
    }

    try {
      requestState.setLoading();
      if (isCreating) {
        await userServiceClient.createUserWebhook({
          parent: currentUser.name,
          webhook: {
            displayName: state.displayName,
            url: state.url,
          },
        });
      } else {
        await userServiceClient.updateUserWebhook({
          webhook: {
            name: webhookName,
            displayName: state.displayName,
            url: state.url,
          },
          updateMask: create(FieldMaskSchema, { paths: ["display_name", "url"] }),
        });
      }

      onSuccess?.();
      onCancel();
      requestState.setFinish();
    } catch (error: unknown) {
      handleError(error, toast.error, {
        context: webhookName ? "Update webhook" : "Create webhook",
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
        <h3 className="text-lg font-semibold text-foreground">
          {isCreating
            ? t("setting.webhook-section.create-dialog.create-webhook")
            : t("setting.webhook-section.create-dialog.edit-webhook")}
        </h3>
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="displayName">
            {t("setting.webhook-section.create-dialog.title")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="displayName"
            type="text"
            placeholder={t("setting.webhook-section.create-dialog.an-easy-to-remember-name")}
            value={state.displayName}
            onChange={handleTitleInputChange}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="url">
            {t("setting.webhook-section.create-dialog.payload-url")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="url"
            type="text"
            placeholder={t("setting.webhook-section.create-dialog.url-example-post-receive")}
            value={state.url}
            onChange={handleUrlInputChange}
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
          ref={createButtonRef}
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
          {t("common.create")}
        </Button>
      </div>
    </div>
  );
}

export default CreateWebhookForm;

