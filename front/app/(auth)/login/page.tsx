"use client";

import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";
import logger from "../../../lib/logger";
import { useTheme } from "../../contexts/ThemeContext";
import Image from "next/image";

export default function Login() {
  const { signIn } = useAuth();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  logger.debug("[Login] - Renderizando página de login");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    logger.debug(`[Login] - Tentativa de login para: ${email}`);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        logger.error("[Login] - Erro no login:", error);
        setError("Credenciais inválidas. Verifique seu email e senha.");
        return;
      }

      logger.debug("[Login] - Login bem-sucedido, redirecionando...");
      router.push("/usual/dashboard");
    } catch (err) {
      logger.error("[Login] - Erro inesperado:", err);
      setError("Ocorreu um erro inesperado. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const containerClass = isDarkMode
    ? "bg-neutral-900 text-slate-100"
    : "bg-slate-100 text-neutral-900";

  const inputClass = isDarkMode
    ? "bg-neutral-800 border-neutral-700 text-slate-100 focus:border-emerald-500"
    : "bg-slate-100 border-slate-300 text-neutral-900 focus:border-emerald-500";

  const buttonClass =
    "w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center";

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${containerClass}`}
    >
      <div className="max-w-md w-full p-8 rounded-lg shadow-lg bg-opacity-80 backdrop-blur-sm">
        <div className="text-center mb-8">
          <Image
            src="/logo_light.svg"
            alt="Logo"
            width={200}
            height={100}
            className="mx-auto mb-4"
          />
          <p className="text-gray-500 dark:text-gray-400">
            Faça login para acessar sua conta
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md flex items-center">
            <AlertCircle size={18} className="mr-2" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-500" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`${inputClass} pl-10 w-full py-2 px-4 rounded-md border focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
            >
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-500" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`${inputClass} pl-10 w-full py-2 px-4 rounded-md border focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`${buttonClass} ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Entrando...
              </span>
            ) : (
              <span className="flex items-center">
                <LogIn size={18} className="mr-2" />
                Entrar
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm">
            Não tem uma conta?{" "}
            <Link
              href="/sign-up"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
