
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CodeState, Library, ChatMessage } from './types';
import { getAIResponse } from './services/geminiService';

// Constants
const BOILERPLATE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Project</title>
</head>
<body>

</body>
</html>`;

const SKELETON_TEMPLATES = [
  {
    id: 'hero',
    name: 'Hero Section',
    html: `<section class="hero">
  <div class="container">
    <h1>Modern Solutions</h1>
    <p>Build your future with Souvik.io</p>
    <button>Get Started</button>
  </div>
</section>`,
    css: `.hero { height: 80vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; text-align: center; }
.container { max-width: 800px; padding: 2rem; }
h1 { font-size: 3.5rem; color: #1e293b; margin-bottom: 1rem; }
p { font-size: 1.25rem; color: #64748b; margin-bottom: 2rem; }
button { background: #6366f1; color: white; border: none; padding: 1rem 2rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer; }`
  },
  {
    id: 'card-grid',
    name: 'Feature Grid',
    html: `<div class="grid">
  <div class="card"><h3>Fast</h3><p>Optimized for speed.</p></div>
  <div class="card"><h3>AI</h3><p>Powered by Gemini.</p></div>
  <div class="card"><h3>Live</h3><p>Real-time updates.</p></div>
</div>`,
    css: `.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; padding: 4rem; }
.card { padding: 2rem; border: 1px solid #e2e8f0; border-radius: 1rem; background: white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
h3 { color: #6366f1; margin-bottom: 0.5rem; }`
  }
];

const DEFAULT_HTML = ``;
const DEFAULT_CSS = ``;
const DEFAULT_JS = ``;

const POPULAR_LIBRARIES: Library[] = [
  { id: 'tailwind', name: 'Tailwind CSS', url: 'https://cdn.tailwindcss.com', type: 'js' },
  { id: 'animate-css', name: 'Animate.css', url: 'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css', type: 'css' },
  { id: 'gsap', name: 'GSAP', url: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js', type: 'js' },
];

const COMMON_TAGS = [
  'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'menu', 'meta', 'meter', 'nav', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'slot', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr'
];

const COMMON_ATTRIBUTES = [
  'id', 'class', 'src', 'href', 'alt', 'title', 'style', 'type', 'value', 'name', 
  'placeholder', 'target', 'rel', 'width', 'height', 'required', 'disabled', 'checked', 
  'autocomplete', 'autofocus', 'autoplay', 'loop', 'muted', 'controls', 'multiple', 
  'action', 'method', 'enctype', 'charset', 'lang', 'loading', 'srcset', 'sizes', 
  'aria-*', 'data-*', 'allowfullscreen', 'allow', 'sandbox', 'integrity', 'crossorigin',
  'accept', 'accesskey', 'align', 'async', 'bgcolor', 'border', 'cite', 'color', 
  'cols', 'colspan', 'content', 'contenteditable', 'coords', 'datetime', 'default', 
  'defer', 'dir', 'dirname', 'download', 'draggable', 'dropzone', 'form', 'formaction', 
  'headers', 'hidden', 'high', 'hreflang', 'http-equiv', 'ismap', 'kind', 'label', 
  'list', 'low', 'max', 'maxlength', 'media', 'min', 'novalidate', 'open', 'optimum', 
  'pattern', 'poster', 'preload', 'readonly', 'reversed', 'rows', 'rowspan', 'scope', 
  'selected', 'shape', 'size', 'span', 'spellcheck', 'srcdoc', 'srclang', 'start', 
  'step', 'tabindex', 'translate', 'usemap', 'wrap'
];

interface Suggestion {
  value: string;
  type: 'tag' | 'emmet' | 'attribute';
}

const App: React.FC = () => {
  const [code, setCode] = useState<CodeState>({
    html: DEFAULT_HTML,
    css: DEFAULT_CSS,
    js: DEFAULT_JS
  });

  const [history, setHistory] = useState<CodeState[]>([{ html: DEFAULT_HTML, css: DEFAULT_CSS, js: DEFAULT_JS }]);
  const [historyStep, setHistoryStep] = useState(0);

  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSkeletons, setShowSkeletons] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [fileName, setFileName] = useState('project.html');

  const [autoCloseEnabled, setAutoCloseEnabled] = useState(true);
  const [predictionsEnabled, setPredictionsEnabled] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [suggestionPos, setSuggestionPos] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateCodeWithHistory = (newCode: CodeState) => {
    if (JSON.stringify(newCode) === JSON.stringify(code)) return;
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newCode);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
    setCode(newCode);
  };

  const handleUndo = useCallback(() => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      setHistoryStep(prevStep);
      setCode(history[prevStep]);
    }
  }, [history, historyStep]);

  const generateFullHtml = useCallback(() => {
    const cssLinks = libraries.filter(l => l.type === 'css').map(l => `<link rel="stylesheet" href="${l.url}">`).join('\n');
    const jsScripts = libraries.filter(l => l.type === 'js').map(l => `<script src="${l.url}"></script>`).join('\n');

    // Security: Content Security Policy to prevent unauthorized data exfiltration
    // This policy allows scripts and styles from trusted CDNs used in POPULAR_LIBRARIES
    const securityMeta = `
      <meta http-equiv="Content-Security-Policy" content="default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:;">
    `;

    const resetCss = `
      * { box-sizing: border-box; }
      body { background-color: #ffffff; color: #1e293b; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
      table { border-collapse: collapse; width: 100%; max-width: 100%; }
      th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
    `;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${securityMeta}
  <style>${resetCss}</style>
  ${cssLinks}
  <style>${code.css}</style>
</head>
<body>
${code.html}
  ${jsScripts}
  <script>${code.js}</script>
</body>
</html>`;
  }, [code, libraries]);

  const handleSaveFile = () => {
    const fullHtml = generateFullHtml();
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const finalName = fileName.toLowerCase().endsWith('.html') ? fileName : `${fileName}.html`;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Set timestamp
    const now = new Date();
    setLastSaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setShowSavePrompt(false);
  };

  const handleRunExternal = () => {
    const fullHtml = generateFullHtml();
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    
    // Ask to save after run
    setTimeout(() => {
        setShowSavePrompt(true);
    }, 500);
  };

  const injectSkeleton = (skel: typeof SKELETON_TEMPLATES[0]) => {
    const newCode = {
      ...code,
      html: code.html + (code.html ? '\n' : '') + skel.html,
      css: code.css + (code.css ? '\n' : '') + skel.css
    };
    updateCodeWithHistory(newCode);
    setShowSkeletons(false);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);
    const context = `Current HTML: ${code.html}\nCSS: ${code.css}\nJS: ${code.js}`;
    const response = await getAIResponse(chatInput, context);
    setChatMessages(prev => [...prev, { role: 'model', text: response.text }]);
    setIsChatLoading(false);
  };

  const toggleLibrary = (lib: Library) => {
    setLibraries(prev => 
      prev.find(l => l.id === lib.id) ? prev.filter(l => l.id !== lib.id) : [...prev, lib]
    );
  };

  const findMatchingClosingTagIndex = (html: string, openingTagStart: number, tagName: string) => {
    let depth = 1;
    let pos = openingTagStart + 1;
    const openTagRegex = new RegExp(`<${tagName}(\\s|>|$)`, 'i');
    const closeTagRegex = new RegExp(`</${tagName}>`, 'i');

    while (pos < html.length) {
      const remaining = html.substring(pos);
      const openMatch = remaining.match(openTagRegex);
      const closeMatch = remaining.match(closeTagRegex);

      const openIndex = openMatch ? pos + openMatch.index! : Infinity;
      const closeIndex = closeMatch ? pos + closeMatch.index! : Infinity;

      if (closeIndex === Infinity) break;

      if (openIndex < closeIndex) {
        depth++;
        pos = openIndex + 1;
      } else {
        depth--;
        if (depth === 0) return closeIndex;
        pos = closeIndex + 1;
      }
    }
    return -1;
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const { selectionStart, selectionEnd, value } = el;

    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      handleUndo();
      return;
    }

    if (e.altKey && e.key === 'ArrowDown') {
      e.preventDefault();
      let textToDuplicate = '';
      let newSelectionStart = selectionStart;
      let newSelectionEnd = selectionEnd;
      let newValue = value;

      if (selectionStart !== selectionEnd) {
        textToDuplicate = value.substring(selectionStart, selectionEnd);
        newValue = value.substring(0, selectionEnd) + textToDuplicate + value.substring(selectionEnd);
        newSelectionStart = selectionEnd;
        newSelectionEnd = selectionEnd + textToDuplicate.length;
      } else {
        const lines = value.split('\n');
        let currentLineIndex = value.substring(0, selectionStart).split('\n').length - 1;
        const lineContent = lines[currentLineIndex];
        lines.splice(currentLineIndex + 1, 0, lineContent);
        newValue = lines.join('\n');
        newSelectionStart = selectionStart + lineContent.length + 1;
        newSelectionEnd = newSelectionStart;
      }

      updateCodeWithHistory({ ...code, [activeTab]: newValue });
      setTimeout(() => {
        el.selectionStart = newSelectionStart;
        el.selectionEnd = newSelectionEnd;
      }, 0);
      return;
    }

    if (suggestions.length > 0 && predictionsEnabled) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSuggestionIndex(prev => (prev + 1) % suggestions.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); applySuggestion(suggestions[suggestionIndex]); return; }
      if (e.key === 'Escape') { setSuggestions([]); return; }
    }

    if (e.key === 'Enter' && selectionStart === selectionEnd && activeTab === 'html') {
      const textBefore = value.substring(0, selectionStart);
      if (textBefore.endsWith('!')) {
        e.preventDefault();
        updateCodeWithHistory({ ...code, html: value.substring(0, selectionStart - 1) + BOILERPLATE_HTML + value.substring(selectionStart) });
        return;
      }
      if (textBefore.endsWith('<-')) {
        e.preventDefault();
        const completion = '<!--  -->';
        updateCodeWithHistory({ ...code, html: value.substring(0, selectionStart - 2) + completion + value.substring(selectionStart) });
        setTimeout(() => { el.selectionStart = el.selectionEnd = selectionStart - 2 + 5; }, 0);
        return;
      }
      const emmetRegex = /([a-zA-Z0-9]*)([\.#][a-zA-Z0-9_\-]+)+$/;
      const emmetMatch = textBefore.match(emmetRegex);
      if (emmetMatch) {
        e.preventDefault();
        const fullToken = emmetMatch[0];
        const tagName = emmetMatch[1] || 'div';
        const selectors = fullToken.substring(tagName.length);
        let classes: string[] = [];
        let id = '';
        const selectorParts = selectors.match(/[\.#][a-zA-Z0-9_\-]+/g) || [];
        selectorParts.forEach(s => {
          if (s.startsWith('.')) classes.push(s.substring(1));
          if (s.startsWith('#')) id = s.substring(1);
        });
        const classAttr = classes.length ? ` class="${classes.join(' ')}"` : '';
        const idAttr = id ? ` id="${id}"` : '';
        const completion = `<${tagName}${idAttr}${classAttr}></${tagName}>`;
        updateCodeWithHistory({ ...code, html: value.substring(0, selectionStart - fullToken.length) + completion + value.substring(selectionStart) });
        setTimeout(() => { el.selectionStart = el.selectionEnd = selectionStart - fullToken.length + tagName.length + idAttr.length + classAttr.length + 1; }, 0);
        return;
      }
      const charBefore = value[selectionStart - 1];
      const charAfter = value[selectionStart];
      if (charBefore === '>' && charAfter === '<') {
        e.preventDefault();
        const lines = textBefore.split('\n');
        const currentLine = lines[lines.length - 1];
        const indentMatch = currentLine.match(/^\s*/);
        const indent = indentMatch ? indentMatch[0] : '';
        const newIndent = indent + '  ';
        const newValue = value.substring(0, selectionStart) + '\n' + newIndent + '\n' + indent + value.substring(selectionStart);
        updateCodeWithHistory({ ...code, [activeTab]: newValue });
        setTimeout(() => { el.selectionStart = el.selectionEnd = selectionStart + 1 + newIndent.length; }, 0);
        return;
      }
    }

    if (autoCloseEnabled && e.key === '>' && activeTab === 'html') {
      const textBefore = value.substring(0, selectionStart);
      const tagMatch = textBefore.match(/<([a-zA-Z1-6]+)([^>]*)$/);
      if (tagMatch) {
        const tagName = tagMatch[1];
        const selfClosing = ['img', 'br', 'hr', 'input', 'meta', 'link', 'wbr', 'area', 'base', 'col', 'embed', 'param', 'source', 'track'].includes(tagName.toLowerCase());
        if (!selfClosing) {
          e.preventDefault();
          const closingTag = `></${tagName}>`;
          updateCodeWithHistory({ ...code, html: value.substring(0, selectionStart) + closingTag + value.substring(selectionEnd) });
          setTimeout(() => { el.selectionStart = el.selectionEnd = selectionStart + 1; }, 0);
          return;
        }
      }
    }
  };

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let val = e.target.value;
    const { selectionStart } = e.target;
    const oldVal = code[activeTab];

    if (activeTab === 'html' && val.length !== oldVal.length) {
        const textBefore = val.substring(0, selectionStart);
        const openingTagMatch = textBefore.match(/<([a-zA-Z1-6]*)$/);
        if (openingTagMatch) {
            const newTagName = openingTagMatch[1];
            const oldTextBefore = oldVal.substring(0, Math.min(selectionStart, oldVal.length));
            const oldOpeningTagMatch = oldTextBefore.match(/<([a-zA-Z1-6]*)$/);
            if (oldOpeningTagMatch) {
                const oldTagName = oldOpeningTagMatch[1];
                const tagStartPos = textBefore.lastIndexOf('<' + newTagName);
                const closingTagPos = findMatchingClosingTagIndex(val, tagStartPos, oldTagName);
                if (closingTagPos !== -1) {
                    const closingTagStart = closingTagPos + 2;
                    val = val.substring(0, closingTagStart) + newTagName + val.substring(closingTagStart + oldTagName.length);
                }
            }
        }
    }

    const newCode = { ...code, [activeTab]: val };
    setCode(newCode);

    if (activeTab === 'html' && predictionsEnabled) {
      const textBefore = val.substring(0, selectionStart);
      const attrMatch = textBefore.match(/<([a-zA-Z1-6]+)\s+([^>]*)$/);
      
      if (attrMatch) {
        const fullAttrString = attrMatch[2];
        const lastPartMatch = fullAttrString.match(/([a-zA-Z0-9-]*)$/);
        const query = lastPartMatch ? lastPartMatch[1].toLowerCase() : '';
        const filtered = COMMON_ATTRIBUTES
          .filter(a => a.startsWith(query))
          .slice(0, 15)
          .map(a => ({ value: a, type: 'attribute' as const }));
        setSuggestions(filtered);
        setSuggestionIndex(0);
        updatePopupPos(textBefore);
        return;
      }

      const tagOpenMatch = textBefore.match(/<([a-zA-Z0-9]*)$/);
      if (tagOpenMatch) {
        const query = tagOpenMatch[1].toLowerCase();
        const filtered = COMMON_TAGS.filter(t => t.startsWith(query)).slice(0, 15).map(t => ({ value: t, type: 'tag' as const }));
        setSuggestions(filtered);
        setSuggestionIndex(0);
        updatePopupPos(textBefore);
        return;
      }

      const emmetQueryMatch = textBefore.match(/(?:^|[\s>])([a-zA-Z0-9]+)$/);
      if (emmetQueryMatch) {
        const query = emmetQueryMatch[1].toLowerCase();
        const filtered = COMMON_TAGS.filter(t => t.startsWith(query)).slice(0, 15).map(t => ({ value: t, type: 'emmet' as const }));
        if (filtered.length > 0) {
          setSuggestions(filtered);
          setSuggestionIndex(0);
          updatePopupPos(textBefore);
        } else {
          setSuggestions([]);
        }
        return;
      }
      setSuggestions([]);
    } else {
      setSuggestions([]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      updateCodeWithHistory(code);
    }, 1000);
    return () => clearTimeout(timer);
  }, [code]);

  const updatePopupPos = (textBefore: string) => {
    const lines = textBefore.split('\n');
    const lineCount = lines.length;
    const charInLine = lines[lines.length - 1].length;
    const top = Math.min(window.innerHeight - 350, lineCount * 24 + 90); 
    const left = Math.min(window.innerWidth - 300, charInLine * 9.5 + 110);
    setSuggestionPos({ top, left });
  };

  const applySuggestion = (sug: Suggestion) => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const { selectionStart } = el;
    const textBefore = el.value.substring(0, selectionStart);
    let newValue = el.value;
    let newCursorPos = selectionStart;

    const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link', 'wbr', 'area', 'base', 'col', 'embed', 'param', 'source', 'track'];

    if (sug.type === 'tag') {
      const tagMatch = textBefore.match(/<([a-zA-Z0-9]*)$/);
      if (tagMatch) {
        const startOfToken = selectionStart - tagMatch[1].length;
        const isSelfClosing = selfClosingTags.includes(sug.value.toLowerCase());
        const completion = isSelfClosing ? `${sug.value}>` : `${sug.value}></${sug.value}>`;
        newValue = el.value.substring(0, startOfToken) + completion + el.value.substring(selectionStart);
        newCursorPos = isSelfClosing ? startOfToken + completion.length : startOfToken + sug.value.length + 1;
      }
    } else if (sug.type === 'emmet') {
      const emmetMatch = textBefore.match(/([a-zA-Z0-9]+)$/);
      if (emmetMatch) {
        const startOfToken = selectionStart - emmetMatch[1].length;
        const isSelfClosing = selfClosingTags.includes(sug.value.toLowerCase());
        const completion = isSelfClosing ? `<${sug.value}>` : `<${sug.value}></${sug.value}>`;
        newValue = el.value.substring(0, startOfToken) + completion + el.value.substring(selectionStart);
        newCursorPos = isSelfClosing ? startOfToken + completion.length : startOfToken + sug.value.length + 2;
      }
    } else if (sug.type === 'attribute') {
      const lastTokenMatch = textBefore.match(/([a-zA-Z0-9-]*)$/);
      if (lastTokenMatch) {
        const startOfToken = selectionStart - lastTokenMatch[1].length;
        const booleanAttributes = ['disabled', 'readonly', 'checked', 'required', 'autofocus', 'autoplay', 'loop', 'muted', 'controls', 'multiple', 'reversed', 'hidden', 'async', 'defer', 'ismap', 'open'];
        const isBoolean = booleanAttributes.includes(sug.value.toLowerCase());
        
        let completion = '';
        if (sug.value === 'aria-*') {
           completion = 'aria-';
           newCursorPos = startOfToken + 5;
        } else if (sug.value === 'data-*') {
           completion = 'data-';
           newCursorPos = startOfToken + 5;
        } else {
           completion = isBoolean ? sug.value : `${sug.value}=""`;
           newCursorPos = isBoolean ? startOfToken + sug.value.length : startOfToken + sug.value.length + 2; 
        }
        newValue = el.value.substring(0, startOfToken) + completion + el.value.substring(selectionStart);
      }
    }
    
    updateCodeWithHistory({ ...code, [activeTab]: newValue });
    setSuggestions([]);
    setTimeout(() => { 
      el.focus(); 
      el.selectionStart = el.selectionEnd = newCursorPos; 
    }, 0);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Save Reminder Prompt */}
      {showSavePrompt && (
        <div className="fixed top-6 right-6 z-[110] animate-in slide-in-from-right-10 duration-500">
           <div className="bg-slate-800 border-2 border-indigo-500 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 max-w-xs backdrop-blur-xl">
              <div className="flex items-start gap-4">
                 <div className="bg-indigo-600/20 p-2 rounded-lg text-indigo-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                 </div>
                 <div>
                    <h3 className="font-bold text-sm">Save your progress?</h3>
                    <p className="text-[10px] text-slate-400 mt-1">You just ran your program. It's a good time to save a local copy of your code.</p>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={handleSaveFile} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase py-2 rounded-lg transition-all active:scale-95">Save Now</button>
                 <button onClick={() => setShowSavePrompt(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-[10px] uppercase py-2 rounded-lg transition-all">Later</button>
              </div>
           </div>
        </div>
      )}

      {/* Skeletons Modal */}
      {showSkeletons && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-slate-800 w-full max-w-2xl rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                <h2 className="text-xl font-black tracking-tight">UI Skeletons</h2>
                <button onClick={() => setShowSkeletons(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
                 {SKELETON_TEMPLATES.map(skel => (
                   <button 
                     key={skel.id} 
                     onClick={() => injectSkeleton(skel)}
                     className="p-6 bg-slate-900/50 border border-slate-700 rounded-2xl text-left hover:border-indigo-500 hover:bg-slate-700/50 transition-all group"
                   >
                     <h3 className="font-bold text-indigo-400 mb-2 group-hover:text-indigo-300">{skel.name}</h3>
                     <p className="text-xs text-slate-400">Injects pre-made HTML structure and matching CSS styles.</p>
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in zoom-in duration-200">
          <div className="bg-slate-800 w-full max-w-lg rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-black tracking-tight">Workspace Config</h2>
              <button onClick={() => setShowSettings(false)} className="w-8 h-8 rounded-full hover:bg-slate-700 flex items-center justify-center">✕</button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-700">
                <span className="text-sm font-bold">Intelligent Auto-Close</span>
                <button onClick={() => setAutoCloseEnabled(!autoCloseEnabled)} className={`w-10 h-5 rounded-full relative transition-colors ${autoCloseEnabled ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoCloseEnabled ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Integrations</h3>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_LIBRARIES.map(lib => (
                    <button key={lib.id} onClick={() => toggleLibrary(lib)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${libraries.find(l => l.id === lib.id) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                      {lib.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700 z-30 shadow-lg backdrop-blur-md bg-opacity-80">
        <div className="flex items-center gap-4 group cursor-default">
          <div className="bg-indigo-600 p-2 rounded-xl text-white font-black text-2xl shadow-indigo-500/20 shadow-lg group-hover:scale-110 transition-transform">⚡</div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">Souvik<span className="text-indigo-400">.io</span></h1>
              <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700">
                <input 
                  type="text" 
                  value={fileName} 
                  onChange={(e) => setFileName(e.target.value)}
                  className="bg-transparent border-none outline-none text-[10px] font-mono text-indigo-300 w-32 text-center focus:ring-1 focus:ring-indigo-500/50 rounded"
                  spellCheck={false}
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Souvik Space</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleUndo} disabled={historyStep === 0} className={`p-2.5 rounded-xl border border-slate-600 transition-all ${historyStep === 0 ? 'opacity-20 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600 text-indigo-400'}`} title="Undo (Ctrl+Z)">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
          </button>
          <button onClick={() => setShowSkeletons(true)} className="px-4 py-2.5 bg-slate-900/80 hover:bg-slate-700 text-indigo-400 font-bold text-xs uppercase tracking-widest rounded-xl transition-all border border-slate-700 hover:border-indigo-500/50 flex items-center gap-2">
            <span className="text-base">🦴</span> Skeletons
          </button>
          <button 
            onClick={handleSaveFile}
            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 border border-slate-600 active:scale-95 shadow-lg"
          >
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            Save
          </button>
          <button onClick={() => setShowSettings(true)} className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl border border-slate-600 transition-all">
             <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
          <button onClick={handleRunExternal} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95">
            Run Project <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex flex-1 relative overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-16 bg-slate-800 border-r border-slate-700 flex flex-col items-center py-6 gap-6 z-20">
          {(['html', 'css', 'js'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all font-black text-xs uppercase tracking-tighter ${
                activeTab === tab 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-110' 
                  : 'text-slate-500 hover:bg-slate-700 hover:text-slate-300'
              }`}
            >
              {tab[0]}
            </button>
          ))}
        </aside>

        {/* Editor Area */}
        <section className="flex-1 relative bg-slate-950">
          <div className="w-full h-full flex flex-col">
            <div className="flex bg-slate-900/50 p-2 border-b border-slate-800 items-center justify-between px-4">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{activeTab} Workbox</span>
              <div className="flex gap-4 text-[10px] text-slate-500 font-bold">
                 <span>{code[activeTab].split('\n').length} Lines</span>
                 <span className="text-indigo-500/50">Alt+↓ Duplicate</span>
                 <span className="text-indigo-400/50">Ctrl+Z Undo</span>
              </div>
            </div>
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                className="w-full h-full bg-slate-950 text-slate-300 p-12 code-font focus:outline-none resize-none leading-relaxed text-base selection:bg-indigo-500/20 whitespace-pre"
                spellCheck={false}
                value={code[activeTab]}
                onKeyDown={handleEditorKeyDown}
                onChange={handleEditorChange}
                placeholder={`Start coding... Try '!' for HTML boilerplate or use Skeletons.`}
              />
              
              {/* Autocomplete Popup */}
              {suggestions.length > 0 && (
                <div 
                  className="absolute z-50 bg-slate-800/80 backdrop-blur-xl border border-slate-600/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden min-w-[240px] animate-in fade-in slide-in-from-top-2 duration-150" 
                  style={{ top: suggestionPos.top, left: suggestionPos.left }}
                >
                  <div className="bg-slate-700/50 px-4 py-2.5 flex justify-between items-center border-b border-slate-600/50">
                    <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">Intellisense</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded uppercase">{suggestions[0].type}</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {suggestions.map((sug, i) => (
                      <button 
                        key={i} 
                        onClick={() => applySuggestion(sug)} 
                        onMouseEnter={() => setSuggestionIndex(i)} 
                        className={`w-full text-left px-5 py-3 text-sm font-semibold transition-all flex items-center justify-between group ${
                          i === suggestionIndex ? 'bg-indigo-600 text-white translate-x-1' : 'text-slate-300 hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                           <span className={`w-1.5 h-1.5 rounded-full transition-transform ${i === suggestionIndex ? 'bg-white scale-125' : 'bg-slate-600'}`}></span>
                           <span className="font-mono tracking-tight">{sug.type === 'emmet' ? `<${sug.value}>` : sug.value}</span>
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-tighter transition-opacity ${i === suggestionIndex ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'}`}>
                          {sug.type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* AI Sidebar */}
        <aside className="w-80 bg-slate-800 flex flex-col border-l border-slate-700 hidden lg:flex shadow-2xl z-30 overflow-hidden">
          <div className="p-6 border-b border-slate-700 flex items-center gap-3 bg-slate-800/50 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-600/10">🤖</div>
            <div>
              <h2 className="font-black text-sm tracking-tight">Assistant</h2>
              <div className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Active Support</span>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-slate-900/10">
            {chatMessages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center px-4">
                <div className="text-4xl mb-4">✨</div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Ready to spark your next project</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`max-w-[92%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-lg ${
                msg.role === 'user' ? 'bg-indigo-600 text-white self-end rounded-tr-none' : 'bg-slate-700/80 backdrop-blur text-slate-200 self-start rounded-tl-none border border-slate-600/30'
              }`}>
                {msg.text}
              </div>
            ))}
            {isChatLoading && (
              <div className="flex items-center gap-3 self-start bg-slate-700/30 px-4 py-2 rounded-full border border-slate-600/20">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                </div>
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Thinking</span>
              </div>
            )}
          </div>
          <form onSubmit={handleChatSubmit} className="p-4 border-t border-slate-700 bg-slate-800/80 backdrop-blur-md">
             <div className="relative group">
                <input 
                  type="text" 
                  placeholder="Ask for advice..." 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-600 transition-all placeholder:text-slate-600" 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)} 
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                   <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7 7m0 0l7-7m-7 7V3" /></svg>
                </button>
             </div>
          </form>
        </aside>
      </main>

      {/* Footer Info */}
      <footer className="h-10 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-6 text-[10px] font-bold text-slate-500 z-40">
        <div className="flex gap-5">
          <div className="flex items-center gap-2 group cursor-help">
            <span className="text-indigo-400/80 font-black">!</span>
            <span className="text-slate-500 group-hover:text-slate-300 transition-colors uppercase">Boilerplate</span>
          </div>
          <div className="flex items-center gap-2 group cursor-help">
            <span className="text-indigo-400/80 font-black">Alt+↓</span>
            <span className="text-slate-500 group-hover:text-slate-300 transition-colors uppercase">Duplicate</span>
          </div>
          <div className="flex items-center gap-2 group cursor-help">
            <span className="text-indigo-400/80 font-black">Ctrl+Z</span>
            <span className="text-slate-500 group-hover:text-slate-300 transition-colors uppercase">Undo</span>
          </div>
          <div className="flex items-center gap-2 group cursor-help" title="Security Active: CSP Enabled">
            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 4.908-3.367 9.193-8 10.166-4.633-.973-8-5.258-8-10.166 0-.68.056-1.35.166-2.001zM10 4a1 1 0 00-1 1v4a1 1 0 102 0V5a1 1 0 00-1-1zm0 8a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>
            <span className="text-slate-500 uppercase">Secure</span>
          </div>
        </div>
        <div className="flex gap-8 uppercase items-center">
          <div className="flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
             <span className="tracking-tighter">
               {lastSaved ? `Saved at ${lastSaved}` : 'Souvik Core 2.6.0'}
             </span>
          </div>
          <div className="bg-slate-800 px-3 py-1 rounded text-slate-400 tracking-widest">{activeTab} MODE</div>
        </div>
      </footer>
    </div>
  );
};

export default App;
