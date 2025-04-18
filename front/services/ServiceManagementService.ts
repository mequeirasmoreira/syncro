/**
 * ServiceManagementService.ts
 * Serviço para gerenciar operações relacionadas a serviços oferecidos
 * Centraliza chamadas ao Supabase e validações
 */

import { getSupabaseClient } from "../utils/supabase/client";
import logger from "../lib/logger";
import { format } from "date-fns";

// Interface para o tipo Service
export interface ServiceItem {
  id: string;
  display_name: string;
  created_at: string;
  updated_at?: string;
}

// Interface para o formulário de serviço
export interface ServiceForm {
  display_name: string;
}

export class ServiceManagementService {
  /**
   * Busca todos os serviços cadastrados
   * @returns Promise com a lista de serviços
   */
  async getAllServices(): Promise<ServiceItem[]> {
    logger.debug(`[ServiceManagementService] - getAllServices - Buscando todos os serviços`);
    
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('display_name');
      
      if (error) {
        throw error;
      }
      
      logger.debug(`[ServiceManagementService] - getAllServices - ${data?.length || 0} serviços encontrados`);
      return data || [];
    } catch (err) {
      logger.error(`[ServiceManagementService] - getAllServices - Erro: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  /**
   * Busca um serviço pelo ID
   * @param id ID do serviço
   * @returns Promise com o serviço encontrado
   */
  async getServiceById(id: string): Promise<ServiceItem | null> {
    logger.debug(`[ServiceManagementService] - getServiceById - ID: ${id}`);
    
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Código para "não encontrado"
          logger.debug(`[ServiceManagementService] - getServiceById - Serviço não encontrado para ID: ${id}`);
          return null;
        }
        throw error;
      }
      
      logger.debug(`[ServiceManagementService] - getServiceById - Serviço encontrado`);
      return data;
    } catch (err) {
      logger.error(`[ServiceManagementService] - getServiceById - Erro: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  /**
   * Cria um novo serviço
   * @param serviceData Dados do serviço a ser criado
   * @returns Promise com o serviço criado
   */
  async createService(serviceData: ServiceForm): Promise<ServiceItem> {
    logger.debug(`[ServiceManagementService] - createService - Dados: ${JSON.stringify(serviceData)}`);
    
    try {
      // Validações básicas
      if (!serviceData.display_name || serviceData.display_name.trim() === '') {
        throw new Error('O nome do serviço é obrigatório');
      }
      
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('services')
        .insert([serviceData])
        .select();
      
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('Erro ao criar serviço: nenhum dado retornado');
      }
      
      logger.debug(`[ServiceManagementService] - createService - Serviço criado com ID: ${data[0].id}`);
      return data[0];
    } catch (err) {
      logger.error(`[ServiceManagementService] - createService - Erro: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  /**
   * Atualiza um serviço existente
   * @param id ID do serviço a ser atualizado
   * @param serviceData Novos dados do serviço
   * @returns Promise com o serviço atualizado
   */
  async updateService(id: string, serviceData: ServiceForm): Promise<ServiceItem> {
    logger.debug(`[ServiceManagementService] - updateService - ID: ${id}, Dados: ${JSON.stringify(serviceData)}`);
    
    try {
      // Validações básicas
      if (!serviceData.display_name || serviceData.display_name.trim() === '') {
        throw new Error('O nome do serviço é obrigatório');
      }
      
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('services')
        .update(serviceData)
        .eq('id', id)
        .select();
      
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('Erro ao atualizar serviço: nenhum dado retornado');
      }
      
      logger.debug(`[ServiceManagementService] - updateService - Serviço atualizado com sucesso`);
      return data[0];
    } catch (err) {
      logger.error(`[ServiceManagementService] - updateService - Erro: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  /**
   * Exclui um serviço existente
   * @param id ID do serviço a ser excluído
   * @returns Promise<boolean> indicando sucesso ou falha
   */
  async deleteService(id: string): Promise<boolean> {
    logger.debug(`[ServiceManagementService] - deleteService - ID: ${id}`);
    
    try {
      // Verificar se o serviço está sendo usado em agendamentos
      const supabase = getSupabaseClient();
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id')
        .eq('service_id', id)
        .limit(1);
      
      if (appointmentsError) {
        throw appointmentsError;
      }
      
      if (appointments && appointments.length > 0) {
        throw new Error('Não é possível excluir este serviço porque está sendo usado em agendamentos');
      }
      
      // Excluir o serviço
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      logger.debug(`[ServiceManagementService] - deleteService - Serviço excluído com sucesso`);
      return true;
    } catch (err) {
      logger.error(`[ServiceManagementService] - deleteService - Erro: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }
}

// Exportar instância única do serviço
export const serviceManagementService = new ServiceManagementService();
