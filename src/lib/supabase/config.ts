export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

export interface DemoCredentials {
  email: string;
  password: string;
}

export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseEnv();

  if (!url || !anonKey) {
    return false;
  }

  return url.startsWith("https://") || url.startsWith("http://");
}

export function getDemoCredentials(): DemoCredentials | null {
  const email = process.env.NEXT_PUBLIC_DEMO_EMAIL?.trim() ?? "";
  const password = process.env.NEXT_PUBLIC_DEMO_PASSWORD?.trim() ?? "";

  if (!email || !password) {
    return null;
  }

  return { email, password };
}
