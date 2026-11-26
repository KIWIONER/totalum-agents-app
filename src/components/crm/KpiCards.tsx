import {
  CheckCircle2,
  Clock,
  Euro,
  Loader,
  Users,
} from "lucide-react";
import { formatCurrencyEur } from "@/lib/crm/domain";
import type { CrmKpis } from "@/types/crm";

interface KpiCardsProps {
  kpis: CrmKpis;
}

export function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <section
      aria-label="Indicadores clave del CRM"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">
            Clientes activos
          </span>
          <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
            <Users className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
          {kpis.totalClients}
        </p>
        <p className="mt-1 text-xs text-slate-500">Cartera registrada</p>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Pendientes</span>
          <span className="rounded-lg bg-amber-50 p-2 text-amber-600">
            <Clock className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
          {kpis.pendingTasks}
        </p>
        <p className="mt-1 text-xs text-slate-500">Por iniciar</p>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">
            En progreso
          </span>
          <span className="rounded-lg bg-sky-50 p-2 text-sky-600">
            <Loader className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
          {kpis.inProgressTasks}
        </p>
        <p className="mt-1 text-xs text-slate-500">En ejecución activa</p>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">
            Completadas
          </span>
          <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <p className="text-2xl font-semibold tracking-tight text-slate-900">
            {kpis.completedTasks}
          </p>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            {kpis.completionRate}%
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          De {kpis.totalTasks} tareas totales
        </p>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">
            Valor total
          </span>
          <span className="rounded-lg bg-slate-100 p-2 text-slate-700">
            <Euro className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
          {formatCurrencyEur(kpis.totalAmountEur)}
        </p>
        <p className="mt-1 text-xs text-slate-500">Importe acumulado</p>
      </article>
    </section>
  );
}
