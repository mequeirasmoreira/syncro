"use client";

import { useTheme } from "../../../../contexts/ThemeContext";
import RootLayout from "../../../../components/RootLayout";
import {
  Camera,
  Check,
  X,
  User,
  Phone,
  Calendar,
  FileText,
  Home,
  Heart,
  Info,
  AlertCircle,
  Mail,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import logger from "../../../../../lib/logger";
import { useMask } from "@react-input/mask";
import Toast from "../../../../components/Toast/Toast";
import { supabase } from "../../../../../utils/supabase/client";
import { useAuth } from "../../../../../contexts/AuthContext";

export default function NewCustomer() {
  const { isDarkMode } = useTheme();
  const { user, session } = useAuth();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<
    "success" | "error" | "warning" | "info"
  >("success");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    sobrenome: "",
    nickname: "",
    email: "",
    dataNascimento: "",
    cpf: "",
    telefone: "",
    contatoEmergencia: "",
    telefoneEmergencia: "",
    parentesco: "",
    endereco: "",
    numeroCasa: "",
    cep: "",
    informacoesAdicionais: "",
    complemento: "",
    bairro: "",
  });

  // Definindo as máscaras fora do renderizador condicional
  const cpfMask = useMask({ mask: "___.___.___-__", replacement: { _: /\d/ } });
  const dataMask = useMask({ mask: "__/__/____", replacement: { _: /\d/ } });
  const telefoneMask = useMask({
    mask: "(__)_____-____",
    replacement: { _: /\d/ },
  });
  const cepMask = useMask({ mask: "_____-___", replacement: { _: /\d/ } });
  const telefoneEmergenciaMask = useMask({
    mask: "(__)_____-____",
    replacement: { _: /\d/ },
  });

  logger.debug(
    "[NewCustomer] - renderizando componente de cadastro de cliente"
  );

  // Efeito para carregar a imagem do localStorage quando o componente montar
  useEffect(() => {
    const savedImage = localStorage.getItem("customerPhoto");
    if (savedImage) {
      setPreviewImage(savedImage);
      logger.debug(
        "[NewCustomer] - useEffect - Foto carregada do localStorage"
      );
    }
  }, []);

  // Função para iniciar a câmera
  const handleTakePhoto = async () => {
    logger.debug("[NewCustomer] - handleTakePhoto - Iniciando câmera");
    setShowCamera(true);

    try {
      // Aguardar um momento para garantir que o elemento de vídeo esteja renderizado
      setTimeout(async () => {
        if (videoRef.current) {
          try {
            const constraints = {
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user",
              },
            };

            logger.debug(
              "[NewCustomer] - handleTakePhoto - Solicitando acesso à câmera"
            );
            const stream = await navigator.mediaDevices.getUserMedia(
              constraints
            );

            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.onloadedmetadata = () => {
                if (videoRef.current) {
                  videoRef.current.play().catch((e) => {
                    logger.error(
                      "[NewCustomer] - handleTakePhoto - Erro ao reproduzir vídeo:",
                      e
                    );
                  });
                }
              };
              logger.debug(
                "[NewCustomer] - handleTakePhoto - Câmera inicializada com sucesso"
              );
            }
          } catch (err) {
            logger.error(
              "[NewCustomer] - handleTakePhoto - Erro ao acessar câmera:",
              err
            );
            setToastMessage(
              "Erro ao acessar a câmera. Verifique as permissões do navegador."
            );
            setToastType("error");
            setShowToast(true);
            setShowCamera(false);
          }
        }
      }, 100);
    } catch (error) {
      logger.error(
        "[NewCustomer] - handleTakePhoto - Erro ao acessar câmera:",
        error
      );
      setToastMessage("Erro ao acessar a câmera. Verifique as permissões.");
      setToastType("error");
      setShowToast(true);
      setShowCamera(false);
    }
  };

  // Função para capturar a foto
  const capturePhoto = () => {
    logger.debug("[NewCustomer] - capturePhoto - Capturando foto");

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Configurar o canvas para o tamanho do vídeo
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Desenhar o frame atual do vídeo no canvas
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Converter para base64
        const photoData = canvas.toDataURL("image/jpeg");
        setPreviewImage(photoData);

        // Salvar no localStorage
        localStorage.setItem("customerPhoto", photoData);

        // Parar o stream de vídeo
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }

        // Esconder a câmera
        setShowCamera(false);

        // Mostrar toast de sucesso
        setToastMessage("Foto capturada com sucesso");
        setToastType("success");
        setShowToast(true);
      }
    }
  };

  const handleConfirmPhoto = () => {
    logger.debug("[NewCustomer] - handleConfirmPhoto - Confirmando foto");
    setToastMessage("Foto salva com sucesso");
    setToastType("success");
    setShowToast(true);
  };

  const handleRetakePhoto = () => {
    logger.debug("[NewCustomer] - handleRetakePhoto - Removendo foto atual");
    setPreviewImage(null);
    localStorage.removeItem("customerPhoto");
  };

  // Função para fazer upload da imagem para o Supabase
  const uploadImageToSupabase = async (base64Image: string) => {
    try {
      logger.debug("[NewCustomer] - uploadImageToSupabase - Iniciando upload");

      // Verificar se o usuário está autenticado
      if (!session) {
        logger.error(
          "[NewCustomer] - uploadImageToSupabase - Usuário não autenticado"
        );
        throw new Error(
          "Você precisa estar autenticado para fazer upload de imagens"
        );
      }

      // Remover o prefixo do base64
      const base64Data = base64Image.split(",")[1];

      // Converter base64 para ArrayBuffer
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const arrayBuffer = bytes.buffer;

      // Nome do arquivo baseado no CPF do cliente
      const fileName = `${formData.cpf.replace(
        /[^\d]/g,
        ""
      )}_${Date.now()}.jpg`;

      // Upload para o Supabase - assumindo que o bucket 'customers' já existe
      logger.debug(
        "[NewCustomer] - uploadImageToSupabase - Enviando arquivo para o bucket 'customers'"
      );
      const { data, error } = await supabase.storage
        .from("customers")
        .upload(fileName, arrayBuffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) {
        logger.error(
          "[NewCustomer] - uploadImageToSupabase - Erro no upload:",
          error
        );
        throw error;
      }

      if (!data || !data.path) {
        logger.error(
          "[NewCustomer] - uploadImageToSupabase - Upload falhou: Nenhum dado retornado"
        );
        throw new Error("Upload falhou: Nenhum dado retornado do Supabase");
      }

      logger.debug(
        "[NewCustomer] - uploadImageToSupabase - Upload concluído:",
        data
      );
      return data.path;
    } catch (error) {
      logger.error(
        "[NewCustomer] - uploadImageToSupabase - Erro no upload:",
        error
      );
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      logger.debug(
        "[NewCustomer] - handleSubmit - Enviando formulário de cadastro",
        formData
      );

      // Função para converter data do formato DD/MM/YYYY para YYYY-MM-DD
      const formatDateForDB = (dateString: string) => {
        if (!dateString) return null;
        
        const parts = dateString.split('/');
        if (parts.length !== 3) return null;
        
        const day = parts[0];
        const month = parts[1];
        const year = parts[2];
        
        return `${year}-${month}-${day}`;
      };

      // Verificar se há uma foto para upload
      if (previewImage) {
        try {
          // Verificar se o cliente tem CPF (necessário para o nome do arquivo)
          if (!formData.cpf || formData.cpf.replace(/[^\d]/g, "").length < 11) {
            setToastMessage(
              "Por favor, preencha o CPF corretamente antes de enviar o formulário."
            );
            setToastType("error");
            setShowToast(true);
            setIsSubmitting(false);
            return;
          }

          const imagePath = await uploadImageToSupabase(previewImage);

          if (!imagePath) {
            throw new Error("Caminho da imagem não retornado pelo Supabase");
          }

          logger.debug(
            "[NewCustomer] - handleSubmit - Foto enviada com sucesso:",
            imagePath
          );

          try {
            // Salvar os dados do cliente na tabela 'customers'
            const { data: customerData, error: customerError } = await supabase
              .from("customers")
              .insert([
                {
                  customer_name: formData.nome,
                  surname: formData.sobrenome,
                  nickname: formData.nickname,
                  email: formData.email,
                  birth_date: formatDateForDB(formData.dataNascimento),
                  cpf: formData.cpf.replace(/[^\d]/g, ""),
                  phone: formData.telefone.replace(/[^\d]/g, ""),
                  emergency_name: formData.contatoEmergencia,
                  emergency_phone: formData.telefoneEmergencia.replace(
                    /[^\d]/g,
                    ""
                  ),
                  emergency_relationship: formData.parentesco,
                  address: `${formData.endereco}, ${formData.numeroCasa}, ${formData.bairro}, ${formData.cep.replace(/[^\d]/g, "")}${formData.complemento ? ', ' + formData.complemento : ''}`,
                  base_image_url: imagePath,
                },
              ])
              .select();

            if (customerError) {
              logger.error(
                "[NewCustomer] - handleSubmit - Erro ao salvar dados do cliente:",
                customerError
              );
              throw customerError;
            }

            logger.debug(
              "[NewCustomer] - handleSubmit - Cliente cadastrado com sucesso:",
              customerData
            );
          } catch (dbError) {
            logger.error(
              "[NewCustomer] - handleSubmit - Erro no banco de dados:",
              dbError
            );
            setToastMessage(
              "Erro ao salvar dados do cliente no banco. Tente novamente."
            );
            setToastType("error");
            setShowToast(true);
            throw dbError;
          }

          // Limpar a foto do localStorage após o envio bem-sucedido
          localStorage.removeItem("customerPhoto");

          setToastMessage("Cliente cadastrado com sucesso!");
          setToastType("success");
          setShowToast(true);

          // Resetar o formulário
          setFormData({
            nome: "",
            sobrenome: "",
            nickname: "",
            email: "",
            dataNascimento: "",
            cpf: "",
            telefone: "",
            contatoEmergencia: "",
            telefoneEmergencia: "",
            parentesco: "",
            endereco: "",
            numeroCasa: "",
            cep: "",
            informacoesAdicionais: "",
            complemento: "",
            bairro: "",
          });
          setPreviewImage(null);
          setCurrentStep(1);
        } catch (error) {
          logger.error(
            "[NewCustomer] - handleSubmit - Erro ao enviar foto:",
            error
          );
          setToastMessage("Erro ao enviar a foto. Tente novamente.");
          setToastType("error");
          setShowToast(true);
        }
      } else {
        // Caso não tenha foto
        setToastMessage("Cliente cadastrado com sucesso (sem foto)!");
        setToastType("success");
        setShowToast(true);

        // Resetar o formulário
        setFormData({
          nome: "",
          sobrenome: "",
          nickname: "",
          email: "",
          dataNascimento: "",
          cpf: "",
          telefone: "",
          contatoEmergencia: "",
          telefoneEmergencia: "",
          parentesco: "",
          endereco: "",
          numeroCasa: "",
          cep: "",
          informacoesAdicionais: "",
          complemento: "",
          bairro: "",
        });
        setCurrentStep(1);
      }
    } catch (error) {
      logger.error(
        "[NewCustomer] - handleSubmit - Erro ao cadastrar cliente:",
        error
      );
      setToastMessage("Erro ao cadastrar cliente. Tente novamente.");
      setToastType("error");
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    logger.debug("[NewCustomer] - handleDiscard - Descartando formulário");
    // Lógica para descartar o formulário
    if (window.confirm("Tem certeza que deseja descartar este cadastro?")) {
      setFormData({
        nome: "",
        sobrenome: "",
        nickname: "",
        email: "",
        dataNascimento: "",
        cpf: "",
        telefone: "",
        contatoEmergencia: "",
        telefoneEmergencia: "",
        parentesco: "",
        endereco: "",
        numeroCasa: "",
        cep: "",
        informacoesAdicionais: "",
        complemento: "",
        bairro: "",
      });
      setPreviewImage(null);
      localStorage.removeItem("customerPhoto");
      setCurrentStep(1);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    logger.debug(
      `[NewCustomer] - handleInputChange - Campo ${name} alterado para ${value}`
    );
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 2));
    logger.debug(
      `[NewCustomer] - nextStep - Avançando para etapa ${currentStep + 1}`
    );
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    logger.debug(
      `[NewCustomer] - prevStep - Retornando para etapa ${currentStep - 1}`
    );
  };

  // Estilo base para inputs
  const inputBaseStyle = `w-full p-3 rounded-md border transition-all duration-200 focus:outline-none ${
    isDarkMode
      ? "bg-neutral-700 border-neutral-600 text-white focus:border-emerald-400"
      : "bg-white border-gray-300 text-gray-900 focus:border-emerald-400"
  } focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50`;

  // Estilo base para labels
  const labelBaseStyle = `block text-sm font-medium mb-1.5 ${
    isDarkMode ? "text-neutral-300" : "text-gray-600"
  }`;

  // Estilo base para cards
  const cardBaseStyle = `p-6 rounded-lg shadow-md transition-all duration-300 ${
    isDarkMode
      ? "bg-neutral-800 hover:bg-neutral-750"
      : "bg-white hover:bg-gray-50"
  }`;

  // Estilo para botões primários
  const primaryButtonStyle = `py-2.5 px-6 rounded-md flex items-center justify-center font-medium transition-all duration-200 ${
    isDarkMode
      ? "bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700"
      : "bg-emerald-500 text-white hover:bg-emerald-400 active:bg-emerald-600"
  } shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50`;

  // Estilo para botões secundários
  const secondaryButtonStyle = `py-2.5 px-6 rounded-md flex items-center justify-center font-medium transition-all duration-200 ${
    isDarkMode
      ? "bg-neutral-700 text-white hover:bg-neutral-600 active:bg-neutral-800"
      : "bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400"
  } shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50`;

  return (
    <RootLayout>
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1
            className={`text-2xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-800"
            }`}
          >
            Cadastrar Cliente
          </h1>

          {/* Indicador de progresso */}
          <div className="flex items-center space-x-1">
            <div
              className={`h-2.5 w-16 rounded-full ${
                currentStep >= 1
                  ? "bg-emerald-500"
                  : isDarkMode
                  ? "bg-neutral-700"
                  : "bg-gray-300"
              }`}
            />
            <div
              className={`h-2.5 w-16 rounded-full ${
                currentStep >= 2
                  ? "bg-emerald-500"
                  : isDarkMode
                  ? "bg-neutral-700"
                  : "bg-gray-300"
              }`}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full">
          {/* Etapa 1: Foto e Informações Básicas */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Coluna da esquerda - Foto */}
              <div className={cardBaseStyle}>
                <div className="flex items-center mb-4">
                  <Camera
                    size={20}
                    className={`mr-2 ${
                      isDarkMode ? "text-emerald-400" : "text-emerald-500"
                    }`}
                  />
                  <h2
                    className={`text-lg font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-700"
                    }`}
                  >
                    Foto de cadastro
                  </h2>
                </div>

                <p
                  className={`text-sm mb-4 ${
                    isDarkMode ? "text-neutral-400" : "text-gray-500"
                  }`}
                >
                  Esta foto será usada para verificação facial e identificação
                  do cliente.
                </p>

                {showCamera ? (
                  <div className="mb-5">
                    <div className="aspect-square w-full relative overflow-hidden rounded-lg border-2 border-emerald-500">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute top-2 right-2">
                        <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex justify-center mt-4 space-x-4">
                      <button
                        type="button"
                        onClick={() => {
                          // Parar a câmera
                          if (videoRef.current && videoRef.current.srcObject) {
                            const stream = videoRef.current
                              .srcObject as MediaStream;
                            stream.getTracks().forEach((track) => track.stop());
                          }
                          setShowCamera(false);
                        }}
                        className={secondaryButtonStyle}
                      >
                        <X size={18} className="mr-2" />
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className={primaryButtonStyle}
                      >
                        <Camera size={18} className="mr-2" />
                        Capturar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`aspect-square w-full mb-5 flex items-center justify-center border-2 rounded-lg overflow-hidden ${
                      isDarkMode
                        ? previewImage
                          ? "border-emerald-500"
                          : "border-neutral-700 bg-neutral-800"
                        : previewImage
                        ? "border-emerald-400"
                        : "border-gray-200 bg-gray-100"
                    } transition-all duration-300 hover:border-emerald-400`}
                  >
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Foto do cliente"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <div
                          className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-3 ${
                            isDarkMode ? "bg-neutral-700" : "bg-gray-200"
                          }`}
                        >
                          <User
                            size={48}
                            className={`${
                              isDarkMode ? "text-neutral-500" : "text-gray-400"
                            }`}
                          />
                        </div>
                        <p
                          className={`${
                            isDarkMode ? "text-neutral-400" : "text-gray-500"
                          } font-medium`}
                        >
                          Nenhuma foto capturada
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            isDarkMode ? "text-neutral-500" : "text-gray-400"
                          }`}
                        >
                          Clique em "Tirar foto" para capturar
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {!showCamera && (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={
                        previewImage ? handleRetakePhoto : handleTakePhoto
                      }
                      className={secondaryButtonStyle}
                    >
                      <Camera size={18} className="mr-2" />
                      {previewImage ? "Tirar novamente" : "Tirar foto"}
                    </button>

                    {previewImage ? (
                      <button
                        type="button"
                        onClick={handleConfirmPhoto}
                        className={primaryButtonStyle}
                      >
                        <Check size={18} className="mr-2" />
                        Confirmar
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className={`${primaryButtonStyle} opacity-50 cursor-not-allowed`}
                      >
                        <Check size={18} className="mr-2" />
                        Confirmar
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Coluna da direita - Informações Básicas */}
              <div className={cardBaseStyle}>
                <div className="flex items-center mb-4">
                  <User
                    size={20}
                    className={`mr-2 ${
                      isDarkMode ? "text-emerald-400" : "text-emerald-500"
                    }`}
                  />
                  <h2
                    className={`text-lg font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-700"
                    }`}
                  >
                    Informações Pessoais
                  </h2>
                </div>

                <p
                  className={`text-sm mb-5 ${
                    isDarkMode ? "text-neutral-400" : "text-gray-500"
                  }`}
                >
                  Preencha os dados básicos do cliente para identificação.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label htmlFor="nome" className={labelBaseStyle}>
                      Nome
                    </label>
                    <div className="relative">
                      <input
                        id="nome"
                        name="nome"
                        type="text"
                        value={formData.nome}
                        onChange={handleInputChange}
                        placeholder="Nome"
                        className={inputBaseStyle}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="sobrenome" className={labelBaseStyle}>
                      Sobrenome
                    </label>
                    <div className="relative">
                      <input
                        id="sobrenome"
                        name="sobrenome"
                        type="text"
                        value={formData.sobrenome}
                        onChange={handleInputChange}
                        placeholder="Sobrenome"
                        className={inputBaseStyle}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label htmlFor="nickname" className={labelBaseStyle}>
                      Apelido
                    </label>
                    <div className="relative">
                      <input
                        id="nickname"
                        name="nickname"
                        type="text"
                        value={formData.nickname}
                        onChange={handleInputChange}
                        placeholder="Apelido (opcional)"
                        className={inputBaseStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="telefone" className={labelBaseStyle}>
                      Telefone
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone
                          size={16}
                          className={
                            isDarkMode ? "text-neutral-400" : "text-gray-400"
                          }
                        />
                      </div>
                      <input
                        id="telefone"
                        name="telefone"
                        ref={telefoneMask}
                        type="text"
                        value={formData.telefone}
                        onChange={handleInputChange}
                        placeholder="(00) 00000-0000"
                        className={`${inputBaseStyle} pl-10`}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label htmlFor="cpf" className={labelBaseStyle}>
                      CPF
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FileText
                          size={16}
                          className={
                            isDarkMode ? "text-neutral-400" : "text-gray-400"
                          }
                        />
                      </div>
                      <input
                        id="cpf"
                        name="cpf"
                        ref={cpfMask}
                        type="text"
                        value={formData.cpf}
                        onChange={handleInputChange}
                        placeholder="000.000.000-00"
                        className={`${inputBaseStyle} pl-10`}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="dataNascimento" className={labelBaseStyle}>
                      Data de Nascimento
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar
                          size={16}
                          className={
                            isDarkMode ? "text-neutral-400" : "text-gray-400"
                          }
                        />
                      </div>
                      <input
                        id="dataNascimento"
                        name="dataNascimento"
                        ref={dataMask}
                        type="text"
                        value={formData.dataNascimento}
                        onChange={handleInputChange}
                        placeholder="DD/MM/AAAA"
                        className={`${inputBaseStyle} pl-10`}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-5">
                  <label htmlFor="email" className={labelBaseStyle}>
                    E-mail
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail
                        size={16}
                        className={
                          isDarkMode ? "text-neutral-400" : "text-gray-400"
                        }
                      />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="seuemail@exemplo.com"
                      className={`${inputBaseStyle} pl-10`}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-8">
                  <button
                    type="button"
                    onClick={nextStep}
                    className={primaryButtonStyle}
                    disabled={isSubmitting}
                  >
                    Próximo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Etapa 2: Contato de Emergência e Endereço */}
          {currentStep === 2 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Coluna da esquerda - Contato de Emergência */}
                <div className={cardBaseStyle}>
                  <div className="flex items-center mb-4">
                    <Heart
                      size={20}
                      className={`mr-2 ${
                        isDarkMode ? "text-emerald-400" : "text-emerald-500"
                      }`}
                    />
                    <h2
                      className={`text-lg font-semibold ${
                        isDarkMode ? "text-white" : "text-gray-700"
                      }`}
                    >
                      Contato de Emergência
                    </h2>
                  </div>

                  <p
                    className={`text-sm mb-5 ${
                      isDarkMode ? "text-neutral-400" : "text-gray-500"
                    }`}
                  >
                    Informe um contato para casos de emergência.
                  </p>

                  <div className="mb-5">
                    <label
                      htmlFor="contatoEmergencia"
                      className={labelBaseStyle}
                    >
                      Nome do Contato
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User
                          size={16}
                          className={
                            isDarkMode ? "text-neutral-400" : "text-gray-400"
                          }
                        />
                      </div>
                      <input
                        id="contatoEmergencia"
                        name="contatoEmergencia"
                        type="text"
                        value={formData.contatoEmergencia}
                        onChange={handleInputChange}
                        placeholder="Nome completo"
                        className={`${inputBaseStyle} pl-10`}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-5">
                    <label
                      htmlFor="telefoneEmergencia"
                      className={labelBaseStyle}
                    >
                      Telefone
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone
                          size={16}
                          className={
                            isDarkMode ? "text-neutral-400" : "text-gray-400"
                          }
                        />
                      </div>
                      <input
                        id="telefoneEmergencia"
                        name="telefoneEmergencia"
                        ref={telefoneEmergenciaMask}
                        type="text"
                        value={formData.telefoneEmergencia}
                        onChange={handleInputChange}
                        placeholder="(00) 00000-0000"
                        className={`${inputBaseStyle} pl-10`}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-5">
                    <label htmlFor="parentesco" className={labelBaseStyle}>
                      Parentesco
                    </label>
                    <select
                      id="parentesco"
                      name="parentesco"
                      value={formData.parentesco}
                      onChange={handleInputChange as any}
                      className={inputBaseStyle}
                      required
                    >
                      <option value="">Selecione o parentesco</option>
                      <option value="Cônjuge">Cônjuge</option>
                      <option value="Pai/Mãe">Pai/Mãe</option>
                      <option value="Filho(a)">Filho(a)</option>
                      <option value="Irmão/Irmã">Irmão/Irmã</option>
                      <option value="Amigo(a)">Amigo(a)</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div
                    className={`p-4 rounded-lg mt-6 ${
                      isDarkMode ? "bg-neutral-700" : "bg-blue-50"
                    } flex items-start`}
                  >
                    <AlertCircle
                      size={18}
                      className={`mr-2 mt-0.5 ${
                        isDarkMode ? "text-blue-300" : "text-blue-500"
                      }`}
                    />
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-blue-300" : "text-blue-700"
                      }`}
                    >
                      O contato de emergência será notificado apenas em
                      situações críticas e com o consentimento do cliente.
                    </p>
                  </div>
                </div>

                {/* Coluna da direita - Endereço */}
                <div className={cardBaseStyle}>
                  <div className="flex items-center mb-4">
                    <Home
                      size={20}
                      className={`mr-2 ${
                        isDarkMode ? "text-emerald-400" : "text-emerald-500"
                      }`}
                    />
                    <h2
                      className={`text-lg font-semibold ${
                        isDarkMode ? "text-white" : "text-gray-700"
                      }`}
                    >
                      Endereço
                    </h2>
                  </div>

                  <p
                    className={`text-sm mb-5 ${
                      isDarkMode ? "text-neutral-400" : "text-gray-500"
                    }`}
                  >
                    Informe o endereço completo do cliente.
                  </p>

                  <div className="grid grid-cols-2 gap-5 mb-5">
                    <div className="col-span-2">
                      <label htmlFor="cep" className={labelBaseStyle}>
                        CEP
                      </label>
                      <div className="relative">
                        <input
                          id="cep"
                          name="cep"
                          ref={cepMask}
                          type="text"
                          value={formData.cep}
                          onChange={handleInputChange}
                          placeholder="00000-000"
                          className={inputBaseStyle}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-5 mb-5">
                    <div className="col-span-2">
                      <label htmlFor="endereco" className={labelBaseStyle}>
                        Endereço
                      </label>
                      <input
                        id="endereco"
                        name="endereco"
                        type="text"
                        value={formData.endereco}
                        onChange={handleInputChange}
                        placeholder="Rua, Avenida, etc."
                        className={inputBaseStyle}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="numeroCasa" className={labelBaseStyle}>
                        Número
                      </label>
                      <input
                        id="numeroCasa"
                        name="numeroCasa"
                        type="text"
                        value={formData.numeroCasa}
                        onChange={handleInputChange}
                        placeholder="Nº"
                        className={inputBaseStyle}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5 mb-5">
                    <div>
                      <label htmlFor="complemento" className={labelBaseStyle}>
                        Complemento
                      </label>
                      <input
                        id="complemento"
                        name="complemento"
                        type="text"
                        value={formData.complemento}
                        onChange={handleInputChange}
                        placeholder="Apto, Bloco, etc."
                        className={inputBaseStyle}
                      />
                    </div>
                    <div>
                      <label htmlFor="bairro" className={labelBaseStyle}>
                        Bairro
                      </label>
                      <input
                        id="bairro"
                        name="bairro"
                        type="text"
                        value={formData.bairro}
                        onChange={handleInputChange}
                        placeholder="Bairro"
                        className={inputBaseStyle}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-5">
                    <label
                      htmlFor="informacoesAdicionais"
                      className={labelBaseStyle}
                    >
                      Informações Adicionais
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                        <Info
                          size={16}
                          className={
                            isDarkMode ? "text-neutral-400" : "text-gray-400"
                          }
                        />
                      </div>
                      <textarea
                        id="informacoesAdicionais"
                        name="informacoesAdicionais"
                        value={formData.informacoesAdicionais}
                        onChange={handleInputChange}
                        placeholder="Informações relevantes sobre o endereço ou cliente"
                        className={`${inputBaseStyle} pl-10 min-h-[80px]`}
                        rows={3}
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de navegação */}
              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  className={secondaryButtonStyle}
                  disabled={isSubmitting}
                >
                  Voltar
                </button>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handleDiscard}
                    className={`${secondaryButtonStyle} border border-red-300 ${
                      isDarkMode
                        ? "bg-neutral-800 text-red-400 hover:bg-red-900 hover:text-red-300"
                        : "bg-white text-red-500 hover:bg-red-50"
                    }`}
                    disabled={isSubmitting}
                  >
                    <X size={18} className="mr-2" />
                    Descartar
                  </button>

                  <button
                    type="submit"
                    className={primaryButtonStyle}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                        Processando...
                      </>
                    ) : (
                      <>
                        <Check size={18} className="mr-2" />
                        Confirmar Cadastro
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </form>
      </div>

      {/* Toast para feedback */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </RootLayout>
  );
}
