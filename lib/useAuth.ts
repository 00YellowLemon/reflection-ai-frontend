'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // Clearing the cookie here is also a good practice,
      // although onAuthStateChanged in AuthPage should also handle it.
      document.cookie = 'firebaseAuthToken=; path=/; max-age=0';
      // Redirect to home page after sign out
      // Note: If this hook is used on a page that doesn't have access to `next/router`
      // or if routing should be handled differently, this might need adjustment.
      // For now, assuming this hook might be used in components where router is available
      // or global redirection is desired.
      // A more common pattern is to navigate from the component calling signOut.
      // router.push('/'); // Example: if router is available and imported
      // window.location.href = '/'; // Fallback or if router isn't set up here
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return { user, loading, signOut };
}
