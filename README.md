# MD → PDF Live Editor

A production-quality desktop application that converts Markdown files into styled HTML previews with real-time split-view editing and PDF export.

Built with **Electron** and a **custom Markdown parser** — no external markdown libraries used.

---

## Features

### Split-Screen Live Editor
- **Left panel** — Raw Markdown editor with line numbers and syntax-aware tab support
- **Right panel** — Live-rendered HTML preview with instant updates (120ms debounce)
- **Line-based scroll sync** — Source-line-aware synchronization that aligns editor and preview content by mapping markdown lines to rendered elements
- **Resizable panels** — Drag the divider to adjust panel widths
- **View mode toggle** — Switch between split view (editor + preview) and preview-only mode

### Custom Markdown Parser
Fully hand-written tokenizer and renderer supporting:
- Headings (`#` through `######`)
- Ordered and unordered lists (with nesting)
- Task lists (`- [ ]` / `- [x]`)
- Tables (with column alignment)
- Fenced code blocks (` ```lang `)
- Inline code, **bold**, *italic*, ~~strikethrough~~
- Links, images, blockquotes, horizontal rules

### Markdown Formatting Toolbar
A full formatting toolbar above the editor with buttons for:
- **Bold**, **Italic**, **Strikethrough**
- **Heading** (cycles H1–H6)
- **Link**, **Image**
- **Inline code**, **Code block**
- **Bullet list**, **Numbered list**, **Task list**
- **Blockquote**, **Horizontal rule**, **Table**

Each button wraps or prefixes the selected text with the appropriate markdown syntax.

### Syntax Highlighting
Regex-based highlighter for fenced code blocks:
- **C++ / C** — keywords, types, STL builtins, comments, strings, preprocessor directives
- **Python** — keywords, builtins, decorators, comments, strings
- **JavaScript / TypeScript** — keywords, DOM/Node builtins, comments, strings
- **Java** — keywords, types, comments, strings
- **Bash / Shell** — keywords, builtins, comments

Colors follow the VS Code Dark+ theme.

### PDF Export
- Uses Electron's headless Chromium `printToPDF` for high-fidelity output
- **Configurable margins** — Set top, bottom, left, right margins (default: 8mm each)
- **Page border** — Optional visible line border around every PDF page
- **Print-friendly code blocks** — Light gray background (`#f6f8fa`) with GitHub-style syntax colors to save ink
- White background with print-optimized colors for text, tables, and code blocks

### Font Selection
Choose from 5 preview/export fonts via the Settings panel:
| Font | Style |
|------|-------|
| System Default | Native OS sans-serif |
| Inter | Modern geometric sans-serif |
| Georgia | Classic serif |
| Merriweather | Readable serif |
| Lato | Clean humanist sans-serif |

### Theme Toggle
Switch between **dark** (default) and **light** themes. Both themes have full styling for all elements including tables, code blocks, and inline code.

### File Operations
- **Open** — Load any `.md`, `.markdown`, or `.txt` file
- **Save / Save As** — Write edited markdown back to disk
- **Auto-load** — Opens `assets/cpp_Interview_Prep.md` on startup

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + O` | Open file |
| `Ctrl/Cmd + S` | Save file |
| `Ctrl/Cmd + P` | Export PDF |
| `Ctrl/Cmd + B` | Bold |
| `Ctrl/Cmd + I` | Italic |
| `Ctrl/Cmd + K` | Insert link |
| `Tab` | Insert 4 spaces |

---

## Project Structure

```
mdToPDFConverter/
├── package.json                     # Project config & dependencies
├── index.html                       # App shell (toolbar, panels, settings)
├── styles.css                       # Full dark/light theme CSS
├── assets/
│   └── cpp_Interview_Prep.md        # Sample input file
├── src/
│   ├── main.js                      # Electron main process & IPC handlers
│   ├── preload.js                   # Context bridge (secure IPC)
│   ├── parser/
│   │   └── markdownParser.js        # Custom tokenizer + HTML generator
│   └── renderer/
│       ├── renderer.js              # UI logic, inline parser, settings
│       └── syntaxHighlighter.js     # Regex-based code highlighter
```

---

## Getting Started

### Prerequisites
- **Node.js** ≥ 18 — [Download here](https://nodejs.org/)
- **npm** ≥ 9 (comes with Node.js)

### Step-by-Step Setup

```bash
# 1. Clone the repository
git clone https://github.com/anishwagle20/mdToPDFConverter.git
cd mdToPDFConverter

# 2. Install dependencies (installs Electron)
npm install

# 3. Launch the application
npm start
```

The app opens with the sample `cpp_Interview_Prep.md` file pre-loaded.

### Development Mode

```bash
# Launch with Chrome DevTools open for debugging
npm run dev
```

### Usage

1. **Edit** — Type or paste Markdown in the left panel; the right panel updates live
2. **Format** — Use the toolbar buttons (or shortcuts) to insert bold, italic, links, lists, code blocks, tables, etc.
3. **View modes** — Toggle between split view and preview-only mode using the view buttons in the top-right toolbar
4. **Open** — Click `Open` (or `Ctrl/Cmd + O`) to load a `.md` file from disk
5. **Save** — Click `Save` (or `Ctrl/Cmd + S`) to write changes back
6. **Settings** — Click `Settings` to configure PDF margins, page border, and font
7. **Export** — Click `Export PDF` (or `Ctrl/Cmd + P`) to generate a styled PDF

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Electron 28+ |
| UI | Vanilla JS + HTML + CSS |
| Parser | Custom (no marked / markdown-it) |
| Highlighting | Regex-based (no highlight.js / Prism) |
| PDF Export | Electron `printToPDF` (Chromium headless) |
| Fonts | Google Fonts (Inter, Merriweather, Lato) |

---

## Security

- **Context isolation** enabled — renderer cannot access Node.js APIs directly
- **Content Security Policy** — restricts scripts to `'self'`, styles to `'self'` + Google Fonts
- **HTML escaping** — all markdown content is escaped before rendering to prevent XSS
- **No `nodeIntegration`** — all file/dialog operations go through the preload bridge