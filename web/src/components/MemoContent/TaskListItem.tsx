import type { Element } from "hast";
import { useEffect, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useUpdateMemo } from "@/hooks/useMemoQueries";
import { toggleTaskAtIndex } from "@/utils/markdown-manipulation";
import { useMemoViewContext, useMemoViewDerived } from "../MemoView/MemoViewContext";

interface TaskListItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  node?: Element; // AST node from react-markdown
  checked?: boolean;
}

export const TaskListItem: React.FC<TaskListItemProps> = ({ checked, ...props }) => {
  const { memo } = useMemoViewContext();
  const { readonly } = useMemoViewDerived();
  const checkboxRef = useRef<HTMLButtonElement>(null);
  const { mutate: updateMemo } = useUpdateMemo();

  // Sync the class on the parent li element when checked state changes
  useEffect(() => {
    // Use a small timeout to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      // Try multiple selectors to find the parent li
      const listItem =
        checkboxRef.current?.closest("li.task-list-item") ||
        checkboxRef.current?.closest("li") ||
        checkboxRef.current?.parentElement?.closest("li");
      
      if (listItem) {
        // Ensure it has the task-list-item class
        if (!listItem.classList.contains("task-list-item")) {
          listItem.classList.add("task-list-item");
        }
        
        if (checked) {
          listItem.classList.add("task-list-item-checked");
          listItem.setAttribute("data-task-checked", "true");
          // Also apply styles directly as fallback
          const paragraphs = listItem.querySelectorAll("p");
          paragraphs.forEach((p) => {
            (p as HTMLElement).style.textDecoration = "line-through";
            (p as HTMLElement).style.opacity = "0.7";
            (p as HTMLElement).style.color = "var(--muted-foreground)";
          });
        } else {
          listItem.classList.remove("task-list-item-checked");
          listItem.setAttribute("data-task-checked", "false");
          // Remove inline styles
          const paragraphs = listItem.querySelectorAll("p");
          paragraphs.forEach((p) => {
            (p as HTMLElement).style.textDecoration = "";
            (p as HTMLElement).style.opacity = "";
            (p as HTMLElement).style.color = "";
          });
        }
      }
    }, 10);
    return () => clearTimeout(timeoutId);
  }, [checked]);

  const handleChange = async (newChecked: boolean) => {
    // Don't update if readonly or no memo
    if (readonly || !memo) {
      return;
    }

    // Find the task index by walking up the DOM
    const listItem = checkboxRef.current?.closest("li.task-list-item");
    if (!listItem) {
      return;
    }

    // Update the class on the list item immediately for visual feedback
    if (newChecked) {
      listItem.classList.add("task-list-item-checked");
      listItem.setAttribute("data-task-checked", "true");
      // Apply inline styles immediately
      const paragraphs = listItem.querySelectorAll("p");
      paragraphs.forEach((p) => {
        (p as HTMLElement).style.textDecoration = "line-through";
        (p as HTMLElement).style.opacity = "0.7";
        (p as HTMLElement).style.color = "var(--muted-foreground)";
      });
    } else {
      listItem.classList.remove("task-list-item-checked");
      listItem.setAttribute("data-task-checked", "false");
      // Remove inline styles
      const paragraphs = listItem.querySelectorAll("p");
      paragraphs.forEach((p) => {
        (p as HTMLElement).style.textDecoration = "";
        (p as HTMLElement).style.opacity = "";
        (p as HTMLElement).style.color = "";
      });
    }

    // Get task index from data attribute, or calculate by counting
    const taskIndexStr = listItem.getAttribute("data-task-index");
    let taskIndex = 0;

    if (taskIndexStr !== null) {
      taskIndex = parseInt(taskIndexStr);
    } else {
      // Fallback: Calculate index by counting ALL task list items in the memo
      // Find the markdown-content container by traversing up from the list item
      const container = listItem.closest(".markdown-content");
      if (!container) {
        return;
      }

      const allTaskItems = container.querySelectorAll("li.task-list-item");
      for (let i = 0; i < allTaskItems.length; i++) {
        if (allTaskItems[i] === listItem) {
          taskIndex = i;
          break;
        }
      }
    }

    // Update memo content using the string manipulation utility
    const newContent = toggleTaskAtIndex(memo.content, taskIndex, newChecked);
    updateMemo({
      update: {
        name: memo.name,
        content: newContent,
      },
      updateMask: ["content"],
    });
  };

  // Override the disabled prop from remark-gfm (which defaults to true)
  return <Checkbox ref={checkboxRef} checked={checked} disabled={readonly} onCheckedChange={handleChange} className={props.className} />;
};
