"use client";

/**
 * Componente de Formulário de Agendamento
 * Permite criar novos agendamentos com validações em tempo real
 * Implementa recursos de acessibilidade como mensagens de erro para leitores de tela
 */

import { useState, useEffect } from "react";
import { useTheme } from "@/app/contexts/ThemeContext";
import { format, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import logger from "@/lib/logger";
import { 
  Customer, 
  Professional, 
  Service,
  Room,
  AppointmentForm as AppointmentFormType,
  appointmentService
} from "@/services/AppointmentService";

interface AppointmentFormProps {
  onSubmit: (formData: AppointmentFormType) => Promise<void>;
  onCancel: () => void;
  initialData: AppointmentFormType;
  customers: Customer[];
  professionals: Professional[];
  services: Service[];
  rooms: Room[];
  className?: string;
}

const AppointmentForm = ({
  onSubmit,
  onCancel,
  initialData,
  customers,
  professionals,
  services,
  rooms,
  className = ""
}: AppointmentFormProps) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState<AppointmentFormType>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string>("");
  
  // Estados para verificações de disponibilidade
  const [isProfessionalAvailable, setIsProfessionalAvailable] = useState<boolean | null>(null);
  const [isRoomAvailable, setIsRoomAvailable] = useState<boolean | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  
  // Verificar disponibilidade quando os campos relevantes mudarem
  useEffect(() => {
    const checkAvailability = async () => {
      // Só verificar se todos os campos necessários estiverem preenchidos
      if (
        formData.professional_id && 
        formData.room_id && 
        formData.appointment_date && 
        formData.appointment_time
      ) {
        setIsCheckingAvailability(true);
        logger.debug(`[AppointmentForm] - checkAvailability - Verificando disponibilidade`);
        
        try {
          // Combinar data e hora para a verificação
          const dateTimeStr = `${formData.appointment_date}T${formData.appointment_time}:00`;
          const appointmentDateTime = new Date(dateTimeStr);
          
          // Verificar disponibilidade do profissional
          const professionalAvailable = await appointmentService.checkProfessionalAvailability(
            formData.professional_id,
            appointmentDateTime
          );
          setIsProfessionalAvailable(professionalAvailable);
          
          // Verificar disponibilidade da sala
          const roomAvailable = await appointmentService.checkRoomAvailability(
            formData.room_id,
            appointmentDateTime
          );
          setIsRoomAvailable(roomAvailable);
          
          // Atualizar mensagem de validação
          if (!professionalAvailable) {
            setValidationMessage("Profissional não está disponível neste horário");
          } else if (!roomAvailable) {
            setValidationMessage("Sala não está disponível neste horário");
          } else {
            setValidationMessage("");
          }
        } catch (err) {
          logger.error(`[AppointmentForm] - checkAvailability - Erro: ${err instanceof Error ? err.message : String(err)}`);
          setValidationMessage("Erro ao verificar disponibilidade");
        } finally {
          setIsCheckingAvailability(false);
        }
      }
    };
    
    // Executar verificação com um pequeno delay para evitar múltiplas chamadas
    const timeoutId = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [
    formData.professional_id, 
    formData.room_id, 
    formData.appointment_date, 
    formData.appointment_time
  ]);
  
  // Manipulador para alterações nos campos do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    logger.debug(`[AppointmentForm] - handleInputChange - Campo: ${name}, Valor: ${value}`);
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro específico do campo alterado
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Validar o formulário antes do envio
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Verificar campos obrigatórios
    if (!formData.customer_id) {
      newErrors.customer_id = "Selecione um cliente";
    }
    
    if (!formData.service_id) {
      newErrors.service_id = "Selecione um serviço";
    }
    
    if (!formData.professional_id) {
      newErrors.professional_id = "Selecione um profissional";
    }
    
    if (!formData.room_id) {
      newErrors.room_id = "Selecione uma sala";
    }
    
    if (!formData.appointment_date) {
      newErrors.appointment_date = "Selecione uma data";
    }
    
    if (!formData.appointment_time) {
      newErrors.appointment_time = "Selecione um horário";
    }
    
    // Verificar se a data não é no passado
    if (formData.appointment_date && formData.appointment_time) {
      const dateTimeStr = `${formData.appointment_date}T${formData.appointment_time}:00`;
      const appointmentDateTime = new Date(dateTimeStr);
      
      if (isBefore(appointmentDateTime, new Date())) {
        newErrors.appointment_date = "Não é possível agendar para uma data no passado";
      }
    }
    
    // Verificar disponibilidade
    if (isProfessionalAvailable === false) {
      newErrors.professional_id = "Profissional não está disponível neste horário";
    }
    
    if (isRoomAvailable === false) {
      newErrors.room_id = "Sala não está disponível neste horário";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Manipulador para envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.debug(`[AppointmentForm] - handleSubmit - Submetendo formulário`);
    
    // Validar o formulário
    if (!validateForm()) {
      // Anunciar erros para leitores de tela
      const errorMessages = Object.values(errors).join(". ");
      setValidationMessage(
        `Corrija os seguintes erros antes de enviar: ${errorMessages}`
      );
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Enviar os dados para o componente pai
      await onSubmit(formData);
      
      // Limpar mensagem de validação
      setValidationMessage("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`[AppointmentForm] - handleSubmit - Erro ao enviar: ${errorMessage}`);
      
      // Anunciar erro para leitores de tela
      setValidationMessage(`Erro ao criar agendamento: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className={`appointment-form-container ${className}`}>
      <h2 
        className={`font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-800"}`}
        aria-live="polite"
      >
        Novo Agendamento
      </h2>
      
      {/* Mensagem de validação para leitores de tela */}
      {validationMessage && (
        <div 
          className="sr-only" 
          aria-live="assertive"
          role="alert"
        >
          {validationMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cliente */}
        <div className="mb-4">
          <label 
            htmlFor="customer_id"
            className={`block text-sm font-medium mb-1 ${
              isDarkMode ? "text-slate-300" : "text-gray-700"
            }`}
          >
            Cliente
            {errors.customer_id && (
              <span className="ml-1 text-red-500" aria-hidden="true">*</span>
            )}
          </label>
          <select
            id="customer_id"
            name="customer_id"
            value={formData.customer_id}
            onChange={handleInputChange}
            required
            aria-invalid={!!errors.customer_id}
            aria-describedby={errors.customer_id ? "customer_id-error" : undefined}
            className={`w-full p-2 rounded-md border ${
              errors.customer_id
                ? "border-red-500"
                : isDarkMode 
                  ? "bg-neutral-700 border-neutral-600 text-slate-100" 
                  : "border-gray-300"
            }`}
          >
            <option value="">Selecione um cliente</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.customer_name}
              </option>
            ))}
          </select>
          {errors.customer_id && (
            <p 
              id="customer_id-error" 
              className="mt-1 text-sm text-red-500"
            >
              {errors.customer_id}
            </p>
          )}
        </div>
        
        {/* Serviço */}
        <div className="mb-4">
          <label 
            htmlFor="service_id"
            className={`block text-sm font-medium mb-1 ${
              isDarkMode ? "text-slate-300" : "text-gray-700"
            }`}
          >
            Serviço
            {errors.service_id && (
              <span className="ml-1 text-red-500" aria-hidden="true">*</span>
            )}
          </label>
          <select
            id="service_id"
            name="service_id"
            value={formData.service_id}
            onChange={handleInputChange}
            required
            aria-invalid={!!errors.service_id}
            aria-describedby={errors.service_id ? "service_id-error" : undefined}
            className={`w-full p-2 rounded-md border ${
              errors.service_id
                ? "border-red-500"
                : isDarkMode 
                  ? "bg-neutral-700 border-neutral-600 text-slate-100" 
                  : "border-gray-300"
            }`}
          >
            <option value="">Selecione um serviço</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>
                {service.display_name}
              </option>
            ))}
          </select>
          {errors.service_id && (
            <p 
              id="service_id-error" 
              className="mt-1 text-sm text-red-500"
            >
              {errors.service_id}
            </p>
          )}
        </div>
        
        {/* Profissional */}
        <div className="mb-4">
          <label 
            htmlFor="professional_id"
            className={`block text-sm font-medium mb-1 ${
              isDarkMode ? "text-slate-300" : "text-gray-700"
            }`}
          >
            Profissional
            {errors.professional_id && (
              <span className="ml-1 text-red-500" aria-hidden="true">*</span>
            )}
          </label>
          <select
            id="professional_id"
            name="professional_id"
            value={formData.professional_id}
            onChange={handleInputChange}
            required
            aria-invalid={!!errors.professional_id}
            aria-describedby={errors.professional_id ? "professional_id-error" : undefined}
            className={`w-full p-2 rounded-md border ${
              errors.professional_id
                ? "border-red-500"
                : isDarkMode 
                  ? "bg-neutral-700 border-neutral-600 text-slate-100" 
                  : "border-gray-300"
            }`}
          >
            <option value="">Selecione um profissional</option>
            {professionals.map(professional => (
              <option key={professional.id} value={professional.id}>
                {professional.display_name}
              </option>
            ))}
          </select>
          {errors.professional_id && (
            <p 
              id="professional_id-error" 
              className="mt-1 text-sm text-red-500"
            >
              {errors.professional_id}
            </p>
          )}
          {formData.professional_id && isProfessionalAvailable !== null && !isCheckingAvailability && (
            <p 
              className={`mt-1 text-sm ${
                isProfessionalAvailable 
                  ? isDarkMode ? "text-green-400" : "text-green-600" 
                  : "text-red-500"
              }`}
            >
              {isProfessionalAvailable 
                ? "Profissional disponível"
                : "Profissional não disponível neste horário"}
            </p>
          )}
        </div>
        
        {/* Sala/Unidade */}
        <div className="mb-4">
          <label 
            htmlFor="room_id"
            className={`block text-sm font-medium mb-1 ${
              isDarkMode ? "text-slate-300" : "text-gray-700"
            }`}
          >
            Sala/Unidade
            {errors.room_id && (
              <span className="ml-1 text-red-500" aria-hidden="true">*</span>
            )}
          </label>
          <select
            id="room_id"
            name="room_id"
            value={formData.room_id}
            onChange={handleInputChange}
            required
            aria-invalid={!!errors.room_id}
            aria-describedby={errors.room_id ? "room_id-error" : undefined}
            className={`w-full p-2 rounded-md border ${
              errors.room_id
                ? "border-red-500"
                : isDarkMode 
                  ? "bg-neutral-700 border-neutral-600 text-slate-100" 
                  : "border-gray-300"
            }`}
          >
            <option value="">Selecione uma sala</option>
            {rooms.map(room => (
              <option key={room.id} value={room.id}>
                {room.display_name}
              </option>
            ))}
          </select>
          {errors.room_id && (
            <p 
              id="room_id-error" 
              className="mt-1 text-sm text-red-500"
            >
              {errors.room_id}
            </p>
          )}
          {formData.room_id && isRoomAvailable !== null && !isCheckingAvailability && (
            <p 
              className={`mt-1 text-sm ${
                isRoomAvailable 
                  ? isDarkMode ? "text-green-400" : "text-green-600" 
                  : "text-red-500"
              }`}
            >
              {isRoomAvailable 
                ? "Sala disponível"
                : "Sala não disponível neste horário"}
            </p>
          )}
        </div>
        
        {/* Data */}
        <div className="mb-4">
          <label 
            htmlFor="appointment_date"
            className={`block text-sm font-medium mb-1 ${
              isDarkMode ? "text-slate-300" : "text-gray-700"
            }`}
          >
            Data
            {errors.appointment_date && (
              <span className="ml-1 text-red-500" aria-hidden="true">*</span>
            )}
          </label>
          <input
            id="appointment_date"
            type="date"
            name="appointment_date"
            value={formData.appointment_date}
            onChange={handleInputChange}
            required
            aria-invalid={!!errors.appointment_date}
            aria-describedby={errors.appointment_date ? "appointment_date-error" : undefined}
            className={`w-full p-2 rounded-md border ${
              errors.appointment_date
                ? "border-red-500"
                : isDarkMode 
                  ? "bg-neutral-700 border-neutral-600 text-slate-100" 
                  : "border-gray-300"
            }`}
          />
          {errors.appointment_date && (
            <p 
              id="appointment_date-error" 
              className="mt-1 text-sm text-red-500"
            >
              {errors.appointment_date}
            </p>
          )}
        </div>
        
        {/* Horário */}
        <div className="mb-4">
          <label 
            htmlFor="appointment_time"
            className={`block text-sm font-medium mb-1 ${
              isDarkMode ? "text-slate-300" : "text-gray-700"
            }`}
          >
            Horário
            {errors.appointment_time && (
              <span className="ml-1 text-red-500" aria-hidden="true">*</span>
            )}
          </label>
          <input
            id="appointment_time"
            type="time"
            name="appointment_time"
            value={formData.appointment_time}
            onChange={handleInputChange}
            required
            aria-invalid={!!errors.appointment_time}
            aria-describedby={errors.appointment_time ? "appointment_time-error" : undefined}
            className={`w-full p-2 rounded-md border ${
              errors.appointment_time
                ? "border-red-500"
                : isDarkMode 
                  ? "bg-neutral-700 border-neutral-600 text-slate-100" 
                  : "border-gray-300"
            }`}
          />
          {errors.appointment_time && (
            <p 
              id="appointment_time-error" 
              className="mt-1 text-sm text-red-500"
            >
              {errors.appointment_time}
            </p>
          )}
        </div>
        
        {/* Status */}
        <div className="mb-4">
          <label 
            htmlFor="status"
            className={`block text-sm font-medium mb-1 ${
              isDarkMode ? "text-slate-300" : "text-gray-700"
            }`}
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            required
            className={`w-full p-2 rounded-md border ${
              isDarkMode 
                ? "bg-neutral-700 border-neutral-600 text-slate-100" 
                : "border-gray-300"
            }`}
          >
            <option value="Pendente">Pendente</option>
            <option value="Concluído">Concluído</option>
            <option value="Cancelado">Cancelado</option>
            <option value="Reagendado">Reagendado</option>
          </select>
        </div>
        
        {/* Botões */}
        <div className="flex space-x-2 mt-6">
          <button
            type="submit"
            disabled={isSubmitting || isCheckingAvailability}
            aria-busy={isSubmitting || isCheckingAvailability}
            className={`flex-1 py-2 px-4 rounded-md text-white font-medium ${
              isSubmitting || isCheckingAvailability
                ? isDarkMode 
                  ? "bg-emerald-800 cursor-not-allowed" 
                  : "bg-emerald-300 cursor-not-allowed"
                : isDarkMode 
                  ? "bg-emerald-600 hover:bg-emerald-700" 
                  : "bg-emerald-500 hover:bg-emerald-600"
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="sr-only">Salvando...</span>
                <span aria-hidden="true" className="flex items-center justify-center">
                  <span className="animate-spin h-4 w-4 border-b-2 border-white mr-2"></span>
                  Salvando...
                </span>
              </>
            ) : isCheckingAvailability ? (
              <>
                <span className="sr-only">Verificando disponibilidade...</span>
                <span aria-hidden="true" className="flex items-center justify-center">
                  <span className="animate-spin h-4 w-4 border-b-2 border-white mr-2"></span>
                  Verificando...
                </span>
              </>
            ) : (
              "Salvar"
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={`flex-1 py-2 px-4 rounded-md font-medium ${
              isDarkMode 
                ? "bg-slate-700 text-white hover:bg-slate-600" 
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentForm;
