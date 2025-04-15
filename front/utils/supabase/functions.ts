import { supabase } from './client';
import logger from '../../lib/logger';

/**
 * Função para criar a tabela 'customers' no Supabase
 * Esta função é chamada via RPC do Supabase
 */
export async function createCustomersTable() {
  try {
    logger.debug("[createCustomersTable] - Criando tabela 'customers'");
    
    // SQL para criar a tabela customers
    const { error } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS customers (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          nome VARCHAR(100) NOT NULL,
          sobrenome VARCHAR(100) NOT NULL,
          apelido VARCHAR(50),
          email VARCHAR(100),
          data_nascimento DATE,
          cpf VARCHAR(11) UNIQUE NOT NULL,
          telefone VARCHAR(20) NOT NULL,
          contato_emergencia VARCHAR(100),
          telefone_emergencia VARCHAR(20),
          parentesco VARCHAR(50),
          endereco VARCHAR(200) NOT NULL,
          numero_casa VARCHAR(20) NOT NULL,
          complemento VARCHAR(100),
          bairro VARCHAR(100) NOT NULL,
          cep VARCHAR(8) NOT NULL,
          informacoes_adicionais TEXT,
          foto_url VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Trigger para atualizar o updated_at automaticamente
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
        
        CREATE TRIGGER update_customers_updated_at
        BEFORE UPDATE ON customers
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `
    });
    
    if (error) {
      logger.error("[createCustomersTable] - Erro ao criar tabela:", error);
      throw error;
    }
    
    logger.debug("[createCustomersTable] - Tabela 'customers' criada com sucesso");
    return true;
  } catch (err) {
    logger.error("[createCustomersTable] - Erro:", err);
    throw err;
  }
}

/**
 * Função para verificar se a tabela 'customers' existe
 * e criá-la se não existir
 */
export async function setupCustomersTable() {
  try {
    logger.debug("[setupCustomersTable] - Verificando tabela 'customers'");
    
    // Verificar se a tabela existe
    const { error } = await supabase
      .from('customers')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') { // Código para "relation does not exist"
      logger.debug("[setupCustomersTable] - Tabela 'customers' não encontrada. Criando...");
      await createCustomersTable();
    } else if (error) {
      logger.error("[setupCustomersTable] - Erro ao verificar tabela:", error);
      throw error;
    } else {
      logger.debug("[setupCustomersTable] - Tabela 'customers' já existe");
    }
    
    return true;
  } catch (err) {
    logger.error("[setupCustomersTable] - Erro:", err);
    return false;
  }
}

export default {
  createCustomersTable,
  setupCustomersTable
};
