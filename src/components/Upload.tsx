import React, { useState, useCallback, useMemo } from 'react';
import { useAppContext } from '../lib/store';
import { useToast } from '../lib/toast';
import { UploadCloud, FileText, Download, CheckCircle, AlertCircle, X, Trash2, Check, Settings, Palette, Calendar, Loader } from 'lucide-react';
import Papa from 'papaparse';
import { CsvRow } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { formatViews, formatMoney } from '../lib/data';
import { importCsvData } from '../lib/sync';

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
  const { data, setData, clearData } = useAppContext();
  const { addToast } = useToast();
  
  // Step 1: Campaign Setup State
  const [campaignName, setCampaignName] = useState('Campaign 1');
  const [rewardRate, setRewardRate] = useState('5');
  const [clientName, setClientName] = useState('');
  const [useWhiteLabel, setUseWhiteLabel] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#FF6B35');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Step 2: Column Selector State
  const [columns, setColumns] = useState<ColumnMap[]>(DEFAULT_COLUMNS);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-detect campaigns history from existing data
  const existingCampaigns = useMemo(() => {
    return Array.from(new Set(data.map(d => d.Campaign))).filter(Boolean);
  }, [data]);

  const toggleColumn = (id: string) => {
    setColumns(cols => cols.map(c => 
      c.id === id && !c.required ? { ...c, enabled: !c.enabled } : c
    ));
  };

  const updateMapping = (id: string, newMapping: string) => {
    setColumns(cols => cols.map(c => 
      c.id === id ? { ...c, mappedTo: newMapping } : c
    ));
  };

  const enabledColumns = columns.filter(c => c.enabled);
  const expectedHeaders = enabledColumns.map(c => c.mappedTo);

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      addToast("Please upload a valid .csv file.", "error");
      return;
    }

    setIsProcessing(true);

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
        
        // Check required mapped headers
        const missing = enabledColumns.filter(c => !headers.includes(c.mappedTo)).map(c => c.mappedTo);
        
        if (missing.length > 0) {
          addToast(`Missing mapped columns in CSV: ${missing.join(', ')}`, "error");
          setIsProcessing(false);
          return;
        }

        const parsedData: any[] = results.data.map((row: any) => {
          // Map dynamic row data to standard keys for our app logic based on user's column mapping
          const getVal = (id: string) => {
            const col = columns.find(c => c.id === id);
            return col && col.enabled ? row[col.mappedTo] : undefined;
          };

          return {
            ...row,
            "Submission Date": getVal('date'),
            Creator: getVal('creator'),
            Platform: getVal('platform'),
            Campaign: getVal('campaign') || campaignName,
            Status: getVal('status'),
            "Content Title": getVal('title'),
            Views: parseInt(getVal('views'), 10) || 0,
            "Amount Paid": parseFloat(getVal('amount')) || 0,
            "Submission URL": getVal('url'),
            Likes: parseInt(getVal('likes'), 10) || 0,
            Comments: parseInt(getVal('comments'), 10) || 0,
            Shares: parseInt(getVal('shares'), 10) || 0,
          };
        });

        try {
          await importCsvData(parsedData, campaignName);
          const addedCampaigns = new Set(parsedData.map(r => r.Campaign));
          addToast(`Successfully imported ${parsedData.length} records.`, "success");
        } catch (error: any) {
          addToast(error.message || "Failed to save records", "error");
        } finally {
          setIsProcessing(false);
        }
      }
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!campaignName) {
      addToast("Please specify a Campaign Name first.", "error");
      return;
    }
    if (e.dataTransfer.files?.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [data, campaignName, columns]);

  const downloadSample = () => {
    const headers = expectedHeaders.join(',');
    const sampleVals = enabledColumns.map(c => {
      if (c.id === 'date') return '2026-05-01';
      if (c.id === 'creator') return '@sample_creator';
      if (c.id === 'title') return 'Test Clip';
      if (c.id === 'platform') return 'TikTok';
      if (c.id === 'campaign') return 'Sample Campaign';
      if (c.id === 'status') return 'Approved';
      if (c.id === 'views') return '15000';
      if (c.id === 'amount') return '75.00';
      if (c.id === 'url') return 'https://tiktok.com/@sample';
      if (c.id === 'likes') return '1200';
      if (c.id === 'comments') return '45';
      if (c.id === 'shares') return '12';
      return '';
    });
    
    const csvContext = `${headers}\n${sampleVals.join(',')}`;
    const blob = new Blob([csvContext], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'opsrelic-sample-mapped.csv';
    a.click();
  };

  return (
    <div className="w-full flex flex-col xl:flex-row gap-8 items-start">
      
      {/* LEFT COLUMN (80%) */}
      <div className="w-full xl:w-[75%] space-y-8">
        <h1 className="text-3xl font-black tracking-tighter text-white">Upload Data</h1>
        
        {/* STEP 1: CAMPAIGN SETUP */}
        <div className="bg-[#111] border border-white/[0.05] rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6 border-b border-white/[0.05] pb-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm">1</div>
            <h2 className="text-xl font-bold text-white tracking-wide">Campaign Setup</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-[#888] uppercase tracking-widest mb-2">Campaign Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  placeholder="e.g., April Spring Push 2026"
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                  className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 shadow-inner transition-colors"
                />
                {existingCampaigns.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {existingCampaigns.slice(0, 4).map(c => (
                      <button 
                        key={c as string} 
                        onClick={() => setCampaignName(c as string)}
                        className="text-[10px] font-bold bg-white/5 hover:bg-white/10 text-[#888] hover:text-white px-3 py-1.5 rounded-lg transition-colors border border-white/5"
                      >
                        {c as string}
                      </button>
                    ))}
                  </div>
                )}
              </div>

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
                    className="w-full bg-[#0F0F0F] border border-white/10 rounded-xl pl-8 pr-24 py-3 text-sm text-white focus:outline-none focus:border-blue-500 shadow-inner transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666] text-xs font-bold">per 1K views</span>
                </div>
              </div>
            </div>

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
          </div>
        </div>

        {/* STEP 2: COLUMN SELECTOR */}
        <div className="bg-[#111] border border-white/[0.05] rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm">2</div>
            <h2 className="text-xl font-bold text-white tracking-wide">Map Your CSV Columns</h2>
          </div>
          <p className="text-sm font-medium text-[#888] mb-8 ml-11">
            Select which columns exist in your CSV. We'll auto-detect matching column names. You can rename any column mapping.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {columns.map(col => {
               const isRequired = col.required;
               const isEnabled = col.enabled;
               
               return (
                 <div 
                   key={col.id} 
                   className={`relative border rounded-xl transition-all duration-200 overflow-hidden ${
                     isEnabled 
                       ? 'bg-white/[0.02] border-[#FF6B35]/30' 
                       : 'bg-transparent border-white/5 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
                   }`}
                 >
                   <div 
                     className={`p-4 cursor-pointer flex items-start justify-between ${!isRequired && 'hover:bg-white/[0.02]'}`}
                     onClick={() => !isRequired && toggleColumn(col.id)}
                   >
                     <div>
                       <div className="flex items-center gap-2 mb-1">
                         <span className={`font-bold tracking-tight ${isEnabled ? 'text-white' : 'text-[#888]'}`}>
                           {col.name}
                         </span>
                         {isRequired && (
                           <span className="text-[9px] uppercase tracking-widest font-black bg-[#FF6B35]/10 text-[#FF6B35] px-1.5 py-0.5 rounded">Required</span>
                         )}
                       </div>
                       <p className="text-[10px] text-[#666] font-medium">
                         {isEnabled ? 'Will be extracted' : 'Click to enable'}
                       </p>
                     </div>
                     <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                       isEnabled ? 'bg-[#FF6B35] border-[#FF6B35] text-white shadow-[0_0_10px_rgba(255,107,53,0.3)]' : 'border-[#444] bg-transparent text-transparent'
                     }`}>
                       <Check className="w-3 h-3" strokeWidth={3} />
                     </div>
                   </div>

                   {isEnabled && (
                     <div className="p-3 bg-black/40 border-t border-[#FF6B35]/10">
                       <label className="block text-[9px] font-bold text-[#888] uppercase tracking-widest mb-1.5">Map CSV Header To:</label>
                       <div className="relative flex items-center">
                         <div className="absolute left-2.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                         <input 
                           type="text" 
                           value={col.mappedTo}
                           onChange={(e) => updateMapping(col.id, e.target.value)}
                           className="w-full bg-[#0F0F0F] border border-white/10 rounded-md pl-6 pr-3 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-[#FF6B35] transition-colors"
                         />
                       </div>
                     </div>
                   )}
                 </div>
               )
            })}
          </div>

          <div className="bg-black/20 p-5 rounded-xl border border-white/5 space-y-3">
             <div className="text-[10px] font-bold text-[#666] uppercase tracking-widest">Preview Expected Headers:</div>
             <div className="flex flex-wrap gap-2">
                {columns.map(col => {
                  if (col.required) {
                    return <span key={col.id} className="text-[11px] font-bold px-3 py-1.5 rounded bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20">{col.mappedTo}</span>
                  }
                  if (col.enabled) {
                    return <span key={col.id} className="text-[11px] font-bold px-3 py-1.5 rounded bg-white/10 text-white border border-white/10">{col.mappedTo}</span>
                  }
                  return <span key={col.id} className="text-[11px] font-bold px-3 py-1.5 rounded bg-transparent text-[#555] border border-white/5 line-through">{col.mappedTo}</span>
                })}
             </div>
          </div>
        </div>

        {/* STEP 3: UPLOAD ZONE */}
        <div className="bg-[#111] border border-white/[0.05] rounded-2xl p-8 shadow-lg relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm">3</div>
            <h2 className="text-xl font-bold text-white tracking-wide">Upload & Process</h2>
          </div>

          <AnimatePresence>
            {isDragging && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#FF6B35]/5 pointer-events-none transition-opacity z-0"
              />
            )}
          </AnimatePresence>
          
          <label 
            htmlFor="csv-upload"
            onDragOver={(e) => { e.preventDefault(); if (campaignName) setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`block border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-300 relative z-10 ${
              !campaignName 
                ? 'opacity-50 cursor-not-allowed border-white/10 bg-white/[0.01]' 
                : isDragging 
                  ? 'border-[#FF6B35] bg-[#FF6B35]/10 scale-[1.02] cursor-pointer' 
                  : 'border-white/10 hover:border-[#FF6B35]/50 hover:bg-white/[0.02] cursor-pointer'
            }`}
          >
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              id="csv-upload"
              disabled={!campaignName}
              onChange={(e) => e.target.files && processFile(e.target.files[0])}
            />
            <motion.div 
              animate={{ y: isDragging ? -10 : 0, scale: isDragging ? 1.1 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <UploadCloud className={`w-16 h-16 mx-auto mb-6 ${!campaignName ? 'text-[#333]' : isDragging ? 'text-[#FF6B35]' : 'text-[#888]'}`} />
            </motion.div>
            <h3 className={`text-2xl font-black tracking-tight mb-3 ${!campaignName ? 'text-[#555]' : isDragging ? 'text-[#FF6B35]' : 'text-white'}`}>
              {!campaignName ? 'Awaiting Campaign Setup' : 'Drop your CSV here'}
            </h3>
            <p className="text-[#888] font-medium mb-8">
              {!campaignName ? 'Please enter a Campaign Name above to unlock uploading.' : 'or click to browse files on your computer'}
            </p>
            
            <div className={`px-10 py-4 rounded-xl font-black tracking-widest uppercase transition-all duration-300 inline-flex items-center gap-2 ${
              !campaignName || isProcessing
                ? 'bg-white/5 text-[#555] cursor-not-allowed' 
                : 'bg-[#FF6B35] text-white shadow-[0_0_30px_rgba(255,107,53,0.3)] hover:scale-105 hover:bg-[#FF8555]'
            }`}>
              {isProcessing ? (
                <><Loader className="w-5 h-5 animate-spin" /> Processing...</>
              ) : (
                <><UploadCloud className="w-5 h-5" /> Start Upload</>
              )}
            </div>
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
                <span className="text-xs font-bold text-[#888]">Campaign</span>
                <span className="text-xs font-black text-white px-2 py-1 bg-white/10 rounded truncate max-w-[120px]" title={campaignName}>{campaignName || '—'}</span>
             </div>
             <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <span className="text-xs font-bold text-[#888]">Reward Rate</span>
                <span className="text-xs font-black text-emerald-400">{rewardRate ? `$${rewardRate}` : '—'}</span>
             </div>
             <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <span className="text-xs font-bold text-[#888]">Total Columns</span>
                <span className="text-xs font-black text-blue-400">{enabledColumns.length} Active</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#888]">White-label</span>
                <span className="text-xs font-black text-white flex items-center gap-1">
                  {useWhiteLabel && clientName ? (
                    <><div className="w-3 h-3 rounded-full" style={{backgroundColor: primaryColor}}></div> Enabled</>
                  ) : <span className="text-[#555]">Disabled</span>}
                </span>
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
              <button 
                onClick={() => {
                  if(window.confirm('Clear all data?')) {
                    clearData();
                    addToast("Dataset cleared successfully.", "info");
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" /> Clear All Data
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
