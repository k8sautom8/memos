import { ReplyIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { timestampDate } from "@bufbuild/protobuf/wkt";
import { cn } from "@/lib/utils";
import UserAvatar from "../UserAvatar";
import MemoContent from "../MemoContent";
import { Button } from "../ui/button";
import { useUser } from "@/hooks/useUserQueries";
import type { Memo } from "@/types/proto/api/v1/memo_service_pb";

interface CommentItemProps {
  comment: Memo;
  depth?: number;
  onReply?: () => void;
  showReplyButton?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  depth = 0,
  onReply,
  showReplyButton = true,
}) => {
  const creator = useUser(comment.creator).data;
  // Calculate indentation - LinkedIn style: indent replies under their parent
  // Each level indents by avatar width (32px) + gap (12px) = 44px
  const indentPx = depth > 0 ? depth * 44 : 0;

  return (
    <div 
      className={cn(
        "flex gap-3 py-1.5 group transition-colors",
        depth === 0 ? "hover:bg-muted/20 rounded-lg px-1 -mx-1" : ""
      )} 
      style={{ 
        marginLeft: indentPx > 0 ? `${indentPx}px` : 0,
        paddingLeft: depth > 0 ? "12px" : undefined
      }}
    >
      
      {/* Avatar */}
      <div className="flex-shrink-0 relative z-10">
        <Link
          to={`/u/${encodeURIComponent(creator?.username || "")}`}
          viewTransition
          className="hover:opacity-80 transition-opacity"
        >
          <UserAvatar avatarUrl={creator?.avatarUrl} className="w-8 h-8" />
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header: Name + Time */}
        <div className="flex items-center gap-2 mb-0.5">
          <Link
            to={`/u/${encodeURIComponent(creator?.username || "")}`}
            viewTransition
            className={cn(
              "text-sm hover:underline",
              depth === 0 ? "font-semibold text-foreground" : "font-medium text-foreground/90"
            )}
          >
            {creator?.displayName || creator?.username}
          </Link>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">
            {comment.displayTime ? (
              <relative-time
                datetime={timestampDate(comment.displayTime)?.toISOString() || ""}
                format="auto"
              ></relative-time>
            ) : null}
          </span>
        </div>

        {/* Comment content */}
        <div className="text-sm text-foreground leading-relaxed mb-1">
          <MemoContent content={comment.content} compact />
        </div>

        {/* Reply button */}
        {showReplyButton && onReply && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground -ml-2 mt-0.5 font-medium"
            onClick={onReply}
          >
            <ReplyIcon className="w-3 h-3 mr-1.5" />
            Reply
          </Button>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
