import React, { useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { writeBatch, collection, getDocs, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from '../lib/toast';
import { useAppContext } from '../lib/store';

export default function ResetData() {
  const [isResetting, setIsResetting] = useState(false);
  const { workspace } = useAppContext();
  const { addToast } = useToast();

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete ALL your data? This cannot be undone.")) return;
    
    setIsResetting(true);
    addToast("Starting data reset...", "info");

    try {
      const collections = [
        'campaigns', 'clients', 'submissions', 'campaign_briefs', 'campaign_updates', 'clipMetrics', 'user_config'
      ];

      for (const colName of collections) {
        const querySnapshot = await getDocs(collection(db, colName));
        if (querySnapshot.size > 0) {
          const batch = writeBatch(db);
          querySnapshot.docs.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();
        }
      }

      if (workspace?.id) {
        const subCollections = ['tasks', 'discussion', 'files'];
        for (const subCol of subCollections) {
          const q = collection(db, 'workspaces', workspace.id, subCol);
          const querySnapshot = await getDocs(q);
          if (querySnapshot.size > 0) {
            const batch = writeBatch(db);
            querySnapshot.docs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
          }
        }
      }

      addToast("Data reset successfully", "success");
      window.location.reload();
    } catch (err) {
      console.error(err);
      addToast("Failed to reset data", "error");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <button
      onClick={handleReset}
      disabled={isResetting}
      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
    >
      {isResetting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
      {isResetting ? 'Resetting...' : 'Permanently Reset All Data'}
    </button>
  );
}
