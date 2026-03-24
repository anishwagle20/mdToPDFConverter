const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'MD → PDF Live Editor',
    backgroundColor: '#1e1e1e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

  // Open DevTools in dev mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools({ mode: 'bottom' });
  }

  // Load the default markdown file on ready
  mainWindow.webContents.on('did-finish-load', () => {
    const defaultFile = path.join(__dirname, '..', 'assets', 'cpp_Interview_Prep.md');
    if (fs.existsSync(defaultFile)) {
      const content = fs.readFileSync(defaultFile, 'utf-8');
      mainWindow.webContents.send('file-opened', { filePath: defaultFile, content });
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC Handlers

ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  const content = fs.readFileSync(filePath, 'utf-8');
  return { filePath, content };
});

ipcMain.handle('save-file', async (_event, { filePath, content }) => {
  if (filePath) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
  }
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'Markdown', extensions: ['md'] }],
  });
  if (result.canceled) return null;
  fs.writeFileSync(result.filePath, content, 'utf-8');
  return result.filePath;
});

ipcMain.handle('save-file-as', async (_event, { content }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'Markdown', extensions: ['md'] }],
  });
  if (result.canceled) return null;
  fs.writeFileSync(result.filePath, content, 'utf-8');
  return result.filePath;
});

ipcMain.handle('export-pdf', async (_event, { html, margins, pageBorder, font, lineSpacing }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
    defaultPath: 'output.pdf',
  });
  if (result.canceled) return null;

  const pdfMargins = margins || { top: 8, bottom: 8, left: 8, right: 8 };
  const enableBorder = pageBorder || false;
  const fontFamily = font || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
  const ls = lineSpacing || 1.4;

  // Create a hidden window for PDF generation to preserve styling
  const pdfWindow = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
    },
  });

  // Load the styled HTML for PDF rendering
  const cssPath = path.join(__dirname, '..', 'styles.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  const borderCSS = enableBorder
    ? `.pdf-border-wrap { border: 1.5px solid #333; padding: 8mm; min-height: 100vh; box-decoration-break: clone; -webkit-box-decoration-break: clone; }`
    : '.pdf-border-wrap { }';

  const contentWrap = enableBorder ? 'pdf-border-wrap' : '';

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
${cssContent}
/* PDF-specific overrides */
body { background: #fff !important; color: #1a1a1a !important; padding: 0; margin: 0; font-family: ${fontFamily}; }
.preview-content { max-width: 100%; padding: 20px; font-family: ${fontFamily}; line-height: ${ls}; }
.preview-content p, .preview-content li { line-height: ${ls}; }
.preview-content h1, .preview-content h2, .preview-content h3, .preview-content h4, .preview-content h5, .preview-content h6 { line-height: ${Math.max(1.2, ls - 0.2)}; }
h1, h2, h3, h4, h5, h6 { color: #1a1a1a !important; }
p, li, td, th { color: #333 !important; }
hr { border-color: #ccc !important; }
.md-table { border-color: #999 !important; }
.md-table th { background: #e8e8e8 !important; color: #1a1a1a !important; border-color: #999 !important; }
.md-table td { border-color: #999 !important; color: #333 !important; }
.md-table tbody tr:nth-child(even) { background: #f5f5f5 !important; }
.code-block-wrapper { border: 1px solid #ccc !important; border-radius: 6px !important; background: #f6f8fa !important; }
.code-lang-label { color: #555 !important; background: rgba(0,0,0,0.06) !important; }
pre { background: #f6f8fa !important; }
code.hljs { color: #1a1a1a !important; }
.hljs-keyword { color: #0550ae !important; font-weight: bold; }
.hljs-built_in { color: #6639ba !important; }
.hljs-string { color: #0a3069 !important; }
.hljs-comment { color: #6e7781 !important; font-style: italic; }
.hljs-number { color: #0550ae !important; }
.hljs-meta { color: #8250df !important; }
blockquote { border-left-color: #999 !important; color: #555 !important; }
.inline-code { background: #eff1f3 !important; color: #c7254e !important; border-color: #d0d0d0 !important; }
a { color: #0366d6 !important; }
strong { color: #111 !important; }
.page-break { page-break-before: always; border: none !important; margin: 0 !important; padding: 0 !important; height: 0 !important; overflow: hidden !important; }
.page-break span { display: none !important; }
${borderCSS}
</style>
</head>
<body>
<div class="${contentWrap}"><div class="preview-content">${html}</div></div>
</body>
</html>`;

  await pdfWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(fullHtml));

  // Wait a moment for rendering
  await new Promise((resolve) => setTimeout(resolve, 500));

  const pdfData = await pdfWindow.webContents.printToPDF({
    printBackground: true,
    preferCSSPageSize: false,
    margins: {
      marginType: 'custom',
      top: pdfMargins.top / 25.4,
      bottom: pdfMargins.bottom / 25.4,
      left: pdfMargins.left / 25.4,
      right: pdfMargins.right / 25.4,
    },
  });

  fs.writeFileSync(result.filePath, pdfData);
  pdfWindow.close();
  return result.filePath;
});
