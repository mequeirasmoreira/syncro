"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "../../../../../contexts/ThemeContext";
import RootLayout from "../../../../../components/RootLayout";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Customer } from "../../../../../../types";
import CustomerService from "../../../../../../services/CustomerService";
import { Breadcrumb } from "@/app/components/Breadcrumb/Breadcrumb";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import logger from "@/lib/logger";
import { getSupabaseClient } from "../../../../../../utils/supabase/client";
import Image from "next/image";
import { appointmentService, Appointment, Professional, Service, Room } from "@/services/AppointmentService";

// Tipo para as abas disponíveis
type TabType = "info" | "financial" | "appointments" | "services";

// Interface para o tipo de pagamento
interface Payment {
  id: string;
  customer_id: string;
  payment_time: string;
  payment_value: number;
  payment_type: string;
  professional_id?: string;
  notes?: string;
  service_id?: string;
  created_at: string;
  updated_at?: string;
}

export default function CustomerProfilePage() {
  const { cpf } = useParams();
  const { isDarkMode } = useTheme();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Estado para controlar qual aba está ativa
  const [activeTab, setActiveTab] = useState<TabType>("info");
  // Estado para armazenar a URL da imagem
  const [customerImageUrl, setCustomerImageUrl] = useState<string | null>(null);
  // Estados para pagamentos
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newPayment, setNewPayment] = useState<{
    payment_type: string;
    payment_value: string;
    payment_time: string;
    notes: string;
  }>({
    payment_type: '',
    payment_value: '',
    payment_time: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  // Estados para agendamentos
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Estado para armazenar os dados relacionados dos agendamentos
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Função para formatar data no padrão brasileiro
  const formatarData = (dataString: string | null | undefined): string => {
    if (!dataString) return "Data não disponível";
    
    logger.debug(
      `[CustomerProfilePage] - formatarData - Formatando data: ${dataString}`
    );

    try {
      const data = parseISO(dataString);
      return format(data, "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (error) {
      logger.error(
        `[CustomerProfilePage] - formatarData - Erro ao formatar data: ${error}`
      );
      return "Data inválida";
    }
  };

  // Função para obter a URL completa da imagem usando o cliente Supabase
  const getCustomerImageURL = async (imagePath: string) => {
    try {
      logger.debug(`[CustomerProfilePage] - getCustomerImageURL - Obtendo URL da imagem: ${imagePath}`);
      
      // Criar cliente Supabase
      const supabase = getSupabaseClient();
      
      // Obter URL pública da imagem
      const { data } = supabase
        .storage
        .from('customers')
        .getPublicUrl(imagePath);
      
      logger.debug(`[CustomerProfilePage] - getCustomerImageURL - URL obtida com sucesso: ${data.publicUrl}`);
      setCustomerImageUrl(data.publicUrl);
    } catch (error) {
      logger.error(`[CustomerProfilePage] - getCustomerImageURL - Erro: ${error instanceof Error ? error.message : String(error)}`);
      setCustomerImageUrl(null);
    }
  };

  // Buscar dados do cliente pelo CPF
  const fetchCustomerData = async () => {
    if (!cpf) return;
    try {
      logger.debug(`[CustomerProfilePage] - fetchCustomerData - CPF: ${cpf}`);
      setLoading(true);
      
      // Obtém os dados do cliente
      const data = await CustomerService.getCustomerByCpf(cpf as string);
      setCustomer(data);
      
      // Se o cliente possui um caminho de imagem, buscar a URL completa
      if (data.base_image_url) {
        getCustomerImageURL(data.base_image_url);
      }
      
      setError(null);
      logger.debug(
        `[CustomerProfilePage] - fetchCustomerData - Cliente encontrado: ${data?.customer_name}`
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao buscar cliente";
      logger.error(
        `[CustomerProfilePage] - fetchCustomerData - Erro: ${errorMessage}`
      );
      setError("Não foi possível carregar os dados do cliente.");
    } finally {
      setLoading(false);
    }
  };

  // Buscar registros financeiros do cliente
  const fetchPayments = async () => {
    if (!customer) return;
    
    try {
      logger.debug(`[CustomerProfilePage] - fetchPayments - Buscando pagamentos para cliente CPF: ${customer.cpf}`);
      setLoadingPayments(true);
      
      // Buscar dados do Supabase
      const supabase = getSupabaseClient();
      
      // Primeiro, precisamos obter o ID do cliente a partir do CPF
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('cpf', customer.cpf)
        .single();
      
      if (customerError) {
        throw customerError;
      }
      
      if (!customerData || !customerData.id) {
        throw new Error('ID do cliente não encontrado');
      }
      
      const customerId = customerData.id;
      
      // Agora podemos buscar os pagamentos usando o customer_id
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('customer_id', customerId)
        .order('payment_time', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      logger.debug(`[CustomerProfilePage] - fetchPayments - ${data ? data.length : 0} pagamentos encontrados`);
      setPayments(data || []);
    } catch (err) {
      logger.error(`[CustomerProfilePage] - fetchPayments - Erro: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingPayments(false);
    }
  };
  
  // Buscar dados relacionados (profissionais e serviços)
  const fetchRelatedData = async () => {
    try {
      logger.debug(`[CustomerProfilePage] - fetchRelatedData - Buscando dados relacionados`);
      
      const [professionalsData, servicesData] = await Promise.all([
        appointmentService.getProfessionals(),
        appointmentService.getServices()
      ]);
      
      setProfessionals(professionalsData);
      setServices(servicesData);
      
      logger.debug(`[CustomerProfilePage] - fetchRelatedData - Dados relacionados carregados com sucesso`);
    } catch (err) {
      logger.error(`[CustomerProfilePage] - fetchRelatedData - Erro: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Buscar agendamentos do cliente
  const fetchAppointments = async () => {
    if (!customer) return;
    
    try {
      logger.debug(`[CustomerProfilePage] - fetchAppointments - Buscando agendamentos para cliente CPF: ${customer.cpf}`);
      setLoadingAppointments(true);
      
      // Buscar dados relacionados primeiro
      await fetchRelatedData();
      
      // Buscar dados do Supabase
      const appointmentsData = await appointmentService.getAppointmentsByCustomerCpf(customer.cpf);
      
      logger.debug(`[CustomerProfilePage] - fetchAppointments - ${appointmentsData ? appointmentsData.length : 0} agendamentos encontrados`);
      setAppointments(appointmentsData || []);
    } catch (err) {
      logger.error(`[CustomerProfilePage] - fetchAppointments - Erro: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingAppointments(false);
    }
  };
  
  // Adicionar novo pagamento
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    
    try {
      logger.debug(`[CustomerProfilePage] - handleAddPayment - Adicionando pagamento para cliente: ${customer.customer_name}`);
      
      // Validar o formulário
      if (!newPayment.payment_type || !newPayment.payment_value || !newPayment.payment_time) {
        alert('Por favor, preencha todos os campos obrigatórios');
        return;
      }
      
      // Converter o valor para número
      const paymentValue = parseFloat(newPayment.payment_value.replace(',', '.'));
      if (isNaN(paymentValue)) {
        alert('Valor inválido');
        return;
      }
      
      // Primeiro, precisamos obter o ID do cliente a partir do CPF
      const supabase = getSupabaseClient();
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('cpf', customer.cpf)
        .single();
      
      if (customerError) {
        throw customerError;
      }
      
      if (!customerData || !customerData.id) {
        throw new Error('ID do cliente não encontrado');
      }
      
      const customerId = customerData.id;
      
      // Inserir no Supabase
      logger.debug(`[CustomerProfilePage] - handleAddPayment - Dados enviados: ${JSON.stringify({
        customer_id: customerId,
        payment_type: newPayment.payment_type,
        payment_value: paymentValue,
        payment_time: newPayment.payment_time,
        notes: newPayment.notes
      })}`);
      
      const { data, error } = await supabase
        .from('payments')
        .insert([
          {
            customer_id: customerId,
            payment_type: newPayment.payment_type,
            payment_value: paymentValue,
            payment_time: newPayment.payment_time,
            notes: newPayment.notes
          }
        ])
        .select();
      
      if (error) {
        logger.error(`[CustomerProfilePage] - handleAddPayment - Erro do Supabase: ${JSON.stringify(error)}`);
        throw new Error(`Erro ao inserir pagamento: ${error.message || 'Erro desconhecido'}`);
      }
      
      logger.debug(`[CustomerProfilePage] - handleAddPayment - Pagamento adicionado com sucesso`);
      
      // Atualizar a lista de pagamentos
      await fetchPayments();
      
      // Resetar o formulário e fechar o modal
      setNewPayment({
        payment_type: '',
        payment_value: '',
        payment_time: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
      });
      setShowPaymentModal(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      logger.error(`[CustomerProfilePage] - handleAddPayment - Erro detalhado: ${errorMessage}`);
      alert(`Erro ao adicionar pagamento: ${errorMessage}`);
    }
  };
  
  // Função para formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Calcular total de pagamentos
  const calculateTotal = () => {
    return payments.reduce((total, payment) => total + payment.payment_value, 0);
  };

  // Lidar com alterações no formulário
  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewPayment(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Obter nome do profissional a partir do ID
  const getProfessionalName = (id: string): string => {
    const professional = professionals.find(p => p.id === id);
    return professional?.professional_name || "Profissional não encontrado";
  };

  // Obter nome do serviço a partir do ID
  const getServiceName = (id: string): string => {
    const service = services.find(s => s.id === id);
    return service?.display_name || "Serviço não encontrado";
  };

  // Efeito para buscar dados do cliente e pagamentos
  useEffect(() => {
    fetchCustomerData();
  }, [cpf]);
  
  // Buscar pagamentos quando o cliente for carregado ou quando mudar para a aba financeira
  useEffect(() => {
    if (customer && activeTab === 'financial') {
      fetchPayments();
    }
  }, [customer, activeTab]);

  // Buscar agendamentos quando o cliente for carregado ou quando mudar para a aba de agendamentos
  useEffect(() => {
    if (customer && activeTab === 'appointments') {
      fetchAppointments();
    }
  }, [customer, activeTab]);

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
            className={`mt-2 px-4 py-2 rounded ${
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
          {/* Cabeçalho compacto com informações essenciais */}
          <div
            className={`p-4 rounded-lg ${
              isDarkMode ? "bg-neutral-700" : "bg-white"
            } shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full bg-gray-200 mr-4 flex items-center justify-center overflow-hidden">
                  {customer.base_image_url && customerImageUrl ? (
                    <Image
                      src={customerImageUrl}
                      alt={`${customer.customer_name} ${customer.surname}`}
                      width={64}
                      height={64}
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
                  <h2
                    className={`text-xl font-bold ${
                      isDarkMode ? "text-slate-100" : "text-neutral-900"
                    }`}
                  >
                    {customer.customer_name} {customer.surname}
                  </h2>
                  <div className="flex space-x-4 text-sm mt-1">
                    <span
                      className={`${
                        isDarkMode ? "text-slate-300" : "text-gray-500"
                      }`}
                    >
                      CPF: {customer.cpf}
                    </span>
                    <span
                      className={`${
                        isDarkMode ? "text-slate-300" : "text-gray-500"
                      }`}
                    >
                      Tel: {customer.phone}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Link
                  href={`/usual/customers/edit/${customer.cpf}`}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    isDarkMode
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  Editar
                </Link>
              </div>
            </div>
          </div>

          {/* Sistema de abas/tabs */}
          <div
            className={`border-b ${
              isDarkMode ? "border-neutral-600" : "border-gray-200"
            }`}
          >
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("info")}
                className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === "info"
                    ? isDarkMode
                      ? "border-emerald-500 text-emerald-400"
                      : "border-emerald-500 text-emerald-600"
                    : isDarkMode
                    ? "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Informações Pessoais
              </button>
              <button
                onClick={() => setActiveTab("financial")}
                className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === "financial"
                    ? isDarkMode
                      ? "border-emerald-500 text-emerald-400"
                      : "border-emerald-500 text-emerald-600"
                    : isDarkMode
                    ? "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Registro Financeiro
              </button>
              <button
                onClick={() => setActiveTab("appointments")}
                className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === "appointments"
                    ? isDarkMode
                      ? "border-emerald-500 text-emerald-400"
                      : "border-emerald-500 text-emerald-600"
                    : isDarkMode
                    ? "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Registro de Serviço
              </button>
              <button
                onClick={() => setActiveTab("services")}
                className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === "services"
                    ? isDarkMode
                      ? "border-emerald-500 text-emerald-400"
                      : "border-emerald-500 text-emerald-600"
                    : isDarkMode
                    ? "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Serviços Atrelados
              </button>
            </nav>
          </div>

          {/* Conteúdo das abas */}
          <div>
            {/* Aba de Informações Pessoais */}
            {activeTab === "info" && (
              <div
                className={`p-4 rounded-lg ${
                  isDarkMode ? "bg-neutral-700" : "bg-white"
                } shadow-sm`}
              >
                <h3
                  className={`text-lg font-medium mb-4 ${
                    isDarkMode ? "text-slate-100" : "text-neutral-900"
                  }`}
                >
                  Informações Pessoais
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Coluna 1 */}
                  <div className="space-y-4">
                    <div>
                      <p
                        className={`text-xs uppercase font-medium ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Nome Completo
                      </p>
                      <p
                        className={`${
                          isDarkMode ? "text-slate-100" : "text-neutral-900"
                        }`}
                      >
                        {customer.customer_name} {customer.surname}
                      </p>
                    </div>

                    <div>
                      <p
                        className={`text-xs uppercase font-medium ${
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
                        className={`text-xs uppercase font-medium ${
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
                        className={`text-xs uppercase font-medium ${
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

                  {/* Coluna 2 */}
                  <div className="space-y-4">
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
                          isDarkMode ? "text-slate-100" : "text-neutral-900"
                        }`}
                      >
                        {customer.email}
                      </p>
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
                          isDarkMode ? "text-slate-100" : "text-neutral-900"
                        }`}
                      >
                        {customer.phone}
                      </p>
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
                          isDarkMode ? "text-slate-100" : "text-neutral-900"
                        }`}
                      >
                        {customer.address || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contato de Emergência */}
                <div className="mt-8">
                  <h4
                    className={`text-md font-medium mb-3 ${
                      isDarkMode ? "text-slate-100" : "text-neutral-900"
                    }`}
                  >
                    Contato de Emergência
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          isDarkMode ? "text-slate-100" : "text-neutral-900"
                        }`}
                      >
                        {customer.emergency_name || "—"}
                      </p>
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
                          isDarkMode ? "text-slate-100" : "text-neutral-900"
                        }`}
                      >
                        {customer.emergency_phone || "—"}
                      </p>
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
                          isDarkMode ? "text-slate-100" : "text-neutral-900"
                        }`}
                      >
                        {customer.emergency_relationship || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Datas de cadastro e atualização */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-xs text-gray-500">
                    <p>Cadastrado em: {formatarData(customer.created_at)}</p>
                    {customer.updated_at && (
                      <p>Atualizado em: {formatarData(customer.updated_at)}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Aba de Registro Financeiro */}
            {activeTab === "financial" && (
              <div
                className={`p-4 rounded-lg ${
                  isDarkMode ? "bg-neutral-700" : "bg-white"
                } shadow-sm`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3
                    className={`text-lg font-medium ${
                      isDarkMode ? "text-slate-100" : "text-neutral-900"
                    }`}
                  >
                    Registro Financeiro
                  </h3>
                  <button
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors inline-flex items-center ${
                      isDarkMode
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                    onClick={() => setShowPaymentModal(true)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Novo Pagamento
                  </button>
                </div>

                {/* Tabela de Registros Financeiros */}
                <div
                  className={`overflow-hidden rounded-lg border ${
                    isDarkMode ? "border-neutral-700" : "border-slate-200"
                  }`}
                >
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead
                      className={isDarkMode ? "bg-neutral-700" : "bg-gray-50"}
                    >
                      <tr>
                        <th
                          scope="col"
                          className={`px-6 py-3 text-left text-xs font-medium ${
                            isDarkMode ? "text-slate-100" : "text-neutral-500"
                          } uppercase tracking-wider`}
                        >
                          Data
                        </th>
                        <th
                          scope="col"
                          className={`px-6 py-3 text-left text-xs font-medium ${
                            isDarkMode ? "text-slate-100" : "text-neutral-500"
                          } uppercase tracking-wider`}
                        >
                          Tipo de Pagamento
                        </th>
                        <th
                          scope="col"
                          className={`px-6 py-3 text-left text-xs font-medium ${
                            isDarkMode ? "text-slate-100" : "text-neutral-500"
                          } uppercase tracking-wider`}
                        >
                          Valor
                        </th>
                        <th
                          scope="col"
                          className={`px-6 py-3 text-left text-xs font-medium ${
                            isDarkMode ? "text-slate-100" : "text-neutral-500"
                          } uppercase tracking-wider`}
                        >
                          Observações
                        </th>
                        <th
                          scope="col"
                          className={`px-6 py-3 text-right text-xs font-medium ${
                            isDarkMode ? "text-slate-100" : "text-neutral-500"
                          } uppercase tracking-wider`}
                        >
                          Ações
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
                      {loadingPayments ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center">
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                            </div>
                            <p className={`mt-2 ${isDarkMode ? "text-slate-300" : "text-gray-500"}`}>
                              Carregando registros financeiros...
                            </p>
                          </td>
                        </tr>
                      ) : payments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center">
                            <p
                              className={`${
                                isDarkMode ? "text-slate-300" : "text-gray-500"
                              }`}
                            >
                              Nenhum registro financeiro encontrado para este
                              cliente.
                            </p>
                            <p
                              className={`text-sm mt-1 ${
                                isDarkMode ? "text-slate-400" : "text-gray-400"
                              }`}
                            >
                              Clique em "Novo Pagamento" para adicionar um
                              registro.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        payments.map((payment) => (
                          <tr key={payment.id}>
                            <td
                              className={`px-6 py-4 whitespace-nowrap text-sm ${
                                isDarkMode ? "text-slate-100" : "text-slate-900"
                              }`}
                            >
                              {formatarData(payment.payment_time)}
                            </td>
                            <td
                              className={`px-6 py-4 whitespace-nowrap text-sm ${
                                isDarkMode ? "text-slate-100" : "text-slate-900"
                              }`}
                            >
                              {payment.payment_type}
                            </td>
                            <td
                              className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                                isDarkMode ? "text-emerald-400" : "text-emerald-600"
                              }`}
                            >
                              {formatCurrency(payment.payment_value)}
                            </td>
                            <td
                              className={`px-6 py-4 whitespace-nowrap text-sm`}
                            >
                              {payment.notes || "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                className={`text-indigo-600 hover:text-indigo-900 ${
                                  isDarkMode ? "text-indigo-400 hover:text-indigo-300" : ""
                                }`}
                              >
                                Editar
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Rodapé com sumário financeiro */}
                <div className="mt-4 flex justify-end">
                  <div
                    className={`px-4 py-2 rounded-md ${
                      isDarkMode ? "bg-neutral-600" : "bg-slate-100"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-slate-100" : "text-neutral-900"
                      }`}
                    >
                      Total de pagamentos:
                    </span>
                    <span
                      className={`ml-2 font-semibold ${
                        isDarkMode ? "text-emerald-400" : "text-emerald-600"
                      }`}
                    >
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>
                </div>
                
                {/* Modal para adicionar novo pagamento */}
                {showPaymentModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div 
                      className={`p-6 rounded-lg shadow-lg w-full max-w-md ${
                        isDarkMode ? "bg-neutral-800" : "bg-white"
                      }`}
                    >
                      <h3 
                        className={`text-lg font-medium mb-4 ${
                          isDarkMode ? "text-slate-100" : "text-neutral-900"
                        }`}
                      >
                        Novo Pagamento
                      </h3>
                      
                      <form onSubmit={handleAddPayment}>
                        <div className="space-y-4">
                          <div>
                            <label 
                              className={`block text-sm font-medium mb-1 ${
                                isDarkMode ? "text-slate-300" : "text-gray-700"
                              }`}
                            >
                              Tipo de Pagamento
                            </label>
                            <input
                              type="text"
                              name="payment_type"
                              value={newPayment.payment_type}
                              onChange={handlePaymentChange}
                              required
                              className={`w-full p-2 rounded-md border ${
                                isDarkMode 
                                  ? "bg-neutral-700 border-neutral-600 text-slate-100" 
                                  : "border-gray-300"
                              }`}
                              placeholder="Ex: Mensalidade, Avulso, Pacote"
                            />
                          </div>
                          
                          <div>
                            <label 
                              className={`block text-sm font-medium mb-1 ${
                                isDarkMode ? "text-slate-300" : "text-gray-700"
                              }`}
                            >
                              Valor (R$)
                            </label>
                            <input
                              type="text"
                              name="payment_value"
                              value={newPayment.payment_value}
                              onChange={handlePaymentChange}
                              required
                              className={`w-full p-2 rounded-md border ${
                                isDarkMode 
                                  ? "bg-neutral-700 border-neutral-600 text-slate-100" 
                                  : "border-gray-300"
                              }`}
                              placeholder="Ex: 150,00"
                            />
                          </div>
                          
                          <div>
                            <label 
                              className={`block text-sm font-medium mb-1 ${
                                isDarkMode ? "text-slate-300" : "text-gray-700"
                              }`}
                            >
                              Data
                            </label>
                            <input
                              type="date"
                              name="payment_time"
                              value={newPayment.payment_time}
                              onChange={handlePaymentChange}
                              required
                              className={`w-full p-2 rounded-md border ${
                                isDarkMode 
                                  ? "bg-neutral-700 border-neutral-600 text-slate-100" 
                                  : "border-gray-300"
                              }`}
                            />
                          </div>
                          
                          <div>
                            <label 
                              className={`block text-sm font-medium mb-1 ${
                                isDarkMode ? "text-slate-300" : "text-gray-700"
                              }`}
                            >
                              Observações
                            </label>
                            <textarea
                              name="notes"
                              value={newPayment.notes}
                              onChange={handlePaymentChange}
                              className={`w-full p-2 rounded-md border ${
                                isDarkMode 
                                  ? "bg-neutral-700 border-neutral-600 text-slate-100" 
                                  : "border-gray-300"
                              }`}
                              placeholder="Observações sobre o pagamento"
                              rows={3}
                            ></textarea>
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2 mt-6">
                          <button
                            type="button"
                            onClick={() => setShowPaymentModal(false)}
                            className={`px-4 py-2 rounded text-sm font-medium ${
                              isDarkMode
                                ? "bg-neutral-700 hover:bg-neutral-600 text-slate-100"
                                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                            }`}
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 rounded text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Salvar
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Aba de Registro de Serviço */}
            {activeTab === "appointments" && (
              <div
                className={`p-4 rounded-lg ${
                  isDarkMode ? "bg-neutral-700" : "bg-white"
                } shadow-sm`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3
                    className={`text-lg font-medium ${
                      isDarkMode ? "text-slate-100" : "text-neutral-900"
                    }`}
                  >
                    Registro de Serviço
                  </h3>
                  <button
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors inline-flex items-center ${
                      isDarkMode
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Novo Agendamento
                  </button>
                </div>

                {/* Tabela de Agendamentos */}
                <div
                  className={`overflow-hidden rounded-lg border ${
                    isDarkMode ? "border-neutral-700" : "border-slate-200"
                  }`}
                >
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead
                      className={isDarkMode ? "bg-neutral-700" : "bg-gray-50"}
                    >
                      <tr>
                        <th
                          scope="col"
                          className={`px-6 py-3 text-left text-xs font-medium ${
                            isDarkMode ? "text-slate-100" : "text-neutral-500"
                          } uppercase tracking-wider`}
                        >
                          Data/Hora
                        </th>
                        <th
                          scope="col"
                          className={`px-6 py-3 text-left text-xs font-medium ${
                            isDarkMode ? "text-slate-100" : "text-neutral-500"
                          } uppercase tracking-wider`}
                        >
                          Serviço
                        </th>
                        <th
                          scope="col"
                          className={`px-6 py-3 text-left text-xs font-medium ${
                            isDarkMode ? "text-slate-100" : "text-neutral-500"
                          } uppercase tracking-wider`}
                        >
                          Profissional
                        </th>
                        <th
                          scope="col"
                          className={`px-6 py-3 text-left text-xs font-medium ${
                            isDarkMode ? "text-slate-100" : "text-neutral-500"
                          } uppercase tracking-wider`}
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className={`px-6 py-3 text-right text-xs font-medium ${
                            isDarkMode ? "text-slate-100" : "text-neutral-500"
                          } uppercase tracking-wider`}
                        >
                          Ações
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
                      {loadingAppointments ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center">
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                            </div>
                            <p className={`mt-2 ${isDarkMode ? "text-slate-300" : "text-gray-500"}`}>
                              Carregando agendamentos...
                            </p>
                          </td>
                        </tr>
                      ) : appointments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center">
                            <p
                              className={`${
                                isDarkMode ? "text-slate-300" : "text-gray-500"
                              }`}
                            >
                              Nenhum agendamento encontrado para este cliente.
                            </p>
                            <p
                              className={`text-sm mt-1 ${
                                isDarkMode ? "text-slate-400" : "text-gray-400"
                              }`}
                            >
                              Clique em "Novo Agendamento" para agendar um
                              serviço.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        appointments.map((appointment) => (
                          <tr key={appointment.id}>
                            <td
                              className={`px-6 py-4 whitespace-nowrap text-sm ${
                                isDarkMode ? "text-slate-100" : "text-slate-900"
                              }`}
                            >
                              {formatarData(appointment.appointment_time)}
                            </td>
                            <td
                              className={`px-6 py-4 whitespace-nowrap text-sm ${
                                isDarkMode ? "text-slate-100" : "text-slate-900"
                              }`}
                            >
                              {getServiceName(appointment.service_id)}
                            </td>
                            <td
                              className={`px-6 py-4 whitespace-nowrap text-sm ${
                                isDarkMode ? "text-slate-100" : "text-slate-900"
                              }`}
                            >
                              {getProfessionalName(appointment.professional_id)}
                            </td>
                            <td
                              className={`px-6 py-4 whitespace-nowrap text-sm ${
                                isDarkMode ? "text-slate-100" : "text-slate-900"
                              }`}
                            >
                              {appointment.status}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                className={`text-indigo-600 hover:text-indigo-900 ${
                                  isDarkMode ? "text-indigo-400 hover:text-indigo-300" : ""
                                }`}
                              >
                                Editar
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Rodapé com estatísticas */}
                <div className="mt-4 flex justify-between">
                  <div
                    className={`px-4 py-2 rounded-md ${
                      isDarkMode ? "bg-neutral-600" : "bg-slate-100"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-slate-100" : "text-neutral-900"
                      }`}
                    >
                      Total de agendamentos:
                    </span>
                    <span
                      className={`ml-2 font-semibold ${
                        isDarkMode ? "text-slate-100" : "text-neutral-900"
                      }`}
                    >
                      {appointments.length}
                    </span>
                  </div>

                  <div
                    className={`px-4 py-2 rounded-md ${
                      isDarkMode ? "bg-neutral-600" : "bg-slate-100"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-slate-100" : "text-neutral-900"
                      }`}
                    >
                      Próximo agendamento:
                    </span>
                    <span
                      className={`ml-2 font-semibold ${
                        isDarkMode ? "text-slate-100" : "text-neutral-900"
                      }`}
                    >
                      {appointments.length > 0
                        ? formatarData(appointments[0].appointment_time)
                        : "Nenhum"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Aba de Serviços Vinculados */}
            {activeTab === "services" && (
              <div
                className={`p-4 rounded-lg ${
                  isDarkMode ? "bg-neutral-700" : "bg-white"
                } shadow-sm`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3
                    className={`text-lg font-medium ${
                      isDarkMode ? "text-slate-100" : "text-neutral-900"
                    }`}
                  >
                    Serviços Vinculados
                  </h3>
                  <button
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors inline-flex items-center ${
                      isDarkMode
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Vincular Serviço
                  </button>
                </div>

                {/* Conteúdo da aba - Grade de Serviços */}
                <div className="mt-4">
                  {/* Sem serviços vinculados - estado vazio */}
                  <div className="text-center py-10 px-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-12 w-12 mx-auto mb-3 ${
                        isDarkMode ? "text-gray-500" : "text-gray-400"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    <p
                      className={`text-lg font-medium mb-1 ${
                        isDarkMode ? "text-slate-100" : "text-gray-600"
                      }`}
                    >
                      Nenhum serviço vinculado
                    </p>
                    <p
                      className={`max-w-sm mx-auto mb-4 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Este cliente ainda não possui nenhum serviço vinculado ao
                      seu perfil.
                    </p>
                    <button
                      className={`mt-2 px-4 py-2 rounded text-sm font-medium transition-colors inline-flex items-center ${
                        isDarkMode
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Vincular um serviço
                    </button>
                  </div>

                  {/* Espaço para a grade de serviços quando existirem */}
                  {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    Aqui serão exibidos os cartões de serviços quando houverem dados
                  </div> */}
                </div>
              </div>
            )}
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
