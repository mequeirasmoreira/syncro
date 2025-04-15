import { supabase } from "../utils/supabase/client";
import logger from "./logger";

/**
 * Configura os recursos necessários no Supabase
 * - Verifica se o bucket 'customers' existe e cria se necessário
 */
export async function setupSupabaseResources() {
  try {
    logger.debug("[setupSupabase] - Verificando recursos do Supabase");
    
    // Verificar se o bucket 'customers' existe
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      logger.error("[setupSupabase] - Erro ao listar buckets:", bucketsError);
      throw new Error("Erro ao verificar buckets: " + bucketsError.message);
    }
    return true;
  } catch (err) {
    logger.error("[setupSupabase] - Erro ao configurar recursos:", err);
    // Retornar false em vez de lançar erro para não interromper a inicialização da aplicação
    return false;
  }
}

export default setupSupabaseResources;
