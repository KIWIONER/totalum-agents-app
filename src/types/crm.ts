export type ClientSegment = "enterprise" | "pyme" | "startup";

export type TaskStatus = "pendiente" | "en_progreso" | "completado";

export type TaskPriority = "baja" | "media" | "alta";

export interface Client {
  id: string;
  user_id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  segment: ClientSegment;
  created_at: string;
}

export interface ClientInput {
  name: string;
  company: string;
  email: string;
  phone: string;
  segment: ClientSegment;
}

export interface TaskItem {
  id: string;
  user_id: string;
  client_id: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  amount_eur: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskInput {
  title: string;
  description: string;
  client_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  amount_eur: number;
  due_date: string | null;
}

export type TaskWithClient = TaskItem & {
  client?: Pick<Client, "id" | "name" | "company"> | null;
};

export interface CrmKpis {
  totalClients: number;
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  totalAmountEur: number;
  completionRate: number;
}

export interface TaskFilters {
  query: string;
  status: TaskStatus | "all";
  priority: TaskPriority | "all";
}

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: Record<string, string> };
