"use client";

/**
 * Componente para listar agendamentos
 * Exibe uma lista de agendamentos para um dia específico
 * Suporta seleção e destaque visual para diferentes status
 */

import { useState, useEffect } from "react";
import { useTheme } from "@/app/contexts/ThemeContext";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import logger from "@/lib/logger";
import {
  Appointment,
  Customer,
  Professional,
  Service,
  Room,
} from "@/services/AppointmentService";

interface AppointmentListProps {
  appointments: Appointment[];
  isLoading: boolean;
  selectedAppointment: Appointment | null;
  onSelectAppointment: (appointment: Appointment) => void;
  onCreateNew: () => void;
  selectedDate: Date;
  customers: Customer[];
  professionals: Professional[];
  services: Service[];
  rooms: Room[];
  className?: string;
}

const AppointmentList = ({
  appointments,
  isLoading,
  selectedAppointment,
  onSelectAppointment,
  onCreateNew,
  selectedDate,
  customers,
  professionals,
  services,
  rooms,
  className = "",
}: AppointmentListProps) => {
  const { isDarkMode } = useTheme();

  // Efeito de destaque para o item selecionado via teclado
  const [keyboardSelectedIndex, setKeyboardSelectedIndex] =
    useState<number>(-1);

  // Reset do índice de seleção por teclado quando mudam os agendamentos
  useEffect(() => {
    setKeyboardSelectedIndex(-1);
  }, [appointments]);

  // Manipulação de navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    logger.debug(
      `[AppointmentList] - handleKeyDown - Tecla: ${e.key}, Index: ${index}`
    );

    if (e.key === "ArrowDown") {
      e.preventDefault();
      // Ir para o próximo item
      if (index < appointments.length - 1) {
        setKeyboardSelectedIndex(index + 1);
        document.getElementById(`appointment-item-${index + 1}`)?.focus();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      // Ir para o item anterior
      if (index > 0) {
        setKeyboardSelectedIndex(index - 1);
        document.getElementById(`appointment-item-${index - 1}`)?.focus();
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      // Selecionar o item atual
      onSelectAppointment(appointments[index]);
    } else if (e.key === "Home") {
      e.preventDefault();
      // Ir para o primeiro item
      if (appointments.length > 0) {
        setKeyboardSelectedIndex(0);
        document.getElementById(`appointment-item-0`)?.focus();
      }
    } else if (e.key === "End") {
      e.preventDefault();
      // Ir para o último item
      if (appointments.length > 0) {
        setKeyboardSelectedIndex(appointments.length - 1);
        document
          .getElementById(`appointment-item-${appointments.length - 1}`)
          ?.focus();
      }
    }
  };

  return (
    <div
      className={`appointment-list-container ${className} flex flex-col h-full min-h-0`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2
          className={`font-semibold ${
            isDarkMode ? "text-slate-100" : "text-neutral-800"
          }`}
          aria-live="polite"
        >
          Agendamentos: {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
        </h2>
      </div>

      {/* Lista de agendamentos */}
      <div
        className="flex-1 overflow-y-auto pr-1 appointment-scroll-container max-h-[calc(100% - 6rem)]"
        role="list"
        aria-label="Lista de agendamentos"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: isDarkMode ? "#262626 #18181b" : "#f1f5f9 #e2e8f0",
        }}
      >
        {isLoading ? (
          <div
            className="flex justify-center items-center h-32"
            aria-live="polite"
          >
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
            <p
              className={`ml-2 ${
                isDarkMode ? "text-slate-300" : "text-neutral-500"
              }`}
            >
              Carregando agendamentos...
            </p>
          </div>
        ) : appointments.length === 0 ? (
          <div
            className={`text-center py-8 ${
              isDarkMode ? "text-slate-300" : "text-neutral-500"
            }`}
            aria-live="polite"
          >
            <p>Nenhum agendamento para esta data.</p>
            <p className="text-sm mt-1">
              Clique em "Novo Agendamento" para adicionar.
            </p>
          </div>
        ) : (
          <div className="space-y-3 p-1">
            {appointments.map((appointment, index) => {
              // Encontrar o cliente, profissional e serviço para exibição
              const customer = customers.find(
                (c) => c.id === appointment.customer_id
              );
              const professional = professionals.find(
                (p) => p.id === appointment.professional_id
              );
              const service = services.find(
                (s) => s.id === appointment.service_id
              );

              // Gerar descrição para leitores de tela
              const ariaDescription = `Agendamento para ${
                customer?.customer_name || "Cliente não encontrado"
              }, 
                ${service?.display_name || "Serviço não encontrado"}, 
                com ${
                  professional?.professional_name ||
                  "Profissional não encontrado"
                }, 
                às ${format(new Date(appointment.appointment_time), "HH:mm")}. 
                Status: ${appointment.status}`;

              return (
                <div
                  key={appointment.id}
                  id={`appointment-item-${index}`}
                  role="listitem"
                  tabIndex={0}
                  onClick={() => onSelectAppointment(appointment)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  aria-label={ariaDescription}
                  aria-selected={selectedAppointment?.id === appointment.id}
                  className={`p-3 rounded-md cursor-pointer ${
                    selectedAppointment?.id === appointment.id
                      ? isDarkMode
                        ? "bg-neutral-900"
                        : "bg-emerald-50 border-emerald-200"
                      : isDarkMode
                      ? "bg-neutral-900 hover:bg-neutral-700"
                      : "border border-slate-200 hover:bg-slate-200"
                  } ${
                    keyboardSelectedIndex === index
                      ? "ring-2 ring-offset-1 ring-blue-500"
                      : ""
                  }`}
                >
                  <div className="flex justify-between">
                    <span
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-emerald-400" : "text-emerald-600"
                      }`}
                    >
                      {format(new Date(appointment.appointment_time), "HH:mm")}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
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
                  <p
                    className={`mt-1 font-medium ${
                      isDarkMode ? "text-neutral-100" : "text-neutral-800"
                    }`}
                  >
                    {customer?.customer_name || "Cliente não encontrado"}
                  </p>
                  <div className="mt-1 flex items-center text-sm">
                    <span
                      className={
                        isDarkMode ? "text-neutral-300" : "text-neutral-600"
                      }
                    >
                      {service?.display_name || "Serviço não encontrado"}
                    </span>
                    <span className="mx-1">•</span>
                    <span
                      className={
                        isDarkMode ? "text-neutral-400" : "text-neutral-500"
                      }
                    >
                      {professional?.professional_name ||
                        "Profissional não encontrado"}
                    </span>
                  </div>

                  {/* Room info - pode ficar escondido, mas disponível para leitores de tela */}
                  <span className="sr-only">
                    Local:{" "}
                    {rooms.find((r) => r.id === appointment.room_id)
                      ?.display_name || "Sala não encontrada"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Adicionar estilos CSS para personalizar a scrollbar */}
      <style jsx>{`
        .appointment-scroll-container::-webkit-scrollbar {
          width: 8px;
        }

        .appointment-scroll-container::-webkit-scrollbar-track {
          background: ${isDarkMode ? "#1f2937" : "#f3f4f6"};
          border-radius: 4px;
        }

        .appointment-scroll-container::-webkit-scrollbar-thumb {
          background-color: ${isDarkMode ? "#4b5563" : "#d1d5db"};
          border-radius: 4px;
          border: 2px solid ${isDarkMode ? "#1f2937" : "#f3f4f6"};
        }

        .appointment-scroll-container::-webkit-scrollbar-thumb:hover {
          background-color: ${isDarkMode ? "#6b7280" : "#9ca3af"};
        }

        /* Garantir comportamento de rolagem adequado */
        .appointment-list-container {
          min-height: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        /* Garantir que o contêiner de rolagem seja flexível, mas com altura máxima */
        .appointment-scroll-container {
          overflow-y: auto;
          overflow-x: hidden;
          min-height: 100px;
        }
      `}</style>

      {/* Botão de Novo Agendamento */}
      <button
        onClick={onCreateNew}
        className={`mt-4 w-full py-2 px-4 rounded-md flex items-center justify-center ${
          isDarkMode
            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
            : "bg-emerald-500 hover:bg-emerald-600 text-white"
        }`}
        aria-label="Criar novo agendamento"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
        Novo Agendamento
      </button>
    </div>
  );
};

export default AppointmentList;
