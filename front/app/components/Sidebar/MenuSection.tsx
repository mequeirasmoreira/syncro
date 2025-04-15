"use client";

import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import logger from "../../../lib/logger";

interface MenuSectionProps {
    title: string;
    children: React.ReactNode;
    isDark: boolean;
    isSidebarClosed: boolean;
    isOpen?: boolean;
    onToggle?: () => void;
    alwaysOpen?: boolean;
    className?: string;
}

export function MenuSection({
    title,
    children,
    isDark,
    isSidebarClosed,
    isOpen = true,
    onToggle,
    alwaysOpen = false,
    className = "",
}: MenuSectionProps) {
    const showChevron = !alwaysOpen && (!isSidebarClosed || !isOpen);
    const contentVisible = alwaysOpen || isOpen;

    // Log para debug
    logger.debug(`[MenuSection] - renderização - título: ${title}, isOpen: ${isOpen}, isDark: ${isDark}`);

    return (
        <div className={`mt-4 ${className}`}>
        <button
            onClick={alwaysOpen ? undefined : onToggle}
            className={`flex items-center w-full text-xs font-semibold tracking-wider ${
            isSidebarClosed 
                ? "justify-center px-2" 
                : "justify-between px-4"
            } py-2 ${
            isDark ? "text-neutral-400" : "text-gray-500"
            } ${!alwaysOpen && "hover:text-gray-700 cursor-pointer"}`}
        >
            {!isSidebarClosed && title}
            {showChevron && (
            <div className={isSidebarClosed ? "flex items-center justify-center w-8 h-8" : ""}>
                {isOpen ? (
                <ChevronDownIcon className="w-4 h-4" />
                ) : (
                <ChevronUpIcon className="w-4 h-4" />
                )}
            </div>
            )}
        </button>
        <div
            className={`space-y-1 overflow-hidden transition-all duration-200 ${
            contentVisible ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
        >
            {children}
        </div>
        </div>
    );
}
