import { MoreVerticalIcon, PlusIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { identityProviderServiceClient } from "@/connect";
import { handleError } from "@/lib/error";
import { IdentityProvider } from "@/types/proto/api/v1/idp_service_pb";
import { useTranslate } from "@/utils/i18n";
import CreateIdentityProviderForm from "./CreateIdentityProviderForm";
import LearnMore from "../LearnMore";
import SettingSection from "./SettingSection";
import SettingTable from "./SettingTable";

const SSOSection = () => {
  const t = useTranslate();
  const [identityProviderList, setIdentityProviderList] = useState<IdentityProvider[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingIdentityProvider, setEditingIdentityProvider] = useState<IdentityProvider | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<IdentityProvider | undefined>(undefined);
  
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
    if (!createButtonRef.current) return;
    const btn = createButtonRef.current;
    const theme = currentTheme;
    const darkThemes = ["default-dark", "midnight"];
    
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      if (darkThemes.includes(theme)) {
        btn.style.setProperty("background-color", "var(--card)", "important");
        btn.style.setProperty("color", "#10b981", "important");
        btn.style.setProperty("border-color", "var(--border)", "important");
      } else if (theme === "colorful") {
        btn.style.setProperty("background-color", "#2563eb", "important");
        btn.style.setProperty("color", "#ffffff", "important");
      } else if (theme === "paper" || theme === "whitewall") {
        // Paper and Whitewall themes - use explicit blue for visibility
        btn.style.setProperty("background-color", "#3b82f6", "important");
        btn.style.setProperty("color", "#ffffff", "important");
      } else {
        // Default theme - use explicit blue if primary is too light
        btn.style.setProperty("background-color", "#3b82f6", "important");
        btn.style.setProperty("color", "#ffffff", "important");
      }
    }, 0);
  }, [currentTheme, isDark, isColorfulTheme]);

  useEffect(() => {
    fetchIdentityProviderList();
  }, []);

  const fetchIdentityProviderList = async () => {
    const { identityProviders } = await identityProviderServiceClient.listIdentityProviders({});
    setIdentityProviderList(identityProviders);
  };

  const handleDeleteIdentityProvider = async (identityProvider: IdentityProvider) => {
    setDeleteTarget(identityProvider);
  };

  const confirmDeleteIdentityProvider = async () => {
    if (!deleteTarget) return;
    try {
      await identityProviderServiceClient.deleteIdentityProvider({ name: deleteTarget.name });
    } catch (error: unknown) {
      handleError(error, toast.error, {
        context: "Delete identity provider",
      });
    }
    await fetchIdentityProviderList();
    setDeleteTarget(undefined);
  };

  const handleCreateIdentityProvider = () => {
    setEditingIdentityProvider(undefined);
    setIsCreateDialogOpen(true);
  };

  const handleEditIdentityProvider = (identityProvider: IdentityProvider) => {
    setEditingIdentityProvider(identityProvider);
    setIsCreateDialogOpen(true);
  };

  const handleDialogSuccess = async () => {
    await fetchIdentityProviderList();
    setIsCreateDialogOpen(false);
    setEditingIdentityProvider(undefined);
  };

  const handleDialogOpenChange = (open?: boolean) => {
    setIsCreateDialogOpen(false);
    setEditingIdentityProvider(undefined);
  };

  return (
    <SettingSection
      title={
        <div className="flex items-center gap-2">
          <span>{t("setting.sso-section.sso-list")}</span>
          <LearnMore url="https://usememos.com/docs/configuration/authentication" />
        </div>
      }
      actions={
        <Button 
          ref={createButtonRef}
          onClick={handleCreateIdentityProvider}
          variant="default"
          className={cn(
            "shadow-md hover:shadow-lg transition-all"
          )}
          style={(() => {
            if (isDark) {
              return {
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
                color: "#10b981",
              } as React.CSSProperties & { backgroundColor?: string };
            }
            
            // Theme-specific colors for light themes
            if (isColorfulTheme) {
              // Colorful theme: bright blue
              return {
                backgroundColor: "#2563eb",
                color: "#ffffff",
              } as React.CSSProperties & { backgroundColor?: string; color?: string };
            } else {
              // Paper, Whitewall, Default: use theme's primary color
              return {
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
              } as React.CSSProperties & { backgroundColor?: string; color?: string };
            }
          })()}
          onMouseEnter={(e) => {
            if (isDark) {
              e.currentTarget.style.setProperty("background-color", "var(--accent)", "important");
            } else if (isColorfulTheme) {
              e.currentTarget.style.setProperty("background-color", "#1d4ed8", "important");
            } else {
              e.currentTarget.style.setProperty("background-color", "var(--primary)", "important");
              e.currentTarget.style.setProperty("opacity", "0.9", "important");
            }
          }}
          onMouseLeave={(e) => {
            if (isDark) {
              e.currentTarget.style.setProperty("background-color", "var(--card)", "important");
            } else if (isColorfulTheme) {
              e.currentTarget.style.setProperty("background-color", "#2563eb", "important");
            } else {
              e.currentTarget.style.setProperty("background-color", "var(--primary)", "important");
              e.currentTarget.style.setProperty("opacity", "1", "important");
            }
          }}
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          {t("common.create")}
        </Button>
      }
    >
      {/* Inline form - appears above the table */}
      {isCreateDialogOpen && (
        <CreateIdentityProviderForm
          identityProvider={editingIdentityProvider}
          onSuccess={handleDialogSuccess}
          onCancel={handleDialogOpenChange}
        />
      )}

      <SettingTable
        columns={[
          {
            key: "title",
            header: t("common.name"),
            render: (_, provider: IdentityProvider) => (
              <span className="text-foreground">
                {provider.title}
                <span className="ml-2 text-sm text-muted-foreground">({provider.type})</span>
              </span>
            ),
          },
          {
            key: "actions",
            header: "",
            className: "text-right",
            render: (_, provider: IdentityProvider) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVerticalIcon className="w-4 h-auto" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={2}>
                  <DropdownMenuItem onClick={() => handleEditIdentityProvider(provider)}>{t("common.edit")}</DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteIdentityProvider(provider)}
                    className="text-destructive focus:text-destructive"
                  >
                    {t("common.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
        data={identityProviderList}
        emptyMessage={t("setting.sso-section.no-sso-found")}
        getRowKey={(provider) => provider.name}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title={deleteTarget ? t("setting.sso-section.confirm-delete", { name: deleteTarget.title }) : ""}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={confirmDeleteIdentityProvider}
        confirmVariant="destructive"
      />
    </SettingSection>
  );
};

export default SSOSection;
