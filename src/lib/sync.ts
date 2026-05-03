import { db, auth } from './firebase';
import { doc, getDoc, setDoc, writeBatch, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { CsvRow } from '../types';

function sanitizeId(id: string) {
  // Remove restricted chars for valid document IDs
  return `id_${id.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 100)}`;
}

export const importCsvData = async (rows: CsvRow[], defaultCampaignName: string) => {
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
            budget: 0,
            status: "active",
            createdAt: serverTimestamp()
        });
    }

    // Since we have up to 500 writes in a batch, let's create creators individually or batch them
    // For simplicity we will do a sequential loop with limited batching.
    const batch = writeBatch(db);
    let operationCount = 0;
    
    // To allow multiple batches we'll need an array of batches
    let currentBatch = writeBatch(db);

    const creatorsSeen = new Set<string>();

    for(const row of rows) {
        if(operationCount >= 450) {
            await currentBatch.commit();
            currentBatch = writeBatch(db);
            operationCount = 0;
        }

        const creatorHandle = row.Creator || "unknown_creator";
        const creatorId = sanitizeId(`creator_${creatorHandle}`);
        
        if (!creatorsSeen.has(creatorId)) {
            creatorsSeen.add(creatorId);
            const creatorRef = doc(db, 'creators', creatorId);
            currentBatch.set(creatorRef, {
                userId: user.uid,
                handle: creatorHandle,
                platform: (row.Platform || 'tiktok').toLowerCase() === 'tiktok' ? 'tiktok' : 
                          (row.Platform || 'instagram').toLowerCase() === 'instagram' ? 'instagram' : 'youtube',
                createdAt: serverTimestamp()
            }, { merge: true });
            operationCount++;
            
            if(operationCount >= 450) {
                await currentBatch.commit();
                currentBatch = writeBatch(db);
                operationCount = 0;
            }
        }

        const subId = sanitizeId(`sub_${Date.now()}_${Math.random().toString(36).substring(2,7)}`);
        const subRef = doc(db, 'submissions', subId);
        
        // Map status
        let status = 'pending';
        if (row.Status.toLowerCase().includes('approv')) status = 'approved';
        if (row.Status.toLowerCase().includes('paid')) status = 'paid';

        currentBatch.set(subRef, {
            userId: user.uid,
            campaignId: campaignId,
            creatorId: creatorId,
            url: (row as any)["Submission URL"] || row["Content Title"] || "https://tiktok.com",
            views: typeof row.Views === 'number' ? row.Views : parseInt(String(row.Views).replace(/[^0-9.-]+/g,"")) || 0,
            payout: typeof row["Amount Paid"] === 'number' ? row["Amount Paid"] : parseFloat(String(row["Amount Paid"]).replace(/[^0-9.-]+/g,"")) || 0,
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
