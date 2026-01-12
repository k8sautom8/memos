import { FileTextIcon, DownloadIcon, FileIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { EditorRefActions } from "../Editor";

interface ExportMenuProps {
  editorRef: React.RefObject<EditorRefActions>;
}

export default function ExportMenu({ editorRef }: ExportMenuProps) {
  const [isColorfulTheme, setIsColorfulTheme] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.getAttribute("data-theme") === "colorful";
    }
    return false;
  });

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
  const handleExportMarkdown = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const content = editor.getContent();
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `memo-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportText = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const content = editor.getContent();
    // Remove markdown syntax for plain text
    const plainText = content
      .replace(/#{1,6}\s+/g, "") // Remove headings
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
      .replace(/\*(.*?)\*/g, "$1") // Remove italic
      .replace(/~~(.*?)~~/g, "$1") // Remove strikethrough
      .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Remove links
      .replace(/`(.*?)`/g, "$1") // Remove inline code
      .replace(/```[\s\S]*?```/g, "") // Remove code blocks
      .replace(/>\s+/g, "") // Remove blockquotes
      .replace(/^[-*+]\s+/gm, "") // Remove list markers
      .replace(/^\d+\.\s+/gm, "") // Remove numbered list markers
      .replace(/^-\s+\[[ xX]\]\s+/gm, "") // Remove task list markers
      .replace(/\n{3,}/g, "\n\n") // Remove excessive newlines
      .trim();

    const blob = new Blob([plainText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `memo-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportHTML = async () => {
    const editor = editorRef.current;
    if (!editor) return;

    const content = editor.getContent();
    
    // Convert markdown to HTML (simplified version)
    // For a full implementation, you'd want to use a markdown parser
    let html = content
      .replace(/#{6}\s+(.*)/g, "<h6>$1</h6>")
      .replace(/#{5}\s+(.*)/g, "<h5>$1</h5>")
      .replace(/#{4}\s+(.*)/g, "<h4>$1</h4>")
      .replace(/#{3}\s+(.*)/g, "<h3>$1</h3>")
      .replace(/#{2}\s+(.*)/g, "<h2>$1</h2>")
      .replace(/#{1}\s+(.*)/g, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/~~(.*?)~~/g, "<del>$1</del>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Memo Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6; }
    h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; }
    code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 1em; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>
${html}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `memo-${new Date().toISOString().split("T")[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    const editor = editorRef.current;
    if (!editor) return;

    // For PDF export, we'll use the browser's print functionality
    // This is a simple approach - for better PDF generation, you'd use a library like jsPDF
    const content = editor.getContent();
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Convert markdown to HTML (simplified)
    let html = content
      .replace(/#{6}\s+(.*)/g, "<h6>$1</h6>")
      .replace(/#{5}\s+(.*)/g, "<h5>$1</h5>")
      .replace(/#{4}\s+(.*)/g, "<h4>$1</h4>")
      .replace(/#{3}\s+(.*)/g, "<h3>$1</h3>")
      .replace(/#{2}\s+(.*)/g, "<h2>$1</h2>")
      .replace(/#{1}\s+(.*)/g, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/~~(.*?)~~/g, "<del>$1</del>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Memo Export</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6; }
          h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; }
          code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; }
          @media print { body { padding: 1rem; } }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    setTimeout(() => {
      printWindow.print();
    }, 250);
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
                isColorfulTheme && "bg-transparent hover:bg-emerald-500/12 text-emerald-600 hover:text-emerald-700",
                !isColorfulTheme && "bg-transparent hover:bg-primary/5"
              )}
            >
              <DownloadIcon className={cn("h-4 w-4 sm:h-3.5 sm:w-3.5 md:h-3 md:w-3", isColorfulTheme && "text-emerald-600")} />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Export</p>
          <p className="text-xs text-muted-foreground">Export as Markdown, Text, HTML, or PDF</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportMarkdown}>
          <FileTextIcon className="w-4 h-4 mr-2" />
          Export as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportText}>
          <FileIcon className="w-4 h-4 mr-2" />
          Export as Text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportHTML}>
          <FileTextIcon className="w-4 h-4 mr-2" />
          Export as HTML
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileTextIcon className="w-4 h-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

