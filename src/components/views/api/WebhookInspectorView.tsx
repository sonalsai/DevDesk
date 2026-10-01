import React, { useState } from 'react';
import {
  Webhook,
  Play,
  RotateCcw,
  Copy,
  Trash2,
  Clock,
  Radio,
  Check,
} from 'lucide-react';
import { useWorkspace } from '@/hooks';
import { useToast } from '@/hooks';
import type { WebhookEvent, WebhookSession } from '../../../types/api';

export const WebhookInspectorView: React.FC = () => {
  const {
    data,
    addWebhookEvent,
    clearWebhookEvents,
    createWebhookSession,
    createNewTab,
    setActiveView,
  } = useWorkspace();

  const { showToast } = useToast();

  const sessions: WebhookSession[] = data.webhookSessions || [];
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    sessions.length > 0 ? sessions[0].id : ''
  );

  const currentSession =
    sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'query' | 'raw'>('body');

  // Sample payloads for local testing
  const [sampleEvent, setSampleEvent] = useState<'stripe' | 'github' | 'custom'>('stripe');

  const selectedEvent =
    currentSession?.events.find((r) => r.id === selectedEventId) ||
    currentSession?.events[0] ||
    null;

  const endpointUrl = currentSession
    ? `https://devdesk.local/webhooks/${currentSession.token}`
    : 'https://devdesk.local/webhooks/wh_session_local';

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(endpointUrl);
    setCopiedUrl(true);
    showToast('Webhook endpoint URL copied to clipboard', 'info', 1500);
    setTimeout(() => setCopiedUrl(false), 1500);
  };

  // Dispatch a developer test webhook event (clearly labeled as local test)
  const handleDispatchLocalTest = () => {
    let session = currentSession;
    if (!session) {
      session = createWebhookSession('Default Webhooks');
      setSelectedSessionId(session.id);
    }

    let payload: any = {};
    let eventHeaders: Record<string, string> = {
      'content-type': 'application/json',
      'user-agent': 'DevDesk-Webhook-Simulator/1.0',
    };
    let method = 'POST';

    if (sampleEvent === 'stripe') {
      eventHeaders['stripe-signature'] = 't=1690000000,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd';
      payload = {
        id: `evt_${Date.now()}`,
        object: 'event',
        api_version: '2023-10-16',
        created: Math.floor(Date.now() / 1000),
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: `pi_${Date.now()}`,
            amount: 4900,
            currency: 'usd',
            status: 'succeeded',
            customer: 'cus_DevDeskTest123',
          },
        },
      };
    } else if (sampleEvent === 'github') {
      eventHeaders['x-github-event'] = 'push';
      eventHeaders['x-github-delivery'] = `del_${Date.now()}`;
      payload = {
        ref: 'refs/heads/main',
        before: '6113728f27ae82c7b1a12f6593b49d9c894f037e',
        after: '2c53a13484e302edce4b021eb8660e5d42dd2432',
        repository: {
          id: 1296269,
          name: 'DevDesk',
          full_name: 'developer/DevDesk',
          private: false,
        },
        pusher: {
          name: 'developer',
          email: 'dev@example.com',
        },
      };
    } else {
      payload = {
        timestamp: new Date().toISOString(),
        event: 'user.signup',
        user: {
          id: 'usr_98124',
          email: 'alex@example.com',
          role: 'developer',
        },
      };
    }

    const bodyString = JSON.stringify(payload, null, 2);

    addWebhookEvent(session.id, {
      sessionId: session.id,
      method,
      url: `${endpointUrl}?source=local_simulator`,
      headers: eventHeaders,
      query: { source: 'local_simulator' },
      body: bodyString,
      contentType: 'application/json',
      status: 200,
    });

    showToast(`Test ${sampleEvent.toUpperCase()} webhook delivered locally`, 'success', 1500);
  };

  // Replay captured webhook payload in API Client
  const handleReplayInApiClient = (ev: WebhookEvent) => {
    createNewTab({
      name: `Replay: Webhook (${ev.id.slice(-6)})`,
      method: ev.method as any,
      url: ev.url,
      params: Object.entries(ev.query || {}).map(([k, v]) => ({
        id: `p-${Date.now()}-${Math.random()}`,
        key: k,
        value: String(v),
        enabled: true,
      })),
      headers: Object.entries(ev.headers).map(([k, v]) => ({
        id: `h-${Date.now()}-${Math.random()}`,
        key: k,
        value: String(v),
        enabled: true,
      })),
      body: {
        type: 'json',
        rawText: '',
        jsonContent: ev.body,
        formParams: [],
        multipartParams: [],
      },
      auth: { type: 'none' },
    });

    setActiveView('api-client');
    showToast('Webhook payload loaded into API Client tab', 'info', 1500);
  };

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Session Header Card */}
      <div
        className="card"
        style={{
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          background: 'var(--bg-surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Webhook size={18} style={{ color: 'var(--accent-hover)' }} />
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Webhook Inspector</h2>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Inspect incoming payloads, verify signatures, headers, and replay to API client.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 12,
                backgroundColor: 'rgba(52, 152, 219, 0.15)',
                color: 'var(--info)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Radio size={12} /> Local Test & Relay Mode
            </span>

            {currentSession && currentSession.events.length > 0 && (
              <button
                className="btn btn-sm btn-danger"
                onClick={() => clearWebhookEvents(currentSession.id)}
              >
                <Trash2 size={12} />
                <span>Clear Requests</span>
              </button>
            )}
          </div>
        </div>

        {/* Endpoint Bar & Simulator Control */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '8px 12px',
            backgroundColor: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 260 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Endpoint:</span>
            <code style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent-hover)' }}>
              {endpointUrl}
            </code>
            <button className="btn btn-sm btn-ghost" onClick={handleCopyEndpoint} title="Copy webhook URL">
              {copiedUrl ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Simulate:</span>
            <select
              className="input-select"
              value={sampleEvent}
              onChange={(e) => setSampleEvent(e.target.value as any)}
              style={{ height: 26, fontSize: 11, width: 130 }}
            >
              <option value="stripe">Stripe Payment</option>
              <option value="github">GitHub Push</option>
              <option value="custom">User Signup</option>
            </select>
            <button className="btn btn-sm btn-primary" onClick={handleDispatchLocalTest}>
              <Play size={11} />
              <span>Send Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Inspector View */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, minHeight: '520px' }}>
        {/* Left Column: Timeline of Received Webhooks */}
        <div
          className="card"
          style={{
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Captured Requests ({currentSession?.events.length || 0})
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {currentSession && currentSession.events.map((ev) => {
              const isSelected = (selectedEvent?.id || currentSession.events[0]?.id) === ev.id;

              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEventId(ev.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    backgroundColor: isSelected ? 'var(--bg-elevated)' : 'transparent',
                    border: isSelected ? '1px solid var(--border-subtle)' : '1px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: 3,
                          backgroundColor: 'rgba(52, 152, 219, 0.15)',
                          color: 'var(--accent-hover)',
                        }}
                      >
                        {ev.method}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)' }}>
                        {ev.status}
                      </span>
                    </div>

                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={10} />
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                      {ev.headers['x-github-event'] ? `GitHub: ${ev.headers['x-github-event']}` : ev.headers['stripe-signature'] ? 'Stripe Event' : ev.contentType}
                    </span>
                    <span>{(new Blob([ev.body]).size / 1024).toFixed(2)} KB</span>
                  </div>
                </div>
              );
            })}

            {(!currentSession || currentSession.events.length === 0) && (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 24,
                  textAlign: 'center',
                  color: 'var(--text-tertiary)',
                  gap: 8,
                }}
              >
                <Radio size={28} />
                <span style={{ fontSize: 12 }}>Waiting for requests...</span>
                <span style={{ fontSize: 11 }}>
                  Click "Send Test" above to dispatch a local webhook payload.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Request Details Inspector */}
        <div
          className="card"
          style={{
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            background: 'var(--bg-surface)',
          }}
        >
          {selectedEvent ? (
            <>
              {/* Request Metadata Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      backgroundColor: 'rgba(52, 152, 219, 0.15)',
                      color: 'var(--accent-hover)',
                    }}
                  >
                    {selectedEvent.method}
                  </span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {selectedEvent.url}
                  </span>
                </div>

                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleReplayInApiClient(selectedEvent)}
                  title="Replay in API Client"
                >
                  <RotateCcw size={12} />
                  <span>Replay in API Client</span>
                </button>
              </div>

              {/* Sub-tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', gap: 8 }}>
                {(['body', 'headers', 'query', 'raw'] as const).map((tab) => (
                  <button
                    key={tab}
                    className={`btn-subtab ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: activeTab === tab ? 'var(--accent-hover)' : 'var(--text-secondary)',
                      borderBottom: activeTab === tab ? '2px solid var(--accent-hover)' : '2px solid transparent',
                      textTransform: 'capitalize',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {activeTab === 'body' && (
                  <pre
                    className="tool-editor-area"
                    style={{
                      margin: 0,
                      minHeight: 280,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      borderRadius: 'var(--radius-sm)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {selectedEvent.body}
                  </pre>
                )}

                {activeTab === 'raw' && (
                  <pre
                    className="tool-editor-area"
                    style={{
                      margin: 0,
                      minHeight: 280,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      borderRadius: 'var(--radius-sm)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {selectedEvent.body}
                  </pre>
                )}

                {activeTab === 'headers' && (
                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    {Object.entries(selectedEvent.headers).map(([key, val], idx) => (
                      <div
                        key={key}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '200px 1fr',
                          gap: 8,
                          padding: '6px 10px',
                          fontSize: 12,
                          fontFamily: 'var(--font-mono)',
                          borderBottom: '1px solid var(--border-subtle)',
                          background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                        }}
                      >
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{key}:</span>
                        <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{String(val)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'query' && (
                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    {Object.entries(selectedEvent.query || {}).map(([key, val], idx) => (
                      <div
                        key={key}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '160px 1fr',
                          gap: 8,
                          padding: '6px 10px',
                          fontSize: 12,
                          fontFamily: 'var(--font-mono)',
                          borderBottom: '1px solid var(--border-subtle)',
                          background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                        }}
                      >
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{key}:</span>
                        <span style={{ color: 'var(--text-primary)' }}>{String(val)}</span>
                      </div>
                    ))}
                    {Object.keys(selectedEvent.query || {}).length === 0 && (
                      <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>
                        No query parameters received.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-tertiary)',
                gap: 8,
              }}
            >
              <Webhook size={32} />
              <span>Select a webhook from the timeline to inspect its payload and headers.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
