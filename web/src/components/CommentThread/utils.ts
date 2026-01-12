import type { Memo } from "@/types/proto/api/v1/memo_service_pb";
import type { CommentNode } from "./types";

/**
 * Builds a hierarchical tree structure from flat comments.
 * Comments with a parent field pointing to another comment are nested.
 */
export function buildCommentTree(comments: Memo[], rootMemoName: string): CommentNode[] {
  // Create a map of comment name -> comment for quick lookup
  const commentMap = new Map<string, Memo>();
  comments.forEach((comment) => {
    commentMap.set(comment.name, comment);
  });

  // Build the tree
  const rootNodes: CommentNode[] = [];
  const nodeMap = new Map<string, CommentNode>();

  // First pass: create all nodes
  comments.forEach((comment) => {
    const node: CommentNode = {
      comment,
      children: [],
      depth: 0,
    };
    nodeMap.set(comment.name, node);
  });

  // Second pass: build parent-child relationships
  comments.forEach((comment) => {
    const node = nodeMap.get(comment.name);
    if (!node) return;

    // If comment has a parent and it's not the root memo, it's a nested comment
    if (comment.parent && comment.parent !== rootMemoName) {
      const parentNode = nodeMap.get(comment.parent);
      if (parentNode) {
        parentNode.children.push(node);
        node.depth = parentNode.depth + 1;
      } else {
        // Parent not found in comments list, treat as root-level comment
        // This can happen if parent comment was deleted or if parent field points to wrong memo
        rootNodes.push(node);
      }
    } else {
      // Root-level comment (parent is the original memo, no parent, or parent field not set)
      rootNodes.push(node);
    }
  });

  // Sort comments by creation time (oldest first for natural threading)
  const sortComments = (nodes: CommentNode[]): CommentNode[] => {
    return nodes
      .sort((a, b) => {
        const timeA = a.comment.createTime?.seconds;
        const timeB = b.comment.createTime?.seconds;
        
        // Handle BigInt values properly - convert to Number for comparison
        if (timeA && timeB) {
          // Convert BigInt to Number for comparison
          const numA = typeof timeA === 'bigint' ? Number(timeA) : timeA;
          const numB = typeof timeB === 'bigint' ? Number(timeB) : timeB;
          return numA - numB;
        }
        if (timeA) return -1; // a has time, b doesn't - a comes first
        if (timeB) return 1;  // b has time, a doesn't - b comes first
        return 0; // Neither has time, maintain order
      })
      .map((node) => ({
        ...node,
        children: sortComments(node.children),
      }));
  };

  return sortComments(rootNodes);
}

/**
 * Counts total comments including nested ones
 */
export function countTotalComments(nodes: CommentNode[]): number {
  return nodes.reduce((count, node) => {
    return count + 1 + countTotalComments(node.children);
  }, 0);
}

