import React, { createContext, useState, useContext, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    const loadThemePreference = async () => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsDarkMode(data.isDarkMode || false); 
        } else {
          setIsDarkMode(false); 
        }
      } else {
        setIsDarkMode(false); 
      }
      setIsLoading(false);
    };

    loadThemePreference();
  }, [user]);

  const toggleDarkMode = async () => {
    const newDarkModeState = !isDarkMode;
    setIsDarkMode(newDarkModeState);

    if (user) {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { isDarkMode: newDarkModeState }, { merge: true });
    }
  };

  if (isLoading || isDarkMode === null) return null;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};