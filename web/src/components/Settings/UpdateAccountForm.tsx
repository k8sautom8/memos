import { isEqual } from "lodash-es";
import { XIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useInstance } from "@/contexts/InstanceContext";
import { convertFileToBase64 } from "@/helpers/utils";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useUpdateUser } from "@/hooks/useUserQueries";
import { handleError } from "@/lib/error";
import { useTranslate } from "@/utils/i18n";
import UserAvatar from "../UserAvatar";

interface Props {
  onSuccess?: () => void;
  onCancel: () => void;
}

interface State {
  avatarUrl: string;
  username: string;
  displayName: string;
  email: string;
  description: string;
}

function UpdateAccountForm({ onSuccess, onCancel }: Props) {
  const t = useTranslate();
  const currentUser = useCurrentUser();
  const { generalSetting: instanceGeneralSetting } = useInstance();
  const { mutateAsync: updateUser } = useUpdateUser();
  const [state, setState] = useState<State>({
    avatarUrl: currentUser?.avatarUrl ?? "",
    username: currentUser?.username ?? "",
    displayName: currentUser?.displayName ?? "",
    email: currentUser?.email ?? "",
    description: currentUser?.description ?? "",
  });

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

  // Reset state when user changes
  useEffect(() => {
    if (currentUser) {
      setState({
        avatarUrl: currentUser.avatarUrl ?? "",
        username: currentUser.username ?? "",
        displayName: currentUser.displayName ?? "",
        email: currentUser.email ?? "",
        description: currentUser.description ?? "",
      });
    }
  }, [currentUser]);

  const setPartialState = (partialState: Partial<State>) => {
    setState((state) => {
      return {
        ...state,
        ...partialState,
      };
    });
  };

  const handleAvatarChanged = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const image = files[0];
      if (image.size > 2 * 1024 * 1024) {
        toast.error("Max file size is 2MB");
        return;
      }
      try {
        const base64 = await convertFileToBase64(image);
        setPartialState({
          avatarUrl: base64,
        });
      } catch (error) {
        console.error(error);
        toast.error(`Failed to convert image to base64`);
      }
    }
  };

  const handleDisplayNameChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPartialState({
      displayName: e.target.value as string,
    });
  };

  const handleUsernameChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPartialState({
      username: e.target.value as string,
    });
  };

  const handleEmailChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((state) => {
      return {
        ...state,
        email: e.target.value as string,
      };
    });
  };

  const handleDescriptionChanged = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState((state) => {
      return {
        ...state,
        description: e.target.value as string,
      };
    });
  };

  const handleSaveBtnClick = async () => {
    if (state.username === "") {
      toast.error(t("message.fill-all"));
      return;
    }

    try {
      const updateMask = [];
      if (!isEqual(currentUser?.username, state.username)) {
        updateMask.push("username");
      }
      if (!isEqual(currentUser?.displayName, state.displayName)) {
        updateMask.push("display_name");
      }
      if (!isEqual(currentUser?.email, state.email)) {
        updateMask.push("email");
      }
      if (!isEqual(currentUser?.avatarUrl, state.avatarUrl)) {
        updateMask.push("avatar_url");
      }
      if (!isEqual(currentUser?.description, state.description)) {
        updateMask.push("description");
      }
      await updateUser({
        user: {
          name: currentUser?.name,
          username: state.username,
          displayName: state.displayName,
          email: state.email,
          avatarUrl: state.avatarUrl,
          description: state.description,
        },
        updateMask,
      });
      toast.success(t("message.update-succeed"));
      onSuccess?.();
      onCancel();
    } catch (error: unknown) {
      await handleError(error, toast.error, {
        context: "Update account",
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
        <h3 className="text-lg font-semibold text-foreground">{t("setting.account-section.update-information")}</h3>
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-row items-center gap-2">
          <Label>{t("common.avatar")}</Label>
          <label className="relative cursor-pointer hover:opacity-80">
            <UserAvatar className="w-10 h-10" avatarUrl={state.avatarUrl} />
            <input type="file" accept="image/*" className="absolute invisible w-full h-full inset-0" onChange={handleAvatarChanged} />
          </label>
          {state.avatarUrl && (
            <XIcon
              className="w-4 h-auto cursor-pointer opacity-60 hover:opacity-80"
              onClick={() =>
                setPartialState({
                  avatarUrl: "",
                })
              }
            />
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="username">
            {t("common.username")}
            <span className="text-sm text-muted-foreground ml-1">({t("setting.account-section.username-note")})</span>
          </Label>
          <Input
            id="username"
            value={state.username}
            onChange={handleUsernameChanged}
            disabled={instanceGeneralSetting.disallowChangeUsername}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="displayName">
            {t("common.nickname")}
            <span className="text-sm text-muted-foreground ml-1">({t("setting.account-section.nickname-note")})</span>
          </Label>
          <Input
            id="displayName"
            value={state.displayName}
            onChange={handleDisplayNameChanged}
            disabled={instanceGeneralSetting.disallowChangeNickname}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">
            {t("common.email")}
            <span className="text-sm text-muted-foreground ml-1">({t("setting.account-section.email-note")})</span>
          </Label>
          <Input id="email" type="email" value={state.email} onChange={handleEmailChanged} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">{t("common.description")}</Label>
          <Textarea id="description" rows={2} value={state.description} onChange={handleDescriptionChanged} />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
        <Button
          ref={cancelButtonRef}
          variant="ghost"
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

export default UpdateAccountForm;

