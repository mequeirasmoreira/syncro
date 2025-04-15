import { createClient } from '@supabase/supabase-js';
import logger from '@/lib/logger';

// Verificar se estamos no navegador
const isBrowser = typeof window !== 'undefined';

// Criar uma função para inicializar o cliente Supabase
const createSupabaseClient = () => {
  try {
    // Verificar se as variáveis de ambiente estão definidas
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      if (isBrowser) {
        logger.error('[Supabase] - Variáveis de ambiente não definidas');
      }
      // Retornar um cliente nulo que será tratado nos componentes
      return null;
    }

    // Criar e retornar o cliente
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    if (isBrowser) {
      logger.error('[Supabase] - Erro ao criar cliente:', error);
    }
    return null;
  }
};

// Inicializar o cliente apenas no navegador
export const supabase = isBrowser ? createSupabaseClient() : null;

// Função auxiliar para verificar se o cliente está disponível
export const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error('Cliente Supabase não está disponível. Verifique as variáveis de ambiente.');
  }
  return supabase;
};
