import { getSupabaseClient } from "../utils/supabase/client";
import { Buffer } from "buffer";
import logger from "../lib/logger";

/**
 * Serviço para gerenciar o armazenamento de imagens no Supabase Storage
 */
export const ImageStorageService = {
  /**
   * Salva uma imagem base64 no Supabase Storage
   * @param clienteId ID do cliente para nomear o arquivo
   * @param base64Image String base64 da imagem
   * @returns URL pública da imagem salva
   */
  async salvarFotoBase(clienteId: string, base64Image: string): Promise<string> {
    logger.debug(`[ImageStorageService] - salvarFotoBase - Salvando foto para cliente ${clienteId}`);
    
    try {
      // Verificar se a imagem base64 é válida
      if (!base64Image || !base64Image.includes('base64')) {
        throw new Error("Imagem inválida");
      }

      const filePath = `customers/${clienteId}.jpg`;
      const base64Data = base64Image.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const blob = new Blob([buffer], { type: 'image/jpeg' });

      // Upload da imagem
      const { error } = await getSupabaseClient().storage
        .from('customers')
        .upload(filePath, blob, { 
          upsert: true,
          cacheControl: '3600',
          contentType: 'image/jpeg'
        });

      if (error) {
        logger.error(`[ImageStorageService] - salvarFotoBase - Erro ao fazer upload:`, error);
        throw new Error("Erro ao subir imagem: " + error.message);
      }

      // Obter URL pública
      const { data } = getSupabaseClient().storage.from('customers').getPublicUrl(filePath);
      
      if (!data || !data.publicUrl) {
        throw new Error("Não foi possível obter a URL pública da imagem");
      }
      
      logger.debug(`[ImageStorageService] - salvarFotoBase - Imagem salva com sucesso: ${data.publicUrl}`);
      return data.publicUrl;
    } catch (err) {
      logger.error(`[ImageStorageService] - salvarFotoBase - Erro:`, err);
      throw err;
    }
  },

  /**
   * Método de fallback para quando o upload falhar
   * Retorna a própria string base64 como URL
   * @param base64Image String base64 da imagem
   * @returns A própria string base64
   */
  getBase64Fallback(base64Image: string): string {
    logger.debug(`[ImageStorageService] - getBase64Fallback - Usando fallback para imagem base64`);
    return base64Image;
  }
};

export default ImageStorageService;
