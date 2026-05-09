import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { db, doc, getDoc, updateDoc, auth } from '../lib/firebase';
import { updatePassword } from 'firebase/auth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export default function PasswordSecurityModal({ isOpen, onClose, email }: Props) {
  const [step, setStep] = useState<'verify' | 'newPassword'>('verify');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    const user = auth.currentUser;
    if (!user) return;

    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        if (userData?.passwordResetCode === code) {
            setStep('newPassword');
        } else {
            setError('Invalid code.');
        }
    } catch (err) {
        setError('Error verifying code.');
    } finally {
        setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
        setError('Passwords do not match.');
        return;
    }
    setLoading(true);
    setError('');
    try {
        if (auth.currentUser) {
            await updatePassword(auth.currentUser, newPassword);
            alert("Password updated successfully!");
            onClose();
        }
    } catch (err) {
        setError('Error updating password: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
      <div className="bg-[#111] border border-white/5 rounded-3xl p-10 w-full max-w-sm space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black text-white">Security</h3>
          <button onClick={onClose}><X className="text-[#444]" /></button>
        </div>

        {step === 'verify' ? (
            <div className="space-y-4">
                <p className="text-xs text-[#888]">Enter the code sent to {email}</p>
                <input 
                    value={code} 
                    onChange={(e) => setCode(e.target.value)} 
                    placeholder="6-digit code" 
                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-white"
                />
                <button onClick={handleVerify} className="w-full bg-blue-600 text-white rounded-2xl p-4 font-bold">
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Verify'}
                </button>
            </div>
        ) : (
            <div className="space-y-4">
                <input 
                    type="password"
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="New password" 
                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-white"
                />
                <input 
                    type="password"
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Confirm new password" 
                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-white"
                />
                <button onClick={handleChangePassword} className="w-full bg-blue-600 text-white rounded-2xl p-4 font-bold">
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Update Password'}
                </button>
            </div>
        )}
        {error && <p className="text-red-500 text-xs">{error}</p>}
      </div>
    </div>
  );
}
