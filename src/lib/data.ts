import { CsvRow } from '../types';

export const generateSampleData = (): CsvRow[] => {
  const creators = ["@viral_alex", "@content_king", "@clip_master", "@tiktok_pro", "@reels_queen", "@yt_clips", "@promo_vibes", "@edit_god"];
  const campaigns = ["April Spring Push", "May Launch Campaign"];
  const data: CsvRow[] = [];
  const now = new Date();
  
  for(let i=0; i<300; i++) {
      const cmp = campaigns[i % 2 === 0 ? 0 : 1];
      const cr = creators[Math.floor(Math.random() * creators.length)];
      const p = Math.random();
      const plat = p < 0.6 ? "TikTok" : p < 0.85 ? "Instagram" : p < 0.95 ? "YouTube" : "Other";
      
      // Status distribution: mostly Approved (80%), some Pending (12%), few Rejected (8%)
      const statusP = Math.random();
      const status = statusP < 0.8 ? "Approved" : statusP < 0.92 ? "Pending" : "Rejected";
      
      // Views ranging from 8,000 to 450,000
      const views = Math.floor(Math.random() * (450000 - 8000 + 1)) + 8000;
      
      // Dates spanning last 30 days
      const d = new Date(now.getTime() - Math.floor(Math.random()*30)*24*60*60*1000);
      
      data.push({
          "Submission Date": d.toISOString().split('T')[0],
          "Creator": cr,
          "Content Title": `Clip ${i+1} viral test`,
          "Platform": plat,
          "Campaign": cmp,
          "Status": status,
          "Views": views,
          // Amount Paid calculated at $5 per 1K views
          "Amount Paid": parseFloat((views / 1000 * 5).toFixed(2))
      });
  }
  return data;
};

export const formatViews = (views: number): string => {
  if (views >= 1000000) return (views / 1000000).toFixed(1) + "M";
  if (views >= 1000) return (views / 1000).toFixed(1) + "K";
  return views.toString();
};

export const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};
