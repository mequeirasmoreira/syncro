"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { XMarkIcon } from "@heroicons/react/24/outline";

import logger from "../../../../../lib/logger";

import { Customer } from "@/types";
import CustomerService from "@/services/CustomerService";
import Webcam from "react-webcam";

interface NewCustomerModalProps {
    onClose: () => void;
    onSuccess: () => void;
    isDarkMode?: boolean;
}

export default function NewCustomerModal({
    onClose,
    onSuccess,
    isDarkMode,
}: NewCustomerModalProps) {
    const [customer_name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [nickname, setNickname] = useState("");
    const [birth_date, setBirth_date] = useState("");
    const [cpf, setCPF] = useState("");
    const [baseImage, setBaseImage] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const webcamRef = useRef<Webcam>(null);
    const [fotoBase, setFotoBase] = useState<string | null>(null);

    const capturarFoto = () => {
        const imagem = webcamRef.current?.getScreenshot();
        if (imagem) {
            setFotoBase(imagem);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validação básica
        if (!customer_name) {
        setError("Por favor, preencha o nome do cliente.");
        return;
        }

        // Verificar se a foto foi capturada
        if (!fotoBase) {
          setError("Por favor, capture uma foto para o cadastro.");
          return;
        }

        setLoading(true);
        setError("");

        try {
        logger.debug(
            `[NewCustomerModal] - handleSubmit - Cadastrando Cliente: ${customer_name}`
        );

        // Criar objeto da carteira
        const novoCliente: Customer = {
            customer_name,
            surname,
            nickname,
            birth_date,
            cpf,
            base_image_url: fotoBase, // Usar a foto capturada pela webcam
        };

        // Usar o serviço para cadastrar o cliente
        await CustomerService.createCustomer(novoCliente);

        // Limpa o formulário
        setName("");
        setSurname("");
        setNickname("");
        setBirth_date("");
        setCPF("");
        setBaseImage("");
        setFotoBase(null);

        // Notifica sucesso e fecha o modal
        onSuccess();
        onClose();
        } catch (err) {
        logger.error(
            `[NewCustomerModal] - handleSubmit - Erro ao criar cadastro:`,
            err
        );
        setError("Erro ao criar cadastro. Por favor, tente novamente.");
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Overlay */}
        <div className="fixed inset-0 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
            <div
            className={`relative w-full max-w-md rounded-lg shadow-lg ${
                isDarkMode ? "bg-neutral-800" : "bg-white"
            }`}
            >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3
                className={`text-lg font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                }`}
                >
                Novo cliente
                </h3>
                <button
                onClick={onClose}
                className={`rounded-md p-1 hover:bg-gray-100 ${
                    isDarkMode
                    ? "hover:bg-neutral-700 text-gray-400"
                    : "text-gray-500"
                }`}
                >
                <XMarkIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4">
                {error && (
                <div
                    className={`mb-4 p-3 rounded-md text-sm font-medium ${
                    isDarkMode
                        ? "bg-red-900/70 text-red-100 border border-red-800"
                        : "bg-red-100 text-red-700 border border-red-200"
                    }`}
                >
                    {error}
                </div>
                )}
                <div className="space-y-4">
                    {/* Nome */}
                    <div>
                        <label
                        htmlFor="customer_name"
                        className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                        >
                        Nome *
                        </label>
                        <input
                        type="text"
                        id="customer_name"
                        value={customer_name}
                        onChange={(e) => setName(e.target.value)}
                        className={`w-full rounded-md border px-3 py-2 text-sm ${
                            isDarkMode
                            ? "bg-neutral-700 border-neutral-600 text-white placeholder-gray-300"
                            : "border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                        placeholder="Nome do cliente"
                        required
                        />
                    </div>

                    {/* Sobrenome */}
                    <div>
                        <label
                        htmlFor="surname"
                        className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                        >
                        Sobrenome
                        </label>
                        <input
                        type="text"
                        id="surname"
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        className={`w-full rounded-md border px-3 py-2 text-sm ${
                            isDarkMode
                            ? "bg-neutral-700 border-neutral-600 text-white placeholder-gray-300"
                            : "border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                        placeholder="Sobrenome do cliente"
                        />
                    </div>

                    {/* Apelido */}
                    <div>
                        <label
                        htmlFor="nickname"
                        className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                        >
                        Apelido
                        </label>
                        <input
                        type="text"
                        id="nickname"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className={`w-full rounded-md border px-3 py-2 text-sm ${
                            isDarkMode
                            ? "bg-neutral-700 border-neutral-600 text-white placeholder-gray-300"
                            : "border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                        placeholder="Apelido do cliente"
                        />
                    </div>

                    {/* CPF */}
                    <div>
                        <label
                        htmlFor="cpf"
                        className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                        >
                        CPF
                        </label>
                        <input
                        type="text"
                        id="cpf"
                        value={cpf}
                        onChange={(e) => setCPF(e.target.value)}
                        className={`w-full rounded-md border px-3 py-2 text-sm ${
                            isDarkMode
                            ? "bg-neutral-700 border-neutral-600 text-white placeholder-gray-300"
                            : "border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                        placeholder="000.000.000-00"
                        />
                    </div>

                    {/* Data de Nascimento */}
                    <div>
                        <label
                        htmlFor="birth_date"
                        className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                        >
                        Data de Nascimento
                        </label>
                        <input
                        type="date"
                        id="birth_date"
                        value={birth_date}
                        onChange={(e) => setBirth_date(e.target.value)}
                        className={`w-full rounded-md border px-3 py-2 text-sm ${
                            isDarkMode
                            ? "bg-neutral-700 border-neutral-600 text-white"
                            : "border-gray-300 text-gray-900"
                        }`}
                        />
                    </div>

                    {/* Imagem Base */}
                    <div className="mt-4">
                        <label
                            className={`block text-sm font-medium mb-1 ${
                                isDarkMode ? "text-gray-200" : "text-gray-700"
                            }`}
                        >
                            Foto do Cliente
                        </label>
                        <Webcam
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{
                                width: 300,
                                height: 300,
                                facingMode: "user",
                            }}
                            className={`w-full h-auto rounded-md border mb-4 ${
                                isDarkMode ? "border-neutral-600" : "border-gray-300"
                            }`}
                        />
                        <button
                            type="button"
                            className={`mt-2 px-4 py-2 rounded-md font-medium ${
                                isDarkMode
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }`}
                            onClick={capturarFoto}
                        >
                            Capturar Foto do Cadastro
                        </button>

                        {fotoBase && (
                            <div className="mt-4">
                                <p className={`text-sm font-medium mb-2 ${
                                    isDarkMode ? "text-gray-200" : "text-gray-700"
                                }`}>
                                    Foto Capturada:
                                </p>
                                <Image 
                                    src={fotoBase} 
                                    alt="Foto do cadastro" 
                                    className={`rounded object-cover border ${
                                        isDarkMode ? "border-neutral-600" : "border-gray-300"
                                    }`}
                                    width={192}
                                    height={192}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Botões de ação */}
                <div className="mt-6 flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onClose}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                    isDarkMode
                        ? "text-white bg-neutral-700 hover:bg-neutral-600"
                        : "text-gray-700 bg-gray-200 hover:bg-gray-300"
                    }`}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className={`px-4 py-2 text-sm font-medium rounded-md text-white ${
                    loading
                        ? "bg-emerald-400 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                >
                    {loading ? "Salvando..." : "Salvar Cliente"}
                </button>
                </div>
            </form>
            </div>
        </div>
        </div>
    );
}
