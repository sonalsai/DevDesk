import React, { useState, useRef } from 'react';
import {
  Play,
  Square,
  CheckCircle2,
  XCircle,
  Download,
  FileCode,
  X,
  Activity,
} from 'lucide-react';
import type { ApiCollection, ApiRequest, Environment } from '../../../types/api';
import {
  runBatchCollection,
  generateJUnitXmlReport,
  type BatchRunSummary,
  type BatchItemResult,
} from '../../../services/collectionRunner';
import { useTranslation } from '../../../hooks/useTranslation';

export interface CollectionRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: ApiCollection;
  requests: ApiRequest[];
  environment?: Environment;
}

export const CollectionRunnerModal: React.FC<CollectionRunnerModalProps> = ({
  isOpen,
  onClose,
  collection,
  requests,
  environment,
}) => {
  const { t } = useTranslation();
  const [isRunning, setIsRunning] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [results, setResults] = useState<BatchItemResult[]>([]);
  const [summary, setSummary] = useState<BatchRunSummary | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  if (!isOpen) return null;

  const totalCount = requests.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleStartRun = async () => {
    setIsRunning(true);
    setResults([]);
    setCompletedCount(0);
    setSummary(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const runSummary = await runBatchCollection({
        collectionId: collection.id,
        collectionName: collection.name,
        requests,
        environment,
        delayBetweenRequestsMs: 60,
        signal: controller.signal,
        onProgress: (completed, _total, currentResult) => {
          setCompletedCount(completed);
          setResults((prev) => [...prev, currentResult]);
        },
      });

      setSummary(runSummary);
    } catch {
      // Handled inside runner
    } finally {
      setIsRunning(false);
    }
  };

  const handleStopRun = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRunning(false);
  };

  const downloadJsonReport = () => {
    if (!summary) return;
    const jsonStr = JSON.stringify(summary, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devdesk-run-${collection.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJUnitReport = () => {
    if (!summary) return;
    const xmlStr = generateJUnitXmlReport(summary);
    const blob = new Blob([xmlStr], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `junit-${collection.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-container"
        style={{ maxWidth: 860, width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={20} style={{ color: 'var(--accent)' }} />
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                {t('api.batchRunner')}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {collection.name} • {requests.length} Requests • Environment:{' '}
                {environment ? environment.name : 'Default'}
              </p>
            </div>
          </div>

          <button className="btn-icon" onClick={onClose} aria-label={t('common.close')}>
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {/* Progress Section */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                Progress: {completedCount} / {totalCount} ({progressPct}%)
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {!isRunning ? (
                  <button className="btn btn-primary btn-sm" onClick={handleStartRun} disabled={requests.length === 0}>
                    <Play size={13} />
                    <span>Start Test Run</span>
                  </button>
                ) : (
                  <button className="btn btn-danger btn-sm" onClick={handleStopRun}>
                    <Square size={13} />
                    <span>Stop Execution</span>
                  </button>
                )}
              </div>
            </div>

            {/* Animated Progress Bar */}
            <div
              style={{
                height: 8,
                background: 'var(--bg-sunken)',
                borderRadius: 999,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressPct}%`,
                  background: isRunning
                    ? 'linear-gradient(90deg, var(--accent) 0%, var(--brand-sky) 100%)'
                    : 'var(--success)',
                  transition: 'width 200ms ease',
                }}
              />
            </div>
          </div>

          {/* Metrics Summary Cards */}
          {summary && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 12,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Passed</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>
                  {summary.passedRequests} / {summary.totalRequests}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 12,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Failed</div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: summary.failedRequests > 0 ? 'var(--danger)' : 'var(--text-muted)',
                  }}
                >
                  {summary.failedRequests}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 12,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Assertions</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
                  {summary.passedAssertions} / {summary.totalAssertions}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 12,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Avg Latency</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {summary.avgLatencyMs} ms
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 12,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>P95 Latency</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {summary.p95LatencyMs} ms
                </div>
              </div>
            </div>
          )}

          {/* Results Table */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '70px 1fr 90px 90px 80px',
                padding: '10px 14px',
                background: 'var(--bg-sunken)',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span>Method</span>
              <span>Request</span>
              <span>Status</span>
              <span>Latency</span>
              <span>Assertions</span>
            </div>

            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {results.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                  Click &quot;Start Test Run&quot; to execute all {requests.length} requests sequentially.
                </div>
              ) : (
                results.map((res, idx) => (
                  <div
                    key={`${res.requestId}-${idx}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '70px 1fr 90px 90px 80px',
                      padding: '8px 14px',
                      alignItems: 'center',
                      fontSize: 12,
                      borderBottom: '1px solid var(--border-subtle)',
                      background: !res.passed ? 'var(--danger-subtle)' : 'transparent',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color:
                          res.method === 'GET'
                            ? 'var(--success)'
                            : res.method === 'POST'
                            ? 'var(--accent)'
                            : res.method === 'DELETE'
                            ? 'var(--danger)'
                            : 'var(--warning)',
                      }}
                    >
                      {res.method}
                    </span>

                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{res.name}</span>
                      {res.error && (
                        <div style={{ fontSize: 10, color: 'var(--danger)', marginTop: 2 }}>{res.error}</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {res.passed ? (
                        <CheckCircle2 size={13} style={{ color: 'var(--success)' }} />
                      ) : (
                        <XCircle size={13} style={{ color: 'var(--danger)' }} />
                      )}
                      <span style={{ fontSize: 11 }}>{res.status > 0 ? res.status : 'ERR'}</span>
                    </div>

                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {res.timeMs} ms
                    </span>

                    <span style={{ fontSize: 11 }}>
                      {res.assertionResults.length > 0 ? (
                        <span
                          style={{
                            color: res.assertionResults.every((a) => a.passed)
                              ? 'var(--success)'
                              : 'var(--danger)',
                          }}
                        >
                          {res.assertionResults.filter((a) => a.passed).length}/{res.assertionResults.length}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer with Report Exports */}
        <div
          className="modal-footer"
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            {summary && (
              <>
                <button className="btn btn-secondary btn-sm" onClick={downloadJsonReport}>
                  <Download size={13} />
                  <span>Export JSON Report</span>
                </button>
                <button className="btn btn-secondary btn-sm" onClick={downloadJUnitReport}>
                  <FileCode size={13} />
                  <span>Export JUnit XML (CI/CD)</span>
                </button>
              </>
            )}
          </div>

          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <span>{t('common.close')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
