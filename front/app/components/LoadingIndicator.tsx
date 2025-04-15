"use client";

interface LoadingIndicatorProps {
    message: string;
    retryCount?: number;
    maxRetries?: number;
}

export function LoadingIndicator({ message, retryCount, maxRetries }: LoadingIndicatorProps) {

    console.debug(`[LoadingIndicator] - renderização - message: ${message}`);
    
    return (
        <div className="flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 dark:border-emerald-400 mb-4"></div>
        <p className="text-gray-700 dark:text-gray-300 text-center mb-1">{message}</p>
        {retryCount !== undefined && maxRetries !== undefined && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
            Tentativa {retryCount} de {maxRetries}
            </p>
        )}
        </div>
    );
}

/**
    @example
    <LoadingIndicator message="Carregando..." />
        <LoadingIndicator 
            message="Tentando reconectar..." 
        retryCount={2}
        maxRetries={3}
    />
*/