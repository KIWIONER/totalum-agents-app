"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";
import { createTaskAction, updateTaskAction } from "@/app/actions/crm";
import {
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_ORDER,
  TASK_STATUS_LABELS,
  TASK_STATUS_ORDER,
} from "@/lib/crm/domain";
import type {
  Client,
  TaskPriority,
  TaskStatus,
  TaskWithClient,
} from "@/types/crm";

interface TaskModalProps {
  task: TaskWithClient | null;
  clients: readonly Client[];
  onClose: () => void;
  onSaved: (message: string) => void;
}

export function TaskModal({
  task,
  clients,
  onClose,
  onSaved,
}: TaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [clientId, setClientId] = useState(task?.client_id ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "pendiente");
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? "media"
  );
  const [amountEur, setAmountEur] = useState(
    task ? String(task.amount_eur) : "0"
  );
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPending, onClose]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) {
      return;
    }

    setErrorMessage(null);
    setFieldErrors({});

    startTransition(async () => {
      const payload = {
        title,
        description,
        client_id: clientId || null,
        status,
        priority,
        amount_eur: amountEur === "" ? 0 : Number(amountEur),
        due_date: dueDate || null,
      };

      const result = task
        ? await updateTaskAction(task.id, payload)
        : await createTaskAction(payload);

      if (!result.ok) {
        setErrorMessage(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      onSaved(
        result.message ??
          (task ? "Tarea actualizada." : "Tarea creada correctamente.")
      );
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isPending) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2
              id="task-modal-title"
              className="text-lg font-semibold text-slate-900"
            >
              {task ? "Editar tarea / pedido" : "Nueva tarea / pedido"}
            </h2>
            <p className="text-xs text-slate-500">
              Define estado, prioridad, importe y cliente asociado.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Cerrar modal de tarea"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-rose-600"
              aria-hidden="true"
            />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="task-title"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Título *
            </label>
            <input
              id="task-title"
              type="text"
              required
              disabled={isPending}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ej. Renovación licencia anual"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
            {fieldErrors.title && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.title}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="task-description"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Descripción
            </label>
            <textarea
              id="task-description"
              rows={3}
              disabled={isPending}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Detalles clave del pedido, alcance o próximos pasos..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="task-client"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Cliente asociado
            </label>
            <select
              id="task-client"
              disabled={isPending}
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            >
              <option value="">Sin cliente asignado</option>
              {clients.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.company ? ` — ${item.company}` : ""}
                </option>
              ))}
            </select>
            {fieldErrors.client_id && (
              <p className="mt-1 text-xs text-rose-600">
                {fieldErrors.client_id}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="task-status"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Estado
              </label>
              <select
                id="task-status"
                disabled={isPending}
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as TaskStatus)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              >
                {TASK_STATUS_ORDER.map((item) => (
                  <option key={item} value={item}>
                    {TASK_STATUS_LABELS[item]}
                  </option>
                ))}
              </select>
              {fieldErrors.status && (
                <p className="mt-1 text-xs text-rose-600">
                  {fieldErrors.status}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="task-priority"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Prioridad
              </label>
              <select
                id="task-priority"
                disabled={isPending}
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as TaskPriority)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              >
                {TASK_PRIORITY_ORDER.map((item) => (
                  <option key={item} value={item}>
                    {TASK_PRIORITY_LABELS[item]}
                  </option>
                ))}
              </select>
              {fieldErrors.priority && (
                <p className="mt-1 text-xs text-rose-600">
                  {fieldErrors.priority}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="task-amount"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Importe (EUR)
              </label>
              <input
                id="task-amount"
                type="number"
                min="0"
                step="0.01"
                disabled={isPending}
                value={amountEur}
                onChange={(event) => setAmountEur(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
              {fieldErrors.amount_eur && (
                <p className="mt-1 text-xs text-rose-600">
                  {fieldErrors.amount_eur}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="task-due-date"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Fecha límite
              </label>
              <input
                id="task-due-date"
                type="date"
                disabled={isPending}
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
              {fieldErrors.due_date && (
                <p className="mt-1 text-xs text-rose-600">
                  {fieldErrors.due_date}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {isPending && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {task ? "Guardar cambios" : "Crear tarea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
