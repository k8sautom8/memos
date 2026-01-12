import { LatLng } from "leaflet";
import { uniqBy } from "lodash-es";
import {
  FileIcon,
  FileTextIcon,
  ImageIcon,
  LinkIcon,
  LoaderIcon,
  MapPinIcon,
  PaperclipIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "react-use";
import { useReverseGeocoding } from "@/components/map";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MemoRelation } from "@/types/proto/api/v1/memo_service_pb";
import { useTranslate } from "@/utils/i18n";
import { LinkMemoDialog, LocationDialog } from "../components";
import { useFileUpload, useLinkMemo, useLocation } from "../hooks";
import { useEditorContext } from "../state";
import type { InsertMenuProps } from "../types";
import type { LocalFile } from "../types/attachment";

const InsertMenu = (props: InsertMenuProps) => {
  const t = useTranslate();
  const { state, actions, dispatch } = useEditorContext();

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [isUploadingInline, setIsUploadingInline] = useState(false);
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

  const { fileInputRef, selectingFlag, handleFileInputChange, handleUploadClick } = useFileUpload((newFiles: LocalFile[]) => {
    newFiles.forEach((file) => dispatch(actions.addLocalFile(file)));
  });

  // Separate file input refs for different file types
  const documentInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);

  const handleDocumentUpload = () => {
    documentInputRef.current?.click();
  };

  const handleImageUpload = () => {
    imageInputRef.current?.click();
  };

  const handleDocumentInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    const localFiles: LocalFile[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    localFiles.forEach((localFile) => dispatch(actions.addLocalFile(localFile)));
    if (documentInputRef.current) documentInputRef.current.value = "";
  };

  const handleImageInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    const localFiles: LocalFile[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    localFiles.forEach((localFile) => dispatch(actions.addLocalFile(localFile)));
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleInlineImageUpload = () => {
    inlineImageInputRef.current?.click();
  };

  const handleInlineImageInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsUploadingInline(true);
    try {
      // Import upload service dynamically
      const { uploadService } = await import("../services/uploadService");
      
      // Convert files to LocalFile format for upload
      const localFiles: LocalFile[] = files.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      // Upload files
      const attachments = await uploadService.uploadFiles(localFiles);

      // Insert markdown image syntax at cursor position
      if (props.editorRef?.current && attachments.length > 0) {
        attachments.forEach((attachment) => {
          const imageUrl = attachment.externalLink || `${window.location.origin}/file/${attachment.name}/${attachment.filename}`;
          const altText = attachment.filename.replace(/\.[^/.]+$/, ""); // Remove extension for alt text
          const markdown = `![${altText}](${imageUrl})\n`;
          props.editorRef.current?.insertText("", markdown, "");
        });
      }

      // Clean up blob URLs
      localFiles.forEach((localFile) => URL.revokeObjectURL(localFile.previewUrl));
    } catch (error) {
      console.error("Failed to upload inline image:", error);
    } finally {
      setIsUploadingInline(false);
      if (inlineImageInputRef.current) inlineImageInputRef.current.value = "";
    }
  };

  const linkMemo = useLinkMemo({
    isOpen: linkDialogOpen,
    currentMemoName: props.memoName,
    existingRelations: state.metadata.relations,
    onAddRelation: (relation: MemoRelation) => {
      dispatch(actions.setMetadata({ relations: uniqBy([...state.metadata.relations, relation], (r) => r.relatedMemo?.name) }));
      setLinkDialogOpen(false);
    },
  });

  const location = useLocation(props.location);

  const [debouncedPosition, setDebouncedPosition] = useState<LatLng | undefined>(undefined);

  useDebounce(
    () => {
      setDebouncedPosition(location.state.position);
    },
    1000,
    [location.state.position],
  );

  const { data: displayName } = useReverseGeocoding(debouncedPosition?.lat, debouncedPosition?.lng);

  useEffect(() => {
    if (displayName) {
      location.setPlaceholder(displayName);
    }
  }, [displayName]);

  const isUploading = selectingFlag || props.isUploading;

  const handleLocationClick = () => {
    setLocationDialogOpen(true);
    if (!props.location && !location.locationInitialized) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            location.handlePositionChange(new LatLng(position.coords.latitude, position.coords.longitude));
          },
          (error) => {
            console.error("Geolocation error:", error);
          },
        );
      }
    }
  };

  const handleLocationConfirm = () => {
    const newLocation = location.getLocation();
    if (newLocation) {
      props.onLocationChange(newLocation);
      setLocationDialogOpen(false);
    }
  };

  const handleLocationCancel = () => {
    location.reset();
    setLocationDialogOpen(false);
  };

  const handlePositionChange = (position: LatLng) => {
    location.handlePositionChange(position);
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  // Compact sizing: match formatting toolbar buttons
                  "h-8 w-8 sm:h-7 sm:w-7 md:h-6 md:w-6",
                  "border-0 shadow-none",
                  "rounded-md",
                  "transition-all duration-200 ease-out",
                  isColorfulTheme && "bg-transparent hover:bg-sky-500/12 text-sky-600 hover:text-sky-700",
                  !isColorfulTheme && "bg-transparent hover:bg-primary/5",
                  isUploading && "opacity-70 cursor-wait",
                )}
                disabled={isUploading}
              >
                {isUploading ? (
                  <LoaderIcon className={cn("h-4 w-4 sm:h-3.5 sm:w-3.5 md:h-3 md:w-3 animate-spin", isColorfulTheme && "text-sky-600")} />
                ) : (
                  <PaperclipIcon className={cn("h-4 w-4 sm:h-3.5 sm:w-3.5 md:h-3 md:w-3", isColorfulTheme && "text-sky-600")} />
                )}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isUploading ? "Uploading..." : "Attach Files"}</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="start" className="min-w-[200px]">
          <DropdownMenuItem onClick={handleInlineImageUpload} className="cursor-pointer" disabled={isUploadingInline || !props.editorRef}>
            <ImageIcon className="w-4 h-4" />
            <span>Insert Image Inline</span>
            {isUploadingInline && <LoaderIcon className="w-3 h-3 ml-auto animate-spin" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleImageUpload} className="cursor-pointer">
            <ImageIcon className="w-4 h-4" />
            <span>Upload Images as Attachment</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDocumentUpload} className="cursor-pointer">
            <FileTextIcon className="w-4 h-4" />
            <span>Attach Documents</span>
            <span className="ml-auto text-xs text-muted-foreground">PDF, Word, etc.</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleUploadClick} className="cursor-pointer">
            <FileIcon className="w-4 h-4" />
            <span>{t("common.upload")} Any File</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setLinkDialogOpen(true)} className="cursor-pointer">
            <LinkIcon className="w-4 h-4" />
            {t("tooltip.link-memo")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLocationClick} className="cursor-pointer">
            <MapPinIcon className="w-4 h-4" />
            {t("tooltip.select-location")}
          </DropdownMenuItem>
          <div className="px-2 py-1 text-xs text-muted-foreground opacity-80">{t("editor.slash-commands")}</div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden file inputs */}
      <input
        className="hidden"
        ref={fileInputRef}
        disabled={isUploading}
        onChange={handleFileInputChange}
        type="file"
        multiple={true}
        accept="*"
      />
      {/* Document-specific input */}
      <input
        className="hidden"
        ref={documentInputRef}
        disabled={isUploading}
        onChange={handleDocumentInputChange}
        type="file"
        multiple={true}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.odt,.ods,.odp,.epub,.zip,.rar,.7z"
      />
      {/* Image-specific input */}
      <input
        className="hidden"
        ref={imageInputRef}
        disabled={isUploading}
        onChange={handleImageInputChange}
        type="file"
        multiple={true}
        accept="image/*"
      />
      {/* Inline image input */}
      <input
        className="hidden"
        ref={inlineImageInputRef}
        disabled={isUploadingInline}
        onChange={handleInlineImageInputChange}
        type="file"
        multiple={true}
        accept="image/*"
      />

      <LinkMemoDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        searchText={linkMemo.searchText}
        onSearchChange={linkMemo.setSearchText}
        filteredMemos={linkMemo.filteredMemos}
        isFetching={linkMemo.isFetching}
        onSelectMemo={linkMemo.addMemoRelation}
      />

      <LocationDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        state={location.state}
        locationInitialized={location.locationInitialized}
        onPositionChange={handlePositionChange}
        onUpdateCoordinate={location.updateCoordinate}
        onPlaceholderChange={location.setPlaceholder}
        onCancel={handleLocationCancel}
        onConfirm={handleLocationConfirm}
      />
    </>
  );
};

export default InsertMenu;
