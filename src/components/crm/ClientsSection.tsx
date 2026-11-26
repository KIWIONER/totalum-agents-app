"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  ClipboardList,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { CLIENT_SEGMENT_LABELS } from "@/lib/crm/domain";
import type { Client, ClientSegment, TaskWithClient } from "@/types/crm";

interface ClientsSectionProps {
  clients: readonly Client[];
  tasks: readonly TaskWithClient[];
  deletingClientId: string | null;
  onCreateClient: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (client: Client) => void;
}

const SEGMENT_BADGE_STYLES: Record<ClientSegment, string> = {
  enterprise: "border-indigo-200 bg-indigo-50 text-indigo-700",
  pyme: "border-emerald-200 bg-emerald-50 text-emerald-700",
  startup: "border-amber-200 bg-amber-50 text-amber-700",
};

export function ClientsSection({
  clients,
  tasks,
  deletingClientId,
  onCreateClient,
  onEditClient,
  onDeleteClient,
}: ClientsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const taskCountByClient = useMemo(() => {
    const counts = new Map<string, number>();
    for (const task of tasks) {
      if (task.client_id) {
        counts.set(task.client_id, (counts.get(task.client_id) ?? 0) + 1);
      }
    }
    return counts;
  }, [tasks]);

  const filteredClients = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) {
      return clients;
    }

    return clients.filter((client) => {
      const segmentLabel = CLIENT_SEGMENT_LABELS[client.segment];
      return [
        client.name,
        client.company,
        client.email,
        client.phone,
        segmentLabel,
      ].some((value) => value.toLowerCase().includes(normalized));
    });
  }, [clients, searchQuery]);

  if (clients.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Users className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-slate-900">
          Aún no tienes clientes registrados
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
          Crea tu primer cliente para asociar pedidos, tareas e importes desde
          el tablero operativo.
        </p>
        <button
          type="button"
          onClick={onCreateClient}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo cliente
        </button>
      </section>
    );
  }

  const hasSearch = searchQuery.trim().length > 0;

  return (
    <section aria-label="Listado de clientes" className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Buscar clientes"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar cliente por nombre, empresa, correo, teléfono o segmento..."
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pr-3.5 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="text-xs font-medium text-slate-500">
            Mostrando {filteredClients.length} de {clients.length}{" "}
            {clients.length === 1 ? "cliente" : "clientes"}
          </span>
          {hasSearch && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm font-medium text-slate-800">
            No se encontraron clientes para &ldquo;{searchQuery.trim()}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mt-3 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Mostrar todos los clientes
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredClients.map((client) => {
            const linkedTasks = taskCountByClient.get(client.id) ?? 0;
            const isDeleting = deletingClientId === client.id;

            return (
              <article
                key={client.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:border-slate-300"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-slate-900">
                        {client.name}
                      </h3>
                      {client.company && (
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500">
                          <Building2
                            className="h-3.5 w-3.5 shrink-0 text-slate-400"
                            aria-hidden="true"
                          />
                          <span className="truncate">{client.company}</span>
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${SEGMENT_BADGE_STYLES[client.segment]}`}
                    >
                      {CLIENT_SEGMENT_LABELS[client.segment]}
                    </span>
                  </div>

                  <dl className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail
                        className="h-3.5 w-3.5 shrink-0 text-slate-400"
                        aria-hidden="true"
                      />
                      <span className="truncate">
                        {client.email || "Sin correo registrado"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone
                        className="h-3.5 w-3.5 shrink-0 text-slate-400"
                        aria-hidden="true"
                      />
                      <span className="truncate">
                        {client.phone || "Sin teléfono registrado"}
                      </span>
                    </div>
                  </dl>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
                    {linkedTasks} {linkedTasks === 1 ? "tarea" : "tareas"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditClient(client)}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteClient(client)}
                      disabled={isDeleting}
                      aria-label={`Eliminar cliente ${client.name}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2
                          className="h-3.5 w-3.5 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
