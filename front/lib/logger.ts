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
     * @param {string} message - Mensagem principal
     * @param {unknown[]} args - Argumentos adicionais
     */
    debug: (message: string, ...args: unknown[]) => {
        if (isDevelopment) {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    },

    /**
     * Registra mensagem informativa
     * @param {string} message - Mensagem principal
     * @param {unknown[]} args - Argumentos adicionais
     */
    info: (message: string, ...args: unknown[]) => {
        // eslint-disable-next-line no-console
        console.info(`[INFO] ${message}`, ...args);
    },

    /**
     * Registra mensagem de aviso
     * @param {string} message - Mensagem principal
     * @param {unknown[]} args - Argumentos adicionais
     */
    warn: (message: string, ...args: unknown[]) => {
        // eslint-disable-next-line no-console
        console.warn(`[WARN] ${message}`, ...args);
    },

    /**
     * Registra mensagem de erro
     * @param {string} message - Mensagem principal
     * @param {unknown[]} args - Argumentos adicionais
     */
    error: (message: string, ...args: unknown[]) => {
        // eslint-disable-next-line no-console
        console.error(`[ERROR] ${message}`, ...args);
        
        // Em produção, aqui poderíamos enviar o erro para um serviço de monitoramento
        // como Sentry, LogRocket, etc.
    }
};

export default logger;
