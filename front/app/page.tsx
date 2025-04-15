"use client";

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { useTheme } from "./contexts/ThemeContext";
const verificarAutenticacao = () => {
  const token = localStorage.getItem("authToken");
  return !!token; 
};
export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    // Verificando autenticação do lado do cliente
    try {
      const autenticado = verificarAutenticacao();
      setIsAuthenticated(autenticado);
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // autenticação
  useEffect(() => {
    if (isAuthenticated === false) {
      redirect("/login"); // PÁGINA DE LOGIN
    }

    if (isAuthenticated === true) {
      redirect("/usual/dashboard");
    }
  }, [isAuthenticated]);

  // Tela de carregamento enquanto verifica autenticação
  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center h-screen ${
          isDarkMode ? "bg-neutral-900 text-white" : "bg-white text-gray-900"
        }`}
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  return null;
}
