import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AlertTriangle, ArrowRight, Layers } from "lucide-react";
import { CrmDashboard } from "@/components/crm/CrmDashboard";
import { getCrmDashboardData } from "@/lib/crm/queries";

async function DashboardContent() {
  await connection();

  const { configured, user, clients, tasks, error } =
    await getCrmDashboardData();

  if (!configured) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            Totalum Flow — Configuración inicial
          </div>

          <div className="mt-4 flex items-start gap-3">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
              aria-hidden="true"
            />
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                Conecta tu proyecto de Supabase
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                Para activar la autenticación y la persistencia real del
                Mini-CRM, crea un archivo{" "}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
                  .env.local
                </code>{" "}
                (o define las variables en Vercel) con:
              </p>
            </div>
          </div>

          <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-100">
            {`NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_DEMO_EMAIL=demo@ejemplo.com
NEXT_PUBLIC_DEMO_PASSWORD=tu-password-demo`}
          </pre>

          <p className="mt-3 text-xs text-slate-500">
            Recuerda ejecutar{" "}
            <code className="font-mono text-slate-700">supabase/schema.sql</code>{" "}
            en el SQL Editor de tu proyecto Supabase y reiniciar el servidor.
          </p>

          <div className="mt-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700"
            >
              Ir a la pantalla de acceso
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    redirect("/login");
  }

  return (
    <CrmDashboard
      initialClients={clients}
      initialTasks={tasks}
      userEmail={user.email}
      initialError={error}
    />
  );
}

function DashboardFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-sm text-slate-500">
      Cargando espacio operativo de Totalum Flow...
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  );
}
