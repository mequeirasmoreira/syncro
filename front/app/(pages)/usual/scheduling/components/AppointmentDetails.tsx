"use client";

/**
 * Componente de Detalhes do Agendamento
 * Exibe informações detalhadas de um agendamento selecionado
 * Permite alteração de status e fornece recursos de acessibilidade
 */

import { useState } from "react";
import { useTheme } from "../../../../contexts/ThemeContext";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import logger from "../../../../../lib/logger";
import {
  Appointment,
  Customer,
  Professional,
  Service,
  Room,
} from "../../../../../services/AppointmentService";

interface AppointmentDetailsProps {
  appointment: Appointment;
  customers: Customer[];
  professionals: Professional[];
  services: Service[];
  rooms: Room[];
  onStatusChange: (
    status: "Concluido" | "Pendente" | "Cancelado" | "Reagendado"
  ) => Promise<void>;
  className?: string;
}

const AppointmentDetails = ({
  appointment,
  customers,
  professionals,
  services,
  rooms,
  onStatusChange,
  className = "",
}: AppointmentDetailsProps) => {
  const { isDarkMode } = useTheme();
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [statusActionMessage, setStatusActionMessage] = useState<string>("");

  // Encontrar entidades relacionadas
  const customer = customers.find((c) => c.id === appointment.customer_id);
  const professional = professionals.find(
    (p) => p.id === appointment.professional_id
  );
  const service = services.find((s) => s.id === appointment.service_id);
  const room = rooms.find((r) => r.id === appointment.room_id);

  // Manipulador para alteração de status
  const handleStatusChange = async (
    newStatus: "Concluido" | "Pendente" | "Cancelado" | "Reagendado"
  ) => {
    logger.debug(
      `[AppointmentDetails] - handleStatusChange - ID: ${appointment.id}, Novo status: ${newStatus}`
    );

    try {
      setIsChangingStatus(true);
      setStatusActionMessage(`Alterando status para ${newStatus}...`);

      // Chamar a função fornecida pelo componente pai
      await onStatusChange(newStatus);

      setStatusActionMessage(`Status alterado para ${newStatus} com sucesso!`);

      // Limpar a mensagem após um tempo
      setTimeout(() => {
        setStatusActionMessage("");
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(
        `[AppointmentDetails] - handleStatusChange - Erro: ${errorMessage}`
      );

      setStatusActionMessage(`Erro ao alterar status: ${errorMessage}`);

      // Limpar a mensagem de erro após um tempo
      setTimeout(() => {
        setStatusActionMessage("");
      }, 5000);
    } finally {
      setIsChangingStatus(false);
    }
  };

  // Verificar se renderização está pronta
  if (!customer || !professional || !service || !room) {
    return (
      <div className={`appointment-details-container ${className}`}>
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto"></div>
          <p
            className={`mt-2 ${
              isDarkMode ? "text-slate-300" : "text-gray-500"
            }`}
          >
            Carregando detalhes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`appointment-details-container ${className}`}
      aria-label="Detalhes do agendamento"
    >
      <h2
        className={`font-semibold mb-4 ${
          isDarkMode ? "text-white" : "text-gray-800"
        }`}
        aria-live="polite"
      >
        Detalhes do Agendamento
      </h2>

      {/* Mensagem de ação para leitores de tela */}
      {statusActionMessage && (
        <div
          className={`mb-4 p-2 rounded-md ${
            statusActionMessage.includes("Erro")
              ? isDarkMode
                ? "bg-red-900 text-red-100"
                : "bg-red-100 text-red-800"
              : isDarkMode
              ? "bg-green-900 text-green-100"
              : "bg-green-100 text-green-800"
          }`}
          aria-live="assertive"
          role="alert"
        >
          {statusActionMessage}
        </div>
      )}

      {/* Cliente */}
      <div className="mb-4">
        <h3
          className={`text-xs uppercase ${
            isDarkMode ? "text-slate-400" : "text-gray-500"
          }`}
        >
          Cliente
        </h3>
        <p
          className={`font-medium ${
            isDarkMode ? "text-white" : "text-gray-800"
          }`}
        >
          {customer.customer_name}
        </p>
      </div>

      {/* Serviço */}
      <div className="mb-4">
        <h3
          className={`text-xs uppercase ${
            isDarkMode ? "text-slate-400" : "text-gray-500"
          }`}
        >
          Serviço
        </h3>
        <p
          className={`font-medium ${
            isDarkMode ? "text-white" : "text-gray-800"
          }`}
        >
          {service.display_name}
        </p>
      </div>

      {/* Profissional */}
      <div className="mb-4">
        <h3
          className={`text-xs uppercase ${
            isDarkMode ? "text-slate-400" : "text-gray-500"
          }`}
        >
          Profissional
        </h3>
        <p
          className={`font-medium ${
            isDarkMode ? "text-white" : "text-gray-800"
          }`}
        >
          {professional.professional_name}
        </p>
      </div>

      {/* Sala/Unidade */}
      <div className="mb-4">
        <h3
          className={`text-xs uppercase ${
            isDarkMode ? "text-slate-400" : "text-gray-500"
          }`}
        >
          Sala/Unidade
        </h3>
        <p
          className={`font-medium ${
            isDarkMode ? "text-white" : "text-gray-800"
          }`}
        >
          {room.display_name}
        </p>
      </div>

      {/* Data e Hora */}
      <div className="mb-4">
        <h3
          className={`text-xs uppercase ${
            isDarkMode ? "text-slate-400" : "text-gray-500"
          }`}
        >
          Data e Hora
        </h3>
        <p
          className={`font-medium ${
            isDarkMode ? "text-white" : "text-gray-800"
          }`}
        >
          {format(
            parseISO(appointment.appointment_time),
            "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
            { locale: ptBR }
          )}
        </p>
      </div>

      {/* Status */}
      <div className="mb-4">
        <h3
          className={`text-xs uppercase ${
            isDarkMode ? "text-slate-400" : "text-gray-500"
          }`}
        >
          Status
        </h3>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            appointment.status === "Concluido"
              ? isDarkMode
                ? "bg-green-900 text-green-100"
                : "bg-green-100 text-green-800"
              : appointment.status === "Pendente"
              ? isDarkMode
                ? "bg-yellow-900 text-yellow-100"
                : "bg-yellow-100 text-yellow-800"
              : appointment.status === "Cancelado"
              ? isDarkMode
                ? "bg-red-900 text-red-100"
                : "bg-red-100 text-red-800"
              : isDarkMode
              ? "bg-blue-900 text-blue-100"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {appointment.status}
        </span>
      </div>

      {/* Ações */}
      <div className="mt-6 space-y-2">
        <h3
          className={`text-xs uppercase mb-2 ${
            isDarkMode ? "text-slate-400" : "text-gray-500"
          }`}
        >
          Ações
        </h3>

        {/* Botões de alteração de status */}
        <div className="flex flex-wrap gap-2">
          {appointment.status !== "Concluido" && (
            <button
              onClick={() => handleStatusChange("Concluido")}
              disabled={isChangingStatus}
              className={`text-xs px-3 py-1.5 rounded ${
                isChangingStatus
                  ? isDarkMode
                    ? "bg-green-800 opacity-50 cursor-not-allowed"
                    : "bg-green-100 opacity-50 cursor-not-allowed"
                  : isDarkMode
                  ? "bg-green-800 text-green-100 hover:bg-green-700"
                  : "bg-green-100 text-green-800 hover:bg-green-200"
              }`}
            >
              {isChangingStatus ? (
                <span className="flex items-center">
                  <span className="animate-spin h-3 w-3 border-b-2 border-current mr-1"></span>
                  Processando...
                </span>
              ) : (
                "Marcar como Concluido"
              )}
            </button>
          )}

          {appointment.status !== "Pendente" && (
            <button
              onClick={() => handleStatusChange("Pendente")}
              disabled={isChangingStatus}
              className={`text-xs px-3 py-1.5 rounded ${
                isChangingStatus
                  ? isDarkMode
                    ? "bg-yellow-800 opacity-50 cursor-not-allowed"
                    : "bg-yellow-100 opacity-50 cursor-not-allowed"
                  : isDarkMode
                  ? "bg-yellow-800 text-yellow-100 hover:bg-yellow-700"
                  : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
              }`}
            >
              {isChangingStatus ? "Processando..." : "Marcar como Pendente"}
            </button>
          )}

          {appointment.status !== "Cancelado" && (
            <button
              onClick={() => handleStatusChange("Cancelado")}
              disabled={isChangingStatus}
              className={`text-xs px-3 py-1.5 rounded ${
                isChangingStatus
                  ? isDarkMode
                    ? "bg-red-800 opacity-50 cursor-not-allowed"
                    : "bg-red-100 opacity-50 cursor-not-allowed"
                  : isDarkMode
                  ? "bg-red-800 text-red-100 hover:bg-red-700"
                  : "bg-red-100 text-red-800 hover:bg-red-200"
              }`}
            >
              {isChangingStatus ? "Processando..." : "Cancelar Agendamento"}
            </button>
          )}

          {appointment.status !== "Reagendado" && (
            <button
              onClick={() => handleStatusChange("Reagendado")}
              disabled={isChangingStatus}
              className={`text-xs px-3 py-1.5 rounded ${
                isChangingStatus
                  ? isDarkMode
                    ? "bg-blue-800 opacity-50 cursor-not-allowed"
                    : "bg-blue-100 opacity-50 cursor-not-allowed"
                  : isDarkMode
                  ? "bg-blue-800 text-blue-100 hover:bg-blue-700"
                  : "bg-blue-100 text-blue-800 hover:bg-blue-200"
              }`}
            >
              {isChangingStatus ? "Processando..." : "Marcar como Reagendado"}
            </button>
          )}
        </div>
      </div>

      {/* Informações adicionais */}
      <div className="mt-6 text-xs">
        <p className={isDarkMode ? "text-slate-400" : "text-gray-500"}>
          Criado em:{" "}
          {appointment.created_at 
            ? format(parseISO(appointment.created_at), "dd/MM/yyyy HH:mm", {
                locale: ptBR,
              })
            : "Data não disponível"
          }
        </p>
        {appointment.updated_at && (
          <p className={isDarkMode ? "text-slate-400" : "text-gray-500"}>
            Última atualização:{" "}
            {appointment.updated_at
              ? format(parseISO(appointment.updated_at), "dd/MM/yyyy HH:mm", {
                  locale: ptBR,
                })
              : "Data não disponível"
            }
          </p>
        )}
      </div>
    </div>
  );
};

export default AppointmentDetails;
