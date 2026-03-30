import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { auth, googleProvider, db, isConfigured, USERS_COLLECTION } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isOwner: boolean;
  isStaff: boolean;
  authLoading: boolean;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = 'invoice_app_session';
const LOCAL_ROLES_KEY = 'invoice_app_user_roles';

// ── Local fallback for roles ────────────────────────────────
function getLocalRoles(): Record<string, UserRole> {
  try {
    const data = localStorage.getItem(LOCAL_ROLES_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveLocalRoles(roles: Record<string, UserRole>) {
  localStorage.setItem(LOCAL_ROLES_KEY, JSON.stringify(roles));
}

// ── Fetch user role from Firestore or local storage ─────────
async function resolveUserRole(uid: string, email: string | null, displayName: string | null, photoURL: string | null): Promise<UserRole> {
  if (db) {
    try {
      const userDocRef = doc(db, USERS_COLLECTION, uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        return (userDoc.data().role as UserRole) || 'staff';
      }

      // New user — check if they're the very first user (becomes Owner)
      const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
      const isFirstUser = usersSnapshot.empty;
      const role: UserRole = isFirstUser ? 'owner' : 'staff';

      // Create user document
      await setDoc(userDocRef, {
        email: email || '',
        name: displayName || '',
        photoURL: photoURL || '',
        role,
        createdAt: new Date().toISOString(),
      });

      return role;
    } catch (err) {
      console.error('Error resolving user role from Firestore:', err);
      // Fall through to local
    }
  }

  // Local fallback
  const localRoles = getLocalRoles();
  if (localRoles[uid]) return localRoles[uid];

  // First local user becomes owner
  const isFirst = Object.keys(localRoles).length === 0;
  const role: UserRole = isFirst ? 'owner' : 'staff';
  localRoles[uid] = role;
  saveLocalRoles(localRoles);
  return role;
}

// ── Provider ────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Firebase onAuthStateChanged — persists login sessions ──
  useEffect(() => {
    if (auth && isConfigured) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const role = await resolveUserRole(
            firebaseUser.uid,
            firebaseUser.email,
            firebaseUser.displayName,
            firebaseUser.photoURL
          );

          const userData: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || '',
            role,
            photoURL: firebaseUser.photoURL || undefined,
          };

          setUser(userData);
          localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
        } else {
          setUser(null);
          localStorage.removeItem(SESSION_KEY);
        }
        setAuthLoading(false);
      });

      return () => unsubscribe();
    } else {
      // No Firebase — restore from localStorage if available
      try {
        const saved = localStorage.getItem(SESSION_KEY);
        if (saved) setUser(JSON.parse(saved));
      } catch {
        /* empty */
      }
      setAuthLoading(false);
    }
  }, []);

  // ── Google Sign-In ────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    if (!auth || !googleProvider) {
      return {
        success: false,
        error: 'Firebase Auth is not configured. Add VITE_FIREBASE_* environment variables to enable Google Sign-In.',
      };
    }

    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle setting the user
      return { success: true };
    } catch (err: any) {
      console.error('Google sign-in error:', err);

      if (err.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Sign-in popup was closed. Please try again.' };
      }
      if (err.code === 'auth/cancelled-popup-request') {
        return { success: false, error: 'Another sign-in popup is already open.' };
      }
      if (err.code === 'auth/unauthorized-domain') {
        return {
          success: false,
          error: 'This domain is not authorized for Firebase Auth. Go to Firebase Console → Authentication → Settings → Authorized domains and add this domain.',
        };
      }
      if (err.code === 'auth/popup-blocked') {
        return { success: false, error: 'Pop-up was blocked by your browser. Please allow pop-ups and try again.' };
      }

      return { success: false, error: err.message || 'Google sign-in failed. Please try again.' };
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Sign-out error:', err);
      }
    }
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  // ── Update user role (Owner only) ─────────────────────────
  const updateUserRole = useCallback(
    async (userId: string, role: UserRole) => {
      // Update in Firestore
      if (db) {
        try {
          await setDoc(doc(db, USERS_COLLECTION, userId), { role }, { merge: true });
        } catch (err) {
          console.error('Error updating user role in Firestore:', err);
        }
      }

      // Update locally
      const localRoles = getLocalRoles();
      localRoles[userId] = role;
      saveLocalRoles(localRoles);

      // If updating the current user's own role
      if (user && user.id === userId) {
        const updatedUser = { ...user, role };
        setUser(updatedUser);
        localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
      }
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        signInWithGoogle,
        logout,
        isOwner: user?.role === 'owner',
        isStaff: user?.role === 'staff',
        authLoading,
        updateUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
