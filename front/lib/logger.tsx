/**
 * Módulo de logger para a aplicação
 * Fornece funções para registrar mensagens em diferentes níveis
 */

// Determina se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Logger simples para a aplicação
 * Em produção, poderia ser integrado com serviços como Sentry, LogRocket, etc.
 */
const logger = {
    /**
     * Registra mensagem de debug (apenas em desenvolvimento)
     * @param message Mensagem principal
     * @param args Argumentos adicionais
     */
    debug: (message: string, ...args: any[]) => {
        if (isDevelopment) {
        console.debug(`[DEBUG] ${message}`, ...args);
        }
    },

    /**
     * Registra mensagem informativa
     * @param message Mensagem principal
     * @param args Argumentos adicionais
     */
    info: (message: string, ...args: any[]) => {
        console.info(`[INFO] ${message}`, ...args);
    },

    /**
     * Registra mensagem de aviso
     * @param message Mensagem principal
     * @param args Argumentos adicionais
     */
    warn: (message: string, ...args: any[]) => {
        console.warn(`[WARN] ${message}`, ...args);
    },

    /**
     * Registra mensagem de erro
     * @param message Mensagem principal
     * @param args Argumentos adicionais
     */
    error: (message: string, ...args: any[]) => {
        console.error(`[ERROR] ${message}`, ...args);
        
        // Em produção, aqui poderíamos enviar o erro para um serviço de monitoramento
        // como Sentry, LogRocket, etc.
    }
};

export default logger;
