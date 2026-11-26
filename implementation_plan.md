# Implementation Plan — Totalum Flow (Mini-CRM Operativo con 3 Agentes)

Objetivo: Construir y publicar en producción (Vercel + Supabase, plan gratuito) un **Mini-CRM Operativo** en Next.js App Router + TypeScript + Tailwind CSS trabajado íntegramente mediante el flujo real de **3 agentes en Claude Code** (`Orquestador` en `CLAUDE.md` → `develop` en `.claude/agents/develop.md` ↔ `testing` en `.claude/agents/testing.md`).

---

## 1. Arquitectura del Proyecto y Agentes

- **Orquestador (`CLAUDE.md`)**: divide el trabajo en hitos, delega implementación a `develop` y exige auditoría/veredicto a `testing` en bucle cerrado hasta obtener `PASS`.
- **Develop (`.claude/agents/develop.md`)**: implementa código modular, tipado estricto, integración `@supabase/ssr`, validaciones y tests en Vitest.
- **Testing (`.claude/agents/testing.md`)**: audita las 6 **DIRECTRICES** (`D1` seguridad/secretos, `D2` `tsc --noEmit`, `D3` `npm run lint`, `D4` `npm test`, `D5` `npm run build`, `D6` funcionalidad y UX) y devuelve lista exacta de fallos a `develop` hasta pasar al 100%.

---

## 2. Esquema de Datos en Supabase (`supabase/schema.sql`)

Dos tablas principales vinculadas al usuario autenticado (`auth.uid()`) con Row Level Security (RLS) activado:

1. **`crm_clients`**:
   - `id` (`uuid`, PK)
   - `user_id` (`uuid`, FK `auth.users(id)`, default `auth.uid()`)
   - `name` (`text`, obligatorio), `company` (`text`), `email` (`text`), `phone` (`text`), `segment` (`text`: `enterprise | pyme | startup`)
   - `created_at` (`timestamptz`)
2. **`crm_tasks`** (pedidos / tareas operativas asociadas a cliente):
   - `id` (`uuid`, PK)
   - `user_id` (`uuid`, FK `auth.users(id)`, default `auth.uid()`)
   - `client_id` (`uuid`, FK `crm_clients(id)` `ON DELETE SET NULL`)
   - `title` (`text`, obligatorio), `description` (`text`)
   - `status` (`text`: `'pendiente' | 'en_progreso' | 'completado'`)
   - `priority` (`text`: `'baja' | 'media' | 'alta'`)
   - `amount_eur` (`numeric(12,2)`, default `0`)
   - `due_date` (`date`), `created_at` (`timestamptz`), `updated_at` (`timestamptz`)

---

## 3. Hitos de Ejecución (Ciclo `Orquestador → Develop ↔ Testing`)

### Hito 0 — Requisitos externos previos (Usuario)
1. Crear proyecto gratuito en **Supabase** (`https://supabase.com`).
2. Ejecutar `supabase/schema.sql` en el *SQL Editor* de Supabase.
3. En **Authentication → Users** crear usuario demo (`demo@totalum-flow.app` / `DemoTotalum2026!`) con *Auto Confirm User* activado (o permitir signup desde `/login`).
4. Crear `.env.local` (ignorado por Git) copiando `.env.example` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Hito 1 — Base técnica, Supabase SSR y Dominio (`Develop` ↔ `Testing`)
- Crear `src/types/crm.ts` (tipos de clientes, tareas, KPIs y filtros).
- Crear `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts` y `src/middleware.ts` para refresco de sesión `@supabase/ssr`.
- Crear `src/lib/crm/domain.ts` (validadores puros de formularios, cálculo de KPIs: total, activas, completadas, importe total, filtros combinados y transiciones de estado).
- Configurar `vitest.config.ts`, script `"test": "vitest run"` en `package.json` y `src/lib/crm/domain.test.ts`.
- **Gate `Testing`**: `D1` (sin secretos), `D2` (`tsc`), `D4` (`npm test` verde).

### Hito 2 — Autenticación + CRUD Server Actions (`Develop` ↔ `Testing`)
- Página `/login` limpia con:
  - Login / Registro estándar con Supabase Auth.
  - Botón **"Entrar con usuario demo"** visible (autocompleta/inicia sesión con las credenciales demo documentadas) para facilitar la prueba en incógnito.
- Server Actions o Route Handlers (`/api/clients`, `/api/tasks`, `/api/seed-demo`):
  - Alta, edición y borrado de clientes.
  - Alta, cambio rápido de estado (`pendiente` → `en_progreso` → `completado`), edición y borrado de tareas/pedidos.
  - Botón/acción opcional de **"Cargar datos de ejemplo"** si la cuenta demo entra vacía por primera vez.
- **Gate `Testing`**: validación en servidor, manejo explícito de errores Supabase, `tsc`, `lint`, `test`.

### Hito 3 — Dashboard Operativo Mini-CRM (`Develop` ↔ `Testing`)
- Página `/` (o `/dashboard` con redirección limpia si no hay sesión, y landing resumida + acceso directo a `/login`):
  - Barra superior con usuario activo, botón de cerrar sesión y estado de conexión.
  - **KPIs en vivo**: Clientes activos, Tareas pendientes, En progreso, Completadas y Valor total (€).
  - **Filtros**: búsqueda por texto + filtro por estado + filtro por prioridad.
  - **Vista operativa** (Kanban por columnas de estado o tabla/tarjetas con cambio de estado en 1 clic) + panel/modal de **Clientes**.
  - Estados vacíos informativos y diseño 100% responsive.
- **Gate `Testing`**: auditoría completa `D1..D6` + `npm run build` exitoso.

### Hito 4 — Publicación GitHub + Vercel + Verificación en Incógnito
1. Subir repo a **GitHub** (público o compartido), verificando que `CLAUDE.md`, `.claude/agents/develop.md`, `.claude/agents/testing.md`, `strategy.md`, `implementation_plan.md` y `.env.example` estén incluidos (y `.env.local` NO esté).
2. Importar el repo en **Vercel** (plan gratuito) y añadir las env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_DEMO_EMAIL`, `NEXT_PUBLIC_DEMO_PASSWORD`.
3. En Vercel: ir a **`Settings > Deployment Protection`** y **desactivar `Vercel Authentication`**, usando siempre el dominio **Production**.
4. **Prueba obligatoria**: abrir la URL de producción en una **ventana de incógnito**, entrar con el usuario demo, crear un cliente y una tarea, cambiarla de estado y recargar la página para confirmar persistencia real en Supabase.

---

## 4. Primer Prompt sugerido para arrancar en Claude Code (`claude`)

Abre PowerShell en `C:\Users\balsa\Desktop\totalum-agents-app`, lanza `claude` y pega:

```text
Lee CLAUDE.md, implementation_plan.md y strategy.md. Actúa estrictamente como Orquestador: no programes tú directamente. Ejecuta el Hito 1 delegando la implementación al subagente `develop` y, al terminar, audita todo con el subagente `testing` repitiendo el bucle hasta obtener VEREDICTO PASS.
```
