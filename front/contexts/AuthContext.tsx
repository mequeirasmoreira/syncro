"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../utils/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import logger from "../lib/logger";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: Session | null;
  }>;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
    data: Session | null;
  }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    logger.debug("[AuthProvider] - Verificando sessão atual");
    
    // Verificar se há uma sessão ativa
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.error("[AuthProvider] - Erro ao buscar sessão:", error);
      }
      
      setSession(data?.session || null);
      setUser(data?.session?.user || null);
      setIsLoading(false);
    };

    fetchSession();

    // Configurar listener para mudanças na autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        logger.debug(`[AuthProvider] - Evento de autenticação: ${event}`);
        setSession(newSession);
        setUser(newSession?.user || null);
        setIsLoading(false);
      }
    );

    return () => {
      // Limpar o listener quando o componente for desmontado
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Função para login
  const signIn = async (email: string, password: string) => {
    logger.debug(`[AuthProvider] - Tentativa de login para: ${email}`);
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.error("[AuthProvider] - Erro no login:", error);
        return { error, data: null };
      }

      logger.debug("[AuthProvider] - Login bem-sucedido");
      return { data: data.session, error: null };
    } catch (err) {
      logger.error("[AuthProvider] - Erro inesperado no login:", err);
      return { error: err as Error, data: null };
    } finally {
      setIsLoading(false);
    }
  };

  // Função para cadastro
  const signUp = async (email: string, password: string) => {
    logger.debug(`[AuthProvider] - Tentativa de cadastro para: ${email}`);
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        logger.error("[AuthProvider] - Erro no cadastro:", error);
        return { error, data: null };
      }

      logger.debug("[AuthProvider] - Cadastro bem-sucedido");
      return { data: data.session, error: null };
    } catch (err) {
      logger.error("[AuthProvider] - Erro inesperado no cadastro:", err);
      return { error: err as Error, data: null };
    } finally {
      setIsLoading(false);
    }
  };

  // Função para logout
  const signOut = async () => {
    logger.debug("[AuthProvider] - Realizando logout");
    setIsLoading(true);
    
    try {
      await supabase.auth.signOut();
      logger.debug("[AuthProvider] - Logout bem-sucedido");
    } catch (err) {
      logger.error("[AuthProvider] - Erro no logout:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  
  return context;
}
