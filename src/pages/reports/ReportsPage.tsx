import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../../lib/store';
import { formatViews, formatMoney } from '../../lib/data';
import { 
  BarChart2, 
  Download,
  Share2,
  Users,
  Eye,
  Filter,
  DollarSign,
  Zap,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { useToast } from '../../lib/toast';
import Chart from 'chart.js/auto';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function ReportsPage() {
  const { addToast } = useToast();
  const { data, campaignsList, clients, getCampaignName } = useAppContext();
  const [selectedClientId, setSelectedClientId] = useState<string>('All');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('All');
  const [timeframe, setTimeframe] = useState<'30' | '90' | 'all'>('30');
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const filteredClients = clients || [];
  const filteredCampaigns = useMemo(() => {
    if (selectedClientId === 'All') return campaignsList || [];
    return (campaignsList || []).filter(c => c.clientId === selectedClientId);
  }, [selectedClientId, campaignsList]);

  const reportData = useMemo(() => {
    let base = data.filter(r => r.Status === 'Approved' || r.Status === 'approved');
    if (selectedCampaignId !== 'All') {
        base = base.filter(r => r._campaignId === selectedCampaignId);
    } else if (selectedClientId !== 'All') {
        const clientCampIds = (campaignsList || []).filter(c => c.clientId === selectedClientId).map(c => c.id);
        base = base.filter(r => clientCampIds.includes(r._campaignId));
    }
    return base;
  }, [data, selectedClientId, selectedCampaignId, campaignsList]);

  const stats = useMemo(() => {
    const views = reportData.reduce((s, r) => s + r.Views, 0);
    const cost = reportData.reduce((s, r) => s + (r.payout || r["Amount Paid"] || 0), 0);
    const ecpm = views > 0 ? (cost / views) * 1000 : 0;
    return {
        views: formatViews(views),
        cost: formatMoney(cost),
        creators: new Set(reportData.map(r => r.Creator || r.creatorId)).size,
        ecpm: formatMoney(ecpm)
    };
  }, [reportData]);

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  const chartData = useMemo(() => {
    const viewsByDate: Record<string, number> = {};
    const limit = timeframe === '30' ? 30 : timeframe === '90' ? 90 : 365;
    
    // Create a continuous range of dates for the timeframe
    const dates: string[] = [];
    const now = new Date();
    for (let i = limit - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    // Initialize with 0
    dates.forEach(d => viewsByDate[d] = 0);

    // Populate with actual data
    reportData.forEach(r => {
      const d = (r.submissionDate || r["Submission Date"] || '').split('T')[0];
      if (d && viewsByDate[d] !== undefined) {
        viewsByDate[d] += (r.Views || r.views || 0);
      }
    });

    return {
      labels: dates.map(date => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      dataPoints: dates.map(date => viewsByDate[date])
    };
  }, [reportData, timeframe]);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, 300);
        g.addColorStop(0, 'rgba(0,212,232,0.3)');
        g.addColorStop(1, 'rgba(0,212,232,0)');
        
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: chartData.labels,
            datasets: [{
              label: 'Views',
              data: chartData.dataPoints,
              borderColor: '#00d4e8',
              backgroundColor: g,
              borderWidth: 2.5,
              pointRadius: 2,
              tension: 0.4,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#7a8fa6', font: { family: 'Inter', size: 11 } } },
              y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#7a8fa6', font: { family: 'Inter', size: 11 } } }
            }
          }
        });
      }
    }
  }, [chartData]);

  const platformStats = useMemo(() => {
    const platforms: Record<string, number> = {};
    reportData.forEach(r => {
      const p = (r.platform || r.Platform || 'Other').toLowerCase();
      platforms[p] = (platforms[p] || 0) + 1;
    });
    const total = reportData.length || 1;
    return Object.entries(platforms).map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      val: Math.round((count / total) * 100),
      count
    })).sort((a, b) => b.val - a.val).slice(0, 5);
  }, [reportData]);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    addToast('Generating PDF report...', 'info');
    
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#050505'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      const fileName = `OpsRelic-Report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      addToast('Report downloaded successfully', 'success');
    } catch (err) {
      console.error('PDF export error:', err);
      addToast('Failed to export PDF. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="page active p-6 md:p-8 min-h-[calc(100vh-var(--topbar-h))]">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-xl font-extrabold text-[var(--color-text-main)] tracking-[-0.025em]">Reports</h1>
          <p className="text-sm text-muted mt-[3px]">Performance intelligence and distribution tracking</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={handleExportPDF} 
             disabled={isExporting}
             className="btn btn-ghost hover:bg-[var(--color-surface2)] px-4"
           >
             {isExporting ? <Loader2 className="w-[14px] h-[14px] animate-spin" /> : <Download className="w-[14px] h-[14px]" />}
             {isExporting ? 'Exporting...' : 'Export PDF'}
           </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6">
        {/* Filters Bar */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-4 lg:p-6 mb-6 flex flex-col md:flex-row items-center gap-4 lg:gap-6 shadow-sm">
           <div className="flex items-center gap-4 w-full md:w-auto flex-1">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0">
               <Filter className="w-4 h-4 text-muted" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              <div className="flex flex-col gap-[5px]">
                 <label className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted">Client Filter</label>
                 <select 
                   value={selectedClientId} 
                   onChange={e => {
                       setSelectedClientId(e.target.value);
                       setSelectedCampaignId('All');
                   }}
                   className="w-full bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-2 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-cyan)] shadow-sm cursor-pointer"
                 >
                   <option value="All">All Clients</option>
                   {filteredClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>

              <div className="flex flex-col gap-[5px]">
                 <label className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted">Campaign Filter</label>
                 <select 
                   value={selectedCampaignId} 
                   onChange={e => setSelectedCampaignId(e.target.value)}
                   className="w-full bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-md px-3 py-2 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-cyan)] shadow-sm cursor-pointer"
                 >
                   <option value="All">All Campaigns</option>
                   {filteredCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>
            </div>
         </div>

         <div className="flex bg-[var(--color-surface2)] border border-[var(--color-border-subtle)] rounded-lg p-1 shrink-0 self-start md:self-auto mt-2 md:mt-0">
            {['30', '90', 'all'].map(t => (
               <button 
                 key={t}
                 onClick={() => setTimeframe(t as any)}
                 className={cn(
                    "px-4 py-[6px] rounded-md text-[11px] font-semibold transition-colors",
                    timeframe === t ? "bg-[var(--color-surface)] text-[var(--color-text-main)] shadow-sm" : "text-muted hover:text-[var(--color-text-main)]"
                 )}
               >
                 {t === '30' ? 'Last 30d' : t === '90' ? 'Last 90d' : 'Lifetime'}
               </button>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 shadow-sm">
           <div className="flex items-center gap-3 mb-2">
             <div className="w-8 h-8 rounded-lg bg-[var(--color-cyan-dim)] text-[var(--color-cyan)] flex items-center justify-center"><Eye className="w-4 h-4"/></div>
             <div className="text-xs font-bold text-muted uppercase tracking-[0.07em]">Total Views</div>
           </div>
           <div className="font-display text-2xl font-extrabold text-[var(--color-text-main)]">{stats.views}</div>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 shadow-sm">
           <div className="flex items-center gap-3 mb-2">
             <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><DollarSign className="w-4 h-4"/></div>
             <div className="text-xs font-bold text-muted uppercase tracking-[0.07em]">Total Spent</div>
           </div>
           <div className="font-display text-2xl font-extrabold text-[var(--color-text-main)]">{stats.cost}</div>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 shadow-sm">
           <div className="flex items-center gap-3 mb-2">
             <div className="w-8 h-8 rounded-lg bg-[var(--color-purple-dim)] text-[var(--color-purple)] flex items-center justify-center"><Users className="w-4 h-4"/></div>
             <div className="text-xs font-bold text-muted uppercase tracking-[0.07em]">Active Creators</div>
           </div>
           <div className="font-display text-2xl font-extrabold text-[var(--color-text-main)]">{stats.creators}</div>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-5 shadow-sm">
           <div className="flex items-center gap-3 mb-2">
             <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center"><Zap className="w-4 h-4"/></div>
             <div className="text-xs font-bold text-muted uppercase tracking-[0.07em]">Efficiency (eCPM)</div>
           </div>
           <div className="font-display text-2xl font-extrabold text-[var(--color-text-main)]">{stats.ecpm}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mb-6">
         <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col">
            <h3 className="font-display text-md font-bold text-[var(--color-text-main)] mb-6">Performance Evolution</h3>
            <div className="relative flex-1">
               <canvas ref={chartRef}></canvas>
            </div>
         </div>

         <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm flex flex-col">
            <h3 className="font-display text-md font-bold text-[var(--color-text-main)] mb-6">Platform Mix</h3>
            <div className="flex-1 flex flex-col justify-center gap-4">
              {platformStats.length > 0 ? platformStats.map(p => (
                <div key={p.name} className="flex flex-col gap-2">
                   <div className="flex justify-between items-center text-sm font-semibold">
                     <span className="text-[var(--color-text-main)]">{p.name} <span className="text-muted font-normal text-xs ml-1">({p.count})</span></span>
                     <span className="text-[var(--color-cyan)]">{p.val}%</span>
                   </div>
                   <div className="h-2 w-full bg-[var(--color-surface2)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--color-cyan)] rounded-full" style={{ width: `${p.val}%` }}></div>
                   </div>
                </div>
              )) : (
                <div className="text-center text-muted text-sm py-10">No platform data available for the selected filters.</div>
              )}
            </div>
         </div>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl shadow-sm overflow-hidden flex flex-col">
         <div className="p-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface2)]">
            <h3 className="font-display text-md font-bold text-[var(--color-text-main)]">Data Breakdown</h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-[var(--color-surface2)] border-b border-[var(--color-border-subtle)]">
                     <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.07em] text-muted">Asset Title</th>
                     <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.07em] text-muted">Creator</th>
                     <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.07em] text-muted text-right">Views</th>
                     <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.07em] text-muted text-right">Payout</th>
                  </tr>
               </thead>
               <tbody>
                  {reportData.length === 0 ? (
                    <tr><td colSpan={4} className="py-20 text-center text-muted">No data entries found.</td></tr>
                  ) : reportData.slice(-15).map((row, i) => (
                     <tr key={i} className="border-b border-[var(--color-border-subtle)] last:border-0 hover:bg-[var(--color-surface-hover)] transition-colors">
                        <td className="px-6 py-[14px]">
                           <div className="font-semibold text-sm text-[var(--color-text-main)] truncate max-w-[300px]">{row["Content Title"] || row.title}</div>
                           <div className="text-xs text-muted mt-[2px]">{getCampaignName(row._campaignId || row.campaignId)}</div>
                        </td>
                        <td className="px-6 py-[14px] text-sm text-[var(--color-text-main)] font-medium">{row.Creator || row.creatorId}</td>
                        <td className="px-6 py-[14px] text-sm text-[var(--color-text-main)] font-bold tabular-nums text-right bg-black/10">{formatViews(row.Views || row.views)}</td>
                        <td className="px-6 py-[14px] text-sm text-[var(--color-green)] font-bold tabular-nums text-right">{formatMoney(row["Amount Paid"] || row.payout || 0)}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
     </div>
    </div>
  );
}
