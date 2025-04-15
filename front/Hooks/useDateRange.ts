import { useState, useEffect } from 'react';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export type DateRange = {
    startDate: Date;
    endDate: Date;
    label: string;
};

const STORAGE_KEY = '@syncro:dateRange';

// Valor padrão inicial
const defaultDateRange: DateRange = {
    startDate: startOfDay(subDays(new Date(), 30)),
    endDate: endOfDay(new Date()),
    label: 'Últimos 30 dias'
};

/**
 * 
 * Hook para gerenciar o intervalo de datas.
 * Ele tenta carregar o intervalo de datas do localStorage na inicialização.
 */

export function useDateRange() {
    const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Só tenta recuperar do localStorage após a montagem do componente
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
        try {
            const parsed = JSON.parse(saved);
            setDateRange({
            ...parsed,
            startDate: new Date(parsed.startDate),
            endDate: new Date(parsed.endDate)
            });
        } catch (error) {
            console.error('Erro ao carregar período salvo:', error);
        }
        }
        setIsInitialized(true);
    }, []);

    useEffect(() => {
        // Só salva no localStorage após a inicialização e quando o dateRange mudar
        if (isInitialized) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dateRange));
        }
    }, [dateRange, isInitialized]);

    const updateDateRange = (startDate: Date, endDate: Date, label: string) => {
        setDateRange({
        startDate: startOfDay(startDate),
        endDate: endOfDay(endDate),
        label
        });
    };

    return {
        dateRange,
        updateDateRange
    };
}
