import React, { useState } from 'react';
import {
  FolderPlus,
  Plus,
  Trash2,
  Copy,
  Edit2,
  Star,
  ExternalLink,
  History,
  Folder,
  Search,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useToast } from '../../../context/ToastContext';
import type { ApiHistoryItem } from '../../../types/api';

export const CollectionsManagerView: React.FC = () => {
  const {
    data,
    addCollection,
    updateCollection,
    deleteCollection,
    addApiRequest,
    updateApiRequest,
    deleteApiRequest,
    duplicateApiRequest,
    clearApiHistory,
    deleteApiHistoryItem,
    openRequestInTab,
    createNewTab,
    setActiveView,
  } = useWorkspace();

  const { showToast } = useToast();

  const collections = data.apiCollections || [];
  const allRequests = data.apiRequests || [];
  const apiHistory = data.apiHistory || [];

  const [mainTab, setMainTab] = useState<'collections' | 'history'>('collections');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(
    collections.length > 0 ? collections[0].id : null
  );

  // New collection modal / inline state
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollName, setNewCollName] = useState('');
  const [newCollDesc, setNewCollDesc] = useState('');
  const [newCollProjectId, setNewCollProjectId] = useState<string>('');

  // Search filter
  const [searchFilter, setSearchFilter] = useState('');

  // Editing request name inline
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [editingRequestName, setEditingRequestName] = useState('');

  const selectedCollection = collections.find((c) => c.id === selectedCollectionId) || collections[0];
  const collectionRequests = selectedCollection
    ? allRequests.filter((r) => r.collectionId === selectedCollection.id)
    : [];

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollName.trim()) {
      showToast('Collection name is required', 'info');
      return;
    }

    const created = addCollection({
      name: newCollName.trim(),
      description: newCollDesc.trim(),
      projectId: newCollProjectId || undefined,
      isFavorite: false,
    });

    setSelectedCollectionId(created.id);
    setNewCollName('');
    setNewCollDesc('');
    setNewCollProjectId('');
    setIsCreatingCollection(false);
    showToast('Collection created successfully', 'success', 1500);
  };

  const handleNewRequestInCollection = (collectionId: string) => {
    const newReq = addApiRequest({
      collectionId,
      name: 'New API Request',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      params: [],
      headers: [{ id: `h-${Date.now()}`, key: 'Accept', value: 'application/json', enabled: true }],
      body: { type: 'none', rawText: '', jsonContent: '{\n  \n}', formParams: [], multipartParams: [] },
      auth: { type: 'none' },
    });

    openRequestInTab(newReq);
    setActiveView('api-client');
    showToast('New request created and opened in API Client', 'success', 1500);
  };

  const handleDuplicateRequest = (reqId: string) => {
    const dup = duplicateApiRequest(reqId);
    if (dup) {
      showToast(`Duplicated "${dup.name}"`, 'success', 1500);
    }
  };

  const handleDeleteRequest = (reqId: string) => {
    deleteApiRequest(reqId);
    showToast('Request deleted', 'info', 1500);
  };

  const handleSaveRenamedRequest = (reqId: string) => {
    if (!editingRequestName.trim()) {
      setEditingRequestId(null);
      return;
    }

    updateApiRequest(reqId, { name: editingRequestName.trim() });
    setEditingRequestId(null);
    showToast('Request renamed', 'success', 1200);
  };

  const handleReRunHistoryItem = (item: ApiHistoryItem) => {
    createNewTab({
      ...item.requestSnapshot,
      auth: { type: 'none' },
    });
    setActiveView('api-client');
    showToast('Loaded request from history into API Client', 'info', 1500);
  };

  const filteredCollections = collections.filter((c) => {
    const matchName = c.name.toLowerCase().includes(searchFilter.toLowerCase());
    const requestsInColl = allRequests.filter((r) => r.collectionId === c.id);
    const matchRequest = requestsInColl.some(
      (r) =>
        r.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.url.toLowerCase().includes(searchFilter.toLowerCase())
    );
    return matchName || matchRequest;
  });

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Top Bar Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn ${mainTab === 'collections' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMainTab('collections')}
          >
            <Folder size={14} />
            <span>Collections ({collections.length})</span>
          </button>
          <button
            className={`btn ${mainTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMainTab('history')}
          >
            <History size={14} />
            <span>Request History ({apiHistory.length})</span>
          </button>
        </div>

        {mainTab === 'collections' && (
          <button className="btn btn-secondary" onClick={() => setIsCreatingCollection(true)}>
            <FolderPlus size={14} />
            <span>New Collection</span>
          </button>
        )}

        {mainTab === 'history' && apiHistory.length > 0 && (
          <button className="btn btn-danger" onClick={clearApiHistory}>
            <Trash2 size={14} />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* CREATE COLLECTION FORM */}
      {isCreatingCollection && (
        <form
          onSubmit={handleCreateCollection}
          className="card"
          style={{
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--accent)',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14 }}>Create New API Collection</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Collection Name *</label>
              <input
                type="text"
                placeholder="e.g. Payments API, Auth Service"
                className="input-field"
                value={newCollName}
                onChange={(e) => setNewCollName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Assign to Project (Optional)</label>
              <select
                className="input-select"
                value={newCollProjectId}
                onChange={(e) => setNewCollProjectId(e.target.value)}
              >
                <option value="">None (Global)</option>
                {data.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Description (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Endpoints for customer authentication and token management"
              className="input-field"
              value={newCollDesc}
              onChange={(e) => setNewCollDesc(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreatingCollection(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Collection
            </button>
          </div>
        </form>
      )}

      {/* MAIN VIEW: COLLECTIONS */}
      {mainTab === 'collections' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, minHeight: '520px' }}>
          {/* Left Column: Collection List */}
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
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search collections..."
                className="input-field"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{ height: 28, fontSize: 12, paddingLeft: 26 }}
              />
              <Search size={12} style={{ position: 'absolute', left: 8, top: 8, color: 'var(--text-tertiary)' }} />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filteredCollections.map((coll) => {
                const reqCount = allRequests.filter((r) => r.collectionId === coll.id).length;

                return (
                  <div
                    key={coll.id}
                    onClick={() => setSelectedCollectionId(coll.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: coll.id === selectedCollection?.id ? 'var(--bg-elevated)' : 'transparent',
                      border: coll.id === selectedCollection?.id ? '1px solid var(--border-subtle)' : '1px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                      <Folder size={14} style={{ color: coll.id === selectedCollection?.id ? 'var(--accent-hover)' : 'var(--text-tertiary)' }} />
                      <span style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {coll.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        {reqCount}
                      </span>
                      {coll.isFavorite && <Star size={11} style={{ color: '#f1c40f', fill: '#f1c40f' }} />}
                    </div>
                  </div>
                );
              })}

              {collections.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>
                  No collections yet. Create your first API collection.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Selected Collection Details & Request List */}
          <div
            className="card"
            style={{
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              background: 'var(--bg-surface)',
            }}
          >
            {selectedCollection ? (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{selectedCollection.name}</h2>
                      <button
                        className="btn-icon"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: selectedCollection.isFavorite ? '#f1c40f' : 'var(--text-tertiary)' }}
                        onClick={() => updateCollection(selectedCollection.id, { isFavorite: !selectedCollection.isFavorite })}
                        title="Toggle Favorite"
                      >
                        <Star size={14} fill={selectedCollection.isFavorite ? '#f1c40f' : 'none'} />
                      </button>
                    </div>
                    {selectedCollection.description && (
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                        {selectedCollection.description}
                      </p>
                    )}
                    {selectedCollection.projectId && (
                      <span style={{ fontSize: 11, color: 'var(--accent-hover)', display: 'inline-block', marginTop: 4 }}>
                        Linked to Project: {data.projects.find((p) => p.id === selectedCollection.projectId)?.name || 'Project'}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleNewRequestInCollection(selectedCollection.id)}
                    >
                      <Plus size={12} /> Add Request
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => {
                        if (confirm(`Delete collection "${selectedCollection.name}"?`)) {
                          deleteCollection(selectedCollection.id);
                          showToast('Collection deleted', 'info', 1500);
                        }
                      }}
                      title="Delete Collection"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Requests Table */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {collectionRequests.map((req) => (
                    <div
                      key={req.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, overflow: 'hidden' }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            backgroundColor: 'var(--bg-surface)',
                            color:
                              req.method === 'GET'
                                ? 'var(--success)'
                                : req.method === 'POST'
                                ? 'var(--accent-hover)'
                                : req.method === 'DELETE'
                                ? 'var(--danger)'
                                : 'var(--warning)',
                          }}
                        >
                          {req.method}
                        </span>

                        {editingRequestId === req.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                              type="text"
                              className="input-field"
                              value={editingRequestName}
                              onChange={(e) => setEditingRequestName(e.target.value)}
                              style={{ height: 26, fontSize: 12, width: 180 }}
                              autoFocus
                            />
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleSaveRenamedRequest(req.id)}
                            >
                              <Check size={12} />
                            </button>
                          </div>
                        ) : (
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              cursor: 'pointer',
                              color: 'var(--text-primary)',
                            }}
                            onClick={() => {
                              openRequestInTab(req);
                              setActiveView('api-client');
                            }}
                          >
                            {req.name}
                          </span>
                        )}

                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-tertiary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 320,
                          }}
                        >
                          {req.url}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            openRequestInTab(req);
                            setActiveView('api-client');
                          }}
                          title="Open in API Client"
                        >
                          <ExternalLink size={12} />
                          <span>Open</span>
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => {
                            setEditingRequestId(req.id);
                            setEditingRequestName(req.name);
                          }}
                          title="Rename"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => handleDuplicateRequest(req.id)}
                          title="Duplicate request"
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => handleDeleteRequest(req.id)}
                          title="Delete request"
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {collectionRequests.length === 0 && (
                    <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                      No requests in this collection yet. Click "+ Add Request" to start testing APIs.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                Select a collection from the list or create one.
              </div>
            )}
          </div>
        </div>
      )}

      {/* REQUEST HISTORY VIEW */}
      {mainTab === 'history' && (
        <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>API Request History</h2>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Metadata-only history. Sensitive authentication headers and secrets are never stored.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', maxHeight: '560px' }}>
            {apiHistory.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, overflow: 'hidden' }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                      backgroundColor: 'var(--bg-surface)',
                      color:
                        item.method === 'GET'
                          ? 'var(--success)'
                          : item.method === 'POST'
                          ? 'var(--accent-hover)'
                          : item.method === 'DELETE'
                          ? 'var(--danger)'
                          : 'var(--warning)',
                    }}
                  >
                    {item.method}
                  </span>

                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 400,
                    }}
                  >
                    {item.url}
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: 4,
                      backgroundColor:
                        (item.status || 0) >= 200 && (item.status || 0) < 300
                          ? 'rgba(46, 204, 113, 0.15)'
                          : 'rgba(231, 76, 60, 0.15)',
                      color:
                        (item.status || 0) >= 200 && (item.status || 0) < 300
                          ? 'var(--success)'
                          : 'var(--danger)',
                    }}
                  >
                    {item.status} {item.statusText}
                  </span>

                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {item.timeMs} ms
                  </span>

                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleReRunHistoryItem(item)}
                    title="Load and re-run in API client"
                  >
                    <RotateCcw size={12} />
                    <span>Re-run</span>
                  </button>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(item.url);
                      showToast('URL copied to clipboard', 'info', 1200);
                    }}
                    title="Copy URL"
                  >
                    <Copy size={12} />
                  </button>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => deleteApiHistoryItem(item.id)}
                    title="Delete record"
                    style={{ color: 'var(--danger)' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}

            {apiHistory.length === 0 && (
              <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                No request history yet. Executed requests will appear here.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
