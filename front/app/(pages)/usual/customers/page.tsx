"use client";

import { useTheme } from "../../../contexts/ThemeContext";
import { useState, useRef } from "react";
import RootLayout from "../../../components/RootLayout";
import { PlusIcon } from "@heroicons/react/24/outline";
import NewCustomerModal from "./components/NewCustomerModal";
import Link from "next/link";

export default function CustomersPage() {
    const { isDarkMode } = useTheme();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const refreshCustomers = useRef<() => void>(() => {});

    // Atualizar clientes após o cadastro
    const handleRefresh = () => {
        refreshCustomers.current();
    };

    return (
        <RootLayout>
            <div className="flex justify-between items-center mb-6">
                <h1
                className={`text-2xl font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-800"
                }`}
                >
                    Clientes
                </h1>
                <Link
                    href="/usual/customers/new"
                    className={`inline-flex items-center px-4 py-2 font-medium rounded-md transition-colors duration-200 ${
                        isDarkMode
                        ? "bg-slate-200 text-neutral-900 hover:bg-slate-400"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Adicionar Cliente
                </Link>

                {/*implementar grid
                <CustomersGrid />
                */}

                {/* Modal para adicionar cliente */}
                {isModalOpen && (
                    <NewCustomerModal
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={() =>{
                            setIsModalOpen(false);
                            handleRefresh();
                        }}
                        isDarkMode={isDarkMode}
                    />
                )}
            </div>
        </RootLayout>
    );
}
