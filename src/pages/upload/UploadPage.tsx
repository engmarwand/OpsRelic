import React, { useState } from 'react';
import { useAppContext } from '../../lib/store';
import { UploadCloud, CheckCircle2, ChevronDown, Trash2, ArrowRight, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { collection, serverTimestamp, writeBatch, doc, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { useToast } from '../../lib/toast';
import { cn } from '../../lib/utils';

export default function UploadPage() {
  const { campaignsList, data: existingSubmissions } = useAppContext();
  const { addToast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  
  const [mapping, setMapping] = useState<Record<string, string>>({
    'Campaign ID': '',
    'Submission Date': '',
    'Content Title': '',
    'Creator': '',
    'Platform': '',
    'Views': '',
    'Likes': '',
    'Comments': '',
    'Shares': '',
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
        skipEmptyLines: true,
        complete: (results) => {
          setParsedData(results.data);
          if (results.data.length > 0) {
            const fileHeaders = Object.keys(results.data[0]);
            setHeaders(fileHeaders);
            const newMapping = { ...mapping };
            fileHeaders.forEach(h => {
               const normalized = h.toLowerCase().replace(/[\s_]/g, '');
               if (normalized === 'campaignid' || normalized === 'campaign' || normalized === 'campaignname') newMapping['Campaign ID'] = h;
               if (normalized.includes('date') || normalized.includes('submitted')) newMapping['Submission Date'] = h;
               if (normalized.includes('title') || normalized.includes('headline') || normalized.includes('content')) newMapping['Content Title'] = h;
               if (normalized.includes('creator') || normalized.includes('influencer') || normalized.includes('handle') || normalized.includes('author')) newMapping['Creator'] = h;
               if (normalized.includes('platform') || normalized.includes('social') || normalized.includes('network')) newMapping['Platform'] = h;
               if (normalized.includes('view') || normalized.includes('reach') || normalized.includes('impression')) newMapping['Views'] = h;
               if (normalized.includes('like') || normalized.includes('heart')) newMapping['Likes'] = h;
               if (normalized.includes('comment')) newMapping['Comments'] = h;
               if (normalized.includes('share') || normalized.includes('repost')) newMapping['Shares'] = h;
               if (normalized.includes('paid') || normalized.includes('amount') || normalized.includes('cost') || normalized.includes('price')) newMapping['Amount Paid'] = h;
               if (normalized.includes('status') || normalized.includes('state')) newMapping['Status'] = h;
               if (normalized.includes('url') || normalized.includes('link') || normalized.includes('source')) newMapping['Submission URL'] = h;
            });
            setMapping(newMapping);
          }
        }
      });
    }
  };

  const handleUpload = async () => {
    const isTargetingPossible = selectedCampaignId || mapping['Campaign ID'];
    if (!isTargetingPossible || parsedData.length === 0 || !auth.currentUser) return;
    
    setIsProcessing(true);
    setProgress(0);
    
    const validRows = parsedData.filter(row => Object.values(row).some(x => x));
    setTotalToProcess(validRows.length);
    
    try {
      // 1. Pre-fetch existing clip metrics for this user to check for duplicates
      const existingClipsMap = new Map<string, any>(); // URL -> Data
      
      const clipsQuery = query(
        collection(db, 'clipMetrics'),
        where('userId', '==', auth.currentUser.uid)
      );
      const clipsSnapshot = await getDocs(clipsQuery);
      clipsSnapshot.forEach(doc => {
        const d = doc.data();
        if (d.url) {
          existingClipsMap.set(d.url, { id: doc.id, ...d });
        }
      });

      let updatedCount = 0;
      let newCount = 0;
      
      const chunkSize = 50; // Smaller chunks because we do sub-queries for submissions
      for (let i = 0; i < validRows.length; i += chunkSize) {
        const chunk = validRows.slice(i, i + chunkSize);
        const batch = writeBatch(db);

        for (const row of chunk) {
          let resolvedCampaignId = selectedCampaignId;
          const rawCampVal = mapping['Campaign ID'] && row[mapping['Campaign ID']];
          
          let campaign = campaignsList.find(c => c.id === selectedCampaignId);

          if (rawCampVal) {
            const trimmedVal = String(rawCampVal).trim();
            const found = campaignsList.find(c => c.id === trimmedVal || c.name.toLowerCase() === trimmedVal.toLowerCase());
            if (found) {
              resolvedCampaignId = found.id;
              campaign = found;
            } else {
              resolvedCampaignId = selectedCampaignId || trimmedVal;
              campaign = campaignsList.find(c => c.id === resolvedCampaignId);
            }
          }
          
          if (!resolvedCampaignId) continue;

          const url = String(row[mapping['Submission URL']] || '').trim();
          if (!url) continue;

          const existingClip = existingClipsMap.get(url);
          
          // Metrics from CSV
          const views = parseInt(String(row[mapping['Views']] || '0').replace(/,/g, '')) || 0;
          const likes = parseInt(String(row[mapping['Likes']] || '0').replace(/,/g, '')) || 0;
          const comments = parseInt(String(row[mapping['Comments']] || '0').replace(/,/g, '')) || 0;
          const shares = parseInt(String(row[mapping['Shares']] || '0').replace(/,/g, '')) || 0;
          const engagementRate = views > 0 ? (likes + comments + shares) / views : 0;
          const title = row[mapping['Content Title']] || '';
          const author = row[mapping['Creator']] || '';
          const status = (row[mapping['Status']] || 'approved').toLowerCase();
          const payout = parseFloat(String(row[mapping['Amount Paid']] || '0').replace(/[^0-9.]/g, '')) || 0;
          const platform = (row[mapping['Platform']] || 'unknown').toLowerCase();

          let clipLinkId = '';
          
          if (existingClip) {
            clipLinkId = existingClip.id;
            const clipRef = doc(db, 'clipMetrics', clipLinkId);
            batch.set(clipRef, {
              views,
              likes,
              comments,
              shares,
              engagementRate,
              title: title || existingClip.title,
              author: author || existingClip.author,
              platform: platform !== 'unknown' ? platform : existingClip.platform,
              updatedAt: serverTimestamp(),
              status: 'active'
            }, { merge: true });
            updatedCount++;
          } else {
            const clipRef = doc(collection(db, 'clipMetrics'));
            clipLinkId = clipRef.id;
            batch.set(clipRef, {
              clipLinkId,
              campaignId: resolvedCampaignId,
              userId: auth.currentUser?.uid,
              url,
              platform,
              title,
              author,
              views,
              likes,
              comments,
              shares,
              engagementRate,
              status: 'active',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            newCount++;
            existingClipsMap.set(url, { id: clipLinkId, title, author, platform });
          }

          // Search for existing submission for same URL and campaign
          const subQuery = query(
            collection(db, 'submissions'),
            where('campaignId', '==', resolvedCampaignId),
            where('url', '==', url)
          );
          const subSnap = await getDocs(subQuery);
          
          if (subSnap.empty) {
            const submissionRef = doc(collection(db, 'submissions'));
            batch.set(submissionRef, {
              userId: auth.currentUser.uid,
              campaignId: resolvedCampaignId,
              Campaign: campaign?.name || resolvedCampaignId,
              title: title || 'Untitled Asset',
              creatorId: author || 'Unknown',
              platform,
              views,
              likes,
              comments,
              shares,
              payout,
              status,
              url,
              clipLinkId,
              submissionDate: row[mapping['Submission Date']] || new Date().toISOString(),
              createdAt: serverTimestamp()
            });
          } else {
            const submissionRef = subSnap.docs[0].ref;
            batch.update(submissionRef, {
              views,
              likes,
              comments,
              shares,
              status,
              updatedAt: serverTimestamp()
            });
          }
        }

        await batch.commit();
        const nextProgress = Math.min(100, Math.round(((i + chunk.length) / validRows.length) * 100));
        setProgress(nextProgress);
      }
      
      addToast(`Sync complete: ${updatedCount} clips updated, ${newCount} new clips added.`, 'success');

      setFile(null);
      setParsedData([]);
      setSelectedCampaignId('');
      setMapping({
        'Campaign ID': '', 'Submission Date': '', 'Content Title': '', 'Creator': '', 'Platform': '',
        'Views': '', 'Likes': '', 'Comments': '', 'Shares': '', 'Amount Paid': '', 'Status': '', 'Submission URL': ''
      });
    } catch (err) {
      console.error("Ingestion error:", err);
      addToast('Upload failed. Please check your data format.', 'error');
    } finally {
      setIsProcessing(false);
      setProgress(0);
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
             
             <div className="mb-6 p-4 bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-xl">
                <h4 className="text-sm font-bold text-[var(--color-text-main)] mb-2">How it works:</h4>
                <ul className="text-xs text-muted space-y-2 list-disc pl-4">
                  <li>Upload a CSV containing your campaign performance data.</li>
                  <li>OpsRelic <b>automatically maps</b> your headers to campaign fields.</li>
                  <li>OpsRelic checks for duplicates using the <b>Submission URL</b>.</li>
                  <li>If a video already exists, its views, likes, and status will be <b>updated</b>.</li>
                  <li>New videos will be added to the campaign automatically.</li>
                </ul>
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
                   Select Campaign & Sync
                </div>
                
                <div className="space-y-6 mb-8">
                  <div className="flex flex-col gap-[5px]">
                     <label className="text-xs font-bold uppercase tracking-[0.07em] text-muted">Target Campaign</label>
                     <div className="relative">
                       <select value={selectedCampaignId} onChange={e=>setSelectedCampaignId(e.target.value)} className="w-full bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-[10px] text-sm text-[var(--color-text-main)] outline-none focus:border-[var(--color-cyan)] focus:ring-[3px] focus:ring-[var(--color-cyan-dim)] transition-all appearance-none cursor-pointer">
                         <option value="">Select a Campaign...</option>
                         {campaignsList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                       <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-muted pointer-events-none" />
                     </div>
                     <p className="text-[10px] text-muted mt-1 italic">* Data will be synced to this campaign unless <b>Campaign ID</b> is found in CSV</p>
                  </div>

                  <div className="p-4 bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-xl">
                    <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted mb-3 flex items-center justify-between">
                       <span>Detected Mappings</span>
                       <span className="text-[var(--color-green)] text-[9px] bg-[var(--color-green-dim)] px-1.5 py-0.5 rounded">Auto-mapped</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                       {Object.entries(mapping).map(([key, value]) => {
                         const isRequired = ['Submission URL', 'Views', 'Submission Date'].includes(key);
                         return (
                           <div key={key} className="flex flex-col">
                             <span className="text-[9px] font-bold text-faint uppercase flex items-center gap-1">
                               {key} {isRequired && <span className="text-red-500">*</span>}
                             </span>
                             <span className={cn("text-[11px] font-medium truncate", value ? "text-[var(--color-text-main)]" : (isRequired ? "text-red-400 italic" : "text-amber-500/60 italic"))}>
                               {value || 'Not found'}
                             </span>
                           </div>
                         );
                       })}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-[var(--color-border-subtle)] flex flex-col gap-4">
                   {isProcessing && (
                     <div className="w-full">
                       <div className="flex justify-between items-center mb-2">
                         <div className="text-xs font-bold text-muted uppercase tracking-wider">Syncing {totalToProcess} Items</div>
                         <div className="text-xs font-bold text-[var(--color-cyan)]">{progress}%</div>
                       </div>
                       <div className="h-1.5 w-full bg-[var(--color-surface2)] rounded-full overflow-hidden border border-[var(--color-border-subtle)]">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${progress}%` }}
                           className="h-full bg-[var(--color-cyan)] shadow-[0_0_10px_var(--color-cyan-soft)]"
                         />
                       </div>
                     </div>
                   )}
                   <div className="flex items-center justify-end">
                     <button 
                       onClick={handleUpload}
                       disabled={(!selectedCampaignId && !mapping['Campaign ID']) || isProcessing}
                       className={cn("btn flex items-center justify-center gap-2 px-8 h-11", ((!selectedCampaignId && !mapping['Campaign ID']) || isProcessing) ? "bg-[var(--color-surface3)] text-muted cursor-not-allowed border-transparent" : "btn-primary")}
                     >
                       {isProcessing ? (
                         <>
                           <RefreshCw className="w-4 h-4 animate-spin" />
                           Processing...
                         </>
                       ) : (
                         <>
                           Start Import <ArrowRight className="w-4 h-4" />
                         </>
                       )}
                     </button>
                   </div>
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
