"use client";

/**
 * Componente de Calendário
 * Implementa um calendário interativo com suporte a navegação por teclado
 * e compatibilidade com tema claro/escuro
 */

import { useState, useEffect, KeyboardEvent } from "react";
import { useTheme } from "@/app/contexts/ThemeContext";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import logger from "@/lib/logger";

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  className?: string;
}

const Calendar = ({
  selectedDate,
  onDateSelect,
  className = "",
}: CalendarProps) => {
  const { isDarkMode } = useTheme();
  const [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(selectedDate)
  );
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [focusedDay, setFocusedDay] = useState<number>(-1);

  // Gerar dias do mês atual
  useEffect(() => {
    logger.debug(
      `[Calendar] - useEffect - Gerando calendário para: ${format(
        currentMonth,
        "MMMM yyyy",
        { locale: ptBR }
      )}`
    );
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    setCalendarDays(days);

    // Focalizar no dia selecionado se estiver no mês atual
    const selectedIndex = days.findIndex((day) => isSameDay(day, selectedDate));
    if (selectedIndex >= 0) {
      setFocusedDay(selectedIndex);
    } else {
      setFocusedDay(-1);
    }
  }, [currentMonth, selectedDate]);

  // Ir para o mês anterior
  const goToPreviousMonth = () => {
    logger.debug(`[Calendar] - goToPreviousMonth`);
    setCurrentMonth((prevMonth) => subMonths(prevMonth, 1));
  };

  // Ir para o mês seguinte
  const goToNextMonth = () => {
    logger.debug(`[Calendar] - goToNextMonth`);
    setCurrentMonth((prevMonth) => addMonths(prevMonth, 1));
  };

  // Ir para o mês atual
  const goToCurrentMonth = () => {
    logger.debug(`[Calendar] - goToCurrentMonth`);
    setCurrentMonth(startOfMonth(new Date()));
  };

  // Manipulador de navegação por teclado
  const handleKeyDown = (
    e: KeyboardEvent<HTMLDivElement>,
    dayIndex: number
  ) => {
    logger.debug(
      `[Calendar] - handleKeyDown - Tecla: ${e.key}, Index: ${dayIndex}`
    );

    if (e.key === "Enter" || e.key === " ") {
      // Selecionar dia atual
      e.preventDefault();
      onDateSelect(calendarDays[dayIndex]);
    } else if (e.key === "ArrowLeft") {
      // Navegar para o dia anterior
      e.preventDefault();
      const prevDay = dayIndex - 1;
      if (prevDay >= 0) {
        setFocusedDay(prevDay);
        document.getElementById(`calendar-day-${prevDay}`)?.focus();
      } else {
        // Ir para o mês anterior
        goToPreviousMonth();
      }
    } else if (e.key === "ArrowRight") {
      // Navegar para o próximo dia
      e.preventDefault();
      const nextDay = dayIndex + 1;
      if (nextDay < calendarDays.length) {
        setFocusedDay(nextDay);
        document.getElementById(`calendar-day-${nextDay}`)?.focus();
      } else {
        // Ir para o próximo mês
        goToNextMonth();
      }
    } else if (e.key === "ArrowUp") {
      // Navegar para a semana anterior (7 dias atrás)
      e.preventDefault();
      const prevWeek = dayIndex - 7;
      if (prevWeek >= 0) {
        setFocusedDay(prevWeek);
        document.getElementById(`calendar-day-${prevWeek}`)?.focus();
      }
    } else if (e.key === "ArrowDown") {
      // Navegar para a próxima semana (7 dias depois)
      e.preventDefault();
      const nextWeek = dayIndex + 7;
      if (nextWeek < calendarDays.length) {
        setFocusedDay(nextWeek);
        document.getElementById(`calendar-day-${nextWeek}`)?.focus();
      }
    } else if (e.key === "Home") {
      // Ir para o primeiro dia do mês
      e.preventDefault();
      setFocusedDay(0);
      document.getElementById(`calendar-day-0`)?.focus();
    } else if (e.key === "End") {
      // Ir para o último dia do mês
      e.preventDefault();
      const lastDay = calendarDays.length - 1;
      setFocusedDay(lastDay);
      document.getElementById(`calendar-day-${lastDay}`)?.focus();
    }
  };

  // Anunciar para leitores de tela
  const getAriaLabel = (day: Date) => {
    return `${format(day, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
  };

  return (
    <div className={`calendar-container ${className}`}>
      <div className="mb-4 flex justify-between items-center">
        <h2
          className={`font-semibold ${
            isDarkMode ? "text-slate-100" : "text-neutral-800"
          }`}
          aria-live="polite"
        >
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={goToPreviousMonth}
            aria-label="Mês anterior"
            className={`p-1 rounded ${
              isDarkMode
                ? "text-white hover:bg-neutral-700"
                : "text-neutral-800 hover:bg-gray-100"
            }`}
          >
            ◀
          </button>
          <button
            onClick={goToCurrentMonth}
            aria-label="Mês atual"
            className={`p-1 rounded ${
              isDarkMode
                ? "text-white hover:bg-neutral-700"
                : "text-neutral-800 hover:bg-gray-100"
            }`}
          >
            Hoje
          </button>
          <button
            onClick={goToNextMonth}
            aria-label="Próximo mês"
            className={`p-1 rounded ${
              isDarkMode
                ? "text-white hover:bg-neutral-700"
                : "text-neutral-800 hover:bg-gray-100"
            }`}
          >
            ▶
          </button>
        </div>
      </div>

      {/* Grade de dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => (
          <div
            key={index}
            className={`text-center text-xs font-medium py-1 ${
              isDarkMode ? "text-slate-300" : "text-neutral-500"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grade do calendário */}
      <div
        className="grid grid-cols-7 gap-1"
        role="grid"
        aria-label="Calendário"
      >
        {/* Dias vazios antes do início do mês */}
        {Array.from({ length: calendarDays[0]?.getDay() || 0 }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="h-8"
            role="gridcell"
            aria-hidden="true"
          ></div>
        ))}

        {/* Dias do mês */}
        {calendarDays.map((day, i) => (
          <div
            key={i}
            role="gridcell"
            tabIndex={focusedDay === i ? 0 : -1}
            id={`calendar-day-${i}`}
            onClick={() => onDateSelect(day)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            aria-label={getAriaLabel(day)}
            aria-selected={isSameDay(day, selectedDate)}
            className={`h-8 w-8 rounded-full flex items-center justify-center text-sm cursor-pointer ${
              isSameDay(day, selectedDate)
                ? isDarkMode
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-500 text-white"
                : isSameDay(day, new Date())
                ? isDarkMode
                  ? "bg-neutral-700 text-white"
                  : "bg-gray-100 text-neutral-800"
                : isDarkMode
                ? "text-neutral-200 hover:bg-neutral-700"
                : "text-neutral-800 hover:bg-gray-100"
            } ${focusedDay === i ? "ring-2 ring-offset-1 ring-blue-500" : ""}`}
          >
            {day.getDate()}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
