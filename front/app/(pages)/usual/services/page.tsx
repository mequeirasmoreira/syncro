"use client";

/**
 * Página de Gerenciamento de Serviços
 * Interface para listar, criar, editar e excluir serviços oferecidos
 */

import { useState, useEffect, FormEvent } from "react";
import { useTheme } from "@/app/contexts/ThemeContext";
import RootLayout from "@/app/components/RootLayout";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logger from "@/lib/logger";
import { 
  ServiceItem, 
  ServiceForm, 
  serviceManagementService 
} from "@/services/ServiceManagementService";
import {
  RoomItem,
  RoomForm,
  roomManagementService
} from "@/services/RoomManagementService";
import {
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
  BuildingOffice2Icon,
  SquaresPlusIcon
} from "@heroicons/react/24/outline";
import { Breadcrumb } from "@/app/components/Breadcrumb/Breadcrumb";

export default function ServicesPage() {
  const { isDarkMode } = useTheme();
  
  // Estados para gerenciar os serviços
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para o formulário
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentService, setCurrentService] = useState<ServiceItem | null>(null);
  const [formData, setFormData] = useState<ServiceForm>({
    display_name: ''
  });
  
  // Estados para gerenciar as salas
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<RoomItem[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [errorRooms, setErrorRooms] = useState<string | null>(null);
  
  // Estados para o formulário de salas
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<RoomItem | null>(null);
  const [roomFormData, setRoomFormData] = useState<RoomForm>({
    display_name: ''
  });
  
  // Estado para modo de visualização (serviços ou salas)
  const [activeTab, setActiveTab] = useState<'services' | 'rooms'>('services');
  
  // Estado para busca
  const [searchQuery, setSearchQuery] = useState('');
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  
  // Estado para feedback de operações
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });
  
  // Carregar serviços
  const fetchServices = async () => {
    logger.debug(`[ServicesPage] - fetchServices - Buscando serviços`);
    setLoading(true);
    setError(null);
    
    try {
      const servicesData = await serviceManagementService.getAllServices();
      setServices(servicesData);
      setFilteredServices(servicesData);
      logger.debug(`[ServicesPage] - fetchServices - ${servicesData.length} serviços encontrados`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Erro ao carregar serviços: ${errorMessage}`);
      logger.error(`[ServicesPage] - fetchServices - Erro: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Carregar salas
  const fetchRooms = async () => {
    logger.debug(`[ServicesPage] - fetchRooms - Buscando salas`);
    setLoadingRooms(true);
    setErrorRooms(null);
    
    try {
      const roomsData = await roomManagementService.getAllRooms();
      setRooms(roomsData);
      setFilteredRooms(roomsData);
      logger.debug(`[ServicesPage] - fetchRooms - ${roomsData.length} salas encontradas`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setErrorRooms(`Erro ao carregar salas: ${errorMessage}`);
      logger.error(`[ServicesPage] - fetchRooms - Erro: ${errorMessage}`);
    } finally {
      setLoadingRooms(false);
    }
  };
  
  // Carregar serviços e salas ao iniciar a página
  useEffect(() => {
    fetchServices();
    fetchRooms();
  }, []);
  
  // Filtrar serviços quando a busca mudar
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredServices(services);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = services.filter(service => 
      service.display_name.toLowerCase().includes(query)
    );
    
    setFilteredServices(filtered);
    logger.debug(`[ServicesPage] - filtrarServiços - ${filtered.length} serviços encontrados para "${searchQuery}"`);
  }, [searchQuery, services]);
  
  // Filtrar salas quando a busca mudar
  useEffect(() => {
    if (roomSearchQuery.trim() === '') {
      setFilteredRooms(rooms);
      return;
    }
    
    const query = roomSearchQuery.toLowerCase();
    const filtered = rooms.filter(room => 
      room.display_name.toLowerCase().includes(query)
    );
    
    setFilteredRooms(filtered);
    logger.debug(`[ServicesPage] - filtrarSalas - ${filtered.length} salas encontradas para "${roomSearchQuery}"`);
  }, [roomSearchQuery, rooms]);
  
  // Limpar formulário
  const resetForm = () => {
    setFormData({ display_name: '' });
    setCurrentService(null);
    setIsCreating(false);
    setIsEditing(false);
  };
  
  // Limpar formulário de salas
  const resetRoomForm = () => {
    setRoomFormData({ display_name: '' });
    setCurrentRoom(null);
    setIsCreatingRoom(false);
    setIsEditingRoom(false);
  };
  
  // Preparar formulário para criação
  const handleStartCreate = () => {
    resetForm();
    setIsCreating(true);
    logger.debug(`[ServicesPage] - handleStartCreate - Iniciando criação de serviço`);
  };
  
  // Preparar formulário para criação de sala
  const handleStartCreateRoom = () => {
    resetRoomForm();
    setIsCreatingRoom(true);
    logger.debug(`[ServicesPage] - handleStartCreateRoom - Iniciando criação de sala`);
  };
  
  // Preparar formulário para edição
  const handleStartEdit = (service: ServiceItem) => {
    setFormData({ display_name: service.display_name });
    setCurrentService(service);
    setIsEditing(true);
    logger.debug(`[ServicesPage] - handleStartEdit - Iniciando edição do serviço ID: ${service.id}`);
  };
  
  // Preparar formulário para edição de sala
  const handleStartEditRoom = (room: RoomItem) => {
    setRoomFormData({ display_name: room.display_name });
    setCurrentRoom(room);
    setIsEditingRoom(true);
    logger.debug(`[ServicesPage] - handleStartEditRoom - Iniciando edição da sala ID: ${room.id}`);
  };
  
  // Fechar formulário
  const handleCancelForm = () => {
    resetForm();
    logger.debug(`[ServicesPage] - handleCancelForm - Formulário cancelado`);
  };
  
  // Fechar formulário de sala
  const handleCancelRoomForm = () => {
    resetRoomForm();
    logger.debug(`[ServicesPage] - handleCancelRoomForm - Formulário de sala cancelado`);
  };
  
  // Lidar com mudanças nos campos do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Lidar com mudanças nos campos do formulário de sala
  const handleRoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRoomFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Enviar formulário
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    logger.debug(`[ServicesPage] - handleSubmit - Enviando formulário`);
    
    if (!formData.display_name.trim()) {
      setFeedback({
        type: 'error',
        message: 'O nome do serviço é obrigatório'
      });
      return;
    }
    
    try {
      if (isCreating) {
        // Criar novo serviço
        await serviceManagementService.createService(formData);
        logger.debug(`[ServicesPage] - handleSubmit - Serviço criado com sucesso`);
        setFeedback({
          type: 'success',
          message: 'Serviço criado com sucesso!'
        });
      } else if (isEditing && currentService) {
        // Atualizar serviço existente
        await serviceManagementService.updateService(currentService.id, formData);
        logger.debug(`[ServicesPage] - handleSubmit - Serviço atualizado com sucesso`);
        setFeedback({
          type: 'success',
          message: 'Serviço atualizado com sucesso!'
        });
      }
      
      // Recarregar serviços e resetar formulário
      await fetchServices();
      resetForm();
      
      // Limpar feedback após alguns segundos
      setTimeout(() => {
        setFeedback({ type: null, message: '' });
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`[ServicesPage] - handleSubmit - Erro: ${errorMessage}`);
      setFeedback({
        type: 'error',
        message: `Erro ao salvar serviço: ${errorMessage}`
      });
    }
  };
  
  // Enviar formulário de sala
  const handleRoomSubmit = async (e: FormEvent) => {
    e.preventDefault();
    logger.debug(`[ServicesPage] - handleRoomSubmit - Enviando formulário de sala`);
    
    if (!roomFormData.display_name.trim()) {
      setFeedback({
        type: 'error',
        message: 'O nome da sala é obrigatório'
      });
      return;
    }
    
    try {
      if (isCreatingRoom) {
        // Criar nova sala
        await roomManagementService.createRoom(roomFormData);
        logger.debug(`[ServicesPage] - handleRoomSubmit - Sala criada com sucesso`);
        setFeedback({
          type: 'success',
          message: 'Sala criada com sucesso!'
        });
      } else if (isEditingRoom && currentRoom) {
        // Atualizar sala existente
        await roomManagementService.updateRoom(currentRoom.id, roomFormData);
        logger.debug(`[ServicesPage] - handleRoomSubmit - Sala atualizada com sucesso`);
        setFeedback({
          type: 'success',
          message: 'Sala atualizada com sucesso!'
        });
      }
      
      // Recarregar salas e resetar formulário
      await fetchRooms();
      resetRoomForm();
      
      // Limpar feedback após alguns segundos
      setTimeout(() => {
        setFeedback({ type: null, message: '' });
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`[ServicesPage] - handleRoomSubmit - Erro: ${errorMessage}`);
      setFeedback({
        type: 'error',
        message: `Erro ao salvar sala: ${errorMessage}`
      });
    }
  };
  
  // Excluir serviço
  const handleDeleteService = async (service: ServiceItem) => {
    if (!window.confirm(`Tem certeza que deseja excluir o serviço "${service.display_name}"?`)) {
      return;
    }
    
    logger.debug(`[ServicesPage] - handleDeleteService - Excluindo serviço ID: ${service.id}`);
    
    try {
      await serviceManagementService.deleteService(service.id);
      await fetchServices();
      logger.debug(`[ServicesPage] - handleDeleteService - Serviço excluído com sucesso`);
      setFeedback({
        type: 'success',
        message: 'Serviço excluído com sucesso!'
      });
      
      // Limpar feedback após alguns segundos
      setTimeout(() => {
        setFeedback({ type: null, message: '' });
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`[ServicesPage] - handleDeleteService - Erro: ${errorMessage}`);
      setFeedback({
        type: 'error',
        message: `Erro ao excluir serviço: ${errorMessage}`
      });
    }
  };
  
  // Excluir sala
  const handleDeleteRoom = async (room: RoomItem) => {
    if (!window.confirm(`Tem certeza que deseja excluir a sala "${room.display_name}"?`)) {
      return;
    }
    
    logger.debug(`[ServicesPage] - handleDeleteRoom - Excluindo sala ID: ${room.id}`);
    
    try {
      await roomManagementService.deleteRoom(room.id);
      await fetchRooms();
      logger.debug(`[ServicesPage] - handleDeleteRoom - Sala excluída com sucesso`);
      setFeedback({
        type: 'success',
        message: 'Sala excluída com sucesso!'
      });
      
      // Limpar feedback após alguns segundos
      setTimeout(() => {
        setFeedback({ type: null, message: '' });
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`[ServicesPage] - handleDeleteRoom - Erro: ${errorMessage}`);
      setFeedback({
        type: 'error',
        message: `Erro ao excluir sala: ${errorMessage}`
      });
    }
  };
  
  return (
    <RootLayout>
      <div className="mb-6">
        <Breadcrumb
          parentLabel="Início"
          parentHref="/usual/dashboard"
          current="Serviços"
          isDarkMode={isDarkMode}
        />
      </div>
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1
            className={`text-2xl font-semibold ${
              isDarkMode ? "text-slate-100" : "text-neutral-900"
            }`}
          >
            Gerenciamento de Serviços
          </h1>
          <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
            Cadastre e gerencie os serviços e salas oferecidos
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
          <button
            onClick={() => {
              activeTab === 'services' ? handleStartCreate() : handleStartCreateRoom();
            }}
            className={`inline-flex items-center px-4 py-2 font-medium rounded-md transition-colors duration-200 ${
              isDarkMode
                ? "bg-slate-200 text-neutral-900 hover:bg-slate-400"
                : "bg-emerald-600 text-slate-100 hover:bg-emerald-700"
            }`}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            {activeTab === 'services' ? "Novo Serviço" : "Nova Sala"}
          </button>
        </div>
      </div>
      
      {/* Feedback */}
      {feedback.type && (
        <div 
          className={`mb-4 p-3 rounded-md ${
            feedback.type === 'success' 
              ? (isDarkMode ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-800')
              : feedback.type === 'error'
              ? (isDarkMode ? 'bg-red-800 text-red-100' : 'bg-red-100 text-red-800')
              : (isDarkMode ? 'bg-blue-800 text-blue-100' : 'bg-blue-100 text-blue-800')
          }`}
        >
          {feedback.message}
        </div>
      )}
      
      {/* Navegação por abas */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-neutral-700">
          <nav className="flex -mb-px space-x-8">
            <button
              onClick={() => setActiveTab('services')}
              className={`pb-3 px-1 font-medium text-sm transition-colors ${
                activeTab === 'services'
                  ? isDarkMode
                    ? 'border-b-2 border-emerald-500 text-emerald-500'
                    : 'border-b-2 border-emerald-600 text-emerald-600'
                  : isDarkMode
                  ? 'text-gray-400 hover:text-gray-300 hover:border-gray-300 border-b-2 border-transparent'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
              }`}
            >
              <span className="flex items-center">
                <SquaresPlusIcon className="h-5 w-5 mr-2" />
                Serviços
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab('rooms')}
              className={`pb-3 px-1 font-medium text-sm transition-colors ${
                activeTab === 'rooms'
                  ? isDarkMode
                    ? 'border-b-2 border-emerald-500 text-emerald-500'
                    : 'border-b-2 border-emerald-600 text-emerald-600'
                  : isDarkMode
                  ? 'text-gray-400 hover:text-gray-300 hover:border-gray-300 border-b-2 border-transparent'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
              }`}
            >
              <span className="flex items-center">
                <BuildingOffice2Icon className="h-5 w-5 mr-2" />
                Salas
              </span>
            </button>
          </nav>
        </div>
      </div>
      
      {/* Área de pesquisa conforme aba ativa */}
      <div className={`p-4 mb-4 rounded-md ${isDarkMode ? "bg-neutral-800" : ""}`}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          {activeTab === 'services' ? (
            <input
              type="text"
              placeholder="Pesquisar serviços..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 w-full p-2 rounded-md border ${
                isDarkMode
                  ? "border-neutral-600 text-slate-100"
                  : "bg-white border-slate-100 text-gray-900"
              }`}
            />
          ) : (
            <input
              type="text"
              placeholder="Pesquisar salas..."
              value={roomSearchQuery}
              onChange={(e) => setRoomSearchQuery(e.target.value)}
              className={`pl-10 w-full p-2 rounded-md border ${
                isDarkMode
                  ? "border-neutral-600 text-slate-100"
                  : "bg-white border-slate-100 text-gray-900"
              }`}
            />
          )}
        </div>
      </div>
      
      {/* Formulário de Criação/Edição de Serviço - exibir apenas quando activeTab === 'services' */}
      {activeTab === 'services' && (isCreating || isEditing) && (
        <div className={`mb-6 p-4 rounded-md ${
          isDarkMode ? "bg-neutral-800 border-neutral-700" : "bg-white border-slate-200"
        } border`}>
          <h2 className={`text-lg font-medium mb-4 ${
            isDarkMode ? "text-slate-100" : "text-neutral-900"
          }`}>
            {isCreating ? "Criar Novo Serviço" : "Editar Serviço"}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label 
                htmlFor="display_name"
                className={`block mb-1 text-sm font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Nome do Serviço <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="display_name"
                name="display_name"
                value={formData.display_name}
                onChange={handleInputChange}
                placeholder="Ex: Pilates"
                className={`w-full px-3 py-2 rounded-md ${
                  isDarkMode 
                    ? "bg-neutral-700 text-white border-neutral-600" 
                    : "bg-white text-gray-900 border-gray-300"
                } border focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancelForm}
                className={`px-4 py-2 rounded-md ${
                  isDarkMode
                    ? "bg-neutral-700 hover:bg-neutral-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                }`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`flex items-center px-4 py-2 rounded-md ${
                  isDarkMode
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white"
                }`}
              >
                <CheckIcon className="h-5 w-5 mr-2" />
                {isCreating ? "Criar Serviço" : "Salvar Alterações"}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Formulário de Criação/Edição de Sala - exibir apenas quando activeTab === 'rooms' */}
      {activeTab === 'rooms' && (isCreatingRoom || isEditingRoom) && (
        <div className={`mb-6 p-4 rounded-md ${
          isDarkMode ? "bg-neutral-800 border-neutral-700" : "bg-white border-slate-200"
        } border`}>
          <h2 className={`text-lg font-medium mb-4 ${
            isDarkMode ? "text-slate-100" : "text-neutral-900"
          }`}>
            {isCreatingRoom ? "Criar Nova Sala" : "Editar Sala"}
          </h2>
          
          <form onSubmit={handleRoomSubmit}>
            <div className="mb-4">
              <label 
                htmlFor="display_name"
                className={`block mb-1 text-sm font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Nome da Sala <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="display_name"
                name="display_name"
                value={roomFormData.display_name}
                onChange={handleRoomInputChange}
                placeholder="Ex: Sala 1"
                className={`w-full px-3 py-2 rounded-md ${
                  isDarkMode 
                    ? "bg-neutral-700 text-white border-neutral-600" 
                    : "bg-white text-gray-900 border-gray-300"
                } border focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancelRoomForm}
                className={`px-4 py-2 rounded-md ${
                  isDarkMode
                    ? "bg-neutral-700 hover:bg-neutral-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                }`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`flex items-center px-4 py-2 rounded-md ${
                  isDarkMode
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white"
                }`}
              >
                <CheckIcon className="h-5 w-5 mr-2" />
                {isCreatingRoom ? "Criar Sala" : "Salvar Alterações"}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Lista de Serviços - exibir apenas quando activeTab === 'services' */}
      {activeTab === 'services' && (
        <div className={`flex-1 p-4 rounded-md ${isDarkMode ? "bg-neutral-800" : ""}`}>
          <h2
            className={`text-lg font-medium mb-3 ${
              isDarkMode ? "text-slate-100" : "text-neutral-900"
            }`}
          >
            Lista de serviços
          </h2>
          
          <div className={`overflow-hidden rounded-lg border ${
            isDarkMode ? "border-neutral-700" : "border-slate-200"
          }`}>
            {loading ? (
              <div className={`p-8 text-center ${
                isDarkMode ? "text-slate-100" : "text-gray-600"
              }`}>
                <div
                  className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent rounded-full mb-2"
                  aria-label="Carregando..."
                ></div>
                <p>Carregando serviços...</p>
              </div>
            ) : error ? (
              <div className={`p-8 text-center ${
                isDarkMode ? "text-red-300" : "text-red-600"
              }`}>
                <p>{error}</p>
                <button
                  onClick={fetchServices}
                  className={`mt-2 px-4 py-2 text-sm rounded ${
                    isDarkMode 
                      ? "bg-neutral-800 hover:bg-neutral-600 text-slate-100"
                      : "bg-slate-200 hover:bg-slate-100 text-neutral-900"
                  }`}
                >
                  Tentar novamente
                </button>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className={`p-8 text-center ${
                isDarkMode ? "text-slate-100" : "text-neutral-900"
              }`}>
                {searchQuery ? (
                  <p>Nenhum serviço encontrado para "{searchQuery}"</p>
                ) : (
                  <p>Nenhum serviço cadastrado. Crie o primeiro!</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={isDarkMode ? "bg-neutral-900" : "bg-gray-50"}>
                    <tr>
                      <th 
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Nome do Serviço
                      </th>
                      <th 
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Data de Criação
                      </th>
                      <th 
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Última Atualização
                      </th>
                      <th 
                        className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${
                    isDarkMode ? "divide-neutral-700 bg-neutral-800" : "divide-gray-200 bg-white"
                  }`}>
                    {filteredServices.map((service) => (
                      <tr 
                        key={service.id}
                        className={`${
                          isDarkMode ? "hover:bg-neutral-700" : "hover:bg-gray-50"
                        }`}
                      >
                        <td 
                          className={`px-6 py-4 whitespace-nowrap ${
                            isDarkMode ? "text-slate-100" : "text-neutral-900"
                          }`}
                        >
                          {service.display_name}
                        </td>
                        <td 
                          className={`px-6 py-4 whitespace-nowrap text-sm ${
                            isDarkMode ? "text-gray-300" : "text-gray-500"
                          }`}
                        >
                          {format(new Date(service.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </td>
                        <td 
                          className={`px-6 py-4 whitespace-nowrap text-sm ${
                            isDarkMode ? "text-gray-300" : "text-gray-500"
                          }`}
                        >
                          {service.updated_at 
                            ? format(new Date(service.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                            : "—"
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleStartEdit(service)}
                            className={`p-1 rounded-full ${
                              isDarkMode 
                                ? "text-blue-400 hover:bg-neutral-700" 
                                : "text-blue-600 hover:bg-gray-100"
                            } mr-2`}
                            title="Editar"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service)}
                            className={`p-1 rounded-full ${
                              isDarkMode 
                                ? "text-red-400 hover:bg-neutral-700" 
                                : "text-red-600 hover:bg-gray-100"
                            }`}
                            title="Excluir"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Lista de Salas - exibir apenas quando activeTab === 'rooms' */}
      {activeTab === 'rooms' && (
        <div className={`flex-1 p-4 rounded-md ${isDarkMode ? "bg-neutral-800" : ""}`}>
          <h2
            className={`text-lg font-medium mb-3 ${
              isDarkMode ? "text-slate-100" : "text-neutral-900"
            }`}
          >
            Lista de salas
          </h2>
          
          <div className={`overflow-hidden rounded-lg border ${
            isDarkMode ? "border-neutral-700" : "border-slate-200"
          }`}>
            {loadingRooms ? (
              <div className={`p-8 text-center ${
                isDarkMode ? "text-slate-100" : "text-gray-600"
              }`}>
                <div
                  className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent rounded-full mb-2"
                  aria-label="Carregando..."
                ></div>
                <p>Carregando salas...</p>
              </div>
            ) : errorRooms ? (
              <div className={`p-8 text-center ${
                isDarkMode ? "text-red-300" : "text-red-600"
              }`}>
                <p>{errorRooms}</p>
                <button
                  onClick={fetchRooms}
                  className={`mt-2 px-4 py-2 text-sm rounded ${
                    isDarkMode 
                      ? "bg-neutral-800 hover:bg-neutral-600 text-slate-100"
                      : "bg-slate-200 hover:bg-slate-100 text-neutral-900"
                  }`}
                >
                  Tentar novamente
                </button>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className={`p-8 text-center ${
                isDarkMode ? "text-slate-100" : "text-neutral-900"
              }`}>
                {roomSearchQuery ? (
                  <p>Nenhuma sala encontrada para "{roomSearchQuery}"</p>
                ) : (
                  <p>Nenhuma sala cadastrada. Crie a primeira!</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={isDarkMode ? "bg-neutral-900" : "bg-gray-50"}>
                    <tr>
                      <th 
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Nome da Sala
                      </th>
                      <th 
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Data de Criação
                      </th>
                      <th 
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Última Atualização
                      </th>
                      <th 
                        className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${
                    isDarkMode ? "divide-neutral-700 bg-neutral-800" : "divide-gray-200 bg-white"
                  }`}>
                    {filteredRooms.map((room) => (
                      <tr 
                        key={room.id}
                        className={`${
                          isDarkMode ? "hover:bg-neutral-700" : "hover:bg-gray-50"
                        }`}
                      >
                        <td 
                          className={`px-6 py-4 whitespace-nowrap ${
                            isDarkMode ? "text-slate-100" : "text-neutral-900"
                          }`}
                        >
                          {room.display_name}
                        </td>
                        <td 
                          className={`px-6 py-4 whitespace-nowrap text-sm ${
                            isDarkMode ? "text-gray-300" : "text-gray-500"
                          }`}
                        >
                          {format(new Date(room.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </td>
                        <td 
                          className={`px-6 py-4 whitespace-nowrap text-sm ${
                            isDarkMode ? "text-gray-300" : "text-gray-500"
                          }`}
                        >
                          {room.updated_at 
                            ? format(new Date(room.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                            : "—"
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleStartEditRoom(room)}
                            className={`p-1 rounded-full ${
                              isDarkMode 
                                ? "text-blue-400 hover:bg-neutral-700" 
                                : "text-blue-600 hover:bg-gray-100"
                            } mr-2`}
                            title="Editar"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room)}
                            className={`p-1 rounded-full ${
                              isDarkMode 
                                ? "text-red-400 hover:bg-neutral-700" 
                                : "text-red-600 hover:bg-gray-100"
                            }`}
                            title="Excluir"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Resumo */}
      <div className={`mt-6 p-4 rounded-md ${
        isDarkMode ? "bg-neutral-800" : "bg-gray-50"
      }`}>
        <p className={`text-sm ${
          isDarkMode ? "text-gray-300" : "text-gray-600"
        }`}>
          Total de serviços: <span className="font-medium">{services.length}</span>
        </p>
        <p className={`text-sm mt-1 ${
          isDarkMode ? "text-gray-300" : "text-gray-600"
        }`}>
          Total de salas: <span className="font-medium">{rooms.length}</span>
        </p>
      </div>
    </RootLayout>
  );
}
