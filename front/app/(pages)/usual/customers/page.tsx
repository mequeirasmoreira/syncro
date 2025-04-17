"use client";

import { useTheme } from "../../../contexts/ThemeContext";
import RootLayout from "../../../components/RootLayout";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Customer } from "../../../../types";
import CustomerService from "../../../../services/CustomerService";

export default function CustomersPage() {
  const { isDarkMode } = useTheme();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Logger para registro de ações
  const logger = {
    debug: (message: string) => console.debug(message),
  };

  // Função para formatar data no padrão brasileiro
  const formatarData = (dataString: string | null | undefined) => {
    if (!dataString) return "—";

    try {
      const data = new Date(dataString);

      // Nomes dos meses em português
      const meses = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
      ];

      const dia = data.getDate();
      const mes = meses[data.getMonth()];
      const ano = data.getFullYear();

      return `${dia} de ${mes} de ${ano}`;
    } catch (error) {
      logger.debug(
        `[CustomersPage] - formatarData - Erro ao formatar data: ${dataString}`
      );
      return dataString;
    }
  };

  // Função para buscar clientes do Supabase
  const fetchCustomers = async () => {
    try {
      logger.debug(`[CustomersPage] - fetchCustomers - Buscando clientes`);
      setLoading(true);
      const data = await CustomerService.listCustomers();
      setCustomers(data);
      setError(null);
      logger.debug(
        `[CustomersPage] - fetchCustomers - ${data.length} clientes encontrados`
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao buscar clientes";
      logger.debug(`[CustomersPage] - fetchCustomers - Erro: ${errorMessage}`);
      setError(
        "Não foi possível carregar os clientes. Tente novamente mais tarde."
      );
    } finally {
      setLoading(false);
    }
  };

  // Buscar clientes ao montar o componente
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filtrar clientes com base no termo de pesquisa
  const filteredCustomers = customers.filter((customer) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      customer.customer_name.toLowerCase().includes(searchLower) ||
      customer.surname.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      customer.phone.toLowerCase().includes(searchLower) ||
      customer.cpf.toLowerCase().includes(searchLower)
    );
  });

  // Função para selecionar um cliente
  const handleSelectCustomer = (customer: Customer) => {
    logger.debug(
      `[CustomersPage] - handleSelectCustomer - Customer CPF ${customer.cpf}`
    );
    setSelectedCustomer(customer);
  };

  // Função para pesquisar clientes
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    logger.debug(
      `[CustomersPage] - handleSearch - Search term: ${event.target.value}`
    );
    setSearchTerm(event.target.value);
  };

  return (
    <RootLayout>
      <div className="flex justify-between items-center mb-6">
        <h1
          className={`text-2xl font-semibold ${
            isDarkMode ? "text-slate-100" : "text-neutral-900"
          }`}
        >
          Clientes
        </h1>
        <Link
          href="/usual/customers/new"
          className={`inline-flex items-center px-4 py-2 font-medium rounded-md transition-colors duration-200 ${
            isDarkMode
              ? "bg-slate-200 text-neutral-900 hover:bg-slate-400"
              : "bg-emerald-600 text-slate-100 hover:bg-emerald-700"
          }`}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Adicionar Cliente
        </Link>
      </div>

      {/* Área de filtros e pesquisa */}
      <div
        className={`p-4 mb-4 rounded-md ${isDarkMode ? "bg-neutral-800" : ""}`}
      >
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Pesquisar clientes..."
            className={`pl-10 w-full p-2 rounded-md border ${
              isDarkMode
                ? "border-neutral-600 text-slate-100"
                : "bg-white border-slate-100 text-gray-900"
            }`}
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        {/* Outros filtros podem ser adicionados aqui posteriormente */}
      </div>

      {/* Grid de clientes e painel de detalhes */}
      <div className="flex gap-4">
        {/* Grid de clientes */}
        <div
          className={`flex-1 p-4 rounded-md ${
            isDarkMode ? "bg-neutral-800" : ""
          }`}
        >
          <h2
            className={`text-lg font-medium mb-3 ${
              isDarkMode ? "text-slate-100" : "text-neutral-900"
            }`}
          >
            Grid de clientes
          </h2>

          {/* Tabela de clientes */}
          <div
            className={`overflow-hidden rounded-lg border ${
              isDarkMode ? "border-neutral-700" : "border-slate-200"
            }`}
          >
            {loading ? (
              <div
                className={`p-8 text-center ${
                  isDarkMode ? "text-slate-100" : "text-gray-600"
                }`}
              >
                <div
                  className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent rounded-full mb-2"
                  aria-label="Carregando..."
                ></div>
                <p>Carregando clientes...</p>
              </div>
            ) : error ? (
              <div
                className={`p-8 text-center ${
                  isDarkMode ? "text-red-300" : "text-red-600"
                }`}
              >
                <p>{error}</p>
                <button
                  onClick={fetchCustomers}
                  className={`mt-2 px-4 py-2 text-sm rounded ${
                    isDarkMode
                      ? "bg-neutral-800 hover:bg-neutral-600 text-slate-100"
                      : "bg-slate-200 hover:bg-slate-100 text-neutral-900"
                  }`}
                >
                  Tentar novamente
                </button>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div
                className={`p-8 text-center ${
                  isDarkMode ? "text-slate-100" : "text-neutral-900"
                }`}
              >
                {searchTerm ? (
                  <p>
                    Nenhum cliente encontrado para a pesquisa &quot;{searchTerm}
                    &quot;
                  </p>
                ) : (
                  <p>Nenhum cliente cadastrado</p>
                )}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className={isDarkMode ? "bg-neutral-700" : "bg-gray-50"}>
                  <tr>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium ${
                        isDarkMode ? "text-slate-100" : "text-neutral-500"
                      } uppercase tracking-wider`}
                    >
                      Nome
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium ${
                        isDarkMode ? "text-slate-100" : "text-neutral-500"
                      } uppercase tracking-wider`}
                    >
                      E-mail
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium ${
                        isDarkMode ? "text-slate-100" : "text-neutral-500"
                      } uppercase tracking-wider`}
                    >
                      Telefone
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium ${
                        isDarkMode ? "text-slate-100" : "text-neutral-500"
                      } uppercase tracking-wider`}
                    >
                      CPF
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isDarkMode
                      ? "divide-neutral-700 bg-neutral-800"
                      : "divide-slate-200 bg-white"
                  }`}
                >
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.cpf}
                      className={`cursor-pointer hover:${
                        isDarkMode ? "bg-neutral-700" : "bg-slate-100"
                      }`}
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-slate-100" : "text-slate-900"
                        }`}
                      >
                        {customer.customer_name} {customer.surname}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-slate-100" : "text-slate-500"
                        }`}
                      >
                        {customer.email}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-slate-100" : "text-slate-500"
                        }`}
                      >
                        {customer.phone}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDarkMode ? "text-slate-100" : "text-slate-500"
                        }`}
                      >
                        {customer.cpf}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Informações do cliente selecionado */}
        <div
          className={`w-1/3 p-4 rounded-md ${
            isDarkMode ? "bg-neutral-800" : ""
          }`}
        >
          <h2
            className={`text-lg font-medium mb-3 ${
              isDarkMode ? "text-slate-100" : "text-neutral-900"
            }`}
          >
            Informações do cliente
          </h2>

          {selectedCustomer ? (
            <div
              className={`overflow-hidden rounded-md ${
                isDarkMode ? "bg-neutral-700" : "bg-white"
              } shadow-sm`}
            >
              {/* Cabeçalho com foto/avatar */}
              <div
                className={`p-4 ${
                  isDarkMode ? "bg-neutral-600" : "bg-slate-100"
                } border-b ${
                  isDarkMode ? "border-neutral-500" : "border-slate-100"
                } flex items-center justify-between`}
              >
                <div className="flex items-center">
                  <div className="w-14 h-14 rounded-full bg-gray-200 mr-4 flex items-center justify-center overflow-hidden">
                    {selectedCustomer.base_image_url ? (
                      <img
                        src={selectedCustomer.base_image_url}
                        alt={`${selectedCustomer.customer_name} ${selectedCustomer.surname}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3
                      className={`text-xl font-semibold ${
                        isDarkMode ? "text-slate-100" : "text-neutral-900"
                      }`}
                    >
                      {selectedCustomer.customer_name} {selectedCustomer.surname}
                    </h3>
                    {selectedCustomer.nickname && (
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-slate-100" : "text-gray-500"
                        }`}
                      >
                        Apelido: {selectedCustomer.nickname}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Botão Exibir */}
                <Link
                  href={`/usual/customers/profile/${selectedCustomer.cpf}`}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    isDarkMode
                      ? "bg-emerald-600 hover:bg-emerald-700 text-slate-100"
                      : "bg-emerald-600 hover:bg-emerald-700 text-slate-100"
                  }`}
                >
                  Exibir Perfil
                </Link>
              </div>

              {/* Corpo com as informações */}
              <div className="p-5 divide-y divide-gray-100">
                {/* Informações Principais */}
                <div className="grid grid-cols-2 gap-4 pb-4">
                  <div>
                    <p
                      className={`text-xs uppercase font-medium mb-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      CPF
                    </p>
                    <p
                      className={`${
                        isDarkMode ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      {selectedCustomer.cpf || "—"}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-xs uppercase font-medium mb-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Data de nascimento
                    </p>
                    <p
                      className={`${
                        isDarkMode ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      {selectedCustomer.birth_date || "—"}
                    </p>
                  </div>
                </div>

                {/* Contato */}
                <div className="py-4">
                  <h4
                    className={`text-sm font-medium mb-3 ${
                      isDarkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    Informações de contato
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div
                        className={`mr-3 ${
                          isDarkMode ? "text-emerald-300" : "text-emerald-600"
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p
                          className={`text-xs uppercase font-medium ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          E-mail
                        </p>
                        <p
                          className={`${
                            isDarkMode ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          {selectedCustomer.email || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div
                        className={`mr-3 ${
                          isDarkMode ? "text-emerald-300" : "text-emerald-600"
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p
                          className={`text-xs uppercase font-medium ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Telefone
                        </p>
                        <p
                          className={`${
                            isDarkMode ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          {selectedCustomer.phone || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div
                        className={`mr-3 ${
                          isDarkMode ? "text-emerald-300" : "text-emerald-600"
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p
                          className={`text-xs uppercase font-medium ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Endereço
                        </p>
                        <p
                          className={`${
                            isDarkMode ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          {selectedCustomer.address || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contato de emergência */}
                <div className="py-4">
                  <h4
                    className={`text-sm font-medium mb-3 ${
                      isDarkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    Contato de emergência
                  </h4>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <p
                        className={`text-xs uppercase font-medium ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Nome
                      </p>
                      <p
                        className={`${
                          isDarkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                      >
                        {selectedCustomer.emergency_name || "—"}
                      </p>
                    </div>

                    <div className="flex items-start">
                      <div
                        className={`mr-3 ${
                          isDarkMode ? "text-emerald-300" : "text-emerald-600"
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p
                          className={`text-xs uppercase font-medium ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Telefone de emergência
                        </p>
                        <p
                          className={`${
                            isDarkMode ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          {selectedCustomer.emergency_phone || "—"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p
                        className={`text-xs uppercase font-medium ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Relação
                      </p>
                      <p
                        className={`${
                          isDarkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                      >
                        {selectedCustomer.emergency_relationship || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Informações de registro */}
                <div className="pt-4">
                  <div className="flex justify-between text-xs text-gray-500">
                    <p>
                      Cadastrado em: {formatarData(selectedCustomer.created_at)}
                    </p>
                    {selectedCustomer.updated_at && (
                      <p>
                        Atualizado em:{" "}
                        {formatarData(selectedCustomer.updated_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div
                className={`px-5 py-3 ${
                  isDarkMode ? "bg-neutral-600" : "bg-slate-100"
                } border-t ${
                  isDarkMode ? "border-slate-500" : "border-gray-100"
                }`}
              >
                <div className="flex space-x-2">
                  <Link
                    href={`/usual/customers/edit/${selectedCustomer.cpf}`}
                    className={`px-4 py-2 rounded text-sm font-medium text-slate-100 transition-colors ${
                      isDarkMode
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    Editar
                  </Link>
                  <button
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                      isDarkMode
                        ? "bg-slate-500 hover:bg-slate-400 text-slate-100"
                        : "bg-white border border-slate-100 hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`p-8 text-center rounded-md ${
                isDarkMode ? "bg-slate-700" : "bg-white"
              } shadow-sm`}
            >
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <p
                  className={`${
                    isDarkMode ? "text-slate-100" : "text-gray-600"
                  } mb-1`}
                >
                  Nenhum cliente selecionado
                </p>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Selecione um cliente para visualizar as informações
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </RootLayout>
  );
}
