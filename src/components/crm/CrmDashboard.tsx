"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Database,
  Kanban,
  Layers,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import {
  deleteClientAction,
  deleteTaskAction,
  seedDemoDataAction,
  updateTaskStatusAction,
} from "@/app/actions/crm";
import {
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_ORDER,
  TASK_STATUS_LABELS,
  TASK_STATUS_ORDER,
  calculateCrmKpis,
  filterTasks,
  formatCurrencyEur,
  getNextTaskStatus,
} from "@/lib/crm/domain";
import type {
  Client,
  TaskFilters,
  TaskPriority,
  TaskStatus,
  TaskWithClient,
} from "@/types/crm";
import { ClientModal } from "./ClientModal";
import { ClientsSection } from "./ClientsSection";
import { KpiCards } from "./KpiCards";
import { TaskModal } from "./TaskModal";

type ActiveTab = "board" | "clients";

interface CrmDashboardProps {
  initialClients: Client[];
  initialTasks: TaskWithClient[];
  userEmail: string;
  initialError: string | null;
}

const PRIORITY_BADGE_STYLES: Record<TaskPriority, string> = {
  alta: "border-rose-200 bg-rose-50 text-rose-700",
  media: "border-amber-200 bg-amber-50 text-amber-700",
  baja: "border-slate-200 bg-slate-100 text-slate-600",
};

const COLUMN_ACCENT_STYLES: Record<TaskStatus, string> = {
  pendiente: "bg-amber-500",
  en_progreso: "bg-sky-500",
  completado: "bg-emerald-500",
};

export function CrmDashboard({
  initialClients,
  initialTasks,
  userEmail,
  initialError,
}: CrmDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("board");
  const [filters, setFilters] = useState<TaskFilters>({
    query: "",
    status: "all",
    priority: "all",
  });

  const [banner, setBanner] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(
    initialError ? { type: "error", text: initialError } : null
  );

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithClient | null>(null);

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  const [isSeeding, startSeedTransition] = useTransition();
  const [isSigningOut, startSignOutTransition] = useTransition();

  const kpis = useMemo(
    () => calculateCrmKpis(initialClients, initialTasks),
    [initialClients, initialTasks]
  );

  const filteredTasks = useMemo(
    () => filterTasks(initialTasks, filters),
    [initialTasks, filters]
  );

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, TaskWithClient[]> = {
      pendiente: [],
      en_progreso: [],
      completado: [],
    };
    for (const task of filteredTasks) {
      grouped[task.status].push(task);
    }
    return grouped;
  }, [filteredTasks]);

  const hasActiveFilters =
    filters.query.trim().length > 0 ||
    filters.status !== "all" ||
    filters.priority !== "all";

  const isEmptyWorkspace =
    initialClients.length === 0 && initialTasks.length === 0;

  function openNewTaskModal() {
    setEditingTask(null);
    setTaskModalOpen(true);
  }

  function openEditTaskModal(task: TaskWithClient) {
    setEditingTask(task);
    setTaskModalOpen(true);
  }

  function openNewClientModal() {
    setEditingClient(null);
    setClientModalOpen(true);
  }

  function openEditClientModal(client: Client) {
    setEditingClient(client);
    setClientModalOpen(true);
  }

  function handleMutationSuccess(message: string) {
    setBanner({ type: "success", text: message });
    router.refresh();
  }

  async function handleCycleTaskStatus(task: TaskWithClient) {
    if (busyTaskId) {
      return;
    }

    const nextStatus = getNextTaskStatus(task.status);
    setBusyTaskId(task.id);
    setBanner(null);

    try {
      const result = await updateTaskStatusAction(task.id, nextStatus);
      if (!result.ok) {
        setBanner({ type: "error", text: result.error });
        return;
      }

      handleMutationSuccess(
        `Tarea movida a "${TASK_STATUS_LABELS[nextStatus]}".`
      );
    } finally {
      setBusyTaskId(null);
    }
  }

  async function handleDeleteTask(task: TaskWithClient) {
    if (busyTaskId) {
      return;
    }

    const confirmed = window.confirm(
      `¿Eliminar la tarea "${task.title}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) {
      return;
    }

    setBusyTaskId(task.id);
    setBanner(null);

    try {
      const result = await deleteTaskAction(task.id);
      if (!result.ok) {
        setBanner({ type: "error", text: result.error });
        return;
      }

      handleMutationSuccess(result.message ?? "Tarea eliminada.");
    } finally {
      setBusyTaskId(null);
    }
  }

  async function handleDeleteClient(client: Client) {
    if (deletingClientId) {
      return;
    }

    const confirmed = window.confirm(
      `¿Eliminar el cliente "${client.name}"? Sus tareas asociadas se conservarán sin cliente asignado.`
    );
    if (!confirmed) {
      return;
    }

    setDeletingClientId(client.id);
    setBanner(null);

    try {
      const result = await deleteClientAction(client.id);
      if (!result.ok) {
        setBanner({ type: "error", text: result.error });
        return;
      }

      handleMutationSuccess(result.message ?? "Cliente eliminado.");
    } finally {
      setDeletingClientId(null);
    }
  }

  function handleSeedDemo() {
    if (isSeeding) {
      return;
    }

    setBanner(null);
    startSeedTransition(async () => {
      const result = await seedDemoDataAction();
      if (!result.ok) {
        setBanner({ type: "error", text: result.error });
        return;
      }

      handleMutationSuccess(
        result.message ?? "Datos de ejemplo cargados correctamente."
      );
    });
  }

  function handleSignOut() {
    startSignOutTransition(async () => {
      await signOutAction();
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Layers className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-semibold tracking-tight text-slate-900">
                  Totalum Flow
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <Database className="h-3 w-3" aria-hidden="true" />
                  Conectado a Supabase
                </span>
              </div>
              <p className="text-xs text-slate-500">{userEmail}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isEmptyWorkspace && (
              <button
                type="button"
                onClick={handleSeedDemo}
                disabled={isSeeding}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-60"
              >
                {isSeeding ? (
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                Cargar datos de ejemplo
              </button>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {isSigningOut ? (
                <Loader2
                  className="h-3.5 w-3.5 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {banner && (
          <div
            role={banner.type === "error" ? "alert" : "status"}
            className={`flex items-start justify-between gap-3 rounded-2xl border p-3.5 text-sm ${
              banner.type === "error"
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {banner.type === "error" ? (
                <AlertCircle
                  className="mt-0.5 h-4 w-4 shrink-0 text-rose-600"
                  aria-hidden="true"
                />
              ) : (
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
              )}
              <span>{banner.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setBanner(null)}
              aria-label="Cerrar aviso"
              className="rounded-lg p-1 opacity-70 transition hover:opacity-100"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        <KpiCards kpis={kpis} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            aria-label="Vistas del CRM"
            className="inline-flex w-full rounded-xl border border-slate-200 bg-white p-1 sm:w-auto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "board"}
              onClick={() => setActiveTab("board")}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition sm:flex-initial ${
                activeTab === "board"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Kanban className="h-4 w-4" aria-hidden="true" />
              Tablero de tareas
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  activeTab === "board"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {initialTasks.length}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "clients"}
              onClick={() => setActiveTab("clients")}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition sm:flex-initial ${
                activeTab === "clients"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Clientes
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  activeTab === "clients"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {initialClients.length}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openNewClientModal}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-2xs transition hover:bg-slate-50 sm:flex-initial"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nuevo cliente
            </button>
            <button
              type="button"
              onClick={openNewTaskModal}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 sm:flex-initial"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nueva tarea
            </button>
          </div>
        </div>

        {activeTab === "board" ? (
          <div className="space-y-5">
            <section
              aria-label="Filtros del tablero"
              className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs md:grid-cols-12"
            >
              <div className="relative md:col-span-6">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  aria-label="Buscar tareas o clientes"
                  value={filters.query}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      query: event.target.value,
                    }))
                  }
                  placeholder="Buscar por título, descripción, cliente o empresa..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 pr-3.5 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  aria-label="Filtrar por estado"
                  value={filters.status}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: event.target.value as TaskFilters["status"],
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                >
                  <option value="all">Todos los estados</option>
                  {TASK_STATUS_ORDER.map((status) => (
                    <option key={status} value={status}>
                      {TASK_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 md:col-span-3">
                <select
                  aria-label="Filtrar por prioridad"
                  value={filters.priority}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      priority: event.target.value as TaskFilters["priority"],
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                >
                  <option value="all">Todas las prioridades</option>
                  {TASK_PRIORITY_ORDER.map((priority) => (
                    <option key={priority} value={priority}>
                      Prioridad {TASK_PRIORITY_LABELS[priority].toLowerCase()}
                    </option>
                  ))}
                </select>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() =>
                      setFilters({ query: "", status: "all", priority: "all" })
                    }
                    className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </section>

            {isEmptyWorkspace && (
              <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-6 shadow-2xs sm:p-8">
                <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      Espacio listo para empezar
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Tu CRM está vacío todavía
                    </h2>
                    <p className="max-w-xl text-sm text-slate-600">
                      Carga un conjunto realista de 4 clientes y 6 pedidos/tareas
                      en 1 clic para explorar el tablero, o crea tus propios
                      registros desde cero.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSeedDemo}
                    disabled={isSeeding}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {isSeeding ? (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                    )}
                    Cargar datos de ejemplo
                  </button>
                </div>
              </section>
            )}

            <section
              aria-label="Tablero Kanban de tareas y pedidos"
              className="grid grid-cols-1 gap-4 lg:grid-cols-3"
            >
              {TASK_STATUS_ORDER.map((status) => {
                const columnTasks = tasksByStatus[status];

                return (
                  <div
                    key={status}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-slate-100/70 p-3.5"
                  >
                    <div className="mb-3 flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${COLUMN_ACCENT_STYLES[status]}`}
                          aria-hidden="true"
                        />
                        <h2 className="text-sm font-semibold text-slate-900">
                          {TASK_STATUS_LABELS[status]}
                        </h2>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600 shadow-2xs">
                        {columnTasks.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {columnTasks.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center text-xs text-slate-500">
                          {hasActiveFilters
                            ? "Sin tareas que coincidan con los filtros."
                            : `No hay tareas en "${TASK_STATUS_LABELS[status]}".`}
                        </div>
                      ) : (
                        columnTasks.map((task) => {
                          const isBusy = busyTaskId === task.id;
                          const nextStatus = getNextTaskStatus(task.status);

                          return (
                            <article
                              key={task.id}
                              className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition hover:border-slate-300"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-sm font-semibold text-slate-900">
                                  {task.title}
                                </h3>
                                <span
                                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_BADGE_STYLES[task.priority]}`}
                                >
                                  {TASK_PRIORITY_LABELS[task.priority]}
                                </span>
                              </div>

                              {task.description && (
                                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
                                  {task.description}
                                </p>
                              )}

                              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
                                {task.client && (
                                  <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                                    <Building2
                                      className="h-3.5 w-3.5 text-slate-400"
                                      aria-hidden="true"
                                    />
                                    {task.client.name}
                                    {task.client.company
                                      ? ` (${task.client.company})`
                                      : ""}
                                  </span>
                                )}
                                {task.due_date && (
                                  <span className="inline-flex items-center gap-1">
                                    <Calendar
                                      className="h-3.5 w-3.5 text-slate-400"
                                      aria-hidden="true"
                                    />
                                    {task.due_date}
                                  </span>
                                )}
                              </div>

                              <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3">
                                <span className="text-sm font-semibold text-slate-900">
                                  {formatCurrencyEur(task.amount_eur)}
                                </span>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleCycleTaskStatus(task)}
                                    disabled={isBusy}
                                    title={`Mover a ${TASK_STATUS_LABELS[nextStatus]}`}
                                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
                                  >
                                    {isBusy ? (
                                      <Loader2
                                        className="h-3.5 w-3.5 animate-spin"
                                        aria-hidden="true"
                                      />
                                    ) : (
                                      <ArrowRight
                                        className="h-3.5 w-3.5"
                                        aria-hidden="true"
                                      />
                                    )}
                                    {TASK_STATUS_LABELS[nextStatus]}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => openEditTaskModal(task)}
                                    disabled={isBusy}
                                    aria-label={`Editar tarea ${task.title}`}
                                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
                                  >
                                    <Pencil
                                      className="h-3.5 w-3.5"
                                      aria-hidden="true"
                                    />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTask(task)}
                                    disabled={isBusy}
                                    aria-label={`Eliminar tarea ${task.title}`}
                                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                                  >
                                    <Trash2
                                      className="h-3.5 w-3.5"
                                      aria-hidden="true"
                                    />
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          </div>
        ) : (
          <ClientsSection
            clients={initialClients}
            tasks={initialTasks}
            deletingClientId={deletingClientId}
            onCreateClient={openNewClientModal}
            onEditClient={openEditClientModal}
            onDeleteClient={handleDeleteClient}
          />
        )}
      </main>

      {taskModalOpen && (
        <TaskModal
          key={editingTask?.id ?? "new-task"}
          task={editingTask}
          clients={initialClients}
          onClose={() => setTaskModalOpen(false)}
          onSaved={handleMutationSuccess}
        />
      )}

      {clientModalOpen && (
        <ClientModal
          key={editingClient?.id ?? "new-client"}
          client={editingClient}
          onClose={() => setClientModalOpen(false)}
          onSaved={handleMutationSuccess}
        />
      )}
    </div>
  );
}
