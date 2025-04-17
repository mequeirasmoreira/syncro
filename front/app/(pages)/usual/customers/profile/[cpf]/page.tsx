"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTheme } from "../../../../../contexts/ThemeContext";
import RootLayout from "../../../../../components/RootLayout";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Customer } from "../../../../../../types";
import CustomerService from "../../../../../../services/CustomerService";
import { Breadcrumb } from "@/app/components/Breadcrumb/Breadcrumb";

export default function CustomerProfilePage() {
  const { cpf } = useParams();
  const { isDarkMode } = useTheme();
  const [customer, setCustomer] = useState<Customer | null>(null);
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
        `[CustomerProfilePage] - formatarData - Erro ao formatar data: ${dataString}`
      );
      return dataString;
    }
  };

  // Buscar dados do cliente pelo CPF
  const fetchCustomerData = async () => {
    if (!cpf) return;

    try {
      logger.debug(`[CustomerProfilePage] - fetchCustomerData - CPF: ${cpf}`);
      setLoading(true);
      const data = await CustomerService.getCustomerByCpf(cpf as string);
      setCustomer(data);
      setError(null);
      logger.debug(
        `[CustomerProfilePage] - fetchCustomerData - Cliente encontrado: ${data?.customer_name}`
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao buscar dados do cliente";
      logger.debug(
        `[CustomerProfilePage] - fetchCustomerData - Erro: ${errorMessage}`
      );
      setError(
        "Não foi possível carregar os dados do cliente. Tente novamente mais tarde."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [cpf]);

  return (
    <RootLayout>
      <div className="mb-6">
        <Breadcrumb
          parentLabel="Clientes"
          parentHref="/usual/customers"
          current="Perfil do Cliente"
          isDarkMode={isDarkMode}
        />
      </div>

      {loading ? (
        <div
          className={`p-8 text-center ${
            isDarkMode ? "text-slate-100" : "text-neutral-900"
          }`}
        >
          <div
            className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent rounded-full mb-2"
            aria-label="Carregando..."
          ></div>
          <p>Carregando dados do cliente...</p>
        </div>
      ) : error ? (
        <div
          className={`p-8 text-center ${
            isDarkMode ? "text-red-300" : "text-red-600"
          }`}
        >
          <p>{error}</p>
          <button
            onClick={fetchCustomerData}
            className={`mt-2 px-4 py-2 text-sm rounded ${
              isDarkMode
                ? "bg-neutral-700 hover:bg-neutral-600 text-slate-100"
                : "bg-slate-200 hover:bg-slate-100 text-neutral-900"
            }`}
          >
            Tentar novamente
          </button>
        </div>
      ) : customer ? (
        <div className="space-y-6">
          {/* Cabeçalho com foto/avatar */}
          <div
            className={`p-6 rounded-lg ${
              isDarkMode ? "bg-neutral-700" : "bg-white"
            } shadow-sm`}
          >
            <div className="flex items-center">
              <div className="w-24 h-24 rounded-full bg-gray-200 mr-6 flex items-center justify-center overflow-hidden">
                {customer.base_image_url ? (
                  <img
                    src={customer.base_image_url}
                    alt={`${customer.customer_name} ${customer.surname}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-gray-400"
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
                <h2
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-slate-100" : "text-neutral-900"
                  }`}
                >
                  {customer.customer_name} {customer.surname}
                </h2>
                {customer.nickname && (
                  <p
                    className={`text-lg mt-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Apelido: {customer.nickname}
                  </p>
                )}
                <p
                  className={`mt-2 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Cliente desde {formatarData(customer.created_at)}
                </p>
              </div>
            </div>

            <div className="flex mt-6 space-x-4">
              <Link
                href={`/usual/customers/edit/${customer.cpf}`}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isDarkMode
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                Editar Cliente
              </Link>
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isDarkMode
                    ? "bg-slate-600 hover:bg-slate-500 text-white"
                    : "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
                }`}
              >
                Excluir Cliente
              </button>
            </div>
          </div>

          {/* Seção de informações pessoais */}
          <div
            className={`p-6 rounded-lg ${
              isDarkMode ? "bg-neutral-700" : "bg-white"
            } shadow-sm`}
          >
            <h3
              className={`text-xl font-semibold mb-4 ${
                isDarkMode ? "text-slate-100" : "text-neutral-900"
              }`}
            >
              Informações Pessoais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  CPF
                </p>
                <p
                  className={`${
                    isDarkMode ? "text-slate-100" : "text-neutral-900"
                  }`}
                >
                  {customer.cpf}
                </p>
              </div>
              <div>
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Data de Nascimento
                </p>
                <p
                  className={`${
                    isDarkMode ? "text-slate-100" : "text-neutral-900"
                  }`}
                >
                  {formatarData(customer.birth_date)}
                </p>
              </div>
              <div>
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Apelido
                </p>
                <p
                  className={`${
                    isDarkMode ? "text-slate-100" : "text-neutral-900"
                  }`}
                >
                  {customer.nickname || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Seção de contato */}
          <div
            className={`p-6 rounded-lg ${
              isDarkMode ? "bg-neutral-700" : "bg-white"
            } shadow-sm`}
          >
            <h3
              className={`text-xl font-semibold mb-4 ${
                isDarkMode ? "text-slate-100" : "text-neutral-900"
              }`}
            >
              Informações de Contato
            </h3>
            <div className="space-y-4">
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
                    className={`text-sm font-medium ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    E-mail
                  </p>
                  <p
                    className={`${
                      isDarkMode ? "text-slate-100" : "text-neutral-900"
                    }`}
                  >
                    {customer.email || "—"}
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
                    className={`text-sm font-medium ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Telefone
                  </p>
                  <p
                    className={`${
                      isDarkMode ? "text-slate-100" : "text-neutral-900"
                    }`}
                  >
                    {customer.phone || "—"}
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
                    className={`text-sm font-medium ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Endereço
                  </p>
                  <p
                    className={`${
                      isDarkMode ? "text-slate-100" : "text-neutral-900"
                    }`}
                  >
                    {customer.address || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contato de emergência */}
          <div
            className={`p-6 rounded-lg ${
              isDarkMode ? "bg-neutral-700" : "bg-white"
            } shadow-sm`}
          >
            <h3
              className={`text-xl font-semibold mb-4 ${
                isDarkMode ? "text-slate-100" : "text-neutral-900"
              }`}
            >
              Contato de Emergência
            </h3>
            <div className="space-y-4">
              <div>
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Nome
                </p>
                <p
                  className={`${
                    isDarkMode ? "text-slate-100" : "text-neutral-900"
                  }`}
                >
                  {customer.emergency_name || "—"}
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
                    className={`text-sm font-medium ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Telefone
                  </p>
                  <p
                    className={`${
                      isDarkMode ? "text-slate-100" : "text-neutral-900"
                    }`}
                  >
                    {customer.emergency_phone || "—"}
                  </p>
                </div>
              </div>

              <div>
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Relação
                </p>
                <p
                  className={`${
                    isDarkMode ? "text-slate-100" : "text-neutral-900"
                  }`}
                >
                  {customer.emergency_relationship || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`p-8 text-center rounded-lg ${
            isDarkMode ? "bg-neutral-700" : "bg-white"
          } shadow-sm`}
        >
          <p
            className={`text-lg ${
              isDarkMode ? "text-slate-100" : "text-neutral-900"
            }`}
          >
            Cliente não encontrado
          </p>
          <Link
            href="/usual/customers"
            className={`inline-block mt-4 px-4 py-2 rounded-md text-sm font-medium ${
              isDarkMode
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            Voltar para a lista de clientes
          </Link>
        </div>
      )}
    </RootLayout>
  );
}
