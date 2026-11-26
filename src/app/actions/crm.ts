"use server";

import { revalidatePath } from "next/cache";
import {
  TASK_STATUS_ORDER,
  validateClientInput,
  validateTaskInput,
} from "@/lib/crm/domain";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Client, TaskItem, TaskStatus } from "@/types/crm";

export type ActionResult<T = null> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

interface RawTaskRow extends Omit<TaskItem, "amount_eur"> {
  amount_eur: number | string;
}

function normalizeTaskRow(row: RawTaskRow): TaskItem {
  const numericAmount = Number(row.amount_eur);
  return {
    ...row,
    amount_eur: Number.isFinite(numericAmount) ? numericAmount : 0,
  };
}

function toRecord(input: unknown): Record<string, unknown> {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  return {};
}

function isValidId(id: unknown): id is string {
  return typeof id === "string" && id.trim().length > 0;
}

async function requireAuthenticatedClient() {
  if (!isSupabaseConfigured()) {
    return {
      ok: false as const,
      error:
        "Supabase no está configurado. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false as const,
      error: "Tu sesión ha expirado. Inicia sesión de nuevo para continuar.",
    };
  }

  return {
    ok: true as const,
    supabase,
    userId: user.id,
  };
}

export async function createClientAction(
  input: unknown
): Promise<ActionResult<Client>> {
  const auth = await requireAuthenticatedClient();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const validation = validateClientInput(toRecord(input));
  if (!validation.ok) {
    const firstError =
      Object.values(validation.errors)[0] ?? "Revisa los datos del cliente.";
    return {
      ok: false,
      error: firstError,
      fieldErrors: validation.errors,
    };
  }

  const { data, error } = await auth.supabase
    .from("crm_clients")
    .insert({
      user_id: auth.userId,
      ...validation.data,
    })
    .select("*")
    .single<Client>();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "No se pudo crear el cliente.",
    };
  }

  revalidatePath("/");
  return {
    ok: true,
    data,
    message: "Cliente creado correctamente.",
  };
}

export async function updateClientAction(
  id: string,
  input: unknown
): Promise<ActionResult<Client>> {
  if (!isValidId(id)) {
    return { ok: false, error: "Identificador de cliente no válido." };
  }

  const auth = await requireAuthenticatedClient();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const validation = validateClientInput(toRecord(input));
  if (!validation.ok) {
    const firstError =
      Object.values(validation.errors)[0] ?? "Revisa los datos del cliente.";
    return {
      ok: false,
      error: firstError,
      fieldErrors: validation.errors,
    };
  }

  const { data, error } = await auth.supabase
    .from("crm_clients")
    .update(validation.data)
    .eq("id", id.trim())
    .eq("user_id", auth.userId)
    .select("*")
    .single<Client>();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "No se pudo actualizar el cliente.",
    };
  }

  revalidatePath("/");
  return {
    ok: true,
    data,
    message: "Cliente actualizado correctamente.",
  };
}

export async function deleteClientAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  if (!isValidId(id)) {
    return { ok: false, error: "Identificador de cliente no válido." };
  }

  const auth = await requireAuthenticatedClient();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const cleanId = id.trim();
  const { error } = await auth.supabase
    .from("crm_clients")
    .delete()
    .eq("id", cleanId)
    .eq("user_id", auth.userId);

  if (error) {
    return {
      ok: false,
      error: error.message || "No se pudo eliminar el cliente.",
    };
  }

  revalidatePath("/");
  return {
    ok: true,
    data: { id: cleanId },
    message: "Cliente eliminado correctamente.",
  };
}

export async function createTaskAction(
  input: unknown
): Promise<ActionResult<TaskItem>> {
  const auth = await requireAuthenticatedClient();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const validation = validateTaskInput(toRecord(input));
  if (!validation.ok) {
    const firstError =
      Object.values(validation.errors)[0] ?? "Revisa los datos de la tarea.";
    return {
      ok: false,
      error: firstError,
      fieldErrors: validation.errors,
    };
  }

  const { data, error } = await auth.supabase
    .from("crm_tasks")
    .insert({
      user_id: auth.userId,
      ...validation.data,
    })
    .select("*")
    .single<RawTaskRow>();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "No se pudo crear la tarea.",
    };
  }

  revalidatePath("/");
  return {
    ok: true,
    data: normalizeTaskRow(data),
    message: "Tarea creada correctamente.",
  };
}

export async function updateTaskAction(
  id: string,
  input: unknown
): Promise<ActionResult<TaskItem>> {
  if (!isValidId(id)) {
    return { ok: false, error: "Identificador de tarea no válido." };
  }

  const auth = await requireAuthenticatedClient();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const validation = validateTaskInput(toRecord(input));
  if (!validation.ok) {
    const firstError =
      Object.values(validation.errors)[0] ?? "Revisa los datos de la tarea.";
    return {
      ok: false,
      error: firstError,
      fieldErrors: validation.errors,
    };
  }

  const { data, error } = await auth.supabase
    .from("crm_tasks")
    .update({
      ...validation.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id.trim())
    .eq("user_id", auth.userId)
    .select("*")
    .single<RawTaskRow>();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "No se pudo actualizar la tarea.",
    };
  }

  revalidatePath("/");
  return {
    ok: true,
    data: normalizeTaskRow(data),
    message: "Tarea actualizada correctamente.",
  };
}

export async function updateTaskStatusAction(
  id: string,
  status: TaskStatus
): Promise<ActionResult<TaskItem>> {
  if (!isValidId(id)) {
    return { ok: false, error: "Identificador de tarea no válido." };
  }

  if (!TASK_STATUS_ORDER.includes(status)) {
    return { ok: false, error: "El estado seleccionado no es válido." };
  }

  const auth = await requireAuthenticatedClient();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { data, error } = await auth.supabase
    .from("crm_tasks")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id.trim())
    .eq("user_id", auth.userId)
    .select("*")
    .single<RawTaskRow>();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "No se pudo actualizar el estado de la tarea.",
    };
  }

  revalidatePath("/");
  return {
    ok: true,
    data: normalizeTaskRow(data),
    message: "Estado actualizado correctamente.",
  };
}

export async function deleteTaskAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  if (!isValidId(id)) {
    return { ok: false, error: "Identificador de tarea no válido." };
  }

  const auth = await requireAuthenticatedClient();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const cleanId = id.trim();
  const { error } = await auth.supabase
    .from("crm_tasks")
    .delete()
    .eq("id", cleanId)
    .eq("user_id", auth.userId);

  if (error) {
    return {
      ok: false,
      error: error.message || "No se pudo eliminar la tarea.",
    };
  }

  revalidatePath("/");
  return {
    ok: true,
    data: { id: cleanId },
    message: "Tarea eliminada correctamente.",
  };
}

function isoDaysFromNow(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function seedDemoDataAction(): Promise<
  ActionResult<{ clientsCreated: number; tasksCreated: number }>
> {
  const auth = await requireAuthenticatedClient();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const [clientsCheck, tasksCheck] = await Promise.all([
    auth.supabase
      .from("crm_clients")
      .select("id", { count: "exact", head: true })
      .eq("user_id", auth.userId),
    auth.supabase
      .from("crm_tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", auth.userId),
  ]);

  if (clientsCheck.error || tasksCheck.error) {
    return {
      ok: false,
      error:
        clientsCheck.error?.message ??
        tasksCheck.error?.message ??
        "No se pudo comprobar el estado actual de los datos.",
    };
  }

  if ((clientsCheck.count ?? 0) > 0 || (tasksCheck.count ?? 0) > 0) {
    return {
      ok: true,
      data: { clientsCreated: 0, tasksCreated: 0 },
      message:
        "Tu espacio ya contiene registros. No se han duplicado datos demo.",
    };
  }

  const demoClients = [
    {
      user_id: auth.userId,
      name: "Marta Soler",
      company: "Iberia Logística S.A.",
      email: "marta.soler@iberia-logistica.es",
      phone: "+34 910 245 810",
      segment: "enterprise" as const,
    },
    {
      user_id: auth.userId,
      name: "Javier Mendoza",
      company: "Clínicas Norte Salud",
      email: "jmendoza@nortesalud.es",
      phone: "+34 944 182 390",
      segment: "pyme" as const,
    },
    {
      user_id: auth.userId,
      name: "Lucía Navarro",
      company: "Vértice AI Labs",
      email: "lucia@vertice-ai.io",
      phone: "+34 612 884 210",
      segment: "startup" as const,
    },
    {
      user_id: auth.userId,
      name: "Carlos Prieto",
      company: "Distribuciones Levante",
      email: "c.prieto@dlevante.es",
      phone: "+34 963 402 118",
      segment: "pyme" as const,
    },
  ];

  const { data: insertedClients, error: clientsError } = await auth.supabase
    .from("crm_clients")
    .insert(demoClients)
    .select("id, company")
    .returns<Array<{ id: string; company: string }>>();

  if (clientsError || !insertedClients || insertedClients.length === 0) {
    return {
      ok: false,
      error:
        clientsError?.message ?? "No se pudieron crear los clientes demo.",
    };
  }

  const [c1, c2, c3, c4] = insertedClients;

  const demoTasks = [
    {
      user_id: auth.userId,
      client_id: c1?.id ?? null,
      title: "Despliegue portal de pedidos B2B",
      description:
        "Configuración de catálogo mayorista, roles por delegación y formación al equipo operativo.",
      status: "en_progreso" as const,
      priority: "alta" as const,
      amount_eur: 4850,
      due_date: isoDaysFromNow(5),
    },
    {
      user_id: auth.userId,
      client_id: c2?.id ?? null,
      title: "Renovación licencia anual y soporte SLA",
      description:
        "Revisión de contrato 2026 y activación de alertas automáticas de citas.",
      status: "pendiente" as const,
      priority: "alta" as const,
      amount_eur: 2400,
      due_date: isoDaysFromNow(3),
    },
    {
      user_id: auth.userId,
      client_id: c3?.id ?? null,
      title: "Integración webhook de facturación",
      description:
        "Conectar eventos de alta de cliente con el ERP contable y validar pruebas end-to-end.",
      status: "en_progreso" as const,
      priority: "media" as const,
      amount_eur: 1650,
      due_date: isoDaysFromNow(9),
    },
    {
      user_id: auth.userId,
      client_id: c4?.id ?? null,
      title: "Importación de histórico de clientes",
      description:
        "Limpieza de duplicados CSV y migración de 1.200 contactos comerciales.",
      status: "completado" as const,
      priority: "media" as const,
      amount_eur: 980,
      due_date: isoDaysFromNow(-2),
    },
    {
      user_id: auth.userId,
      client_id: c1?.id ?? null,
      title: "Auditoría trimestral de rendimiento",
      description:
        "Entrega de informe de KPIs operativos y propuesta de automatización Q4.",
      status: "completado" as const,
      priority: "baja" as const,
      amount_eur: 1200,
      due_date: isoDaysFromNow(-6),
    },
    {
      user_id: auth.userId,
      client_id: c3?.id ?? null,
      title: "Propuesta ampliación a 25 usuarios",
      description:
        "Preparar presupuesto escalonado y calendario de onboarding para nuevo equipo comercial.",
      status: "pendiente" as const,
      priority: "media" as const,
      amount_eur: 3100,
      due_date: isoDaysFromNow(12),
    },
  ];

  const { error: tasksError } = await auth.supabase
    .from("crm_tasks")
    .insert(demoTasks);

  if (tasksError) {
    return {
      ok: false,
      error: tasksError.message || "No se pudieron crear las tareas demo.",
    };
  }

  revalidatePath("/");
  return {
    ok: true,
    data: {
      clientsCreated: insertedClients.length,
      tasksCreated: demoTasks.length,
    },
    message: "Datos demo cargados correctamente (4 clientes y 6 tareas).",
  };
}
