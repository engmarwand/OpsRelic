import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); // CRITICAL
export const auth = getAuth();
export const googleProvider = new GoogleAuthProvider();
export { doc, setDoc, getDoc, serverTimestamp, updateDoc };

export const ALLOWED_EMAILS = ['engmarwand@gmail.com', 'marwan.1206@gmail.com'];

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        if (!user.email || !ALLOWED_EMAILS.includes(user.email.toLowerCase())) {
            await signOut(auth);
            throw new Error("This account is not authorized to access OpsRelic.");
        }
        
        // Ensure user document exists 
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        
        if (!docSnap.exists()) {
            await setDoc(userDocRef, {
                email: user.email,
                companyName: user.displayName || 'My Agency',
                createdAt: serverTimestamp()
            });
        }
        return user;
    } catch (error) {
        console.error("Error signing in with Google: ", error);
        throw error;
    }
};

export const registerWithEmail = async (email: string, password: string, companyName: string) => {
    try {
        if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
            throw new Error("This email is not authorized for registration.");
        }

        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;

        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
            email: user.email,
            companyName: companyName || 'My Agency',
            createdAt: serverTimestamp()
        });
        return user;
    } catch (error) {
        console.error("Error registering with email: ", error);
        throw error;
    }
};

export const loginWithEmail = async (email: string, password: string) => {
    try {
        if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
            throw new Error("This account is not authorized.");
        }
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (error) {
        console.error("Error signing in with email: ", error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out: ", error);
    }
};

export const resetPassword = async (email: string) => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        console.error("Error sending password reset email: ", error);
        throw error;
    }
};
