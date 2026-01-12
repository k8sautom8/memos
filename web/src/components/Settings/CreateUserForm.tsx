import { create } from "@bufbuild/protobuf";
import { FieldMaskSchema } from "@bufbuild/protobuf/wkt";
import { XIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { userServiceClient } from "@/connect";
import useLoading from "@/hooks/useLoading";
import { handleError } from "@/lib/error";
import { User, User_Role, UserSchema } from "@/types/proto/api/v1/user_service_pb";
import { useTranslate } from "@/utils/i18n";

interface Props {
  user?: User;
  onSuccess?: () => void;
  onCancel: () => void;
}

function CreateUserForm({ user: initialUser, onSuccess, onCancel }: Props) {
  const t = useTranslate();
  const [user, setUser] = useState(create(UserSchema, initialUser ? { username: initialUser.username, role: initialUser.role } : {}));
  const requestState = useLoading(false);
  const isCreating = !initialUser;

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

  const confirmButtonRef = React.useRef<HTMLButtonElement>(null);
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

    if (confirmButtonRef.current) {
      const btn = confirmButtonRef.current;
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
    if (initialUser) {
      setUser(create(UserSchema, { username: initialUser.username, role: initialUser.role }));
    } else {
      setUser(create(UserSchema, {}));
    }
  }, [initialUser]);

  const setPartialUser = (state: Partial<User>) => {
    setUser({
      ...user,
      ...state,
    });
  };

  const handleConfirm = async () => {
    if (isCreating && (!user.username || !user.password)) {
      toast.error("Username and password cannot be empty");
      return;
    }

    try {
      requestState.setLoading();
      if (isCreating) {
        await userServiceClient.createUser({ user });
        toast.success("Create user successfully");
      } else {
        const updateMask = [];
        if (user.username !== initialUser?.username) {
          updateMask.push("username");
        }
        if (user.password) {
          updateMask.push("password");
        }
        if (user.role !== initialUser?.role) {
          updateMask.push("role");
        }
        await userServiceClient.updateUser({ user, updateMask: create(FieldMaskSchema, { paths: updateMask }) });
        toast.success("Update user successfully");
      }
      requestState.setFinish();
      onSuccess?.();
      onCancel();
    } catch (error: unknown) {
      handleError(error, toast.error, {
        context: user ? "Update user" : "Create user",
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
        <h3 className="text-lg font-semibold text-foreground">{`${isCreating ? t("common.create") : t("common.edit")} ${t("common.user")}`}</h3>
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="username">{t("common.username")}</Label>
          <Input
            id="username"
            type="text"
            placeholder={t("common.username")}
            value={user.username}
            onChange={(e) =>
              setPartialUser({
                username: e.target.value,
              })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">{t("common.password")}</Label>
          <Input
            id="password"
            type="password"
            placeholder={t("common.password")}
            autoComplete="off"
            value={user.password}
            onChange={(e) =>
              setPartialUser({
                password: e.target.value,
              })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label>{t("common.role")}</Label>
          <RadioGroup
            value={String(user.role)}
            onValueChange={(value) => setPartialUser({ role: Number(value) as User_Role })}
            className="flex flex-row gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={String(User_Role.USER)} id="user" />
              <Label htmlFor="user">{t("setting.member-section.user")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={String(User_Role.ADMIN)} id="admin" />
              <Label htmlFor="admin">{t("setting.member-section.admin")}</Label>
            </div>
          </RadioGroup>
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
          ref={confirmButtonRef}
          disabled={requestState.isLoading}
          onClick={handleConfirm}
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
          {t("common.confirm")}
        </Button>
      </div>
    </div>
  );
}

export default CreateUserForm;

