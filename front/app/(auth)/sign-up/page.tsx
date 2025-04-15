"use client";

import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, UserPlus, AlertCircle } from "lucide-react";
import logger from "../../../lib/logger";
import { useTheme } from "../../contexts/ThemeContext";

export default function SignUp() {
  const { signUp } = useAuth();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  logger.debug("[SignUp] - Renderizando página de cadastro");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validar senha
    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      setIsLoading(false);
      return;
    }

    // Validar força da senha
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    logger.debug(`[SignUp] - Tentativa de cadastro para: ${email}`);

    try {
      const { error } = await signUp(email, password);

      if (error) {
        logger.error("[SignUp] - Erro no cadastro:", error);
        setError(error.message || "Erro ao criar conta. Tente novamente.");
        return;
      }

      logger.debug("[SignUp] - Cadastro bem-sucedido, redirecionando...");
      router.push("/usual/dashboard");
    } catch (err) {
      logger.error("[SignUp] - Erro inesperado:", err);
      setError("Ocorreu um erro inesperado. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const containerClass = isDarkMode
    ? "bg-gray-900 text-white"
    : "bg-gray-100 text-gray-900";

  const inputClass = isDarkMode
    ? "bg-gray-800 border-gray-700 text-white focus:border-emerald-500"
    : "bg-white border-gray-300 text-gray-900 focus:border-emerald-500";

  const buttonClass =
    "w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center";

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${containerClass}`}
    >
      <div className="max-w-md w-full p-8 rounded-lg shadow-lg bg-opacity-80 backdrop-blur-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Syncro</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Crie sua conta para começar
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

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium mb-1"
            >
              Confirmar Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-500" />
              </div>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                Cadastrando...
              </span>
            ) : (
              <span className="flex items-center">
                <UserPlus size={18} className="mr-2" />
                Criar Conta
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
