import type { Element } from "hast";
import { memo } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/utils/i18n";
import { remarkDisableSetext } from "@/utils/remark-plugins/remark-disable-setext";
import { remarkPreserveType } from "@/utils/remark-plugins/remark-preserve-type";
import { remarkTag } from "@/utils/remark-plugins/remark-tag";
import { CodeBlock } from "./CodeBlock";
import { isTagNode, isTaskListItemNode } from "./ConditionalComponent";
import { SANITIZE_SCHEMA } from "./constants";
import { useCompactLabel, useCompactMode } from "./hooks";
import { OptimizedImage } from "./OptimizedImage";
import { Tag } from "./Tag";
import { TaskListItem } from "./TaskListItem";
import type { MemoContentProps } from "./types";

const MemoContent = (props: MemoContentProps) => {
  const { className, contentClassName, content, onClick, onDoubleClick } = props;
  const t = useTranslate();
  const {
    containerRef: memoContentContainerRef,
    mode: showCompactMode,
    toggle: toggleCompactMode,
  } = useCompactMode(Boolean(props.compact));

  const compactLabel = useCompactLabel(showCompactMode, t as (key: string) => string);

  return (
    <div className={`w-full flex flex-col justify-start items-start text-foreground ${className || ""}`}>
      <div
        ref={memoContentContainerRef}
        className={cn(
          "markdown-content relative w-full max-w-full wrap-break-word text-base leading-6",
          showCompactMode === "ALL" && "line-clamp-6 max-h-60",
          contentClassName,
        )}
        onMouseUp={onClick}
        onDoubleClick={onDoubleClick}
      >
        <ReactMarkdown
          remarkPlugins={[remarkDisableSetext, remarkMath, remarkGfm, remarkBreaks, remarkTag, remarkPreserveType]}
          rehypePlugins={[rehypeRaw, rehypeKatex, [rehypeSanitize, SANITIZE_SCHEMA]]}
          components={{
            // Child components consume from MemoViewContext directly
            input: ((inputProps: React.ComponentProps<"input"> & { node?: Element }) => {
              if (inputProps.node && isTaskListItemNode(inputProps.node)) {
                return <TaskListItem {...inputProps} />;
              }
              return <input {...inputProps} />;
            }) as React.ComponentType<React.ComponentProps<"input">>,
            li: ((liProps: React.ComponentProps<"li"> & { node?: Element }) => {
              const { node, className, ...rest } = liProps;
              // Check if this li contains a task list item (checkbox input)
              // We need to check if any child is a task list input
              if (node && node.children) {
                const hasTaskCheckbox = node.children.some(
                  (child) => child.type === "element" && isTaskListItemNode(child as Element),
                );
                if (hasTaskCheckbox) {
                  // Find the checkbox node to get checked state
                  const checkboxNode = node.children.find(
                    (child) => child.type === "element" && isTaskListItemNode(child as Element),
                  ) as Element | undefined;
                  const checked = checkboxNode
                    ? ((checkboxNode.properties as { checked?: boolean })?.checked ?? false)
                    : false;
                  const taskClassName = checked ? "task-list-item task-list-item-checked" : "task-list-item";
                  return <li className={cn(taskClassName, className)} data-task-checked={checked} {...rest} />;
                }
              }
              return <li className={className} {...rest} />;
            }) as React.ComponentType<React.ComponentProps<"li">>,
            span: ((spanProps: React.ComponentProps<"span"> & { node?: Element }) => {
              const { node, ...rest } = spanProps;
              if (node && isTagNode(node)) {
                return <Tag {...spanProps} />;
              }
              return <span {...rest} />;
            }) as React.ComponentType<React.ComponentProps<"span">>,
            div: (divProps: React.ComponentProps<"div">) => {
              // Preserve div with style attributes (for text alignment)
              return <div {...divProps} />;
            },
            pre: CodeBlock,
            a: ({ href, children, ...aProps }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" {...aProps}>
                {children}
              </a>
            ),
            img: ({ src, alt, ...imgProps }) => (
              <OptimizedImage
                src={src || ""}
                alt={alt}
                className="max-w-full h-auto rounded-lg"
                {...imgProps}
              />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      {showCompactMode === "ALL" && (
        <div className="absolute bottom-0 left-0 w-full h-12 bg-linear-to-b from-transparent to-background pointer-events-none"></div>
      )}
      {showCompactMode !== undefined && (
        <div className="w-full mt-1">
          <button
            type="button"
            className="w-auto flex flex-row justify-start items-center cursor-pointer text-sm text-primary hover:opacity-80 text-left"
            onClick={toggleCompactMode}
          >
            {compactLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default memo(MemoContent);
