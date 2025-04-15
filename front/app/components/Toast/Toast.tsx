"use client";

import { useEffect, useState } from "react";
import { useCallback } from "react";
import logger from "../../../lib/logger";
import "./toast.css";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose?: () => void;
    isVisible: boolean;
}

/**
 * Componente Toast para exibir notificações temporárias
 * 
 * @param message - Mensagem a ser exibida
 * @param type - Tipo de notificação (success, error, warning, info)
 * @param duration - Duração em milissegundos
 * @param onClose - Callback executado ao fechar a notificação
 * @param isVisible - Se a notificação está visível
 */
export default function Toast({
    message,
    type = "success",
    duration = 3000,
    onClose,
    isVisible
}: ToastProps) {
    const [visible, setVisible] = useState(isVisible);
    const [isLeaving, setIsLeaving] = useState(false);

    const handleClose = useCallback(() => {
        logger.debug(`[Toast] - handleClose - Fechando toast: ${message}`);
        setIsLeaving(true);
        
        // Aguardar a animação terminar antes de remover o componente
        setTimeout(() => {
            setVisible(false);
            if (onClose) onClose();
        }, 300); // Duração da animação
    }, [message, onClose, setIsLeaving, setVisible]);

    useEffect(() => {
        logger.debug(`[Toast] - useEffect - Toast ${type} exibido: ${message}`);
        
        if (isVisible) {
            setVisible(true);
            setIsLeaving(false);
        }

        if (isVisible && duration > 0) {
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
        }
    }, [isVisible, duration, message, type, handleClose]);

    if (!visible) return null;

    // Definir classes com base no tipo
    const typeClasses = {
        success: "bg-green-500 text-white",
        error: "bg-red-500 text-white",
        warning: "bg-yellow-500 text-white",
        info: "bg-blue-500 text-white"
    };

    return (
        <div className={`fixed top-4 right-4 z-50 ${isLeaving ? 'animate-fade-out-up' : 'animate-fade-in-down'}`}>
        <div
            className={`px-4 py-3 rounded-md shadow-lg flex items-center justify-between ${typeClasses[type]}`}
        >
            <span>{message}</span>
            <button
            onClick={handleClose}
            className="ml-4 hover:text-gray-200"
            >
            x
            </button>
        </div>
        </div>
    );
}
