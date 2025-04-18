"use client";

/**
 * Página de Criação de Novo Agendamento
 * Formulário dedicado para criar novos agendamentos com suporte a recorrência
 */

import { useState, useEffect } from "react";
import { useTheme } from "@/app/contexts/ThemeContext";
import { useRouter, useSearchParams } from "next/navigation";
import RootLayout from "@/app/components/RootLayout";
import {
  format,
  parse,
  addDays,
  addWeeks,
  addMonths,
  isBefore,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import logger from "@/lib/logger";

import Calendar from "@/app/(pages)/usual/scheduling/components/Calendar";
import {
  Customer,
  Professional,
  Service,
  Room,
  AppointmentForm as AppointmentFormType,
  appointmentService,
} from "@/services/AppointmentService";
import { Breadcrumb } from "@/app/components/Breadcrumb/Breadcrumb";

// Tipos de recorrência disponíveis
type RecurrenceType = "none" | "daily" | "weekly" | "biweekly" | "monthly";

// Interface para as opções de recorrência
interface RecurrenceOptions {
  type: RecurrenceType;
  occurrences: number; // Número de ocorrências (0 = infinito)
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDarkMode } = useTheme();

  // Obter data da URL se disponível
  const dateParam = searchParams.get("date");
  const initialDate = dateParam
    ? parse(dateParam, "yyyy-MM-dd", new Date())
    : new Date();

  // Estados para o formulário
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [formData, setFormData] = useState<AppointmentFormType>({
    customer_id: "",
    service_id: "",
    professional_id: "",
    room_id: "",
    appointment_time: format(initialDate, "HH:mm"),
    appointment_date: format(initialDate, "yyyy-MM-dd"),
    status: "Pendente",
  });

  // Estados para dados relacionados
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Estado para validação
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para recorrência
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceOptions, setRecurrenceOptions] = useState<RecurrenceOptions>(
    {
      type: "weekly",
      occurrences: 4,
    }
  );

  // Carregar dados relacionados ao inicializar
  useEffect(() => {
    loadRelatedData();
  }, []);

  // Função para carregar todos os dados relacionados
  const loadRelatedData = async () => {
    logger.debug(
      `[NewAppointmentPage] - loadRelatedData - Carregando dados relacionados`
    );

    try {
      const [customersData, professionalsData, servicesData, roomsData] =
        await Promise.all([
          appointmentService.getCustomers(),
          appointmentService.getProfessionals(),
          appointmentService.getServices(),
          appointmentService.getRooms(),
        ]);

      setCustomers(customersData);
      setProfessionals(professionalsData);
      setServices(servicesData);
      setRooms(roomsData);
    } catch (error) {
      logger.error(
        `[NewAppointmentPage] - loadRelatedData - Erro ao carregar dados: ${error}`
      );
    }
  };

  // Handler para alteração da data no calendário
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setFormData({
      ...formData,
      appointment_date: format(date, "yyyy-MM-dd"),
    });
  };

  // Handler para alteração de campo do formulário
  const handleInputChange = (
    field: keyof AppointmentFormType,
    value: string
  ) => {
    setFormData({
      ...formData,
      [field]: value,
    });

    // Limpar erro de validação ao alterar o campo
    if (validationErrors[field]) {
      setValidationErrors({
        ...validationErrors,
        [field]: "",
      });
    }
  };

  // Verificar disponibilidade do profissional e sala
  const checkAvailability = async () => {
    if (
      !formData.professional_id ||
      !formData.room_id ||
      !formData.appointment_date ||
      !formData.appointment_time
    ) {
      return {
        available: false,
        message: "Preencha todos os campos obrigatórios",
      };
    }

    try {
      const dateTimeStr = `${formData.appointment_date}T${formData.appointment_time}:00`;
      const appointmentDateTime = parseISO(dateTimeStr);

      // Verificar se a data está no passado
      if (isBefore(appointmentDateTime, new Date())) {
        return {
          available: false,
          message: "Não é possível agendar para datas passadas",
        };
      }

      // Verificar disponibilidade do profissional
      const professionalResult = 
        await appointmentService.checkProfessionalAvailability(
          formData.professional_id,
          appointmentDateTime
        );

      // Em vez de bloquear, apenas alertamos se houver outros agendamentos
      if (professionalResult.appointments > 0) {
        const professional = professionals.find(p => p.id === formData.professional_id);
        return {
          available: true,
          warning: true,
          message: `Atenção: ${professional?.professional_name || 'O profissional'} já possui ${professionalResult.appointments} agendamento(s) neste horário. Deseja continuar?`,
          existingAppointments: professionalResult.existingAppointments
        };
      }

      // Verificar disponibilidade da sala
      const roomResult = await appointmentService.checkRoomAvailability(
        formData.room_id,
        appointmentDateTime
      );

      if (roomResult.appointments > 0) {
        const room = rooms.find(r => r.id === formData.room_id);
        return {
          available: true,
          warning: true,
          message: `Atenção: A sala ${room?.display_name || 'selecionada'} já possui ${roomResult.appointments} agendamento(s) neste horário. Deseja continuar?`,
          existingAppointments: roomResult.existingAppointments
        };
      }

      return { available: true, message: "Horário disponível" };
    } catch (error) {
      logger.error(
        `[NewAppointmentPage] - checkAvailability - Erro ao verificar disponibilidade: ${error}`
      );
      return { available: false, message: "Erro ao verificar disponibilidade" };
    }
  };

  // Gerar datas para agendamentos recorrentes
  const generateRecurringDates = (): string[] => {
    if (!isRecurring || recurrenceOptions.type === "none") {
      return [formData.appointment_date];
    }

    const dates: string[] = [formData.appointment_date];
    const baseDate = parse(formData.appointment_date, "yyyy-MM-dd", new Date());
    const maxOccurrences = recurrenceOptions.occurrences || 1;

    for (let i = 1; i < maxOccurrences; i++) {
      let nextDate: Date;

      switch (recurrenceOptions.type) {
        case "daily":
          nextDate = addDays(baseDate, i);
          break;
        case "weekly":
          nextDate = addWeeks(baseDate, i);
          break;
        case "biweekly":
          nextDate = addWeeks(baseDate, i * 2);
          break;
        case "monthly":
          nextDate = addMonths(baseDate, i);
          break;
        default:
          continue;
      }

      dates.push(format(nextDate, "yyyy-MM-dd"));
    }

    return dates;
  };

  // Validar formulário
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.customer_id) errors.customer_id = "Selecione um cliente";
    if (!formData.service_id) errors.service_id = "Selecione um serviço";
    if (!formData.professional_id)
      errors.professional_id = "Selecione um profissional";
    if (!formData.room_id) errors.room_id = "Selecione uma sala";
    if (!formData.appointment_time)
      errors.appointment_time = "Selecione um horário";

    // Validar recorrência
    if (isRecurring && recurrenceOptions.occurrences < 1) {
      errors.occurrences = "Número de ocorrências deve ser pelo menos 1";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handler para submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    logger.debug(
      `[NewAppointmentPage] - handleSubmit - Enviando formulário: ${JSON.stringify(
        formData
      )}`
    );

    if (!validateForm()) {
      return;
    }

    // Verificar disponibilidade
    const availabilityCheck = await checkAvailability();
    if (!availabilityCheck.available) {
      setValidationErrors({
        ...validationErrors,
        availability: availabilityCheck.message,
      });
      return;
    }

    if (availabilityCheck.warning) {
      const confirm = window.confirm(availabilityCheck.message);
      if (!confirm) {
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Gerar datas para agendamentos recorrentes
      const dates = generateRecurringDates();

      // Criar agendamentos para cada data
      const results = await Promise.all(
        dates.map((date) =>
          appointmentService.createAppointment({
            ...formData,
            appointment_date: date,
          })
        )
      );

      logger.debug(
        `[NewAppointmentPage] - handleSubmit - Agendamentos criados com sucesso: ${results.length} ocorrências`
      );

      // Redirecionar para a página de agendamentos
      router.push("/usual/scheduling");
    } catch (error) {
      logger.error(
        `[NewAppointmentPage] - handleSubmit - Erro ao criar agendamento: ${error}`
      );
      setValidationErrors({
        ...validationErrors,
        submit: "Erro ao criar agendamento. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler para cancelar e voltar
  const handleCancel = () => {
    router.push("/usual/scheduling");
  };

  return (
    <RootLayout>
      <div className="flex flex-col h-full">
        {/* Cabeçalho */}
        <div className="flex items-center mb-6">
          <Breadcrumb
            parentLabel="Agendamentos"
            parentHref="/usual/scheduling"
            current="Novo Agendamento"
          />
        </div>

        {/* Layout principal em 2 colunas */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Coluna do calendário (esquerda) */}
          <div
            className={`w-full md:w-64 p-4 rounded-lg ${
              isDarkMode ? "bg-slate-800" : "bg-white border border-gray-200"
            }`}
          >
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
          </div>

          {/* Coluna do formulário (direita) */}
          <div
            className={`flex-1 rounded-lg p-6 ${
              isDarkMode ? "bg-slate-800" : "bg-white border border-gray-200"
            }`}
          >
            <form onSubmit={handleSubmit}>
              {/* Mensagem de erro geral */}
              {validationErrors.submit && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {validationErrors.submit}
                </div>
              )}

              {/* Campos de cliente, serviço, profissional, sala */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Cliente */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Cliente <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) =>
                      handleInputChange("customer_id", e.target.value)
                    }
                    className={`w-full px-3 py-2 rounded-md ${
                      isDarkMode
                        ? "bg-slate-700 text-white border-slate-600"
                        : "bg-white border-gray-300"
                    } ${
                      validationErrors.customer_id ? "border-red-500" : "border"
                    }`}
                  >
                    <option value="">Selecione um cliente</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.customer_name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.customer_id && (
                    <p className="mt-1 text-sm text-red-500">
                      {validationErrors.customer_id}
                    </p>
                  )}
                </div>

                {/* Serviço */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Serviço <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.service_id}
                    onChange={(e) =>
                      handleInputChange("service_id", e.target.value)
                    }
                    className={`w-full px-3 py-2 rounded-md ${
                      isDarkMode
                        ? "bg-slate-700 text-white border-slate-600"
                        : "bg-white border-gray-300"
                    } ${
                      validationErrors.service_id ? "border-red-500" : "border"
                    }`}
                  >
                    <option value="">Selecione um serviço</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.display_name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.service_id && (
                    <p className="mt-1 text-sm text-red-500">
                      {validationErrors.service_id}
                    </p>
                  )}
                </div>

                {/* Profissional */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Profissional <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.professional_id}
                    onChange={(e) =>
                      handleInputChange("professional_id", e.target.value)
                    }
                    className={`w-full px-3 py-2 rounded-md ${
                      isDarkMode
                        ? "bg-slate-700 text-white border-slate-600"
                        : "bg-white border-gray-300"
                    } ${
                      validationErrors.professional_id
                        ? "border-red-500"
                        : "border"
                    }`}
                  >
                    <option value="">Selecione um profissional</option>
                    {professionals.map((professional) => (
                      <option key={professional.id} value={professional.id}>
                        {professional.professional_name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.professional_id && (
                    <p className="mt-1 text-sm text-red-500">
                      {validationErrors.professional_id}
                    </p>
                  )}
                </div>

                {/* Sala */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Sala <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`block w-full bg-gray-50 border rounded-md py-2 px-3 ${
                      isDarkMode ? "dark:bg-gray-700 dark:border-gray-600" : ""
                    }`}
                    name="room_id"
                    value={formData.room_id}
                    onChange={(e) => handleInputChange("room_id", e.target.value)}
                  >
                    <option value="">Selecione uma sala</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.display_name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.room_id && (
                    <p className="mt-1 text-sm text-red-500">
                      {validationErrors.room_id}
                    </p>
                  )}
                </div>
              </div>

              {/* Data e Hora */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Data */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Data <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.appointment_date}
                    onChange={(e) =>
                      handleInputChange("appointment_date", e.target.value)
                    }
                    className={`w-full px-3 py-2 rounded-md ${
                      isDarkMode
                        ? "bg-slate-700 text-white border-slate-600"
                        : "bg-white border-gray-300"
                    } ${
                      validationErrors.appointment_date
                        ? "border-red-500"
                        : "border"
                    }`}
                  />
                  {validationErrors.appointment_date && (
                    <p className="mt-1 text-sm text-red-500">
                      {validationErrors.appointment_date}
                    </p>
                  )}
                </div>

                {/* Hora */}
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Hora <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.appointment_time}
                    onChange={(e) =>
                      handleInputChange("appointment_time", e.target.value)
                    }
                    className={`w-full px-3 py-2 rounded-md ${
                      isDarkMode
                        ? "bg-slate-700 text-white border-slate-600"
                        : "bg-white border-gray-300"
                    } ${
                      validationErrors.appointment_time
                        ? "border-red-500"
                        : "border"
                    }`}
                  />
                  {validationErrors.appointment_time && (
                    <p className="mt-1 text-sm text-red-500">
                      {validationErrors.appointment_time}
                    </p>
                  )}
                </div>
              </div>

              {/* Recorrência */}
              <div
                className={`p-4 mb-6 rounded-lg ${
                  isDarkMode ? "bg-slate-700" : "bg-gray-100"
                }`}
              >
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <input
                      id="isRecurring"
                      type="checkbox"
                      checked={isRecurring}
                      onChange={() => setIsRecurring(!isRecurring)}
                      className="mr-2 h-4 w-4"
                    />
                    <label
                      htmlFor="isRecurring"
                      className="text-sm font-medium"
                    >
                      Este agendamento é recorrente?
                    </label>
                  </div>
                  <p
                    className={`text-xs ${
                      isDarkMode ? "text-slate-400" : "text-gray-500"
                    }`}
                  >
                    Agendamentos recorrentes serão criados automaticamente com
                    base nas opções selecionadas.
                  </p>
                </div>

                {isRecurring && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tipo de recorrência */}
                    <div>
                      <label className="block mb-1 text-sm font-medium">
                        Repetir
                      </label>
                      <select
                        value={recurrenceOptions.type}
                        onChange={(e) =>
                          setRecurrenceOptions({
                            ...recurrenceOptions,
                            type: e.target.value as RecurrenceType,
                          })
                        }
                        className={`w-full px-3 py-2 rounded-md ${
                          isDarkMode
                            ? "bg-slate-800 text-white border-slate-600"
                            : "bg-white border-gray-300"
                        } border`}
                      >
                        <option value="daily">Diariamente</option>
                        <option value="weekly">Semanalmente</option>
                        <option value="biweekly">Quinzenalmente</option>
                        <option value="monthly">Mensalmente</option>
                      </select>
                    </div>

                    {/* Número de ocorrências */}
                    <div>
                      <label className="block mb-1 text-sm font-medium">
                        Ocorrências
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="52"
                        value={recurrenceOptions.occurrences}
                        onChange={(e) =>
                          setRecurrenceOptions({
                            ...recurrenceOptions,
                            occurrences: parseInt(e.target.value) || 0,
                          })
                        }
                        className={`w-full px-3 py-2 rounded-md ${
                          isDarkMode
                            ? "bg-slate-800 text-white border-slate-600"
                            : "bg-white border-gray-300"
                        } ${
                          validationErrors.occurrences
                            ? "border-red-500"
                            : "border"
                        }`}
                      />
                      {validationErrors.occurrences && (
                        <p className="mt-1 text-sm text-red-500">
                          {validationErrors.occurrences}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mensagem de disponibilidade */}
              {validationErrors.availability && (
                <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {validationErrors.availability}
                </div>
              )}

              {/* Botões */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className={`px-4 py-2 rounded-md ${
                    isDarkMode
                      ? "bg-slate-700 text-white hover:bg-slate-600"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-md ${
                    isDarkMode
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-emerald-500 text-white hover:bg-emerald-600"
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Salvando..." : "Salvar Agendamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </RootLayout>
  );
}
