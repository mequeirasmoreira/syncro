/**
 * Serviço para gerenciamento de Salas/Unidades
 * Responsável por centralizar operações de CRUD na tabela rooms
 */

import { getSupabaseClient } from "@/utils/supabase/client";
import logger from "@/lib/logger";

// Tipos
export interface RoomItem {
  id: string;
  display_name: string;
  created_at: string;
  updated_at: string | null;
}

export interface RoomForm {
  display_name: string;
}

class RoomManagementService {
  private supabase = getSupabaseClient();

  /**
   * Busca todas as salas cadastradas
   */
  async getAllRooms(): Promise<RoomItem[]> {
    logger.debug(`[RoomManagementService] - getAllRooms - Buscando todas as salas`);
    
    const { data, error } = await this.supabase
      .from("rooms")
      .select("*")
      .order("display_name");
      
    if (error) {
      logger.error(`[RoomManagementService] - getAllRooms - Erro: ${error.message}`);
      throw new Error(`Erro ao buscar salas: ${error.message}`);
    }
    
    return data || [];
  }
  
  /**
   * Busca sala pelo ID
   */
  async getRoomById(id: string): Promise<RoomItem> {
    logger.debug(`[RoomManagementService] - getRoomById - ID: ${id}`);
    
    const { data, error } = await this.supabase
      .from("rooms")
      .select("*")
      .eq("id", id)
      .single();
      
    if (error) {
      logger.error(`[RoomManagementService] - getRoomById - Erro: ${error.message}`);
      throw new Error(`Erro ao buscar sala: ${error.message}`);
    }
    
    if (!data) {
      throw new Error(`Sala não encontrada com ID: ${id}`);
    }
    
    return data;
  }
  
  /**
   * Cria uma nova sala
   */
  async createRoom(roomData: RoomForm): Promise<RoomItem> {
    logger.debug(`[RoomManagementService] - createRoom - Nome: ${roomData.display_name}`);
    
    // Validação
    if (!roomData.display_name.trim()) {
      throw new Error("O nome da sala é obrigatório");
    }
    
    // Verificar se já existe sala com este nome
    const { data: existingRoom } = await this.supabase
      .from("rooms")
      .select("id")
      .eq("display_name", roomData.display_name.trim())
      .maybeSingle();
      
    if (existingRoom) {
      throw new Error(`Já existe uma sala chamada "${roomData.display_name}"`);
    }
    
    // Criar sala
    const { data, error } = await this.supabase
      .from("rooms")
      .insert([{ display_name: roomData.display_name.trim() }])
      .select()
      .single();
      
    if (error) {
      logger.error(`[RoomManagementService] - createRoom - Erro: ${error.message}`);
      throw new Error(`Erro ao criar sala: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * Atualiza uma sala existente
   */
  async updateRoom(id: string, roomData: RoomForm): Promise<RoomItem> {
    logger.debug(`[RoomManagementService] - updateRoom - ID: ${id}, Nome: ${roomData.display_name}`);
    
    // Validação
    if (!roomData.display_name.trim()) {
      throw new Error("O nome da sala é obrigatório");
    }
    
    // Verificar se já existe sala com este nome (exceto a atual)
    const { data: existingRoom } = await this.supabase
      .from("rooms")
      .select("id")
      .eq("display_name", roomData.display_name.trim())
      .neq("id", id)
      .maybeSingle();
      
    if (existingRoom) {
      throw new Error(`Já existe uma sala chamada "${roomData.display_name}"`);
    }
    
    // Atualizar sala
    const { data, error } = await this.supabase
      .from("rooms")
      .update({ 
        display_name: roomData.display_name.trim(),
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();
      
    if (error) {
      logger.error(`[RoomManagementService] - updateRoom - Erro: ${error.message}`);
      throw new Error(`Erro ao atualizar sala: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * Verifica se sala está em uso em agendamentos
   */
  async isRoomInUse(id: string): Promise<boolean> {
    logger.debug(`[RoomManagementService] - isRoomInUse - ID: ${id}`);
    
    const { count, error } = await this.supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("room_id", id);
      
    if (error) {
      logger.error(`[RoomManagementService] - isRoomInUse - Erro: ${error.message}`);
      throw new Error(`Erro ao verificar uso da sala: ${error.message}`);
    }
    
    return count !== null && count > 0;
  }
  
  /**
   * Remove uma sala
   */
  async deleteRoom(id: string): Promise<void> {
    logger.debug(`[RoomManagementService] - deleteRoom - ID: ${id}`);
    
    // Verificar se a sala está em uso
    const inUse = await this.isRoomInUse(id);
    if (inUse) {
      throw new Error("Esta sala não pode ser excluída pois está associada a agendamentos");
    }
    
    // Remover sala
    const { error } = await this.supabase
      .from("rooms")
      .delete()
      .eq("id", id);
      
    if (error) {
      logger.error(`[RoomManagementService] - deleteRoom - Erro: ${error.message}`);
      throw new Error(`Erro ao excluir sala: ${error.message}`);
    }
  }
}

// Exportar uma única instância do serviço
export const roomManagementService = new RoomManagementService();
