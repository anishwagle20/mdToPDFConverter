/**
 * Custom Markdown Tokenizer & Parser
 * Converts raw markdown text into an array of tokens, then into an HTML string.
 * No external markdown libraries used.
 */

const TOKEN = {
  HEADING: 'heading',
  PARAGRAPH: 'paragraph',
  UNORDERED_LIST: 'unordered_list',
  ORDERED_LIST: 'ordered_list',
  CODE_BLOCK: 'code_block',
  BLOCKQUOTE: 'blockquote',
  HORIZONTAL_RULE: 'horizontal_rule',
  TABLE: 'table',
  BLANK: 'blank',
};

/**
 * Tokenize raw markdown into block-level tokens.
 */
function tokenize(markdown) {
  const lines = markdown.split('\n');
  const tokens = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (/^\s*$/.test(line)) {
      i++;
      continue;
    }

    // Horizontal rule: ---, ***, ___
    if (/^(\s{0,3})([-*_])\s*\2\s*\2[\s\2]*$/.test(line)) {
      tokens.push({ type: TOKEN.HORIZONTAL_RULE });
      i++;
      continue;
    }

    // Fenced code block
    if (/^```(\w*)/.test(line)) {
      const match = line.match(/^```(\w*)/);
      const lang = match[1] || '';
      const codeLines = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      tokens.push({
        type: TOKEN.CODE_BLOCK,
        lang,
        content: codeLines.join('\n'),
      });
      i++; // skip closing ```
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      tokens.push({
        type: TOKEN.HEADING,
        level: headingMatch[1].length,
        content: headingMatch[2],
      });
      i++;
      continue;
    }

    // Table (detect by | in current and next line having separator)
    if (/\|/.test(line) && i + 1 < lines.length && /^\|?\s*[-:]+[-| :]*$/.test(lines[i + 1])) {
      const tableLines = [];
      while (i < lines.length && /\|/.test(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      tokens.push({
        type: TOKEN.TABLE,
        lines: tableLines,
      });
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const bqLines = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        bqLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      tokens.push({
        type: TOKEN.BLOCKQUOTE,
        content: bqLines.join('\n'),
      });
      continue;
    }

    // Unordered list
    if (/^(\s*)([-*+])\s+/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^(\s*)([-*+])\s+/.test(lines[i])) {
        const m = lines[i].match(/^(\s*)([-*+])\s+(.*)/);
        listItems.push({ indent: m[1].length, content: m[3] });
        i++;
      }
      tokens.push({
        type: TOKEN.UNORDERED_LIST,
        items: listItems,
      });
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const m = lines[i].match(/^(\s*)\d+\.\s+(.*)/);
        listItems.push({ indent: m[1].length, content: m[2] });
        i++;
      }
      tokens.push({
        type: TOKEN.ORDERED_LIST,
        items: listItems,
      });
      continue;
    }

    // Paragraph (collect consecutive non-blank lines not matching other patterns)
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
        // Check if next line makes this a table
        if (/\|/.test(lines[i]) && i + 1 < lines.length && /^\|?\s*[-:]+[-| :]*$/.test(lines[i + 1])) {
          break;
        }
        paraLines.push(lines[i]);
        i++;
      }
      if (paraLines.length > 0) {
        tokens.push({
          type: TOKEN.PARAGRAPH,
          content: paraLines.join('\n'),
        });
      }
    }
  }

  return tokens;
}

/**
 * Escape HTML special characters to prevent XSS.
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Parse inline markdown (bold, italic, code, links, images, strikethrough).
 */
function parseInline(text) {
  let result = escapeHtml(text);

  // Inline code (must come first to avoid processing content inside backticks)
  result = result.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Images: ![alt](url)
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />');

  // Links: [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Bold + Italic: ***text*** or ___text___
  result = result.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  result = result.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');

  // Bold: **text** or __text__
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_ (not matching inside words for underscore)
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
  result = result.replace(/(?<!\w)_(.+?)_(?!\w)/g, '<em>$1</em>');

  // Strikethrough: ~~text~~
  result = result.replace(/~~(.+?)~~/g, '<del>$1</del>');

  return result;
}

/**
 * Parse a table token into HTML.
 */
function parseTable(tableLines) {
  if (tableLines.length < 2) return '';

  const parseRow = (line) => {
    return line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());
  };

  const headers = parseRow(tableLines[0]);
  // line[1] is the separator row, parse alignment
  const separators = parseRow(tableLines[1]);
  const alignments = separators.map((sep) => {
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

/**
 * Build nested list HTML from flat list items with indentation.
 */
function buildList(items, tag) {
  let html = `<${tag}>\n`;
  let i = 0;
  while (i < items.length) {
    const item = items[i];
    html += `<li>${parseInline(item.content)}`;
    // Check for nested items
    const nextItems = [];
    let j = i + 1;
    while (j < items.length && items[j].indent > item.indent) {
      nextItems.push({ ...items[j], indent: items[j].indent - item.indent - 2 });
      j++;
    }
    if (nextItems.length > 0) {
      html += '\n' + buildList(nextItems, tag);
    }
    html += '</li>\n';
    i = j;
  }
  html += `</${tag}>\n`;
  return html;
}

/**
 * Convert tokens into an HTML string.
 */
function tokensToHtml(tokens, highlighter) {
  let html = '';

  for (const token of tokens) {
    switch (token.type) {
      case TOKEN.HEADING: {
        const id = token.content
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
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
        const highlighted = highlighter
          ? highlighter(token.content, token.lang)
          : escapeHtml(token.content);
        const langClass = token.lang ? ` language-${escapeHtml(token.lang)}` : '';
        const langLabel = token.lang
          ? `<span class="code-lang-label">${escapeHtml(token.lang)}</span>`
          : '';
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

/**
 * Main parse function: markdown string → HTML string.
 */
function parse(markdown, highlighter) {
  const tokens = tokenize(markdown);
  return tokensToHtml(tokens, highlighter);
}

module.exports = { tokenize, parse, escapeHtml, parseInline };
