import { create } from "@bufbuild/protobuf";
import { FieldMaskSchema, timestampDate, timestampFromDate } from "@bufbuild/protobuf/wkt";
import { isEqual } from "lodash-es";
import { memoServiceClient } from "@/connect";
import type { Attachment } from "@/types/proto/api/v1/attachment_service_pb";
import { AttachmentSchema } from "@/types/proto/api/v1/attachment_service_pb";
import type { Memo } from "@/types/proto/api/v1/memo_service_pb";
import { MemoSchema } from "@/types/proto/api/v1/memo_service_pb";
import type { EditorState } from "../state";
import { uploadService } from "./uploadService";
import { tagService } from "./tagService";

/**
 * Converts attachments to reference format for API requests.
 * The backend only needs the attachment name to link it to a memo.
 */
function toAttachmentReferences(attachments: Attachment[]): Attachment[] {
  return attachments.map((a) => create(AttachmentSchema, { name: a.name }));
}

function buildUpdateMask(
  prevMemo: Memo,
  state: EditorState,
  allAttachments: typeof state.metadata.attachments,
): { mask: Set<string>; patch: Partial<Memo> } {
  const mask = new Set<string>();
  const patch: Partial<Memo> = {
    name: prevMemo.name,
    content: state.content,
  };

  if (!isEqual(state.content, prevMemo.content)) {
    mask.add("content");
    patch.content = state.content;
  }
  if (!isEqual(state.metadata.visibility, prevMemo.visibility)) {
    mask.add("visibility");
    patch.visibility = state.metadata.visibility;
  }
  if (!isEqual(allAttachments, prevMemo.attachments)) {
    mask.add("attachments");
    patch.attachments = toAttachmentReferences(allAttachments);
  }
  if (!isEqual(state.metadata.relations, prevMemo.relations)) {
    mask.add("relations");
    patch.relations = state.metadata.relations;
  }
  if (!isEqual(state.metadata.location, prevMemo.location)) {
    mask.add("location");
    patch.location = state.metadata.location;
  }

  // Auto-update timestamp if content changed
  if (["content", "attachments", "relations", "location"].some((key) => mask.has(key))) {
    mask.add("update_time");
  }

  // Handle custom timestamps
  if (state.timestamps.createTime) {
    const prevCreateTime = prevMemo.createTime ? timestampDate(prevMemo.createTime) : undefined;
    if (!isEqual(state.timestamps.createTime, prevCreateTime)) {
      mask.add("create_time");
      patch.createTime = timestampFromDate(state.timestamps.createTime);
    }
  }
  if (state.timestamps.updateTime) {
    const prevUpdateTime = prevMemo.updateTime ? timestampDate(prevMemo.updateTime) : undefined;
    if (!isEqual(state.timestamps.updateTime, prevUpdateTime)) {
      mask.add("update_time");
      patch.updateTime = timestampFromDate(state.timestamps.updateTime);
    }
  }

  return { mask, patch };
}

/**
 * Generate tags in the background after memo is saved (non-blocking)
 */
async function generateTagsInBackground(memoName: string, content: string, prevMemo: Memo | null, currentUserName?: string) {
  // Only generate tags if:
  // - Memo has no existing tags
  // - Content doesn't already have #tags
  // - Content is substantial (>20 chars)
  const hasTags = prevMemo?.tags && prevMemo.tags.length > 0;
  const hasTagsInContent = /#\w+/.test(content);
  
  if (hasTags || hasTagsInContent || content.trim().length <= 20) {
    return; // Skip tag generation
  }

  try {
    const aiTags = await tagService.generateTags(content, currentUserName);
    if (aiTags.length > 0) {
      // Check if tags are already in content
      const tagsAlreadyInContent = aiTags.some((tag) => content.includes(tag));
      if (!tagsAlreadyInContent) {
        // Fetch current memo to update
        const currentMemo = await memoServiceClient.getMemo({ name: memoName });
        const updatedContent = `${currentMemo.content.trim()}\n\n${aiTags.join(" ")}`;
        
        // Update memo with tags
        await memoServiceClient.updateMemo({
          memo: create(MemoSchema, {
            name: currentMemo.name,
            content: updatedContent,
          }),
          updateMask: create(FieldMaskSchema, { paths: ["content"] }),
        });
      }
    }
  } catch (error) {
    // Silently fail - tag generation is optional
    console.error("Failed to generate tags in background:", error);
  }
}

export const memoService = {
  async save(
    state: EditorState,
    options: {
      memoName?: string;
      parentMemoName?: string;
      currentUserName?: string;
    },
  ): Promise<{ memoName: string; hasChanges: boolean }> {
    // 1. Upload local files first
    const newAttachments = await uploadService.uploadFiles(state.localFiles);
    const allAttachments = [...state.metadata.attachments, ...newAttachments];

    // 2. Save memo first (without tags) for fast response
    let prevMemo: Memo | null = null;
    
    if (options.memoName) {
      // For existing memos, fetch to check for tags
      try {
        prevMemo = await memoServiceClient.getMemo({ name: options.memoName });
      } catch (error) {
        console.error("Failed to fetch existing memo:", error);
      }
    }

    // 3. Update existing memo
    if (options.memoName) {
      // Use prevMemo if we already fetched it, otherwise fetch it
      if (!prevMemo) {
        prevMemo = await memoServiceClient.getMemo({ name: options.memoName });
      }
      const { mask, patch } = buildUpdateMask(prevMemo!, state, allAttachments);

      if (mask.size === 0) {
        return { memoName: prevMemo!.name, hasChanges: false };
      }

      const memo = await memoServiceClient.updateMemo({
        memo: create(MemoSchema, patch as Record<string, unknown>),
        updateMask: create(FieldMaskSchema, { paths: Array.from(mask) }),
      });

      // Generate tags in background (async, non-blocking)
      generateTagsInBackground(memo.name, state.content, prevMemo!, options.currentUserName);

      return { memoName: memo.name, hasChanges: true };
    }

    // 4. Create new memo or comment
    const memoData = create(MemoSchema, {
      content: state.content, // Save without tags first
      visibility: state.metadata.visibility,
      attachments: toAttachmentReferences(allAttachments),
      relations: state.metadata.relations,
      location: state.metadata.location,
      createTime: state.timestamps.createTime ? timestampFromDate(state.timestamps.createTime) : undefined,
      updateTime: state.timestamps.updateTime ? timestampFromDate(state.timestamps.updateTime) : undefined,
    });

    const memo = options.parentMemoName
      ? await memoServiceClient.createMemoComment({
          name: options.parentMemoName,
          comment: memoData,
        })
      : await memoServiceClient.createMemo({ memo: memoData });

    // Generate tags in background (async, non-blocking) - only for new memos, not comments
    if (!options.parentMemoName) {
      generateTagsInBackground(memo.name, state.content, null, options.currentUserName);
    }

    return { memoName: memo.name, hasChanges: true };
  },

  async load(memoName: string): Promise<EditorState> {
    const memo = await memoServiceClient.getMemo({ name: memoName });

    return {
      content: memo.content,
      metadata: {
        visibility: memo.visibility,
        attachments: memo.attachments,
        relations: memo.relations,
        location: memo.location,
      },
      ui: {
        isFocusMode: false,
        isLoading: {
          saving: false,
          uploading: false,
          loading: false,
        },
        isDragging: false,
        isComposing: false,
      },
      timestamps: {
        createTime: memo.createTime ? timestampDate(memo.createTime) : undefined,
        updateTime: memo.updateTime ? timestampDate(memo.updateTime) : undefined,
      },
      localFiles: [],
    };
  },
};
