import { getSupabaseClient } from "../utils/supabase/client";
import ImageStorageService from "./ImageStorageService";
import logger from "../lib/logger";
import { Customer } from "@/types";

/**
 * Faz o upload da imagem e vincula a URL no cliente
 * @param customerId ID do cliente
 * @param base64Image Imagem em base64
 * @returns URL pública da imagem ou base64 se falhar
 */
async function uploadAndLinkImage(
  customerId: number,
  base64Image: string
): Promise<string> {
  try {
    const imageUrl = await ImageStorageService.salvarFotoBase(
      customerId.toString(),
      base64Image
    );
    await getSupabaseClient()
      .from("customers")
      .update({ base_image_url: imageUrl })
      .eq("id", customerId);
    return imageUrl;
  } catch (err) {
    logger.error(`[CustomerService] - uploadAndLinkImage - Erro:`, err);
    return base64Image;
  }
}

export const CustomerService = {
  /**
   * Cria um cliente simples, sem imagem
   */
  async createCustomer(
    data: Omit<Customer, "created_at" | "updated_at" | "base_image_url">
  ): Promise<Customer> {
    const { data: created, error } = await getSupabaseClient()
      .from("customers")
      .insert(data)
      .select()
      .single();

    if (error) {
      logger.error("[CustomerService] - createCustomer - Erro:", error);
      throw error;
    }

    return created as Customer;
  },

  /**
   * Atualiza dados de um cliente existente
   */
  async updateCustomer(
    id: number,
    updates: Partial<Customer>
  ): Promise<Customer> {
    const { data: updated, error } = await getSupabaseClient()
      .from("customers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error("[CustomerService] - updateCustomer - Erro:", error);
      throw error;
    }

    return updated as Customer;
  },

  /**
   * Cria um cliente e vincula uma imagem base64
   */
  async createCustomerWithImage(
    data: Omit<Customer, "created_at" | "updated_at" | "base_image_url">,
    base64Image: string
  ): Promise<Customer> {
    const { data: created, error } = await getSupabaseClient()
      .from("customers")
      .insert(data)
      .select()
      .single();

    if (error) {
      logger.error(
        "[CustomerService] - createCustomerWithImage - Erro ao criar cliente:",
        error
      );
      throw error;
    }

    // Upload e vinculação da imagem
    const imageUrl = await uploadAndLinkImage(created.id, base64Image);
    return {
      ...created,
      base_image_url: imageUrl,
    } as Customer;
  },
};

export default CustomerService;
