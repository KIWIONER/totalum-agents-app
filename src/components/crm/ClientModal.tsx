"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";
import { createClientAction, updateClientAction } from "@/app/actions/crm";
import {
  CLIENT_SEGMENT_LABELS,
  CLIENT_SEGMENT_ORDER,
} from "@/lib/crm/domain";
import type { Client, ClientSegment } from "@/types/crm";

interface ClientModalProps {
  client: Client | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export function ClientModal({
  client,
  onClose,
  onSaved,
}: ClientModalProps) {
  const [name, setName] = useState(client?.name ?? "");
  const [company, setCompany] = useState(client?.company ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [segment, setSegment] = useState<ClientSegment>(
    client?.segment ?? "pyme"
  );
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
      try {
        const payload = {
          name,
          company,
          email,
          phone,
          segment,
        };

        const result = client
          ? await updateClientAction(client.id, payload)
          : await createClientAction(payload);

        if (!result.ok) {
          setErrorMessage(result.error);
          setFieldErrors(result.fieldErrors ?? {});
          return;
        }

        onSaved(
          result.message ??
            (client ? "Cliente actualizado." : "Cliente creado correctamente.")
        );
        onClose();
      } catch (error: unknown) {
        console.error("[crm] Error de red al guardar cliente:", error);
        setErrorMessage(
          "Error de conexión con el servidor. Inténtalo de nuevo."
        );
      }
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
        aria-labelledby="client-modal-title"
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2
              id="client-modal-title"
              className="text-lg font-semibold text-slate-900"
            >
              {client ? "Editar cliente" : "Nuevo cliente"}
            </h2>
            <p className="text-xs text-slate-500">
              Registra los datos principales de contacto y segmento comercial.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Cerrar modal de cliente"
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
              htmlFor="client-name"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Nombre completo *
            </label>
            <input
              id="client-name"
              type="text"
              required
              disabled={isPending}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Marta Soler"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="client-company"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Empresa
              </label>
              <input
                id="client-company"
                type="text"
                disabled={isPending}
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="Ej. Iberia Logística"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="client-segment"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Segmento
              </label>
              <select
                id="client-segment"
                disabled={isPending}
                value={segment}
                onChange={(event) =>
                  setSegment(event.target.value as ClientSegment)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              >
                {CLIENT_SEGMENT_ORDER.map((item) => (
                  <option key={item} value={item}>
                    {CLIENT_SEGMENT_LABELS[item]}
                  </option>
                ))}
              </select>
              {fieldErrors.segment && (
                <p className="mt-1 text-xs text-rose-600">
                  {fieldErrors.segment}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="client-email"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Correo electrónico
              </label>
              <input
                id="client-email"
                type="email"
                disabled={isPending}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="contacto@empresa.es"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-rose-600">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="client-phone"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Teléfono
              </label>
              <input
                id="client-phone"
                type="tel"
                disabled={isPending}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+34 600 000 000"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
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
              {client ? "Guardar cambios" : "Crear cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
