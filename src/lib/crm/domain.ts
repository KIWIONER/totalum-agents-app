import type {
  Client,
  ClientInput,
  ClientSegment,
  CrmKpis,
  TaskFilters,
  TaskInput,
  TaskItem,
  TaskPriority,
  TaskStatus,
  TaskWithClient,
  ValidationResult,
} from "@/types/crm";

export const TASK_STATUS_ORDER: readonly TaskStatus[] = [
  "pendiente",
  "en_progreso",
  "completado",
] as const;

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completado: "Completado",
};

export const TASK_PRIORITY_ORDER: readonly TaskPriority[] = [
  "baja",
  "media",
  "alta",
] as const;

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};

export const CLIENT_SEGMENT_ORDER: readonly ClientSegment[] = [
  "enterprise",
  "pyme",
  "startup",
] as const;

export const CLIENT_SEGMENT_LABELS: Record<ClientSegment, string> = {
  enterprise: "Enterprise",
  pyme: "PYME",
  startup: "Startup",
};

const VALID_SEGMENTS = new Set<string>(CLIENT_SEGMENT_ORDER);
const VALID_STATUSES = new Set<string>(TASK_STATUS_ORDER);
const VALID_PRIORITIES = new Set<string>(TASK_PRIORITY_ORDER);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidIsoDate(dateStr: string): boolean {
  const match = ISO_DATE_REGEX.exec(dateStr);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function validateClientInput(
  input: Partial<Record<keyof ClientInput, unknown>>
): ValidationResult<ClientInput> {
  const errors: Record<string, string> = {};

  const name = asTrimmedString(input.name);
  const company = asTrimmedString(input.company);
  const email = asTrimmedString(input.email);
  const phone = asTrimmedString(input.phone);

  if (name.length < 2) {
    errors.name = "El nombre del cliente debe tener al menos 2 caracteres.";
  }

  if (email.length > 0 && !EMAIL_REGEX.test(email)) {
    errors.email = "Introduce un correo electrónico válido.";
  }

  const rawSegment = input.segment === undefined ? "pyme" : input.segment;
  if (typeof rawSegment !== "string" || !VALID_SEGMENTS.has(rawSegment)) {
    errors.segment = "El segmento seleccionado no es válido.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      name,
      company,
      email,
      phone,
      segment: rawSegment as ClientSegment,
    },
  };
}

export function validateTaskInput(
  input: Partial<Record<keyof TaskInput, unknown>>
): ValidationResult<TaskInput> {
  const errors: Record<string, string> = {};

  const title = asTrimmedString(input.title);
  const description = asTrimmedString(input.description);

  if (title.length < 2) {
    errors.title = "El título de la tarea debe tener al menos 2 caracteres.";
  }

  const rawStatus = input.status === undefined ? "pendiente" : input.status;
  if (typeof rawStatus !== "string" || !VALID_STATUSES.has(rawStatus)) {
    errors.status = "El estado seleccionado no es válido.";
  }

  const rawPriority = input.priority === undefined ? "media" : input.priority;
  if (typeof rawPriority !== "string" || !VALID_PRIORITIES.has(rawPriority)) {
    errors.priority = "La prioridad seleccionada no es válida.";
  }

  let amountEur = 0;
  if (
    input.amount_eur === undefined ||
    input.amount_eur === null ||
    input.amount_eur === ""
  ) {
    amountEur = 0;
  } else {
    const parsedAmount =
      typeof input.amount_eur === "number"
        ? input.amount_eur
        : typeof input.amount_eur === "string"
          ? Number(input.amount_eur.trim())
          : Number.NaN;

    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      errors.amount_eur = "El importe debe ser un número mayor o igual a 0.";
    } else {
      amountEur = Math.round(parsedAmount * 100) / 100;
    }
  }

  let dueDate: string | null = null;
  if (
    input.due_date === undefined ||
    input.due_date === null ||
    input.due_date === ""
  ) {
    dueDate = null;
  } else if (typeof input.due_date === "string") {
    const trimmedDate = input.due_date.trim();
    if (trimmedDate.length === 0) {
      dueDate = null;
    } else if (!isValidIsoDate(trimmedDate)) {
      errors.due_date = "La fecha límite debe tener un formato válido (YYYY-MM-DD).";
    } else {
      dueDate = trimmedDate;
    }
  } else {
    errors.due_date = "La fecha límite debe tener un formato válido (YYYY-MM-DD).";
  }

  let clientId: string | null = null;
  if (
    input.client_id === undefined ||
    input.client_id === null ||
    input.client_id === ""
  ) {
    clientId = null;
  } else if (typeof input.client_id === "string") {
    const trimmedClientId = input.client_id.trim();
    if (trimmedClientId.length === 0) {
      clientId = null;
    } else {
      clientId = trimmedClientId;
    }
  } else {
    errors.client_id = "El cliente asociado no es válido.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      title,
      description,
      client_id: clientId,
      status: rawStatus as TaskStatus,
      priority: rawPriority as TaskPriority,
      amount_eur: amountEur,
      due_date: dueDate,
    },
  };
}

export function calculateCrmKpis(
  clients: readonly Pick<Client, "id">[],
  tasks: readonly Pick<TaskItem, "status" | "amount_eur">[]
): CrmKpis {
  let pendingTasks = 0;
  let inProgressTasks = 0;
  let completedTasks = 0;
  let totalAmount = 0;

  for (const task of tasks) {
    if (task.status === "pendiente") {
      pendingTasks += 1;
    } else if (task.status === "en_progreso") {
      inProgressTasks += 1;
    } else if (task.status === "completado") {
      completedTasks += 1;
    }

    const numericAmount = Number(task.amount_eur);
    if (Number.isFinite(numericAmount) && numericAmount > 0) {
      totalAmount += numericAmount;
    }
  }

  const totalTasks = tasks.length;
  const completionRate =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return {
    totalClients: clients.length,
    totalTasks,
    pendingTasks,
    inProgressTasks,
    completedTasks,
    totalAmountEur: Math.round(totalAmount * 100) / 100,
    completionRate,
  };
}

export function filterTasks(
  tasks: readonly TaskWithClient[],
  filters: TaskFilters
): TaskWithClient[] {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return tasks.filter((task) => {
    if (filters.status !== "all" && task.status !== filters.status) {
      return false;
    }

    if (filters.priority !== "all" && task.priority !== filters.priority) {
      return false;
    }

    if (normalizedQuery.length > 0) {
      const searchableParts = [
        task.title,
        task.description,
        task.client?.name ?? "",
        task.client?.company ?? "",
      ];

      const matchesQuery = searchableParts.some((part) =>
        part.toLowerCase().includes(normalizedQuery)
      );

      if (!matchesQuery) {
        return false;
      }
    }

    return true;
  });
}

export function getNextTaskStatus(status: TaskStatus): TaskStatus {
  const currentIndex = TASK_STATUS_ORDER.indexOf(status);
  if (currentIndex === -1) {
    return "pendiente";
  }

  return TASK_STATUS_ORDER[(currentIndex + 1) % TASK_STATUS_ORDER.length];
}

export function canTransitionStatus(from: TaskStatus, to: TaskStatus): boolean {
  return VALID_STATUSES.has(from) && VALID_STATUSES.has(to) && from !== to;
}

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

export function formatCurrencyEur(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return currencyFormatter.format(safeAmount);
}
