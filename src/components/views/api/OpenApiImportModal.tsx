import React, { useState } from 'react';
import {
  X,
  Upload,
  FileCode,
  Globe,
  AlertTriangle,
  CheckCircle,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useToast } from '@/hooks/useToast';
import {
  parseOpenApiSpec,
  generateCollectionFromSpec,
  mapServersToEnvironments,
} from '@/services/openApiParser';
import type { OpenApiSpecification, ApiRequest, Environment } from '@/types/api';

interface OpenApiImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (spec: OpenApiSpecification) => void;
}

export const OpenApiImportModal: React.FC<OpenApiImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const { addCollection, addApiRequest, addEnvironment, addOpenApiDocument } = useWorkspace();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'paste' | 'file' | 'url'>('paste');
  const [rawContent, setRawContent] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Parsed validation result
  const [parsedSpec, setParsedSpec] = useState<OpenApiSpecification | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Import options
  const [createCollection, setCreateCollection] = useState(true);
  const [mapEnvironments, setMapEnvironments] = useState(true);

  if (!isOpen) return null;

  const handleValidate = (content: string) => {
    setParseError(null);
    setParsedSpec(null);

    if (!content.trim()) return;

    try {
      const res = parseOpenApiSpec(content);
      if (res.errors && res.errors.length > 0) {
        setParseError(res.errors.join('; '));
        setParsedSpec(null);
      } else {
        setParsedSpec(res.specification);
      }
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse OpenAPI document');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawContent(content);
      handleValidate(content);
    };
    reader.readAsText(file);
  };

  const handleFetchUrl = async () => {
    if (!urlInput.trim()) return;
    setIsValidating(true);
    setParseError(null);

    try {
      const res = await fetch(urlInput, { cache: 'no-cache' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const text = await res.text();
      setRawContent(text);
      handleValidate(text);
      showToast('OpenAPI document fetched successfully', 'success', 2000);
    } catch (err: any) {
      setParseError(
        `Failed to fetch from URL (${err.message}). Ensure CORS headers allow browser requests, or copy and paste the raw specification text instead.`
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmImport = () => {
    if (!parsedSpec) return;

    // 1. Save document to OpenAPI explorer registry
    addOpenApiDocument({
      name: parsedSpec.title || 'Imported API',
      spec: parsedSpec,
      sourceType: activeTab,
      sourceUrl: activeTab === 'url' ? urlInput : undefined,
    });

    // 2. Generate collection & requests if opted
    if (createCollection) {
      const generated = generateCollectionFromSpec(parsedSpec);
      const createdCol = addCollection({
        name: generated.collection.name,
        description: generated.collection.description,
        isFavorite: false,
      });

      generated.requests.forEach((req: ApiRequest) => {
        addApiRequest({
          ...req,
          collectionId: createdCol.id,
        });
      });
    }

    // 3. Map servers to environments if opted
    if (mapEnvironments && parsedSpec.servers.length > 0) {
      const envs = mapServersToEnvironments(parsedSpec);
      envs.forEach((env: Environment) => {
        addEnvironment({
          name: env.name,
          description: env.description,
          isDefault: false,
          variables: env.variables,
        });
      });
    }

    showToast(`Successfully imported "${parsedSpec.title}"`, 'success', 2500);
    onImportComplete?.(parsedSpec);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileCode size={20} style={{ color: 'var(--accent)' }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Import OpenAPI / Swagger
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Supports OpenAPI 3.0 & 3.1 specifications (JSON or YAML)
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs for Import Source */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-card)',
            padding: '0 20px',
          }}
        >
          {(['paste', 'file', 'url'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setParseError(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'capitalize',
                backgroundColor: 'transparent',
                color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >
              {tab === 'paste' && <FileCode size={13} />}
              {tab === 'file' && <Upload size={13} />}
              {tab === 'url' && <Globe size={13} />}
              {tab === 'paste' ? 'Paste Text' : tab === 'file' ? 'Local File' : 'From URL'}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {activeTab === 'paste' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                Paste OpenAPI JSON or YAML
              </label>
              <textarea
                value={rawContent}
                onChange={(e) => {
                  setRawContent(e.target.value);
                  handleValidate(e.target.value);
                }}
                placeholder="openapi: 3.0.0&#10;info:&#10;  title: Sample Pet Store&#10;  version: 1.0.0&#10;paths:&#10;  /pets:&#10;    get: ..."
                style={{
                  width: '100%',
                  height: 180,
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 10,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>
          )}

          {activeTab === 'file' && (
            <div
              style={{
                border: '2px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '30px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                backgroundColor: 'var(--bg-card)',
                cursor: 'pointer',
              }}
              onClick={() => document.getElementById('openapi-file-input')?.click()}
            >
              <Upload size={32} style={{ color: 'var(--accent)' }} />
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {fileName ? fileName : 'Choose an OpenAPI .json, .yaml, or .yml file'}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Click to browse files from your computer
              </span>
              <input
                id="openapi-file-input"
                type="file"
                accept=".json,.yaml,.yml"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </div>
          )}

          {activeTab === 'url' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                OpenAPI Specification URL
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://petstore.swagger.io/v2/swagger.json"
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFetchUrl();
                  }}
                />
                <button
                  onClick={handleFetchUrl}
                  disabled={isValidating}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    backgroundColor: 'var(--accent)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: isValidating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isValidating ? <RefreshCw size={13} className="animate-spin" /> : <Globe size={13} />}
                  Fetch
                </button>
              </div>
            </div>
          )}

          {/* Validation Feedback & Specification Card */}
          {parseError && (
            <div
              style={{
                padding: 12,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                border: '1px solid var(--danger)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                fontSize: 12,
                color: 'var(--text-primary)',
              }}
            >
              <AlertTriangle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong style={{ color: 'var(--danger)' }}>Specification Validation Error:</strong>
                <p style={{ margin: '4px 0 0', lineHeight: 1.4 }}>{parseError}</p>
              </div>
            </div>
          )}

          {parsedSpec && (
            <div
              style={{
                padding: 14,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--success)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={18} color="var(--success)" />
                  <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                    {parsedSpec.title} (v{parsedSpec.version})
                  </strong>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    backgroundColor: 'rgba(46, 204, 113, 0.15)',
                    color: 'var(--success)',
                    padding: '2px 8px',
                    borderRadius: 12,
                  }}
                >
                  OpenAPI {parsedSpec.openapiVersion}
                </span>
              </div>

              {parsedSpec.description && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {parsedSpec.description}
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  padding: '8px 10px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Operations: </span>
                  <strong style={{ color: 'var(--text-primary)' }}>{parsedSpec.operations.length}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Servers: </span>
                  <strong style={{ color: 'var(--text-primary)' }}>{parsedSpec.servers.length}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Schemas: </span>
                  <strong style={{ color: 'var(--text-primary)' }}>{Object.keys(parsedSpec.schemas).length}</strong>
                </div>
              </div>

              {/* Import Options Checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={createCollection}
                    onChange={(e) => setCreateCollection(e.target.checked)}
                  />
                  <span>Create DevDesk Collection with all {parsedSpec.operations.length} requests</span>
                </label>
                {parsedSpec.servers.length > 0 && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={mapEnvironments}
                      onChange={(e) => setMapEnvironments(e.target.checked)}
                    />
                    <span>Map {parsedSpec.servers.length} server URLs to DevDesk Environments</span>
                  </label>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '12px 20px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            gap: 10,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={!parsedSpec}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 18px',
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              fontWeight: 600,
              cursor: !parsedSpec ? 'not-allowed' : 'pointer',
              opacity: !parsedSpec ? 0.6 : 1,
            }}
          >
            <FileCheck size={14} /> Import Specification
          </button>
        </div>
      </div>
    </div>
  );
};
