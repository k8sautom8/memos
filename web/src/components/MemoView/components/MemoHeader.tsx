import { BookmarkIcon, EyeOffIcon, MessageCircleMoreIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Visibility } from "@/types/proto/api/v1/memo_service_pb";
import type { User } from "@/types/proto/api/v1/user_service_pb";
import { useTranslate } from "@/utils/i18n";
import { convertVisibilityToString } from "@/utils/memo";
import MemoActionMenu from "../../MemoActionMenu";
import { ReactionSelector } from "../../MemoReactionListView";
import UserAvatar from "../../UserAvatar";
import VisibilityIcon from "../../VisibilityIcon";
import { useMemoViewContext, useMemoViewDerived } from "../MemoViewContext";
import type { MemoHeaderProps } from "../types";

const MemoHeader: React.FC<MemoHeaderProps> = ({
  showCreator,
  showVisibility,
  showPinned,
  onEdit,
  onGotoDetail,
  onPin,
  onUnpin,
  onToggleNsfwVisibility,
}) => {
  const t = useTranslate();
  const [reactionSelectorOpen, setReactionSelectorOpen] = useState(false);
  const [isColorfulTheme, setIsColorfulTheme] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.getAttribute("data-theme") === "colorful";
    }
    return false;
  });
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const theme = document.documentElement.getAttribute("data-theme");
      const darkThemes = ["default-dark", "midnight"];
      return darkThemes.includes(theme || "");
    }
    return false;
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const checkTheme = () => {
      setIsColorfulTheme(document.documentElement.getAttribute("data-theme") === "colorful");
      const theme = document.documentElement.getAttribute("data-theme");
      const darkThemes = ["default-dark", "midnight"];
      setIsDark(darkThemes.includes(theme || ""));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const { memo, creator, currentUser, parentPage, isArchived, readonly, showNSFWContent, nsfw } = useMemoViewContext();
  const { isInMemoDetailPage, commentAmount } = useMemoViewDerived();

  return (
    <div className="w-full flex flex-row justify-between items-center gap-2">
      <div className="w-auto max-w-[calc(100%-8rem)] grow flex flex-row justify-start items-center">
        {showCreator && creator && (
          <CreatorDisplay creator={creator} onGotoDetail={onGotoDetail} />
        )}
      </div>

      <div className="flex flex-row justify-end items-center select-none shrink-0 gap-2">
        {currentUser && !isArchived && (
          <ReactionSelector
            className={cn("border-none w-auto h-auto", reactionSelectorOpen && "block!", "block sm:hidden sm:group-hover:block")}
            memo={memo}
            onOpenChange={setReactionSelectorOpen}
          />
        )}

        {!isInMemoDetailPage && (
          <Link
            className={cn("flex flex-row justify-start items-center rounded-md px-1 hover:opacity-80 gap-0.5")}
            to={`/${memo.name}#comments`}
            viewTransition
            state={{ from: parentPage }}
          >
            <MessageCircleMoreIcon 
              className={cn(
                "w-4 h-4 mx-auto",
                isColorfulTheme && !isDark && "text-blue-600/70"
              )}
              style={isDark ? { color: "var(--card-foreground)" } : undefined}
            />
            {commentAmount > 0 && (
              <span 
                className={cn(
                  "text-xs",
                  isColorfulTheme && !isDark && "text-blue-600/70"
                )}
                style={isDark ? { color: "var(--card-foreground)" } : undefined}
              >
                {commentAmount}
              </span>
            )}
          </Link>
        )}

        {showVisibility && memo.visibility !== Visibility.PRIVATE && (
          <Tooltip>
            <TooltipTrigger>
              <span className="flex justify-center items-center rounded-md hover:opacity-80">
                <VisibilityIcon 
                  visibility={memo.visibility}
                  className={isDark ? undefined : undefined}
                  style={isDark ? { color: "#ffffff" } : undefined}
                />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {t(`memo.visibility.${convertVisibilityToString(memo.visibility).toLowerCase()}` as Parameters<typeof t>[0])}
            </TooltipContent>
          </Tooltip>
        )}

        {showPinned && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-pointer">
                  <BookmarkIcon
                    className={cn(
                      "w-4 h-auto transition-colors",
                      isColorfulTheme && !isDark && memo.pinned && "text-amber-600 fill-amber-600",
                      isColorfulTheme && !isDark && !memo.pinned && "text-amber-600/60 hover:text-amber-600 hover:fill-amber-600/30",
                      !isColorfulTheme && !isDark && memo.pinned && "text-primary fill-primary",
                      !isColorfulTheme && !isDark && !memo.pinned && "text-muted-foreground hover:text-primary"
                    )}
                    style={isDark ? { color: "var(--card-foreground)", fill: memo.pinned ? "var(--card-foreground)" : "transparent" } : undefined}
                    onClick={memo.pinned ? onUnpin : onPin}
                    onMouseDown={(e) => e.preventDefault()}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{memo.pinned ? t("common.unpin") : t("common.pin")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {nsfw && showNSFWContent && onToggleNsfwVisibility && (
          <span className="cursor-pointer">
            <EyeOffIcon 
              className={cn("w-4 h-auto", !isDark && "text-primary")}
              style={isDark ? { color: "#ffffff" } : undefined}
              onClick={onToggleNsfwVisibility} 
            />
          </span>
        )}

        <MemoActionMenu memo={memo} readonly={readonly} onEdit={onEdit} />
      </div>
    </div>
  );
};

interface CreatorDisplayProps {
  creator: User;
  onGotoDetail: () => void;
}

const CreatorDisplay: React.FC<CreatorDisplayProps> = ({ creator, onGotoDetail }) => (
  <div className="w-full flex flex-row justify-start items-center">
    <Link className="w-auto hover:opacity-80 rounded-md transition-colors" to={`/u/${encodeURIComponent(creator.username)}`} viewTransition>
      <UserAvatar className="mr-2 shrink-0" avatarUrl={creator.avatarUrl} />
    </Link>
    <Link
      className="block leading-tight hover:opacity-80 rounded-md transition-colors truncate text-muted-foreground"
      to={`/u/${encodeURIComponent(creator.username)}`}
      viewTransition
    >
      {creator.displayName || creator.username}
    </Link>
  </div>
);

export default MemoHeader;
