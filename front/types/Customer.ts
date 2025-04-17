/**
 * Interface que define a estrutura de um cliente no sistema
 * @interface Customer
 */
export interface Customer {
  /**
   * Identificador único do cliente
   */
  id: string;

  /**
   * Nome completo do cliente
   */
  name: string;

  /**
   * Endereço de e-mail do cliente
   */
  email: string;

  /**
   * Número de telefone do cliente
   */
  phone: string;

  /**
   * Cidade onde o cliente está localizado
   */
  city: string;

  /**
   * Estado onde o cliente está localizado
   * @optional
   */
  state?: string;

  /**
   * Endereço completo do cliente
   * @optional
   */
  address?: string;

  /**
   * CEP do cliente
   * @optional
   */
  zipCode?: string;

  /**
   * Data de cadastro do cliente
   * @optional
   */
  createdAt?: Date;

  /**
   * Data da última atualização dos dados do cliente
   * @optional
   */
  updatedAt?: Date;
}
