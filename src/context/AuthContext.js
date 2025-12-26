'use client';
import { useContext, createContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  getAuth,
} from 'firebase/auth';
import { app } from '../lib/firebase';

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const auth = getAuth(app);

  const googleSignIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  const logOut = () => {
    signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  return (
    <AuthContext.Provider value={{ user, googleSignIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(AuthContext);
};
