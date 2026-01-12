# Testing the Formatting Toolbar

## Quick Start

### 1. Start the Backend Server

In one terminal, start the Memos backend:

```bash
# From the project root
go run ./cmd/memos --mode dev --port 8081
```

The backend will start on `http://localhost:8081`

### 2. Start the Frontend Dev Server

In another terminal, start the frontend:

```bash
# From the project root
cd web
pnpm install  # Only needed first time or after dependency changes
pnpm dev
```

The frontend will start on `http://localhost:3001` and automatically proxy API requests to the backend.

### 3. Open in Browser

Navigate to `http://localhost:3001` in your browser.

## Testing the Formatting Toolbar

### Visual Testing

1. **Create or Edit a Memo**
   - Click on any memo to edit it, or start typing in the editor to create a new one
   - You should see the formatting toolbar appear above the main toolbar

2. **Test Formatting Buttons**
   - **Bold (⌘B)**: Click the bold button or press `Cmd+B` (Mac) / `Ctrl+B` (Windows/Linux)
   - **Italic (⌘I)**: Click the italic button or press `Cmd+I` / `Ctrl+I`
   - **Strikethrough (⌘⇧X)**: Click the strikethrough button or press `Cmd+Shift+X` / `Ctrl+Shift+X`
   - **Headings (⌘⇧1-3)**: Click H1, H2, or H3 buttons, or use keyboard shortcuts
   - **Lists**: Click bullet or numbered list buttons, or use `Cmd+Shift+8` / `Cmd+Shift+7`
   - **Link (⌘K)**: Click link button or press `Cmd+K` / `Ctrl+K`
   - **Code (⌘⇧`)**: Click code button or press `Cmd+Shift+` ` / `Ctrl+Shift+` `
   - **Quote (⌘⇧>)**: Click quote button or press `Cmd+Shift+>` / `Ctrl+Shift+>`
   - **Horizontal Rule**: Click the minus icon to insert `---`

3. **Test with Selected Text**
   - Select some text in the editor
   - Click a formatting button (e.g., Bold)
   - The selected text should be wrapped with markdown formatting

4. **Test without Selection**
   - Place cursor in the editor
   - Click a formatting button
   - Markdown markers should be inserted at cursor position

5. **Test Keyboard Shortcuts**
   - Type some text
   - Select it and press `Cmd+B` (or `Ctrl+B`)
   - Text should be wrapped in `**bold**` markers
   - Try other shortcuts listed in tooltips

6. **Test Toggle Functionality**
   - Type a line and click H1 button
   - Line should become `# Heading`
   - Click H1 again - heading markers should be removed
   - Same for lists and quotes

### Expected Behavior

✅ **Formatting Toolbar**
- Appears above the main toolbar when editing
- Shows tooltips with keyboard shortcuts on hover
- Buttons are grouped with separators
- Has a clean, modern appearance

✅ **Text Formatting**
- Bold, Italic, Strikethrough wrap selected text
- If no text selected, inserts markers at cursor

✅ **Block Formatting**
- Headings, Lists, Quotes toggle on/off
- Horizontal Rule inserts `---` on new line

✅ **Keyboard Shortcuts**
- All shortcuts work as documented
- Mac: Use `Cmd` key
- Windows/Linux: Use `Ctrl` key

✅ **Visual Improvements**
- Editor has subtle shadow and hover effects
- Textarea has focus ring styling
- Overall cleaner appearance

## Troubleshooting

### Backend not starting?
- Make sure port 8081 is not in use
- Check Go is installed: `go version`
- Try a different port: `go run ./cmd/memos --mode dev --port 8082`
- Update `DEV_PROXY_SERVER` in frontend if using different port

### Frontend not starting?
- Make sure you're in the `web` directory
- Install dependencies: `pnpm install`
- Check Node.js version (should be 18+)
- Check if port 3001 is available

### Formatting toolbar not showing?
- Make sure you're editing a memo (not just viewing)
- Check browser console for errors
- Verify all files were created correctly

### Keyboard shortcuts not working?
- Make sure the editor textarea has focus
- Check if shortcuts conflict with browser shortcuts
- Try clicking in the editor first, then using shortcuts

## Development Tips

- **Hot Reload**: Both frontend and backend support hot reload
- **React DevTools**: Install browser extension for debugging
- **Console Logs**: Check browser console for any errors
- **Network Tab**: Check Network tab to see API requests

## Next Steps

After testing, you can:
- Customize the toolbar appearance
- Add more formatting options
- Adjust keyboard shortcuts
- Improve the styling further

