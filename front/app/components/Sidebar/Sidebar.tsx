"use client"

import {
    Squares2X2Icon as DashboardOutline, // usual/dashboard
    CalendarIcon as SchedulingOutline, // usual/scheduling
    ClipboardDocumentCheckIcon  as CheckInOutline, // usual/check-in 
    CreditCardIcon as PaymentsOutline, // usual/payments
    UserCircleIcon as CustomersOutline, // usual/customers
    ClipboardDocumentListIcon as ServicesOutline, // usual/services

    UserGroupIcon as EmployeesOutline, // admin/employee-registration
    CurrencyDollarIcon as FinancialOutline, // admin/financial
    ChartBarIcon as ReportsOutline, // admin/reports
    IdentificationIcon as AdminOutline, // admin/admin

    Cog8ToothIcon as SettingsOutline, // preferences/settings
    QuestionMarkCircleIcon as HelpOutline, // preferences/help

} from "@heroicons/react/24/outline"

import {
    Squares2X2Icon as DashboardSolid, // usual/dashboard
    CalendarIcon as SchedulingSolid, // usual/scheduling
    ClipboardDocumentCheckIcon as CheckInSolid, // usual/check-in 
    CreditCardIcon as PaymentsSolid, // usual/payments
    UserCircleIcon as CustomersSolid, // usual/customers
    ClipboardDocumentListIcon as ServicesSolid, // usual/services

    UserGroupIcon as EmployeesSolid, // admin/employee-registration
    CurrencyDollarIcon as FinancialSolid, // admin/financial
    ChartBarIcon as ReportsSolid, // admin/reports
    IdentificationIcon as AdminSolid, // admin/admin

    Cog8ToothIcon as SettingsSolid, // preferences/settings
    QuestionMarkCircleIcon as HelpSolid, // preferences/help
} from "@heroicons/react/24/solid"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { MenuSection } from "./MenuSection"
import { MenuItem } from "./MenuItem"
import { DarkModeToggle } from "./DarkModeToggle"
import { UserProfile } from "./UserProfile"
import Image from "next/image"

interface SidebarProps {
    isDarkMode: boolean;
    onDarkModeChange: (isDarkMode: boolean) => void;
    isSidebarClosed: boolean;
}

// Rotas
const routeToMenuItem: { [key: string]: string } = {
    "/usual/dashboard": "Dashboard", // Página inicial com visões gerais
    "/usual/scheduling": "Agendamentos", // Consulta e registro de agendamentos
    "/usual/check-in ": "Marcar presença/Check-in", // Marcar presença (face-check-in)
    "/usual/payments": "Pagamentos", // Consulta e registro de pagamentos
    "/usual/customers": "Clientes", // Consulta e registro de clientes
    "/usual/services": "Serviços", // Consulta e registro de serviços

    "/admin/employee-registration": "Colaboradores", // Cadastro e consulta de colaboradores
    "/admin/financial": "Financeiro", // Controle financeiro
    "/admin/reports": "Relatórios", // Relatórios e análises
    "/admin/admin": "Administração", // Administração do sistema

    "/settings": "Configurações", // Configurações do sistema
    "/help": "Ajuda", // Ajuda e suporte
}

// Seções
const routeToSection: { [key: string]: string } = {
    "/usual": "USUAL",
    "/admin": "ADMINISTRAÇÃO",
    "/preferences": "PREFERÊNCIAS",
}

export function Sidebar({
    isDarkMode,
    onDarkModeChange,
    isSidebarClosed,
    }: SidebarProps) {
        const pathname = usePathname();
        const [activeItem, setActiveItem] = useState("");
        const [openSection, setOpenSection] = useState("");

        // Configuração inicial do item ativo
        useEffect(() => {
            // Passando o item da rota ativa
            const menuItem = routeToMenuItem[pathname] || "";
            setActiveItem(menuItem);

            // Encontrando a seção correspondente
            const section = Object.entries(routeToSection).find(([route]) =>
                pathname.startsWith(route)
            );
            if (section) {
                setOpenSection(section[1]);
            }
        }, [pathname]);

        const handleSectionToggle = (section: string) => {
            setOpenSection(openSection === section ? "" : section);
        };

        const getIcon = (
            OutlineIcon: React.ElementType,
            SolidIcon: React.ElementType,
            itemName: string,
        ) => {
            // Verifica se o item está ativo para retornar o ícone sólido ou outline
            const isItemActive = activeItem === itemName || 
                                 activeItem === routeToMenuItem[pathname] && 
                                 routeToMenuItem[pathname].toLowerCase() === itemName.toLowerCase();
            
            return isItemActive ? (
                <SolidIcon className="w-6 h-6" />
            ) : (
                <OutlineIcon className="w-6 h-6" />
            );
        };

        return (
            <div 
                className="flex h-screen bg-gray-50 dark:bg-neutral-800" // Definindo a altura como vh or 100%
                >
                <div
                    className={`flex flex-col transition-all durantion-300 border-r-2 ${
                        isDarkMode ? "bg-neutral-900 border-neutral-700" : "bg-slate-100 border-slate-200" } ${
                        isSidebarClosed ? "w-16" : "w-64" // Largura do sidebar
                    }`}
                >
                    {/* Logo */}
                    <div className={`flex items-center transition-all duration-300 py-4 ${
                        isSidebarClosed ? "justify-center" : "px-4 justify-start"}`}
                    >
                        <Image 
                            src={
                                isDarkMode 
                                    ? isSidebarClosed 
                                        ? "/logo_dark_colapse.svg" 
                                        : "/logo_dark.svg"
                                    : isSidebarClosed 
                                        ? "/logo_light_colapse.svg" 
                                        : "/logo_light.svg"
                            }
                            alt="Logo"
                            width={isSidebarClosed ? 40 : 120} // Largura do logo
                            height={isSidebarClosed ? 40 : 120} // Altura do logo
                        />
                    </div>

                    {/* Menu  Topo*/}
                    <div className={`flex-1 ${isSidebarClosed ? "" : "overflow-y-auto"} py-2`}>
                        {/* USUAL*/}
                        <MenuSection
                            title="USUAL"
                            isDark={isDarkMode}
                            isSidebarClosed={isSidebarClosed}
                            isOpen={openSection === "USUAL"}
                            onToggle={() => handleSectionToggle("USUAL")}
                        >
                            <MenuItem 
                                icon={getIcon(DashboardOutline, DashboardSolid, "Dashboard")}
                                text="Dashboard"
                                isActive={activeItem === "Dashboard" || pathname === "/usual/dashboard"}
                                isDark={isDarkMode}
                                isSidebarClosed={isSidebarClosed}
                                onClick={() => setActiveItem("Dashboard")}
                                href="/usual/dashboard"
                            />
                            <MenuItem 
                                icon={getIcon(SchedulingOutline, SchedulingSolid, "Agendamentos")}
                                text="Agendamentos"
                                isActive={activeItem === "Agendamentos" || pathname === "/usual/scheduling"}
                                isDark={isDarkMode}
                                isSidebarClosed={isSidebarClosed}
                                onClick={() => setActiveItem("Agendamentos")}
                                href="/usual/scheduling"
                            />
                            <MenuItem 
                                icon={getIcon(CheckInOutline, CheckInSolid, "Marcar presença/Check-in")}
                                text="Marcar presença"
                                isActive={activeItem === "Marcar presença/Check-in" || pathname === "/usual/check-in"}
                                isDark={isDarkMode}
                                isSidebarClosed={isSidebarClosed}
                                onClick={() => setActiveItem("Marcar presença/Check-in")}
                                href="/usual/check-in"
                            />
                            <MenuItem 
                                icon={getIcon(PaymentsOutline, PaymentsSolid, "Pagamentos")}
                                text="Pagamentos"
                                isActive={activeItem === "Pagamentos" || pathname === "/usual/payments"}
                                isDark={isDarkMode}
                                isSidebarClosed={isSidebarClosed}
                                onClick={() => setActiveItem("Pagamentos")}
                                href="/usual/payments"
                            />
                            <MenuItem 
                                icon={getIcon(CustomersOutline, CustomersSolid, "Clientes")}
                                text="Clientes"
                                isActive={activeItem === "Clientes" || pathname === "/usual/customers"}
                                isDark={isDarkMode}
                                isSidebarClosed={isSidebarClosed}
                                onClick={() => setActiveItem("Clientes")}
                                href="/usual/customers"
                            />
                            <MenuItem 
                                icon={getIcon(ServicesOutline, ServicesSolid, "Serviços")}
                                text="Serviços"
                                isActive={activeItem === "Serviços" || pathname === "/usual/services"}
                                isDark={isDarkMode}
                                isSidebarClosed={isSidebarClosed}
                                onClick={() => setActiveItem("Serviços")}
                                href="/usual/services"
                            />
                        </MenuSection>

                        {/* ADMINSTRAÇÃO */}
                        <MenuSection
                            title="ADMIN"
                            isDark={isDarkMode}
                            isSidebarClosed={isSidebarClosed}
                            isOpen={openSection === "ADMIN"}
                            onToggle={() => handleSectionToggle("ADMIN")}
                        >
                            <MenuItem 
                                icon={getIcon(EmployeesOutline, EmployeesSolid, "Colaboradores")}
                                text="Colaboradores"
                                isActive={activeItem === "Colaboradores" || pathname === "/admin/employee-registration"}
                                isDark={isDarkMode}
                                isSidebarClosed={isSidebarClosed}
                                onClick={() => setActiveItem("Colaboradores")}
                                href="/admin/employee-registration"
                            />
                            <MenuItem 
                                icon={getIcon(FinancialOutline, FinancialSolid, "Financeiro")}
                                text="Financeiro"
                                isActive={activeItem === "Financeiro" || pathname === "/admin/financial"}
                                isDark={isDarkMode}
                                isSidebarClosed={isSidebarClosed}
                                onClick={() => setActiveItem("Financeiro")}
                                href="/admin/financial"
                            />
                            <MenuItem 
                                icon={getIcon(ReportsOutline, ReportsSolid, "Relatórios")}
                                text="Relatórios"
                                isActive={activeItem === "Relatórios" || pathname === "/admin/reports"}
                                isDark={isDarkMode}
                                isSidebarClosed={isSidebarClosed}
                                onClick={() => setActiveItem("Relatórios")}
                                href="/admin/reports"
                            />
                            <MenuItem 
                                icon={getIcon(AdminOutline, AdminSolid, "Administração")}
                                text="Administração"
                                isActive={activeItem === "Administração" || pathname === "/admin/admin"}
                                isDark={isDarkMode}
                                isSidebarClosed={isSidebarClosed}
                                onClick={() => setActiveItem("Administração")}
                                href="/admin/admin"
                            />
                        </MenuSection>
                    </div>

                    {/* Menu Bottom */}
                    {/* PREFERÊNCIAS */}
                    <div className={`border-t ${isDarkMode ? "border-neutral-700" : "border-gray-200"} pt-2`}>
                        <MenuSection
                            title="PREFERÊNCIAS"
                            isDark={isDarkMode}
                            isSidebarClosed={isSidebarClosed}
                            alwaysOpen={true}
                        >
                            <MenuItem 
                                icon={getIcon(SettingsOutline, SettingsSolid, "Configurações")}
                                text="Configurações"
                                isActive={activeItem === "Configurações" || pathname === "/settings"}
                                isDark={isDarkMode}
                                isSidebarClosed={isSidebarClosed}
                                onClick={() => setActiveItem("Configurações")}
                                href="/settings"
                            />
                            <DarkModeToggle
                                isDark={isDarkMode}
                                onToggle={onDarkModeChange}
                                isSidebarClosed={isSidebarClosed}
                            />
                            <MenuItem 
                                icon={getIcon(HelpOutline, HelpSolid, "Ajuda")}
                                text="Ajuda"
                                isActive={activeItem === "Ajuda" || pathname === "/help"}
                                isDark={isDarkMode}
                                isSidebarClosed={isSidebarClosed}
                                onClick={() => setActiveItem("Ajuda")}
                                href="/help"
                            />
                            <UserProfile isDark={isDarkMode} isCollapsed={isSidebarClosed} />
                        </MenuSection>
                    </div>
                </div>
            </div>
        )
    }