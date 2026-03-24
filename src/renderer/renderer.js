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
};

function tokenize(markdown) {
  const lines = markdown.split('\n');
  const tokens = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*$/.test(line)) { i++; continue; }

    if (/^(\s{0,3})([-*_])\s*\2\s*\2[\s\2]*$/.test(line)) {
      tokens.push({ type: TOKEN.HORIZONTAL_RULE });
      i++;
      continue;
    }

    if (/^```(\w*)/.test(line)) {
      const match = line.match(/^```(\w*)/);
      const lang = match[1] || '';
      const codeLines = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      tokens.push({ type: TOKEN.CODE_BLOCK, lang, content: codeLines.join('\n') });
      i++;
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      tokens.push({ type: TOKEN.HEADING, level: headingMatch[1].length, content: headingMatch[2] });
      i++;
      continue;
    }

    if (/\|/.test(line) && i + 1 < lines.length && /^\|?\s*[-:]+[-| :]*$/.test(lines[i + 1])) {
      const tableLines = [];
      while (i < lines.length && /\|/.test(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      tokens.push({ type: TOKEN.TABLE, lines: tableLines });
      continue;
    }

    if (/^>\s?/.test(line)) {
      const bqLines = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        bqLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      tokens.push({ type: TOKEN.BLOCKQUOTE, content: bqLines.join('\n') });
      continue;
    }

    if (/^(\s*)([-*+])\s+/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^(\s*)([-*+])\s+/.test(lines[i])) {
        const m = lines[i].match(/^(\s*)([-*+])\s+(.*)/);
        listItems.push({ indent: m[1].length, content: m[3] });
        i++;
      }
      tokens.push({ type: TOKEN.UNORDERED_LIST, items: listItems });
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const m = lines[i].match(/^(\s*)\d+\.\s+(.*)/);
        listItems.push({ indent: m[1].length, content: m[2] });
        i++;
      }
      tokens.push({ type: TOKEN.ORDERED_LIST, items: listItems });
      continue;
    }

    {
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
        tokens.push({ type: TOKEN.PARAGRAPH, content: paraLines.join('\n') });
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
  result = result.replace(/\b(\d+\.?\d*[fFuUlL]*)\b/g, m => wrapSpan('number', m));

  // Preprocessor
  if (normalizedLang === 'cpp' || normalizedLang === 'c') {
    result = result.replace(/^(\s*#\w+.*)$/gm, m => wrapSpan('meta', m));
  }

  // Keywords
  const keywords = LANG_KEYWORDS[normalizedLang] || [];
  if (keywords.length > 0) {
    const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    result = result.replace(kwRegex, m => wrapSpan('keyword', m));
  }

  // Types
  const types = LANG_TYPES[normalizedLang] || [];
  if (types.length > 0) {
    const typeRegex = new RegExp(`\\b(${types.join('|')})\\b`, 'g');
    result = result.replace(typeRegex, m => wrapSpan('built_in', m));
  }

  // Builtins
  const builtins = LANG_BUILTINS[normalizedLang] || [];
  if (builtins.length > 0) {
    const builtinRegex = new RegExp(`\\b(${builtins.join('|')})\\b`, 'g');
    result = result.replace(builtinRegex, m => wrapSpan('built_in', m));
  }

  // Decorators (Python)
  if (normalizedLang === 'python') {
    result = result.replace(/@\w+/g, m => wrapSpan('meta', m));
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
        html += `<h${token.level} id="${escapeHtml(id)}">${parseInline(token.content)}</h${token.level}>\n`;
        break;
      }
      case TOKEN.PARAGRAPH:
        html += `<p>${parseInline(token.content)}</p>\n`;
        break;
      case TOKEN.HORIZONTAL_RULE:
        html += '<hr />\n';
        break;
      case TOKEN.CODE_BLOCK: {
        const highlighted = highlightCode(token.content, token.lang);
        const langClass = token.lang ? ` language-${escapeHtml(token.lang)}` : '';
        const langLabel = token.lang ? `<span class="code-lang-label">${escapeHtml(token.lang)}</span>` : '';
        html += `<div class="code-block-wrapper">${langLabel}<pre><code class="hljs${langClass}">${highlighted}</code></pre></div>\n`;
        break;
      }
      case TOKEN.UNORDERED_LIST:
        html += buildList(token.items, 'ul');
        break;
      case TOKEN.ORDERED_LIST:
        html += buildList(token.items, 'ol');
        break;
      case TOKEN.BLOCKQUOTE:
        html += `<blockquote>${parseInline(token.content)}</blockquote>\n`;
        break;
      case TOKEN.TABLE:
        html += parseTable(token.lines);
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
const btnSettings = document.getElementById('btn-settings');
const resizer = document.getElementById('resizer');
const editorPanel = document.getElementById('editor-panel');
const settingsOverlay = document.getElementById('settings-overlay');

let currentFilePath = null;
let isDirty = false;
let debounceTimer = null;

// ---- Settings state ----
const pdfSettings = {
  marginTop: 8,
  marginBottom: 8,
  marginLeft: 8,
  marginRight: 8,
  pageBorder: false,
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

// ---- Scroll Sync ----

let syncingScroll = false;

editor.addEventListener('scroll', () => {
  if (syncingScroll) return;
  syncingScroll = true;

  // Sync line numbers
  lineNumbers.scrollTop = editor.scrollTop;

  // Sync preview proportionally
  const editorScrollRatio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
  preview.scrollTop = editorScrollRatio * (preview.scrollHeight - preview.clientHeight);

  requestAnimationFrame(() => { syncingScroll = false; });
});

preview.addEventListener('scroll', () => {
  if (syncingScroll) return;
  syncingScroll = true;

  const previewScrollRatio = preview.scrollTop / (preview.scrollHeight - preview.clientHeight || 1);
  editor.scrollTop = previewScrollRatio * (editor.scrollHeight - editor.clientHeight);
  lineNumbers.scrollTop = editor.scrollTop;

  requestAnimationFrame(() => { syncingScroll = false; });
});

// ---- Editor Events ----

editor.addEventListener('input', () => {
  isDirty = true;
  updateStatus();
  debouncedUpdate();
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

// ---- Settings Panel ----

btnSettings.addEventListener('click', () => {
  document.getElementById('margin-top').value = pdfSettings.marginTop;
  document.getElementById('margin-bottom').value = pdfSettings.marginBottom;
  document.getElementById('margin-left').value = pdfSettings.marginLeft;
  document.getElementById('margin-right').value = pdfSettings.marginRight;
  document.getElementById('page-border').checked = pdfSettings.pageBorder;
  document.getElementById('font-select').value = selectedFont;
  settingsOverlay.classList.add('open');
});

document.getElementById('settings-cancel').addEventListener('click', () => {
  settingsOverlay.classList.remove('open');
});

settingsOverlay.addEventListener('click', (e) => {
  if (e.target === settingsOverlay) settingsOverlay.classList.remove('open');
});

document.getElementById('settings-apply').addEventListener('click', () => {
  pdfSettings.marginTop = parseInt(document.getElementById('margin-top').value, 10) || 8;
  pdfSettings.marginBottom = parseInt(document.getElementById('margin-bottom').value, 10) || 8;
  pdfSettings.marginLeft = parseInt(document.getElementById('margin-left').value, 10) || 8;
  pdfSettings.marginRight = parseInt(document.getElementById('margin-right').value, 10) || 8;
  pdfSettings.pageBorder = document.getElementById('page-border').checked;

  const newFont = document.getElementById('font-select').value;
  if (newFont !== selectedFont) {
    selectedFont = newFont;
    applyFont();
  }

  settingsOverlay.classList.remove('open');
  showNotification('Settings applied');
});

function applyFont() {
  const fontFamily = FONT_MAP[selectedFont] || FONT_MAP.system;
  preview.style.fontFamily = fontFamily;
}

// ---- Initialize ----

updateLineNumbers();
applyFont();
