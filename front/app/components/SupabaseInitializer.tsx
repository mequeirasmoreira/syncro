"use client";

import { useEffect } from "react";
import logger from "@/lib/logger";

/**
 * Componente que inicializa recursos do Supabase
 * Deve ser usado uma única vez no layout principal
 */
export default function SupabaseInitializer() {
  useEffect(() => {
    logger.debug("[SupabaseInitializer] - Inicializando recursos do Supabase");

    const initializeSupabase = async () => {
      try {
        logger.debug(
          "[SupabaseInitializer] - Recursos do Supabase inicializados com sucesso"
        );
      } catch (error) {
        logger.error(
          "[SupabaseInitializer] - Erro ao inicializar recursos do Supabase:",
          error
        );
      }
    };

    initializeSupabase();
  }, []);

  // Este componente não renderiza nada visualmente
  return null;
}
