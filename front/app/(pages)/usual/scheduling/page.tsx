"use client";

/**
 * Página de Agendamentos
 * Interface principal para visualização e gerenciamento de agendamentos
 * Composta por três seções: calendário, lista de agendamentos e detalhes
 */

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/app/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import RootLayout from "@/app/components/RootLayout";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import logger from "@/lib/logger";
import { toast } from "react-hot-toast";

// Componentes específicos para agendamentos
import Calendar from "@/app/(pages)/usual/scheduling/components/Calendar";
import AppointmentList from "@/app/(pages)/usual/scheduling/components/AppointmentList";
import AppointmentDetails from "@/app/(pages)/usual/scheduling/components/AppointmentDetails";

// Importar serviço centralizado para agendamentos
import {
  appointmentService,
  Appointment,
  Customer,
  Professional,
  Service,
  Room,
  AppointmentForm as AppointmentFormType,
} from "@/services/AppointmentService";

// Type para mapear status para exibição
type StatusDisplayMap = {
  [key in "Pendente" | "Cancelado" | "Reagendado" | "Concluido"]: string;
};

// Constantes para mapeamento de status
const STATUS_DISPLAY: StatusDisplayMap = {
  Pendente: "Pendente",
  Cancelado: "Cancelado",
  Reagendado: "Reagendado",
  Concluido: "Concluído",
};

// Função para converter status de exibição para status interno
const displayToInternalStatus = (
  displayStatus: string
): "Pendente" | "Cancelado" | "Reagendado" | "Concluido" | null => {
  const statusEntry = Object.entries(STATUS_DISPLAY).find(
    ([_, display]) => display === displayStatus
  );

  return statusEntry
    ? (statusEntry[0] as "Pendente" | "Cancelado" | "Reagendado" | "Concluido")
    : null;
};

export default function SchedulingPage() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  // Estado para gerenciar a visualização (dia, semana, mês)
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");

  // Estados para gerenciar o calendário
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Estados para gerenciar os agendamentos
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<
    Appointment[]
  >([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para os dados de relacionamento
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Estados para filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [professionalFilter, setProfessionalFilter] = useState<string>("all");

  // Função para buscar agendamentos para a data selecionada
  const fetchAppointmentsForDate = async (date: Date) => {
    logger.debug(
      `[SchedulingPage] - fetchAppointmentsForDate - Data: ${format(
        date,
        "dd/MM/yyyy"
      )}`
    );

    if (!date) return;

    try {
      setIsLoading(true);

      // Formatar a data para o formato esperado pela API
      const formattedDate = format(date, "yyyy-MM-dd");

      // Buscar os agendamentos para a data
      const result = await appointmentService.getAppointmentsByDate(
        formattedDate
      );

      if (result) {
        setAppointments(result);
        // Aplicar filtros aos novos dados
        const filtered = applyFilters(
          result,
          searchQuery,
          statusFilter,
          professionalFilter
        );
        setFilteredAppointments(filtered);

        logger.debug(
          `[SchedulingPage] - fetchAppointmentsForDate - ${result.length} agendamentos encontrados`
        );

        // Se houver um agendamento selecionado, atualizar com dados mais recentes
        if (selectedAppointment) {
          const updated = result.find((a) => a.id === selectedAppointment.id);
          if (updated) {
            setSelectedAppointment(updated);
          } else {
            setSelectedAppointment(null);
          }
        }
      }
    } catch (error) {
      logger.error(
        `[SchedulingPage] - fetchAppointmentsForDate - Erro: ${error}`
      );
      toast.error("Erro ao buscar agendamentos. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAppointmentsForDateCallback = useCallback(
    (date: Date) => fetchAppointmentsForDate(date),
    [searchQuery, statusFilter, professionalFilter, selectedAppointment]
  );

  // Carregar agendamentos da data selecionada
  useEffect(() => {
    fetchAppointmentsForDateCallback(selectedDate);
  }, [selectedDate, fetchAppointmentsForDateCallback]);

  // Carregar dados de relacionamento ao inicializar
  useEffect(() => {
    loadRelatedData();
  }, []);

  // Função para carregar todos os dados relacionados de uma vez
  const loadRelatedData = async () => {
    logger.debug(
      `[SchedulingPage] - loadRelatedData - Carregando dados relacionados`
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
        `[SchedulingPage] - loadRelatedData - Erro ao carregar dados: ${error}`
      );
    }
  };

  // Aplicar filtros aos agendamentos
  const applyFilters = (
    data: Appointment[],
    search: string,
    status: string,
    professional: string
  ): Appointment[] => {
    logger.debug(
      `[SchedulingPage] - applyFilters - Aplicando filtros: busca="${search}", status="${status}", profissional="${professional}"`
    );

    let result = [...data];

    // Aplicar filtro de status
    if (status !== "all") {
      result = result.filter((appointment) => appointment.status === status);
    }

    // Aplicar filtro de profissional
    if (professional !== "all") {
      result = result.filter(
        (appointment) => appointment.professional_id === professional
      );
    }

    // Aplicar busca por nome do cliente
    if (search.trim() !== "") {
      const searchLower = search.toLowerCase();
      result = result.filter((appointment) => {
        const customer = customers.find(
          (c) => c.id === appointment.customer_id
        );
        return customer?.customer_name.toLowerCase().includes(searchLower);
      });
    }

    return result;
  };

  // Handler para mudança nos filtros
  const handleFilterChange = (
    type: "search" | "status" | "professional",
    value: string
  ) => {
    logger.debug(
      `[SchedulingPage] - handleFilterChange - Tipo: ${type}, Valor: ${value}`
    );

    switch (type) {
      case "search":
        setSearchQuery(value);
        setFilteredAppointments(
          applyFilters(appointments, value, statusFilter, professionalFilter)
        );
        break;
      case "status":
        setStatusFilter(value);
        setFilteredAppointments(
          applyFilters(appointments, searchQuery, value, professionalFilter)
        );
        break;
      case "professional":
        setProfessionalFilter(value);
        setFilteredAppointments(
          applyFilters(appointments, searchQuery, statusFilter, value)
        );
        break;
    }
  };

  // Handler para seleção de data no calendário
  const handleDateSelect = (date: Date) => {
    logger.debug(
      `[SchedulingPage] - handleDateSelect - Data selecionada: ${format(
        date,
        "yyyy-MM-dd"
      )}`
    );

    setSelectedDate(date);
    setSelectedAppointment(null);
  };

  // Handler para seleção de agendamento
  const handleAppointmentSelect = (appointment: Appointment) => {
    logger.debug(
      `[SchedulingPage] - handleAppointmentSelect - ID: ${appointment.id}`
    );

    setSelectedAppointment(appointment);
  };

  // Handler para criar novo agendamento
  const handleCreateNew = () => {
    logger.debug(
      `[SchedulingPage] - handleCreateNew - Redirecionando para página de criação`
    );

    // Redirecionar para a página de criação de agendamento
    router.push(
      `/usual/scheduling/new?date=${format(selectedDate, "yyyy-MM-dd")}`
    );
  };

  // Handler para alteração de status
  const handleStatusChange = async (
    newStatus: "Concluido" | "Pendente" | "Cancelado" | "Reagendado"
  ) => {
    if (!selectedAppointment) return;

    logger.debug(
      `[SchedulingPage] - handleStatusChange - ID: ${selectedAppointment.id}, Novo Status: ${newStatus}`
    );

    try {
      setIsSubmitting(true);
      await appointmentService.updateAppointmentStatus(
        selectedAppointment.id,
        newStatus
      );

      // Atualizar o estado local
      const updatedAppointment = {
        ...selectedAppointment,
        status: newStatus,
      };

      setSelectedAppointment(updatedAppointment);

      // Atualizar a lista de agendamentos
      const updatedAppointments = appointments.map((appointment) =>
        appointment.id === selectedAppointment.id
          ? updatedAppointment
          : appointment
      );

      setAppointments(updatedAppointments);
      setFilteredAppointments(
        applyFilters(
          updatedAppointments,
          searchQuery,
          statusFilter,
          professionalFilter
        )
      );

      const statusText = STATUS_DISPLAY[newStatus];
      toast.success(`Status alterado para ${statusText}`);
    } catch (error) {
      logger.error(
        `[SchedulingPage] - handleStatusChange - Erro ao alterar status: ${error}`
      );
      toast.error("Erro ao alterar status");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RootLayout>
      <div className="flex flex-col h-full max-h-[calc(100vh-4rem)] overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div>
            <h1
              className={`text-2xl font-semibold ${
                isDarkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Agendamentos
            </h1>
            <p className={isDarkMode ? "text-slate-400" : "text-gray-500"}>
              {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })}
            </p>
          </div>

          <div className="flex mt-4 md:mt-0 gap-4">
            {/* Botão de novo agendamento */}
            <button
              onClick={handleCreateNew}
              className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                isDarkMode
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-emerald-500 text-white hover:bg-emerald-600"
              }`}
              aria-label="Criar novo agendamento"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Novo Agendamento
            </button>

            {/* Seletor de visualização */}
            <div
              className={`flex rounded-md overflow-hidden border ${
                isDarkMode ? "border-neutral-600" : "border-slate-300"
              }`}
            >
              <button
                onClick={() => setViewMode("day")}
                aria-pressed={viewMode === "day"}
                className={`px-3 py-1 text-sm ${
                  viewMode === "day"
                    ? isDarkMode
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-500 text-white"
                    : isDarkMode
                    ? "bg-neutral-700 text-white hover:bg-neutral-600"
                    : "bg-slate-200 text-slate-800 hover:bg-slate-300"
                }`}
              >
                Dia
              </button>
              <button
                onClick={() => setViewMode("week")}
                aria-pressed={viewMode === "week"}
                className={`px-3 py-1 text-sm ${
                  viewMode === "week"
                    ? isDarkMode
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-500 text-white"
                    : isDarkMode
                    ? "bg-neutral-700 text-white hover:bg-neutral-600"
                    : "bg-slate-200 text-slate-800 hover:bg-slate-300"
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setViewMode("month")}
                aria-pressed={viewMode === "month"}
                className={`px-3 py-1 text-sm ${
                  viewMode === "month"
                    ? isDarkMode
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-500 text-white"
                    : isDarkMode
                    ? "bg-neutral-700 text-white hover:bg-neutral-600"
                    : "bg-slate-200 text-slate-800 hover:bg-slate-300"
                }`}
                disabled={true} // Ainda não implementado
              >
                Mês (em breve)
              </button>
            </div>
          </div>
        </div>

        {/* Layout principal em 3 colunas */}
        <div className="flex flex-col md:flex-row h-[calc(100vh-10rem)] overflow-hidden min-h-0">
          {/* Coluna do calendário (esquerda) */}
          <div
            className={`w-full md:w-64 p-4 rounded-lg mb-4 md:mb-0 md:mr-4 overflow-auto ${
              isDarkMode ? "bg-neutral-800" : "bg-white border border-gray-200"
            }`}
          >
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
          </div>

          {/* Coluna de agendamentos (central) */}
          <div
            className={`flex-1 rounded-lg p-4 mb-4 md:mb-0 overflow-hidden flex flex-col min-h-0 ${
              isDarkMode ? "bg-neutral-800" : "bg-white border border-gray-200"
            }`}
          >
            {/* Filtros */}
            <div className="mb-4 space-y-3">
              {/* Filtro de busca por nome */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nome do cliente..."
                  value={searchQuery}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className={`pl-8 w-full p-2 rounded-md border ${
                    isDarkMode
                      ? "bg-neutral-700 text-white border-neutral-600"
                      : "bg-white text-gray-900 border-gray-300"
                  } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-4 h-4 absolute left-2 top-3 text-gray-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {/* Filtros em linha */}
              <div className="flex flex-wrap gap-2">
                {/* Filtro de status */}
                <select
                  value={statusFilter}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className={`p-2 rounded-md text-sm ${
                    isDarkMode
                      ? "bg-neutral-700 text-white border-neutral-600"
                      : "bg-white text-gray-900 border-gray-300"
                  } border focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                >
                  <option value="all">Todos os status</option>
                  <option value="Pendente">{STATUS_DISPLAY["Pendente"]}</option>
                  <option value="Concluido">
                    {STATUS_DISPLAY["Concluido"]}
                  </option>
                  <option value="Cancelado">
                    {STATUS_DISPLAY["Cancelado"]}
                  </option>
                  <option value="Reagendado">
                    {STATUS_DISPLAY["Reagendado"]}
                  </option>
                </select>

                {/* Filtro de profissional */}
                <select
                  value={professionalFilter}
                  onChange={(e) =>
                    handleFilterChange("professional", e.target.value)
                  }
                  className={`p-2 rounded-md text-sm ${
                    isDarkMode
                      ? "bg-neutral-700 text-white border-neutral-600"
                      : "bg-white text-gray-900 border-gray-300"
                  } border focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                >
                  <option value="all">Todos os profissionais</option>
                  {professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {professional.professional_name}
                    </option>
                  ))}
                </select>

                {/* Indicador de resultados */}
                <div
                  className={`ml-auto text-sm ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {filteredAppointments.length} resultado(s)
                </div>
              </div>
            </div>

            <AppointmentList
              appointments={filteredAppointments}
              isLoading={isLoading}
              selectedAppointment={selectedAppointment}
              onSelectAppointment={handleAppointmentSelect}
              onCreateNew={handleCreateNew}
              selectedDate={selectedDate}
              customers={customers}
              professionals={professionals}
              services={services}
              rooms={rooms}
            />
          </div>

          {/* Coluna de detalhes (direita) */}
          <div
            className={`w-full md:w-80 md:ml-4 rounded-lg p-4 overflow-y-auto ${
              isDarkMode ? "bg-neutral-800" : "bg-white border border-slate-200"
            }`}
          >
            {!selectedAppointment ? (
              <div
                className={`text-center py-8 ${
                  isDarkMode ? "text-slate-300" : "text-neutral-700"
                }`}
              >
                <p>Selecione um agendamento para ver os detalhes</p>
                <p className="text-sm mt-1">
                  ou clique em &quot;Novo Agendamento&quot; para criar
                </p>
              </div>
            ) : (
              <AppointmentDetails
                appointment={selectedAppointment}
                customers={customers}
                professionals={professionals}
                services={services}
                rooms={rooms}
                onStatusChange={handleStatusChange}
              />
            )}
          </div>
        </div>
      </div>
    </RootLayout>
  );
}
