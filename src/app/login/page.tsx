import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CheckCircle2, Layers, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import {
  getDemoCredentials,
  isSupabaseConfigured,
} from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function LoginContent() {
  await connection();

  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        redirect("/");
      }
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        "digest" in error &&
        typeof (error as { digest?: unknown }).digest === "string" &&
        (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
      ) {
        throw error;
      }
      console.error("[login] Error comprobando sesión actual:", error);
    }
  }

  const demo = getDemoCredentials();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            <Layers className="h-3.5 w-3.5 text-indigo-600" aria-hidden="true" />
            Mini-CRM Operativo · Next.js + Supabase
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Controla clientes, pedidos y entregas desde un único panel.
          </h2>

          <p className="max-w-lg text-base leading-relaxed text-slate-600">
            Totalum Flow centraliza tu cartera de clientes y el flujo de trabajo
            diario con estados en tiempo real, métricas de facturación y
            seguridad por usuario mediante Row Level Security.
          </p>

          <ul className="space-y-3 pt-2 text-sm text-slate-700">
            <li className="flex items-start gap-2.5">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600"
                aria-hidden="true"
              />
              <span>
                CRUD completo de clientes y tareas/pedidos con validaciones en
                servidor.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600"
                aria-hidden="true"
              />
              <span>
                Tablero operativo con filtros combinados, KPIs y cambio rápido
                de estado.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <ShieldCheck
                className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600"
                aria-hidden="true"
              />
              <span>
                Aislamiento por cuenta con Supabase Auth SSR y políticas RLS.
              </span>
            </li>
          </ul>
        </section>

        <section className="flex justify-center lg:justify-end">
          <LoginForm
            isConfigured={configured}
            demoEmail={demo?.email ?? null}
          />
        </section>
      </div>
    </main>
  );
}

function LoginFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-sm text-slate-500">
      Cargando acceso...
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
