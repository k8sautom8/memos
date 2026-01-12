import { memo, useEffect, useMemo, useRef, useState } from "react";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useUser } from "@/hooks/useUserQueries";
import { cn } from "@/lib/utils";
import { State } from "@/types/proto/api/v1/common_pb";
import { isSuperUser } from "@/utils/user";
import MemoEditor from "../MemoEditor";
import PreviewImageDialog from "../PreviewImageDialog";
import { MemoBody, MemoHeader } from "./components";
import { MEMO_CARD_BASE_CLASSES, getMemoCardGradient } from "./constants";
import { useImagePreview, useMemoActions, useMemoHandlers, useNsfwContent } from "./hooks";
import { MemoViewContext } from "./MemoViewContext";
import type { MemoViewProps } from "./types";

const MemoView: React.FC<MemoViewProps> = (props: MemoViewProps) => {
  const { memo: memoData, className, parentPage: parentPageProp } = props;
  const cardRef = useRef<HTMLDivElement>(null);
  const [showEditor, setShowEditor] = useState(false);

  const currentUser = useCurrentUser();
  const creator = useUser(memoData.creator).data;
  const isArchived = memoData.state === State.ARCHIVED;
  const readonly = memoData.creator !== currentUser?.name && !isSuperUser(currentUser);
  const parentPage = parentPageProp || "/";

  const { nsfw, showNSFWContent, toggleNsfwVisibility } = useNsfwContent(memoData, props.showNsfwContent);
  const { previewState, openPreview, setPreviewOpen } = useImagePreview();
  const { pinMemo, unpinMemo } = useMemoActions(memoData, isArchived);

  // Check if colorful theme is active (with state to trigger re-renders on theme change)
  // MUST be before any early returns to follow Rules of Hooks
  const [isColorfulTheme, setIsColorfulTheme] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.getAttribute("data-theme") === "colorful";
  });

  useEffect(() => {
    const checkTheme = () => {
      const isColorful = document.documentElement.getAttribute("data-theme") === "colorful";
      setIsColorfulTheme(isColorful);
    };

    // Check initially
    checkTheme();

    // Watch for theme changes via MutationObserver
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  // Get gradient class for this memo
  const gradientClass = useMemo(() => {
    if (!isColorfulTheme) return "";
    return getMemoCardGradient(memoData.name);
  }, [isColorfulTheme, memoData.name]);

  const handleEditorConfirm = () => setShowEditor(false);
  const handleEditorCancel = () => setShowEditor(false);
  const openEditor = () => setShowEditor(true);

  const { handleGotoMemoDetailPage, handleMemoContentClick, handleMemoContentDoubleClick } = useMemoHandlers({
    memoName: memoData.name,
    parentPage,
    readonly,
    openEditor,
    openPreview,
  });

  const contextValue = useMemo(
    () => ({
      memo: memoData,
      creator,
      currentUser,
      parentPage,
      isArchived,
      readonly,
      showNSFWContent,
      nsfw,
    }),
    [memoData, creator, currentUser, parentPage, isArchived, readonly, showNSFWContent, nsfw],
  );

  if (showEditor) {
    return (
      <MemoEditor
        autoFocus
        className="mb-2"
        cacheKey={`inline-memo-editor-${memoData.name}`}
        memoName={memoData.name}
        onConfirm={handleEditorConfirm}
        onCancel={handleEditorCancel}
      />
    );
  }

  return (
    <MemoViewContext.Provider value={contextValue}>
      <article
        className={cn(
          MEMO_CARD_BASE_CLASSES,
          gradientClass,
          isColorfulTheme && "shadow-md hover:shadow-lg",
          className,
        )}
        ref={cardRef}
        tabIndex={readonly ? -1 : 0}
      >
        <MemoHeader
          showCreator={props.showCreator}
          showVisibility={props.showVisibility}
          showPinned={props.showPinned}
          onEdit={openEditor}
          onGotoDetail={handleGotoMemoDetailPage}
          onPin={pinMemo}
          onUnpin={unpinMemo}
          onToggleNsfwVisibility={toggleNsfwVisibility}
        />

        <MemoBody
          compact={props.compact}
          onContentClick={handleMemoContentClick}
          onContentDoubleClick={handleMemoContentDoubleClick}
          onToggleNsfwVisibility={toggleNsfwVisibility}
          onGotoDetail={handleGotoMemoDetailPage}
        />

        <PreviewImageDialog
          open={previewState.open}
          onOpenChange={setPreviewOpen}
          imgUrls={previewState.urls}
          initialIndex={previewState.index}
        />
      </article>
    </MemoViewContext.Provider>
  );
};

export default memo(MemoView);
