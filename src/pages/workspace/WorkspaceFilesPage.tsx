import React, { useState } from 'react';
import { useAppContext } from '../../lib/store';
import { FileText, Link2, Upload, Plus, Download, ExternalLink, FolderOpen } from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../../lib/toast';

export default function WorkspaceFilesPage() {
  const { workspaceFiles, campaignsList, clients, activeWorkspaceId } = useAppContext();
  const { addToast } = useToast();
  
  const [filterClient, setFilterClient] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('');
  
  const [isAddingMode, setIsAddingMode] = useState<false | 'link' | 'file'>(false);
  const [assetName, setAssetName] = useState('');
  const [assetUrl, setAssetUrl] = useState('');
  const [assetCampaignId, setAssetCampaignId] = useState('');

  const filteredCampaigns = campaignsList?.filter(c => filterClient ? c.clientId === filterClient : true) || [];
  
  const filteredFiles = (workspaceFiles || []).filter(f => {
    if (filterCampaign && f.campaignId !== filterCampaign) return false;
    if (filterClient) {
      const camp = campaignsList?.find(c => c.id === f.campaignId);
      if (camp?.clientId !== filterClient) return false;
    }
    return true;
  });

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId || !assetName || !assetCampaignId || (!assetUrl && isAddingMode === 'link')) return;

    try {
      if (isAddingMode === 'file') {
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        const file = fileInput?.files?.[0];
        
        if (!file) {
          addToast('Please select a file to upload.', 'error');
          return;
        }

        if (file.size > 1024 * 1024) { // 1MB limit for Data URL in Firestore
           addToast('File is too large. Please upload files under 1MB, or use a Link for larger files.', 'error');
           return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          await addDoc(collection(db, 'workspaceFiles'), {
            workspaceId: activeWorkspaceId,
            campaignId: assetCampaignId,
            name: assetName,
            type: 'file',
            url: base64data,
            uploadedBy: auth.currentUser?.uid,
            size: file.size,
            createdAt: serverTimestamp(),
          });
          
          setAssetName('');
          setAssetUrl('');
          setAssetCampaignId('');
          setIsAddingMode(false);
          addToast('File asset added successfully', 'success');
        };
        reader.readAsDataURL(file);
      } else {
        await addDoc(collection(db, 'workspaceFiles'), {
          workspaceId: activeWorkspaceId,
          campaignId: assetCampaignId,
          name: assetName,
          type: 'link',
          url: assetUrl,
          uploadedBy: auth.currentUser?.uid,
          size: 0,
          createdAt: serverTimestamp(),
        });
        
        setAssetName('');
        setAssetUrl('');
        setAssetCampaignId('');
        setIsAddingMode(false);
        addToast('Link asset added successfully', 'success');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--color-text-main)] tracking-tight mb-2">Workspace Files</h1>
          <p className="text-[var(--color-text-subtle)] font-medium">Central repository for client campaign assets.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAddingMode('link')}
            className="bg-[var(--color-surface)] hover:bg-[var(--color-surface2)] text-[var(--color-text-main)] px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors border border-[var(--color-border-subtle)] shadow-[var(--shadow-sm)]"
          >
            <Link2 className="w-4 h-4" />
            Add Link
          </button>
          <button 
            onClick={() => setIsAddingMode('file')}
            className="bg-[var(--color-cyan)] hover:opacity-90 text-[var(--color-bg)] px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-opacity shadow-[var(--shadow-sm)]"
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>
        </div>
      </div>

      {isAddingMode && (
        <form onSubmit={handleAddAsset} className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 mb-8 max-w-2xl shadow-[var(--shadow-sm)]">
          <h3 className="font-display text-xl font-bold text-[var(--color-text-main)] mb-6 flex items-center gap-2">
            {isAddingMode === 'link' ? <Link2 className="text-blue-500" /> : <Upload className="text-purple-500" />}
            Add {isAddingMode === 'link' ? 'Link Asset' : 'File Asset'}
          </h3>
          
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-bold text-[var(--color-text-subtle)] mb-2 uppercase tracking-wider">Asset Name</label>
              <input 
                type="text" required
                value={assetName} onChange={e => setAssetName(e.target.value)}
                className="w-full bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-[var(--color-text-main)] font-medium outline-none focus:border-[var(--color-cyan)] shadow-inner transition-colors"
                placeholder="e.g. Master Drive Folder, Final Cut..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-[var(--color-text-subtle)] mb-2 uppercase tracking-wider">Campaign</label>
              <select 
                required
                value={assetCampaignId} onChange={e => setAssetCampaignId(e.target.value)}
                className="w-full bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-[var(--color-text-main)] font-medium outline-none focus:border-[var(--color-cyan)] shadow-inner transition-colors"
              >
                <option value="">Select a campaign...</option>
                {campaignsList?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            {isAddingMode === 'link' ? (
              <div>
                <label className="block text-sm font-bold text-[var(--color-text-subtle)] mb-2 uppercase tracking-wider">Asset URL</label>
                <input 
                  type="url" required
                  value={assetUrl} onChange={e => setAssetUrl(e.target.value)}
                  className="w-full bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-[var(--color-text-main)] font-medium outline-none focus:border-[var(--color-cyan)] shadow-inner transition-colors"
                  placeholder="https://"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-bold text-[var(--color-text-subtle)] mb-2 uppercase tracking-wider">Select File (max 1MB)</label>
                <input 
                  type="file" required id="file-upload"
                  className="w-full bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3 text-[var(--color-text-main)] font-medium outline-none focus:border-[var(--color-cyan)] shadow-inner transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-cyan)] file:text-[var(--color-bg)] hover:file:opacity-90"
                />
              </div>
            )}
            
            <div className="flex items-center gap-3 pt-4">
              <button 
                type="submit"
                className="bg-[var(--color-cyan)] hover:opacity-90 text-[var(--color-bg)] px-6 py-2.5 rounded-xl font-bold transition-opacity shadow-sm"
              >
                Save Asset
              </button>
              <button 
                type="button"
                onClick={() => setIsAddingMode(false)}
                className="bg-transparent hover:bg-[var(--color-surface2)] text-[var(--color-text-main)] px-6 py-2.5 rounded-xl font-medium transition-colors border border-[var(--color-border-subtle)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border-subtle)] flex flex-wrap items-center gap-4 bg-[var(--color-surface2)]">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[var(--color-text-subtle)] uppercase tracking-wider">Filter:</span>
            <select 
              value={filterClient} 
              onChange={e => { setFilterClient(e.target.value); setFilterCampaign(''); }}
              className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl px-3 py-2 text-sm font-medium text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] shadow-inner transition-colors"
            >
              <option value="">All Clients</option>
              {clients?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select 
              value={filterCampaign} 
              onChange={e => setFilterCampaign(e.target.value)}
              className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl px-3 py-2 text-sm font-medium text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] shadow-inner transition-colors"
            >
              <option value="">All Campaigns</option>
              {filteredCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface2)]">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">Name</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">Campaign</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">Type</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-[var(--color-text-subtle)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => {
                const campaign = campaignsList?.find(c => c.id === file.campaignId);
                return (
                  <tr key={file.id} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface2)] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-cyan)] to-blue-600 flex items-center justify-center text-white opacity-90 shadow-sm shrink-0">
                          {file.type === 'link' ? <Link2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--color-text-main)] max-w-[200px] sm:max-w-xs truncate" title={file.name}>{file.name}</div>
                          <div className="text-xs font-medium text-[var(--color-text-subtle)]">Added on {new Date(file.createdAt?.toMillis ? file.createdAt.toMillis() : Date.now()).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex px-2 py-1 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-main)] shadow-sm max-w-[150px] truncate" title={campaign?.name || 'Unknown'}>
                        {campaign?.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-bold text-[var(--color-text-main)] capitalize">{file.type}</span>
                    </td>
                    <td className="p-4 text-right">
                      {file.type === 'link' ? (
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-[var(--color-surface2)] hover:bg-[var(--color-border-subtle)] border border-[var(--color-border-subtle)] rounded-lg text-sm font-bold text-[var(--color-text-main)] transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open
                        </a>
                      ) : (
                        <a 
                          href={file.url}
                          download={file.name}
                          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-[var(--color-cyan)] hover:opacity-90 rounded-lg text-sm font-bold text-[var(--color-bg)] transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
              
              {filteredFiles.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-16 text-center">
                    <div className="w-20 h-20 bg-[var(--color-surface2)] rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[var(--color-border-subtle)] shadow-inner">
                      <FolderOpen className="w-8 h-8 text-[var(--color-text-subtle)]" />
                    </div>
                    <div className="text-[var(--color-text-main)] font-display text-xl font-bold mb-2">No assets found</div>
                    <div className="text-sm font-medium text-[var(--color-text-subtle)]">Add your first file or link to get started.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
