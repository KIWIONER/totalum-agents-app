# Totalum Flow — Mini-CRM Operativo

**Totalum Flow** es un Mini-CRM operativo construido con **Next.js 16 (App Router)**, **React 19**, **TypeScript estricto**, **Tailwind CSS v4** y **Supabase (Auth SSR + Postgres con Row Level Security)**.

## Funcionalidades principales

- **Autenticación Supabase SSR (`/login`)**:
  - Inicio de sesión y registro con correo y contraseña.
  - Botón **"Entrar con usuario demo"** en 1 clic (configurado mediante variables de entorno, sin contraseñas hardcodeadas en `src/`).
  - Refresco automático de sesión en `src/proxy.ts` (convención oficial de Next.js 16) y aislamiento por usuario mediante políticas RLS en Postgres.
- **Gestión de clientes (`crm_clients`)**:
  - Alta, edición y eliminación de clientes con nombre, empresa, correo, teléfono y segmento (`Enterprise`, `PYME`, `Startup`).
  - Contador de tareas/pedidos vinculados por cliente.
- **Tablero operativo de tareas y pedidos (`crm_tasks`)**:
  - Tablero Kanban de 3 columnas (`Pendiente`, `En progreso`, `Completado`).
  - **Cambio de estado en 1 clic** (`Pendiente → En progreso → Completado → Pendiente`) con persistencia inmediata en Supabase.
  - Alta, edición y eliminación con validación de dominio en servidor.
  - Filtros combinados en vivo: búsqueda por texto (título, descripción, cliente o empresa), estado y prioridad (`Alta`, `Media`, `Baja`).
- **KPIs en vivo**:
  - Clientes activos, tareas pendientes, en progreso, completadas (con porcentaje de cierre) e importe total acumulado en EUR.
- **Carga de datos de ejemplo en 1 clic**:
  - Cuando el espacio está vacío, permite poblar 4 clientes y 6 tareas/pedidos realistas de forma idempotente (sin duplicar si ya existen registros).

## Arquitectura de 3 agentes

El repositorio sigue un flujo de desarrollo coordinado con separación estricta de responsabilidades:

| Agente | Archivo | Responsabilidad |
| --- | --- | --- |
| **Director / Coordinador** | `CLAUDE.md` | Planificación de hitos, delegación controlada y seguimiento del estado (`strategy.md`, `implementation_plan.md`). |
| **Develop** | `.claude/agents/develop.md` | Implementación Full Stack (Next.js App Router, Server Actions, Supabase SSR, dominio tipado y UI responsive). |
| **Testing** | `.claude/agents/testing.md` | Auditoría independiente por hito bajo directrices de seguridad, tipos, linting, pruebas unitarias y build (`PASS` / `FAIL`). |

## Configuración de Supabase (plan gratuito)

1. Crea un proyecto gratuito en [Supabase](https://supabase.com/).
2. Abre **SQL Editor** en tu proyecto y ejecuta íntegramente el script [`supabase/schema.sql`](./supabase/schema.sql) para crear las tablas `public.crm_clients` y `public.crm_tasks`, índices y políticas RLS.
3. Crea el usuario demo en **Authentication → Users → Add user → Create new user**:
   - **Email**: `demo@totalum-flow.app`
   - **Password**: `DemoTotalum2026!`
   - Marca **Auto Confirm User** para permitir el acceso inmediato sin verificación por correo.
4. Copia `.env.example` a `.env.local` en la raíz del proyecto y completa tus claves de **Settings → API**:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_public_key
NEXT_PUBLIC_DEMO_EMAIL=demo@totalum-flow.app
NEXT_PUBLIC_DEMO_PASSWORD=DemoTotalum2026!
```

> **Seguridad**: `.env.local` está ignorado por Git. Nunca subas claves privadas ni `SUPABASE_SERVICE_ROLE_KEY` al repositorio.

## Comandos de desarrollo y verificación

```bash
# Instalar dependencias
npm install

# Arrancar servidor de desarrollo en http://localhost:3000
npm run dev

# Comprobación estricta de tipos TypeScript
npm run typecheck

# Linting con ESLint
npm run lint

# Tests unitarios de dominio con Vitest
npm test

# Build de producción (Next.js 16 Turbopack)
npm run build
```

## Despliegue público en Vercel (plan gratuito)

1. Importa el repositorio en [Vercel](https://vercel.com/) y selecciona el framework **Next.js**.
2. En **Settings → Environment Variables**, añade las 4 variables para **Production** (y Preview si lo deseas):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_DEMO_EMAIL` (`demo@totalum-flow.app`)
   - `NEXT_PUBLIC_DEMO_PASSWORD` (`DemoTotalum2026!`)
3. En **Settings → Deployment Protection**, desactiva **Vercel Authentication** para que cualquier evaluador pueda abrir la URL pública sin iniciar sesión en Vercel.
4. Despliega y comparte siempre el dominio de **Production** (`https://<tu-proyecto>.vercel.app`).

### Checklist de verificación en ventana de incógnito

- [ ] Abrir la URL de producción en modo incógnito redirige a `/login` sin pedir cuenta de Vercel.
- [ ] Hacer clic en **"Entrar con usuario demo"** inicia sesión y abre el dashboard principal `/`.
- [ ] El indicador **"Conectado a Supabase"** aparece en la cabecera.
- [ ] Si el espacio está vacío, **"Cargar datos de ejemplo"** crea los 4 clientes y 6 tareas/pedidos.
- [ ] Crear, editar, cambiar estado en 1 clic y eliminar una tarea/cliente persisten tras recargar (`F5`).
- [ ] Los filtros por texto, estado y prioridad actualizan las columnas del tablero en tiempo real.
- [ ] **"Cerrar sesión"** vuelve a `/login` y bloquea el acceso directo a `/`.
