"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import logger from "../lib/logger";

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    logger.debug("[ThemeProvider] - Verificando preferência de tema");
    
    // Verificar preferência salva no localStorage
    const savedTheme = localStorage.getItem("theme");
    
    // Verificar preferência do sistema
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    // Definir tema com base na preferência salva ou do sistema
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    logger.debug("[ThemeProvider] - Alternando tema");
    
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      
      // Salvar preferência no localStorage
      localStorage.setItem("theme", newTheme ? "dark" : "light");
      
      // Atualizar classe no HTML
      if (newTheme) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error("useTheme deve ser usado dentro de um ThemeProvider");
  }
  
  return context;
}
