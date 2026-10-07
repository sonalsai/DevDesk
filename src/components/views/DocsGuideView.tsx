import React, { useState, useMemo } from 'react';
import {
  Compass,
  Send,
  Radio,
  Activity,
  Server,
  BookOpen,
  CheckCircle2,
  Wrench,
  Search,
  ArrowRight,
  Keyboard,
  Layers,
  Sparkles,
  FileText,
  CheckSquare,
  FolderKanban,
  ExternalLink,
  Cpu,
  Home,
  Globe,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { TOOLS_REGISTRY } from '@/registry/toolsRegistry';

type GuideTab =
  | 'overview'
  | 'api-client'
  | 'websocket'
  | 'sse'
  | 'graphql'
  | 'mock-server'
  | 'openapi'
  | 'testing'
  | 'utilities'
  | 'shortcuts'
  | 'global-standards';

export const DocsGuideView: React.FC = () => {
  const { setActiveView } = useWorkspace();
  const [activeTab, setActiveTab] = useState<GuideTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return TOOLS_REGISTRY;
    const q = searchQuery.toLowerCase();
    return TOOLS_REGISTRY.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="workspace-page" style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Hero Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-subtle) 100%)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '32px 36px',
          marginBottom: '28px',
          boxShadow: 'var(--shadow-sm)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: '720px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  color: 'var(--accent)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}
              >
                <Compass size={14} /> DevDesk Tour & Master Documentation
              </span>
              <span
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                100% Local-First
              </span>
            </div>

            <h1
              style={{
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                margin: '0 0 10px 0',
              }}
            >
              All-In-One Developer Workspace & API Desk
            </h1>
            <p
              style={{
                fontSize: '14px',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                margin: '0 0 20px 0',
              }}
            >
              DevDesk replaces scattered browser tabs and heavyweight desktop tools with a unified, private workbench.
              Build, mock, test, inspect, and document modern APIs (REST, GraphQL, WebSocket, SSE) alongside 15 essential developer utilities—with <strong>zero tracking</strong>, <strong>no cloud leaks</strong>, and <strong>100% local execution</strong>.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={() => setActiveView('api-client')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600 }}
              >
                <Send size={14} /> Launch API Client
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setActiveView('mock-server')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px' }}
              >
                <Server size={14} /> Local Mock Server
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setActiveView('websocket')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px' }}
              >
                <Radio size={14} /> WebSocket Stream
              </button>
            </div>
          </div>

          {/* Quick Pillars Widget */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              minWidth: '260px',
            }}
          >
            <div style={{ padding: '12px 14px', background: 'var(--bg-app)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>4 Protocols</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>REST, GraphQL, WS & SSE</div>
            </div>
            <div style={{ padding: '12px 14px', background: 'var(--bg-app)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>0% Telemetry</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Complete local privacy</div>
            </div>
            <div style={{ padding: '12px 14px', background: 'var(--bg-app)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#f59e0b' }}>15 Utilities</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>JWT, Regex, JSON, UUID</div>
            </div>
            <div style={{ padding: '12px 14px', background: 'var(--bg-app)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#6366f1' }}>Mock Server</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Zero-backend simulation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '12px',
          marginBottom: '28px',
          overflowX: 'auto',
        }}
      >
        {[
          { id: 'overview', label: '1. App Overview & Workflow', icon: Sparkles },
          { id: 'api-client', label: '2. REST API Client', icon: Send },
          { id: 'websocket', label: '3. WebSocket Client', icon: Radio },
          { id: 'sse', label: '4. Server-Sent Events', icon: Activity },
          { id: 'graphql', label: '5. GraphQL Explorer', icon: Cpu },
          { id: 'mock-server', label: '6. Local Mock Server', icon: Server },
          { id: 'openapi', label: '7. OpenAPI & Swagger', icon: BookOpen },
          { id: 'testing', label: '8. Assertions & Testing', icon: CheckCircle2 },
          { id: 'utilities', label: '9. 15 Daily Tools', icon: Wrench },
          { id: 'shortcuts', label: '10. Keyboard Shortcuts', icon: Keyboard },
          { id: 'global-standards', label: '11. Global Standards & Interop', icon: Globe },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as GuideTab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                border: 'none',
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & WORKFLOW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              How DevDesk Works: The Complete Developer Cycle
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              DevDesk connects every step of designing, developing, testing, and debugging APIs into a single seamless loop without context switching:
            </p>
          </div>

          {/* Workflow Diagram Card */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {[
                { step: '01', title: 'Import / Explore', desc: 'Import OpenAPI 3.0/3.1 specs or introspect GraphQL endpoints to explore schemas and docs.', icon: BookOpen, color: '#6366f1' },
                { step: '02', title: 'Organize & Configure', desc: 'Group requests into Collections and manage environment variables like {{base_url}} and tokens.', icon: Layers, color: '#3b82f6' },
                { step: '03', title: 'Execute & Stream', desc: 'Send REST calls, run GraphQL queries, maintain persistent WebSocket connections, or inspect SSE feeds.', icon: Send, color: '#10b981' },
                { step: '04', title: 'Mock & Simulate', desc: 'Create in-browser mock endpoints with parameterized paths and latency before your backend is ready.', icon: Server, color: '#f59e0b' },
                { step: '05', title: 'Automate & Assert', desc: 'Add declarative status, header, and JSONPath assertions to test responses with 0 eval security.', icon: CheckCircle2, color: '#8b5cf6' },
                { step: '06', title: 'Chain & Utility Tasks', desc: 'Extract tokens to environment variables and use 15 utilities (JWT, Regex, Diff, Hashes) on the fly.', icon: Wrench, color: '#ec4899' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    style={{
                      background: 'var(--bg-subtle)',
                      borderRadius: '10px',
                      padding: '18px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: item.color, letterSpacing: '0.05em' }}>
                        PHASE {item.step}
                      </span>
                      <Icon size={18} style={{ color: item.color }} />
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                      {item.title}
                    </h3>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Feature Matrix */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '14px', color: 'var(--text-primary)' }}>
              Core Workspace Modules
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              <div
                onClick={() => setActiveView('dashboard')}
                style={{ padding: '16px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Home size={16} style={{ color: 'var(--accent)' }} />
                  <strong style={{ fontSize: '14px' }}>Home Dashboard</strong>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Central control center showing quick statistics, launchpad shortcuts, priority tasks, and recent activity.
                </p>
              </div>

              <div
                onClick={() => setActiveView('scratchpad')}
                style={{ padding: '16px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <FileText size={16} style={{ color: '#3b82f6' }} />
                  <strong style={{ fontSize: '14px' }}>Scratchpad</strong>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Always-persisted auto-saving markdown and code notepad. Press <code>S</code> anytime to open.
                </p>
              </div>

              <div
                onClick={() => setActiveView('tasks')}
                style={{ padding: '16px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <CheckSquare size={16} style={{ color: '#10b981' }} />
                  <strong style={{ fontSize: '14px' }}>Tasks Management</strong>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Lightweight task tracker with priorities, status filters, and instant quick-create via <code>N</code>.
                </p>
              </div>

              <div
                onClick={() => setActiveView('projects')}
                style={{ padding: '16px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <FolderKanban size={16} style={{ color: '#f59e0b' }} />
                  <strong style={{ fontSize: '14px' }}>Project Workspaces</strong>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Group your API collections, tasks, notes, and mock servers by client or project context.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REST API CLIENT */}
      {activeTab === 'api-client' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0' }}>
                REST API Client: Professional HTTP Testing
              </h2>
              <button className="btn btn-primary" onClick={() => setActiveView('api-client')} style={{ fontSize: '12px' }}>
                Open in DevDesk <ExternalLink size={13} style={{ marginLeft: '4px' }} />
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Test RESTful APIs with flexible auth methods, JSON body formatting, variable interpolation, and multi-language code export.
            </p>
          </div>

          {/* VISUAL SNAPSHOT CARD: API Client */}
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* Snapshot Simulated Header */}
            <div
              style={{
                background: 'var(--bg-subtle)',
                padding: '10px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              </div>
              <span style={{ marginLeft: '8px', fontWeight: 600 }}>Visual Snapshot: API Client Request & Response Inspector</span>
            </div>

            {/* Snapshot Simulated Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* URL Bar Mock */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span
                  style={{
                    backgroundColor: '#10b981',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  GET
                </span>
                <div
                  style={{
                    flex: 1,
                    padding: '8px 14px',
                    borderRadius: '6px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{'{{base_url}}'}</span>
                  <span>/api/v1/orders/ORD-9021</span>
                </div>
                <span
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  Send (⌘↵)
                </span>
              </div>

              {/* Response Inspector Mock */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '14px',
                  background: 'var(--bg-app)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  padding: '14px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Request Details
                  </div>
                  <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div><strong>Authorization:</strong> Bearer {'{{auth_token}}'}</div>
                    <div><strong>Accept:</strong> application/json</div>
                    <div><strong>Environment:</strong> Production (https://api.devdesk.local)</div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Response Status
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                        200 OK
                      </span>
                      <span style={{ background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                        42ms
                      </span>
                      <span style={{ background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                        840 B
                      </span>
                    </div>
                  </div>

                  <pre
                    style={{
                      margin: 0,
                      background: 'var(--bg-card)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontFamily: 'monospace',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
{`{
  "orderId": "ORD-9021",
  "status": "processing",
  "total": 149.99,
  "currency": "USD"
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>1. Dynamic Variable Interpolation</div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Wrap any environment variable in double curly braces, like <code>{'{{base_url}}'}</code> or <code>{'{{token}}'}</code>. DevDesk resolves them safely at runtime.
              </p>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>2. Multi-Tab Request Workspace</div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Open multiple API requests concurrently in tabs. DevDesk automatically tracks unsaved state and restores tabs on reload.
              </p>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>3. Code Generation & cURL</div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Export any configured request to executable code in JavaScript (Fetch), Python (Requests), cURL, Go, or Rust via the Code Snippet panel.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WEBSOCKET CLIENT */}
      {activeTab === 'websocket' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0' }}>
                WebSocket Client: Real-Time Full-Duplex Streams
              </h2>
              <button className="btn btn-primary" onClick={() => setActiveView('websocket')} style={{ fontSize: '12px' }}>
                Open in DevDesk <ExternalLink size={13} style={{ marginLeft: '4px' }} />
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Connect to <code>ws://</code> and <code>wss://</code> servers with live connection metrics, automatic buffer capping, and frame-by-frame JSON inspection.
            </p>
          </div>

          {/* VISUAL SNAPSHOT CARD: WebSocket */}
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                background: 'var(--bg-subtle)',
                padding: '10px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              </div>
              <span style={{ marginLeft: '8px', fontWeight: 600 }}>Visual Snapshot: WebSocket Split Workspace</span>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* URL & Status */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div
                  style={{
                    flex: 1,
                    padding: '8px 14px',
                    borderRadius: '6px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                  }}
                >
                  wss://stream.devdesk.local/market/crypto
                </div>
                <span
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  ● Connected (18ms)
                </span>
                <span style={{ padding: '6px 14px', borderRadius: '6px', background: '#ef4444', color: '#fff', fontSize: '12px', fontWeight: 600 }}>
                  Disconnect
                </span>
              </div>

              {/* Message Feed Mock */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                <div style={{ background: 'var(--bg-app)', borderRadius: '8px', padding: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Frame Stream (500 limit protection)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', fontSize: '12px' }}>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>↓ IN</span>
                      <span style={{ fontFamily: 'monospace' }}>{'{"topic":"btc","price":94250.00}'}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>14:02:11</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '12px' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>↑ OUT</span>
                      <span style={{ fontFamily: 'monospace' }}>{'{"action":"subscribe","pair":"ETH"}'}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>14:02:15</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-app)', borderRadius: '8px', padding: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Message Composer
                  </div>
                  <pre style={{ margin: '0 0 10px 0', background: 'var(--bg-card)', padding: '8px', borderRadius: '6px', fontSize: '11.5px', fontFamily: 'monospace' }}>
{`{
  "action": "ping",
  "client": "DevDesk"
}`}
                  </pre>
                  <button className="btn btn-primary" style={{ width: '100%', fontSize: '12px' }}>
                    Send Payload (⌘↵)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>Connection Presets & History</div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Save named WebSocket endpoints inside Collections. Organize real-time notification streams alongside your REST routes.
              </p>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>Memory Leak Prevention</div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                High-throughput streams are capped at 500 retained frames with a 1-click **Clear Stream** button, keeping your browser fast and responsive.
              </p>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>JSON Tree & Path Inspector</div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Click any message to open the JSON inspector. Minify, pretty-print, or copy specific JSON paths with one click.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SSE CLIENT */}
      {activeTab === 'sse' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0' }}>
                Server-Sent Events (SSE) Client
              </h2>
              <button className="btn btn-primary" onClick={() => setActiveView('sse')} style={{ fontSize: '12px' }}>
                Open in DevDesk <ExternalLink size={13} style={{ marginLeft: '4px' }} />
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Subscribe to persistent HTTP event streams using native EventSource. Filter custom events, inspect structured telemetry, and monitor live streaming payloads.
            </p>
          </div>

          {/* VISUAL SNAPSHOT CARD: SSE */}
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                background: 'var(--bg-subtle)',
                padding: '10px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              </div>
              <span style={{ marginLeft: '8px', fontWeight: 600 }}>Visual Snapshot: Live EventSource Stream & Message Feed</span>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ background: '#3b82f6', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>SSE</span>
                <span style={{ fontFamily: 'monospace', fontSize: '13px', flex: 1, color: 'var(--text-primary)' }}>https://api.devdesk.local/v1/telemetry/stream</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} /> Connected (200 OK)
                </span>
              </div>

              <div style={{ background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 140px 1fr 80px', padding: '8px 14px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <span>TIME</span>
                  <span>EVENT TYPE</span>
                  <span>PAYLOAD (DATA)</span>
                  <span style={{ textAlign: 'right' }}>ACTION</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', fontSize: '12px', fontFamily: 'monospace' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 140px 1fr 80px', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>12:45:02.108</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>payment_succeeded</span>
                    <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`{"amount": 89.00, "customer": "cus_9942", "currency": "USD"}`}</span>
                    <span style={{ textAlign: 'right', color: 'var(--accent)', cursor: 'pointer', fontSize: '11px' }}>Copy</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 140px 1fr 80px', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center', background: 'rgba(99, 102, 241, 0.03)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>12:45:01.850</span>
                    <span style={{ color: '#6366f1', fontWeight: 600 }}>token_generated</span>
                    <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`{"token_id": "tok_live_7x", "expires_in": 3600}`}</span>
                    <span style={{ textAlign: 'right', color: 'var(--accent)', cursor: 'pointer', fontSize: '11px' }}>Copy</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 140px 1fr 80px', padding: '10px 14px', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>12:44:59.200</span>
                    <span style={{ color: 'var(--text-secondary)' }}>ping</span>
                    <span style={{ color: 'var(--text-muted)' }}>{`{"heartbeat": true, "timestamp": 1727786700}`}</span>
                    <span style={{ textAlign: 'right', color: 'var(--accent)', cursor: 'pointer', fontSize: '11px' }}>Copy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>SSE vs WebSocket: When to use which?</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Use <strong>WebSocket</strong> when you need bi-directional communication (chat, game actions). Use <strong>SSE</strong> for server-to-client push streams (AI tokens, metrics, stock tickers, notification feeds).
                </p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', borderRadius: '8px', padding: '16px', fontFamily: 'monospace', fontSize: '12px' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>// Sample SSE Stream Format Processed by DevDesk:</div>
              <div style={{ color: '#10b981' }}>event: payment_received</div>
              <div style={{ color: 'var(--text-secondary)' }}>id: evt-99214</div>
              <div style={{ color: 'var(--text-primary)' }}>data: {`{"amount": 49.00, "customer": "cus_123", "status": "succeeded"}`}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GRAPHQL EXPLORER */}
      {activeTab === 'graphql' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0' }}>
                GraphQL Explorer: Introspection & Visual Query Builder
              </h2>
              <button className="btn btn-primary" onClick={() => setActiveView('graphql')} style={{ fontSize: '12px' }}>
                Open in DevDesk <ExternalLink size={13} style={{ marginLeft: '4px' }} />
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Introspect remote schemas, click fields in the visual tree to auto-construct queries, and inspect clean <code>data</code> vs <code>errors</code>.
            </p>
          </div>

          {/* VISUAL SNAPSHOT CARD: GraphQL */}
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                background: 'var(--bg-subtle)',
                padding: '10px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              </div>
              <span style={{ marginLeft: '8px', fontWeight: 600 }}>Visual Snapshot: Schema Tree, Query Editor & Response Inspector</span>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: '#e11d48', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>GQL</span>
                <div style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', fontFamily: 'monospace', fontSize: '13px' }}>
                  https://api.spacex.land/graphql
                </div>
                <span style={{ background: 'var(--accent)', color: '#fff', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                  Introspect Schema
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 1fr', gap: '12px', minHeight: '210px' }}>
                {/* Schema Explorer */}
                <div style={{ background: 'var(--bg-subtle)', borderRadius: '8px', padding: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Schema Explorer (Query)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
                    <div style={{ color: 'var(--accent)', fontWeight: 600 }}>▾ launchesPast</div>
                    <div style={{ paddingLeft: '14px', color: '#10b981', cursor: 'pointer' }}>✓ id: ID</div>
                    <div style={{ paddingLeft: '14px', color: '#10b981', cursor: 'pointer' }}>✓ mission_name: String</div>
                    <div style={{ paddingLeft: '14px', color: 'var(--accent)', cursor: 'pointer' }}>▸ rocket: Rocket</div>
                    <div style={{ color: 'var(--text-muted)' }}>▸ dragons</div>
                    <div style={{ color: 'var(--text-muted)' }}>▸ ships</div>
                  </div>
                </div>

                {/* Query Editor */}
                <div style={{ background: 'var(--bg-app)', borderRadius: '8px', padding: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 600 }}>GRAPHQL DOCUMENT</span>
                    <span>Prettify</span>
                  </div>
                  <pre style={{ margin: 0, fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
{`query GetLaunches {
  launchesPast(limit: 2) {
    id
    mission_name
    rocket {
      rocket_name
    }
  }
}`}
                  </pre>
                </div>

                {/* Response View */}
                <div style={{ background: 'var(--bg-app)', borderRadius: '8px', padding: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px' }}>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>200 OK • 52ms</span>
                    <span style={{ color: 'var(--text-muted)' }}>1.2 kB</span>
                  </div>
                  <pre style={{ margin: 0, fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
{`{
  "data": {
    "launchesPast": [
      {
        "id": "109",
        "mission_name": "Starlink-15",
        "rocket": { "rocket_name": "Falcon 9" }
      }
    ]
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            <div style={{ background: 'var(--bg-card)', borderRadius: '10px', padding: '18px', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 8px 0', color: 'var(--accent)' }}>Live Schema Introspection</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                DevDesk queries <code>__schema</code> types and fields automatically. Filter public object types, inspect arguments, and explore available mutations and subscriptions.
              </p>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: '10px', padding: '18px', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 8px 0', color: '#10b981' }}>1-Click Query Builder</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Don't want to type GraphQL manually? In the Schema Explorer, clicking any field or type instantly generates a formatted, valid query document.
              </p>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: '10px', padding: '18px', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 8px 0', color: '#f59e0b' }}>Error Separation</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Clearly separates network/CORS issues, HTTP 4xx/5xx status errors, and GraphQL specification errors inside the <code>errors</code> array.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: LOCAL MOCK SERVER */}
      {activeTab === 'mock-server' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0' }}>
                Local Mock Server: Frontend Simulation Without Backend
              </h2>
              <button className="btn btn-primary" onClick={() => setActiveView('mock-server')} style={{ fontSize: '12px' }}>
                Open in DevDesk <ExternalLink size={13} style={{ marginLeft: '4px' }} />
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Simulate backend endpoints entirely inside your browser. Define parameterized routes, toggle status scenarios (200/400/404/500), and test latency.
            </p>
          </div>

          {/* VISUAL SNAPSHOT CARD: Mock Server */}
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                background: 'var(--bg-subtle)',
                padding: '10px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              </div>
              <span style={{ marginLeft: '8px', fontWeight: 600 }}>Visual Snapshot: Route Simulation & Multi-Scenario Selector</span>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ background: '#10b981', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>GET</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '13px' }}>/api/v1/users/:id</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Get User Profile</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>200 OK (Default)</span>
                  <span style={{ background: 'var(--bg-card)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>404 Not Found</span>
                  <span style={{ background: 'var(--bg-card)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>500 Error</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-app)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                  <span><strong>Simulated Delay:</strong> 150ms (Simulates real network travel)</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Header: x-devdesk-mock: true</span>
                </div>
                <pre style={{ margin: 0, background: 'var(--bg-card)', padding: '10px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace' }}>
{`{
  "id": 42,
  "name": "Jane Developer",
  "email": "jane@devdesk.local",
  "role": "Frontend Lead"
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: OPENAPI / SWAGGER */}
      {activeTab === 'openapi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0' }}>
                OpenAPI 3.0 & 3.1 Importer & Interactive Docs
              </h2>
              <button className="btn btn-primary" onClick={() => setActiveView('openapi-explorer')} style={{ fontSize: '12px' }}>
                Open in DevDesk <ExternalLink size={13} style={{ marginLeft: '4px' }} />
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Import Swagger/OpenAPI specs from JSON, YAML, or URLs. DevDesk auto-generates Collections, Environments, and browsable documentation.
            </p>
          </div>

          {/* VISUAL SNAPSHOT CARD: OpenAPI */}
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                background: 'var(--bg-subtle)',
                padding: '10px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              </div>
              <span style={{ marginLeft: '8px', fontWeight: 600 }}>Visual Snapshot: OpenAPI 3.1 Specification Explorer & Operations</span>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>Petstore Store API <span style={{ fontSize: '11px', background: 'var(--accent)', color: '#fff', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>v3.1.0</span></div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Parsed from Swagger YAML • 14 Endpoints • 4 Data Schemas</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderRadius: '4px', fontWeight: 600 }}>
                    Mapped Env: {'{{base_url}}'} = https://petstore3.swagger.io
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-app)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ background: '#10b981', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>GET</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>/pet/findByStatus</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Finds Pets by status tags</span>
                  </div>
                  <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>Open in API Client</button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-app)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ background: '#3b82f6', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>POST</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>/pet</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Add a new pet to store</span>
                  </div>
                  <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>Open in API Client</button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-app)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ background: '#ef4444', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>DELETE</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>/pet/:petId</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Deletes a pet by ID</span>
                  </div>
                  <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>Open in API Client</button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: '10px', padding: '18px', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 8px 0', color: 'var(--accent)' }}>Import from JSON, YAML, or URL</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Press <code>⌘⇧I</code> or click <strong>Import OpenAPI</strong>. Drag-and-drop a file or paste raw Swagger YAML.
              </p>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: '10px', padding: '18px', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 8px 0', color: '#10b981' }}>Automatic Collection Generation</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Every path and operation converts automatically into an executable ApiRequest with headers, query parameters, and JSON payloads.
              </p>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: '10px', padding: '18px', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 8px 0', color: '#f59e0b' }}>Servers to Environments</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Declared OpenAPI servers map directly to DevDesk Environments, populating <code>{'{{base_url}}'}</code> with production or staging URLs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: ASSERTIONS & TESTING */}
      {activeTab === 'testing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0' }}>
                API Assertions & Automated Testing (Zero eval)
              </h2>
              <button className="btn btn-primary" onClick={() => setActiveView('api-client')} style={{ fontSize: '12px' }}>
                Try in API Client <ExternalLink size={13} style={{ marginLeft: '4px' }} />
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Verify response status, headers, latency thresholds, and nested JSONPath values with synchronous, non-evaluating assertions.
            </p>
          </div>

          {/* VISUAL SNAPSHOT CARD: Assertions & Testing */}
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                background: 'var(--bg-subtle)',
                padding: '10px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              </div>
              <span style={{ marginLeft: '8px', fontWeight: 600 }}>Visual Snapshot: Test Runner Suite & Request Chaining</span>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                    ✓ 3 / 3 Assertions Passed
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Execution Time: 78ms</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>
                  Chaining Active: 1 Variable Extracted
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'monospace', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-app)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>✓ PASS</span>
                    <span>Status Code == 200</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Received: 200 OK</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-app)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>✓ PASS</span>
                    <span>Response Time &lt; 300ms</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Elapsed: 78ms</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-app)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>✓ PASS</span>
                    <span>JSONPath $.data.auth.token exists</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Found: "eyJhbGciOi..."</span>
                </div>
              </div>

              {/* Chaining preview bar */}
              <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '10px 14px', borderRadius: '6px', border: '1px dashed var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                <div>
                  <strong>Request Chaining:</strong> Extract <code>$.data.auth.token</code> → Write to <code>{'{{AUTH_TOKEN}}'}</code>
                </div>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Active in Environment</span>
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              padding: '20px',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 12px 0' }}>Supported Assertion Types</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              {[
                { type: 'Status Code Equals', example: 'ASSERT status == 200', desc: 'Validates exact HTTP status code returned.' },
                { type: 'Status in 2xx Range', example: 'ASSERT status in 200..299', desc: 'Validates successful operation.' },
                { type: 'Response Time Threshold', example: 'ASSERT response_time < 300ms', desc: 'Validates performance SLA.' },
                { type: 'JSONPath Exists', example: 'ASSERT $.data.user.id exists', desc: 'Recursively checks nested path existence.' },
                { type: 'JSONPath Equals Value', example: 'ASSERT $.active == true', desc: 'Checks boolean, number, or string match.' },
                { type: 'Header Exists / Equals', example: 'ASSERT header "content-type" equals "application/json"', desc: 'Case-insensitive header checks.' },
                { type: 'Body Contains Text', example: 'ASSERT body contains "success"', desc: 'Substring match in payload.' },
                { type: 'Request Chaining', example: 'Extract $.token -> {{AUTH_TOKEN}}', desc: 'Passes extracted token to next request.' },
              ].map((a, i) => (
                <div key={i} style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>{a.type}</div>
                  <code style={{ fontSize: '11.5px', color: 'var(--accent)', display: 'block', marginBottom: '4px' }}>{a.example}</code>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{a.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: 15 UTILITIES */}
      {activeTab === 'utilities' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0' }}>
                15 Built-In Daily Developer Utilities
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                All utilities run 100% locally in your browser. No strings, tokens, or files are ever sent to remote servers.
              </p>
            </div>

            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search utilities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 32px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => setActiveView('tool', { toolId: tool.id })}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.04em' }}>
                      {tool.category}
                    </span>
                    <ExternalLink size={12} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                    {tool.name}
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                    {tool.description}
                  </p>
                </div>
                <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--accent)', fontWeight: 500 }}>
                  Launch tool <ArrowRight size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 10: SHORTCUTS */}
      {activeTab === 'shortcuts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0' }}>
              Keyboard-First Shortcuts Cheat Sheet
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Navigate DevDesk and execute requests at the speed of thought without touching your mouse.
            </p>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Shortcut</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Action</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Scope</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: '⌘ + K (or Ctrl + K)', action: 'Open Global Command Palette & Tool Finder', scope: 'Anywhere' },
                  { key: '⌘ + Enter (or Ctrl + Enter)', action: 'Execute API Request / GraphQL Query / Send WS message', scope: 'API, GraphQL, WebSocket' },
                  { key: '⌘ + ⇧ + I (or Ctrl + Shift + I)', action: 'Open OpenAPI / Swagger Specification Importer', scope: 'Anywhere' },
                  { key: '⌥ + ← (or Alt + Left)', action: 'Navigate back to previous view', scope: 'Anywhere' },
                  { key: 'S', action: 'Quick-open persistent Scratchpad notes', scope: 'Global (outside inputs)' },
                  { key: 'N', action: 'Quick-focus New Task creation', scope: 'Global (outside inputs)' },
                  { key: '/', action: 'Trigger Command Palette search', scope: 'Global (outside inputs)' },
                  { key: 'Esc', action: 'Close modals, overlays, or search palettes', scope: 'Any open overlay' },
                ].map((s, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <code style={{ background: 'var(--bg-subtle)', padding: '4px 8px', borderRadius: '5px', fontWeight: 600, color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>
                        {s.key}
                      </code>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>{s.action}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{s.scope}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 11: GLOBAL STANDARDS & INTEROPERABILITY */}
      {activeTab === 'global-standards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              Enterprise Global Standards & Industry Interoperability
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              DevDesk implements world-class enterprise standards for developer workflows: native 7-language internationalization, lossless Postman v2.1 and HAR 1.2 interop, automated batch testing with JUnit XML, IndexedDB storage resilience, and in-browser Web Vitals telemetry.
            </p>
          </div>

          {/* Feature Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {/* i18n Card */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                  <Globe size={18} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Native 7-Language i18n</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Instant language switching with zero external dependencies. Supports <strong>English</strong>, <strong>Español</strong>, <strong>日本語</strong>, <strong>Deutsch</strong>, <strong>Français</strong>, <strong>简体中文</strong>, and <strong>हिन्दी</strong>.
              </p>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                • Typed formatters for dates, relative time, bytes, numbers<br />
                • Automated document root <code>&lt;html lang&gt;</code> synchronization<br />
                • Deterministic English fallback prevents broken labels
              </div>
            </div>

            {/* Interoperability Card */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  <Layers size={18} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Postman v2.1 & HAR 1.2 Interop</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Lossless two-way interoperability with standard tools. Import and export Postman collections with preserved variables, auth, and request payloads, or ingest Chrome/Firefox HAR 1.2 network recordings.
              </p>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                • Built-in dynamic macro resolution (<code>{`{{$guid}}`}</code>, <code>{`{{$timestamp}}`}</code>)<br />
                • Generate Postman environment files from active environments<br />
                • Export HAR archives for security audits and bug reports
              </div>
            </div>

            {/* Batch Runner Card */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                  <Zap size={18} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Collection Runner & JUnit XML</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Execute entire collections sequentially with live progress bars, statistical latency percentiles (min, max, avg, P95), and automated variable chaining across steps.
              </p>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                • 1-click <strong>JUnit XML</strong> export for GitHub Actions / GitLab CI<br />
                • Configurable inter-request delay to simulate realistic traffic<br />
                • Instant assertion evaluation across each batch request
              </div>
            </div>

            {/* Storage Resilience Card */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                  <ShieldCheck size={18} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Hybrid Storage & Quota Sentinel</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                High-capacity IndexedDB fallback engine (<code>DevDeskEnterpriseDB</code> v1) automatically safeguards against browser localStorage quota limits.
              </p>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                • Real-time storage meter via <code>navigator.storage.estimate()</code><br />
                • Automated LRU history pruning protects collections and configs<br />
                • Cryptographic SHA-256 signatures verify backup export integrity
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
