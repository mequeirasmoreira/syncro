"use client";

import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useDateRange } from "@/Hooks/useDateRange";

interface DateRangeSelectorProps {
    isDarkMode: boolean;
    onDateChange?: (startDate: Date, endDate: Date) => void;
}

export function DateRangeSelector({
    isDarkMode,
    onDateChange,
}: DateRangeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { dateRange, updateDateRange } = useDateRange();
    const [selectedDates, setSelectedDates] = useState<
        [Date | null, Date | null]
    >([dateRange.startDate, dateRange.endDate]);

    const handleApply = () => {
        const [start, end] = selectedDates;
        if (start && end) {
        updateDateRange(start, end, "Período Personalizado");
        onDateChange?.(start, end);
        setIsOpen(false);
        }
    };

    return (
        <div className="relative">
        <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
            isDarkMode
                ? "border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            } transition-colors duration-200`}
        >
            <CalendarIcon className="w-4 h-4" />
            <div className="flex flex-col">
            <span className="text-xs font-medium leading-tight text-left">
                {dateRange.label}
            </span>
            <span className="text-[11px] text-gray-500 leading-tight">
                {format(dateRange.startDate, "dd MMM yyyy", { locale: ptBR })} -{" "}
                {format(dateRange.endDate, "dd MMM yyyy", { locale: ptBR })}
            </span>
            </div>
            <ChevronDownIcon className="w-4 h-4 ml-1" />
        </button>

        {isOpen && (
            <div
            className={`absolute right-0 mt-1 p-4 rounded-lg shadow-lg border z-50 ${
                isDarkMode
                ? "bg-neutral-800 border-neutral-700"
                : "bg-white border-gray-200"
            }`}
            >
            <div className="flex flex-col gap-4">
                <DatePicker
                selected={selectedDates[0]}
                onChange={(dates) => setSelectedDates(dates as [Date, Date])}
                startDate={selectedDates[0]}
                endDate={selectedDates[1]}
                selectsRange
                inline
                locale={ptBR}
                calendarClassName={`!border-0 ${
                    isDarkMode ? "dark-calendar" : ""
                }`}
                />
                <div className="flex justify-end gap-2">
                <button
                    onClick={() => setIsOpen(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    isDarkMode
                        ? "text-white hover:bg-neutral-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                    Cancel
                </button>
                <button
                    onClick={handleApply}
                    className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800"
                >
                    Apply
                </button>
                </div>
            </div>
            </div>
        )}
        </div>
    );
}
