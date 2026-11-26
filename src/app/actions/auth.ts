"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getDemoCredentials,
  isSupabaseConfigured,
} from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AuthActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type SignUpActionResult =
  | { ok: true; requiresConfirmation: boolean }
  | { ok: false; error: string };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Correo electrónico o contraseña incorrectos.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Debes confirmar tu correo electrónico antes de iniciar sesión.";
  }
  if (normalized.includes("user already registered")) {
    return "Ya existe una cuenta registrada con este correo electrónico.";
  }
  if (normalized.includes("password should be at least")) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  if (normalized.includes("rate limit")) {
    return "Has realizado demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
  }

  return message || "No se pudo completar la operación de autenticación.";
}

export async function signInAction(input: {
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error:
        "Supabase no está configurado. Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const email = typeof input.email === "string" ? input.email.trim() : "";
  const password = typeof input.password === "string" ? input.password : "";

  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, error: "Introduce un correo electrónico válido." };
  }

  if (password.length < 1) {
    return { ok: false, error: "Introduce tu contraseña." };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { ok: false, error: mapAuthError(error.message) };
    }

    revalidatePath("/");
    return { ok: true };
  } catch (error: unknown) {
    const detail =
      error instanceof Error ? error.message : "Error inesperado al iniciar sesión.";
    return { ok: false, error: detail };
  }
}

export async function signInDemoAction(): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error:
        "Supabase no está configurado en este entorno. Añade las variables de entorno para acceder.",
    };
  }

  const demo = getDemoCredentials();
  if (!demo) {
    return {
      ok: false,
      error:
        "El acceso demo no está configurado (define NEXT_PUBLIC_DEMO_EMAIL y NEXT_PUBLIC_DEMO_PASSWORD).",
    };
  }

  return signInAction(demo);
}

export async function signUpAction(input: {
  email: string;
  password: string;
}): Promise<SignUpActionResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error:
        "Supabase no está configurado. Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const email = typeof input.email === "string" ? input.email.trim() : "";
  const password = typeof input.password === "string" ? input.password : "";

  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, error: "Introduce un correo electrónico válido." };
  }

  if (password.length < 6) {
    return {
      ok: false,
      error: "La contraseña debe tener al menos 6 caracteres.",
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { ok: false, error: mapAuthError(error.message) };
    }

    revalidatePath("/");
    return {
      ok: true,
      requiresConfirmation: !data.session,
    };
  } catch (error: unknown) {
    const detail =
      error instanceof Error ? error.message : "Error inesperado al crear la cuenta.";
    return { ok: false, error: detail };
  }
}

export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.auth.signOut();
    } catch (error: unknown) {
      console.error("[auth] Error al cerrar sesión:", error);
    }
  }

  revalidatePath("/");
  redirect("/login");
}
