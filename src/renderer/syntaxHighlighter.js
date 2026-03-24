/**
 * Regex-based syntax highlighter for code blocks.
 * Supports C++, Python, JavaScript, Java, C, Bash, and generic fallback.
 */

const { escapeHtml } = require('../parser/markdownParser');

function wrapSpan(cls, text) {
  return `<span class="hljs-${cls}">${text}</span>`;
}

// Language keyword sets
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
    'in','function','select','time','coproc','echo','exit','return','local','export',
    'readonly','declare','typeset','unset','shift','set','source','alias','eval',
    'exec','trap','cd','pwd','test','read','printf',
  ],
};

// Types for languages that have them
const LANG_TYPES = {
  cpp: [
    'int','float','double','char','bool','long','short','unsigned','signed',
    'size_t','string','wstring','vector','map','unordered_map','set','unordered_set',
    'list','deque','queue','stack','priority_queue','pair','tuple','array',
    'shared_ptr','unique_ptr','weak_ptr','FILE','void',
  ],
  java: [
    'int','float','double','char','boolean','long','short','byte','String',
    'Integer','Float','Double','Character','Boolean','Long','Short','Byte',
    'Object','List','Map','Set','ArrayList','HashMap','HashSet','void',
  ],
  javascript: [
    'Array','Object','String','Number','Boolean','Symbol','BigInt','Map','Set',
    'WeakMap','WeakSet','Promise','Date','RegExp','Error','JSON','Math','console',
    'window','document','process',
  ],
};

// Built-in functions
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

/**
 * Highlight a code string for a given language.
 * Returns HTML with <span class="hljs-*"> wrappers.
 */
function highlight(code, lang) {
  const escaped = escapeHtml(code);
  const normalizedLang = normalizeLang(lang);

  // Apply language-specific highlighting
  let result = escaped;

  // Step 1: Protect strings and comments by replacing them with placeholders
  const placeholders = [];
  let placeholderIdx = 0;

  function addPlaceholder(match, cls) {
    const key = `\x00PH${placeholderIdx++}\x00`;
    placeholders.push({ key, replacement: wrapSpan(cls, match) });
    return key;
  }

  // Multi-line comments /* ... */
  result = result.replace(/\/\*[\s\S]*?\*\//g, (m) => addPlaceholder(m, 'comment'));

  // Single-line comments // ...
  if (normalizedLang !== 'python' && normalizedLang !== 'bash') {
    result = result.replace(/\/\/.*$/gm, (m) => addPlaceholder(m, 'comment'));
  }

  // Python/Bash comments  # ...
  if (normalizedLang === 'python' || normalizedLang === 'bash') {
    result = result.replace(/#.*$/gm, (m) => addPlaceholder(m, 'comment'));
  }

  // Triple-quoted strings (Python)
  if (normalizedLang === 'python') {
    result = result.replace(/(&quot;&quot;&quot;[\s\S]*?&quot;&quot;&quot;|&#39;&#39;&#39;[\s\S]*?&#39;&#39;&#39;)/g,
      (m) => addPlaceholder(m, 'string'));
  }

  // Double-quoted strings
  result = result.replace(/&quot;(?:[^&]|&(?!quot;))*?&quot;/g, (m) => addPlaceholder(m, 'string'));

  // Single-quoted strings (but not in escaped form that isn't a string)
  result = result.replace(/&#39;(?:[^&]|&(?!#39;))*?&#39;/g, (m) => addPlaceholder(m, 'string'));

  // Step 2: Highlight numbers
  result = result.replace(/\b(\d+\.?\d*[fFuUlL]*)\b/g, (m) => wrapSpan('number', m));

  // Step 3: Highlight preprocessor directives (C/C++)
  if (normalizedLang === 'cpp' || normalizedLang === 'c') {
    result = result.replace(/^(\s*#\w+.*)$/gm, (m) => wrapSpan('meta', m));
  }

  // Step 4: Highlight keywords
  const keywords = LANG_KEYWORDS[normalizedLang] || [];
  if (keywords.length > 0) {
    const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    result = result.replace(kwRegex, (m) => wrapSpan('keyword', m));
  }

  // Step 5: Highlight built-in types
  const types = LANG_TYPES[normalizedLang] || [];
  if (types.length > 0) {
    const typeRegex = new RegExp(`\\b(${types.join('|')})\\b`, 'g');
    result = result.replace(typeRegex, (m) => wrapSpan('built_in', m));
  }

  // Step 6: Highlight built-in functions
  const builtins = LANG_BUILTINS[normalizedLang] || [];
  if (builtins.length > 0) {
    const builtinRegex = new RegExp(`\\b(${builtins.join('|')})\\b`, 'g');
    result = result.replace(builtinRegex, (m) => wrapSpan('built_in', m));
  }

  // Step 7: Highlight decorators (Python)
  if (normalizedLang === 'python') {
    result = result.replace(/@\w+/g, (m) => wrapSpan('meta', m));
  }

  // Step 8: Restore placeholders
  for (const { key, replacement } of placeholders) {
    result = result.split(key).join(replacement);
  }

  return result;
}

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

module.exports = { highlight };
