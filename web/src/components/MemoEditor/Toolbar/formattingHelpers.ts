import type { EditorRefActions } from "../Editor";

/**
 * Helper functions for inserting markdown formatting into the editor
 */
export const formatMarkdown = {
  /**
   * Wrap selected text with bold markers, or insert bold markers if no selection
   */
  bold: (editor: EditorRefActions) => {
    const selected = editor.getSelectedContent();
    if (selected) {
      editor.insertText(selected, "**", "**");
    } else {
      editor.insertText("", "**", "**");
      // Move cursor back one position to be between the markers
      const pos = editor.getCursorPosition();
      editor.setCursorPosition(pos - 2);
    }
  },

  /**
   * Wrap selected text with italic markers, or insert italic markers if no selection
   */
  italic: (editor: EditorRefActions) => {
    const selected = editor.getSelectedContent();
    if (selected) {
      editor.insertText(selected, "*", "*");
    } else {
      editor.insertText("", "*", "*");
      const pos = editor.getCursorPosition();
      editor.setCursorPosition(pos - 1);
    }
  },

  /**
   * Wrap selected text with strikethrough markers
   */
  strikethrough: (editor: EditorRefActions) => {
    const selected = editor.getSelectedContent();
    if (selected) {
      editor.insertText(selected, "~~", "~~");
    } else {
      editor.insertText("", "~~", "~~");
      const pos = editor.getCursorPosition();
      editor.setCursorPosition(pos - 2);
    }
  },

  /**
   * Insert heading markers at the start of the current line
   */
  heading: (editor: EditorRefActions, level: 1 | 2 | 3) => {
    const editorEl = editor.getEditor();
    if (!editorEl) return;

    const cursorPos = editor.getCursorPosition();
    const content = editor.getContent();
    const lines = content.split("\n");
    const currentLineNum = editor.getCursorLineNumber();
    const currentLine = lines[currentLineNum] || "";

    // Check if line already starts with heading markers
    const headingMatch = currentLine.match(/^(#{1,6})\s*/);
    if (headingMatch) {
      // Replace existing heading with new level
      const existingLevel = headingMatch[1].length;
      if (existingLevel === level) {
        // Remove heading if same level
        lines[currentLineNum] = currentLine.replace(/^#{1,6}\s*/, "");
      } else {
        // Change to new level
        lines[currentLineNum] = currentLine.replace(/^#{1,6}\s*/, "#".repeat(level) + " ");
      }
    } else {
      // Add heading markers
      lines[currentLineNum] = "#".repeat(level) + " " + currentLine;
    }

    editor.setContent(lines.join("\n"));

    // Restore cursor position (adjusted for heading markers)
    const newContent = editor.getContent();
    const newLines = newContent.split("\n");
    let newPos = 0;
    for (let i = 0; i < currentLineNum; i++) {
      newPos += newLines[i].length + 1; // +1 for newline
    }
    newPos += newLines[currentLineNum].length;
    editor.setCursorPosition(Math.min(newPos, newContent.length));
  },

  /**
   * Insert or toggle bullet list marker at the start of the current line
   */
  bulletList: (editor: EditorRefActions) => {
    const editorEl = editor.getEditor();
    if (!editorEl) return;

    const cursorPos = editor.getCursorPosition();
    const content = editor.getContent();
    const lines = content.split("\n");
    const currentLineNum = editor.getCursorLineNumber();
    const currentLine = lines[currentLineNum] || "";

    // Check if line already starts with bullet marker
    if (currentLine.match(/^[-*+]\s/)) {
      // Remove bullet marker
      lines[currentLineNum] = currentLine.replace(/^[-*+]\s+/, "");
    } else {
      // Add bullet marker
      lines[currentLineNum] = "- " + currentLine.trimStart();
    }

    editor.setContent(lines.join("\n"));

    // Restore cursor position
    const newContent = editor.getContent();
    const newLines = newContent.split("\n");
    let newPos = 0;
    for (let i = 0; i < currentLineNum; i++) {
      newPos += newLines[i].length + 1;
    }
    newPos += newLines[currentLineNum].length;
    editor.setCursorPosition(Math.min(newPos, newContent.length));
  },

  /**
   * Insert or toggle numbered list marker at the start of the current line
   */
  numberedList: (editor: EditorRefActions) => {
    const editorEl = editor.getEditor();
    if (!editorEl) return;

    const cursorPos = editor.getCursorPosition();
    const content = editor.getContent();
    const lines = content.split("\n");
    const currentLineNum = editor.getCursorLineNumber();
    const currentLine = lines[currentLineNum] || "";

    // Check if line already starts with numbered list marker
    if (currentLine.match(/^\d+\.\s/)) {
      // Remove numbered list marker
      lines[currentLineNum] = currentLine.replace(/^\d+\.\s+/, "");
    } else {
      // Add numbered list marker
      lines[currentLineNum] = "1. " + currentLine.trimStart();
    }

    editor.setContent(lines.join("\n"));

    // Restore cursor position
    const newContent = editor.getContent();
    const newLines = newContent.split("\n");
    let newPos = 0;
    for (let i = 0; i < currentLineNum; i++) {
      newPos += newLines[i].length + 1;
    }
    newPos += newLines[currentLineNum].length;
    editor.setCursorPosition(Math.min(newPos, newContent.length));
  },

  /**
   * Insert link markdown syntax
   */
  link: (editor: EditorRefActions) => {
    const selected = editor.getSelectedContent();
    if (selected) {
      // If text is selected, wrap it in link syntax
      editor.insertText(selected, "[", "](url)");
      // Move cursor to URL position
      const pos = editor.getCursorPosition();
      editor.setCursorPosition(pos - 4);
    } else {
      // Insert link template
      editor.insertText("", "[text](url)", "");
      // Move cursor to "text" position
      const pos = editor.getCursorPosition();
      editor.setCursorPosition(pos - 7);
    }
  },

  /**
   * Wrap selected text with inline code markers, or insert code block if no selection
   */
  code: (editor: EditorRefActions) => {
    const selected = editor.getSelectedContent();
    if (selected) {
      // Wrap selection with inline code
      editor.insertText(selected, "`", "`");
    } else {
      // Check if we're on a line that could be a code block
      const editorEl = editor.getEditor();
      if (!editorEl) return;

      const currentLine = editor.getLine(editor.getCursorLineNumber());
      const isCodeBlock = currentLine.trim().startsWith("```");

      if (isCodeBlock) {
        // Close code block
        editor.insertText("\n```", "", "");
      } else {
        // Insert code block
        editor.insertText("```\n\n```", "", "");
        // Move cursor to middle of code block
        const pos = editor.getCursorPosition();
        editor.setCursorPosition(pos - 4);
      }
    }
  },

  /**
   * Insert or toggle blockquote marker at the start of the current line
   */
  quote: (editor: EditorRefActions) => {
    const editorEl = editor.getEditor();
    if (!editorEl) return;

    const cursorPos = editor.getCursorPosition();
    const content = editor.getContent();
    const lines = content.split("\n");
    const currentLineNum = editor.getCursorLineNumber();
    const currentLine = lines[currentLineNum] || "";

    // Check if line already starts with quote marker
    if (currentLine.match(/^>\s/)) {
      // Remove quote marker
      lines[currentLineNum] = currentLine.replace(/^>\s+/, "");
    } else {
      // Add quote marker
      lines[currentLineNum] = "> " + currentLine.trimStart();
    }

    editor.setContent(lines.join("\n"));

    // Restore cursor position
    const newContent = editor.getContent();
    const newLines = newContent.split("\n");
    let newPos = 0;
    for (let i = 0; i < currentLineNum; i++) {
      newPos += newLines[i].length + 1;
    }
    newPos += newLines[currentLineNum].length;
    editor.setCursorPosition(Math.min(newPos, newContent.length));
  },

  /**
   * Insert horizontal rule
   */
  horizontalRule: (editor: EditorRefActions) => {
    const editorEl = editor.getEditor();
    if (!editorEl) return;

    const cursorPos = editor.getCursorPosition();
    const content = editor.getContent();
    const lines = content.split("\n");
    const currentLineNum = editor.getCursorLineNumber();
    const currentLine = lines[currentLineNum] || "";

    // If current line is empty, replace it with horizontal rule
    // Otherwise, insert horizontal rule on new line
    if (currentLine.trim() === "") {
      lines[currentLineNum] = "---";
    } else {
      lines.splice(currentLineNum + 1, 0, "---");
    }

    editor.setContent(lines.join("\n"));

    // Move cursor to after the horizontal rule
    const newContent = editor.getContent();
    const newLines = newContent.split("\n");
    let newPos = 0;
    for (let i = 0; i <= currentLineNum; i++) {
      newPos += newLines[i].length + 1;
    }
    editor.setCursorPosition(newPos);
  },

  /**
   * Insert a table with specified dimensions
   */
  table: (editor: EditorRefActions, rows: number = 3, cols: number = 3) => {
    const editorEl = editor.getEditor();
    if (!editorEl) return;

    const content = editor.getContent();
    const lines = content.split("\n");
    const currentLineNum = editor.getCursorLineNumber();
    const currentLine = lines[currentLineNum] || "";

    // Build table markdown
    const tableLines: string[] = [];

    // Header row
    const headerCells = Array(cols).fill("Header");
    tableLines.push("| " + headerCells.join(" | ") + " |");

    // Separator row
    const separatorCells = Array(cols).fill("------");
    tableLines.push("| " + separatorCells.join(" | ") + " |");

    // Data rows (rows includes header, so rows-1 data rows)
    for (let i = 0; i < rows - 1; i++) {
      const dataCells = Array(cols).fill("Cell");
      tableLines.push("| " + dataCells.join(" | ") + " |");
    }

    // Insert table
    let insertLine = currentLineNum;
    if (currentLine.trim() !== "") {
      // If current line has content, insert table on new line
      lines.splice(currentLineNum + 1, 0, "", ...tableLines);
      insertLine = currentLineNum + 1;
    } else {
      // If current line is empty, replace it with table
      lines[currentLineNum] = tableLines.join("\n");
      insertLine = currentLineNum;
    }

    editor.setContent(lines.join("\n"));

    // Move cursor to first header cell (after "| ")
    const newContent = editor.getContent();
    const newLines = newContent.split("\n");
    let newPos = 0;
    for (let i = 0; i < insertLine; i++) {
      newPos += newLines[i].length + 1; // +1 for newline
    }
    newPos += 2; // Position after "| "
    editor.setCursorPosition(newPos);
    editor.focus();
  },

  /**
   * Align selected text or current line/paragraph
   */
  align: (editor: EditorRefActions, alignment: "left" | "center" | "right" | "justify") => {
    const editorEl = editor.getEditor();
    if (!editorEl) return;

    const selected = editor.getSelectedContent();
    const content = editor.getContent();
    const startPos = editorEl.selectionStart;
    const endPos = editorEl.selectionEnd;

    if (selected && selected.trim().length > 0) {
      // Wrap selected text in alignment div
      const alignedText = `<div style="text-align: ${alignment}">\n${selected}\n</div>`;
      const before = content.slice(0, startPos);
      const after = content.slice(endPos);
      const newContent = before + alignedText + after;
      editor.setContent(newContent);
      // Move cursor to end of aligned content
      const newPos = startPos + alignedText.length;
      editor.setCursorPosition(newPos);
    } else {
      // Get current line/paragraph
      const lines = content.split("\n");
      const currentLineNum = editor.getCursorLineNumber();
      const currentLine = lines[currentLineNum] || "";

      // Find paragraph boundaries (empty lines or start/end)
      let paraStart = currentLineNum;
      let paraEnd = currentLineNum;

      // Find start of paragraph
      while (paraStart > 0 && lines[paraStart - 1].trim() !== "") {
        paraStart--;
      }

      // Find end of paragraph
      while (paraEnd < lines.length - 1 && lines[paraEnd + 1].trim() !== "") {
        paraEnd++;
      }

      // Get paragraph content
      const paragraphLines = lines.slice(paraStart, paraEnd + 1);
      const paragraphText = paragraphLines.join("\n");

      // Check if already wrapped in alignment div (more flexible regex)
      const alignmentDivRegex = /<div\s+style=["']text-align:\s*(left|center|right|justify)["']>[\s\n]*([\s\S]*?)[\s\n]*<\/div>/;
      const match = paragraphText.match(alignmentDivRegex);

      if (match) {
        // Replace existing alignment
        const innerContent = match[2];
        const newAlignedText = `<div style="text-align: ${alignment}">\n${innerContent}\n</div>`;
        lines.splice(paraStart, paraEnd - paraStart + 1, newAlignedText);
      } else {
        // Wrap paragraph in alignment div
        const newAlignedText = `<div style="text-align: ${alignment}">\n${paragraphText}\n</div>`;
        lines.splice(paraStart, paraEnd - paraStart + 1, newAlignedText);
      }

      editor.setContent(lines.join("\n"));

      // Restore cursor position
      const newContent = editor.getContent();
      const newLines = newContent.split("\n");
      let newPos = 0;
      for (let i = 0; i < paraStart; i++) {
        newPos += newLines[i].length + 1;
      }
      // Position cursor inside the div, after the opening tag
      newPos += `<div style="text-align: ${alignment}">\n`.length;
      editor.setCursorPosition(newPos);
    }
    editor.focus();
  },

  /**
   * Insert or toggle task list marker at the start of the current line
   */
  taskList: (editor: EditorRefActions) => {
    const editorEl = editor.getEditor();
    if (!editorEl) return;

    const cursorPos = editor.getCursorPosition();
    const content = editor.getContent();
    const lines = content.split("\n");
    const currentLineNum = editor.getCursorLineNumber();
    const currentLine = lines[currentLineNum] || "";

    // Check if line already starts with task list marker
    const taskMatch = currentLine.match(/^(\s*)([-*+])\s+\[([ xX])\]\s*(.*)$/);
    if (taskMatch) {
      // Remove task list marker
      lines[currentLineNum] = taskMatch[1] + taskMatch[4];
    } else {
      // Check if line starts with bullet marker (convert to task)
      const bulletMatch = currentLine.match(/^(\s*)([-*+])\s+(.*)$/);
      if (bulletMatch) {
        // Convert bullet to task
        lines[currentLineNum] = bulletMatch[1] + bulletMatch[2] + " [ ] " + bulletMatch[3];
      } else {
        // Add task list marker
        const indentMatch = currentLine.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1] : "";
        lines[currentLineNum] = indent + "- [ ] " + currentLine.trimStart();
      }
    }

    editor.setContent(lines.join("\n"));

    // Restore cursor position
    const newContent = editor.getContent();
    const newLines = newContent.split("\n");
    let newPos = 0;
    for (let i = 0; i < currentLineNum; i++) {
      newPos += newLines[i].length + 1;
    }
    newPos += newLines[currentLineNum].length;
    editor.setCursorPosition(Math.min(newPos, newContent.length));
  },

  /**
   * Wrap selected text with underline markers (using HTML <u> tag)
   */
  underline: (editor: EditorRefActions) => {
    const selected = editor.getSelectedContent();
    if (selected) {
      editor.insertText(selected, "<u>", "</u>");
    } else {
      editor.insertText("", "<u>", "</u>");
      const pos = editor.getCursorPosition();
      editor.setCursorPosition(pos - 4);
    }
  },

  /**
   * Wrap selected text with highlight markers (using HTML <mark> tag with color)
   */
  highlight: (editor: EditorRefActions, color?: string) => {
    const selected = editor.getSelectedContent();
    const colorStyle = color ? ` style="background-color: ${color};"` : "";
    if (selected) {
      editor.insertText(selected, `<mark${colorStyle}>`, "</mark>");
    } else {
      editor.insertText("", `<mark${colorStyle}>`, "</mark>");
      const pos = editor.getCursorPosition();
      editor.setCursorPosition(pos - (7 + (colorStyle.length || 0)));
    }
  },

  /**
   * Insert current date and/or time
   */
  insertDateTime: (editor: EditorRefActions, format: "date" | "time" | "datetime" = "datetime") => {
    const editorEl = editor.getEditor();
    if (!editorEl) return;

    const now = new Date();
    let dateTimeString = "";

    switch (format) {
      case "date":
        dateTimeString = now.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        break;
      case "time":
        dateTimeString = now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
        break;
      case "datetime":
      default:
        dateTimeString = now.toLocaleString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        break;
    }

    editor.insertText(dateTimeString, "", "");
    editor.focus();
  },
};

