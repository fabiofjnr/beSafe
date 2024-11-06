import React, { createContext, useState, useContext, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(null); // Inicializa como null
  const [isLoading, setIsLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    const loadThemePreference = async () => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsDarkMode(data.isDarkMode || false); // Aplica tema salvo ou padrão claro
        } else {
          setIsDarkMode(false); // Tema padrão claro para novos usuários
        }
      } else {
        setIsDarkMode(false); // Tema padrão claro para usuários não logados
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

  // Só renderiza após a preferência do tema ser definida
  if (isLoading || isDarkMode === null) return null; // ou exibir um componente de carregamento

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
