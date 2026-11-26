import { describe, expect, it } from "vitest";
import {
  CLIENT_SEGMENT_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_ORDER,
  calculateCrmKpis,
  canTransitionStatus,
  filterTasks,
  formatCurrencyEur,
  getNextTaskStatus,
  validateClientInput,
  validateTaskInput,
} from "./domain";
import type { Client, TaskWithClient } from "@/types/crm";

describe("CRM Domain — constants", () => {
  it("exposes ordered task statuses and Spanish labels", () => {
    expect(TASK_STATUS_ORDER).toEqual(["pendiente", "en_progreso", "completado"]);
    expect(TASK_STATUS_LABELS.en_progreso).toBe("En progreso");
    expect(TASK_PRIORITY_LABELS.alta).toBe("Alta");
    expect(CLIENT_SEGMENT_LABELS.enterprise).toBe("Enterprise");
  });
});

describe("validateClientInput", () => {
  it("accepts valid client data and trims whitespace", () => {
    const result = validateClientInput({
      name: "  Ana Torres  ",
      company: "  Iberia Logística  ",
      email: "  ana@iberia-logistica.es ",
      phone: " +34 600 111 222 ",
      segment: "enterprise",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
        name: "Ana Torres",
        company: "Iberia Logística",
        email: "ana@iberia-logistica.es",
        phone: "+34 600 111 222",
        segment: "enterprise",
      });
    }
  });

  it("allows empty optional fields and defaults segment to pyme", () => {
    const result = validateClientInput({
      name: "Luis Pérez",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.segment).toBe("pyme");
      expect(result.data.email).toBe("");
      expect(result.data.company).toBe("");
    }
  });

  it("rejects short name, invalid email, and unknown segment", () => {
    const result = validateClientInput({
      name: " A ",
      email: "no-es-un-email",
      segment: "corporativo",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toBeDefined();
      expect(result.errors.email).toBeDefined();
      expect(result.errors.segment).toBeDefined();
    }
  });
});

describe("validateTaskInput", () => {
  it("accepts valid task input, trims fields, and rounds amount to 2 decimals", () => {
    const result = validateTaskInput({
      title: "  Renovación anual SaaS  ",
      description: "  Enviar propuesta firmada  ",
      client_id: "  client-123  ",
      status: "en_progreso",
      priority: "alta",
      amount_eur: 1450.567,
      due_date: "2026-12-15",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
        title: "Renovación anual SaaS",
        description: "Enviar propuesta firmada",
        client_id: "client-123",
        status: "en_progreso",
        priority: "alta",
        amount_eur: 1450.57,
        due_date: "2026-12-15",
      });
    }
  });

  it("handles defaults and empty nullable fields cleanly", () => {
    const result = validateTaskInput({
      title: "Llamada de seguimiento",
      client_id: "",
      due_date: null,
      amount_eur: "",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe("pendiente");
      expect(result.data.priority).toBe("media");
      expect(result.data.amount_eur).toBe(0);
      expect(result.data.due_date).toBeNull();
      expect(result.data.client_id).toBeNull();
    }
  });

  it("rejects invalid title, status, priority, negative amount, and impossible dates", () => {
    const result = validateTaskInput({
      title: "X",
      status: "cancelado",
      priority: "urgente",
      amount_eur: -50,
      due_date: "2026-02-30",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.title).toBeDefined();
      expect(result.errors.status).toBeDefined();
      expect(result.errors.priority).toBeDefined();
      expect(result.errors.amount_eur).toBeDefined();
      expect(result.errors.due_date).toBeDefined();
    }
  });
});

describe("calculateCrmKpis", () => {
  it("computes counts, rounded amount, and completion rate", () => {
    const clients: Pick<Client, "id">[] = [{ id: "c1" }, { id: "c2" }];
    const tasks = [
      { status: "pendiente" as const, amount_eur: 100.1 },
      { status: "en_progreso" as const, amount_eur: 250.25 },
      { status: "completado" as const, amount_eur: 499.65 },
    ];

    const kpis = calculateCrmKpis(clients, tasks);

    expect(kpis).toEqual({
      totalClients: 2,
      totalTasks: 3,
      pendingTasks: 1,
      inProgressTasks: 1,
      completedTasks: 1,
      totalAmountEur: 850,
      completionRate: 33,
    });
  });

  it("returns zero completion rate when there are no tasks", () => {
    const kpis = calculateCrmKpis([], []);
    expect(kpis).toEqual({
      totalClients: 0,
      totalTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      completedTasks: 0,
      totalAmountEur: 0,
      completionRate: 0,
    });
  });
});

describe("filterTasks", () => {
  const sampleTasks: TaskWithClient[] = [
    {
      id: "t1",
      user_id: "u1",
      client_id: "c1",
      title: "Onboarding plataforma",
      description: "Configurar usuarios iniciales",
      status: "pendiente",
      priority: "alta",
      amount_eur: 1200,
      due_date: "2026-12-01",
      created_at: "2026-11-20T10:00:00Z",
      updated_at: "2026-11-20T10:00:00Z",
      client: { id: "c1", name: "Marta Ruiz", company: "Norte Salud" },
    },
    {
      id: "t2",
      user_id: "u1",
      client_id: "c2",
      title: "Migración de datos",
      description: "Importar histórico de facturación",
      status: "en_progreso",
      priority: "media",
      amount_eur: 3500,
      due_date: null,
      created_at: "2026-11-21T10:00:00Z",
      updated_at: "2026-11-21T10:00:00Z",
      client: { id: "c2", name: "Carlos Vega", company: "Solaris Tech" },
    },
    {
      id: "t3",
      user_id: "u1",
      client_id: null,
      title: "Auditoría trimestral",
      description: "Revisión interna de SLA",
      status: "completado",
      priority: "baja",
      amount_eur: 500,
      due_date: null,
      created_at: "2026-11-22T10:00:00Z",
      updated_at: "2026-11-22T10:00:00Z",
      client: null,
    },
  ];

  it("filters by status and priority", () => {
    const filtered = filterTasks(sampleTasks, {
      query: "",
      status: "en_progreso",
      priority: "media",
    });

    expect(filtered.map((t) => t.id)).toEqual(["t2"]);
  });

  it("filters by query across title, description, client name, and company", () => {
    expect(
      filterTasks(sampleTasks, {
        query: "norte salud",
        status: "all",
        priority: "all",
      }).map((t) => t.id)
    ).toEqual(["t1"]);

    expect(
      filterTasks(sampleTasks, {
        query: "facturación",
        status: "all",
        priority: "all",
      }).map((t) => t.id)
    ).toEqual(["t2"]);

    expect(
      filterTasks(sampleTasks, {
        query: "marta",
        status: "all",
        priority: "all",
      }).map((t) => t.id)
    ).toEqual(["t1"]);
  });
});

describe("getNextTaskStatus & canTransitionStatus", () => {
  it("cycles pendiente -> en_progreso -> completado -> pendiente", () => {
    expect(getNextTaskStatus("pendiente")).toBe("en_progreso");
    expect(getNextTaskStatus("en_progreso")).toBe("completado");
    expect(getNextTaskStatus("completado")).toBe("pendiente");
  });

  it("validates transitions between distinct statuses", () => {
    expect(canTransitionStatus("pendiente", "en_progreso")).toBe(true);
    expect(canTransitionStatus("en_progreso", "completado")).toBe(true);
    expect(canTransitionStatus("pendiente", "pendiente")).toBe(false);
  });
});

describe("formatCurrencyEur", () => {
  it("formats numbers in es-ES EUR currency", () => {
    const formatted = formatCurrencyEur(1250.5);
    expect(formatted).toContain("1250,50");
    expect(formatted).toContain("€");
  });

  it("handles non-finite numbers safely as 0 EUR", () => {
    const formatted = formatCurrencyEur(Number.NaN);
    expect(formatted).toContain("0,00");
    expect(formatted).toContain("€");
  });
});
