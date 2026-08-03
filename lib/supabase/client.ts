import { createBrowserClient } from "@supabase/ssr";
let client: ReturnType<typeof createBrowserClient> | undefined;
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Falta configurar Supabase. Consulta el README.");
  client ??= createBrowserClient(url, key);
  return client;
}
export async function ensureAnonymousSession() {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;
  const { data: signedIn, error } = await supabase.auth.signInAnonymously();
  if (error || !signedIn.session) throw error ?? new Error("No se pudo crear la sesión anónima");
  return signedIn.session;
}
