import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv, isSupabaseConfigured } from "./config";

export async function createServerSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase no está configurado. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch (error: unknown) {
          // En Server Components las cookies son de solo lectura; el refresco de sesión
          // se completa en src/proxy.ts o en Route Handlers / Server Actions.
          if (process.env.NODE_ENV === "development") {
            const detail =
              error instanceof Error ? error.message : "Contexto read-only";
            console.debug(
              `[supabase/server] No se pudieron actualizar cookies en Server Component: ${detail}`
            );
          }
        }
      },
    },
  });
}
