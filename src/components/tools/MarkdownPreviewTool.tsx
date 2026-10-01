import React, { useState, useMemo } from 'react';
import { ToolLayout } from '../common/ToolLayout';
import { FileText, Copy, Check, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks';

// Clean, secure markdown parser
function parseMarkdownToHtml(md: string): string {
  if (!md) return '';

  let html = md;

  // Escape HTML entities to prevent raw injection
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks: ```lang\ncode\n```
  html = html.replace(/```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Tables
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      // Check if next line is table separator |---|---|
      const isSeparator = cells.every((c) => /^[-:]+$/.test(c));

      if (isSeparator) {
        continue;
      }

      if (!inTable) {
        inTable = true;
        processedLines.push('<table><thead><tr>' + cells.map((c) => `<th>${c}</th>`).join('') + '</tr></thead><tbody>');
      } else {
        processedLines.push('<tr>' + cells.map((c) => `<td>${c}</td>`).join('') + '</tr>');
      }
    } else {
      if (inTable) {
        processedLines.push('</tbody></table>');
        inTable = false;
      }
      processedLines.push(lines[i]);
    }
  }
  if (inTable) {
    processedLines.push('</tbody></table>');
  }

  html = processedLines.join('\n');

  // Headings
  html = html.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
  html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Blockquotes
  html = html.replace(/^&gt; (.*$)/gim, '<blockquote>$1</blockquote>');

  // Horizontal rules
  html = html.replace(/^(?:---|\*\*\*|___)\s*$/gim, '<hr style="border:none;border-top:1px solid var(--border-subtle);margin:16px 0;"/>');

  // Checkboxes / Task lists
  html = html.replace(/^- \[x\] (.*$)/gim, '<div style="display:flex;align-items:center;gap:6px;margin:3px 0;"><input type="checkbox" checked disabled style="accent-color:var(--accent);"/><span>$1</span></div>');
  html = html.replace(/^- \[ \] (.*$)/gim, '<div style="display:flex;align-items:center;gap:6px;margin:3px 0;"><input type="checkbox" disabled/><span>$1</span></div>');

  // Unordered lists
  html = html.replace(/^\s*[-*+]\s+(.*$)/gim, '<ul><li>$1</li></ul>');
  // Combine adjacent <ul> tags
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  // Bold & Italic & Strikethrough
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--accent);text-decoration:underline;">$1</a>');

  // Paragraphs
  html = html.replace(/\n{2,}/g, '</p><p>');

  return html;
}

const SAMPLE_MARKDOWN = `# DevDesk Markdown Documentation

Welcome to **DevDesk**, your daily engineering workspace!

## Key Highlights
- [x] Fast, local-first execution
- [x] Unified toolset and scratchpad
- [ ] Upcoming cloud collaboration in Phase 4

### Technology Comparison Table
| Feature | Local Browser | Server Cloud |
| --- | --- | --- |
| Latency | **Instant (0ms)** | 150-300ms |
| Privacy | **100% Client-side** | Stored remotely |
| Offline | Supported | Requires connection |

> "Simplicity is prerequisite for reliability." — Edsger W. Dijkstra

### Code Example
\`\`\`typescript
interface Config {
  environment: 'development' | 'production';
  port: number;
}
\`\`\`
`;

export const MarkdownPreviewTool: React.FC = () => {
  const { showToast } = useToast();
  const [markdown, setMarkdown] = useState<string>(SAMPLE_MARKDOWN);
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const htmlOutput = useMemo(() => {
    return parseMarkdownToHtml(markdown);
  }, [markdown]);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    showToast('Markdown copied to clipboard', 'success', 1500);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <ToolLayout
      toolId="markdown-preview"
      title="Markdown Preview"
      description="Write and render GitHub-Flavored Markdown with tables, code blocks, task lists, and blockquotes."
      icon={FileText}
      actions={
        <div className="toolbar-group">
          <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? 'Copied ✓' : 'Copy Markdown'}</span>
          </button>
          <button className="btn btn-subtle btn-sm" onClick={() => setMarkdown('')}>
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
          <button
            className={`btn btn-sm ${isFullscreen ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      }
    >
      <div
        className="tool-split-container"
        style={
          isFullscreen
            ? {
                position: 'fixed',
                inset: 0,
                zIndex: 1500,
                backgroundColor: 'var(--bg-app)',
                padding: '20px',
                height: '100vh',
              }
            : undefined
        }
      >
        {/* Editor Panel */}
        <div className="tool-panel">
          <div className="tool-panel-header">
            <span>Markdown Source</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {markdown.length} chars
            </span>
          </div>
          <textarea
            className="tool-editor-area"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Write Markdown here..."
            spellCheck={false}
          />
        </div>

        {/* Live Preview Panel */}
        <div className="tool-panel">
          <div className="tool-panel-header">
            <span>Rendered Preview</span>
            {isFullscreen && (
              <button
                className="btn btn-subtle btn-sm"
                onClick={() => setIsFullscreen(false)}
              >
                <Minimize2 size={13} />
              </button>
            )}
          </div>
          <div
            className="tool-editor-area markdown-rendered"
            style={{
              backgroundColor: 'var(--bg-surface)',
              overflowY: 'auto',
            }}
            dangerouslySetInnerHTML={{ __html: htmlOutput }}
          />
        </div>
      </div>
    </ToolLayout>
  );
};
