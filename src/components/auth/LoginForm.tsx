"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";
import {
  signInAction,
  signInDemoAction,
  signUpAction,
} from "@/app/actions/auth";

type AuthMode = "signin" | "signup";

interface LoginFormProps {
  isConfigured: boolean;
  demoEmail: string | null;
}

export function LoginForm({ isConfigured, demoEmail }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDemoPending, setIsDemoPending] = useState(false);

  const isBusy = isPending || isDemoPending;

  function handleModeChange(nextMode: AuthMode) {
    setMode(nextMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isConfigured || isBusy) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      try {
        if (mode === "signin") {
          const result = await signInAction({ email, password });
          if (!result.ok) {
            setErrorMessage(result.error);
            return;
          }
          router.push("/");
          router.refresh();
          return;
        }

        const result = await signUpAction({ email, password });
        if (!result.ok) {
          setErrorMessage(result.error);
          return;
        }

        if (result.requiresConfirmation) {
          setSuccessMessage(
            "Cuenta creada. Revisa tu bandeja de entrada para confirmar tu correo antes de iniciar sesión."
          );
          setPassword("");
        } else {
          router.push("/");
          router.refresh();
        }
      } catch (error: unknown) {
        console.error("[login] Error de red en autenticación:", error);
        setErrorMessage(
          "Error de conexión con el servidor. Inténtalo de nuevo."
        );
      }
    });
  }

  async function handleDemoLogin() {
    if (!isConfigured || !demoEmail || isBusy) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsDemoPending(true);

    try {
      const result = await signInDemoAction();
      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }
      router.push("/");
      router.refresh();
    } catch (error: unknown) {
      console.error("[login] Error de red en acceso demo:", error);
      setErrorMessage(
        "Error de conexión con el servidor. Inténtalo de nuevo."
      );
    } finally {
      setIsDemoPending(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Totalum Flow CRM
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
          {mode === "signin"
            ? "Accede a tu espacio operativo"
            : "Crea tu cuenta"}
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Gestiona clientes, pedidos y tareas con persistencia segura en tiempo
          real.
        </p>
      </div>

      {!isConfigured && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
            aria-hidden="true"
          />
          <div>
            <p className="font-medium">Falta configurar Supabase</p>
            <p className="mt-0.5 text-xs text-amber-800">
              Define <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
              y{" "}
              <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
              en <code className="font-mono">.env.local</code> o Vercel.
            </p>
          </div>
        </div>
      )}

      {demoEmail ? (
        <div className="mb-6 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 to-slate-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Acceso rápido de evaluación
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                Usuario demo:{" "}
                <span className="font-medium text-slate-900">{demoEmail}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={!isConfigured || isBusy}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDemoPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Iniciando sesión demo...
              </>
            ) : (
              <>
                Entrar con usuario demo
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
          Acceso demo no configurado en este entorno. Inicia sesión o crea una
          cuenta con tu correo.
        </div>
      )}

      <div
        role="tablist"
        aria-label="Modo de acceso"
        className="mb-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signin"}
          onClick={() => handleModeChange("signin")}
          className={`rounded-lg py-2 text-sm font-medium transition ${
            mode === "signin"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          onClick={() => handleModeChange("signup")}
          className={`rounded-lg py-2 text-sm font-medium transition ${
            mode === "signup"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-rose-600"
            aria-hidden="true"
          />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          <CheckCircle2
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
            aria-hidden="true"
          />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="auth-email"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Correo electrónico
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={!isConfigured || isBusy}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nombre@empresa.es"
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-3.5 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none disabled:bg-slate-50"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="auth-password"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Contraseña
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              required
              minLength={mode === "signup" ? 6 : 1}
              disabled={!isConfigured || isBusy}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={
                mode === "signup" ? "Mínimo 6 caracteres" : "••••••••"
              }
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-3.5 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none disabled:bg-slate-50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!isConfigured || isBusy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {mode === "signin" ? "Entrando..." : "Creando cuenta..."}
            </>
          ) : mode === "signin" ? (
            "Iniciar sesión"
          ) : (
            "Crear cuenta"
          )}
        </button>
      </form>
    </div>
  );
}
