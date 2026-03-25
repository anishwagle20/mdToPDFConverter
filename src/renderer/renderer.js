/**
 * Renderer process — handles UI logic, markdown parsing + preview.
 * Runs in the browser context with access to electronAPI via preload.
 */

// We bundle parser + highlighter inline since Electron renderer
// can require() when nodeIntegration is off — so we load them manually.
// The preload script only exposes electronAPI. We'll use a different approach:
// load the parser/highlighter source via script tags or inline them.

// Since we can't require() in renderer with contextIsolation, we inline
// the parser and highlighter logic here.

// ============================================================
// INLINE: Markdown Parser
// ============================================================

const TOKEN = {
  HEADING: 'heading',
  PARAGRAPH: 'paragraph',
  UNORDERED_LIST: 'unordered_list',
  ORDERED_LIST: 'ordered_list',
  CODE_BLOCK: 'code_block',
  BLOCKQUOTE: 'blockquote',
  HORIZONTAL_RULE: 'horizontal_rule',
  TABLE: 'table',
  PAGE_BREAK: 'page_break',
};

function tokenize(markdown) {
  const lines = markdown.split('\n');
  const tokens = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*$/.test(line)) { i++; continue; }

    if (/^<!--\s*pagebreak\s*-->\s*$/i.test(line)) {
      tokens.push({ type: TOKEN.PAGE_BREAK, startLine: i });
      i++;
      continue;
    }

    if (/^(\s{0,3})([-*_])\s*\2\s*\2[\s\2]*$/.test(line)) {
      tokens.push({ type: TOKEN.HORIZONTAL_RULE, startLine: i });
      i++;
      continue;
    }

    if (/^```(\w*)/.test(line)) {
      const match = line.match(/^```(\w*)/);
      const lang = match[1] || '';
      const codeStartLine = i;
      const codeLines = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      tokens.push({ type: TOKEN.CODE_BLOCK, lang, content: codeLines.join('\n'), startLine: codeStartLine });
      i++;
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      tokens.push({ type: TOKEN.HEADING, level: headingMatch[1].length, content: headingMatch[2], startLine: i });
      i++;
      continue;
    }

    if (/\|/.test(line) && i + 1 < lines.length && /^\|?\s*[-:]+[-| :]*$/.test(lines[i + 1])) {
      const tableStartLine = i;
      const tableLines = [];
      while (i < lines.length && /\|/.test(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      tokens.push({ type: TOKEN.TABLE, lines: tableLines, startLine: tableStartLine });
      continue;
    }

    if (/^>\s?/.test(line)) {
      const bqStartLine = i;
      const bqLines = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        bqLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      tokens.push({ type: TOKEN.BLOCKQUOTE, content: bqLines.join('\n'), startLine: bqStartLine });
      continue;
    }

    if (/^(\s*)([-*+])\s+/.test(line)) {
      const ulStartLine = i;
      const listItems = [];
      while (i < lines.length && /^(\s*)([-*+])\s+/.test(lines[i])) {
        const m = lines[i].match(/^(\s*)([-*+])\s+(.*)/);
        listItems.push({ indent: m[1].length, content: m[3] });
        i++;
      }
      tokens.push({ type: TOKEN.UNORDERED_LIST, items: listItems, startLine: ulStartLine });
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const olStartLine = i;
      const listItems = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const m = lines[i].match(/^(\s*)\d+\.\s+(.*)/);
        listItems.push({ indent: m[1].length, content: m[2] });
        i++;
      }
      tokens.push({ type: TOKEN.ORDERED_LIST, items: listItems, startLine: olStartLine });
      continue;
    }

    {
      const paraStartLine = i;
      const paraLines = [];
      while (
        i < lines.length &&
        !/^\s*$/.test(lines[i]) &&
        !/^#{1,6}\s/.test(lines[i]) &&
        !/^```/.test(lines[i]) &&
        !/^(\s{0,3})([-*_])\s*\2\s*\2[\s\2]*$/.test(lines[i]) &&
        !/^>\s?/.test(lines[i]) &&
        !/^\s*[-*+]\s+/.test(lines[i]) &&
        !/^\s*\d+\.\s+/.test(lines[i])
      ) {
        if (/\|/.test(lines[i]) && i + 1 < lines.length && /^\|?\s*[-:]+[-| :]*$/.test(lines[i + 1])) break;
        paraLines.push(lines[i]);
        i++;
      }
      if (paraLines.length > 0) {
        tokens.push({ type: TOKEN.PARAGRAPH, content: paraLines.join('\n'), startLine: paraStartLine });
      }
    }
  }
  return tokens;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseInline(text) {
  let result = escapeHtml(text);
  result = result.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />');
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  result = result.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  result = result.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/__(.+?)__/g, '<strong>$1</strong>');
  result = result.replace(/(?<![*\w])\*([^*]+?)\*(?![*\w])/g, '<em>$1</em>');
  result = result.replace(/(?<!\w)_(.+?)_(?!\w)/g, '<em>$1</em>');
  result = result.replace(/~~(.+?)~~/g, '<del>$1</del>');
  return result;
}

function parseTable(tableLines) {
  if (tableLines.length < 2) return '';
  const parseRow = (line) => line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());

  const headers = parseRow(tableLines[0]);
  const separators = parseRow(tableLines[1]);
  const alignments = separators.map(sep => {
    if (/^:-+:$/.test(sep)) return 'center';
    if (/^-+:$/.test(sep)) return 'right';
    return 'left';
  });

  let html = '<div class="table-wrapper"><table class="md-table">\n<thead>\n<tr>\n';
  headers.forEach((h, idx) => {
    const align = alignments[idx] || 'left';
    html += `<th style="text-align:${align}">${parseInline(h)}</th>\n`;
  });
  html += '</tr>\n</thead>\n<tbody>\n';
  for (let r = 2; r < tableLines.length; r++) {
    const cells = parseRow(tableLines[r]);
    html += '<tr>\n';
    cells.forEach((c, idx) => {
      const align = alignments[idx] || 'left';
      html += `<td style="text-align:${align}">${parseInline(c)}</td>\n`;
    });
    html += '</tr>\n';
  }
  html += '</tbody>\n</table></div>\n';
  return html;
}

function buildList(items, tag) {
  let html = `<${tag}>\n`;
  let i = 0;
  while (i < items.length) {
    const item = items[i];
    html += `<li>${parseInline(item.content)}`;
    const nextItems = [];
    let j = i + 1;
    while (j < items.length && items[j].indent > item.indent) {
      nextItems.push({ ...items[j], indent: items[j].indent - item.indent - 2 });
      j++;
    }
    if (nextItems.length > 0) html += '\n' + buildList(nextItems, tag);
    html += '</li>\n';
    i = j;
  }
  html += `</${tag}>\n`;
  return html;
}

// ============================================================
// INLINE: Syntax Highlighter
// ============================================================

function wrapSpan(cls, text) {
  return `<span class="hljs-${cls}">${text}</span>`;
}

const LANG_KEYWORDS = {
  cpp: [
    'auto','break','case','catch','class','const','constexpr','continue','default',
    'delete','do','else','enum','explicit','export','extern','false','for','friend',
    'goto','if','inline','mutable','namespace','new','noexcept','nullptr','operator',
    'override','private','protected','public','register','return','sizeof','static',
    'static_assert','static_cast','dynamic_cast','reinterpret_cast','const_cast',
    'struct','switch','template','this','throw','true','try','typedef','typeid',
    'typename','union','using','virtual','void','volatile','while','final',
  ],
  javascript: [
    'async','await','break','case','catch','class','const','continue','debugger',
    'default','delete','do','else','export','extends','false','finally','for',
    'function','if','import','in','instanceof','let','new','null','of','return',
    'super','switch','this','throw','true','try','typeof','undefined','var','void',
    'while','with','yield',
  ],
  python: [
    'False','None','True','and','as','assert','async','await','break','class',
    'continue','def','del','elif','else','except','finally','for','from','global',
    'if','import','in','is','lambda','nonlocal','not','or','pass','raise','return',
    'try','while','with','yield','self',
  ],
  java: [
    'abstract','assert','boolean','break','byte','case','catch','char','class',
    'const','continue','default','do','double','else','enum','extends','false',
    'final','finally','float','for','goto','if','implements','import','instanceof',
    'int','interface','long','native','new','null','package','private','protected',
    'public','return','short','static','strictfp','super','switch','synchronized',
    'this','throw','throws','transient','true','try','void','volatile','while',
  ],
  bash: [
    'if','then','else','elif','fi','case','esac','for','while','until','do','done',
    'in','function','select','time','echo','exit','return','local','export',
    'readonly','declare','unset','shift','set','source','alias','eval','exec','trap',
    'cd','pwd','test','read','printf',
  ],
};

const LANG_TYPES = {
  cpp: [
    'int','float','double','char','bool','long','short','unsigned','signed',
    'size_t','string','wstring','vector','map','unordered_map','set','unordered_set',
    'list','deque','queue','stack','priority_queue','pair','tuple','array',
    'shared_ptr','unique_ptr','weak_ptr','FILE',
  ],
  java: [
    'int','float','double','char','boolean','long','short','byte','String',
    'Integer','Float','Double','Character','Boolean','Long','Short','Byte',
    'Object','List','Map','Set','ArrayList','HashMap','HashSet',
  ],
  javascript: [
    'Array','Object','String','Number','Boolean','Symbol','BigInt','Map','Set',
    'WeakMap','WeakSet','Promise','Date','RegExp','Error','JSON','Math','console',
    'window','document','process',
  ],
};

const LANG_BUILTINS = {
  cpp: [
    'cout','cin','cerr','endl','make_shared','make_unique','make_pair','make_tuple',
    'sort','find','begin','end','push_back','pop_back','insert','erase','emplace',
    'emplace_back','size','empty','front','back','top','push','pop','swap',
    'reverse','min','max','abs','move','forward','get','stoi','stol','to_string',
    'printf','scanf','fopen','fclose','runtime_error',
  ],
  python: [
    'print','len','range','enumerate','zip','map','filter','sorted','reversed',
    'list','dict','set','tuple','str','int','float','bool','type','isinstance',
    'hasattr','getattr','setattr','super','open','input','format','abs','min','max',
    'sum','any','all','iter','next','round','hex','oct','bin','chr','ord','id','repr',
  ],
  javascript: [
    'log','warn','error','push','pop','shift','unshift','splice','slice','concat',
    'join','split','replace','match','test','indexOf','includes','find','filter',
    'map','reduce','forEach','some','every','keys','values','entries','assign',
    'freeze','parse','stringify','then','catch','finally','resolve','reject',
    'setTimeout','setInterval','clearTimeout','clearInterval','fetch',
    'require','module','exports',
  ],
};

function normalizeLang(lang) {
  const l = (lang || '').toLowerCase().trim();
  const map = {
    'c++': 'cpp', 'cxx': 'cpp', 'cc': 'cpp', 'hpp': 'cpp', 'h': 'cpp',
    'js': 'javascript', 'node': 'javascript', 'ts': 'javascript', 'typescript': 'javascript',
    'py': 'python', 'python3': 'python',
    'sh': 'bash', 'shell': 'bash', 'zsh': 'bash',
    'c': 'cpp',
  };
  return map[l] || l;
}

function highlightCode(code, lang) {
  const escaped = escapeHtml(code);
  const normalizedLang = normalizeLang(lang);

  let result = escaped;
  const placeholders = [];
  let placeholderIdx = 0;

  function addPlaceholder(match, cls) {
    const key = `\x00PH${placeholderIdx++}\x00`;
    placeholders.push({ key, replacement: wrapSpan(cls, match) });
    return key;
  }

  // Multi-line comments
  result = result.replace(/\/\*[\s\S]*?\*\//g, m => addPlaceholder(m, 'comment'));

  // Single-line comments
  if (normalizedLang !== 'python' && normalizedLang !== 'bash') {
    result = result.replace(/\/\/.*$/gm, m => addPlaceholder(m, 'comment'));
  }
  if (normalizedLang === 'python' || normalizedLang === 'bash') {
    result = result.replace(/#.*$/gm, m => addPlaceholder(m, 'comment'));
  }

  // Strings
  if (normalizedLang === 'python') {
    result = result.replace(/(&quot;&quot;&quot;[\s\S]*?&quot;&quot;&quot;|&#39;&#39;&#39;[\s\S]*?&#39;&#39;&#39;)/g,
      m => addPlaceholder(m, 'string'));
  }
  result = result.replace(/&quot;(?:[^&]|&(?!quot;))*?&quot;/g, m => addPlaceholder(m, 'string'));
  result = result.replace(/&#39;(?:[^&]|&(?!#39;))*?&#39;/g, m => addPlaceholder(m, 'string'));

  // Numbers
  result = result.replace(/\b(\d+\.?\d*[fFuUlL]*)\b/g, m => addPlaceholder(m, 'number'));

  // Preprocessor
  if (normalizedLang === 'cpp' || normalizedLang === 'c') {
    result = result.replace(/^(\s*#\w+.*)$/gm, m => addPlaceholder(m, 'meta'));
  }

  // Keywords
  const keywords = LANG_KEYWORDS[normalizedLang] || [];
  if (keywords.length > 0) {
    const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    result = result.replace(kwRegex, m => addPlaceholder(m, 'keyword'));
  }

  // Types
  const types = LANG_TYPES[normalizedLang] || [];
  if (types.length > 0) {
    const typeRegex = new RegExp(`\\b(${types.join('|')})\\b`, 'g');
    result = result.replace(typeRegex, m => addPlaceholder(m, 'built_in'));
  }

  // Builtins
  const builtins = LANG_BUILTINS[normalizedLang] || [];
  if (builtins.length > 0) {
    const builtinRegex = new RegExp(`\\b(${builtins.join('|')})\\b`, 'g');
    result = result.replace(builtinRegex, m => addPlaceholder(m, 'built_in'));
  }

  // Decorators (Python)
  if (normalizedLang === 'python') {
    result = result.replace(/@\w+/g, m => addPlaceholder(m, 'meta'));
  }

  // Restore placeholders
  for (const { key, replacement } of placeholders) {
    result = result.split(key).join(replacement);
  }

  return result;
}

// ============================================================
// Convert tokens → HTML
// ============================================================

function tokensToHtml(tokens) {
  let html = '';
  for (const token of tokens) {
    switch (token.type) {
      case TOKEN.HEADING: {
        const id = token.content.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        html += `<h${token.level} id="${escapeHtml(id)}" data-source-line="${token.startLine}">${parseInline(token.content)}</h${token.level}>\n`;
        break;
      }
      case TOKEN.PARAGRAPH:
        html += `<p data-source-line="${token.startLine}">${parseInline(token.content)}</p>\n`;
        break;
      case TOKEN.HORIZONTAL_RULE:
        html += `<hr data-source-line="${token.startLine}" />\n`;
        break;
      case TOKEN.PAGE_BREAK:
        html += `<div class="page-break" data-source-line="${token.startLine}"><span>Page Break</span></div>\n`;
        break;
      case TOKEN.CODE_BLOCK: {
        const highlighted = highlightCode(token.content, token.lang);
        const langClass = token.lang ? ` language-${escapeHtml(token.lang)}` : '';
        const langLabel = token.lang ? `<span class="code-lang-label">${escapeHtml(token.lang)}</span>` : '';
        html += `<div class="code-block-wrapper" data-source-line="${token.startLine}">${langLabel}<pre><code class="hljs${langClass}">${highlighted}</code></pre></div>\n`;
        break;
      }
      case TOKEN.UNORDERED_LIST:
        html += buildList(token.items, 'ul').replace(/^<ul/, `<ul data-source-line="${token.startLine}"`);
        break;
      case TOKEN.ORDERED_LIST:
        html += buildList(token.items, 'ol').replace(/^<ol/, `<ol data-source-line="${token.startLine}"`);
        break;
      case TOKEN.BLOCKQUOTE:
        html += `<blockquote data-source-line="${token.startLine}">${parseInline(token.content)}</blockquote>\n`;
        break;
      case TOKEN.TABLE:
        html += parseTable(token.lines).replace(/^<div class="table-wrapper"/, `<div class="table-wrapper" data-source-line="${token.startLine}"`);
        break;
    }
  }
  return html;
}

function parseMarkdown(markdown) {
  const tokens = tokenize(markdown);
  return tokensToHtml(tokens);
}

// ============================================================
// UI Logic
// ============================================================

const editor = document.getElementById('md-editor');
const preview = document.getElementById('preview');
const lineNumbers = document.getElementById('line-numbers');
const lineCount = document.getElementById('line-count');
const fileName = document.getElementById('file-name');
const status = document.getElementById('status');
const btnOpen = document.getElementById('btn-open');
const btnSave = document.getElementById('btn-save');
const btnExport = document.getElementById('btn-export');
const btnTheme = document.getElementById('btn-theme');
// Settings controls are inline in the md-toolbar
const resizer = document.getElementById('resizer');
const editorPanel = document.getElementById('editor-panel');

let currentFilePath = null;
let isDirty = false;
let debounceTimer = null;

// ---- Undo / Redo History ----
const undoStack = [];
const redoStack = [];
const MAX_UNDO = 200;
let lastSnapshotTimer = null;

function saveSnapshot() {
  const snap = { text: editor.value, cursor: editor.selectionStart };
  if (undoStack.length > 0 && undoStack[undoStack.length - 1].text === snap.text) return;
  undoStack.push(snap);
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  redoStack.length = 0;
}

function debouncedSnapshot() {
  clearTimeout(lastSnapshotTimer);
  lastSnapshotTimer = setTimeout(saveSnapshot, 400);
}

function performUndo() {
  if (undoStack.length === 0) return;
  redoStack.push({ text: editor.value, cursor: editor.selectionStart });
  const snap = undoStack.pop();
  editor.value = snap.text;
  editor.selectionStart = editor.selectionEnd = snap.cursor;
  isDirty = true;
  updateStatus();
  updatePreview();
}

function performRedo() {
  if (redoStack.length === 0) return;
  undoStack.push({ text: editor.value, cursor: editor.selectionStart });
  const snap = redoStack.pop();
  editor.value = snap.text;
  editor.selectionStart = editor.selectionEnd = snap.cursor;
  isDirty = true;
  updateStatus();
  updatePreview();
}

// ---- Settings state ----
const pdfSettings = {
  marginTop: 8,
  marginBottom: 8,
  marginLeft: 8,
  marginRight: 8,
  pageBorder: false,
  lineSpacing: 1.4,
};
let selectedFont = 'system';

const FONT_MAP = {
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  inter: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
  merriweather: "'Merriweather', Georgia, serif",
  lato: "'Lato', -apple-system, 'Segoe UI', sans-serif",
};

// ---- Rendering ----

function updatePreview() {
  const md = editor.value;
  const html = parseMarkdown(md);
  preview.innerHTML = html;
  updateLineNumbers();
}

function debouncedUpdate() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(updatePreview, 120);
}

function updateLineNumbers() {
  const lines = editor.value.split('\n');
  const count = lines.length;
  lineCount.textContent = `Lines: ${count}`;

  let nums = '';
  for (let i = 1; i <= count; i++) {
    nums += i + '\n';
  }
  lineNumbers.textContent = nums;
}

// ---- Scroll Sync (line-based) ----

let syncingScroll = false;

function getElementTopInPreview(el) {
  return el.getBoundingClientRect().top - preview.getBoundingClientRect().top + preview.scrollTop;
}

function syncEditorToPreview() {
  const lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 20.8;
  const topLine = Math.floor(editor.scrollTop / lineHeight);

  const elements = preview.querySelectorAll('[data-source-line]');
  if (elements.length === 0) {
    const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
    preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
    return;
  }

  let prev = null, next = null;
  for (const el of elements) {
    const line = parseInt(el.dataset.sourceLine, 10);
    if (line <= topLine) {
      prev = { el, line };
    } else {
      next = { el, line };
      break;
    }
  }

  if (!prev) {
    preview.scrollTop = 0;
    return;
  }

  const prevTop = getElementTopInPreview(prev.el);
  if (next) {
    const nextTop = getElementTopInPreview(next.el);
    const fraction = (topLine - prev.line) / (next.line - prev.line);
    preview.scrollTop = prevTop + fraction * (nextTop - prevTop);
  } else {
    preview.scrollTop = prevTop;
  }
}

function syncPreviewToEditor() {
  const elements = preview.querySelectorAll('[data-source-line]');
  if (elements.length === 0) {
    const ratio = preview.scrollTop / (preview.scrollHeight - preview.clientHeight || 1);
    editor.scrollTop = ratio * (editor.scrollHeight - editor.clientHeight);
    return;
  }

  let prev = null, next = null;
  for (const el of elements) {
    const elTop = getElementTopInPreview(el);
    if (elTop <= preview.scrollTop) {
      prev = { el, line: parseInt(el.dataset.sourceLine, 10), top: elTop };
    } else {
      next = { el, line: parseInt(el.dataset.sourceLine, 10), top: elTop };
      break;
    }
  }

  if (!prev) {
    editor.scrollTop = 0;
    return;
  }

  const lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 20.8;
  let targetLine = prev.line;
  if (next) {
    const fraction = (preview.scrollTop - prev.top) / (next.top - prev.top || 1);
    targetLine = prev.line + fraction * (next.line - prev.line);
  }

  editor.scrollTop = targetLine * lineHeight;
}

editor.addEventListener('scroll', () => {
  if (syncingScroll) return;
  syncingScroll = true;
  lineNumbers.scrollTop = editor.scrollTop;
  syncEditorToPreview();
  requestAnimationFrame(() => { syncingScroll = false; });
});

preview.addEventListener('scroll', () => {
  if (syncingScroll) return;
  syncingScroll = true;
  syncPreviewToEditor();
  lineNumbers.scrollTop = editor.scrollTop;
  requestAnimationFrame(() => { syncingScroll = false; });
});

// ---- Editor Events ----

editor.addEventListener('input', () => {
  isDirty = true;
  updateStatus();
  debouncedUpdate();
  debouncedSnapshot();
});

editor.addEventListener('keydown', (e) => {
  // Tab support
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + 4;
    debouncedUpdate();
  }
});

// ---- Status ----

function updateStatus() {
  status.textContent = isDirty ? '● Modified' : '✓ Saved';
}

function setFile(path, content) {
  currentFilePath = path;
  editor.value = content;
  isDirty = false;
  fileName.textContent = path ? path.split('/').pop().split('\\').pop() : 'No file';
  undoStack.length = 0;
  redoStack.length = 0;
  saveSnapshot();
  updateStatus();
  updatePreview();
}

// ---- File Operations ----

btnOpen.addEventListener('click', async () => {
  const result = await window.electronAPI.openFile();
  if (result) setFile(result.filePath, result.content);
});

btnSave.addEventListener('click', async () => {
  const path = await window.electronAPI.saveFile({
    filePath: currentFilePath,
    content: editor.value,
  });
  if (path) {
    currentFilePath = path;
    isDirty = false;
    fileName.textContent = path.split('/').pop().split('\\').pop();
    updateStatus();
    showNotification('File saved');
  }
});

btnExport.addEventListener('click', async () => {
  status.textContent = 'Exporting PDF...';
  const html = preview.innerHTML;
  const path = await window.electronAPI.exportPDF({
    html,
    margins: {
      top: pdfSettings.marginTop,
      bottom: pdfSettings.marginBottom,
      left: pdfSettings.marginLeft,
      right: pdfSettings.marginRight,
    },
    pageBorder: pdfSettings.pageBorder,
    font: FONT_MAP[selectedFont] || FONT_MAP.system,
    lineSpacing: pdfSettings.lineSpacing,
  });
  if (path) {
    showNotification('PDF exported: ' + path.split('/').pop());
  }
  updateStatus();
});

// ---- Theme Toggle ----

let isDarkTheme = true;

btnTheme.addEventListener('click', () => {
  isDarkTheme = !isDarkTheme;
  document.body.classList.toggle('light-theme', !isDarkTheme);
});

// ---- Keyboard Shortcuts ----

document.addEventListener('keydown', (e) => {
  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key === 's') {
    e.preventDefault();
    btnSave.click();
  }
  if (mod && e.key === 'o') {
    e.preventDefault();
    btnOpen.click();
  }
  if (mod && e.key === 'p') {
    e.preventDefault();
    btnExport.click();
  }
  if (mod && e.key === 'b') {
    e.preventDefault();
    applyToolbarAction('bold');
  }
  if (mod && e.key === 'i') {
    e.preventDefault();
    applyToolbarAction('italic');
  }
  if (mod && e.key === 'k') {
    e.preventDefault();
    applyToolbarAction('link');
  }
  if (mod && e.key === 'z' && !e.shiftKey) {
    e.preventDefault();
    performUndo();
  }
  if (mod && e.key === 'z' && e.shiftKey) {
    e.preventDefault();
    performRedo();
  }
});

// ---- Resizer (drag to resize panels) ----

let isResizing = false;

resizer.addEventListener('mousedown', (e) => {
  isResizing = true;
  resizer.classList.add('active');
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', (e) => {
  if (!isResizing) return;
  const containerRect = document.getElementById('editor-container').getBoundingClientRect();
  const newWidth = e.clientX - containerRect.left;
  const pct = (newWidth / containerRect.width) * 100;
  if (pct > 15 && pct < 85) {
    editorPanel.style.width = pct + '%';
    editorPanel.style.flex = 'none';
  }
});

document.addEventListener('mouseup', () => {
  if (isResizing) {
    isResizing = false;
    resizer.classList.remove('active');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
});

// ---- Notification ----

function showNotification(msg) {
  status.textContent = msg;
  setTimeout(updateStatus, 2500);
}

// ---- Receive file from main process ----

window.electronAPI.onFileOpened((data) => {
  setFile(data.filePath, data.content);
});

// ---- Inline Toolbar Settings ----

// Context menus
let activeContextMenu = null;

function showContextMenu(x, y, items) {
  hideContextMenu();
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  items.forEach(item => {
    const btn = document.createElement('button');
    btn.textContent = item.label;
    if (item.shortcut) {
      const sc = document.createElement('span');
      sc.className = 'shortcut';
      sc.textContent = item.shortcut;
      btn.appendChild(sc);
    }
    btn.addEventListener('click', () => { hideContextMenu(); item.action(); });
    menu.appendChild(btn);
  });
  // Position within viewport
  menu.style.left = Math.min(x, window.innerWidth - 160) + 'px';
  menu.style.top = Math.min(y, window.innerHeight - 100) + 'px';
  document.body.appendChild(menu);
  activeContextMenu = menu;
}

function hideContextMenu() {
  if (activeContextMenu) { activeContextMenu.remove(); activeContextMenu = null; }
}

document.addEventListener('click', hideContextMenu);
document.addEventListener('contextmenu', (e) => {
  // Only handle our custom menus, let default pass elsewhere
});

// Editor (left panel) context menu
editor.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const hasSelection = editor.selectionStart !== editor.selectionEnd;
  showContextMenu(e.clientX, e.clientY, [
    { label: 'Cut', shortcut: '⌘X', action: () => { document.execCommand('cut'); } },
    { label: 'Copy', shortcut: '⌘C', action: () => { document.execCommand('copy'); } },
    { label: 'Paste', shortcut: '⌘V', action: () => { editor.focus(); document.execCommand('paste'); } },
  ]);
});

// Preview (right panel) context menu
preview.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const selection = window.getSelection();
  const hasSelection = selection && selection.toString().length > 0;
  const items = [];
  if (hasSelection) {
    items.push({ label: 'Copy', shortcut: '⌘C', action: () => {
      navigator.clipboard.writeText(selection.toString());
    }});
  }
  if (items.length > 0) {
    showContextMenu(e.clientX, e.clientY, items);
  }
});

document.getElementById('font-select').addEventListener('change', (e) => {
  selectedFont = e.target.value;
  applyFont();
});

document.getElementById('page-border').addEventListener('change', (e) => {
  pdfSettings.pageBorder = e.target.checked;
});

['margin-top', 'margin-bottom', 'margin-left', 'margin-right'].forEach(id => {
  document.getElementById(id).addEventListener('change', (e) => {
    const key = 'margin' + id.split('-')[1].charAt(0).toUpperCase() + id.split('-')[1].slice(1);
    pdfSettings[key] = parseInt(e.target.value, 10) || 8;
  });
});

// Line spacing controls
const lsValue = document.getElementById('ls-value');

document.getElementById('ls-decrease').addEventListener('click', () => {
  pdfSettings.lineSpacing = Math.max(1.0, +(pdfSettings.lineSpacing - 0.1).toFixed(1));
  lsValue.textContent = pdfSettings.lineSpacing.toFixed(1);
});

document.getElementById('ls-increase').addEventListener('click', () => {
  pdfSettings.lineSpacing = Math.min(3.0, +(pdfSettings.lineSpacing + 0.1).toFixed(1));
  lsValue.textContent = pdfSettings.lineSpacing.toFixed(1);
});

function applyFont() {
  const fontFamily = FONT_MAP[selectedFont] || FONT_MAP.system;
  preview.style.fontFamily = fontFamily;
}

// ---- Markdown Formatting Toolbar ----

function applyToolbarAction(action) {
  if (action !== 'undo' && action !== 'redo') saveSnapshot();
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const text = editor.value;
  const selected = text.substring(start, end);
  let before = text.substring(0, start);
  let after = text.substring(end);
  let replacement = '';
  let cursorStart, cursorEnd;

  switch (action) {
    case 'bold':
      replacement = `**${selected || 'bold text'}**`;
      cursorStart = start + 2;
      cursorEnd = start + replacement.length - 2;
      break;
    case 'italic':
      replacement = `*${selected || 'italic text'}*`;
      cursorStart = start + 1;
      cursorEnd = start + replacement.length - 1;
      break;
    case 'strikethrough':
      replacement = `~~${selected || 'strikethrough text'}~~`;
      cursorStart = start + 2;
      cursorEnd = start + replacement.length - 2;
      break;
    case 'heading': {
      // Cycle through heading levels or insert H2
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = text.indexOf('\n', start);
      const line = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);
      const headingMatch = line.match(/^(#{1,6})\s/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const newLevel = level >= 6 ? 0 : level + 1;
        const prefix = newLevel > 0 ? '#'.repeat(newLevel) + ' ' : '';
        const lineContent = line.replace(/^#{1,6}\s/, '');
        before = text.substring(0, lineStart);
        after = text.substring(lineEnd === -1 ? text.length : lineEnd);
        replacement = prefix + lineContent;
        cursorStart = lineStart + replacement.length;
        cursorEnd = cursorStart;
      } else {
        const lineContent = line;
        before = text.substring(0, lineStart);
        after = text.substring(lineEnd === -1 ? text.length : lineEnd);
        replacement = '## ' + lineContent;
        cursorStart = lineStart + replacement.length;
        cursorEnd = cursorStart;
      }
      break;
    }
    case 'link':
      if (selected) {
        replacement = `[${selected}](url)`;
        cursorStart = start + selected.length + 3;
        cursorEnd = cursorStart + 3;
      } else {
        replacement = '[link text](url)';
        cursorStart = start + 1;
        cursorEnd = start + 10;
      }
      break;
    case 'image':
      if (selected) {
        replacement = `![${selected}](image-url)`;
        cursorStart = start + selected.length + 4;
        cursorEnd = cursorStart + 9;
      } else {
        replacement = '![alt text](image-url)';
        cursorStart = start + 2;
        cursorEnd = start + 10;
      }
      break;
    case 'code':
      replacement = `\`${selected || 'code'}\``;
      cursorStart = start + 1;
      cursorEnd = start + replacement.length - 1;
      break;
    case 'codeblock':
      replacement = `\n\`\`\`\n${selected || 'code here'}\n\`\`\`\n`;
      cursorStart = start + 5;
      cursorEnd = start + replacement.length - 5;
      break;
    case 'ul': {
      const lines = (selected || 'Item').split('\n');
      replacement = lines.map(l => `- ${l}`).join('\n');
      cursorStart = start;
      cursorEnd = start + replacement.length;
      break;
    }
    case 'ol': {
      const lines = (selected || 'Item').split('\n');
      replacement = lines.map((l, i) => `${i + 1}. ${l}`).join('\n');
      cursorStart = start;
      cursorEnd = start + replacement.length;
      break;
    }
    case 'tasklist': {
      const lines = (selected || 'Task').split('\n');
      replacement = lines.map(l => `- [ ] ${l}`).join('\n');
      cursorStart = start;
      cursorEnd = start + replacement.length;
      break;
    }
    case 'blockquote': {
      const lines = (selected || 'quote').split('\n');
      replacement = lines.map(l => `> ${l}`).join('\n');
      cursorStart = start;
      cursorEnd = start + replacement.length;
      break;
    }
    case 'hr':
      replacement = '\n---\n';
      cursorStart = start + replacement.length;
      cursorEnd = cursorStart;
      break;
    case 'table':
      replacement = '\n| Header 1 | Header 2 | Header 3 |\n| --- | --- | --- |\n| Cell 1 | Cell 2 | Cell 3 |\n';
      cursorStart = start + replacement.length;
      cursorEnd = cursorStart;
      break;
    case 'pagebreak':
      replacement = '\n<!-- pagebreak -->\n';
      cursorStart = start + replacement.length;
      cursorEnd = cursorStart;
      break;
    case 'cut':
      document.execCommand('cut');
      return;
    case 'copy':
      document.execCommand('copy');
      return;
    case 'paste':
      editor.focus();
      document.execCommand('paste');
      return;
    case 'undo':
      performUndo();
      return;
    case 'redo':
      performRedo();
      return;
    default:
      return;
  }

  editor.value = before + replacement + after;
  editor.selectionStart = cursorStart;
  editor.selectionEnd = cursorEnd;
  editor.focus();
  isDirty = true;
  updateStatus();
  debouncedUpdate();
  saveSnapshot();
}

document.getElementById('md-toolbar').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  applyToolbarAction(btn.dataset.action);
});

// ---- View Mode Toggle ----

const btnSplit = document.getElementById('btn-split');
const btnPreviewOnly = document.getElementById('btn-preview-only');

btnSplit.addEventListener('click', () => {
  document.body.classList.remove('preview-only');
  btnSplit.classList.add('active');
  btnPreviewOnly.classList.remove('active');
});

btnPreviewOnly.addEventListener('click', () => {
  document.body.classList.add('preview-only');
  btnPreviewOnly.classList.add('active');
  btnSplit.classList.remove('active');
});

// ---- Initialize ----

updateLineNumbers();
applyFont();
