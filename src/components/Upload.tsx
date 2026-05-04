import React, { useState, useCallback, useMemo } from 'react';
import { useAppContext } from '../lib/store';
import { useToast } from '../lib/toast';
import { UploadCloud, FileText, Download, CheckCircle, AlertCircle, X, Trash2, Check, Settings, Palette, Calendar, Loader } from 'lucide-react';
import Papa from 'papaparse';
import { CsvRow } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { formatViews, formatMoney } from '../lib/data';
import { importCsvData } from '../lib/sync';
import { auth, db } from '../lib/firebase';
import { writeBatch, query, collection, where, getDocs } from 'firebase/firestore';

type ColumnMap = {
  id: string;
  name: string;
  required: boolean;
  enabled: boolean;
  mappedTo: string;
};

const DEFAULT_COLUMNS: ColumnMap[] = [
  { id: 'date', name: 'Submission Date', required: true, enabled: true, mappedTo: 'Submission Date' },
  { id: 'creator', name: 'Creator', required: true, enabled: true, mappedTo: 'Creator' },
  { id: 'platform', name: 'Platform', required: true, enabled: true, mappedTo: 'Platform' },
  { id: 'campaign', name: 'Campaign', required: true, enabled: true, mappedTo: 'Campaign' },
  { id: 'status', name: 'Status', required: true, enabled: true, mappedTo: 'Status' },
  { id: 'title', name: 'Content Title', required: false, enabled: true, mappedTo: 'Content Title' },
  { id: 'views', name: 'Views', required: false, enabled: true, mappedTo: 'Views' },
  { id: 'amount', name: 'Amount Paid', required: false, enabled: true, mappedTo: 'Amount Paid' },
  { id: 'url', name: 'Submission URL', required: false, enabled: false, mappedTo: 'Submission URL' },
  { id: 'likes', name: 'Likes', required: false, enabled: false, mappedTo: 'Likes' },
  { id: 'comments', name: 'Comments', required: false, enabled: false, mappedTo: 'Comments' },
  { id: 'shares', name: 'Shares', required: false, enabled: false, mappedTo: 'Shares' },
];

export default function Upload() {
  const { data, setData, clearData, campaignsList, plan, setShowPricing } = useAppContext();
  const { addToast } = useToast();
  
  // New States for Smart Sync
  const [targetType, setTargetType] = useState<'new' | 'existing'>(campaignsList.length > 0 ? 'existing' : 'new');
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaignsList[0]?.id || '');
  
  // Analysis state
  const [syncSummary, setSyncSummary] = useState<{
    new: any[];
    duplicates: any[];
    total: number;
    fileName: string;
  } | null>(null);

  // Step 1: Campaign Setup State
  const [campaignName, setCampaignName] = useState('');
  const [campaignBudget, setCampaignBudget] = useState('1000');
  const [rewardRate, setRewardRate] = useState('5');
  const [clientName, setClientName] = useState('');
  const [useWhiteLabel, setUseWhiteLabel] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#FF6B35');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      addToast("Please upload a valid .csv file.", "error");
      return;
    }

    // Limit enforcement for new campaigns
    if (targetType === 'new' && campaignsList.length >= (plan?.limits?.campaigns || 1)) {
        addToast(`Wait! Your current ${plan?.name || 'Free'} plan is limited to ${plan?.limits?.campaigns} campaign. Upgrade to unlock more.`, "error");
        setShowPricing(true);
        return;
    }

    setIsProcessing(true);

    const matchHeader = (possibleNames: string[], headers: string[]) => {
      for (const p of possibleNames) {
        const found = headers.find(h => 
          h.trim().toLowerCase() === p.toLowerCase() || 
          h.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === p.toLowerCase().replace(/[^a-z0-9]/g, '')
        );
        if (found) return found;
      }
      return undefined;
    };

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          addToast("Failed to parse CSV file.", "error");
          setIsProcessing(false);
          return;
        }

        const headers = Object.keys(results.data[0] as object);

        // Limit enforcement for records
        const recordLimit = plan?.limits?.recordsPerCampaign || 500;
        if (results.data.length > recordLimit) {
            addToast(`File too large! Your ${plan?.name} plan is limited to ${recordLimit} records per upload.`, "error");
            setShowPricing(true);
            setIsProcessing(false);
            return;
        }
        
        const mappings = {
            date: matchHeader(['Submission Date', 'Date', 'Time'], headers),
            creator: matchHeader(['Creator', 'Username', 'Handle', 'User'], headers),
            platform: matchHeader(['Platform', 'Network', 'Source'], headers),
            campaign: matchHeader(['Campaign', 'Project'], headers),
            status: matchHeader(['Status', 'State', 'Approval'], headers),
            title: matchHeader(['Content Title', 'Title', 'Video Name', 'Description'], headers),
            views: matchHeader(['Views', 'Play Count', 'View Count'], headers),
            amount: matchHeader(['Amount Paid', 'Payout', 'Earning', 'Revenue', 'Amount'], headers),
            url: matchHeader(['Submission URL', 'URL', 'Link', 'Video Link', 'Post Link'], headers),
            likes: matchHeader(['Likes', 'Like Count'], headers),
            comments: matchHeader(['Comments', 'Comment Count'], headers),
            shares: matchHeader(['Shares', 'Share Count'], headers),
        };

        const parsedData: any[] = results.data.map((row: any) => {
          const getVal = (id: keyof typeof mappings) => {
            const mappedHeader = mappings[id];
            return mappedHeader ? row[mappedHeader] : undefined;
          };

          const rawViews = getVal('views');
          let numViews = 0;
          if (typeof rawViews === 'string' && rawViews.trim() !== '') {
             numViews = parseInt(rawViews.replace(/[^0-9.-]+/g, ''), 10);
          } else if (typeof rawViews === 'number') {
             numViews = rawViews;
          }
          if (isNaN(numViews)) numViews = 0;

          const rawAmount = getVal('amount');
          let parsedAmount = 0;
          if (typeof rawAmount === 'string' && rawAmount.trim() !== '') {
             parsedAmount = parseFloat(rawAmount.replace(/[^0-9.-]+/g, ''));
          } else if (typeof rawAmount === 'number') {
             parsedAmount = rawAmount;
          }
          if (isNaN(parsedAmount)) parsedAmount = 0;

          // Auto calculate based on rewardRate if amount is missing/0 and views exist
          if (!parsedAmount && numViews > 0) {
              const rate = parseFloat(rewardRate) || 0;
              parsedAmount = (numViews / 1000) * rate;
          }

          let likes = 0, comments = 0, shares = 0;
          const rawLikes = getVal('likes');
          if (typeof rawLikes === 'string') likes = parseInt(rawLikes.replace(/[^0-9.-]+/g, ''), 10); else if (typeof rawLikes === 'number') likes = rawLikes;
          if (isNaN(likes)) likes = 0;

          const rawComments = getVal('comments');
          if (typeof rawComments === 'string') comments = parseInt(rawComments.replace(/[^0-9.-]+/g, ''), 10); else if (typeof rawComments === 'number') comments = rawComments;
          if (isNaN(comments)) comments = 0;

          const rawShares = getVal('shares');
          if (typeof rawShares === 'string') shares = parseInt(rawShares.replace(/[^0-9.-]+/g, ''), 10); else if (typeof rawShares === 'number') shares = rawShares;
          if (isNaN(shares)) shares = 0;

          return {
            ...row,
            "Submission Date": getVal('date') || new Date().toISOString(),
            Creator: getVal('creator') || 'Unknown',
            Platform: getVal('platform') || 'tiktok',
            Campaign: getVal('campaign') || (targetType === 'existing' ? campaignsList.find(c => c.id === selectedCampaignId)?.name : campaignName),
            Status: getVal('status') || 'pending',
            "Content Title": getVal('title') || 'Untitled',
            Views: numViews,
            "Amount Paid": parsedAmount,
            "Submission URL": getVal('url') || '',
            Likes: likes,
            Comments: comments,
            Shares: shares,
          };
        });

        // Smart Analysis
        try {
          // If smartSync is not enabled, skip deduplication
          if (!plan?.features?.smartSync) {
            setSyncSummary({
              new: parsedData,
              duplicates: [],
              total: parsedData.length,
              fileName: file.name
            });
            return;
          }

          const user = auth.currentUser;
          if (!user) return;
          
          const campId = targetType === 'existing' ? selectedCampaignId : `id_camp_${campaignName.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 100)}`;
          
          // Fetch existing URLs for this campaign
          const q = query(collection(db, 'submissions'), where('campaignId', '==', campId), where('userId', '==', user.uid));
          const snap = await getDocs(q);
          const existingUrls = new Set(snap.docs.map(d => d.data().url));
          
          const newEntries: any[] = [];
          const duplicateEntries: any[] = [];
          
          parsedData.forEach(row => {
            const url = row["Submission URL"];
            if (existingUrls.has(url)) {
              duplicateEntries.push(row);
            } else {
              newEntries.push(row);
            }
          });
          
          setSyncSummary({
            new: newEntries,
            duplicates: duplicateEntries,
            total: parsedData.length,
            fileName: file.name
          });
          
        } catch (error) {
          console.error("Analysis error:", error);
          addToast("Failed to analyze data for duplicates", "error");
        } finally {
          setIsProcessing(false);
        }
      }
    });
  };

  const confirmImport = async () => {
    if (!syncSummary) return;
    setIsProcessing(true);
    try {
      const finalCampaignName = targetType === 'existing' 
        ? campaignsList.find(c => c.id === selectedCampaignId)?.name || ''
        : campaignName;

      await importCsvData(syncSummary.new, finalCampaignName, Number(campaignBudget) || 0, Number(rewardRate) || 0);
      addToast(`Successfully synchronized ${syncSummary.new.length} new records.`, "success");
      setSyncSummary(null);
    } catch (error: any) {
      console.error("Upload error:", error);
      addToast(error.message || "Failed to save records", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (targetType === 'new' && !campaignName) {
      addToast("Please specify a Campaign Name first.", "error");
      return;
    }
    if (targetType === 'existing' && !selectedCampaignId) {
      addToast("Please select an existing campaign first.", "error");
      return;
    }
    if (e.dataTransfer.files?.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [data, campaignName]);

  const downloadSample = () => {
    const headers = ['Submission Date', 'Creator', 'Platform', 'Campaign', 'Status', 'Content Title', 'Views', 'Amount Paid', 'Submission URL'];
    const sampleVals = [
      '2026-05-01',
      '@sample_creator',
      'TikTok',
      'Sample Campaign',
      'Approved',
      'Test Clip',
      '15000',
      '75.00',
      'https://tiktok.com/@sample'
    ];
    
    const csvContext = `${headers.join(',')}\n${sampleVals.join(',')}`;
    const blob = new Blob([csvContext], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'opsrelic-sample.csv';
    a.click();
  };

  return (
    <div className="w-full flex flex-col xl:flex-row gap-8 items-start">
      
      {/* LEFT COLUMN (75%) */}
      <div className="w-full xl:w-[75%] space-y-10">
        <h1 className="text-4xl font-display font-black tracking-tighter text-white uppercase italic">Upload Data</h1>
        
        {/* STEP 1: CAMPAIGN SETUP */}
        <div className="bg-[#0A0A0A] border border-white/[0.05] rounded-[48px] p-10 md:p-14 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent opacity-50"></div>
          <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-600/30">01</div>
            <h2 className="text-2xl font-display font-black text-white tracking-widest uppercase italic">Campaign Selection</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex gap-2 p-1 bg-black/40 rounded-xl mb-4">
                <button 
                  onClick={() => setTargetType('existing')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${targetType === 'existing' ? 'bg-blue-600 text-white shadow-lg' : 'text-[#555] hover:text-[#888]'}`}
                >
                  Existing Campaign
                </button>
                <button 
                  onClick={() => setTargetType('new')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${targetType === 'new' ? 'bg-blue-600 text-white shadow-lg' : 'text-[#555] hover:text-[#888]'}`}
                >
                  New Campaign
                </button>
              </div>

              {targetType === 'existing' ? (
                <div>
                  <label className="block text-[11px] font-bold text-[#888] uppercase tracking-widest mb-2 text-blue-500/80">Select Target Campaign <span className="text-red-500">*</span></label>
                  <select 
                    value={selectedCampaignId}
                    onChange={e => setSelectedCampaignId(e.target.value)}
                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 shadow-inner appearance-none relative"
                  >
                    <option value="" disabled>Choose a campaign...</option>
                    {campaignsList.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {campaignsList.length === 0 && (
                    <p className="text-[10px] text-red-400 mt-2 font-medium">No existing campaigns found. Please create a new one.</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-[#888] uppercase tracking-widest mb-2">New Campaign Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="e.g., April Spring Push 2026"
                    value={campaignName}
                    onChange={e => setCampaignName(e.target.value)}
                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 shadow-inner transition-colors"
                  />
                </div>
              )}

              {targetType === 'new' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#888] uppercase tracking-widest mb-2 flex items-center gap-2">
                      Reward Rate 
                      <div className="group relative">
                        <AlertCircle className="w-3.5 h-3.5 text-[#555] cursor-help" />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-black border border-white/10 text-[#888] text-[10px] p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                          How much you pay clippers per 1,000 views. Used for auto-calculating earnings if Amount Paid column is missing.
                        </div>
                      </div>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#888] font-bold">$</span>
                      <input 
                        type="number" 
                        placeholder="5"
                        min="0"
                        step="0.01"
                        value={rewardRate}
                        onChange={e => setRewardRate(e.target.value)}
                        className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl pl-8 pr-12 py-3 text-sm text-white focus:outline-none focus:border-blue-500 shadow-inner transition-colors"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666] text-xs font-bold">/1K</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#888] uppercase tracking-widest mb-2 flex items-center gap-2">
                      Campaign Budget 
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#888] font-bold">$</span>
                      <input 
                        type="number" 
                        placeholder="1000"
                        min="0"
                        step="1"
                        value={campaignBudget}
                        onChange={e => setCampaignBudget(e.target.value)}
                        className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 shadow-inner transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {targetType === 'new' ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-[#888] uppercase tracking-widest mb-2">Client Name (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g., BrandName or Client Name"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 shadow-inner transition-colors"
                  />
                </div>

                {clientName && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 space-y-4 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-2">
                        <Palette className="w-4 h-4 text-[#888]" /> White-label Branding
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={useWhiteLabel}
                          onChange={e => setUseWhiteLabel(e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/10 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                    </div>
                    
                    {useWhiteLabel && (
                      <div className="flex items-center gap-4">
                        <input 
                          type="color" 
                          value={primaryColor}
                          onChange={e => setPrimaryColor(e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                        />
                        <div className="text-xs text-[#888] font-medium max-w-[200px]">
                          Primary color used in generated reports for this campaign.
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-[#888] uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Campaign Date Range
                  </label>
                  <div className="flex gap-4">
                    <input 
                      type="date" 
                      value={dateRange.from}
                      onChange={e => setDateRange(prev => ({...prev, from: e.target.value}))}
                      className="flex-1 bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#888] focus:text-white focus:outline-none focus:border-blue-500 shadow-inner transition-colors"
                    />
                    <input 
                      type="date" 
                      value={dateRange.to}
                      onChange={e => setDateRange(prev => ({...prev, to: e.target.value}))}
                      className="flex-1 bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#888] focus:text-white focus:outline-none focus:border-blue-500 shadow-inner transition-colors"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[10px] text-[#555] font-medium">Leave blank to auto-detect from CSV records.</p>
                    {(dateRange.from || dateRange.to) && (
                      <button 
                        onClick={() => setDateRange({from: '', to: ''})}
                        className="text-[10px] text-blue-500 hover:text-blue-400 font-bold"
                      >
                        Reset Range
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                  <CheckCircle className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-1">Smart Sync Active</h4>
                  <p className="text-[#888] text-sm max-w-[280px]">
                    Adding new records to <span className="text-white font-black">{campaignsList.find(c => c.id === selectedCampaignId)?.name}</span>. Existing settings will be preserved.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* STEP 2: UPLOAD ZONE */}
        <div className="bg-[#0A0A0A] border border-white/[0.05] rounded-[48px] p-10 md:p-14 shadow-2xl relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent opacity-50"></div>
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-600/30">02</div>
            <h2 className="text-2xl font-display font-black text-white tracking-widest uppercase italic">Upload CSV</h2>
          </div>

          <AnimatePresence>
            {isDragging && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-blue-600/5 pointer-events-none transition-opacity z-0"
              />
            )}
          </AnimatePresence>
          
          <label 
            htmlFor="csv-upload"
            onDragOver={(e) => { e.preventDefault(); if (targetType === 'new' ? campaignName : selectedCampaignId) setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`block border-2 border-dashed rounded-[32px] p-20 text-center transition-all duration-500 relative z-10 ${
              !(targetType === 'new' ? campaignName : selectedCampaignId) 
                ? 'opacity-20 cursor-not-allowed border-white/5 bg-white/[0.01]' 
                : isDragging 
                  ? 'border-blue-600 bg-blue-600/10 scale-[1.01] cursor-pointer shadow-[0_0_50px_rgba(37,99,235,0.2)]' 
                  : 'border-white/5 hover:border-blue-500/30 hover:bg-white/[0.02] cursor-pointer'
            }`}
          >
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              id="csv-upload"
              disabled={!(targetType === 'new' ? campaignName : selectedCampaignId)}
              onChange={(e) => e.target.files && processFile(e.target.files[0])}
            />
            <AnimatePresence mode="wait">
              {syncSummary ? (
                <motion.div 
                   key="summary"
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="space-y-6 py-4"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                       <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-white tracking-tight">Scan Complete</h3>
                       <p className="text-[#888] text-sm mt-1">Processed {syncSummary.fileName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                     <div className="bg-black/40 border border-white/5 rounded-2xl p-6 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#555] mb-2 text-emerald-500/80">New Additions</p>
                        <p className="text-4xl font-black text-white">+{syncSummary.new.length}</p>
                     </div>
                     <div className="bg-black/40 border border-white/5 rounded-2xl p-6 text-center opacity-60">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#555] mb-2">Already Synced</p>
                        <p className="text-4xl font-black text-[#555]">{syncSummary.duplicates.length}</p>
                     </div>
                  </div>

                  <div className="flex items-center justify-center gap-4 pt-4">
                     <button 
                        onClick={() => setSyncSummary(null)}
                        className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-[#888] hover:text-white transition-colors"
                     >
                        Cancel
                     </button>
                     <button 
                        onClick={confirmImport}
                        disabled={isProcessing || syncSummary.new.length === 0}
                        className="px-10 py-4 rounded-xl font-black tracking-widest uppercase bg-blue-600 text-white shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        {isProcessing ? 'Synchronizing...' : `Sync ${syncSummary.new.length} Clips`}
                     </button>
                  </div>
                  {syncSummary.new.length === 0 && (
                    <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mt-4">Campaign is already up to date!</p>
                  )}
                </motion.div>
              ) : (
                <motion.div key="upload-prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <motion.div 
                    animate={{ y: isDragging ? -10 : 0, scale: isDragging ? 1.1 : 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <UploadCloud className={`w-16 h-16 mx-auto mb-6 ${!(targetType === 'new' ? campaignName : selectedCampaignId) ? 'text-[#333]' : isDragging ? 'text-[#FF6B35]' : 'text-[#888]'}`} />
                  </motion.div>
                  <h3 className={`text-2xl font-black tracking-tight mb-3 ${!(targetType === 'new' ? campaignName : selectedCampaignId) ? 'text-[#555]' : isDragging ? 'text-[#FF6B35]' : 'text-white'}`}>
                    {!(targetType === 'new' ? campaignName : selectedCampaignId) ? 'Select a Campaign First' : 'Drop your CSV here'}
                  </h3>
                  <p className="text-[#888] font-medium mb-8">
                    {!(targetType === 'new' ? campaignName : selectedCampaignId) ? 'Please select or create a campaign to unlock uploading.' : 'or click to browse files on your computer'}
                  </p>
                  
                  <div className={`px-10 py-4 rounded-xl font-black tracking-widest uppercase transition-all duration-300 inline-flex items-center gap-2 ${
                    !(targetType === 'new' ? campaignName : selectedCampaignId) || isProcessing
                      ? 'bg-white/5 text-[#555] cursor-not-allowed' 
                      : 'bg-[#FF6B35] text-white shadow-[0_0_30px_rgba(255,107,53,0.3)] hover:scale-105 hover:bg-[#FF8555]'
                  }`}>
                    {isProcessing ? (
                      <><Loader className="w-5 h-5 animate-spin" /> Analyzing...</>
                    ) : (
                      <><UploadCloud className="w-5 h-5" /> Analyze Records</>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </label>
        </div>

      </div>


      {/* RIGHT COLUMN (25%) */}
      <div className="w-full xl:w-[25%] space-y-8 xl:sticky xl:top-32">
        {/* Column Summary */}
        <div className="bg-[#111] border border-white/[0.05] rounded-2xl p-6 shadow-lg">
          <h3 className="font-black text-white tracking-wide mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-500" /> Upload Summary
          </h3>
          <div className="bg-black/30 rounded-xl p-4 border border-white/5 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <span className="text-xs font-bold text-[#888]">Target</span>
                <span className="text-xs font-black text-white px-2 py-1 bg-white/10 rounded truncate max-w-[120px]" title={targetType === 'existing' ? campaignsList.find(c => c.id === selectedCampaignId)?.name : campaignName}>
                   {targetType === 'existing' 
                      ? (campaignsList.find(c => c.id === selectedCampaignId)?.name || 'Needs Choice') 
                      : (campaignName || 'Needs Name')}
                </span>
             </div>
             
             {targetType === 'new' && (
               <>
                 <div className="flex justify-between items-center pb-3 border-b border-white/5">
                   <span className="text-xs font-bold text-[#888]">Reward Rate</span>
                   <span className="text-xs font-black text-emerald-400">{rewardRate ? `$${rewardRate}` : '—'}</span>
                 </div>
                 <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="text-xs font-bold text-[#888]">White-label</span>
                    <span className="text-xs font-black text-white flex items-center gap-1">
                      {useWhiteLabel && clientName ? (
                        <><div className="w-3 h-3 rounded-full" style={{backgroundColor: primaryColor}}></div> Enabled</>
                      ) : <span className="text-[#555]">Disabled</span>}
                    </span>
                 </div>
               </>
             )}
             
             <div className="flex justify-between items-center pt-1">
                <span className="text-xs font-bold text-[#888]">Auto-mapping</span>
                <span className="text-xs font-black text-blue-400">Enabled</span>
             </div>
          </div>
          
          <button onClick={downloadSample} className="w-full mt-6 flex justify-center items-center gap-2 text-white/70 hover:text-white px-5 py-3 text-xs font-bold tracking-widest uppercase border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <Download className="w-4 h-4" /> Download Sample CSV
          </button>
        </div>

        {/* Dataset History / Mini View */}
        <div className="bg-[#111] border border-white/[0.05] shadow-lg rounded-2xl overflow-hidden flex flex-col xl:max-h-[500px]">
          <div className="p-6 border-b border-white/[0.05] flex items-center justify-between shrink-0 bg-[#111] z-10">
            <h3 className="font-black text-white tracking-wide flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" /> Current Dataset
            </h3>
          </div>
          
          <div className="overflow-y-auto w-full flex-1 p-2">
            {data.length === 0 ? (
              <div className="p-8 pb-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5 text-[#444]" />
                </div>
                <p className="text-sm font-bold text-[#666]">No data loaded</p>
                <p className="text-[10px] text-[#555] mt-1 font-medium">Upload a CSV to populate dataset.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {data.slice(0, 5).map((row, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-lg hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-all">
                     <div className="overflow-hidden pr-2 flex-1">
                       <p className="text-xs font-bold text-white truncate max-w-[120px]">{row.Creator}</p>
                       <p className="text-[10px] text-[#888] font-medium truncate" title={row.Campaign}>{row.Campaign}</p>
                     </div>
                     <div className="text-right shrink-0">
                       <p className="text-xs font-black text-blue-400">{formatViews(row.Views)}</p>
                       <p className="text-[10px] font-bold text-emerald-400">{formatMoney(row["Amount Paid"])}</p>
                     </div>
                  </div>
                ))}
                {data.length > 5 && (
                  <div className="p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#555] bg-white/5 px-3 py-1 rounded-full">
                      + {data.length - 5} more rows
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {data.length > 0 && (
            <div className="p-4 border-t border-white/[0.05] bg-black/20 shrink-0">
                {showClearConfirm ? (
                  <div className="w-full flex flex-col gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-xs text-red-400 text-center font-bold">Are you absolutely sure? This cannot be undone.</p>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => setShowClearConfirm(false)}
                         className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white transition-colors"
                       >
                         Cancel
                       </button>
                       <button 
                         onClick={async () => {
                            setShowClearConfirm(false);
                            addToast("Clearing data, please wait...", "info");
                            
                            const user = auth.currentUser;
                            if (!user) return;
                            
                            try {
                                const qCamps = query(collection(db, 'campaigns'), where('userId', '==', user.uid));
                                const qSubs = query(collection(db, 'submissions'), where('userId', '==', user.uid));
                                
                                const campSnap = await getDocs(qCamps);
                                const subSnap = await getDocs(qSubs);
                                
                                const docsToDelete = [...campSnap.docs, ...subSnap.docs];
                                
                                for (let i = 0; i < docsToDelete.length; i += 400) {
                                    const chunk = docsToDelete.slice(i, i + 400);
                                    const chunkBatch = writeBatch(db);
                                    chunk.forEach(d => chunkBatch.delete(d.ref));
                                    await chunkBatch.commit();
                                }
                                
                                clearData();
                                addToast("All data cleared successfully.", "success");
                            } catch (error: any) {
                                console.error("Clear data error:", error);
                                addToast(error.message || "Failed to clear data completely", "error");
                            }
                         }}
                         className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-xs font-bold text-white transition-colors"
                       >
                         Confirm Delete
                       </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowClearConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" /> Clear All Data
                  </button>
                )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
