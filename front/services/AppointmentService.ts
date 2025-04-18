/**
 * AppointmentService.ts
 * Serviço para gerenciar operações relacionadas a agendamentos
 * Centraliza chamadas ao Supabase e validações
 */

import { getSupabaseClient } from "../utils/supabase/client";
import logger from "../lib/logger";
import { format, parseISO, isAfter, isBefore, addHours, addDays } from "date-fns";

// Interfaces
export interface Appointment {
  id: string;
  customer_id: string;
  service_id: string;
  professional_id: string;
  room_id: string;
  appointment_time: string;
  status: "Concluido" | "Pendente" | "Cancelado" | "Reagendado";
  created_at: string;
  updated_at?: string;
}

export interface AppointmentForm {
  customer_id: string;
  service_id: string;
  professional_id: string;
  room_id: string;
  appointment_time: string;
  appointment_date: string; // Para facilitar a interface
  status: "Concluido" | "Pendente" | "Cancelado" | "Reagendado";
}

export interface Customer {
  id: string;
  customer_name: string;
  cpf: string;
}

export interface Professional {
  id: string;
  professional_name: string;
}

export interface Service {
  id: string;
  display_name: string;
}

export interface Room {
  id: string;
  display_name: string;
}

export class AppointmentService {
  /**
   * Busca agendamentos para uma data específica
   * @param dateStr Data para buscar agendamentos no formato yyyy-MM-dd
   * @returns Promise com os agendamentos encontrados
   */
  async getAppointmentsByDate(dateStr: string): Promise<Appointment[]> {
    logger.debug(`[AppointmentService] - getAppointmentsByDate - Data: ${dateStr}`);
    
    try {
      // Garantir que estamos trabalhando com a data correta, sem ajustes de fuso horário
      // Usando a string diretamente nas consultas para evitar conversões problemáticas
      const currentDay = dateStr; // ex: '2025-04-17'
      
      // Calcular o próximo dia manualmente para evitar problemas de fuso horário
      const dateParts = dateStr.split('-').map(Number);
      let nextDayStr = '';
      
      // Se for o último dia do mês, avançamos para o próximo mês
      if (dateParts[0] && dateParts[1] && dateParts[2]) {
        const year = dateParts[0];
        const month = dateParts[1] - 1; // mês é 0-indexed em JavaScript 
        const day = dateParts[2];
        
        // Criar data com o dia seguinte
        const nextDayDate = new Date(year, month, day + 1);
        nextDayStr = format(nextDayDate, 'yyyy-MM-dd');
      } else {
        // Fallback se o formato da data estiver incorreto
        logger.error(`[AppointmentService] - getAppointmentsByDate - Formato de data inválido: ${dateStr}`);
        return [];
      }
      
      logger.debug(`[AppointmentService] - getAppointmentsByDate - Intervalo de busca: ${currentDay} até ${nextDayStr}`);
      
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .gte('appointment_time', currentDay)
        .lt('appointment_time', nextDayStr)
        .order('appointment_time', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      logger.debug(`[AppointmentService] - getAppointmentsByDate - ${data?.length || 0} agendamentos encontrados`);
      return data || [];
    } catch (err) {
      logger.error(`[AppointmentService] - getAppointmentsByDate - Erro: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }
  
  /**
   * Busca agendamentos para um intervalo de datas (semana ou mês)
   * @param startDate Data inicial
   * @param endDate Data final
   * @returns Promise com os agendamentos encontrados
   */
  async getAppointmentsByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    logger.debug(`[AppointmentService] - getAppointmentsByDateRange - Período: ${format(startDate, 'dd/MM/yyyy')} até ${format(endDate, 'dd/MM/yyyy')}`);
    
    try {
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .gte('appointment_time', startDateStr)
        .lt('appointment_time', endDateStr)
        .order('appointment_time', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      logger.debug(`[AppointmentService] - getAppointmentsByDateRange - ${data?.length || 0} agendamentos encontrados`);
      return data || [];
    } catch (err) {
      logger.error(`[AppointmentService] - getAppointmentsByDateRange - Erro: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }
  
  /**
   * Cria um novo agendamento com validações
   * @param appointmentData Dados do agendamento a ser criado
   * @returns Promise com o agendamento criado
   */
  async createAppointment(appointmentData: AppointmentForm): Promise<Appointment> {
    logger.debug(`[AppointmentService] - createAppointment - Dados: ${JSON.stringify(appointmentData)}`);
    
    try {
      // Validações básicas
      if (!appointmentData.customer_id || !appointmentData.service_id || 
          !appointmentData.professional_id || !appointmentData.room_id || 
          !appointmentData.appointment_time || !appointmentData.appointment_date) {
        throw new Error('Todos os campos obrigatórios devem ser preenchidos');
      }
      
      // Combinar data e hora
      const dateTimeStr = `${appointmentData.appointment_date}T${appointmentData.appointment_time}:00`;
      const appointmentDateTime = new Date(dateTimeStr);
      
      // Validar se a data não é no passado
      if (isBefore(appointmentDateTime, new Date())) {
        throw new Error('Não é possível agendar para uma data no passado');
      }
      
      // Verificar disponibilidade do profissional (apenas para log)
      const profResult = await this.checkProfessionalAvailability(
        appointmentData.professional_id,
        appointmentDateTime
      );
      
      logger.debug(`[AppointmentService] - createAppointment - Profissional tem ${profResult.appointments} agendamentos no mesmo horário`);
      
      // Verificar disponibilidade da sala (apenas para log)
      const roomResult = await this.checkRoomAvailability(
        appointmentData.room_id,
        appointmentDateTime
      );
      
      logger.debug(`[AppointmentService] - createAppointment - Sala tem ${roomResult.appointments} agendamentos no mesmo horário`);
      
      // Se passou por todas as validações, criar o agendamento
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            customer_id: appointmentData.customer_id,
            service_id: appointmentData.service_id,
            professional_id: appointmentData.professional_id,
            room_id: appointmentData.room_id,
            appointment_time: dateTimeStr,
            status: appointmentData.status
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('Erro ao criar agendamento: nenhum dado retornado');
      }
      
      logger.debug(`[AppointmentService] - createAppointment - Agendamento criado com ID: ${data[0].id}`);
      return data[0];
    } catch (err) {
      logger.error(`[AppointmentService] - createAppointment - Erro: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }
  
  /**
   * Atualiza o status de um agendamento
   * @param appointmentId ID do agendamento
   * @param newStatus Novo status
   * @returns Promise com o agendamento atualizado
   */
  async updateAppointmentStatus(
    appointmentId: string, 
    newStatus: "Concluido" | "Pendente" | "Cancelado" | "Reagendado"
  ): Promise<Appointment> {
    logger.debug(`[AppointmentService] - updateAppointmentStatus - ID: ${appointmentId}, Novo status: ${newStatus}`);
    
    try {
      const supabase = getSupabaseClient();
      
      // Log detalhado do que estamos enviando
      const updateData = { 
        status: newStatus
      };
      logger.debug(`[AppointmentService] - updateAppointmentStatus - Enviando dados: ${JSON.stringify(updateData)}`);
      
      const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId)
        .select();
      
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('Erro ao atualizar status: nenhum dado retornado');
      }
      
      logger.debug(`[AppointmentService] - updateAppointmentStatus - Status atualizado com sucesso`);
      return data[0];
    } catch (err) {
      let errorMessage = "Erro desconhecido";
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        try {
          errorMessage = JSON.stringify(err);
        } catch {
          errorMessage = "Erro não serializável";
        }
      } else {
        errorMessage = String(err);
      }
      
      logger.error(`[AppointmentService] - updateAppointmentStatus - Erro: ${errorMessage}`);
      throw err;
    }
  }
  
  /**
   * Verifica a disponibilidade de um profissional em um determinado horário
   * e retorna o número de agendamentos existentes
   * @param professionalId ID do profissional
   * @param dateTime Data e hora para verificar
   * @returns Promise com objeto contendo disponibilidade e número de agendamentos
   */
  async checkProfessionalAvailability(
    professionalId: string,
    dateTime: Date
  ): Promise<{ appointments: number; existingAppointments?: any[] }> {
    logger.debug(
      `[AppointmentService] - checkProfessionalAvailability - Profissional: ${professionalId}, Data/Hora: ${format(
        dateTime,
        "dd/MM/yyyy HH:mm"
      )}`
    );

    try {
      // Intervalo de 1 hora antes e depois
      const startTime = addHours(dateTime, -1);
      const endTime = addHours(dateTime, 1);

      const startTimeStr = format(startTime, "yyyy-MM-dd'T'HH:mm:ss");
      const endTimeStr = format(endTime, "yyyy-MM-dd'T'HH:mm:ss");

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("professional_id", professionalId)
        .gte("appointment_time", startTimeStr)
        .lte("appointment_time", endTimeStr)
        .not("status", "eq", "Cancelado"); // Excluir agendamentos cancelados

      if (error) {
        throw error;
      }

      // Retornar o número de agendamentos encontrados
      const appointmentsCount = data?.length || 0;
      
      logger.debug(
        `[AppointmentService] - checkProfessionalAvailability - ${appointmentsCount} agendamentos encontrados no mesmo horário`
      );
      
      return { 
        appointments: appointmentsCount,
        existingAppointments: data || []
      };
    } catch (err) {
      logger.error(
        `[AppointmentService] - checkProfessionalAvailability - Erro: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      // Em caso de erro, retornar um número alto para indicar problema
      return { appointments: 999 };
    }
  }
  
  /**
   * Verifica se uma sala está disponível em um determinado horário
   * @param roomId ID da sala
   * @param dateTime Data e hora para verificar
   * @returns Promise<boolean> indicando se está disponível
   */
  async checkRoomAvailability(roomId: string, dateTime: Date): Promise<{ appointments: number; existingAppointments?: any[] }> {
    logger.debug(`[AppointmentService] - checkRoomAvailability - Sala: ${roomId}, Data/Hora: ${format(dateTime, 'dd/MM/yyyy HH:mm')}`);
    
    try {
      // Intervalo de 1 hora antes e depois
      const startTime = addHours(dateTime, -1);
      const endTime = addHours(dateTime, 1);
      
      const startTimeStr = format(startTime, 'yyyy-MM-dd\'T\'HH:mm:ss');
      const endTimeStr = format(endTime, 'yyyy-MM-dd\'T\'HH:mm:ss');
      
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('room_id', roomId)
        .gte('appointment_time', startTimeStr)
        .lte('appointment_time', endTimeStr)
        .not('status', 'eq', 'Cancelado'); // Excluir agendamentos cancelados
      
      if (error) {
        throw error;
      }
      
      // Se não encontrou nenhum agendamento no intervalo, está disponível
      const appointmentsCount = data?.length || 0;
      
      logger.debug(`[AppointmentService] - checkRoomAvailability - ${appointmentsCount} agendamentos encontrados no mesmo horário`);
      
      return { 
        appointments: appointmentsCount,
        existingAppointments: data || []
      };
    } catch (err) {
      logger.error(`[AppointmentService] - checkRoomAvailability - Erro: ${err instanceof Error ? err.message : String(err)}`);
      // Em caso de erro, consideramos que não está disponível por segurança
      return { appointments: 999 };
    }
  }
  
  /**
   * Busca todos os clientes cadastrados
   * @returns Promise com a lista de clientes
   */
  async getCustomers(): Promise<Customer[]> {
    logger.debug(`[AppointmentService] - getCustomers - Buscando clientes`);
    
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('customers')
        .select('id, customer_name, cpf')
        .order('customer_name');
      
      if (error) {
        throw error;
      }
      
      logger.debug(`[AppointmentService] - getCustomers - ${data?.length || 0} clientes encontrados`);
      return data || [];
    } catch (err) {
      logger.error(`[AppointmentService] - getCustomers - Erro: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }
  
  /**
   * Busca todos os profissionais cadastrados
   * @returns Promise com a lista de profissionais
   */
  async getProfessionals(): Promise<Professional[]> {
    logger.debug(`[AppointmentService] - getProfessionals - Buscando profissionais`);
    
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('professionals')
        .select('id, professional_name')
        .order('professional_name');
      
      if (error) {
        throw error;
      }
      
      logger.debug(`[AppointmentService] - getProfessionals - ${data?.length || 0} profissionais encontrados`);
      return data || [];
    } catch (err) {
      logger.error(`[AppointmentService] - getProfessionals - Erro: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }
  
  /**
   * Busca todos os serviços cadastrados
   * @returns Promise com a lista de serviços
   */
  async getServices(): Promise<Service[]> {
    logger.debug(`[AppointmentService] - getServices - Buscando serviços`);
    
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('services')
        .select('id, display_name')
        .order('display_name');
      
      if (error) {
        throw error;
      }
      
      logger.debug(`[AppointmentService] - getServices - ${data?.length || 0} serviços encontrados`);
      return data || [];
    } catch (err) {
      logger.error(`[AppointmentService] - getServices - Erro: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }
  
  /**
   * Busca todas as salas disponíveis
   * @returns Promise com as salas
   */
  async getRooms(): Promise<Room[]> {
    logger.debug(`[AppointmentService] - getRooms - Buscando salas`);
    
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('rooms')
        .select('id, display_name')
        .order('display_name');
      
      if (error) {
        throw error;
      }
      
      logger.debug(`[AppointmentService] - getRooms - ${data?.length || 0} salas encontradas`);
      return data || [];
    } catch (err) {
      logger.error(`[AppointmentService] - getRooms - Erro: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }
  
  /**
   * Busca agendamentos para um cliente específico
   * @param customerId ID do cliente
   * @returns Promise com os agendamentos encontrados
   */
  async getAppointmentsByCustomerId(customerId: string): Promise<Appointment[]> {
    logger.debug(`[AppointmentService] - getAppointmentsByCustomerId - Cliente ID: ${customerId}`);
    
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('customer_id', customerId)
        .order('appointment_time', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      logger.debug(`[AppointmentService] - getAppointmentsByCustomerId - ${data?.length || 0} agendamentos encontrados`);
      return data || [];
    } catch (err) {
      logger.error(`[AppointmentService] - getAppointmentsByCustomerId - Erro: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }
  
  /**
   * Busca agendamentos para um cliente específico por CPF
   * @param cpf CPF do cliente
   * @returns Promise com os agendamentos encontrados
   */
  async getAppointmentsByCustomerCpf(cpf: string): Promise<Appointment[]> {
    logger.debug(`[AppointmentService] - getAppointmentsByCustomerCpf - Cliente CPF: ${cpf}`);
    
    try {
      // Primeiro, buscar o ID do cliente pelo CPF
      const supabase = getSupabaseClient();
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('cpf', cpf)
        .single();
      
      if (customerError) {
        throw customerError;
      }
      
      if (!customerData || !customerData.id) {
        logger.error(`[AppointmentService] - getAppointmentsByCustomerCpf - Cliente não encontrado para CPF: ${cpf}`);
        return [];
      }
      
      const customerId = customerData.id;
      
      // Agora buscar os agendamentos do cliente
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('customer_id', customerId)
        .order('appointment_time', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      logger.debug(`[AppointmentService] - getAppointmentsByCustomerCpf - ${data?.length || 0} agendamentos encontrados`);
      return data || [];
    } catch (err) {
      logger.error(`[AppointmentService] - getAppointmentsByCustomerCpf - Erro: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  }
}

// Exportar instância única do serviço
export const appointmentService = new AppointmentService();
