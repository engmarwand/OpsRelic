import React, { useState } from 'react';
import { useAppContext } from '../../lib/store';
import { UploadCloud, CheckCircle2, ChevronDown, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { collection, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { useToast } from '../../lib/toast';
import { cn } from '../../lib/utils';

export default function UploadPage() {
  const { campaignsList, data: existingSubmissions } = useAppContext();
  const { addToast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  
  const [mapping, setMapping] = useState<Record<string, string>>({
    'Submission Date': '',
    'Content Title': '',
    'Creator': '',
    'Platform': '',
    'Views': '',
    'Amount Paid': '',
    'Status': '',
    'Submission URL': ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      Papa.parse(f, {
        header: true,
        complete: (results) => {
          setParsedData(results.data);
          if (results.data.length > 0) {
            setHeaders(Object.keys(results.data[0]));
            const newMapping = { ...mapping };
            Object.keys(results.data[0]).forEach(h => {
               const normalized = h.toLowerCase().replace(/[\s_]/g, '');
               if (normalized.includes('date')) newMapping['Submission Date'] = h;
               if (normalized.includes('title') || normalized.includes('content')) newMapping['Content Title'] = h;
               if (normalized.includes('creator') || normalized.includes('influencer')) newMapping['Creator'] = h;
               if (normalized.includes('platform') || normalized.includes('social')) newMapping['Platform'] = h;
               if (normalized.includes('view')) newMapping['Views'] = h;
               if (normalized.includes('paid') || normalized.includes('amount') || normalized.includes('cost')) newMapping['Amount Paid'] = h;
               if (normalized.includes('status')) newMapping['Status'] = h;
               if (normalized.includes('url') || normalized.includes('link')) newMapping['Submission URL'] = h;
            });
            setMapping(newMapping);
          }
        }
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedCampaignId || parsedData.length === 0 || !auth.currentUser) return;
    setIsProcessing(true);
    
    try {
      const batch = writeBatch(db);
      
      let count = 0;
      for (const row of parsedData) {
        if (!row[mapping['Content Title']]) continue;
        
        const docRef = doc(collection(db, 'submissions'));
        batch.set(docRef, {
          userId: auth.currentUser.uid,
          campaignId: selectedCampaignId,
          title: row[mapping['Content Title']] || 'Untitled Asset',
          creatorId: row[mapping['Creator']] || 'Unknown',
          platform: (row[mapping['Platform']] || 'Unknown').toLowerCase(),
          views: parseInt(row[mapping['Views']]) || 0,
          payout: parseFloat(row[mapping['Amount Paid']]) || 0,
          status: (row[mapping['Status']] || 'approved').toLowerCase(),
          url: row[mapping['Submission URL']] || '',
          submissionDate: row[mapping['Submission Date']] || new Date().toISOString(),
          createdAt: serverTimestamp()
        });
        count++;
        if (count >= 450) break; // Limit batch size for safety in demo
      }
      
      await batch.commit();
      addToast(`Successfully uploaded ${count} clips.`, 'success');
      setFile(null);
      setParsedData([]);
      setSelectedCampaignId('');
      setMapping({
        'Submission Date': '', 'Content Title': '', 'Creator': '', 'Platform': '',
        'Views': '', 'Amount Paid': '', 'Status': '', 'Submission URL': ''
      });
    } catch (err) {
      console.error("Ingestion error:", err);
      addToast('Upload failed.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate unique uploads history based on createdAt mapping
  const uploadHistory = React.useMemo(() => {
    const map = new Map();
    existingSubmissions.forEach(sub => {
       const dateKey = new Date(sub.createdAt || sub["Submission Date"]).toLocaleDateString();
       if (!map.has(dateKey)) {
         map.set(dateKey, { date: dateKey, count: 0, campaignIds: new Set() });
       }
       const entry = map.get(dateKey);
       entry.count += 1;
       entry.campaignIds.add(sub.campaignId || sub._campaignId);
    });
    return Array.from(map.values()).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [existingSubmissions]);

  return (
    <div className="page active p-6 md:p-8 min-h-[calc(100vh-var(--topbar-h))]">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-xl font-extrabold text-[var(--color-text-main)] tracking-[-0.025em]">Uploads</h1>
          <p className="text-sm text-muted mt-[3px]">Ingest CSV performance data into campaigns</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-8 shadow-sm">
             <div className="font-display text-md font-bold text-[var(--color-text-main)] mb-6 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--color-surface3)] flex items-center justify-center text-xs text-muted">1</span>
                Upload CSV
             </div>
             
             <AnimatePresence mode="wait">
               {!file ? (
                 <label className="border-2 border-dashed border-[var(--color-border-subtle)] rounded-xl h-[180px] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--color-cyan)] hover:bg-[var(--color-surface-hover)] transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6 text-muted group-hover:text-[var(--color-cyan)] transition-colors" />
                    </div>
                    <div className="text-sm font-semibold text-[var(--color-text-main)] mb-1">Click or drag CSV file here</div>
                    <div className="text-xs text-muted">Airtable or Google Sheets formatted</div>
                    <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                 </label>
               ) : (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-[var(--color-border-subtle)] rounded-xl p-6 bg-[var(--color-surface2)] flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                       <CheckCircle2 className="w-8 h-8 text-[var(--color-green)]" />
                       <div>
                         <div className="font-semibold text-sm text-[var(--color-text-main)]">{file.name}</div>
                         <div className="text-xs text-muted mt-1">{parsedData.length} rows detected</div>
                       </div>
                    </div>
                    <button onClick={() => { setFile(null); setParsedData([]); }} className="text-xs font-semibold hover:text-red-500 transition-colors flex items-center gap-1 text-muted">
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          <AnimatePresence>
            {parsedData.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-8 shadow-sm">
                <div className="font-display text-md font-bold text-[var(--color-text-main)] mb-6 flex items-center gap-3">
                   <span className="w-6 h-6 rounded-full bg-[var(--color-cyan)] text-white flex items-center justify-center text-xs">2</span>
                   Map Columns & Sync
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="flex flex-col gap-[5px] col-span-full mb-2">
                     <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Target Campaign</label>
                     <div className="relative">
                       <select value={selectedCampaignId} onChange={e=>setSelectedCampaignId(e.target.value)} className="w-full bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[9px] text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all appearance-none cursor-pointer">
                         <option value="">Select a Campaign...</option>
                         {campaignsList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                       <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-muted pointer-events-none" />
                     </div>
                  </div>

                  {Object.keys(mapping).map(key => (
                    <div key={key} className="flex flex-col gap-[5px]">
                       <label className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted">{key}</label>
                       <div className="relative">
                          <select 
                            value={mapping[key]}
                            onChange={e => setMapping({ ...mapping, [key]: e.target.value })}
                            className="w-full bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-2 text-[13px] text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] transition-all appearance-none cursor-pointer"
                          >
                             <option value="">-- Ignore --</option>
                             {headers.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-[12px] h-[12px] text-muted pointer-events-none" />
                       </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-[var(--color-border-subtle)] flex items-center justify-end">
                   <button 
                     onClick={handleUpload}
                     disabled={!selectedCampaignId || isProcessing}
                     className={cn("btn flex items-center justify-center gap-2 px-8", (!selectedCampaignId || isProcessing) ? "bg-[var(--color-surface3)] text-muted cursor-not-allowed border-transparent" : "btn-primary")}
                   >
                     {isProcessing ? 'Syncing...' : 'Start Import'} <ArrowRight className="w-4 h-4" />
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm sticky top-6">
            <div className="font-display text-md font-bold text-[var(--color-text-main)] mb-6">Recent Uploads</div>
            <div className="flex flex-col gap-3">
              {uploadHistory.length === 0 ? <div className="text-sm text-faint">No uploads yet.</div> : uploadHistory.map((u, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface2)]">
                   <div className="w-8 h-8 rounded-lg bg-[var(--color-surface)] flex items-center justify-center border border-[var(--color-border-subtle)] shrink-0 shadow-sm mt-[2px]">
                     <CheckCircle2 className="w-[14px] h-[14px] text-muted" />
                   </div>
                   <div>
                     <div className="font-semibold text-sm text-[var(--color-text-main)] leading-relaxed">CSV Sync</div>
                     <div className="text-xs text-muted mb-[6px]">{u.date}</div>
                     <div className="text-[11px] font-bold tracking-[0.05em] uppercase text-[var(--color-green)] bg-[var(--color-green-dim)] rounded-full px-2 py-[2px] inline-flex items-center gap-1">
                       {u.count} Row{u.count !== 1 ? 's' : ''} Active
                     </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
