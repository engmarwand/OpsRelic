import { db, auth } from './firebase';
import { doc, getDoc, setDoc, writeBatch, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { CsvRow } from '../types';

function sanitizeId(id: string) {
  // Remove restricted chars for valid document IDs
  return `id_${id.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 100)}`;
}

export const importCsvData = async (rows: CsvRow[], defaultCampaignName: string, campaignBudget?: number, rewardRate?: number) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Must be logged in");

    let campaignId = sanitizeId(`camp_${defaultCampaignName}`);
    
    // First, ensure the campaign exists
    const campaignRef = doc(db, 'campaigns', campaignId);
    const cSnap = await getDoc(campaignRef);
    if (!cSnap.exists()) {
        await setDoc(campaignRef, {
            userId: user.uid,
            name: defaultCampaignName,
            clientName: "Imported Client",
            budget: campaignBudget || 0,
            rewardRate: rewardRate || 0,
            status: "active",
            createdAt: serverTimestamp()
        });
    } else {
        // optionally update budget and rewardRate if supplied
        const updateData: any = {};
        if (campaignBudget !== undefined) updateData.budget = campaignBudget;
        if (rewardRate !== undefined) updateData.rewardRate = rewardRate;
        if (Object.keys(updateData).length > 0) {
            await setDoc(campaignRef, updateData, { merge: true });
        }
    }

    // Fetch existing submissions for this campaign to avoid duplicates
    const q = query(collection(db, 'submissions'), where('campaignId', '==', campaignId), where('userId', '==', user.uid));
    const existingSnap = await getDocs(q);
    const existingUrls = new Set(existingSnap.docs.map(d => d.data().url));

    // Since we have up to 500 writes in a batch, let's create creators individually or batch them
    // For simplicity we will do a sequential loop with limited batching.
    let currentBatch = writeBatch(db);
    let operationCount = 0;
    
    const creatorsSeen = new Set<string>();

    for(const row of rows) {
        const url = String((row as any)["Submission URL"] || row["Content Title"] || "https://tiktok.com").substring(0, 500);
        
        // Skip if already exists
        if (existingUrls.has(url)) continue;

        if(operationCount >= 450) {
            await currentBatch.commit();
            currentBatch = writeBatch(db);
            operationCount = 0;
        }

        const creatorHandle = String(row.Creator || "unknown_creator").trim().substring(0, 100);
        const creatorId = sanitizeId(`creator_${creatorHandle}`);
        
        if (!creatorsSeen.has(creatorId)) {
            creatorsSeen.add(creatorId);
            const creatorRef = doc(db, 'creators', creatorId);
            const cSnap = await getDoc(creatorRef);
            if (!cSnap.exists()) {
                currentBatch.set(creatorRef, {
                    userId: user.uid,
                    handle: creatorHandle,
                    platform: (row.Platform || 'tiktok').toLowerCase() === 'tiktok' ? 'tiktok' : 
                              (row.Platform || 'instagram').toLowerCase() === 'instagram' ? 'instagram' : 'youtube',
                    createdAt: serverTimestamp()
                });
                operationCount++;
                
                if(operationCount >= 450) {
                    await currentBatch.commit();
                    currentBatch = writeBatch(db);
                    operationCount = 0;
                }
            }
        }

        const subId = sanitizeId(`sub_${Date.now()}_${Math.random().toString(36).substring(2,7)}`);
        const subRef = doc(db, 'submissions', subId);
        
        let status = 'pending';
        const st = String(row.Status || '').toLowerCase();
        if (st.includes('approv')) status = 'approved';
        if (st.includes('paid')) status = 'paid';

        currentBatch.set(subRef, {
            userId: user.uid,
            campaignId: campaignId,
            creatorId: creatorId,
            url: String((row as any)["Submission URL"] || row["Content Title"] || "https://tiktok.com").substring(0, 500),
            title: String((row as any)["Content Title"] || "").substring(0, 200),
            submissionDate: String((row as any)["Submission Date"] || "2026-05-01").substring(0, 100),
            platform: String((row as any)["Platform"] || "tiktok").substring(0, 50).toLowerCase(),
            views: typeof row.Views === 'number' ? row.Views : parseInt(String(row.Views).replace(/[^0-9.-]+/g,"")) || 0,
            payout: typeof row["Amount Paid"] === 'number' ? row["Amount Paid"] : parseFloat(String(row["Amount Paid"]).replace(/[^0-9.-]+/g,"")) || 0,
            likes: typeof row.Likes === 'number' ? row.Likes : parseInt(String(row.Likes).replace(/[^0-9.-]+/g,"")) || 0,
            comments: typeof row.Comments === 'number' ? row.Comments : parseInt(String(row.Comments).replace(/[^0-9.-]+/g,"")) || 0,
            shares: typeof row.Shares === 'number' ? row.Shares : parseInt(String(row.Shares).replace(/[^0-9.-]+/g,"")) || 0,
            status: status,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        operationCount++;
    }

    if (operationCount > 0) {
        await currentBatch.commit();
    }
};
