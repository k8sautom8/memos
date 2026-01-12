import type { Memo } from "@/types/proto/api/v1/memo_service_pb";

export interface CommentNode {
  comment: Memo;
  children: CommentNode[];
  depth: number;
}

export interface CommentThreadProps {
  node: CommentNode;
  maxDepth?: number;
  onReply?: (parentComment: string) => void;
  parentPage?: string;
}

