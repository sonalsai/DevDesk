import React, { useState, useMemo } from 'react';
import { ToolLayout } from '../common/ToolLayout';
import { Search, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface RegexPreset {
  name: string;
  pattern: string;
  flags: string;
  sample: string;
}

const REGEX_PRESETS: RegexPreset[] = [
  {
    name: 'Email Address',
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    flags: 'g',
    sample: 'Contact us at team@devdesk.io or support.billing@example.org for questions.',
  },
  {
    name: 'HTTP / HTTPS URL',
    pattern: 'https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)',
    flags: 'gi',
    sample: 'Visit https://github.com/developer/project or http://localhost:3000/api/v1',
  },
  {
    name: 'IPv4 Address',
    pattern: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
    flags: 'g',
    sample: 'Gateway is 192.168.1.1 and DNS is 8.8.8.8 while invalid is 999.12.1.0',
  },
  {
    name: 'Hex Color',
    pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b',
    flags: 'gi',
    sample: 'Primary theme is #3b82f6, background is #0c0e12, and highlight is #fff.',
  },
  {
    name: 'UUID v4',
    pattern: '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}',
    flags: 'gi',
    sample: 'User session: 123e4567-e89b-42d3-a456-426614174000 created.',
  },
  {
    name: 'ISO Date (YYYY-MM-DD)',
    pattern: '\\b\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])\\b',
    flags: 'g',
    sample: 'Release scheduled for 2026-09-29 and deadline is 2026-12-31.',
  },
];

export const RegexTester: React.FC = () => {
  const [pattern, setPattern] = useState<string>('([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})');
  const [flagG, setFlagG] = useState<boolean>(true);
  const [flagI, setFlagI] = useState<boolean>(true);
  const [flagM, setFlagM] = useState<boolean>(false);
  const [flagS, setFlagS] = useState<boolean>(false);
  const [testString, setTestString] = useState<string>(
    'Send inquiries to alex@devdesk.io or dev-ops+notify@cloud-service.com for assistance.'
  );

  const flags = `${flagG ? 'g' : ''}${flagI ? 'i' : ''}${flagM ? 'm' : ''}${flagS ? 's' : ''}`;

  const { matches, error, highlightedHtml } = useMemo(() => {
    if (!pattern) {
      return { matches: [], error: null, highlightedHtml: testString };
    }

    try {
      const reg = new RegExp(pattern, flags);
      const allMatches: Array<{
        match: string;
        index: number;
        length: number;
        groups: string[];
      }> = [];

      if (flagG) {
        let m: RegExpExecArray | null;
        let lastIndex = -1;
        while ((m = reg.exec(testString)) !== null) {
          if (reg.lastIndex === lastIndex) {
            // Prevent infinite loop on zero-width match
            reg.lastIndex++;
          }
          lastIndex = reg.lastIndex;
          allMatches.push({
            match: m[0],
            index: m.index,
            length: m[0].length,
            groups: m.slice(1),
          });
          if (allMatches.length >= 200) break; // Safeguard
        }
      } else {
        const m = reg.exec(testString);
        if (m) {
          allMatches.push({
            match: m[0],
            index: m.index,
            length: m[0].length,
            groups: m.slice(1),
          });
        }
      }

      // Generate highlighted HTML
      let html = '';
      let currentIndex = 0;
      allMatches.forEach((m) => {
        // Escaped text before match
        const before = testString.substring(currentIndex, m.index);
        html += escapeHtml(before);

        // Highlighted match
        const matchText = testString.substring(m.index, m.index + m.length);
        html += `<mark style="background-color: var(--mark-bg); color: inherit; padding: 1px 3px; border-radius: 3px; border-bottom: 2px solid var(--accent);">${escapeHtml(
          matchText
        )}</mark>`;

        currentIndex = m.index + m.length;
      });

      // Remaining text
      html += escapeHtml(testString.substring(currentIndex));

      return { matches: allMatches, error: null, highlightedHtml: html };
    } catch (err: any) {
      return { matches: [], error: err.message, highlightedHtml: escapeHtml(testString) };
    }
  }, [pattern, flags, testString]);

  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br/>');
  }

  const loadPreset = (preset: RegexPreset) => {
    setPattern(preset.pattern);
    setFlagG(preset.flags.includes('g'));
    setFlagI(preset.flags.includes('i'));
    setFlagM(preset.flags.includes('m'));
    setFlagS(preset.flags.includes('s'));
    setTestString(preset.sample);
  };

  return (
    <ToolLayout
      toolId="regex-tester"
      title="Regex Tester"
      description="Live regular expression evaluator with capture group inspection and presets."
      icon={Search}
      actions={
        <div className="toolbar-group">
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Common Presets:</span>
          {REGEX_PRESETS.map((p) => (
            <button
              key={p.name}
              className="btn btn-subtle btn-sm"
              onClick={() => loadPreset(p)}
              style={{ fontSize: 11.5 }}
            >
              {p.name}
            </button>
          ))}
        </div>
      }
    >
      {/* Pattern and Flags Input Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '10px 14px',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--text-muted)' }}>
          /
        </span>
        <input
          type="text"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="Regular expression pattern..."
          style={{
            flex: 1,
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            minWidth: '220px',
          }}
          spellCheck={false}
        />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--text-muted)' }}>
          /
        </span>

        {/* Flags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <input type="checkbox" checked={flagG} onChange={(e) => setFlagG(e.target.checked)} />
            <span>g (global)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <input type="checkbox" checked={flagI} onChange={(e) => setFlagI(e.target.checked)} />
            <span>i (ignore case)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <input type="checkbox" checked={flagM} onChange={(e) => setFlagM(e.target.checked)} />
            <span>m (multiline)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <input type="checkbox" checked={flagS} onChange={(e) => setFlagS(e.target.checked)} />
            <span>s (dotAll)</span>
          </label>
        </div>
      </div>

      {error ? (
        <div
          style={{
            backgroundColor: 'var(--danger-subtle)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            color: 'var(--danger)',
            fontSize: 12.5,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={15} />
          <span>Invalid Regex: {error}</span>
        </div>
      ) : pattern ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: matches.length > 0 ? 'var(--success)' : 'var(--text-muted)',
          }}
        >
          <CheckCircle2 size={14} />
          <span>
            {matches.length} {matches.length === 1 ? 'match' : 'matches'} found
          </span>
        </div>
      ) : null}

      <div className="tool-split-container">
        {/* Test String Input Panel */}
        <div className="tool-panel">
          <div className="tool-panel-header">
            <span>Test String</span>
            <button className="btn btn-subtle btn-sm" onClick={() => setTestString('')}>
              Clear
            </button>
          </div>
          <textarea
            className="tool-editor-area"
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="Enter test string to match against..."
            spellCheck={false}
          />
        </div>

        {/* Live Highlight & Match Breakdown Panel */}
        <div className="tool-panel">
          <div className="tool-panel-header">
            <span>Live Highlighted Output</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {matches.length} matches
            </span>
          </div>

          <div
            className="tool-editor-area"
            style={{
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />

          {matches.length > 0 && (
            <div
              style={{
                borderTop: '1px solid var(--border-subtle)',
                maxHeight: '180px',
                overflowY: 'auto',
                padding: '8px 12px',
                fontSize: 11.5,
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Match Details & Capture Groups:
              </div>
              {matches.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '4px 0',
                    borderBottom: '1px dashed var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <div style={{ display: 'flex', gap: 8 }}>
                    <strong style={{ color: 'var(--accent)' }}>#{idx + 1}:</strong>
                    <code style={{ color: 'var(--text-primary)' }}>"{m.match}"</code>
                    <span style={{ color: 'var(--text-muted)' }}>
                      [Pos {m.index}..{m.index + m.length}]
                    </span>
                  </div>
                  {m.groups.length > 0 && (
                    <div style={{ paddingLeft: 18, color: 'var(--text-secondary)' }}>
                      {m.groups.map((g, gIdx) => (
                        <span key={gIdx} style={{ marginRight: 10 }}>
                          Group {gIdx + 1}: <code>"{g}"</code>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
};
