import { create } from "@bufbuild/protobuf";
import { FieldMaskSchema } from "@bufbuild/protobuf/wkt";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { identityProviderServiceClient } from "@/connect";
import { absolutifyLink } from "@/helpers/utils";
import { handleError } from "@/lib/error";
import {
  FieldMapping,
  FieldMappingSchema,
  IdentityProvider,
  IdentityProvider_Type,
  IdentityProviderConfigSchema,
  IdentityProviderSchema,
  OAuth2Config,
  OAuth2ConfigSchema,
} from "@/types/proto/api/v1/idp_service_pb";
import { useTranslate } from "@/utils/i18n";

const templateList: IdentityProvider[] = [
  create(IdentityProviderSchema, {
    name: "",
    title: "GitHub",
    type: IdentityProvider_Type.OAUTH2,
    identifierFilter: "",
    config: create(IdentityProviderConfigSchema, {
      config: {
        case: "oauth2Config",
        value: create(OAuth2ConfigSchema, {
          clientId: "",
          clientSecret: "",
          authUrl: "https://github.com/login/oauth/authorize",
          tokenUrl: "https://github.com/login/oauth/access_token",
          userInfoUrl: "https://api.github.com/user",
          scopes: ["read:user"],
          fieldMapping: create(FieldMappingSchema, {
            identifier: "login",
            displayName: "name",
            email: "email",
          }),
        }),
      },
    }),
  }),
  create(IdentityProviderSchema, {
    name: "",
    title: "GitLab",
    type: IdentityProvider_Type.OAUTH2,
    identifierFilter: "",
    config: create(IdentityProviderConfigSchema, {
      config: {
        case: "oauth2Config",
        value: create(OAuth2ConfigSchema, {
          clientId: "",
          clientSecret: "",
          authUrl: "https://gitlab.com/oauth/authorize",
          tokenUrl: "https://gitlab.com/oauth/token",
          userInfoUrl: "https://gitlab.com/oauth/userinfo",
          scopes: ["openid"],
          fieldMapping: create(FieldMappingSchema, {
            identifier: "name",
            displayName: "name",
            email: "email",
          }),
        }),
      },
    }),
  }),
  create(IdentityProviderSchema, {
    name: "",
    title: "Google",
    type: IdentityProvider_Type.OAUTH2,
    identifierFilter: "",
    config: create(IdentityProviderConfigSchema, {
      config: {
        case: "oauth2Config",
        value: create(OAuth2ConfigSchema, {
          clientId: "",
          clientSecret: "",
          authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
          tokenUrl: "https://oauth2.googleapis.com/token",
          userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
          scopes: ["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"],
          fieldMapping: create(FieldMappingSchema, {
            identifier: "email",
            displayName: "name",
            email: "email",
          }),
        }),
      },
    }),
  }),
  create(IdentityProviderSchema, {
    name: "",
    title: "Custom",
    type: IdentityProvider_Type.OAUTH2,
    identifierFilter: "",
    config: create(IdentityProviderConfigSchema, {
      config: {
        case: "oauth2Config",
        value: create(OAuth2ConfigSchema, {
          clientId: "",
          clientSecret: "",
          authUrl: "",
          tokenUrl: "",
          userInfoUrl: "",
          scopes: [],
          fieldMapping: create(FieldMappingSchema, {
            identifier: "",
            displayName: "",
            email: "",
          }),
        }),
      },
    }),
  }),
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  identityProvider?: IdentityProvider;
  onSuccess?: () => void;
}

function CreateIdentityProviderDialog({ open, onOpenChange, identityProvider, onSuccess }: Props) {
  const t = useTranslate();
  const identityProviderTypes = [...new Set(templateList.map((t) => t.type))];
  const [basicInfo, setBasicInfo] = useState({
    title: "",
    identifierFilter: "",
  });
  const [type, setType] = useState<IdentityProvider_Type>(IdentityProvider_Type.OAUTH2);
  const [oauth2Config, setOAuth2Config] = useState<OAuth2Config>(
    create(OAuth2ConfigSchema, {
      clientId: "",
      clientSecret: "",
      authUrl: "",
      tokenUrl: "",
      userInfoUrl: "",
      scopes: [],
      fieldMapping: create(FieldMappingSchema, {
        identifier: "",
        displayName: "",
        email: "",
      }),
    }),
  );
  const [oauth2Scopes, setOAuth2Scopes] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("GitHub");
  const isCreating = identityProvider === undefined;

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
    if (!open) return; // Only apply when dialog is open
    
    const darkThemes = ["default-dark", "midnight"];
    
    // Apply styles to Create button
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
          // Paper, Whitewall, Default themes
          btn.style.setProperty("background-color", "#3b82f6", "important");
          btn.style.setProperty("color", "#ffffff", "important");
        }
      }, 0);
    }

    // Apply styles to Cancel button
    if (cancelButtonRef.current) {
      const btn = cancelButtonRef.current;
      setTimeout(() => {
        if (darkThemes.includes(currentTheme)) {
          btn.style.setProperty("color", "var(--foreground)", "important");
        } else {
          btn.style.setProperty("color", "var(--foreground)", "important");
        }
      }, 0);
    }
  }, [currentTheme, isDark, isColorfulTheme, open]);

  // Reset state when dialog is closed
  useEffect(() => {
    if (!open) {
      // Reset to default state when dialog is closed
      setBasicInfo({
        title: "",
        identifierFilter: "",
      });
      setType(IdentityProvider_Type.OAUTH2);
      setOAuth2Config(
        create(OAuth2ConfigSchema, {
          clientId: "",
          clientSecret: "",
          authUrl: "",
          tokenUrl: "",
          userInfoUrl: "",
          scopes: [],
          fieldMapping: create(FieldMappingSchema, {
            identifier: "",
            displayName: "",
            email: "",
          }),
        }),
      );
      setOAuth2Scopes("");
      setSelectedTemplate("GitHub");
    }
  }, [open]);

  // Load existing identity provider data when editing
  useEffect(() => {
    if (open && identityProvider) {
      setBasicInfo({
        title: identityProvider.title,
        identifierFilter: identityProvider.identifierFilter,
      });
      setType(identityProvider.type);
      if (identityProvider.type === IdentityProvider_Type.OAUTH2 && identityProvider.config?.config?.case === "oauth2Config") {
        const oauth2Config = create(OAuth2ConfigSchema, identityProvider.config.config.value || {});
        setOAuth2Config(oauth2Config);
        setOAuth2Scopes(oauth2Config.scopes.join(" "));
      }
    }
  }, [open, identityProvider]);

  // Load template data when creating new IDP
  useEffect(() => {
    if (!isCreating || !open) {
      return;
    }

    const template = templateList.find((t) => t.title === selectedTemplate);
    if (template) {
      setBasicInfo({
        title: template.title,
        identifierFilter: template.identifierFilter,
      });
      setType(template.type);
      if (template.type === IdentityProvider_Type.OAUTH2 && template.config?.config?.case === "oauth2Config") {
        const oauth2Config = create(OAuth2ConfigSchema, template.config.config.value || {});
        setOAuth2Config(oauth2Config);
        setOAuth2Scopes(oauth2Config.scopes.join(" "));
      }
    }
  }, [selectedTemplate, isCreating, open]);

  const handleCloseBtnClick = () => {
    onOpenChange(false);
  };

  const allowConfirmAction = () => {
    if (basicInfo.title === "") {
      return false;
    }
    if (type === IdentityProvider_Type.OAUTH2) {
      if (
        oauth2Config.clientId === "" ||
        oauth2Config.authUrl === "" ||
        oauth2Config.tokenUrl === "" ||
        oauth2Config.userInfoUrl === "" ||
        oauth2Scopes === "" ||
        oauth2Config.fieldMapping?.identifier === ""
      ) {
        return false;
      }
      if (isCreating) {
        if (oauth2Config.clientSecret === "") {
          return false;
        }
      }
    }

    return true;
  };

  const handleConfirmBtnClick = async () => {
    try {
      if (isCreating) {
        await identityProviderServiceClient.createIdentityProvider({
          identityProvider: create(IdentityProviderSchema, {
            ...basicInfo,
            type: type,
            config: create(IdentityProviderConfigSchema, {
              config: {
                case: "oauth2Config",
                value: {
                  ...oauth2Config,
                  scopes: oauth2Scopes.split(" "),
                },
              },
            }),
          }),
        });
        toast.success(t("setting.sso-section.sso-created", { name: basicInfo.title }));
      } else {
        await identityProviderServiceClient.updateIdentityProvider({
          identityProvider: create(IdentityProviderSchema, {
            ...basicInfo,
            name: identityProvider!.name,
            type: type,
            config: create(IdentityProviderConfigSchema, {
              config: {
                case: "oauth2Config",
                value: {
                  ...oauth2Config,
                  scopes: oauth2Scopes.split(" "),
                },
              },
            }),
          }),
          updateMask: create(FieldMaskSchema, { paths: ["title", "identifier_filter", "config"] }),
        });
        toast.success(t("setting.sso-section.sso-updated", { name: basicInfo.title }));
      }
    } catch (error: unknown) {
      await handleError(error, toast.error, {
        context: isCreating ? "Create identity provider" : "Update identity provider",
      });
    }
    onSuccess?.();
    onOpenChange(false);
  };

  const setPartialOAuth2Config = (state: Partial<OAuth2Config>) => {
    setOAuth2Config({
      ...oauth2Config,
      ...state,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(isCreating ? "setting.sso-section.create-sso" : "setting.sso-section.update-sso")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col justify-start items-start w-full space-y-4">
          {isCreating && (
            <>
              <p className="mb-1!">{t("common.type")}</p>
              <Select value={String(type)} onValueChange={(value) => setType(parseInt(value) as unknown as IdentityProvider_Type)}>
                <SelectTrigger className="w-full mb-4">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {identityProviderTypes.map((kind) => (
                    <SelectItem key={kind} value={String(kind)}>
                      {IdentityProvider_Type[kind] || kind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mb-2 text-sm font-medium">{t("setting.sso-section.template")}</p>
              <Select value={selectedTemplate} onValueChange={(value) => setSelectedTemplate(value)}>
                <SelectTrigger className="mb-1 h-auto w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templateList.map((template) => (
                    <SelectItem key={template.title} value={template.title}>
                      {template.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Separator className="my-2" />
            </>
          )}
          <p className="mb-1 text-sm font-medium">
            {t("common.name")}
            <span className="text-destructive">*</span>
          </p>
          <Input
            className="mb-2 w-full"
            placeholder={t("common.name")}
            value={basicInfo.title}
            onChange={(e) =>
              setBasicInfo({
                ...basicInfo,
                title: e.target.value,
              })
            }
          />
          <p className="mb-1 text-sm font-medium">{t("setting.sso-section.identifier-filter")}</p>
          <Input
            className="mb-2 w-full"
            placeholder={t("setting.sso-section.identifier-filter")}
            value={basicInfo.identifierFilter}
            onChange={(e) =>
              setBasicInfo({
                ...basicInfo,
                identifierFilter: e.target.value,
              })
            }
          />
          <Separator className="my-2" />
          {type === IdentityProvider_Type.OAUTH2 && (
            <>
              {isCreating && (
                <p className="border border-border rounded-md p-2 text-sm w-full mb-2 break-all">
                  {t("setting.sso-section.redirect-url")}: {absolutifyLink("/auth/callback")}
                </p>
              )}
              <p className="mb-1 text-sm font-medium">
                {t("setting.sso-section.client-id")}
                <span className="text-destructive">*</span>
              </p>
              <Input
                className="mb-2 w-full"
                placeholder={t("setting.sso-section.client-id")}
                value={oauth2Config.clientId}
                onChange={(e) => setPartialOAuth2Config({ clientId: e.target.value })}
              />
              <p className="mb-1 text-sm font-medium">
                {t("setting.sso-section.client-secret")}
                <span className="text-destructive">*</span>
              </p>
              <Input
                className="mb-2 w-full"
                placeholder={t("setting.sso-section.client-secret")}
                value={oauth2Config.clientSecret}
                onChange={(e) => setPartialOAuth2Config({ clientSecret: e.target.value })}
              />
              <p className="mb-1 text-sm font-medium">
                {t("setting.sso-section.authorization-endpoint")}
                <span className="text-destructive">*</span>
              </p>
              <Input
                className="mb-2 w-full"
                placeholder={t("setting.sso-section.authorization-endpoint")}
                value={oauth2Config.authUrl}
                onChange={(e) => setPartialOAuth2Config({ authUrl: e.target.value })}
              />
              <p className="mb-1 text-sm font-medium">
                {t("setting.sso-section.token-endpoint")}
                <span className="text-destructive">*</span>
              </p>
              <Input
                className="mb-2 w-full"
                placeholder={t("setting.sso-section.token-endpoint")}
                value={oauth2Config.tokenUrl}
                onChange={(e) => setPartialOAuth2Config({ tokenUrl: e.target.value })}
              />
              <p className="mb-1 text-sm font-medium">
                {t("setting.sso-section.user-endpoint")}
                <span className="text-destructive">*</span>
              </p>
              <Input
                className="mb-2 w-full"
                placeholder={t("setting.sso-section.user-endpoint")}
                value={oauth2Config.userInfoUrl}
                onChange={(e) => setPartialOAuth2Config({ userInfoUrl: e.target.value })}
              />
              <p className="mb-1 text-sm font-medium">
                {t("setting.sso-section.scopes")}
                <span className="text-destructive">*</span>
              </p>
              <Input
                className="mb-2 w-full"
                placeholder={t("setting.sso-section.scopes")}
                value={oauth2Scopes}
                onChange={(e) => setOAuth2Scopes(e.target.value)}
              />
              <Separator className="my-2" />
              <p className="mb-1 text-sm font-medium">
                {t("setting.sso-section.identifier")}
                <span className="text-destructive">*</span>
              </p>
              <Input
                className="mb-2 w-full"
                placeholder={t("setting.sso-section.identifier")}
                value={oauth2Config.fieldMapping!.identifier}
                onChange={(e) =>
                  setPartialOAuth2Config({ fieldMapping: { ...oauth2Config.fieldMapping, identifier: e.target.value } as FieldMapping })
                }
              />
              <p className="mb-1 text-sm font-medium">{t("setting.sso-section.display-name")}</p>
              <Input
                className="mb-2 w-full"
                placeholder={t("setting.sso-section.display-name")}
                value={oauth2Config.fieldMapping!.displayName}
                onChange={(e) =>
                  setPartialOAuth2Config({ fieldMapping: { ...oauth2Config.fieldMapping, displayName: e.target.value } as FieldMapping })
                }
              />
              <p className="mb-1 text-sm font-medium">{t("common.email")}</p>
              <Input
                className="mb-2 w-full"
                placeholder={t("common.email")}
                value={oauth2Config.fieldMapping!.email}
                onChange={(e) =>
                  setPartialOAuth2Config({ fieldMapping: { ...oauth2Config.fieldMapping, email: e.target.value } as FieldMapping })
                }
              />
              <p className="mb-1 text-sm font-medium">Avatar URL</p>
              <Input
                className="mb-2 w-full"
                placeholder={"Avatar URL"}
                value={oauth2Config.fieldMapping!.avatarUrl}
                onChange={(e) =>
                  setPartialOAuth2Config({ fieldMapping: { ...oauth2Config.fieldMapping, avatarUrl: e.target.value } as FieldMapping })
                }
              />
            </>
          )}
        </div>
        <DialogFooter>
          <Button 
            ref={cancelButtonRef}
            variant="ghost" 
            onClick={handleCloseBtnClick}
            className={cn(
              "transition-all",
              isDark && "hover:bg-accent/50"
            )}
            style={{
              color: isDark ? "var(--foreground)" : "var(--foreground)",
            }}
            onMouseEnter={(e) => {
              if (isDark) {
                e.currentTarget.style.setProperty("background-color", "var(--accent)", "important");
              } else {
                e.currentTarget.style.setProperty("background-color", "var(--accent)", "important");
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.setProperty("background-color", "transparent", "important");
            }}
          >
            {t("common.cancel")}
          </Button>
          <Button 
            ref={createButtonRef}
            onClick={handleConfirmBtnClick} 
            disabled={!allowConfirmAction()}
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
            {t(isCreating ? "common.create" : "common.update")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateIdentityProviderDialog;
