import { FileTextIcon, CalendarIcon, UsersIcon, ChefHatIcon, FolderKanbanIcon, BookOpenIcon, LightbulbIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getTemplates, TEMPLATES, type Template } from "./templates";
import type { EditorRefActions } from "../Editor";

interface TemplateMenuProps {
  editorRef: React.RefObject<EditorRefActions>;
}

const TEMPLATE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "daily-notes": CalendarIcon,
  "meeting-notes": UsersIcon,
  "food-recipe": ChefHatIcon,
  "project-plan": FolderKanbanIcon,
  "book-notes": BookOpenIcon,
  "idea-brainstorm": LightbulbIcon,
};

export default function TemplateMenu({ editorRef }: TemplateMenuProps) {
  const [templates, setTemplates] = useState<Template[]>(TEMPLATES);
  const [isColorfulTheme, setIsColorfulTheme] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.getAttribute("data-theme") === "colorful";
    }
    return false;
  });

  // Fetch templates from backend on mount
  useEffect(() => {
    getTemplates().then((fetchedTemplates) => {
      setTemplates(fetchedTemplates);
    });
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    
    const checkTheme = () => {
      setIsColorfulTheme(document.documentElement.getAttribute("data-theme") === "colorful");
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    
    return () => observer.disconnect();
  }, []);

  const handleTemplateSelect = (template: Template) => {
    const editor = editorRef.current;
    if (!editor) return;

    const currentContent = editor.getContent();
    const newContent = currentContent.trim() ? `${currentContent}\n\n${template.content}` : template.content;
    
    editor.setContent(newContent);
    editor.focus();
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className={cn(
                // Compact sizing: match formatting toolbar buttons
                "h-8 w-8 sm:h-7 sm:w-7 md:h-6 md:w-6",
                "border-0 shadow-none transition-all duration-200 ease-out",
                "rounded-md",
                isColorfulTheme && "bg-transparent hover:bg-purple-500/12 text-purple-600 hover:text-purple-700",
                !isColorfulTheme && "bg-transparent hover:bg-primary/5"
              )}
            >
              <FileTextIcon className={cn("h-4 w-4 sm:h-3.5 sm:w-3.5 md:h-3 md:w-3", isColorfulTheme && "text-purple-600")} />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Templates</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Templates</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {templates.map((template) => {
          const Icon = TEMPLATE_ICONS[template.id] || FileTextIcon;
          return (
            <DropdownMenuItem
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className="cursor-pointer"
            >
              <Icon className="w-4 h-4 mr-2" />
              <div className="flex flex-col">
                <span className="font-medium">{template.name}</span>
                <span className="text-xs text-muted-foreground">{template.description}</span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

