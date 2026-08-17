"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EstadoLogin = { error: string } | null;

export async function login(
  _prev: EstadoLogin,
  formData: FormData
): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Faltan datos." };
  }

  // Primera barrera: allowlist. Si el email no es el tuyo, ni siquiera
  // consultamos a Supabase.
  const emailPermitido = process.env.ALLOWED_EMAIL?.toLowerCase();
  if (emailPermitido && email.toLowerCase() !== emailPermitido) {
    return { error: "Credenciales inválidas." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Mensaje genérico a propósito: no revelamos si el email existe.
    return { error: "Credenciales inválidas." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
