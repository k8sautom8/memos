import { ChevronDownIcon, ChevronRightIcon, MessageCircleIcon, ReplyIcon } from "lucide-react";
import { useState } from "react";
import MemoEditor from "@/components/MemoEditor";
import MemoView from "@/components/MemoView";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/utils/i18n";
import { countTotalComments } from "./utils";
import type { CommentNode } from "./types";

interface CommentThreadProps {
  node: CommentNode;
  maxDepth?: number;
  rootMemoName?: string;
  onReply?: (parentComment: string) => void;
  parentPage?: string;
}

const CommentThread: React.FC<CommentThreadProps> = ({
  node,
  maxDepth = 10,
  onReply,
  parentPage,
}) => {
  const t = useTranslate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showReplyEditor, setShowReplyEditor] = useState(false);

  const { comment, children, depth } = node;
  const hasChildren = children.length > 0;
  const canNest = depth < maxDepth;

  const handleReply = () => {
    if (onReply) {
      onReply(comment.name);
    } else {
      setShowReplyEditor(true);
    }
  };

  const handleReplyCreated = () => {
    setShowReplyEditor(false);
  };

  // Indentation based on depth (Reddit-style)
  const indentWidth = Math.min(depth * 16, 80); // Max 80px indent

  return (
    <div className="w-full">
      {/* Comment */}
      <div
        className={cn(
          "relative flex gap-2 transition-all",
          depth > 0 && "mt-2"
        )}
        style={{ paddingLeft: `${indentWidth}px` }}
      >
        {/* Thread line (vertical line connecting comments) */}
        {depth > 0 && (
          <div
            className="absolute left-0 top-0 bottom-0 w-px bg-border/40 hover:bg-border/60 transition-colors"
            style={{ left: `${indentWidth - 8}px` }}
          />
        )}

        {/* Collapse/Expand button */}
        {hasChildren && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "absolute left-0 top-2 w-4 h-4 flex items-center justify-center rounded hover:bg-muted/50 transition-colors z-10",
              "text-muted-foreground hover:text-foreground"
            )}
            style={{ left: `${indentWidth - 12}px` }}
            aria-label={isCollapsed ? t("common.expand") : t("common.collapse")}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="w-3 h-3" />
            ) : (
              <ChevronDownIcon className="w-3 h-3" />
            )}
          </button>
        )}

        {/* Comment content */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <MemoView
              memo={comment}
              parentPage={parentPage}
              showCreator
              compact
            />

            {/* Reply button and comment count */}
            <div className="mt-1 flex items-center gap-2 px-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleReply}
              >
                <ReplyIcon className="w-3 h-3 mr-1" />
                {t("common.reply") || "Reply"}
              </Button>
              {hasChildren && (
                <span className="text-xs text-muted-foreground">
                  {countTotalComments(children)} {countTotalComments(children) === 1 ? (t("common.reply") || "reply") : (t("common.replies") || "replies")}
                </span>
              )}
            </div>

            {/* Reply editor */}
            {showReplyEditor && (
              <div className="mt-2 ml-4 border-l-2 border-primary/20 pl-4">
                <MemoEditor
                  cacheKey={`${comment.name}-reply-${Date.now()}`}
                  placeholder={t("editor.add-your-reply-here") || "Add your reply here..."}
                  parentMemoName={comment.name}
                  autoFocus
                  onConfirm={handleReplyCreated}
                  onCancel={() => setShowReplyEditor(false)}
                />
              </div>
            )}
          </div>

          {/* Nested replies */}
          {hasChildren && !isCollapsed && canNest && (
            <div className="mt-2 space-y-1">
              {children.map((childNode) => (
                <CommentThread
                  key={childNode.comment.name}
                  node={childNode}
                  maxDepth={maxDepth}
                  onReply={onReply}
                  parentPage={parentPage}
                />
              ))}
            </div>
          )}

          {/* Collapsed indicator */}
          {hasChildren && isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="mt-1 ml-4 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <MessageCircleIcon className="w-3 h-3" />
              {countTotalComments(children)} {countTotalComments(children) === 1 ? (t("common.reply") || "reply") : (t("common.replies") || "replies")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentThread;
