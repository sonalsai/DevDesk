import React, { useState, useMemo } from 'react';
import {
  FileCode,
  Check,
  Copy,
  Download,
  RotateCcw,
  Sparkles,
  ArrowRightLeft,
  Network,
  FolderTree,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useToast } from '@/hooks';
import {
  validateYaml,
  formatYaml,
  yamlToJson,
  jsonToYaml,
  buildConfigTree,
  type ConfigTreeNode,
} from '../../../services/config/yamlService';
import './yaml.css';

const DEFAULT_SAMPLE_YAML = `app:
  name: devdesk-api
  version: 2.4.0
  environment: production
  server:
    host: 0.0.0.0
    port: 8080
    timeout: 30s
  database:
    host: postgres.internal
    port: 5432
    name: devdesk_production
    username: devdesk_admin
    password: supersecretpassword123
  features:
    rateLimiting: true
    auditLogging: true
    jwtSecret: supersecretjwtkey991823
`;

export const YamlToolkitView: React.FC = () => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'editor' | 'convert' | 'tree' | 'templates'>('editor');
  const [yamlInput, setYamlInput] = useState<string>(DEFAULT_SAMPLE_YAML);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [indentSize, setIndentSize] = useState<number>(2);
  const [copied, setCopied] = useState(false);
  const [revealSecrets, setRevealSecrets] = useState(false);

  // Validation Result
  const validationResult = useMemo(() => {
    return validateYaml(yamlInput);
  }, [yamlInput]);

  // Tree nodes
  const configTree = useMemo(() => {
    if (!validationResult.isValid || !validationResult.data) return [];
    return buildConfigTree(validationResult.data);
  }, [validationResult]);

  const handleFormat = () => {
    try {
      const formatted = formatYaml(yamlInput, indentSize);
      setYamlInput(formatted);
      showToast('YAML formatted successfully', 'info');
    } catch {
      showToast('Cannot format: invalid YAML syntax', 'error');
    }
  };

  const handleConvertYamlToJson = () => {
    try {
      const json = yamlToJson(yamlInput, 2);
      setJsonInput(json);
      showToast('Converted YAML to JSON', 'info');
    } catch {
      showToast('Invalid YAML input', 'error');
    }
  };

  const handleConvertJsonToYaml = () => {
    try {
      const yaml = jsonToYaml(jsonInput);
      setYamlInput(yaml);
      showToast('Converted JSON to YAML', 'info');
    } catch {
      showToast('Invalid JSON input', 'error');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([yamlInput], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded config.yaml', 'info');
  };

  const renderTreeNode = (node: ConfigTreeNode) => {
    const hasChildren = node.children && node.children.length > 0;
    const isMasked = node.isSecret && !revealSecrets;

    return (
      <div key={node.path} className="yaml-tree-node">
        <span className="yaml-tree-key">{node.key}: </span>
        {hasChildren ? (
          <div>{node.children!.map((child) => renderTreeNode(child))}</div>
        ) : (
          <span className={node.isSecret ? 'yaml-tree-secret' : 'yaml-tree-val'}>
            {isMasked ? '••••••••••••' : String(node.value)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="yaml-toolkit">
      {/* Header */}
      <div className="yaml-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileCode size={22} color="var(--accent-color, #0ea5e9)" />
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>YAML Toolkit</h2>
          <span
            className={`yaml-status-chip ${validationResult.isValid ? 'running' : 'error'}`}
            style={{ fontSize: '0.75rem' }}
          >
            {validationResult.isValid ? 'Valid YAML' : 'Syntax Error'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="yaml-action-btn" onClick={handleFormat}>
            <Sparkles size={12} />
            Format
          </button>
          <button className="yaml-action-btn" onClick={() => handleCopy(yamlInput)}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
            Copy
          </button>
          <button className="yaml-action-btn" onClick={handleDownload}>
            <Download size={12} />
            Download
          </button>
          <button className="yaml-action-btn" onClick={() => setYamlInput('')}>
            <RotateCcw size={12} />
            Clear
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="yaml-tabs-bar">
        <button
          className={`yaml-tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
          onClick={() => setActiveTab('editor')}
        >
          <FileCode size={15} />
          Editor & Validator
        </button>
        <button
          className={`yaml-tab-btn ${activeTab === 'convert' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('convert');
            if (!jsonInput && validationResult.isValid) {
              setJsonInput(yamlToJson(yamlInput, 2));
            }
          }}
        >
          <ArrowRightLeft size={15} />
          YAML ↔ JSON
        </button>
        <button
          className={`yaml-tab-btn ${activeTab === 'tree' ? 'active' : ''}`}
          onClick={() => setActiveTab('tree')}
        >
          <FolderTree size={15} />
          Structure Inspector
        </button>
        <button
          className={`yaml-tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <Network size={15} />
          Starter Templates
        </button>
      </div>

      {/* Content */}
      <div className="yaml-content">
        {activeTab === 'editor' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8125rem' }}>
                <span>Indent:</span>
                <select
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                    padding: '2px 8px',
                  }}
                  value={indentSize}
                  onChange={(e) => setIndentSize(parseInt(e.target.value, 10))}
                >
                  <option value={2}>2 Spaces</option>
                  <option value={4}>4 Spaces</option>
                </select>
              </div>

              {!validationResult.isValid && validationResult.error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '0.8125rem' }}>
                  <AlertCircle size={14} />
                  Line {validationResult.error.line}, Col {validationResult.error.column}: {validationResult.error.message}
                </div>
              )}
            </div>

            <div className="yaml-panel" style={{ flex: 1 }}>
              <textarea
                className="yaml-textarea"
                placeholder="Enter or paste YAML configuration..."
                value={yamlInput}
                onChange={(e) => setYamlInput(e.target.value)}
              />
            </div>
          </div>
        )}

        {activeTab === 'convert' && (
          <div className="yaml-editor-grid">
            <div className="yaml-panel">
              <div className="yaml-panel-header">
                <span>YAML</span>
                <button className="yaml-action-btn primary" onClick={handleConvertYamlToJson}>
                  Convert to JSON →
                </button>
              </div>
              <textarea
                className="yaml-textarea"
                value={yamlInput}
                onChange={(e) => setYamlInput(e.target.value)}
                placeholder="YAML source..."
              />
            </div>

            <div className="yaml-panel">
              <div className="yaml-panel-header">
                <span>JSON</span>
                <button className="yaml-action-btn primary" onClick={handleConvertJsonToYaml}>
                  ← Convert to YAML
                </button>
              </div>
              <textarea
                className="yaml-textarea"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="JSON output / input..."
              />
            </div>
          </div>
        )}

        {activeTab === 'tree' && (
          <div className="yaml-panel" style={{ height: '100%' }}>
            <div className="yaml-panel-header">
              <span>Configuration Hierarchy</span>
              <button
                className="yaml-action-btn"
                onClick={() => setRevealSecrets((prev) => !prev)}
                title={revealSecrets ? 'Mask secrets' : 'Reveal secrets'}
              >
                {revealSecrets ? <EyeOff size={13} /> : <Eye size={13} />}
                {revealSecrets ? 'Mask Secrets' : 'Reveal Secrets'}
              </button>
            </div>
            <div className="yaml-tree-container">
              {validationResult.isValid && configTree.length > 0 ? (
                configTree.map((node) => renderTreeNode(node))
              ) : (
                <div style={{ color: '#ef4444', padding: '12px' }}>
                  Invalid YAML. Please fix syntax errors in the editor to inspect tree structure.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            <div className="yaml-card">
              <div className="yaml-card-title">Microservice API Stack</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Full application configuration with service host, database connection, and secret parameters.
              </div>
              <button
                className="yaml-action-btn primary"
                onClick={() => {
                  setYamlInput(DEFAULT_SAMPLE_YAML);
                  setActiveTab('editor');
                  showToast('Loaded Microservice API template', 'info');
                }}
              >
                Load Template
              </button>
            </div>

            <div className="yaml-card">
              <div className="yaml-card-title">Kubernetes Deployment</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Kubernetes v1 Deployment with 3 replicas, readiness probe, and resource limits.
              </div>
              <button
                className="yaml-action-btn primary"
                onClick={() => {
                  setYamlInput(`apiVersion: apps/v1
kind: Deployment
metadata:
  name: devdesk-api-deployment
  labels:
    app: devdesk-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: devdesk-api
  template:
    metadata:
      labels:
        app: devdesk-api
    spec:
      containers:
      - name: devdesk-api
        image: node:22-alpine
        ports:
        - containerPort: 3000
        resources:
          limits:
            cpu: "500m"
            memory: "512Mi"
          requests:
            cpu: "100m"
            memory: "128Mi"
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
`);
                  setActiveTab('editor');
                  showToast('Loaded Kubernetes Deployment template', 'info');
                }}
              >
                Load Template
              </button>
            </div>

            <div className="yaml-card">
              <div className="yaml-card-title">GitHub Actions CI Workflow</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Automated continuous integration pipeline testing TypeScript, linting, and building.
              </div>
              <button
                className="yaml-action-btn primary"
                onClick={() => {
                  setYamlInput(`name: DevDesk CI Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js 22.x
        uses: actions/setup-node@v4
        with:
          node-version: 22.x
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
`);
                  setActiveTab('editor');
                  showToast('Loaded GitHub Actions CI template', 'info');
                }}
              >
                Load Template
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
