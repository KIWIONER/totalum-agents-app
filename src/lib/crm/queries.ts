import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Client, TaskItem, TaskWithClient } from "@/types/crm";

export interface AuthenticatedUserSummary {
  id: string;
  email: string;
}

export interface CrmDashboardData {
  configured: boolean;
  user: AuthenticatedUserSummary | null;
  clients: Client[];
  tasks: TaskWithClient[];
  error: string | null;
}

interface RawTaskRow extends Omit<TaskItem, "amount_eur"> {
  amount_eur: number | string;
}

export async function getCrmDashboardData(): Promise<CrmDashboardData> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      user: null,
      clients: [],
      tasks: [],
      error: null,
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        configured: true,
        user: null,
        clients: [],
        tasks: [],
        error: null,
      };
    }

    const [clientsRes, tasksRes] = await Promise.all([
      supabase
        .from("crm_clients")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .returns<Client[]>(),
      supabase
        .from("crm_tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .returns<RawTaskRow[]>(),
    ]);

    if (clientsRes.error || tasksRes.error) {
      return {
        configured: true,
        user: {
          id: user.id,
          email: user.email ?? "usuario@totalum.local",
        },
        clients: [],
        tasks: [],
        error:
          clientsRes.error?.message ??
          tasksRes.error?.message ??
          "No se pudieron cargar los datos del CRM.",
      };
    }

    const clients = clientsRes.data ?? [];
    const clientLookup = new Map<
      string,
      Pick<Client, "id" | "name" | "company">
    >(
      clients.map((client) => [
        client.id,
        {
          id: client.id,
          name: client.name,
          company: client.company,
        },
      ])
    );

    const tasks: TaskWithClient[] = (tasksRes.data ?? []).map((row) => {
      const numericAmount = Number(row.amount_eur);
      return {
        ...row,
        amount_eur: Number.isFinite(numericAmount) ? numericAmount : 0,
        client: row.client_id ? (clientLookup.get(row.client_id) ?? null) : null,
      };
    });

    return {
      configured: true,
      user: {
        id: user.id,
        email: user.email ?? "usuario@totalum.local",
      },
      clients,
      tasks,
      error: null,
    };
  } catch (error: unknown) {
    const detail =
      error instanceof Error
        ? error.message
        : "Error inesperado al consultar Supabase.";
    return {
      configured: true,
      user: null,
      clients: [],
      tasks: [],
      error: detail,
    };
  }
}
