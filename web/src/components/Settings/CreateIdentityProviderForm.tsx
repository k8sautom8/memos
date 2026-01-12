import { create } from "@bufbuild/protobuf";
import { FieldMaskSchema } from "@bufbuild/protobuf/wkt";
import { XIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
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
  identityProvider?: IdentityProvider;
  onSuccess?: () => void;
  onCancel: () => void;
}

function CreateIdentityProviderForm({ identityProvider, onSuccess, onCancel }: Props) {
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

  // Load existing identity provider data when editing
  useEffect(() => {
    if (identityProvider) {
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
    } else {
      // Reset state when creating new
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
  }, [identityProvider]);

  // Load template data when creating new IDP
  useEffect(() => {
    if (!isCreating || identityProvider) {
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
  }, [selectedTemplate, isCreating, identityProvider]);

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
    onCancel();
  };

  const setPartialOAuth2Config = (state: Partial<OAuth2Config>) => {
    setOAuth2Config({
      ...oauth2Config,
      ...state,
    });
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
          {t(isCreating ? "setting.sso-section.create-sso" : "setting.sso-section.update-sso")}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-8 w-8"
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col justify-start items-start w-full space-y-4">
        {isCreating && (
          <>
            <div className="w-full">
              <p className="mb-1 text-sm font-medium">{t("common.type")}</p>
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
            </div>
            <div className="w-full">
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
            </div>
            <Separator className="my-2 w-full" />
          </>
        )}
        <div className="w-full">
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
        </div>
        <div className="w-full">
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
        </div>
        <Separator className="my-2 w-full" />
        {type === IdentityProvider_Type.OAUTH2 && (
          <>
            {isCreating && (
              <div className="w-full border border-border rounded-md p-2 text-sm mb-2 break-all bg-muted/30">
                {t("setting.sso-section.redirect-url")}: {absolutifyLink("/auth/callback")}
              </div>
            )}
            <div className="w-full">
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
            </div>
            <div className="w-full">
              <p className="mb-1 text-sm font-medium">
                {t("setting.sso-section.client-secret")}
                <span className="text-destructive">*</span>
              </p>
              <Input
                className="mb-2 w-full"
                type="password"
                placeholder={t("setting.sso-section.client-secret")}
                value={oauth2Config.clientSecret}
                onChange={(e) => setPartialOAuth2Config({ clientSecret: e.target.value })}
              />
            </div>
            <div className="w-full">
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
            </div>
            <div className="w-full">
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
            </div>
            <div className="w-full">
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
            </div>
            <div className="w-full">
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
            </div>
            <Separator className="my-2 w-full" />
            <div className="w-full">
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
            </div>
            <div className="w-full">
              <p className="mb-1 text-sm font-medium">{t("setting.sso-section.display-name")}</p>
              <Input
                className="mb-2 w-full"
                placeholder={t("setting.sso-section.display-name")}
                value={oauth2Config.fieldMapping!.displayName}
                onChange={(e) =>
                  setPartialOAuth2Config({ fieldMapping: { ...oauth2Config.fieldMapping, displayName: e.target.value } as FieldMapping })
                }
              />
            </div>
            <div className="w-full">
              <p className="mb-1 text-sm font-medium">{t("common.email")}</p>
              <Input
                className="mb-2 w-full"
                placeholder={t("common.email")}
                value={oauth2Config.fieldMapping!.email}
                onChange={(e) =>
                  setPartialOAuth2Config({ fieldMapping: { ...oauth2Config.fieldMapping, email: e.target.value } as FieldMapping })
                }
              />
            </div>
            <div className="w-full">
              <p className="mb-1 text-sm font-medium">Avatar URL</p>
              <Input
                className="mb-2 w-full"
                placeholder={"Avatar URL"}
                value={oauth2Config.fieldMapping!.avatarUrl}
                onChange={(e) =>
                  setPartialOAuth2Config({ fieldMapping: { ...oauth2Config.fieldMapping, avatarUrl: e.target.value } as FieldMapping })
                }
              />
            </div>
          </>
        )}
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
          ref={createButtonRef}
          onClick={handleConfirmBtnClick}
          disabled={!allowConfirmAction()}
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
          {t(isCreating ? "common.create" : "common.update")}
        </Button>
      </div>
    </div>
  );
}

export default CreateIdentityProviderForm;

