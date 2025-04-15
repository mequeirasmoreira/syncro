"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface SidebarContextType {
    isSidebarClosed: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (isOpen: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isSidebarClosed, setisSidebarClosed] = useState(false);
    
    useEffect(() => {
        // Recupera o estado salvo do localStorage
        const savedState = localStorage.getItem("sidebarOpen");
        if (savedState !== null) {
            setisSidebarClosed(savedState === "true");
        }
        
        // Adiciona log para debug
        console.debug("[SidebarProvider] - useEffect - Estado inicial da sidebar:", savedState === "true" ? "aberto" : "fechado");
    }, []);

    const toggleSidebar = () => {
        const newState = !isSidebarClosed;
        setisSidebarClosed(newState);
        localStorage.setItem("sidebarOpen", String(newState));
        
        // Adiciona log para debug
        console.debug("[SidebarProvider] - toggleSidebar - Novo estado:", newState ? "aberto" : "fechado");
    };

    const setSidebarOpen = (isOpen: boolean) => {
        setisSidebarClosed(isOpen);
        localStorage.setItem("sidebarOpen", String(isOpen));
        
        // Adiciona log para debug
        console.debug("[SidebarProvider] - setSidebarOpen - Novo estado:", isOpen ? "aberto" : "fechado");
    };

    return (
        <SidebarContext.Provider value={{ isSidebarClosed, toggleSidebar, setSidebarOpen }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error("useSidebar deve ser usado dentro de um SidebarProvider");
    }
    return context;
}
